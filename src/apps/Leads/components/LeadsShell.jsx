// src/apps/Leads/components/LeadsShell.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Inner Shell: Tab Nav + Toast + Scraping Modal Trigger
//
// Renders the persistent top-anchored module navigation, the global toast
// overlay, and wraps the current route view.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Zap, Tag, Search, Menu } from "lucide-react";
import { useLeads } from "../demo-services/state-manager";
import ScrapingModal from "./ScrapingModal";
import ToastOverlay from "./ToastOverlay";

export default function LeadsShell({ children, onToggleSidebar }) {
  const { toast } = useLeads();
  const [isScrapingModalOpen, setIsScrapingModalOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950 overflow-hidden">

      {/* ── Module Tab Nav ──────────────────────────────────────────────── */}
      <header className="shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 pt-3 pb-0 flex items-center gap-2 shadow-sm">

        {/* Sidebar toggle (inherits global sidebar) */}
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-1 mr-1 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Module identity */}
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-700 rounded-lg flex items-center justify-center shadow-md">
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-black text-[11px] uppercase tracking-widest text-gray-900 dark:text-white hidden sm:block">
            BizLeads
          </span>
        </div>

        {/* Tab links */}
        <nav className="flex items-end gap-1 flex-1">
          <NavLink
            to="/leads"
            end
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                isActive
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`
            }
          >
            <Search size={13} />
            Discovery
          </NavLink>
          <NavLink
            to="/leads/tags"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 pb-2 pt-1 text-[11px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                isActive
                  ? "border-violet-500 text-violet-600 dark:text-violet-400"
                  : "border-transparent text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`
            }
          >
            <Tag size={13} />
            Tags
          </NavLink>
        </nav>

        {/* ⚡ Scrape CTA */}
        <button
          id="scrape-leads-btn"
          onClick={() => setIsScrapingModalOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-2 mb-1 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95"
        >
          <Zap size={12} className="fill-current" />
          <span className="hidden sm:inline">Scrape New Leads</span>
          <span className="sm:hidden">Scrape</span>
        </button>
      </header>

      {/* ── Route View ─────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>

      {/* ── Modals & Overlays ──────────────────────────────────────────── */}
      <ScrapingModal
        isOpen={isScrapingModalOpen}
        onClose={() => setIsScrapingModalOpen(false)}
      />

      {toast && <ToastOverlay toast={toast} />}
    </div>
  );
}
