import {
  Box,
  Button,
  Flex,
  Image,
  Input,
  ListItem,
  Text,
  UnorderedList,
  useToast,
} from "@chakra-ui/react"
import React from "react"
import deleteIcon from "../../theme/assets/icons/delete.svg"
import uploadIcon from "../../theme/assets/icons/upload.svg"

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ImagePublic } from "../../client"

// Import SDK methods
import { imagesDeleteFile, imagesUploadFile } from "../../client/sdk.gen"

type UploadedFile = {
  id: string
  name: string
  url: string
}

type ImageType = "logo" | "portfolio" | "item"
type EntityType = "item" | "producer"

interface ImagesUploaderProps {
  // Entity IDs - at least one must be provided
  itemId?: string
  producerId?: string
  
  // Image type configuration
  imageType: ImageType
  entityType: EntityType
  
  // Existing images for initialization
  existingImages?: UploadedFile[]
  
  // Callback when images change
  onImagesChange: (urls: string[] | string) => void
  
  // Optional configuration
  maxFiles?: number
  label?: string
}

export interface ImagesUploaderRef {
  reset: () => void
}

const ImagesUploader = React.forwardRef<ImagesUploaderRef, ImagesUploaderProps>(
  (
    {
      itemId,
      producerId,
      imageType,
      entityType,
      existingImages = [],
      onImagesChange,
      maxFiles = imageType === "logo" ? 1 : 10,
      label,
    },
    ref,
  ) => {
    const toast = useToast()

    // Determine entity ID
    const entityId = entityType === "item" ? itemId : producerId

    // Initialize from existingImages
    const [files, setFiles] = React.useState<UploadedFile[]>(existingImages || [])

    // Update files when existingImages changes (for async loading)
    React.useEffect(() => {
      if (existingImages && existingImages.length > 0) {
        setFiles(existingImages)
      }
    }, [existingImages])

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: {
          distance: 5,
        },
      }),
    )

    // Expose reset function to parent component
    React.useImperativeHandle(ref, () => ({
      reset: () => {
        setFiles([])
        // Call with appropriate format based on entity type
        if (entityType === "item") {
          onImagesChange("")
        } else {
          onImagesChange([])
        }
      },
    }))

    // Handle reordering via drag and drop
    const handleDragEnd = (event: DragEndEvent) => {
      if (imageType === "logo") return // No reordering for single logo

      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = files.findIndex((file) => file.id === active.id)
      const newIndex = files.findIndex((file) => file.id === over.id)

      setFiles((prevFiles) => {
        const newArray = arrayMove(prevFiles, oldIndex, newIndex)
        const urls = newArray.map((f) => f.url)
        
        // Return format based on entity type
        if (entityType === "item") {
          onImagesChange(urls.join(","))
        } else {
          onImagesChange(urls)
        }
        return newArray
      })
    }

    // Handle uploading files
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return

      // Check max files limit
      if (files.length + e.target.files.length > maxFiles) {
        toast({
          title: "Too Many Files",
          description: `You can only upload ${maxFiles} ${imageType === "logo" ? "logo" : "image(s)"}.`,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
        e.target.value = ""
        return
      }

      // Check for invalid files before uploading
      for (const file of e.target.files) {
        const fileName = file.name
        if (
          fileName.includes(",") ||
          fileName.includes("/") ||
          fileName.length > 100
        ) {
          toast({
            title: "Invalid File Name",
            description: `The file name "${fileName}" is not allowed.
              Please ensure it does not contain commas, slashes,
              or exceed 100 characters.`,
            status: "error",
            duration: 6000,
            isClosable: true,
          })
          e.target.value = ""
          return
        }
      }

      // If all files are valid, proceed with uploading
      const updatedFiles: UploadedFile[] = []

      for (const file of e.target.files) {
        try {
          // If entityId is provided, upload immediately
          if (entityId) {
            if (entityType === "producer") {
              // Use fetch for producer images (keeps existing API)
              const formData = new FormData()
              formData.append("file", file)
              
              const response = await fetch(
                `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/${entityId}?entity_type=producer&image_type=${imageType}`,
                {
                  method: "POST",
                  body: formData,
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                  },
                },
              )

              if (!response.ok) {
                throw new Error("Failed to upload image")
              }

              const data = await response.json()
              updatedFiles.push({
                id: data.id,
                name: data.name,
                url: data.path,
              })
            } else {
              // Use SDK for item images
              const response = (await imagesUploadFile({
                formData: { file },
                id: entityId,
              })) as ImagePublic

              // Extract URL from response path
              const imageUrl = response.path.startsWith("http")
                ? response.path
                : `${window.location.origin}/api/v1/images/download/${response.id}`

              updatedFiles.push({
                id: response.id,
                name: response.name,
                url: imageUrl,
              })
            }
          } else {
            // For create mode, store locally for preview
            const localUrl = URL.createObjectURL(file)
            updatedFiles.push({
              id: `temp-${Date.now()}-${Math.random()}`,
              name: file.name.split(".")[0],
              url: localUrl,
            })
          }
        } catch (error) {
          console.error("Error uploading image:", error)
          toast({
            title: "Upload Error",
            description: (error as Error).message,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      }

      if (updatedFiles.length > 0) {
        setFiles((prev) => {
          // For logo, replace existing; for other types, append
          const merged = imageType === "logo" ? updatedFiles : [...prev, ...updatedFiles]
          const urls = merged.map((f) => f.url)
          
          // Return format based on entity type
          if (entityType === "item") {
            onImagesChange(urls.join(","))
          } else {
            onImagesChange(urls)
          }
          return merged
        })
      }

      // Reset input
      e.target.value = ""
    }

    // Handle deleting a file
    const handleDeleteFile = async (fileToDelete: UploadedFile) => {
      try {
        // Only delete from server if not a temp/existing file and we have an entityId
        if (
          entityId &&
          !fileToDelete.id.startsWith("existing-") &&
          !fileToDelete.id.startsWith("temp-")
        ) {
          if (entityType === "item") {
            // Use SDK for item images
            await imagesDeleteFile({ imageId: fileToDelete.id })
          } else {
            // Use fetch for producer images
            await fetch(
              `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/${fileToDelete.id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                },
              },
            )
          }
        }

        // Clean up object URL if it's a temp file
        if (fileToDelete.id.startsWith("temp-")) {
          URL.revokeObjectURL(fileToDelete.url)
        }

        // Update local state after successful deletion
        setFiles((prev) => {
          const filtered = prev.filter((f) => f.id !== fileToDelete.id)
          const urls = filtered.map((f) => f.url)
          
          // Return format based on entity type
          if (entityType === "item") {
            onImagesChange(urls.join(","))
          } else {
            onImagesChange(urls)
          }
          return filtered
        })
      } catch (error) {
        console.error("Error deleting image:", error)
        toast({
          title: "Delete Error",
          description: (error as Error).message,
          status: "error",
          duration: 5000,
          isClosable: true,
        })
      }
    }

    return (
      <Box>
        <Input
          id={`${imageType}-upload-${entityType}`}
          type="file"
          accept="image/*"
          multiple={imageType !== "logo"}
          onChange={handleFileUpload}
          display="none"
        />
        <Button
          variant="primary"
          onClick={() => document.getElementById(`${imageType}-upload-${entityType}`)?.click()}
          isDisabled={imageType === "logo" && files.length >= 1}
          leftIcon={
            <Image
              src={uploadIcon}
              alt="upload"
              boxSize="20px"
              sx={{
                transition: "filter 0.2s ease",
                _groupHover: {
                  filter:
                    "brightness(0) saturate(100%) invert(47%) sepia(96%) saturate(1787%) hue-rotate(197deg) brightness(98%) contrast(101%)",
                },
              }}
            />
          }
          role="group"
        >
          {files.length > 0
            ? imageType === "logo"
              ? "Change Logo"
              : `Add More Images (${files.length} selected)`
            : label || "Upload Image"}
        </Button>

        {files.length > 0 && (
          <Box mt={4}>
            <Text fontSize="sm" color="green.500" mb={2}>
              ✓ {files.length} {imageType === "logo" ? "logo" : "image"}
              {files.length > 1 ? "s" : ""} uploaded
              {imageType !== "logo" && " (Drag to Reorder)"}:
            </Text>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={files.map((file) => file.id)}
                strategy={verticalListSortingStrategy}
              >
                <UnorderedList styleType="disc">
                  {files.map((file) => (
                    <SortableItem
                      key={file.id}
                      file={file}
                      onDelete={handleDeleteFile}
                      showPreview={imageType === "logo"}
                    />
                  ))}
                </UnorderedList>
              </SortableContext>
            </DndContext>
          </Box>
        )}
      </Box>
    )
  },
)

export default ImagesUploader

interface SortableItemProps {
  file: UploadedFile
  onDelete: (file: UploadedFile) => void
  showPreview?: boolean
}

const SortableItem: React.FC<SortableItemProps> = ({
  file,
  onDelete,
  showPreview = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    border: "1px solid #ccc",
    padding: "8px",
    marginBottom: "4px",
    backgroundColor: "white",
    borderRadius: "4px",
    cursor: "grab",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  }

  return (
    <ListItem ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Flex align="center" gap={2}>
        {showPreview && (
          <Image
            src={file.url}
            alt={file.name}
            boxSize="50px"
            objectFit="cover"
            borderRadius="md"
          />
        )}
        <Box>{file.name}</Box>
      </Flex>
      <Flex
        ml={4}
        cursor="pointer"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(file)
        }}
        w="24px"
        h="24px"
      >
        <img
          src={deleteIcon}
          alt="delete"
          className="hover-icon"
          style={{
            width: "24px",
            height: "24px",
            display: "block",
            opacity: "0.6",
            transition: "all 0.2s ease",
            filter:
              "brightness(0) saturate(100%) invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = "1"
            e.currentTarget.style.transform = "scale(1.15)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = "0.6"
            e.currentTarget.style.transform = "scale(1)"
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
        />
      </Flex>
    </ListItem>
  )
}
