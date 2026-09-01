import { useState } from "react";
import { useApiData } from "../hooks/useApiData";
import { FunnelChart } from "../components/FunnelChart";
import { formatNum } from "../components/KpiCard";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface FunnelData {
  channel: string;
  steps: { stage: string; value: number }[];
  exit: number;
}

interface CohortPoint {
  day: number;
  cnt: number;
  cumulativePct: number;
}

type Channel = "toast" | "smart";
type CohortType = "popup" | "coupon";

export function Funnel() {
  const [channel, setChannel] = useState<Channel>("toast");
  const [cohortType, setCohortType] = useState<CohortType>("popup");
  const { data, loading, error } = useApiData<FunnelData>("/funnel", { channel });
  const { data: cohort } = useApiData<{ points: CohortPoint[] }>("/trend/cohort", { type: cohortType });

  return (
    <div>
      <div className="page-title">퍼널 분석</div>
      <div className="controls-row">
        <div className="pill-toggle">
          {(["toast", "smart"] as Channel[]).map((c) => (
            <button key={c} className={c === channel ? "pill-btn active" : "pill-btn"} onClick={() => setChannel(c)}>
              {c === "toast" ? "토스트팝업" : "스마트알림"}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">전체 캠페인 합산 퍼널 (모수 → 노출 → 클릭 → 전환)</div>
        {loading && <div className="state-msg">불러오는 중...</div>}
        {error && <div className="state-msg">오류: {error}</div>}
        {data && (
          <>
            <FunnelChart steps={data.steps} />
            <div className="badge">이탈(노출 후 미클릭): {formatNum(data.exit)}</div>
          </>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">발송/발급 후 경과일별 반응 곡선</div>
        <div className="controls-row">
          <div className="pill-toggle">
            {(["popup", "coupon"] as CohortType[]).map((t) => (
              <button
                key={t}
                className={t === cohortType ? "pill-btn active" : "pill-btn"}
                onClick={() => setCohortType(t)}
              >
                {t === "popup" ? "팝업 반응" : "쿠폰 사용"}
              </button>
            ))}
          </div>
        </div>
        {cohort && (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cohort.points.map((p) => ({ ...p, cumulativePctDisplay: Number((p.cumulativePct * 100).toFixed(2)) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" label={{ value: "경과일", position: "insideBottom", offset: -2 }} />
              <YAxis yAxisId="left" tickFormatter={formatNum} />
              <YAxis yAxisId="right" orientation="right" unit="%" />
              <Tooltip />
              <Line yAxisId="left" type="monotone" dataKey="cnt" name="일별 반응수" stroke="#4f7cff" dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="cumulativePctDisplay" name="누적 비중(%)" stroke="#ff8a4f" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
