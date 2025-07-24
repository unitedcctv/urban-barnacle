import React from "react"
import {
  Input,
  Box,
  Text,
  UnorderedList,
  ListItem,
  useToast,
  Button,
} from "@chakra-ui/react"

import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ItemPublic } from "../../client"

// Import your SDK methods here
import { imagesUploadFile, imagesDeleteFile } from "../../client/sdk.gen"

type UploadedFile = {
  name: string
  url: string
}

interface ImagesUploaderProps {
  onImagesChange: (urls: string) => void
  _item: ItemPublic
}

export interface ImagesUploaderRef {
  reset: () => void
}

const ImagesUploader = React.forwardRef<ImagesUploaderRef, ImagesUploaderProps>((
  { onImagesChange, _item },
  ref
) => {
  const toast = useToast()

  // Initialize from existing images (comma-separated)
  const images = _item.images ? _item.images.split(",") : []
  const [files, setFiles] = React.useState<UploadedFile[]>(
    images.map((url) => ({
      name: url.split("/").pop()?.split(".")[0] ?? "",
      url,
    }))
  )

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
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

    const oldIndex = files.findIndex((file) => file.url === active.id)
    const newIndex = files.findIndex((file) => file.url === over.id)

    setFiles((prevFiles) => {
      const newArray = arrayMove(prevFiles, oldIndex, newIndex)
      onImagesChange(newArray.map((f) => f.url).join(","))
      return newArray
    })
  }

  // Handle uploading files
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

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
        // Reset the file input so user must re-choose.
        e.target.value = ""
        return
      }
    }

    // If all files are valid, proceed with uploading
    const updatedFiles: UploadedFile[] = []

    for (const file of e.target.files) {
      try {
        const response = await imagesUploadFile({ formData: { file }, itemId: _item.id, userId: _item.owner_id }) as { url: string }
        const uploadedUrl = response.url
        const fileNameWithSuffix = uploadedUrl.split("/").pop()
        const fileNameWithoutSuffix = fileNameWithSuffix?.split(".")[0] ?? ""

        updatedFiles.push({
          name: fileNameWithoutSuffix,
          url: fileNameWithSuffix ?? "",
        })
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
        const urlsString = merged.map((f) => f.url).join(",")
        onImagesChange(urlsString)
        return merged
      })
    }
  }

  // Handle deleting a file
  const handleDeleteFile = async (fileToDelete: UploadedFile) => {
    try {
      // Call the SDK function to delete the file on the server
      await imagesDeleteFile({ fileName: fileToDelete.url, itemId: _item.id, userId: _item.owner_id })

      // Update local state after successful deletion
      setFiles((prev) => {
        const filtered = prev.filter((f) => f.url !== fileToDelete.url)
        onImagesChange(filtered.map((f) => f.url).join(","))
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
        id="images"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        display="none"
      />
      <Button
        variant="primary"
        onClick={() => document.getElementById('images')?.click()}
        width="100%"
        justifyContent="flex-start"
        textAlign="left"
        fontWeight="normal"
        color={files.length > 0 ? "white" : "gray.500"}
        bg={files.length > 0 ? undefined : "gray.50"}
        _hover={files.length > 0 ? undefined : { bg: "gray.100" }}
      >
        {files.length > 0 ? `${files.length} image${files.length > 1 ? 's' : ''} selected` : "Select images"}
      </Button>

      {files.length > 0 && (
        <Box mt={4}>
          <Text fontSize="sm" color="green.500" mb={2}>
            ✓ {files.length} image{files.length > 1 ? 's' : ''} uploaded (Drag to Reorder):
          </Text>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={files.map((file) => file.url)}
              strategy={verticalListSortingStrategy}
            >
              <UnorderedList styleType="disc">
                {files.map((file) => (
                  <SortableItem
                    key={file.url}
                    file={file}
                    onDelete={handleDeleteFile}
                  />
                ))}
              </UnorderedList>
            </SortableContext>
          </DndContext>
        </Box>
      )}
    </Box>
  )
})

export default ImagesUploader

interface SortableItemProps {
  file: UploadedFile
  onDelete: (file: UploadedFile) => void
}

const SortableItem: React.FC<SortableItemProps> = ({ file, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: file.url })

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
      <Box>{file.name}</Box>
      <Button
        ml={4}
        variant="outline"
        colorScheme="red"
        size="xs"
        onClick={() => onDelete(file)}
      >
        Delete
      </Button>
    </ListItem>
  )
}
