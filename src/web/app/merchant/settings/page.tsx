"use client";

import { AdminAPI, SyncAPI, SyncStatusResponse } from "@/lib/api";
import {
    BuildingOfficeIcon,
    CircleStackIcon,
    GiftIcon,
    InformationCircleIcon,
    ShieldCheckIcon,
    UserGroupIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function MerchantSettingsPage() {
  const [syncStatus, setSyncStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [rewardConfig, setRewardConfig] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const [statusRes, rewardRes] = await Promise.all([
        SyncAPI.getStatus(),
        AdminAPI.getBirthdayRewardConfig(),
      ]);
      setSyncStatus(statusRes);
      if (rewardRes.success) setRewardConfig(rewardRes.data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRewards = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg("");
    try {
      const res = await AdminAPI.updateBirthdayRewardConfig(rewardConfig);
      if (res.success) {
        setSuccessMsg("Birthday rewards updated successfully.");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } catch (error) {
      console.error("Failed to update rewards:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-10 space-y-12 imperial-onyx max-w-6xl mx-auto">
      {/* Title & Controls */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-micro text-[#D4AF37] mb-2 block">
            System Configuration
          </span>
          <h1 className="text-display leading-none text-white tracking-[-0.05em]">
            Console{" "}
            <span className="font-light italic text-[#D4AF37]">Identity</span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Navigation Sidebar (Visual Only) */}
        <div className="space-y-4">
          <div className="bg-[#0A1F3D] rounded-xl p-2 border border-white/5">
            {[
              {
                name: "Business Profile",
                icon: BuildingOfficeIcon,
                active: true,
              },
              { name: "POS Integration", icon: CircleStackIcon },
              { name: "Loyalty & Rewards", icon: GiftIcon },
              { name: "Security & Access", icon: ShieldCheckIcon },
              { name: "Staff Management", icon: UserGroupIcon },
            ].map((item) => (
              <button
                key={item.name}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-300 ${
                  item.active
                    ? "bg-white text-[#0A1F3D] shadow-lg"
                    : "text-white/40 hover:bg-white/5 hover:text-white"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 ${item.active ? "text-[#0A1F3D]" : "text-[#D4AF37]/50"}`}
                />
                <span className="text-[10px] font-black uppercase tracking-[0.2rem]">
                  {item.name}
                </span>
              </button>
            ))}
          </div>

          {/* System Health Block */}
          <div className="bg-white rounded-[1rem] p-6 shadow-studio">
            <span className="text-micro text-[#0A1F3D]/40 block mb-4">
              System Integrity
            </span>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0A1F3D]">
                  POS Link
                </span>
                <span className="flex items-center gap-2 px-2 py-0.5 bg-green-900/10 text-green-600 text-[9px] font-black uppercase tracking-widest rounded">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0A1F3D]">
                  API Latency
                </span>
                <span className="text-[11px] font-black text-[#D4AF37]">
                  {syncStatus?.posDatabaseLatency?.toFixed(1) || "0.0"}ms
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#0A1F3D]">
                  Version
                </span>
                <span className="text-[11px] font-black text-[#0A1F3D]/20 uppercase">
                  v2.0.4 Premium
                </span>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-[#0A1F3D]/5">
              <button className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest hover:underline underline-offset-4">
                View Access Logs
              </button>
            </div>
          </div>
        </div>

        {/* Right: Detailed Settings */}
        <div className="lg:col-span-2 space-y-10">
          {/* Business Ground Truth (Read-only) */}
          <section className="bg-white rounded-[1rem] shadow-studio overflow-hidden">
            <div className="px-8 py-6 border-b border-[#0A1F3D]/5 bg-[#F8F9FA] flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-black text-[#0A1F3D] uppercase tracking-[0.25rem]">
                  Merchant Anchor
                </h2>
                <p className="text-[11px] font-bold text-[#0A1F3D]/40 mt-1 uppercase tracking-widest">
                  Ground Truth from POS
                </p>
              </div>
              <InformationCircleIcon
                className="w-5 h-5 text-[#D4AF37]"
                title="Data synchronized from legacy INI POS database"
              />
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              <div className="space-y-1.5">
                <label className="text-micro text-[#0A1F3D]/40 ml-1">
                  Legal Entity Name
                </label>
                <div className="px-5 py-4 bg-[#F8F9FA] rounded-xl text-[#0A1F3D] font-bold text-sm">
                  Metropolitan Diner (New York)
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-micro text-[#0A1F3D]/40 ml-1">
                  POS Station ID
                </label>
                <div className="px-5 py-4 bg-[#F8F9FA] rounded-xl text-[#0A1F3D] font-bold text-sm">
                  STATION_MAIN_01 (ID: 999)
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-micro text-[#0A1F3D]/40 ml-1">
                  Terminal Registry
                </label>
                <div className="px-5 py-4 bg-[#F8F9FA] rounded-xl text-[#0A1F3D] font-bold text-sm underline underline-offset-4 decoration-[#D4AF37]/30">
                  100 Broadway, New York, NY 10005
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-micro text-[#0A1F3D]/40 ml-1">
                  Operational ID
                </label>
                <div className="px-5 py-4 bg-[#F8F9FA] rounded-xl text-[#0A1F3D] font-bold text-sm">
                  #POS_REG_2026_NY_0041
                </div>
              </div>
            </div>
          </section>

          {/* Birthday Rewards Overlay (Editable) */}
          <section className="bg-[#0A1F3D] rounded-[1rem] border border-white/10 shadow-studio overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-[14px] font-black text-white uppercase tracking-[0.25rem]">
                  Growth Strategy
                </h2>
                <p className="text-[11px] font-bold text-white/40 mt-1 uppercase tracking-widest">
                  Birthday Automation Overlay
                </p>
              </div>
              <GiftIcon className="w-5 h-5 text-[#D4AF37]" />
            </div>

            <form onSubmit={handleSaveRewards} className="p-10 space-y-8">
              {successMsg && (
                <div className="p-4 bg-green-900/30 border border-green-800 rounded-xl text-center">
                  <span className="text-[11px] font-black text-green-400 uppercase tracking-widest">
                    {successMsg}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-micro text-[#D4AF37] ml-1">
                    Reward Magnitude (Points)
                  </label>
                  <input
                    type="number"
                    value={rewardConfig?.rewardPoints || 0}
                    onChange={(e) =>
                      setRewardConfig({
                        ...rewardConfig,
                        rewardPoints: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-black text-lg focus:ring-2 focus:ring-[#D4AF37]/40 outline-none"
                    placeholder="500"
                  />
                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1 ml-1">
                    Points awarded on member birthdays
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-micro text-[#D4AF37] ml-1">
                    Strategy State
                  </label>
                  <div className="flex items-center gap-4 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setRewardConfig({ ...rewardConfig, isActive: true })
                      }
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        rewardConfig?.isActive
                          ? "bg-[#D4AF37] text-[#0A1F3D] shadow-[0_0_15px_rgba(212,175,55,0.3)]"
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}
                    >
                      Active
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setRewardConfig({ ...rewardConfig, isActive: false })
                      }
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        !rewardConfig?.isActive
                          ? "bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                          : "bg-white/5 text-white/40 border border-white/10"
                      }`}
                    >
                      Paused
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-micro text-[#D4AF37] ml-1">
                  Invoke Message Title
                </label>
                <input
                  type="text"
                  value={rewardConfig?.notificationTitle || ""}
                  onChange={(e) =>
                    setRewardConfig({
                      ...rewardConfig,
                      notificationTitle: e.target.value,
                    })
                  }
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-sm focus:ring-2 focus:ring-[#D4AF37]/40 outline-none"
                  placeholder="Happy Birthday!"
                />
              </div>

              <div className="space-y-3">
                <label className="text-micro text-[#D4AF37] ml-1">
                  Invoke Message Payload
                </label>
                <textarea
                  value={rewardConfig?.notificationMessage || ""}
                  onChange={(e) =>
                    setRewardConfig({
                      ...rewardConfig,
                      notificationMessage: e.target.value,
                    })
                  }
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium text-sm focus:ring-2 focus:ring-[#D4AF37]/40 outline-none h-32"
                  placeholder="Enjoy your special day with a gift on us."
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn-gold-shimmer w-full py-5 rounded-xl flex items-center justify-center gap-3"
              >
                {isSaving
                  ? "Saving Configuration..."
                  : "Update Reward Strategy"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
