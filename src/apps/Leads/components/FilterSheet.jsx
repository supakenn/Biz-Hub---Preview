// src/apps/Leads/components/FilterSheet.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Filter Sheet (Bottom Drawer)
//
// Slide-up panel for advanced filtering of the Discovery list.
// Tri-state asset filters (Require / Exclude / Any), range sliders
// for rating and reviews, city/category multi-select, and matchMode toggle.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { X, SlidersHorizontal, RotateCcw, Check } from "lucide-react";
import { useLeads, DEFAULT_FILTERS } from "../demo-services/state-manager";
import { leadsDb } from "../demoDb/leadsDb";

// ─── Tri-State Button ─────────────────────────────────────────────────────────
// value: null (any) | true (require) | false (exclude)
function TriStateBtn({ label, value, onChange }) {
  const cycle = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const style =
    value === true  ? "bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
    value === false ? "bg-red-50    border-red-400    text-red-700    dark:bg-red-900/30    dark:text-red-400"     :
                      "bg-gray-50   border-gray-300   text-gray-500   dark:bg-gray-800     dark:text-gray-400";

  const badge =
    value === true  ? "✓ Require" :
    value === false ? "✗ Exclude" :
                      "Any";

  return (
    <button
      type="button"
      onClick={cycle}
      className={`flex-1 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all active:scale-95 ${style}`}
    >
      <span className="block text-[9px] uppercase tracking-widest opacity-60 mb-0.5">{label}</span>
      <span>{badge}</span>
    </button>
  );
}

// ─── Range Slider ─────────────────────────────────────────────────────────────
function RangeSlider({ label, min, max, step = 1, valueMin, valueMax, onChangeMin, onChangeMax, format = (v) => v }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
        <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
          {format(valueMin)} – {format(valueMax === Infinity ? max : valueMax)}
        </span>
      </div>
      <div className="flex gap-3 items-center">
        <input type="range" min={min} max={max} step={step} value={valueMin}
          onChange={(e) => onChangeMin(parseFloat(e.target.value))}
          className="flex-1 accent-violet-600" />
        <input type="range" min={min} max={max} step={step} value={valueMax === Infinity ? max : valueMax}
          onChange={(e) => onChangeMax(parseFloat(e.target.value))}
          className="flex-1 accent-violet-600" />
      </div>
    </div>
  );
}

