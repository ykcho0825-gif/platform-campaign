import { randomUUID } from "node:crypto";

// Power Automate "HTTP 요청 수신 시" 트리거 웹훅 URL. 사내망(SharePoint/OneDrive)에 있는
// M365 공유 엑셀 파일에 행을 추가/조회/수정하는 플로우 하나를 가리킨다.
// 구성 방법은 docs/PowerAutomate.md 참고.
const WEBHOOK_URL = process.env.POWER_AUTOMATE_WEBHOOK_URL;

async function callFlow(body) {
  if (!WEBHOOK_URL) {
    throw new Error("POWER_AUTOMATE_WEBHOOK_URL 환경변수가 설정되어 있지 않습니다.");
  }
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Power Automate 플로우 응답 실패 (HTTP ${res.status})`);
  }
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    // Power Automate may return a plain-text success body instead of JSON.
    return { raw: text };
  }
}

// A~J열(10칸) 새 행 추가. K열에 신청 고유키(applicationKey)를 함께 기록해두어
// 나중에 실행시각 확정(updateExecution) 시 이 키로 행을 다시 찾을 수 있게 한다.
export async function appendApplicationRow(payload) {
  const applicationKey = randomUUID();
  await callFlow({
    action: "create",
    cmpgnNm: payload.cmpgnNm || "",
    startDate: payload.startDate || "",
    endDate: payload.endDate || "",
    channel: payload.channel || "",
    category: payload.category || "",
    coupon: payload.coupon || "",
    target: String(payload.target ?? ""),
    department: payload.department || "",
    owner: payload.owner || "",
    applicationKey,
  });
  return applicationKey;
}

// Power Automate의 "배열 변수에 추가"는 값으로 배열을 못 받기 때문에(Object/문자열/숫자만 허용),
// 플로우에서는 엑셀 행 객체(현재 항목)를 그대로 rows에 쌓아서 보낸다. 여기서 A~M열 순서에 맞는
// 위치 배열로 변환한다. index 10 자리에 K열(applicationKey)이 들어온다.
const ROW_COLUMNS = [
  "캠페인명", "시작일", "종료일", "채널", "구분", "쿠폰", "타겟",
  "부서", "담당자", "실행시각", "신청ID", "상태", "배정시각",
];

// 엑셀 날짜 셀이 텍스트가 아니라 실제 날짜 형식이면, Excel Online 커넥터가 화면에 보이는
// 문자열이 아니라 내부 일련번호(1899-12-30 기준 경과일수, 예: 46267)를 그대로 돌려준다.
// 모든 소비자(React 앱, 레거시 대시보드)가 각자 처리하지 않도록 여기서 한 번에 정규화한다.
function normalizeCellDate(value) {
  const trimmed = String(value ?? "").trim();
  if (!/^\d{4,6}$/.test(trimmed)) return trimmed;
  const serial = Number(trimmed);
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const DATE_COLUMN_INDEXES = [ROW_COLUMNS.indexOf("시작일"), ROW_COLUMNS.indexOf("종료일")];

export async function getApplicationRows() {
  const result = await callFlow({ action: "list" });
  const rows = Array.isArray(result.rows) ? result.rows : [];
  return rows.map((row) =>
    ROW_COLUMNS.map((key, i) => {
      const value = String(row?.[key] ?? "");
      return DATE_COLUMN_INDEXES.includes(i) ? normalizeCellDate(value) : value;
    })
  );
}

// K열(applicationKey)로 행을 찾아 J열(실행시각) / L열(상태) / M열(배정시각)을 갱신한다.
export async function updateExecution(applicationKey, executionAt) {
  await callFlow({
    action: "updateExecution",
    applicationKey,
    executionAt,
  });
}

// '확정' 탭(캠페인명~실행시각 10개 열, 신청목록의 A~J와 동일)을 신청목록 표에서 실행시각이
// 채워진(확정된) 행만 골라 통째로 다시 채운다. 플로우 쪽 syncConfirmed 케이스가 기존
// '확정' 탭 행을 전부 지운 뒤 여기서 보낸 rows로 다시 채우는 방식이라 매번 전체 교체된다.
export async function syncConfirmedCalendar() {
  const result = await callFlow({ action: "list" });
  const rawRows = Array.isArray(result.rows) ? result.rows : [];

  const confirmedRows = rawRows
    .filter((row) => String(row?.["실행시각"] ?? "").trim() !== "")
    .map((row) => ({
      cmpgnNm: String(row?.["캠페인명"] ?? ""),
      startDate: normalizeCellDate(String(row?.["시작일"] ?? "")),
      endDate: normalizeCellDate(String(row?.["종료일"] ?? "")),
      channel: String(row?.["채널"] ?? ""),
      category: String(row?.["구분"] ?? ""),
      coupon: String(row?.["쿠폰"] ?? ""),
      target: String(row?.["타겟"] ?? ""),
      department: String(row?.["부서"] ?? ""),
      owner: String(row?.["담당자"] ?? ""),
      executionAt: String(row?.["실행시각"] ?? ""),
    }));

  await callFlow({ action: "syncConfirmed", rows: confirmedRows });
  return confirmedRows.length;
}
