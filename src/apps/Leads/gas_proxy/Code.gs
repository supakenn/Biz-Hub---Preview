// src/apps/Leads/gas_proxy/Code.gs
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Google Apps Script (GAS) Proxy
//
// ⚠️  THIS FILE IS NOT PART OF THE REACT BUILD.
//     Paste into https://script.google.com — ideally a container-bound script
//     attached to a Google Spreadsheet so the search history sheet is visible.
//
// DEPLOYMENT:
//   1. Open your Google Spreadsheet → Extensions → Apps Script
//      (or go to script.google.com → New Project if standalone)
//   2. Paste this entire file, replacing the default function.
//   3. Project Settings (⚙️) → Script Properties → add all 4 keys below.
//   4. Deploy → New Deployment → Web App
//      Execute as: "Me"  |  Who has access: "Anyone"
//   5. Copy Web App URL → .env.local as VITE_GAS_PROXY_URL
//
// REQUIRED SCRIPT PROPERTIES:
//   SUPABASE_URL         — https://xxxx.supabase.co
//   SUPABASE_ANON_KEY    — eyJhbGci… (anon public key)
//   FIREBASE_PROJECT_ID  — biz-hub-suite
//   FIREBASE_WEB_API_KEY — AIzaSy…
//
// OPTIONAL SCRIPT PROPERTY (standalone scripts only):
//   SPREADSHEET_ID       — ID of an existing Google Sheet for the search log.
//                          If omitted, a new spreadsheet is created automatically
//                          and its ID is saved back to this property.
//
// SEARCH BEHAVIOUR:
//   city    → strict city filter    (WHERE query ILIKE '%city%')
//   keyword → category-only filter  (WHERE main_category ILIKE '%keyword%')
//             example: keyword "print" → main_category ILIKE '%print%'
//
// FIRESTORE PATHS:
//   users/{uid}/inbox/latest   — ephemeral inbox; deleted by React after hydration
//
// SPREADSHEET SHEET "Search History":
//   Columns: city | keyword | count | last_searched
//   Auto-created on first scrape if it doesn't exist.
//   React fetches suggestions via GET ?action=suggestions → top 10 by count.
//
// ─────────────────────────────────────────────────────────────────────────────

// ─── Entry Point: POST ────────────────────────────────────────────────────────
/**
 * Handles POST requests from the React frontend.
 *
 * Body (Content-Type: text/plain — avoids CORS preflight on GAS):
 *   { uid, batch_id, city, keyword, token }
 *
 * Response: { status: "ok"|"error", count?: number, message?: string }
 */
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const body = JSON.parse(e.postData.contents);
    const { uid, batch_id, city, keyword, token } = body;

    if (!uid || !batch_id || !city || !keyword || !token) {
      output.setContent(JSON.stringify({
        status:  "error",
        message: "Missing required fields: uid, batch_id, city, keyword, token.",
      }));
      return output;
    }

    // 1. Query Supabase (city strict, keyword = category ILIKE)
    const items = querySupabase(city, keyword);

    // 2. Write results to the user's Firestore inbox
    writeToFirestoreInbox(uid, batch_id, city, keyword, items, token);

    // 3. Log to Google Sheet — non-fatal
    try {
      logSearchToSheet(city, keyword);
    } catch (logErr) {
      Logger.log("Sheet log failed (non-fatal): " + logErr.message);
    }

    output.setContent(JSON.stringify({ status: "ok", count: items.length }));
  } catch (err) {
    output.setContent(JSON.stringify({ status: "error", message: err.message }));
  }

  return output;
}

