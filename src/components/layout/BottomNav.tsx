import { NavLink } from "react-router-dom";
import { CalendarCheck, CalendarDays, CalendarRange, BarChart3 } from "lucide-react";

const tabs = [
  { to: "/", icon: CalendarCheck, label: "Today" },
  { to: "/week", icon: CalendarDays, label: "Week" },
  { to: "/month", icon: CalendarRange, label: "Month" },
  { to: "/stats", icon: BarChart3, label: "Stats" },
];

export function BottomNav() {
  return (
    <nav
      className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a]"
      style={{ paddingBottom: "var(--safe-bottom)" }}
    >
      <div className="flex justify-around items-center h-14">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 w-16 h-full text-xs transition-colors ${
                isActive
                  ? "text-indigo-500"
                  : "text-gray-400 dark:text-gray-500"
              }`
            }
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
