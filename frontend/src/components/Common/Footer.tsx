import { Divider, Flex, Icon, Link, useColorModeValue } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import {
  FaCloud,
  FaLinkedin,
  FaMastodon,
  FaReddit,
} from "react-icons/fa"

const legalLinks = [
  { title: "Contact", to: "/contact" },
  { title: "Impressum", to: "/impressum" },
  { title: "Privacy", to: "/privacy" },
] as const

const Footer = () => {
  const mastodonUrl = import.meta.env.VITE_MASTODON_URL
  const blueskyUrl = import.meta.env.VITE_BLUESKY_URL
  const redditUrl = import.meta.env.VITE_REDDIT_URL
  const linkedinUrl = import.meta.env.VITE_LINKEDIN_URL

  const bgColor = useColorModeValue("ui.light", "ui.dark")

  const links = [
    { url: mastodonUrl, icon: FaMastodon, color: "#6364FF" },
    { url: blueskyUrl, icon: FaCloud, color: "#1185FE" },
    { url: redditUrl, icon: FaReddit, color: "#FF4500" },
    { url: linkedinUrl, icon: FaLinkedin, color: "#0A66C2" },
  ]

  const visibleLinks = links.filter((l) => l.url)

  return (
    <Flex
      as="footer"
      position="fixed"
      bottom={0}
      left={0}
      zIndex={1000}
      justify="center"
      align="center"
      gap={4}
      py={3}
      w="100%"
      bg={bgColor}
      boxShadow="0 -2px 8px rgba(0,0,0,0.1)"
      transition="background 0.2s"
    >
      {legalLinks.map(({ title, to }) => (
        <Link key={to} as={RouterLink} to={to} color="ui.main">
          {title}
        </Link>
      ))}
      {visibleLinks.length > 0 && (
        <Divider orientation="vertical" h="20px" />
      )}
      {visibleLinks.map(({ url, icon, color }) => (
        <Link key={url} href={url} isExternal>
          <Icon
            as={icon}
            boxSize={5}
            color={color}
            _hover={{ transform: "scale(1.2)" }}
            transition="transform 0.2s"
          />
        </Link>
      ))}
    </Flex>
  )
}

export default Footer
