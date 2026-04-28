import React, { useState, useEffect } from 'react';
import {
  FileText,
  Megaphone,
  Send,
  Plus,
  Edit2,
  Download,
  Upload,
  MessageSquare,
  Mail,
  Smartphone,
  ChevronDown,
  Save,
  X,
  Play,
  Code,
  Users,
  Calendar,
  CheckCircle2,
  SendHorizontal,
  Server,
  Activity,
  QrCode,
  BarChart3,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Loader2,
  DownloadCloud,
  Lock,
  Clock,
  Link2
} from 'lucide-react';

// =============================================================================
// MOCK DATA & CONFIG
// =============================================================================
const AVAILABLE_VARIABLES = ['business_name', 'category', 'location', 'remark'];

const MOCK_LEADS = [
  { id: 'l_1', business_name: "Angel's Coffee", category: "Cafe", location: "Cavite", remark: "noticed your great reviews", phone: "+639123456789", email: "hello@angelscoffee.com" },
  { id: 'l_2', business_name: "TechHub Solutions", category: "IT Agency", location: "Manila", remark: "saw your impressive portfolio", phone: "+639987654321", email: "contact@techhub.ph" },
];

const MOCK_TEMPLATES = [
  {
    id: 't_1',
    name: 'Cafe Outreach (Web Dev)',
    type: 'sms',
    content: '{Hi|Hello|Hey} {{business_name}}, we {{remark}}! Since you are a {{category}} in {{location}}, we wanted to offer a free site audit. Open to a quick chat?'
  },
  {
    id: 't_2',
    name: 'B2B Retail Pitch',
    type: 'email',
    sender_name: '{Kenn|John} from Biz Reach',
    reply_to: 'sales@bizreach.app',
    subject: 'Partnership Inquiry for {{business_name}}',
    content: '{Dear|Hi} {{business_name}} Team,\n\nI was looking at {{category}} businesses in {{location}} and you stood out. {We|Our team} specializes in helping retail businesses scale.\n\nLet me know if you have 5 minutes next week!',
    html_content: '<div style="font-family: sans-serif; color: #333;">\n  <p>{Dear|Hi} <b>{{business_name}} Team</b>,</p>\n  <p>I was looking at {{category}} businesses in {{location}} and you stood out. {We|Our team} specializes in helping retail businesses scale.</p>\n  <p>Let me know if you have 5 minutes next week!</p>\n</div>'
  }
];

const MOCK_TAGS = [
  { id: 'tag_1', name: 'April Cafe Outreach', count: 142, emails: 120, phones: 135 },
  { id: 'tag_2', name: 'B2B Retail Manila', count: 85, emails: 80, phones: 45 },
  { id: 'tag_3', name: 'Tech Startups Q2', count: 320, emails: 310, phones: 150 },
];

const MOCK_CAMPAIGNS = [
  { 
    id: 'camp_1', name: 'Manila Tech Promo', tagId: 'tag_3', emailTemplateId: 't_2', smsTemplateId: '', 
    status: 'running', schedule: '', 
    metrics: { total: 310, sent: 142, failed: 3, pending: 165 } 
  },
  { 
    id: 'camp_2', name: 'Cafe Follow-up', tagId: 'tag_1', emailTemplateId: 't_2', smsTemplateId: 't_1', 
    status: 'completed', schedule: '', 
    metrics: { total: 142, sent: 138, failed: 4, pending: 0 } 
  },
];

const MOCK_SWARM_BOTS = [
  { id: 'bot_1', name: 'Alpha Node', status: 'online', capacity: 100, used: 45, lastAlive: '2m ago' },
  { id: 'bot_2', name: 'Beta Node', status: 'online', capacity: 100, used: 12, lastAlive: '15m ago' },
  { id: 'bot_3', name: 'Gamma Node', status: 'offline', capacity: 100, used: 0, lastAlive: '3d ago' },
];

// =============================================================================
// SPINTAX & VARIABLE PARSER ENGINE
// =============================================================================
const parseSpintax = (text, leadData) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  });
  const dataToUse = leadData || MOCK_LEADS[0];
  parsed = parsed.replace(/\{\{([^{}]+)\}\}/g, (match, variable) => {
    return dataToUse[variable.trim()] || match;
  });
  return parsed;
};

