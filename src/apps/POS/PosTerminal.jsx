import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

import {
  Settings,
  ClipboardPaste,
  MessageCircle,
  Mail,
  Phone,
  Download,
  Upload,
  Moon,
  Sun,
  Clock,
  Minus,
  FileText,
  History,
  CheckCircle2,
  ShoppingCart,
  X,
  LogOut,
  Store,
  UserCircle,
  ChevronRight,
  Key,
  Loader2,
  Trash2,
  Edit2,
  ArrowLeftRight,
  Plus,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  Menu,
} from 'lucide-react';

import {
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithPopup,
  signOut,
  getIdToken,
} from "../demo-services/cloud-provider";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  deleteDoc,
  deleteField,
  disableNetwork,
  enableNetwork,
} from "../demo-services/cloud-provider";

import { demoAuth, demoDb, googleProvider } from "../demo-services/cloud-provider";
import { useReportMath } from '../../hooks/useReportMath';
import { useWakeUpRoutine } from '../../hooks/useWakeUpRoutine';
import InitialLoader from '../../shell/components/InitialLoader';

// =============================================================================
// INLINED TEMPLATES & HOOKS
// =============================================================================

// 1. Assembly Blueprint (Burger Stands, Milk Tea, Cafes)
// Supports recipes (1 Burger = 1 Patty + 1 Bun) and full waste/ending reconciliation.
const assemblyBlueprint = {
  business: { type: 'assembly', hasWasteColumn: true, hasEndingReconciliation: true },
  categories: [
    { id: 'c1', name: 'Mains', color: 'red' },
    { id: 'c2', name: 'Drinks', color: 'blue' },
    { id: 'c3', name: 'Extras', color: 'yellow' }
  ],
  inventoryDb: {
    'Buns': 5, 'Patty': 15, 'Cheese': 5, 'Egg': 10, 'Coke (Cup)': 15, 'Water': 10
  },
  menuItems: [
    { id: 'm1', categoryId: 'c1', name: 'Beef Burger', price: 40, recipe: { 'Buns': 1, 'Patty': 1 } },
    { id: 'm2', categoryId: 'c1', name: 'Cheese Burger', price: 50, recipe: { 'Buns': 1, 'Patty': 1, 'Cheese': 1 } },
    { id: 'm3', categoryId: 'c2', name: 'Coke', price: 25, recipe: { 'Coke (Cup)': 1 } },
    { id: 'e1', categoryId: 'c3', name: 'Add Egg', price: 15, recipe: { 'Egg': 1 } },
    { id: 'custom_amount', categoryId: 'c3', name: 'Custom Value', price: 0, recipe: {} }
  ]
};

// 2. Retail Blueprint (Sari-Sari, Meat Shop, Rice Retailer)
// 1-to-1 inventory. Supports decimals. Hides Waste & Ending columns for perpetual tracking.
const retailBlueprint = {
  business: { type: 'retail', hasWasteColumn: false, hasEndingReconciliation: false },
  categories: [
    { id: 'c1', name: 'Beverages', color: 'blue' },
    { id: 'c2', name: 'Pantry', color: 'red' },
    { id: 'c3', name: 'Produce/Meat', color: 'green' }
  ],
  inventoryDb: {
    'Coke 1.5L': 65, 'Bottled Water': 15, 'Canned Corned Beef': 45, 'Rice (per kg)': 50, 'Chicken (per kg)': 180
  },
  menuItems: [
    { id: 'm1', categoryId: 'c1', name: 'Coke 1.5L', price: 75, recipe: { 'Coke 1.5L': 1 } },
    { id: 'm2', categoryId: 'c1', name: 'Bottled Water', price: 20, recipe: { 'Bottled Water': 1 } },
    { id: 'm3', categoryId: 'c2', name: 'Corned Beef', price: 55, recipe: { 'Canned Corned Beef': 1 } },
    { id: 'm4', categoryId: 'c3', name: 'Rice (1kg)', price: 55, recipe: { 'Rice (per kg)': 1 } },
    { id: 'm5', categoryId: 'c3', name: 'Chicken (1kg)', price: 200, recipe: { 'Chicken (per kg)': 1 } },
    { id: 'custom_amount', categoryId: 'c3', name: 'Custom Value', price: 0, recipe: {} }
  ]
};

// 3. Blank Blueprint (For owners who want to build from scratch)
const blankBlueprint = {
  business: { type: 'custom', hasWasteColumn: true, hasEndingReconciliation: true },
  categories: [],
  inventoryDb: {},
  menuItems: [
    { id: 'custom_amount', categoryId: 'c1', name: 'Custom Value', price: 0, recipe: {} }
  ]
};

// =============================================================================
// CONSTANTS
// =============================================================================
const COLOR_MAP = {
  red: { bg: 'bg-red-600', text: 'text-white' },
  yellow: { bg: 'bg-yellow-400', text: 'text-yellow-900' },
  blue: { bg: 'bg-blue-500', text: 'text-white' },
  green: { bg: 'bg-green-500', text: 'text-white' },
  purple: { bg: 'bg-purple-500', text: 'text-white' },
  gray: { bg: 'bg-gray-500', text: 'text-white' },
};

const generateJoinCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// =============================================================================
// SHARED MICRO-COMPONENTS
// =============================================================================

const OrderItemList = ({ items, isActive }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      }
    }
    prevItemsRef.current = items;
  }, [items, isActive]);

  return (
    <div className="flex flex-col gap-y-1 text-sm text-gray-700 dark:text-gray-300 leading-tight mb-0 flex-1 max-h-[160px] overflow-y-auto pr-1">
      {items.length === 0 ? (
        <span className="text-gray-400 italic text-xs">Empty...</span>
      ) : (
        items.map(item => (
          <span key={item.id} className="font-bold flex gap-1.5 items-start">
            <span className="text-blue-600 dark:text-blue-400 font-black">{item.qty}x</span>{' '}
            <span className="flex-1 whitespace-normal break-words leading-tight">{item.name}</span>
          </span>
        ))
      )}
      <div ref={bottomRef} />
    </div>
  );
};

