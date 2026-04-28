import { useState } from "react";
import { doc, updateDoc, arrayUnion } from "../demo-services/cloud-provider";
import { demoDb } from "../demo-services/cloud-provider";
import { useNavigate } from "react-router-dom";
import { Menu, ShoppingCart, Package, Zap, Megaphone, Briefcase } from "lucide-react";

export default function HubDashboard({ installedModules, activeShopId, onShopSelect, memberships, user, onToggleSidebar }) {
  const [installing, setInstalling] = useState(null);
  const navigate = useNavigate();

  const handleInstall = async (moduleCode) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      });
    } catch (error) {
      console.error("Install failed", error);
    }
    setInstalling(null);
  };

  const handleLaunch = (path) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      } else {
        alert("Please select a shop first! Use the menu to manage your shops.");
      }
      return;
    }
    navigate(path);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <header className="p-4 sm:p-6 flex items-center gap-4 shrink-0">
        <button onClick={onToggleSidebar} className="p-2 -ml-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-sm">
          <Menu size={20} className="text-gray-800 dark:text-gray-200" />
        </button>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-gray-900 dark:text-gray-100">Modules</h2>
      </header>
      
      <div className="flex-1 p-4 sm:p-6 pt-0 overflow-y-auto custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-4 transition-all hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-50 dark:bg-red-900/10 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                <ShoppingCart size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 text-base truncate">Point of Sale</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">High-speed register</p>
              </div>
            </div>
            
            {installedModules.includes("POS") ? (
              <button onClick={() => handleLaunch("/pos")} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-md shadow-red-500/20 transition-all active:scale-95">
                Launch Module
              </button>
            ) : (
              <button onClick={() => handleInstall("POS")} disabled={installing === "POS"} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                {installing === "POS" ? "Installing..." : "Install Module"}
              </button>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-4 transition-all hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-50 dark:bg-green-900/10 text-green-600 rounded-2xl flex items-center justify-center shrink-0">
                <Package size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 text-base truncate">Inventory</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Stock tracking</p>
              </div>
            </div>
            
            {installedModules.includes("IMS") ? (
              <button onClick={() => handleLaunch("/inventory")} className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-md shadow-green-500/20 transition-all active:scale-95">
                Launch Module
              </button>
            ) : (
              <button onClick={() => handleInstall("IMS")} disabled={installing === "IMS"} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                {installing === "IMS" ? "Installing..." : "Install Module"}
              </button>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-4 transition-all hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-violet-50 dark:bg-violet-900/10 text-violet-600 rounded-2xl flex items-center justify-center shrink-0">
                <Zap size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 text-base truncate">BizLeads</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Lead discovery</p>
              </div>
            </div>
            
            {installedModules.includes("LEADS") ? (
              <button onClick={() => navigate("/leads")} className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-md shadow-violet-500/20 transition-all active:scale-95">
                Launch Module
              </button>
            ) : (
              <button onClick={() => handleInstall("LEADS")} disabled={installing === "LEADS"} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                {installing === "LEADS" ? "Installing..." : "Install Module"}
              </button>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-4 transition-all hover:shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-orange-50 dark:bg-orange-900/10 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                <Megaphone size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black uppercase tracking-tight text-gray-900 dark:text-gray-100 text-base truncate">Biz Reach</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Marketing Swarm</p>
              </div>
            </div>
            
            {installedModules.includes("REACH") ? (
              <button onClick={() => navigate("/reach")} className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl uppercase tracking-widest text-[10px] shadow-md shadow-orange-500/20 transition-all active:scale-95">
                Launch Module
              </button>
            ) : (
              <button onClick={() => handleInstall("REACH")} disabled={installing === "REACH"} className="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">
                {installing === "REACH" ? "Installing..." : "Install Module"}
              </button>
            )}
          </div>

          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col gap-4 transition-all hover:shadow-lg opacity-75">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-2xl flex items-center justify-center shrink-0">
                <Briefcase size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black uppercase tracking-tight text-gray-400 dark:text-gray-500 text-base truncate">Biz Ops</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate italic">Under Development</p>
              </div>
            </div>
            
            <button disabled className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-400 font-black rounded-xl uppercase tracking-widest text-[10px] cursor-not-allowed border border-dashed border-gray-300 dark:border-gray-700">
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
