import { createFileRoute } from "@tanstack/react-router"
import ResetPassword from "../components/UserSettings/ResetPassword"

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
})
