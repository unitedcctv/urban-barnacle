import json
import os
import subprocess
from pathlib import Path
from typing import Optional, Dict, Any
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class BlockchainService:
    def __init__(self):
        # Use settings for Web3 URL and private key with proper fallbacks
        self.web3_url = settings.web3_url
        self.private_key = settings.private_key
        self.contract_address = None
        self.contract_abi = None
        self.web3 = None
        self.account = None
        
        self._initialize_web3()
        self._load_contract_info()

    def _initialize_web3(self):
        """Initialize Web3 connection"""
        try:
            self.web3 = Web3(Web3.HTTPProvider(self.web3_url))
            
            # Add PoA middleware for local development
            if "127.0.0.1" in self.web3_url or "localhost" in self.web3_url or "blockchain" in self.web3_url:
                self.web3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
            
            if self.private_key:
                self.account = self.web3.eth.account.from_key(self.private_key)
                logger.info(f"Initialized blockchain service with account: {self.account.address}")
            else:
                logger.warning("No private key provided, contract deployment will not be available")
                
        except Exception as e:
            logger.error(f"Failed to initialize Web3: {e}")
            self.web3 = None

    def _load_contract_info(self):
        """Load contract ABI and address from deployment files"""
        try:
            contract_file = Path(__file__).parent / "contracts" / "ItemNFT.json"
            if contract_file.exists():
                with open(contract_file, 'r') as f:
                    contract_data = json.load(f)
                    self.contract_abi = contract_data.get("abi")
                    self.contract_address = contract_data.get("address")
                    logger.info(f"Loaded contract at address: {self.contract_address}")
            else:
                logger.warning("Contract file not found. Deploy contracts first.")
        except Exception as e:
            logger.error(f"Failed to load contract info: {e}")

    def is_available(self) -> bool:
        """Check if blockchain service is available"""
        return (
            self.web3 is not None 
            and self.web3.is_connected() 
            and self.contract_address is not None 
            and self.contract_abi is not None
            and self.account is not None
        )

    def deploy_contracts(self) -> bool:
        """Deploy smart contracts using Hardhat"""
        try:
            # Run hardhat deployment script
            contracts_dir = Path(__file__).parent.parent.parent / "contracts"
            result = subprocess.run(
                ["npm", "run", "deploy:local"],
                cwd=contracts_dir,
                capture_output=True,
                text=True
            )
            
            if result.returncode == 0:
                logger.info("Contracts deployed successfully")
                self._load_contract_info()  # Reload contract info
                return True
            else:
                logger.error(f"Contract deployment failed: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"Failed to deploy contracts: {e}")
            return False

    def mint_item_nft(
        self,
        owner_address: str,
        item_id: str,
        title: str,
        description: str = "",
        model: str = "",
        certificate: str = "",
        images: str = "",
        metadata_uri: str = ""
    ) -> Optional[Dict[str, Any]]:
        """Mint an NFT for an item"""
        
        if not self.is_available():
            logger.error("Blockchain service not available")
            return None

        try:
            # Create contract instance
            contract = self.web3.eth.contract(
                address=self.contract_address,
                abi=self.contract_abi
            )

            # Get the recipient's current token balance to predict the next token ID
            predicted_token_id = None
            try:
                # The next token ID will be the current balance of the recipient
                current_balance = contract.functions.balanceOf(owner_address).call()
                predicted_token_id = current_balance  # Next token will have this ID
                logger.info(f"Predicted token ID based on balance: {predicted_token_id}")
            except Exception as e:
                logger.debug(f"Failed to get balance for token ID prediction: {e}")
        
            # Build transaction
            transaction = contract.functions.mintItemNFT(
                owner_address,
                item_id,
                title,
                description,
                model,
                certificate,
                images,
                metadata_uri
            ).build_transaction({
                'from': self.account.address,
                'gas': 500000,
                'gasPrice': self.web3.to_wei('20', 'gwei'),
                'nonce': self.web3.eth.get_transaction_count(self.account.address)
            })

            # Sign and send transaction
            signed_txn = self.web3.eth.account.sign_transaction(transaction, self.private_key)
            # Handle different Web3.py versions (rawTransaction vs raw_transaction)
            raw_tx = getattr(signed_txn, 'raw_transaction', getattr(signed_txn, 'rawTransaction', None))
            if raw_tx is None:
                raise AttributeError("Could not find raw transaction data in signed transaction")
            tx_hash = self.web3.eth.send_raw_transaction(raw_tx)
            
            # Wait for transaction receipt
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            if receipt.status == 1:
                # Parse logs to get token ID
                token_id = None
                
                # Debug: Log all transaction logs
                logger.info(f"Transaction receipt has {len(receipt.logs)} logs")
                for i, log in enumerate(receipt.logs):
                    logger.info(f"Log {i}: address={log.address}, topics={[t.hex() for t in log.topics]}, data={log.data.hex()}")
                
                # Method 1: Try to parse ItemNFTMinted event
                for log in receipt.logs:
                    try:
                        decoded_log = contract.events.ItemNFTMinted().process_log(log)
                        token_id = decoded_log['args']['tokenId']
                        logger.info(f"Extracted token ID from ItemNFTMinted event: {token_id}")
                        break
                    except Exception as e:
                        logger.debug(f"Failed to parse ItemNFTMinted event on log {log.address}: {e}")
                        continue
                
                # Method 2: If event parsing failed, try to parse Transfer event (ERC721 standard)
                if token_id is None:
                    logger.warning("ItemNFTMinted event parsing failed, trying Transfer event...")
                    for log in receipt.logs:
                        try:
                            # Transfer event has signature: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
                            if len(log.topics) >= 4 and log.topics[0].hex() == '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef':
                                # Extract tokenId from the 4th topic (index 3)
                                token_id = int(log.topics[3].hex(), 16)
                                logger.info(f"Extracted token ID from Transfer event: {token_id}")
                                break
                        except Exception as e:
                            logger.debug(f"Failed to parse Transfer event: {e}")
                            continue
                
                # Method 3: Use the predicted token ID from the call() simulation
                if token_id is None:
                    logger.warning("Event parsing methods failed, using predicted token ID...")
                    if predicted_token_id is not None:
                        token_id = predicted_token_id
                        logger.info(f"Using predicted token ID: {token_id}")
                    else:
                        logger.error("All token ID extraction methods failed")
                
                logger.info(f"NFT minted successfully. Token ID: {token_id}, TX: {tx_hash.hex()}")
                
                return {
                    "success": True,
                    "token_id": token_id,
                    "transaction_hash": tx_hash.hex(),
                    "contract_address": self.contract_address,
                    "block_number": receipt.blockNumber
                }
            else:
                logger.error(f"Transaction failed: {tx_hash.hex()}")
                return None

        except Exception as e:
            logger.error(f"Failed to mint NFT: {e}")
            return None

    def get_nft_metadata(self, token_id: int) -> Optional[Dict[str, Any]]:
        """Get NFT metadata from contract"""
        
        if not self.is_available():
            return None

        try:
            contract = self.web3.eth.contract(
                address=self.contract_address,
                abi=self.contract_abi
            )
            
            metadata = contract.functions.getItemMetadata(token_id).call()
            
            return {
                "item_id": metadata[0],
                "title": metadata[1],
                "description": metadata[2],
                "model": metadata[3],
                "certificate": metadata[4],
                "images": metadata[5],
                "creator": metadata[6],
                "created_at": metadata[7]
            }
            
        except Exception as e:
            logger.error(f"Failed to get NFT metadata: {e}")
            return None
    def _get_network_config(self):
        """Get network-specific configuration"""
        network = os.getenv("ETHEREUM_NETWORK", "localhost")
        
        configs = {
            "localhost": {
                "rpc_url": "http://localhost:8545",
                "chain_id": 31337,
                "gas_limit": 3000000,
                "gas_price": 20000000000
            },
            "sepolia": {
                "rpc_url": os.getenv("ETHEREUM_RPC_URL", "https://sepolia.infura.io/v3/YOUR_KEY"),
                "chain_id": 11155111,
                "gas_limit": 3000000,
                "gas_price": 20000000000
            },
            "goerli": {
                "rpc_url": os.getenv("ETHEREUM_RPC_URL", "https://goerli.infura.io/v3/YOUR_KEY"),
                "chain_id": 5,
                "gas_limit": 3000000,
                "gas_price": 20000000000
            }
        }
        
        return configs.get(network, configs["localhost"])
    
    def get_account_balance(self) -> float:
        """Get account balance in ETH"""
        if not self.is_available():
            return 0.0
        
        try:
            balance_wei = self.web3.eth.get_balance(self.account.address)
            balance_eth = self.web3.from_wei(balance_wei, 'ether')
            return float(balance_eth)
        except Exception as e:
            logger.error(f"Failed to get account balance: {e}")
            return 0.0
    
    def fund_account_from_faucet_info(self) -> dict:
        """Get information about funding the account"""
        network = os.getenv("ETHEREUM_NETWORK", "localhost")
        
        faucets = {
            "sepolia": [
                "https://sepoliafaucet.com/",
                "https://faucet.sepolia.dev/"
            ],
            "goerli": [
                "https://goerlifaucet.com/",
                "https://faucet.goerli.mudit.blog/"
            ],
            "localhost": ["No faucet needed - Hardhat provides 10,000 ETH automatically"]
        }
        
        return {
            "network": network,
            "address": self.account.address if self.account else None,
            "balance": self.get_account_balance(),
            "faucets": faucets.get(network, [])
        }


# Global instance
blockchain_service = BlockchainService()
