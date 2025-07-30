# Blockchain Contracts

This directory contains the blockchain infrastructure for the Urban Barnacle project.

## Overview

The blockchain service is containerized and runs independently from the main backend API, following microservices architecture principles.

## Structure

- `contracts/` - Smart contract source files
- `scripts/` - Deployment and utility scripts
- `hardhat.config.js` - Hardhat configuration
- `package.json` - Node.js dependencies
- `Dockerfile` - Container configuration

## Architecture

The blockchain service:
- Runs in its own Docker container
- Communicates with the backend via Docker network
- Uses Hardhat for development and testing
- Exposes port 8545 for JSON-RPC connections

## Development

### Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start local blockchain:
   ```bash
   npx hardhat node
   ```

3. Deploy contracts:
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Docker Development

The blockchain service is automatically started with the main application:

```bash
docker-compose up blockchain
```

## Configuration

- **Network**: Configured to run on port 8545
- **Persistence**: Blockchain data and artifacts are stored in Docker volumes
- **Health Checks**: Container includes health checks for reliability

## Integration

The Python backend connects to the blockchain service via:
- Service name: `blockchain:8545` (in Docker network)
- Local development: `localhost:8545`

## Features

- Smart contract deployment and management
- Transaction processing
- Event monitoring
- Integration with FastAPI backend

## Security

- Private keys and sensitive data are managed through environment variables
- Network isolation through Docker containers
- Proper access controls for production deployments
