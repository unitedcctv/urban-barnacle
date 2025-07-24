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
import { useState, useEffect } from "react";
import { ItemPublic } from "../../client";
import { type ItemUpdate } from "../../client/types.gen";
import { type ApiError } from "../../client/core/ApiError";
import { itemsUpdateItem } from "../../client/sdk.gen";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import { UserPublic } from "../../client";

import ImagesUploader from "./ImagesUploader";

const EditItem = ({ 
  item, 
  onSuccess, 
  onDelete, 
  buttonsDisabled 
}: { 
  item: ItemPublic; 
  onSuccess: () => void;
  onDelete?: () => Promise<void>;
  buttonsDisabled?: boolean;
}) => {
  const queryClient = useQueryClient();
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const showToast = useCustomToast();

  // Store original values for comparison
  const originalValues = {
    title: item?.title || "",
    description: item?.description || "",
    model: item?.model || "",
    certificate: item?.certificate || "",
    images: item?.images || "",
  };

  const [currentImages, setCurrentImages] = useState(item?.images || "");
  const [hasChanges, setHasChanges] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: {
      id: item?.id,
      owner_id: item?.owner_id || currentUser?.id,
      title: item?.title,
      description: item?.description || "",
      model: item?.model || "",
      certificate: item?.certificate || "",
      images: item?.images || "",
    },
  });

  // Watch form values for changes
  const watchedValues = watch();

  // Check for changes whenever form values or images change
  useEffect(() => {
    const formHasChanges = 
      (watchedValues.title || "") !== originalValues.title ||
      (watchedValues.description || "") !== originalValues.description ||
      (watchedValues.model || "") !== originalValues.model ||
      (watchedValues.certificate || "") !== originalValues.certificate ||
      currentImages !== originalValues.images;
    
    setHasChanges(formHasChanges);
  }, [watchedValues, currentImages, originalValues]);

  const mutation = useMutation({
    mutationFn: (data: ItemUpdate) =>
      itemsUpdateItem({ id: item.id, requestBody: { ...data, title: data.title ?? "" } }),
    onSuccess: () => {
      showToast("Success!", "Item updated successfully.", "success");
      reset();
      queryClient.invalidateQueries({ queryKey: ["items"] }); // Ensure item list refreshes
      onSuccess();
    },
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
  });

  const handleImagesChange = (commaSeparatedUrls: string) => {
    setValue("images", commaSeparatedUrls);
    setCurrentImages(commaSeparatedUrls);
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

      <FormControl mt={4}>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Input id="description" {...register("description")} placeholder="Description" />
      </FormControl>

      <FormControl mt={4}>
        <FormLabel htmlFor="model">Model</FormLabel>
        <Input id="model" {...register("model")} placeholder="Model" />
      </FormControl>

      <FormControl mt={4}>
        <FormLabel htmlFor="certificate">Certificate</FormLabel>
        <Input id="certificate" {...register("certificate")} placeholder="Certificate" />
      </FormControl>

      <ImagesUploader onImagesChange={handleImagesChange} _item={item ?? {}} />

      <HStack spacing={4} mt={4}>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          isDisabled={!hasChanges || buttonsDisabled}
        >
          Update Item
        </Button>
        {onDelete && (
          <Button
            colorScheme="red"
            onClick={onDelete}
            isDisabled={buttonsDisabled}
          >
            Delete Item
          </Button>
        )}
      </HStack>
    </Box>
  );
};

export default EditItem;
