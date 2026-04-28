import React, { useState } from 'react';
import { useWorkspace } from "../demo-services/state-manager";
import { useAuth } from "../demo-services/state-manager";
import { doc, writeBatch } from "../demo-services/cloud-provider";
import { demoDb } from "../demo-services/cloud-provider";
import { Building2, Plus, Rocket, Loader2 } from 'lucide-react';

export default function BusinessLobby() {
  const { currentUser } = useAuth();
  const { memberships, setCurrentBusinessId } = useWorkspace();
  const [isCreating, setIsCreating] = useState(false);
  const [bizName, setBizName] = useState('');

  const hasBusiness = Object.keys(memberships || {}).length > 0;

  const handleCreateBusiness = async (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      });

      // 2. Update the User's memberships map
      const userRef = doc(demoDb, 'users', currentUser.uid);
      batch.set(userRef, {
        memberships: {
          [bizId]: 'owner'
        }
      }, { merge: true });

      await batch.commit();
      
      // Auto-select the newly created business
      setCurrentBusinessId(bizId);
      
    } catch (err) {
      console.error("Error creating business:", err);
      alert("Failed to create business HQ.");
    } finally {
      setIsCreating(false);
    }
  };

  // If they already have a business, show a loading/transition state
  if (hasBusiness) {
    return (
      <div className="flex flex-col items-center justify-center h-[100dvh] bg-gray-900 text-white">
        <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="font-black text-sm uppercase tracking-[0.3em] animate-pulse">Syncing Workspace...</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-gray-950 text-gray-100 p-6 font-sans relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="bg-gray-900/50 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/5 relative z-10">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_20px_50px_-10px_rgba(37,99,235,0.5)] border-b-4 border-blue-800">
            <Building2 size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">Initialize HQ</h1>
          <p className="text-sm text-gray-400 mt-3 font-bold leading-relaxed px-4">
            Welcome to the Hub. Every empire starts with a single headquarters. Let's register your first business.
          </p>
        </div>

        <form onSubmit={handleCreateBusiness} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
              Business or Franchise Name
            </label>
            <input
              type="text"
              required
              autoFocus
              value={bizName}
              onChange={(e) => setBizName(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold shadow-inner"
              placeholder="e.g., Angel's Burger Corp"
            />
          </div>

          <button
            type="submit"
            disabled={isCreating || !bizName.trim()}
            className="w-full group bg-blue-600 hover:bg-blue-500 text-white font-black py-4 px-6 rounded-2xl shadow-[0_15px_35px_-5px_rgba(37,99,235,0.4)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-3 border-b-4 border-blue-800"
          >
            {isCreating ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span className="uppercase tracking-widest text-xs">Creating HQ...</span>
              </>
            ) : (
              <>
                <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                <span className="uppercase tracking-widest text-xs">Create Headquarters</span>
                <Rocket size={18} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-gray-600 mt-8 font-bold uppercase tracking-widest">
          Biz Hub Suite · Enterprise Architecture
        </p>
      </div>
    </div>
  );
}
