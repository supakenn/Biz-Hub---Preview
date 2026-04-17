# Angel's POS — Complete Documentation

> **Vibecoded and deployed by Kenn Egway**  
> Live URL: https://angels-pos.web.app  
> Stack: React + Vite + Tailwind CSS + Firebase Hosting

---

## Table of Contents

1. [Overview](#overview)
2. [Installation & Local Development](#installation--local-development)
3. [PWA Installation](#pwa-installation)
4. [Main Interface](#main-interface)
5. [Order Management](#order-management)
6. [Report Sheet](#report-sheet)
7. [System Settings](#system-settings)
8. [Data Management](#data-management)
9. [Export & Import](#export--import)
10. [Deployment](#deployment)
11. [Project Structure](#project-structure)
12. [Data Architecture](#data-architecture)
13. [Troubleshooting](#troubleshooting)

---

## Overview

**Angel's POS** is a lightweight, offline-capable Point of Sale system built as a Progressive Web App (PWA). Designed for small food stalls and canteens to:

- Track orders and compute totals in real time
- Record inventory (starting, delivery, waste) and auto-calculate sold quantities
- Generate and export daily shift reports in multiple formats
- Run fully offline after installation

---

## Installation & Local Development

### Prerequisites
- Node.js v18+ (with npm)
- Firebase CLI: `npm install -g firebase-tools`

### Setup
```bash
git clone https://github.com/rKennStudio/angels-pos.git
cd angels-pos
npm install
npm run dev -- --host
```

Or double-click **`run-local.cmd`** in the project root.

- Local: `http://localhost:5173`
- Network: `http://<your-ip>:5173`

---

## PWA Installation

### Android (Chrome)
1. Open https://angels-pos.web.app in Chrome
2. Tap **⋮ menu → Add to Home Screen**
3. Or go to **Settings → Install App** inside the app

### iOS (Safari)
1. Open the site in Safari
2. Tap **Share → Add to Home Screen**

### Desktop (Chrome/Edge)
1. Click the install icon in the address bar
2. Or use **Settings → Install App** inside the app

> Once installed, the browser chrome is hidden. The app runs fullscreen.

---

## Main Interface

### Left Panel — Order List
- All orders created during the shift
- Each card shows **Order #**, **Total (₱)**, and **time**
- Active order is highlighted with a yellow border
- Tap any card to switch to it
- **"LATEST ORDER ↓"** button appears when scrolled up

### Right Panel — Menu Items
- Items grouped by: **Orders**, **Extras**, **Drinks**
- **Tap** to add to active order
- **Long-press** to instantly remove that item entirely from the active order

### Top Bar

| Element | Action |
|---|---|
| ANGEL'S POS logo | Opens developer contact info |
| Revenue card | Total revenue across all orders this shift |
| Time card | Live clock (12h or 24h) |
| ⚙ Settings | Opens Settings panel |

---

## Order Management

### Adding Items
Tap any item button to add 1 unit to the active order. Tapping again increments quantity.

### Removing Items
- **Toggle +/−** at the top of the right panel, then tap items to decrement
- **Long-press** any item button to wipe it from the order instantly

### Custom Values
Tap **Custom Value** in the Extras row. Enter any amount (tips, misc charges). Works in both add and remove mode.

### New Order
Tap **NEW ORDER** to start fresh for the next customer. Previous orders stay in the list.

### Reviewing Past Orders
Tap any order card on the left to make it active. Add or remove items freely.

---

## Report Sheet

Open via the **📄 REPORT** button.

### Columns

| Column | Description |
|---|---|
| Item | Ingredient name (sticky column) |
| Starting | Opening stock (Editable) |
| Deliver | Stock received during shift (Editable) |
| Waste | Discarded units (Editable) |
| Ending | Physical Count Override (Editable). If empty, shows Theoretical Ending. |
| Sold | Reconciled count: `Normal Sold + (Theoretical Ending - Final Ending)` |
| Price | Unit cost |
| Sales | Sold × Price (Reconciled) |

> **Manual Count Mode:** Entering a value in the **Ending** column activates "Manual Count Mode". The app will solve the inventory equation backward to respect your physical count: `Final Sold = Start + Deliver - Waste - Physical Ending`.

### Keyboard Navigation
- `Tab` / `Enter` moves to the next **row** (same column), not sideways. Supported for Starting, Deliver, Waste, and Ending columns.

### Data Actions (Header)
- **📋 PASTE** — Bypasses browser clipboard limitations to import Google Sheets data.
- **📥 IMPORT** — Opens a themed dialog to restore a `.json` backup.
- **📤 EXPORT** — Opens a themed selection dialog (Excel, PDF, CSV, JSON).

---

## Manual Count Engine

Formerly known as "Reconciliation", this engine ensures the POS matches the physical reality of your inventory.

### How it Works
1. **Theoretical Sales**: The system tracks items sold through receipt transactions (`Normal Sold`).
2. **Physical Overrides**: If you perform a manual count and enter the count in the **Ending** column, the system calculates the **Variance**.
3. **Automated Adjustment**: 
   - If stock is missing (shortage), the system increases the `Sold` count and adds a virtual adjustment charge.
   - If stock is excess, the system decreases the `Sold` count and adds a virtual credit.

### Manual Count Dashboard (Right Panel)
When any "Ending" override is active:
- **Menu Locking**: The main item buttons are locked and grayscale to prevent new orders during counting.
- **Summary View**: The right panel transforms into a scrollable list of all variances (missing vs. excess items).
- **Net Impact**: Shows the total financial adjustment applied to the shift revenue.
- **Actions**: Provides quick access to **Open Report Sheet** or **Clear Manual Counts** to unlock the menu.

---

## System Settings

### General Config Tab

| Setting | Description |
|---|---|
| Clock Format | 12-Hour or 24-Hour |
| Theme | Light or Dark mode |
| UI Scale | Zoom slider 60%–150% |
| Install App | Appears when app is installable; shows green checkmark if already installed |

### Item Prices (Overrides) Tab
- Override default prices for menu items and spreadsheet ingredients
- Changes persist across sessions

### Recipe Ingredients Tab
- Customize ingredient quantities consumed per menu item
- Affects Sold calculations in the report

---

## Data Management

### Clear Shift Data
Tap **START NEW SHIFT (CLEAR DATA)** in the report footer.

- **BACKUP JSON & CLEAR** — exports a JSON file then wipes all data
- **Clear Without Backup** — wipes immediately

**Cleared:** orders, inventory inputs, active order  
**Preserved:** settings, price overrides, recipe overrides

---

## Export & Import

### Formats
- **Excel (.xlsx)** — Full report sheet with all reconciled totals.
- **PDF (.pdf)** — Clean, printable document for physical records.
- **CSV (.csv)** — Lightweight data for spreadsheet integration.
- **JSON (.json)** — Full system state backup (Orders + Inventory + Overrides).

### Themed Dialogs
Both Import and Export now use custom-designed popup dialogs that match the Angel's POS premium aesthetic, replacing standard browser menus with a more intuitive, touch-friendly interface.

---

## Deployment

```bash
npm run build
firebase deploy --only hosting
```

Live at: **https://angels-pos.web.app**

- Firebase Project ID: `angels-pos`
- Config files: `.firebaserc`, `firebase.json`

---

## Project Structure

```
angels-pos/
├── public/
│   ├── manifest.json      # PWA config
│   ├── favicon.svg        # App icon
│   └── icons.svg
├── src/
│   ├── App.jsx            # All app logic and UI
│   ├── App.css
│   ├── index.css          # Tailwind base
│   └── main.jsx
├── firebase.json
├── .firebaserc
├── vite.config.js
├── tailwind.config.js
├── run-local.cmd          # Run local dev + network server
└── package.json
```

---

## Data Architecture

All data lives in **localStorage**:

| Key | Contents |
|---|---|
| `pos_orders` | Array of orders with items and totals |
| `pos_activeOrderId` | Currently selected order ID |
| `pos_inventory` | Ingredient rows (starting/deliver/waste) |
| `pos_config` | Theme, clock, scale, custom prices, custom recipes |

### Order Schema
```json
{
  "id": 1,
  "items": [
    { "id": "beef_burger", "name": "Beef Burger", "price": 40, "qty": 2, "dynamicPrice": 40 }
  ],
  "total": 80,
  "timestamp": 1713340000000
}
```

### Config Schema
```json
{
  "timeFormat": "12h",
  "theme": "dark",
  "scale": 1,
  "customPrices": {
    "menu": { "beef_burger": 45 },
    "ingredients": { "Patty": 16 }
  },
  "customRecipes": {
    "beef_burger": { "Patty": 2, "Buns": 2 }
  }
}
```

---

## Troubleshooting

**Browser bar still shows after install**  
Uninstall and reinstall the PWA. The manifest uses `"display": "standalone"`.

**Paste from Sheets not working**  
Use the PASTE button. If blocked, use the Manual Paste modal — long-press the textarea and select "Paste".

**Dark mode text still looks black**  
Hard-refresh: `Ctrl+Shift+R`. For PWA, clear app storage from device settings.

**App shows stale data after deploy**  
Hold Shift + refresh. On Android, clear app storage from Settings → Apps → Angel's POS → Clear Data.

**Export shows broken file**  
Use JSON or CSV as fallback. JSON is the most reliable format.

---

*Documentation: April 2026 | Developer: Kenn Egway — rKenn.Studio@gmail.com*
