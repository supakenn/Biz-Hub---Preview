# Biz POS — Multi-Tenant SaaS POS

**Biz POS** is a high-performance, offline-first Point of Sale system built for small to medium food service businesses. It combines the reliability of local storage with the power of Firebase for multi-device reporting and management.

## 🚀 Key Features
- **Blocking Shift Setup**: Mandatory shift initialization to ensure inventory continuity.
- **Local Auto-Save**: Real-time persistence to `localStorage` prevents data loss during browser crashes or network drops.
- **Cloud Reporting**: One-click "End Shift" pushes comprehensive sales and inventory snapshots to Firestore.
- **Manual Count Engine**: Intelligent reconciliation that matches physical inventory counts with theoretical sales.
- **Progressive Web App (PWA)**: Installable on Android, iOS, and Desktop for a native fullscreen experience.

## 🛠 Tech Stack
- **Frontend**: React (Hooks + Functional Components)
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Database/Auth**: Firebase Firestore & Firebase Authentication
- **Reporting**: jsPDF, SheetJS (XLSX)

## 📖 Documentation
Detailed user guides, technical architecture, and troubleshooting can be found in [bbiz_pos_docs.md](./bbiz_pos_docs.md).

## 💻 Local Development
1. Clone the repository
2. Run `npm install`
3. Start development server: `npm run dev` or run `run-local.cmd`
4. Deploy to Firebase: `npm run build && firebase deploy`

---
*Developed by Kenn Egway*
