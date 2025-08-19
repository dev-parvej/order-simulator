import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Balance } from '../entities/balance.entity';
import { BalanceController } from '../controllers/balance.controller';
import { BalanceService } from '../services/balance.service';
import { BalanceRepository } from '../repositories/balance.repository';
import { Web3Service } from '../services/web3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Balance])],
  controllers: [BalanceController],
  providers: [BalanceService, BalanceRepository, Web3Service],
  exports: [BalanceService, BalanceRepository],
})
export class BalanceModule {}