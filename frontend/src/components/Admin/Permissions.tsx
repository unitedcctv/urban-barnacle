import { Radio, RadioGroup, Stack, Text } from "@chakra-ui/react";
import { type UserPermission } from "../../client/types.gen";
import { userPermissions } from "../../client/permissions";

interface PermissionsSelectorProps {
  initialPermission: UserPermission;
  onPermissionChange: (permission: UserPermission) => void;
}

const PermissionsSelector = ({
  initialPermission,
  onPermissionChange,
}: PermissionsSelectorProps) => {
  return (
    <>
      <Text mt={4} fontWeight="bold">
        Permission
      </Text>
      <RadioGroup onChange={onPermissionChange} value={initialPermission}>
        <Stack direction="column">
          {userPermissions.map((perm) => (
            <Radio key={perm} value={perm}>
              {perm.charAt(0).toUpperCase() + perm.slice(1).replace(/_/g, " ")}
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
    </>
  );
};

export default PermissionsSelector;
