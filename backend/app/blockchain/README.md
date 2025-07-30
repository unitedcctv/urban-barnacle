# Backend Blockchain Module

This module provides Python integration with Ethereum smart contracts for the Urban Barnacle project.

## Overview

The backend blockchain module serves as the bridge between the FastAPI backend and the blockchain infrastructure, enabling NFT minting, metadata management, and smart contract interactions.

## Architecture

- **Containerized Communication**: Connects to the blockchain service via Docker network (`blockchain:8545`)
- **Web3 Integration**: Uses Web3.py for Ethereum blockchain interactions
- **Smart Contract Management**: Handles NFT minting and metadata operations
- **Account Management**: Manages Ethereum accounts and transactions

## Files

### Core Components

- **`blockchain_service.py`** - Main service class for all blockchain operations
- **`__init__.py`** - Module initialization and exports

### Development Tools

- **`generate_test_account.py`** - Generates Ethereum test accounts for development
- **`setup_blockchain_dev.py`** - Sets up blockchain development environment
- **`test_blockchain_setup.py`** - Tests blockchain configuration and connectivity

## BlockchainService Class

The main `BlockchainService` class provides the following functionality:

### Initialization
- Connects to blockchain service (Docker: `blockchain:8545`, Local: `localhost:8545`)
- Loads private key from environment variables
- Initializes Web3 connection with PoA middleware for local development
- Loads smart contract ABI and address from deployment files

### Core Methods

#### Connection Management
- `is_available()` - Check if blockchain service is ready
- `_initialize_web3()` - Initialize Web3 connection
- `_load_contract_info()` - Load contract deployment information

#### Smart Contract Operations
- `deploy_contracts()` - Deploy smart contracts using Hardhat
- `mint_item_nft()` - Mint NFTs for items with metadata
- `get_nft_metadata()` - Retrieve NFT metadata from blockchain

#### Account Management
- `get_account_balance()` - Get account balance in ETH
- `fund_account_from_faucet_info()` - Get faucet information for funding

#### Network Configuration
- `_get_network_config()` - Get network-specific settings (localhost, Sepolia, Goerli)

## Usage

### Basic Usage

```python
from app.blockchain import BlockchainService

# Global instance (automatically initialized)
from app.blockchain.blockchain_service import blockchain_service

# Check if service is available
if blockchain_service.is_available():
    # Mint an NFT
    result = blockchain_service.mint_item_nft(
        owner_address="0x...",
        item_id="item-123",
        title="3D Model",
        description="A beautiful 3D model",
        model="model.glb",
        certificate="cert.pdf",
        images="image1.jpg,image2.jpg"
    )
    
    if result and result["success"]:
        token_id = result["token_id"]
        print(f"NFT minted with token ID: {token_id}")
```

### Environment Configuration

Required environment variables:

```bash
# Blockchain connection
WEB3_URL=http://blockchain:8545  # Docker network
PRIVATE_KEY=0x...                # Ethereum private key

# Network selection
ETHEREUM_NETWORK=localhost       # localhost, sepolia, goerli
ETHEREUM_RPC_URL=https://...     # For testnets
```

## Development Setup

### 1. Generate Test Account

```bash
python -m app.blockchain.generate_test_account
```

### 2. Setup Development Environment

```bash
python -m app.blockchain.setup_blockchain_dev
```

### 3. Test Configuration

```bash
python -m app.blockchain.test_blockchain_setup
```

## Smart Contract Integration

### NFT Metadata Structure

The service handles NFT metadata with the following structure:

```python
{
    "item_id": "unique-item-identifier",
    "title": "Item title",
    "description": "Item description",
    "model": "3D model file path",
    "certificate": "Certificate file path",
    "images": "Comma-separated image paths",
    "creator": "0x... (Ethereum address)",
    "created_at": "timestamp"
}
```

### Transaction Results

Successful operations return:

```python
{
    "success": True,
    "token_id": 123,
    "transaction_hash": "0x...",
    "contract_address": "0x...",
    "block_number": 12345
}
```

## Network Support

### Localhost Development
- **Chain ID**: 31337
- **RPC URL**: `http://localhost:8545` or `http://blockchain:8545`
- **Funding**: Hardhat provides 10,000 ETH automatically

### Sepolia Testnet
- **Chain ID**: 11155111
- **Faucets**: 
  - https://sepoliafaucet.com/
  - https://faucet.sepolia.dev/

### Goerli Testnet
- **Chain ID**: 5
- **Faucets**:
  - https://goerlifaucet.com/
  - https://faucet.goerli.mudit.blog/

## Error Handling

The service includes comprehensive error handling:

- Connection failures are logged and gracefully handled
- Transaction failures return detailed error information
- Missing contract deployments are detected and reported
- Account funding issues are identified with faucet information

## Logging

All blockchain operations are logged using Python's logging module:

```python
import logging
logger = logging.getLogger(__name__)
```

Logs include:
- Connection status
- Transaction hashes
- Error details
- Account information (addresses only, never private keys)

## Security Considerations

- **Private Keys**: Never logged or exposed in responses
- **Environment Variables**: Sensitive data stored in environment variables
- **Network Isolation**: Service runs in isolated Docker container
- **Transaction Validation**: All transactions are validated before execution

## Integration with FastAPI

The blockchain service integrates with the FastAPI backend through:

1. **Item Creation**: Automatically mint NFTs when items are created
2. **Payment Processing**: Mint NFTs after successful Stripe payments
3. **Metadata Retrieval**: Provide blockchain-verified item metadata
4. **Ownership Verification**: Verify NFT ownership for access control
