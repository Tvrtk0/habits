import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

const titles: Record<string, string> = {
  "/": "Today",
  "/week": "Week",
  "/month": "Month",
  "/stats": "Stats",
  "/settings": "Settings",
};

export function AppShell() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? "Habits";

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a]">
      <Header title={title} />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4">
          <Outlet />
        </div>
      </main>
      {pathname !== "/settings" && <BottomNav />}
    </div>
  );
}
