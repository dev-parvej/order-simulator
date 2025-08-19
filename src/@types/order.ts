export interface IOrder {
    symbol?: string;
    price: number;
    quantity: number;
    total: number;
    type?: OrderType;
}

export interface IOrderBook {
    sell: IOrder[];
    buy: IOrder[];
}

export enum OrderType {
    BuyLimit,
    SellLimit,
    BuyMarket,
    SellMarktet,
    Buy,
    Sell,
}

export const orderTypeLabel = ["Limit Buy", "Limit Sell", "Market Buy", "Market Sell", "Buy", "Sell"];

export enum OrderStatus {
    Pending,
    Filled,
    Canceled,
}

export const orderStatusLabel = ["Pending", "Filled", "Cancelled"];

export enum SettlementStatus {
    NotSettled,
    Settling,
    Settled,
    Failed,
}

export const settlementStatusLabel = ["Not Settled", "Settling...", "Settled", "Failed"];

export interface IOrderHistory {
    _id: string;
    order: IOrder;
    created: Date;
    completed?: Date;
    status: OrderStatus;
    transactionHash?: string;
    settlementStatus?: SettlementStatus;
    settlementDate?: Date;
    settlementError?: string;
}

export interface IOrderAdd {
    type: OrderType;
    symbol: string;
    price: number;
    quantity: number;
    total: number;
    status: OrderStatus;
}
