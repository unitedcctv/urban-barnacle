import { Flex, Text, Skeleton, useColorModeValue } from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

// Import custom SVG icons
import galleryIcon from "../../theme/assets/icons/gallery.svg";
import communityIcon from "../../theme/assets/icons/community.svg";
import producersIcon from "../../theme/assets/icons/producers.svg";
import settingsIcon from "../../theme/assets/icons/settings.svg";
import suSettingsIcon from "../../theme/assets/icons/su_settings.svg";
import businessIcon from "../../theme/assets/icons/business.svg";
import editIcon from "../../theme/assets/icons/edit.svg";

interface NavigationItemsProps {
  onClose?: () => void;
  onCount?: (n: number) => void;
}

const NavigationItems = ({ onClose, onCount }: NavigationItemsProps) => {

  interface NavigationItem {
    title: string;
    path: string;
    icon: string; // e.g., 'logo', 'FiEye'
  }

  const apiBase = import.meta.env.VITE_API_URL ?? "";
  const location = useLocation();

  async function fetchNavigation(): Promise<NavigationItem[]> {
        const token = localStorage.getItem("access_token")
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}

    const res = await fetch(`${apiBase}/api/v1/navigation/`, {
      credentials: "include",
      cache: "no-store",
      headers,
    });
    if (!res.ok) throw new Error("Failed to load navigation");
    return res.json();
  }

  const token = localStorage.getItem("access_token");
  const { data: items = [], isLoading } = useQuery<NavigationItem[]>({
    queryKey: ["navigation", token],
    queryFn: fetchNavigation,
  });
  
  // notify parent when item count changes
  useEffect(() => {
    onCount?.(items.length);
  }, [items.length, onCount]);

  // Lighter text color and hover color.
  const textColor = useColorModeValue("ui.dark", "ui.light");
  const bgHover = useColorModeValue("#EDF2F7", "#4A5568");
  const containerBg = useColorModeValue("#F9FAFB", "#343F4C");
  const activeBg = "ui.main"; // Use primary button color
  const activeText = "ui.light";

  // Map icon names to SVG file paths
  const iconMap: Record<string, string> = {
    gallery: galleryIcon,
    community: communityIcon,
    producers: producersIcon,
    settings: settingsIcon,
    su_settings: suSettingsIcon,
    business: businessIcon,
    edit: editIcon,
  };

  if (isLoading) {
    return <Skeleton w="full" h="40px" />;
  }

  if (!items) {
    onCount?.(0);
    return null;
  }

  const listItems = items.map(({ icon: iconName, title, path }: NavigationItem) => {
    const iconSrc = iconMap[iconName] ?? galleryIcon;
    const isActive = location.pathname === path;
    
    return (
      <Flex
        as={Link}
        to={path}
        px={4}
        py={0}
        key={title}
        bg={isActive ? activeBg : "transparent"}
        color={isActive ? activeText : textColor}
        _hover={isActive ? {} : { bg: bgHover }}
        onClick={onClose}
        align="center"
        cursor={isActive ? "default" : "pointer"}
        pointerEvents={isActive ? "none" : "auto"}
        h="52px"
      >
        <img 
          src={iconSrc} 
          alt={title}
          style={{ 
            width: "24px", 
            height: "24px",
            filter: isActive ? "brightness(0) invert(1)" : "none"
          }} 
        />
        <Text ml={2} fontWeight={isActive ? "bold" : "300"}>
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

export default NavigationItems;
