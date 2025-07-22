#!/bin/bash

# Contract Deployment Script for Local Development
set -e

echo "📋 Deploying Smart Contracts for Local Development"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if blockchain service is running
echo "🔍 Checking blockchain service..."
if ! curl -s http://localhost:8545 > /dev/null; then
    print_error "Blockchain service not accessible at localhost:8545"
    echo "Please run: docker-compose up -d blockchain"
    exit 1
fi

print_status "Blockchain service is running"

# Wait a bit for the service to be fully ready
sleep 2

# Deploy contracts
echo "🚀 Deploying contracts..."
cd contracts

# Compile contracts first
echo "🔨 Compiling contracts..."
npm run compile
print_status "Contracts compiled"

# Deploy to local network
echo "📤 Deploying to local network..."
npm run deploy:local

if [ $? -eq 0 ]; then
    print_status "Contracts deployed successfully!"
    
    # Show deployment info
    if [ -f "deployments/ItemNFT-localhost.json" ]; then
        echo ""
        echo "📄 Deployment Information:"
        cat deployments/ItemNFT-localhost.json | jq '.'
    fi
    
    # Check if backend contracts directory exists
    if [ -d "../backend/contracts" ]; then
        print_status "Contract ABI copied to backend"
    else
        print_warning "Backend contracts directory not found"
    fi
    
else
    print_error "Contract deployment failed"
    exit 1
fi

cd ..

echo ""
print_status "Contract deployment complete! Ready for testing."
