import React, { useState, useMemo, useEffect } from 'react';
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
  Trash2, 
  CheckCircle2, 
  ShoppingCart,
  X,
  Loader2
} from 'lucide-react';


// --- MENU DATA ---
const MENU = {
  orders: [
    { id: 'beef_burger', name: 'Beef Burger', price: 40 },
    { id: 'chiz_burger', name: 'Chiz Burger', price: 50 },
    { id: 'egg_sandwich', name: 'Egg Sandwich', price: 20 },
    { id: 'chiz_hotdog', name: 'Chiz Hotdog', price: 37 },
    { id: 'footlong', name: 'Footlong', price: 56 },
    { id: 'jalapeno', name: 'Jalapeño', price: 65 },
    { id: 'hungarian', name: 'Hungarian', price: 70 },
    { id: 'footlong_combo', name: 'Footlong Combo', price: 136 },
    { id: 'jalapeno_combo', name: 'Jalapeño Combo', price: 145 },
  ],
  extras: [
    { id: 'ex_chiz', name: 'Chiz', price: 5 },
    { id: 'ex_egg', name: 'Egg', price: 15 },
    { id: 'ex_bacon', name: 'Bacon', price: 25 },
    { id: 'ex_patty', name: 'Patty', price: 15 },
    { id: 'ex_b_buns', name: 'B. Buns', price: 5 },
    { id: 'custom_amount', name: 'Custom Value', price: 0 }
  ],
  drinks: [
    { id: 'dr_coke', name: 'Coke', price: 25 },
    { id: 'dr_sprite', name: 'Sprite', price: 25 },
    { id: 'dr_royal', name: 'Royal', price: 25 },
    { id: 'dr_predator', name: 'Predator', price: 25 },
    { id: 'dr_coke_zero', name: 'Coke Zero', price: 25 },
    { id: 'dr_water', name: 'Water', price: 16 }
  ]
};

// --- INGREDIENTS DB & PRICES (Matching the Google Sheet) ---
const INGREDIENTS_DB = {
  'Buns': 5,
  'HD Buns': 5,
  'FL Buns': 12,
  'Patty': 15,
  'FL Dog': 44,
  'Hungarian': 65,
  'Jalapeño': 53,
  'Chiz': 5,
  'Bacon': 25,
  'Hotdog': 13.5, 
  'Egg': 15,
  'Water': 16,
  'Coke': 25,
  'Sprite': 25,
  'Royal': 25,
  'Predator': 25,
  'Coke Zero': 25
};

// --- RECIPE MAPPING ---
const RECIPES = {
  'beef_burger': { 'Patty': 2, 'Buns': 2 },
  'chiz_burger': { 'Patty': 2, 'Buns': 2, 'Chiz': 2 },
  'egg_sandwich': { 'Egg': 1, 'Buns': 1 },
  'chiz_hotdog': { 'Hotdog': 2, 'HD Buns': 2 },
  'footlong': { 'FL Dog': 1, 'FL Buns': 1 },
  'jalapeno': { 'Jalapeño': 1, 'FL Buns': 1 },
  'hungarian': { 'Hungarian': 1, 'HD Buns': 1 },
  'footlong_combo': { 'FL Dog': 1, 'FL Buns': 1, 'Patty': 2, 'Egg': 2, 'Chiz': 4 },
  'jalapeno_combo': { 'Jalapeño': 1, 'FL Buns': 1, 'Patty': 2, 'Egg': 2, 'Chiz': 4 },
  'ex_chiz': { 'Chiz': 1 },
  'ex_egg': { 'Egg': 1 },
  'ex_bacon': { 'Bacon': 1 },
  'ex_patty': { 'Patty': 1 },
  'ex_b_buns': { 'Buns': 1 },
  'dr_coke': { 'Coke': 1 },
  'dr_coke_zero': { 'Coke Zero': 1 },
  'dr_sprite': { 'Sprite': 1 },
  'dr_royal': { 'Royal': 1 },
  'dr_predator': { 'Predator': 1 },
  'dr_water': { 'Water': 1 },
};

