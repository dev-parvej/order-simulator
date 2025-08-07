import React, { useEffect, useState } from "react";
import { ISymbol } from "../../@types";
import OrderBookTable from "./OrderBookTable";
import { IOrder, OrderType } from "../../@types/order";
import { setCurrentSymbolPrice } from "../../domain/store";
import { useDispatch } from "react-redux";

interface OrderBookProps {
    symbol: ISymbol;
    onPriceSelected: (price: number) => void;
}

const OrderBook: React.FC<OrderBookProps> = ({ symbol, onPriceSelected }) => {
    const [buyData, setBuyData] = useState([]);
    const [sellData, setSellData] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(0);
    const dispatch = useDispatch();

    useEffect(() => {
        const depthSocket = new WebSocket(`wss://stream.binance.com/stream?streams=${symbol.symbol}@depth20`);
        const tickerSocket = new WebSocket(`wss://stream.binance.com/ws/${symbol.symbol}@ticker`);

        depthSocket.onopen = () => {};
        tickerSocket.onopen = () => {};

        depthSocket.onmessage = (event: MessageEvent) => {
            let message = JSON.parse(event.data);
            message = message.data;
            setBuyData(
                message.bids
                    .map((item: [string, string]) => {
                        const price = parseFloat(item[0]);
                        const amount = parseFloat(item[1]);
                        const total = price * amount;
                        const order: IOrder = {
                            price: price,
                            quantity: amount,
                            total: total,
                        };
                        return order;
                    })
                    .sort((a: IOrder, b: IOrder) => {
                        if (a.total > b.total) {
                            return -1;
                        } else if (a.total < b.total) {
                            return 1;
                        }
                        return 0;
                    })
            );
            setSellData(
                message.asks
                    .map((item: [string, string]) => {
                        const price = parseFloat(item[0]);
                        const amount = parseFloat(item[1]);
                        const total = price * amount;
                        const order: IOrder = {
                            price: price,
                            quantity: amount,
                            total: total,
                        };
                        return order;
                    })
                    .sort((a: IOrder, b: IOrder) => {
                        if (a.total > b.total) {
                            return -1;
                        } else if (a.total < b.total) {
                            return 1;
                        }
                        return 0;
                    })
            );
        };

        tickerSocket.onmessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);
            setCurrentPrice(parseFloat(message.c));
            dispatch(setCurrentSymbolPrice(parseFloat(message.c)));
        };

        return () => {
            depthSocket.close();
            tickerSocket.close();
        };
    }, [symbol.symbol]);
    return (
        <div className="border-slate-500 bg-slate-900 border rounded-xl mb-4">
            <div className="w-full xl:w-auto flex-grow px-4 py-2 font-medium">Order Book</div>
            <div className="flex xl:flex-col lg:flex-row xs:flex-col justify-center">
                <div className="w-full xl:w-auto flex-grow">
                    <OrderBookTable
                        type={OrderType.Buy}
                        orderData={sellData}
                        onRowClicked={(price: number) => {
                            onPriceSelected(price);
                        }}
                    />
                </div>
                <div className="text-center py-8 xl:block hidden">
                    <span className="text-5xl">{currentPrice.toFixed(2)}</span>
                </div>
                <div className="w-full xl:w-auto flex-grow">
                    <OrderBookTable
                        type={OrderType.Sell}
                        orderData={buyData}
                        onRowClicked={(price: number) => {
                            onPriceSelected(price);
                        }}
                    />
                </div>
            </div>
            <div className="text-center py-4 xl:hidden block">
                <span className="text-4xl">{currentPrice.toFixed(2)}</span>
            </div>
        </div>
    );
};

export default OrderBook;
