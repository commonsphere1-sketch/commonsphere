import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { HeaderNav } from "./HeaderNav";
import { SidebarNav } from "./SidebarNav";
import { NotesPopup } from "./NotesPopup";

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <HeaderNav
        onMenuToggle={() => setMobileSidebarOpen((v) => !v)}
        mobileSidebarOpen={mobileSidebarOpen}
      />
      <div className="flex flex-1 pt-16">
        {/* Desktop Sidebar */}
        <aside
          className={`hidden md:flex flex-col fixed left-0 top-16 bottom-0 z-30 bg-white dark:bg-[#080810] border-r border-border transition-all duration-200 ease-in-out ${
            sidebarOpen ? "w-40" : "w-12"
          }`}
        >
          <SidebarNav
            collapsed={!sidebarOpen}
            onToggle={() => setSidebarOpen((v) => !v)}
          />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        {/* Mobile Sidebar */}
        <aside
          className={`fixed left-0 top-0 bottom-0 z-50 w-64 bg-card dark:bg-black border-r border-border flex flex-col md:hidden transition-transform duration-200 ease-in-out ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-4 h-16 border-b border-border">
            <span className="text-foreground font-bold text-lg font-sans">
              CommonSphere
            </span>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="text-muted-foreground hover:text-foreground transition-colors duration-150 p-2"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>
          <SidebarNav
            collapsed={false}
            onToggle={() => setMobileSidebarOpen(false)}
            mobile
          />
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 min-h-0 transition-all duration-200 ease-in-out ${
            sidebarOpen ? "md:ml-40" : "md:ml-12"
          }`}
          id="main-content"
        >
          <Outlet />
        </main>
      </div>
      <NotesPopup />
    </div>
  );
}
