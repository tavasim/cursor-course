"use client";

import { useState } from "react";
import Sidebar from "@/app/components/Sidebar";

export default function DashboardsLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen h-screen">
      {/* Sidebar - full height, hidden by default */}
      <div
        className={`fixed inset-y-0 left-0 z-40 h-screen w-64 shrink-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Overlay when sidebar is open (mobile) */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main
        className={`flex-1 min-h-screen overflow-auto bg-white transition-[margin] duration-200 ease-in-out ${
          sidebarOpen ? "md:ml-64" : ""
        } pl-14 pt-4 md:pl-16 md:pt-6`}
      >
        {/* Toggle button - always visible when sidebar is hidden */}
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-lg bg-[#F5F5F4] text-gray-600 shadow-sm transition-colors hover:bg-gray-200 md:left-6 md:top-6"
          aria-label="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
        {children}
      </main>
    </div>
  );
}
