import { Entity, ObjectIdColumn, Column } from 'typeorm';
import { ObjectId } from 'mongodb';

export enum OrderType {
  BuyLimit = 0,
  SellLimit = 1,
  BuyMarket = 2,
  SellMarket = 3,
  Buy = 4,
  Sell = 5,
}

export enum OrderStatus {
  Pending = 0,
  Filled = 1,
  Canceled = 2,
}

export enum SettlementStatus {
  NotSettled = 0,
  Settling = 1,
  Settled = 2,
  Failed = 3,
}

@Entity('orders')
export class Order {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  symbol!: string;

  @Column('decimal', { precision: 18, scale: 8 })
  price!: number;

  @Column('decimal', { precision: 18, scale: 8 })
  quantity!: number;

  @Column('decimal', { precision: 18, scale: 8 })
  total!: number;

  @Column({
    type: 'enum',
    enum: OrderType,
  })
  type!: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.Pending,
  })
  status!: OrderStatus;

  @Column()
  walletAddress!: string;

  @Column()
  customerType!: 'A' | 'B';

  @Column()
  created: Date;

  @Column({ nullable: true })
  completed?: Date;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({
    type: 'enum',
    enum: SettlementStatus,
    default: SettlementStatus.NotSettled,
  })
  settlementStatus!: SettlementStatus;

  @Column({ nullable: true })
  settlementDate?: Date;

  @Column({ nullable: true })
  settlementError?: string;

  constructor() {
    this.created = new Date();
  }
}