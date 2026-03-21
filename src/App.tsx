import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { TodayPage } from "./pages/TodayPage";
import { WeekPage } from "./pages/WeekPage";
import { MonthPage } from "./pages/MonthPage";
import { StatsPage } from "./pages/StatsPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="week" element={<WeekPage />} />
          <Route path="month" element={<MonthPage />} />
          <Route path="stats" element={<StatsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
