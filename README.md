# 🚀 Biz Hub Suite
### An Omnichannel, Zero-Cost Enterprise Management Ecosystem for SMBs.

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)

Biz Hub Suite is a comprehensive **Progressive Web App (PWA)** designed to provide small-to-medium food service businesses, retail shops, and franchise owners with an enterprise-grade management system. 

Built with a strict **Mobile-First** and **Offline-First** philosophy, the suite orchestrates Point of Sale, Inventory Management, Back-Office Operations, and B2B Lead Generation into a single, unified interface.

---

## 🎯 The Problems We Solve

Legacy POS and SaaS tools fail modern small businesses in three major ways:

1.  **The Subscription Trap**: Multi-branch businesses are forced into expensive, per-device or per-location monthly fees that eat into tight margins.
2.  **Cloud Dependency**: When the internet goes down, the business goes down. Traditional cloud POS systems cannot function offline.
3.  **Mobile Clunkiness**: Most back-office dashboards are designed for desktops, making it impossible for business owners to manage operations from their phones while on the move.

### Our Solution:
*   **Zero-Cost Stack Architecture**: Bypasses traditional SaaS scaling costs using free-tier cloud resources.
*   **Offline-Resilient**: Utilizes IndexedDB and localStorage to ensure POS and CRM function at blazing speeds, even without internet.
*   **Touch-Optimized UI**: Meticulously crafted with Tailwind CSS for a native-app feel on iOS and Android.

---

## 🧩 Core Modules

The suite operates on a **3-Tier Enterprise Model** (User ➔ Business HQ ➔ Physical Branches), allowing seamless scaling from a single food cart to a nationwide franchise.

### 🏪 Biz POS (Branch Level)
*A highly resilient, offline-first Point of Sale engine.*
*   **Atomic Shift Architecture**: Auto-saves state locally and only performs a single cloud write when the shift is officially ended and reconciled.
*   **Manual Count Engine**: Specialized reconciliation system for theoretical vs. physical inventory counts.

### 🎯 Biz Leads (HQ / Local Level)
*The crown jewel: A B2B Lead Generation and Discovery CRM.*
*   **Virtual CRM**: Search and filter thousands of leads instantly using a Web Worker and B-Tree indexing.
*   **Priority Scraping**: Targeted data requests for specific niches.
*   **Native Intents**: 1-click execution for Dialer, SMS, or Email directly from a prospect's card.

### 🚀 Biz Reach (HQ Level)
*An omnichannel outreach engine for B2B marketing.*
*   **Spintax Engine**: Craft randomized message templates to bypass spam filters.
*   **Rich HTML Emails**: Dynamic, visually engaging templates built into the platform.
*   **Swarm Dispatching**: Connects to external nodes (Android Gateways/Google Apps Script proxies) for background dispatching.

### ⚙️ Biz Ops & 📦 Biz IMS (HQ Level) 
*$$In Development$$*
*   **Unified Shift Logbook**: A "God View" timeline merging system audits with internal team chat.
*   **Cross-Branch Inventory**: Global visibility of stock across all locations with automated transfer logging.

---

## 🧠 The "Zero-Cost" Architecture

Biz Hub achieves massive scale on free-tier infrastructure by utilizing **Hot vs. Cold Storage Tiering** and **Smart Edge Proxies**.

### 1. The Scraping Loop (Bypassing Payload Limits)
*   **Master Vault**: Large database (PostgreSQL) secured behind Row Level Security (RLS).
*   **Proxy Bouncer**: Extracts only the exact data requested to keep payloads tiny (~150KB).
*   **Smart Cache**: Intercepts requests for the same city/category to serve data in 0ms.
*   **Nightly Sweeper**: Automated cron jobs to clean unused caches and stay within storage limits.

### 2. Telemetry & Cold Storage
*   **Hot Storage**: Firebase Firestore used strictly as a real-time message bus for active daily data.
*   **Cold Storage**: A background worker harvests logs nightly, compiling them into a high-capacity cold storage (Sheets/Cold SQL) and purging the Hot Storage.
*   **On-Demand Reports**: Generates PDFs directly from Cold Storage upon user request.

---

## 💻 Tech Stack

- **Frontend**: React 19, Vite 8, Tailwind CSS 4
- **Local Database**: Dexie.js (IndexedDB), localStorage
- **Real-Time DB & Auth**: Firebase v12 (Firestore, Google Sign-in)
- **Master Vault**: PostgreSQL
- **Edge Compute & Cron**: Google Cloud / Apps Script
- **Icons & UI**: Lucide React, Framer Motion
- **Export Utilities**: jsPDF, SheetJS (XLSX)

---

> [!IMPORTANT]
> **Note**: This repository contains the sanitized UI/UX preview of the Biz Hub Suite. Proprietary business logic, mathematical engines, and database connection strings have been abstracted or simulated for security purposes.

---
*Developed by Kenn Egway*
