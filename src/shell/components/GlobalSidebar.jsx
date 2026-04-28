import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Store, Layers, X, Zap, Megaphone, Download } from "lucide-react";
import { doc, getDoc } from "../demo-services/cloud-provider";
import { demoDb } from "../demo-services/cloud-provider";

export default function GlobalSidebar({ installedModules, activeShopId, isOpen, onClose, onSwitchShop, onInstallPWA }) {
  const [activeShopName, setActiveShopName] = useState("");

  useEffect(() => {
    if (!activeShopId) {
      setActiveShopName("");
      return;
    }
    const fetchShopName = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        } else {
          setActiveShopName(activeShopId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchShopName();
  }, [activeShopId]);

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-900 flex flex-col text-white transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex flex-col border-b border-gray-800 relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
          
          {/* Shop Context Header */}
          {activeShopId ? (
            <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">Active Shop</p>
              <h1 className="text-xl font-black text-white leading-tight break-words pr-8">{activeShopName || "Loading..."}</h1>
              <p className="text-[10px] text-gray-500 font-bold mt-1 font-mono">ID: {activeShopId}</p>
            </div>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
                <Store size={20} className="text-white" />
              </div>
              <div>
                <h1 className="font-black text-xl tracking-tight leading-none">BIZ</h1>
                <p className="text-red-400 font-black tracking-widest text-[10px] uppercase mt-0.5">Hub</p>
              </div>
            </div>
          )}
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
          <Link to="/" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-white transition-colors font-bold text-sm">
            <Layers size={20} />
            <span>Modules</span>
          </Link>
          {installedModules.includes("POS") && activeShopId && (
            <Link to="/pos" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-white transition-colors font-bold text-sm">
              <Store size={20} />
              <span>POS Terminal</span>
            </Link>
          )}
          {installedModules.includes("IMS") && activeShopId && (
            <Link to="/inventory" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-white transition-colors font-bold text-sm">
              <Layers size={20} />
              <span>Inventory Management</span>
            </Link>
          )}
          {installedModules.includes("LEADS") && (
            <Link to="/leads" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-white transition-colors font-bold text-sm">
              <Zap size={20} />
              <span>BizLeads</span>
            </Link>
          )}
          {installedModules.includes("REACH") && (
            <Link to="/reach" onClick={onClose} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 text-gray-300 hover:text-white transition-colors font-bold text-sm">
              <Megaphone size={20} />
              <span>Biz Reach</span>
            </Link>
          )}
        </nav>

        <div className="p-4 space-y-2 border-t border-gray-800">
          <button 
            onClick={() => { onInstallPWA(); onClose(); }} 
            className="flex w-full items-center gap-3 p-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors font-bold text-sm"
          >
            <Download size={20} />
            <span>Install App</span>
          </button>
        </div>
        {activeShopId && onSwitchShop && (
          <div className="p-4 border-t border-gray-800">
            <button 
              onClick={() => { onSwitchShop(); onClose(); }} 
              className="flex w-full items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors font-bold text-sm uppercase tracking-widest"
            >
              <Store size={16} />
              <span>Switch Shop</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
