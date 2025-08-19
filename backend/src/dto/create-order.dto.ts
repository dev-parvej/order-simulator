import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { OrderType } from '../entities/order.entity';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  symbol!: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsNumber()
  @Min(0)
  quantity!: number;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsEnum(OrderType)
  type!: OrderType;

  @IsString()
  @IsNotEmpty()
  walletAddress!: string;

  @IsString()
  @IsNotEmpty()
  customerType!: 'A' | 'B';
}