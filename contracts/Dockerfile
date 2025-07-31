FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy contract files
COPY . .

# Compile contracts
RUN npm run compile

# Expose port for Hardhat node
EXPOSE 8545

# Health check for blockchain availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8545 -X POST -H "Content-Type: application/json" \
      --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' || exit 1

# Default command - run Hardhat node
CMD ["npm", "run", "node"]
