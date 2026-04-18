# Biz POS — Complete Technical Documentation

> **Vibecoded and deployed by Kenn Egway**
> Live URL: https://angels-pos.web.app
> Firebase Project ID: `angels-pos`
> Stack: React 19 + Vite 8 + Tailwind CSS 3 + Firebase v12 (Auth + Firestore)

---

## 1. Project Overview

**Biz POS** is a multi-tenant, offline-first Point of Sale (POS) SaaS designed primarily for small to medium food service businesses. It enables owners to manage multiple shops, assign staff via 6-character join codes, and track high-precision inventory through a **Manual Count Engine**. All shift data is auto-saved to `localStorage` during operation, then pushed atomically to Firestore as a snapshot when the shift ends.

---

## 2. Full File Tree

```text
Angels POS/                        ← Project root (local folder name still "Angels POS")
├── index.html                     ← Vite HTML entry; sets <title>Biz POS</title>, links manifest
├── package.json                   ← name: "angels-pos", deps listed below
├── vite.config.js                 ← Vite 8 config (@vitejs/plugin-react)
├── tailwind.config.js             ← Tailwind CSS 3 config
├── postcss.config.js              ← PostCSS for Tailwind
├── eslint.config.js               ← ESLint 9 flat config
├── firebase.json                  ← Firebase Hosting; public dir = "dist"; SPA rewrite
├── .firebaserc                    ← Maps local project to Firebase project: "angels-pos"
├── run-local.cmd                  ← Windows shortcut to run `npm run dev`
├── bbiz_pos_docs.md               ← This file (documentation)
├── README.md                      ← Short project README
├── dist/                          ← Vite production build output (deployed to Firebase)
├── public/
│   ├── favicon.svg                ← App favicon (SVG, used in index.html)
│   ├── icons.svg                  ← High-res app icon for PWA install
│   └── manifest.json              ← PWA manifest (name: "Biz POS", display: standalone)
└── src/
    ├── main.jsx                   ← React root; mounts <App /> into #root
    ├── App.jsx                    ← ENTIRE app in one file (2024 lines); see §4
    ├── App.css                    ← Component-scoped styles (custom-scrollbar, etc.)
    ├── index.css                  ← Tailwind @base/@components/@utilities directives
    ├── firebase.js                ← Firebase SDK init; exports auth, db, googleProvider
    ├── hooks/
    │   └── useReportMath.js       ← useMemo hook; calculates full inventory report
    └── templates/
        └── angelsBurger.js        ← Default shop template (Angel's Burger configuration)
```

### Python helper scripts (root level — development artifacts, not part of the app)
These scripts were used during active development for automated code patching and should be ignored in production:
`dev_patch.py`, `overwrite_app.py`, `patch_advanced.py`, `patch_clipboard.py`, `patch_feedback.py`,
`fix_advanced.py`, `fix_app.py`, `fix_dark.py`, `fix_dev.py`, `fix_duplicates.py`,
`fix_joyride.py`, `fix_regex.py`, `fix_regex.py`, `replace_fixes.py`, `fallback_paste.py`

---

## 3. Technology Stack & Dependencies

### Runtime Dependencies (`package.json`)
| Package | Version | Purpose |
|---|---|---|
| `react` | ^19.2.4 | UI framework (hooks, functional components) |
| `react-dom` | ^19.2.4 | React DOM renderer |
| `firebase` | ^12.12.0 | Auth (Google Sign-In) + Firestore database |
| `jspdf` | ^4.2.1 | PDF export of inventory shift reports |
| `jspdf-autotable` | ^5.0.7 | Table plugin for jsPDF |
| `lucide-react` | ^1.8.0 | Icon library (Settings, Clock, Store, etc.) |
| `xlsx` | ^0.18.5 | Excel (.xlsx) export of shift reports |
| `react-joyride` | ^3.0.2 | Listed in package.json but **not actively used** |

### Dev Dependencies
| Package | Purpose |
|---|---|
| `vite` + `@vitejs/plugin-react` | Build tool and React HMR |
| `tailwindcss` + `postcss` + `autoprefixer` | Utility-first CSS framework |
| `eslint` + plugins | Code linting |
| `@types/react` + `@types/react-dom` | TypeScript type hints |

---

## 4. Application Architecture

### 4.1 Component & Module Hierarchy

All components live in a **single file**: `src/App.jsx`. The rendering hierarchy is:

