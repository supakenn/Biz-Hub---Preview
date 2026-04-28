import { useState, useEffect } from "react";
import GlobalSidebar from "./components/GlobalSidebar";
import AppRouter from "./AppRouter";

export default function BizHubShell({ currentUser, userData, memberships, activeShopId: initialShopId, onLogout, onSwitchShop, onInstallPWA }) {
  const [activeShopId, setActiveShopId] = useState(initialShopId || null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Keep localStorage in sync whenever activeShopId changes
  useEffect(() => {
    if (activeShopId) {
      localStorage.setItem('active_shop_id', activeShopId);
    }
  }, [activeShopId]);

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans relative">
      <GlobalSidebar 
        installedModules={userData?.installedModules || ["POS", "IMS"]} 
        activeShopId={activeShopId} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onInstallPWA={onInstallPWA}
        onSwitchShop={() => {
          setActiveShopId(null);
          localStorage.removeItem('active_shop_id');
          if (onSwitchShop) onSwitchShop();
        }}
      />
      <main className="flex-1 overflow-hidden relative flex flex-col min-w-0 w-full">
        <AppRouter 
          installedModules={userData?.installedModules || ["POS", "IMS"]} 
          activeShopId={activeShopId}
          onShopSelect={(id) => {
            setActiveShopId(id);
            if (id) localStorage.setItem('active_shop_id', id);
            setIsSidebarOpen(false);
          }}
          memberships={memberships}
          user={currentUser}
          onLogout={onLogout}
          onToggleSidebar={() => setIsSidebarOpen(o => !o)}
        />
      </main>
    </div>
  );
}
