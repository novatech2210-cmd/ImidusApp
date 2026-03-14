"use client";

import { AdminAPI } from "@/lib/api";
import {
    ArrowPathIcon,
    BellIcon,
    CakeIcon,
    CheckBadgeIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function BirthdayRewardsPage() {
  const [config, setConfig] = useState({
    rewardPoints: 500,
    isActive: true,
    notificationTitle: "Happy Birthday! 🎂",
    notificationMessage:
      "We've added 500 bonus points to your account for your birthday! Enjoy your special day.",
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await AdminAPI.getBirthdayRewardConfig();
      if (res.success && res.data) {
        setConfig({
          rewardPoints: res.data.rewardPoints,
          isActive: res.data.isActive,
          notificationTitle: res.data.notificationTitle || "Happy Birthday! 🎂",
          notificationMessage: res.data.notificationMessage || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch reward config:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setSuccessMessage("");
      const res = await AdminAPI.updateBirthdayRewardConfig(config);
      if (res.success) {
        setSuccessMessage("Configuration saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to save reward config:", error);
      alert("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-800 rounded w-1/4"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
          <CakeIcon className="w-10 h-10 text-pink-500" />
          Birthday Rewards
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Automate loyalty rewards and notifications for customer birthdays
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 space-y-8">
          {/* Status Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-4">
              <div
                className={`p-3 rounded-lg ${config.isActive ? "bg-green-900/30 text-green-400" : "bg-gray-700 text-gray-500"}`}
              >
                <CheckBadgeIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-bold text-white uppercase tracking-tight">
                  Automation Status
                </p>
                <p className="text-xs text-gray-500 uppercase">
                  System currently {config.isActive ? "active" : "paused"}
                </p>
              </div>
            </div>
            <button
              onClick={() =>
                setConfig({ ...config, isActive: !config.isActive })
              }
              aria-label={
                config.isActive
                  ? "Pause birthday automation"
                  : "Activate birthday automation"
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${config.isActive ? "bg-green-600" : "bg-gray-700"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.isActive ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Points Config */}
            <div className="space-y-4">
              <label className="text-xs text-gray-500 font-black uppercase tracking-widest block">
                Points Reward Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  id="reward-points"
                  aria-label="Loyalty points reward amount"
                  title="Loyalty points reward amount"
                  value={config.rewardPoints}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      rewardPoints: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-4 text-3xl font-black text-yellow-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 font-black uppercase tracking-widest">
                  PTS
                </span>
              </div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                Suggested amount: 500 points (~$5.00 value)
              </p>
            </div>

            {/* Notification Preview */}
            <div className="space-y-4">
              <label className="text-xs text-gray-500 font-black uppercase tracking-widest block">
                Push Notification Title
              </label>
              <input
                type="text"
                value={config.notificationTitle}
                onChange={(e) =>
                  setConfig({ ...config, notificationTitle: e.target.value })
                }
                placeholder="Notification Title"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-3 text-white font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Large Message Area */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-500 font-black uppercase tracking-widest block">
                Notification Message
              </label>
              <span className="text-[10px] text-blue-400 font-black uppercase flex items-center gap-1">
                <BellIcon className="w-3 h-3" />
                Live Preview
              </span>
            </div>
            <textarea
              value={config.notificationMessage}
              onChange={(e) =>
                setConfig({ ...config, notificationMessage: e.target.value })
              }
              rows={4}
              placeholder="Message body..."
              className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-4 text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-inner"
            />
          </div>

          {/* Footer Save Section */}
          <div className="pt-8 border-t border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold uppercase">
              <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
              Safe to save — Changes take effect immediately
            </div>
            <div className="flex items-center gap-4">
              {successMessage && (
                <span className="text-green-500 font-bold text-sm animate-in fade-in slide-in-from-right-2">
                  {successMessage}
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black uppercase tracking-widest px-10 py-4 rounded-xl transition-all flex items-center gap-3 shadow-xl shadow-blue-900/40"
              >
                {isSaving ? (
                  <ArrowPathIcon className="w-5 h-5 animate-spin" />
                ) : (
                  "Update Configuration"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Background Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 opacity-50">
        <div className="p-6 bg-gray-900/30 border border-gray-800 rounded-xl">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
            Automated Trigger
          </p>
          <p className="text-xs leading-relaxed">
            The system scans for customer birthdays every morning at 4:00 AM.
            Any customer whose birthday matches the current date will
            automatically receive the specified points and push notification.
          </p>
        </div>
        <div className="p-6 bg-gray-900/30 border border-gray-800 rounded-xl">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-2">
            Audit Logs
          </p>
          <p className="text-xs leading-relaxed">
            All rewards issued by this automation are logged under the "Birthday
            Rewards" category in the system activity logs. You can track
            redemption and issuance there.
          </p>
        </div>
      </div>
    </div>
  );
}
