"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "@/src/context/AuthContext";
import type { User } from "@/src/types/auth.types";
import { getStaffUsers, createStaffUser, updateStaffUser, deleteStaffUser } from "@/src/services/user.service";
import { toast } from "sonner";
import {
  Users,
  Mail,
  User as UserIcon,
  Search,
  ArrowUp,
  ArrowDown,
  Plus,
  Edit2,
  Trash2,
  X as CloseIcon,
  Loader2,
  Eye,
  EyeOff
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
      className={`px-5 py-4 text-left text-[9px] font-black tracking-widest uppercase transition-all duration-200 select-none ${isSortable ? "cursor-pointer hover:bg-slate-100/50" : ""
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

  const hasAccess = role === "boss" || role === "superadmin";

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    is_boss: false,
    is_staff: true,
  });

  const loadStaff = useCallback(() => {
    if (authLoading || !hasAccess) {
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
  }, [hasAccess, authLoading]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const openCreateModal = () => {
    setModalMode("create");
    setFormData({
      username: "",
      name: "",
      email: "",
      password: "",
      is_boss: false,
      is_staff: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setModalMode("edit");
    setSelectedUser(user);
    setFormData({
      username: user.username,
      name: user.name,
      email: user.email,
      password: "", // Keep password empty on edit unless user wants to change it
      is_boss: false,
      is_staff: true,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modalMode === "create") {
        await createStaffUser(formData);
        toast.success("Staff member created successfully.");
      } else if (selectedUser) {
        // Only send password if it was changed
        const updateData: any = { ...formData };
        if (!updateData.password) {
          delete updateData.password;
        }
        await updateStaffUser(selectedUser.id, updateData);
        toast.success("Staff member updated successfully.");
      }
      setModalOpen(false);
      loadStaff();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "An error occurred. Please check your data.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = globalThis.confirm?.("Are you sure you want to delete this staff member? This action is permanent.");
    if (!confirmed) return;

    try {
      await deleteStaffUser(id);
      toast.success("Staff member deleted successfully.");
      loadStaff();
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete staff member.");
    }
  };

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

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center py-20 px-4">
        <p className="max-w-md text-center py-4 text-[10px] font-black text-red-500 bg-red-50/50 rounded-sm border border-red-100 uppercase tracking-[0.2em] leading-loose">
          UNAUTHORIZED ACCESS. THIS PAGE IS RESTRICTED TO BOSS AND ADMINISTRATORS ONLY.
        </p>
      </div>
    );
  }

  const submitText = modalMode === "create" ? "Create Member" : "Save Changes";

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

        {/* Actions Section */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Bar */}
          <div className="relative group flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
            <input
              type="text"
              placeholder="SEARCH STAFF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-500 pl-9 pr-4 py-2 text-[11px] font-bold uppercase tracking-widest placeholder:text-slate-300 focus:outline-none focus:border-orange-500 transition-all rounded-sm shadow-sm"
            />
          </div>

          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-950 text-white text-[11px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all rounded-sm shadow-md active:scale-95 shrink-0"
          >
            <Plus size={14} strokeWidth={3} />
            Add Staff
          </button>
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
                  <Header label="Status" ordering={ordering} handleSort={handleSort} className="w-24 text-center" />
                  <Header label="Actions" ordering={ordering} handleSort={handleSort} className="w-32 pr-6 text-right" />
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
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-green-50 text-green-600 border border-green-100">
                        <span className="w-1 h-1 rounded-full bg-green-500" /> ACTIVE
                      </span>
                    </td>
                    <td className="pr-6 px-5 py-4 text-right">
                      {u.is_superuser ? (
                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest italic pr-2">System Admin</span>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-sm transition-all"
                            title="Edit Staff"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-sm transition-all"
                            title="Delete Staff"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
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
          Showing {displayed.length} {displayed.length === 1 ? "staff member" : "staff members"}
        </p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">
          Total Staff: {staff.length}
        </p>
      </div>
      {/* Staff Management Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-500 shadow-2xl rounded-sm overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-500 flex items-center justify-between">
              <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-950 flex items-center gap-2">
                {modalMode === "create" ? <Plus size={16} strokeWidth={3} className="text-orange-500" /> : <Edit2 size={16} strokeWidth={3} className="text-orange-500" />}
                {modalMode === "create" ? "Add New Staff Member" : "Edit Staff Member"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-950 transition-colors">
                <CloseIcon size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-4">
                {/* Username & Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="staff-username" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Username</label>
                    <input
                      id="staff-username"
                      required
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 text-[11px] font-bold tracking-tight focus:border-orange-500 focus:outline-none transition-all rounded-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="staff-name" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                    <input
                      id="staff-name"
                      required
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-white border border-slate-300 px-3 py-2 text-[11px] font-bold tracking-tight focus:border-orange-500 focus:outline-none transition-all rounded-sm"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1">
                  <label htmlFor="staff-email" className="text-[9px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
                  <input
                    id="staff-email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border border-slate-300 px-3 py-2 text-[11px] font-bold lowercase tracking-tight focus:border-orange-500 focus:outline-none transition-all rounded-sm"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label htmlFor="staff-password" className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                    {modalMode === "create" ? "Initial Password" : "Change Password (optional)"}
                  </label>
                  <div className="relative group/pass">
                    <input
                      id="staff-password"
                      required={modalMode === "create"}
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={modalMode === "edit" ? "LEAVE BLANK TO KEEP CURRENT" : ""}
                      className="w-full bg-white border border-slate-300 pl-3 pr-10 py-2 text-[11px] font-bold tracking-tight focus:border-orange-500 focus:outline-none transition-all rounded-sm placeholder:text-[8px] placeholder:text-slate-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-300 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-950 hover:border-slate-500 transition-all rounded-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 bg-orange-500 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all rounded-sm shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    submitText
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
