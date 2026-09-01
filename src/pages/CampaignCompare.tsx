import { useMemo, useState } from "react";
import { useApiData } from "../hooks/useApiData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { formatPct } from "../components/KpiCard";
import { DataTable } from "../components/DataTable";

interface Campaign {
  cmpgnId: string;
  cmpgnNm: string;
  svcCnt: number;
  toast: { showRate: number; clickRate: number };
  smart: { showRate: number; clickRate: number };
}

type Channel = "toast" | "smart";

export function CampaignCompare() {
  const { data, loading, error } = useApiData<Campaign[]>("/campaigns");
  const [channel, setChannel] = useState<Channel>("toast");

  const top = useMemo(() => {
    if (!data) return [];
    return [...data]
      .sort((a, b) => b.svcCnt - a.svcCnt)
      .slice(0, 15)
      .map((c) => ({
        name: c.cmpgnNm.length > 18 ? c.cmpgnNm.slice(0, 18) + "…" : c.cmpgnNm,
        showRate: Number((c[channel].showRate * 100).toFixed(2)),
        clickRate: Number((c[channel].clickRate * 100).toFixed(2)),
      }));
  }, [data, channel]);

  if (loading) return <div className="state-msg">불러오는 중...</div>;
  if (error) return <div className="state-msg">오류: {error}</div>;

  return (
    <div>
      <div className="page-title">캠페인별 비교</div>
      <div className="controls-row">
        <div className="pill-toggle">
          {(["toast", "smart"] as Channel[]).map((c) => (
            <button
              key={c}
              className={c === channel ? "pill-btn active" : "pill-btn"}
              onClick={() => setChannel(c)}
            >
              {c === "toast" ? "토스트팝업" : "스마트알림"}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">서비스 모수 상위 15개 캠페인 - 노출율 / 반응율 (%)</div>
        <ResponsiveContainer width="100%" height={420}>
          <BarChart data={top} layout="vertical" margin={{ left: 120 }}>
            <XAxis type="number" unit="%" />
            <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="showRate" name="노출율" fill="#4f7cff" />
            <Bar dataKey="clickRate" name="반응율" fill="#ff8a4f" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel">
        <div className="panel-title">전체 캠페인 지표 ({channel === "toast" ? "토스트팝업" : "스마트알림"})</div>
        <DataTable
          keyFn={(r) => r.cmpgnId}
          rows={data || []}
          columns={[
            { key: "cmpgnId", label: "캠페인 ID" },
            { key: "cmpgnNm", label: "캠페인명" },
            { key: "showRate", label: "노출율", align: "right", render: (r) => formatPct(r[channel].showRate) },
            { key: "clickRate", label: "반응율", align: "right", render: (r) => formatPct(r[channel].clickRate) },
          ]}
        />
      </div>
    </div>
  );
}