// Detect Mobile Device for Local APK routing vs Desktop Lock
const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
export default function BizReachApp({ currentUser }) {
  // Use a mocked UID if currentUser is not passed during this standalone test
  const MOCK_UID = currentUser?.uid || "user_abc123xyz";

  const [activeNode, setActiveNode] = useState('dashboard'); // templates | campaigns | dashboard

  // --- Node 1: Template State (Locally Persisted) ---
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('bizreach_templates');
    return saved ? JSON.parse(saved) : MOCK_TEMPLATES;
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(templates[0]);
  
  const [previewLead, setPreviewLead] = useState(MOCK_LEADS[0]);
  const [previewRender, setPreviewRender] = useState('');
  const [previewSubjectRender, setPreviewSubjectRender] = useState('');
  const [previewSenderRender, setPreviewSenderRender] = useState('');
  const [previewReplyToRender, setPreviewReplyToRender] = useState('');
  const [previewHtmlRender, setPreviewHtmlRender] = useState('');
  const [emailBodyMode, setEmailBodyMode] = useState('text'); 

  // --- Node 2: Campaign State (Locally Persisted) ---
  const [campaigns, setCampaigns] = useState(() => {
    const saved = localStorage.getItem('bizreach_campaigns');
    return saved ? JSON.parse(saved) : MOCK_CAMPAIGNS;
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState('new');
  const [campaignDraft, setCampaignDraft] = useState({ 
    name: 'New Campaign', tagId: '', emailTemplateId: '', smsTemplateId: '', scheduleMode: 'now', scheduleTime: '' 
  });

  // --- Node 3: Dashboard State ---
  const [toast, setToast] = useState('');
  const [swarmBots, setSwarmBots] = useState([]); // Array of registered GAS Proxies
  const [smsAppConnected, setSmsAppConnected] = useState(false);
  const [isEmailingSetup, setIsEmailingSetup] = useState(false);

  // Auto-clear toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Persist Local Storage
  useEffect(() => {
    localStorage.setItem('bizreach_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('bizreach_campaigns', JSON.stringify(campaigns));
  }, [campaigns]);

  // Update active template previews
  useEffect(() => {
    if (!templates.length) return;
    const t = templates.find(t => t.id === selectedTemplateId) || templates[0];
    setActiveTemplate(t);
    setPreviewRender(parseSpintax(t.content, previewLead));
    if (t.type === 'email') {
      setPreviewSubjectRender(parseSpintax(t.subject || '', previewLead));
      setPreviewSenderRender(parseSpintax(t.sender_name || '', previewLead));
      setPreviewReplyToRender(parseSpintax(t.reply_to || '', previewLead));
      setPreviewHtmlRender(parseSpintax(t.html_content || '', previewLead));
    }
    setIsEditing(false);
  }, [selectedTemplateId, templates]);

  useEffect(() => {
    if (!activeTemplate) return;
    setPreviewRender(parseSpintax(activeTemplate.content, previewLead));
    if (activeTemplate.type === 'email') {
      setPreviewSubjectRender(parseSpintax(activeTemplate.subject || '', previewLead));
      setPreviewSenderRender(parseSpintax(activeTemplate.sender_name || '', previewLead));
      setPreviewReplyToRender(parseSpintax(activeTemplate.reply_to || '', previewLead));
      setPreviewHtmlRender(parseSpintax(activeTemplate.html_content || '', previewLead));
    }
  }, [activeTemplate?.content, activeTemplate?.subject, activeTemplate?.sender_name, activeTemplate?.reply_to, activeTemplate?.html_content, activeTemplate?.type, previewLead]);

  useEffect(() => {
    if (selectedCampaignId === 'new') {
      setCampaignDraft({ name: 'New Campaign', tagId: '', emailTemplateId: '', smsTemplateId: '', scheduleMode: 'now', scheduleTime: '' });
    } else {
      const camp = campaigns.find(c => c.id === selectedCampaignId);
      if (camp) {
        setCampaignDraft({
          name: camp.name,
          tagId: camp.tagId,
          emailTemplateId: camp.emailTemplateId || '',
          smsTemplateId: camp.smsTemplateId || '',
          scheduleMode: camp.schedule ? 'later' : 'now',
          scheduleTime: camp.schedule || ''
        });
      }
    }
  }, [selectedCampaignId, campaigns]);

  // --- Handlers: Templates ---
  const handleCreateNewTemplate = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleSaveTemplate = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const insertVariable = (variable) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else {
      setActiveTemplate(prev => ({ ...prev, content: (prev.content || '') + injection }));
    }
  };

  const handleRerollPreview = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // --- Handlers: Campaigns ---
  const handleSaveDraft = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      };
      setCampaigns([newCamp, ...campaigns]);
      setSelectedCampaignId(newCamp.id);
      setToast('Campaign saved as draft locally.');
      return newCamp;
    } else {
      setCampaigns(prev => prev.map(c => c.id === selectedCampaignId ? {
        ...c,
        name: campaignDraft.name,
        tagId: campaignDraft.tagId,
        emailTemplateId: campaignDraft.emailTemplateId,
        smsTemplateId: campaignDraft.smsTemplateId,
        status: c.status === 'running' || c.status === 'scheduled' ? c.status : 'draft',
        schedule: campaignDraft.scheduleMode === 'later' ? campaignDraft.scheduleTime : ''
      } : c));
      setToast('Draft updated.');
      return campaigns.find(c => c.id === selectedCampaignId);
    }
  };

  const handleLaunchCampaign = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      };
      setCampaigns([newCamp, ...campaigns]);
      setSelectedCampaignId(newCamp.id);
    } else {
      setCampaigns(prev => prev.map(c => c.id === selectedCampaignId ? {
        ...c,
        name: campaignDraft.name,
        tagId: campaignDraft.tagId,
        emailTemplateId: campaignDraft.emailTemplateId,
        smsTemplateId: campaignDraft.smsTemplateId,
        status: newStatus,
        schedule: isScheduled ? campaignDraft.scheduleTime : '',
        metrics: c.metrics || { total: MOCK_TAGS.find(t=>t.id === campaignDraft.tagId)?.count || 0, sent: 0, failed: 0, pending: 0 }
      } : c));
    }

    console.log(`[BizReach] Payload compiled for ${campId}. Handoff to Background Workers initialized...`);
    setToast(isScheduled 
      ? 'Payload scheduled! Handed off to background workers.' 
      : 'Payload launched! Background workers are processing it.'
    );
    setActiveNode('dashboard');
  };

  // --- Handlers: Dashboard ---
  const handleRequestReport = (campName) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleEmailOnboarding = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        })
      });
    } catch (e) {
      console.error(e);
    }
    */

    // Simulate API call for the UI preview
    setTimeout(() => {
      setToast(`Setup instructions sent to ${currentUser?.email || 'your email'}! Please check your desktop inbox.`);
      setIsEmailingSetup(false);
    }, 1500);
  };

  // Mobile App Connect Handler (Simulates Intent Launch)
  const handleMobileAppConnect = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }, 1500);
  };

  // =============================================================================
  // RENDER: TEMPLATES NODE
  // =============================================================================
  const renderTemplatesNode = () => (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden">
      {/* Control Bar */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex-1 w-full sm:max-w-xs relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1 block">Active Template</label>
          <div className="relative">
            <select 
              value={selectedTemplateId} 
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={isEditing}
              className="w-full appearance-none bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-black text-sm rounded-xl py-3 pl-4 pr-10 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type.toUpperCase()})</option>
              ))}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={handleCreateNewTemplate} disabled={isEditing} className="flex-1 sm:flex-none py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md border-b-4 border-green-700 disabled:opacity-50"><Plus size={16} /> Create</button>
          <button onClick={() => setIsEditing(!isEditing)} className={`flex-1 sm:flex-none py-3 px-4 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md border-b-4 ${isEditing ? 'bg-red-500 hover:bg-red-600 text-white border-red-700' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800'}`}>
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </button>
          <button disabled={isEditing} className="py-3 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"><Download size={16} /> Import / Export</button>
        </div>
      </div>

      {/* Edit Controls */}
      {isEditing && activeTemplate && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-900/50 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <input type="text" value={activeTemplate.name} onChange={(e) => setActiveTemplate({...activeTemplate, name: e.target.value})} placeholder="Template Name..." className="flex-1 bg-white dark:bg-gray-900 border-2 border-yellow-300 dark:border-yellow-700 px-3 py-2 rounded-lg font-black text-sm outline-none focus:border-yellow-500 dark:text-gray-100" />
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg">
              <button onClick={() => setActiveTemplate({...activeTemplate, type: 'sms'})} className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1 ${activeTemplate.type === 'sms' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><MessageSquare size={14}/> SMS</button>
              <button onClick={() => setActiveTemplate({...activeTemplate, type: 'email'})} className={`px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1 ${activeTemplate.type === 'email' ? 'bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><Mail size={14}/> Email</button>
            </div>
          </div>
          <button onClick={handleSaveTemplate} className="w-full sm:w-auto py-2 px-6 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-black rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border-b-2 border-yellow-700"><Save size={16} /> Save Changes</button>
        </div>
      )}

      {isEditing && (
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-3 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-[10px] font-black uppercase text-gray-400 shrink-0 flex items-center gap-1"><Plus size={12}/> Insert Variable:</span>
          {AVAILABLE_VARIABLES.map(v => (
            <button key={v} onClick={() => insertVariable(v)} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold whitespace-nowrap hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-800">{`{{${v}}}`}</button>
          ))}
        </div>
      )}

      {/* Visual Canvas */}
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 relative">
        {!isEditing && (
          <div className="absolute top-4 right-4 z-10">
            <button onClick={handleRerollPreview} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full shadow-md text-xs font-black text-gray-700 dark:text-gray-300 hover:bg-gray-50 active:scale-95 transition-all"><Play size={14} className="text-green-500" /> Reroll Spintax Preview</button>
          </div>
        )}
        
        {activeTemplate?.type === 'sms' && (
          <div className="flex justify-center items-center py-8">
            <div className="relative w-[320px] h-[550px] bg-white dark:bg-gray-900 border-[12px] border-gray-800 dark:border-black rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 dark:bg-black rounded-b-3xl z-20"></div>
              <div className="bg-gray-100 dark:bg-gray-800 pt-8 pb-3 px-4 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 shadow-sm z-10">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mb-1 shadow-inner"><Smartphone size={20} className="text-white" /></div>
                  <span className="text-xs font-black text-gray-800 dark:text-gray-200 tracking-tight">{previewLead.business_name}</span>
                </div>
              </div>
              <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-4 flex flex-col justify-end overflow-y-auto">
                <div className="flex justify-end mb-2">
                  {isEditing ? (
                    <textarea value={activeTemplate.content} onChange={(e) => setActiveTemplate({ ...activeTemplate, content: e.target.value })} placeholder="Type your Spintax SMS here..." className="w-full max-w-[250px] p-4 bg-blue-600 text-white rounded-2xl rounded-br-sm outline-none resize-none h-48 text-sm shadow-md" />
                  ) : (
                    <div className="max-w-[250px] p-4 bg-blue-600 text-white rounded-2xl rounded-br-sm shadow-md text-sm whitespace-pre-wrap leading-relaxed">{previewRender || <span className="italic opacity-60">Empty message...</span>}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTemplate?.type === 'email' && (
          <div className="flex justify-center items-center py-8 px-4 w-full h-full">
            <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center border-b border-gray-200 dark:border-gray-700 gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400 shadow-sm"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400 shadow-sm"></div>
                <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm"></div>
                <span className="ml-4 text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1"><Mail size={14} /> New Message</span>
              </div>
              
              <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center shrink-0">
                <span className="text-gray-400 font-bold w-16 sm:w-20 text-xs sm:text-sm">From:</span>
                {isEditing ? (
                  <input type="text" value={activeTemplate.sender_name || ''} onChange={(e) => setActiveTemplate({ ...activeTemplate, sender_name: e.target.value })} placeholder="Display Name (e.g. John Doe)" className="flex-1 bg-transparent outline-none font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm" />
                ) : (
                  <div className="flex items-center gap-2"><span className="font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">{previewSenderRender || 'Default Sender'}</span><span className="text-gray-400 text-[10px] sm:text-xs font-bold">&lt;system@bizreach.app&gt;</span></div>
                )}
              </div>

              <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center shrink-0">
                <span className="text-gray-400 font-bold w-16 sm:w-20 text-xs sm:text-sm">Reply-To:</span>
                {isEditing ? (
                  <input type="text" value={activeTemplate.reply_to || ''} onChange={(e) => setActiveTemplate({ ...activeTemplate, reply_to: e.target.value })} placeholder="email@yourdomain.com" className="flex-1 bg-transparent outline-none font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm" />
                ) : (
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">{previewReplyToRender || <span className="italic text-gray-400">Not set</span>}</span>
                )}
              </div>

              <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center shrink-0">
                <span className="text-gray-400 font-bold w-16 sm:w-20 text-xs sm:text-sm">To:</span>
                <span className="text-gray-800 dark:text-gray-200 font-black text-xs sm:text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">{previewLead.business_name}</span>
              </div>
              
              <div className="px-6 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center shrink-0">
                <span className="text-gray-400 font-bold w-16 sm:w-20 text-xs sm:text-sm">Subject:</span>
                {isEditing ? (
                  <input type="text" value={activeTemplate.subject || ''} onChange={(e) => setActiveTemplate({ ...activeTemplate, subject: e.target.value })} placeholder="Email Subject..." className="flex-1 bg-transparent outline-none font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm" />
                ) : (
                  <span className="font-bold text-gray-800 dark:text-gray-200 text-xs sm:text-sm">{previewSubjectRender || 'No Subject'}</span>
                )}
              </div>

              <div className="px-6 pt-3 bg-gray-50 dark:bg-gray-950 flex gap-2 shrink-0">
                <button onClick={() => setEmailBodyMode('text')} className={`px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-t-xl transition-colors border-t border-x ${emailBodyMode === 'text' ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><div className="flex items-center gap-1.5"><FileText size={14}/> Plain Text</div></button>
                <button onClick={() => setEmailBodyMode('html')} className={`px-4 py-2 text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-t-xl transition-colors border-t border-x ${emailBodyMode === 'html' ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-blue-600 dark:text-blue-400' : 'bg-transparent border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}><div className="flex items-center gap-1.5"><Code size={14}/> HTML Body</div></button>
              </div>
              <div className="p-6 bg-white dark:bg-gray-900 flex-1 min-h-[250px] sm:min-h-[300px] border-t border-gray-200 dark:border-gray-700">
                {emailBodyMode === 'text' && (
                  isEditing ? <textarea value={activeTemplate.content || ''} onChange={(e) => setActiveTemplate({ ...activeTemplate, content: e.target.value })} placeholder="Type your Plain Text email body here..." className="w-full h-full min-h-[200px] bg-transparent outline-none resize-none text-gray-800 dark:text-gray-200 leading-relaxed text-xs sm:text-sm" />
                  : <div className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{previewRender || <span className="italic opacity-60">Empty plain text body...</span>}</div>
                )}
                {emailBodyMode === 'html' && (
                  isEditing ? <textarea value={activeTemplate.html_content || ''} onChange={(e) => setActiveTemplate({ ...activeTemplate, html_content: e.target.value })} placeholder="<p>Type your HTML code here...</p>" className="w-full h-full min-h-[200px] bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 outline-none resize-none text-gray-800 dark:text-gray-300 font-mono text-[10px] sm:text-xs shadow-inner leading-relaxed" />
                  : <div className="min-h-[200px] bg-white dark:bg-gray-900 rounded-xl">{previewHtmlRender ? <div className="prose prose-sm max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: previewHtmlRender }} /> : <span className="italic opacity-60 text-xs sm:text-sm text-gray-800 dark:text-gray-200">Empty HTML body...</span>}</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // =============================================================================
  // RENDER: CAMPAIGNS NODE (Campaign Assembly)
  // =============================================================================
  const renderCampaignsNode = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // =============================================================================
  // RENDER: DASHBOARD NODE (Mission Control)
  // =============================================================================
  const renderDashboardNode = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // =============================================================================
  // MAIN RENDER SHELL
  // =============================================================================
  return (
    <div className="h-[100dvh] bg-gray-100 dark:bg-gray-950 flex flex-col font-sans overflow-hidden">
      
      {/* ── 1. THE FLOWCHART NAVIGATION NODE BAR ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-center shadow-sm relative z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-4 max-w-4xl w-full justify-between sm:justify-center overflow-x-auto custom-scrollbar pb-1 sm:pb-0">
          
          <button onClick={() => setActiveNode('templates')} className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm transition-all whitespace-nowrap ${activeNode === 'templates' ? 'bg-blue-600 text-white shadow-md border-b-4 border-blue-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeNode === 'templates' ? 'bg-white text-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>1</div>
            Templates
          </button>
          <div className="h-0.5 w-8 sm:w-16 bg-gray-300 dark:bg-gray-700 shrink-0 hidden sm:block"></div>
          
          <button onClick={() => setActiveNode('campaigns')} className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm transition-all whitespace-nowrap ${activeNode === 'campaigns' ? 'bg-white text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeNode === 'campaigns' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>2</div>
            Campaigns
          </button>
          <div className="h-0.5 w-8 sm:w-16 bg-gray-300 dark:bg-gray-700 shrink-0 hidden sm:block"></div>
          
          <button onClick={() => setActiveNode('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-sm transition-all whitespace-nowrap ${activeNode === 'dashboard' ? 'bg-blue-600 text-white shadow-md border-b-4 border-blue-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${activeNode === 'dashboard' ? 'bg-white text-blue-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>3</div>
            Dashboard
          </button>

        </div>
      </div>

      {/* ── TOAST OVERLAY ── */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4">
          <div className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 border border-gray-700">
            <CheckCircle2 size={16} className="text-green-400" /> {toast}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 sm:p-6 overflow-hidden">
        {activeNode === 'templates' && renderTemplatesNode()}
        {activeNode === 'campaigns' && renderCampaignsNode()}
        {activeNode === 'dashboard' && renderDashboardNode()}
      </div>
    </div>
  );
}