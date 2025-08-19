import { Injectable, Logger } from '@nestjs/common';
import { ethers } from 'ethers';

@Injectable()
export class Web3Service {
  private readonly logger = new Logger(Web3Service.name);
  private provider: ethers.JsonRpcProvider | undefined;
  private contract: ethers.Contract | undefined;
  private wallet: ethers.Wallet | undefined;

  private readonly CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || '';
  private readonly PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || '';
  private readonly RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/your-project-id';

  private readonly CONTRACT_ABI = [
    "function setBackendAddress(address _backendAddress) external",
    "function settleTrade(address buyerA, address sellerB, uint256 ethAmount, uint256 usdtAmount, string calldata orderId) external",
    "function getBalance(address user) external view returns (uint256 ethBalance, uint256 usdtBalance)",
    "function getUserETHBalance(address user) external view returns (uint256)",
    "function getUserUSDTBalance(address user) external view returns (uint256)",
    "event TradeSettled(address indexed buyerA, address indexed sellerB, uint256 ethAmount, uint256 usdtAmount, string orderId)",
    "event Deposit(address indexed user, string tokenType, uint256 amount)",
    "event Withdrawal(address indexed user, string tokenType, uint256 amount)"
  ];

  constructor() {
    this.initializeProvider();
    this.initializeContract();
  }

  private initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(this.RPC_URL);
      this.wallet = new ethers.Wallet(this.PRIVATE_KEY, this.provider);
      this.logger.log('Web3 provider initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Web3 provider', error);
      throw error;
    }
  }

  private initializeContract() {
    try {
      if (!this.CONTRACT_ADDRESS) {
        this.logger.warn('Contract address not provided, some functions will be disabled');
        return;
      }

      this.contract = new ethers.Contract(
        this.CONTRACT_ADDRESS,
        this.CONTRACT_ABI,
        this.wallet
      );

      this.logger.log(`Contract initialized at address: ${this.CONTRACT_ADDRESS}`);
    } catch (error) {
      this.logger.error('Failed to initialize contract', error);
      throw error;
    }
  }

  async settleTrade(
    buyerAddress: string,
    sellerAddress: string,
    ethAmount: string,
    usdtAmount: string,
    orderId: string
  ): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const ethAmountWei = ethers.parseEther(ethAmount);
      const usdtAmountWei = ethers.parseUnits(usdtAmount, 6); // USDT has 6 decimals

      this.logger.log(`Settling trade: Order ${orderId}, Buyer: ${buyerAddress}, Seller: ${sellerAddress}`);

      const tx = await this.contract.settleTrade(
        buyerAddress,
        sellerAddress,
        ethAmountWei,
        usdtAmountWei,
        orderId
      );

      const receipt = await tx.wait();
      this.logger.log(`Trade settled successfully. TX Hash: ${receipt.hash}`);

      return receipt.hash;
    } catch (error) {
      this.logger.error('Failed to settle trade on blockchain', error);
      throw error;
    }
  }

  async getUserBalances(userAddress: string): Promise<{ ethBalance: string; usdtBalance: string }> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [ethBalanceWei, usdtBalanceWei] = await this.contract.getBalance(userAddress);

      const ethBalance = ethers.formatEther(ethBalanceWei);
      const usdtBalance = ethers.formatUnits(usdtBalanceWei, 6);

      return {
        ethBalance,
        usdtBalance
      };
    } catch (error) {
      this.logger.error('Failed to get user balances', error);
      throw error;
    }
  }

  async getUserETHBalance(userAddress: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const balanceWei = await this.contract.getUserETHBalance(userAddress);
      return ethers.formatEther(balanceWei);
    } catch (error) {
      this.logger.error('Failed to get user ETH balance', error);
      throw error;
    }
  }

  async getUserUSDTBalance(userAddress: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const balanceWei = await this.contract.getUserUSDTBalance(userAddress);
      return ethers.formatUnits(balanceWei, 6);
    } catch (error) {
      this.logger.error('Failed to get user USDT balance', error);
      throw error;
    }
  }

  async setBackendAddress(backendAddress: string): Promise<string> {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const tx = await this.contract.setBackendAddress(backendAddress);
      const receipt = await tx.wait();

      this.logger.log(`Backend address set to: ${backendAddress}. TX Hash: ${receipt.hash}`);
      return receipt.hash;
    } catch (error) {
      this.logger.error('Failed to set backend address', error);
      throw error;
    }
  }

  getContractAddress(): string {
    return this.CONTRACT_ADDRESS;
  }

  getBackendAddress(): string {
    return this.wallet?.address || '';
  }

  async isContractDeployed(): Promise<boolean> {
    try {
      if (!this.CONTRACT_ADDRESS || !this.provider) {
        return false;
      }

      const code = await this.provider.getCode(this.CONTRACT_ADDRESS);
      return code !== '0x';
    } catch (error) {
      this.logger.error('Failed to check contract deployment', error);
      return false;
    }
  }
}
