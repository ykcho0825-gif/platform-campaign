interface Props {
  label: string;
  value: string;
  sub?: string;
}

export function KpiCard({ label, value, sub }: Props) {
  return (
    <div className="kpi-card">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function formatNum(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function formatPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}
