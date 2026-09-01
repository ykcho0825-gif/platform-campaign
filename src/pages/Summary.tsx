import { useMemo, useState } from "react";
import { useApiData } from "../hooks/useApiData";
import { DataTable } from "../components/DataTable";
import { formatNum, formatPct } from "../components/KpiCard";

interface Campaign {
  cmpgnId: string;
  cmpgnNm: string;
  prodNm: string;
  svcCnt: number;
  toast: { show: number; click: number; showRate: number; clickRate: number };
  smart: { show: number; click: number; showRate: number; clickRate: number };
  copnUseCnt: number;
}

export function Summary() {
  const { data, loading, error } = useApiData<Campaign[]>("/campaigns");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter(
      (c) => c.cmpgnNm.toLowerCase().includes(s) || c.cmpgnId.toLowerCase().includes(s) || (c.prodNm || "").toLowerCase().includes(s)
    );
  }, [data, search]);

  if (loading) return <div className="state-msg">불러오는 중...</div>;
  if (error) return <div className="state-msg">오류: {error}</div>;

  return (
    <div>
      <div className="page-title">캠페인 요약</div>
      <div className="controls-row">
        <input
          className="text-input"
          placeholder="캠페인명 / ID / 상품명 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 260 }}
        />
        <span className="badge">{filtered.length}건</span>
      </div>
      <div className="panel">
        <DataTable
          keyFn={(r) => r.cmpgnId}
          rows={filtered}
          columns={[
            { key: "cmpgnId", label: "캠페인 ID" },
            { key: "cmpgnNm", label: "캠페인명" },
            { key: "prodNm", label: "상품" },
            { key: "svcCnt", label: "서비스 모수", align: "right", render: (r) => formatNum(r.svcCnt) },
            { key: "toastShow", label: "토스트 노출율", align: "right", render: (r) => formatPct(r.toast.showRate) },
            { key: "toastClick", label: "토스트 반응율", align: "right", render: (r) => formatPct(r.toast.clickRate) },
            { key: "smartShow", label: "스마트 노출율", align: "right", render: (r) => formatPct(r.smart.showRate) },
            { key: "smartClick", label: "스마트 반응율", align: "right", render: (r) => formatPct(r.smart.clickRate) },
            { key: "copnUseCnt", label: "쿠폰 사용수", align: "right", render: (r) => formatNum(r.copnUseCnt) },
          ]}
        />
      </div>
    </div>
  );
}
