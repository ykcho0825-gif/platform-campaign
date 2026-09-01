import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatNum } from "./KpiCard";

interface Point {
  date: string;
  actual?: number;
  forecast?: number;
}

export function TrendChart({ points }: { points: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={points}>
        <CartesianGrid stroke="#e1e0d9" vertical={false} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#898781" }} stroke="#c3c2b7" />
        <YAxis tickFormatter={formatNum} tick={{ fontSize: 12, fill: "#898781" }} stroke="#c3c2b7" />
        <Tooltip
          formatter={(v) => formatNum(Number(v))}
          contentStyle={{ background: "#fcfcfb", border: "1px solid rgba(11,11,11,0.1)", borderRadius: 8, fontSize: 13 }}
        />
        <Legend wrapperStyle={{ fontSize: 13, color: "#52514e" }} />
        <Line type="monotone" dataKey="actual" name="실제" stroke="#2a78d6" dot={false} strokeWidth={2} />
        <Line
          type="monotone"
          dataKey="forecast"
          name="예측"
          stroke="#eb6834"
          strokeDasharray="5 4"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