```
App()                             ← Default export; Firebase Auth state machine
└── [if shopId selected]
    POSApp()                      ← Main POS engine
    ├── [if setupLoading] → Loader spinner
    ├── [if !shiftStarted] → ShiftSetup UI (inline, not a separate component)
    ├── [if !storeConfig] → FallbackScreen component
    └── [main POS layout]
        ├── OrderFeed             ← Left panel: order list, header, revenue/time/code
        │   └── OrderCard         ← Individual order tile
        │       └── OrderItemList ← Scrollable item list within a card
        ├── MenuGrid              ← Right panel: category-sectioned item buttons
        │   └── ItemButton        ← Individual menu item button (inline component)
        └── [Modals — all rendered via conditional JSX at bottom of POSApp]
            ├── Settings Modal    ← Tabbed: General | Prices | Recipes | Account
            ├── ReportModal       ← Inventory spreadsheet + End Shift
            ├── Shop Code Modal   ← Enlarges join code for sharing
            ├── Custom Value Modal ← Numeric input for tips/misc
            ├── Dev Contact Modal ← Developer contact info (FB, email, phone)
            ├── Clear Confirm Modal ← Danger confirmation for clearing shift
            ├── Paste Modal       ← Fallback textarea for clipboard paste
            ├── Import Modal      ← JSON backup file restore
            ├── Export Modal      ← Format selector (XLSX, PDF, CSV, JSON)
            └── Toast             ← Ephemeral status notifications (3s auto-dismiss)

└── [if no shopId selected] → Auth/Onboarding screens
    ├── Splash/Login screen       ← Google Sign-In; gradient dark background
    ├── Loading screen            ← While Firebase resolves auth state
    ├── no-membership screen      ← First-time user; options: Create or Join shop
    ├── create-shop screen        ← Input shop name; generates joinCode; sets owner role
    ├── join-shop screen          ← Input 6-char code; queries shops by joinCode field
    └── shop-select screen        ← Lists user's memberships; ShopSelectCard per shop
        └── ShopSelectCard()      ← Separate function at bottom of file; handles
                                    shop name fetch, long-press manage, delete, leave
```

### 4.2 Auth & Routing State Machine

The top-level `App()` export manages a `screen` state string:

| `screen` value | Condition | Rendered UI |
|---|---|---|
| `'splash'` | Not logged in | Google Sign-In page |
| `'no-membership'` | Logged in, `memberships === {}` | Create or Join a shop |
| `'create-shop'` | User chose to create | Shop name input form |
| `'join-shop'` | User chose to join | 6-char code input form |
| `'shop-select'` | Has ≥1 membership | List of shops to select |
| _(shopId selected)_ | `selectedShopId !== null` | Bypasses all screens → `POSApp` |

---

## 5. Data Architecture

### 5.1 Firestore Schema

```
/users/{uid}
  ├── email: string
  ├── name: string
  └── memberships: { [shopId]: 'owner' | 'staff' }

/shops/{shopId}
  ├── name: string
  ├── joinCode: string             ← 6-char alphanumeric, uppercase
  ├── ownerId: string (uid)
  └── deleted?: boolean            ← soft-delete flag set when owner deletes

/shops/{shopId}/shift_reports/{reportId}       ← auto-ID from addDoc
  ├── timestamp: number            ← Date.now() at end of shift
  ├── savedBy: { uid, name }
  ├── sales: { total: number }
  └── inventorySnapshot: {
        [ingredientName]: {
          start, deliver, waste, sold, finalEnding
        }
      }
```

### 5.2 localStorage Keys (per shop)

| Key | Content |
|---|---|
| `pos_active_shift_${shopId}` | `{ orders, inventory, activeOrderId }` — auto-saved every state change |
| `pos_config_${shopId}` | `{ timeFormat, theme, scale, customPrices, customRecipes }` |
| `pos_storeConfig_${shopId}` | Full storeConfig JSON (menu, categories, inventoryDb) |

### 5.3 Persistence Strategy: "Local-First"

```
Shift Start ──► localStorage hydration
    │
    ▼ (every state change)
localStorage auto-save (pos_active_shift_*)
    │
    ▼ (End Shift)
Compile shift_report object
    │
    ▼
addDoc() → Firestore (atomic single write)
    │
    ▼ (only on success)
localStorage.removeItem() + state reset
    │
    ▼
Returns to ShiftSetup screen
```

---

## 6. Shift Flow (Phase 4 Implementation)

### 6.1 Initialization (on `POSApp` mount or `shopId` change)

1. `setSetupLoading(true)`
2. Check `localStorage` for `pos_active_shift_${shopId}` → sets `hasLocalActiveShift`
3. Query Firestore `/shops/{shopId}/shift_reports` ordered by `timestamp` desc, limit 1 → sets `lastReport`
4. `setSetupLoading(false)`

