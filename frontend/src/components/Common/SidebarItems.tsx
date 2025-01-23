import { Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { FiTool, FiSettings, FiUsers, FiEye } from "react-icons/fi"
import UrbanBarnacleLogo from "../../theme/assets/urban_barnacle.png";

import type { UserPublic } from "../../client"

const items = [
  { icon: UrbanBarnacleLogo, title: "Urban Barnacle", path: "/" },
  { icon: FiEye, title: "Gallery", path: "/gallery" },
]

interface SidebarItemsProps {
  onClose?: () => void
}

const SidebarItems = ({ onClose }: SidebarItemsProps) => {
  const queryClient = useQueryClient();
  const textColor = useColorModeValue("ui.main", "ui.light");
  const bgActive = useColorModeValue("#E2E8F0", "#4A5568");
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  let finalItems = items

  finalItems = currentUser
    ? [...finalItems, { icon: FiUsers, title: "Users", path: "/users" }, { icon: FiTool, title: "Create Item", path: "/createitem" }]
    : finalItems;

  if (currentUser?.is_active)
    finalItems = [...finalItems, { icon: FiSettings, title: "My Settings", path: "/settings" }]

  const listItems = finalItems.map(({ icon, title, path }) => (
    <Flex
      as={Link}
      to={path}
      p={2}
      key={title}
      activeProps={{
        style: {
          background: bgActive,
        },
      }}
      color={textColor}
      onClick={onClose}
      align="center" // Ensures icon and text are aligned
    >
    {typeof icon === "string" ? (
      <img src={icon} alt={title} style={{ width: "48px", height: "48px" }} />
    ) : (
      <Icon as={icon} alignSelf="center" />
    )}
      <Text ml={2}>{title}</Text>
    </Flex>
  ));

  return (
    <Flex flexDir="row" gap={4} w="100%" alignContent="center">
      {listItems}
    </Flex>
  );
};

export default SidebarItems
