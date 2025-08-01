#!/usr/bin/env python3
"""
Setup blockchain development environment with test accounts.
This script configures the blockchain service for development and staging.
"""

import os
import json
import subprocess
import sys
from pathlib import Path

def install_dependencies():
    """Install required Python packages for blockchain development"""
    print("📦 Installing blockchain dependencies...")
    
    packages = [
        "eth-account>=0.8.0",
        "web3>=6.0.0",
        "eth-utils>=2.0.0"
    ]
    
    for package in packages:
        try:
            subprocess.run([sys.executable, "-m", "pip", "install", package], 
                         check=True, capture_output=True)
            print(f"✅ Installed {package}")
        except subprocess.CalledProcessError as e:
            print(f"❌ Failed to install {package}: {e}")
            return False
    
    return True

def create_env_files():
    """Create environment files with blockchain configuration"""
    project_root = Path(__file__).parent.parent.parent.parent
    
    # Development environment
    dev_env_content = """
# Development Environment - Blockchain Configuration
ETHEREUM_NETWORK=localhost
ETHEREUM_RPC_URL=http://localhost:8545
ETHEREUM_CHAIN_ID=31337

# Test account (generated by generate_test_account.py)
# Replace with your generated private key
ETHEREUM_PRIVATE_KEY=your_dev_private_key_here
ETHEREUM_ADDRESS=your_dev_address_here

# Contract deployment
CONTRACT_DEPLOY_GAS_LIMIT=3000000
CONTRACT_DEPLOY_GAS_PRICE=20000000000

# Blockchain service settings
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_AUTO_DEPLOY=true
"""

    # Staging environment
    staging_env_content = """
# Staging Environment - Blockchain Configuration
ETHEREUM_NETWORK=sepolia
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
ETHEREUM_CHAIN_ID=11155111

# Test account (generated by generate_test_account.py)
# Replace with your generated private key
ETHEREUM_PRIVATE_KEY=your_staging_private_key_here
ETHEREUM_ADDRESS=your_staging_address_here

# Contract deployment
CONTRACT_DEPLOY_GAS_LIMIT=3000000
CONTRACT_DEPLOY_GAS_PRICE=20000000000

# Blockchain service settings
BLOCKCHAIN_ENABLED=true
BLOCKCHAIN_AUTO_DEPLOY=false
"""

    # Write environment files
    env_files = [
        (project_root / ".env.development", dev_env_content),
        (project_root / ".env.staging", staging_env_content)
    ]
    
    for env_file, content in env_files:
        if not env_file.exists():
            with open(env_file, 'w') as f:
                f.write(content)
            print(f"✅ Created {env_file}")
        else:
            print(f"ℹ️  {env_file} already exists, skipping...")

def update_blockchain_service():
    """Update blockchain_service.py with improved configuration"""
    service_file = Path(__file__).parent / "blockchain_service.py"
    
    if not service_file.exists():
        print(f"❌ blockchain_service.py not found at {service_file}")
        return False
    
    # Read current content
    with open(service_file, 'r') as f:
        content = f.read()
    
    # Add improved configuration section
    config_addition = '''
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
'''
    
    # Check if the methods already exist
    if "_get_network_config" not in content:
        # Find a good place to insert (before the last class method)
        insertion_point = content.rfind("    def ")
        if insertion_point != -1:
            # Find the end of the last method
            next_class_or_end = content.find("\n\nclass", insertion_point)
            if next_class_or_end == -1:
                next_class_or_end = content.find("\n\n# ", insertion_point)
            if next_class_or_end == -1:
                next_class_or_end = len(content)
            
            # Insert the new methods
            updated_content = (content[:next_class_or_end] + 
                             config_addition + 
                             content[next_class_or_end:])
            
            # Write back to file
            with open(service_file, 'w') as f:
                f.write(updated_content)
            
            print("✅ Updated blockchain_service.py with network configuration")
        else:
            print("⚠️  Could not find insertion point in blockchain_service.py")
    else:
        print("ℹ️  blockchain_service.py already has network configuration")
    
    return True

def create_test_script():
    """Create a test script to verify blockchain setup"""
    test_script = Path(__file__).parent / "test_blockchain_setup.py"
    
    test_content = '''#!/usr/bin/env python3
"""
Test blockchain setup and account configuration.
"""

import os
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from app.blockchain.blockchain_service import BlockchainService

def test_blockchain_setup():
    """Test blockchain service setup"""
    print("🧪 Testing Blockchain Setup")
    print("="*50)
    
    # Initialize service
    service = BlockchainService()
    
    # Check availability
    print(f"Service Available: {'✅' if service.is_available() else '❌'}")
    
    if service.account:
        print(f"Account Address: {service.account.address}")
        balance = service.get_account_balance()
        print(f"Account Balance: {balance} ETH")
        
        if balance == 0:
            print("⚠️  Account has no balance!")
            funding_info = service.fund_account_from_faucet_info()
            print("💰 Funding Information:")
            print(f"   Network: {funding_info['network']}")
            print(f"   Faucets: {funding_info['faucets']}")
    else:
        print("❌ No account configured")
    
    # Test Web3 connection
    if service.web3:
        try:
            block_number = service.web3.eth.block_number
            print(f"Connected to blockchain - Block: {block_number}")
        except Exception as e:
            print(f"❌ Connection failed: {e}")
    
    print("\\n✅ Test completed!")

if __name__ == "__main__":
    test_blockchain_setup()
'''
    
    with open(test_script, 'w') as f:
        f.write(test_content)
    
    # Make executable
    os.chmod(test_script, 0o755)
    print(f"✅ Created test script: {test_script}")

def main():
    """Main setup function"""
    print("🔧 Setting up Blockchain Development Environment")
    print("="*60)
    
    # Install dependencies
    if not install_dependencies():
        print("❌ Failed to install dependencies")
        return
    
    # Create environment files
    create_env_files()
    
    # Update blockchain service
    update_blockchain_service()
    
    # Create test script
    create_test_script()
    
    print("\\n" + "="*60)
    print("✅ Blockchain development environment setup complete!")
    print("="*60)
    print("\\n📋 Next Steps:")
    print("1. Run: python scripts/generate_test_account.py")
    print("2. Update .env.development and .env.staging with generated keys")
    print("3. Fund your accounts using the provided faucet links")
    print("4. Run: python scripts/test_blockchain_setup.py")
    print("5. Start developing your smart contracts!")
    
    print("\\n💡 Tips:")
    print("- Use localhost for development (free, fast)")
    print("- Use Sepolia for staging (most reliable testnet)")
    print("- Keep private keys secure and never commit them")
    print("- Monitor your test ETH balance regularly")

if __name__ == "__main__":
    main()
