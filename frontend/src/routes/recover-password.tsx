import { createFileRoute } from "@tanstack/react-router"
import RecoverPassword from "../components/UserSettings/recover-password"

export const Route = createFileRoute("/recover-password")({
  component: RecoverPassword,
})
