import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { AxiosError } from "axios"
import type { ApiError } from "../client/core/ApiError"
import {
  loginLoginAccessToken,
  usersReadUserMe,
  usersRegisterUser,
} from "../client/sdk.gen"
import type { UserPublic, UserRegister } from "../client/types.gen"
import type { Body_login_login_access_token as AccessToken } from "../client/types.gen"

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
    queryFn: usersReadUserMe,
    enabled: isLoggedIn(),
    retry: false, // Don't retry on auth failures
  })

  // Handle authentication errors
  if (userError && isLoggedIn()) {
    const error = userError as any
    if (
      error?.status === 401 ||
      error?.status === 403 ||
      error?.message?.includes("User not found")
    ) {
      localStorage.removeItem("access_token")
      navigate({ to: "/" })
    }
  }

  const signUpMutation = useMutation({
    mutationFn: (data: UserRegister) =>
      usersRegisterUser({ requestBody: data }),

    onSuccess: () => {
      // TODO sign in the user after successful sign up
      showToast(
        "Account created.",
        "Your account has been created successfully.",
        "success",
      )
    },
    onError: (err: ApiError) => {
      let errDetail = (err.body as any)?.detail

      if (err instanceof AxiosError) {
        errDetail = err.message
      }

      showToast("Something went wrong.", errDetail, "error")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
    },
  })

  const login = async (data: AccessToken) => {
    const response = await loginLoginAccessToken({
      formData: data,
    })
    localStorage.setItem("access_token", response.access_token)
  }

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => {
      navigate({ to: "/" })
    },
    onError: (err: ApiError) => {
      let errDetail = (err.body as any)?.detail

      if (err instanceof AxiosError) {
        errDetail = err.message
      }

      if (Array.isArray(errDetail)) {
        errDetail = "Something went wrong"
      }

      setError(errDetail)
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
