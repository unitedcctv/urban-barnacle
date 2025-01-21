import { useState } from "react";
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
import { useNavigate } from "@tanstack/react-router";
import { type ItemCreate, type ItemPublic } from "../../client/types.gen";
import { type ApiError } from "../../client/core/ApiError";
import { itemsCreateItem, itemsUpdateItem } from "../../client/sdk.gen";
import useCustomToast from "../../hooks/useCustomToast";
import { handleError } from "../../utils";
import ImagesUploader from "../../components/Items/ImagesUploader";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout/createitem")({
  component: CreateItem,
});

function CreateItem() {
  const [isItemStarted, setIsItemStarted] = useState(false);
  const [createdItemId, setCreatedItemId] = useState<string>("");
  const queryClient = useQueryClient();
  const showToast = useCustomToast();
  const navigate = useNavigate();

  let item: ItemPublic = {
    id: "",
    owner_id: "",
    title: "",
    description: "",
    model: "",
    certificate: "",
    images: "",
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting},
  } = useForm<ItemPublic>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: item,
  });

  const createMutation = useMutation({
    mutationFn: (data: ItemCreate) => itemsCreateItem({ requestBody: data }),
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: { itemId: string; body: ItemCreate }) =>
      itemsUpdateItem({ id: data.itemId, requestBody: data.body }),
    onError: (err: ApiError) => {
      handleError(err, showToast);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
    },
  });

  const handleImagesChange = (commaSeparatedUrls: string) => {
    setValue("images", commaSeparatedUrls, { shouldDirty: true });
  };

  const onSubmit: SubmitHandler<ItemPublic> = (formData) => {
    if (!isItemStarted) {
      createMutation.mutate(formData, {
        onSuccess: (newItem) => {
          setCreatedItemId(newItem.id);
          showToast("Success!", "Item created successfully (step 1).", "success");
          setIsItemStarted(true);
        },
      });
    } else {
      if (!createdItemId) {
        showToast("Error", "Cannot update an item without a valid item ID", "error");
        return;
      }

      updateMutation.mutate(
        { itemId: createdItemId, body: formData },
        {
          onSuccess: () => {
            showToast("Success!", "Item updated successfully (step 2).", "success");
            reset();
            setIsItemStarted(false);
            setCreatedItemId("");
            navigate({ to: "/" });
          },
        }
      );
    }
  };

  // Watch the title and all other fields
  const title = watch("title");

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)}>
      {/* Title Field */}
      <FormControl isRequired isInvalid={!!errors.title}>
        <FormLabel htmlFor="title">Title</FormLabel>
        <Input
          id="title"
          {...register("title", { required: "Title is required." })}
          placeholder="Title"
          type="text"
        />
        {errors.title && <FormErrorMessage>{errors.title.message}</FormErrorMessage>}
      </FormControl>

      {/* Description Field */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Input id="description" {...register("description")} placeholder="Description" />
      </FormControl>

      {/* Model Field */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="model">Model</FormLabel>
        <Input id="model" {...register("model")} placeholder="Model" />
      </FormControl>

      {/* Certificate Field */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="certificate">Certificate</FormLabel>
        <Input id="certificate" {...register("certificate")} placeholder="Certificate" />
      </FormControl>

      {/* Images Uploader */}
      <Box
        mt={4}
        opacity={!isItemStarted ? 0.6 : 1}
        pointerEvents={!isItemStarted ? "none" : "auto"}
      >
        <ImagesUploader onImagesChange={handleImagesChange} _item={item} />
      </Box>

      {/* Submit Button */}
      <Button
        variant="primary"
        type="submit"
        isLoading={isSubmitting}
        mt={4}
        isDisabled={!isItemStarted && !title}
      >
        {isItemStarted ? "Create Item" : "Initialise Item"}
      </Button>
    </Box>
  );
}

export default CreateItem;
