import {
  Box,
  Button,
  Flex,
  IconButton,
  Image,
  Input,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react"
import { DeleteIcon } from "@chakra-ui/icons"
import React from "react"
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

// Import SDK methods
import { imagesDeleteFile, imagesUploadFile } from "../../client/sdk.gen"

type UploadedFile = {
  id: string
  name: string
  url: string
}

interface ImagesUploaderProps {
  itemId?: string

  // Existing images for initialization
  existingImages?: UploadedFile[]

  // Callback when images change (comma-separated URLs)
  onImagesChange: (urls: string) => void

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
      existingImages = [],
      onImagesChange,
      maxFiles = 10,
      label,
    },
    ref,
  ) => {
    const toast = useToast()

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
        onImagesChange("")
      },
    }))

    // Handle reordering via drag and drop
    const handleDragEnd = (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = files.findIndex((file) => file.id === active.id)
      const newIndex = files.findIndex((file) => file.id === over.id)

      setFiles((prevFiles) => {
        const newArray = arrayMove(prevFiles, oldIndex, newIndex)
        const urls = newArray.map((f) => f.url)
        onImagesChange(urls.join(","))
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
          description: `You can only upload ${maxFiles} image(s).`,
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
          // If itemId is provided, upload immediately
          if (itemId) {
            const response = await imagesUploadFile({
              body: { file },
              path: { id: itemId },
              throwOnError: true,
            })

            // Extract URL from response path
            const imageUrl = response.path.startsWith("http")
              ? response.path
              : `${window.location.origin}/api/v1/images/download/${response.id}`

            updatedFiles.push({
              id: response.id,
              name: response.name,
              url: imageUrl,
            })
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
          const merged = [...prev, ...updatedFiles]
          const urls = merged.map((f) => f.url)
          onImagesChange(urls.join(","))
          return merged
        })
      }

      // Reset input
      e.target.value = ""
    }

    // Handle deleting a file
    const handleDeleteFile = async (fileToDelete: UploadedFile) => {
      try {
        // Only delete from server if not a temp/existing file and we have an itemId
        if (
          itemId &&
          !fileToDelete.id.startsWith("existing-") &&
          !fileToDelete.id.startsWith("temp-")
        ) {
          await imagesDeleteFile({
            path: { image_id: fileToDelete.id },
            throwOnError: true,
          })
        }

        // Clean up object URL if it's a temp file
        if (fileToDelete.id.startsWith("temp-")) {
          URL.revokeObjectURL(fileToDelete.url)
        }

        // Update local state after successful deletion
        setFiles((prev) => {
          const filtered = prev.filter((f) => f.id !== fileToDelete.id)
          const urls = filtered.map((f) => f.url)
          onImagesChange(urls.join(","))
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
          id="item-image-upload"
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          display="none"
        />
        <Button
          variant="primary"
          onClick={() => document.getElementById("item-image-upload")?.click()}
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
            ? `Add More Images (${files.length} selected)`
            : label || "Upload Image"}
        </Button>

        {files.length > 0 && (
          <Box mt={4}>
            <Text fontSize="sm" color="green.500" mb={2}>
              ✓ {files.length} image
              {files.length > 1 ? "s" : ""} uploaded
              {" (Drag to Reorder)"}
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
                <VStack align="stretch" spacing={2}>
                  {files.map((file) => (
                    <SortableItem
                      key={file.id}
                      file={file}
                      onDelete={handleDeleteFile}
                    />
                  ))}
                </VStack>
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
}

const SortableItem: React.FC<SortableItemProps> = ({
  file,
  onDelete,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: file.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Flex
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      align="center"
      justify="space-between"
      border="1px solid"
      borderColor="gray.200"
      borderRadius="md"
      p={2}
      cursor="grab"
      _active={{ cursor: "grabbing" }}
    >
      <Image
        src={file.url}
        alt={file.name}
        maxH="80px"
        borderRadius="md"
      />
      <IconButton
        aria-label="Remove image"
        icon={<DeleteIcon />}
        size="lg"
        fontSize="2xl"
        colorScheme="red"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(file)
        }}
      />
    </Flex>
  )
}
