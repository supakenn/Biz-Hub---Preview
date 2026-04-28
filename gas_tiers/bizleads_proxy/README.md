# BizLeads GAS Proxy — Deployment Guide

> **File:** `gas_tiers/bizleads_proxy/Code.gs`
> **Purpose:** Isolated Google Apps Script that queries Supabase and writes results
> to Firebase Firestore — acting as the sole bridge between the 60MB master database
> and the React app. The frontend never talks to Supabase directly.

---

## Quick-Deploy Steps

1. Open [script.google.com](https://script.google.com) → **New Project**
2. Rename project: `BizLeads Proxy`
3. Paste the full contents of `Code.gs` (replace the default empty function)
4. Go to **Project Settings** → **Script Properties** → add all 4 keys below
5. Click **Deploy** → **New Deployment** → **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Authorize** and grant permissions
7. Copy the `Web App URL` and paste it into your frontend `.env.local`:
   ```
   VITE_GAS_PROXY_URL=https://script.google.com/macros/s/YOUR_ID/exec
   ```

---

## Required Script Properties

Set these in **GAS Editor → Project Settings (⚙️) → Script Properties**:

| Property | Where to find it | Example |
|---|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | `https://abcxyz.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon (public) key | `eyJhbGci...` |
| `FIREBASE_PROJECT_ID` | Firebase Console → Project Settings → General | `biz-hub-suite` |
| `FIREBASE_WEB_API_KEY` | Firebase Console → Project Settings → General → Web API Key | `AIzaSy...` |

---

## API Reference

### POST `/exec` — Trigger a scrape

Request body (JSON):
```json
{
  "uid":       "firebase-user-uid",
  "batch_id":  "uuid-v4-string",
  "city":      "Manila",
  "category":  "Restaurant"
}
```

Success response:
```json
{ "status": "ok", "count": 127 }
```

Error response:
```json
{ "status": "error", "message": "Supabase query failed: ..." }
```

### GET `/exec` — Health check

```json
{ "status": "alive", "service": "BizLeads GAS Proxy v2" }
```

---

## How It Works Internally

```
doPost(e)
  │
  ├─ querySupabase(city, category)
  │     ├─ Reads SUPABASE_URL + SUPABASE_ANON_KEY from Script Properties
  │     ├─ Calls Supabase REST: GET /rest/v1/places
  │     │   filters: query ilike %city%  AND  main_category ilike %category%
  │     │   selects: 25 columns (all Outscraper CSV columns)
  │     │   limit: 500 rows
  │     └─ Returns raw array (trimmed to 500)
  │
  └─ writeToFirestoreInbox(uid, batchId, city, category, items)
        ├─ Reads FIREBASE_PROJECT_ID + FIREBASE_WEB_API_KEY
        ├─ PATCH Firestore REST:
        │   projects/{PROJECT_ID}/databases/(default)/documents/users/{uid}/inbox/latest
        └─ Document fields: { status:"ready", batch_id, city, category, items[], written_at }
```

The LeadsContext Firestore `onSnapshot` listener in the React app picks up the
document within ~1-2 seconds, hydrates Dexie, then **deletes the inbox document**.
This means **zero Firestore storage cost** — the document exists for < 5 seconds.

---

## Supabase Table Requirements

Your `places` table must have these columns (match your Outscraper CSV export):

```sql
place_id          TEXT  PRIMARY KEY
name              TEXT
description       TEXT
is_spending_on_ads BOOLEAN
reviews           INTEGER
rating            NUMERIC
website           TEXT
phone             TEXT
owner_name        TEXT
featured_image    TEXT
main_category     TEXT
categories        TEXT      -- comma-delimited
workday_timing    TEXT
is_temporarily_closed BOOLEAN
closed_on         TEXT
address           TEXT
review_keywords   TEXT
link              TEXT      -- Google Maps URL
query             TEXT      -- e.g. "restaurants in manila, metro manila, philippines"
emails            TEXT      -- comma-delimited
phones            TEXT      -- comma-delimited
facebook          TEXT
instagram         TEXT
twitter           TEXT
linkedin          TEXT
tiktok            TEXT
youtube           TEXT
```

**Recommended index for query performance:**
```sql
CREATE INDEX idx_places_query_category
  ON places USING gin(to_tsvector('english', query || ' ' || main_category));
```

Or a simpler B-tree approach for small tables:
```sql
CREATE INDEX idx_places_query ON places (query);
CREATE INDEX idx_places_category ON places (main_category);
```

---

## Quota & Limits

| Limit | Free Tier | Google Workspace |
|---|---|---|
| Daily execution time | 6 minutes | 30 minutes |
| Simultaneous executions | 30 | 30 |
| URL Fetch calls/day | 20,000 | 20,000 |
| Firestore write size | 1MB | 1MB |

At 500 rows × ~300 bytes/row = 150KB per scrape, you can do **~40 scrapes/day** on
the free tier before hitting the execution time limit.

---

## Updating the Deployment

After any code change to `Code.gs`:
1. Click **Deploy** → **Manage Deployments**
2. Click the ✏️ edit icon on your existing deployment
3. Change **Version** to **New version**
4. Click **Deploy** — the URL stays the same
