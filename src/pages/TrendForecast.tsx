import { useState } from "react";
import { useApiData } from "../hooks/useApiData";
import { TrendChart } from "../components/TrendChart";

interface CalendarPoint {
  date: string;
  value: number;
}

type Channel = "TOAST" | "SMART";

export function TrendForecast() {
  const [channel, setChannel] = useState<Channel>("TOAST");
  const { data, loading, error } = useApiData<{ actual: CalendarPoint[]; forecast: CalendarPoint[] }>(
    "/trend/calendar",
    { channel }
  );

  const merged = data
    ? [
        ...data.actual.map((p) => ({ date: p.date, actual: p.value })),
        ...data.forecast.map((p) => ({ date: p.date, forecast: p.value })),
      ]
    : [];

  return (
    <div>
      <div className="page-title">일자별 추세예측</div>
      <div className="controls-row">
        <div className="pill-toggle">
          {(["TOAST", "SMART"] as Channel[]).map((c) => (
            <button key={c} className={c === channel ? "pill-btn active" : "pill-btn"} onClick={() => setChannel(c)}>
              {c === "TOAST" ? "토스트팝업" : "스마트알림"}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          일자별 실제 반응 추세 + 향후 7일 예측 (선형회귀, {channel === "TOAST" ? "토스트팝업" : "스마트알림"})
        </div>
        {loading && <div className="state-msg">불러오는 중...</div>}
        {error && <div className="state-msg">오류: {error}</div>}
        {merged.length > 0 && <TrendChart points={merged} />}
      </div>
    </div>
  );
}
