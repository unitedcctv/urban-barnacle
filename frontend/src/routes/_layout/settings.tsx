import {
  Box,
} from "@chakra-ui/react"
import { createFileRoute } from "@tanstack/react-router";
import UserInformation from "../../components/UserSettings/UserInformation"
import Appearance from "../../components/UserSettings/Appearance";
import ChangePassword from "../../components/UserSettings/ChangePassword";


export const Route = createFileRoute("/_layout/settings")({
  component: UserSettings,
})

function UserSettings(){

  return (
    <>
      <Box>
        <UserInformation />
        <ChangePassword />
        <Appearance />
      </Box>
    </>
  )
}
