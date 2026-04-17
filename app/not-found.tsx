import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <p className="text-[80px] font-black text-gray-100 leading-none select-none">404</p>
        <div className="space-y-1 -mt-4">
          <h1 className="text-sm font-black uppercase tracking-widest text-gray-900">
            Page Not Found
          </h1>
          <p className="text-xs text-gray-400">
            The page you are looking for does not exist.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-2 text-[11px] font-black uppercase tracking-widest bg-orange-500 text-white rounded-sm hover:bg-orange-600 active:scale-[0.97] transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
