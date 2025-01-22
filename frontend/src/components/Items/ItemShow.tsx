import React from "react";
import { Box } from "@chakra-ui/react";
import { useNavigate } from "@tanstack/react-router";
import { ItemPublic } from "../../client";
import { images_url } from "../../utils";

const ItemShow = ({ item }: { item: ItemPublic }) => {
  const navigate = useNavigate();
  const [imageSrc, setImageSrc] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (item.images) {
      const firstFileName = item.images.split(",")[0]?.trim();
      if (firstFileName) {
        const src = images_url + firstFileName;
        setImageSrc(src);
      }
    }
  }, [item.images]);

  const handleEditItem = (item: ItemPublic) => {
    navigate({
      to: "/item",
      search: { id: item.id },
    });
  };

  return (
    <Box className="grid-item" key={item.id} onClick={() => handleEditItem(item)}>
      {imageSrc && (
          <img
            src={imageSrc}
            alt={item.title}
            style={{ maxWidth: "200px", maxHeight: "200px" }}
          />
      )}
    </Box>
  );
};

export default ItemShow;