import { createFileRoute } from "@tanstack/react-router"
import { Dashboard } from "./items"

// Temporary: home/landing page points to the items grid
export const Route = createFileRoute("/_layout/")({
  component: Dashboard,
})
