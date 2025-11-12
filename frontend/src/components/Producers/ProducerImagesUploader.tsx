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

type UploadedFile = {
  id: string
  name: string
  url: string
}

interface ProducerImagesUploaderProps {
  producerId?: string
  imageType: "logo" | "portfolio"
  existingImages?: string[]
  onImagesChange: (urls: string[]) => void
  maxFiles?: number
  label?: string
}

export interface ProducerImagesUploaderRef {
  reset: () => void
}

const ProducerImagesUploader = React.forwardRef<
  ProducerImagesUploaderRef,
  ProducerImagesUploaderProps
>(
  (
    {
      producerId,
      imageType,
      existingImages = [],
      onImagesChange,
      maxFiles = imageType === "logo" ? 1 : 10,
      label,
    },
    ref,
  ) => {
    const toast = useToast()

    // Initialize from existing images
    const [files, setFiles] = React.useState<UploadedFile[]>(
      existingImages.map((url, index) => ({
        id: `existing-${index}`,
        name: url.split("/").pop()?.split(".")[0] ?? "",
        url,
      })),
    )

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
        onImagesChange([])
      },
    }))

    // Handle reordering via drag and drop (only for portfolio)
    const handleDragEnd = (event: DragEndEvent) => {
      if (imageType === "logo") return // No reordering for single logo

      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = files.findIndex((file) => file.id === active.id)
      const newIndex = files.findIndex((file) => file.id === over.id)

      setFiles((prevFiles) => {
        const newArray = arrayMove(prevFiles, oldIndex, newIndex)
        onImagesChange(newArray.map((f) => f.url))
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
          // If producerId is provided, upload immediately
          if (producerId) {
            const formData = new FormData()
            formData.append("file", file)
            
            const response = await fetch(
              `${import.meta.env.VITE_API_URL ?? ""}/api/v1/images/${producerId}?entity_type=producer&image_type=${imageType}`,
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
            // For create mode, just store locally for preview
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
          // For logo, replace existing; for portfolio, append
          const merged = imageType === "logo" ? updatedFiles : [...prev, ...updatedFiles]
          onImagesChange(merged.map((f) => f.url))
          return merged
        })
      }

      // Reset input
      e.target.value = ""
    }

    // Handle deleting a file
    const handleDeleteFile = async (fileToDelete: UploadedFile) => {
      try {
        // Only delete from server if it's not a temp/existing file and we have a producerId
        if (
          producerId &&
          !fileToDelete.id.startsWith("existing-") &&
          !fileToDelete.id.startsWith("temp-")
        ) {
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

        // Clean up object URL if it's a temp file
        if (fileToDelete.id.startsWith("temp-")) {
          URL.revokeObjectURL(fileToDelete.url)
        }

        // Update local state after successful deletion
        setFiles((prev) => {
          const filtered = prev.filter((f) => f.id !== fileToDelete.id)
          onImagesChange(filtered.map((f) => f.url))
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
          id={`${imageType}-upload`}
          type="file"
          accept="image/*"
          multiple={imageType === "portfolio"}
          onChange={handleFileUpload}
          display="none"
        />
        <Button
          variant="primary"
          onClick={() => document.getElementById(`${imageType}-upload`)?.click()}
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
              {files.length > 1 ? "s" : ""} selected
              {imageType === "portfolio" && " (Drag to Reorder)"}:
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

export default ProducerImagesUploader

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
