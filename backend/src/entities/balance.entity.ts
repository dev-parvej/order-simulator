import { Entity, ObjectIdColumn, Column, Index } from 'typeorm';
import { ObjectId } from 'mongodb';

@Entity('balances')
export class Balance {
  @ObjectIdColumn()
  _id!: ObjectId;

  @Column()
  @Index()
  walletAddress!: string;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  ethBalance!: number;

  @Column('decimal', { precision: 18, scale: 8, default: 0 })
  usdtBalance!: number;

  @Column()
  lastUpdated: Date;

  @Column({ nullable: true })
  lastSyncWithContract?: Date;

  @Column({ default: false })
  hasPendingTransactions!: boolean;

  constructor() {
    this.lastUpdated = new Date();
  }
}