import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Store, 
  Package, 
  Users, 
  Send, 
  Settings, 
  LogOut, 
  ArrowLeftRight,
  ShoppingCart,
  Loader2,
  Menu,
  X,
  UserCircle
} from 'lucide-react';

import { 
  signInWithPopup, 
  signOut 
} from "../demo-services/cloud-provider";

import { demoAuth, googleProvider } from "../demo-services/cloud-provider";
import { useAuth } from "../demo-services/state-manager";
import { useWorkspace } from "../demo-services/state-manager";
import BusinessLobby from './shell/views/BusinessLobby';
import ModuleHub from './shell/views/ModuleHub';
import InitialLoader from './shell/components/InitialLoader';
import BranchSelectorModal from './shell/components/BranchSelectorModal';

// --- MODULE APPLICATIONS ---
import PosTerminal from './apps/POS/PosTerminal';
import BizReachApp from './apps/Reach/BizReachApp';
import LeadsApp from './apps/Leads/LeadsApp';
import InventoryApp from './apps/Inventory/InventoryApp';

// --- MAIN APP SHELL ---
export default function App() {
  const { currentUser } = useAuth();
  const [authError, setAuthError] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPWA = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleGoogleSignIn = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  if (currentUser === undefined) {
    return <InitialLoader onTimeoutExit={() => window.location.reload()} />;
  }

  // Splash Screen - Responsive Optimized
  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-950 p-6 font-sans relative overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="w-full max-w-sm flex flex-col items-center gap-10 relative z-10">
          <div className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-red-600 rounded-[2rem] flex items-center justify-center shadow-2xl border-b-4 border-red-800">
              <ShoppingCart size={40} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">BIZ</h1>
              <p className="text-red-500 font-black tracking-[0.4em] text-[10px] md:text-xs uppercase mt-1">Global Suite</p>
            </div>
          </div>

          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 flex flex-col gap-6 shadow-2xl">
            <div className="text-center space-y-1">
               <h2 className="text-white font-black text-xl tracking-tight">Enterprise Login</h2>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Workspace Access</p>
            </div>
            {authError && <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 rounded-xl p-3 border border-red-800">{authError}</p>}
            <button
              onClick={handleGoogleSignIn}
              disabled={isWorking}
              className="w-full py-4 bg-white hover:bg-gray-100 text-gray-900 font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-gray-200 disabled:opacity-60"
            >
              {isWorking ? (
                <Loader2 size={20} className="animate-spin text-gray-400" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
                  <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" />
                </svg>
              )}
              {isWorking ? 'AUTHENTICATING...' : 'SIGN IN WITH GOOGLE'}
            </button>
          </div>

          <p className="text-gray-600 text-[10px] font-black uppercase tracking-widest text-center">
            &copy; {new Date().getFullYear()} Biz Hub Suite · v2.0
          </p>
        </div>
      </div>
    );
  }

  return <MainLayout onInstallPWA={handleInstallPWA} />;
}

