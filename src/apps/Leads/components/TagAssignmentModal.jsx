// src/apps/Leads/components/TagAssignmentModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Tag Assignment Modal
//
// Assigns tags to one or more prospects.
// - Inline input to create a NEW tag on the fly
// - Scrollable checklist of existing tags
// - Remarks textarea per tag-prospect pair
//
// INVARIANT: All writes go to Dexie only. No Firebase sync.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Check, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import BaseModal from "../../../shell/components/BaseModal";
import { leadsDb, assignTag } from "../demoDb/leadsDb";
import { useLeads } from "../demo-services/state-manager";

export default function TagAssignmentModal({ isOpen, onClose, prospectIds = [], prospectName }) {
  const { showToast, lastHydration } = useLeads();

  const [tags,         setTags]         = useState([]);
  const [selected,     setSelected]     = useState(new Set());
  const [initialTagIds, setInitialTagIds] = useState(new Set()); // tags already on prospect
  const [remarks,      setRemarks]      = useState({});
  const [expanded,     setExpanded]     = useState(new Set());
  const [newTagName,   setNewTagName]   = useState("");
  const [isSaving,     setIsSaving]     = useState(false);
  const [isCreating,   setIsCreating]   = useState(false);

  const count = prospectIds.length;

  // ── Load existing tags ─────────────────────────────────────────────────
  const loadTags = useCallback(async () => {
    const all = await leadsDb.tags.orderBy("name").toArray();
    setTags(all);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTags();
      setRemarks({});
      setExpanded(new Set());
      setNewTagName("");

      if (prospectIds.length === 1) {
        // Pre-load this prospect's existing tags so they appear pre-checked
        leadsDb.prospect_tags
          .where("prospect_id").equals(prospectIds[0])
          .toArray()
          .then((rows) => {
            const existingIds = new Set(rows.map((r) => r.tag_id));
            setInitialTagIds(existingIds);
            setSelected(existingIds);        // pre-check
          });
      } else {
        setInitialTagIds(new Set());
        setSelected(new Set());
      }
    }
  }, [isOpen, loadTags]); // eslint-disable-line

  // ── Toggle tag selection ───────────────────────────────────────────────
  const toggleTag = (tagId) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    });
  };

  const toggleExpanded = (tagId) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    });
  };

  // ── Create a new tag inline ────────────────────────────────────────────
  const handleCreateTag = async (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      }
      const id = await leadsDb.tags.add({ name, created_at: Date.now(), remarks: "" });
      setNewTagName("");
      setSelected((prev) => new Set([...prev, id]));
      await loadTags();
      showToast(`Tag "${name}" created and selected!`, "success");
    } catch {
      showToast("Failed to create tag.", "error");
    } finally {
      setIsCreating(false);
    }
  };

  // ── Apply tags to prospects ────────────────────────────────────────────
  const handleApply = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      }

      // For single-prospect mode: remove tags that were previously applied but
      // are now deselected. Compound PK is [prospect_id + tag_id].
      if (prospectIds.length === 1) {
        const toRemove = [...initialTagIds].filter((id) => !selected.has(id));
        for (const tagId of toRemove) {
          await leadsDb.prospect_tags.delete([prospectIds[0], tagId]);
        }
      }

      const added   = [...selected].filter((id) => !initialTagIds.has(id)).length;
      const removed = [...initialTagIds].filter((id) => !selected.has(id)).length;

      if (prospectIds.length === 1 && (added > 0 || removed > 0)) {
        const parts = [];
        if (added   > 0) parts.push(`${added} added`);
        if (removed > 0) parts.push(`${removed} removed`);
        showToast(`🏷️ Tags updated — ${parts.join(", ")}`, "success");
      } else if (selected.size > 0) {
        showToast(
          `✅ ${selected.size} tag${selected.size > 1 ? "s" : ""} applied to ${count} lead${count > 1 ? "s" : ""}!`,
          "success"
        );
      }
      onClose();
    } catch (err) {
      showToast("Failed to apply tags.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={prospectName ? `Tags — ${prospectName}` : `Tag ${count} Lead${count > 1 ? "s" : ""}`}
      icon={Tag}
      iconColor="text-violet-400"
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95"
          >
            {isSaving ? (
              <><Loader2 size={13} className="animate-spin" /> Saving…</>
            ) : (
              <><Tag size={13} /> Apply {selected.size ? `(${selected.size})` : ""}</>
            )}
          </button>
        </div>
      }
    >
      <div className="space-y-4">

        {/* ── Create New Tag Inline ──────────────────────────────────── */}
        <form onSubmit={handleCreateTag} className="flex gap-2">
          <input
            id="new-tag-inline-input"
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Create new tag…"
            className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
          />
          <button
            type="submit"
            disabled={isCreating || !newTagName.trim()}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all active:scale-95"
          >
            {isCreating ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
          </button>
        </form>

        {/* ── Existing Tags Checklist ────────────────────────────────── */}
        {tags.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4 italic">
            No tags yet. Create your first one above.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {tags.map((tag) => {
              const isChecked  = selected.has(tag.id);
              const isExpanded = expanded.has(tag.id);
              return (
                <div key={tag.id} className={`rounded-xl border transition-all ${
                  isChecked
                    ? "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                }`}>
                  <div className="flex items-center gap-3 p-3">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTag(tag.id)}
                      className={`w-5 h-5 rounded-lg border-2 shrink-0 flex items-center justify-center transition-all ${
                        isChecked
                          ? "bg-violet-500 border-violet-500"
                          : "border-gray-300 dark:border-gray-600 hover:border-violet-400"
                      }`}
                    >
                      {isChecked && <Check size={12} className="text-white" />}
                    </button>

                    {/* Tag name */}
                    <button
                      onClick={() => toggleTag(tag.id)}
                      className="flex-1 text-left text-sm font-bold text-gray-800 dark:text-gray-200"
                    >
                      {tag.name}
                    </button>

                    {/* Remarks toggle */}
                    <button
                      onClick={() => toggleExpanded(tag.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                      title="Add remarks"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>

                  {/* Remarks textarea */}
                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <textarea
                        value={remarks[tag.id] || ""}
                        onChange={(e) => setRemarks((prev) => ({ ...prev, [tag.id]: e.target.value }))}
                        rows={2}
                        placeholder="Add remarks for this tag assignment…"
                        className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none transition-all"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── Summary ───────────────────────────────────────────────── */}
        {count > 0 && (
          <p className="text-[11px] text-gray-400 font-bold text-center">
            Will apply to <span className="text-violet-500">{count} lead{count > 1 ? "s" : ""}</span>
            {selected.size > 0 ? ` using ${selected.size} tag${selected.size > 1 ? "s" : ""}` : ""}
          </p>
        )}
      </div>
    </BaseModal>
  );
}
