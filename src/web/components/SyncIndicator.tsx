"use client";

import { useSyncStatus } from "@/context/SyncContext";
import { ArrowPathIcon, CheckCircleIcon, ExclamationCircleIcon, WifiIcon } from "@heroicons/react/24/solid";

export function SyncIndicator() {
  const { status, message, lastSyncTime, posLatency } = useSyncStatus();

  // Get status color and icon
  const getStatusConfig = () => {
    switch (status) {
      case "online":
        return {
          dotClass: "sync-dot-online",
          icon: <CheckCircleIcon className="w-3 h-3" />,
          color: "text-green-400",
        };
      case "syncing":
        return {
          dotClass: "sync-dot-syncing",
          icon: <ArrowPathIcon className="w-3 h-3 animate-spin" />,
          color: "text-amber-400",
        };
      case "offline":
        return {
          dotClass: "sync-dot-offline",
          icon: <WifiIcon className="w-3 h-3" />,
          color: "text-red-400",
        };
      case "error":
        return {
          dotClass: "sync-dot-error",
          icon: <ExclamationCircleIcon className="w-3 h-3" />,
          color: "text-red-400",
        };
      default:
        return {
          dotClass: "sync-dot-offline",
          icon: <WifiIcon className="w-3 h-3" />,
          color: "text-gray-400",
        };
    }
  };

  const config = getStatusConfig();

  // Format last sync time
  const formatLastSync = () => {
    if (!lastSyncTime) return "Never";
    const now = new Date();
    const diff = now.getTime() - lastSyncTime.getTime();
    
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  return (
    <div className="sync-indicator-container group relative">
      <div className="sync-indicator">
        <span className={config.dotClass}>
          <span className={`${config.color}`}>{config.icon}</span>
        </span>
        <span className="sync-text">{message}</span>
      </div>

      {/* Tooltip with detailed info */}
      <div className="sync-tooltip">
        <div className="sync-tooltip-header">
          <span className={config.color}>{config.icon}</span>
          <span className="font-semibold">{message}</span>
        </div>
        <div className="sync-tooltip-content">
          <div className="sync-tooltip-row">
            <span>Status:</span>
            <span className={`capitalize ${config.color}`}>{status}</span>
          </div>
          {posLatency && (
            <div className="sync-tooltip-row">
              <span>Latency:</span>
              <span>{posLatency.toFixed(0)}ms</span>
            </div>
          )}
          <div className="sync-tooltip-row">
            <span>Last Sync:</span>
            <span>{formatLastSync()}</span>
          </div>
        </div>
        <div className="sync-tooltip-footer">
          Auto-sync every 30 seconds
        </div>
      </div>
    </div>
  );
}