// --- MAIN LAYOUT (The Responsive Traffic Cop) ---
function MainLayout({ onInstallPWA }) {
  const { currentUser } = useAuth();
  const { 
    userData,
    currentBusinessId, 
    setCurrentBusinessId, 
    currentBranchId,
    loadingWorkspace 
  } = useWorkspace();

  const [currentModule, setCurrentModule] = useState('dashboard');
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleNavigate = (moduleId) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else {
      setCurrentModule(moduleId);
    }
    setIsSidebarOpen(false); // Auto-close on mobile
  };

  if (loadingWorkspace) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-950">
        <Loader2 className="text-blue-500 animate-spin mb-4" size={32} />
        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.3em]">Syncing Workspace...</p>
      </div>
    );
  }

  if (!currentBusinessId) {
    return <BusinessLobby />;
  }

  const businessName = userData?.name || "Business HQ";

  return (
    <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      
      {/* Mobile Top Nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 z-[40]">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 text-gray-500 hover:text-blue-500"
        >
          <Menu size={24} />
        </button>
        <span className="font-black text-xs uppercase tracking-widest truncate max-w-[200px]">
          {businessName}
        </span>
        <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
           <ShoppingCart size={16} />
        </div>
      </div>

      <Sidebar 
        currentBusinessId={currentBusinessId} 
        userData={userData}
        currentUser={currentUser}
        activeTab={currentModule}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={handleNavigate}
        onSwitchBusiness={() => setCurrentBusinessId(null)}
        onInstallPWA={onInstallPWA}
      />
      
      <main className="flex-1 overflow-y-auto relative pt-16 md:pt-0">
        {currentModule === 'dashboard' ? (
          <div className="p-4 md:p-8">
            <ModuleHub onNavigate={handleNavigate} />
          </div>
        ) : (
          <div className="h-full w-full">
            {currentModule === 'pos' && currentBranchId && (
              <PosTerminal shopId={currentBranchId} onToggleSidebar={() => setIsSidebarOpen(true)} />
            )}
            {currentModule === 'reach' && <BizReachApp currentUser={currentUser} />}
            {currentModule === 'leads' && <LeadsApp currentUser={currentUser} />}
            {currentModule === 'ims' && <InventoryApp businessId={currentBusinessId} currentUser={currentUser} />}
            
            {currentModule === 'ops' && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 p-8">
                <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 mb-2 border border-blue-500/20 uppercase font-black text-xl">O</div>
                <h2 className="text-3xl font-black tracking-tight uppercase">Biz Ops</h2>
                <p className="text-gray-500 text-sm font-bold">This module is currently being optimized for enterprise scaling.</p>
                <button onClick={() => setCurrentModule('dashboard')} className="mt-4 px-6 py-2 bg-gray-200 dark:bg-white/5 rounded-xl font-bold text-sm">Dashboard</button>
              </div>
            )}
          </div>
        )}
      </main>

      <BranchSelectorModal 
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onBranchSelected={(id) => {
          setCurrentModule('pos');
          setIsBranchModalOpen(false);
        }}
      />
    </div>
  );
}

// --- RESPONSIVE SIDEBAR COMPONENT ---
function Sidebar({ currentBusinessId, userData, currentUser, activeTab, isOpen, onClose, onNavigate, onSwitchBusiness, onInstallPWA }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Biz POS', icon: Store },
    { id: 'ims', label: 'Inventory (IMS)', icon: Package },
    { id: 'leads', label: 'Biz Leads', icon: Users },
    { id: 'reach', label: 'Biz Reach', icon: Send },
    { id: 'ops', label: 'Biz Ops', icon: Settings },
  ];

  const handleLogout = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50] md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-[60] w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/5 
        flex flex-col h-full transition-transform duration-300 transform font-sans
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-white/5">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShoppingCart size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tighter leading-none">BIZ HUB</h1>
                <p className="text-blue-500 font-black tracking-[0.3em] text-[8px] uppercase mt-1">Enterprise Suite</p>
              </div>
            </div>
            <button onClick={onClose} className="md:hidden text-gray-400 hover:text-white"><X size={24} /></button>
          </div>

          <div className="bg-gray-50 dark:bg-black/40 p-3 rounded-xl border border-gray-200 dark:border-white/5">
            <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-1">Active HQ</p>
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-xs truncate uppercase tracking-tight">{userData?.name || "Business HQ"}</span>
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-black text-sm uppercase tracking-tight ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' 
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <item.icon size={18} strokeWidth={2.5} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/5 space-y-3">
          <button 
            onClick={onSwitchBusiness}
            className="flex w-full items-center justify-center gap-2 p-4 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 transition-all font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-gray-300 dark:hover:border-white/10"
          >
            <ArrowLeftRight size={14} />
            Switch HQ
          </button>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-black/20 rounded-2xl border border-gray-200 dark:border-white/5">
            <img 
              src={currentUser?.photoURL} 
              alt="avatar" 
              className="w-10 h-10 rounded-xl border border-white/10 shadow-sm"
              onError={(e) => { e.target.src = "https://ui-avatars.com/api/?name=" + currentUser?.displayName; }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black truncate">{currentUser?.displayName}</p>
              <p className="text-[10px] text-gray-500 font-bold truncate">{currentUser?.email}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </aside>
    </>
  );
}