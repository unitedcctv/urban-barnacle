#!/bin/bash

echo "🔧 Urban Barnacle - Contract Fix Script"
echo "======================================="

# Check if blockchain is running
echo "📡 Checking blockchain connection..."
if ! curl -s -X POST "http://localhost:8545" -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null; then
    echo "❌ Blockchain not running on localhost:8545"
    echo "   Please start containers first: docker-compose up"
    exit 1
fi

echo "✅ Blockchain is running"

# Deploy contracts
echo "📄 Deploying contracts..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_ROOT="$(dirname "$CONTRACTS_DIR")"

# Change to contracts directory
cd "$CONTRACTS_DIR"
npm run deploy:local

if [ $? -eq 0 ]; then
    echo "✅ Contracts deployed successfully"
    
    # Check if contract file was created
    if [ -f "$PROJECT_ROOT/backend/app/blockchain/contracts/ItemNFT.json" ]; then
        echo "✅ Contract file saved to backend"
        
        # Extract contract address for verification
        CONTRACT_ADDRESS=$(grep -o '"address": "[^"]*"' "$PROJECT_ROOT/backend/app/blockchain/contracts/ItemNFT.json" | cut -d'"' -f4)
        echo "📍 Contract deployed at: $CONTRACT_ADDRESS"
        
        # Verify contract exists on blockchain
        echo "🔍 Verifying contract deployment..."
        RESULT=$(curl -s -X POST "http://localhost:8545" -H "Content-Type: application/json" --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$CONTRACT_ADDRESS\",\"latest\"],\"id\":1}" | grep -o '"result":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$RESULT" != "0x" ] && [ ${#RESULT} -gt 10 ]; then
            echo "✅ Contract verified on blockchain"
            echo ""
            echo "🎉 SUCCESS! Contract deployment complete"
            echo "   Contract Address: $CONTRACT_ADDRESS"
            echo "   Backend will automatically load this contract"
            echo ""
            echo "🔄 Please restart your backend service to load the new contract:"
            echo "   1. Stop backend (Ctrl+C)"
            echo "   2. Start backend again"
            echo "   3. Test NFT minting"
        else
            echo "❌ Contract not found on blockchain"
            exit 1
        fi
    else
        echo "❌ Contract file not created in backend directory"
        exit 1
    fi
else
    echo "❌ Contract deployment failed"
    exit 1
fi