### 6.2 ShiftSetup Screen — Three Conditions

| Condition | State | Buttons |
|---|---|---|
| **A — Unfinished local shift** | `hasLocalActiveShift === true` | "Resume Active Shift" (loads localStorage data) / "Discard Local Data" (clears it) |
| **B — Previous cloud report exists** | `hasLocalActiveShift === false && lastReport !== null` | "Continue from Last Report" (maps `inventorySnapshot.finalEnding` → new `starting`) / "Start Fresh (Zeros)" |
| **C — First ever shift** | Both false | "Start First Shift" (blank inventory) |

### 6.3 End of Shift

Triggered by the **"End Shift & Save Report"** button in `ReportModal`:
1. Compiles `inventorySnapshot` from `spreadsheetData.rows`
2. Creates `shift_report` object with timestamp, savedBy, sales total, inventorySnapshot
3. `await addDoc(...)` — pushes to Firestore
4. **Only on success**: `localStorage.removeItem(pos_active_shift_*)` → resets all state → `setShiftStarted(false)` (returns to ShiftSetup)
5. On failure: Toast error; local data is **preserved**

---

## 7. The Manual Count Engine (`useReportMath.js`)

This `useMemo` hook is the core inventory intelligence layer.

### 7.1 Step-by-Step Calculation

**Step 1 — Explode orders into ingredient usage:**
```
For each order → for each item → look up recipe → multiply qty × ingredient ratio
ingredientsSold[name] += qty * recipe[name]
```

**Step 2 — Map inventoryDb to spreadsheet rows:**
```
For each ingredient in storeConfig.inventoryDb:
  price          = customPrice ?? defaultPrice
  normalSold     = ingredientsSold[ingredient] || 0
  start          = inventory[name]?.starting || 0
  deliver        = inventory[name]?.deliver  || 0
  waste          = inventory[name]?.waste    || 0
  
  theoreticalEnding = start + deliver - waste - normalSold
  
  finalEnding   = (endingOverride entered?) ? parseInt(endingOverride) : theoreticalEnding
  missingQty    = theoreticalEnding - finalEnding
  finalSold     = normalSold + missingQty
  sales         = finalSold * price
```

**Step 3 — Build adjustmentOrder (if any overrides exist):**
```
If missingQty !== 0 for any item:
  Push to adjustmentItems[] → {id, name, qty:abs(missingQty), price, isAdjustment, type:"Shortage"|"Excess"}
  
adjustmentOrder = { id:'ADJ', items:adjustmentItems, total:sum(price*qty), isReconciliation:true }
```

### 7.2 Accounting Logic

The manual count system automatically handles **Shortage/Overage accounting**:
- If 5 patties are **missing** (shortage): `finalSold` increases by 5 → treated as "Lost Revenue"
- If 5 patties are **excess** (overage): `finalSold` decreases by 5 → credited back

> **Important:** When `adjustmentOrder` is non-null, the `MenuGrid` is **locked** — no new orders can be added. Only the Report Sheet can be opened or manual counts cleared.

### 7.3 Return Value Shape
```js
{ rows: RowObject[], grandTotalSales: number, adjustmentOrder: AdjOrder | null }
```

---

## 8. Store Configuration Template (`angelsBurger.js`)

The `angelsBurgerTemplate` object is the **default shop configuration** loaded via the `FallbackScreen`. It is also persisted to `localStorage` under `pos_storeConfig_${shopId}`.

### Schema

```js
{
  business: {
    name: string,           // Displayed in the POS header (e.g. "ANGEL'S BURGER")
    theme: string,          // Color theme key (currently 'red')
    hasEndingReconciliation: boolean
  },
  categories: [
    { id: string, name: string, color: 'red'|'yellow'|'blue'|'green'|'purple'|'gray' }
  ],
  inventoryDb: {
    [ingredientName: string]: number   // Default price per unit
  },
  menuItems: [
    {
      id: string,
      categoryId: string,
      name: string,
      price: number,
      recipe: { [ingredientName: string]: number }   // qty of each ingredient per sale
    }
  ]
}
```

### Current Menu (Angel's Burger Default)

**Main Orders:** Beef Burger (₱40), Chiz Burger (₱50), Egg Sandwich (₱20), Chiz Hotdog (₱37), Footlong (₱56), Jalapeño (₱65), Hungarian (₱70), Footlong Combo (₱136), Jalapeño Combo (₱145)

**Extras:** Chiz (₱5), Egg (₱15), Bacon (₱25), Patty (₱15), B. Buns (₱5), Custom Value (₱0, variable)

**Drinks:** Coke (₱25), Sprite (₱25), Royal (₱25), Predator (₱25), Coke Zero (₱25), Water (₱16)

