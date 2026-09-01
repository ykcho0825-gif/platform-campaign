import { Routes, Route, Navigate } from "react-router-dom";
import { RoleProvider, useRole } from "./context/RoleContext";
import { AppLayout } from "./layout/AppLayout";
import { Overview } from "./pages/Overview";
import { Summary } from "./pages/Summary";
import { CampaignCompare } from "./pages/CampaignCompare";
import { CouponCompare } from "./pages/CouponCompare";
import { Funnel } from "./pages/Funnel";
import { CrossAnalysis } from "./pages/CrossAnalysis";
import { TrendForecast } from "./pages/TrendForecast";
import { ProductCompare } from "./pages/ProductCompare";
import { CalendarMockup } from "./pages/CalendarMockup";
import "./dashboard.css";

function DefaultRedirect() {
  const { defaultPath } = useRole();
  return <Navigate to={defaultPath} replace />;
}

function App() {
  return (
    <RoleProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<DefaultRedirect />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/campaigns" element={<CampaignCompare />} />
          <Route path="/coupons" element={<CouponCompare />} />
          <Route path="/funnel" element={<Funnel />} />
          <Route path="/cross" element={<CrossAnalysis />} />
          <Route path="/trend" element={<TrendForecast />} />
          <Route path="/products" element={<ProductCompare />} />
          <Route path="/calendar" element={<CalendarMockup />} />
          <Route path="*" element={<DefaultRedirect />} />
        </Route>
      </Routes>
    </RoleProvider>
  );
}

export default App;
