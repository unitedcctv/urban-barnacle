import { createFileRoute } from "@tanstack/react-router"
import RecoverPassword from "../components/UserSettings/RecoverPassword"

export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
})
