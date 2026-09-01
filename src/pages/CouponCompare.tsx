import { useMemo } from "react";
import { useApiData } from "../hooks/useApiData";
import { DataTable } from "../components/DataTable";
import { formatNum, formatPct } from "../components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Coupon {
  cmpgnId: string;
  cmpgnNm: string;
  copnPlcyNm: string;
  issued: number;
  used: number;
  useRate: number;
}

export function CouponCompare() {
  const { data, loading, error } = useApiData<Coupon[]>("/coupons");

  const top = useMemo(() => {
    if (!data) return [];
    return [...data]
      .filter((c) => c.issued > 0)
      .sort((a, b) => b.issued - a.issued)
      .slice(0, 15)
      .map((c) => ({
        name: (c.copnPlcyNm || c.cmpgnNm || c.cmpgnId).slice(0, 20),
        useRatePct: Number((c.useRate * 100).toFixed(3)),
      }));
  }, [data]);

  if (loading) return <div className="state-msg">불러오는 중...</div>;
  if (error) return <div className="state-msg">오류: {error}</div>;

  return (
    <div>
      <div className="page-title">쿠폰별 비교</div>

      <div className="panel">
        <div className="panel-title">발급 상위 15개 쿠폰정책 - 사용률 (%)</div>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={top} layout="vertical" margin={{ left: 140 }}>
            <XAxis type="number" unit="%" />
            <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="useRatePct" name="사용률" fill="#4f7cff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <div className="panel-title">쿠폰정책별 발급/사용 전체 목록</div>
        <DataTable
          keyFn={(r) => `${r.cmpgnId}-${r.copnPlcyNm}-${r._idx}`}
          rows={(data || []).map((r, i) => ({ ...r, _idx: i }))}
          columns={[
            { key: "cmpgnNm", label: "캠페인명" },
            { key: "copnPlcyNm", label: "쿠폰정책" },
            { key: "issued", label: "발급수", align: "right", render: (r) => formatNum(r.issued) },
            { key: "used", label: "사용수", align: "right", render: (r) => formatNum(r.used) },
            { key: "useRate", label: "사용률", align: "right", render: (r) => formatPct(r.useRate) },
          ]}
        />
      </div>
    </div>
  );
}
