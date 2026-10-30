import React from "react";
import { Outlet } from "react-router-dom";
import { TopNavbar } from "./TopNavbar";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-white flex flex-col text-slate-900">
      {/* Top Command Deck */}
      <TopNavbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
