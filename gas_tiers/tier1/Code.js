/**
 * Purpose: Tier 1 Global Directory — JWT Validator & Business Hub Router.
 *
 * This script is bound to the Global Directory Google Sheet.
 * No external sheet IDs, no Config.js — SpreadsheetApp.getActiveSpreadsheet() is used throughout.
 *
 * Sheet Tabs:
 *   Directory — Business_Email | Company_ID | Active | Tier2_URL
 *
 * POST Actions:
 *   (default)    — { jwt, businessEmail? } → validates JWT, looks up businessEmail in Directory, returns Tier2_URL
 *   validate_jwt — { action, jwt }         → called by Tier 2 Hubs to verify a Firebase JWT without needing their own API key
 *   register_hub — { action, selfUrl, ownerEmail, companyId } → Tier 2 Hub self-registers into Directory
 *
 * MAINTENANCE NOTE: Always keep this documentation header updated alongside code changes.
 */

// ── Only thing you paste here — your Firebase Web API Key ────────────────────
const FIREBASE_API_KEY = 'AIzaSyAhT0izurWY_ZE_TakfXfe__MdGy-760c4';
// ─────────────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Biz IMS Global')
    .addItem('🚀 Initialize Directory', 'initializeGlobalLedger')
    .addToUi();
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

function initializeGlobalLedger() {
  const ss  = SpreadsheetApp.getActiveSpreadsheet();
  const ui  = SpreadsheetApp.getUi();

  // Directory tab — one row per registered business Hub
  let dir = ss.getSheetByName('Directory') || ss.insertSheet('Directory');
  if (dir.getLastRow() === 0) {
    dir.getRange('A1:D1')
       .setValues([['Business_Email', 'Company_ID', 'Active', 'Tier2_URL']])
       .setFontWeight('bold');
  }

  // Remove Sheet1 if it exists
  const s1 = ss.getSheetByName('Sheet1');
  if (s1) try { ss.deleteSheet(s1); } catch (e) {}

  ui.alert('✅ Directory initialized. Hub nodes will self-register here via "📡 Register to Global Directory" in their own menu.');
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB APP
// ─────────────────────────────────────────────────────────────────────────────

function doGet(e) {
  return buildResponse(200, { status: 'Biz IMS Tier 1 Directory Online' });
}

function doPost(e) {
  try {
    if (!e || !e.postData) throw new Error('Missing payload');
    const payload = JSON.parse(e.postData.contents);

    // Route: Tier 2 Hub self-registration (no JWT needed — Tier 2 is admin-provisioned)
    if (payload.action === 'register_hub') return handleHubRegistration(payload);

    // Route: Tier 2 delegates JWT validation here to avoid duplicating the Firebase API key
    if (payload.action === 'validate_jwt') {
      if (!payload.jwt) return buildResponse(400, { error: 'Missing jwt' });
      const auth = verifyFirebaseJWT(payload.jwt);
      return buildResponse(auth.valid ? 200 : 403, { valid: auth.valid, email: auth.email || null });
    }

    // Route: Frontend user lookup — validate JWT then resolve their Tier 2 URL
    return handleUserRoute(payload);

  } catch (err) {
    return buildResponse(500, { error: err.toString() });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates Firebase JWT and resolves the caller's Tier 2 Hub URL.
 * payload: { jwt, businessEmail? }
 *   businessEmail — the Hub owner's email (e.g. client@business.com).
 *     Workers supply it to find their business Hub.
 *     The Hub owner omits it — their own JWT email is used.
 */
function handleUserRoute(payload) {
  const { jwt, businessEmail } = payload;
  if (!jwt) return buildResponse(400, { error: 'Missing JWT' });

  const auth = verifyFirebaseJWT(jwt);
  if (!auth.valid) return buildResponse(403, { error: 'Invalid or expired Firebase JWT' });

  const lookupEmail = (businessEmail || '').trim() || auth.email;
  const entry       = lookupDirectory(lookupEmail);

  if (!entry.found)  return buildResponse(404, { error: 'Business not registered. Ask the Hub owner to run "Register to Global Directory".' });
  if (!entry.active) return buildResponse(403, { error: 'Business account is suspended.' });

  return buildResponse(200, {
    tier2Url:  entry.tier2Url,
    parentUrl: entry.tier2Url, // backward-compat alias
    companyId: entry.companyId,
    userEmail: auth.email
  });
}

/**
 * Called by a Tier 2 Hub's "📡 Register to Global Directory" menu action.
 * payload: { action, selfUrl, ownerEmail, companyId }
 * Upserts a row in the Directory tab. No auth key needed — only you provision Hubs.
 */
function handleHubRegistration(payload) {
  const { selfUrl, ownerEmail, companyId } = payload;
  if (!selfUrl || !ownerEmail) {
    return buildResponse(400, { error: 'Missing selfUrl or ownerEmail.' });
  }

  const dir = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Directory');
  if (!dir) return buildResponse(500, { error: 'Directory tab not found. Run Initialize first.' });

  const data = dir.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().toLowerCase() === ownerEmail.toLowerCase()) {
      dir.getRange(i + 1, 2).setValue(companyId || data[i][1]);
      dir.getRange(i + 1, 3).setValue('TRUE');
      dir.getRange(i + 1, 4).setValue(selfUrl);
      return buildResponse(200, { status: 'updated', ownerEmail, selfUrl });
    }
  }

  dir.appendRow([ownerEmail, companyId || ownerEmail, 'TRUE', selfUrl]);
  return buildResponse(200, { status: 'registered', ownerEmail, selfUrl });
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function verifyFirebaseJWT(token) {
  const res  = UrlFetchApp.fetch(
    'https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + FIREBASE_API_KEY,
    { method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: token }), muteHttpExceptions: true }
  );
  const data = JSON.parse(res.getContentText());
  if (data.users && data.users.length > 0) return { valid: true, email: data.users[0].email };
  return { valid: false };
}

function lookupDirectory(email) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Directory');
  if (!sheet) throw new Error('Directory tab not found. Run Initialize first.');
  const data  = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] && data[i][0].toString().toLowerCase() === email.toLowerCase()) {
      return {
        found:     true,
        companyId: data[i][1],
        active:    (data[i][2] === true || String(data[i][2]).toUpperCase() === 'TRUE'),
        tier2Url:  data[i][3]
      };
    }
  }
  return { found: false };
}

function buildResponse(code, payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