// ─── Tag Chips (multi-select) ─────────────────────────────────────────────────
function ChipSelector({ label, items, selected, onToggle, keyFn, labelFn }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 italic">No data yet</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => {
            const key = keyFn(item);
            const isSelected = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggle(key)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                  isSelected
                    ? "bg-violet-500 border-violet-500 text-white"
                    : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-300"
                }`}
              >
                {labelFn(item)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FilterSheet({ isOpen, onClose }) {
  const { searchFilters, setSearchFilters, resetFilters } = useLeads();

  // Local draft — only committed on Apply
  const [draft, setDraft] = useState(searchFilters);

  // Available city/category options (derived from Dexie)
  const [cityOptions,     setCityOptions]     = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [tagOptions,      setTagOptions]      = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    setDraft(searchFilters);

    // Load distinct values from Dexie
    (async () => {
      const all = await leadsDb.prospects.toArray();
      const cities  = [...new Set(all.map((p) => p.city).filter(Boolean))].sort();
      const cats    = [...new Set(all.map((p) => p.category).filter(Boolean))].sort();
      setCityOptions(cities);
      setCategoryOptions(cats);

      const allTags = await leadsDb.tags.orderBy("name").toArray();
      setTagOptions(allTags);
    })();
  }, [isOpen]); // eslint-disable-line

  const update = useCallback((key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleChip = (field, value) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      };
    });
  };

  const handleApply = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleReset = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl border-t border-gray-200 dark:border-gray-800 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-violet-500" />
            <h2 className="font-black text-gray-900 dark:text-white text-base uppercase tracking-tight">Filters</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6 custom-scrollbar">

          {/* ── Match Mode ──────────────────────────────────────────── */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Filter Mode</p>
            <div className="flex gap-2">
              {["ANY", "ALL"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update("matchMode", mode)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                    draft.matchMode === mode
                      ? "bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-500/30"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500"
                  }`}
                >
                  Match {mode}
                </button>
              ))}
            </div>
          </div>

          {/* ── Only New ────────────────────────────────────────────── */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-sm font-black text-gray-800 dark:text-gray-200">New Leads Only</p>
              <p className="text-[10px] text-gray-400 font-bold">Show only this batch's results</p>
            </div>
            <button
              type="button"
              onClick={() => update("onlyNew", !draft.onlyNew)}
              className={`w-11 h-6 rounded-full transition-all ${draft.onlyNew ? "bg-violet-500" : "bg-gray-200 dark:bg-gray-700"}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mx-0.5 ${draft.onlyNew ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {/* ── Asset Filters ────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Assets</p>
            <div className="flex gap-2">
              <TriStateBtn label="Website" value={draft.requireWebsite} onChange={(v) => update("requireWebsite", v)} />
              <TriStateBtn label="Socials" value={draft.requireSocials} onChange={(v) => update("requireSocials", v)} />
            </div>
          </div>

          {/* ── Rating Range ─────────────────────────────────────────── */}
          <RangeSlider
            label="Rating"
            min={0} max={5} step={0.1}
            valueMin={draft.ratingMin} valueMax={draft.ratingMax}
            onChangeMin={(v) => update("ratingMin", v)}
            onChangeMax={(v) => update("ratingMax", v)}
            format={(v) => v.toFixed(1)}
          />

          {/* ── Reviews Range ────────────────────────────────────────── */}
          <RangeSlider
            label="Reviews"
            min={0} max={10000} step={10}
            valueMin={draft.reviewMin} valueMax={draft.reviewMax}
            onChangeMin={(v) => update("reviewMin", v)}
            onChangeMax={(v) => update("reviewMax", v)}
            format={(v) => v === 10000 ? "10k+" : v.toLocaleString()}
          />

          {/* ── City Filter ──────────────────────────────────────────── */}
          <ChipSelector
            label="Include Cities"
            items={cityOptions}
            selected={draft.cities}
            onToggle={(v) => toggleChip("cities", v)}
            keyFn={(c) => c}
            labelFn={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
          />

          <ChipSelector
            label="Exclude Cities"
            items={cityOptions}
            selected={draft.excludeCities}
            onToggle={(v) => toggleChip("excludeCities", v)}
            keyFn={(c) => c}
            labelFn={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
          />

          {/* ── Category Filter ──────────────────────────────────────── */}
          <ChipSelector
            label="Include Categories"
            items={categoryOptions}
            selected={draft.categories}
            onToggle={(v) => toggleChip("categories", v)}
            keyFn={(c) => c}
            labelFn={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
          />

          <ChipSelector
            label="Exclude Categories"
            items={categoryOptions}
            selected={draft.excludeCategories}
            onToggle={(v) => toggleChip("excludeCategories", v)}
            keyFn={(c) => c}
            labelFn={(c) => c.charAt(0).toUpperCase() + c.slice(1)}
          />

          {/* ── Tag Filter ───────────────────────────────────────────── */}
          {tagOptions.length > 0 && (
            <>
              <ChipSelector
                label="Include Tags"
                items={tagOptions}
                selected={draft.tagIds}
                onToggle={(v) => toggleChip("tagIds", v)}
                keyFn={(t) => t.id}
                labelFn={(t) => t.name}
              />
              <ChipSelector
                label="Exclude Tags"
                items={tagOptions}
                selected={draft.excludeTagIds}
                onToggle={(v) => toggleChip("excludeTagIds", v)}
                keyFn={(t) => t.id}
                labelFn={(t) => t.name}
              />
            </>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={13} /> Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95"
          >
            <Check size={14} /> Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
