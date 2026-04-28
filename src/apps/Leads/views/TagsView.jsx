// src/apps/Leads/views/TagsView.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Tags Management View (/leads/tags)
//
// Phase 1 Scaffold: Renders the tag list from Dexie with lead counts.
// Full Tag Card actions (View Leads, Push to Biz Reach, Clear, Delete) and
// the TagAssignmentModal will be wired in Phase 2.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Tag, Plus, Search, Trash2, Users, ChevronDown, ChevronUp,
  ArrowRight, Eraser, Rocket
} from "lucide-react";
import { useLeads } from "../demo-services/state-manager";
import { leadsDb, deleteTag, clearTagLeads } from "../demoDb/leadsDb";

// ─── Tag Card ─────────────────────────────────────────────────────────────
function TagCard({ tag, leadCount, onDelete, onClearLeads, onViewLeads, onPushToBizReach }) {
  const [isRemarksOpen, setIsRemarksOpen] = useState(false);
  const [remarks, setRemarks] = useState(tag.remarks || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleRemarksBlur = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-9 h-9 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl flex items-center justify-center shrink-0">
          <Tag size={16} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-black text-gray-900 dark:text-white text-sm truncate">{tag.name}</h3>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {leadCount} {leadCount === 1 ? "lead" : "leads"}
          </p>
        </div>
        {/* Action row */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onViewLeads(tag)}
            title="View Leads"
            className="p-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => onPushToBizReach(tag)}
            title="Push to Biz Reach"
            className="p-2 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
          >
            <Rocket size={15} />
          </button>
          <button
            onClick={() => onClearLeads(tag)}
            title="Clear Leads"
            className="p-2 text-gray-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
          >
            <Eraser size={15} />
          </button>
          <button
            onClick={() => onDelete(tag)}
            title="Delete Tag"
            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <Trash2 size={15} />
          </button>
          <button
            onClick={() => setIsRemarksOpen((o) => !o)}
            title="Toggle Remarks"
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            {isRemarksOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Remarks Expander */}
      {isRemarksOpen && (
        <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1.5 block">
            Remarks (auto-saved)
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            onBlur={handleRemarksBlur}
            rows={3}
            placeholder="Add notes about this tag group…"
            className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all"
          />
          {isSaving && (
            <p className="text-[10px] text-violet-500 font-bold mt-1">Saving…</p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────
export default function TagsView() {
  const { lastHydration, showToast } = useLeads();
  const navigate = useNavigate();

  const [tags,       setTags]       = useState([]);
  const [leadCounts, setLeadCounts] = useState({}); // { [tagId]: number }
  const [isLoading,  setIsLoading]  = useState(true);
  const [tagSearch,  setTagSearch]  = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // ── Load tags + counts ────────────────────────────────────────────────
  const loadTags = useCallback(async () => {
    setIsLoading(true);
    try {
      const allTags  = await leadsDb.tags.orderBy("created_at").reverse().toArray();
      const allJoins = await leadsDb.prospect_tags.toArray();

      const counts = {};
      allJoins.forEach((j) => {
        counts[j.tag_id] = (counts[j.tag_id] || 0) + 1;
      });

      setTags(allTags);
      setLeadCounts(counts);
    } catch (err) {
      console.error("[TagsView] Load error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadTags(); }, [loadTags, lastHydration]);

  // ── Create new tag ────────────────────────────────────────────────────
  const handleCreateTag = async (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      }
      await leadsDb.tags.add({ name, created_at: Date.now(), remarks: "" });
      setNewTagName("");
      showToast(`Tag "${name}" created!`, "success");
      await loadTags();
    } catch (err) {
      showToast("Failed to create tag.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Tag actions ───────────────────────────────────────────────────────
  const handleDelete = async (tag) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleClearLeads = async (tag) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleViewLeads = (tag) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handlePushToBizReach = async (tag) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      }));

      localStorage.setItem("bizreach_leads_payload", JSON.stringify({
        tag:       tag.name,
        exported_at: Date.now(),
        leads:     payload,
      }));

      showToast(`🚀 ${leads.length} leads pushed to Biz Reach!`, "success");
    } catch (err) {
      showToast("Failed to push leads.", "error");
    }
  };

  // ── Filtered tags ─────────────────────────────────────────────────────
  const filteredTags = tags.filter((t) =>
    t.name.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 border-b border-gray-100 dark:border-gray-800/50 bg-white dark:bg-gray-900 space-y-2">

        {/* Search existing tags */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="tags-search-input"
            type="text"
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
            placeholder="Search tags…"
            className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
        </div>

        {/* Create Tag — always visible, full-width row */}
        <form onSubmit={handleCreateTag} className="flex items-center gap-2">
          <input
            id="new-tag-input"
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="New tag name…"
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
          <button
            type="submit"
            disabled={isCreating || !newTagName.trim()}
            id="create-tag-btn"
            className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95 shrink-0"
          >
            <Plus size={14} />
            <span>{isCreating ? "Creating…" : "Create Tag"}</span>
          </button>
        </form>
      </div>

      {/* ── Tag List ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl animate-pulse" />
          ))
        ) : filteredTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
              <Tag size={28} className="text-violet-500" />
            </div>
            <div>
              <p className="font-black text-gray-700 dark:text-gray-200">No Tags Yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first tag to start organising leads.</p>
            </div>
          </div>
        ) : (
          filteredTags.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              leadCount={leadCounts[tag.id] || 0}
              onDelete={handleDelete}
              onClearLeads={handleClearLeads}
              onViewLeads={handleViewLeads}
              onPushToBizReach={handlePushToBizReach}
            />
          ))
        )}
      </div>
    </div>
  );
}
