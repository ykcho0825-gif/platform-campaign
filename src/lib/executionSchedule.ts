// 담당자 모드의 실행시각 추천 로직. 예전 정적 대시보드(index.html)의 owner* 함수들을
// 그대로 옮긴 것 — 배너/쿠폰 각각 하루 최대 280만 건(capa), 쿠폰은 시간당 12만 건 발송
// 속도만큼 연속 시간을 점유, 17~18시는 신규 배정 지양, 대용량(200만+) TV팝업 단독 캠페인은
// 오후/야간을 우선 검토, 같은 신청일 안에서는 월정액 상품 → 신청 순서로 우선 배정한다.

export const OWNER_DAILY_CAPA = 2800000;
export const OWNER_HOURLY_RATE = 120000;
export const OWNER_BLACKOUT_HOURS = [17, 18];
export const OWNER_LARGE_POPUP_THRESHOLD = 2000000;
export const OWNER_LARGE_POPUP_PREFERRED_HOURS = [15, 16, 20, 21, 22, 23];

// 채널에 배너/팝업이 포함되면 쿠폰 값과 무관하게 항상 배너 풀(1시간, 물량 무관)로 취급한다.
// 배너·팝업은 발송 속도 제한이 없어 쿠폰이 함께 실려도 시간당 12만 건 규칙을 적용하면 안 된다.
export function hasCoupon(flag: string, channelText?: string): boolean {
  if (channelText != null && /배너|팝업/.test(channelText || "")) return false;
  const text = flag || "";
  return /쿠폰|있음|B캐시/.test(text) && !/없음/.test(text);
}

export function isMonthly(name: string): boolean {
  return (name || "").indexOf("월정액") !== -1;
}

export function parseTarget(text: string): number {
  const raw = String(text ?? "").replace(/,/g, "").trim();
  if (!raw) return 0;
  const normalized = raw.replace(/^(약\s*|일\s*)/, "");
  const match = normalized.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 0;
  let value = Number(match[1]);
  if (normalized.indexOf("만") !== -1) value *= 10000;
  else if (normalized.indexOf("천") !== -1) value *= 1000;
  return Math.ceil(value);
}

export function parseHour(raw: string): number | null {
  const text = String(raw || "").trim();
  if (!text) return null;
  const hourMatch = text.match(/(\d{1,2})\s*시/) || text.match(/T?(\d{1,2}):(\d{2})/);
  if (!hourMatch) return null;
  const h = Number(hourMatch[1]);
  return h >= 0 && h <= 23 ? h : null;
}

// 쿠폰은 시간당 12만 발송 속도로 필요한 시간만큼 연속 점유. 배너/팝업은 물량과 무관하게 항상 1시간만 점유.
export function blockLen(target: number, isCoupon: boolean): number {
  if (!isCoupon) return 1;
  return Math.max(1, Math.ceil((target || 0) / OWNER_HOURLY_RATE));
}

function isLargePopupOnly(channelText: string, isCoupon: boolean, target: number): boolean {
  if (isCoupon || (target || 0) < OWNER_LARGE_POPUP_THRESHOLD) return false;
  const text = channelText || "";
  return /tv\s*팝업/i.test(text) && !/배너|토스트/.test(text);
}

function preferredHoursFor(channelText: string, isCoupon: boolean, target: number): number[] | null {
  return isLargePopupOnly(channelText, isCoupon, target) ? OWNER_LARGE_POPUP_PREFERRED_HOURS : null;
}

interface OccupiedSlot {
  name: string;
  owner: string;
}
type OccupiedMap = Record<number, OccupiedSlot>;

// len시간 연속으로 비어있고 17~18시를 지나지 않는 시작 시간을 찾는다.
export function findFit(
  occupiedMap: OccupiedMap,
  len: number,
  preferredHours: number[] | null
): { start: number | null; preferred: boolean } {
  function fits(s: number) {
    if (s < 1 || s + len - 1 > 23) return false;
    for (let i = 0; i < len; i++) {
      const hr = s + i;
      if (OWNER_BLACKOUT_HOURS.indexOf(hr) !== -1 || occupiedMap[hr]) return false;
    }
    return true;
  }
  if (preferredHours) {
    for (const h of preferredHours) {
      if (fits(h)) return { start: h, preferred: true };
    }
  }
  for (let s = 1; s + len - 1 <= 23; s++) {
    if (fits(s)) return { start: s, preferred: false };
  }
  return { start: null, preferred: false };
}

