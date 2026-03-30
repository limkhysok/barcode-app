import { serverFetch } from "@/src/lib/server-fetch";
import type { User } from "@/src/types/auth.types";

const stats = [
  {
    label: "Total Orders",
    value: "128",
    sub: "+12 this month",
    positive: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
      </svg>
    ),
  },
  {
    label: "Pending",
    value: "7",
    sub: "Awaiting shipment",
    positive: false,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Delivered",
    value: "119",
    sub: "Successfully completed",
    positive: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "Total Spent",
    value: "$2,340",
    sub: "Across all orders",
    positive: true,
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
      </svg>
    ),
  },
];

const recentOrders = [
  { id: "#ORD-0128", part: "Brake Pad Set",       date: "Mar 23, 2026", status: "Delivered" },
  { id: "#ORD-0127", part: "Engine Oil Filter",   date: "Mar 21, 2026", status: "Pending"   },
  { id: "#ORD-0126", part: "Timing Belt Kit",     date: "Mar 18, 2026", status: "Delivered" },
  { id: "#ORD-0125", part: "Alternator",          date: "Mar 15, 2026", status: "Delivered" },
  { id: "#ORD-0124", part: "Air Filter",          date: "Mar 12, 2026", status: "Delivered" },
];

const statusStyle: Record<string, string> = {
  Delivered: "bg-green-50 text-green-700 border-green-200",
  Pending:   "bg-orange-50 text-orange-600 border-orange-200",
  Cancelled: "bg-red-50 text-red-600 border-red-200",
};

export default async function DashboardPage() {
  let user: User | null = null;
  try {
    user = await serverFetch<User>("/api/v1/users/me/");


  } catch { /* keep null */ }

  return (
    <div className="px-8 py-8 space-y-8">

      {/* Header */}
      <div className="space-y-1">
        <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>
          Welcome back
        </p>
        <h1 className="text-2xl font-bold text-gray-900">
          {user?.name || user?.username} 👋
        </h1>
        <p className="text-sm text-gray-400">Here&apos;s what&apos;s happening with your orders today.</p>
      </div>

      {/* Stats */}
      <div className="flex flex-col sm:flex-row rounded-xl border border-black overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-black">
        {stats.map(({ label, value, sub, positive, icon }) => (
          <div key={label} className="flex-1 bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">{label}</p>
              <div className="w-8 h-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-600 shrink-0">
                {icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
            <p className={`text-xs font-medium ${positive ? "text-green-600" : "text-orange-500"}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-xl border border-black overflow-hidden">
        <div className="px-6 py-4 border-b border-black flex items-center justify-between bg-white">
          <h2 className="text-sm font-semibold text-slate-900">Recent Orders</h2>
          <a href="/dashboard/orders"
            className="text-[10px] font-semibold tracking-widest uppercase hover:underline text-slate-500">
            View all
          </a>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black bg-slate-50">
              {["Order ID", "Part", "Date", "Status"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-semibold tracking-widest uppercase text-slate-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black bg-white">
            {recentOrders.map(({ id, part, date, status }) => (
              <tr key={id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3.5 font-semibold text-slate-700 text-xs">{id}</td>
                <td className="px-6 py-3.5 text-slate-600 text-sm">{part}</td>
                <td className="px-6 py-3.5 text-slate-400 text-xs">{date}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-md border ${statusStyle[status]}`}>
                    {status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
