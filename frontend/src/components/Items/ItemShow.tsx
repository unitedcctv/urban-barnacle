import { Box, Button } from "@chakra-ui/react"
import { useNavigate } from "@tanstack/react-router"
import { ItemPublic } from "../../client"

const ItemShow = ({ item }: { item: ItemPublic }) => {
  const navigate = useNavigate()

  const handleEditItem = (item: ItemPublic) => {
    navigate({
        to: "/edititems",
        search: { id: item.id },
      })
  }

  return (
    <Box className="grid-item" key={item.id}>
        {/* <img src={item.image} alt={item.title} /> */}
        <h3>{item.title}</h3>
        <p>{item.description}</p>
        <span className="likes">{item.id}</span>

        {/* Button to navigate to AddItem with item data */}
        <Button
        mt={2}
        onClick={() => handleEditItem(item)}
        colorScheme="blue"
        >
        Edit
        </Button>
    </Box>

  )
}

export default ItemShow