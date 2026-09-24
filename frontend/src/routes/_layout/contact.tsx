import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Icon,
  Input,
  Link,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react"
import { useMutation } from "@tanstack/react-query"
import { Link as RouterLink, createFileRoute } from "@tanstack/react-router"
import { type SubmitHandler, useForm } from "react-hook-form"
import { FaCloud, FaLinkedin, FaMastodon, FaReddit } from "react-icons/fa"

import { type ContactEnquiryCreate, enquiriesSubmitEnquiry } from "../../client"
import useCustomToast from "../../hooks/useCustomToast"
import { emailPattern, handleError } from "../../utils"

export const Route = createFileRoute("/_layout/contact")({
  component: Contact,
})

const MAP_LAT = 52.496944
const MAP_LON = 13.440528
const MAP_SRC = `https://www.openstreetmap.org/export/embed.html?bbox=${
  MAP_LON - 0.008
},${MAP_LAT - 0.004},${MAP_LON + 0.008},${
  MAP_LAT + 0.004
}&layer=mapnik&marker=${MAP_LAT},${MAP_LON}`

function Contact() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactEnquiryCreate>()
  const showToast = useCustomToast()

  const mutation = useMutation({
    mutationFn: (data: ContactEnquiryCreate) =>
      enquiriesSubmitEnquiry({ body: data, throwOnError: true }),
    onSuccess: () => {
      showToast(
        "Message sent.",
        "Thank you for your enquiry. We'll get back to you soon.",
        "success",
      )
      reset()
    },
    onError: (err: unknown) => {
      handleError(err, showToast)
    },
  })

  const onSubmit: SubmitHandler<ContactEnquiryCreate> = (data) => {
    mutation.mutate(data)
  }

  const socialLinks = [
    {
      name: "Mastodon",
      url: import.meta.env.VITE_MASTODON_URL,
      icon: FaMastodon,
      color: "#6364FF",
    },
    {
      name: "Bluesky",
      url: import.meta.env.VITE_BLUESKY_URL,
      icon: FaCloud,
      color: "#1185FE",
    },
    {
      name: "Reddit",
      url: import.meta.env.VITE_REDDIT_URL,
      icon: FaReddit,
      color: "#FF4500",
    },
    {
      name: "LinkedIn",
      url: import.meta.env.VITE_LINKEDIN_URL,
      icon: FaLinkedin,
      color: "#0A66C2",
    },
  ].filter((l) => l.url)

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="flex-start">
        <Heading size="lg">Contact</Heading>
        <Text>
          Questions or feedback? Send us a message using the form below, or
          email us at:{" "}
          <Link href="mailto:karl@ubdm.io" color="ui.main">
            karl@ubdm.io
          </Link>
        </Text>

        <Box as="form" onSubmit={handleSubmit(onSubmit)} w="100%" maxW="xl">
          <VStack spacing={4} align="stretch">
            <FormControl isInvalid={!!errors.name} isRequired>
              <FormLabel htmlFor="name">Name</FormLabel>
              <Input
                id="name"
                {...register("name", { required: "Name is required" })}
                placeholder="Your name"
                maxLength={255}
              />
              {errors.name && (
                <FormErrorMessage>{errors.name.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.email} isRequired>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                placeholder="you@example.com"
                type="email"
              />
              {errors.email && (
                <FormErrorMessage>{errors.email.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.subject}>
              <FormLabel htmlFor="subject">Subject (optional)</FormLabel>
              <Input
                id="subject"
                {...register("subject")}
                placeholder="What is this about?"
                maxLength={255}
              />
              {errors.subject && (
                <FormErrorMessage>{errors.subject.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl isInvalid={!!errors.message} isRequired>
              <FormLabel htmlFor="message">Message</FormLabel>
              <Textarea
                id="message"
                {...register("message", { required: "Message is required" })}
                placeholder="How can we help?"
                rows={6}
                maxLength={5000}
              />
              {errors.message && (
                <FormErrorMessage>{errors.message.message}</FormErrorMessage>
              )}
            </FormControl>
            {/* Honeypot: hidden from real users, bots fill it in */}
            <Input
              {...register("website")}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              position="absolute"
              left="-9999px"
              height={0}
              width={0}
              opacity={0}
            />
            <Button
              variant="primary"
              type="submit"
              isLoading={isSubmitting}
              alignSelf="flex-start"
            >
              Send message
            </Button>
            <Text fontSize="sm" color="gray.500">
              By submitting this form you agree that we use your details to
              respond to your enquiry. See our{" "}
              <Link as={RouterLink} to="/privacy" color="ui.main">
                privacy policy
              </Link>
              .
            </Text>
          </VStack>
        </Box>

        <Box as="address" fontStyle="normal">
          <Text fontWeight="bold">UBDM</Text>
          <Text>Falckensteinstraße 22</Text>
          <Text>10997 Berlin</Text>
          <Text>Germany</Text>
        </Box>
        {socialLinks.length > 0 && (
          <Box>
            <Heading size="md" mb={3}>
              Follow us
            </Heading>
            <VStack spacing={2} align="flex-start">
              {socialLinks.map(({ name, url, icon, color }) => (
                <Link key={url} href={url} isExternal color="ui.main">
                  <Icon as={icon} color={color} mr={2} />
                  {name}
                </Link>
              ))}
            </VStack>
          </Box>
        )}
        <Box
          as="iframe"
          title="Our location on OpenStreetMap"
          src={MAP_SRC}
          width="100%"
          height="400px"
          border={0}
          borderRadius="md"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </VStack>
    </Container>
  )
}
