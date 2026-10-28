import React, { useState, useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from "lucide-react";
import { b2cApi } from "../../services/b2cApi";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setJustReconnected(true);
      // Dispatch platform-wide network restored event
      window.dispatchEvent(new CustomEvent("flash:network_restored"));
      const timer = setTimeout(() => {
        setJustReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setJustReconnected(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const checkConnection = async () => {
    setChecking(true);
    try {
      // Ping health endpoint with cache busting
      await fetch(`/api/b2c/gateway/health?_t=${Date.now()}`, { method: "GET", cache: "no-store" });
      setIsOffline(false);
      setJustReconnected(true);
      window.dispatchEvent(new CustomEvent("flash:network_restored"));
      setTimeout(() => setJustReconnected(false), 4000);
    } catch (_) {
      setIsOffline(true);
    } finally {
      setChecking(false);
    }
  };

  if (!isOffline && !justReconnected) {
    return null;
  }

  if (justReconnected) {
    return (
      <div className="sticky top-0 z-50 bg-emerald-600 text-white px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>Connection restored! You are back online and synced with Flash network.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-50 bg-amber-600 text-white px-4 py-2.5 text-xs font-medium shadow-lg flex flex-col sm:flex-row items-center justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-amber-700 flex items-center justify-center shrink-0">
          <WifiOff className="w-3.5 h-3.5 text-amber-200" />
        </div>
        <div>
          <strong className="font-bold mr-1">You are offline.</strong>
          <span>Your progress, code drafts, and assessment responses are cached locally and will automatically sync once reconnected.</span>
        </div>
      </div>

      <button
        onClick={checkConnection}
        disabled={checking}
        className="px-3 py-1 bg-amber-700 hover:bg-amber-800 active:bg-amber-900 rounded-lg text-white font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
        <span>{checking ? "Checking..." : "Check Status"}</span>
      </button>
    </div>
  );
}
