import React, { useState, useEffect } from 'react';
import {
  Plus,
  Users,
  ChevronDown,
  Mail,
  Smartphone,
  Lock,
  Server,
  Clock,
  SendHorizontal,
  X
} from 'lucide-react';
import { useReach } from "../demo-services/state-manager";

// Detect Mobile Device for Local APK routing vs Desktop Lock
const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export default function CampaignAssembly() {
  const { 
    campaigns, 
    templates, 
    audienceTags, 
    saveCampaign, 
    launchCampaign 
  } = useReach();

  const [selectedCampaignId, setSelectedCampaignId] = useState('new');
  const [campaignDraft, setCampaignDraft] = useState({ 
    name: 'New Campaign', tagId: '', emailTemplateId: '', smsTemplateId: '', scheduleMode: 'now', scheduleTime: '' 
  });

  // Sync draft with selection
  useEffect(() => {
    if (selectedCampaignId === 'new') {
      setCampaignDraft({ name: 'New Campaign', tagId: '', emailTemplateId: '', smsTemplateId: '', scheduleMode: 'now', scheduleTime: '' });
    } else {
      const camp = campaigns.find(c => c.id.toString() === selectedCampaignId.toString());
      if (camp) {
        setCampaignDraft({
          name: camp.name,
          tagId: camp.tagId?.toString() || '',
          emailTemplateId: camp.emailTemplateId?.toString() || '',
          smsTemplateId: camp.smsTemplateId?.toString() || '',
          scheduleMode: camp.schedule ? 'later' : 'now',
          scheduleTime: camp.schedule || ''
        });
      }
    }
  }, [selectedCampaignId, campaigns]);

  const selectedTagData = audienceTags.find(t => t.id.toString() === campaignDraft.tagId);
  const emailTemplatesList = templates.filter(t => t.type === 'email');
  const smsTemplatesList = templates.filter(t => t.type === 'sms');

  // Desktop Lock check for SMS
  const hasSmsEnabled = !!campaignDraft.smsTemplateId;
  const isDesktopSmsLocked = hasSmsEnabled && !isMobile;

  const canProceed = campaignDraft.tagId && 
                     (campaignDraft.emailTemplateId || campaignDraft.smsTemplateId) && 
                     !(campaignDraft.scheduleMode === 'later' && !campaignDraft.scheduleTime) &&
                     !isDesktopSmsLocked;

  const handleSaveDraft = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    };
    const id = await saveCampaign(data);
    if (selectedCampaignId === 'new') setSelectedCampaignId(id.toString());
  };

  const handleLaunch = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    };
    await launchCampaign(data);
    // Optionally redirect to dashboard or show success
  };

  return (
    <div className="flex-1 flex flex-col sm:flex-row gap-6 h-full overflow-hidden">
      
      {/* Left Sidebar: Campaign List */}
      <div className="w-full sm:w-1/3 max-w-xs flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-800 dark:text-gray-200">Campaigns</h2>
          <button onClick={() => setSelectedCampaignId('new')} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-2">
          {campaigns.map(camp => (
            <button key={camp.id} onClick={() => setSelectedCampaignId(camp.id.toString())} className={`text-left p-4 rounded-xl border-2 transition-all bg-white dark:bg-gray-800 ${selectedCampaignId.toString() === camp.id.toString() ? 'border-blue-500 shadow-md scale-[1.02]' : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'}`}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-black text-gray-800 dark:text-gray-200 truncate pr-2">{camp.name}</span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${
                  camp.status === 'running' ? 'bg-blue-100 text-blue-700' :
                  camp.status === 'pending_handoff' ? 'bg-yellow-100 text-yellow-700' :
                  camp.status === 'completed' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {camp.status.replace('_', ' ')}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 font-bold flex flex-col gap-1">
                <span className="flex items-center gap-1.5"><Users size={12}/> {audienceTags.find(t => t.id.toString() === camp.tagId?.toString())?.name || 'No Audience'}</span>
                <div className="flex gap-2 mt-1">
                  {camp.emailTemplateId ? <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded"><Mail size={10}/> Configured</span> : null}
                  {camp.smsTemplateId ? <span className="flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded"><Smartphone size={10}/> Configured</span> : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Area: Assembly Form */}
      <div className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <input type="text" value={campaignDraft.name} onChange={(e) => setCampaignDraft({...campaignDraft, name: e.target.value})} placeholder="Campaign Name" className="w-full bg-transparent text-2xl font-black text-gray-800 dark:text-gray-100 outline-none placeholder-gray-400" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {/* Step 1: Audience */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center">1</span> Target Audience</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl">
              <div className="relative mb-4">
                <select value={campaignDraft.tagId} onChange={(e) => setCampaignDraft({...campaignDraft, tagId: e.target.value})} className="w-full appearance-none bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-black text-sm rounded-xl py-3 pl-4 pr-10 outline-none focus:border-blue-500 transition-colors">
                  <option value="" disabled>Select an Audience Tag from Biz Leads...</option>
                  {audienceTags.map(tag => (<option key={tag.id} value={tag.id}>{tag.name}</option>))}
                </select>
                <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              
              {selectedTagData ? (
                <div className="flex gap-4">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex-1 text-center shadow-sm">
                    <span className="block text-[10px] font-black uppercase text-gray-400 mb-1">Total Leads</span>
                    <span className="text-lg font-black text-gray-800 dark:text-gray-200">{selectedTagData.count}</span>
                  </div>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex-1 text-center shadow-sm">
                    <span className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center justify-center gap-1"><Mail size={10}/> Emails</span>
                    <span className="text-lg font-black text-red-600">{selectedTagData.emails}</span>
                  </div>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 flex-1 text-center shadow-sm">
                    <span className="block text-[10px] font-black uppercase text-gray-400 mb-1 flex items-center justify-center gap-1"><Smartphone size={10}/> Phones</span>
                    <span className="text-lg font-black text-blue-600">{selectedTagData.phones}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold">Waiting for audience selection...</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Templates */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center">2</span> Message Templates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email Assignment */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl flex flex-col">
                <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-3"><Mail size={14} className="text-red-500"/> Email Channel</h4>
                <div className="relative mb-3">
                  <select value={campaignDraft.emailTemplateId} onChange={(e) => setCampaignDraft({...campaignDraft, emailTemplateId: e.target.value})} className="w-full appearance-none bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-black text-sm rounded-xl py-2 pl-3 pr-8 outline-none focus:border-red-500 transition-colors">
                    <option value="">-- No Email Template --</option>
                    {emailTemplatesList.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* SMS Assignment */}
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl flex flex-col">
                <h4 className="text-xs font-black text-gray-700 dark:text-gray-300 flex items-center gap-1.5 mb-3"><Smartphone size={14} className="text-blue-500"/> SMS Channel</h4>
                <div className="relative mb-3">
                  <select value={campaignDraft.smsTemplateId} onChange={(e) => setCampaignDraft({...campaignDraft, smsTemplateId: e.target.value})} className="w-full appearance-none bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-black text-sm rounded-xl py-2 pl-3 pr-8 outline-none focus:border-blue-500 transition-colors">
                    <option value="">-- No SMS Template --</option>
                    {smsTemplatesList.map(t => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {isDesktopSmsLocked && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-start gap-2 border border-red-200 dark:border-red-800">
                    <Lock size={14} className="text-red-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-red-700 dark:text-red-400 leading-tight">
                      SMS sending is locked on desktop to keep cloud costs at zero. Open Biz Reach on your Android phone to execute this.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Scheduler */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2"><span className="w-5 h-5 rounded bg-blue-100 text-blue-600 flex items-center justify-center">3</span> Execution Schedule</h3>
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-5 rounded-2xl flex flex-col gap-4">
              <div className="flex gap-4">
                <button onClick={() => setCampaignDraft({...campaignDraft, scheduleMode: 'now', scheduleTime: ''})} className={`flex-1 p-4 rounded-xl border-2 font-black flex items-center justify-center gap-2 transition-all ${campaignDraft.scheduleMode === 'now' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <Server size={18}/> Execute ASAP
                </button>
                <button onClick={() => setCampaignDraft({...campaignDraft, scheduleMode: 'later'})} className={`flex-1 p-4 rounded-xl border-2 font-black flex items-center justify-center gap-2 transition-all ${campaignDraft.scheduleMode === 'later' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  <Clock size={18}/> Schedule Later
                </button>
              </div>
              {campaignDraft.scheduleMode === 'later' && (
                <div className="animate-in fade-in slide-in-from-top-2 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800 text-sm flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-300 font-black">Dispatch Time:</span>
                  <input 
                    type="datetime-local" 
                    value={campaignDraft.scheduleTime}
                    onChange={(e) => setCampaignDraft({...campaignDraft, scheduleTime: e.target.value})}
                    className="bg-white dark:bg-gray-900 border border-blue-300 dark:border-blue-800 text-gray-800 dark:text-gray-100 font-bold text-sm rounded-lg py-2 px-3 outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-4 shrink-0">
          <button onClick={handleSaveDraft} className="px-6 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-black rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-all shadow-sm">Save as Draft</button>
          <button onClick={handleLaunch} disabled={!canProceed} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md border-b-4 border-blue-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            Launch Campaign <SendHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
