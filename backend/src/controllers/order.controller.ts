import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Sse,
  MessageEvent
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderResponseDto } from '../dto/order-response.dto';
import {filter, interval, map, Observable, switchMap} from 'rxjs';
import {Point} from "typeorm";

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post("/orders")
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return await this.orderService.createOrder(createOrderDto);
  }

  @Get('/orders/:user')
  @HttpCode(HttpStatus.OK)
  async getUserOrders(@Param('user') user: string): Promise<OrderResponseDto[]> {
    return await this.orderService.getUserOrders(user);
  }

  @Get("/orders/cancel/:orderId")
  @HttpCode(HttpStatus.OK)
  async cancelOder(@Param('orderId') orderId: string): Promise<boolean> {
    return await this.orderService.cancelOrder(orderId);
  }

  @Sse('live')
  processLimitOrders(): Observable<MessageEvent> {
    return interval(50000).pipe(
        switchMap(() => this.orderService.processLimitOrders()),
        filter(filledOrders => filledOrders.length > 0),
        map(() => ({
          data: JSON.stringify(true),
        }))
    );
  }

}
