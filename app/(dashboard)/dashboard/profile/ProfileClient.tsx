"use client";

import { useEffect, useState } from "react";
import api from "@/src/services/api";
import type { User } from "@/src/types/auth.types";

export default function ProfileClient({ initialUser }: Readonly<{ initialUser: User | null }>) {
  const [form, setForm] = useState({
    name: initialUser?.name ?? "",
    email: initialUser?.email ?? "",
    username: initialUser?.username ?? "",
  });
  const [passwords, setPasswords] = useState({ newPass: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialUser) {
      setForm({ name: initialUser.name, email: initialUser.email, username: initialUser.username });
    }
  }, [initialUser]);

  async function handleSaveProfile(e: React.SyntheticEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      await api.patch<User>("/api/auth/me", { name: form.name, email: form.email });
      setSuccess("Profile updated successfully.");
    } catch {
      setError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: React.SyntheticEvent) {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) {
      setError("New passwords do not match.");
      return;
    }
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      await api.patch("/api/auth/me", { password: passwords.newPass });
      setPasswords({ newPass: "", confirm: "" });
      setSuccess("Password changed successfully.");
    } catch {
      setError("Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  const initials = (initialUser?.name || initialUser?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="px-8 py-8 space-y-8 max-w-2xl">

      {/* Header */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Account</p>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
      </div>

      {/* Avatar + name */}
      <div className="flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
        >
          {initials}
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{initialUser?.name || initialUser?.username}</p>
          <p className="text-sm text-gray-400">{initialUser?.email}</p>
          <p className="text-xs font-medium tracking-widest uppercase text-gray-300 mt-0.5">@{initialUser?.username}</p>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <p className="text-xs font-medium text-green-600 bg-green-50 border border-green-100 rounded-xl px-4 py-2.5">
          {success}
        </p>
      )}
      {error && (
        <p className="text-xs font-medium text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
          {error}
        </p>
      )}

      {/* Edit Profile */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900">Edit Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="prof-name" className="text-xs font-bold tracking-widest uppercase text-gray-500">Full Name</label>
              <input
                id="prof-name" type="text" value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition"
                style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="prof-username" className="text-xs font-bold tracking-widest uppercase text-gray-500">Username</label>
              <input
                id="prof-username" type="text" value={form.username} disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="prof-email" className="text-xs font-bold tracking-widest uppercase text-gray-500">Email</label>
            <input
              id="prof-email" type="email" value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition"
              style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
            />
          </div>
          <button
            type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 transition shadow-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            { id: "new-pass",  label: "New Password",     key: "newPass",  val: passwords.newPass  },
            { id: "conf-pass", label: "Confirm Password", key: "confirm",  val: passwords.confirm  },
          ].map(({ id, label, key, val }) => (
            <div key={id} className="space-y-1.5">
              <label htmlFor={id} className="text-xs font-bold tracking-widest uppercase text-gray-500">{label}</label>
              <input
                id={id} type="password" value={val} placeholder="••••••••"
                onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm outline-none focus:ring-2 focus:border-transparent transition"
                style={{ "--tw-ring-color": "#FA4900" } as React.CSSProperties}
              />
            </div>
          ))}
          <button
            type="submit" disabled={saving}
            className="px-6 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-white hover:opacity-90 transition shadow-sm disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #FA4900, #b91c1c)" }}
          >
            {saving ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

    </div>
  );
}
