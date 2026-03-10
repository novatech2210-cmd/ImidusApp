"use client";

import React from "react";
import DataTable, { Column } from "@/components/Tables/DataTable";
import { SkeletonTable } from "@/components/Loading/Skeleton";
import { BarChart3 } from "lucide-react";

interface Campaign {
  id: number;
  name: string;
  type: "email" | "sms" | "push";
  status: "draft" | "scheduled" | "sent" | "paused";
  targetAudience: number;
  sent: number;
  opened?: number;
  clicked?: number;
  createdAt: string;
  scheduledAt?: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
  loading?: boolean;
  onCampaignClick?: (campaign: Campaign) => void;
  onEditClick?: (campaign: Campaign) => void;
  onSendClick?: (campaign: Campaign) => void;
}

export default function CampaignList({
  campaigns,
  loading = false,
  onCampaignClick,
  onEditClick,
  onSendClick,
}: CampaignListProps) {
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      email: "bg-blue-100 text-blue-800",
      sms: "bg-green-100 text-green-800",
      push: "bg-purple-100 text-purple-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      scheduled: "bg-blue-100 text-blue-800",
      sent: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const columns: Column<Campaign>[] = [
    {
      key: "name",
      label: "Campaign Name",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(value)}`}
        >
          {value.toUpperCase()}
        </span>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (value) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(value)}`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: "targetAudience",
      label: "Target",
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: "sent",
      label: "Sent",
      sortable: true,
      render: (value) => value.toLocaleString(),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  if (loading) {
    return <SkeletonTable rows={10} cols={6} />;
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Campaigns</h3>
      </div>
      <DataTable<Campaign>
        columns={columns}
        data={campaigns}
        pageSize={15}
        onRowClick={onCampaignClick}
        emptyMessage="No campaigns found"
      />
    </div>
  );
}
