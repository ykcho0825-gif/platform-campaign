import { useApiData } from "../hooks/useApiData";
import { DataTable } from "../components/DataTable";
import { formatNum, formatPct } from "../components/KpiCard";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Product {
  prodNm: string;
  campaignCount: number;
  svcCnt: number;
  copnUseCnt: number;
  toast: { showRate: number; clickRate: number };
  smart: { showRate: number; clickRate: number };
}

export function ProductCompare() {
  const { data, loading, error } = useApiData<Product[]>("/products");

  if (loading) return <div className="state-msg">불러오는 중...</div>;
  if (error) return <div className="state-msg">오류: {error}</div>;

  const chartData = (data || [])
    .slice(0, 12)
    .map((p) => ({
      name: p.prodNm && p.prodNm.length > 12 ? p.prodNm.slice(0, 12) + "…" : p.prodNm || "미분류",
      toastClick: Number((p.toast.clickRate * 100).toFixed(2)),
      smartClick: Number((p.smart.clickRate * 100).toFixed(2)),
    }));

  return (
    <div>
      <div className="page-title">상품간 비교</div>

      <div className="panel">
        <div className="panel-title">서비스 모수 상위 12개 상품 - 채널별 반응율(%)</div>
        <ResponsiveContainer width="100%" height={380}>
          <BarChart data={chartData}>
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis unit="%" />
            <Tooltip />
            <Legend />
            <Bar dataKey="toastClick" name="토스트 반응율" fill="#4f7cff" />
            <Bar dataKey="smartClick" name="스마트 반응율" fill="#ff8a4f" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <div className="panel-title">상품별 종합 지표</div>
        <DataTable
          keyFn={(r) => r.prodNm || "미분류"}
          rows={data || []}
          columns={[
            { key: "prodNm", label: "상품명", render: (r) => r.prodNm || "미분류" },
            { key: "campaignCount", label: "캠페인 수", align: "right", render: (r) => formatNum(r.campaignCount) },
            { key: "svcCnt", label: "서비스 모수", align: "right", render: (r) => formatNum(r.svcCnt) },
            { key: "toastClick", label: "토스트 반응율", align: "right", render: (r) => formatPct(r.toast.clickRate) },
            { key: "smartClick", label: "스마트 반응율", align: "right", render: (r) => formatPct(r.smart.clickRate) },
            { key: "copnUseCnt", label: "쿠폰 사용수", align: "right", render: (r) => formatNum(r.copnUseCnt) },
          ]}
        />
      </div>
    </div>
  );
}
