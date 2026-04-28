import { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HubDashboard from "./HubDashboard";
import { useManifest } from "../hooks/useManifest";

const PosTerminal = lazy(() => import("../apps/POS/PosTerminal.jsx"));
const InventoryApp = lazy(() => import("../apps/Inventory/InventoryApp.jsx"));
const LeadsApp     = lazy(() => import("../apps/Leads/LeadsApp.jsx"));
const ReachApp     = lazy(() => import("../apps/Reach/BizReachApp.jsx"));

const ModuleLoader = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="animate-pulse text-[10px] font-black uppercase tracking-widest text-gray-400">Loading Module...</div>
  </div>
);

export default function AppRouter({ installedModules, activeShopId, onShopSelect, memberships, user, onLogout, onToggleSidebar }) {
  useManifest(); // Swap <link rel="manifest"> per route for scoped PWA installs

  return (
    <Suspense fallback={<ModuleLoader />}>
      <Routes>
        <Route 
          path="/" 
          element={<HubDashboard installedModules={installedModules} activeShopId={activeShopId} onShopSelect={onShopSelect} memberships={memberships} user={user} onToggleSidebar={onToggleSidebar} />} 
        />
        {installedModules.includes("POS") && (
          <Route 
            path="/pos" 
            element={
              activeShopId 
                ? <PosTerminal 
                    shopId={activeShopId} 
                    userRole={memberships[activeShopId] || "staff"}
                    memberships={memberships}
                    user={user}
                    onSwitchShop={() => onShopSelect(null)}
                    onLogout={onLogout}
                    onToggleSidebar={onToggleSidebar}
                  /> 
                : <Navigate to="/" replace />
            } 
          />
        )}
        {installedModules.includes("IMS") && (
          <Route 
            path="/inventory" 
            element={
              activeShopId 
                ? <InventoryApp 
                    shopId={activeShopId} 
                    userRole={memberships[activeShopId] || "staff"}
                    memberships={memberships}
                    user={user}
                    onToggleSidebar={onToggleSidebar}
                  /> 
                : <Navigate to="/" replace />
            } 
          />
        )}
        {installedModules.includes("LEADS") && (
          <Route
            path="/leads/*"
            element={
              <LeadsApp
                user={user}
                onToggleSidebar={onToggleSidebar}
              />
            }
          />
        )}
        {installedModules.includes("REACH") && (
          <Route
            path="/reach/*"
            element={
              <ReachApp
                user={user}
                onToggleSidebar={onToggleSidebar}
              />
            }
          />
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
