import { useEffect, useState } from "react";
import {
  Button,
  Checkbox,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";

import { type UserCreate } from "../../client/types.gen";
import { usersCreateUser } from "../../client/sdk.gen";
import type { ApiError } from "../../client/core/ApiError";
import useCustomToast from "../../hooks/useCustomToast";
import { emailPattern, handleError } from "../../utils";
import PermissionsCheckboxGroup from "./Permissions";

interface AddUserProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserCreateForm extends UserCreate {
  confirm_password: string;
}

const AddUser = ({ isOpen, onClose }: AddUserProps) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const [permissions, setPermissions] = useState<string>("user");
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<UserCreateForm>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      email: "",
      full_name: "",
      password: "",
      confirm_password: "",
      permissions: "user",
      is_active: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        email: "",
        full_name: "",
        password: "",
        confirm_password: "",
        permissions: "user",
        is_active: false,
      });
      setPermissions("user"); // Reset permissions state
    }
  }, [isOpen, reset]);

  const mutation = useMutation({
    mutationFn: (data: UserCreate) => usersCreateUser({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "User created successfully.", "success");
      reset();
      onClose();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const onSubmit: SubmitHandler<UserCreateForm> = (data) => {
    data.permissions = permissions
    mutation.mutate(data);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={{ base: "sm", md: "md" }} isCentered>
        <ModalOverlay />
        <ModalContent as="form" onSubmit={handleSubmit(onSubmit)}>
          <ModalHeader>Add User</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6} w="100%">
            <FormControl isRequired isInvalid={!!errors.email}>
              <FormLabel htmlFor="email">Email</FormLabel>
              <Input
                id="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: emailPattern,
                })}
                placeholder="Email"
                type="email"
              />
              {errors.email && (
                <FormErrorMessage>{errors.email.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isInvalid={!!errors.full_name}>
              <FormLabel htmlFor="name">User Name</FormLabel>
              <Input
                id="name"
                {...register("full_name")}
                placeholder="User Name"
                type="text"
              />
              {errors.full_name && (
                <FormErrorMessage>{errors.full_name.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isRequired isInvalid={!!errors.password}>
              <FormLabel htmlFor="password">Set Password</FormLabel>
              <Input
                id="password"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 8,
                    message: "Password must be at least 8 characters",
                  },
                })}
                placeholder="Password"
                type="password"
              />
              {errors.password && (
                <FormErrorMessage>{errors.password.message}</FormErrorMessage>
              )}
            </FormControl>
            <FormControl mt={4} isRequired isInvalid={!!errors.confirm_password}>
              <FormLabel htmlFor="confirm_password">Confirm Password</FormLabel>
              <Input
                id="confirm_password"
                {...register("confirm_password", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === getValues().password ||
                    "The passwords do not match",
                })}
                placeholder="Password"
                type="password"
              />
              {errors.confirm_password && (
                <FormErrorMessage>{errors.confirm_password.message}</FormErrorMessage>
              )}
            </FormControl>
            <PermissionsCheckboxGroup
              initialPermissions={permissions}
              onPermissionsChange={setPermissions}
            />
            <FormControl mt={4}>
              <Checkbox {...register("is_active")} colorScheme="teal">
                Is active?
              </Checkbox>
            </FormControl>
          </ModalBody>
          <ModalFooter gap={3}>
            <Button variant="primary" type="submit" isLoading={isSubmitting}>
              Save
            </Button>
            <Button onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AddUser;
