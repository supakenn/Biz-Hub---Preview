// src/apps/Leads/views/DiscoveryView.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Discovery CRM View (Default /leads route)
//
// Phase 2: Full ProspectCard list, Web Worker search, FilterSheet,
// LeadDetailsModal (long-press), TagAssignmentModal, and bulk actions.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, SlidersHorizontal, X, Zap, Database, Tag, Eye } from "lucide-react";
import { useLeads, DEFAULT_FILTERS } from "../demo-services/state-manager";
import { leadsDb, deleteProspects } from "../demoDb/leadsDb";
import ProspectCard from "../components/ProspectCard";
import LeadDetailsModal from "../components/LeadDetailsModal";
import TagAssignmentModal from "../components/TagAssignmentModal";
import FilterSheet from "../components/FilterSheet";

const PAGE_SIZE = 30;

// ─── Skeleton ────────────────────────────────────────────────────────────────
function ProspectCardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/3" />
        </div>
      </div>
      <div className="flex gap-3 mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 bg-gray-100 dark:bg-gray-800 rounded-xl" />
            <div className="w-6 h-2 bg-gray-100 dark:bg-gray-800 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ hasLeads }) {
  if (hasLeads) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
        <Search size={28} className="text-gray-400" />
      </div>
      <div>
        <p className="font-black text-gray-700 dark:text-gray-200 text-lg">No Results Found</p>
        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters.</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-5 px-8 text-center">
      <div className="relative">
        <div className="w-20 h-20 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-3xl flex items-center justify-center">
          <Database size={32} className="text-violet-500" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center">
          <Zap size={12} className="text-white fill-current" />
        </div>
      </div>
      <div>
        <p className="font-black text-gray-900 dark:text-white text-xl">Your Lead Database is Empty</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
          Hit <span className="font-bold text-violet-600">⚡ Scrape New Leads</span> to fetch
          your first batch of prospects from Google Maps.
        </p>
      </div>
      <button
        onClick={() => document.getElementById("scrape-leads-btn")?.click()}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-violet-500/30 transition-all hover:from-violet-500 hover:to-purple-600 active:scale-95"
      >
        <Zap size={14} className="fill-current" /> Scrape New Leads
      </button>
    </div>
  );
}

