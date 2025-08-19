import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { ObjectId } from 'mongodb';
import {Order, OrderStatus} from '../entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: MongoRepository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    const order = new Order();
    Object.assign(order, createOrderDto);
    return await this.orderRepository.save(order);
  }

  saveOrder(order: Order): Promise<Order> {
    return this.orderRepository.save(order)
  }

  async update(id: string, updateOrderDto: UpdateOrderDto): Promise<Order | null> {
    const result = await this.orderRepository.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateOrderDto },
      { returnDocument: 'after' }
    );
    return result as Order || null;
  }

  async findOrderUser(user: string) {
    return await this.orderRepository.find({
      where: {
        customerType: user
      }
    })
  }

  async findPendingOrder(): Promise<Order[]> {
    return this.orderRepository.find({
      where: { status: OrderStatus.Pending }
    })
  }

  findOne(orderId: string): Promise<Order | null> {
    return this.orderRepository.findOne({
      where: {
        _id: new ObjectId(orderId)
      }
    })
  }

}
