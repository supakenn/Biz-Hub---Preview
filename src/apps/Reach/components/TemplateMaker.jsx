import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Edit2,
  Download,
  Mail,
  Smartphone,
  ChevronDown,
  Save,
  X,
  Play,
  Code,
  MessageSquare,
} from 'lucide-react';
import { useReach } from "../demo-services/state-manager";

export default function TemplateMaker() {
  const { 
    templates, 
    saveTemplate, 
    deleteTemplate, 
    parseSpintax, 
    AVAILABLE_VARIABLES 
  } = useReach();

  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState(null);
  
  // Preview State
  const [previewLead, setPreviewLead] = useState({ 
    business_name: "Sample Business", 
    category: "Retail", 
    location: "Manila", 
    remark: "saw your profile", 
    phone: "+639123456789", 
    email: "contact@example.com" 
  });
  const [emailBodyMode, setEmailBodyMode] = useState('text');

  // Sync activeTemplate with selectedTemplateId
  useEffect(() => {
    if (selectedTemplateId === 'new') return; // Don't wipe if we are creating new

    if (templates.length > 0) {
      const initialId = selectedTemplateId || (templates[0]?.id).toString();
      const t = templates.find(t => t.id.toString() === initialId) || templates[0];
      setActiveTemplate({ ...t });
      if (!selectedTemplateId) setSelectedTemplateId(t.id.toString());
    } else {
      setActiveTemplate(null);
    }
  }, [selectedTemplateId, templates]);

  const handleCreateNewTemplate = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    };
    setActiveTemplate(newTemplate);
    setSelectedTemplateId('new');
    setIsEditing(true);
  };

  const handleSave = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }
  };

  const insertVariable = (variable) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else {
      setActiveTemplate(prev => ({ ...prev, content: (prev.content || '') + injection }));
    }
  };

  if (!activeTemplate && templates.length === 0 && !isEditing) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-black text-gray-800 dark:text-gray-200">No Templates Found</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first outreach template to get started.</p>
          <button onClick={handleCreateNewTemplate} className="py-3 px-6 bg-blue-600 text-white font-black rounded-xl flex items-center gap-2 mx-auto">
            <Plus size={20} /> Create Template
          </button>
        </div>
      </div>
    );
  }

  const previewRender = parseSpintax(activeTemplate?.content || '', previewLead);
  const previewSubjectRender = parseSpintax(activeTemplate?.subject || '', previewLead);
  const previewSenderRender = parseSpintax(activeTemplate?.sender_name || '', previewLead);
  const previewReplyToRender = activeTemplate?.reply_to;
  const previewHtmlRender = parseSpintax(activeTemplate?.html_content || '', previewLead);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden">
      {/* Control Bar */}
      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shrink-0">
        <div className="flex-1 w-full sm:max-w-xs relative">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1 block">Active Template</label>
          <div className="relative">
            <select 
              value={selectedTemplateId} 
              onChange={(e) => {
                setSelectedTemplateId(e.target.value);
                setIsEditing(false);
              }}
              disabled={isEditing}
              className="w-full appearance-none bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-100 font-black text-sm rounded-xl py-3 pl-4 pr-10 outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.type.toUpperCase()})</option>
              ))}
              {selectedTemplateId === 'new' && <option value="new">New Template*</option>}
            </select>
            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button onClick={handleCreateNewTemplate} disabled={isEditing} className="flex-1 sm:flex-none py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md border-b-4 border-green-700 disabled:opacity-50"><Plus size={16} /> Create</button>
          <button onClick={() => setIsEditing(!isEditing)} className={`flex-1 sm:flex-none py-3 px-4 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md border-b-4 ${isEditing ? 'bg-red-500 hover:bg-red-600 text-white border-red-700' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-800'}`}>
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
            {isEditing ? 'Cancel' : 'Edit'}
          </button>
          <button disabled={isEditing} className="py-3 px-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-black rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"><Download size={16} /> Export</button>
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
          <button onClick={handleSave} className="w-full sm:w-auto py-2 px-6 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 font-black rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 border-b-2 border-yellow-700"><Save size={16} /> Save Changes</button>
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
      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-950 relative custom-scrollbar">
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
}
