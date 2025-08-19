import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Balance } from '../entities/balance.entity';

@Injectable()
export class BalanceRepository {
  constructor(
    @InjectRepository(Balance)
    private readonly repository: Repository<Balance>,
  ) {}

  async findByWalletAddress(walletAddress: string): Promise<Balance | null> {
    return await this.repository.findOne({ where: { walletAddress } });
  }

  async create(walletAddress: string): Promise<Balance> {
    const balance = new Balance();
    balance.walletAddress = walletAddress;
    balance.ethBalance = 0;
    balance.usdtBalance = 0;
    
    return await this.repository.save(balance);
  }

  async update(walletAddress: string, updates: Partial<Balance>): Promise<void> {
    await this.repository.update({ walletAddress }, {
      ...updates,
      lastUpdated: new Date()
    });
  }

  async findAll(): Promise<Balance[]> {
    return await this.repository.find();
  }

  async save(balance: Balance): Promise<Balance> {
    return await this.repository.save(balance);
  }
}