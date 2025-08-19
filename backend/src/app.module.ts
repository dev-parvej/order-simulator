import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from './modules/order.module';
import { BalanceModule } from './modules/balance.module';
import { Order } from './entities/order.entity';
import { Balance } from './entities/balance.entity';
import { Web3Service } from './services/web3.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      url: 'mongodb://localhost:27017/order-balance-simulator',
      entities: [Order, Balance],
      synchronize: true,
    }),
    OrderModule,
    BalanceModule,
  ],
  providers: [Web3Service],
  exports: [Web3Service],
})
export class AppModule {}
