"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-sm bg-red-500 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c-.866 1.5.217 3.374 1.948 3.374H1.749c-1.73 0-2.813-1.874-1.948-3.374L10.052 3.378c.866-1.5 3.032-1.5 3.898 0l8.255 14.248zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div className="space-y-1">
            <h1 className="text-sm font-black uppercase tracking-widest text-gray-900">
              Something Went Wrong
            </h1>
            <p className="text-xs text-gray-400">
              An unexpected error occurred. Our team has been notified.
            </p>
            {error.digest && (
              <p className="text-[10px] font-mono text-gray-300 pt-1">
                ID: {error.digest}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={reset}
            className="px-6 py-2 text-[11px] font-black uppercase tracking-widest bg-orange-500 text-white rounded-sm hover:bg-orange-600 active:scale-[0.97] transition"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
