import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Balance } from '../entities/balance.entity';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';
import { OrderRepository } from '../repositories/order.repository';
import { BalanceService } from '../services/balance.service';
import { Web3Service } from '../services/web3.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Balance])],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, BalanceService, Web3Service],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}