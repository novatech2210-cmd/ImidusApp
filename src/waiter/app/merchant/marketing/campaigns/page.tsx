"use client";

import { AdminAPI, Campaign, SegmentCounts } from "@/lib/api";
import {
    ArrowPathIcon,
    MegaphoneIcon,
    PaperAirplaneIcon,
    PlusIcon,
    UserGroupIcon
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [counts, setCounts] = useState<SegmentCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isSending, setIsSending] = useState<number | null>(null);

  // New Campaign State
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    campaignType: "Push",
    targetQuery: "all",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [campaignsData, countsRes] = await Promise.all([
        AdminAPI.getCampaigns(),
        AdminAPI.getCustomerSegments(),
      ]);

      setCampaigns(campaignsData);
      if (countsRes.success) {
        setCounts(countsRes.data);
      }
    } catch (error) {
      console.error("Failed to fetch campaign data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      if (!newCampaign.name || !newCampaign.description) {
        alert("Please fill in all fields.");
        return;
      }

      await AdminAPI.createCampaign(newCampaign);
      setIsCreating(false);
      setNewCampaign({
        name: "",
        description: "",
        campaignType: "Push",
        targetQuery: "all",
      });
      fetchData();
    } catch (error) {
      console.error("Failed to create campaign:", error);
      alert("Failed to create campaign.");
    }
  };

  const handleSendCampaign = async (id: number) => {
    if (
      !confirm(
        "Are you sure you want to send this push notification to all targeted customers?",
      )
    )
      return;

    try {
      setIsSending(id);
      const res = await AdminAPI.sendCampaign(id);
      alert(`Success! Campaign sent to ${res.sentCount} customers.`);
      fetchData();
    } catch (error) {
      console.error("Failed to send campaign:", error);
      alert("Failed to send campaign.");
    } finally {
      setIsSending(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Draft: "bg-gray-100 text-gray-800",
      Sent: "bg-green-100 text-green-800",
      Scheduled: "bg-blue-100 text-blue-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${styles[status] || "bg-gray-100 text-gray-800"}`}
      >
        {status}
      </span>
    );
  };

  const getTargetLabel = (query: string) => {
    switch (query) {
      case "all":
        return "All Customers";
      case "High-spend":
        return "High-Spend (LTV > $500)";
      case "Frequent":
        return "Frequent (> 5 orders)";
      case "Recent":
        return "Recent (Last 30 days)";
      case "At-risk":
        return "At-Risk (No orders > 60 days)";
      case "New":
        return "New Customers (Last 14 days)";
      default:
        return query;
    }
  };

  if (loading && campaigns.length === 0) {
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
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">
            Push Campaigns
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Create and manage targeted marketing notifications
          </p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          Create Campaign
        </button>
      </div>

      {/* Segment Summary Cards */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] text-purple-400 font-black uppercase">
              High-Spend
            </span>
            <span className="text-xl font-bold text-white">
              {counts.highSpend}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] text-blue-400 font-black uppercase">
              Frequent
            </span>
            <span className="text-xl font-bold text-white">
              {counts.frequent}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] text-green-400 font-black uppercase">
              Recent
            </span>
            <span className="text-xl font-bold text-white">
              {counts.recent}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] text-red-400 font-black uppercase">
              At-Risk
            </span>
            <span className="text-xl font-bold text-white">
              {counts.atRisk}
            </span>
          </div>
          <div className="bg-gray-900/50 border border-gray-800 p-3 rounded-lg flex flex-col items-center">
            <span className="text-[10px] text-yellow-400 font-black uppercase">
              New
            </span>
            <span className="text-xl font-bold text-white">
              {counts.newCustomers}
            </span>
          </div>
        </div>
      )}

      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-6">
        {campaigns.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center text-gray-500">
            <MegaphoneIcon className="w-12 h-12 mx-auto mb-4 text-gray-700" />
            <p className="text-lg font-bold">No campaigns yet</p>
            <p className="text-sm">
              Start your first marketing campaign to engage customers.
            </p>
          </div>
        ) : (
          campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-gray-700 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    {campaign.name}
                  </h3>
                  {getStatusBadge(campaign.status)}
                </div>
                <p className="text-gray-400 text-sm mb-4">
                  {campaign.description}
                </p>
                <div className="flex flex-wrap gap-4 text-xs font-bold uppercase tracking-wider">
                  <span className="flex items-center gap-1.5 text-blue-400">
                    <UserGroupIcon className="w-4 h-4" />
                    Target: {getTargetLabel(campaign.targetQuery)}
                  </span>
                  {campaign.sentAt && (
                    <span className="flex items-center gap-1.5 text-green-500">
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Sent: {new Date(campaign.sentAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {campaign.status === "Draft" && (
                  <button
                    onClick={() => handleSendCampaign(campaign.id)}
                    disabled={isSending === campaign.id}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSending === campaign.id ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <PaperAirplaneIcon className="w-5 h-5" />
                    )}
                    Send Now
                  </button>
                )}
                {campaign.status === "Sent" && (
                  <button className="flex-1 md:flex-none border border-gray-800 text-gray-400 font-bold py-2 px-6 rounded-lg cursor-default">
                    Campaign Completed
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-lg w-full p-8 space-y-6 animate-in zoom-in duration-300">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              New Push Campaign
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1 block">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={newCampaign.name}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, name: e.target.value })
                  }
                  placeholder="e.g. Weekend Pizza Special"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1 block">
                  Push Message (Description)
                </label>
                <textarea
                  value={newCampaign.description}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      description: e.target.value,
                    })
                  }
                  placeholder="The message customers will receive..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 font-black uppercase tracking-widest mb-1 block">
                  Target Audience
                </label>
                <select
                  value={newCampaign.targetQuery}
                  onChange={(e) =>
                    setNewCampaign({
                      ...newCampaign,
                      targetQuery: e.target.value,
                    })
                  }
                  aria-label="Select target audience segment"
                  className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 text-white font-bold"
                >
                  <option value="all">All Registered Customers</option>
                  <option value="High-spend">
                    High-Spend Customers (LTV {">"} $500)
                  </option>
                  <option value="Frequent">
                    Frequent Customers ({">"} 5 orders)
                  </option>
                  <option value="Recent">
                    Recent Customers (Active last 30 days)
                  </option>
                  <option value="At-risk">
                    At-Risk Customers (Inactive {">"} 60 days)
                  </option>
                  <option value="New">
                    New Customers (Joined last 14 days)
                  </option>
                </select>
                {counts && (
                  <p className="mt-2 text-[10px] text-blue-400 font-bold uppercase">
                    Current Estimated Reach:{" "}
                    {newCampaign.targetQuery === "all"
                      ? counts.total
                      : newCampaign.targetQuery === "High-spend"
                        ? counts.highSpend
                        : newCampaign.targetQuery === "Frequent"
                          ? counts.frequent
                          : newCampaign.targetQuery === "Recent"
                            ? counts.recent
                            : newCampaign.targetQuery === "At-risk"
                              ? counts.atRisk
                              : counts.newCustomers}{" "}
                    Customers
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                onClick={() => setIsCreating(false)}
                className="flex-1 py-3 bg-gray-800 text-white font-bold rounded-lg uppercase text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCampaign}
                className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg uppercase text-xs hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20"
              >
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