### Current Inventory DB (Default Prices)
`Buns:5, HD Buns:5, FL Buns:12, Patty:15, FL Dog:44, Hungarian:65, Jalapeño:53, Chiz:5, Bacon:25, Hotdog:13.5, Egg:15, Water:16, Coke:25, Sprite:25, Royal:25, Predator:25, Coke Zero:25`

---

## 9. UI Components — Detailed Reference

### 9.1 `OrderFeed` (Left Panel)
- **Header bar (red):** Business name (clickable → DevContactModal), "BIZ POS" subtag, Revenue card (sum of all orders + adjustmentOrder total), Shop Code chip (clickable → ShopCodeModal), Clock (12h/24h configurable), Settings gear (→ Settings Modal)
- **Order grid:** 2-column CSS grid of `OrderCard` tiles; auto-scrolls on new items; shows "LATEST ORDER ↓" FAB when user scrolls up
- **Props:** Full state passthrough from POSApp; `shopCode` and `onCodeClick` for the join code display

### 9.2 `MenuGrid` (Right Panel)
- **Top bar:** Add/Remove toggle (green `+` / red `-` animated pill); NEW ORDER button (disabled when `adjustmentOrder` exists); REPORT button
- **Category sections:** Vertical color bar + item grid (3 columns); each category from `storeConfig.categories`
- **Item buttons (`ItemButton`):** Shows quantity in blue if >0 in active order; locked state (greyed out, cursor-not-allowed) when `adjustmentOrder` is active
- **Manual Count Summary panel:** Replaces the menu grid when `adjustmentOrder` exists; shows all adjustment items with Shortage/Excess pills and net adjustment total

### 9.3 `ReportModal` — Inventory Spreadsheet
- **Columns:** Item | Starting | Deliver | Waste | Ending | Sold | Price | Sales
- **Ending column:** Accepts physical count override; placeholder shows theoretical value; purple text when overridden
- **Keyboard navigation:** `Tab`/`Enter`/`ArrowDown/Up` moves focus between cells
- **Bulk paste:** `Ctrl+V` on a cell pastes tab-separated data from Google Sheets/Excel starting from that cell
- **Clipboard fallback:** If `navigator.clipboard.readText` fails → opens Paste Modal (textarea)
- **Export options:** XLSX, PDF, CSV, JSON (backup)
- **Import:** `.json` file restore of `{ orders, inventory }` shape
- **Footer:** Grand Total Sales (₱) + "End Shift & Save Report" button

### 9.4 Settings Modal — 4 Tabs

| Tab | Contents |
|---|---|
| **General** | Clock format (12h/24h toggle), Theme (Light/Dark), PWA Install button (if not installed) |
| **Prices** | Override prices per menu item; override prices per inventory ingredient |
| **Recipes** | Select menu item from dropdown; edit ingredient quantities (overrides `angelsBurger.js` recipe) |
| **Account** | User avatar/name/email/role badge; Current Shop card with live indicator; All Shops list (if multi-shop); Switch Shop button; Logout button |

### 9.5 `ShopSelectCard` (Onboarding)
- Fetches shop name and joinCode from Firestore on mount
- **Long press (600ms)** OR gear icon click opens manage panel
- **Owner actions:** Delete Shop (soft-delete via `{ deleted: true }` merge + removes from user memberships)
- **Staff actions:** Leave Shop (removes from user memberships only)

---

## 10. Key State Variables in `POSApp`

### Shift Flow States
| Variable | Type | Purpose |
|---|---|---|
| `shiftStarted` | boolean | Gates access to POS engine; false → ShiftSetup renders |
| `lastReport` | object\|null | Last Firestore shift report; determines ShiftSetup condition |
| `hasLocalActiveShift` | boolean | Whether unfinished shift exists in localStorage |
| `setupLoading` | boolean | True while fetching lastReport from Firestore |

### Core App State
| Variable | Type | Purpose |
|---|---|---|
| `orders` | Order[] | Array of all orders in the shift; default: `[{id:1, items:[], total:0}]` |
| `activeOrderId` | number | Which order is currently being built |
| `inventory` | object | `{ [name]: { starting, deliver, waste, endingOverride? } }` |
| `storeConfig` | object\|null | Full shop config (from localStorage or template); null → FallbackScreen |
| `config` | object | UI config: `{ timeFormat, theme, scale, customPrices, customRecipes }` |
| `time` | Date | Live clock; updated every 1000ms via `setInterval` |
| `shopCode` | string\|null | Current shop's joinCode from Firestore |
| `shopNames` | object | `{ [shopId]: name }` map for membership list display |

