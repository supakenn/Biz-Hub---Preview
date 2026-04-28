import React from 'react';
import { 
  Store, 
  Package, 
  Activity, 
  Search, 
  Megaphone,
  Globe,
  LayoutDashboard
} from 'lucide-react';
import { useWorkspace } from "../demo-services/state-manager";

export default function ModuleHub({ onNavigate }) {
  const { userData } = useWorkspace();
  const businessName = userData?.name || "Business HQ";

  const modules = [
    {
      id: 'pos',
      title: 'Biz POS',
      description: 'Daily transactions & shift logs.',
      icon: Store,
      level: 'Branch Level',
      levelColor: 'bg-green-500/10 text-green-400 border-green-500/20',
      isPrimary: true,
      category: 'Operations'
    },
    {
      id: 'ims',
      title: 'Biz IMS',
      description: 'Inventory & stock transfers.',
      icon: Package,
      level: 'HQ Level',
      levelColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      category: 'Management'
    },
    {
      id: 'ops',
      title: 'Biz Ops',
      description: 'Telemetry & team delegation.',
      icon: Activity,
      level: 'HQ Level',
      levelColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      category: 'Management'
    },
    {
      id: 'leads',
      title: 'Biz Leads',
      description: 'B2B prospect scraping.',
      icon: Search,
      level: 'Local',
      levelColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      category: 'Growth'
    },
    {
      id: 'reach',
      title: 'Biz Reach',
      description: 'Cold-outreach & Swarm.',
      icon: Megaphone,
      level: 'Local',
      levelColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      category: 'Growth'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4 md:p-8">
      {/* Welcome Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-3 py-1 w-fit rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest">
          <Globe size={10} className="animate-spin-slow" />
          Enterprise Dashboard
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tighter">
          Welcome to {businessName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-bold">
          Select a module to begin managing your enterprise ecosystem.
        </p>
      </div>

      {/* Compressed Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((mod) => (
          <div
            key={mod.id}
            onClick={() => onNavigate(mod.id)}
            className={`
              group relative flex flex-row items-center gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 shadow-sm
              ${mod.isPrimary 
                ? 'bg-blue-600 border-blue-500 hover:bg-blue-500 text-white shadow-blue-600/20' 
                : 'bg-gray-900 border-gray-800 hover:bg-gray-800 text-white'
              }
            `}
          >
            {/* Left Side: Icon Container */}
            <div className={`
              shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-105
              ${mod.isPrimary ? 'bg-white/20 text-white' : 'bg-gray-800 text-blue-400'}
            `}>
              <mod.icon size={28} strokeWidth={2.5} />
            </div>

            {/* Right Side: Content Column */}
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="text-lg font-black tracking-tight truncate">{mod.title}</h3>
                {mod.isPrimary && (
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                )}
              </div>
              
              <p className={`text-xs font-bold truncate ${mod.isPrimary ? 'text-blue-100' : 'text-gray-400'}`}>
                {mod.description}
              </p>

              {/* Stacked Operational Badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${
                  mod.isPrimary 
                    ? 'bg-white/20 border-white/30 text-white' 
                    : mod.levelColor
                }`}>
                  {mod.level}
                </span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                  mod.isPrimary ? 'bg-blue-700/50 text-blue-100' : 'bg-gray-800 text-gray-500'
                }`}>
                  {mod.category}
                </span>
              </div>
            </div>

            {/* Subtle Gradient Glow for Primary Card */}
            {mod.isPrimary && (
              <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none" />
            )}
          </div>
        ))}

        {/* Minimal Expansion Slot */}
        <div className="flex flex-row items-center gap-4 p-4 md:p-5 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 opacity-30 grayscale pointer-events-none">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
            <LayoutDashboard size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest text-gray-500">More Tools</span>
            <span className="text-[10px] font-bold text-gray-600">Coming Soon</span>
          </div>
        </div>
      </div>
    </div>
  );
}
