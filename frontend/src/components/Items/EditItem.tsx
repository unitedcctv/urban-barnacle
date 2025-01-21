import React from "react";
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Box,
} from "@chakra-ui/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type SubmitHandler, useForm } from "react-hook-form";
import { ItemPublic } from "../../client";
import { type ItemUpdate } from "../../client/types.gen";
import { type ApiError } from "../../client/core/ApiError";
import { itemsUpdateItem } from "../../client/sdk.gen";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";

import ImagesUploader from "./ImagesUploader";

const EditItem = ({ item, onSuccess }: { item: ItemPublic; onSuccess: () => void }) => {
  const queryClient = useQueryClient();
  const showToast = useCustomToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ItemPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      id: item?.id,
      owner_id: item?.owner_id,
      title: item?.title,
      description: item?.description || "",
      model: item?.model || "",
      certificate: item?.certificate || "",
      images: item?.images || "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: ItemUpdate) =>
      itemsUpdateItem({ id: item.id, requestBody: { ...data, title: data.title ?? "" } }),
    onSuccess: () => {
      showToast("Success!", "Item updated successfully.", "success");
      reset();
      queryClient.invalidateQueries({ queryKey: ["items"] }); // Ensure item list refreshes
      onSuccess(); // Close the modal and update parent
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
  });

  const handleImagesChange = (commaSeparatedUrls: string) => {
    setValue("images", commaSeparatedUrls);
  };

  const onSubmit: SubmitHandler<ItemUpdate> = (data) => {
    const updatedData = {
      ...data,
      title: data.title ?? "",
    };
    mutation.mutate(updatedData);
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Title Field */}
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel htmlFor="title">Title</FormLabel>
        <Input
          id="title"
          {...register("title", {
            required: "Title is required.",
          })}
          placeholder="Title"
          type="text"
        />
        {errors.title && <FormErrorMessage>{errors.title.message}</FormErrorMessage>}
      </FormControl>

      {/* Description Field */}
      <FormControl mt={4}>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Input id="description" {...register("description")} placeholder="Description" />
      </FormControl>

      {/* Model Field */}
      <FormControl mt={4}>
        <FormLabel htmlFor="model">Model</FormLabel>
        <Input id="model" {...register("model")} placeholder="Model" />
      </FormControl>

      {/* Certificate Field */}
      <FormControl mt={4}>
        <FormLabel htmlFor="certificate">Certificate</FormLabel>
        <Input id="certificate" {...register("certificate")} placeholder="Certificate" />
      </FormControl>

      <ImagesUploader onImagesChange={handleImagesChange} _item={item ?? {}} />

      {/* Submit Button */}
      <Button
        variant="primary"
        type="submit"
        isLoading={isSubmitting}
        mt={4}
        isDisabled={!isDirty} // Disable button if no inputs are changed
      >
        Update Item
      </Button>
    </Box>
  );
};

export default EditItem;
