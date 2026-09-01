import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { formatNum } from "./KpiCard";

interface Step {
  stage: string;
  value: number;
}

// Ordinal sequential ramp (blue), lightest step clears 2:1 on the light surface per palette rules.
const STEP_COLORS = ["#86b6ef", "#5598e7", "#2a78d6", "#184f95"];

export function FunnelChart({ steps }: { steps: Step[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={steps} layout="vertical" margin={{ left: 40, right: 48 }}>
        <CartesianGrid stroke="#e1e0d9" horizontal={false} />
        <XAxis type="number" tickFormatter={formatNum} stroke="#c3c2b7" tick={{ fill: "#898781", fontSize: 12 }} />
        <YAxis type="category" dataKey="stage" width={80} stroke="#c3c2b7" tick={{ fill: "#52514e", fontSize: 13 }} />
        <Tooltip
          formatter={(v) => formatNum(Number(v))}
          contentStyle={{ background: "#fcfcfb", border: "1px solid rgba(11,11,11,0.1)", borderRadius: 8, fontSize: 13 }}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {steps.map((_, i) => (
            <Cell key={i} fill={STEP_COLORS[i % STEP_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
