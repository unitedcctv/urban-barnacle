#!/bin/bash

# Local Development Setup Script for NFT Integration
set -e

echo "🚀 Setting up Urban Barnacle NFT Development Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

print_status "Docker is running"

# Install contract dependencies
echo "📦 Installing contract dependencies..."
cd contracts
if [ ! -d "node_modules" ]; then
    npm install
    print_status "Contract dependencies installed"
else
    print_status "Contract dependencies already installed"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd ../backend
if [ ! -d ".venv" ]; then
    uv sync
    print_status "Backend dependencies installed"
else
    print_status "Backend dependencies already installed"
fi

cd ..

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    print_warning "Creating .env file from template"
    cp .env.example .env 2>/dev/null || echo "No .env.example found, please create .env manually"
fi

# Add blockchain-specific environment variables
echo "🔧 Configuring blockchain environment..."
if ! grep -q "WEB3_URL" .env; then
    echo "" >> .env
    echo "# Blockchain Configuration" >> .env
    echo "WEB3_URL=http://localhost:8545" >> .env
    echo "PRIVATE_KEY=" >> .env
    print_status "Added blockchain environment variables to .env"
fi

echo ""
echo "🎯 Next steps for testing:"
echo "1. Start services with hot reload: docker compose -f docker-compose.yml -f docker-compose.dev.yml watch"
echo "   (Or detached mode: docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d)"
echo "2. Deploy contracts: ./scripts/deploy-contracts.sh"
echo "3. Run tests: ./scripts/test-nft-integration.sh"
echo ""
echo "💡 Development URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   Adminer (DB): http://localhost:8080"
echo "   Mailcatcher: http://localhost:1080"
echo "   Traefik Dashboard: http://localhost:8090"
echo "   Blockchain RPC: http://localhost:8545"
echo ""
print_status "Development environment setup complete!"
