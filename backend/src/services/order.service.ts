import {BadRequestException, Injectable, NotFoundException, UnprocessableEntityException, Logger} from '@nestjs/common';
import {OrderRepository} from '../repositories/order.repository';
import {CreateOrderDto} from '../dto/create-order.dto';
import {OrderResponseDto} from '../dto/order-response.dto';
import {Order, OrderStatus, OrderType, SettlementStatus} from '../entities/order.entity';
import {Web3Service} from './web3.service';
import {BalanceService} from './balance.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly web3Service: Web3Service,
    private readonly balanceService: BalanceService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    this.validateOrderData(createOrderDto);
    
    // Validate balance before creating order
    await this.validateBalance(createOrderDto);

    const order = await this.orderRepository.create(createOrderDto);
    return new OrderResponseDto(order);
  }

  async getUserOrders(user: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findOrderUser(user);

    return orders.map((order) => new OrderResponseDto(order));
  }

  async cancelOrder(orderId: string) {
    const order = await this.orderRepository.findOne(orderId);

    if (!order) {
      throw new NotFoundException('Order Not found exceptions');
    }

    if (order.status != OrderStatus.Pending) {
      throw new UnprocessableEntityException('Only pending order can be canceled');
    }

    await this.orderRepository.update(order._id.toString(), {status: OrderStatus.Canceled})

    return true;
  }

  async processLimitOrders(): Promise<Order[]> {
    const pendingOrders = await this.orderRepository.findPendingOrder();
    const filledOrders: Order[] = [];

    // Group orders by customer type
    const buyOrders = pendingOrders.filter(order => order.customerType === 'A');
    const sellOrders = pendingOrders.filter(order => order.customerType === 'B');

    // Match buy and sell orders
    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        if (buyOrder.price >= sellOrder.price && Math.random() > 0.5) {
          // Match found - fill both orders and settle on blockchain
          try {
            await this.fillMatchedOrders(buyOrder, sellOrder);
            filledOrders.push(buyOrder, sellOrder);
            break; // Move to next buy order
          } catch (error) {
            this.logger.error('Failed to settle matched orders', error);
          }
        }
      }
    }

    return filledOrders;
  }

  private async fillMatchedOrders(buyOrder: Order, sellOrder: Order): Promise<void> {
    const tradeAmount = Math.min(buyOrder.quantity, sellOrder.quantity);
    const tradePrice = (buyOrder.price + sellOrder.price) / 2; // Average price
    const totalUSDT = (tradeAmount * tradePrice).toString();
    const totalETH = tradeAmount.toString();

    this.logger.log(`Matching orders: Buy(${buyOrder._id}) with Sell(${sellOrder._id})`);

    // Update order statuses
    buyOrder.status = OrderStatus.Filled;
    buyOrder.completed = new Date();
    buyOrder.settlementStatus = SettlementStatus.Settling;

    sellOrder.status = OrderStatus.Filled;
    sellOrder.completed = new Date();
    sellOrder.settlementStatus = SettlementStatus.Settling;

    // Save orders with settling status
    await Promise.all([
      this.orderRepository.saveOrder(buyOrder),
      this.orderRepository.saveOrder(sellOrder)
    ]);

    try {
      // Settle trade on blockchain
      const txHash = await this.web3Service.settleTrade(
        buyOrder.walletAddress,  // Customer A (buyer)
        sellOrder.walletAddress, // Customer B (seller)
        totalETH,
        totalUSDT,
        `${buyOrder._id.toString()}-${sellOrder._id.toString()}`
      );

      // Update orders with successful settlement
      buyOrder.transactionHash = txHash;
      buyOrder.settlementStatus = SettlementStatus.Settled;
      buyOrder.settlementDate = new Date();

      sellOrder.transactionHash = txHash;
      sellOrder.settlementStatus = SettlementStatus.Settled;
      sellOrder.settlementDate = new Date();

      await Promise.all([
        this.orderRepository.saveOrder(buyOrder),
        this.orderRepository.saveOrder(sellOrder)
      ]);

      this.logger.log(`Trade settled successfully. TX: ${txHash}`);
    } catch (error) {
      // Update orders with failed settlement
      buyOrder.settlementStatus = SettlementStatus.Failed;
      buyOrder.settlementError = error.message;

      sellOrder.settlementStatus = SettlementStatus.Failed;
      sellOrder.settlementError = error.message;

      await Promise.all([
        this.orderRepository.saveOrder(buyOrder),
        this.orderRepository.saveOrder(sellOrder)
      ]);

      this.logger.error('Blockchain settlement failed', error);
      throw error;
    }
  }

  private async validateBalance(createOrderDto: CreateOrderDto): Promise<void> {
    const walletAddress = createOrderDto.walletAddress || '';
    const customerType = createOrderDto.customerType;
    const orderTotal = createOrderDto.total;
    const orderQuantity = createOrderDto.quantity;

    try {
      const hasSufficientBalance = await this.balanceService.validateCustomerBalance(
        customerType,
        walletAddress,
        orderTotal,
        orderQuantity
      );

      if (!hasSufficientBalance) {
        if (customerType === 'A') {
          throw new BadRequestException(
            `Insufficient USDT balance. Required: ${orderTotal} USDT for this buy order`
          );
        } else {
          throw new BadRequestException(
            `Insufficient ETH balance. Required: ${orderQuantity} ETH for this sell order`
          );
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Balance validation failed', error);
      throw new BadRequestException('Unable to validate balance. Please try again.');
    }
  }

  private validateOrderData(createOrderDto: CreateOrderDto): void {
    if (createOrderDto.price <= 0) {
      throw new BadRequestException('Price must be greater than 0');
    }

    if (createOrderDto.quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    if (createOrderDto.total <= 0) {
      throw new BadRequestException('Total must be greater than 0');
    }

    if (!['A', 'B'].includes(createOrderDto.customerType)) {
      throw new BadRequestException('Customer type must be either A or B');
    }

    const isBuyOrder = [OrderType.Buy, OrderType.BuyLimit, OrderType.BuyMarket].includes(createOrderDto.type);
    const isSellOrder = [OrderType.Sell, OrderType.SellLimit, OrderType.SellMarket].includes(createOrderDto.type);

    if (createOrderDto.customerType === 'A' && !isBuyOrder) {
      throw new BadRequestException('Customer A can only place buy orders in this simulation');
    }

    if (createOrderDto.customerType === 'B' && !isSellOrder) {
      throw new BadRequestException('Customer B can only place sell orders in this simulation');
    }
  }
}
