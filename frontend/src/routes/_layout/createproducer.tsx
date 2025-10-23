import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Box,
  HStack,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { type ProducerCreate } from "../../client/types.gen";
import { type ApiError } from "../../client/core/ApiError";
import { producersCreateProducer } from "../../client/sdk.gen";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/createproducer")({
  component: CreateProducer,
});

function CreateProducer() {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProducerCreate>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      name: "",
      location: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ProducerCreate) => producersCreateProducer({ requestBody: data }),
    onSuccess: () => {
      showToast("Success!", "Producer profile created successfully.", "success");
      reset();
      queryClient.invalidateQueries({ queryKey: ["producers"] });
      queryClient.invalidateQueries({ queryKey: ["myProducer"] });
      queryClient.invalidateQueries({ queryKey: ["navigation"] });
      navigate({ to: "/producers" });
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
  });

  const onSubmit: SubmitHandler<ProducerCreate> = (data) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    reset();
    navigate({ to: "/producers" });
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Name Field */}
      <FormControl isRequired isInvalid={!!errors.name}>
        <FormLabel htmlFor="name">Producer Name</FormLabel>
        <Input
          id="name"
          {...register("name", {
            required: "Producer name is required",
            minLength: {
              value: 1,
              message: "Name must be at least 1 character",
            },
            maxLength: {
              value: 255,
              message: "Name must be at most 255 characters",
            },
          })}
          placeholder="Producer Name"
          type="text"
        />
        {errors.name && <FormErrorMessage>{errors.name.message}</FormErrorMessage>}
      </FormControl>

      {/* Location Field */}
      <FormControl mt={4} isInvalid={!!errors.location}>
        <FormLabel htmlFor="location">Location</FormLabel>
        <Input
          id="location"
          {...register("location", {
            maxLength: {
              value: 255,
              message: "Location must be at most 255 characters",
            },
          })}
          placeholder="Location"
          type="text"
        />
        {errors.location && <FormErrorMessage>{errors.location.message}</FormErrorMessage>}
      </FormControl>

      {/* Action Buttons */}
      <HStack spacing={4} mt={6}>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          flex={1}
          px={6}
          py={3}
        >
          Create Profile
        </Button>
        <Button
          variant="outline"
          onClick={handleCancel}
          isDisabled={isSubmitting}
          flex={1}
          px={6}
          py={3}
        >
          Cancel
        </Button>
      </HStack>
    </Box>
  );
}

export default CreateProducer;