// ─── Filter Pill ──────────────────────────────────────────────────────────────
function FilterPill({ label }) {
  return (
    <span className="shrink-0 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[10px] font-bold rounded-lg">
      {label}
    </span>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────
export default function DiscoveryView() {
  const {
    searchQuery, setSearchQuery,
    searchFilters, resetFilters, hasActiveFilters,
    isBulkSelectionMode, enterBulkMode,
    selectedProspects, toggleProspectSelection, clearSelection,
    lastHydration,
    showToast,
  } = useLeads();

  const [prospects,  setProspects]  = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [dbTotal,    setDbTotal]    = useState(0);
  const [isLoading,  setIsLoading]  = useState(true);
  const [page,       setPage]       = useState(0);

  // Modal state
  const [detailProspect,     setDetailProspect]     = useState(null);
  const [isDetailOpen,       setIsDetailOpen]       = useState(false);
  const [isTagModalOpen,     setIsTagModalOpen]     = useState(false);
  const [isFilterOpen,       setIsFilterOpen]       = useState(false);
  // Long-press quick action sheet
  const [quickActionProspect, setQuickActionProspect] = useState(null);
  // Single-prospect tag management
  const [tagProspect,        setTagProspect]        = useState(null);
  const [isSingleTagOpen,    setIsSingleTagOpen]    = useState(false);

  const workerRef = useRef(null);

  // ── Init Web Worker ─────────────────────────────────────────────────────
  useEffect(() => {
    workerRef.current = new Worker(
      new URL("../workers/searchWorker.js", import.meta.url),
      { type: "module" }
    );
    workerRef.current.onmessage = (e) => {
      const { type, results, total } = e.data;
      if (type === "RESULTS") {
        setProspects((prev) => page === 0 ? results : [...prev, ...results]);
        setTotalCount(total);
        setIsLoading(false);
      } else if (type === "ERROR") {
        setIsLoading(false);
      }
    };
    return () => workerRef.current?.terminate();
  }, []); // eslint-disable-line

  // ── DB total (for empty state) ─────────────────────────────────────────
  useEffect(() => {
    leadsDb.prospects.count().then(setDbTotal).catch(() => setDbTotal(0));
  }, [lastHydration]);

  // ── Trigger search ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!workerRef.current) return;
    setIsLoading(true);
    workerRef.current.postMessage({
      type: "SEARCH",
      payload: { query: searchQuery, filters: searchFilters, page, pageSize: PAGE_SIZE },
    });
  }, [searchQuery, searchFilters, page, lastHydration]);

  // Reset to page 0 on new search/filter
  useEffect(() => { setPage(0); }, [searchQuery, searchFilters]);

  // ── Handlers ───────────────────────────────────────────────────────────
  // Long press → show quick action bottom sheet instead of jumping to detail
  const handleLongPress = useCallback((p) => {
    setQuickActionProspect(p);
  }, []);

  const handleBulkTag = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleBulkDelete = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // "Tag All" from filter bar — tags the full filtered result set (not just current page)
  const handleTagAll = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const hasMore = prospects.length < totalCount;

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top Bar ─────────────────────────────────────────────────────── */}
      {isBulkSelectionMode ? (
        <div className="shrink-0 flex items-center gap-3 px-4 py-3 bg-violet-600 text-white">
          <button onClick={clearSelection} className="p-1.5 hover:bg-violet-500 rounded-lg transition-colors">
            <X size={18} />
          </button>
          <span className="font-black text-sm flex-1">{selectedProspects.size} Selected</span>
          <button
            onClick={handleBulkTag}
            className="flex items-center gap-1.5 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            <Tag size={12} /> Tag
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-500/80 hover:bg-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              id="leads-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, category…"
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={14} />
              </button>
            )}
          </div>

          <button
            id="leads-filter-btn"
            onClick={() => setIsFilterOpen(true)}
            className={`relative p-2.5 rounded-xl border transition-colors ${
              hasActiveFilters
                ? "bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-600"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <SlidersHorizontal size={17} />
            {hasActiveFilters && <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full" />}
          </button>

          <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-gray-400 hidden sm:block whitespace-nowrap">
            {totalCount.toLocaleString()} leads
          </span>
        </div>
      )}

      {/* ── Active Filters Bar ───────────────────────────────────────────── */}
      {hasActiveFilters && !isBulkSelectionMode && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 border-b border-violet-200 dark:border-violet-800/50 overflow-x-auto">
          <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 shrink-0">Filters:</span>
          {searchFilters.cities.length > 0         && <FilterPill label={`Cities: ${searchFilters.cities.join(", ")}`} />}
          {searchFilters.categories.length > 0     && <FilterPill label={`Cat: ${searchFilters.categories.join(", ")}`} />}
          {searchFilters.onlyNew                   && <FilterPill label="New Only" />}
          {searchFilters.requireWebsite === true   && <FilterPill label="Has Website" />}
          {searchFilters.requireWebsite === false  && <FilterPill label="No Website" />}
          {searchFilters.requireSocials === true   && <FilterPill label="Has Socials" />}
          {searchFilters.requireSocials === false  && <FilterPill label="No Socials" />}

          {/* Tag ALL action */}
          <button
            onClick={handleTagAll}
            className="ml-1 shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors"
          >
            <Tag size={10} /> Tag All {totalCount}
          </button>

          <button
            onClick={resetFilters}
            className="ml-auto shrink-0 text-[10px] font-black uppercase tracking-widest text-violet-600 hover:text-violet-800 dark:hover:text-violet-300 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* ── List Body ────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
        {isLoading && page === 0 ? (
          Array.from({ length: 5 }).map((_, i) => <ProspectCardSkeleton key={i} />)
        ) : prospects.length === 0 ? (
          <EmptyState hasLeads={dbTotal > 0} />
        ) : (
          <>
            {prospects.map((p) => (
              <ProspectCard
                key={p.id}
                prospect={p}
                onLongPress={handleLongPress}
              />
            ))}

            {hasMore && (
              <button
                onClick={() => setPage((pg) => pg + 1)}
                className="w-full py-3 text-[11px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl border border-violet-200 dark:border-violet-800/50 transition-colors"
              >
                {isLoading ? "Loading…" : `Load More (${totalCount - prospects.length} remaining)`}
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      <LeadDetailsModal
        prospect={detailProspect}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Bulk tag assignment */}
      <TagAssignmentModal
        isOpen={isTagModalOpen}
        onClose={() => { setIsTagModalOpen(false); clearSelection(); }}
        prospectIds={
          isTagModalOpen
            ? (selectedProspects.size > 0
                ? [...selectedProspects]
                : prospects.map((p) => p.id))
            : []
        }
      />

      {/* Single-prospect tag management (from long press → Manage Tags) */}
      <TagAssignmentModal
        isOpen={isSingleTagOpen}
        onClose={() => { setIsSingleTagOpen(false); setTagProspect(null); }}
        prospectIds={tagProspect ? [tagProspect.id] : []}
        prospectName={tagProspect?.name}
      />

      <FilterSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
      />

      {/* ── Long-press Quick Action Sheet ──────────────────────────────── */}
      {quickActionProspect && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setQuickActionProspect(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle + lead name */}
            <div className="flex flex-col items-center gap-2 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <p className="text-sm font-black text-gray-900 dark:text-white text-center truncate max-w-xs">
                {quickActionProspect.name}
              </p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {quickActionProspect.category}{quickActionProspect.city ? ` · ${quickActionProspect.city}` : ""}
              </p>
            </div>

            {/* View Details */}
            <button
              onClick={() => {
                setDetailProspect(quickActionProspect);
                setIsDetailOpen(true);
                setQuickActionProspect(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors text-left"
            >
              <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Eye size={17} className="text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">View Full Details</p>
                <p className="text-[10px] text-gray-400">Contact info, socials, remarks</p>
              </div>
            </button>

            {/* Add / Remove Tags */}
            <button
              onClick={() => {
                setTagProspect(quickActionProspect);
                setIsSingleTagOpen(true);
                setQuickActionProspect(null);
              }}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors text-left"
            >
              <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center shrink-0">
                <Tag size={17} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900 dark:text-white">Add / Remove Tags</p>
                <p className="text-[10px] text-gray-400">Organise this lead into tag groups</p>
              </div>
            </button>

            {/* Cancel */}
            <button
              onClick={() => setQuickActionProspect(null)}
              className="w-full py-3 text-sm font-black text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
