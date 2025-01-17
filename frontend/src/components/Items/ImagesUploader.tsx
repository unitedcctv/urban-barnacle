import React from "react"
import {
  FormControl,
  FormLabel,
  Input,
  Box,
  Text,
  UnorderedList,
  ListItem,
  useToast,
} from "@chakra-ui/react"

// -------------- dnd-kit imports --------------
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

type UploadedFile = {
  name: string
  url: string
}

interface ImagesUploaderProps {
  onImagesChange: (urls: string) => void;
  item_id: string;
  owner_id: string;
}

const ImagesUploader: React.FC<ImagesUploaderProps> = ({ onImagesChange }) => {
  const toast = useToast()
  const [files, setFiles] = React.useState<UploadedFile[]>([])

  // For simplicity, define apiUrl here; you can also pass it as a prop or import from environment
  const apiUrl = import.meta.env.VITE_API_URL

  // -- DRAG AND DROP LOGIC --

  // 1) Create "sensors" to detect pointer and other inputs
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // drag starts after pointer moves 5px
      },
    })
    // you could add KeyboardSensor, etc. here
  )

  // 2) The handleDragEnd function: reorders local files and calls the parent
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    // If dropped outside or in the same position, do nothing
    if (!over || active.id === over.id) return

    const oldIndex = files.findIndex((file) => file.url === active.id)
    const newIndex = files.findIndex((file) => file.url === over.id)

    setFiles((prevFiles) => {
      // Use @dnd-kit/sortable's arrayMove
      const newArray = arrayMove(prevFiles, oldIndex, newIndex)
      // Update the parent with the new comma-separated URLs
      onImagesChange(newArray.map((f) => f.url).join(","))
      return newArray
    })
  }

  // -- FILE UPLOAD LOGIC --
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return

    const updatedFiles: UploadedFile[] = []
    for (const file of e.target.files) {
      const formData = new FormData()
      formData.append("file", file)

      try {
        const response = await fetch(`${apiUrl}/api/v1/images`, {
          method: "POST",
          body: formData,
        })
        if (!response.ok) {
          throw new Error("Failed to upload image")
        }
        const data = await response.json()
        const uploadedUrl = data.url

        // Extract the file name (without suffix if desired)
        const fileNameWithSuffix = uploadedUrl.split("/").pop()
        const fileNameWithoutSuffix =
          fileNameWithSuffix?.split(".")[0] ?? ""

        updatedFiles.push({
          name: fileNameWithoutSuffix,
          url: uploadedUrl,
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

    setFiles((prev) => {
      const merged = [...prev, ...updatedFiles]
      // Build new comma-separated string
      const urlsString = merged.map((f) => f.url).join(",")
      // Notify parent
      onImagesChange(urlsString)
      return merged
    })
  }

  return (
    <FormControl mt={4}>
      <FormLabel htmlFor="images">Images</FormLabel>
      <Input
        id="images"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
      />

      {files.length > 0 && (
        <Box mt={4}>
          <Text fontWeight="bold" mb={2}>
            Uploaded Files (Drag to Reorder):
          </Text>

          {/* 3) Wrap the list in DndContext + SortableContext */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            {/* SortableContext needs an array of item IDs (here using file.url) */}
            <SortableContext
              items={files.map((file) => file.url)}
              strategy={verticalListSortingStrategy}
            >
              <UnorderedList styleType="disc">
                {files.map((file) => (
                  // 4) Wrap each item with our own sortable wrapper
                  <SortableItem key={file.url} file={file} />
                ))}
              </UnorderedList>
            </SortableContext>
          </DndContext>
        </Box>
      )}
    </FormControl>
  )
}

export default ImagesUploader

// Helper: "SortableItem" is a wrapper around each <ListItem>
interface SortableItemProps {
  file: UploadedFile
}

// This component uses the "useSortable" hook from dnd-kit
const SortableItem: React.FC<SortableItemProps> = ({ file }) => {
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
  }

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {file.name}
    </ListItem>
  )
}


