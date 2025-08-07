import React from "react";
import { format } from "date-fns";
import { IOrderHistory, OrderStatus, orderStatusLabel, orderTypeLabel } from "../../@types/order";

export interface OrderHistoryProps {
    data: IOrderHistory[];
    onHistoryItemCancelClicked: (id: string) => void;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ data, onHistoryItemCancelClicked }) => {
    return (
        <div className="bg-slate-900">
            <div className="px-4 py-2 font-medium border border-slate-500 rounded-t-xl">Order History</div>
            <table className="text-center rounded-xl text-md border-collapse w-full bg-slate-900">
                <thead>
                    <tr className="border border-slate-500 rounded-xl">
                        <th className="py-3 font-medium border border-slate-500">No</th>
                        <th className="py-3 font-medium border border-slate-500">Pair</th>
                        <th className="py-3 font-medium border border-slate-500">Type</th>
                        <th className="py-3 font-medium border border-slate-500">Price</th>
                        <th className="py-3 font-medium border border-slate-500">Amount</th>
                        <th className="py-3 font-medium border border-slate-500 hidden lg:table-cell">Total</th>
                        <th className="py-3 font-medium border border-slate-500 min-w-48 hidden sm:table-cell">Order Time</th>
                        <th className="py-3 font-medium border border-slate-500 hidden lg:table-cell">Filled Time</th>
                        <th className="py-3 font-medium border border-slate-500">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item: IOrderHistory, index: number) => (
                        <tr key={index} className="table-row border hover:bg-slate-600 border-slate-500 bg-slate-900">
                            <td className="py-2 px-4 border border-slate-500">{index + 1}</td>
                            <td className="py-2 px-4 border border-slate-500">{item.order.symbol?.toUpperCase()}</td>
                            <td className="py-2 px-4 border border-slate-500">{orderTypeLabel[item.order.type as number]}</td>
                            <td className="py-2 px-4 border border-slate-500">{item.order.price.toFixed(3)}</td>
                            <td className="py-2 px-4 border border-slate-500">{item.order.quantity.toFixed(3)}</td>
                            <td className="py-2 px-4 border border-slate-500 hidden lg:table-cell">{item.order.total.toFixed(3)}</td>
                            <td className="py-2 px-4 border hidden sm:table-cell border-slate-500">{format(item.created, "yyyy/MM/dd HH:mm:ss")}</td>
                            <td className="py-2 px-4 border border-slate-500 hidden lg:table-cell">{item.completed ? format(item.completed, "yyyy/MM/dd HH:mm:ss") : ""}</td>
                            <td className="py-2 px-4 border border-slate-500">
                                {item.status === OrderStatus.Pending ? (
                                    <button
                                        className="bg-red-900 px-2 xl:w-24 py-1 hover:bg-red-700 rounded-full "
                                        onClick={() => {
                                            onHistoryItemCancelClicked(item._id);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                ) : item.status === OrderStatus.Canceled ? (
                                    <div className="bg-yellow-900 px-2 xl:w-24 py-1 rounded-full inline-block">{orderStatusLabel[item.status as number]}</div>
                                ) : (
                                    <div className="bg-green-900 px-2 xl:w-24 py-1 rounded-full inline-block">{orderStatusLabel[item.status as number]}</div>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderHistory;
