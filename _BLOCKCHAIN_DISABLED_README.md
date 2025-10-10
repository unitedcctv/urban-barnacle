# Blockchain/NFT Certificate Functionality - Temporarily Disabled

## Overview

The blockchain/NFT certificate creation functionality has been temporarily disabled. **No code was removed** - everything is commented out and can be easily re-enabled when needed.

## What Was Disabled

### 1. Docker Services
**Files:** `docker-compose.yml`, `docker-compose.override.yml`

- ✅ `blockchain` container (Hardhat node) - commented out
- ✅ `hardhat-console` development tool - commented out  
- ✅ Backend dependency on blockchain service - removed
- ✅ `BLOCKCHAIN_ENABLED` environment variable set to `false`

**To re-enable:**
1. Uncomment the `blockchain` and `hardhat-console` services
2. Uncomment the blockchain dependency in backend service
3. Set `BLOCKCHAIN_ENABLED: "true"`

### 2. Frontend UI Components
**Files:**
- `frontend/src/routes/_layout/createitem.tsx`
- `frontend/src/components/Items/EditItem.tsx`

**Disabled Features:**
- ✅ "Mint NFT" button on create item page
- ✅ "View NFT Details" button
- ✅ NFT token details modal
- ✅ ETH balance checking
- ✅ Auto-funding in development
- ✅ NFT success/balance alerts

**To re-enable:**
1. Uncomment all sections marked with `TODO: Blockchain/NFT certificate functionality temporarily disabled`
2. Uncomment the related imports (Modal, Alert, useDisclosure, etc.)
3. Uncomment state variables and functions

### 3. Code Structure

All disabled code is marked with clear TODO comments:
```typescript
// TODO: Blockchain/NFT certificate functionality temporarily disabled
// Re-enable when blockchain features are needed again
```

## Current System Status

### Running Services ✅
- Backend API (port 8000)
- Frontend (port 5173)
- PostgreSQL Database
- Traefik Proxy
- Adminer (database admin)
- Mailcatcher

### Disabled Services ❌
- Blockchain (Hardhat node)
- Hardhat console

## What Still Works

✅ **All core functionality:**
- User authentication and management
- Item creation and editing  
- Image uploads
- Model file uploads (.blend files)
- Producer management
- Stripe payments
- Email notifications
- Logs viewer (superuser)

❌ **Disabled functionality:**
- NFT minting
- Blockchain certificate creation
- ETH balance checking
- NFT metadata storage

## How to Re-Enable Blockchain Features

### Step 1: Docker Services
```bash
# Edit docker-compose.yml and docker-compose.override.yml
# Uncomment the blockchain service sections (lines marked with TODO)
```

### Step 2: Backend Configuration
```bash
# In docker-compose.override.yml, change:
BLOCKCHAIN_ENABLED: "false"
# To:
BLOCKCHAIN_ENABLED: "true"

# Uncomment:
# WEB3_URL: "http://blockchain:8545"

# Uncomment blockchain dependency:
# blockchain:
#   condition: service_started
```

### Step 3: Frontend Code
```typescript
// In createitem.tsx and EditItem.tsx:
// 1. Uncomment all imports (Modal, Alert, useDisclosure, etc.)
// 2. Uncomment state variables  
// 3. Uncomment functions (checkBalanceAndFund, handleMintNft)
// 4. Uncomment UI components (buttons, modals, alerts)
```

### Step 4: Restart Services
```bash
docker compose down
docker compose build
docker compose up -d
```

## Testing After Re-enabling

1. **Backend:** Check blockchain service is running
   ```bash
   docker compose ps | grep blockchain
   # Should show: urban-barnacle-blockchain-1  Up
   ```

2. **Frontend:** Check for NFT buttons
   - Create item page should show "Mint NFT" button
   - Edit item page should show NFT information section

3. **Functionality:** Test NFT minting
   - Create an item
   - Click "Mint NFT"
   - Should check ETH balance and mint NFT on blockchain

## Why Was It Disabled?

- Blockchain service not needed for current development phase
- Reduces Docker resource usage
- Simplifies local development environment
- Speeds up container startup time

## Technical Details

### Backend
- API routes in `/api/v1/blockchain/*` still exist but won't be called
- NFT-related database fields (nft_token_id, nft_contract_address, etc.) still exist
- Blockchain service module exists but isn't initialized when BLOCKCHAIN_ENABLED=false

### Frontend  
- All blockchain-related code is commented but preserved
- No TypeScript compilation errors
- UI gracefully handles absence of NFT features

### Database
- NFT-related columns in `item` table remain (for future use)
- No data migration needed to re-enable

## Files Modified

```
docker-compose.yml                          # Blockchain service commented
docker-compose.override.yml                  # Development overrides commented  
frontend/src/routes/_layout/createitem.tsx   # NFT UI commented
frontend/src/components/Items/EditItem.tsx   # NFT display commented
```

## Support

When re-enabling blockchain features, ensure:
1. Hardhat node contract deployment script works
2. Backend has valid WEB3_URL configuration
3. Smart contracts are deployed to the Hardhat network
4. Frontend can communicate with backend blockchain API

---

**Status:** ✅ All core features working, blockchain features cleanly disabled and ready to re-enable when needed.
