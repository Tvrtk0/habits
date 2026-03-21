import { useRegisterSW } from "virtual:pwa-register/react";

export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-white dark:bg-[#262626] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          New version available
        </p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 bg-indigo-500 text-white text-xs font-medium rounded-md flex-shrink-0"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
