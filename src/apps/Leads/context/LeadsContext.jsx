// src/apps/Leads/context/LeadsContext.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Global State & Firestore Inbox Listener
//
// INVARIANTS:
//   • Dexie is the source of truth. Firestore is only used as an ephemeral
//     inbox channel — the inbox doc is deleted immediately after hydration.
//   • Tags, Remarks, and active contact selections are NEVER written back to
//     Firebase. They live exclusively in Dexie.
// ─────────────────────────────────────────────────────────────────────────────

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  doc,
  onSnapshot,
  deleteDoc,
} from "../demo-services/cloud-provider";
import { demoDb as firestore } from "../demo-services/cloud-provider";
import { hydrateBatch, leadsDb } from "../demoDb/leadsDb";

// ─── Context Definition ───────────────────────────────────────────────────────
const LeadsContext = createContext(null);

export function useLeads() {
  const ctx = useContext(LeadsContext);
  if (!ctx) throw new Error("useLeads must be used inside <LeadsProvider>");
  return ctx;
}

// ─── Default Filter State ─────────────────────────────────────────────────────
export const DEFAULT_FILTERS = {
  cities:             [],
  categories:         [],
  excludeCities:      [],
  excludeCategories:  [],
  ratingMin:          0,
  ratingMax:          5,
  reviewMin:          0,
  reviewMax:          Infinity,
  requireWebsite:     null,  // null = any
  requireSocials:     null,
  onlyNew:            false,
  tagIds:             [],
  excludeTagIds:      [],
  matchMode:          "ANY",
};

// ─── Provider ─────────────────────────────────────────────────────────────────
/**
 * @param {Object} props
 * @param {string|null} props.uid  — Firebase UID of the signed-in user
 * @param {React.ReactNode} props.children
 */
export function LeadsProvider({ uid, children }) {

  // ── Search & Filter State ──────────────────────────────────────────────────
  const [searchQuery, setSearchQuery]   = useState("");
  const [searchFilters, setSearchFilters] = useState(DEFAULT_FILTERS);

  // ── Bulk Selection State ───────────────────────────────────────────────────
  const [isBulkSelectionMode, setIsBulkSelectionMode] = useState(false);
  const [selectedProspects, setSelectedProspects]     = useState(new Set());

  // ── Scraping Job State ─────────────────────────────────────────────────────
  const [activeJobs, setActiveJobs]     = useState([]); // { id, city, category, status }
  const [latestBatchId, setLatestBatchId] = useState(null);

  // ── UI Triggers ───────────────────────────────────────────────────────────
  const [lastHydration, setLastHydration] = useState(null); // epoch — triggers list refresh
  const [toast, setToast]                 = useState(null);  // { message, type }

  const toastTimerRef = useRef(null);

  // ── Toast Helper ──────────────────────────────────────────────────────────
  const showToast = useCallback((message, type = "success") => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  // ── Firestore Inbox Listener ──────────────────────────────────────────────
  // Watches users/{uid}/inbox for a GAS payload document.
  // On arrival:
  //   1. Validate the payload
  //   2. hydrateBatch() → Dexie
  //   3. Delete the inbox doc (ephemeral, zero cloud storage cost)
  //   4. Fire a toast and bump lastHydration to trigger a list refresh
  useEffect(() => {
    if (!uid) return;

    const inboxRef = doc(firestore, "users", uid, "inbox", "latest");

    const unsubscribe = onSnapshot(inboxRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      // Validate: only process when status is "ready"
      if (data.status !== "ready") return;

      try {
        const { items = [], batch_id, city, category } = data;

        if (!batch_id) {
          console.warn("[LeadsContext] Inbox doc missing batch_id, skipping.");
          await deleteDoc(inboxRef);
          return;
        }

        // Hydrate into Dexie
        const count = await hydrateBatch(items, batch_id);

        // Delete inbox doc immediately (ephemeral)
        await deleteDoc(inboxRef);

        // Update state
        setLatestBatchId(batch_id);
        setLastHydration(Date.now());

        // Remove job from activeJobs if it matches
        setActiveJobs((prev) =>
          prev.filter((j) => j.batch_id !== batch_id)
        );

        showToast(
          `⚡ ${count} leads scraped for "${category}" in ${city}!`,
          "success"
        );
      } catch (err) {
        console.error("[LeadsContext] Hydration error:", err);
        showToast("Failed to process incoming leads. Check console.", "error");
        // Still delete the doc to avoid re-processing a corrupt payload
        await deleteDoc(inboxRef).catch(() => {});
      }
    });

    return () => unsubscribe();
  }, [uid, showToast]);

  // ── Cross-view event bridge: "View Leads by Tag" ──────────────────────────
  // TagsView dispatches bizleads:filterbytag → DiscoveryView reacts via this
  useEffect(() => {
    const handleFilterByTag = (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    };
    window.addEventListener("bizleads:filterbytag", handleFilterByTag);
    return () => window.removeEventListener("bizleads:filterbytag", handleFilterByTag);
  }, []);

  // ── Bulk Selection Helpers ─────────────────────────────────────────────────
  const toggleProspectSelection = useCallback((id) => {
    setSelectedProspects((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedProspects(new Set());
    setIsBulkSelectionMode(false);
  }, []);

  const enterBulkMode = useCallback(() => {
    setIsBulkSelectionMode(true);
  }, []);

  // ── Job Registration (called by ScrapingModal on submit) ──────────────────
  const registerJob = useCallback((jobMeta) => {
    setActiveJobs((prev) => [...prev, { ...jobMeta, status: "pending" }]);
  }, []);

  // ── Filter Helpers ─────────────────────────────────────────────────────────
  const updateFilter = useCallback((key, value) => {
    setSearchFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchFilters(DEFAULT_FILTERS);
  }, []);

  const hasActiveFilters = Object.entries(searchFilters).some(([key, val]) => {
    const def = DEFAULT_FILTERS[key];
    if (Array.isArray(val)) return val.length !== def.length || val.some((v, i) => v !== def[i]);
    return val !== def;
  });

  // ─────────────────────────────────────────────────────────────────────────
  const value = {
    // Search
    searchQuery,
    setSearchQuery,

    // Filters
    searchFilters,
    setSearchFilters,
    updateFilter,
    resetFilters,
    hasActiveFilters,

    // Bulk selection
    isBulkSelectionMode,
    enterBulkMode,
    selectedProspects,
    toggleProspectSelection,
    clearSelection,

    // Jobs
    activeJobs,
    registerJob,
    latestBatchId,

    // Hydration signal
    lastHydration,

    // Auth
    uid,

    // Toast
    toast,
    showToast,
  };

  return (
    <LeadsContext.Provider value={value}>
      {children}
    </LeadsContext.Provider>
  );
}
