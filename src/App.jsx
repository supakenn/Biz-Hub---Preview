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
  Plus,
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
} from 'lucide-react';

import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
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
} from 'firebase/firestore';

import { auth, db, googleProvider } from './firebase';
import { angelsBurgerTemplate } from './templates/angelsBurger';
import { useReportMath } from './hooks/useReportMath';

// =============================================================================
// CONSTANTS
// =============================================================================
const COLOR_MAP = {
  red:    { bg: 'bg-red-600',    text: 'text-white' },
  yellow: { bg: 'bg-yellow-400', text: 'text-yellow-900' },
  blue:   { bg: 'bg-blue-500',   text: 'text-white' },
  green:  { bg: 'bg-green-500',  text: 'text-white' },
  purple: { bg: 'bg-purple-500', text: 'text-white' },
  gray:   { bg: 'bg-gray-500',   text: 'text-white' },
};

const generateJoinCode = () =>
  Math.random().toString(36).substring(2, 8).toUpperCase();

// =============================================================================
// SHARED MICRO-COMPONENTS
// =============================================================================

const OrderItemList = ({ items, isActive }) => {
  const bottomRef = React.useRef(null);
  const prevItemsRef = React.useRef(items);
  useEffect(() => {
    if (bottomRef.current && isActive) {
      const prevTotal = prevItemsRef.current.reduce((s, i) => s + i.qty, 0);
      const currTotal = items.reduce((s, i) => s + i.qty, 0);
      if (currTotal !== prevTotal || items.length !== prevItemsRef.current.length) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
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

const OrderCard = ({ order, isActive, onSelect }) => (
  <div
    onClick={() => onSelect(order.id)}
    className={`cursor-pointer border-2 rounded-xl p-2 transition-all flex flex-col ${
      isActive
        ? 'border-yellow-400 bg-white dark:bg-gray-800 shadow-md ring-2 ring-yellow-400/30 scale-[1.02]'
        : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-yellow-300 dark:hover:border-yellow-600 opacity-80 hover:opacity-100'
    }`}
  >
    <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
      <span className={`font-black text-sm ${isActive ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>#{order.id}</span>
      <span className={`font-black text-xl sm:text-2xl pt-1 ${isActive ? 'text-red-700' : 'text-gray-800 dark:text-gray-200'}`}>₱{order.total}</span>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold shrink-0">
        {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
    <OrderItemList items={order.items} isActive={isActive} />
  </div>
);

const FallbackScreen = ({ onLoadTemplate }) => (
  <div className="h-[100dvh] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-950 font-sans p-8 text-center">
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-10 max-w-sm w-full border border-gray-200 dark:border-gray-800 flex flex-col items-center gap-6">
      <div className="bg-red-100 dark:bg-red-900/20 p-6 rounded-full">
        <ShoppingCart size={64} className="text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h1 className="text-2xl font-black uppercase tracking-tight text-gray-800 dark:text-gray-100">No Shop Configuration</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 font-bold mt-2">Load a template to get started.</p>
      </div>
      <button
        onClick={onLoadTemplate}
        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all border-b-4 border-red-800 uppercase tracking-widest"
      >
        Load Angel's Burger Template
      </button>
    </div>
  </div>
);

// =============================================================================
// ACCOUNT & SETTINGS MODAL  (inside POSApp)
// =============================================================================
const AccountSettingsModal = ({ user, memberships, shopNames, userRole, shopId, onSwitchShop, onLogout, onClose }) => (
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

// =============================================================================
// PANEL: OrderFeed
// =============================================================================
const OrderFeed = ({
  storeConfig, orders, activeOrderId, setActiveOrderId,
  spreadsheetData, createNewOrder, time, config,
  setShowSettings, setDevContactModal,
  ordersContainerRef, ordersEndRef, showScrollDown, handleOrdersScroll, scrollToLatest,
  onOpenAccountSettings, shopCode, onCodeClick,
}) => (
  <div className="w-full sm:w-[40%] md:w-[35%] flex-1 min-h-[30dvh] sm:h-[100dvh] bg-[#F8F9FA] dark:bg-gray-900 border-b sm:border-b-0 sm:border-r border-gray-300 dark:border-gray-800 flex flex-col z-20 relative">

    <div className="bg-red-600 text-white px-2 py-2 shadow-sm flex justify-between items-center z-10 shrink-0 gap-1 tutorial-topbar">
      <div className="flex flex-col items-start ml-1 shrink-0">
        <h1 onClick={() => setDevContactModal(true)} className="text-xs sm:text-base font-black tracking-tight text-yellow-300 leading-none cursor-pointer hover:scale-105 transition-transform">
          {storeConfig.business.name}
        </h1>
        <span className="text-white text-[9px] tracking-widest mt-0.5">BIZ POS</span>
      </div>
      <div className="flex gap-1 sm:gap-2">
        <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1 rounded-lg shadow-inner min-w-[70px] sm:min-w-[80px] justify-center">
          <span className="text-[8px] font-bold text-red-200 uppercase tracking-widest mb-0.5">Revenue</span>
          <span className="text-sm sm:text-base font-black text-white leading-none">
            ₱{orders.reduce((sum, o) => sum + o.total, 0) + (spreadsheetData.adjustmentOrder?.total || 0)}
          </span>
        </div>
        {shopCode && (
          <button
            onClick={onCodeClick}
            className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1 rounded-lg shadow-inner min-w-[70px] sm:min-w-[80px] justify-center border border-yellow-400/40 hover:bg-black/40 hover:border-yellow-400/70 transition-all cursor-pointer active:scale-95"
            title="Tap to enlarge code"
          >
            <span className="text-[8px] font-bold text-red-200 uppercase tracking-widest mb-0.5">Shop Code</span>
            <span className="text-sm sm:text-base font-black text-yellow-300 leading-none tracking-widest" style={{ fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.15em' }}>{shopCode}</span>
          </button>
        )}
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
          className="flex items-center justify-center bg-black/20 px-2 sm:px-3 rounded-lg shadow-inner text-white hover:bg-black/40 transition-colors cursor-pointer"
          title="Account & Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </div>

    <div
      ref={ordersContainerRef}
      onScroll={handleOrdersScroll}
      className="flex-1 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-950 content-start grid grid-cols-2 gap-1 relative scroll-smooth tutorial-orderlist shadow-inner"
    >
      {orders.map(order => (
        <OrderCard key={order.id} order={order} isActive={activeOrderId === order.id} onSelect={setActiveOrderId} />
      ))}
      <div ref={ordersEndRef} className="col-span-2 h-2 shrink-0" />
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

// =============================================================================
// PANEL: MenuGrid
// =============================================================================
const MenuGrid = ({
  storeConfig, spreadsheetData, isAddMode, setIsAddMode,
  setShowReport, createNewOrder, handleItemClick, handleItemLongPress,
  handleRemoveManualCount, orders, activeOrderId,
}) => {
  const ItemButton = ({ item }) => {
    const isLocked = !!spreadsheetData.adjustmentOrder;
    const activeOrder = orders.find(o => o.id === activeOrderId) || { items: [] };
    let cartQty = 0;
    if (item.id === 'custom_amount') {
      cartQty = activeOrder.items.filter(i => i.id.toString().startsWith('custom_')).reduce((sum, i) => sum + i.qty, 0);
    } else {
      const cartItem = activeOrder.items.find(i => i.id === item.id);
      cartQty = cartItem ? cartItem.qty : 0;
    }
    const clickHandler = (e) => { e.preventDefault(); if (isLocked) return; handleItemClick(item); };
    const contextMenuHandler = (e) => { e.preventDefault(); if (isLocked) return; handleItemLongPress(item); };
    return (
      <button
        onClick={clickHandler}
        onContextMenu={contextMenuHandler}
        disabled={isLocked}
        className={`touch-manipulation relative flex flex-col items-center justify-center p-1 min-h-[55px] rounded-sm transition-all duration-150 active:scale-95 border select-none overflow-hidden
          ${isLocked
            ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed opacity-50 grayscale'
            : isAddMode
              ? 'bg-white border-gray-200 hover:bg-yellow-50 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700'
              : 'bg-red-50/50 border-red-200 hover:bg-red-100 text-red-900'}
        `}
      >
        {cartQty > 0 ? (
          <>
            <span className="text-3xl font-black text-blue-600 leading-none">{cartQty}</span>
            <span className="text-[10px] font-extrabold text-gray-500 uppercase leading-tight truncate w-full px-1">{item.name}</span>
          </>
        ) : (
          <span className="text-sm md:text-base font-black text-gray-800 dark:text-gray-100 text-center leading-none uppercase flex flex-col gap-0.5">
            {item.name.split(' ').map((word, i) => <span key={i}>{word}</span>)}
          </span>
        )}
      </button>
    );
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
                  <div className="flex-1 grid grid-cols-3 gap-0.5 ml-0.5">
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
const ReportModal = ({
  storeConfig, inventory, handleInventoryInput, spreadsheetData,
  setShowReport, handleManualPaste, setShowImportModal, setShowExportModal,
  setLastActiveCell, handleTableKeyDown, handleTablePaste, handleEndShift,
}) => (
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
              <th className="p-2 border-r border-gray-300 text-center font-bold bg-blue-50/50">Starting</th>
              <th className="p-2 border-r border-gray-300 text-center font-bold bg-blue-50/50">Deliver</th>
              <th className="p-2 border-r border-gray-300 text-center font-bold bg-red-50/50">Waste</th>
              <th className="p-2 border-r border-gray-300 text-center font-black text-green-800 bg-green-50">Ending</th>
              <th className="p-2 border-r border-gray-300 text-center font-bold text-blue-800 bg-gray-100">Sold</th>
              <th className="p-2 border-r border-gray-300 text-right font-bold">Prices</th>
              <th className="p-2 text-right font-black">Sales</th>
            </tr>
          </thead>
          <tbody className="text-[11px] sm:text-sm divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
            {spreadsheetData.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                <td className="p-2 border-r border-gray-200 dark:border-gray-800 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap sticky left-0 z-10 bg-white dark:bg-gray-900 shadow-[1px_0_0_#E5E7EB] dark:shadow-[1px_0_0_#1F2937]">{row.name}</td>
                <td className="p-0 border-r border-gray-200 bg-blue-50/20 dark:bg-blue-50/5"><input type="number" data-row={idx} data-field="starting" onKeyDown={(e) => handleTableKeyDown(e, idx, 'starting')} onPaste={(e) => handleTablePaste(e, idx, 'starting')} onFocus={() => setLastActiveCell({ rowIdx: idx, field: 'starting' })} value={inventory[row.name]?.starting || ''} onChange={(e) => handleInventoryInput(row.name, 'starting', e.target.value)} className="w-full h-full p-2 text-center bg-transparent dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" /></td>
                <td className="p-0 border-r border-gray-200 bg-blue-50/20 dark:bg-blue-50/5"><input type="number" data-row={idx} data-field="deliver" onKeyDown={(e) => handleTableKeyDown(e, idx, 'deliver')} onPaste={(e) => handleTablePaste(e, idx, 'deliver')} onFocus={() => setLastActiveCell({ rowIdx: idx, field: 'deliver' })} value={inventory[row.name]?.deliver || ''} onChange={(e) => handleInventoryInput(row.name, 'deliver', e.target.value)} className="w-full h-full p-2 text-center bg-transparent dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" /></td>
                <td className="p-0 border-r border-gray-200 bg-red-50/20 dark:bg-red-50/5"><input type="number" data-row={idx} data-field="waste" onKeyDown={(e) => handleTableKeyDown(e, idx, 'waste')} onPaste={(e) => handleTablePaste(e, idx, 'waste')} onFocus={() => setLastActiveCell({ rowIdx: idx, field: 'waste' })} value={inventory[row.name]?.waste || ''} onChange={(e) => handleInventoryInput(row.name, 'waste', e.target.value)} className="w-full h-full p-2 text-center bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 text-red-600 dark:text-red-400 [&::-webkit-inner-spin-button]:appearance-none" placeholder="0" /></td>
                <td className="p-0 border-r border-gray-200 bg-green-50/20 dark:bg-green-50/5"><input type="number" data-row={idx} data-field="endingOverride" onKeyDown={(e) => handleTableKeyDown(e, idx, 'endingOverride')} onFocus={() => setLastActiveCell({ rowIdx: idx, field: 'endingOverride' })} value={inventory[row.name]?.endingOverride ?? ''} onChange={(e) => handleInventoryInput(row.name, 'endingOverride', e.target.value)} className={`w-full h-full p-2 text-center bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 font-extrabold [&::-webkit-inner-spin-button]:appearance-none transition-colors ${row.hasOverride ? 'text-purple-600 dark:text-purple-400' : 'text-green-700 dark:text-green-600'}`} placeholder={row.theoreticalEnding} /></td>
                <td className={`p-2 border-r border-gray-200 text-center font-bold bg-gray-50 dark:bg-gray-800/40 transition-colors ${row.missingQty !== 0 ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'}`}>{row.finalSold}</td>
                <td className="p-2 border-r border-gray-200 dark:border-gray-700 text-right text-gray-500 dark:text-gray-400">{row.price}</td>
                <td className="p-2 text-right font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">₱{row.sales}</td>
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
    </div>
  </div>
);

// =============================================================================
// POS APP  (the actual point-of-sale engine)
// =============================================================================
function POSApp({ shopId, userRole, memberships, user, onSwitchShop, onLogout }) {

  // --- PHASE 4: SHIFT FLOW STATES ---
  const [shiftStarted, setShiftStarted] = useState(false);
  const [lastReport, setLastReport] = useState(null);
  const [hasLocalActiveShift, setHasLocalActiveShift] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);

  // --- CORE APP STATE ---
  const [time, setTime] = useState(new Date());
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem(`pos_config_${shopId}`);
    return saved ? JSON.parse(saved) : {
      timeFormat: '12h', theme: 'light', scale: 1,
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

  // --- UI STATE ---
  const [isAddMode, setIsAddMode] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

  // --- SCROLL STATE ---
  const ordersEndRef = React.useRef(null);
  const ordersContainerRef = React.useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // --- PWA INSTALL STATE ---
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // --- SHOP NAMES + CODE (for the Account modal membership list & header) ---
  const [shopNames, setShopNames] = useState({});
  const [shopCode, setShopCode] = useState(null);
  useEffect(() => {
    if (!memberships) return;
    const fetchNames = async () => {
      const names = {};
      for (const sid of Object.keys(memberships)) {
        try {
          const snap = await getDoc(doc(db, 'shops', sid));
          if (snap.exists()) {
            names[sid] = snap.data().name;
            if (sid === shopId) setShopCode(snap.data().joinCode || null);
          }
        } catch (_) {}
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
      setSetupLoading(true);
      // 1. Check for a locally-saved active shift
      const localRaw = localStorage.getItem(`pos_active_shift_${shopId}`);
      setHasLocalActiveShift(!!localRaw);
      // 2. Fetch the most recent Firestore shift report
      try {
        const q = query(
          collection(db, 'shops', shopId, 'shift_reports'),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) setLastReport(snap.docs[0].data());
        else setLastReport(null);
      } catch (err) {
        console.warn('Could not fetch last report:', err.message);
        setLastReport(null);
      }
      setSetupLoading(false);
    };
    initShift();
  }, [shopId]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => { setIsAppInstalled(true); setDeferredInstallPrompt(null); });
    if (window.matchMedia('(display-mode: standalone)').matches) setIsAppInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
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
    const item = storeConfig?.menuItems?.find(m => m.id === id);
    return config.customRecipes?.[id] || item?.recipe || {};
  };

  // ==========================================================================
  // REPORT MATH HOOK
  // ==========================================================================
  const spreadsheetData = useReportMath({ orders, inventory, storeConfig, getIngredientPrice, getRecipe });

  // ==========================================================================
  // SCROLL HANDLERS
  // ==========================================================================
  const handleOrdersScroll = () => {
    if (!ordersContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = ordersContainerRef.current;
    setShowScrollDown(scrollHeight - scrollTop - clientHeight > 50);
  };
  const scrollToLatest = () => {
    if (ordersEndRef.current) ordersEndRef.current.scrollIntoView({ behavior: 'smooth' });
  };

  // ==========================================================================
  // INSTALL HANDLER
  // ==========================================================================
  const handleInstallClick = async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    if (outcome === 'accepted') { setIsAppInstalled(true); setDeferredInstallPrompt(null); }
  };

  // ==========================================================================
  // LOGIC: CART MANAGEMENT
  // ==========================================================================
  const handleItemLongPress = (item) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setOrders((prev) => prev.map(order => {
      if (order.id !== activeOrderId) return order;
      const newItems = order.items.filter(i => {
        if (item.id === 'custom_amount') return !i.id.startsWith('custom_');
        return i.id !== item.id;
      });
      const newTotal = newItems.reduce((sum, i) => sum + ((i.dynamicPrice ?? i.price) * i.qty), 0);
      return { ...order, items: newItems, total: newTotal };
    }));
  };

  const handleItemClick = (item) => {
    if (item.id === 'custom_amount') { setCustomValue(''); setCustomModal({ isOpen: true, isRemoving: !isAddMode }); return; }
    setOrders((prev) => prev.map(order => {
      if (order.id !== activeOrderId) return order;
      const newItems = [...order.items];
      const existingItemIndex = newItems.findIndex((i) => i.id === item.id);
      if (isAddMode) {
        if (existingItemIndex >= 0) newItems[existingItemIndex] = { ...newItems[existingItemIndex], qty: newItems[existingItemIndex].qty + 1 };
        else newItems.push({ ...item, qty: 1, dynamicPrice: getMenuPrice(item.id, item.price) });
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
    const currentActive = orders.find(o => o.id === activeOrderId);
    if (currentActive && currentActive.items.length === 0) return;
    const newId = Math.max(...orders.map(o => o.id), 0) + 1;
    setOrders(prev => [...prev, { id: newId, items: [], total: 0, timestamp: Date.now() }]);
    setActiveOrderId(newId);
  };

  // ==========================================================================
  // LOGIC: INVENTORY / MANUAL COUNT
  // ==========================================================================
  const handleInventoryInput = (ingredient, field, value) => {
    const numValue = value === '' ? '' : parseInt(value) || 0;
    setInventory(prev => ({ ...prev, [ingredient]: { ...(prev[ingredient] || { starting: '', deliver: '', waste: '' }), [field]: numValue } }));
  };

  const handleRemoveManualCount = () => {
    if (window.confirm('This will REMOVE all manual counts from the report and unlock normal ordering. Proceed?')) {
      setInventory(prev => {
        const nextInv = { ...prev };
        Object.keys(nextInv).forEach(name => {
          if (nextInv[name]) { const { endingOverride, ...rest } = nextInv[name]; nextInv[name] = rest; }
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
    setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
    setActiveOrderId(1);
    setInventory({});
    setShowReport(false);
    setClearConfirmModal(false);
  };
  const backupAndClear = () => { exportData('json'); confirmClearData(); };

  // ==========================================================================
  // PHASE 4: END OF SHIFT — compile report, push to Firestore, reset device
  // ==========================================================================
  const handleEndShift = async () => {
    if (!window.confirm('End Shift & Save Report? This will push data to the cloud and reset this device.')) return;
    setToast('Saving report to cloud...');
    try {
      const inventorySnapshot = {};
      spreadsheetData.rows.forEach(row => {
        inventorySnapshot[row.name] = {
          start:       row.start,
          deliver:     row.deliver,
          waste:       row.waste,
          sold:        row.finalSold,
          finalEnding: row.finalEnding,
        };
      });
      const shift_report = {
        timestamp: Date.now(),
        savedBy: { uid: user.uid, name: user.displayName || user.email },
        sales: { total: spreadsheetData.grandTotalSales },
        inventorySnapshot,
      };
      await addDoc(collection(db, 'shops', shopId, 'shift_reports'), shift_report);
      // Wipe local data only after successful cloud save
      localStorage.removeItem(`pos_active_shift_${shopId}`);
      setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
      setInventory({});
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
    const timestamp = new Date().toLocaleDateString().replace(/\//g, '-');
    if (format === 'csv') {
      let csv = 'Item,Starting,Deliver,Waste,Ending,Sold,Price,Sales\n';
      spreadsheetData.rows.forEach(r => { csv += `${r.name},${r.start},${r.deliver},${r.waste},${r.finalEnding},${r.finalSold},${r.price},${r.sales}\n`; });
      csv += `,,,,,,,Total Sales: ${spreadsheetData.grandTotalSales}\n`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Report_${timestamp}.csv`; a.click();
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
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.orders && Array.isArray(parsed.orders)) { setOrders(parsed.orders); setActiveOrderId(Math.max(...parsed.orders.map(o => o.id), 0) || 1); }
        if (parsed.inventory) setInventory(parsed.inventory);
        setToast('Backup JSON loaded!');
      } catch (err) { setToast('Failed to parse JSON.'); }
    };
    reader.readAsText(file); e.target.value = null;
  };

  // ==========================================================================
  // LOGIC: PASTE / KEYBOARD
  // ==========================================================================
  const handleTableKeyDown = (e, rowIdx, field) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); document.querySelector(`input[data-row="${rowIdx + 1}"][data-field="${field}"]`)?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); document.querySelector(`input[data-row="${rowIdx - 1}"][data-field="${field}"]`)?.focus(); }
  };

  const processPastedText = (text) => {
    if (!text) { setToast('Data is empty!'); return; }
    const rowsRaw = text.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rowsRaw.length === 0) { setToast('No detectable data.'); return; }
    const parseVal = (val) => { if (!val || val.trim() === '') return ''; const num = parseInt(val.replace(/,/g, ''), 10); return isNaN(num) ? '' : num; };
    setInventory(prev => {
      const nextInv = { ...prev };
      rowsRaw.forEach((rowRaw, rOffset) => {
        const cols = rowRaw.split('\t'); if (!cols.length) return;
        const targetRowIdx = lastActiveCell.rowIdx + rOffset;
        if (targetRowIdx >= spreadsheetData.rows.length) return;
        const rowName = spreadsheetData.rows[targetRowIdx].name;
        nextInv[rowName] = { ...(nextInv[rowName] || { starting: '', deliver: '', waste: '' }) };
        if (lastActiveCell.field === 'starting') { nextInv[rowName]['starting'] = parseVal(cols[0]); if (cols.length > 1) nextInv[rowName]['deliver'] = parseVal(cols[1]); if (cols.length > 2) nextInv[rowName]['waste'] = parseVal(cols[2]); }
        else if (lastActiveCell.field === 'deliver') { nextInv[rowName]['deliver'] = parseVal(cols[0]); if (cols.length > 1) nextInv[rowName]['waste'] = parseVal(cols[1]); }
        else if (lastActiveCell.field === 'waste') { nextInv[rowName]['waste'] = parseVal(cols[0]); }
      });
      return nextInv;
    });
    setToast('Pasted successfully!');
  };

  const handleManualPaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) { setPasteModal(true); return; }
      const text = await navigator.clipboard.readText();
      if (!text) { setToast('Clipboard is empty!'); return; }
      processPastedText(text);
    } catch (err) { setPasteModal(true); }
  };

  const handleTablePaste = (e, rowIdx, field) => {
    e.preventDefault();
    const rowsRaw = e.clipboardData.getData('text').split(/\r?\n/).filter(r => r.trim() !== '');
    const parseVal = (val) => { if (!val || val.trim() === '') return ''; const num = parseInt(val.replace(/,/g, ''), 10); return isNaN(num) ? '' : num; };
    setInventory(prev => {
      const nextInv = { ...prev };
      rowsRaw.forEach((rowRaw, rOffset) => {
        const cols = rowRaw.split('\t'); if (!cols.length) return;
        const targetRowIdx = rowIdx + rOffset;
        if (targetRowIdx >= spreadsheetData.rows.length) return;
        const rowName = spreadsheetData.rows[targetRowIdx].name;
        nextInv[rowName] = { ...(nextInv[rowName] || { starting: '', deliver: '', waste: '' }) };
        if (field === 'starting') { nextInv[rowName]['starting'] = parseVal(cols[0]); if (cols.length > 1) nextInv[rowName]['deliver'] = parseVal(cols[1]); if (cols.length > 2) nextInv[rowName]['waste'] = parseVal(cols[2]); }
        else if (field === 'deliver') { nextInv[rowName]['deliver'] = parseVal(cols[0]); if (cols.length > 1) nextInv[rowName]['waste'] = parseVal(cols[1]); }
        else if (field === 'waste') { nextInv[rowName]['waste'] = parseVal(cols[0]); }
      });
      return nextInv;
    });
  };

  // ==========================================================================
  // PHASE 4: BLOCKING RENDERS — loading spinner & shift setup screen
  // ==========================================================================
  if (setupLoading) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-gray-950">
        <Loader2 size={40} className="text-red-500 animate-spin" />
        <p className="text-gray-600 font-bold text-xs uppercase tracking-widest mt-3">Loading shift data...</p>
      </div>
    );
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
                          setOrders(data.orders);
                          setInventory(data.inventory);
                          setActiveOrderId(data.activeOrderId);
                        }
                      } catch (_) {}
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
  // RENDER: NO STORE CONFIG LOADED
  // ==========================================================================
  if (!storeConfig) {
    return <FallbackScreen onLoadTemplate={() => setStoreConfig(angelsBurgerTemplate)} />;
  }

  // ==========================================================================
  // RENDER: MAIN POS
  // ==========================================================================
  return (
    <div className="flex flex-col sm:flex-row h-[100dvh] bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden transition-colors" style={{ zoom: config.scale || 1 }}>

      <OrderFeed
        storeConfig={storeConfig} orders={orders} activeOrderId={activeOrderId}
        setActiveOrderId={setActiveOrderId} spreadsheetData={spreadsheetData}
        createNewOrder={createNewOrder} time={time} config={config}
        setShowSettings={setShowSettings} setDevContactModal={setDevContactModal}
        ordersContainerRef={ordersContainerRef} ordersEndRef={ordersEndRef}
        showScrollDown={showScrollDown} handleOrdersScroll={handleOrdersScroll}
        scrollToLatest={scrollToLatest}
        onOpenAccountSettings={() => setShowSettings(true)}
        shopCode={shopCode}
        onCodeClick={() => setShowCodeModal(true)}
      />

      <MenuGrid
        storeConfig={storeConfig} spreadsheetData={spreadsheetData}
        isAddMode={isAddMode} setIsAddMode={setIsAddMode}
        setShowReport={setShowReport} createNewOrder={createNewOrder}
        handleItemClick={handleItemClick} handleItemLongPress={handleItemLongPress}
        handleRemoveManualCount={handleRemoveManualCount}
        orders={orders} activeOrderId={activeOrderId}
      />

      {/* ── Shop Code Enlarge Modal ── */}
      {showCodeModal && shopCode && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-6"
          onClick={() => setShowCodeModal(false)}
        >
          <div className="bg-gray-900 border border-yellow-400/40 rounded-3xl shadow-2xl flex flex-col items-center gap-3 px-10 py-8 animate-in zoom-in duration-200">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Shop Join Code</p>
            <span
              className="text-6xl font-black text-yellow-300 tracking-[0.3em]"
              style={{ fontFamily: "'Courier New', Courier, monospace" }}
            >
              {shopCode}
            </span>
            <p className="text-[10px] text-gray-600 font-bold mt-1">Share this code with your staff</p>
            <button
              onClick={() => setShowCodeModal(false)}
              className="mt-2 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition-colors"
            >
              Close
            </button>
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

            {/* Tab Bar — grid prevents scrolling regardless of screen width */}
            <div className="grid grid-cols-4 border-b dark:border-gray-800 shrink-0">
              {['general', 'prices', 'recipes', 'account'].map(tab => (
                <button key={tab} onClick={() => setSettingsTab(tab)}
                  className={`py-3 text-[10px] sm:text-xs font-bold transition-colors capitalize ${
                    settingsTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}>
                  {tab === 'general' ? 'General' : tab === 'prices' ? 'Prices' : tab === 'recipes' ? 'Recipes' : 'Account'}
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
                          className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                            config.timeFormat === fmt
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
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                          config.theme === 'light'
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}>
                        <Sun size={16} /> Light Mode
                      </button>
                      <button onClick={() => setConfig(p => ({ ...p, theme: 'dark' }))}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${
                          config.theme === 'dark'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}>
                        <Moon size={16} /> Dark Mode
                      </button>
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
                </div>
              )}

              {/* ── ITEM PRICES TAB ── */}
              {settingsTab === 'prices' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4">Modify prices for the Menu items and Spreadsheet references. Overrides standard values.</p>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-black border-b pb-1 mb-2 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200">Menu Items</h3>
                      {storeConfig.menuItems.filter(i => i.id !== 'custom_amount').map(item => (
                        <div key={item.id} className="flex justify-between items-center mb-1 bg-gray-50 dark:bg-gray-800 p-1 rounded">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.name} <span className="text-[9px] text-gray-400 font-normal">({item.price})</span></span>
                          <input type="number"
                            className="w-16 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded p-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                            placeholder={item.price}
                            value={config.customPrices.menu[item.id] ?? ''}
                            onChange={(e) => { const val = e.target.value; setConfig(p => { const cp = { ...p.customPrices }; if (val === '') delete cp.menu[item.id]; else cp.menu[item.id] = Number(val); return { ...p, customPrices: cp }; }); }}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="font-black border-b pb-1 mb-2 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200">Spreadsheet Ingredients</h3>
                      {Object.entries(storeConfig.inventoryDb).map(([name, defaultP]) => (
                        <div key={name} className="flex justify-between items-center mb-1 bg-gray-50 dark:bg-gray-800 p-1 rounded">
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{name} <span className="text-[9px] text-gray-400 font-normal">({defaultP})</span></span>
                          <input type="number"
                            className="w-16 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded p-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                            placeholder={defaultP}
                            value={config.customPrices.ingredients[name] ?? ''}
                            onChange={(e) => { const val = e.target.value; setConfig(p => { const cp = { ...p.customPrices }; if (val === '') delete cp.ingredients[name]; else cp.ingredients[name] = Number(val); return { ...p, customPrices: cp }; }); }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── RECIPES TAB ── */}
              {settingsTab === 'recipes' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4">Modify the exact ingredients used per item. This affects inventory tracking.</p>
                  <div className="mb-4">
                    <select value={selectedRecipeItem || ''} onChange={(e) => setSelectedRecipeItem(e.target.value)}
                      className="w-full sm:w-1/2 p-2 rounded border bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm">
                      {storeConfig.menuItems.map(item => (<option key={item.id} value={item.id}>{item.name}</option>))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(storeConfig.inventoryDb).map(ing => {
                      const baseRecipe = storeConfig.menuItems.find(m => m.id === selectedRecipeItem)?.recipe || {};
                      const currentRecipe = config.customRecipes?.[selectedRecipeItem] || baseRecipe;
                      const val = currentRecipe?.[ing] || '';
                      return (
                        <div key={ing} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded shadow-sm">
                          <span className="text-xs font-bold truncate max-w-[80px]" title={ing}>{ing}</span>
                          <input type="number" value={val} placeholder="0"
                            onChange={(e) => {
                              const v = e.target.value;
                              setConfig(p => {
                                const n = { ...p.customRecipes };
                                if (!n[selectedRecipeItem]) n[selectedRecipeItem] = { ...baseRecipe };
                                if (!v || v === '0') delete n[selectedRecipeItem][ing];
                                else n[selectedRecipeItem][ing] = Number(v);
                                return { ...p, customRecipes: n };
                              });
                            }}
                            className="w-14 p-1 text-xs text-center border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded outline-none focus:border-blue-400 dark:focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none dark:text-white" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── ACCOUNT TAB ── */}
              {settingsTab === 'account' && (
                <div className="space-y-5">
                  {/* Profile */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
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
                      <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        userRole === 'owner'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{userRole}</span>
                    </div>
                  </div>

                  {/* Current Shop */}
                  <div>
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
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">All Shops</p>
                      <div className="flex flex-col gap-2 max-h-36 overflow-y-auto">
                        {Object.entries(memberships || {}).map(([sid, role]) => (
                          <div key={sid} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{shopNames?.[sid] || sid}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              role === 'owner'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                            }`}>{role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => { setShowSettings(false); onSwitchShop(); }}
                      className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700"
                    >
                      <Store size={16} /> Switch Shop
                    </button>
                    <button
                      onClick={() => { setShowSettings(false); onLogout(); }}
                      className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border-b-4 border-red-800"
                    >
                      <LogOut size={16} /> Logout
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
                { id: 'pdf',  name: 'PDF Document',      desc: '.pdf for printing/viewing', icon: <FileText className="text-red-600" /> },
                { id: 'csv',  name: 'CSV File',          desc: '.csv for lightweight data', icon: <FileText className="text-blue-600" /> },
                { id: 'json', name: 'System Backup',     desc: '.json for app restoration', icon: <History className="text-purple-600" /> }
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
// AUTH WRAPPER — routes between all auth/onboarding states
// =============================================================================
export default function App() {
  // Firebase auth & user doc state
  const [fbUser, setFbUser] = useState(undefined);         // undefined = loading
  const [userDoc, setUserDoc] = useState(null);
  const [memberships, setMemberships] = useState(null);    // null = not yet fetched
  const [selectedShopId, setSelectedShopId] = useState(null);

  // Onboarding flow state
  const [screen, setScreen] = useState('splash'); // 'splash' | 'no-membership' | 'create-shop' | 'join-shop' | 'shop-select'
  const [shopNameInput, setShopNameInput] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  // ── Watch Firebase auth state ──
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFbUser(null);
        setMemberships(null);
        setUserDoc(null);
        setSelectedShopId(null);
        setScreen('splash');
        return;
      }
      setFbUser(user);
      // Fetch / create user document
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const newDoc = { email: user.email, name: user.displayName, memberships: {} };
        await setDoc(userRef, newDoc);
        setUserDoc(newDoc);
        setMemberships({});
        setScreen('no-membership');
      } else {
        const data = snap.data();
        setUserDoc(data);
        const m = data.memberships || {};
        setMemberships(m);
        setScreen(Object.keys(m).length === 0 ? 'no-membership' : 'shop-select');
      }
    });
    return () => unsub();
  }, []);

  // ── CREATE SHOP ──
  const handleCreateShop = async () => {
    if (!shopNameInput.trim()) { setAuthError('Please enter a shop name.'); return; }
    setIsWorking(true); setAuthError('');
    try {
      const newShopId = `shop_${Date.now()}`;
      const joinCode = generateJoinCode();
      await setDoc(doc(db, 'shops', newShopId), { name: shopNameInput.trim(), joinCode, ownerId: fbUser.uid });
      const userRef = doc(db, 'users', fbUser.uid);
      await updateDoc(userRef, { [`memberships.${newShopId}`]: 'owner' });
      const updatedMemberships = { ...(memberships || {}), [newShopId]: 'owner' };
      setMemberships(updatedMemberships);
      setSelectedShopId(newShopId);
      setScreen('shop-select'); // will immediately launch POS
    } catch (err) {
      setAuthError(err.message);
    }
    setIsWorking(false);
  };

  // ── JOIN SHOP ──
  const handleJoinShop = async () => {
    if (!joinCodeInput.trim()) { setAuthError('Please enter a join code.'); return; }
    setIsWorking(true); setAuthError('');
    try {
      const q = query(collection(db, 'shops'), where('joinCode', '==', joinCodeInput.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) { setAuthError('No shop found with that join code.'); setIsWorking(false); return; }
      const foundShopId = snap.docs[0].id;
      const userRef = doc(db, 'users', fbUser.uid);
      await updateDoc(userRef, { [`memberships.${foundShopId}`]: 'staff' });
      const updatedMemberships = { ...(memberships || {}), [foundShopId]: 'staff' };
      setMemberships(updatedMemberships);
      setSelectedShopId(foundShopId);
      setScreen('shop-select');
    } catch (err) {
      setAuthError(err.message);
    }
    setIsWorking(false);
  };

  // ── GOOGLE SIGN IN ──
  const handleGoogleSignIn = async () => {
    setIsWorking(true); setAuthError('');
    try { await signInWithPopup(auth, googleProvider); }
    catch (err) { if (err.code !== 'auth/popup-closed-by-user') setAuthError(err.message); }
    setIsWorking(false);
  };

  // ── LOGOUT ──
  const handleLogout = async () => {
    await signOut(auth);
    setFbUser(null); setMemberships(null); setUserDoc(null);
    setSelectedShopId(null); setScreen('splash');
  };

  // ==========================================================================
  // If a shop is selected, render the POS engine
  // ==========================================================================
  if (fbUser && selectedShopId && memberships) {
    return (
      <POSApp
        shopId={selectedShopId}
        userRole={memberships[selectedShopId] || 'staff'}
        memberships={memberships}
        user={fbUser}
        onSwitchShop={() => setSelectedShopId(null)}
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================================================
  // RENDER: AUTH / ONBOARDING SCREENS
  // ==========================================================================

  // Loading state while Firebase resolves auth
  if (fbUser === undefined) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-2xl">
            <ShoppingCart size={32} className="text-white" />
          </div>
          <Loader2 size={24} className="text-red-400 animate-spin" />
        </div>
      </div>
    );
  }

  // ── NOT LOGGED IN ──
  if (!fbUser) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 font-sans p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 bg-red-600 rounded-3xl flex items-center justify-center shadow-[0_20px_60px_-10px_rgba(220,38,38,0.6)] border-b-4 border-red-800">
              <ShoppingCart size={48} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-4xl font-black text-white tracking-tighter">BIZ</h1>
              <p className="text-red-400 font-black tracking-[0.5em] text-sm uppercase">Point of Sale</p>
            </div>
          </div>

          {/* Card */}
          <div className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 flex flex-col gap-4 shadow-2xl">
            <p className="text-center text-gray-400 text-sm font-bold">Sign in to manage your shop</p>
            {authError && <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 rounded-xl p-3 border border-red-800">{authError}</p>}
            <button
              onClick={handleGoogleSignIn}
              disabled={isWorking}
              className="w-full py-4 bg-white hover:bg-gray-100 text-gray-800 font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isWorking ? (
                <Loader2 size={20} className="animate-spin text-gray-500" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
                  <path fill="#4285F4" d="M44.5 20H24v8.5h11.8C34.7 33.9 29.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
                </svg>
              )}
              {isWorking ? 'Signing in...' : 'Sign in with Google'}
            </button>
          </div>

          <p className="text-gray-600 text-xs font-bold text-center">
            &copy; {new Date().getFullYear()} Biz POS · Built by Kenn Egway
          </p>
        </div>
      </div>
    );
  }

  // ── CHECKING USER DOC (shown briefly) ──
  if (memberships === null) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600 flex items-center justify-center shadow-2xl">
            <ShoppingCart size={32} className="text-white" />
          </div>
          <p className="text-gray-400 text-sm font-bold animate-pulse">Loading your account...</p>
        </div>
      </div>
    );
  }

  // ── CREATE SHOP SCREEN ──
  if (screen === 'create-shop') {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-sans p-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-400 rounded-2xl shadow-xl mb-4 border-b-4 border-yellow-600">
              <Store size={32} className="text-yellow-900" />
            </div>
            <h2 className="text-2xl font-black text-white">Create Your Shop</h2>
            <p className="text-gray-400 text-sm mt-1 font-bold">You'll be the owner and get a join code for staff.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
            {authError && <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 rounded-xl p-3 border border-red-800">{authError}</p>}
            <input
              type="text"
              placeholder="Shop Name (e.g. Burger House — Main)"
              value={shopNameInput}
              onChange={(e) => setShopNameInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateShop()}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-500 font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
            />
            <button onClick={handleCreateShop} disabled={isWorking} className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black rounded-2xl shadow-xl active:scale-95 transition-all border-b-4 border-yellow-600 flex items-center justify-center gap-2 disabled:opacity-60">
              {isWorking ? <Loader2 size={18} className="animate-spin" /> : <Store size={18} />}
              {isWorking ? 'Creating...' : 'Create Shop'}
            </button>
          </div>
          <button onClick={() => { setScreen(Object.keys(memberships || {}).length === 0 ? 'no-membership' : 'shop-select'); setAuthError(''); }} className="text-gray-500 font-bold hover:text-gray-300 transition-colors text-sm text-center">← Back</button>
        </div>
      </div>
    );
  }

  // ── JOIN SHOP SCREEN ──
  if (screen === 'join-shop') {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-sans p-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl shadow-xl mb-4 border-b-4 border-blue-700">
              <Key size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Join a Shop</h2>
            <p className="text-gray-400 text-sm mt-1 font-bold">Enter the 6-character join code from your owner.</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
            {authError && <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 rounded-xl p-3 border border-red-800">{authError}</p>}
            <input
              type="text"
              placeholder="Join Code (e.g. AB12CD)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinShop()}
              maxLength={6}
              className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-gray-500 font-black text-2xl text-center tracking-[0.5em] uppercase focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all"
            />
            <button onClick={handleJoinShop} disabled={isWorking} className="w-full py-4 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all border-b-4 border-blue-700 flex items-center justify-center gap-2 disabled:opacity-60">
              {isWorking ? <Loader2 size={18} className="animate-spin" /> : <ChevronRight size={18} />}
              {isWorking ? 'Searching...' : 'Join Shop'}
            </button>
          </div>
          <button onClick={() => { setScreen(Object.keys(memberships || {}).length === 0 ? 'no-membership' : 'shop-select'); setAuthError(''); }} className="text-gray-500 font-bold hover:text-gray-300 transition-colors text-sm text-center">← Back</button>
        </div>
      </div>
    );
  }

  // ── NO MEMBERSHIPS ──
  if (screen === 'no-membership') {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-sans p-6">
        <div className="w-full max-w-sm flex flex-col gap-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-4 border-b-4 border-red-800">
              <ShoppingCart size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Welcome, {fbUser.displayName?.split(' ')[0]}!</h2>
            <p className="text-gray-400 text-sm mt-1 font-bold">You don't have a shop yet. Get started below.</p>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => { setScreen('create-shop'); setAuthError(''); setShopNameInput(''); }}
              className="w-full py-5 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black rounded-3xl shadow-2xl active:scale-95 transition-all border-b-4 border-yellow-600 flex items-center justify-center gap-3 text-lg">
              <Store size={24} /> Create a Shop <span className="text-xs font-bold opacity-70">(Owner)</span>
            </button>
            <button onClick={() => { setScreen('join-shop'); setAuthError(''); setJoinCodeInput(''); }}
              className="w-full py-5 bg-white/10 hover:bg-white/20 text-white font-black rounded-3xl active:scale-95 transition-all border border-white/20 flex items-center justify-center gap-3 text-lg">
              <Key size={24} /> Join a Shop <span className="text-xs font-bold opacity-50">(Staff)</span>
            </button>
          </div>
          <button onClick={handleLogout} className="text-gray-600 hover:text-gray-400 transition-colors text-xs font-bold text-center flex items-center justify-center gap-1">
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    );
  }

  // ── SHOP SELECTION ──
  // If screen is explicitly 'create-shop' or 'join-shop' from this flow, those
  // screens handle themselves above. We need to handle 'shop-select' landing.
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 font-sans p-6 overflow-y-auto">
      <div className="w-full max-w-sm flex flex-col gap-6 py-6">
        <div className="text-center">
          <img src={fbUser.photoURL} alt="avatar" className="w-14 h-14 rounded-full border-2 border-red-500 shadow-md mx-auto mb-3" onError={(e) => { e.target.style.display = 'none'; }} />
          <h2 className="text-xl font-black text-white">Select a Shop</h2>
          <p className="text-gray-500 text-xs font-bold mt-0.5">{fbUser.email}</p>
        </div>

        <div className="flex flex-col gap-2">
          {Object.entries(memberships).map(([sid, role]) => (
            <ShopSelectCard
              key={sid}
              shopId={sid}
              role={role}
              onSelect={() => setSelectedShopId(sid)}
              onDeleted={(deletedId) => {
                setMemberships(prev => {
                  const next = { ...prev };
                  delete next[deletedId];
                  return next;
                });
              }}
            />
          ))}
        </div>

        {/* Add Another Shop — shows both Create and Join options */}
        <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
          <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest text-center mb-1">Add Another Shop</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setScreen('create-shop'); setAuthError(''); setShopNameInput(''); }}
              className="py-3 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 font-black rounded-2xl border border-yellow-400/20 hover:border-yellow-400/40 transition-all flex flex-col items-center justify-center gap-1 text-xs active:scale-95"
            >
              <Store size={18} />
              Create
              <span className="text-[9px] opacity-60 font-bold">Owner</span>
            </button>
            <button
              onClick={() => { setScreen('join-shop'); setAuthError(''); setJoinCodeInput(''); }}
              className="py-3 bg-blue-400/10 hover:bg-blue-400/20 text-blue-400 font-black rounded-2xl border border-blue-400/20 hover:border-blue-400/40 transition-all flex flex-col items-center justify-center gap-1 text-xs active:scale-95"
            >
              <Key size={18} />
              Join
              <span className="text-[9px] opacity-60 font-bold">Staff / Co-owner</span>
            </button>
          </div>
          <button onClick={handleLogout} className="mt-2 text-gray-600 hover:text-gray-400 transition-colors text-xs font-bold text-center flex items-center justify-center gap-1">
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-component for the shop selection list (fetches name from Firestore)
function ShopSelectCard({ shopId, role, onSelect, onDeleted }) {
  const [shopName, setShopName] = useState(shopId);
  const [joinCode, setJoinCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showManage, setShowManage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const longPressTimer = React.useRef(null);

  useEffect(() => {
    getDoc(doc(db, 'shops', shopId)).then(snap => {
      if (snap.exists()) {
        setShopName(snap.data().name || shopId);
        setJoinCode(snap.data().joinCode || null);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [shopId, role]);

  // Long-press to open manage panel
  const handlePressStart = () => {
    longPressTimer.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(60);
      setShowManage(true);
    }, 600);
  };
  const handlePressEnd = () => clearTimeout(longPressTimer.current);

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${shopName}"? This removes the shop for ALL staff. This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      // Remove from shops collection (owner only)
      await setDoc(doc(db, 'shops', shopId), { deleted: true }, { merge: true });
      // Remove from current user's memberships via updateDoc
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), { [`memberships.${shopId}`]: null });
      }
      onDeleted?.(shopId);
    } catch (err) {
      window.alert('Failed to delete: ' + err.message);
    }
    setIsDeleting(false);
  };

  const handleLeave = async () => {
    if (!window.confirm(`Leave "${shopName}"? You will need a new join code to re-enter.`)) return;
    setIsDeleting(true);
    try {
      const { getAuth } = await import('firebase/auth');
      const uid = getAuth().currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, 'users', uid), { [`memberships.${shopId}`]: null });
      }
      onDeleted?.(shopId);
    } catch (err) {
      window.alert('Failed to leave: ' + err.message);
    }
    setIsDeleting(false);
  };

  return (
    <div className="flex flex-col gap-1">
      {/* Main select row */}
      <div className="w-full flex items-center gap-2">
        <button
          onClick={onSelect}
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          className="flex-1 flex items-start gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/50 rounded-2xl transition-all active:scale-95 group text-left min-w-0"
        >
          <div className="bg-red-600 p-2.5 rounded-xl shrink-0 group-hover:bg-red-500 transition-colors mt-0.5">
            <Store size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            {loading ? (
              <div className="h-4 bg-white/10 rounded w-2/3 animate-pulse" />
            ) : (
              <>
                <p className="font-black text-white break-words whitespace-normal leading-tight">{shopName}</p>
                {joinCode && <p className="text-[10px] text-gray-500 font-bold mt-0.5">Code: <span className="text-yellow-500 tracking-widest" style={{ fontFamily: "'Courier New', Courier, monospace" }}>{joinCode}</span></p>}
              </>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${role === 'owner' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'bg-blue-400/20 text-blue-400 border border-blue-400/30'}`}>{role}</span>
            <ChevronRight size={14} className="text-gray-600 group-hover:text-red-400 transition-colors" />
          </div>
        </button>
        {/* Manage button (gear icon) */}
        <button
          onClick={() => setShowManage(v => !v)}
          className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-500 hover:text-white transition-all active:scale-95 shrink-0"
          title="Manage shop"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Manage panel — shown on long-press or gear click */}
      {showManage && (
        <div className="ml-2 p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{shopName}</p>
          {isDeleting ? (
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold py-2">
              <Loader2 size={14} className="animate-spin" /> Processing...
            </div>
          ) : (
            <div className="flex gap-2">
              {role === 'owner' && (
                <button
                  onClick={handleDelete}
                  className="flex-1 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-black rounded-xl border border-red-500/20 text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <Trash2 size={12} /> Delete Shop
                </button>
              )}
              <button
                onClick={handleLeave}
                className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-400 font-black rounded-xl border border-white/10 text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <LogOut size={12} /> Leave Shop
              </button>
              <button
                onClick={() => setShowManage(false)}
                className="px-3 py-2 text-gray-600 hover:text-gray-400 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
