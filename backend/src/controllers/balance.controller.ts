import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { BalanceService, BalanceInfo } from '../services/balance.service';
export class RefreshBalanceDto {
  walletAddress!: string;
}

@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get(':walletAddress')
  async getBalance(@Param('walletAddress') walletAddress: string): Promise<BalanceInfo> {
    return await this.balanceService.getBalanceInfo(walletAddress);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshBalance(@Body() refreshBalanceDto: RefreshBalanceDto): Promise<BalanceInfo> {
    return await this.balanceService.refreshBalance(refreshBalanceDto.walletAddress);
  }

  @Get()
  async getAllBalances(): Promise<BalanceInfo[]> {
    return await this.balanceService.getAllBalances();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  async validateBalance(@Body() body: {
    customerType: 'A' | 'B';
    walletAddress: string;
    orderTotal: number;
    orderQuantity: number;
  }): Promise<{ isValid: boolean; message?: string }> {
    const { customerType, walletAddress, orderTotal, orderQuantity } = body;

    try {
      const isValid = await this.balanceService.validateCustomerBalance(
        customerType,
        walletAddress,
        orderTotal,
        orderQuantity
      );

      if (!isValid) {
        const requiredToken = customerType === 'A' ? 'USDT' : 'ETH';
        const requiredAmount = customerType === 'A' ? orderTotal : orderQuantity;

        return {
          isValid: false,
          message: `Insufficient ${requiredToken} balance. Required: ${requiredAmount} ${requiredToken}`
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        message: 'Unable to validate balance. Please try again.'
      };
    }
  }
}