// ─── Entry Point: GET ─────────────────────────────────────────────────────────
/**
 * GET ?action=suggestions  → returns top 10 searches from the Sheet as JSON
 * GET (no params)          → health check
 */
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;

  if (action === "suggestions") {
    try {
      const suggestions = getTopSuggestions(10);
      return ContentService
        .createTextOutput(JSON.stringify({ status: "ok", suggestions }))
        .setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: "error", message: err.message }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: "alive", service: "BizLeads GAS Proxy v2" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── Supabase Query ───────────────────────────────────────────────────────────
/**
 * Queries the Supabase LEADS table.
 *
 * Filter logic:
 *   city    → query column ILIKE '%city%'           (strict location match)
 *   keyword → main_category column ILIKE '%keyword%' (category-only, case-insensitive)
 *
 * Example: city="Manila", keyword="print"
 *   WHERE query ILIKE '%Manila%' AND main_category ILIKE '%print%'
 *
 * @param {string} city
 * @param {string} keyword
 * @returns {Object[]}
 */
function querySupabase(city, keyword) {
  const props        = PropertiesService.getScriptProperties();
  const SUPABASE_URL = props.getProperty("SUPABASE_URL");
  const SUPABASE_KEY = props.getProperty("SUPABASE_ANON_KEY");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase credentials not configured in Script Properties.");
  }

  const selectCols = [
    "place_id", "name", "description", "is_spending_on_ads",
    "reviews", "rating", "website", "phone",
    "owner_name", "featured_image", "main_category", "categories",
    "workday_timing", "is_temporarily_closed", "closed_on",
    "address", "review_keywords", "link", "query",
    "emails", "phones",
    "facebook", "instagram", "twitter", "linkedin", "tiktok", "youtube",
  ].join(",");

  const pct        = encodeURIComponent("%");
  const cityEnc    = encodeURIComponent(city);
  const keywordEnc = encodeURIComponent(keyword);

  // City: strict match on the 'query' column (contains city name)
  // Keyword: ILIKE match on 'main_category' only — case-insensitive, partial match
  const url =
    `${SUPABASE_URL}/rest/v1/LEADS` +
    `?query=ilike.${pct}${cityEnc}${pct}` +
    `&main_category=ilike.${pct}${keywordEnc}${pct}` +
    `&limit=500` +
    `&select=${encodeURIComponent(selectCols)}`;

  const response = UrlFetchApp.fetch(url, {
    method:  "GET",
    headers: {
      "apikey":        SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      "Content-Type":  "application/json",
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    throw new Error(`Supabase query failed: ${response.getContentText()}`);
  }

  const raw = JSON.parse(response.getContentText());
  if (!Array.isArray(raw)) throw new Error("Unexpected Supabase response format.");

  return raw.slice(0, 500);
}

// ─── Firestore Inbox Write ────────────────────────────────────────────────────
/**
 * Writes scraped items to users/{uid}/inbox/latest.
 * Uses the user's Firebase ID token (Authorization: Bearer) so Firestore
 * security rules (request.auth.uid == userId) are satisfied.
 *
 * @param {string}   uid
 * @param {string}   batchId
 * @param {string}   city
 * @param {string}   keyword
 * @param {Object[]} items
 * @param {string}   token    Firebase ID token
 */
function writeToFirestoreInbox(uid, batchId, city, keyword, items, token) {
  const props       = PropertiesService.getScriptProperties();
  const PROJECT_ID  = props.getProperty("FIREBASE_PROJECT_ID");
  const WEB_API_KEY = props.getProperty("FIREBASE_WEB_API_KEY");

  if (!PROJECT_ID || !WEB_API_KEY) {
    throw new Error("Firebase credentials not configured in Script Properties.");
  }

  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}` +
    `/databases/(default)/documents/users/${uid}/inbox/latest` +
    `?key=${WEB_API_KEY}`;

  const firestoreDoc = {
    fields: {
      status:     { stringValue:  "ready" },
      batch_id:   { stringValue:  batchId },
      city:       { stringValue:  city },
      keyword:    { stringValue:  keyword },
      written_at: { integerValue: String(Date.now()) },
      items:      { arrayValue:   { values: items.map(itemToFirestoreValue) } },
    },
  };

  const response = UrlFetchApp.fetch(url, {
    method:      "PATCH",
    contentType: "application/json",
    headers:     { "Authorization": `Bearer ${token}` },
    payload:     JSON.stringify(firestoreDoc),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error(`Firestore write failed (${code}): ${response.getContentText()}`);
  }
}

// ─── Google Sheet: Search History ─────────────────────────────────────────────
/**
 * Returns the "Search History" sheet, creating it (and the spreadsheet if
 * necessary) if it doesn't already exist.
 *
 * Preference order:
 *   1. Container-bound spreadsheet (getActiveSpreadsheet) — if this script
 *      was opened via Extensions → Apps Script from a Google Sheet.
 *   2. Existing spreadsheet by SPREADSHEET_ID script property.
 *   3. Brand-new spreadsheet — ID is saved to SPREADSHEET_ID for reuse.
 *
 * Sheet columns (row 1 is a frozen header):
 *   A: city  |  B: keyword  |  C: count  |  D: last_searched (ISO string)
 *
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateHistorySheet() {
  let ss = null;

  // Try container-bound first
  try { ss = SpreadsheetApp.getActiveSpreadsheet(); } catch (_) {}

  // Try saved SPREADSHEET_ID
  if (!ss) {
    const props = PropertiesService.getScriptProperties();
    const savedId = props.getProperty("SPREADSHEET_ID");
    if (savedId) {
      try { ss = SpreadsheetApp.openById(savedId); } catch (_) {}
    }
  }

  // Create a brand-new spreadsheet and save its ID
  if (!ss) {
    ss = SpreadsheetApp.create("BizLeads — Search History");
    PropertiesService.getScriptProperties().setProperty("SPREADSHEET_ID", ss.getId());
    Logger.log("Created new spreadsheet: " + ss.getUrl());
  }

  const SHEET_NAME = "Search History";
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    // Header row
    sheet.appendRow(["city", "keyword", "count", "last_searched"]);
    sheet.setFrozenRows(1);
    // Column widths
    sheet.setColumnWidth(1, 140);
    sheet.setColumnWidth(2, 180);
    sheet.setColumnWidth(3, 80);
    sheet.setColumnWidth(4, 200);
    // Bold header
    sheet.getRange(1, 1, 1, 4).setFontWeight("bold");
    Logger.log("Created 'Search History' sheet.");
  }

  return sheet;
}

/**
 * Finds an existing row for city+keyword (case-insensitive), increments its
 * count, or appends a new row if not found.
 *
 * @param {string} city
 * @param {string} keyword
 */
function logSearchToSheet(city, keyword) {
  const sheet    = getOrCreateHistorySheet();
  const data     = sheet.getDataRange().getValues(); // [header, row, row, ...]
  const cityLow  = city.toLowerCase().trim();
  const kwLow    = keyword.toLowerCase().trim();
  const now      = new Date().toISOString();

  for (let i = 1; i < data.length; i++) {
    const rowCity = String(data[i][0]).toLowerCase().trim();
    const rowKw   = String(data[i][1]).toLowerCase().trim();
    if (rowCity === cityLow && rowKw === kwLow) {
      // Found — increment count and update last_searched
      const countCell = sheet.getRange(i + 1, 3); // col C (1-indexed)
      countCell.setValue((parseInt(data[i][2]) || 0) + 1);
      sheet.getRange(i + 1, 4).setValue(now);
      return;
    }
  }

  // Not found — append a new row
  sheet.appendRow([city.trim(), keyword.trim(), 1, now]);
}

/**
 * Reads the Search History sheet and returns the top N entries sorted by
 * count descending. Used by doGet?action=suggestions.
 *
 * @param {number} limit
 * @returns {{ city: string, keyword: string, count: number, last_searched: string }[]}
 */
function getTopSuggestions(limit) {
  const sheet = getOrCreateHistorySheet();
  const data  = sheet.getDataRange().getValues();

  // Skip header row (index 0)
  const rows = data.slice(1).map(row => ({
    city:          String(row[0]),
    keyword:       String(row[1]),
    count:         parseInt(row[2]) || 0,
    last_searched: String(row[3]),
  }));

  return rows
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ─── Firestore Value Serializer ────────────────────────────────────────────
function toFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === "boolean")            return { booleanValue: value };
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === "string")  return { stringValue: value };
  if (Array.isArray(value))       return { arrayValue: { values: value.map(toFirestoreValue) } };
  if (typeof value === "object") {
    const fields = {};
    Object.keys(value).forEach(k => { fields[k] = toFirestoreValue(value[k]); });
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

function itemToFirestoreValue(item) { return toFirestoreValue(item); }
