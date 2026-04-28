# BizLeads GAS Proxy — Deployment Guide

> **File to deploy:** `Code.gs` (this folder)
> **Purpose:** Isolated Google Apps Script that queries Supabase and writes results
> to Firebase Firestore — the sole bridge between the 60MB master database and the
> React app. **The frontend never talks to Supabase directly.**

---

## Quick-Deploy Steps

1. Open [script.google.com](https://script.google.com) → **New Project**
2. Rename project: **`BizLeads Proxy`**
3. Delete the default `myFunction()` and **paste the full contents of `Code.gs`**
4. Click the **⚙️ gear icon** (Project Settings) in the left sidebar
5. Scroll to **Script Properties** → click **Add script property** for each key:

   | Property Name | Value |
   |---|---|
   | `SUPABASE_URL` | `https://xxxxxxxxxxxx.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGci...` (anon/public key) |
   | `FIREBASE_PROJECT_ID` | `biz-hub-suite` |
   | `FIREBASE_WEB_API_KEY` | `AIzaSy...` |

6. Click **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Authorize** and grant the requested Google permissions
8. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
9. Add it to your project root `.env.local`:
   ```env
   VITE_GAS_PROXY_URL=https://script.google.com/macros/s/AKfycb.../exec
   ```
10. Restart the dev server: `npm run dev`

---

## Where to Find Each Key

| Key | Location |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → **Settings → API → Project URL** |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → **Settings → API → anon (public) key** |
| `FIREBASE_PROJECT_ID` | Firebase Console → **Project Settings → General → Project ID** |
| `FIREBASE_WEB_API_KEY` | Firebase Console → **Project Settings → General → Web API Key** |

---

## Testing the Proxy

**Health check** — open this in your browser (GET):
```
https://script.google.com/macros/s/YOUR_ID/exec
```
✅ Expected: `{"status":"alive","service":"BizLeads GAS Proxy v2"}`

**Scrape test** — use curl or Postman (POST):
```bash
curl -X POST "https://script.google.com/macros/s/YOUR_ID/exec" \
  -H "Content-Type: application/json" \
  -d '{
    "uid":      "test-uid-123",
    "batch_id": "test-batch-abc",
    "city":     "Manila",
    "category": "Restaurant"
  }'
```
✅ Expected: `{"status":"ok","count":127}`

---

## How It Works

```
POST {uid, batch_id, city, category}
  │
  ├─ querySupabase(city, category)
  │     GET /rest/v1/places
  │     ?query=ilike.%manila%
  │     &main_category=ilike.%restaurant%
  │     &limit=500
  │     &select=place_id,name,emails,phones,...
  │
  └─ writeToFirestoreInbox(uid, batchId, city, category, items)
        PATCH .../users/{uid}/inbox/latest
        { status:"ready", batch_id, city, category, items[], written_at }
        ↓
        LeadsContext onSnapshot fires in React app (~1-2 sec)
        → hydrateBatch() → Dexie.js
        → deleteDoc(inboxRef)    ← doc exists < 5 seconds
```

---

## Supabase Table DDL

Your `places` table must match these column names exactly
(same as the Outscraper CSV export headers):

```sql
CREATE TABLE places (
  place_id              TEXT PRIMARY KEY,
  name                  TEXT,
  description           TEXT,
  is_spending_on_ads    BOOLEAN,
  reviews               INTEGER,
  rating                NUMERIC(3,1),
  website               TEXT,
  phone                 TEXT,
  owner_name            TEXT,
  featured_image        TEXT,
  main_category         TEXT,
  categories            TEXT,        -- comma-delimited string
  workday_timing        TEXT,
  is_temporarily_closed BOOLEAN,
  closed_on             TEXT,
  address               TEXT,
  review_keywords       TEXT,
  link                  TEXT,        -- Google Maps URL
  query                 TEXT,        -- e.g. "restaurants in manila, metro manila, philippines"
  emails                TEXT,        -- comma-delimited string
  phones                TEXT,        -- comma-delimited string
  facebook              TEXT,
  instagram             TEXT,
  twitter               TEXT,
  linkedin              TEXT,
  tiktok                TEXT,
  youtube               TEXT
);

-- Recommended indexes for ilike filter performance
CREATE INDEX idx_places_query    ON places (query);
CREATE INDEX idx_places_category ON places (main_category);
```

> If you renamed any columns during CSV import, update **both**:
> 1. `selectCols` array in `Code.gs` → `querySupabase()`
> 2. Field mappings in `src/apps/Leads/db/leadsDb.js` → `hydrateBatch()`

---

## Updating After Code Changes

1. In GAS Editor → **Deploy → Manage Deployments**
2. Click the **✏️ edit** icon on your deployment
3. Set **Version** → **New version**
4. Click **Deploy** — the Web App URL does **not** change

---

## Quota & Cost

| Metric | Free Tier | Notes |
|---|---|---|
| Daily execution time | 6 min/day | Each scrape ≈ 3-8 sec → ~60 scrapes/day |
| URL Fetch calls | 20,000/day | Each scrape = 2 calls (Supabase + Firestore) |
| Firestore write size | 1 MB max | 500 rows × ~300 B ≈ 150 KB — well within limit |
| Firestore storage cost | $0 | Inbox doc deleted within 5 seconds |
| Supabase cost | $0 | Read-only queries on free tier |
