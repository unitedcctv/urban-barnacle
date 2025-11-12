import { Box, Heading, Text } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import React from "react"
import type { ItemPublic } from "../../client"

const ItemCard = ({ item }: { item: ItemPublic }) => {
  const navigate = useNavigate()
  const [imageSrc, setImageSrc] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (item.image_urls && item.image_urls.length > 0) {
      const firstImageUrl = item.image_urls[0]
      setImageSrc(firstImageUrl)
    }
  }, [item.image_urls])

  const handleEditItem = (item: ItemPublic) => {
    navigate({
      to: "/item",
      search: { id: item.id },
    })
  }

  return (
    <Box
      className="grid-item"
      key={item.id}
      onClick={() => handleEditItem(item)}
    >
      <Box className="grid-item-image">
        {imageSrc && (
          <img
            src={imageSrc}
            alt={item.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        )}
      </Box>
      <Box className="grid-item-content">
        <Heading size="md" noOfLines={1}>
          {item.title}
        </Heading>
        <Text fontSize="sm" color="gray.600" noOfLines={2}>
          {item.description || "No description available"}
        </Text>
      </Box>
    </Box>
  )
}

export default ItemCard
