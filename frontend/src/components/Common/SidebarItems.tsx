import { Flex, Icon, Text, useColorModeValue } from "@chakra-ui/react"
import { useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { FiBriefcase, FiTool, FiSettings, FiUsers, FiLogIn } from "react-icons/fi"

import type { UserPublic } from "../../client"

const items = [
  { icon: FiBriefcase, title: "Items", path: "/" },
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

  finalItems = currentUser?.is_superuser
    ? [...finalItems, { icon: FiUsers, title: "Admin", path: "/admin" }, { icon: FiTool, title: "Create Item", path: "/edititems" }]
    : finalItems;

  finalItems = currentUser?.is_active
    ? [...finalItems, { icon: FiSettings, title: "User Settings", path: "/settings" }, { icon: FiLogIn, title: "Logout", path: "/logout" }]
    : [...finalItems, { icon: FiLogIn, title: "Login", path: "/login" }];

  const listItems = finalItems.map(({ icon, title, path }) => (
    <Flex
      as={Link}
      to={path}
      p={2}
      key={title}
      activeProps={{
        style: {
          background: bgActive,
          borderRadius: "12px",
        },
      }}
      color={textColor}
      onClick={onClose}
      align="center" // Ensures icon and text are aligned
    >
      <Icon as={icon} alignSelf="center" />
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