### Cart Logic
- **`handleItemClick(item)`**: Adds (isAddMode) or removes one unit from active order; triggers Custom Modal for `custom_amount` items
- **`handleItemLongPress(item)`**: Removes **all** units of that item from active order; triggers haptic vibrate(50ms)
- **`createNewOrder()`**: Creates new order only if current active order has items; auto-selects new order

---

## 11. PWA Configuration

```json
// public/manifest.json
{
  "name": "Biz POS",
  "short_name": "Biz POS",
  "display": "standalone",           ← fullscreen (no browser bar)
  "background_color": "#dc2626",     ← red loading screen
  "theme_color": "#dc2626",
  "orientation": "portrait-primary",
  "icons": [{
    "src": "favicon.svg",
    "sizes": "192x192 512x512",
    "type": "image/svg+xml",
    "purpose": "any maskable"
  }]
}
```

PWA install prompt is captured via `beforeinstallprompt` event and exposed as a button in Settings → General. Install status is detected via `window.matchMedia('(display-mode: standalone)')`.

---

## 12. Firebase Configuration

```js
// src/firebase.js
// Firebase Project: "angels-pos" (Firebase Console project ID remains unchanged)
const firebaseConfig = {
  apiKey: "AIzaSyAM9JnzMfKfPRNQVgFkSTpTdcIGlg7SdvY",
  authDomain: "angels-pos.firebaseapp.com",
  projectId: "angels-pos",
  storageBucket: "angels-pos.firebasestorage.app",
  messagingSenderId: "636580035181",
  appId: "1:636580035181:web:54537b2111714816195d64"
};
```

**Exports:** `auth` (Firebase Auth), `db` (Firestore), `googleProvider` (GoogleAuthProvider)

**Authentication method:** Google Sign-In via popup (`signInWithPopup`)

---

## 13. Export Formats

| Format | Handler | Output |
|---|---|---|
| **XLSX** | `xlsx` library | `Report_MM-DD-YYYY.xlsx` with headers + data rows + total footer |
| **PDF** | `jspdf` + `jspdf-autotable` | `Report_MM-DD-YYYY.pdf` |
| **CSV** | Native Blob | `Report_MM-DD-YYYY.csv` |
| **JSON (Backup)** | Native Blob | `Backup_MM-DD-YYYY.json` — contains `{ orders, inventory, spreadsheet, totalSales }` |

---

## 14. Deployment

### Local Development
```bash
npm install
npm run dev        # or double-click run-local.cmd on Windows
```

### Production Deployment
```bash
npm run build      # outputs to /dist
firebase deploy --only hosting
```

**Firebase Hosting config (`firebase.json`):** Serves from `dist/`, all routes rewrite to `/index.html` (SPA mode).

---

## 15. LLM / Developer Constraints

When modifying this project, adhere to these rules:

1. **State Atomicity** — Always use `setOrders(prev => ...)` and `setInventory(prev => ...)` functional updaters to avoid stale closure race conditions.

2. **Tailwind Class Integrity** — The premium aesthetic relies on specific classes (`rounded-2xl`, `font-black`, `backdrop-blur`, `border-b-4`, `shadow-2xl`). Do not simplify or replace these with generic alternatives.

3. **Local-First Invariant** — Any change to `orders`, `inventory`, or `activeOrderId` is captured by the `useEffect` auto-save listener. Ensure new state variables that are part of "shift data" are included in the `pos_active_shift_*` payload.

4. **Math Integrity** — All inventory calculations flow through `useReportMath.js`. Do not recompute totals inline; modify the hook and verify the `theoreticalEnding → finalEnding → finalSold → sales` chain remains balanced.

5. **Shift Guard** — The `handleEndShift` function must only clear `localStorage` **after** a confirmed Firestore write. This "write-then-clear" ordering is critical for data safety.

6. **Single-File Architecture** — All React components live in `src/App.jsx`. When adding new components or modals, add them within this file following the existing section comment style (`// === ... ===`).

7. **Firebase Project ID** — The Firebase project `angels-pos` is the live production project. The branding has changed to "Biz POS" in the UI, but the Firebase project ID, Firestore paths, and hosting URL remain `angels-pos`.

---

## 16. Developer Contact

**Kenn Egway** — Vibecoder & Maintainer
- Facebook: [fb.com/kenn.egway](https://fb.com/kenn.egway)
- Email: rkenn.studio@gmail.com
- Phone: 09933206241

> Accessible in-app by clicking the business name in the POS header.

---

*Last Updated: April 2026 | Biz POS v0.0.0 | Firebase Project: angels-pos*
