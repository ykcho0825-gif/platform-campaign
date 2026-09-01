interface Props {
  rowLabels: string[];
  colLabels: string[];
  getValue: (row: string, col: string) => number;
  formatValue?: (v: number) => string;
}

export function HeatmapTable({ rowLabels, colLabels, getValue, formatValue }: Props) {
  const allValues = rowLabels.flatMap((r) => colLabels.map((c) => getValue(r, c)));
  const max = Math.max(1, ...allValues);
  const fmt = formatValue || ((v: number) => v.toLocaleString("ko-KR"));

  return (
    <div className="table-wrap">
      <table className="data-table heatmap">
        <thead>
          <tr>
            <th></th>
            {colLabels.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((r) => (
            <tr key={r}>
              <td className="heatmap-row-label">{r}</td>
              {colLabels.map((c) => {
                const v = getValue(r, c);
                const intensity = v / max;
                return (
                  <td
                    key={c}
                    style={{ backgroundColor: `rgba(79, 124, 255, ${0.08 + intensity * 0.55})` }}
                  >
                    {fmt(v)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