export function buildReason(occupiedMap: OccupiedMap, start: number | null, preferred: boolean): string {
  if (start === null) return "01~23시(17~18시 제외) 중 연속으로 비어있는 시간대가 없습니다.";
  if (preferred) {
    return `대용량 TV팝업 단독 캠페인은 오후·야간 시간대를 우선 검토하는 기준에 따라 ${String(start).padStart(2, "0")}시를 추천했습니다.`;
  }
  if (start === 1) return "01시부터 비어있어 가장 빠른 시간으로 추천했습니다.";
  const busy: string[] = [];
  for (let hr = 1; hr < start; hr++) {
    if (OWNER_BLACKOUT_HOURS.indexOf(hr) !== -1) continue;
    const slot = occupiedMap[hr];
    if (slot && busy.indexOf(slot.name) === -1) busy.push(slot.name);
  }
  const reasons: string[] = [];
  if (busy.length) {
    const shown = busy.slice(0, 3).join(", ") + (busy.length > 3 ? ` 외 ${busy.length - 3}건` : "");
    reasons.push(`${String(start - 1).padStart(2, "0")}시까지는 [${shown}](으)로 이미 시간대가 차 있음`);
  }
  reasons.push("17~18시는 주기성 캠페인 운영으로 신규 배정을 지양");
  return reasons.join(", ") + `하고 있어, ${String(start).padStart(2, "0")}시부터 비어있어 추천했습니다.`;
}

export interface ConfirmedSlot {
  name: string;
  owner: string;
  channel: string;
  coupon: string;
  target: number;
  hour: number;
}

export interface PendingSlotCandidate {
  key: string;
  name: string;
  owner: string;
  channel: string;
  coupon: string;
  target: number;
  isMonthlyPriority: boolean;
  order: number;
}

export interface RecommendationResult {
  hour: number | null;
  len: number;
  isCoupon: boolean;
  reason: string;
}

export interface DayPlanResult {
  occupied: { coupon: OccupiedMap; banner: OccupiedMap };
  dailyTotal: { coupon: number; banner: number };
  recommendedByKey: Map<string, RecommendationResult>;
}

// 같은 신청(시작)일에 확정된 캠페인끼리 시간대를 점유시킨 뒤, 아직 시간이 없는 대기 건들을
// 우선순위(월정액 → 신청 순서) 순서로 한 번에 배치한다. 이렇게 해야 같은 날 여러 건이 동시에
// 같은 시간을 추천받는 일이 없다.
export function buildDayPlan(
  dateText: string,
  confirmed: ConfirmedSlot[],
  pending: PendingSlotCandidate[]
): DayPlanResult {
  const occupied: { coupon: OccupiedMap; banner: OccupiedMap } = { coupon: {}, banner: {} };
  const dailyTotal = { coupon: 0, banner: 0 };
  const recommendedByKey = new Map<string, RecommendationResult>();

  function place(name: string, owner: string, isCoupon: boolean, target: number, start: number, len: number) {
    const pool = isCoupon ? "coupon" : "banner";
    const from = Math.max(1, start);
    const to = Math.min(23, from + len - 1);
    for (let hr = from; hr <= to; hr++) {
      if (!occupied[pool][hr]) occupied[pool][hr] = { name, owner };
    }
    dailyTotal[pool] += target;
  }

  confirmed.forEach((c) => {
    const isCoupon = hasCoupon(c.coupon, c.channel);
    place(c.name, c.owner, isCoupon, c.target, c.hour, blockLen(c.target, isCoupon));
  });

  const ordered = [...pending].sort((a, b) => {
    const am = a.isMonthlyPriority ? 0 : 1;
    const bm = b.isMonthlyPriority ? 0 : 1;
    if (am !== bm) return am - bm;
    return a.order - b.order;
  });

  ordered.forEach((entry) => {
    const isCoupon = hasCoupon(entry.coupon, entry.channel);
    const pool = isCoupon ? "coupon" : "banner";
    const target = entry.target;
    const len = blockLen(target, isCoupon);

    // 일일 capa(280만) 초과 차단은 발송 속도 제한이 있는 쿠폰 풀에만 적용한다. 배너/팝업은 물량과 무관하게
    // 1시간만 점유하고 발송 자체에 속도 제한이 없어, 그 시간에 이미 다른 배너 물량이 많아도 그대로 배정한다.
    if (pool === "coupon" && dailyTotal[pool] + target > OWNER_DAILY_CAPA) {
      recommendedByKey.set(entry.key, {
        hour: null,
        len,
        isCoupon,
        reason:
          `이 날짜(${dateText})의 쿠폰 일일 capa(280만) 초과: 이미 ` +
          `${dailyTotal[pool].toLocaleString("ko-KR")}건 + 이 건 ${target.toLocaleString("ko-KR")}건이 280만을 넘습니다. 다른 날짜 검토가 필요합니다.`,
      });
      return;
    }

    const preferredHours = preferredHoursFor(entry.channel, isCoupon, target);
    const fit = findFit(occupied[pool], len, preferredHours);
    recommendedByKey.set(entry.key, {
      hour: fit.start,
      len,
      isCoupon,
      reason: buildReason(occupied[pool], fit.start, fit.preferred),
    });
    if (fit.start !== null) place(entry.name, entry.owner, isCoupon, target, fit.start, len);
  });

  return { occupied, dailyTotal, recommendedByKey };
}
