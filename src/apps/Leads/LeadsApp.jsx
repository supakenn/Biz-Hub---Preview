// src/apps/Leads/LeadsApp.jsx
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Module Root
//
// Wraps the entire /leads module with LeadsProvider and renders sub-routes.
// Integrated into BizHubShell via lazy import in AppRouter.
// ─────────────────────────────────────────────────────────────────────────────

import { Routes, Route, Navigate } from "react-router-dom";
import { LeadsProvider } from "../demo-services/state-manager";
import LeadsShell from "./components/LeadsShell";
import DiscoveryView from "./views/DiscoveryView";
import TagsView from "./views/TagsView";

export default function LeadsApp({ user, onToggleSidebar }) {
  return (
    <LeadsProvider uid={user?.uid}>
      <LeadsShell user={user} onToggleSidebar={onToggleSidebar}>
        <Routes>
          <Route index element={<DiscoveryView />} />
          <Route path="tags" element={<TagsView />} />
          <Route path="*" element={<Navigate to="/leads" replace />} />
        </Routes>
      </LeadsShell>
    </LeadsProvider>
  );
}
