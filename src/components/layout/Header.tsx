import { useLocation, useNavigate, Link } from "react-router-dom";
import { Settings } from "lucide-react";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const isSettings = pathname === "/settings";

  return (
    <header className="flex items-center justify-between h-14 px-4 bg-white dark:bg-[#1e1e21] border-b border-gray-200 dark:border-[#3a3a3c]">
      <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h1>
      {isSettings ? (
        <button
          onClick={() => navigate(-1)}
          className="p-2 -mr-2 text-indigo-500 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-gray-200"
        >
          <Settings size={20} />
        </button>
      ) : (
        <Link
          to="/settings"
          className="p-2 -mr-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          <Settings size={20} />
        </Link>
      )}
    </header>
  );
}
