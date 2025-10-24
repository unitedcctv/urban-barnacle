import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Image,
  Input,
  Text,
  // TODO: Blockchain/NFT - Re-enable these imports when blockchain features are needed
  // Alert,
  // AlertIcon,
  // AlertTitle,
  // AlertDescription,
  // Modal,
  // ModalOverlay,
  // ModalContent,
  // ModalHeader,
  // ModalBody,
  // useDisclosure,
  // VStack,
  // Badge,
  // CloseButton,
  // ModalCloseButton,
} from "@chakra-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { createFileRoute } from "@tanstack/react-router"
import type React from "react"
import { useRef, useState } from "react"
import { type SubmitHandler, useForm } from "react-hook-form"
import type { UserPublic } from "../../client"
import type { ApiError } from "../../client/core/ApiError"
import { itemsCreateItem, itemsUpdateItem } from "../../client/sdk.gen"
// TODO: Blockchain/NFT - Re-enable itemsMintItemNft import when blockchain features are needed
import {
  imagesDeleteItemImages,
  itemsDeleteItem,
  /*, itemsMintItemNft */ modelsDeleteItemModel,
  modelsUploadModel,
} from "../../client/sdk.gen"
import type { ItemCreate } from "../../client/types.gen"
import ImagesUploader, {
  type ImagesUploaderRef,
} from "../../components/Items/ImagesUploader"
import useCustomToast from "../../hooks/useCustomToast"
import { handleError } from "../../utils"
import uploadIcon from "../../theme/assets/icons/upload.svg"

export const Route = createFileRoute("/_layout/createitem")({
  component: CreateItem,
})

