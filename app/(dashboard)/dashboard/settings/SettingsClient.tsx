"use client";

import { useState } from "react";

export default function SettingsClient() {
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    newProducts: false,
    promotions: false,
  });

  return (
    <div className="px-8 py-8 space-y-8 max-w-2xl">

      {/* Header */}
      <div className="space-y-0.5">
        <p className="text-xs font-medium tracking-[0.25em] uppercase italic" style={{ color: "#FA4900" }}>Preferences</p>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-gray-900">Notifications</h2>
        <div className="space-y-4">
          {[
            { key: "orderUpdates", label: "Order updates",   desc: "Get notified when your order status changes."       },
            { key: "newProducts",  label: "New products",    desc: "Be the first to know when new parts are added."     },
            { key: "promotions",   label: "Promotions",      desc: "Receive deals, discounts, and special offers."      },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{desc}</p>
              </div>
              <button
                onClick={() => setNotifications((n) => ({ ...n, [key]: !n[key as keyof typeof n] }))}
                className={`relative rounded-full transition-colors shrink-0 ${
                  notifications[key as keyof typeof notifications] ? "bg-[#FA4900]" : "bg-gray-200"
                }`}
                style={{ width: 40, height: 22 }}
              >
                <span
                  className="absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform"
                  style={{
                    width: 18, height: 18,
                    transform: notifications[key as keyof typeof notifications] ? "translateX(18px)" : "translateX(0)",
                  }}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold text-red-500">Danger Zone</h2>
        <p className="text-xs text-gray-400">These actions are permanent and cannot be undone.</p>
        <button className="px-5 py-2.5 rounded-xl text-xs font-bold tracking-widest uppercase text-red-500 border border-red-200 hover:bg-red-50 transition">
          Delete Account
        </button>
      </div>

    </div>
  );
}
