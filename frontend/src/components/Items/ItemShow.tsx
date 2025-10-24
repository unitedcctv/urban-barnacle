import { Box } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import React from "react"
import type { ItemPublic } from "../../client"

const ItemShow = ({ item }: { item: ItemPublic }) => {
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
      {imageSrc && (
        <img
          src={imageSrc}
          alt={item.title}
          style={{ maxWidth: "200px", maxHeight: "200px" }}
        />
      )}
    </Box>
  )
}

export default ItemShow
