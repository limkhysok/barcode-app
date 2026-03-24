"use client";

import { useAuth } from "@/src/context/AuthContext";

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
  Delivered: "bg-green-50 text-green-600",
  Pending:   "bg-orange-50 text-orange-500",
  Cancelled: "bg-red-50 text-red-500",
};

export default function DashboardPage() {
  const { user } = useAuth();

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, positive, icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400">{label}</p>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}>
                {icon}
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className={`text-xs font-medium ${positive ? "text-green-500" : "text-orange-400"}`}>{sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Recent Orders</h2>
          <a href="/dashboard/orders"
            className="text-xs font-bold tracking-widest uppercase hover:underline"
            style={{ color: "#FA4900" }}>
            View all
          </a>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {["Order ID", "Part", "Date", "Status"].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentOrders.map(({ id, part, date, status }) => (
              <tr key={id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-3.5 font-bold text-gray-700 text-xs">{id}</td>
                <td className="px-6 py-3.5 text-gray-600">{part}</td>
                <td className="px-6 py-3.5 text-gray-400 text-xs">{date}</td>
                <td className="px-6 py-3.5">
                  <span className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${statusStyle[status]}`}>
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
