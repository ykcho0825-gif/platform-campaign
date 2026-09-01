import { useRole, type Role } from "../context/RoleContext";
import { useNavigate } from "react-router-dom";

const ROLES: Role[] = ["담당자", "마케터", "상급자"];

export function RoleToggle() {
  const { role, setRole, defaultPath } = useRole();
  const navigate = useNavigate();

  return (
    <div className="role-toggle">
      {ROLES.map((r) => (
        <button
          key={r}
          className={r === role ? "role-btn active" : "role-btn"}
          onClick={() => {
            setRole(r);
            const nextPath = r === role ? defaultPath : (r === "담당자" ? "/calendar" : r === "마케터" ? "/campaigns" : "/overview");
            navigate(nextPath);
          }}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
