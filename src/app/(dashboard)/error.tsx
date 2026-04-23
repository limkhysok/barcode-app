"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[DashboardError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center space-y-5">
      <div className="w-10 h-10 rounded-sm bg-red-500 flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H1.749c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0l8.255 14.248zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>

      <div className="space-y-1">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-900">
          Page Error
        </h2>
        <p className="text-xs text-gray-400 max-w-xs">
          {error.message || "This page encountered an unexpected error."}
        </p>
        {error.digest && (
          <p className="text-[10px] font-mono text-gray-300 pt-1">
            ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-5 py-2 text-[11px] font-black uppercase tracking-widest bg-orange-500 text-white rounded-sm hover:bg-orange-600 active:scale-[0.97] transition"
        >
          Retry
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="px-5 py-2 text-[11px] font-black uppercase tracking-widest border border-gray-200 text-gray-500 rounded-sm hover:bg-gray-50 active:scale-[0.97] transition"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
