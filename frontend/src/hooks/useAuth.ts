import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import {
  loginLoginAccessToken,
  usersReadUserMe,
  usersRegisterUser,
} from "../client/sdk.gen"
import type { UserPublic, UserRegister } from "../client/types.gen"
import type { BodyLoginLoginAccessToken as AccessToken } from "../client/types.gen"

import useCustomToast from "./useCustomToast"

const isLoggedIn = () => {
  return localStorage.getItem("access_token") !== null
}

const useAuth = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const showToast = useCustomToast()
  const queryClient = useQueryClient()
  const {
    data: user,
    isLoading,
    error: userError,
  } = useQuery<UserPublic | null, Error>({
    queryKey: ["currentUser"],
    queryFn: () => usersReadUserMe({ throwOnError: true }),
    enabled: isLoggedIn(),
    retry: false, // Don't retry on auth failures
  })

  // Handle authentication errors
  if (userError && isLoggedIn()) {
    const detail = (userError as { detail?: unknown })?.detail
    if (
      detail === "Could not validate credentials" ||
      detail === "Inactive user" ||
      (userError instanceof Error &&
        userError.message.includes("User not found"))
    ) {
      localStorage.removeItem("access_token")
      navigate({ to: "/" })
    }
  }

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      usersRegisterUser({ body: data, throwOnError: true }),

    onSuccess: () => {
      // TODO sign in the user after successful sign up
      showToast(
        "Account created.",
        "Your account has been created successfully.",
        "success",
      )
    },
    onError: (err: unknown) => {
      let errDetail = (err as { detail?: string })?.detail

      if (err instanceof Error && errDetail === undefined) {
        errDetail = err.message
      }

      showToast(
        "Something went wrong.",
        errDetail ?? "Something went wrong",
        "error",
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await loginLoginAccessToken({
      body: data,
      throwOnError: true,
    })
    localStorage.setItem("access_token", response.access_token)
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" })
    },
    onError: (err: unknown) => {
      let errDetail: string | undefined = (err as { detail?: string })?.detail

      if (err instanceof Error && errDetail === undefined) {
        errDetail = err.message
      }

      if (Array.isArray(errDetail)) {
        errDetail = "Something went wrong"
      }

      setError(errDetail ?? "Something went wrong")
    },
  })

  const logout = () => {
    localStorage.removeItem("access_token")
  }

  return {
    signUpMutation,
    loginMutation,
    logout,
    user,
    isLoading,
    error,
    resetError: () => setError(null),
  }
}

export { isLoggedIn }
export default useAuth
