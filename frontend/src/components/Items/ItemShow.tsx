import React from "react"
import { Box, Button } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { ItemPublic } from "../../client"

// Import your SDK function
import { imagesGetFile } from "../../client/sdk.gen"

const ItemShow = ({ item }: { item: ItemPublic }) => {
  const navigate = useNavigate()
  const [imageUrl, setImageUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    // If the item has an "images" string, split it and take the first one.
    if (!item.images) return
    const firstFileName = item.images.split(",")[0]?.trim()
    if (!firstFileName) return

    // Call the SDK to get the image URL
    imagesGetFile({ fileName: firstFileName })
      .then((res) => {
        setImageUrl((res as { url: string }).url)
      })
      .catch((err) => {
        console.error("Error getting image file:", err)
      })
  }, [item.images])

  const handleEditItem = (item: ItemPublic) => {
    navigate({
      to: "/item",
      search: { id: item.id },
    })
  }

  return (
    <Box className="grid-item" key={item.id}>
      <h3>{item.title}</h3>

      {/* Render the first image if we have a url */}
      {imageUrl && (
        <Box mt={2}>
          <img
            src={imageUrl}
            alt={item.title}
            style={{ maxWidth: "200px", maxHeight: "200px" }}
          />
        </Box>
      )}

      <p>{item.description}</p>

      <Button mt={2} onClick={() => handleEditItem(item)} colorScheme="blue">
        View Item
      </Button>
    </Box>
  )
}

export default ItemShow
