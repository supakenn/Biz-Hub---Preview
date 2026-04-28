import React, { useState, useEffect } from 'react';
import { 
  X, 
  Store, 
  Plus, 
  Loader2, 
  ChevronRight, 
  Building2,
  AlertCircle
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  serverTimestamp 
} from "../demo-services/cloud-provider";
import { demoDb } from "../demo-services/cloud-provider";
import { useWorkspace } from "../demo-services/state-manager";

export default function BranchSelectorModal({ isOpen, onClose, onBranchSelected }) {
  const { currentBusinessId, setCurrentBranchId } = useWorkspace();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentBusinessId) return;

    setLoading(true);
    const branchesRef = collection(demoDb, 'businesses', currentBusinessId, 'branches');
    
    const unsubscribe = onSnapshot(branchesRef, (snapshot) => {
      const branchList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setBranches(branchList);
      setLoading(false);
      
      // If zero branches, force show the create form
      if (branchList.length === 0) {
        setShowCreateForm(true);
      }
    }, (error) => {
      console.error("Error fetching branches:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, currentBusinessId]);

  const handleSelect = (branchId) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleCreateBranch = async (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      });
      
      handleSelect(docRef.id);
    } catch (error) {
      console.error("Error creating branch:", error);
      alert("Failed to create branch.");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 text-blue-600 rounded-xl">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">Select Branch</h2>
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-500">Operating Context Required</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="text-blue-500 animate-spin" size={32} />
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Scanning Locations...</p>
            </div>
          ) : showCreateForm || branches.length === 0 ? (
            /* Create Branch Form / Onboarding */
            <div className="space-y-6">
              {branches.length === 0 && (
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex gap-3 items-start">
                  <AlertCircle size={18} className="text-yellow-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-yellow-700 dark:text-yellow-500 leading-relaxed">
                    You haven't added any physical shops/branches to this Business HQ yet. Every POS needs a location to log reports.
                  </p>
                </div>
              )}
              
              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="e.g. Main Street Cart or Uptown HQ"
                    className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl p-4 font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating || !newBranchName.trim()}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  {isCreating ? 'REGISTERING...' : 'CREATE BRANCH & OPEN POS'}
                </button>
                {branches.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="w-full text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-2"
                  >
                    Cancel
                  </button>
                )}
              </form>
            </div>
          ) : (
            /* Branch List Selection */
            <div className="space-y-3">
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => handleSelect(branch.id)}
                  className="w-full group flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 hover:bg-white dark:hover:bg-blue-600 border border-gray-200 dark:border-white/5 hover:border-blue-500/50 rounded-2xl transition-all shadow-sm hover:shadow-xl hover:shadow-blue-600/10 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-black/20 rounded-xl text-blue-600 group-hover:text-white group-hover:bg-transparent transition-colors">
                      <Store size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-900 dark:text-white group-hover:text-white transition-colors">{branch.name}</p>
                      <p className="text-[9px] font-bold text-gray-500 group-hover:text-blue-100 uppercase tracking-widest transition-colors">Active Branch</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-gray-400 group-hover:text-white transition-all transform group-hover:translate-x-1" />
                </button>
              ))}
              
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full mt-4 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl text-gray-500 hover:text-blue-500 hover:border-blue-500/50 transition-all font-black text-xs uppercase tracking-widest"
              >
                <Plus size={16} />
                Add Another Branch
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 text-center">
           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
              Security: Operating context is logged per session
           </p>
        </div>
      </div>
    </div>
  );
}
