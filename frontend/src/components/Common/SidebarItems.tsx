import { Flex, Icon, Text, useColorMode, useColorModeValue } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FiTool, FiSettings, FiUsers, FiEye } from "react-icons/fi";
import UrbanBarnacleLight from "../../theme/assets/ub_dark.png";
import UrbanBarnacleDark from "../../theme/assets/ub_light.png";

import type { UserPublic } from "../../client";

const SidebarItems = ({ onClose }: { onClose?: () => void }) => {
  const queryClient = useQueryClient();
  const { colorMode } = useColorMode();

  // Lighter text color and hover color.
  const textColor = useColorModeValue("ui.dark", "ui.light");
  const bgHover = useColorModeValue("#EDF2F7", "#4A5568");

  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);

  // Conditionally pick the logo image.
  const finalLogo = colorMode === "dark" ? UrbanBarnacleDark : UrbanBarnacleLight;

  let items = [
    { icon: finalLogo, title: "Urban Barnacle", path: "/" },
    { icon: FiEye, title: "Gallery", path: "/gallery" },
  ];

  items = currentUser
    ? [...items, { icon: FiUsers, title: "Users", path: "/users" }, { icon: FiTool, title: "Create Item", path: "/createitem" }]
    : items;

  if (currentUser?.is_active) {
    items = [...items, { icon: FiSettings, title: "My Settings", path: "/settings" }];
  }

  const listItems = items.map(({ icon, title, path }) => (
    <Flex
      as={Link}
      to={path}
      p={2}
      key={title}
      _hover={{
        bg: bgHover,
      }}
      color={textColor}
      onClick={onClose}
      align="center"
    >
      {typeof icon === "string" ? (
        <img src={icon} alt={title} style={{ width: "48px", height: "48px" }} />
      ) : (
        <Icon as={icon} alignSelf="center" />
      )}
      <Text ml={2} fontWeight="600">
        {title}
      </Text>
    </Flex>
  ));

  // Use a lighter background in both modes:
  return (
    <Flex
      flexDir="row"
      gap={4}
      w="100%"
      alignContent="center"
      bg={useColorModeValue("#F9FAFB", "#343F4C")}
    >
      {listItems}
    </Flex>
  );
};

export default SidebarItems;