function CreateItem() {
  const [isItemStarted, setIsItemStarted] = useState(false)
  const [createdItemId, setCreatedItemId] = useState<string>("")
  const [modelFile, setModelFile] = useState<File | null>(null)
  // TODO: Blockchain/NFT certificate functionality temporarily disabled
  // Re-enable these state variables when blockchain features are needed again
  // const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  // const [balanceMessage, setBalanceMessage] = useState<string>("");
  // const [balanceStatus, setBalanceStatus] = useState<"info" | "warning" | "error" | "success">("info");
  // const [isMintingNft, setIsMintingNft] = useState(false);
  // const [isNftAlertDismissed, setIsNftAlertDismissed] = useState(false);
  // const [isBalanceAlertDismissed, setIsBalanceAlertDismissed] = useState(false);
  // const { isOpen: isTokenModalOpen, onOpen: onTokenModalOpen, onClose: onTokenModalClose } = useDisclosure();
  const queryClient = useQueryClient()
  const showToast = useCustomToast()
  const navigate = useNavigate()
  const currentUser = queryClient.getQueryData<UserPublic>(["currentUser"])
  const imagesUploaderRef = useRef<ImagesUploaderRef>(null)

  const item: any = {
    id: createdItemId || "",
    owner_id: currentUser?.id || "",
    title: "",
    description: "",
    model: "",
    certificate: "",
    images: "",
    // TODO: Blockchain/NFT certificate functionality temporarily disabled
    // NFT fields
    // is_nft_enabled: true,
    // nft_token_id: null,
    // nft_contract_address: null,
    // nft_transaction_hash: null,
    // nft_metadata_uri: null,
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    mode: "onBlur",
    criteriaMode: "all",
    defaultValues: item,
  })

  const createMutation = useMutation({
    mutationFn: (data: ItemCreate) => itemsCreateItem({ requestBody: data }),
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { itemId: string; body: ItemCreate }) =>
      itemsUpdateItem({ id: data.itemId, requestBody: data.body }),
    onError: (err: ApiError) => {
      handleError(err, showToast)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
    },
  })

  // TODO: Blockchain/NFT certificate functionality temporarily disabled
  // Re-enable this mutation when blockchain features are needed again
  // const mintNftMutation = useMutation({
  //   mutationFn: (itemId: string) => itemsMintItemNft({ id: itemId }),
  //   onError: (err: ApiError) => {
  //     handleError(err, showToast);
  //     setIsMintingNft(false);
  //   },
  //   onSuccess: (updatedItem) => {
  //     console.log("NFT minted successfully, updatedItem:", updatedItem);
  //     showToast("Success!", "NFT minted successfully!", "success");
  //     setIsMintingNft(false);
  //
  //     // Update the form with the new NFT data
  //     console.log("Updating form values with NFT data...");
  //     setValue("nft_token_id", updatedItem.nft_token_id, { shouldDirty: true, shouldTouch: true });
  //     setValue("nft_contract_address", updatedItem.nft_contract_address, { shouldDirty: true, shouldTouch: true });
  //     setValue("nft_transaction_hash", updatedItem.nft_transaction_hash, { shouldDirty: true, shouldTouch: true });
  //     setValue("nft_metadata_uri", updatedItem.nft_metadata_uri, { shouldDirty: true, shouldTouch: true });
  //
  //     console.log("Form values after update:", {
  //       nft_token_id: watch("nft_token_id"),
  //       nft_contract_address: watch("nft_contract_address"),
  //       nft_transaction_hash: watch("nft_transaction_hash"),
  //       nft_metadata_uri: watch("nft_metadata_uri")
  //     });
  //
  //     queryClient.invalidateQueries({ queryKey: ["items"] });
  //   },
  // });

  const handleImagesChange = (commaSeparatedUrls: string) => {
    setValue("images", commaSeparatedUrls, { shouldDirty: true })
  }

  const handleCancel = async () => {
    // Delete the initialized item and its files if item was created
    if (createdItemId) {
      try {
        // Delete uploaded files first
        await imagesDeleteItemImages({ itemId: createdItemId })
        await modelsDeleteItemModel({ itemId: createdItemId })

        // Delete the item record from database
        await itemsDeleteItem({ id: createdItemId })

        showToast("Success", "Item and all associated files deleted", "success")
      } catch (error) {
        console.error("Error deleting item during cancel:", error)
        showToast("Warning", "Some cleanup operations may have failed", "error")
        // Continue with reset even if deletion fails
      }
    }

    // Reset all form data
    reset()
    // Reset local state
    setModelFile(null)
    setIsItemStarted(false)
    setCreatedItemId("")
    // Reset images uploader
    imagesUploaderRef.current?.reset()
    // Only show reset message if no item was created
    if (!createdItemId) {
      showToast("Info", "Form has been reset", "success")
    }
  }

  const handleModelFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file extension
      if (!file.name.toLowerCase().endsWith(".blend")) {
        showToast("Error", "Only .blend files are allowed", "error")
        event.target.value = "" // Reset the input
        return
      }

      // Check if item is created before uploading
      if (!createdItemId) {
        showToast(
          "Error",
          "Please create the item first before uploading model",
          "error",
        )
        event.target.value = ""
        return
      }

      try {
        // Upload the model file to the server
        await modelsUploadModel({
          formData: { file },
          itemId: createdItemId,
          userId: currentUser?.id?.toString() || "0",
        })

        setModelFile(file)
        setValue("model", file.name, { shouldDirty: true })
        showToast("Success", "Model file uploaded successfully", "success")
      } catch (error) {
        console.error("Error uploading model:", error)
        showToast("Error", "Failed to upload model file", "error")
        event.target.value = ""
      }
    }
  }

  // TODO: Blockchain/NFT certificate functionality temporarily disabled
  // Re-enable these functions when blockchain features are needed again
  // Environment detection
  // const isProduction = import.meta.env.PROD || import.meta.env.VITE_ENVIRONMENT === 'production';
  // const isDevelopment = import.meta.env.DEV || import.meta.env.VITE_ENVIRONMENT === 'development';
  // const isStaging = import.meta.env.VITE_ENVIRONMENT === 'staging';

  // Check ETH balance and handle funding
  /* const checkBalanceAndFund = async (): Promise<boolean> => {
    setIsCheckingBalance(true);
    setBalanceMessage("");
    
    try {
      // Call backend API to check balance
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      const response = await fetch(`${apiBase}/api/v1/blockchain/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        cache: 'no-store',
      });
      
      if (!response.ok) {
        // Try to get error details from response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
        } else {
          // Non-JSON response (likely HTML error page)
          throw new Error(`Blockchain service unavailable (HTTP ${response.status}). Please ensure the blockchain service is running.`);
        }
      }
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Blockchain service returned invalid response. Service may be unavailable.');
      }
      
      const balanceData = await response.json();
      const hasEnoughFunds = balanceData.has_enough_funds;
      const currentBalance = balanceData.balance_eth;
      
      if (hasEnoughFunds) {
        setBalanceMessage(`✅ Sufficient funds available (${currentBalance} ETH)`);
        setBalanceStatus("success");
        return true;
      }
      
      // Insufficient funds - handle based on environment
      if (isProduction) {
        setBalanceMessage(
          `❌ Insufficient ETH balance (${currentBalance} ETH). NFT creation requires funding. Please contact support or add funds to your account.`
        );
        setBalanceStatus("error");
        showToast(
          "Insufficient Funds", 
          "Cannot create NFT in production without sufficient ETH balance. Please contact support.", 
          "error"
        );
        return false;
      } else if (isDevelopment || isStaging) {
        // Auto-fund in development/staging
        setBalanceMessage(`⏳ Insufficient funds (${currentBalance} ETH). Auto-funding account...`);
        setBalanceStatus("warning");
        
        try {
          const fundResponse = await fetch(`${apiBase}/api/v1/blockchain/fund-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
            cache: 'no-store',
          });
          
          if (!fundResponse.ok) {
            const contentType = fundResponse.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
              const errorData = await fundResponse.json();
              throw new Error(errorData.detail || `HTTP ${fundResponse.status}: ${fundResponse.statusText}`);
            } else {
              throw new Error(`Blockchain service unavailable for funding (HTTP ${fundResponse.status})`);
            }
          }
          
          const fundData = await fundResponse.json();
          setBalanceMessage(
            `✅ Account funded successfully! New balance: ${fundData.new_balance_eth} ETH`
          );
          setBalanceStatus("success");
          showToast(
            "Account Funded", 
            `Development account funded with ${fundData.funded_amount_eth} ETH`, 
            "success"
          );
          return true;
        } catch (fundError) {
          setBalanceMessage(
            `❌ Failed to auto-fund account: ${fundError instanceof Error ? fundError.message : 'Unknown error'}`
          );
          setBalanceStatus("error");
          showToast("Funding Failed", "Could not auto-fund development account", "error");
          return false;
        }
      }
      
      return false;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Provide specific guidance based on error type
      let userMessage = errorMessage;
      if (errorMessage.includes('Unexpected token') || errorMessage.includes('DOCTYPE')) {
        userMessage = 'Blockchain service is not responding properly. Please check if the blockchain container is running.';
      } else if (errorMessage.includes('unavailable') || errorMessage.includes('503')) {
        userMessage = 'Blockchain service is currently unavailable. Please try again in a moment.';
      } else if (errorMessage.includes('Not authenticated')) {
        userMessage = 'Authentication required. Please log in again.';
      }
      
      setBalanceMessage(`❌ Error checking balance: ${userMessage}`);
      setBalanceStatus("error");
      showToast("Balance Check Failed", userMessage, "error");
      return false;
    } finally {
      setIsCheckingBalance(false);
    }
  }; */

  /* const handleMintNft = async () => {
    console.log("handleMintNft called");
    
    if (!createdItemId) {
      showToast("Error", "No item available to mint NFT for", "error");
      return;
    }

    console.log("createdItemId:", createdItemId);
    const formData = watch();

    // Check if NFT is already minted
    if (formData.nft_token_id) {
      showToast("Info", "NFT is already minted for this item", "success");
      return;
    }

    // Check balance before minting
    console.log("Starting balance check...");
    setIsMintingNft(true);
    const balanceOk = await checkBalanceAndFund();
    console.log("Balance check result:", balanceOk);
    
    if (!balanceOk) {
      console.log("Balance check failed, stopping mint process");
      setIsMintingNft(false);
      return;
    }

    console.log("Calling mintNftMutation.mutate with itemId:", createdItemId);
    mintNftMutation.mutate(createdItemId);
  }; */

  const onSubmit: SubmitHandler<any> = async (formData) => {
    if (!isItemStarted) {
      createMutation.mutate(formData, {
        onSuccess: (newItem) => {
          setCreatedItemId(newItem.id)
          showToast("Success!", "Item created successfully.", "success")
          setIsItemStarted(true)
        },
      })
    } else {
      if (!createdItemId) {
        showToast(
          "Error",
          "Cannot update an item without a valid item ID",
          "error",
        )
        return
      }

      updateMutation.mutate(
        { itemId: createdItemId, body: formData },
        {
          onSuccess: () => {
            showToast("Success!", "Item updated successfully.", "success")
            reset()
            setIsItemStarted(false)
            setCreatedItemId("")
            navigate({ to: "/gallery" })
          },
        },
      )
    }
  }

  // Watch the title and all other fields
  const title = watch("title")

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
        {errors.title && (
          <FormErrorMessage>{errors.title.message as string}</FormErrorMessage>
        )}
      </FormControl>

      {/* Description Field */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="description">Description</FormLabel>
        <Input
          id="description"
          {...register("description")}
          placeholder="Description"
        />
      </FormControl>

      {/* Model File Upload */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel htmlFor="model">3D Model File (.blend)</FormLabel>
        <Box>
          <Input
            id="model"
            type="file"
            accept=".blend"
            onChange={handleModelFileChange}
            display="none"
          />
          <Button
            variant="primary"
            onClick={() => document.getElementById("model")?.click()}
            isDisabled={!isItemStarted}
            leftIcon={
              <Image
                src={uploadIcon}
                alt="upload"
                boxSize="20px"
              />
            }
          >
            {modelFile ? modelFile.name : "Upload Blender File (.blend)"}
          </Button>
        </Box>
        {modelFile && (
          <Text mt={2} fontSize="sm" color="green.500">
            ✓ File selected: {modelFile.name}
          </Text>
        )}
      </FormControl>

      {/* Images Uploader */}
      <FormControl mt={4} isDisabled={!isItemStarted}>
        <FormLabel>Images</FormLabel>
        <Box
          opacity={!isItemStarted ? 0.6 : 1}
          pointerEvents={!isItemStarted ? "none" : "auto"}
        >
          <ImagesUploader
            ref={imagesUploaderRef}
            onImagesChange={handleImagesChange}
            _item={
              {
                id: createdItemId,
                images: "",
                owner_id: currentUser?.id || 0,
              } as any
            }
          />
        </Box>
      </FormControl>

      {/* Action Buttons */}
      <HStack spacing={4} mt={6}>
        <Button
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          isDisabled={!isItemStarted && !title}
          flex={1}
          px={6}
          py={3}
        >
          {isItemStarted ? "Update Item" : "Initialise Item"}
        </Button>
        {/* TODO: Blockchain/NFT certificate functionality temporarily disabled */}
        {/* Re-enable these buttons when blockchain features are needed again */}
        {/* {(() => {
          const tokenId = watch("nft_token_id");
          console.log("Current nft_token_id value:", tokenId, "Type:", typeof tokenId);
          return tokenId === null || tokenId === undefined;
        })() ? (
          <Button
            variant="primary"
            onClick={handleMintNft}
            isLoading={isMintingNft || isCheckingBalance}
            loadingText={isCheckingBalance ? "Checking Balance..." : "Minting NFT..."}
            isDisabled={!isItemStarted}
            flex={1}
            px={6}
            py={3}
          >
            Mint NFT
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={onTokenModalOpen}
            flex={1}
            px={8}
            py={3}
          >
            View NFT Details
          </Button>
        )} */}
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

      {/* TODO: Blockchain/NFT certificate functionality temporarily disabled */}
      {/* Re-enable this modal when blockchain features are needed again */}
      {/* NFT Details Modal */}
      {/* <Modal isOpen={isTokenModalOpen} onClose={onTokenModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>NFT Token Details</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>Token ID</Text>
                <Badge colorScheme="gray" fontSize="md" p={2}>
                  {watch("nft_token_id") || "Not available"}
                </Badge>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Contract Address</Text>
                <Text fontFamily="mono" fontSize="sm" bg="gray.100" p={2} borderRadius="md">
                  {watch("nft_contract_address") || "Not available"}
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Transaction Hash</Text>
                <Text fontFamily="mono" fontSize="sm" bg="gray.100" p={2} borderRadius="md" wordBreak="break-all">
                  {watch("nft_transaction_hash") || "Not available"}
                </Text>
              </Box>
              
              <Box>
                <Text fontWeight="bold" mb={2}>Metadata URI</Text>
                <Text fontFamily="mono" fontSize="sm" bg="gray.100" p={2} borderRadius="md" wordBreak="break-all">
                  {watch("nft_metadata_uri") || "Not available"}
                </Text>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal> */}

      {/* Success Alerts at Bottom */}
      {/* TODO: Blockchain/NFT certificate functionality temporarily disabled */}
      {/* Re-enable these alerts when blockchain features are needed again */}
      {/* NFT Success Alert */}
      {/* {(watch("nft_token_id") !== null && watch("nft_token_id") !== undefined && !isNftAlertDismissed) && (
        <Alert status="success" mt={4} position="relative">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>NFT Minted Successfully!</AlertTitle>
            <AlertDescription>
              Token ID: {watch("nft_token_id")}
            </AlertDescription>
          </Box>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setIsNftAlertDismissed(true)}
          />
        </Alert>
      )} */}

      {/* Balance Status Alert (only show success status) */}
      {/* {balanceMessage && balanceStatus === "success" && !isBalanceAlertDismissed && (
        <Alert status={balanceStatus} mt={4} position="relative">
          <AlertIcon />
          <Box flex="1">
            <AlertTitle>ETH Balance Status</AlertTitle>
            <AlertDescription>{balanceMessage}</AlertDescription>
          </Box>
          <CloseButton
            position="absolute"
            right="8px"
            top="8px"
            onClick={() => setIsBalanceAlertDismissed(true)}
          />
        </Alert>
      )} */}
    </Box>
  )
}

export default CreateItem
