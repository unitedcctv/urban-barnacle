import { Checkbox, FormControl } from "@chakra-ui/react"
import { useState, useEffect } from "react"

interface PermissionsCheckboxGroupProps {
  initialPermissions: string
  onPermissionsChange: (permissions: string) => void
}

const PermissionsCheckboxGroup = ({
  initialPermissions,
  onPermissionsChange,
}: PermissionsCheckboxGroupProps) => {
  const [permissions, setPermissions] = useState<string[]>([])

  useEffect(() => {
    setPermissions(initialPermissions ? initialPermissions.split(",") : [])
  }, [initialPermissions])

  const handlePermissionChange = (value: string, checked: boolean) => {
    const updatedPermissions = checked
      ? [...permissions, value] // Add value if checked
      : permissions.filter((perm) => perm !== value) // Remove value if unchecked
    setPermissions(updatedPermissions)
    onPermissionsChange(updatedPermissions.join(",")) // Update parent component
  }

  return (
    <>
      <FormControl mt={4}>
        <Checkbox
          colorScheme="teal"
          value="extended"
          isChecked={permissions.includes("extended")}
          onChange={(e) =>
            handlePermissionChange(e.target.value, e.target.checked)
          }
        >
          Extended
        </Checkbox>
      </FormControl>
      <FormControl mt={4}>
        <Checkbox
          colorScheme="teal"
          value="backstage"
          isChecked={permissions.includes("backstage")}
          onChange={(e) =>
            handlePermissionChange(e.target.value, e.target.checked)
          }
        >
          Back Stage
        </Checkbox>
      </FormControl>
      <FormControl mt={4}>
        <Checkbox
          colorScheme="teal"
          value="superuser"
          isChecked={permissions.includes("superuser")}
          onChange={(e) =>
            handlePermissionChange(e.target.value, e.target.checked)
          }
        >
          Super User
        </Checkbox>
      </FormControl>
    </>
  )
}

export default PermissionsCheckboxGroup