export default function App() {
  // --- STATE ---
  const [time, setTime] = useState(new Date());

  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('pos_config');
    return saved ? JSON.parse(saved) : { 
      timeFormat: '12h',
      theme: 'light',
      scale: 1,
      scale: 1,
      customPrices: { menu: {}, ingredients: {} }, customRecipes: {} 
    };
  });
  const [showSettings, setShowSettings] = useState(false);
  const [lastActiveCell, setLastActiveCell] = useState({rowIdx: 0, field: 'starting'});
  const [toast, setToast] = useState("");
  const [pasteModal, setPasteModal] = useState(false);
  const [manualPasteText, setManualPasteText] = useState("");


  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const [settingsTab, setSettingsTab] = useState('general');

  const [devContactModal, setDevContactModal] = useState(false);
  const [clearConfirmModal, setClearConfirmModal] = useState(false);

  const [selectedRecipeItem, setSelectedRecipeItem] = useState(MENU.orders[0].id);
  
  useEffect(() => {
    localStorage.setItem('pos_config', JSON.stringify(config));
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config]);

  const getMenuPrice = (id, defaultPrice) => config.customPrices.menu[id] ?? defaultPrice;
  const getIngredientPrice = (name, defaultPrice) => config.customPrices.ingredients[name] ?? defaultPrice;
  const getRecipe = (id) => config.customRecipes?.[id] || RECIPES[id];


  const [isAddMode, setIsAddMode] = useState(true);
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem('pos_orders');
    return saved ? JSON.parse(saved) : [{ id: 1, items: [], total: 0, timestamp: Date.now() }];
  });
  const [activeOrderId, setActiveOrderId] = useState(() => {
    const saved = localStorage.getItem('pos_activeOrderId');
    return saved ? JSON.parse(saved) : 1;
  });
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('pos_inventory');
    return saved ? JSON.parse(saved) : {};
  });
  const [showReport, setShowReport] = useState(false);
  const [customModal, setCustomModal] = useState({ isOpen: false, isRemoving: false });
  const [customValue, setCustomValue] = useState("");

  const ordersEndRef = React.useRef(null);
  const ordersContainerRef = React.useRef(null);
  const [showScrollDown, setShowScrollDown] = useState(false);

  useEffect(() => {
    if (ordersEndRef.current) {
      ordersEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [orders.length]);

  const handleOrdersScroll = () => {
    if (!ordersContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = ordersContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 50) {
      setShowScrollDown(true);
    } else {
      setShowScrollDown(false);
    }
  };

  const scrollToLatest = () => {
    if (ordersEndRef.current) {
      ordersEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };



  // --- LOCAL SYNC & CLOCK ---
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('pos_orders', JSON.stringify(orders));
    localStorage.setItem('pos_activeOrderId', JSON.stringify(activeOrderId));
    localStorage.setItem('pos_inventory', JSON.stringify(inventory));
  }, [orders, activeOrderId, inventory]);


  // --- LOGIC: CART MANAGEMENT ---
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
    if (item.id === 'custom_amount') {
      setCustomValue("");
      setCustomModal({ isOpen: true, isRemoving: !isAddMode });
      return;
    }

    setOrders((prev) => prev.map(order => {
      if (order.id !== activeOrderId) return order;

      const newItems = [...order.items];
      const existingItemIndex = newItems.findIndex((i) => i.id === item.id);
      
      if (isAddMode) {
        if (existingItemIndex >= 0) {
          newItems[existingItemIndex] = { ...newItems[existingItemIndex], qty: newItems[existingItemIndex].qty + 1 };
        } else {
          newItems.push({ ...item, qty: 1, dynamicPrice: getMenuPrice(item.id, item.price) });
        }
      } else {
        if (existingItemIndex >= 0) {
          const newQty = newItems[existingItemIndex].qty - 1;
          if (newQty <= 0) {
            newItems.splice(existingItemIndex, 1);
          } else {
            newItems[existingItemIndex] = { ...newItems[existingItemIndex], qty: newQty };
          }
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
    const newOrder = { id: newId, items: [], total: 0, timestamp: Date.now() };
    setOrders(prev => [...prev, newOrder]);
    setActiveOrderId(newId);
  };

  const handleInventoryInput = (ingredient, field, value) => {
    const numValue = value === '' ? '' : parseInt(value) || 0;
    setInventory(prev => ({
      ...prev,
      [ingredient]: {
        ...(prev[ingredient] || { starting: '', deliver: '', waste: '' }),
        [field]: numValue
      }
    }));
  };

  // --- LOGIC: REPORT GENERATION (SPREADSHEET FORMAT) ---
  

  const handleClearDataClick = () => {
    setClearConfirmModal(true);
  };
  const confirmClearData = () => {
    setOrders([{ id: 1, items: [], total: 0, timestamp: Date.now() }]);
    setActiveOrderId(1);
    setInventory({});
    setShowReport(false);
    setClearConfirmModal(false);
  };
  const backupAndClear = () => {
    exportData('json');
    confirmClearData();
  };


  const exportData = (format) => {
    const timestamp = new Date().toLocaleDateString().replace(/\//g,'-');
    if (format === 'csv') {
      let csv = "Item,Starting,Deliver,Waste,Ending,Sold,Price,Sales\n";
      spreadsheetData.rows.forEach(r => {
        csv += `${r.name},${r.start},${r.deliver},${r.waste},${r.ending},${r.sold},${r.price},${r.sales}\n`;
      });
      csv += `,,,,,,,Total Sales: ${spreadsheetData.grandTotalSales}\n`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Report_${timestamp}.csv`; a.click();
    } else if (format === 'json') {
      const data = {
        orders,
        inventory,
        spreadsheet: spreadsheetData.rows,
        totalSales: spreadsheetData.grandTotalSales
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `Backup_${timestamp}.json`; a.click();
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.text("Inventory Report", 14, 15);
      doc.autoTable({
        startY: 20,
        head: [['Item', 'Starting', 'Deliver', 'Waste', 'Ending', 'Sold', 'Price', 'Sales']],
        body: spreadsheetData.rows.map(r => [r.name, r.start, r.deliver, r.waste, r.ending, r.sold, r.price, r.sales]),
        foot: [['', '', '', '', '', '', 'Total', spreadsheetData.grandTotalSales]]
      });
      doc.save(`Report_${timestamp}.pdf`);
    } else if (format === 'xlsx') {
      const ws_data = [["Item", "Starting", "Deliver", "Waste", "Ending", "Sold", "Price", "Sales"]];
      spreadsheetData.rows.forEach(r => ws_data.push([r.name, r.start, r.deliver, r.waste, r.ending, r.sold, r.price, r.sales]));
      ws_data.push(["", "", "", "", "", "", "Total Sales", spreadsheetData.grandTotalSales]);
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Report");
      XLSX.writeFile(wb, `Report_${timestamp}.xlsx`);
    }
  };

  const importJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (parsed.orders && Array.isArray(parsed.orders)) {
          setOrders(parsed.orders);
          setActiveOrderId(Math.max(...parsed.orders.map(o => o.id), 0) || 1);
        }
        if (parsed.inventory) setInventory(parsed.inventory);
        setToast("Backup JSON loaded!");
      } catch (err) {
        setToast("Failed to parse JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const handleTableKeyDown = (e, rowIdx, field) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.querySelector(`input[data-row="${rowIdx + 1}"][data-field="${field}"]`);
      if (nextInput) nextInput.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.querySelector(`input[data-row="${rowIdx - 1}"][data-field="${field}"]`);
      if (prevInput) prevInput.focus();
    }
  };

    const processPastedText = (text) => {
    if (!text) {
      setToast("Data is empty!");
      return;
    }
    const rowsRaw = text.split(/\r?\n/).filter(r => r.trim() !== '');
    if (rowsRaw.length === 0) {
      setToast("No detectable data.");
      return;
    }

    const parseVal = (val) => {
      if (!val || val.trim() === '') return '';
      const num = parseInt(val.replace(/,/g, ''), 10);
      return isNaN(num) ? '' : num;
    };

    setInventory(prev => {
      const nextInv = { ...prev };
      rowsRaw.forEach((rowRaw, rOffset) => {
        const cols = rowRaw.split('\t');
        if (!cols.length) return;
        const targetRowIdx = lastActiveCell.rowIdx + rOffset;
        if (targetRowIdx >= spreadsheetData.rows.length) return;
        const rowName = spreadsheetData.rows[targetRowIdx].name;
        nextInv[rowName] = { ...(nextInv[rowName] || { starting: '', deliver: '', waste: '' }) };
        if (lastActiveCell.field === 'starting') {
           nextInv[rowName]['starting'] = parseVal(cols[0]);
           if(cols.length > 1) nextInv[rowName]['deliver'] = parseVal(cols[1]);
           if(cols.length > 2) nextInv[rowName]['waste'] = parseVal(cols[2]);
        } else if (lastActiveCell.field === 'deliver') {
           nextInv[rowName]['deliver'] = parseVal(cols[0]);
           if(cols.length > 1) nextInv[rowName]['waste'] = parseVal(cols[1]);
        } else if (lastActiveCell.field === 'waste') {
           nextInv[rowName]['waste'] = parseVal(cols[0]);
        }
      });
      return nextInv;
    });
    setToast("Pasted successfully!");
  };

  const handleManualPaste = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setPasteModal(true);
        return;
      }
      const text = await navigator.clipboard.readText();
      if (!text) {
        setToast("Clipboard is empty!");
        return;
      }
      processPastedText(text);
    } catch (err) {
      console.warn("Clipboard API blocked, falling back to manual entry", err);
      setPasteModal(true);
    }
  };

  const handleTablePaste = (e, rowIdx, field) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const rowsRaw = pasteData.split(/\r?\n/).filter(r => r.trim() !== '');

    const parseVal = (val) => {
      if (!val || val.trim() === '') return '';
      const num = parseInt(val.replace(/,/g, ''), 10);
      return isNaN(num) ? '' : num;
    };

    setInventory(prev => {
      const nextInv = { ...prev };
      
      rowsRaw.forEach((rowRaw, rOffset) => {
        const cols = rowRaw.split('\t');
        if (!cols.length) return;
        
        const targetRowIdx = rowIdx + rOffset;
        if (targetRowIdx >= spreadsheetData.rows.length) return;
        
        const rowName = spreadsheetData.rows[targetRowIdx].name;
        nextInv[rowName] = { ...(nextInv[rowName] || { starting: '', deliver: '', waste: '' }) };
        
        if (field === 'starting') {
           nextInv[rowName]['starting'] = parseVal(cols[0]);
           if(cols.length > 1) nextInv[rowName]['deliver'] = parseVal(cols[1]);
           if(cols.length > 2) nextInv[rowName]['waste'] = parseVal(cols[2]);
        } else if (field === 'deliver') {
           nextInv[rowName]['deliver'] = parseVal(cols[0]);
           if(cols.length > 1) nextInv[rowName]['waste'] = parseVal(cols[1]);
        } else if (field === 'waste') {
           nextInv[rowName]['waste'] = parseVal(cols[0]);
        }
      });
      return nextInv;
    });
  };

  const spreadsheetData = useMemo(() => {
    // 1. Calculate total sold per raw ingredient
    const ingredientsSold = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const recipe = getRecipe(item.id);
        if (recipe) {
          Object.entries(recipe).forEach(([ingredient, qtyNeeded]) => {
            const totalUsed = qtyNeeded * item.qty;
            ingredientsSold[ingredient] = (ingredientsSold[ingredient] || 0) + totalUsed;
          });
        }
      });
    });

    // 2. Map to spreadsheet rows
    let grandTotalSales = 0;
    const rows = Object.entries(INGREDIENTS_DB).map(([name, defaultP]) => {
      const price = getIngredientPrice(name, defaultP);
      const sold = ingredientsSold[name] || 0;
      const start = parseInt(inventory[name]?.starting) || 0;
      const deliver = parseInt(inventory[name]?.deliver) || 0;
      const waste = parseInt(inventory[name]?.waste) || 0;
      
      const ending = start + deliver - waste - sold;
      const sales = sold * price;
      
      grandTotalSales += sales;

      return { name, start, deliver, waste, sold, ending, price, sales };
    });

    return { rows, grandTotalSales };
  }, [orders, inventory]);

  // --- COMPONENTS ---
  const ItemButton = ({ item }) => {
    const activeOrder = orders.find(o => o.id === activeOrderId) || { items: [] };
    let cartQty = 0;
    if (item.id === 'custom_amount') {
      cartQty = activeOrder.items.filter(i => i.id.toString().startsWith('custom_')).reduce((sum, i) => sum + i.qty, 0);
    } else {
      const cartItem = activeOrder.items.find(i => i.id === item.id);
      cartQty = cartItem ? cartItem.qty : 0;
    }

    const clickHandler = (e) => {
      e.preventDefault(); 
      handleItemClick(item);
    };

    const contextMenuHandler = (e) => {
      e.preventDefault();
      handleItemLongPress(item);
    };

    return (
      <button
        onClick={clickHandler}
        onContextMenu={contextMenuHandler}
        className={`touch-manipulation relative flex flex-col items-center justify-center p-1 min-h-[55px] rounded-sm transition-all duration-150 active:scale-95 border select-none overflow-hidden
          ${isAddMode 
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
            {item.name.split(' ').map((word, i) => (
              <span key={i}>{word}</span>
            ))}
          </span>
        )}
      </button>
    );
  };

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
              <span className="text-blue-600 dark:text-blue-400 font-black">{item.qty}x</span> 
              <span className="flex-1 whitespace-normal break-words leading-tight">{item.name}</span>
            </span>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    );
  };

  return (
    <div className="flex flex-col sm:flex-row h-[100dvh] bg-gray-100 dark:bg-gray-900 font-sans overflow-hidden transition-colors" style={{ zoom: config.scale || 1 }}>
      
      {/* ================= LEFT/TOP PANEL: ORDER LIST ================= */}
      <div className="w-full sm:w-[40%] md:w-[35%] flex-1 min-h-[30dvh] sm:h-[100dvh] bg-[#F8F9FA] dark:bg-gray-900 border-b sm:border-b-0 sm:border-r border-gray-300 dark:border-gray-800 flex flex-col z-20 relative">
        
        {/* Header - Center Revenue */}
        <div className="bg-red-600 text-white px-2 py-2 shadow-sm flex justify-between items-center z-10 shrink-0 gap-1 tutorial-topbar">
          <h1 onClick={() => setDevContactModal(true)} className="text-xs sm:text-base font-black tracking-tight text-yellow-300 flex flex-col leading-[0.8] items-start ml-1 cursor-pointer hover:scale-105 transition-transform">
            <span>ANGEL'S</span>
            <span className="text-white text-[9px] tracking-widest mt-0.5">POS</span>
          </h1>
          <div className="flex gap-1 sm:gap-2">
            <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1 rounded-lg shadow-inner min-w-[70px] sm:min-w-[80px] justify-center">
               <span className="text-[8px] font-bold text-red-200 uppercase tracking-widest mb-0.5">Revenue</span>
               <span className="text-sm sm:text-base font-black text-white leading-none">₱{orders.reduce((sum, o) => sum + o.total, 0)}</span>
            </div>
            
            <div className="flex flex-col items-center bg-black/20 px-2 sm:px-3 py-1 rounded-lg shadow-inner min-w-[70px] sm:min-w-[80px] justify-center">
               <span className="text-[8px] font-bold text-red-200 uppercase tracking-widest mb-0.5">Time</span>
               <span className="text-[12px] sm:text-base font-black text-white leading-none whitespace-nowrap">
                 {time.toLocaleTimeString([], config.timeFormat === '24h' ? { hour: '2-digit', minute: '2-digit', hour12: false } : { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}
               </span>
            </div>

            <button onClick={() => setShowSettings(true)} className="flex items-center justify-center bg-black/20 px-2 sm:px-3 rounded-lg shadow-inner text-white hover:bg-black/40 transition-colors mr-1 cursor-pointer">
               <Settings size={20} />
            </button>
          </div>
        </div>

        {/* List Content - Now 2 columns logic, linear items inside */}
        <div 
          ref={ordersContainerRef}
          onScroll={handleOrdersScroll}
          className="flex-1 overflow-y-auto p-1 bg-gray-50 dark:bg-gray-950 content-start grid grid-cols-2 gap-1 relative scroll-smooth tutorial-orderlist"
        >
          {orders.map((order) => {
            const isActive = activeOrderId === order.id;
            return (
              <div 
                key={order.id}
                onClick={() => setActiveOrderId(order.id)}
                className={`cursor-pointer border-2 rounded-xl p-2 transition-all flex flex-col ${
                  isActive 
                    ? 'border-yellow-400 bg-white dark:bg-gray-800 shadow-md ring-2 ring-yellow-400/30 scale-[1.02]' 
                    : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 hover:border-yellow-300 dark:hover:border-yellow-600 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center mb-2 border-b border-gray-100 dark:border-gray-800 pb-1">
                  <span className={`font-black text-sm ${isActive ? 'text-red-600' : 'text-gray-700'}`}>
                    #{order.id}
                  </span>
                  <span className={`font-black text-xl sm:text-2xl pt-1 ${isActive ? 'text-red-700' : 'text-gray-800'}`}>
                    ₱{order.total}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold shrink-0">
                    {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <OrderItemList items={order.items} isActive={isActive} />
              </div>
            );
          })}
          <div ref={ordersEndRef} className="col-span-2 h-2 shrink-0" />
        </div>

        {/* Helper Button */}
        {showScrollDown && (
          <button 
            onClick={scrollToLatest}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-full shadow-[0_4px_15px_-3px_rgba(37,99,235,0.5)] font-black text-xs flex items-center justify-center gap-1 hover:bg-blue-700 animate-in fade-in slide-in-from-bottom border-2 border-blue-400 active:scale-95"
          >
            LATEST ORDER ↓
          </button>
        )}
      </div>

      {/* ================= RIGHT/BOTTOM PANEL: ITEMS & CONTROLS ================= */}
      <div className="w-full sm:w-[60%] md:w-[65%] shrink-0 sm:shrink sm:h-[100dvh] flex flex-col bg-gray-100 dark:bg-gray-950 max-h-[60dvh] sm:max-h-full overflow-hidden shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)] sm:shadow-none z-30">
        
        {/* Top Bar: Add/Minus, New Order, Report Button */}
        <div className="bg-white dark:bg-gray-900 p-2 flex justify-between items-center border-b border-gray-300 dark:border-gray-800 shadow-sm z-10 gap-2">
          
          {/* Minimal Toggle */}
          <div className="flex bg-gray-200 p-0.5 rounded-lg shadow-inner relative w-[72px] tutorial-toggle">
            <div 
              className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md transition-all duration-300 ease-in-out shadow-sm
                ${isAddMode ? 'left-0.5 bg-green-500' : 'left-[calc(50%+1px)] bg-red-500'}
              `}
            />
            <button 
              onClick={() => setIsAddMode(true)}
              className={`flex-1 py-1.5 flex items-center justify-center font-black z-10 transition-colors
                ${isAddMode ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Plus size={16} />
            </button>
            <button 
              onClick={() => setIsAddMode(false)}
              className={`flex-1 py-1.5 flex items-center justify-center font-black z-10 transition-colors
                ${!isAddMode ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Minus size={16} />
            </button>
          </div>

          {/* New Order */}
          <button 
            onClick={createNewOrder}
            className="flex-1 py-1.5 px-2 rounded-lg bg-yellow-400 tutorial-neworder tutorial-neworder text-yellow-900 font-black text-xs flex items-center justify-center gap-1 hover:bg-yellow-500 transition-colors shadow-sm active:scale-95 tracking-wide ring-1 ring-yellow-500/50"
          >
            <Plus size={16} strokeWidth={3} /> NEW ORDER
          </button>

          {/* Sheet Report */}
          <button 
            onClick={() => setShowReport(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-lg font-bold text-[11px] tutorial-report-btn tutorial-report-btn hover:bg-gray-800 transition-all shadow-sm active:scale-95"
          >
            <FileText size={14} /> REPORT
          </button>
        </div>

        {/* Menu Grid Container */}
        <div className="overflow-y-auto sm:flex-1 p-1 bg-white dark:bg-gray-900 w-full">
          <div className="max-w-4xl mx-auto flex flex-col gap-1 tutorial-items">
            
            <section className="flex flex-row items-stretch border-b border-gray-100 dark:border-gray-800 pb-1">
              <div className="w-4 shrink-0 bg-red-600 flex items-center justify-center rounded-l-sm">
                <span className="text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Main Orders</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-0.5 ml-0.5">
                {MENU.orders.map(item => <ItemButton key={item.id} item={item} />)}
              </div>
            </section>

            <section className="flex flex-row items-stretch border-b border-gray-100 dark:border-gray-800 pb-1">
              <div className="w-4 shrink-0 bg-yellow-400 flex items-center justify-center rounded-l-sm">
                <span className="text-[8px] font-black text-yellow-900 uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Extras</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-0.5 ml-0.5">
                {MENU.extras.map(item => <ItemButton key={item.id} item={item} />)}
              </div>
            </section>

            <section className="flex flex-row items-stretch border-b border-gray-100 dark:border-gray-800 pb-1">
              <div className="w-4 shrink-0 bg-blue-500 flex items-center justify-center rounded-l-sm">
                <span className="text-[8px] font-black text-white uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Drinks</span>
              </div>
              <div className="flex-1 grid grid-cols-3 gap-0.5 ml-0.5">
                {MENU.drinks.map(item => <ItemButton key={item.id} item={item} />)}
              </div>
            </section>

          </div>
        </div>
      </div>

      {/* ================= SPREADSHEET REPORT MODAL ================= */}
      {showReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[95vh] overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
            
            <div className="bg-gray-900 text-white p-3 sm:p-4 flex justify-between items-center shadow-md z-10">
              <div>
                <h2 className="text-sm sm:text-lg font-black flex items-center gap-2">
                  <FileText className="text-yellow-400" size={16} /> Inventory Sheet
                </h2>
                <p className="text-gray-400 text-[10px] sm:text-xs mt-0.5">End calculated: Starting + Deliver - Waste - Sold</p>
              </div>
              <div className="flex gap-2">
                <label className="p-1.5 hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 text-xs text-green-400 cursor-pointer">
                  <Upload size={18} /> <span className="hidden sm:inline">Import</span>
                  <input type="file" accept=".json" className="hidden" onChange={importJSON} />
                </label>
                <button onClick={handleManualPaste} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors flex items-center gap-1 text-xs text-blue-300">
                  <ClipboardPaste size={18} /> <span className="hidden sm:inline">Paste</span>
                </button>
                <select onChange={(e) => { if(e.target.value) exportData(e.target.value); e.target.value=''; }} className="p-1.5 bg-gray-800 rounded-full transition-colors text-xs text-gray-200 border-none outline-none focus:ring-2 focus:ring-yellow-400">
                  <option value="">⬇ Export</option>
                  <option value="xlsx">Excel (.xlsx)</option>
                  <option value="csv">CSV (.csv)</option>
                  <option value="pdf">PDF (.pdf)</option>
                  <option value="json">Backup (.json)</option>
                </select>
                <button onClick={() => setShowReport(false)} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* SPREADSHEET TABLE */}
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
                      
                      {/* Inputs */}
                      <td className="p-0 border-r border-gray-200 bg-blue-50/20 dark:bg-blue-50/5">
                        <input 
                          type="number" 
                          data-row={idx}
                          data-field="starting"
                          onKeyDown={(e) => handleTableKeyDown(e, idx, 'starting')}
                          onPaste={(e) => handleTablePaste(e, idx, 'starting')}
                          onFocus={() => setLastActiveCell({rowIdx: idx, field: 'starting'})}
                          value={inventory[row.name]?.starting || ''}
                          onChange={(e) => handleInventoryInput(row.name, 'starting', e.target.value)}
                          className="w-full h-full p-2 text-center bg-transparent dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-0 border-r border-gray-200 bg-blue-50/20 dark:bg-blue-50/5">
                        <input 
                          type="number" 
                          data-row={idx}
                          data-field="deliver"
                          onKeyDown={(e) => handleTableKeyDown(e, idx, 'deliver')}
                          onPaste={(e) => handleTablePaste(e, idx, 'deliver')}
                          onFocus={() => setLastActiveCell({rowIdx: idx, field: 'deliver'})}
                          value={inventory[row.name]?.deliver || ''}
                          onChange={(e) => handleInventoryInput(row.name, 'deliver', e.target.value)}
                          className="w-full h-full p-2 text-center bg-transparent dark:text-white focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </td>
                      <td className="p-0 border-r border-gray-200 bg-red-50/20 dark:bg-red-50/5">
                        <input 
                          type="number" 
                          data-row={idx}
                          data-field="waste"
                          onKeyDown={(e) => handleTableKeyDown(e, idx, 'waste')}
                          onPaste={(e) => handleTablePaste(e, idx, 'waste')}
                          onFocus={() => setLastActiveCell({rowIdx: idx, field: 'waste'})}
                          value={inventory[row.name]?.waste || ''}
                          onChange={(e) => handleInventoryInput(row.name, 'waste', e.target.value)}
                          className="w-full h-full p-2 text-center bg-transparent focus:bg-white dark:focus:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-red-500 text-red-600 dark:text-red-400 [&::-webkit-inner-spin-button]:appearance-none"
                          placeholder="0"
                        />
                      </td>
                      
                      {/* Calculated Columns */}
                      <td className="p-2 border-r border-gray-200 text-center font-black text-green-700 bg-green-50/50">{row.ending}</td>
                      <td className="p-2 border-r border-gray-200 text-center font-bold text-blue-600 bg-gray-50">{row.sold}</td>
                      <td className="p-2 border-r border-gray-200 text-right text-gray-500">{row.price}</td>
                      <td className="p-2 text-right font-bold text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800">₱{row.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 sm:p-4 bg-gray-100 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
              <div className="bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border dark:border-gray-700 shadow-sm">
                <p className="text-gray-500 font-bold uppercase text-[10px] sm:text-xs mb-0.5">Calculated Total Sales</p>
                <p className="text-xl sm:text-3xl font-black text-green-600">₱{spreadsheetData.grandTotalSales}</p>
              </div>
              <button 
                onClick={handleClearDataClick}
                className="px-4 py-2 bg-red-600 text-white text-[10px] sm:text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-md"
              >
                START NEW SHIFT (CLEAR DATA)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= CUSTOM VALUE MODAL ================= */}
      {customModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className={`p-4 text-white font-black text-center ${customModal.isRemoving ? 'bg-red-600' : 'bg-yellow-500'}`}>
              <h2 className="text-xl uppercase tracking-widest">{customModal.isRemoving ? 'Remove Custom' : 'Add Custom Amount'}</h2>
            </div>
            <div className="p-6">
              <input 
                type="number"
                inputMode="numeric"
                autoFocus
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Enter amount (₱)"
                className="w-full text-center text-4xl font-black text-gray-800 p-4 rounded-xl border-2 border-gray-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all"
              />
            </div>
            <div className="p-4 bg-gray-50 border-t flex gap-3">
              <button 
                onClick={() => { setCustomModal({ isOpen: false, isRemoving: false }); setCustomValue(""); }}
                className="flex-1 py-3 font-bold text-gray-600 bg-gray-200 rounded-xl hover:bg-gray-300 active:scale-95 transition-all"
              >
                CANCEL
              </button>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  const val = Number(customValue);
                  if (!val || val <= 0) {
                    setCustomModal({ isOpen: false, isRemoving: false });
                    setCustomValue("");
                    return;
                  }
                  const targetItem = {
                    id: `custom_${val}`,
                    name: `Custom ₱${val}`,
                    price: val
                  };

                  setOrders((prev) => prev.map(order => {
                    if (order.id !== activeOrderId) return order;
                    const newItems = [...order.items];
                    const existingItemIndex = newItems.findIndex((i) => i.id === targetItem.id);
                    
                    if (!customModal.isRemoving) {
                      if (existingItemIndex >= 0) {
                        newItems[existingItemIndex] = { ...newItems[existingItemIndex], qty: newItems[existingItemIndex].qty + 1 };
                      } else {
                        newItems.push({ ...targetItem, qty: 1 });
                      }
                    } else {
                      if (existingItemIndex >= 0) {
                        const newQty = newItems[existingItemIndex].qty - 1;
                        if (newQty <= 0) {
                          newItems.splice(existingItemIndex, 1);
                        } else {
                          newItems[existingItemIndex] = { ...newItems[existingItemIndex], qty: newQty };
                        }
                      }
                    }

                    const newTotal = newItems.reduce((sum, i) => sum + ((i.dynamicPrice ?? i.price) * i.qty), 0);
                    return { ...order, items: newItems, total: newTotal };
                  }));
                  
                  setCustomModal({ isOpen: false, isRemoving: false });
                  setCustomValue("");
                }}
                className={`flex-1 py-3 font-black text-white rounded-xl active:scale-95 transition-all shadow-md ${customModal.isRemoving ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-500 hover:bg-yellow-600'}`}
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ================= SETTINGS MODAL ================= */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-200 dark:border-gray-800 max-h-[90vh]">
            <div className="bg-gray-900 text-white p-3 sm:p-4 flex justify-between items-center shadow-md">
              <h2 className="text-sm sm:text-lg font-black flex items-center gap-2">
                <Settings className="text-yellow-400" size={16} /> System Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-gray-800 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex border-b dark:border-gray-800">
              <button 
                onClick={() => setSettingsTab('general')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'general' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                General Config
              </button>
              <button 
                onClick={() => setSettingsTab('prices')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'prices' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Item Prices (Overrides)
              </button>
              <button 
                onClick={() => setSettingsTab('recipes')}
                className={`flex-1 py-3 text-sm font-bold transition-colors ${settingsTab === 'recipes' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                Recipe Ingredients
              </button>
            </div>
            
            {/* selected recipe state hack because it's rendering inside root App component */}


            <div className="p-4 overflow-y-auto flex-1 dark:text-gray-200 custom-scrollbar">
              {settingsTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase text-xs tracking-wider">Clock Format</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setConfig(p => ({ ...p, timeFormat: '12h' }))}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${config.timeFormat === '12h' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <Clock size={16} /> 12-Hour
                      </button>
                      <button 
                        onClick={() => setConfig(p => ({ ...p, timeFormat: '24h' }))}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${config.timeFormat === '24h' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <Clock size={16} /> 24-Hour
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 uppercase text-xs tracking-wider">Theme Profile</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setConfig(p => ({ ...p, theme: 'light' }))}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${config.theme === 'light' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <Sun size={16} /> Light Mode
                      </button>
                      <button 
                        onClick={() => setConfig(p => ({ ...p, theme: 'dark' }))}
                        className={`flex-1 py-2 rounded-lg font-bold border-2 transition-all flex items-center justify-center gap-2 ${config.theme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <Moon size={16} /> Dark Mode
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'prices' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4">
                    Modify prices for the Menu items and Spreadsheet references. Overrides standard values.
                  </p>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-black border-b pb-1 mb-2 dark:border-gray-700 text-sm">Menu Orders</h3>
                      {MENU.orders.map(item => (
                        <div key={item.id} className="flex justify-between items-center mb-1 bg-gray-50 dark:bg-gray-800 p-1 rounded">
                          <span className="text-xs font-bold">{item.name} <span className="text-[9px] text-gray-400 font-normal">({item.price})</span></span>
                          <input 
                            type="number" 
                            className="w-16 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded p-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                            placeholder={item.price}
                            value={config.customPrices.menu[item.id] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig(p => {
                                const cp = { ...p.customPrices };
                                if(val === '') delete cp.menu[item.id];
                                else cp.menu[item.id] = Number(val);
                                return { ...p, customPrices: cp };
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <h3 className="font-black border-b pb-1 mb-2 dark:border-gray-700 text-sm">Spreadsheet Ingredients</h3>
                      {Object.entries(INGREDIENTS_DB).map(([name, defaultP]) => (
                        <div key={name} className="flex justify-between items-center mb-1 bg-gray-50 dark:bg-gray-800 p-1 rounded">
                          <span className="text-xs font-bold">{name} <span className="text-[9px] text-gray-400 font-normal">({defaultP})</span></span>
                          <input 
                            type="number" 
                            className="w-16 bg-white dark:bg-gray-900 border dark:border-gray-700 rounded p-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                            placeholder={defaultP}
                            value={config.customPrices.ingredients[name] ?? ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setConfig(p => {
                                const cp = { ...p.customPrices };
                                if(val === '') delete cp.ingredients[name];
                                else cp.ingredients[name] = Number(val);
                                return { ...p, customPrices: cp };
                              });
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            
              {settingsTab === 'recipes' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-4">
                    Modify the exact ingredients used per item. This affects inventory tracking.
                  </p>
                  
                  <div className="mb-4">
                    <select 
                      value={selectedRecipeItem} 
                      onChange={(e) => setSelectedRecipeItem(e.target.value)}
                      className="w-full sm:w-1/2 p-2 rounded border bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                    >
                      {[...MENU.orders, ...MENU.extras, ...MENU.drinks].map(item => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {Object.keys(INGREDIENTS_DB).map(ing => {
                       const currentRecipe = config.customRecipes?.[selectedRecipeItem] || RECIPES[selectedRecipeItem];
                       const val = currentRecipe?.[ing] || '';
                       return (
                         <div key={ing} className="flex justify-between items-center bg-gray-100 dark:bg-gray-800 p-2 rounded shadow-sm">
                           <span className="text-xs font-bold truncate max-w-[80px]" title={ing}>{ing}</span>
                           <input type="number" 
                                  value={val}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setConfig(p => {
                                       const n = { ...p.customRecipes };
                                       if (!n[selectedRecipeItem]) n[selectedRecipeItem] = { ...(RECIPES[selectedRecipeItem] || {}) };
                                       
                                       if (!v || v === '0') {
                                         delete n[selectedRecipeItem][ing];
                                       } else {
                                         n[selectedRecipeItem][ing] = Number(v);
                                       }
                                       return { ...p, customRecipes: n };
                                    });
                                  }}
                                  className="w-14 p-1 text-xs text-center border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded outline-none focus:border-blue-400 dark:focus:border-blue-500 [&::-webkit-inner-spin-button]:appearance-none dark:text-white"/>
                         </div>
                       )
                    })}
                  </div>
                </div>
              )}
</div>
            <div className="p-3 bg-gray-100 dark:bg-gray-800 border-t dark:border-gray-700 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold italic">
                Vibecoded and deployed by{' '}
                <button onClick={() => setDevContactModal(true)} className="text-blue-500 hover:underline font-bold cursor-pointer">Kenn Egway</button>
              </p>
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-gray-800 text-white text-xs font-bold rounded hover:bg-gray-700 transition"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
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

      {clearConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/60 z-[250] backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm p-6 text-center shadow-2xl border border-gray-200 dark:border-gray-800">
            <h3 className="font-black text-xl mb-2 text-red-600">Clear Shift Data?</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6 font-bold leading-relaxed">
              This will instantly wipe all active orders and inventory numbers, preparing the app for a brand new shift. <br/><br/>
              It is <span className="text-blue-500">highly recommended</span> to backup your data as a JSON file before clearing, in case you need to view or restore it later.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={backupAndClear} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-md transition-all active:scale-95">BACKUP JSON & CLEAR</button>
              <button onClick={confirmClearData} className="w-full py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50 rounded-xl font-bold transition-all active:scale-95">Clear Without Backup</button>
              <button onClick={() => setClearConfirmModal(false)} className="w-full py-3 mt-2 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-white transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}



      {/* ================= PASTE MODAL (FALLBACK) ================= */}
      {pasteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-800">
            <div className="p-4 bg-gray-900 text-white font-black flex justify-between items-center shadow-md">
              <h2 className="text-sm sm:text-lg flex items-center gap-2">
                <ClipboardPaste size={16} className="text-blue-400" /> Manual Paste
              </h2>
              <button onClick={() => setPasteModal(false)} className="p-1 hover:bg-gray-800 rounded-full transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-4 flex flex-col gap-3">
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 font-bold leading-snug">
                Your browser blocked direct clipboard access. Please <span className="text-blue-500">long-press the box below</span> and select "Paste" manually.
              </p>
              <textarea 
                autoFocus
                value={manualPasteText}
                onChange={(e) => setManualPasteText(e.target.value)}
                placeholder="Paste items here..."
                className="w-full text-xs font-mono text-gray-800 dark:text-gray-200 p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:border-blue-400 dark:focus:border-blue-600 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all resize-none h-32"
              />
            </div>
            
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-700 flex justify-end">
              <button 
                onClick={() => {
                  processPastedText(manualPasteText);
                  setPasteModal(false);
                  setManualPasteText("");
                }}
                className="px-5 py-2 font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg active:scale-95 transition-all shadow-md text-xs sm:text-sm"
              >
                APPLY DATA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TOAST ================= */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full shadow-2xl z-[100] text-sm font-black animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
