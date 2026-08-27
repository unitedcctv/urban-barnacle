import { Box, Container } from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router"

import datenschutzHtml from "../../legal/datenschutzerklaerung.html?raw"

export const Route = createFileRoute("/_layout/privacy")({
  component: Privacy,
})

function Privacy() {
  return (
    <Container maxW="4xl" py={8}>
      <Box
        sx={{
          h1: { fontSize: "2xl", fontWeight: "bold", mb: 4 },
          h2: { fontSize: "xl", fontWeight: "bold", mt: 6, mb: 2 },
          h3: { fontSize: "lg", fontWeight: "bold", mt: 4, mb: 2 },
          p: { mb: 3 },
          ul: { pl: 6, mb: 3 },
          li: { mb: 1 },
          a: { color: "ui.main", textDecoration: "underline" },
          overflowWrap: "break-word",
        }}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: static generated legal text shipped with the bundle
        dangerouslySetInnerHTML={{ __html: datenschutzHtml }}
      />
    </Container>
  )
}
