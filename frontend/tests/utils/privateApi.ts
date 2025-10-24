// Note: the user creation function is only available when generating the client
// for local environments
import { OpenAPI } from "../../src/client"
import { usersCreateUser } from "../../src/client/sdk.gen"

OpenAPI.BASE = `${process.env.VITE_API_URL}`

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  return await usersCreateUser({
    requestBody: {
      email,
      password,
      is_active: true,
      full_name: "Test User",
    },
  })
}
