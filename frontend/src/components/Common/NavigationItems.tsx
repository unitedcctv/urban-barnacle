import { Flex, Text, Skeleton, useColorModeValue, useDisclosure } from "@chakra-ui/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

// Import custom SVG icons
import galleryIcon from "../../theme/assets/icons/gallery.svg";
import communityIcon from "../../theme/assets/icons/community.svg";
import producersIcon from "../../theme/assets/icons/producers.svg";
import settingsIcon from "../../theme/assets/icons/settings.svg";
import suSettingsIcon from "../../theme/assets/icons/su_settings.svg";
import businessIcon from "../../theme/assets/icons/business.svg";
import addItemIcon from "../../theme/assets/icons/add_item.svg";
import producerEditIcon from "../../theme/assets/icons/producer_edit.svg";

// Import modals
import AddProducer from "../Producers/AddProducer";
import EditProducer from "../Producers/EditProducer";
import { producersReadMyProducer } from "../../client/sdk.gen";
import type { UserPublic } from "../../client/types.gen";

interface NavigationItemsProps {
  onClose?: () => void;
  onCount?: (n: number) => void;
}

const NavigationItems = ({ onClose, onCount }: NavigationItemsProps) => {

  interface NavigationItem {
    title: string;
    path: string;
    icon: string;
    action?: string | null; // 'modal' for modal actions, null/undefined for navigation
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
    add_item: addItemIcon,
    producer_edit: producerEditIcon,
  };

  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"]);
  const addProducerModal = useDisclosure();
  const editProducerModal = useDisclosure();
  
  // Fetch producer profile if user has producer permissions
  const isProducer = currentUser?.permissions === "producer" || currentUser?.permissions === "superuser";
  const { data: myProducer } = useQuery({
    queryKey: ["myProducer"],
    queryFn: () => producersReadMyProducer(),
    enabled: isProducer,
  });
  const hasProducerProfile = !!myProducer;

  if (isLoading) {
    return <Skeleton w="full" h="40px" />;
  }

  if (!items) {
    onCount?.(0);
    return null;
  }

  const listItems = items.map(({ icon: iconName, title, path, action }: NavigationItem) => {
    const iconSrc = iconMap[iconName] ?? galleryIcon;
    const isActive = location.pathname === path && !action;
    const isModalAction = action === "modal";
    
    const handleClick = (e: React.MouseEvent) => {
      if (isModalAction) {
        e.preventDefault();
        if (title.includes("Edit")) {
          editProducerModal.onOpen();
        } else if (title.includes("Create")) {
          addProducerModal.onOpen();
        }
      } else {
        onClose?.();
      }
    };
    
    const iconElement = (
      <img 
        src={iconSrc} 
        alt={title}
        className="hover-icon"
        style={{ 
          width: "24px", 
          height: "24px",
          filter: isActive ? "brightness(0) invert(1)" : "brightness(0) saturate(0%) invert(60%)",
          opacity: "0.6",
          transition: "all 0.2s ease",
          pointerEvents: "none"
        }}
      />
    );
    
    const textElement = (
      <Text ml={2} fontWeight={isActive ? "bold" : "300"}>
        {title}
      </Text>
    );
    
    const mouseHandlers = {
      onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
        if (isActive) return;
        const img = e.currentTarget.querySelector('img');
        if (img) {
          img.style.opacity = "1";
          img.style.transform = "scale(1.15)";
          img.style.filter = "brightness(0) saturate(100%) invert(58%) sepia(96%) saturate(1174%) hue-rotate(170deg) brightness(101%) contrast(101%)";
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
        if (isActive) return;
        const img = e.currentTarget.querySelector('img');
        if (img) {
          img.style.opacity = "0.6";
          img.style.transform = "scale(1)";
          img.style.filter = "brightness(0) saturate(0%) invert(60%)";
        }
      },
      onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
        if (isActive) return;
        const img = e.currentTarget.querySelector('img');
        if (img) img.style.transform = "scale(1.05)";
      },
      onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => {
        if (isActive) return;
        const img = e.currentTarget.querySelector('img');
        if (img) img.style.transform = "scale(1.15)";
      },
    };
    
    return isModalAction ? (
      <Flex
        as="button"
        px={4}
        py={0}
        key={title}
        bg="transparent"
        color={textColor}
        _hover={{ bg: bgHover }}
        onClick={handleClick}
        align="center"
        cursor="pointer"
        h="52px"
        {...mouseHandlers}
      >
        {iconElement}
        {textElement}
      </Flex>
    ) : (
      <Flex
        as={Link}
        to={path}
        px={4}
        py={0}
        key={title}
        bg={isActive ? activeBg : "transparent"}
        color={isActive ? activeText : textColor}
        _hover={isActive ? {} : { bg: bgHover }}
        onClick={handleClick}
        align="center"
        cursor={isActive ? "default" : "pointer"}
        pointerEvents={isActive ? "none" : "auto"}
        h="52px"
        {...mouseHandlers}
      >
        {iconElement}
        {textElement}
      </Flex>
    );
  });

  // Use a lighter background in both modes:
  return (
    <>
      <Flex
        flexDir="row"
        gap={4}
        w="100%"
        alignContent="center"
        bg={containerBg}
      >
        {listItems}
      </Flex>
      
      {/* Producer Modals */}
      <AddProducer isOpen={addProducerModal.isOpen} onClose={addProducerModal.onClose} />
      {hasProducerProfile && myProducer && (
        <EditProducer 
          producer={myProducer} 
          isOpen={editProducerModal.isOpen} 
          onClose={editProducerModal.onClose} 
        />
      )}
    </>
  );
};

export default NavigationItems;
