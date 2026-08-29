import { useState } from "react";
import { Outlet,} from "react-router-dom";
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
          className={`sidebar-bar hidden md:flex flex-col fixed left-0 top-16 bottom-0 z-30 border-r border-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            sidebarOpen ? "w-44" : "w-14"
          }`}
          style={{
            backdropFilter: "blur(24px) saturate(150%)",
          }}
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
          className={`sidebar-bar fixed left-0 top-0 bottom-0 z-50 w-64 border-r border-border/50 flex flex-col md:hidden transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            backdropFilter: "blur(24px) saturate(150%)",
          }}
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
          className={`flex-1 min-h-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            sidebarOpen ? "md:ml-44" : "md:ml-14"
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
