"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Sync status types
type SyncStatus = "online" | "offline" | "syncing" | "error";

interface SyncState {
  status: SyncStatus;
  isHealthy: boolean;
  message: string;
  lastSyncTime: Date | null;
  posLatency: number | null;
  categoriesAvailable: number;
  isPolling: boolean;
}

interface SyncContextType extends SyncState {
  checkSync: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

const SyncContext = createContext<SyncContextType | null>(null);

// Polling interval in milliseconds (30 seconds default)
const DEFAULT_POLLING_INTERVAL = 30000;
// Health check interval (5 seconds when showing syncing)
const HEALTH_CHECK_INTERVAL = 5000;

export function SyncProvider({
  children,
  pollingInterval = DEFAULT_POLLING_INTERVAL,
}: {
  children: React.ReactNode;
  pollingInterval?: number;
}) {
  const [state, setState] = useState<SyncState>({
    status: "syncing",
    isHealthy: false,
    message: "Connecting...",
    lastSyncTime: null,
    posLatency: null,
    categoriesAvailable: 0,
    isPolling: false,
  });

  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);

  // Check sync status with backend API
  const checkSync = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        status: "syncing",
        message: "Checking...",
      }));

      const startTime = performance.now();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5005/api"}/Sync/status`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          // Short timeout for health checks
          signal: AbortSignal.timeout(5000),
        },
      );
      const latency = performance.now() - startTime;

      if (response.ok) {
        const data = await response.json();

        setState({
          status: data.isHealthy ? "online" : "error",
          isHealthy: data.isHealthy,
          message:
            data.message ||
            (data.isHealthy ? "POS Connected" : "Connection Issue"),
          lastSyncTime: new Date(),
          posLatency: data.posDatabaseLatency || latency,
          categoriesAvailable: data.categoriesAvailable || 0,
          isPolling: state.isPolling,
        });
      } else {
        setState({
          status: "error",
          isHealthy: false,
          message: "API Error",
          lastSyncTime: state.lastSyncTime,
          posLatency: null,
          categoriesAvailable: 0,
          isPolling: state.isPolling,
        });
      }
    } catch (error) {
      console.error("Sync check failed:", error);
      setState({
        status: "offline",
        isHealthy: false,
        message: "Offline",
        lastSyncTime: state.lastSyncTime,
        posLatency: null,
        categoriesAvailable: 0,
        isPolling: state.isPolling,
      });
    }
  }, [state.isPolling, state.lastSyncTime]);

  // Start polling
  const startPolling = useCallback(() => {
    if (pollingTimer) return; // Already polling

    setState((prev) => ({ ...prev, isPolling: true }));

    // Immediate first check
    checkSync();

    // Set up interval
    const timer = setInterval(() => {
      checkSync();
    }, pollingInterval);

    setPollingTimer(timer);
  }, [checkSync, pollingInterval, pollingTimer]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
      setPollingTimer(null);
    }
    setState((prev) => ({ ...prev, isPolling: false }));
  }, [pollingTimer]);

  // Auto-start polling on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startPolling();

    // Cleanup on unmount
    return () => {
      stopPolling();
    };
  }, []); // Empty deps - only run on mount

  // Handle visibility change (pause polling when tab hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden - could reduce polling frequency or pause
        console.log("[Sync] Tab hidden, continuing background polling");
      } else {
        // Page visible - immediate check
        console.log("[Sync] Tab visible, checking sync status");
        checkSync();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [checkSync]);

  // Online/offline event handling
  useEffect(() => {
    const handleOnline = () => {
      console.log("[Sync] Browser online event, checking sync");
      setState((prev) => ({
        ...prev,
        status: "syncing",
        message: "Reconnecting...",
      }));
      checkSync();
    };

    const handleOffline = () => {
      console.log("[Sync] Browser offline event");
      setState((prev) => ({
        ...prev,
        status: "offline",
        isHealthy: false,
        message: "No Internet",
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkSync]);

  const value: SyncContextType = {
    ...state,
    checkSync,
    startPolling,
    stopPolling,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync() {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}

// Hook for components that only need to display sync status (read-only)
export function useSyncStatus() {
  const { status, isHealthy, message, lastSyncTime, posLatency } = useSync();
  return { status, isHealthy, message, lastSyncTime, posLatency };
}
