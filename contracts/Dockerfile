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

# Default command - can be overridden
CMD ["npm", "run", "node"]
