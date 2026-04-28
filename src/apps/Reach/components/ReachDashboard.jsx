import React, { useState, useEffect } from 'react';
import {
  Server,
  Activity,
  AlertCircle,
  Smartphone,
  Lock,
  Mail,
  Loader2,
  Plus,
  ShieldCheck,
  Clock,
  QrCode,
  DownloadCloud,
  Code,
  BarChart3,
  MessageSquare,
  CheckCircle2,
  Play,
  RefreshCw
} from 'lucide-react';
import { useReach } from "../demo-services/state-manager";
import { demoAuth } from "../demo-services/cloud-provider";

const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export default function ReachDashboard() {
  const { 
    campaigns, 
    swarmBots, 
    isEmailingSetup, 
    smsAppConnected, 
    isRefreshingSwarm,
    refreshSwarmBots,
    requestOnboardingEmail, 
    connectMobileApp,
    handoffCampaign,
    requestReport
  } = useReach();

  const [toast, setToast] = useState('');

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const activeCampaigns = campaigns.filter(c => c.status !== 'draft');
  const onlineBots = swarmBots.filter(b => b.status === 'online').length;
  const totalCapacity = swarmBots.reduce((sum, b) => sum + b.capacity, 0);
  const totalUsed = swarmBots.reduce((sum, b) => sum + b.used, 0);

  const handleHandoff = async (id) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else {
      setToast('Handoff failed. Check Master GAS URL.');
    }
  };

  const handleRequestReport = async (name) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  return (
    <div className="flex-1 flex flex-col gap-6 h-full overflow-hidden">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-white/10 font-black text-sm animate-in fade-in slide-in-from-top-4 duration-300">
          {toast}
        </div>
      )}

      {/* Top: System Integrity Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
        
        {/* Card 1: GAS Proxy Swarm (Email) */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                <Server size={18} />
              </div>
              <div>
                <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm leading-tight">Biz Email Swarm</h3>
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">GAS Proxy Nodes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Refresh button */}
              <button
                onClick={refreshSwarmBots}
                disabled={isRefreshingSwarm}
                title="Refresh node list from Firestore"
                className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={13} className={isRefreshingSwarm ? 'animate-spin' : ''} />
              </button>
              {/* Online status badge */}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${onlineBots > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                {onlineBots > 0 ? <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> : <AlertCircle size={10}/>}
                <span className="text-[9px] font-black uppercase tracking-widest">{onlineBots > 0 ? `${onlineBots} Online` : 'Offline'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center gap-1.5 mt-1 mb-2">
            {swarmBots.length > 0 ? (
              <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[80px] custom-scrollbar pr-1">
                {swarmBots.map(bot => (
                  <div key={bot.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-1.5 rounded-lg border border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">{bot.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-gray-500">
                       {bot.status === 'online' ? (
                         <>
                           <span className="text-blue-600 dark:text-blue-400" title="Emails Sent Today">{bot.used}/{bot.capacity}</span>
                           <span className="flex items-center gap-0.5" title="Last Heartbeat"><Activity size={8}/> {bot.lastAlive}</span>
                         </>
                       ) : (
                         <>
                           <span className="text-red-500">Offline</span>
                           <span className="flex items-center gap-0.5" title="Last Heartbeat"><Clock size={8}/> {bot.lastAlive}</span>
                         </>
                       )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] leading-tight font-bold text-gray-500 dark:text-gray-400 mb-2 mt-2">
                Register multiple GAS nodes to bypass the 100/day free Gmail limit.
              </p>
            )}
          </div>

          <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            {swarmBots.length > 0 ? (
              <>
                <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1" title={`Total Limit: ${totalCapacity}`}><ShieldCheck size={12}/> {totalCapacity - totalUsed} Quota Left</span>
                <button onClick={() => setToast('Add Node dialog opened')} className="text-[10px] text-blue-600 dark:text-blue-400 font-black hover:underline flex items-center gap-1 active:scale-95 transition-all"><Plus size={10}/> Add Node</button>
              </>
            ) : (
              <button 
                onClick={async () => {
                  const ok = await requestOnboardingEmail();
                  if (ok) setToast('🚀 Setup Guide sent to your email!');
                  else setToast('❌ Failed to send guide. Check console.');
                }}
                disabled={isEmailingSetup}
                className="w-full py-1.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-black rounded-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800 disabled:opacity-50"
              >
                {isEmailingSetup ? <Loader2 size={12} className="animate-spin"/> : <Mail size={12}/>} 
                {isEmailingSetup ? 'Sending Guide...' : 'Email Setup Guide'}
              </button>
            )}
          </div>
        </div>

        {/* Card 2: Android SMS Gateway */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col relative overflow-hidden">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                <Smartphone size={18} />
              </div>
              <div>
                <h3 className="font-black text-gray-800 dark:text-gray-100 text-sm leading-tight">Biz SMS Gateway</h3>
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400">Localhost Bridge</p>
              </div>
            </div>
            {!isMobile ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full border border-gray-200 dark:border-gray-700">
                <Lock size={10}/>
                <span className="text-[9px] font-black uppercase tracking-widest">Locked</span>
              </div>
            ) : smsAppConnected ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full border border-green-200 dark:border-green-800">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[9px] font-black uppercase tracking-widest">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full border border-yellow-200 dark:border-yellow-800">
                <AlertCircle size={10}/>
                <span className="text-[9px] font-black uppercase tracking-widest">Pending</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col justify-center items-center gap-2 my-2 text-center">
            {isMobile ? (
               !smsAppConnected ? (
                <>
                  <p className="text-[10px] font-bold text-gray-500 leading-tight max-w-[200px]">
                    Connect your Android phone to use your local SIM for unlimited SMS.
                  </p>
                  <button onClick={connectMobileApp} className="mt-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-lg text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md">
                    <QrCode size={14} /> 1-Click Connect
                  </button>
                </>
               ) : (
                 <div className="flex flex-col items-center gap-1">
                    <CheckCircle2 size={32} className="text-green-500 mb-1" />
                    <span className="text-[10px] font-black text-gray-700 dark:text-gray-300">Gateway Active</span>
                    <p className="text-[9px] text-gray-400 font-bold">Routing traffic through Local SIM</p>
                 </div>
               )
            ) : (
              <>
                <Lock size={24} className="text-gray-300 dark:text-gray-700" />
                <p className="text-[10px] font-bold text-gray-400 leading-tight max-w-[200px]">
                  SMS Gateway is only available when running Biz Reach on Android.
                </p>
              </>
            )}
          </div>

          <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-bold flex items-center gap-1"><DownloadCloud size={12}/> APK v2.1.0</span>
            <button className="text-[10px] text-blue-600 dark:text-blue-400 font-black hover:underline flex items-center gap-1"><Code size={10}/> APK Guide</button>
          </div>
        </div>
      </div>

      {/* Main Bottom: Campaign Progress & Logs */}
      <div className="flex-1 min-h-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl flex flex-col overflow-hidden">
        <div className="p-5 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BarChart3 size={20} className="text-blue-600" />
            <h3 className="font-black text-gray-800 dark:text-gray-100">Campaign Execution Log</h3>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 text-[10px] font-black text-gray-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              {activeCampaigns.filter(c => c.status === 'running').length} Active
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeCampaigns.length > 0 ? (
            <div className="space-y-3">
              {activeCampaigns.map(camp => (
                <div key={camp.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-gray-100 dark:hover:bg-gray-800/60">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                      camp.status === 'completed' ? 'bg-green-100 text-green-600' :
                      camp.status === 'running' ? 'bg-blue-100 text-blue-600' :
                      camp.status === 'pending_handoff' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {camp.status === 'completed' ? <CheckCircle2 size={20} /> : <Activity size={20} className={camp.status === 'running' ? 'animate-spin-slow' : ''} />}
                    </div>
                    <div>
                      <h4 className="font-black text-gray-800 dark:text-gray-100 text-sm">{camp.name}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{camp.status.replace('_', ' ')} • {camp.metrics?.total || 0} LEADS</p>
                    </div>
                  </div>

                  <div className="flex-1 sm:max-w-[240px]">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Progress</span>
                      <span className="text-[10px] font-black text-blue-600">{Math.round(((camp.metrics?.sent || 0) / (camp.metrics?.total || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${camp.status === 'completed' ? 'bg-green-500' : 'bg-blue-600 animate-pulse'}`} 
                        style={{ width: `${((camp.metrics?.sent || 0) / (camp.metrics?.total || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                       <div className="text-center">
                          <span className="block text-[9px] font-black text-gray-400">SENT</span>
                          <span className="text-xs font-black text-gray-800 dark:text-gray-200">{camp.metrics?.sent || 0}</span>
                       </div>
                       <div className="text-center">
                          <span className="block text-[9px] font-black text-gray-400">FAIL</span>
                          <span className="text-xs font-black text-red-500">{camp.metrics?.failed || 0}</span>
                       </div>
                    </div>
                    {camp.status === 'pending_handoff' && (
                      <button 
                        onClick={() => handleHandoff(camp.id)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                      >
                        <Play size={12} fill="currentColor" /> Handoff
                      </button>
                    )}
                    <button 
                      onClick={() => handleRequestReport(camp.name)}
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <BarChart3 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-12">
              <Activity size={48} className="mb-4" />
              <h4 className="font-black text-gray-500">No Active Campaigns</h4>
              <p className="text-xs font-bold max-w-xs">Launched campaigns will appear here for progress tracking.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
