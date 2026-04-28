// src/apps/Leads/components/ScrapingModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Scraping Modal
//
// Presents a City + Keyword form. On submit:
//   1. Gets the user's Firebase ID token (passed to GAS for Firestore demoAuth).
//   2. POSTs to the GAS proxy → Supabase OR-filter across ALL columns.
//   3. GAS writes to Firestore inbox + logs the search to public_cache/suggestions.
//   4. LeadsContext onSnapshot picks up the inbox → hydrates Dexie.
//
// Suggested searches are pulled live from Firestore public_cache/suggestions —
// a shared log of every search made by any registered user, sorted by popularity.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { Zap, MapPin, Hash, Loader2, Send, TrendingUp, Copy, Check, Mail } from "lucide-react";
import BaseModal from "../../../shell/components/BaseModal";
import { useLeads } from "../demo-services/state-manager";
import { uuidv4 } from "../../../utils/uuid";
import { demoAuth } from "../demo-services/cloud-provider";

const GAS_PROXY_URL  = import.meta.env.VITE_GAS_PROXY_URL || "";
const CONTACT_EMAIL  = "rkenn.studio@gmail.com";

export default function ScrapingModal({ isOpen, onClose }) {
  const { registerJob, showToast, uid } = useLeads();

  const [city,         setCity]         = useState("");
  const [keyword,      setKeyword]      = useState("");
  const [status,       setStatus]       = useState("idle");
  const [errorMsg,     setErrorMsg]     = useState("");
  const [suggestions,  setSuggestions]  = useState([]);
  const [isSugLoading, setIsSugLoading] = useState(false);
  const [emailCopied,  setEmailCopied]  = useState(false);

  // ── Fetch community suggestions from GAS doGet?action=suggestions ────────
  // GAS reads from the linked Google Sheet and returns top 10 by count.
  // This is a plain GET (simple CORS request — no preflight needed).
  useEffect(() => {
    if (!isOpen || !GAS_PROXY_URL) return;
    let cancelled = false;

    const fetchSuggestions = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        }
      } catch (err) {
        console.warn("[ScrapingModal] Could not load suggestions:", err.message);
      } finally {
        if (!cancelled) setIsSugLoading(false);
      }
    };

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [isOpen]);

  const handleClose = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleSuggestion = (s) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleSubmit = async (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }

    setStatus("loading");
    setErrorMsg("");

    const batchId = uuidv4();

    // Get a fresh Firebase ID token — GAS uses this to write to Firestore
    // satisfying the security rule: request.demoAuth.uid == userId
    let token;
    try {
      token = await demoAuth.currentUser.getIdToken(false);
    } catch {
      setErrorMsg("Could not get demoAuth token. Please sign out and back in.");
      setStatus("error");
      return;
    }

    try {
      const response = await fetch(GAS_PROXY_URL, {
        method: "POST",
        // ─── CORS / GAS 302 Fix ───────────────────────────────────────────
        // text/plain = "simple" CORS request → no preflight OPTIONS sent.
        // redirect:follow → fetch follows GAS's 302 automatically.
        // GAS parses the body with JSON.parse(e.postData.contents) as normal.
        // ─────────────────────────────────────────────────────────────────
        headers:  { "Content-Type": "text/plain;charset=utf-8" },
        redirect: "follow",
        body: JSON.stringify({
          uid,
          batch_id: batchId,
          city:     city.trim(),
          keyword:  keyword.trim(),   // ← was "category"; now full-column keyword
          token,
        }),
      });

      // GAS always returns { status:"ok"|"error", ... } — check the body,
      // not response.ok, because the 302 redirect always resolves to HTTP 200.
      let data;
      try {
        data = await response.json();
      } catch {
        throw new Error("GAS proxy returned an unreadable response. Check your deployment URL.");
      }

      if (data.status === "error") {
        throw new Error(data.message || "GAS proxy reported an error.");
      }

      registerJob({ batch_id: batchId, city: city.trim(), keyword: keyword.trim() });

      setStatus("sent");
      showToast(`🔍 Scraping "${keyword}" in ${city}… Results incoming!`, "info");
      setTimeout(handleClose, 1800);

    } catch (err) {
      console.error("[ScrapingModal] Error:", err);
      setErrorMsg(err.message || "Failed to contact the scraping proxy.");
      setStatus("error");
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Scrape New Leads"
      icon={Zap}
      iconColor="text-violet-400"
      maxWidth="max-w-lg"
      footer={
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={status === "loading"}
            className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="scraping-form"
            disabled={status === "loading" || !city.trim() || !keyword.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-black text-[11px] uppercase tracking-widest rounded-xl shadow-lg shadow-violet-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (
              <><Loader2 size={14} className="animate-spin" /> Contacting Proxy…</>
            ) : status === "sent" ? (
              <><Send size={14} /> Request Sent!</>
            ) : (
              <><Zap size={14} className="fill-current" /> Initiate Scraping</>
            )}
          </button>
        </div>
      }
    >
      <form id="scraping-form" onSubmit={handleSubmit} className="space-y-5">

        {/* City Input */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            <MapPin size={12} />
            Target City
          </label>
          <input
            id="scrape-city-input"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Manila, Cebu, Davao"
            required
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
          <p className="text-[10px] text-gray-400 pl-1">
            Filters strictly by city — only leads in this location are returned.
          </p>
        </div>

        {/* Keyword Input */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400">
            <Hash size={12} />
            Keywords
          </label>
          <input
            id="scrape-keyword-input"
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. Restaurant, Dental, Auto Repair, Salon…"
            required
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
          />
          <p className="text-[10px] text-gray-400 pl-1">
            Matches against the <strong className="text-gray-500">category</strong> field — e.g. "print" finds all businesses categorised as printing, print shop, etc.
          </p>
        </div>

        {/* Community Suggested Searches */}
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <TrendingUp size={11} />
            Popular Searches
            {isSugLoading && <span className="text-[9px] text-violet-400 normal-case tracking-normal font-normal ml-1">Loading…</span>}
          </p>

          {suggestions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSuggestion(s)}
                  title={`Used ${s.count} time${s.count !== 1 ? "s" : ""}`}
                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/30 border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-700 rounded-lg transition-all"
                >
                  <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                    {s.city} · {s.keyword}
                  </span>
                  {s.count > 1 && (
                    <span className="text-[9px] font-black text-violet-400 bg-violet-50 dark:bg-violet-900/40 px-1.5 py-0.5 rounded-full">
                      ×{s.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : !isSugLoading ? (
            <p className="text-[10px] text-gray-400 italic">
              No community searches yet — yours will be the first!
            </p>
          ) : null}
        </div>

        {/* Status / Error */}
        {status === "error" && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-red-600 dark:text-red-400">
            ⚠️ {errorMsg}
          </div>
        )}

        {status === "sent" && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400">
            ✅ Request dispatched! Results will appear automatically when ready.
          </div>
        )}

        {/* Contact / Custom Scrape */}
        <div className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-800/50 rounded-xl">
          <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-1">
            ✨ Need a Custom Scrape?
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Bulk runs, niche categories, specific radius targeting — reach out directly.
          </p>

          {/* Email row — desktop friendly: visible address + copy + mailto */}
          <div className="flex items-center gap-2 flex-wrap">
            <Mail size={13} className="text-violet-500 shrink-0" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-200 select-all">
              {CONTACT_EMAIL}
            </span>
            {/* Copy to clipboard */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
                  setEmailCopied(true);
                  setTimeout(() => setEmailCopied(false), 2200);
                });
              }}
              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] font-bold text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-colors"
            >
              {emailCopied ? <><Check size={11} className="text-emerald-500" /> Copied!</> : <><Copy size={11} /> Copy</>}
            </button>
            {/* Mailto fallback */}
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=Custom%20Scraping%20Request&body=City%3A%20${encodeURIComponent(city)}%0AKeyword%3A%20${encodeURIComponent(keyword)}%0A%0ADescribe%20your%20needs%3A`}
              className="flex items-center gap-1 px-2 py-1 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-[10px] font-black transition-colors"
            >
              <Mail size={11} /> Email
            </a>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}
