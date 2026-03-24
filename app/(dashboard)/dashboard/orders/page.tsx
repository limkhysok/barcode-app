"use client";

const orders = [
  { id: "#ORD-0128", part: "Brake Pad Set",     date: "Mar 23, 2026", status: "Delivered", amount: "$34.50" },
  { id: "#ORD-0127", part: "Engine Oil Filter", date: "Mar 21, 2026", status: "Pending",   amount: "$12.99" },
  { id: "#ORD-0126", part: "Timing Belt Kit",   date: "Mar 18, 2026", status: "Delivered", amount: "$55.00" },
  { id: "#ORD-0125", part: "Alternator",        date: "Mar 15, 2026", status: "Delivered", amount: "$89.99" },
  { id: "#ORD-0124", part: "Air Filter",        date: "Mar 12, 2026", status: "Delivered", amount: "$9.99"  },
  { id: "#ORD-0123", part: "Spark Plug (x4)",   date: "Mar 10, 2026", status: "Delivered", amount: "$18.00" },
  { id: "#ORD-0122", part: "CV Joint Boot Kit", date: "Mar 7, 2026",  status: "Cancelled", amount: "$27.50" },
  { id: "#ORD-0121", part: "Radiator Coolant Hose", date: "Mar 3, 2026", status: "Delivered", amount: "$22.00" },
];

const statusStyle: Record<string, string> = {
  Delivered: "bg-green-50 text-green-600",
  Pending:   "bg-orange-50 text-orange-500",
  Cancelled: "bg-red-50 text-red-500",
};

export default function OrdersPage() {
  return (
    <div className="px-8 py-8 space-y-6">

      {/* Header */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>
          History
        </p>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: "Total",     value: orders.length,                                  color: "bg-gray-100 text-gray-600"       },
          { label: "Delivered", value: orders.filter((o) => o.status === "Delivered").length, color: "bg-green-50 text-green-600" },
          { label: "Pending",   value: orders.filter((o) => o.status === "Pending").length,   color: "bg-orange-50 text-orange-500" },
          { label: "Cancelled", value: orders.filter((o) => o.status === "Cancelled").length, color: "bg-red-50 text-red-500"     },
        ].map(({ label, value, color }) => (
          <div key={label} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold ${color}`}>
            <span className="text-base font-bold">{value}</span>
            <span className="tracking-widest uppercase">{label}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Order ID", "Part", "Date", "Amount", "Status"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-[10px] font-bold tracking-widest uppercase text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(({ id, part, date, status, amount }) => (
                <tr key={id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3.5 text-xs font-bold text-gray-700">{id}</td>
                  <td className="px-6 py-3.5 text-gray-700">{part}</td>
                  <td className="px-6 py-3.5 text-gray-400 text-xs">{date}</td>
                  <td className="px-6 py-3.5 font-bold text-gray-800">{amount}</td>
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

    </div>
  );
}
