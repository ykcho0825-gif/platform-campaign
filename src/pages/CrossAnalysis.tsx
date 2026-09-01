import { useMemo, useState } from "react";
import { useApiData } from "../hooks/useApiData";
import { HeatmapTable } from "../components/HeatmapTable";
import { formatNum } from "../components/KpiCard";

interface ProductChannel {
  product: string;
  TOAST: number;
  SMART: number;
}

interface CampaignDayband {
  cmpgnId: string;
  cmpgnNm: string;
  [dayband: string]: string | number;
}

type Mode = "product" | "campaign";

export function CrossAnalysis() {
  const [mode, setMode] = useState<Mode>("product");
  const { data: productData, loading: l1, error: e1 } = useApiData<ProductChannel[]>("/cross/product-channel");
  const { data: campaignData, loading: l2, error: e2 } = useApiData<CampaignDayband[]>("/cross/campaign-dayband");

  const productRows = useMemo(() => (productData || []).sort((a, b) => b.TOAST + b.SMART - (a.TOAST + a.SMART)).slice(0, 20), [productData]);

  return (
    <div>
      <div className="page-title">교차분석</div>
      <div className="controls-row">
        <div className="pill-toggle">
          <button className={mode === "product" ? "pill-btn active" : "pill-btn"} onClick={() => setMode("product")}>
            상품 × 채널
          </button>
          <button className={mode === "campaign" ? "pill-btn active" : "pill-btn"} onClick={() => setMode("campaign")}>
            캠페인 × 경과일구간
          </button>
        </div>
      </div>

      {mode === "product" && (
        <div className="panel">
          <div className="panel-title">상품(상위 20개) × 채널 반응건수</div>
          {l1 && <div className="state-msg">불러오는 중...</div>}
          {e1 && <div className="state-msg">오류: {e1}</div>}
          {productRows.length > 0 && (
            <HeatmapTable
              rowLabels={productRows.map((p) => p.product)}
              colLabels={["TOAST", "SMART"]}
              getValue={(row, col) => {
                const r = productRows.find((p) => p.product === row);
                return r ? (col === "TOAST" ? r.TOAST : r.SMART) : 0;
              }}
              formatValue={formatNum}
            />
          )}
        </div>
      )}

      {mode === "campaign" && (
        <div className="panel">
          <div className="panel-title">캠페인(반응량 상위 20개) × 발송 후 경과일구간 반응건수</div>
          {l2 && <div className="state-msg">불러오는 중...</div>}
          {e2 && <div className="state-msg">오류: {e2}</div>}
          {campaignData && campaignData.length > 0 && (
            <HeatmapTable
              rowLabels={campaignData.map((c) => c.cmpgnNm)}
              colLabels={["0일", "1-3일", "4-7일", "8일+"]}
              getValue={(row, col) => {
                const r = campaignData.find((c) => c.cmpgnNm === row);
                return r ? (r[col] as number) : 0;
              }}
              formatValue={formatNum}
            />
          )}
        </div>
      )}
    </div>
  );
}
