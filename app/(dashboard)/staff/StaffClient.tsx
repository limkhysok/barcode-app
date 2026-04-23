"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { getStaffUsers } from "@/src/services/user.service";
import type { User } from "@/src/types/auth.types";
import { 
  Users, 
  Mail, 
  User as UserIcon, 
  ShieldCheck, 
  Search,
  ArrowUp,
  ArrowDown
} from "lucide-react";

type SortDir = "asc" | "desc" | "";

const SortIcon = ({ field, currentOrdering }: { field: string; currentOrdering: string }) => {
  const isAsc = currentOrdering === field;
  const isDesc = currentOrdering === `-${field}`;
  if (!isAsc && !isDesc) return null;
  return isAsc ? (
    <ArrowUp size={10} className="ml-1.5 text-orange-500" strokeWidth={3} />
  ) : (
    <ArrowDown size={10} className="ml-1.5 text-orange-500" strokeWidth={3} />
  );
};

const Header = ({
  label,
  field,
  className,
  ordering,
  handleSort,
}: {
  label: string;
  field?: string;
  className?: string;
  ordering: string;
  handleSort: (f: string) => void;
}) => {
  const isSortable = !!field;
  const isActive = field && (ordering === field || ordering === `-${field}`);
  return (
    <th
      onClick={() => isSortable && field && handleSort(field)}
      className={`px-5 py-4 text-left text-[9px] font-black tracking-widest uppercase transition-all duration-200 select-none ${
        isSortable ? "cursor-pointer hover:bg-slate-100/50" : ""
      } ${isActive ? "text-orange-600 bg-orange-50/30" : "text-slate-400"} ${className || ""}`}
    >
      <div className={`flex items-center ${className?.includes('center') ? 'justify-center' : ''} ${className?.includes('right') ? 'justify-end' : ''}`}>
        {label}
        {isSortable && field && <SortIcon field={field} currentOrdering={ordering} />}
      </div>
    </th>
  );
};

export default function StaffClient() {
  const { role, isLoading: authLoading } = useAuth();
  const [staff, setStaff] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("username");

  const isBoss = role === "boss" || role === "superadmin";

  useEffect(() => {
    if (authLoading) return;
    if (!isBoss) {
      setLoading(false);
      return;
    }

    setLoading(true);
    getStaffUsers()
      .then(setStaff)
      .catch((err) => {
        if (err?.response?.status === 403) {
          setError("403 Forbidden: You do not have permission to view staff users.");
        } else {
          setError("Failed to load staff users. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [isBoss, authLoading]);

  const displayed = useMemo(() => {
    let list = [...staff];

    // Search
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(u => 
        u.username.toLowerCase().includes(s) || 
        u.name.toLowerCase().includes(s) || 
        u.email.toLowerCase().includes(s)
      );
    }

    // Sort
    if (ordering) {
      const isDesc = ordering.startsWith("-");
      const field = isDesc ? ordering.substring(1) : ordering;

      list.sort((a: any, b: any) => {
        const valA = (a[field] || "").toString().toLowerCase();
        const valB = (b[field] || "").toString().toLowerCase();
        if (valA < valB) return isDesc ? 1 : -1;
        if (valA > valB) return isDesc ? -1 : 1;
        return 0;
      });
    }

    return list;
  }, [staff, search, ordering]);

  const handleSort = (field: string) => {
    if (ordering === field) setOrdering(`-${field}`);
    else if (ordering === `-${field}`) setOrdering("");
    else setOrdering(field);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: "#FA4900", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!isBoss) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <p className="max-w-md text-center py-4 text-[10px] font-black text-red-500 bg-red-50/50 rounded-sm border border-red-100 uppercase tracking-[0.2em] leading-loose">
          UNAUTHORIZED ACCESS. THIS PAGE IS RESTRICTED TO BOSS USERS ONLY.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-4">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-950 uppercase tracking-tight flex items-center gap-2.5">
            <Users className="text-orange-600" size={20} strokeWidth={2.5} />
            Staff Management
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
            View and manage authorized staff members
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative group w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
          <input
            type="text"
            placeholder="SEARCH STAFF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-500 pl-9 pr-4 py-2 text-[11px] font-bold uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:border-orange-500 transition-all rounded-sm shadow-sm"
          />
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-hidden bg-white border border-slate-500 rounded-sm">
        {error && (
          <div className="flex items-center justify-center py-20 px-4">
            <p className="max-w-md text-center py-4 text-[10px] font-black text-red-500 bg-red-50/50 rounded-sm border border-red-100 uppercase tracking-[0.2em] leading-loose">
              {error}
            </p>
          </div>
        )}

        {!error && displayed.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-slate-300">
            <Users className="w-10 h-10 opacity-20" strokeWidth={1} />
            <p className="text-[9px] font-black uppercase tracking-[0.25em]">No staff users found.</p>
          </div>
        )}

        {!error && displayed.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/50 border-b border-slate-500">
                <tr>
                  <Header label="#" field="id" ordering={ordering} handleSort={handleSort} className="pl-6 w-16" />
                  <Header label="Name" field="name" ordering={ordering} handleSort={handleSort} />
                  <Header label="Username" field="username" ordering={ordering} handleSort={handleSort} />
                  <Header label="Email" field="email" ordering={ordering} handleSort={handleSort} />
                  <Header label="Role" ordering={ordering} handleSort={handleSort} className="w-32" />
                  <Header label="Status" ordering={ordering} handleSort={handleSort} className="w-32 pr-6 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-400 bg-white">
                {displayed.map((u) => (
                  <tr key={u.id} className="group hover:bg-orange-50/60 transition-colors">
                    <td className="pl-6 px-5 py-4">
                      <span className="text-[11px] font-black text-slate-500 tabular-nums group-hover:text-orange-600 transition-colors">#{u.id}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                          <UserIcon size={14} />
                        </div>
                        <span className="text-[13px] font-black text-slate-900 uppercase tracking-tight group-hover:text-orange-600 transition-colors">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{u.username}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-slate-400 group-hover:text-slate-600 transition-colors">
                        <Mail size={12} />
                        <span className="text-[11px] font-bold lowercase tracking-tight">{u.email}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        <ShieldCheck size={10} /> STAFF
                      </span>
                    </td>
                    <td className="pr-6 px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                        <span className="w-1 h-1 rounded-full bg-green-500" /> ACTIVE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Showing {displayed.length} staff member{displayed.length === 1 ? "" : "s"}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Total Staff: {staff.length}
        </p>
      </div>
    </div>
  );
}
