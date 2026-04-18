# Biz POS — Complete Documentation for LLMs & Developers

> **Vibecoded and deployed by Kenn Egway**  
> Live URL: https://angels-pos.web.app  
> Stack: React + Vite + Tailwind CSS + Firebase (Auth/Firestore)

---

## 1. Project Overview

**Biz POS** is a multi-tenant, offline-first Point of Sale (POS) SaaS designed primarily for small to medium food service businesses. It enables owners to manage multiple shops, assign staff, track high-precision inventory through a "Manual Count Engine," and generate cloud-synced shift reports.

---

## 2. System Architecture & Flow

### Component Hierarchy
1.  **`App` (Entry Point)**: Handles Firebase Auth state.
2.  **`AuthWrapper`**: Routes users based on their status:
    - `splash`: Not logged in.
    - `no-membership`: Logged in but has no shops.
    - `create-shop` / `join-shop`: Onboarding flows.
    - `shop-select`: Multi-shop selection dashboard.
3.  **`POSApp`**: The main engine, rendered only after a `shopId` is selected.
4.  **`ShiftSetup` (Blocking UI)**: Gated entry into `POSApp` that handles shift initialization (Resume/Continue/Fresh).

### Data Lifecycle
- **Shift Active State**: Stored in a single `localStorage` key: `pos_active_shift_${shopId}`. This contains `orders`, `inventory`, and `activeOrderId`.
- **Shift End Stage**: Data is compiled into a `shift_report` and pushed to Firestore. Local data is purged only upon successful cloud write.
- **Persistence Strategy**: "Local-First". The app functions offline during the shift; Firestore is used for initialization (Historical snapshots) and finalization (Report storage).

---

## 3. Multi-Tenant Model & Roles

### Firestore Schema
- **/users/{uid}**: Contains user profile and a `memberships` map: `{ shopId: 'owner' | 'staff' }`.
- **/shops/{shopId}**: Contains shop metadata (`name`, `joinCode`, `ownerId`).
- **/shops/{shopId}/shift_reports/{reportId}**: Atomic snapshots of completed shifts.

### Authorization
- **Owner**: Can access all settings, create/join other shops, and is identified by the `owner` role string in their membership.
- **Staff**: Regular users who joined via a 6-digit `joinCode`.

---

## 4. The "Manual Count Engine" (Inventory Logic)

The core logic resides in `src/hooks/useReportMath.js`. It reconciles theoretical sales with physical reality.

### Theoretical Calculations
- ** theoreticalEnding** = `Starting + Deliver - Waste - NormalSold`
- **NormalSold**: Calculated by exploding every order's items into their ingredients based on the `recipe` map.

### Reconciled Calculations (Physical Overrides)
If a user enters a value in the **Ending** column:
1.  **Variance** = `PhysicalEnding - TheoreticalEnding`
2.  **Reconciled Sold** = `NormalSold - Variance`
3.  **Total Sales** = `Reconciled Sold * Price`

*Note: This effectively automates "Shortage/Overage" accounting. If 5 patties are missing, the system treats them as "Sold" (Lost Revenue) to keep the stock numbers accurate.*

---

## 5. Main Interface Components

### Order Management (Left Panel)
- Uses a "Current Active Order" pattern.
- Orders are stored in an array; adding/removing items updates the `total` and `timestamp` fields.

### Menu Grid (Right Panel)
- Supports categories (Orders, Extras, Drinks).
- **Add/Remove Toggle**: Global state changes the behavior of item buttons.
- **Custom Value**: Handles variable-price entries (Tips, Misc).

### Report Modal (Spreadsheet)
- Custom-built spreadsheet using CSS Grid.
- Supports keyboard navigation (`Tab` / `Enter`) and bulk paste from Google Sheets/Excel.

---

## 6. Technical Setup & Deployment

### Project Structure
```text
├── public/
│   ├── manifest.json      # PWA config (standalone mode)
│   └── icons.svg          # High-res app icons
├── src/
│   ├── templates/
│   │   └── angelsBurger.js # JSON-based shop configuration (Menu, Recipes, Pricing)
│   ├── hooks/
│   │   └── useReportMath.js # Reconciled inventory calculation logic
│   ├── App.jsx            # AuthWrapper & POSApp (Main Logic)
│   ├── firebase.js        # Firebase v10 initialization
│   ├── index.css          # Tailwind base & global styles
│   └── main.jsx           # React Root
├── .firebaserc            # Maps local environment to 'angels-pos' Project ID
└── firebase.json          # Hosting & Firestore security rules
```

### Deployment
1. Build: `npm run build`
2. Deploy: `firebase deploy --only hosting`

---

## 7. Operational Checklist for LLMs

When modifying this project, adhere to these constraints:
1.  **State Atomic**: Always use `setOrders(prev => ...)` to avoid race conditions.
2.  **Tailwind Hierarchy**: Most components use specific Tailwind classes for the "Premium Aesthetic" (e.g., `rounded-2xl`, `font-black`, `backdrop-blur`). Do not simplify these.
3.  **Local-First Verification**: Ensure any change to the shift state is tracked by the `localStorage` auto-save effect in `POSApp`.
4.  **Math Integrity**: Changes to inventory logic must be verified against `useReportMath.js` to ensure the manual count engine remains balanced.

---
*Last Updated: April 2026 | Maintainer: Kenn Egway*
