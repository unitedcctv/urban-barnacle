// Note: the user creation function is only available when generating the client
// for local environments
import { client } from "../../src/client/client.gen"
import { usersCreateUser } from "../../src/client/sdk.gen"

client.setConfig({
  baseUrl: `${process.env.VITE_API_URL}`,
})

export const createUser = async ({
  email,
  password,
}: {
  email: string
  password: string
}) => {
  return await usersCreateUser({
    body: {
      email,
      password,
      is_active: true,
      full_name: "Test User",
    },
    throwOnError: true,
  })
}
