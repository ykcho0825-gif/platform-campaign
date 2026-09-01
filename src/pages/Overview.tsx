import { useApiData } from "../hooks/useApiData";
import { KpiCard, formatNum, formatPct } from "../components/KpiCard";
import { TrendChart } from "../components/TrendChart";

interface SummaryData {
  campaignCount: number;
  toast: { pop: number; show: number; click: number; go: number; showRate: number; clickRate: number };
  smart: { pop: number; show: number; click: number; go: number; showRate: number; clickRate: number };
  coupon: { issued: number; used: number; useRate: number };
}

interface CalendarPoint {
  date: string;
  value: number;
}

export function Overview() {
  const { data, loading, error } = useApiData<SummaryData>("/summary");
  const { data: toastTrend } = useApiData<{ actual: CalendarPoint[]; forecast: CalendarPoint[] }>(
    "/trend/calendar",
    { channel: "TOAST" }
  );

  if (loading) return <div className="state-msg">불러오는 중...</div>;
  if (error) return <div className="state-msg">오류: {error}</div>;
  if (!data) return null;

  const merged = mergeTrend(toastTrend);

  return (
    <div>
      <div className="page-title">전체 현황</div>
      <div className="kpi-row">
        <KpiCard label="전체 캠페인 수" value={formatNum(data.campaignCount)} />
        <KpiCard
          label="토스트팝업 모수대비노출"
          value={formatPct(data.toast.showRate)}
          sub={`${formatNum(data.toast.show)} / ${formatNum(data.toast.pop)}`}
        />
        <KpiCard
          label="토스트팝업 노출대비반응"
          value={formatPct(data.toast.clickRate)}
          sub={`${formatNum(data.toast.click)} / ${formatNum(data.toast.show)}`}
        />
        <KpiCard
          label="스마트알림 모수대비노출"
          value={formatPct(data.smart.showRate)}
          sub={`${formatNum(data.smart.show)} / ${formatNum(data.smart.pop)}`}
        />
        <KpiCard
          label="스마트알림 노출대비반응"
          value={formatPct(data.smart.clickRate)}
          sub={`${formatNum(data.smart.click)} / ${formatNum(data.smart.show)}`}
        />
        <KpiCard
          label="쿠폰 반응률(사용/발급)"
          value={formatPct(data.coupon.useRate)}
          sub={`${formatNum(data.coupon.used)} / ${formatNum(data.coupon.issued)}`}
        />
      </div>

      <div className="panel">
        <div className="panel-title">토스트팝업 일자별 반응 추세 (실제 + 향후 7일 예측)</div>
        <TrendChart points={merged} />
      </div>
    </div>
  );
}

function mergeTrend(trend?: { actual: CalendarPoint[]; forecast: CalendarPoint[] } | null) {
  if (!trend) return [];
  const actual = trend.actual.map((p) => ({ date: p.date, actual: p.value }));
  const forecast = trend.forecast.map((p) => ({ date: p.date, forecast: p.value }));
  return [...actual, ...forecast];
}
