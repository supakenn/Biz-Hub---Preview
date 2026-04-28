// src/apps/Leads/components/ProspectCard.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Prospect Card
//
// Displays a single lead in the Discovery list.
// Supports long-press → LeadDetailsModal, tap-to-select in bulk mode,
// and direct contact intents (tel:, sms:, mailto:, website).
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useCallback } from "react";
import {
  Phone, MessageSquare, Mail, Globe, MapPin,
  Star, AlertTriangle, Zap, SquareCheck, Square, Link2,
} from "lucide-react";
import { useLeads } from "../demo-services/state-manager";

// ─── Warning Tag Config ───────────────────────────────────────────────────────
function getWarningTags(p) {
  const tags = [];
  if (!p.website)       tags.push({ label: "No Website",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" });
  if (!p.has_socials)   tags.push({ label: "No Socials",  color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" });
  if (p.rating > 0 && p.rating < 3.5) tags.push({ label: "Low Rating",  color: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" });
  if (p.review_count < 10 && p.review_count >= 0) tags.push({ label: "Unpopular",  color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400" });
  if (p.is_spending_on_ads) tags.push({ label: "Runs Ads",  color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" });
  if (p.is_temporarily_closed) tags.push({ label: "Temp. Closed", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" });
  return tags;
}

// ─── Star Rating Display ─────────────────────────────────────────────────────
function RatingBadge({ rating, reviewCount }) {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Star size={11} className="text-amber-400 fill-amber-400" />
      <span className="font-black text-xs text-amber-500">{rating.toFixed(1)}</span>
      {reviewCount > 0 && (
        <span className="text-[10px] text-gray-400 font-bold">({reviewCount.toLocaleString()})</span>
      )}
    </div>
  );
}

// ─── Action Button ────────────────────────────────────────────────────────────
function ActionBtn({ href, icon: Icon, color, label, disabled }) {
  if (disabled) return (
    <div className="flex flex-col items-center gap-1 opacity-30 cursor-not-allowed select-none">
      <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <Icon size={16} className="text-gray-400" />
      </div>
      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
  );
  return (
    <a
      href={href}
      target={href?.startsWith("http") ? "_blank" : undefined}
      rel="noopener noreferrer"
      className={`flex flex-col items-center gap-1 group`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 group-active:scale-95 ${color}`}>
        <Icon size={16} />
      </div>
      <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">{label}</span>
    </a>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProspectCard({ prospect: p, onLongPress }) {
  const {
    isBulkSelectionMode,
    selectedProspects,
    toggleProspectSelection,
    enterBulkMode,
  } = useLeads();

  const isSelected = selectedProspects.has(p.id);
  const longPressTimer = useRef(null);

  const handlePressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(50);
      if (isBulkSelectionMode) {
        toggleProspectSelection(p.id);
      } else {
        onLongPress?.(p);
      }
    }, 500);
  }, [isBulkSelectionMode, toggleProspectSelection, onLongPress, p]);

  const handlePressEnd = useCallback(() => {
    clearTimeout(longPressTimer.current);
  }, []);

  const handleTap = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }
  };

  const handleLongPressActivate = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }
  };

  const warningTags = getWarningTags(p);
  const phone  = p.active_phone || p.phones?.[0] || null;
  const email  = p.active_email || p.emails?.[0]  || null;

  return (
    <div
      id={`prospect-card-${p.id}`}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onClick={handleTap}
      className={`
        relative bg-white dark:bg-gray-900
        border rounded-2xl overflow-hidden
        transition-all duration-150 select-none
        ${isSelected
          ? "border-violet-400 dark:border-violet-600 shadow-lg shadow-violet-500/20 ring-2 ring-violet-400/30"
          : "border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700"
        }
        ${isBulkSelectionMode ? "cursor-pointer" : ""}
      `}
    >
      {/* ── Selection Overlay ─────────────────────────────────────────── */}
      {isBulkSelectionMode && (
        <div className="absolute top-3 right-3 z-10">
          {isSelected
            ? <SquareCheck size={20} className="text-violet-500" />
            : <Square      size={20} className="text-gray-300 dark:text-gray-600" />
          }
        </div>
      )}

      <div className="p-4">
        {/* ── Header Row ──────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          {/* Logo / Initials */}
          <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 flex items-center justify-center overflow-hidden">
            {p.featured_image ? (
              <img
                src={p.featured_image}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = "none"; }}
              />
            ) : (
              <span className="font-black text-violet-600 dark:text-violet-400 text-sm">
                {(p.name || "?")[0].toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* NEW badge + Name */}
            <div className="flex items-center gap-2 flex-wrap">
              {p.is_new === 1 && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-violet-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shrink-0">
                  <Zap size={8} className="fill-current" /> NEW
                </span>
              )}
              <h3 className="font-black text-gray-900 dark:text-white text-sm leading-snug line-clamp-1">
                {p.name}
              </h3>
            </div>

            {/* Category · City */}
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 mt-0.5 capitalize">
              {p.category}{p.city ? ` · ${p.city}` : ""}
            </p>

            {/* Rating */}
            <RatingBadge rating={p.rating} reviewCount={p.review_count} />
          </div>
        </div>

        {/* ── Address ──────────────────────────────────────────────────── */}
        {p.address && (
          <div className="flex items-start gap-1.5 mt-2.5">
            <MapPin size={11} className="text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1">{p.address}</p>
          </div>
        )}

        {/* ── Warning / Meta Tags ───────────────────────────────────────── */}
        {warningTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {warningTags.map((t) => (
              <span key={t.label} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${t.color}`}>
                <AlertTriangle size={8} />
                {t.label}
              </span>
            ))}
          </div>
        )}

        {/* ── Action Row ────────────────────────────────────────────────── */}
        {!isBulkSelectionMode && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <ActionBtn
                href={phone ? `tel:${phone.replace(/\s/g,"")}` : null}
                icon={Phone}
                color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                label="Call"
                disabled={!phone}
              />
              <ActionBtn
                href={phone ? `sms:${phone.replace(/\s/g,"")}` : null}
                icon={MessageSquare}
                color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                label="SMS"
                disabled={!phone}
              />
              <ActionBtn
                href={email ? `mailto:${email}` : null}
                icon={Mail}
                color="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
                label="Email"
                disabled={!email}
              />
              <ActionBtn
                href={p.website || null}
                icon={Globe}
                color="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                label="Web"
                disabled={!p.website}
              />
              {p.maps_url && (
                <ActionBtn
                  href={p.maps_url}
                  icon={MapPin}
                  color="bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                  label="Maps"
                  disabled={false}
                />
              )}
            </div>

            {/* Social indicators */}
            <div className="flex items-center gap-1.5">
              {p.socials?.facebook  && <Link2 size={13} className="text-blue-500" title="Facebook" />}
              {p.socials?.instagram && <Link2 size={13} className="text-pink-500" title="Instagram" />}
              {p.socials?.tiktok    && <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">TT</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
