# BizLeads V2 — Module Documentation

> **Location:** `src/apps/Leads/`
> **Route:** `/leads/*`
> **Auth guard:** User's Firestore doc must include `"LEADS"` in `installedModules[]`

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Reference](#file-reference)
3. [Data Flow](#data-flow)
4. [Database Schema (Dexie)](#database-schema-dexie)
5. [CSV → Dexie Column Mapping](#csv--dexie-column-mapping)
6. [Web Worker Protocol](#web-worker-protocol)
7. [GAS Proxy Setup](#gas-proxy-setup)
8. [Firebase Rules](#firebase-rules)
9. [Environment Variables](#environment-variables)
10. [Configuration Checklist](#configuration-checklist)
11. [Feature Reference](#feature-reference)
12. [Biz Reach Integration](#biz-reach-integration)
13. [Architectural Invariants](#architectural-invariants)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React App (Browser)                          │
│                                                                       │
│  ScrapingModal ──POST──▶ GAS Proxy (Code.gs)                        │
│                                  │                                    │
│                          Supabase REST                                │
│                          (60MB master DB)                             │
│                                  │                                    │
│                      Firestore REST PATCH                             │
│                      users/{uid}/inbox/latest                         │
│                                  │                                    │
│         LeadsContext ◀──onSnapshot──┘                                │
│              │                                                        │
│         hydrateBatch()                                                │
│              │                                                        │
│          Dexie.js (IndexedDB) ◀──── SINGLE SOURCE OF TRUTH           │
│              │                                                        │
│      searchWorker.js (Web Worker)                                     │
│              │                                                        │
│       DiscoveryView (renders list)                                    │
└─────────────────────────────────────────────────────────────────────┘
```

**Zero-Cost Stack:** Supabase ↔ GAS (free tiers). Firestore is used only as a
~150KB ephemeral message bus — the inbox document is deleted immediately after
hydration, incurring zero ongoing storage cost.

---

## File Reference

```
src/apps/Leads/
├── LeadsApp.jsx                  Module root — lazy-loaded by AppRouter
├── context/
│   └── LeadsContext.jsx          Global state + Firestore inbox listener
│                                  + cross-view event bridge
├── db/
│   └── leadsDb.js               Dexie schema + all DB helper functions
├── workers/
│   └── searchWorker.js          Off-thread filter cursor + pagination
├── components/
│   ├── LeadsShell.jsx           Tab nav, scrape CTA, toast host
│   ├── ScrapingModal.jsx        City/Category form → GAS proxy
│   ├── ProspectCard.jsx         Lead card with action row + bulk select
│   ├── LeadDetailsModal.jsx     Full profile + Contact Target Manager
│   ├── TagAssignmentModal.jsx   Tag checklist + inline create + remarks
│   ├── FilterSheet.jsx          Bottom drawer — all filter controls
│   └── ToastOverlay.jsx         Global toast notification
├── views/
│   ├── DiscoveryView.jsx        /leads  — search + filter + infinite scroll
│   └── TagsView.jsx             /leads/tags — tag CRUD + BizReach push
└── .samples/
    └── Master Leads.csv         Reference CSV from Outscraper

gas_tiers/bizleads_proxy/
└── Code.gs                      Google Apps Script proxy (deploy separately)
```

**Shell files modified:**
- `src/shell/AppRouter.jsx` — added `/leads/*` lazy route
- `src/shell/HubDashboard.jsx` — added BizLeads module card
- `src/shell/components/GlobalSidebar.jsx` — added BizLeads nav link

---

## Data Flow

### Scraping Flow (Happy Path)
```
1. User opens ScrapingModal → enters city + category
2. POST {uid, batch_id, city, category} → VITE_GAS_PROXY_URL
3. GAS: queries Supabase `places` table (ilike filter on query + main_category)
4. GAS: PATCH Firestore  users/{uid}/inbox/latest  {status:"ready", items:[...]}
5. LeadsContext onSnapshot fires (< 2s latency)
6. hydrateBatch(items, batch_id) → Dexie bulkPut
7. deleteDoc(inboxRef)  ← ephemeral, zero cost
8. setLastHydration(Date.now())  → DiscoveryView re-queries worker
9. Toast: "⚡ N leads scraped!"
```

### Tag → Discovery Filter Flow
```
1. User taps 🔍 "View Leads" on a TagCard
2. localStorage.setItem("bizleads_filter_tag", {id, name})
3. window.dispatchEvent(CustomEvent "bizleads:filterbytag", {tagId})
4. LeadsContext event listener → setSearchFilters({tagIds:[tagId]})
5. useNavigate("/leads")
6. DiscoveryView re-runs search worker with new tagIds filter
```

### Push to Biz Reach Flow
```
1. User taps 🚀 on a TagCard
2. Dexie: fetch all prospects in that tag
3. localStorage.setItem("bizreach_leads_payload", {tag, leads[], exported_at})
4. Biz Reach module reads localStorage on mount and imports the lead list
```

---

## Database Schema (Dexie)

**Database name:** `BizLeadsV2`  **Version:** 1

### `prospects` table

| Field | Type | Indexed | Description |
|---|---|---|---|
| `id` | string | ✅ PK | `place_id` from Outscraper |
| `batch_id` | string | ✅ | Groups one scrape job |
| `category` | string | ✅ | `main_category` lowercased |
| `city` | string | ✅ | Parsed from `query` column |
| `rating` | number | ✅ | 0.0–5.0 |
| `review_count` | number | ✅ | From `reviews` column |
| `has_website` | 0\|1 | ✅ | 1 if `website` is set |
| `has_socials` | 0\|1 | ✅ | 1 if any social column is set |
| `is_new` | 0\|1 | ✅ | 1 for current batch only |
| `scraped_at` | number | ✅ | Epoch ms |
| `name` | string | ✅ | Business name |
| `emails` | string[] | — | Comma-parsed from `emails` col |
| `phones` | string[] | — | Comma-parsed from `phones`/`phone` col |
| `active_email` | string\|null | — | User-selected target (Dexie only) |
| `active_phone` | string\|null | — | User-selected target (Dexie only) |
| `website` | string\|null | — | |
| `address` | string | — | |
| `maps_url` | string\|null | — | From `link` column |
| `hours` | string\|null | — | From `workday_timing` column |
| `price_level` | number\|null | — | |
| `socials` | object | — | `{facebook,instagram,twitter,linkedin,tiktok,youtube}` |
| `description` | string\|null | — | |
| `is_spending_on_ads` | boolean | — | |
| `owner_name` | string\|null | — | |
| `featured_image` | string\|null | — | Image URL |
| `categories` | string[] | — | All categories array |
| `review_keywords` | string\|null | — | |
| `is_temporarily_closed` | boolean | — | |
| `closed_on` | string\|null | — | |

### `tags` table

| Field | Type | Indexed | Description |
|---|---|---|---|
| `id` | number | ✅ PK (auto) | |
| `name` | string | ✅ | Unique tag label |
| `created_at` | number | ✅ | Epoch ms |
| `remarks` | string | — | Tag-level notes |

### `prospect_tags` table (join)

| Field | Type | Indexed | Description |
|---|---|---|---|
| `[prospect_id+tag_id]` | compound | ✅ PK | |
| `prospect_id` | string | ✅ | FK → prospects.id |
| `tag_id` | number | ✅ | FK → tags.id |
| `tagged_at` | number | ✅ | Epoch ms |
| `remarks` | string | — | Per-assignment notes |

---

## CSV → Dexie Column Mapping

| Outscraper CSV Column | Dexie Field | Transform |
|---|---|---|
| `place_id` | `id` | Direct |
| `name` | `name` | Direct |
| `main_category` | `category` | `.toLowerCase()` |
| `query` | `city` | `extractCityFromQuery()` — parses *"X in **city**, province"* |
| `reviews` | `review_count` | `parseInt()` |
| `rating` | `rating` | `parseFloat()` |
| `link` | `maps_url` | Direct |
| `workday_timing` | `hours` | Direct |
| `emails` | `emails[]` | `parseDelimitedField()` — comma-split + deduplicate |
| `phones` / `phone` | `phones[]` | `parseDelimitedField()` |
| `facebook` | `socials.facebook` | Direct |
| `instagram` | `socials.instagram` | Direct |
| `twitter` | `socials.twitter` | Direct |
| `linkedin` | `socials.linkedin` | Direct |
| `tiktok` | `socials.tiktok` | Direct |
| `youtube` | `socials.youtube` | Direct |
| `description` | `description` | Direct |
| `is_spending_on_ads` | `is_spending_on_ads` | boolean coercion |
| `owner_name` | `owner_name` | Direct |
| `featured_image` | `featured_image` | Direct |
| `categories` | `categories[]` | `parseDelimitedField()` |
| `review_keywords` | `review_keywords` | Direct |
| `is_temporarily_closed` | `is_temporarily_closed` | boolean coercion |
| `closed_on` | `closed_on` | Direct |

> **Supabase table name:** `places`  
> **Filter columns:** `query ilike %city%` + `main_category ilike %category%`

---

## Web Worker Protocol

**File:** `src/apps/Leads/workers/searchWorker.js`

### Message to worker
```js
worker.postMessage({
  type: "SEARCH",
  payload: {
    query:    string,       // free-text — searched in name, address, category
    filters:  FilterShape,
    page:     number,       // 0-indexed
    pageSize: number,       // default 30
  }
});
```

### Message from worker
```js
// Success
{ type: "RESULTS", results: Prospect[], total: number }

// Error
{ type: "ERROR", message: string }
```

### FilterShape
```ts
{
  cities:             string[];   // include cities (empty = all)
  categories:         string[];
  excludeCities:      string[];
  excludeCategories:  string[];
  ratingMin:          number;     // 0–5
  ratingMax:          number;
  reviewMin:          number;
  reviewMax:          number;
  requireWebsite:     boolean | null;  // true=require, false=exclude, null=any
  requireSocials:     boolean | null;
  onlyNew:            boolean;
  tagIds:             number[];   // include prospects with ANY of these tags
  excludeTagIds:      number[];
  matchMode:          "ANY" | "ALL";
}
```

---

## GAS Proxy Setup

### Step-by-Step Deployment

1. Open [script.google.com](https://script.google.com) → **New Project**
2. Rename the project to `BizLeads Proxy`
3. Delete the default `myFunction()` and **paste the entire contents** of `gas_tiers/bizleads_proxy/Code.gs`
4. Click **Project Settings** (⚙️ gear icon, left sidebar)
5. Scroll to **Script Properties** → **Add script property** for each:

   | Property Name | Value |
   |---|---|
   | `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon/public key) |
   | `FIREBASE_PROJECT_ID` | `biz-hub-suite` |
   | `FIREBASE_WEB_API_KEY` | Your Firebase Web API key |

6. Click **Deploy** → **New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Authorize the requested Google permissions
8. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
9. Paste it into your `.env.local`:
   ```
   VITE_GAS_PROXY_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```

### Testing the Proxy
Open this URL in your browser (GET request):
```
https://script.google.com/macros/s/YOUR_ID/exec
```
Expected response: `{"status":"alive","service":"BizLeads GAS Proxy v2"}`

### Important Limits
| Limit | Value |
|---|---|
| GAS daily execution quota | 6 min/day (free) / 30 min/day (Workspace) |
| Firestore document size | 1MB max — payload is capped at 500 rows ≈ 150KB |
| Supabase free tier rows | 500MB storage / unlimited requests |

---

## Firebase Rules

Add these Firestore security rules to allow the GAS proxy to write to the inbox
and prevent cross-user access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ── BizLeads inbox ─────────────────────────────────────────────────
    // Only the authenticated user can read/write their own inbox.
    // The GAS proxy writes via the Firebase REST API using the Web API key,
    // which bypasses these rules — that is intentional and safe because
    // the GAS proxy validates the uid from the POST body.
    match /users/{userId}/inbox/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // ── Other existing rules ────────────────────────────────────────────
    // ... keep your existing rules below
  }
}
```

> **Note:** The GAS proxy uses the Firebase Web API Key (not a service account),
> so it bypasses client security rules. This is acceptable because the proxy
> itself validates the `uid` comes from your authenticated frontend POST body.
> For production, consider adding a Cloud Function wrapper with Admin SDK instead.

---

## Environment Variables

### Frontend (`.env.local`)
```env
# GAS Proxy Web App URL (required for scraping)
VITE_GAS_PROXY_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

> All other Firebase config is already in `src/firebase.js` from the existing app setup.

### GAS Script Properties (set in GAS Editor → Project Settings)
```
SUPABASE_URL         = https://your-project.supabase.co
SUPABASE_ANON_KEY    = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FIREBASE_PROJECT_ID  = biz-hub-suite
FIREBASE_WEB_API_KEY = AIzaSy...
```

---

## Configuration Checklist

Complete these steps before testing BizLeads end-to-end:

### 1. Supabase Setup
- [ ] Create a Supabase project at [supabase.com](https://supabase.com)
- [ ] Create a table named **`places`** (import your `Master Leads.csv`)
- [ ] Enable **Row Level Security** on the `places` table
- [ ] Add a policy: `SELECT` allowed for `anon` role (read-only public access)
- [ ] Note your **Project URL** and **anon public key** from Settings → API

### 2. GAS Proxy Deployment
- [ ] Create and deploy the GAS web app (see [GAS Proxy Setup](#gas-proxy-setup))
- [ ] Set all 4 Script Properties
- [ ] Test the GET endpoint returns `{"status":"alive",...}`
- [ ] Test a POST with Postman/curl:
  ```bash
  curl -X POST "YOUR_GAS_URL" \
    -H "Content-Type: application/json" \
    -d '{"uid":"test-uid","batch_id":"test-batch","city":"Manila","category":"Restaurant"}'
  ```
  Expected: `{"status":"ok","count":N}`

### 3. Frontend Environment
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Set `VITE_GAS_PROXY_URL` to your deployed GAS URL
- [ ] Restart the dev server (`npm run dev`)

### 4. Firebase Console
- [ ] Update Firestore Security Rules (see [Firebase Rules](#firebase-rules))
- [ ] Ensure your user's Firestore document has `installedModules` array containing `"LEADS"`:
  ```
  Firestore → users → {your-uid} → installedModules: ["POS", "IMS", "LEADS"]
  ```
  Or click **Install** on the BizLeads card in the Hub Dashboard.

### 5. Supabase Column Verification
- [ ] Confirm your Supabase `places` table has these columns (match your CSV):
  `place_id, name, description, is_spending_on_ads, reviews, rating, website, phone,`
  `owner_name, featured_image, main_category, categories, workday_timing,`
  `is_temporarily_closed, closed_on, address, review_keywords, link, query,`
  `emails, phones, facebook, instagram, twitter, linkedin, tiktok, youtube`
- [ ] If column names differ, update the `selectCols` array in `Code.gs` AND the
  field mappings in `hydrateBatch()` in `src/apps/Leads/db/leadsDb.js`

---

## Feature Reference

### Discovery View (`/leads`)

| Feature | How to use |
|---|---|
| **Search** | Type in the search bar — searches name, address, category |
| **Filter** | Tap the sliders icon → FilterSheet opens from bottom |
| **Scrape** | Tap ⚡ **Scrape New Leads** button in the header |
| **Long-press** | Hold a card 500ms → LeadDetailsModal opens |
| **Bulk select** | Long-press → enters bulk mode; tap to add/remove |
| **Bulk tag** | In bulk mode → tap **Tag** button in the top bar |
| **Bulk delete** | In bulk mode → tap **Delete** button |
| **Tag All Filtered** | Tap **Tag All N** chip in the filter bar |
| **Load more** | Tap "Load More" at bottom of list (30 per page) |

### Tags View (`/leads/tags`)

| Action | Icon | Effect |
|---|---|---|
| **View Leads** | 🔍 | Navigates to Discovery with that tag pre-filtered |
| **Push to Biz Reach** | 🚀 | Serializes leads to `localStorage` for Biz Reach module |
| **Clear Leads** | 🧹 | Removes all prospect associations from tag (tag stays) |
| **Delete Tag** | 🗑️ | Deletes tag + all associations |
| **Remarks** | ∨ | Expand textarea — saves on blur, Dexie only |

### Contact Target Manager (in LeadDetailsModal)

Each lead can have multiple emails and phones (from the CSV). The user selects
which one is the **active target** — this is the one that populates `active_email`
and `active_phone` in Dexie and gets exported to Biz Reach. Selection is saved
immediately to Dexie (never to Firebase).

### Warning Tags on ProspectCard

| Tag | Condition |
|---|---|
| **No Website** | `website` is null |
| **No Socials** | All social columns are null |
| **Low Rating** | `rating > 0 && rating < 3.5` |
| **Unpopular** | `review_count < 10` |
| **Runs Ads** | `is_spending_on_ads === true` |
| **Temp. Closed** | `is_temporarily_closed === true` |

---

## Biz Reach Integration

When "Push to Biz Reach" is triggered, BizLeads writes to `localStorage`:

```js
// Key: "bizreach_leads_payload"
{
  tag:         string,     // tag name
  exported_at: number,     // epoch ms
  leads: [
    {
      id:           string,
      name:         string,
      category:     string,
      city:         string,
      address:      string,
      active_email: string | null,   // user-selected primary
      active_phone: string | null,   // user-selected primary
      website:      string | null,
      socials:      { facebook, instagram, twitter, linkedin, tiktok, youtube },
    }
  ]
}
```

The Biz Reach module should read this on mount:
```js
const raw = localStorage.getItem("bizreach_leads_payload");
if (raw) {
  const { tag, leads, exported_at } = JSON.parse(raw);
  // import leads, clear localStorage item after reading
  localStorage.removeItem("bizreach_leads_payload");
}
```

---

## Architectural Invariants

These rules must **never** be violated during future development:

1. **No direct Supabase calls from the React app.** All data flows through
   GAS → Firestore → Dexie. The Supabase URL and anon key must never appear
   in the frontend source code or environment variables.

2. **Firestore inbox is ephemeral.** The inbox document `users/{uid}/inbox/latest`
   is deleted by `LeadsContext` immediately after hydration. Do not add any logic
   that re-reads this document after deletion.

3. **Tags, Remarks, and active contact selections are Dexie-only.** Never
   write any user-generated CRM annotations back to Firebase or any remote service.

4. **`active_email` and `active_phone` in Dexie are user-owned.** The initial
   values are set to `emails[0]` and `phones[0]` during `hydrateBatch`, but
   subsequent scrapes of the same `place_id` use `bulkPut` (upsert), which
   **does not overwrite** existing rows — preserving the user's selection.
   ⚠️ If you ever change to `bulkAdd`, this invariant breaks.
