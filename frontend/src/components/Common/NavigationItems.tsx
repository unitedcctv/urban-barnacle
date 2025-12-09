import { Flex, Skeleton, Text, useColorModeValue, useMediaQuery } from "@chakra-ui/react"
import { useQuery } from "@tanstack/react-query"
import { Link, useLocation } from "@tanstack/react-router"
import { useEffect, useMemo } from "react"

import addItemIcon from "../../theme/assets/icons/add_item.svg"
import businessIcon from "../../theme/assets/icons/business.svg"
import communityIcon from "../../theme/assets/icons/community.svg"
// Import custom SVG icons
import galleryIcon from "../../theme/assets/icons/gallery.svg"
import producerEditIcon from "../../theme/assets/icons/producer_edit.svg"
import producersIcon from "../../theme/assets/icons/producers.svg"
import settingsIcon from "../../theme/assets/icons/settings.svg"
import suSettingsIcon from "../../theme/assets/icons/su_settings.svg"

interface NavigationItemsProps {
  onClose?: () => void
  onCount?: (n: number) => void
  direction?: "row" | "column"
}

const NavigationItems = ({ onClose, onCount, direction = "row" }: NavigationItemsProps) => {
  interface NavigationItem {
    title: string
    path: string
    icon: string
    action?: string | null
  }

  const apiBase = import.meta.env.VITE_API_URL ?? ""
  const location = useLocation()

  async function fetchNavigation(): Promise<NavigationItem[]> {
    const token = localStorage.getItem("access_token")
    const headers: Record<string, string> = token
      ? { Authorization: `Bearer ${token}` }
      : {}

    const res = await fetch(`${apiBase}/api/v1/navigation/`, {
      credentials: "include",
      cache: "no-store",
      headers,
    })
    if (!res.ok) throw new Error("Failed to load navigation")
    return res.json()
  }

  const token = localStorage.getItem("access_token")
  const { data: items = [], isLoading } = useQuery<NavigationItem[]>({
    queryKey: ["navigation", token],
    queryFn: fetchNavigation,
  })

  // notify parent when item count changes
  useEffect(() => {
    onCount?.(items?.length ?? 0)
  }, [items?.length, onCount])

  // Calculate breakpoint based on item count
  // Estimate: logo ~150px, each nav item with text ~120px, login/logout ~100px, padding ~50px
  const minWidthForText = useMemo(() => {
    const logoWidth = 150
    const itemWidthWithText = 120
    const loginWidth = 100
    const padding = 50
    return logoWidth + ((items?.length ?? 0) * itemWidthWithText) + loginWidth + padding
  }, [items?.length])

  const [showText] = useMediaQuery(`(min-width: ${minWidthForText}px)`)

  // Lighter text color and hover color.
  const textColor = useColorModeValue("ui.dark", "ui.light")
  const bgHover = useColorModeValue("#EDF2F7", "#4A5568")
  const containerBg = useColorModeValue("#F9FAFB", "#343F4C")
  const activeBg = "ui.main" // Use primary button color
  const activeText = "ui.light"

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
  }

  if (isLoading) {
    return <Skeleton w="full" h="40px" />
  }

  if (!items) {
    onCount?.(0)
    return null
  }

  const listItems = items.map(
    ({ icon: iconName, title, path }: NavigationItem) => {
      const iconSrc = iconMap[iconName] ?? galleryIcon
      const isActive = location.pathname === path

      const handleClick = () => {
        onClose?.()
      }

      const iconElement = (
        <img
          src={iconSrc}
          alt={title}
          className="hover-icon"
          style={{
            width: "24px",
            height: "24px",
            filter: isActive
              ? "brightness(0) invert(1)"
              : "brightness(0) saturate(0%) invert(60%)",
            opacity: "0.6",
            transition: "all 0.2s ease",
            pointerEvents: "none",
          }}
        />
      )

      const textElement = showText ? (
        <Text 
          ml={2} 
          fontWeight={isActive ? "normal" : "300"}
          whiteSpace="nowrap"
          overflow="hidden"
          textOverflow="ellipsis"
        >
          {title}
        </Text>
      ) : null

      const mouseHandlers = {
        onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
          if (isActive) return
          const img = e.currentTarget.querySelector("img")
          if (img) {
            img.style.opacity = "1"
            img.style.transform = "scale(1.15)"
            img.style.filter =
              "brightness(0) saturate(100%) invert(58%) sepia(96%) saturate(1174%) hue-rotate(170deg) brightness(101%) contrast(101%)"
          }
        },
        onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
          if (isActive) return
          const img = e.currentTarget.querySelector("img")
          if (img) {
            img.style.opacity = "0.6"
            img.style.transform = "scale(1)"
            img.style.filter = "brightness(0) saturate(0%) invert(60%)"
          }
        },
        onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => {
          if (isActive) return
          const img = e.currentTarget.querySelector("img")
          if (img) img.style.transform = "scale(1.05)"
        },
        onMouseUp: (e: React.MouseEvent<HTMLDivElement>) => {
          if (isActive) return
          const img = e.currentTarget.querySelector("img")
          if (img) img.style.transform = "scale(1.15)"
        },
      }

      return (
        <Flex
          as={Link}
          to={path}
          px={direction === "column" ? 2 : 4}
          py={direction === "column" ? 2 : 0}
          key={title}
          bg={direction === "column" ? "transparent" : (isActive ? activeBg : "transparent")}
          color={isActive ? activeText : textColor}
          _hover={isActive ? {} : (direction === "column" ? {} : { bg: bgHover })}
          onClick={handleClick}
          align="center"
          justify={direction === "column" ? "center" : "flex-start"}
          cursor={isActive ? "default" : "pointer"}
          pointerEvents={isActive ? "none" : "auto"}
          h={direction === "column" ? "auto" : "52px"}
          {...mouseHandlers}
        >
          {iconElement}
          {textElement}
        </Flex>
      )
    },
  )

  // Use a lighter background in both modes:
  return (
    <Flex 
      flexDir={direction} 
      gap={direction === "column" ? 2 : 4} 
      w="100%" 
      align={direction === "column" ? "center" : "stretch"}
      bg={direction === "column" ? "transparent" : containerBg}
    >
      {listItems}
    </Flex>
  )
}

export default NavigationItems
