import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Role = "담당자" | "마케터" | "상급자";

export interface TabDef {
  path: string;
  label: string;
}

export const ALL_TABS: TabDef[] = [
  { path: "/overview", label: "전체현황" },
  { path: "/summary", label: "요약" },
  { path: "/campaigns", label: "캠페인별 비교" },
  { path: "/coupons", label: "쿠폰별 비교" },
  { path: "/funnel", label: "퍼널" },
  { path: "/cross", label: "교차분석" },
  { path: "/trend", label: "일자별 추세예측" },
  { path: "/products", label: "상품간 비교" },
  { path: "/calendar", label: "캠페인 신청 및 캘린더" },
];

const EXEC_PATHS = new Set(["/overview", "/summary", "/campaigns", "/products", "/calendar"]);

const DEFAULT_LANDING: Record<Role, string> = {
  담당자: "/calendar",
  마케터: "/campaigns",
  상급자: "/overview",
};

interface RoleContextValue {
  role: Role;
  setRole: (r: Role) => void;
  visibleTabs: TabDef[];
  defaultPath: string;
}

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>("마케터");

  const value = useMemo<RoleContextValue>(() => {
    const visibleTabs = role === "상급자" ? ALL_TABS.filter((t) => EXEC_PATHS.has(t.path)) : ALL_TABS;
    return { role, setRole, visibleTabs, defaultPath: DEFAULT_LANDING[role] };
  }, [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
