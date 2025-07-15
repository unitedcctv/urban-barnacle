import { Flex, Icon, Text, Skeleton, useColorModeValue } from "@chakra-ui/react";
import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FiTool, FiSettings, FiUsers, FiEye, FiDollarSign } from "react-icons/fi";


const SidebarItems = ({ onClose }: { onClose?: () => void }) => {

  interface SidebarItem {
    title: string;
    path: string;
    icon: string; // e.g., 'logo', 'FiEye'
  }

  const apiBase = import.meta.env.VITE_API_URL ?? "";

  async function fetchSidebar(): Promise<SidebarItem[]> {
        const token = localStorage.getItem("access_token")
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await fetch(`${apiBase}/api/v1/sidebar/`, {
      credentials: "include",
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error("Failed to load sidebar");
    return res.json();
  }

  const { data: items = [], isLoading } = useQuery<SidebarItem[]>({
    queryKey: ["sidebar"],
    queryFn: fetchSidebar,
  });
  
  // Lighter text color and hover color.
  const textColor = useColorModeValue("ui.dark", "ui.light");
  const bgHover = useColorModeValue("#EDF2F7", "#4A5568");
  const containerBg = useColorModeValue("#F9FAFB", "#343F4C");

  // map of icon names to components
  const iconMap: Record<string, ElementType | (() => JSX.Element)> = {
    FiEye,
    FiUsers,
    FiTool,
    FiSettings,
    FiDollarSign,
  };

  if (isLoading) {
    return <Skeleton w="full" h="40px" />;
  }

  if (!items) {
    return null;
  }

  const listItems = items.map(({ icon: iconName, title, path }: SidebarItem) => {
    const IconComp = iconMap[iconName] ?? FiEye;
    return (
      <Flex
        as={Link}
        to={path}
        p={2}
        key={title}
        _hover={{ bg: bgHover }}
        color={textColor}
        onClick={onClose}
        align="center"
      >
        {typeof IconComp === "function" ? (
          <IconComp />
        ) : (
          <Icon as={IconComp} alignSelf="center" />
        )}
        <Text ml={2} fontWeight="300">
          {title}
        </Text>
      </Flex>
    );
  });

  // Use a lighter background in both modes:
  return (
    <Flex
      flexDir="row"
      gap={4}
      w="100%"
      alignContent="center"
      bg={containerBg}
    >
      {listItems}
    </Flex>
  );
};

export default SidebarItems;
