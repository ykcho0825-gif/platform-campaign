import { NavLink, Outlet } from "react-router-dom";
import { useRole } from "../context/RoleContext";
import { RoleToggle } from "../components/RoleToggle";

export function AppLayout() {
  const { visibleTabs, role } = useRole();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-title">캠페인 실적 대시보드</div>
        <div className="app-header-right">
          <span className="role-label">현재 역할: {role}</span>
          <RoleToggle />
        </div>
      </header>
      <nav className="app-nav">
        {visibleTabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => (isActive ? "nav-tab active" : "nav-tab")}
          >
            {tab.label}
          </NavLink>
        ))}
        <a
          className="nav-tab"
          href={`${import.meta.env.BASE_URL}report.html`}
          target="_blank"
          rel="noreferrer"
        >
          경영진 리포트 ↗
        </a>
      </nav>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
