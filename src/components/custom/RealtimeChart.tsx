import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { ISymbol } from "../../@types";

interface RealtimeChartProps {
    symbol: ISymbol;
}

const RealtimeChart: React.FC<RealtimeChartProps> = ({ symbol }) => {
    return (
        <div className="flex-1 border rounded-xl border-slate-500 mb-4 bg-slate-900">
            <div className="font-medium py-2 px-4">RealTime Trading Chart</div>
            <AdvancedRealTimeChart symbol={symbol.symbol} theme="dark" interval="1" width={"auto"} />
        </div>
    );
};

export default RealtimeChart;
