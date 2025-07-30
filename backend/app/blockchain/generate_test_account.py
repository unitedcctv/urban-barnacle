#!/usr/bin/env python3
"""
Generate Ethereum test account for development and staging environments.
This script creates a new Ethereum account with private key and address.
"""

import os
import json
from eth_account import Account
from pathlib import Path

def generate_test_account():
    """Generate a new Ethereum test account"""
    # Enable unaudited HD wallet features (for development only)
    Account.enable_unaudited_hdwallet_features()
    
    # Generate a new account
    account = Account.create()
    
    return {
        'address': account.address,
        'private_key': account.key.hex(),
        'public_key': account._key_obj.public_key.to_hex()
    }

def save_account_info(account_info, env_type='dev'):
    """Save account information to files"""
    
    # Create accounts directory if it doesn't exist
    accounts_dir = Path(__file__).parent.parent.parent.parent / "accounts"
    accounts_dir.mkdir(exist_ok=True)
    
    # Save to JSON file
    account_file = accounts_dir / f"{env_type}_account.json"
    with open(account_file, 'w') as f:
        json.dump({
            'address': account_info['address'],
            'private_key': account_info['private_key'],
            'created_at': str(Path(__file__).stat().st_mtime),
            'env_type': env_type
        }, f, indent=2)
    
    # Create .env template
    env_template = f"""
# Ethereum Test Account for {env_type.upper()} Environment
ETHEREUM_PRIVATE_KEY={account_info['private_key']}
ETHEREUM_ADDRESS={account_info['address']}

# Add this to your .env file for {env_type} environment
"""
    
    env_file = accounts_dir / f"{env_type}_env_template.txt"
    with open(env_file, 'w') as f:
        f.write(env_template)
    
    print(f"✅ {env_type.upper()} Account generated successfully!")
    print(f"📁 Account info saved to: {account_file}")
    print(f"📄 Env template saved to: {env_file}")
    print(f"🔑 Address: {account_info['address']}")
    print(f"🔐 Private Key: {account_info['private_key']}")
    
    return account_file

def print_funding_instructions(address):
    """Print instructions for funding the test account"""
    print("\n" + "="*80)
    print("💰 FUNDING INSTRUCTIONS")
    print("="*80)
    print(f"Account Address: {address}")
    print("\n📋 To fund this account with test ETH:")
    print("\n1. LOCAL DEVELOPMENT (Hardhat Network):")
    print("   - Hardhat provides 10,000 ETH automatically")
    print("   - No manual funding needed for local testing")
    
    print("\n2. SEPOLIA TESTNET (Recommended for staging):")
    print("   - Visit: https://sepoliafaucet.com/")
    print("   - Or: https://faucet.sepolia.dev/")
    print("   - Enter your address and request test ETH")
    
    print("\n3. GOERLI TESTNET (Alternative):")
    print("   - Visit: https://goerlifaucet.com/")
    print("   - Or: https://faucet.goerli.mudit.blog/")
    print("   - Enter your address and request test ETH")
    
    print("\n4. MUMBAI TESTNET (Polygon):")
    print("   - Visit: https://faucet.polygon.technology/")
    print("   - Select Mumbai network")
    print("   - Enter your address and request test MATIC")
    
    print("\n⚠️  SECURITY NOTES:")
    print("   - NEVER use these accounts on mainnet")
    print("   - Keep private keys secure and never commit to git")
    print("   - Use different accounts for dev and staging")
    print("   - Rotate accounts periodically")

def main():
    """Main function to generate test accounts"""
    print("🚀 Generating Ethereum Test Accounts")
    print("="*50)
    
    # Generate development account
    dev_account = generate_test_account()
    dev_file = save_account_info(dev_account, 'dev')
    
    print("\n" + "-"*50)
    
    # Generate staging account
    staging_account = generate_test_account()
    staging_file = save_account_info(staging_account, 'staging')
    
    # Print funding instructions
    print_funding_instructions(dev_account['address'])
    
    print("\n" + "="*80)
    print("📝 NEXT STEPS:")
    print("="*80)
    print("1. Add the private keys to your .env files:")
    print("   - .env.development")
    print("   - .env.staging")
    print("\n2. Fund the accounts using the faucets above")
    print("\n3. Update your blockchain_service.py configuration")
    print("\n4. Test contract deployment with the new accounts")
    
    print(f"\n✅ Test accounts ready for development!")

if __name__ == "__main__":
    main()
