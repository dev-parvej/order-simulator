import { ObjectId } from 'mongodb';
import { OrderType, OrderStatus } from '../entities/order.entity';

export class OrderResponseDto {
  _id!: ObjectId;
  symbol!: string;
  price!: number;
  quantity!: number;
  total!: number;
  type!: OrderType;
  status!: OrderStatus;
  walletAddress!: string;
  customerType!: 'A' | 'B';
  created!: Date;
  completed?: Date;

  constructor(partial: Partial<OrderResponseDto>) {
    Object.assign(this, partial);
  }
}