import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  FileText, 
  Activity, 
  Menu,
  X,
  Home,
  Download,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReachProvider } from "../demo-services/state-manager";
import TemplateMaker from './components/TemplateMaker';
import CampaignAssembly from './components/CampaignAssembly';
import ReachDashboard from './components/ReachDashboard';

export default function BizReachApp({ onToggleSidebar }) {
  const [activeNode, setActiveNode] = useState('templates'); // templates | campaigns | dashboard
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstall = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const renderNode = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }
  };

  return (
    <ReachProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          
          {/* Header */}
          <header className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 sm:px-10 flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center gap-4">
              <button 
                onClick={onToggleSidebar}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Menu size={24} />
              </button>
              
              <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar py-2">
                <button 
                  onClick={() => setActiveNode('templates')}
                  className={`whitespace-nowrap font-black uppercase tracking-tighter transition-all px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${activeNode === 'templates' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  Template
                </button>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                <button 
                  onClick={() => setActiveNode('campaigns')}
                  className={`whitespace-nowrap font-black uppercase tracking-tighter transition-all px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${activeNode === 'campaigns' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  Campaign
                </button>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
                <button 
                  onClick={() => setActiveNode('dashboard')}
                  className={`whitespace-nowrap font-black uppercase tracking-tighter transition-all px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm ${activeNode === 'dashboard' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                >
                  Control
                </button>
              </div>
            </div>
            
            <div className="hidden sm:flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-tr from-red-600 to-red-400 rounded-xl shadow-md border-2 border-white dark:border-gray-800"></div>
            </div>
          </header>

          {/* Node Container */}
          <div className="flex-1 p-4 sm:p-8 lg:p-10 overflow-hidden flex flex-col">
             {renderNode()}
          </div>
        </main>
      </div>
    </ReachProvider>
  );
}
