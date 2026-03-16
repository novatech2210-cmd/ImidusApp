"use client";

import { useAuth } from "@/context/AuthContext";
import { CustomerAPI } from "@/lib/api";
import {
  CalendarIcon,
  EnvelopeIcon,
  GiftIcon,
  MapPinIcon,
  PhoneIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

interface CustomerProfile {
  customerId: number;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  earnedPoints: number;
  savings: number;
  creditBalance: number;
  lastVisit?: string;
  totalOrders: number;
  totalSpent: number;
  birthMonth?: number;
  birthDay?: number;
}

export default function ProfilePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Birthday editing state
  const [isEditingBirthday, setIsEditingBirthday] = useState(false);
  const [birthMonth, setBirthMonth] = useState<number | " text-gray-400" | "">(
    "",
  );
  const [birthDay, setBirthDay] = useState<number | "">("");
  const [isSavingBirthday, setIsSavingBirthday] = useState(false);
  const [birthdayMessage, setBirthdayMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!user?.profileId) {
        setIsLoading(false);
        return;
      }

      try {
        // Use the user profile data from auth context directly
        setProfile({
          customerId: user.profileId,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: "",
          email: user.email,
          earnedPoints: user.earnedPoints,
          savings: 0,
          creditBalance: 0,
          totalOrders: 0,
          totalSpent: 0,
          birthMonth: user.birthMonth,
          birthDay: user.birthDay,
        });

        // Initialize birthday editing state
        if (user.birthMonth) setBirthMonth(user.birthMonth);
        if (user.birthDay) setBirthDay(user.birthDay);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    }

    if (!authLoading) {
      loadProfile();
    }
  }, [user, authLoading]);

  const handleSaveBirthday = async () => {
    if (!profile || !birthMonth || !birthDay) return;

    setIsSavingBirthday(true);
    setBirthdayMessage(null);

    try {
      await CustomerAPI.updateBirthday(
        profile.customerId,
        Number(birthMonth),
        Number(birthDay),
      );
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              birthMonth: Number(birthMonth),
              birthDay: Number(birthDay),
            }
          : null,
      );
      setBirthdayMessage({
        type: "success",
        text: "Birthday updated! Get ready for rewards.",
      });
      setIsEditingBirthday(false);
    } catch (err) {
      setBirthdayMessage({
        type: "error",
        text: "Failed to update birthday. Please try again.",
      });
    } finally {
      setIsSavingBirthday(false);
    }
  };

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <UserCircleIcon className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign In Required
          </h1>
          <p className="text-gray-600 mb-6">
            Please sign in to view your profile
          </p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-blue-600 hover:underline"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <UserCircleIcon className="w-14 h-14 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-2xl font-bold">
                  {profile?.firstName || user.firstName || "Guest"}
                </h1>
                <p className="text-blue-200">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {profile?.earnedPoints || 0}
                </p>
                <p className="text-sm text-gray-600">Points</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-600">
                  $
                  {(
                    (profile?.savings || 0) + (profile?.creditBalance || 0)
                  ).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600">Rewards</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Account Details
              </h2>

              {profile?.phone && (
                <div className="flex items-center gap-3 text-gray-600">
                  <PhoneIcon className="w-5 h-5" />
                  <span>{profile.phone}</span>
                </div>
              )}

              {profile?.email && (
                <div className="flex items-center gap-3 text-gray-600">
                  <EnvelopeIcon className="w-5 h-5" />
                  <span>{profile.email}</span>
                </div>
              )}

              {profile?.address && (
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPinIcon className="w-5 h-5" />
                  <span>{profile.address}</span>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 text-gray-900 font-medium">
                    <GiftIcon className="w-5 h-5 text-pink-500" />
                    <span>Birthday Rewards</span>
                  </div>
                  {!profile?.birthMonth && !isEditingBirthday && (
                    <button
                      onClick={() => setIsEditingBirthday(true)}
                      className="text-sm text-blue-600 font-medium hover:underline"
                    >
                      Add Birthday
                    </button>
                  )}
                  {profile?.birthMonth && !isEditingBirthday && (
                    <button
                      onClick={() => setIsEditingBirthday(true)}
                      className="text-sm text-gray-400 font-medium hover:text-blue-600 underline"
                    >
                      Change
                    </button>
                  )}
                </div>

                {!isEditingBirthday && (
                  <div className="text-sm text-gray-600">
                    {profile?.birthMonth ? (
                      <p>
                        Your birthday is set to{" "}
                        <strong>
                          {months[(profile.birthMonth || 1) - 1]}{" "}
                          {profile.birthDay}
                        </strong>
                        . You'll receive bonus points on this day!
                      </p>
                    ) : (
                      <p>
                        Add your birthday to receive exclusive 500-point bonus
                        rewards every year!
                      </p>
                    )}
                  </div>
                )}

                {isEditingBirthday && (
                  <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                          Month
                        </label>
                        <select
                          value={birthMonth}
                          onChange={(e) =>
                            setBirthMonth(Number(e.target.value))
                          }
                          aria-label="Birth Month"
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Month</option>
                          {months.map((m, i) => (
                            <option key={m} value={i + 1}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                          Day
                        </label>
                        <select
                          value={birthDay}
                          onChange={(e) => setBirthDay(Number(e.target.value))}
                          aria-label="Birth Day"
                          className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">Day</option>
                          {days.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveBirthday}
                        disabled={isSavingBirthday || !birthMonth || !birthDay}
                        className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {isSavingBirthday ? "Saving..." : "Save Birthday"}
                      </button>
                      <button
                        onClick={() => setIsEditingBirthday(false)}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {birthdayMessage && (
                  <div
                    className={`mt-3 p-3 rounded-lg text-sm font-medium ${
                      birthdayMessage.type === "success"
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {birthdayMessage.text}
                  </div>
                )}
              </div>

              {profile?.lastVisit && (
                <div className="flex items-center gap-3 text-gray-600 pt-4 border-t border-gray-100">
                  <CalendarIcon className="w-5 h-5" />
                  <span>
                    Last visit:{" "}
                    {new Date(profile.lastVisit).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Order Statistics
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">
                    {profile?.totalOrders || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Orders</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-gray-900">
                    ${(profile?.totalSpent || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">Total Spent</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => {
                  localStorage.removeItem("customer");
                  window.location.href = "/";
                }}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
