import { Checkbox, FormControl, Spinner } from "@chakra-ui/react"
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
  const [allPerms, setAllPerms] = useState<string[] | null>(null)

  // Fetch list of available permissions from backend once
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/utils/permissions/`)
        if (res.ok) {
          const data: string[] = await res.json()
          setAllPerms(data)
        } else {
          console.error("Failed to load permissions", await res.text())
          setAllPerms([])
        }
      } catch (err) {
        console.error("Error fetching permissions", err)
        setAllPerms([])
      }
    })()
  }, [])

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

  if (!allPerms) {
    return <Spinner size="sm" />
  }

  return (
    <>
      {allPerms.map((perm) => (
        <FormControl mt={4} key={perm}>
          <Checkbox
            colorScheme="teal"
            value={perm}
            isChecked={permissions.includes(perm)}
            onChange={(e) =>
              handlePermissionChange(e.target.value, e.target.checked)
            }
          >
            {perm.charAt(0).toUpperCase() + perm.slice(1).replace(/_/g, " ")}
          </Checkbox>
        </FormControl>
      ))}
    </>
  );
}

export default PermissionsCheckboxGroup
