# Smart Contract Deployment Guide

## Prerequisites

1. **Node.js** (v18+) and **npm/yarn** installed
2. **MetaMask** browser extension
3. **Sepolia ETH** for gas fees (get from faucets)
4. **MongoDB** running locally or remote connection string
5. **Hardhat** or **Remix** for contract deployment

## Step 1: Deploy Smart Contract

### Option A: Using Remix (Recommended for beginners)

1. Open [Remix IDE](https://remix.ethereum.org/)
2. Create new file `TradingSettlement.sol`
3. Copy the contract code from `contracts/TradingSettlement.sol`
4. Compile with Solidity version `^0.8.19`
5. Connect MetaMask to Sepolia testnet
6. Deploy the contract
7. Copy the deployed contract address

### Option B: Using Hardhat

```bash
# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize Hardhat project
npx hardhat init

# Copy contract to contracts/ folder
# Create deployment script in scripts/deploy.js
```

## Step 2: Configure Backend Environment

Create `.env` file in the `backend/` directory:

```bash
# Smart Contract Configuration
CONTRACT_ADDRESS=0x... # Your deployed contract address
BACKEND_PRIVATE_KEY=0x... # Private key for backend settlements
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/order-balance-simulator

# Optional: Enable logging
NODE_ENV=development
```

## Step 3: Configure Frontend Environment

Create `.env` file in the root directory:

```bash
REACT_APP_CONTRACT_ADDRESS=0x... # Same contract address as backend
```

## Step 4: Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ..
npm install
```

## Step 5: Start the Application

```bash
# Terminal 1: Start MongoDB (if local)
mongod

# Terminal 2: Start Backend
cd backend
npm run start:dev

# Terminal 3: Start Frontend
cd ..
npm run dev
```

## Step 6: Set Backend Address in Contract

After deployment, the contract owner must call `setBackendAddress()`:

1. In Remix or block explorer, connect as contract owner
2. Call `setBackendAddress` with your backend wallet address
3. This allows the backend to settle trades on-chain

## Step 7: Get Test Tokens

For testing, you'll need:

1. **Sepolia ETH**: Get from [Sepolia faucet](https://sepoliafaucet.com/)
2. **Test USDT**: The contract uses a mock USDT token at `0x7169D38820dfd117C3FA1f22a697dBA58d90BA06`

## Testing the System

1. **Connect Wallet**: Use MetaMask on Sepolia testnet
2. **Select Customer Type**: Choose A (buyer) or B (seller)
3. **Deposit Funds**: 
   - Customer A: Deposit USDT
   - Customer B: Deposit ETH
4. **Create Orders**: Place buy/sell orders
5. **Watch Settlement**: Orders are matched and settled on-chain

## Architecture Flow

```
Frontend (React/Web3) 
    ↓
Backend (NestJS/MongoDB) 
    ↓
Smart Contract (Sepolia)
    ↓
Settlement & Balance Updates
```

## Troubleshooting

### Common Issues:

1. **"Contract not deployed"**: Check CONTRACT_ADDRESS in env files
2. **"Wrong network"**: Ensure MetaMask is on Sepolia
3. **"Insufficient balance"**: Deposit tokens first
4. **"Backend not authorized"**: Call setBackendAddress() on contract
5. **"RPC errors"**: Check Infura/Alchemy RPC URL

### Network Details:
- **Network**: Sepolia Testnet
- **Chain ID**: 11155111 (0xAA36A7)
- **RPC**: https://sepolia.infura.io/v3/
- **Explorer**: https://sepolia.etherscan.io/

## Security Notes

⚠️ **This is for testing only**:
- Private keys in `.env` are for development
- Use proper key management in production
- Smart contract has not been audited
- Always test with small amounts first

## Next Steps

1. Deploy to testnet and test all functionality
2. Add more trading pairs if needed
3. Implement proper error handling
4. Add comprehensive logging
5. Consider upgradeability patterns for production