"use client";

import MainLayout from "@/components/Navigation/MainLayout";
import { useAuth } from "@/lib/hooks";
import { Bell, Check, Database, Save, Shield, User } from "lucide-react";
import React, { useState } from "react";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    }, 1000);
  };

  return (
    <MainLayout>
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#F5F5F7] mb-2">Settings</h1>
            <p className="text-[#6E6E78]">
              Manage your admin profile and system preferences
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-gradient-to-r from-[#5BA0FF] to-[#3D82E0] text-white px-6 py-2.5 rounded-xl font-semibold shadow-[0_4px_16px_rgba(91,160,255,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : showSaved ? (
              <Check size={20} />
            ) : (
              <Save size={20} />
            )}
            {showSaved ? "Saved" : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Navigation Tabs */}
          <div className="space-y-2">
            <SettingsTab icon={<User size={18} />} label="Profile" active />
            <SettingsTab icon={<Bell size={18} />} label="Notifications" />
            <SettingsTab icon={<Shield size={18} />} label="Security" />
            <SettingsTab icon={<Database size={18} />} label="Data Sync" />
          </div>

          {/* Settings Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Profile Section */}
            <section className="bg-[#1A1A1F] rounded-2xl border border-[#2A2A30] overflow-hidden">
              <div className="p-6 border-b border-[#2A2A30]">
                <h3 className="text-lg font-semibold text-[#F5F5F7]">
                  Admin Profile
                </h3>
                <p className="text-sm text-[#6E6E78]">
                  Personal information and avatar
                </p>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#5BA0FF] to-[#3D82E0] rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
                    {user?.firstName?.charAt(0) || "A"}
                  </div>
                  <div>
                    <button className="text-sm font-semibold text-[#5BA0FF] hover:text-[#3D82E0] transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-xs text-[#6E6E78] mt-1">
                      JPG or PNG. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <InputGroup
                    label="First Name"
                    defaultValue={user?.firstName || "Admin"}
                  />
                  <InputGroup
                    label="Last Name"
                    defaultValue={user?.lastName || "User"}
                  />
                </div>
                <InputGroup
                  label="Email Address"
                  defaultValue={user?.email || "admin@imidus.com"}
                  disabled
                />
                <InputGroup
                  label="Role"
                  defaultValue="Super Administrator"
                  disabled
                />
              </div>
            </section>

            {/* Security Section */}
            <section className="bg-[#1A1A1F] rounded-2xl border border-[#2A2A30] overflow-hidden">
              <div className="p-6 border-b border-[#2A2A30]">
                <h3 className="text-lg font-semibold text-[#F5F5F7]">
                  Password
                </h3>
                <p className="text-sm text-[#6E6E78]">
                  Update your account password
                </p>
              </div>
              <div className="p-6 space-y-4">
                <InputGroup label="Current Password" type="password" />
                <InputGroup label="New Password" type="password" />
                <InputGroup label="Confirm New Password" type="password" />
              </div>
            </section>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

function SettingsTab({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-[#222228] text-[#F5F5F7] border border-[#2A2A30]"
          : "text-[#6E6E78] hover:bg-[#222228] hover:text-[#9A9AA3]"
      }`}
    >
      <span className={active ? "text-[#5BA0FF]" : ""}>{icon}</span>
      {label}
    </button>
  );
}

function InputGroup({
  label,
  defaultValue,
  type = "text",
  disabled = false,
}: {
  label: string;
  defaultValue?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-[#6E6E78] uppercase tracking-wider ml-1">
        {label}
      </label>
      <input
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`w-full bg-[#222228] border border-[#2A2A30] rounded-xl px-4 py-2.5 text-sm text-[#F5F5F7] focus:border-[#5BA0FF] focus:outline-none transition-all ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-[#1A1A1F]"
            : "hover:border-[#3A3A42]"
        }`}
      />
    </div>
  );
}
