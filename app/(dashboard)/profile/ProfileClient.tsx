"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User } from "@/src/types/auth.types";

export default function ProfileClient({ initialUser }: Readonly<{ initialUser: User | null }>) {
  const router = useRouter();

  if (!initialUser) return null;

  async function handleLogout() {
    toast.info("Logging out...");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setTimeout(() => {
      router.push("/login");
      router.refresh();
    }, 800);
  }

  // Role calculation
  let roleLabel = "General User";
  if (initialUser.is_superuser) roleLabel = "System Admin";
  else if (initialUser.is_boss) roleLabel = "Main Manager";
  else if (initialUser.is_staff) roleLabel = "Staff Member";

  const initials = (initialUser?.name || initialUser?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="p-6 sm:p-8 max-w-2xl mx-auto lg:mx-0">
      {/* Header */}
      <div className="mb-6 space-y-0.5">
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-orange-500">Account</p>
        <h1 className="text-xl font-bold text-black uppercase">My Profile</h1>
      </div>

      {/* Main Stats Card */}
      <div className="rounded-sm border border-black bg-white overflow-hidden shadow-sm">

        {/* Top Header - Identity */}
        <div className="p-6 border-b border-black flex flex-col sm:flex-row items-center gap-6 bg-slate-50">
          <div
            className="w-16 h-16 rounded-sm border border-black flex items-center justify-center text-white text-xl font-bold bg-black"
          >
            {initials}
          </div>
          <div className="text-center sm:text-left space-y-1">
            <h2 className="text-base font-bold text-black uppercase">{initialUser.name || "User"}</h2>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 border border-black bg-white text-black uppercase">
                {roleLabel}
              </span>

            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
          <InfoItem label="Username" value={`@${initialUser.username}`} />
          <InfoItem label="Email" value={initialUser.email} />
          <InfoItem label="Member Since" value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' })} />
          <InfoItem label="Status" value="Verified" highlight />
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-black bg-zinc-50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center sm:text-left">
            Security protocol active
          </p>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto px-6 py-2.5 bg-white text-black text-[10px] font-bold tracking-[0.2em] uppercase border border-black rounded-sm hover:bg-black hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="mt-8 text-center sm:text-left">
        <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em]">
          All data encrypted • Barcode App {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

function InfoItem({ label, value, highlight }: Readonly<{ label: string; value: string; highlight?: boolean }>) {
  return (
    <div className="space-y-1">
      <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">{label}</p>
      <div className={`text-sm font-bold ${highlight ? "text-orange-500" : "text-black"}`}>
        {value}
      </div>
    </div>
  );
}
