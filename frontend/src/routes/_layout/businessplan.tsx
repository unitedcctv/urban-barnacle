import { createFileRoute } from "@tanstack/react-router";
import { Box, Heading, Text } from "@chakra-ui/react";
import AskBusinessPlan from "../../components/Common/ask";

export const Route = createFileRoute("/_layout/businessplan")({
  component: BusinessPlan,
});

function BusinessPlan() {
  return (
    <Box p={8} maxW="4xl" mx="auto">
      <Heading as="h1" size="lg" mb={4}>
        Business Plan
      </Heading>
      <Text>
        This is a placeholder for the Urban Barnacle business plan. Only investors and
        superusers should have direct access to this page. Replace this text with the
        actual business plan content when it is ready.
      </Text>
      <AskBusinessPlan />
    </Box>
  );
}

export default BusinessPlan;
