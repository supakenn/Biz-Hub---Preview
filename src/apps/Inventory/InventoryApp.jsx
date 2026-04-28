import { useEffect, useState } from "react";
import { Layers, RefreshCw, PlusCircle, Wifi, WifiOff, Download, Package, FileText, Plus, Folder, ChevronRight, LayoutGrid, Settings, Key, ArrowRightLeft, Shield, Trash2, Edit2, Check, Upload, Lock, Unlock, X } from "lucide-react";
import { useInventoryStore } from "./store/useInventoryStore";
import { AuthProvider, useAuth } from "../demo-services/state-manager";
import BaseModal from "../../shell/components/BaseModal";

function InventoryDashboard({ shopId, userRole, memberships, onToggleSidebar }) {
  const { 
    categories,
    nodes, 
    activeCategory,
    setActiveCategory,
    activeNode, 
    setActiveNode, 
    items, 
    syncQueue, 
    isSyncing, 
    addItem, 
    clearSyncQueue, 
    setSyncing,
    addCategory,
    addNode,
    moveNode,
    updateNode,
    deleteNode,
    updateItemField
  } = useInventoryStore();
  
  const { tier, itemCount, isLoading, user } = useAuth();
  const [offline, setOffline] = useState(!navigator.onLine);
  
  // Modals & Forms
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");
  const [schemaFields, setSchemaFields] = useState([]);
  const [jsonImportText, setJsonImportText] = useState("");
  const [previewItems, setPreviewItems] = useState([]);
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [shopStaff, setShopStaff] = useState([]);

  useEffect(() => {
    if (userRole === 'owner' || userRole === 'HEAD') {
      import("firebase/firestore").then(({ doc, getDoc }) => {
        import("../../firebase.js").then(({ demoDb }) => {
          getDoc(doc(demoDb, "shops", shopId)).then(snap => {
            if (snap.exists()) {
              setShopStaff(snap.data().staffEmails || []);
            }
          });
        });
      });
    }
  }, [shopId, userRole]);

  const [moveNodeModal, setMoveNodeModal] = useState({ isOpen: false, node: null });

  useEffect(() => {
    const handleOnline = () => setOffline(false);
    const handleOffline = () => setOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isSandboxLimitReached = tier === "sandbox" && (items.length >= 20 || itemCount >= 20);

  // -- Tree Navigation Logic --
  const getCategoryPath = (categoryId, path = []) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };
  const categoryPath = getCategoryPath(activeCategory?.id);
  const currentLevelCategories = categories.filter(c => c.parentId === (activeCategory?.id || null));
  const currentLevelNodes = nodes.filter(n => n.categoryId === (activeCategory?.id || null));

  // -- Actions --
  const handleAddCategory = (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    });
    setNewCategoryName("");
    setIsCreatingCategory(false);
  };

  const openNewNodeModal = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const openEditNodeModal = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleJSONImport = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      } else if (parsed && typeof parsed === 'object') {
        if (parsed.inventoryDb) {
          // It's a Biz POS export schema!
          itemsArray = Object.entries(parsed.inventoryDb).map(([k, v]) => ({
            item: k,
            value: v
          }));
        } else {
          // Generic object fallback
          itemsArray = Object.entries(parsed).map(([k, v]) => ({ 
            item: k, 
            value: typeof v === 'object' ? JSON.stringify(v) : v 
          }));
        }
      }

      if (itemsArray.length > 0) {
        const first = itemsArray[0];
        const newFields = [{ id: `col_${Date.now()}_id`, key: "id", name: "ID", type: "id", permissions: { default: "read", specificEditUsers: "" } }];
        let idx = 1;
        
        Object.keys(first).forEach(k => {
          if (k !== 'id') {
            const valType = typeof first[k];
            newFields.push({
              id: `col_${Date.now()}_${idx++}`,
              key: k.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              name: k.charAt(0).toUpperCase() + k.slice(1),
              type: valType === 'number' ? 'number' : 'text',
              permissions: { default: "edit", specificEditUsers: "" }
            });
          }
        });
        setSchemaFields(newFields);
        
        // Lock system generated items so staff can't delete them
        // Also ensure the item keys match the newly generated schema keys
        setPreviewItems(itemsArray.map(item => {
          const normalizedItem = { locked: true };
          Object.keys(item).forEach(k => {
            const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '_');
            normalizedItem[normalizedKey] = item[k];
          });
          return normalizedItem;
        }));
        
        setJsonImportText("");
      } else {
        alert("Could not extract any data from the provided JSON.");
      }
    } catch(e) {
      alert("Invalid JSON format. Please paste a valid JSON string.");
    }
  };

  const handleSaveNode = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      });
    } else {
      const newNode = {
        id: `node_${Date.now()}`,
        categoryId: activeCategory?.id || null,
        name: newNodeName.trim().replace(/ /g, '_'),
        schema: schemaFields,
        joinCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        assignedUsers
      };
      addNode(newNode);
      
      if (previewItems.length > 0) {
        previewItems.forEach((pItem, i) => {
          const newItem = { id: `inv_${Date.now()}_${i}`, nodeId: newNode.id };
          schemaFields.forEach(col => {
            if (col.type !== 'id') {
              newItem[col.key] = pItem[col.name] || pItem[col.key] || (col.type === 'number' ? 0 : '');
            }
          });
          newItem.locked = pItem.locked;
          addItem(newItem);
        });
      }
    }
    
    setIsSchemaModalOpen(false);
  };

  const handleDeleteNode = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }
  };

  const handleAddField = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }]);
  };

  const updateFieldDef = (id, key, value) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const updateFieldPermissions = (id, permKey, value) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleCreateEmptyItem = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    });
    addItem(newItem);
  };

  const handleSync = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }, 1500);
  };

  const activeItems = items.filter(i => i.nodeId === activeNode?.id);
  const isHead = userRole === 'owner' || userRole === 'HEAD';
  
  // --- STAFF AUTO-ROUTING ---
  const staffAssignedNodes = nodes.filter(n => n.assignedUsers?.includes(user?.email));
  
  useEffect(() => {
    if (!isHead && !activeNode && staffAssignedNodes.length > 0) {
      setActiveNode(staffAssignedNodes[0]);
    }
  }, [isHead, activeNode, staffAssignedNodes, setActiveNode]);

  return (
    <div className="flex flex-col h-[100dvh] bg-gray-50 dark:bg-gray-950 font-sans text-gray-900 dark:text-gray-100 overflow-hidden relative">
      
      {/* Header */}
      <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-4 sm:px-8 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <button onClick={onToggleSidebar} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors">
            <Layers size={24} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-md">
              <LayoutGrid size={16} />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-tight text-gray-900 dark:text-white truncate">
                Document Store
              </h1>
              <span className="text-[10px] tracking-widest text-gray-500 uppercase font-black">IMS Module</span>
            </div>
          </div>
          
          <span className="hidden sm:inline-block ml-4 text-[10px] font-black px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg uppercase tracking-widest">
            {isHead ? 'HEAD' : 'STAFF'}
          </span>
          
          {!isLoading && tier === "sandbox" && (
            <span className="hidden sm:inline-block bg-yellow-100 text-yellow-800 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest border border-yellow-200">
              Sandbox
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSync}
            disabled={isSyncing || syncQueue.length === 0}
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${syncQueue.length > 0 ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}
          >
            <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
            {isSyncing ? "Syncing..." : `Sync (${syncQueue.length})`}
          </button>
          {offline ? <WifiOff size={16} className="text-red-600 dark:text-red-400" /> : <Wifi size={16} className="text-blue-600 dark:text-blue-400" />}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 relative h-full custom-scrollbar">
        
        {/* --- STAFF DASHBOARD OVERRIDE --- */}
        {!isHead && staffAssignedNodes.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center animate-in fade-in">
            <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm max-w-sm">
              <Shield size={48} className="mx-auto mb-4 opacity-20 text-gray-500" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase tracking-widest">No access</p>
              <p className="text-xs font-medium text-gray-500 mt-2 leading-relaxed">You have not been assigned to any databases. Ask the shop owner to grant you access.</p>
            </div>
          </div>
        )}

        {/* --- STAFF TABS --- */}
        {!isHead && staffAssignedNodes.length > 0 && (
          <div className="flex overflow-x-auto gap-2 mb-6 pb-2 custom-scrollbar shrink-0 animate-in fade-in">
            {staffAssignedNodes.map(node => (
              <button 
                key={node.id} 
                onClick={() => setActiveNode(node)}
                className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all shadow-sm ${activeNode?.id === node.id ? 'bg-blue-600 text-white shadow-md border border-blue-700' : 'bg-white dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-800'}`}
              >
                {node.name.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}

        {isHead && (
        <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 mb-8 select-none bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <button 
            onClick={() => { setActiveCategory(null); setActiveNode(null); }}
            className={`flex items-center gap-1.5 transition-colors ${!activeCategory && !activeNode ? "text-gray-900 dark:text-white" : "hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"}`}
          >
            <Folder size={14} className={!activeCategory && !activeNode ? "text-blue-500 fill-blue-500/20" : ""} /> Root
          </button>
          
          {categoryPath.map((cat, idx) => (
            <div key={cat.id} className="flex items-center gap-2">
              <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
              <button 
                onClick={() => { setActiveCategory(cat); setActiveNode(null); }}
                className={`flex items-center gap-1.5 transition-colors ${activeCategory?.id === cat.id && !activeNode ? "text-gray-900 dark:text-white" : "hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"}`}
              >
                <Folder size={14} className={activeCategory?.id === cat.id && !activeNode ? "text-blue-500 fill-blue-500/20" : ""} /> {cat.name}
              </button>
            </div>
          ))}

          {activeNode && (
            <>
              <ChevronRight size={14} className="text-gray-300 dark:text-gray-700" />
              <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded-md">
                <FileText size={14} /> {activeNode.name.replace(/_/g, ' ')}
              </span>
            </>
          )}
        </div>
        )}

        {/* --- FOLDER EXPLORER VIEW (Categories & Nodes) --- */}
        {isHead && !activeNode && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">Folders & Databases</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              
              {/* Render Sub-Categories */}
              {currentLevelCategories.map(cat => (
                <button 
                  key={cat.id} 
                  onClick={() => setActiveCategory(cat)}
                  className="flex items-center gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 text-left group relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Folder size={24} className="fill-current opacity-20" />
                    <Folder size={24} className="absolute" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-gray-900 dark:text-white">{cat.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Category</p>
                  </div>
                </button>
              ))}

              {/* Render Nodes */}
              {currentLevelNodes.map(node => (
                <div key={node.id} className="relative group">
                  <button 
                    onClick={() => setActiveNode(node)}
                    className="w-full flex items-center gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl shadow-sm hover:shadow-md transition-all active:scale-95 text-left"
                  >
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="font-black text-sm text-gray-900 dark:text-white truncate">{node.name.replace(/_/g, ' ')}</h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Database</p>
                    </div>
                  </button>
                  {/* Node Actions */}
                  {isHead && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setMoveNodeModal({ isOpen: true, node }); }}
                      className="absolute top-2 right-2 p-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Move Database"
                    >
                      <ArrowRightLeft size={14} />
                    </button>
                  )}
                </div>
              ))}

              {/* Action Cards (Create) */}
              {isHead && (
                <>
                  {isCreatingCategory ? (
                    <form onSubmit={handleAddCategory} className="flex flex-col gap-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl shadow-sm">
                      <input 
                        autoFocus
                        placeholder="Folder Name"
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                      />
                      <div className="flex gap-2 mt-auto">
                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white font-black text-[10px] rounded-lg uppercase tracking-widest hover:bg-blue-700">Add</button>
                        <button type="button" onClick={() => setIsCreatingCategory(false)} className="flex-1 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-black text-[10px] rounded-lg uppercase tracking-widest">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => setIsCreatingCategory(true)} className="flex flex-col items-center justify-center gap-2 p-5 bg-transparent border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-2xl transition-all active:scale-95 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 min-h-[104px]">
                      <Plus size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">New Folder</span>
                    </button>
                  )}
                  
                  <button onClick={openNewNodeModal} className="flex flex-col items-center justify-center gap-2 p-5 bg-transparent border-2 border-dashed border-blue-300 dark:border-blue-900 hover:border-blue-500 dark:hover:border-blue-700 rounded-2xl transition-all active:scale-95 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 min-h-[104px]">
                    <Settings size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Build Database</span>
                  </button>
                </>
              )}
            </div>
            
            {currentLevelCategories.length === 0 && currentLevelNodes.length === 0 && !isHead && (
              <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">Folder is empty.</div>
            )}
          </div>
        )}

        {/* --- OPERATIONS UI (Active Database) --- */}
        {activeNode && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 flex-1 flex flex-col">
            
            {/* Database Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase">{activeNode.name.replace(/_/g, ' ')}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                    <Shield size={10} /> {activeItems.length} Records
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800">
                  <Key size={12} className="text-gray-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Code: <span className="text-gray-900 dark:text-white selection:bg-blue-200">{activeNode.joinCode}</span></span>
                </div>
                {isHead && (
                  <>
                    <button 
                      onClick={openEditNodeModal}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      title="Configure Database Schema"
                    >
                      <Settings size={16} />
                    </button>
                    <button 
                      onClick={handleDeleteNode}
                      className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      title="Delete Database"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
                <button 
                  onClick={handleCreateEmptyItem}
                  disabled={isSandboxLimitReached}
                  className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus size={14} /> New Record
                </button>
              </div>
            </div>

            {/* Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeItems.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                  {item.locked && (
                    <div className="absolute top-3 right-3 text-gray-300 dark:text-gray-700" title="System Locked Item">
                      <Lock size={12} />
                    </div>
                  )}
                  
                  {/* Dynamic Fields Mapping based on Schema */}
                  <div className="flex flex-col gap-4">
                    {activeNode.schema?.map(col => {
                      const defaultAccess = col.permissions?.default || 'read';
                      const specificUsers = (col.permissions?.specificEditUsers || "").toLowerCase().split(',').map(u=>u.trim()).filter(Boolean);
                      
                      let isReadOnly = true;
                      if (isHead) {
                        isReadOnly = false;
                      } else {
                        if (defaultAccess === 'edit') isReadOnly = false;
                        if (user?.email && specificUsers.includes(user.email.toLowerCase())) isReadOnly = false;
                      }

                      const val = item[col.key];

                      return (
                        <div key={col.key} className="flex flex-col gap-1">
                          <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 flex items-center justify-between">
                            {col.name}
                            {isReadOnly && !isHead && <Lock size={8} className="opacity-50" />}
                          </label>
                          
                          {col.type === 'id' ? (
                            <div className="font-mono text-xs font-bold text-gray-500">{item.id.split('_')[1] || item.id}</div>
                          ) : col.type === 'number' ? (
                            <div className="flex items-center gap-2">
                              <button 
                                disabled={isReadOnly}
                                onClick={() => updateItemField(item.id, col.key, Number(val || 0) - 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                              >-</button>
                              <input 
                                type="number" 
                                value={val || 0}
                                disabled={isReadOnly}
                                onChange={(e) => updateItemField(item.id, col.key, Number(e.target.value))}
                                className="w-20 text-center bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg py-1.5 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
                              />
                              <button 
                                disabled={isReadOnly}
                                onClick={() => updateItemField(item.id, col.key, Number(val || 0) + 1)}
                                className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
                              >+</button>
                            </div>
                          ) : col.type === 'enum' ? (
                            <select 
                              value={val || ''}
                              disabled={isReadOnly}
                              onChange={(e) => updateItemField(item.id, col.key, e.target.value)}
                              className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg py-2 px-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50"
                            >
                              <option value="">Select Status</option>
                              {col.options?.split(',').map(opt => opt.trim()).filter(Boolean).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                          ) : (
                            <input 
                              type="text" 
                              value={val || ''}
                              disabled={isReadOnly}
                              onChange={(e) => updateItemField(item.id, col.key, e.target.value)}
                              placeholder={`Enter ${col.name}`}
                              className={`w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg py-2 px-3 text-xs font-bold text-gray-900 dark:text-white outline-none focus:border-blue-500 disabled:opacity-50 ${isReadOnly ? 'border-transparent bg-transparent px-0 text-gray-700 dark:text-gray-300' : ''}`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              {activeItems.length === 0 && (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-300 dark:border-gray-800">
                  <Package size={48} className="mb-4 opacity-20" />
                  <span className="text-xs font-black uppercase tracking-widest">Database is Empty</span>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* SCHEMA BUILDER MODAL */}
      <BaseModal isOpen={isSchemaModalOpen} onClose={() => setIsSchemaModalOpen(false)} title={isEditingNode ? "Configure Database" : "Schema Builder"}>
        <div className="flex flex-col gap-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto custom-scrollbar pr-2 pb-8">
          
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-xl flex items-start gap-4">
            <Settings size={20} className="text-blue-500 mt-1 shrink-0" />
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-blue-800 dark:text-blue-300 mb-1">Structural Configuration</h3>
              <p className="text-[10px] font-bold text-blue-600/80 dark:text-blue-400/80 leading-relaxed">
                Define the schema rules for this database. Use "Staff Access" to lock fields from normal users. You can grant specific users edit access by entering their emails.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1">Database Name</label>
            <input 
              value={newNodeName} 
              onChange={e => setNewNodeName(e.target.value)}
              placeholder="e.g. Employee_Log"
              className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-blue-500 font-black text-gray-900 dark:text-white"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Shield size={16} className="text-blue-500" /> Database Access Managers
            </h3>
            <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
              Select staff members who will have full access to this specific database. They will bypass the folder structure and directly manage this node.
            </p>
            <div className="flex gap-2">
              <select 
                id="staffAssignSelect"
                className="flex-1 p-3 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:border-blue-500 font-bold text-xs text-gray-900 dark:text-white"
              >
                <option value="">Select a staff member...</option>
                {shopStaff.filter(email => !assignedUsers.includes(email) && email !== user?.email).map(email => (
                  <option key={email} value={email}>{email}</option>
                ))}
              </select>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const val = document.getElementById("staffAssignSelect").value;
                  if (val && !assignedUsers.includes(val)) {
                    setAssignedUsers([...assignedUsers, val]);
                    document.getElementById("staffAssignSelect").value = "";
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] px-6 rounded-xl active:scale-95 transition-all shadow-md shrink-0"
              >
                Assign
              </button>
            </div>
            
            {assignedUsers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {assignedUsers.map(email => (
                  <span key={email} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider flex items-center gap-2">
                    {email}
                    <button onClick={(e) => { e.preventDefault(); setAssignedUsers(assignedUsers.filter(u => u !== email)); }} className="hover:text-red-500 transition-colors"><X size={12} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {!isEditingNode && (
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 pl-1 flex items-center gap-1">
                <Upload size={12} /> Pre-Fill from POS JSON (Optional)
              </label>
              <div className="flex gap-2">
                <textarea 
                  value={jsonImportText}
                  onChange={e => setJsonImportText(e.target.value)}
                  placeholder='[{"ingredient": "Sugar", "qty": 10}, ...]'
                  className="w-full p-3 h-20 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-blue-500 font-mono text-xs text-gray-900 dark:text-white resize-none"
                />
                <button 
                  onClick={handleJSONImport}
                  className="bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-black text-[10px] uppercase tracking-widest px-4 rounded-xl transition-colors"
                >
                  Parse
                </button>
              </div>
              {previewItems.length > 0 && (
                <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mt-2">
                  <Check size={10} className="inline mr-1" /> {previewItems.length} rows parsed and will be locked upon deployment.
                </p>
              )}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-800 pb-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-400 pl-1">Data Columns</label>
              <button onClick={handleAddField} className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                <Plus size={12} /> Add Field
              </button>
            </div>
            
            <div className="flex flex-col gap-4">
              {schemaFields.map((field, idx) => (
                <div key={field.id} className="flex flex-col gap-3 bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative group">
                  {field.type !== 'id' && (
                    <button 
                      onClick={() => setSchemaFields(fields => fields.filter(f => f.id !== field.id))}
                      className="absolute -top-2 -right-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-1.5 rounded-full hover:bg-red-200 dark:hover:bg-red-800 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                      <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">Column Name</span>
                      <input 
                        disabled={field.type === 'id'}
                        value={field.name}
                        onChange={e => {
                          updateFieldDef(field.id, 'name', e.target.value);
                          if (!isEditingNode) {
                            updateFieldDef(field.id, 'key', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                          }
                        }}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500 disabled:opacity-50"
                      />
                    </div>
                    
                    <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                      <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">Data Type</span>
                      <select 
                        disabled={field.type === 'id'}
                        value={field.type}
                        onChange={e => updateFieldDef(field.id, 'type', e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="id">ID (Auto)</option>
                        <option value="text">Short Text</option>
                        <option value="longtext">Remarks</option>
                        <option value="number">Counting</option>
                        <option value="enum">Status (Enum)</option>
                        <option value="currency">Value</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1 col-span-2 sm:col-span-2">
                      <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">Staff Default Access</span>
                      <select 
                        disabled={field.type === 'id'}
                        value={field.permissions?.default}
                        onChange={e => updateFieldPermissions(field.id, 'default', e.target.value)}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="read">Read-Only (Locked)</option>
                        <option value="edit">Editable</option>
                        <option value="hidden">Hidden</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Fields (Enum Options, Specific User Access) */}
                  {(field.type === 'enum' || field.type !== 'id') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      {field.type === 'enum' && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-widest font-black text-gray-400">Enum Options (Comma Separated)</span>
                          <input 
                            value={field.options || ""}
                            onChange={e => updateFieldDef(field.id, 'options', e.target.value)}
                            placeholder="e.g. Pending, Complete, Failed"
                            className="w-full p-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                      
                      {field.type !== 'id' && field.permissions?.default === 'read' && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] uppercase tracking-widest font-black text-blue-500">Allowed Editors (Emails)</span>
                          <input 
                            value={field.permissions?.specificEditUsers || ""}
                            onChange={e => updateFieldPermissions(field.id, 'specificEditUsers', e.target.value)}
                            placeholder="user1@biz.com, user2@biz.com"
                            className="w-full p-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                          />
                        </div>
                      )}
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>

          <div className="pt-6">
            <button onClick={handleSaveNode} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-2">
              <Check size={16} /> {isEditingNode ? "Update Database Rules" : "Deploy Database"}
            </button>
          </div>
        </div>
      </BaseModal>

      {/* MOVE NODE MODAL */}
      <BaseModal isOpen={moveNodeModal.isOpen} onClose={() => setMoveNodeModal({ isOpen: false, node: null })} title="Move Database">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Select a new folder for <span className="text-gray-900 dark:text-white">{moveNodeModal.node?.name}</span>:</p>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
            <button 
              onClick={() => { moveNode(moveNodeModal.node.id, null); setMoveNodeModal({ isOpen: false, node: null }); }}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors text-left"
            >
              <Folder size={16} className="text-blue-500" /> <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest">Root Folder</span>
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => { moveNode(moveNodeModal.node.id, cat.id); setMoveNodeModal({ isOpen: false, node: null }); }}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-xl border border-gray-200 dark:border-gray-800 transition-colors text-left"
              >
                <Folder size={16} className="text-gray-400" /> <span className="text-xs font-black text-gray-900 dark:text-white">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </BaseModal>

    </div>
  );
}

export default function InventoryApp({ user, memberships, shopId, onToggleSidebar, userRole }) {
  return (
    <AuthProvider user={user} shopId={shopId}>
      <InventoryDashboard shopId={shopId} userRole={userRole} memberships={memberships} onToggleSidebar={onToggleSidebar} />
    </AuthProvider>
  );
}