const OrderCard = ({ order, isActive, onSelect, onToggleStatus }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleMove = (clientX) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleEnd = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  return (
    <div className="relative overflow-hidden rounded-xl h-full">
      {/* Background Action Indicators */}
      <div className="absolute inset-0 flex justify-between items-center text-white font-black text-xs px-4 rounded-xl">
        <div className={`absolute inset-y-0 left-0 w-1/2 bg-blue-500 flex items-center px-4 transition-opacity ${offset > 0 ? 'opacity-100' : 'opacity-0'}`}>
          {order.isServed ? 'UNMARK' : 'SERVED'}
        </div>
        <div className={`absolute inset-y-0 right-0 w-1/2 bg-green-500 flex items-center justify-end px-4 transition-opacity ${offset < 0 ? 'opacity-100' : 'opacity-0'}`}>
          {order.isPaid ? 'UNMARK' : 'PAID'}
        </div>
      </div>

      {/* Main Draggable Card */}
      <div
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
        onTouchEnd={handleEnd}
        onMouseDown={(e) => handleStart(e.clientX)}
        onMouseMove={(e) => handleMove(e.clientX)}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onClick={(e) => {
          // Prevent selecting the order if the user was just swiping
          if (Math.abs(offset) < 10) onSelect(order.id);
        }}
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        className={`relative z-10 h-full cursor-pointer border-2 rounded-xl p-2 transition-colors flex flex-col select-none touch-pan-y ${isActive
          ? 'border-yellow-400 bg-white dark:bg-gray-800 shadow-md ring-2 ring-yellow-400/30 scale-[1.02]'
          : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-yellow-300 dark:hover:border-yellow-600 opacity-95 hover:opacity-100'
          }`}
      >
        <div className="flex justify-between items-start mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
          <div className="flex flex-col">
            <span className={`font-black text-sm leading-none ${isActive ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>#{order.id}</span>
            {/* Status Badges */}
            <div className="flex gap-1 mt-1">
              {order.isPaid && <span className="bg-green-100 text-green-700 text-[8px] font-black px-1.5 py-0.5 rounded-sm">PAID</span>}
              {order.isServed && <span className="bg-blue-100 text-blue-700 text-[8px] font-black px-1.5 py-0.5 rounded-sm">SERVED</span>}
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`font-black text-xl sm:text-2xl leading-none ${isActive ? 'text-red-700' : 'text-gray-800 dark:text-gray-200'}`}>₱{order.total}</span>
            <span className="text-[9px] text-gray-400 dark:text-gray-500 font-bold mt-1">
              {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
        <OrderItemList items={order.items} isActive={isActive} />
      </div>
    </div>
  );
};

// =============================================================================
// PANEL: Store Setup Wizard (With Linked/Unlinked Cloning)
// =============================================================================
const StoreSetupWizard = ({ onSelectBlueprint, onSaveDirect, demoDb, shopNames, currentShopId }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        }
        // Dispatch to Schema Builder
        onSelectBlueprint({ ...importedData, isLinked: false, sourceShopId: null });
      } catch (err) {
        alert("Failed to parse the JSON schema file.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Filter out the current shop so they can't clone themselves
  const availableShops = Object.entries(shopNames || {}).filter(([id]) => id !== currentShopId);

  const handleApplyDefault = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleCloneSchema = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      }

      if (schemaSnap.exists()) {

        const clonedSchema = schemaSnap.data();

        if (cloneMode === 'linked') {
          // LINKED: Bypass the Schema Builder and save directly as a franchise node
          onSaveDirect({ ...clonedSchema, isLinked: true, sourceShopId: selectedCloneId });
        } else {
          // UNLINKED: Strip any existing links and send to the Schema Builder for local editing
          onSelectBlueprint({ ...clonedSchema, isLinked: false, sourceShopId: null });
        }
      } else {
        alert("The selected shop does not have an active schema configured yet.");
      }
    } catch (err) {
      console.error("Error cloning schema:", err);
      alert("Failed to copy the schema. Check your connection and permissions.");
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans p-4 sm:p-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 sm:p-10 max-w-3xl w-full border border-gray-200 dark:border-gray-800 flex flex-col gap-6 animate-in fade-in zoom-in duration-300">

        <div className="text-center mb-2">
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-800 dark:text-gray-100">Store Blueprint</h1>
          <p className="text-sm text-gray-500 font-bold mt-2">Initialize your schema by cloning an existing branch, or starting fresh.</p>
        </div>

        {/* ── CLONE EXISTING SHOP SECTION ── */}
        {availableShops.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 sm:p-5 rounded-2xl border-2 border-blue-200 dark:border-blue-800/50 flex flex-col gap-4 overflow-hidden">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 w-full">
              <div className="text-left flex-1 min-w-0 w-full">
                <h3 className="font-black text-blue-800 dark:text-blue-300 uppercase tracking-widest text-sm mb-1 flex items-center gap-2">
                  <Store size={16} className="shrink-0" /> Clone Existing Branch
                </h3>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium leading-snug">Copy the setup from another shop you manage.</p>
              </div>

              {/* Fix: Added min-w-0 to parent and select to prevent flex blowout */}
              <div className="flex gap-2 w-full sm:w-auto min-w-0">
                <select
                  value={selectedCloneId}
                  onChange={(e) => setSelectedCloneId(e.target.value)}
                  // Fix: min-w-0 and text-ellipsis forces the long text to fit the screen
                  className="flex-1 min-w-0 text-ellipsis sm:w-48 p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-sm font-bold text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="" disabled>Select a shop...</option>
                  {availableShops.map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
                <button
                  onClick={handleCloneSchema}
                  disabled={!selectedCloneId || isCloning}
                  // Fix: shrink-0 ensures the button never gets squished
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 sm:px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors shadow-md shrink-0"
                >
                  {isCloning ? 'Copying...' : 'Clone'}
                </button>
              </div>
            </div>

            {/* Linked vs Unlinked Toggle */}
            {selectedCloneId && (
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 border-t border-blue-200 dark:border-blue-800/50">
                <label className={`flex-1 flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${cloneMode === 'unlinked' ? 'border-blue-500 bg-white dark:bg-gray-800' : 'border-transparent hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}>
                  <input type="radio" name="cloneMode" checked={cloneMode === 'unlinked'} onChange={() => setCloneMode('unlinked')} className="mt-1 shrink-0" />
                  <div>
                    <span className="block text-xs font-black text-gray-800 dark:text-gray-200 uppercase">Independent Copy</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Creates a standalone copy. You can edit this branch without affecting the original.</span>
                  </div>
                </label>
                <label className={`flex-1 flex items-start gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${cloneMode === 'linked' ? 'border-blue-500 bg-white dark:bg-gray-800' : 'border-transparent hover:bg-blue-100 dark:hover:bg-blue-900/30'}`}>
                  <input type="radio" name="cloneMode" checked={cloneMode === 'linked'} onChange={() => setCloneMode('linked')} className="mt-1 shrink-0" />
                  <div>
                    <span className="block text-xs font-black text-gray-800 dark:text-gray-200 uppercase">Linked Franchise</span>
                    <span className="block text-[10px] text-gray-500 mt-0.5 leading-tight">Locks this branch to the Master schema. Updating the Master automatically updates this shop.</span>
                  </div>
                </label>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-4 my-1">
          <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">OR START FROM SCRATCH</span>
          <div className="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
        </div>

        {/* ── STANDARD BLUEPRINTS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button onClick={() => setSelectedType('assembly')} className={`flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all ${selectedType === 'assembly' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-4 ring-blue-500/20 scale-[1.02]' : 'border-gray-200 dark:border-gray-800 hover:border-blue-300 dark:hover:border-blue-700 bg-white dark:bg-gray-800'}`}>
            <div className={`p-3 rounded-xl mb-3 ${selectedType === 'assembly' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}><Store size={24} /></div>
            <h3 className={`font-black text-lg ${selectedType === 'assembly' ? 'text-blue-700 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}`}>Assembly / F&B</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">Burger stands, Cafes, Milk Tea. Requires full end-of-shift counting.</p>
          </button>

          <button onClick={() => setSelectedType('retail')} className={`flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all ${selectedType === 'retail' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-4 ring-green-500/20 scale-[1.02]' : 'border-gray-200 dark:border-gray-800 hover:border-green-300 dark:hover:border-green-700 bg-white dark:bg-gray-800'}`}>
            <div className={`p-3 rounded-xl mb-3 ${selectedType === 'retail' ? 'bg-green-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}><ShoppingCart size={24} /></div>
            <h3 className={`font-black text-lg ${selectedType === 'retail' ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>Direct Retail</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">Sari-Sari, Meat, Produce. 1-to-1 inventory, perpetual tracking without waste logs.</p>
          </button>

          <button onClick={() => setSelectedType('blank')} className={`flex flex-col items-start text-left p-5 rounded-2xl border-2 transition-all ${selectedType === 'blank' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 ring-4 ring-purple-500/20 scale-[1.02]' : 'border-gray-200 dark:border-gray-800 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-gray-800'}`}>
            <div className={`p-3 rounded-xl mb-3 ${selectedType === 'blank' ? 'bg-purple-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'}`}><FileText size={24} /></div>
            <h3 className={`font-black text-lg ${selectedType === 'blank' ? 'text-purple-700 dark:text-purple-400' : 'text-gray-800 dark:text-gray-200'}`}>Blank Canvas</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">Start completely from scratch. Define all columns, categories, and inventory manually.</p>
          </button>

          {/* Import Schema Option */}
          <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-start text-left p-5 rounded-2xl border-2 border-dashed transition-all border-gray-300 dark:border-gray-700 hover:border-orange-400 dark:hover:border-orange-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/10">
            <div className="p-3 rounded-xl mb-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"><Upload size={24} /></div>
            <h3 className="font-black text-lg text-orange-700 dark:text-orange-400">Import (.JSON)</h3>
            <p className="text-xs text-gray-500 font-medium mt-1 leading-snug">Upload a previously exported configuration to setup your store instantly.</p>
          </button>
          <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
        </div>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
          <button onClick={handleApplyDefault} className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm">
            Load Template
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// MODAL: Schema Editor Add/Edit Component
// =============================================================================
const SchemaModal = ({ modal, setModal, onSave, draft }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
                      }} className="w-16 p-1 text-center border dark:border-gray-700 rounded bg-white dark:bg-gray-900 dark:text-white text-xs font-black" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button onClick={() => onSave(form)} disabled={!form.name} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed">
          Save Item
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// PANEL: Schema Builder
// =============================================================================
const SchemaBuilder = ({ blueprint, onSave, onCancel }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const removeInventoryItem = (keyToRemove) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    });
  };

  const handleInjectCustomValue = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }));
  };

  const handleModalSave = (formData) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        } else {
          next.categories = prev.categories.map(c => c.id === formData.id ? formData : c);
        }
      }
      else if (modal.type === 'inventory') {
        // FIX: Clone the inventory object before modifying keys
        next.inventoryDb = { ...prev.inventoryDb };
        if (modal.mode === 'edit' && formData.oldName && formData.oldName !== formData.name) {
          delete next.inventoryDb[formData.oldName];
        }
        next.inventoryDb[formData.name] = Number(formData.price);
      }
      else if (modal.type === 'menuItems') {
        if (modal.mode === 'add') {
          // FIX: Create a NEW array using spread
          next.menuItems = [...prev.menuItems, { id: `m_${Date.now()}`, ...formData }];
        } else {
          next.menuItems = prev.menuItems.map(m => m.id === formData.id ? formData : m);
        }
      }

      return next;
    });
    setModal(null);
  };

  // --- BULLETPROOF REORDERING LOGIC ---
  const moveItem = (listKey, index, direction) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      } else {
        const list = [...prev[listKey]];
        if (newIndex < 0 || newIndex >= list.length) return prev;
        // Swap
        const temp = list[index];
        list[index] = list[newIndex];
        list[newIndex] = temp;
        return { ...prev, [listKey]: list };
      }
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans p-4 sm:p-8 relative">

      {modal && <SchemaModal modal={modal} setModal={setModal} onSave={handleModalSave} draft={draft} />}

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col h-[85vh] border border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-300 overflow-hidden">

        {/* Header & Tool Actions */}
        <div className="bg-gray-900 p-6 text-white shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-yellow-400">Schema Editor</h1>
              <p className="text-xs text-gray-400 font-bold mt-1">Review and edit the {draft.business.type} template before launching.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={onCancel} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-xs font-bold transition-colors">Cancel</button>
              <button onClick={() => onSave(draft)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-md transition-all active:scale-95 border-b-2 border-blue-800">Save & Deploy</button>
            </div>
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-800">
            <button
              onClick={() => setModal({ type: activeTab, mode: 'add', data: null })}
              className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-xs font-black transition-colors shadow-sm"
            >
              <Plus size={16} /> ADD NEW {activeTab.replace('Items', ' ITEM').replace('inventory', 'INVENTORY').replace('categories', 'CATEGORY')}
            </button>

            {activeTab === 'menuItems' && (
              <button
                onClick={handleInjectCustomValue}
                className="flex items-center gap-1 bg-yellow-500 hover:bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-xs font-black transition-colors shadow-sm"
              >
                <Plus size={16} /> INJECT CUSTOM VALUE
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shrink-0 custom-scrollbar">
          {['categories', 'inventory', 'menuItems'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-3 text-xs font-black uppercase tracking-widest transition-colors whitespace-nowrap ${activeTab === tab ? 'text-blue-600 bg-white dark:bg-gray-900 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {tab.replace('Items', ' Items')}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 custom-scrollbar">

          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {draft.categories.map((cat, index) => (
                <div key={cat.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                  <div className="flex items-center">
                    {/* Move Up/Down Controls */}
                    <div className="flex flex-col mr-3 gap-0.5">
                      <button disabled={index === 0} onClick={() => moveItem('categories', index, 'up')} className="text-gray-400 hover:text-blue-500 disabled:opacity-20 transition-opacity"><ChevronUp size={20} /></button>
                      <button disabled={index === draft.categories.length - 1} onClick={() => moveItem('categories', index, 'down')} className="text-gray-400 hover:text-blue-500 disabled:opacity-20 transition-opacity"><ChevronDown size={20} /></button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`w-3 h-3 rounded-full bg-${cat.color}-500 shadow-inner`}></span>
                      <span className="font-black text-gray-800 dark:text-gray-200">{cat.name}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setModal({ type: 'categories', mode: 'edit', data: cat })} className="text-gray-400 hover:text-blue-500 p-2"><Edit2 size={16} /></button>
                    <button onClick={() => removeItem('categories', cat.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-3xl mx-auto">
              {Object.entries(draft.inventoryDb).map(([name, price], index) => {
                const isFirst = index === 0;
                const isLast = index === Object.keys(draft.inventoryDb).length - 1;
                return (
                  <div key={name} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                    <div className="flex items-center">
                      <div className="flex flex-col mr-3 gap-0.5">
                        <button disabled={isFirst} onClick={() => moveItem('inventoryDb', index, 'up')} className="text-gray-400 hover:text-blue-500 disabled:opacity-20 transition-opacity"><ChevronUp size={20} /></button>
                        <button disabled={isLast} onClick={() => moveItem('inventoryDb', index, 'down')} className="text-gray-400 hover:text-blue-500 disabled:opacity-20 transition-opacity"><ChevronDown size={20} /></button>
                      </div>
                      <span className="font-black text-gray-800 dark:text-gray-200">{name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-bold text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">₱{price}</span>
                      <button onClick={() => setModal({ type: 'inventory', mode: 'edit', data: { name, price } })} className="text-gray-400 hover:text-blue-500 p-2"><Edit2 size={16} /></button>
                      <button onClick={() => removeInventoryItem(name)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'menuItems' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {draft.menuItems.map((item, index) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex justify-between items-start transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                  <div className="flex items-start">
                    <div className="flex flex-col mr-3 gap-0.5 mt-1">
                      <button disabled={index === 0} onClick={() => moveItem('menuItems', index, 'up')} className="text-gray-400 hover:text-blue-500 disabled:opacity-20 transition-opacity"><ChevronUp size={20} /></button>
                      <button disabled={index === draft.menuItems.length - 1} onClick={() => moveItem('menuItems', index, 'down')} className="text-gray-400 hover:text-blue-500 disabled:opacity-20 transition-opacity"><ChevronDown size={20} /></button>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-gray-800 dark:text-gray-200">{item.name}</h3>
                        {item.id === 'custom_amount' && <span className="text-[8px] bg-yellow-100 text-yellow-700 font-black px-1.5 py-0.5 rounded uppercase tracking-widest">Wildcard</span>}
                      </div>
                      <p className="text-lg font-black text-blue-600 dark:text-blue-400 leading-none mt-1">₱{item.price}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(item.recipe || {}).map(([ing, qty]) => (
                          <span key={ing} className="text-[9px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-600">{qty}x {ing}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => setModal({ type: 'menuItems', mode: 'edit', data: item })} className="text-gray-400 hover:text-blue-500 p-2"><Edit2 size={16} /></button>
                    <button onClick={() => removeItem('menuItems', item.id)} className="text-gray-400 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// =============================================================================
// ACCOUNT & SETTINGS MODAL  (inside POSApp)
// =============================================================================
const AccountSettingsModal = ({ user, memberships, shopNames, userRole, shopId, onSwitchShop, onLogout, onClose }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      }

      const shopData = shopSnap.data() || {};
      const schemaData = schemaSnap.data() || {};

      // 2. Strip old transactions and format
      const cleanSchema = {
        name: (shopData.name || shopNames?.[shopId] || "My Shop") + " (Imported)",
        business: schemaData.business,
        categories: schemaData.categories,
        inventoryDb: schemaData.inventoryDb,
        menuItems: schemaData.menuItems
      };

      // 3. Convert to JSON
      const jsonString = JSON.stringify(cleanSchema, null, 2);

      // 4. Download
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `biz-schema-${shopId}-${new Date().toISOString().split('T')[0]}.json`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export schema.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">

        {/* Header */}
        <div className="bg-gray-900 p-5 flex justify-between items-center">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <UserCircle size={22} className="text-yellow-400" /> Account & Settings
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-5 flex items-center gap-4 border-b border-gray-100 dark:border-gray-800">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="avatar" className="w-14 h-14 rounded-full border-2 border-red-500 shadow-md" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border-2 border-red-300">
              <UserCircle size={32} className="text-red-500" />
            </div>
          )}
          <div>
            <p className="font-black text-gray-900 dark:text-gray-100 text-base">{user?.displayName || 'Unknown User'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-bold">{user?.email}</p>
            <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${userRole === 'owner' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>
              {userRole}
            </span>
          </div>
        </div>

        {/* Current Shop */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">Current Shop</p>
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800 rounded-2xl p-3">
            <div className="bg-red-600 p-2 rounded-xl">
              <Store size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-gray-800 dark:text-gray-100 text-sm">{shopNames?.[shopId] || shopId}</p>
              <p className="text-[10px] text-gray-400 font-bold">ID: {shopId}</p>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        {/* All Memberships */}
        {Object.keys(memberships || {}).length > 1 && (
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">All Shops</p>
            <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
              {Object.entries(memberships || {}).map(([sid, role]) => (
                <div key={sid} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{shopNames?.[sid] || sid}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${role === 'owner' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'}`}>{role}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="p-5 flex flex-col gap-3">
          <button
            onClick={handleExportSchema}
            className="w-full py-3 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 font-black rounded-2xl hover:bg-blue-200 dark:hover:bg-blue-900/50 active:scale-95 transition-all flex items-center justify-center gap-2 border border-blue-200 dark:border-blue-800"
          >
            <Download size={16} /> Export Schema
          </button>
          <button
            onClick={onSwitchShop}
            className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700"
          >
            <Store size={16} /> Switch Shop
          </button>
          <button
            onClick={onLogout}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-red-800"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PANEL: OrderFeed
// =============================================================================
const OrderFeed = ({
  shopName,
  storeConfig, orders, activeOrderId, setActiveOrderId,
  spreadsheetData, createNewOrder, time, config,
  setShowSettings, setDevContactModal,
  ordersContainerRef, ordersEndRef, showScrollDown, handleOrdersScroll, scrollToLatest,
  onOpenAccountSettings, shopCode, onCodeClick,
  onToggleOrderStatus, onToggleSidebar
}) => {
  const orderCols = config?.orderGridCols || 2;
  const gridClass = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' }[orderCols] || 'grid-cols-2';

  return (
    <div className="w-full sm:w-[40%] md:w-[35%] flex-1 min-h-[30dvh] sm:h-[100dvh] bg-[#F8F9FA] dark:bg-gray-900 border-b sm:border-b-0 sm:border-r border-gray-300 dark:border-gray-800 flex flex-col z-20 relative">

      <div className="bg-red-600 text-white px-2 py-2 shadow-sm flex justify-between items-center z-10 shrink-0 gap-2 tutorial-topbar">

        {/* Title Container: flex-1 and min-w-0 forces it to respect available space */}
        <div className="flex-1 min-w-0 ml-1 pr-1 flex items-center">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl hover:bg-black/20 text-white transition-colors"
            title="Open Menu"
          >
            <Menu size={24} />
          </button>
        </div>

        {/* Cards Container: shrink-0 protects this area from being squished */}
        <div className="flex gap-1 sm:gap-2 shrink-0">

          {/* Revenue Card */}
          <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1 rounded-lg shadow-inner min-w-[70px] sm:min-w-[80px] justify-center">
            <span className="text-[8px] font-bold text-red-200 uppercase tracking-widest mb-0.5">Revenue</span>
            <span className="text-sm sm:text-base font-black text-white leading-none">
              ₱{orders.reduce((sum, o) => sum + o.total, 0) + (spreadsheetData.adjustmentOrder?.total || 0)}
            </span>
          </div>

          {/* Logbook / Shop Info Card */}
          {shopCode && (
            <button
              onClick={() => onCodeClick(true)}
              className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1 rounded-lg shadow-inner min-w-[70px] sm:min-w-[80px] justify-center border border-blue-400/40 hover:bg-black/40 hover:border-blue-400/70 transition-all cursor-pointer active:scale-95"
              title="Open Shop Info & Logbook"
            >
              <span className="text-[8px] font-bold text-blue-200 uppercase tracking-widest mb-0.5">Shop Info</span>
              <span className="text-sm sm:text-base font-black text-blue-300 leading-none tracking-widest uppercase">LOGBOOK</span>
            </button>
          )}

          {/* Time Card */}
          <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1 rounded-lg shadow-inner min-w-[70px] sm:min-w-[80px] justify-center">
            <span className="text-[8px] font-bold text-red-200 uppercase tracking-widest mb-0.5">Time</span>
            <span className="text-[12px] sm:text-base font-black text-white leading-none whitespace-nowrap">
              {time.toLocaleTimeString([], config.timeFormat === '24h'
                ? { hour: '2-digit', minute: '2-digit', hour12: false }
                : { hour: '2-digit', minute: '2-digit', hour12: true }
              ).toLowerCase()}
            </span>
          </div>

          {/* Account / Settings Icon */}
          <button
            onClick={onOpenAccountSettings}
            className="flex items-center justify-center bg-black/20 px-2 sm:px-3 rounded-lg shadow-inner text-white hover:bg-black/40 transition-colors cursor-pointer shrink-0"
            title="Account & Settings"
          >
            <Settings size={20} />
          </button>

        </div>
      </div>

      <div
        ref={ordersContainerRef}
        onScroll={handleOrdersScroll}
        className={`flex-1 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-950 content-start grid auto-rows-max ${gridClass} gap-1 relative scroll-smooth tutorial-orderlist shadow-inner`}
      >
        {orders.map(order => (
          <OrderCard key={order.id} order={order} isActive={activeOrderId === order.id} onSelect={setActiveOrderId} onToggleStatus={onToggleOrderStatus} />
        ))}
        <div ref={ordersEndRef} className="h-2 shrink-0" style={{ gridColumn: '1 / -1' }} />
      </div>

      {showScrollDown && (
        <button
          onClick={scrollToLatest}
          className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-[0_4px_15px_-3px_rgba(37,99,235,0.5)] font-black text-xs flex items-center justify-center gap-1 hover:bg-blue-700 animate-in fade-in slide-in-from-bottom border-2 border-blue-400 active:scale-95 bottom-4"
        >
          LATEST ORDER ↓
        </button>
      )}
    </div>
  );
};

// =============================================================================
// PANEL: MenuGrid
// =============================================================================
const MenuGrid = ({
  storeConfig, spreadsheetData, isAddMode, setIsAddMode,
  setShowReport, createNewOrder, handleItemClick, handleItemLongPress,
  handleRemoveManualCount, orders, activeOrderId, config,
}) => {
  const GRID_COLS_MAP = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4', 5: 'grid-cols-5', 6: 'grid-cols-6' };
  const gridClass = GRID_COLS_MAP[config?.gridCols || 3] || 'grid-cols-3';
  const ItemButton = ({ item }) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else {
      const cartItem = activeOrder.items.find(i => i.id === item.id);
      cartQty = cartItem ? cartItem.qty : 0;
    }
    const clickHandler = (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  return (
    <div className="w-full sm:w-[60%] md:w-[65%] shrink-0 sm:shrink sm:h-[100dvh] flex flex-col bg-gray-100 dark:bg-gray-950 max-h-[60dvh] sm:max-h-full overflow-hidden shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)] sm:shadow-none z-30">
      <div className="bg-white dark:bg-gray-900 p-2 flex justify-between items-center border-b border-gray-300 dark:border-gray-800 shadow-sm z-10 gap-2">
        <div className="flex bg-gray-200 p-0.5 rounded-lg shadow-inner relative w-[72px] tutorial-toggle">
          <div className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md transition-all duration-300 ease-in-out shadow-sm ${isAddMode ? 'left-0.5 bg-green-500' : 'left-[calc(50%+1px)] bg-red-500'}`} />
          <button onClick={() => setIsAddMode(true)} className={`flex-1 py-1.5 flex items-center justify-center font-black z-10 transition-colors ${isAddMode ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}><Plus size={16} /></button>
          <button onClick={() => setIsAddMode(false)} className={`flex-1 py-1.5 flex items-center justify-center font-black z-10 transition-colors ${!isAddMode ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}><Minus size={16} /></button>
        </div>
        <button
          onClick={createNewOrder}
          disabled={!!spreadsheetData.adjustmentOrder}
          className={`flex-1 py-1.5 px-2 rounded-lg font-black text-xs flex items-center justify-center gap-1 transition-all shadow-sm tracking-wide ring-1
            ${spreadsheetData.adjustmentOrder ? 'bg-gray-200 text-gray-400 cursor-not-allowed grayscale' : 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 active:scale-95 ring-yellow-500/50'}`}
        >
          <Plus size={16} strokeWidth={3} /> {spreadsheetData.adjustmentOrder ? 'LOCKED (MANUAL COUNT)' : 'NEW ORDER'}
        </button>
        <button onClick={() => setShowReport(true)} className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg font-bold text-[11px] tutorial-report-btn hover:bg-gray-800 transition-all shadow-sm active:scale-95">
          <FileText size={14} /> REPORT
        </button>
      </div>

      <div className="overflow-y-auto sm:flex-1 bg-white dark:bg-gray-900 w-full flex flex-col">
        {spreadsheetData.adjustmentOrder ? (
          <div className="flex-1 flex flex-col bg-purple-50 dark:bg-purple-900/10 animate-in fade-in duration-300">
            <div className="p-4 bg-white dark:bg-gray-900 border-b-2 border-purple-200 dark:border-purple-800 shadow-sm flex justify-between items-center shrink-0">
              <div className="flex flex-col">
                <h2 className="text-xl font-black text-purple-700 dark:text-purple-300 uppercase tracking-tighter">Manual Count Summary</h2>
                <span className="text-[10px] text-purple-500 font-bold uppercase tracking-tight">Shift Adjustments List</span>
              </div>
              <div className="bg-purple-600 text-white px-4 py-1.5 rounded-xl shadow-md flex flex-col items-end border-b-4 border-purple-800">
                <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Net Adjustment</span>
                <span className="font-black text-2xl leading-none">
                  {spreadsheetData.adjustmentOrder.total >= 0 ? '' : '-'}₱{Math.abs(spreadsheetData.adjustmentOrder.total)}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-4xl mx-auto">
                {spreadsheetData.adjustmentOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-3 rounded-xl border-2 border-purple-100 dark:border-purple-900/50 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full shadow-inner ${item.price >= 0 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-800 dark:text-gray-100">
                          <span className="text-purple-600 dark:text-purple-400 mr-1">{item.qty}x</span> {item.name}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{item.type}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-black px-2 py-1 rounded-lg ${item.price >= 0 ? 'text-red-700 bg-red-50 dark:bg-red-900/20' : 'text-green-700 bg-green-50 dark:bg-green-900/20'}`}>
                      {item.price * item.qty >= 0 ? '+' : '-'}₱{Math.abs(item.price * item.qty)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800 grid grid-cols-2 gap-3 shrink-0">
              <button onClick={() => setShowReport(true)} className="py-3 bg-purple-600 text-white font-black rounded-xl shadow-lg hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-purple-800">OPEN REPORT SHEET</button>
              <button onClick={handleRemoveManualCount} className="py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border-2 border-red-200 dark:border-red-800 flex items-center justify-center gap-2">CLEAR MANUAL COUNTS</button>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto flex flex-col gap-1 tutorial-items w-full animate-in fade-in duration-500">
            {storeConfig.categories.map(category => {
              const colors = COLOR_MAP[category.color] || COLOR_MAP.gray;
              return (
                <section key={category.id} className="flex flex-row items-stretch border-b border-gray-100 dark:border-gray-800 pb-1">
                  <div className={`w-4 shrink-0 ${colors.bg} flex items-center justify-center rounded-l-sm`}>
                    <span className={`text-[8px] font-black ${colors.text} uppercase tracking-widest whitespace-nowrap`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>{category.name}</span>
                  </div>
                  <div className={`flex-1 grid ${gridClass} gap-0.5 ml-0.5`}>
                    {storeConfig.menuItems.filter(item => item.categoryId === category.id).map(item => (
                      <ItemButton key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PANEL: ReportModal
// =============================================================================
function ReportModal({
  storeConfig, inventory, handleInventoryInput, spreadsheetData,
  setShowReport, handleManualPaste, setShowImportModal, setShowExportModal,
  setLastActiveCell, handleTableKeyDown, handleTablePaste, handleEndShift,
  closeKeypadRef, onKeypadChange,
  shiftRemarks, setShiftRemarks, // Added these
}) {
  const [mathInput, setMathInput] = React.useState('');
  const [activeCell, setActiveCell] = React.useState(null);
  // Persists the raw expression string per cell: { rowName: { field: exprString } }
  const [exprMap, setExprMap] = React.useState({});

  // Keep parent informed of keypad open/close state (for back-press handling)
  React.useEffect(() => { onKeypadChange?.(!!activeCell); }, [activeCell]);
  // Expose a close-keypad callback to the parent via ref
  React.useEffect(() => {
    if (closeKeypadRef) closeKeypadRef.current = () => setActiveCell(null);
    return () => { if (closeKeypadRef) closeKeypadRef.current = null; };
  }, [closeKeypadRef]);

  const evaluateMath = (str) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } catch { return 0; }
  };

  // Commit: evaluate expression → save number to inventory, save raw expr string to exprMap
  const commitCell = (rowName, field, expr) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    }));
  };

  const handleCellFocus = (rowName, field, rawVal, rowIdx) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleCellBlur = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const onKeypadPress = (key) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      } else {
        setActiveCell(null);
      }
      return;
    }
    setMathInput(prev => prev + key);
  };

  const isCellActive = (rowIdx, field) => activeCell?.rowIdx === rowIdx && activeCell?.field === field;

  // Inactive cells: show stored expression string if one exists, otherwise the numeric value
  const cellValue = (rowName, field, rawVal, rowIdx) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // Proper 4-column calculator layout:
  // Row 1: (   )   C   ⌫
  // Row 2: 7   8   9   /
  // Row 3: 4   5   6   *
  // Row 4: 1   2   3   -
  // Row 5: 0   .   +   ↵
  const KEYPAD_KEYS = [
    '(', ')', 'C', '⌫',
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '+', '↵',
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
        <div className="bg-gray-900 text-white p-3 sm:p-4 flex justify-between items-center shadow-md z-10">
          <div>
            <h2 className="text-sm sm:text-lg font-black flex items-center gap-2"><FileText className="text-yellow-400" size={16} /> Inventory Sheet</h2>
            <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">End calculated: Starting + Deliver - Waste - Sold</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleManualPaste} className="p-2 hover:bg-gray-800 rounded-lg transition-all flex items-center gap-1.5 text-xs text-blue-400 border border-blue-400/30"><ClipboardPaste size={18} /><span className="hidden sm:inline">Paste</span></button>
            <button onClick={() => setShowImportModal(true)} className="p-2 hover:bg-gray-800 rounded-lg transition-all flex items-center gap-1.5 text-xs text-green-400 border border-green-400/30"><Upload size={18} /><span className="hidden sm:inline">Import</span></button>
            <button onClick={() => setShowExportModal(true)} className="p-2 bg-yellow-400 text-yellow-900 rounded-lg transition-all flex items-center gap-1.5 text-xs font-black shadow-sm active:scale-95 border-b-2 border-yellow-600"><Download size={18} /><span className="hidden sm:inline">Export</span></button>
            <button onClick={() => setShowReport(false)} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"><X size={20} /></button>
          </div>
        </div>
        <div className="p-0 overflow-y-auto overflow-x-auto flex-1 bg-gray-50">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="sticky top-0 bg-gray-200 dark:bg-gray-800 border-b-2 border-gray-300 dark:border-gray-700 z-10">
              <tr className="text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs uppercase tracking-wider">
                <th className="p-2 border-r border-gray-300 font-black sticky left-0 z-20 bg-gray-200 dark:bg-gray-800 shadow-[1px_0_0_#9CA3AF] dark:shadow-[1px_0_0_#374151]">Item</th>
                <th className="p-2 border-r border-gray-300 text-center font-bold bg-blue-50/50">Start</th>
                <th className="p-2 border-r border-gray-300 text-center font-bold bg-blue-50/50">In</th>
                {/* Conditionally render Waste */}
                {storeConfig.business?.hasWasteColumn !== false && (
                  <th className="p-2 border-r border-gray-300 text-center font-bold bg-red-50/50 text-orange-500">Waste</th>
                )}
                <th className="p-2 border-r border-gray-300 text-center font-bold text-gray-500 dark:text-gray-400">Sold</th>
                <th className="p-2 border-r border-gray-300 text-center font-black text-blue-600 bg-blue-50">Theo. End</th>
                {/* Conditionally render Reconciliation columns */}
                {storeConfig.business?.hasEndingReconciliation !== false && (
                  <>
                    <th className="p-2 border-r border-gray-300 text-center font-black text-purple-600 dark:text-purple-400 bg-purple-50/30">Actual End</th>
                    <th className="p-2 border-r border-gray-300 text-center font-bold text-red-500">Var.</th>
                  </>
                )}
                <th className="p-2 text-right font-black text-green-600 dark:text-green-400">Sales</th>
              </tr>
            </thead>
            <tbody className="text-[11px] sm:text-sm divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
              {spreadsheetData.rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="p-2 border-r border-gray-200 dark:border-gray-800 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-gray-900 shadow-[1px_0_0_#E5E7EB] dark:shadow-[1px_0_0_#1F2937]">{row.name}</td>

                  {/* Start */}
                  <td className={`p-0 border-r border-gray-200 bg-blue-50/20 dark:bg-blue-50/5 ${isCellActive(idx, 'starting') ? 'ring-2 ring-inset ring-blue-500' : ''}`}>
                    <input type="text" inputMode="none" readOnly data-row={idx} data-field="starting"
                      onKeyDown={(e) => handleTableKeyDown(e, idx, 'starting')}
                      onFocus={() => handleCellFocus(row.name, 'starting', inventory[row.name]?.starting, idx)}
                      onBlur={handleCellBlur}
                      value={cellValue(row.name, 'starting', inventory[row.name]?.starting, idx)}
                      onChange={() => { }}
                      className="w-full h-full p-2 text-center bg-transparent dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none cursor-pointer caret-transparent"
                      placeholder="0" />
                  </td>

                  {/* In */}
                  <td className={`p-0 border-r border-gray-200 bg-blue-50/20 dark:bg-blue-50/5 ${isCellActive(idx, 'deliver') ? 'ring-2 ring-inset ring-blue-500' : ''}`}>
                    <input type="text" inputMode="none" readOnly data-row={idx} data-field="deliver"
                      onKeyDown={(e) => handleTableKeyDown(e, idx, 'deliver')}
                      onFocus={() => handleCellFocus(row.name, 'deliver', inventory[row.name]?.deliver, idx)}
                      onBlur={handleCellBlur}
                      value={cellValue(row.name, 'deliver', inventory[row.name]?.deliver, idx)}
                      onChange={() => { }}
                      className="w-full h-full p-2 text-center bg-transparent dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none cursor-pointer caret-transparent"
                      placeholder="0" />
                  </td>

                  {/* Waste (Conditional) */}
                  {storeConfig.business?.hasWasteColumn !== false && (
                    <td className={`p-0 border-r border-gray-200 bg-red-50/20 dark:bg-red-50/5 ${isCellActive(idx, 'waste') ? 'ring-2 ring-inset ring-red-500' : ''}`}>
                      <input type="text" inputMode="none" readOnly data-row={idx} data-field="waste"
                        onKeyDown={(e) => handleTableKeyDown(e, idx, 'waste')}
                        onFocus={() => handleCellFocus(row.name, 'waste', inventory[row.name]?.waste, idx)}
                        onBlur={handleCellBlur}
                        value={cellValue(row.name, 'waste', inventory[row.name]?.waste, idx)}
                        onChange={() => { }}
                        className="w-full h-full p-2 text-center bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:outline-none cursor-pointer caret-transparent text-red-600 dark:text-red-400 font-bold"
                        placeholder="0" />
                    </td>
                  )}

                  {/* Sold */}
                  <td className="p-2 border-r border-gray-200 text-center font-bold text-gray-600 dark:text-gray-400">{row.finalSold}</td>

                  {/* Theo. End */}
                  <td className="p-2 border-r border-gray-200 text-center font-black text-blue-600 dark:text-blue-400 bg-blue-50/30">{row.theoreticalEnding}</td>

                  {/* Reconciliation Columns (Conditional) */}
                  {storeConfig.business?.hasEndingReconciliation !== false && (
                    <>
                      <td className={`p-0 border-r border-gray-200 bg-purple-50/10 ${isCellActive(idx, 'endingOverride') ? 'ring-2 ring-inset ring-purple-500' : ''}`}>
                        <input type="text" inputMode="none" readOnly data-row={idx} data-field="endingOverride"
                          onKeyDown={(e) => handleTableKeyDown(e, idx, 'endingOverride')}
                          onFocus={() => handleCellFocus(row.name, 'endingOverride', inventory[row.name]?.endingOverride, idx)}
                          onBlur={handleCellBlur}
                          value={cellValue(row.name, 'endingOverride', inventory[row.name]?.endingOverride, idx)}
                          onChange={() => { }}
                          className={`w-full h-full p-2 text-center bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:outline-none cursor-pointer caret-transparent font-extrabold transition-colors ${row.hasOverride ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400'}`}
                          placeholder={row.theoreticalEnding} />
                      </td>
                      <td className={`p-2 border-r border-gray-200 text-center font-black ${row.missingQty > 0 ? 'text-red-500' : row.missingQty < 0 ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`}>
                        {row.missingQty !== 0 ? (row.missingQty > 0 ? `-${row.missingQty}` : `+${Math.abs(row.missingQty)}`) : '-'}
                      </td>
                    </>
                  )}

                  <td className="p-2 text-right font-black text-green-600 dark:text-green-400 bg-green-50/10">₱{row.sales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 sm:p-4 bg-gray-100 dark:bg-gray-900 border-t dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
          <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border dark:border-gray-700 shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 font-bold uppercase text-[10px] sm:text-xs mb-0.5">Calculated Total Sales</p>
            <p className="text-xl sm:text-3xl font-black text-green-600">₱{spreadsheetData.grandTotalSales}</p>
          </div>
          <button onClick={handleEndShift} className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-wider text-xs sm:text-sm border-b-4 border-red-800">End Shift &amp; Save Report</button>
        </div>

        {/* Shift Remarks Review */}
        <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 shrink-0">
          <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-2 uppercase tracking-wider">Review Current Shift Remarks</label>

          <div className="max-h-24 overflow-y-auto mb-3 space-y-1.5 custom-scrollbar border border-gray-200 dark:border-gray-700 rounded-xl p-2 bg-white dark:bg-gray-900">
            {(!shiftRemarks || shiftRemarks.length === 0) ? (
              <p className="text-xs text-gray-400 italic font-medium text-center py-2">No remarks logged during this shift.</p>
            ) : (
              shiftRemarks.map(remark => (
                <div key={remark.id} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-lg flex justify-between">
                  <span className="text-gray-800 dark:text-gray-200 font-medium break-words leading-snug">{remark.text}</span>
                  <span className="text-gray-400 text-[9px] shrink-0 ml-2 font-bold">{new Date(remark.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              id="finalRemarkInput"
              placeholder="Add a final closing note before saving..."
              className="flex-1 text-sm p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-red-400 focus:ring-4 focus:ring-red-400/20 outline-none transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                  const val = e.target.value.trim();
                  setShiftRemarks(prev => [...(Array.isArray(prev) ? prev : []), { id: Date.now(), timestamp: Date.now(), text: val, author: 'Closing Note' }]);
                  e.target.value = '';
                }
              }}
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                const input = document.getElementById('finalRemarkInput');
                if (input.value.trim()) {
                  const val = input.value.trim();
                  setShiftRemarks(prev => [...(Array.isArray(prev) ? prev : []), { id: Date.now(), timestamp: Date.now(), text: val, author: 'Closing Note' }]);
                  input.value = '';
                }
              }}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-black px-4 rounded-xl transition-colors text-xs"
            >
              ADD
            </button>
          </div>
        </div>

        {/* ── Math Expression Display (shows when any cell is active) ── */}
        {activeCell && (
          <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-t-2 border-yellow-400/60 shrink-0">
            <div className="flex flex-col">
              <span className="text-[9px] text-yellow-400 font-black uppercase tracking-widest">Expression</span>
              <span className="text-white font-mono text-lg font-black tracking-wider min-h-[28px]">{mathInput || <span className="text-gray-500">tap keys to enter...</span>}</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-gray-500 font-black uppercase tracking-widest">Preview</span>
              <span className="block text-yellow-300 font-black text-lg">{mathInput ? evaluateMath(mathInput) : '—'}</span>
            </div>
          </div>
        )}

        {/* ── On-Screen Math Keypad ── */}
        {activeCell && (
          <div className="bg-gray-900 p-3 border-t border-gray-800 shrink-0 animate-in slide-in-from-bottom duration-200">
            <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
              {KEYPAD_KEYS.map((key) => (
                <button
                  key={key}
                  onMouseDown={(e) => { e.preventDefault(); onKeypadPress(key); }}
                  className={`
                    py-4 rounded-xl font-black text-lg transition-all active:scale-90 select-none touch-manipulation
                    ${key === '↵'
                      ? 'bg-green-500 hover:bg-green-400 text-white border-b-4 border-green-700'
                      : key === 'C'
                        ? 'bg-red-600 hover:bg-red-500 text-white border-b-4 border-red-800'
                        : key === '⌫'
                          ? 'bg-orange-500 hover:bg-orange-400 text-white border-b-4 border-orange-700'
                          : ['+', '-', '*', '/'].includes(key)
                            ? 'bg-blue-600 hover:bg-blue-500 text-white border-b-4 border-blue-800'
                            : ['(', ')'].includes(key)
                              ? 'bg-purple-600 hover:bg-purple-500 text-white border-b-4 border-purple-800'
                              : key === '.'
                                ? 'bg-gray-600 hover:bg-gray-500 text-white border-b-4 border-gray-800'
                                : 'bg-gray-700 hover:bg-gray-600 text-gray-100 border-b-4 border-gray-900'
                    }
                  `}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// POS APP  (the actual point-of-sale engine)
// =============================================================================
export default function POSApp({ shopId, userRole, memberships, user, onSwitchShop, onLogout, onToggleSidebar }) {

  // --- PHASE 4: SHIFT FLOW STATES ---
  const [shiftStarted, setShiftStarted] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [hasLocalActiveShift, setHasLocalActiveShift] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  // --- WAKE UP ROUTINE (Step 2) ---
  useWakeUpRoutine(onLogout);

  // --- CORE APP STATE ---
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(`pos_config_${shopId}`);
    return saved ? JSON.parse(saved) : {
      timeFormat: '12h', theme: 'light', scale: 1, orderGridCols: 2,
      customPrices: { menu: {}, ingredients: {} }, customRecipes: {}
    };
  });
  const [storeConfig, setStoreConfig] = useState(() => {
    const saved = localStorage.getItem(`pos_storeConfig_${shopId}`);
    return saved ? JSON.parse(saved) : null;
  });
  // orders/inventory/activeOrderId are initialized to defaults;
  // they get hydrated by the shift setup screen, not from localStorage directly.
  const [orders, setOrders] = useState([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
  const [activeOrderId, setActiveOrderId] = useState(1);
  const [inventory, setInventory] = useState({});
  const [shiftRemarks, setShiftRemarks] = useState([]); // Now an array of log objects
  const [pastRemarks, setPastRemarks] = useState([]); // Fetched from the shop document
  const [showShopInfo, setShowShopInfo] = useState(false); // Replaces showCodeModal
  const [stagingBlueprint, setStagingBlueprint] = useState(null); // Holds the blueprint before it's finalized

  // --- UI STATE ---
  const [isAddMode, setIsAddMode] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const handleExitToShopSelector = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [customModal, setCustomModal] = useState({ isOpen: false, isRemoving: false });
  const [customValue, setCustomValue] = useState('');
  const [toast, setToast] = useState('');
  const [pasteModal, setPasteModal] = useState(false);
  const [manualPasteText, setManualPasteText] = useState('');
  const [devContactModal, setDevContactModal] = useState(false);
  const [clearConfirmModal, setClearConfirmModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState('general');
  const [selectedRecipeItem, setSelectedRecipeItem] = useState(null);
  const [lastActiveCell, setLastActiveCell] = useState({ rowIdx: 0, field: 'starting' });
  const [inviteCode, setInviteCode] = useState('Loading...');

  // Fetch the already established 6-character invite code
  useEffect(() => {
    if (settingsTab === 'team') {
      const fetchCode = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
          } else {
            setInviteCode('NO_CODE_FOUND');
          }
        } catch (err) {
          console.error("Error fetching invite code", err);
          setInviteCode('ERROR');
        }
      };
      fetchCode();
    }
  }, [settingsTab, shopId, demoDb]);

  // --- SCROLL STATE ---
  const ordersEndRef = React.useRef(null);
  const ordersContainerRef = React.useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // --- PWA INSTALL STATE ---
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // --- BACK-PRESS (PWA) STATE ---
  // Tracks whether the keypad inside ReportModal is open, without lifting full state
  const [reportKeypadOpen, setReportKeypadOpen] = useState(false);
  const closeKeypadRef = React.useRef(null);   // set by ReportModal
  // Snapshot of all modal booleans for the stable popstate handler (avoids stale closures)
  const modalStateRef = React.useRef({});
  useEffect(() => {
    modalStateRef.current = {
      showReport, reportKeypadOpen, showSettings, showCodeModal,
      showExportModal, showImportModal, pasteModal, devContactModal,
      clearConfirmModal, customModal,
    };
  });
  // Push an initial sentinel on mount so Android back never exits the PWA immediately
  useEffect(() => {
    history.pushState({ bizpos: true }, '');
    const handler = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      } else if (s.showSettings) {
        setShowSettings(false); closed = true;
      } else if (s.showReport) {
        setShowReport(false); closed = true;
      } else if (s.showCodeModal) {
        setShowCodeModal(false); closed = true;
      } else if (s.showExportModal) {
        setShowExportModal(false); closed = true;
      } else if (s.showImportModal) {
        setShowImportModal(false); closed = true;
      } else if (s.pasteModal) {
        setPasteModal(false); closed = true;
      } else if (s.devContactModal) {
        setDevContactModal(false); closed = true;
      } else if (s.clearConfirmModal) {
        setClearConfirmModal(false); closed = true;
      } else if (s.customModal?.isOpen) {
        setCustomModal({ isOpen: false, isRemoving: false }); closed = true;
      }
      // Re-push the sentinel so the NEXT back press is still intercepted
      // (if anything remains open), or remains for the app's base nav state
      if (closed) history.pushState({ bizpos: true }, '');
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []); // mount-only — reads live state via modalStateRef

  // --- SHOP NAMES + CODE (for the Account modal membership list & header) ---
  const [shopNames, setShopNames] = useState({});
  const [shopCode, setShopCode] = useState(null);
  useEffect(() => {
    if (!memberships) return;
    const fetchNames = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
          }

          if (snap.exists()) {
            const data = snap.data();
            names[sid] = data.name;
            if (sid === shopId) setShopCode(data.joinCode || null);
          }
        } catch (_) { }
      }
      setShopNames(names);
    };
    fetchNames();
  }, [memberships, shopId]);

  // ==========================================================================
  // PHASE 4: INITIALIZATION HOOK — runs on mount / shopId change
  // ==========================================================================
  useEffect(() => {
    const initShift = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        }

        if (shopSnap.exists()) {
          setPastRemarks(shopSnap.data().recentRemarks || []);
        }

        const q = query(
          collection(demoDb, 'shops', shopId, 'shift_reports'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        // Note: query with 'cache' source is not directly supported by getDocs in the same way,
        // but Firestore cache will be used automatically if persistence is enabled.
        const reportSnap = await getDocs(q);
        if (!reportSnap.empty) setLastReport(reportSnap.docs[0].data());
        else setLastReport(null);

      } catch (err) {
        console.warn('Could not fetch last report:', err.message);
        setLastReport(null);
      }

      // 3. Fetch Store Schema (With Franchise Link Support) - Cache-First
      try {
        const localSchema = JSON.parse(localStorage.getItem(`pos_storeConfig_${shopId}`));
        if (localSchema && !localSchema.isLinked) {
          setStoreConfig(localSchema);
        } else {
          // Check the local shop's schema config document
          const schemaRef = doc(demoDb, 'shops', shopId, 'config', 'schema');
          let schemaSnap = await getDoc(schemaRef, { source: 'cache' });
          if (!schemaSnap.exists()) {
            schemaSnap = await getDoc(schemaRef, { source: 'server' });
          }

          if (schemaSnap.exists()) {
            const configData = schemaSnap.data();

            // TRUE FRANCHISE LOGIC: If linked, fetch the Master schema instead
            if (configData.isLinked && configData.sourceShopId) {
              const masterRef = doc(demoDb, 'shops', configData.sourceShopId, 'config', 'schema');
              let masterSnap = await getDoc(masterRef, { source: 'cache' });
              if (!masterSnap.exists()) {
                masterSnap = await getDoc(masterRef, { source: 'server' });
              }

              if (masterSnap.exists()) {
                const masterData = masterSnap.data();
                // Inject the master data, but preserve the local branch's link flags!
                const linkedConfig = { ...masterData, isLinked: true, sourceShopId: configData.sourceShopId };
                setStoreConfig(linkedConfig);
                localStorage.setItem(`pos_storeConfig_${shopId}`, JSON.stringify(linkedConfig));
              } else {
                console.error("Master branch schema missing. Breaking link.");
                setStoreConfig({ ...configData, isLinked: false, sourceShopId: null });
              }
            } else {
              // Normal Unlinked Boot
              setStoreConfig(configData);
              localStorage.setItem(`pos_storeConfig_${shopId}`, JSON.stringify(configData));
            }
          } else {
            setStoreConfig(null); // No schema exists, trigger Setup Wizard
          }
        }
      } catch (err) {
        console.error("Failed to fetch schema:", err);
      }

      setSetupLoading(false);
    };
    initShift();
  }, [shopId]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    const handler = (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  }, []);

  useEffect(() => {
    if (toast) { const t = setTimeout(() => setToast(''), 3000); return () => clearTimeout(t); }
  }, [toast]);

  useEffect(() => {
    localStorage.setItem(`pos_config_${shopId}`, JSON.stringify(config));
    if (config.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [config, shopId]);

  useEffect(() => {
    if (storeConfig) {
      localStorage.setItem(`pos_storeConfig_${shopId}`, JSON.stringify(storeConfig));
      if (!selectedRecipeItem && storeConfig.menuItems?.length > 0) {
        setSelectedRecipeItem(storeConfig.menuItems[0].id);
      }
    }
  }, [storeConfig, shopId]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ==========================================================================
  // PHASE 4: LOCAL AUTO-SAVE — replaces per-key cloud sync
  // ==========================================================================
  useEffect(() => {
    if (!shiftStarted) return;
    localStorage.setItem(
      `pos_active_shift_${shopId}`,
      JSON.stringify({ orders, inventory, activeOrderId })
    );
  }, [orders, inventory, activeOrderId, shiftStarted, shopId]);

  useEffect(() => {
    if (ordersEndRef.current) ordersEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [orders.length]);

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  const getMenuPrice = (id, defaultPrice) => config.customPrices.menu[id] ?? defaultPrice;
  const getIngredientPrice = (name, defaultPrice) => config.customPrices.ingredients[name] ?? defaultPrice;
  const getRecipe = (id) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // ==========================================================================
  // REPORT MATH HOOK
  // ==========================================================================
  const spreadsheetData = useReportMath({ orders, inventory, storeConfig, getIngredientPrice, getRecipe });

  // ==========================================================================
  // SCROLL HANDLERS
  // ==========================================================================
  const handleOrdersScroll = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };
  const scrollToLatest = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // ==========================================================================
  // INSTALL HANDLER
  // ==========================================================================
  const handleInstallClick = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // ==========================================================================
  // LOGIC: CART MANAGEMENT
  // ==========================================================================
  const handleItemLongPress = (item) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      });
      const newTotal = newItems.reduce((sum, i) => sum + ((i.dynamicPrice ?? i.price) * i.qty), 0);
      return { ...order, items: newItems, total: newTotal };
    }));
  };

  const handleItemClick = (item) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      } else {
        if (existingItemIndex >= 0) {
          const newQty = newItems[existingItemIndex].qty - 1;
          if (newQty <= 0) newItems.splice(existingItemIndex, 1);
          else newItems[existingItemIndex] = { ...newItems[existingItemIndex], qty: newQty };
        }
      }
      const newTotal = newItems.reduce((sum, i) => sum + ((i.dynamicPrice ?? i.price) * i.qty), 0);
      return { ...order, items: newItems, total: newTotal };
    }));
  };

  const createNewOrder = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleToggleOrderStatus = (orderId, field) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  // ==========================================================================
  // LOGIC: INVENTORY / MANUAL COUNT
  // ==========================================================================
  const handleInventoryInput = (ingredient, field, value) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const handleRemoveManualCount = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        });
        return nextInv;
      });
      setToast('Manual counts cleared.');
    }
  };

  // ==========================================================================
  // LOGIC: REPORT / DATA
  // ==========================================================================
  // Legacy clear (used only by clearConfirmModal internal flow)
  const confirmClearData = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };
  const backupAndClear = () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } catch (err) {
      console.error("Schema save error:", err);
      setToast('Failed to save schema to cloud. Check permissions.');
    }
  };

  const handleEndShift = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
        };
      });
      const shift_report = {
        timestamp: Date.now(),
        savedBy: { uid: user.uid, name: user.displayName || user.email },
        sales: { total: spreadsheetData.grandTotalSales },
        inventorySnapshot,
        remarks: shiftRemarks, // Attach the raw array to the specific report backup
      };

      // 1. Save the Shift Report to the subcollection
      const reportRef = await addDoc(collection(demoDb, 'shops', shopId, 'shift_reports'), shift_report);

      // 2. Create a Summary Object for the Rolling Logbook (Only if there are remarks)
      if (shiftRemarks && shiftRemarks.length > 0) {
        const shiftSummary = {
          shiftId: reportRef.id,
          timestamp: Date.now(),
          author: user.displayName || user.email,
          messages: shiftRemarks
        };

        const combinedRemarks = [shiftSummary, ...pastRemarks].slice(0, 20); // Keep last 20 shifts
        await updateDoc(doc(demoDb, 'shops', shopId), { recentRemarks: combinedRemarks });
      }

      // Wipe local data only after successful cloud save
      localStorage.removeItem(`pos_active_shift_${shopId}`);
      setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
      setInventory({});
      setShiftRemarks([]);
      setActiveOrderId(1);
      setShowReport(false);
      setShiftStarted(false);   // returns user to Setup Screen
      setToast('Shift saved successfully! ✓');
    } catch (err) {
      console.error('End-shift save error:', err);
      setToast('Cloud save failed — export a JSON backup first.');
    }
  };

  const exportData = (format) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } else if (format === 'json') {
      const data = { orders, inventory, spreadsheet: spreadsheetData.rows, totalSales: spreadsheetData.grandTotalSales };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Backup_${timestamp}.json`; a.click();
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text('Inventory Report', 14, 15);
      doc.autoTable({ startY: 20, head: [['Item', 'Starting', 'Deliver', 'Waste', 'Ending', 'Sold', 'Price', 'Sales']], body: spreadsheetData.rows.map(r => [r.name, r.start, r.deliver, r.waste, r.finalEnding, r.finalSold, r.price, r.sales]), foot: [['', '', '', '', '', '', 'Total', spreadsheetData.grandTotalSales]] });
      doc.save(`Report_${timestamp}.pdf`);
    } else if (format === 'xlsx') {
      const ws_data = [['Item', 'Starting', 'Deliver', 'Waste', 'Ending', 'Sold', 'Price', 'Sales']];
      spreadsheetData.rows.forEach(r => ws_data.push([r.name, r.start, r.deliver, r.waste, r.finalEnding, r.finalSold, r.price, r.sales]));
      ws_data.push(['', '', '', '', '', '', 'Total Sales', spreadsheetData.grandTotalSales]);
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      XLSX.writeFile(wb, `Report_${timestamp}.xlsx`);
    }
  };

  const importJSON = (e) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      } catch (err) { setToast('Failed to parse JSON.'); }
    };
    reader.readAsText(file); e.target.value = null;
  };

  // ==========================================================================
  // LOGIC: PASTE / KEYBOARD
  // ==========================================================================
  const handleTableKeyDown = (e, rowIdx, field) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  };

  const processPastedText = (text) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      });
      return nextInv;
    });
    setToast('Pasted successfully!');
  };

  const handleManualPaste = async () => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
    } catch (err) { setPasteModal(true); }
  };

  const handleTablePaste = (e, rowIdx, field) => {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      });
      return nextInv;
    });
  };

  // ==========================================================================
  // PHASE 4: BLOCKING RENDERS — loading spinner & shift setup screen
  // ==========================================================================
  if (setupLoading) {
    return <InitialLoader onTimeoutExit={handleExitToShopSelector} />;
  }

  if (!shiftStarted) {
    return (
      <div className="min-h-[100dvh] w-full bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 max-w-md w-full text-center space-y-6 relative overflow-hidden">
          {/* Red accent bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-red-600" />

          <div className="px-6 sm:px-8 pt-10 pb-8 space-y-6">
            {/* ── Condition A: local unfinished shift ── */}
            {hasLocalActiveShift ? (
              <>
                <div className="flex justify-center">
                  <div className="bg-yellow-100 p-5 rounded-full">
                    <Clock className="w-12 h-12 text-yellow-500" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Unfinished Shift Found</h1>
                  <p className="text-gray-500 font-bold text-sm mt-1">There is an active shift saved on this device. Resume or discard it.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      try {
                        const data = JSON.parse(localStorage.getItem(`pos_active_shift_${shopId}`));
                        if (data) {
                          setOrders(data.orders || [{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
                          setInventory(data.inventory || {});
                          setActiveOrderId(data.activeOrderId || 1);
                          // SAFELY HYDRATE ARRAYS TO PREVENT TEXT CORRUPTION:
                          setShiftRemarks(Array.isArray(data.shiftRemarks) ? data.shiftRemarks : []);
                        }
                      } catch (_) { }
                      setShiftStarted(true);
                    }}
                    className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 border-b-4 border-yellow-700 uppercase tracking-widest text-sm"
                  >
                    Resume Active Shift
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem(`pos_active_shift_${shopId}`);
                      setHasLocalActiveShift(false);
                      setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
                      setInventory({});
                      setActiveOrderId(1);
                    }}
                    className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-600 font-black rounded-xl transition-all border-2 border-red-200 text-sm"
                  >
                    Discard Local Data
                  </button>
                </div>
              </>
            ) : lastReport ? (
              /* ── Condition B: no local shift, last Firebase report exists ── */
              <>
                <div className="flex justify-center">
                  <div className="bg-blue-100 p-5 rounded-full">
                    <Store className="w-12 h-12 text-blue-500" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Ready to Start?</h1>
                  <p className="text-gray-500 font-bold text-sm mt-1">
                    Last closing report by{' '}
                    <span className="text-blue-600 font-black">{lastReport.savedBy?.name || 'a teammate'}</span>.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      const newInventory = {};
                      if (lastReport.inventorySnapshot) {
                        Object.entries(lastReport.inventorySnapshot).forEach(([name, data]) => {
                          newInventory[name] = { starting: data.finalEnding ?? '', deliver: '', waste: '' };
                        });
                      }
                      setInventory(newInventory);
                      setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
                      setActiveOrderId(1);
                      setShiftStarted(true);
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 border-b-4 border-blue-800 uppercase tracking-widest text-sm"
                  >
                    Continue from Last Report
                  </button>
                  <button
                    onClick={() => {
                      setInventory({});
                      setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
                      setActiveOrderId(1);
                      setShiftStarted(true);
                    }}
                    className="w-full py-3 bg-white border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 font-black rounded-xl transition-all text-sm"
                  >
                    Start Fresh (Zeros)
                  </button>
                </div>
              </>
            ) : (
              /* ── Condition C: first-ever shift ── */
              <>
                <div className="flex justify-center">
                  <div className="bg-green-100 p-5 rounded-full">
                    <Plus className="w-12 h-12 text-green-500" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Welcome to Biz POS</h1>
                  <p className="text-gray-500 font-bold text-sm mt-1">No previous shift history found. Start your first shift below.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => {
                      setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
                      setInventory({});
                      setActiveOrderId(1);
                      setShiftStarted(true);
                    }}
                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 border-b-4 border-green-700 uppercase tracking-widest text-sm"
                  >
                    Start First Shift
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // RENDER ROUTING: SCHEMA BUILDER & ONBOARDING
  // ==========================================================================

  // 1. If stagingBlueprint exists, ALWAYS render the Builder (This allows editing existing schemas)
  if (stagingBlueprint) {
    return (
      <SchemaBuilder
        blueprint={stagingBlueprint}
        onSave={handleFinalizeSchema}
        onCancel={() => setStagingBlueprint(null)}
      />
    );
  }

  // 2. If no config exists, route through the Wizard or wait for Owner
  if (!storeConfig) {
    if (userRole === 'owner') {
      return (
        <StoreSetupWizard
          demoDb={demoDb}
          shopNames={shopNames}
          currentShopId={shopId}
          onSelectBlueprint={(blueprint) => setStagingBlueprint(blueprint)}
          onSaveDirect={handleFinalizeSchema} // Allows Linked mode to bypass Builder
        />
      );
    } else {
      return (
        <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans text-center p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4 border border-gray-200 dark:border-gray-800 max-w-sm">
            <Loader2 size={40} className="text-blue-500 animate-spin" />
            <div>
              <h2 className="text-lg font-black text-gray-800 dark:text-gray-100 uppercase tracking-widest">Awaiting Schema</h2>
              <p className="text-sm text-gray-500 font-bold mt-2 leading-relaxed">The shop owner has not initialized the store configuration yet. Please ask the owner to log in and configure the store.</p>
            </div>
            <button onClick={onLogout} className="mt-4 px-6 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs">Sign Out</button>
          </div>
        </div>
      );
    }
  }

  // ==========================================================================
  // RENDER: MAIN POS
  // ==========================================================================
  return (
    <div className="flex flex-col sm:flex-row h-[100dvh] bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden transition-colors" style={{ zoom: config.scale || 1 }}>

      <OrderFeed
        shopName={shopNames?.[shopId]}
        storeConfig={storeConfig} orders={orders} activeOrderId={activeOrderId}
        setActiveOrderId={setActiveOrderId} spreadsheetData={spreadsheetData}
        createNewOrder={createNewOrder} time={time} config={config}
        setShowSettings={setShowSettings} setDevContactModal={setDevContactModal}
        ordersContainerRef={ordersContainerRef} ordersEndRef={ordersEndRef}
        showScrollDown={showScrollDown} handleOrdersScroll={handleOrdersScroll}
        scrollToLatest={scrollToLatest}
        onOpenAccountSettings={() => setShowSettings(true)}
        shopCode={shopCode}
        onCodeClick={() => setShowShopInfo(true)}
        onToggleOrderStatus={handleToggleOrderStatus}
        onToggleSidebar={onToggleSidebar}
      />

      <MenuGrid
        storeConfig={storeConfig} spreadsheetData={spreadsheetData}
        isAddMode={isAddMode} setIsAddMode={setIsAddMode}
        setShowReport={setShowReport} createNewOrder={createNewOrder}
        handleItemClick={handleItemClick} handleItemLongPress={handleItemLongPress}
        handleRemoveManualCount={handleRemoveManualCount}
        orders={orders} activeOrderId={activeOrderId}
        config={config}
      />

      {/* ── Shop Info & Logbook Modal ── */}
      {showShopInfo && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6" onClick={() => setShowShopInfo(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header: Shop Details */}
            <div className="bg-gray-900 p-6 text-white border-b-4 border-blue-500 relative shrink-0">
              <button
                onClick={() => setShowShopInfo(false)}
                className="absolute top-4 right-4 p-1 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>

              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div className="flex gap-4 items-center">
                  <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shrink-0">
                    <Store size={24} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight line-clamp-1">{shopNames?.[shopId] || 'Shop Info'}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Active Session
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExitToShopSelector}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 hover:bg-orange-500/10 text-gray-400 hover:text-orange-400 transition-all rounded-xl border border-gray-700 hover:border-orange-500/30 font-black text-[10px] uppercase tracking-widest shrink-0"
                >
                  <ArrowLeftRight size={14} />
                  Switch Shop
                </button>
              </div>

              <div className="flex gap-3 sm:gap-4 mt-6 bg-gray-800/50 p-3 rounded-2xl border border-gray-700 w-full justify-center text-center shadow-inner">
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Join Code</p>
                  <p className="font-mono text-xl font-black text-yellow-400 tracking-widest">{shopCode}</p>
                </div>
                <div className="w-px bg-gray-700"></div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Your Role</p>
                  <p className="text-sm font-black text-blue-400 mt-1 uppercase">{userRole}</p>
                </div>
              </div>
            </div>

            {/* Logbook Feed */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-950 space-y-4 custom-scrollbar">

              {/* CURRENT SHIFT NOTES (Live) */}
              <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 p-3 rounded-2xl">
                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Current Shift
                </p>
                <div className="space-y-2">
                  {shiftRemarks.length === 0 ? (
                    <p className="text-xs text-gray-500 italic font-medium">No remarks logged yet.</p>
                  ) : (
                    shiftRemarks.map(remark => (
                      <div key={remark.id} className="bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm">
                        <p className="text-sm text-gray-800 dark:text-gray-200 font-medium break-words leading-snug">{remark.text}</p>
                        <p className="text-[9px] text-gray-400 font-bold mt-1">
                          {new Date(remark.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PAST SHIFT LOGS */}
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mt-4 border-b dark:border-gray-800 pb-2">Past Shifts</p>

              {pastRemarks.length === 0 && <p className="text-xs text-center text-gray-500 italic">No past logs available.</p>}

              {pastRemarks.map((shiftLog, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex justify-between items-center mb-2 border-b dark:border-gray-700 pb-1">
                    <span className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase">{shiftLog.author}</span>
                    <span className="text-[9px] font-bold text-gray-400">
                      {new Date(shiftLog.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {shiftLog.messages?.map((msg, i) => (
                      <li key={i} className="text-xs text-gray-600 dark:text-gray-400 font-medium break-words flex gap-2">
                        <span className="text-[9px] font-bold text-gray-400 shrink-0 mt-0.5">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}:
                        </span>
                        <span>{msg.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800 flex gap-2 shrink-0">
              <input
                id="logInput"
                type="text"
                placeholder="Type a note for this shift..."
                className="flex-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim() !== '') {
                    const val = e.target.value.trim();
                    setShiftRemarks(prev => [...(Array.isArray(prev) ? prev : []), { id: Date.now(), timestamp: Date.now(), text: val, author: user.displayName || user.email }]);
                    e.target.value = '';
                  }
                }}
              />
              <button
                onClick={() => {
                  const input = document.getElementById('logInput');
                  if (input && input.value.trim() !== '') {
                    const val = input.value.trim();
                    setShiftRemarks(prev => [...(Array.isArray(prev) ? prev : []), { id: Date.now(), timestamp: Date.now(), text: val, author: user.displayName || user.email }]);
                    input.value = '';
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-5 rounded-xl shadow-md active:scale-95 transition-all text-xs"
              >
                ADD
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Combined Settings & Account Modal ── */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800 max-h-[90vh]">
            <div className="bg-gray-900 text-white p-3 sm:p-4 flex justify-between items-center shadow-md">
              <h2 className="text-sm sm:text-lg font-black flex items-center gap-2">
                <Settings className="text-yellow-400" size={16} /> System Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-800 shrink-0">
              {[
                { id: 'general', label: 'General' },
                { id: 'team', label: 'Team & Access' },
                { id: 'account', label: 'My Account' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSettingsTab(t.id)}
                  className={`flex-1 py-3 text-[10px] sm:text-xs font-black uppercase tracking-widest transition-colors ${settingsTab === t.id ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="p-4 overflow-y-auto flex-1 dark:text-gray-200 custom-scrollbar">

              {/* ── GENERAL TAB ── */}
              {settingsTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase text-xs tracking-wider">Clock Format</h3>
                    <div className="flex gap-2">
                      {['12h', '24h'].map(fmt => (
                        <button key={fmt} onClick={() => setConfig(p => ({ ...p, timeFormat: fmt }))}
                          className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${config.timeFormat === fmt
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}>
                          <Clock size={16} /> {fmt === '12h' ? '12-Hour' : '24-Hour'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase text-xs tracking-wider">Theme Profile</h3>
                    <div className="flex gap-2">
                      <button onClick={() => setConfig(p => ({ ...p, theme: 'light' }))}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${config.theme === 'light'
                          ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}>
                        <Sun size={16} /> Light Mode
                      </button>
                      <button onClick={() => setConfig(p => ({ ...p, theme: 'dark' }))}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${config.theme === 'dark'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}>
                        <Moon size={16} /> Dark Mode
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase text-xs tracking-wider">Order List Columns</h3>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4].map(num => (
                        <button key={num} onClick={() => setConfig(p => ({ ...p, orderGridCols: num }))}
                          className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center ${(config.orderGridCols || 2) === num
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {!isAppInstalled && deferredInstallPrompt && (
                    <div>
                      <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase text-xs tracking-wider">Install App</h3>
                      <button onClick={handleInstallClick} className="w-full py-3 bg-gradient-to-r from-red-600 to-red-500 text-white font-black rounded-xl shadow-md hover:from-red-700 hover:to-red-600 active:scale-95 transition-all flex items-center justify-center gap-2">
                        <Download size={18} /> Install Biz POS to Home Screen
                      </button>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">Installs as a fullscreen app — no browser bar.</p>
                    </div>
                  )}
                  {isAppInstalled && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                      <CheckCircle2 size={18} className="text-green-600 shrink-0" />
                      <p className="text-xs font-bold text-green-700 dark:text-green-400">App is installed on this device.</p>
                    </div>
                  )}

                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase text-xs tracking-wider">Menu Grid Columns</h3>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold mb-3">Controls how many item buttons appear per row in the menu.</p>
                    <div className="flex gap-1.5">
                      {[2, 3, 4, 5, 6].map(num => (
                        <button key={num}
                          onClick={() => setConfig(p => ({ ...p, gridCols: num }))}
                          className={`flex-1 py-3 rounded-xl font-black text-sm border-2 transition-all flex items-center justify-center ${(config.gridCols || 3) === num
                            ? 'border-blue-500 bg-blue-500 text-white shadow-md border-b-4 border-b-blue-700'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'
                            }`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Schema Rebuild Button (Owner Only) */}
                  {userRole === 'owner' && (
                    <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="font-bold text-red-600 dark:text-red-400 mb-3 uppercase text-xs tracking-wider">Danger Zone</h3>

                      {storeConfig.isLinked ? (
                        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-xl">
                          <p className="text-xs text-orange-800 dark:text-orange-300 font-bold mb-3 flex items-center gap-2">
                            <span className="text-lg">🔗</span> This store's schema is linked to: <br />
                            <span className="bg-orange-200 dark:bg-orange-800/80 px-2 py-0.5 rounded text-orange-900 dark:text-orange-100">{shopNames?.[storeConfig.sourceShopId] || 'Master Branch'}</span>
                          </p>
                          <div className="flex flex-col gap-2 mt-4">
                            <button
                              onClick={() => alert(`To edit the Master Schema, please switch your active shop to "${shopNames?.[storeConfig.sourceShopId] || 'Master Branch'}" from the Main Menu.`)}
                              className="w-full py-2.5 bg-orange-200 dark:bg-orange-800/50 text-orange-900 dark:text-orange-100 hover:bg-orange-300 dark:hover:bg-orange-700 rounded-lg text-xs font-black transition-colors"
                            >
                              Edit Master Branch (Requires Login)
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure? This will convert the schema to an Independent Copy. Future changes to the Master branch will no longer affect this store.")) {
                                  setStagingBlueprint({ ...storeConfig, isLinked: false, sourceShopId: null });
                                  setShowSettings(false);
                                }
                              }}
                              className="w-full py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 hover:border-gray-400 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-black transition-colors shadow-sm"
                            >
                              Break Link & Edit Locally
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setStagingBlueprint(storeConfig);
                              setShowSettings(false);
                            }}
                            className="w-full py-3 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 font-black rounded-xl border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
                          >
                            <Settings size={18} /> Edit Store Schema
                          </button>
                          <p className="text-[10px] text-gray-400 font-bold text-center mt-2">
                            Modifying the schema will apply changes to all connected devices on the next shift load.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: TEAM & ACCESS (OWNER ONLY)            */}
              {/* ========================================== */}
              {settingsTab === 'team' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                  {userRole !== 'owner' ? (
                    <div className="text-center p-8 text-gray-500 font-bold">
                      <p>Only the shop owner can manage team access.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 mb-1">Team Roster</h2>
                        <p className="text-xs text-gray-500 font-bold mb-4">Users who currently have access to this shop.</p>

                        <div className="space-y-3">
                          {/* Owner Profile (Cannot kick yourself) */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl flex justify-between items-center">
                            <div>
                              <p className="font-black text-blue-900 dark:text-blue-100">You (Owner)</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">{user?.email}</p>
                            </div>
                            <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Owner</span>
                          </div>

                          {/* Placeholder Staff - In Phase 9, this would map over a teamMembers state array */}
                          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                            <div>
                              <p className="font-black text-gray-800 dark:text-gray-200">Staff Member</p>
                              <p className="text-xs text-gray-500 font-bold">Active membership</p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to transfer OWNERSHIP to this user? You will be demoted to Staff.")) {
                                    alert("Feature coming soon: Requires Cloud Function to update roles safely.");
                                  }
                                }}
                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-gray-600 dark:text-gray-300 hover:text-yellow-700 rounded-lg text-[10px] font-black uppercase transition-colors"
                              >
                                Transfer
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm("Remove this user's access to the shop?")) {
                                    alert("Feature coming soon: Backend link removal.");
                                  }
                                }}
                                className="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg text-[10px] font-black uppercase transition-colors"
                              >
                                Kick
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 uppercase text-xs tracking-wider">Invite Link</h3>
                        <p className="text-xs text-gray-500 font-bold mb-3">Staff can rejoin or join new devices using this code.</p>

                        <div className="flex gap-2 mb-3">
                          {/* The Shareable URL */}
                          <input
                            readOnly
                            value={`${window.location.origin}?join=${inviteCode}`}
                            className="flex-1 p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-xl font-mono text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 outline-none overflow-hidden text-ellipsis whitespace-nowrap"
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}?join=${inviteCode}`);
                              alert("Link Copied!");
                            }}
                            disabled={inviteCode === 'Loading...' || inviteCode === 'NO_CODE_FOUND'}
                            className="px-4 bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Copy Link
                          </button>
                        </div>

                        {/* Raw 6-character code for manual typing */}
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Manual Code:</span>
                          <span className="font-mono text-lg font-black text-gray-800 dark:text-gray-200 tracking-[0.2em]">{inviteCode}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ========================================== */}
              {/* TAB: MY ACCOUNT                            */}
              {/* ========================================== */}
              {settingsTab === 'account' && (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
                  <div>
                    <h2 className="text-sm font-black uppercase tracking-widest text-gray-800 dark:text-gray-200 mb-1">Profile Details</h2>
                    <p className="text-xs text-gray-500 font-bold mb-4">Your personal account information.</p>

                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-xl space-y-3">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                        <p className="font-bold text-gray-800 dark:text-gray-200">{user?.email}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Role</p>
                        <span className="inline-block mt-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
                          {userRole}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3">
                    <button
                      onClick={async () => {
                        try {
                          const shopSnap = await getDoc(doc(demoDb, 'shops', shopId));
                          const schemaSnap = await getDoc(doc(demoDb, 'shops', shopId, 'config', 'schema'));
                          if (!schemaSnap.exists()) {
                            alert("No active schema to export.");
                            return;
                          }
                          const sData = shopSnap.data() || {};
                          const scData = schemaSnap.data();
                          const cleanSchema = {
                            name: (sData.name || "My Shop") + " (Imported)",
                            business: scData.business,
                            categories: scData.categories,
                            inventoryDb: scData.inventoryDb,
                            menuItems: scData.menuItems
                          };
                          const blob = new Blob([JSON.stringify(cleanSchema, null, 2)], { type: 'application/json' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = `biz-schema-${shopId}-${new Date().toISOString().split('T')[0]}.json`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        } catch (e) {
                          console.error(e);
                          alert("Export failed.");
                        }
                      }}
                      className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-black rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      <Download size={16} /> Export Schema
                    </button>
                    <button
                      onClick={onLogout}
                      className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shadow-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold italic">
                Vibecoded and deployed by{' '}
                <button onClick={() => setDevContactModal(true)} className="text-blue-500 hover:underline font-bold cursor-pointer">Kenn Egway</button>
              </p>
              <button onClick={() => setShowSettings(false)} className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-700 transition">Close Settings</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      {showReport && (
        <ReportModal
          storeConfig={storeConfig} inventory={inventory}
          handleInventoryInput={handleInventoryInput} spreadsheetData={spreadsheetData}
          setShowReport={setShowReport} handleManualPaste={handleManualPaste}
          setShowImportModal={setShowImportModal} setShowExportModal={setShowExportModal}
          setLastActiveCell={setLastActiveCell} handleTableKeyDown={handleTableKeyDown}
          handleTablePaste={handleTablePaste} handleEndShift={handleEndShift}
          closeKeypadRef={closeKeypadRef}
          onKeypadChange={setReportKeypadOpen}
          shiftRemarks={shiftRemarks} setShiftRemarks={setShiftRemarks}
        />
      )}

      {/* ── Custom Value Modal ── */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
            <div className={`p-4 text-white font-black text-center ${customModal.isRemoving ? 'bg-red-600' : 'bg-yellow-500'}`}>
              <h2 className="text-xl uppercase tracking-widest">{customModal.isRemoving ? 'Remove Custom' : 'Add Custom Amount'}</h2>
            </div>
            <div className="p-6 dark:bg-gray-900">
              <input type="number" inputMode="numeric" autoFocus value={customValue} onChange={(e) => setCustomValue(e.target.value)} placeholder="Enter amount (₱)" className="w-full text-center text-4xl font-black text-gray-800 dark:text-gray-100 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all" />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex gap-3">
              <button onClick={() => { setCustomModal({ isOpen: false, isRemoving: false }); setCustomValue(''); }} className="flex-1 py-3 font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 active:scale-95 transition-all">CANCEL</button>
              <button onClick={(e) => {
                e.preventDefault();
                const val = Number(customValue);
                if (!val || val <= 0) { setCustomModal({ isOpen: false, isRemoving: false }); setCustomValue(''); return; }
                const targetItem = { id: `custom_${val}`, name: `Custom ₱${val}`, price: val };
                setOrders((prev) => prev.map(order => {
                  if (order.id !== activeOrderId) return order;
                  const newItems = [...order.items];
                  const idx = newItems.findIndex((i) => i.id === targetItem.id);
                  if (!customModal.isRemoving) {
                    if (idx >= 0) newItems[idx] = { ...newItems[idx], qty: newItems[idx].qty + 1 };
                    else newItems.push({ ...targetItem, qty: 1 });
                  } else {
                    if (idx >= 0) { const nq = newItems[idx].qty - 1; if (nq <= 0) newItems.splice(idx, 1); else newItems[idx] = { ...newItems[idx], qty: nq }; }
                  }
                  return { ...order, items: newItems, total: newItems.reduce((sum, i) => sum + ((i.dynamicPrice ?? i.price) * i.qty), 0) };
                }));
                setCustomModal({ isOpen: false, isRemoving: false }); setCustomValue('');
              }} className={`flex-1 py-3 font-black text-white rounded-xl active:scale-95 transition-all shadow-md ${customModal.isRemoving ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}>CONFIRM</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dev Contact Modal ── */}
      {devContactModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 z-[300] backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-gray-200 dark:border-gray-800 relative z-[301]">
            <h3 className="font-black text-xl mb-4 text-blue-600 uppercase tracking-widest border-b dark:border-gray-700 pb-2">Developer info</h3>
            <div className="flex justify-center items-center gap-6 mb-6 bg-gray-50 dark:bg-gray-800 rounded-xl py-6 shadow-inner">
              <a href="https://fb.com/kenn.egway" target="_blank" rel="noreferrer" className="text-gray-600 dark:text-gray-400 hover:text-blue-600 bg-white dark:bg-gray-700 p-4 rounded-full shadow-md hover:scale-110 transition-all"><MessageCircle size={28} /></a>
              <a href="mailto:rkenn.studio@gmail.com" className="text-gray-600 dark:text-gray-400 hover:text-red-500 bg-white dark:bg-gray-700 p-4 rounded-full shadow-md hover:scale-110 transition-all"><Mail size={28} /></a>
              <a href="tel:09933206241" className="text-gray-600 dark:text-gray-400 hover:text-green-500 bg-white dark:bg-gray-700 p-4 rounded-full shadow-md hover:scale-110 transition-all"><Phone size={28} /></a>
            </div>
            <button onClick={() => setDevContactModal(false)} className="w-full py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-xl font-bold dark:text-white transition-colors">Close</button>
          </div>
        </div>
      )}

      {/* ── Clear Confirm Modal ── */}
      {clearConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 z-[250] backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-black text-xl mb-2 text-red-600">Clear Shift Data?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-bold leading-relaxed">
              This will instantly wipe all active orders and inventory numbers, preparing the app for a brand new shift.<br /><br />
              It is <span className="text-blue-500">highly recommended</span> to backup your data as a JSON file before clearing.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={backupAndClear} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md transition-all active:scale-95">BACKUP JSON & CLEAR</button>
              <button onClick={confirmClearData} className="w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-xl font-bold transition-all active:scale-95">Clear Without Backup</button>
              <button onClick={() => setClearConfirmModal(false)} className="w-full py-3 mt-2 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Paste Modal (fallback) ── */}
      {pasteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
            <div className="p-4 bg-gray-900 text-white font-black flex justify-between items-center shadow-md">
              <h2 className="text-sm sm:text-lg flex items-center gap-2"><ClipboardPaste size={16} className="text-blue-400" /> Manual Paste</h2>
              <button onClick={() => setPasteModal(false)} className="p-1 hover:bg-gray-800 rounded-full transition-colors"><X size={18} /></button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold leading-snug">Your browser blocked direct clipboard access. Please <span className="text-blue-500">long-press the box below</span> and select "Paste" manually.</p>
              <textarea autoFocus value={manualPasteText} onChange={(e) => setManualPasteText(e.target.value)} placeholder="Paste items here..." className="w-full text-xs font-mono text-gray-800 dark:text-gray-200 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-400 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all resize-none h-32" />
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex justify-end">
              <button onClick={() => { processPastedText(manualPasteText); setPasteModal(false); setManualPasteText(''); }} className="px-5 py-2 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg active:scale-95 transition-all shadow-md text-xs sm:text-sm">APPLY DATA</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
            <div className="p-6 bg-green-500 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><Upload size={24} /> Import Data</h2>
              <p className="text-[10px] uppercase font-black opacity-80 tracking-widest mt-1">Restore your shift state from backup</p>
            </div>
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <label className="w-full flex flex-col items-center justify-center p-10 border-4 border-dashed border-green-100 dark:border-green-900/50 rounded-3xl hover:bg-green-50 dark:hover:bg-green-900/10 transition-all cursor-pointer group">
                <Upload size={48} className="text-green-500 mb-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-black text-gray-800 dark:text-gray-100 uppercase tracking-tight">Tap to Select Backup</span>
                <span className="text-[10px] text-gray-400 font-bold mt-1">Only .JSON files are supported</span>
                <input type="file" accept=".json" className="hidden" onChange={(e) => { importJSON(e); setShowImportModal(false); }} />
              </label>
              <div className="mt-6 text-left w-full space-y-2">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest border-b dark:border-gray-800 pb-1">What's included in backup:</p>
                {['Active Orders & History', 'Inventory & Manual Counts', 'Shift Revenue Statistics'].map(item => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 font-bold"><CheckCircle2 size={12} className="text-green-500" /> {item}</div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
              <button onClick={() => setShowImportModal(false)} className="w-full py-3 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-200 font-black rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 active:scale-95 transition-all text-xs">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
            <div className="p-6 bg-yellow-400 text-yellow-900">
              <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-2"><Download size={24} /> Export Options</h2>
              <p className="text-[10px] uppercase font-black opacity-60 tracking-widest mt-1">Select your preferred file format</p>
            </div>
            <div className="p-4 grid grid-cols-1 gap-2">
              {[
                { id: 'xlsx', name: 'Excel Spreadsheet', desc: '.xlsx format for analysis', icon: <FileText className="text-green-600" /> },
                { id: 'pdf', name: 'PDF Document', desc: '.pdf for printing/viewing', icon: <FileText className="text-red-600" /> },
                { id: 'csv', name: 'CSV File', desc: '.csv for lightweight data', icon: <FileText className="text-blue-600" /> },
                { id: 'json', name: 'System Backup', desc: '.json for app restoration', icon: <History className="text-purple-600" /> }
              ].map((opt) => (
                <button key={opt.id} onClick={() => { exportData(opt.id); setShowExportModal(false); }} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-95 group text-left border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                  <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl group-hover:bg-white dark:group-hover:bg-gray-700 shadow-sm transition-colors">{opt.icon}</div>
                  <div className="flex flex-col">
                    <span className="font-black text-gray-800 dark:text-gray-100">{opt.name}</span>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700">
              <button onClick={() => setShowExportModal(false)} className="w-full py-3 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-200 font-black rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-100 active:scale-95 transition-all text-xs">CANCEL</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-[100] text-sm font-black animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">{toast}</div>
      )}
    </div>
  );
}

// =============================================================================
// AUTH WRAPPER — routes between all demoAuth/onboarding states
// =============================================================================
