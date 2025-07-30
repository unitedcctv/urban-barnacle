#!/usr/bin/env python3
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
    
    print("\n✅ Test completed!")

if __name__ == "__main__":
    test_blockchain_setup()
