import { useEffect, useMemo, useState, type FormEvent } from "react";
import { apiGet, apiPost } from "../api/client";
import {
  buildDayPlan,
  isMonthly,
  parseHour,
  parseTarget,
  type ConfirmedSlot,
  type PendingSlotCandidate,
} from "../lib/executionSchedule";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function todayIso() {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${mm}-${dd}`;
}

interface CampaignSearchResult {
  cmpgnId: string;
  cmpgnNm: string;
  owner: string;
  channel: string;
  product: string;
}

interface CampaignApplication {
  applicationId: string;
  cmpgnId: string;
  cmpgnNm: string;
  owner: string;
  channel: string;
  product: string;
  startDate: string;
  endDate: string;
  expectedVolume: number;
  budget: number;
  memo: string;
}

interface PendingSheetApplication {
  applicationId: string;
  applicationKey: string;
  cmpgnNm: string;
  owner: string;
  channel: string;
  product: string;
  startDate: string;
  endDate: string;
  department: string;
  coupon: string;
  target: string;
  category: string;
}

interface ConfirmedSheetRow {
  cmpgnNm: string;
  owner: string;
  startDate: string;
  channel: string;
  coupon: string;
  target: string;
  executionAt: string;
}

interface FormState {
  cmpgnId: string;
  cmpgnNm: string;
  owner: string;
  channel: string;
  product: string;
  startDate: string;
  endDate: string;
  expectedVolume: string;
  budget: string;
  memo: string;
  category: string;
  coupon: string;
  department: string;
}

const initialForm: FormState = {
  cmpgnId: "",
  cmpgnNm: "",
  owner: "",
  channel: "",
  product: "",
  startDate: todayIso(),
  endDate: todayIso(),
  expectedVolume: "",
  budget: "",
  memo: "",
  category: "",
  coupon: "",
  department: "",
};

const HOUR_OPTIONS = Array.from({ length: 23 }, (_, i) => String(i + 1).padStart(2, "0"));

const SHEET_GID = "1621616972";
const APPLICATIONS_SHEET_ENDPOINT = "/campaign-dashboard0-v2-4/api/applications/sheet";

export function CalendarMockup() {
  const [ownerKeyword, setOwnerKeyword] = useState("");
  const [campaignKeyword, setCampaignKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<CampaignSearchResult[]>([]);
  const [applications, setApplications] = useState<CampaignApplication[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [selectedPendingId, setSelectedPendingId] = useState("");
  const [form, setForm] = useState<FormState>(initialForm);
  const [pendingApplications, setPendingApplications] = useState<PendingSheetApplication[]>([]);
  const [confirmedRows, setConfirmedRows] = useState<ConfirmedSheetRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [executionDate, setExecutionDate] = useState("");
  const [executionHour, setExecutionHour] = useState("");
  const [recommendedHour, setRecommendedHour] = useState<number | null>(null);
  const [recommendationReason, setRecommendationReason] = useState("");
  const [updatingExecution, setUpdatingExecution] = useState(false);
  const [syncingConfirmed, setSyncingConfirmed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadApplications();
    void loadPendingApplications();
  }, []);

  useEffect(() => {
    const selected = searchResults.find((item) => item.cmpgnId === selectedCampaignId);
    if (!selected) return;
    setForm((prev) => ({
      ...prev,
      cmpgnId: selected.cmpgnId,
      cmpgnNm: selected.cmpgnNm,
      owner: selected.owner,
      channel: selected.channel,
      product: selected.product,
    }));
  }, [searchResults, selectedCampaignId]);

  useEffect(() => {
    if (!pendingApplications.length) {
      setSelectedPendingId("");
      return;
    }
    setSelectedPendingId((current) =>
      pendingApplications.some((item) => item.applicationId === current) ? current : pendingApplications[0].applicationId
    );
  }, [pendingApplications]);

  const dayPlans = useMemo(() => {
    const plans = new Map<string, ReturnType<typeof buildDayPlan>>();
    const dates = new Set(pendingApplications.map((item) => item.startDate));
    dates.forEach((date) => {
      const confirmed: ConfirmedSlot[] = confirmedRows
        .filter((row) => row.startDate === date)
        .map((row) => ({
          name: row.cmpgnNm,
          owner: row.owner,
          channel: row.channel,
          coupon: row.coupon,
          target: parseTarget(row.target),
          hour: parseHour(row.executionAt),
        }))
        .filter((row): row is ConfirmedSlot => row.hour !== null);

      const pending: PendingSlotCandidate[] = pendingApplications
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.startDate === date)
        .map(({ item, index }) => ({
          key: item.applicationKey,
          name: item.cmpgnNm,
          owner: item.owner,
          channel: item.channel,
          coupon: item.coupon,
          target: parseTarget(item.target),
          isMonthlyPriority: isMonthly(item.cmpgnNm),
          order: index,
        }));

      plans.set(date, buildDayPlan(date, confirmed, pending));
    });
    return plans;
  }, [pendingApplications, confirmedRows]);

  function getRecommendation(item: PendingSheetApplication): { hour: number | null; reason: string } {
    const rec = dayPlans.get(item.startDate)?.recommendedByKey.get(item.applicationKey);
    return { hour: rec?.hour ?? null, reason: rec?.reason ?? "추천 가능한 시간이 없습니다." };
  }

  useEffect(() => {
    setExecutionHour("");
    if (selectedPendingApplication) {
      setExecutionDate(selectedPendingApplication.startDate);
      const rec = getRecommendation(selectedPendingApplication);
      setRecommendedHour(rec.hour);
      setRecommendationReason(rec.reason);
    } else {
      setExecutionDate("");
      setRecommendedHour(null);
      setRecommendationReason("");
    }
  }, [selectedPendingId, dayPlans]);

  async function loadApplications() {
    try {
      const data = await apiGet<CampaignApplication[]>("/applications");
      setApplications(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청 목록을 불러오지 못했습니다.");
    }
  }

  async function loadPendingApplications() {
    setSheetLoading(true);
    try {
      const { pending, confirmed } = await loadSheetRows();
      setPendingApplications(pending);
      setConfirmedRows(confirmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "시트 신청 목록을 불러오지 못했습니다.");
    } finally {
      setSheetLoading(false);
    }
  }

  async function handleSearch() {
    setSearching(true);
    setError(null);
    setFeedback(null);
    try {
      const data = await apiGet<CampaignSearchResult[]>("/applications/search", {
        owner: ownerKeyword,
        campaignName: campaignKeyword,
      });
      setSearchResults(data);
      setSelectedCampaignId(data[0]?.cmpgnId ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "캠페인 검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      await appendApplicationToSheet({
        cmpgnNm: form.cmpgnNm,
        startDate: form.startDate,
        endDate: form.endDate,
        channel: form.channel,
        category: form.category,
        coupon: form.coupon,
        target: form.expectedVolume,
        department: form.department,
        owner: form.owner,
      });

      const created = await apiPost<CampaignApplication, Omit<CampaignApplication, "applicationId">>(
        "/applications",
        {
          cmpgnId: form.cmpgnId,
          cmpgnNm: form.cmpgnNm,
          owner: form.owner,
          channel: form.channel,
          product: form.product,
          startDate: form.startDate,
          endDate: form.endDate,
          expectedVolume: Number(form.expectedVolume || 0),
          budget: Number(form.budget || 0),
          memo: form.memo,
        }
      );
      setApplications((prev) => [created, ...prev]);
      setFeedback(`신청이 등록되었습니다: ${created.cmpgnNm}`);
      setForm((prev) => ({
        ...initialForm,
        startDate: prev.startDate,
        endDate: prev.endDate,
      }));
      setSelectedCampaignId("");
      void loadPendingApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : "신청 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSyncConfirmed() {
    if (!window.confirm("'확정' 탭 내용을 지금의 확정 캘린더로 완전히 덮어씁니다. 계속할까요?")) return;
    setSyncingConfirmed(true);
    setError(null);
    setFeedback(null);
    try {
      const result = await apiPost<{ ok: boolean; count: number }, Record<string, never>>(
        "/applications/sheet/sync-confirmed",
        {}
      );
      setFeedback(`'확정' 탭을 ${result.count}건으로 갱신했습니다.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "'확정' 탭 동기화에 실패했습니다.");
    } finally {
      setSyncingConfirmed(false);
    }
  }

  async function handleExecutionConfirm() {
    if (!selectedPendingApplication || !executionAt) return;
    setUpdatingExecution(true);
    setError(null);
    try {
      await updateExecutionInSheet(selectedPendingApplication.applicationKey, executionAt);
      setFeedback(`${selectedPendingApplication.cmpgnNm} 실행시각이 확정되었습니다.`);
      await loadPendingApplications();
    } catch (e) {
      setError(e instanceof Error ? e.message : "실행시각 확정에 실패했습니다.");
    } finally {
      setUpdatingExecution(false);
    }
  }

  const calendarDays = useMemo(() => buildCalendarDays(applications), [applications]);
  const selectedPendingApplication =
    pendingApplications.find((item) => item.applicationId === selectedPendingId) ?? pendingApplications[0] ?? null;
  const executionAt = executionDate && executionHour ? `${executionDate} ${executionHour}시` : "";

  return (
    <div>
      <div className="page-title">캠페인 신청 및 캘린더</div>

      <div className="panel application-hero">
        <div>
          <div className="panel-title">새 캠페인 신청</div>
          <div className="application-hero-copy">
            실행한 캠페인을 검색해서 불러오고, 캘린더에 반영할 운영 기간과 주요 값을 바로 등록할 수 있습니다.
          </div>
        </div>
        <div className="application-hero-badges">
          <span className="badge">검색 기반 불러오기</span>
          <span className="badge">캘린더 즉시 반영</span>
          <span className="badge">J열 비어 있는 신청만 노출</span>
        </div>
      </div>

      <div className="application-grid owner-mode-grid">
        <div className="panel">
          <div className="panel-title">담당자 모드 · 캠페인 신청 목록</div>
          <div className="application-hero-copy">
            신청 시트(Excel)에서 `A~I` 값이 있고 `J열 실행시각`이 비어 있는 신청만 보여줍니다.
          </div>
          <button
            className="action-btn"
            type="button"
            disabled={syncingConfirmed}
            onClick={() => void handleSyncConfirmed()}
          >
            {syncingConfirmed ? "'확정' 탭 갱신 중..." : "'확정' 탭 전체 갱신"}
          </button>
          {feedback ? <div className="feedback success">{feedback}</div> : null}
          {error ? <div className="feedback error">{error}</div> : null}
          <div className="application-list pending-application-list">
            {sheetLoading ? <div className="state-msg compact">시트 신청 목록을 불러오는 중입니다...</div> : null}
            {!sheetLoading && pendingApplications.length === 0 ? (
              <div className="state-msg compact">현재 실행시각 입력이 필요한 신청이 없습니다.</div>
            ) : null}
            {pendingApplications.map((item) => (
              <button
                key={item.applicationId}
                type="button"
                className={selectedPendingId === item.applicationId ? "application-row pending active" : "application-row pending"}
                onClick={() => setSelectedPendingId(item.applicationId)}
              >
                <div>
                  <strong>{item.cmpgnNm}</strong>
                  <span>{item.owner || "담당자 미기재"}</span>
                </div>
                <div>
                  <strong>{item.startDate}</strong>
                  <span>{item.endDate}</span>
                </div>
                <div>
                  <strong>{item.channel || "-"}</strong>
                  <span>{item.product || "-"}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="panel execution-panel">
          <div className="panel-title">실행시각 입력 / 추천 레이아웃</div>
          {selectedPendingApplication ? (
            <div className="execution-layout">
              <div className="execution-summary-card">
                <span className="badge">선택된 신청</span>
                <h3>{selectedPendingApplication.cmpgnNm}</h3>
                <div className="execution-meta-grid">
                  <div>
                    <strong>담당자</strong>
                    <span>{selectedPendingApplication.owner || "-"}</span>
                  </div>
                  <div>
                    <strong>채널</strong>
                    <span>{selectedPendingApplication.channel || "-"}</span>
                  </div>
                  <div>
                    <strong>운영 기간</strong>
                    <span>
                      {selectedPendingApplication.startDate} ~ {selectedPendingApplication.endDate}
                    </span>
                  </div>
                  <div>
                    <strong>타겟</strong>
                    <span>{selectedPendingApplication.target || "-"}</span>
                  </div>
                </div>
              </div>

              <div className="execution-split">
                <section className="execution-card">
                  <div className="execution-card-title">직접 입력</div>
                  <div className="field-label">
                    실행 예정 날짜
                    <input
                      className="text-input"
                      type="date"
                      value={executionDate}
                      onChange={(event) => setExecutionDate(event.target.value)}
                    />
                  </div>
                  <div className="field-label">
                    실행 예정 시각
                    <select
                      className="text-input"
                      value={executionHour}
                      onChange={(event) => setExecutionHour(event.target.value)}
                    >
                      <option value="">선택</option>
                      {HOUR_OPTIONS.map((hh) => (
                        <option key={hh} value={hh}>
                          {hh}시
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field-label">
                    운영 메모
                    <textarea className="text-area" readOnly value="J열 실행시각과 M열 배정 완료만 기록합니다." />
                  </div>
                  <button
                    className="action-btn"
                    type="button"
                    disabled={!executionAt || updatingExecution}
                    onClick={() => void handleExecutionConfirm()}
                  >
                    {updatingExecution ? "확정 중..." : "실행시각 확정"}
                  </button>
                </section>

                <section className="execution-card recommendation-card">
                  <div className="execution-card-title">추천 영역</div>
                  <div className="recommendation-placeholder">
                    배너·쿠폰 각각 하루 최대 280만 건, 쿠폰은 시간당 12만 건 발송 속도 기준으로 기존 실행시각과 겹치지 않는 시간을 추천합니다 (17~18시 제외).
                  </div>
                  <div className="recommendation-rail">
                    <button
                      className="recommend-chip"
                      type="button"
                      disabled={recommendedHour === null}
                      title={recommendationReason || undefined}
                      onClick={() => {
                        if (recommendedHour !== null) setExecutionHour(String(recommendedHour).padStart(2, "0"));
                      }}
                    >
                      {recommendedHour !== null ? `추천: ${String(recommendedHour).padStart(2, "0")}시` : "추천 시각 없음"}
                    </button>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="state-msg compact">왼쪽 목록에서 신청 건을 선택하면 입력/추천 레이아웃이 표시됩니다.</div>
          )}
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">새 캠페인 신청 1. 실행한 캠페인 검색</div>
        <div className="controls-row">
          <input
            className="text-input"
            placeholder="담당자명"
            value={ownerKeyword}
            onChange={(event) => setOwnerKeyword(event.target.value)}
          />
          <input
            className="text-input"
            placeholder="캠페인명"
            value={campaignKeyword}
            onChange={(event) => setCampaignKeyword(event.target.value)}
          />
          <button className="action-btn" type="button" onClick={handleSearch} disabled={searching}>
            {searching ? "검색 중..." : "검색"}
          </button>
        </div>
        <div className="application-search-results">
          {searchResults.length === 0 ? (
            <div className="state-msg compact">검색 결과가 없습니다. 담당자나 캠페인명을 입력해 찾아보세요.</div>
          ) : (
            searchResults.map((result) => (
              <button
                key={result.cmpgnId}
                type="button"
                className={selectedCampaignId === result.cmpgnId ? "search-card active" : "search-card"}
                onClick={() => setSelectedCampaignId(result.cmpgnId)}
              >
                <strong>{result.cmpgnNm}</strong>
                <span>{result.owner}</span>
                <span>{result.product}</span>
                <span>{result.channel}</span>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="application-grid">
        <div className="panel">
          <div className="panel-title">새 캠페인 신청 2. 캘린더 반영값 입력</div>
          <form className="application-form" onSubmit={handleSubmit}>
            <input className="text-input" value={form.owner} placeholder="담당자" readOnly />
            <input className="text-input" value={form.cmpgnNm} placeholder="캠페인명" readOnly />
            <div className="form-split">
              <input className="text-input" value={form.channel} placeholder="채널" readOnly />
              <input className="text-input" value={form.product} placeholder="상품" readOnly />
            </div>
            <div className="form-split">
              <label className="field-label">
                시작일
                <input
                  className="text-input"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </label>
              <label className="field-label">
                종료일
                <input
                  className="text-input"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                />
              </label>
            </div>
            <div className="form-split">
              <label className="field-label">
                구분
                <input
                  className="text-input"
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  placeholder="예: 일회성, 주기성"
                />
              </label>
              <label className="field-label">
                부서
                <input
                  className="text-input"
                  value={form.department}
                  onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                  placeholder="예: PPC사업팀"
                />
              </label>
            </div>
            <label className="field-label">
              쿠폰
              <input
                className="text-input"
                value={form.coupon}
                onChange={(event) => setForm((prev) => ({ ...prev, coupon: event.target.value }))}
                placeholder="예: 셋톱박스 업그레이드 쿠폰 (없으면 '없음')"
              />
            </label>
            <div className="form-split">
              <label className="field-label">
                예상 모수
                <input
                  className="text-input"
                  type="number"
                  value={form.expectedVolume}
                  onChange={(event) => setForm((prev) => ({ ...prev, expectedVolume: event.target.value }))}
                  placeholder="예: 3000"
                />
              </label>
              <label className="field-label">
                집행 예산
                <input
                  className="text-input"
                  type="number"
                  value={form.budget}
                  onChange={(event) => setForm((prev) => ({ ...prev, budget: event.target.value }))}
                  placeholder="예: 1200000"
                />
              </label>
            </div>
            <label className="field-label">
              메모
              <textarea
                className="text-area"
                value={form.memo}
                onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
                placeholder="캠페인 운영 메모"
              />
            </label>
            <button
              className="action-btn"
              type="submit"
              disabled={
                submitting ||
                !form.cmpgnId ||
                !form.category ||
                !form.coupon ||
                !form.department ||
                !form.expectedVolume
              }
            >
              {submitting ? "전송 중..." : "캠페인 신청하기"}
            </button>
          </form>
          {feedback ? <div className="feedback success">{feedback}</div> : null}
          {error ? <div className="feedback error">{error}</div> : null}
        </div>

        <div className="panel">
          <div className="panel-title">캠페인 캘린더</div>
          <div className="calendar-mockup application-calendar">
            {DAYS.map((day) => (
              <div key={day} className="calendar-cell calendar-head">
                {day}
              </div>
            ))}
            {calendarDays.map((cell) => (
              <div key={cell.key} className="calendar-cell filled">
                <div className="calendar-date">{cell.label}</div>
                <div className="calendar-items">
                  {cell.items.map((item) => (
                    <div key={item.applicationId} className="calendar-chip">
                      <strong>{item.cmpgnNm}</strong>
                      <span>{item.owner}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">최근 신청 내역</div>
        <div className="application-list">
          {applications.map((item) => (
            <div key={item.applicationId} className="application-row">
              <div>
                <strong>{item.cmpgnNm}</strong>
                <span>{item.owner}</span>
              </div>
              <div>
                <strong>{item.startDate}</strong>
                <span>{item.endDate}</span>
              </div>
              <div>
                <strong>{item.expectedVolume.toLocaleString()}</strong>
                <span>예상 모수</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function loadSheetRows(): Promise<{ pending: PendingSheetApplication[]; confirmed: ConfirmedSheetRow[] }> {
  const res = await fetch(`/campaign-dashboard0-v2-4/api/applications/sheet?gid=${SHEET_GID}&tqx=out:json&_=${Date.now()}`);
  if (!res.ok) throw new Error(`시트 조회 실패 (HTTP ${res.status})`);

  const text = await res.text();
  const json = unwrapGviz(text);
  const rows = json.table?.rows ?? [];

  const pending: PendingSheetApplication[] = [];
  const confirmed: ConfirmedSheetRow[] = [];

  rows.forEach((row: { c?: Array<{ v?: unknown; f?: unknown } | null> }, index: number) => {
    const cells = row.c ?? [];
    const values = Array.from({ length: 11 }, (_, idx) => cellText(cells[idx]));
    const hasRequiredValues = values.slice(0, 9).every((value) => value.trim() !== "");
    if (!hasRequiredValues) return;

    const executionAt = values[9];
    const startDate = normalizeDate(values[1]);
    const cmpgnNm = values[0];
    const channel = values[3];
    const owner = values[8];
    const coupon = values[5];
    const target = values[6];

    if (executionAt.trim() !== "") {
      confirmed.push({ cmpgnNm, owner, startDate, channel, coupon, target, executionAt });
      return;
    }

    const applicationKey = values[10];
    if (!applicationKey.trim()) return;

    pending.push({
      applicationId: `sheet-${index}`,
      applicationKey,
      cmpgnNm,
      startDate,
      endDate: normalizeDate(values[2]),
      channel: values[3],
      category: values[4],
      coupon,
      target,
      department: values[7],
      owner,
      product: values[7],
    });
  });

  return { pending, confirmed };
}

async function appendApplicationToSheet(payload: {
  cmpgnNm: string;
  startDate: string;
  endDate: string;
  channel: string;
  category: string;
  coupon: string;
  target: string;
  department: string;
  owner: string;
}) {
  const res = await fetch(APPLICATIONS_SHEET_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      cmpgnNm: payload.cmpgnNm,
      startDate: payload.startDate,
      endDate: payload.endDate,
      channel: payload.channel,
      category: payload.category,
      coupon: payload.coupon,
      target: payload.target,
      department: payload.department,
      owner: payload.owner,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `신청 시트 저장 실패 (HTTP ${res.status})`);
  }
}

async function updateExecutionInSheet(applicationKey: string, executionAt: string) {
  const res = await fetch(APPLICATIONS_SHEET_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updateExecution", applicationKey, executionAt }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `실행시각 저장 실패 (HTTP ${res.status})`);
  }
}

function unwrapGviz(text: string) {
  const start = text.indexOf("(");
  const end = text.lastIndexOf(")");
  if (start === -1 || end === -1) throw new Error("신청 시트 응답 형식을 해석하지 못했습니다.");
  return JSON.parse(text.slice(start + 1, end));
}

function cellText(cell: { v?: unknown; f?: unknown } | null | undefined) {
  if (!cell) return "";
  return String(cell.f ?? cell.v ?? "");
}

function normalizeDate(value: string) {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\.?$/.test(trimmed)) {
    const [year, month, day] = trimmed.replace(/\.$/, "").split(".").map((part) => part.trim());
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  if (/^\d{8}$/.test(trimmed)) return `${trimmed.slice(0, 4)}-${trimmed.slice(4, 6)}-${trimmed.slice(6, 8)}`;
  if (/^\d{4,6}$/.test(trimmed)) {
    // 엑셀 날짜 셀의 일련번호(1899-12-30 기준 경과일수)를 그대로 돌려주는 경우
    const serial = Number(trimmed);
    const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(date.getUTCDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  return trimmed;
}

function buildCalendarDays(applications: CampaignApplication[]) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const monthStr = String(month + 1).padStart(2, "0");

  return Array.from({ length: totalCells }, (_, index) => {
    const dateNumber = index - firstDay + 1;
    if (dateNumber < 1 || dateNumber > daysInMonth) {
      return { key: `blank-${index}`, label: "", items: [] as CampaignApplication[] };
    }

    const isoDate = `${year}-${monthStr}-${String(dateNumber).padStart(2, "0")}`;
    const items = applications.filter((item) => isoDate >= item.startDate && isoDate <= item.endDate);
    return {
      key: isoDate,
      label: String(dateNumber),
      items,
    };
  });
}
