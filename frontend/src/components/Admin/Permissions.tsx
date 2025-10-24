import { Radio, RadioGroup, Stack, Text } from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { utilsListPermissions } from "../../client/sdk.gen"
import type { UserPermission } from "../../client/types.gen"

interface PermissionsSelectorProps {
  initialPermission: UserPermission
  onPermissionChange: (permission: UserPermission) => void
}

const PermissionsSelector = ({
  initialPermission,
  onPermissionChange,
}: PermissionsSelectorProps) => {
  const [permissions, setPermissions] = useState<UserPermission[]>([])

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const data = await utilsListPermissions()
        setPermissions(data as UserPermission[])
      } catch (error) {
        console.error("Failed to fetch permissions:", error)
        // Fallback to hardcoded permissions if API fails
        setPermissions(["guest", "investor", "producer", "superuser"])
      }
    }

    fetchPermissions()
  }, [])

  return (
    <>
      <Text mt={4} fontWeight="bold">
        Permission
      </Text>
      <RadioGroup onChange={onPermissionChange} value={initialPermission}>
        <Stack direction="column">
          {permissions.map((perm) => (
            <Radio key={perm} value={perm}>
              {perm.charAt(0).toUpperCase() + perm.slice(1).replace(/_/g, " ")}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
    </>
  )
}

export default PermissionsSelector
