"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@/src/types/auth.types";
import { useAuth } from "@/src/context/AuthContext";
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  LogOut,
  BadgeCheck,
} from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  superadmin: "Super Admin",
  boss: "Boss",
  staff: "Staff",
};

const ROLE_COLOR: Record<string, string> = {
  superadmin: "bg-orange-500 text-white",
  boss: "bg-slate-800 text-white",
  staff: "bg-slate-100 text-slate-600",
};

export default function ProfileClient({ initialUser }: Readonly<{ initialUser: User | null }>) {
  const { role, logout } = useAuth();
  const router = useRouter();

  if (!initialUser) return null;

  function handleLogout() {
    toast.info("Logging out…");
    logout();
    setTimeout(() => router.replace("/login"), 400);
  }

  const roleLabel = ROLE_LABEL[role] ?? "Staff";
  const roleColor = ROLE_COLOR[role] ?? ROLE_COLOR.staff;

  const initials = (initialUser.name || initialUser.username || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-4 py-5 sm:px-5 sm:py-5 space-y-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-[12px] font-black text-slate-950 uppercase tracking-[0.2em] leading-none">
            Profile
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-2 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider border border-slate-200 rounded-sm text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogOut size={13} strokeWidth={2.5} />
          <span>Sign Out</span>
        </button>
      </div>

      {/* ── Identity Card ── */}
      <div className="rounded-md border border-slate-200 bg-white overflow-hidden">

        {/* Avatar + Name header */}
        <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-4 border-b border-slate-100 bg-slate-50/50">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-md bg-orange-500 flex items-center justify-center shrink-0">
            <span className="text-lg font-black text-white leading-none">{initials}</span>
          </div>

          {/* Name + role */}
          <div className="text-center sm:text-left space-y-2">
            <h2 className="text-[14px] font-black text-slate-950 uppercase tracking-widest leading-none">
              {initialUser.name || initialUser.username}
            </h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm ${roleColor}`}>
                {roleLabel}
              </span>
              {initialUser.is_staff && (
                <span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-green-600">
                  <BadgeCheck size={11} strokeWidth={3} />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <InfoItem
            icon={<UserIcon size={14} className="text-orange-500" strokeWidth={2.5} />}
            label="Username"
            value={`@${initialUser.username}`}
          />
          <InfoItem
            icon={<Mail size={14} className="text-orange-500" strokeWidth={2.5} />}
            label="Email"
            value={initialUser.email || "—"}
          />
          <InfoItem
            icon={<ShieldCheck size={14} className="text-orange-500" strokeWidth={2.5} />}
            label="Access Level"
            value={roleLabel}
          />
        </div>
      </div>
    </div>
  );
}

// ─── InfoItem ─────────────────────────────────────────────────────────────────

function InfoItem({ icon, label, value }: Readonly<{
  icon: React.ReactNode;
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1.5">
          {label}
        </p>
        <p className="text-[12px] font-black text-slate-900 uppercase tracking-wide truncate">
          {value}
        </p>
      </div>
    </div>
  );
}

// ─── PermissionItem ───────────────────────────────────────────────────────────

function PermissionItem({ label, granted }: Readonly<{ label: string; granted: boolean }>) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-sm border ${
      granted
        ? "border-green-100 bg-green-50"
        : "border-slate-100 bg-slate-50"
    }`}>
      <span className={`text-[10px] font-black uppercase tracking-widest ${
        granted ? "text-green-700" : "text-slate-400"
      }`}>
        {label}
      </span>
      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm ${
        granted
          ? "bg-green-500 text-white"
          : "bg-slate-200 text-slate-400"
      }`}>
        {granted ? "On" : "Off"}
      </span>
    </div>
  );
}
