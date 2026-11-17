import { RepeatIcon } from "@chakra-ui/icons"
import { Button } from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { filamentsImportBambuEu } from "../../client/sdk.gen"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"

export default function ImportFilamentsButton() {
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const mutation = useMutation({
    mutationFn: () => filamentsImportBambuEu({ throwOnError: true }),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["filaments"] })
      showToast(
        "EU stock refreshed",
        `${result.imported} PETG Basic variants saved. UBDM stock counts preserved.`,
        "success",
      )
    },
    onError: (error: unknown) => handleError(error, showToast),
  })

  return (
    <Button
      leftIcon={<RepeatIcon />}
      onClick={() => mutation.mutate()}
      isLoading={mutation.isPending}
      loadingText="Checking EU stock"
    >
      Import / refresh Bambu EU
    </Button>
  )
}
