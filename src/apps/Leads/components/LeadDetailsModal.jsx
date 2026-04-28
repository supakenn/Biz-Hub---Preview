// src/apps/Leads/components/LeadDetailsModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Lead Details Modal
//
// Triggered by long-press on a ProspectCard (in non-bulk mode).
// Displays the full prospect profile and the Contact Target Manager —
// checkboxes to set which specific email / phone is "active" for Biz Reach.
//
// INVARIANT: active_email and active_phone are saved ONLY to Dexie.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import {
  Phone, Mail, Globe, MapPin, Star, Clock,
  Link2, Tag, Check, ExternalLink, Zap,
} from "lucide-react";
import BaseModal from "../../../shell/components/BaseModal";
import { leadsDb } from "../demoDb/leadsDb";
import { useLeads } from "../demo-services/state-manager";

// ─── Contact Target Manager ───────────────────────────────────────────────────
function ContactTargetManager({ prospect, onUpdate }) {
  const [activeEmail, setActiveEmail] = useState(prospect.active_email);
  const [activePhone, setActivePhone] = useState(prospect.active_phone);
  const [saving, setSaving] = useState(false);

  const save = async (field, value) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleEmailChange = async (email) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handlePhoneChange = async (phone) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  return (
    <div className="space-y-4">
      {/* Emails */}
      {prospect.emails?.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
            <Mail size={11} /> Active Email Target
            {saving && <span className="text-violet-400 font-bold normal-case tracking-normal">Saving…</span>}
          </p>
          <div className="space-y-1.5">
            {prospect.emails.map((email) => (
              <button
                key={email}
                onClick={() => handleEmailChange(email)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                  activeEmail === email
                    ? "bg-violet-50 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-violet-200"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  activeEmail === email ? "bg-violet-500 border-violet-500" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {activeEmail === email && <Check size={10} className="text-white" />}
                </div>
                <span className="truncate">{email}</span>
                <a
                  href={`mailto:${email}`}
                  onClick={(e) => e.stopPropagation()}
                  className="ml-auto text-gray-400 hover:text-violet-500 shrink-0"
                >
                  <ExternalLink size={12} />
                </a>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Phones */}
      {prospect.phones?.length > 0 && (
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
            <Phone size={11} /> Active Phone Target
          </p>
          <div className="space-y-1.5">
            {prospect.phones.map((phone) => (
              <button
                key={phone}
                onClick={() => handlePhoneChange(phone)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                  activePhone === phone
                    ? "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                    : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-200"
                }`}
              >
                <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                  activePhone === phone ? "bg-emerald-500 border-emerald-500" : "border-gray-300 dark:border-gray-600"
                }`}>
                  {activePhone === phone && <Check size={10} className="text-white" />}
                </div>
                <span className="truncate">{phone}</span>
                <div className="ml-auto flex gap-2 shrink-0">
                  <a href={`tel:${phone.replace(/\s/g,"")}`} onClick={(e) => e.stopPropagation()} className="text-emerald-500 hover:text-emerald-700">
                    <Phone size={12} />
                  </a>
                  <a href={`sms:${phone.replace(/\s/g,"")}`} onClick={(e) => e.stopPropagation()} className="text-blue-400 hover:text-blue-600">
                    <ExternalLink size={12} />
                  </a>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {(!prospect.emails?.length && !prospect.phones?.length) && (
        <p className="text-sm text-gray-400 italic text-center py-3">No contact information found for this lead.</p>
      )}
    </div>
  );
}

// ─── Social Link Row ──────────────────────────────────────────────────────────
function SocialLink({ href, icon: Icon, label, color }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 ${color}`}
    >
      <Icon size={14} />
      {label}
    </a>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800 pb-1.5">
        {title}
      </p>
      {children}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function LeadDetailsModal({ prospect: initialProspect, isOpen, onClose }) {
  const { showToast } = useLeads();
  const [prospect, setProspect] = useState(initialProspect);

  // Sync if prop changes (e.g. re-opened with different prospect)
  useEffect(() => { setProspect(initialProspect); }, [initialProspect]);

  if (!prospect) return null;

  const socials = prospect.socials || {};

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={prospect.name}
      icon={Zap}
      iconColor="text-violet-400"
      maxWidth="max-w-lg"
    >
      <div className="space-y-6">

        {/* ── Overview ──────────────────────────────────────────────────── */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 overflow-hidden flex items-center justify-center">
            {prospect.featured_image ? (
              <img src={prospect.featured_image} alt={prospect.name} className="w-full h-full object-cover" />
            ) : (
              <span className="font-black text-2xl text-violet-600 dark:text-violet-400">
                {(prospect.name || "?")[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-[11px] font-bold text-gray-400 capitalize">
              {prospect.category}{prospect.city ? ` · ${prospect.city}` : ""}
            </p>
            {prospect.rating > 0 && (
              <div className="flex items-center gap-1.5">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="font-black text-sm text-amber-500">{prospect.rating.toFixed(1)}</span>
                <span className="text-xs text-gray-400">({(prospect.review_count || 0).toLocaleString()} reviews)</span>
              </div>
            )}
            {prospect.address && (
              <p className="text-xs text-gray-500 flex items-start gap-1">
                <MapPin size={11} className="shrink-0 mt-0.5" />
                {prospect.address}
              </p>
            )}
            {prospect.hours && (
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Clock size={11} className="shrink-0" />
                {prospect.hours}
              </p>
            )}
          </div>
        </div>

        {/* ── Quick Links ───────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {prospect.website && (
            <a href={prospect.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all">
              <Globe size={13} /> Website
            </a>
          )}
          {prospect.maps_url && (
            <a href={prospect.maps_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all">
              <MapPin size={13} /> Google Maps
            </a>
          )}
        </div>

        {/* ── Contact Target Manager ────────────────────────────────────── */}
        <Section title="📞 Contact Target Manager">
          <ContactTargetManager prospect={prospect} onUpdate={setProspect} />
        </Section>

        {/* ── Socials ───────────────────────────────────────────────────── */}
        {(socials.facebook || socials.instagram || socials.twitter || socials.linkedin || socials.tiktok || socials.youtube) && (
          <Section title="🔗 Social Profiles">
            <div className="flex flex-wrap gap-2">
              <SocialLink href={socials.facebook}  icon={Link2} label="Facebook"  color="bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300" />
              <SocialLink href={socials.instagram} icon={Link2} label="Instagram" color="bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-300" />
              <SocialLink href={socials.twitter}   icon={Link2} label="Twitter"   color="bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-300" />
              <SocialLink href={socials.linkedin}  icon={Link2} label="LinkedIn"  color="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" />
              <SocialLink href={socials.youtube}   icon={Link2} label="YouTube"   color="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300" />
              {socials.tiktok && (
                <a href={socials.tiktok} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:scale-105 active:scale-95 transition-all">
                  <Link2 size={14} /> TikTok
                </a>
              )}
            </div>
          </Section>
        )}

        {/* ── Description ───────────────────────────────────────────────── */}
        {prospect.description && (
          <Section title="📋 Description">
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{prospect.description}</p>
          </Section>
        )}

        {/* ── Additional Categories ──────────────────────────────────────── */}
        {prospect.categories?.length > 1 && (
          <Section title="🏷️ All Categories">
            <div className="flex flex-wrap gap-1.5">
              {prospect.categories.map((cat) => (
                <span key={cat} className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg text-[11px] font-bold">
                  {cat}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* ── Owner ─────────────────────────────────────────────────────── */}
        {prospect.owner_name && (
          <Section title="👤 Owner">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{prospect.owner_name}</p>
          </Section>
        )}

        {/* ── Review Keywords ───────────────────────────────────────────── */}
        {prospect.review_keywords && (
          <Section title="💬 Review Keywords">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">{prospect.review_keywords}</p>
          </Section>
        )}

      </div>
    </BaseModal>
  );
}
