#!/bin/bash

# NFT Integration Testing Script
set -e

echo "🧪 Testing NFT Integration End-to-End"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Test configuration
API_BASE="http://localhost:8000/api/v1"
BLOCKCHAIN_URL="http://localhost:8545"

echo "🔍 Running pre-flight checks..."

# Check if services are running
services=("db:5432" "backend:8000" "blockchain:8545")
for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -s "http://localhost:$port" > /dev/null 2>&1 || nc -z localhost "$port" 2>/dev/null; then
        print_status "$name service is running on port $port"
    else
        print_error "$name service not accessible on port $port"
        echo "Please run: docker-compose up -d"
        exit 1
    fi
done

# Check if contracts are deployed
if [ ! -f "backend/contracts/ItemNFT.json" ]; then
    print_error "Contracts not deployed. Run: ./scripts/deploy-contracts.sh"
    exit 1
fi

print_status "All services are running and contracts are deployed"

echo ""
echo "🧪 Running Integration Tests..."

# Test 1: Check blockchain service health
echo "Test 1: Blockchain Service Health"
if curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  "$BLOCKCHAIN_URL" | grep -q "result"; then
    print_status "Blockchain service responding to RPC calls"
else
    print_error "Blockchain service not responding properly"
fi

# Test 2: Backend can connect to blockchain
echo ""
echo "Test 2: Backend Blockchain Connection"
# This would require a test endpoint in the backend
print_info "Manual test: Check backend logs for blockchain connection status"

# Test 3: Create item with NFT (requires authentication)
echo ""
echo "Test 3: Item Creation with NFT"
print_info "This requires manual testing through the frontend or API with authentication"
print_info "Steps to test manually:"
echo "  1. Login to your application"
echo "  2. Create a new item through the frontend"
echo "  3. Check backend logs for NFT minting activity"
echo "  4. Verify item has NFT fields populated in database"

# Test 4: Database migration check
echo ""
echo "Test 4: Database Schema"
print_info "Checking if NFT fields exist in Item table..."
# This would require database connection
print_warning "Manual check: Verify Item table has NFT columns (nft_token_id, nft_contract_address, etc.)"

echo ""
echo "📋 Manual Testing Checklist:"
echo "□ Create user account and login"
echo "□ Create item with is_nft_enabled=true"
echo "□ Check backend logs for NFT minting"
echo "□ Verify item.nft_token_id is populated"
echo "□ Check blockchain explorer/logs for transaction"
echo "□ Test item creation with is_nft_enabled=false"
echo "□ Test graceful failure when blockchain is down"

echo ""
print_status "Integration test setup complete!"
echo "💡 For detailed testing, use the frontend or API endpoints with proper authentication"
