// src/apps/Leads/components/ToastOverlay.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Global toast notification for the BizLeads module.
// Appears at the bottom-center of the viewport; auto-dismisses via LeadsContext.
// ─────────────────────────────────────────────────────────────────────────────

import { CheckCircle, AlertTriangle, Info } from "lucide-react";

const ICONS = {
  success: <CheckCircle  size={16} className="shrink-0 text-emerald-400" />,
  error:   <AlertTriangle size={16} className="shrink-0 text-red-400" />,
  info:    <Info          size={16} className="shrink-0 text-blue-400" />,
};

const BORDERS = {
  success: "border-emerald-500/50",
  error:   "border-red-500/50",
  info:    "border-blue-500/50",
};

export default function ToastOverlay({ toast }) {
  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-[999]
        flex items-center gap-3 px-4 py-3
        bg-gray-900/95 backdrop-blur-md border ${BORDERS[toast.type] || BORDERS.info}
        rounded-2xl shadow-2xl shadow-black/40
        text-white text-xs font-bold
        animate-in slide-in-from-bottom-4 fade-in duration-200
        max-w-[90vw]
      `}
    >
      {ICONS[toast.type] || ICONS.info}
      <span>{toast.message}</span>
    </div>
  );
}
