import TextInputField from "./components/pure/TextInputField";
import Select from "./components/pure/Select";
import RealtimeChart from "./components/custom/RealtimeChart";
import OrderBook from "./components/custom/OrderBook";
import TabView from "./components/pure/TabView";
import { useDispatch, useSelector } from "react-redux";
import { IStoreState, setBalace2, setBalance1, setCurrentSymbol, setOrders } from "./domain/store";
import { colorVariants, symbols } from "./utils/constant";
import { useState, useEffect } from "react";
import MakeOrder from "./components/custom/MakeOrder";
import OrderHistory from "./components/custom/OrderHistory";
import { OrderType, IOrderAdd, OrderStatus, IOrderHistory } from "./@types/order";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import WalletConnect from "./components/wallet-connect/WalletConnect.jsx";

function App() {
    const [symbolIndex, setSymbolIndex] = useState(0);
    const [selectedBuyPrice, setSelectedBuyPrice] = useState(0);
    const tokenA = useSelector((state: IStoreState) => state.currentSymbol.coinA);
    const tokenB = useSelector((state: IStoreState) => state.currentSymbol.coinB);
    const balance1 = useSelector((state: IStoreState) => state.balance1);
    const balance2 = useSelector((state: IStoreState) => state.balance2);
    const currentSymbol = useSelector((state: IStoreState) => state.currentSymbol);
    const currentSymbolPrice = useSelector((state: IStoreState) => state.currentSymbolPrice);
    const orderHistory = useSelector((state: IStoreState) => state.orders);
    const dispatch = useDispatch();

    useEffect(() => {
        const eventSource: EventSource = new EventSource("https://order-balance-simulation.onrender.com/live/");
        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data == true) {
                toast.success("Successfully Filled!", { position: "top-center" });
                getOrderHistory();
            }
        };
        getOrderHistory();

        return () => eventSource.close();
    }, []);

    const addOrder = async ({ type, symbol, price, quantity, total, status }: IOrderAdd) => {
        await axios.post("https://order-balance-simulation.onrender.com/order", { type, symbol, price, quantity, total, status });
        if (type === OrderType.BuyMarket || type === OrderType.SellMarktet) {
            toast.success("Successfully Filled!", { position: "top-center" });
        }
        await getOrderHistory();
    };

    const getOrderHistory = async () => {
        const result = await axios.get("https://order-balance-simulation.onrender.com/order");
        if (result.status === 200) {
            const data = result.data as [any];
            const orders = data.reverse().map((item) => {
                return {
                    _id: item._id,
                    created: item.created,
                    status: item.status,
                    completed: item.completed,
                    order: { price: item.price, quantity: item.quantity, total: item.total, type: item.type, symbol: item.symbol },
                } as IOrderHistory;
            });
            dispatch(setOrders(orders));
        }
    };

    const cancelOrder = async (id: string) => {
        const result = await axios.get(`https://order-balance-simulation.onrender.com/order/cancel/${id}`);
        if (result.status === 200) {
            if (result.data === true) {
                toast.success("Successfully Canceled!", { position: "top-center" });
                await getOrderHistory();
            }
        }
    };

    return (
        <>
            <div className="min-w-full bg-slate-950 min-h-svh pt-10">
                <div className="container mx-auto">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl text-left">Order Trading Platform</h2>
                        <WalletConnect />
                    </div>
                    <div className="flex flex-wrap flex-col justify-between items-center gap-4 mt-4 xl:flex-row">
                        <Select
                            onChange={(value: number | string) => {
                                dispatch(setCurrentSymbol(symbols[value as number].symbol));
                                setSymbolIndex(value as number);
                            }}
                            options={symbols.map((item, index) => {
                                return {
                                    label: `${item.coinA}/${item.coinB}`,
                                    value: index,
                                };
                            })}
                            value={symbolIndex}
                        ></Select>
                        <div className="flex-grow"></div>
                        <span className="text-gray-500 ">Input your balance:</span>
                        <TextInputField
                            prefix="Balance"
                            type="number"
                            suffix={tokenA}
                            value={balance1}
                            onChange={(value) => {
                                dispatch(setBalance1(parseFloat(value as string)));
                            }}
                        />
                        <TextInputField
                            prefix="Balance"
                            type="number"
                            suffix={tokenB}
                            value={balance2}
                            onChange={(value) => {
                                dispatch(setBalace2(parseFloat(value as string)));
                            }}
                        />
                    </div>
                    <div className="flex flex-row py-2 justify-end items-start text-gray-500">
                        <h4 className="pr-16">This website is test website and all of data is mock data. Please be aware of it.</h4>
                    </div>
                    <div className="flex justify-between items-center flex-col-reverse xl:flex-row xl:items-start gap-4">
                        <div className="w-full xl:flex-1">
                            <OrderBook
                                symbol={currentSymbol}
                                onPriceSelected={(price: number) => {
                                    setSelectedBuyPrice(price as number);
                                }}
                            ></OrderBook>
                        </div>
                        <div className="xl:flex-grow w-full">
                            <RealtimeChart symbol={currentSymbol}></RealtimeChart>
                            <div className="flex-col">
                                <div className="flex-row items-center">
                                    <TabView
                                        tabs={[
                                            {
                                                label: "Limit",
                                                child: (
                                                    <div className="flex md:flex-row gap-10 flex-col">
                                                        <MakeOrder
                                                            symbol={currentSymbol}
                                                            defaultPrice={selectedBuyPrice}
                                                            isMarket={false}
                                                            buttonLabel="BUY LIMIT"
                                                            balanceCheck={(price: number, percent: number) => {
                                                                return (balance2 * percent) / 100 / price;
                                                            }}
                                                            checkValidity={(price: number, quantity: number) => {
                                                                return price > 0 && quantity > 0 && price * quantity < balance2;
                                                            }}
                                                            onSubmitted={(price: number, quantity: number) => {
                                                                addOrder({ type: OrderType.BuyLimit, price, quantity, total: price * quantity, status: OrderStatus.Pending, symbol: currentSymbol.symbol });
                                                            }}
                                                            customStyle={colorVariants.blue}
                                                        ></MakeOrder>
                                                        <MakeOrder
                                                            symbol={currentSymbol}
                                                            defaultPrice={selectedBuyPrice}
                                                            isMarket={false}
                                                            buttonLabel="SELL LIMIT"
                                                            balanceCheck={(_: number, percent: number) => {
                                                                return (balance1 * percent) / 100;
                                                            }}
                                                            checkValidity={(price: number, quantity: number) => {
                                                                return price > 0 && quantity > 0 && quantity < balance1;
                                                            }}
                                                            onSubmitted={(price: number, quantity: number) => {
                                                                addOrder({ type: OrderType.SellLimit, price, quantity, total: price * quantity, status: OrderStatus.Pending, symbol: currentSymbol.symbol });
                                                            }}
                                                            customStyle={colorVariants.red}
                                                        ></MakeOrder>
                                                    </div>
                                                ),
                                            },
                                            {
                                                label: "Market",
                                                child: (
                                                    <div className="flex md:flex-row gap-10 flex-col">
                                                        <MakeOrder
                                                            symbol={currentSymbol}
                                                            defaultPrice={currentSymbolPrice}
                                                            isMarket={true}
                                                            buttonLabel="BUY MARKET"
                                                            balanceCheck={(price: number, percent: number) => {
                                                                return (balance2 * percent) / 100 / price;
                                                            }}
                                                            checkValidity={(price: number, quantity: number) => {
                                                                return price > 0 && quantity > 0 && price * quantity < balance2;
                                                            }}
                                                            onSubmitted={(price: number, quantity: number) => {
                                                                addOrder({ type: OrderType.BuyMarket, price, quantity, total: price * quantity, status: OrderStatus.Filled, symbol: currentSymbol.symbol });
                                                            }}
                                                            customStyle={colorVariants.blue}
                                                        ></MakeOrder>
                                                        <MakeOrder
                                                            symbol={currentSymbol}
                                                            defaultPrice={currentSymbolPrice}
                                                            isMarket={true}
                                                            balanceCheck={(_: number, percent: number) => {
                                                                return (balance1 * percent) / 100;
                                                            }}
                                                            buttonLabel="SELL MARKET"
                                                            checkValidity={(price: number, quantity: number) => {
                                                                return price > 0 && quantity > 0 && quantity < balance1;
                                                            }}
                                                            onSubmitted={(price: number, quantity: number) => {
                                                                addOrder({ type: OrderType.SellMarktet, price, quantity, total: price * quantity, status: OrderStatus.Filled, symbol: currentSymbol.symbol });
                                                            }}
                                                            customStyle={colorVariants.red}
                                                        ></MakeOrder>
                                                    </div>
                                                ),
                                            },
                                        ]}
                                    ></TabView>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="pb-8 mt-4">
                        <OrderHistory
                            data={orderHistory}
                            onHistoryItemCancelClicked={(cancelId: string) => {
                                cancelOrder(cancelId);
                            }}
                        ></OrderHistory>
                    </div>
                </div>
            </div>
            <ToastContainer />
        </>
    );
}

export default App;
