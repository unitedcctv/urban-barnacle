#!/usr/bin/env python3
"""
Debug script to check blockchain service status
"""
import os
import sys
from pathlib import Path

# Load environment variables first, before importing anything else
try:
    from dotenv import load_dotenv
    
    # Find the project root by looking for .env file
    current_dir = Path(__file__).parent
    project_root = None
    
    # Search up the directory tree for .env file
    for parent in [current_dir, current_dir.parent, current_dir.parent.parent]:
        env_file = parent / ".env"
        if env_file.exists():
            project_root = parent
            break
    
    if project_root:
        env_path = project_root / ".env"
        load_dotenv(env_path)
        print(f"Loaded environment variables from {env_path}")
    else:
        print("Warning: .env file not found")
except ImportError:
    print("python-dotenv not installed, skipping .env file loading")

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.blockchain.blockchain_service import blockchain_service

def debug_blockchain_service():
    print("=== Blockchain Service Debug ===")
    print()
    
    # Check environment variables
    print("1. Environment Variables:")
    web3_url = os.getenv("WEB3_URL", "http://blockchain:8545")
    private_key = os.getenv("ETHEREUM_PRIVATE_KEY")
    print(f"   WEB3_URL: {web3_url}")
    print(f"   PRIVATE_KEY: {'✓ Set' if private_key else '✗ Not set'}")
    print()
    
    # Check Web3 connection
    print("2. Web3 Connection:")
    if blockchain_service.web3:
        try:
            is_connected = blockchain_service.web3.is_connected()
            print(f"   Web3 instance: ✓ Created")
            print(f"   Connection: {'✓ Connected' if is_connected else '✗ Not connected'}")
            if is_connected:
                try:
                    block_number = blockchain_service.web3.eth.block_number
                    print(f"   Latest block: {block_number}")
                except Exception as e:
                    print(f"   Block fetch error: {e}")
        except Exception as e:
            print(f"   Connection error: {e}")
    else:
        print("   Web3 instance: ✗ Not created")
    print()
    
    # Check account
    print("3. Account:")
    if blockchain_service.account:
        print(f"   Account: ✓ {blockchain_service.account.address}")
        if blockchain_service.web3 and blockchain_service.web3.is_connected():
            try:
                balance = blockchain_service.web3.eth.get_balance(blockchain_service.account.address)
                balance_eth = blockchain_service.web3.from_wei(balance, 'ether')
                print(f"   Balance: {balance_eth} ETH")
            except Exception as e:
                print(f"   Balance check error: {e}")
    else:
        print("   Account: ✗ Not loaded")
    print()
    
    # Check contract info
    print("4. Contract Information:")
    contract_file = Path(__file__).parent / "app" / "blockchain" / "contracts" / "ItemNFT.json"
    print(f"   Contract file path: {contract_file}")
    print(f"   Contract file exists: {'✓' if contract_file.exists() else '✗'}")
    print(f"   Contract address: {'✓ ' + str(blockchain_service.contract_address) if blockchain_service.contract_address else '✗ Not loaded'}")
    print(f"   Contract ABI: {'✓ Loaded' if blockchain_service.contract_abi else '✗ Not loaded'}")
    print()
    
    # Overall availability
    print("5. Service Availability:")
    is_available = blockchain_service.is_available()
    print(f"   Overall status: {'✓ Available' if is_available else '✗ Not available'}")
    print()
    
    # Recommendations
    if not is_available:
        print("6. Troubleshooting Steps:")
        if not blockchain_service.web3:
            print("   • Web3 not initialized - check WEB3_URL and blockchain service")
        elif not blockchain_service.web3.is_connected():
            print("   • Web3 not connected - ensure blockchain service is running")
        if not blockchain_service.account:
            print("   • Account not loaded - set PRIVATE_KEY environment variable")
        if not blockchain_service.contract_address or not blockchain_service.contract_abi:
            print("   • Contract not deployed - run contract deployment")
            print("   • Try: cd contracts && npm run deploy:local")
        print()

if __name__ == "__main__":
    debug_blockchain_service()
