import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Balance } from '../entities/balance.entity';
import { Web3Service } from './web3.service';

export interface BalanceInfo {
  walletAddress: string;
  ethBalance: string;
  usdtBalance: string;
  lastUpdated: Date;
  lastSyncWithContract?: Date;
}

@Injectable()
export class BalanceService {
  private readonly logger = new Logger(BalanceService.name);

  constructor(
    @InjectRepository(Balance)
    private readonly balanceRepository: Repository<Balance>,
    private readonly web3Service: Web3Service,
  ) {}

  async getBalanceInfo(walletAddress: string): Promise<BalanceInfo> {
    let balance = await this.balanceRepository.findOne({
      where: { walletAddress }
    });

    if (!balance) {
      // Create new balance record
      balance = await this.createNewBalance(walletAddress);
    }

    // Sync with smart contract if needed
    if (this.shouldSyncWithContract(balance)) {
      balance = await this.syncWithContract(balance);
    }

    return {
      walletAddress: balance.walletAddress,
      ethBalance: balance.ethBalance.toString(),
      usdtBalance: balance.usdtBalance.toString(),
      lastUpdated: balance.lastUpdated,
      lastSyncWithContract: balance.lastSyncWithContract
    };
  }

  async syncWithContract(balance: Balance): Promise<Balance> {
    try {
      this.logger.log(`Syncing balance with contract for ${balance.walletAddress}`);
      
      const contractBalances = await this.web3Service.getUserBalances(balance.walletAddress);
      
      balance.ethBalance = parseFloat(contractBalances.ethBalance);
      balance.usdtBalance = parseFloat(contractBalances.usdtBalance);
      balance.lastSyncWithContract = new Date();
      balance.lastUpdated = new Date();

      return await this.balanceRepository.save(balance);
    } catch (error) {
      this.logger.error(`Failed to sync balance with contract for ${balance.walletAddress}`, error);
      throw error;
    }
  }

  async getAllBalances(): Promise<BalanceInfo[]> {
    const balances = await this.balanceRepository.find();
    return balances.map(balance => ({
      walletAddress: balance.walletAddress,
      ethBalance: balance.ethBalance.toString(),
      usdtBalance: balance.usdtBalance.toString(),
      lastUpdated: balance.lastUpdated,
      lastSyncWithContract: balance.lastSyncWithContract
    }));
  }

  async refreshBalance(walletAddress: string): Promise<BalanceInfo> {
    let balance = await this.balanceRepository.findOne({
      where: { walletAddress }
    });

    if (!balance) {
      balance = await this.createNewBalance(walletAddress);
    }

    balance = await this.syncWithContract(balance);
    return {
      walletAddress: balance.walletAddress,
      ethBalance: balance.ethBalance.toString(),
      usdtBalance: balance.usdtBalance.toString(),
      lastUpdated: balance.lastUpdated,
      lastSyncWithContract: balance.lastSyncWithContract
    };
  }

  async validateSufficientBalance(
    walletAddress: string, 
    requiredEth: string, 
    requiredUsdt: string
  ): Promise<boolean> {
    const balanceInfo = await this.getBalanceInfo(walletAddress);
    
    const hasEnoughEth = parseFloat(balanceInfo.ethBalance) >= parseFloat(requiredEth || '0');
    const hasEnoughUsdt = parseFloat(balanceInfo.usdtBalance) >= parseFloat(requiredUsdt || '0');
    
    return hasEnoughEth && hasEnoughUsdt;
  }

  async validateCustomerBalance(
    customerType: 'A' | 'B',
    walletAddress: string,
    orderTotal: number,
    orderQuantity: number
  ): Promise<boolean> {
    const balanceInfo = await this.getBalanceInfo(walletAddress);

    if (customerType === 'A') {
      // Customer A (buyer) needs USDT
      const requiredUsdt = orderTotal;
      return parseFloat(balanceInfo.usdtBalance) >= requiredUsdt;
    } else {
      // Customer B (seller) needs ETH
      const requiredEth = orderQuantity;
      return parseFloat(balanceInfo.ethBalance) >= requiredEth;
    }
  }

  private async createNewBalance(walletAddress: string): Promise<Balance> {
    this.logger.log(`Creating new balance record for ${walletAddress}`);
    
    const newBalance = new Balance();
    newBalance.walletAddress = walletAddress;
    newBalance.ethBalance = 0;
    newBalance.usdtBalance = 0;
    
    return await this.balanceRepository.save(newBalance);
  }

  private shouldSyncWithContract(balance: Balance): boolean {
    if (!balance.lastSyncWithContract) {
      return true;
    }

    // Sync every 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return balance.lastSyncWithContract < fiveMinutesAgo;
  }

  async setPendingTransactions(walletAddress: string, hasPending: boolean): Promise<void> {
    const balance = await this.balanceRepository.findOne({
      where: { walletAddress }
    });

    if (balance) {
      balance.hasPendingTransactions = hasPending;
      balance.lastUpdated = new Date();
      await this.balanceRepository.save(balance);
    }
  }
}