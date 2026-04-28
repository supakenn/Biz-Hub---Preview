/**
 * Purpose: Tier 2 Monolithic Hub — All business data, auth, schema, and RBAC in one file.
 * Replaces the old distributed Tier 3 node architecture entirely.
 *
 * POST Actions: register | read | write | delete_row |
 *               create_node | update_schema |
 *               get_users | approve_user | assign_role
 *
 * Sheet Tabs: Global_Config | User_Map | Node_X_Inventory | Node_X_Audits
 * MAINTENANCE NOTE: Always keep this documentation header updated alongside code changes.
 */

// ── Note: No hardcoded CONFIG block. All secrets live in the Global_Config tab. ───────────────

// ── ROLE CONSTANTS ─────────────────────────────────────────────────────────────
const ROLES = { HEAD: 'HEAD', SUB_HEAD: 'SUB-HEAD', TECH: 'TECH', USER: 'USER', PENDING: 'PENDING' };
const ROLE_WEIGHT = { HEAD: 4, 'SUB-HEAD': 3, TECH: 2, USER: 1, PENDING: 0 };
function roleAtLeast(actual, minimum) { return (ROLE_WEIGHT[actual] || 0) >= (ROLE_WEIGHT[minimum] || 0); }

// ── CACHE KEY HELPERS ──────────────────────────────────────────────────────────
const cacheKey      = node => 'BIZIMS_DATA_'  + node;
const cacheStampKey = node => 'BIZIMS_STAMP_' + node;
const CACHE_TTL     = 21600; // 6 hours

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT MENU & SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Biz IMS Hub')
    .addItem('🚀 Initialize Hub',              'initializeHub')
    .addSeparator()
    .addItem('📡 Register to Global Directory', 'registerToDirectory')
    .addSeparator()
    .addItem('⚙️ Open Admin Panel',             'openAdminSidebar')
    .addItem('📅 Setup Daily Cull Trigger',     'setupCullTrigger')
    .addToUi();
}

function openAdminSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar').setTitle('Biz IMS Admin').setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Registers this Hub into the Tier 1 Global Directory.
 * The deployer's email (Session.getEffectiveUser()) is used as the business identifier.
 * Users enter this email in the PWA to connect to this business and get registered.
 * Reads SELF_URL and TIER_1_URL from Global_Config.
 */
function registerToDirectory() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  const selfUrl    = getCfgValue('SELF_URL');
  const tier1Url   = getCfgValue('TIER_1_URL');

  // The email of whoever deployed this script IS the business identifier
  const ownerEmail = Session.getEffectiveUser().getEmail();

  if (!selfUrl || selfUrl === 'PASTE_THIS_TIER2_DEPLOYMENT_URL_HERE') {
    ss.toast('SELF_URL is not set in Global_Config. Deploy this script as a Web App first.', '❌ Error', 6);
    return;
  }
  if (!tier1Url || tier1Url === 'PASTE_TIER1_DIRECTORY_URL_HERE') {
    ss.toast('TIER_1_URL is not set in Global_Config.', '❌ Error', 6);
    return;
  }

  try {
    const response   = UrlFetchApp.fetch(tier1Url, {
      method:          'post',
      contentType:     'text/plain',
      followRedirects: true,
      muteHttpExceptions: true,
      payload:         JSON.stringify({
        action:    'register_hub',
        selfUrl,
        ownerEmail,
        companyId: ownerEmail
      })
    });

    const rawText    = response.getContentText();
    const httpCode   = response.getResponseCode();

    // If Tier 1 returns HTML (wrong URL, GAS error page) show the URL + raw snippet
    if (rawText.trim().startsWith('<')) {
      ss.toast(
        'Tier 1 returned an HTML error page (HTTP ' + httpCode + ').\n' +
        'Check that TIER_1_URL is the deployed Web App URL ending in /exec.\n' +
        'Current URL: ' + tier1Url,
        '❌ Wrong URL or Tier 1 Error',
        15
      );
      console.error('Tier 1 raw response:', rawText.substring(0, 500));
      return;
    }

    const result = JSON.parse(rawText);
    if (result.status === 'registered' || result.status === 'updated') {
      ss.toast(
        'Business ID: ' + ownerEmail +
        '\nHub URL: ' + selfUrl +
        '\n\nShare your email (' + ownerEmail + ') with users so they can connect.',
        '✅ Registered in Global Directory',
        10
      );
    } else {
      ss.toast(result.error || JSON.stringify(result), '❌ Registration Failed', 8);
    }
  } catch (err) {
    ss.toast(
      err.toString() + '\n\nTIER_1_URL: ' + tier1Url,
      '❌ Network Error',
      10
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ─────────────────────────────────────────────────────────────────────────────

function initializeHub() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Global_Config tab
  let cfg = ss.getSheetByName('Global_Config') || ss.insertSheet('Global_Config');
  if (cfg.getLastRow() === 0) {
    cfg.getRange('A1:B1').setValues([['Key', 'Value']]).setFontWeight('bold');
  }
  const cfgDefaults = {
    SELF_URL:           'PASTE_THIS_TIER2_DEPLOYMENT_URL_HERE',
    TIER_1_URL:         'PASTE_TIER1_DIRECTORY_URL_HERE',
    SCHEMA_VERSION:     '1',
    NODE_REGISTRY:      '[]',
    AUDIT_FIFO_LIMIT:   '10000',
    AUDIT_ARCHIVE_SIZE: '5000',
    SHOP_NAME:          'Biz IMS',
    SANDBOX_TEMPLATE_ID:'PASTE_SANDBOX_TEMPLATE_ID_HERE',
    
    // 📦 ADD THIS LINE:
    UPLOADS_FOLDER_ID:  '' // Will auto-populate when the first file is uploaded
  };
  const existing = cfg.getLastRow() > 1
    ? cfg.getRange(2, 1, cfg.getLastRow() - 1, 1).getValues().map(r => r[0])
    : [];
  Object.entries(cfgDefaults).forEach(([k, v]) => {
    if (!existing.includes(k)) cfg.appendRow([k, v]);
  });

  // Highlight unfilled placeholders
  for (let i = 2; i <= cfg.getLastRow(); i++) {
    if (String(cfg.getRange(i, 2).getValue()).startsWith('PASTE_')) {
      cfg.getRange(i, 2).setFontColor('#c0392b').setFontWeight('bold');
    }
  }

  // User_Map tab
  let um = ss.getSheetByName('User_Map') || ss.insertSheet('User_Map');
  if (um.getLastRow() === 0) {
    um.getRange('A1:D1').setValues([['User_Email', 'Global_Role', 'Allowed_Nodes', 'Joined_Date']]).setFontWeight('bold');
  }

  // Clean up Sheet1
  const s1 = ss.getSheetByName('Sheet1');
  if (s1) try { ss.deleteSheet(s1); } catch (e) {}

  ss.toast(
    'Fill in the red values in Global_Config, then run "📡 Register to Global Directory".',
    '✅ Hub Initialized — Action Required',
    10
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// WEB APP ENTRY POINTS
// ─────────────────────────────────────────────────────────────────────────────

function doGet(e) {
  return buildResponse(200, { status: 'Biz IMS Hub Online', version: getCfgValue('SCHEMA_VERSION') });
}

function doPost(e) {
  try {
    if (!e || !e.postData) throw new Error('Missing payload');
    const payload = JSON.parse(e.postData.contents);
    const { action, jwt } = payload;

    if (action === 'SYNC_SANDBOX') {
        if (!jwt) {
            const { sandboxToken, nodeName } = payload;
            const validToken = getCfgValue('SANDBOX_TOKEN_' + nodeName);
            if (sandboxToken && validToken && sandboxToken === validToken) {
               // Authorized via Sandbox Token
               const creatorEmail = getCfgValue('SANDBOX_OWNER_' + nodeName);
               const session = getUserSession(creatorEmail);
               return handleSyncSandbox(payload, creatorEmail, session);
            }
        }
    }

    if (!jwt) return buildResponse(400, { error: 'Missing JWT' });

    // Validate JWT for every request
    const auth = verifyJWT(jwt);
    if (!auth.valid) return buildResponse(403, { error: 'Invalid or expired Firebase JWT' });
    const email = auth.email;

    // register doesn't require pre-existing role
    if (action === 'register') return handleRegister(email);

    // All other actions require a resolved role
    const session = getUserSession(email);
    if (!session) return buildResponse(403, { error: 'User not registered. Call action:register first.' });
    if (session.role === ROLES.PENDING) return buildResponse(403, { error: 'Account pending approval.', status: 'pending' });

    switch (action) {
      case 'read':         return handleRead(payload, session);
      case 'write':        return handleWrite(payload, email, session);
      case 'update_row':   return handleUpdateRow(payload, email, session);
      case 'batch_sync':   return handleBatchSync(payload, email, session);
      case 'GENERATE_SANDBOX': return handleGenerateSandbox(payload, email, session);
      case 'SYNC_SANDBOX': return handleSyncSandbox(payload, email, session);
      case 'get_users':    return handleGetUsers(session);
      case 'approve_user': return handleApproveUser(payload, session);
      case 'assign_role':  return handleApproveUser(payload, session);
      case 'set_config':   return handleSetConfig(payload, session);
      case 'get_pending_node_deletions': return handleGetPendingNodeDeletions(session);
      case 'request_delete_node': return handleRequestDeleteNode(payload, email, session);
      case 'approve_delete_node': return handleApproveDeleteNode(payload, email, session);
      case 'restore_node':        return handleRestoreNode(payload, email, session);
      case 'UPLOAD_FILE':         return handleUploadFile(payload, email, session); 
      
      default:             return buildResponse(400, { error: 'Unknown action: ' + action });
    }

  } catch (err) {
    return buildResponse(500, { error: err.toString() });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

function handleRegister(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const um = ss.getSheetByName('User_Map');
  if (!um) return buildResponse(500, { error: 'User_Map tab missing. Run Initialize Hub first.' });

  // Check if already registered
  const existing = getUserSession(email);
  if (existing) {
    const nodes = getNodesForSession(existing);
    return buildResponse(200, { status: 'existing', role: existing.role, allowedNodes: existing.allowedNodes, nodes, shopName: getCfgValue('SHOP_NAME') || 'Biz IMS' });
  }

  // First-in-becomes-Head: check for any existing HEAD
  const data    = um.getLastRow() > 1 ? um.getRange(2, 1, um.getLastRow() - 1, 4).getValues() : [];
  const hasHead = data.some(row => row[1] === ROLES.HEAD);
  const role    = hasHead ? ROLES.PENDING : ROLES.HEAD;
  const allowed = role === ROLES.HEAD ? 'ALL' : '[]';

  um.appendRow([email, role, allowed, new Date().toISOString()]);

  const nodes = role === ROLES.HEAD ? getNodesForSession({ role, allowedNodes: 'ALL' }) : [];
  return buildResponse(200, {
    status:       role === ROLES.HEAD ? 'registered_as_head' : 'pending',
    role,
    allowedNodes: allowed,
    nodes,
    shopName: getCfgValue('SHOP_NAME') || 'Biz IMS',
    message: role === ROLES.HEAD
      ? 'You are now the HEAD of this business hub.'
      : 'Your account is pending approval by the business Head.'
  });

}


function handleRead(payload, session) {
  const { node } = payload;
  if (!node) return buildResponse(400, { error: 'Missing node name.' });
  if (!hasNodeAccess(session, node, false)) return buildResponse(403, { error: 'Access denied for node: ' + node });

  const cache = CacheService.getScriptCache();
  let data, timestamp;
  const cachedData = cache.get(cacheKey(node));
  const cachedStamp = cache.get(cacheStampKey(node));

  if (cachedData && cachedStamp) {
    data      = JSON.parse(cachedData);
    timestamp = cachedStamp;
  } else {
    const sheet = getInventorySheet(node);
    if (!sheet) return buildResponse(404, { error: 'Node "' + node + '" not found.' });
    
    // BLOB ARCHITECTURE: Read single cell A1
    const blobString = sheet.getRange("A1").getValue();
    data = blobString ? JSON.parse(blobString) : { items: [] };
    
    timestamp = Date.now().toString();
    cache.put(cacheKey(node), JSON.stringify(data), CACHE_TTL);
    cache.put(cacheStampKey(node), timestamp, CACHE_TTL);
  }

  return buildResponse(200, { data: data.items || [], cache_timestamp: timestamp });
}

function handleWrite(payload, email, session) {
  const { node, Action_ID, Client_Timestamp, stateBlob } = payload;
  if (!node || !Action_ID || !Client_Timestamp || !stateBlob) {
    return buildResponse(400, { error: 'Missing required fields: node, Action_ID, Client_Timestamp, stateBlob' });
  }
  if (!hasNodeAccess(session, node, true)) return buildResponse(403, { error: 'Access denied. Read-only.' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return buildResponse(409, { error: 'Server busy. Retry.' });

  try {
    const auditSheet = getAuditSheet(node);

    // Idempotency check
    if (auditSheet && isDuplicate(auditSheet, Action_ID)) {
      return buildResponse(200, { status: 'Duplicate Action_ID ignored.', cache_timestamp: CacheService.getScriptCache().get(cacheStampKey(node)) });
    }

    const serverStamp = CacheService.getScriptCache().get(cacheStampKey(node));
    if (serverStamp && Client_Timestamp < serverStamp) {
      return buildResponse(409, { error: 'Stale data. Re-fetch before writing.' });
    }

    const invSheet = getInventorySheet(node);
    if (!invSheet) return buildResponse(404, { error: 'Node not found: ' + node });

    // BLOB ARCHITECTURE: Overwrite cell A1
    invSheet.getRange("A1").setValue(JSON.stringify(stateBlob));

    if (auditSheet) {
      auditSheet.appendRow([Action_ID, new Date(), email, 'WRITE_BLOB', 'Blob updated']);
    }

    const newStamp = Date.now().toString();
    const cache    = CacheService.getScriptCache();
    cache.put(cacheKey(node), JSON.stringify(stateBlob), CACHE_TTL);
    cache.put(cacheStampKey(node), newStamp, CACHE_TTL);

    return buildResponse(200, { status: 'Success', cache_timestamp: newStamp });

  } finally {
    lock.releaseLock();
  }
}

function handleDeleteRow(payload, email, session) {
  if (!roleAtLeast(session.role, ROLES.SUB_HEAD)) return buildResponse(403, { error: 'Insufficient role.' });
  const { node, Action_ID, Client_Timestamp, rowIndex } = payload;
  if (!node || !Action_ID || !Client_Timestamp || !rowIndex) return buildResponse(400, { error: 'Missing fields.' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return buildResponse(409, { error: 'Server busy. Retry.' });

  try {
    const auditSheet = getAuditSheet(node);
    if (isDuplicate(auditSheet, Action_ID)) return buildResponse(200, { status: 'Duplicate ignored.' });

    const serverStamp = CacheService.getScriptCache().get(cacheStampKey(node));
    if (serverStamp && Client_Timestamp !== serverStamp) return buildResponse(409, { error: 'Stale data.' });

    const invSheet = getInventorySheet(node);
    if (!invSheet) return buildResponse(404, { error: 'Node not found.' });
    invSheet.deleteRow(rowIndex);

    if (auditSheet) auditSheet.appendRow([Action_ID, new Date(), email, 'DELETE', 'rowIndex:' + rowIndex]);

    const newStamp = Date.now().toString();
    const cache    = CacheService.getScriptCache();
    cache.put(cacheKey(node), JSON.stringify(invSheet.getDataRange().getValues()), CACHE_TTL);
    cache.put(cacheStampKey(node), newStamp, CACHE_TTL);

    return buildResponse(200, { status: 'Deleted', cache_timestamp: newStamp });

  } finally {
    lock.releaseLock();
  }
}

function handleUpdateRow(payload, email, session) {
  if (!roleAtLeast(session.role, ROLES.USER)) return buildResponse(403, { error: 'Insufficient role.' });
  const { node, Action_ID, Client_Timestamp, rowIndex, updateData } = payload;
  if (!node || !Action_ID || !rowIndex || !updateData) return buildResponse(400, { error: 'Missing fields.' });
  if (!hasNodeAccess(session, node, true)) return buildResponse(403, { error: 'Access denied.' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return buildResponse(409, { error: 'Server busy. Retry.' });

  try {
    const auditSheet = getAuditSheet(node);
    if (auditSheet && isDuplicate(auditSheet, Action_ID)) return buildResponse(200, { status: 'Duplicate ignored.' });

    const serverStamp = CacheService.getScriptCache().get(cacheStampKey(node));
    if (serverStamp && Client_Timestamp !== serverStamp) return buildResponse(409, { error: 'Stale data. Refresh before editing.' });

    const invSheet = getInventorySheet(node);
    if (!invSheet) return buildResponse(404, { error: 'Node not found.' });

    const schema = getNodeSchema(node);
    const currentValues = invSheet.getRange(rowIndex, 1, 1, schema.length).getValues()[0];
    
    schema.forEach((col, idx) => {
      // Allow updates to normal columns, skip generated/system ones
      if (updateData[col.name] !== undefined && col.type !== 'formula' && col.type !== 'id' && col.type !== 'timestamp') {
        currentValues[idx] = updateData[col.name];
      }
    });

    invSheet.getRange(rowIndex, 1, 1, schema.length).setValues([currentValues]);

    if (auditSheet) auditSheet.appendRow([Action_ID, new Date(), email, 'UPDATE', JSON.stringify(updateData)]);

    const newStamp = Date.now().toString();
    const cache    = CacheService.getScriptCache();
    cache.put(cacheKey(node), JSON.stringify(invSheet.getDataRange().getValues()), CACHE_TTL);
    cache.put(cacheStampKey(node), newStamp, CACHE_TTL);

    return buildResponse(200, { status: 'Updated', cache_timestamp: newStamp });

  } finally {
    lock.releaseLock();
  }
}

function handleBatchSync(payload, email, session) {
  if (!roleAtLeast(session.role, ROLES.USER)) return buildResponse(403, { error: 'Insufficient role.' });
  const { node, operations } = payload;
  if (!node || !operations || !Array.isArray(operations)) return buildResponse(400, { error: 'Invalid batch payload.' });
  if (!hasNodeAccess(session, node, true)) return buildResponse(403, { error: 'Access denied.' });

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return buildResponse(409, { error: 'Server busy. Retry.' });

  try {
    const invSheet = getInventorySheet(node);
    const auditSheet = getAuditSheet(node);
    if (!invSheet) return buildResponse(404, { error: 'Node not found.' });

    const schema = getNodeSchema(node);
    let changed = false;

    operations.forEach(op => {
      const { type, Action_ID, rowData, rowIndex, updateData } = op;
      if (auditSheet && isDuplicate(auditSheet, Action_ID)) return;

      if (type === 'write') {
         const row = buildRowFromSchema(schema, rowData, node, invSheet.getLastRow());
         invSheet.appendRow(row);
         if (auditSheet) auditSheet.appendRow([Action_ID, new Date(), email, 'WRITE', JSON.stringify(rowData)]);
         changed = true;
      } else if (type === 'update' && rowIndex) {
         const currentValues = invSheet.getRange(rowIndex, 1, 1, schema.length).getValues()[0];
         schema.forEach((col, idx) => {
            if (updateData[col.name] !== undefined && col.type !== 'formula' && col.type !== 'id' && col.type !== 'timestamp') {
              currentValues[idx] = updateData[col.name];
            }
         });
         invSheet.getRange(rowIndex, 1, 1, schema.length).setValues([currentValues]);
         if (auditSheet) auditSheet.appendRow([Action_ID, new Date(), email, 'UPDATE', JSON.stringify(updateData)]);
         changed = true;
      }
    });

    if (changed) {
       const newStamp = Date.now().toString();
       const cache = CacheService.getScriptCache();
       cache.put(cacheKey(node), JSON.stringify(invSheet.getDataRange().getValues()), CACHE_TTL);
       cache.put(cacheStampKey(node), newStamp, CACHE_TTL);
       return buildResponse(200, { status: 'Batched', cache_timestamp: newStamp });
    }
    return buildResponse(200, { status: 'No changes', cache_timestamp: CacheService.getScriptCache().get(cacheStampKey(node)) });
  } finally {
    lock.releaseLock();
  }
}

function handleGenerateSandbox(payload, email, session) {
  if (!roleAtLeast(session.role, ROLES.TECH)) return buildResponse(403, { error: 'TECH, SUB-HEAD, or HEAD required to generate Sandbox.' });
  const { nodeName } = payload;
  if (!nodeName) return buildResponse(400, { error: 'Missing nodeName.' });

  const cleanName = nodeName.replace(/[^a-zA-Z0-9_]/g, '_');
  
  const templateId = getCfgValue('SANDBOX_TEMPLATE_ID');
  if (!templateId || templateId === 'PASTE_SANDBOX_TEMPLATE_ID_HERE') {
    return buildResponse(400, { error: 'SANDBOX_TEMPLATE_ID is not configured in Global_Config.' });
  }

  // Create the sheet by copying template
  let sandboxFile;
  try {
    sandboxFile = DriveApp.getFileById(templateId).makeCopy('BizIMS Sandbox: ' + cleanName);
  } catch(e) {
    return buildResponse(500, { error: 'Failed to access Sandbox Template. Ensure the Hub Service Account has read access to the Template ID. ' + e.message });
  }

  const sandboxId = sandboxFile.getId();
  const sandbox = SpreadsheetApp.openById(sandboxId);
  sandbox.addEditor(email);
  const sandboxUrl = sandbox.getUrl();

  // If editing an existing node, copy over existing headers/data
  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');
  const isEditing = registry.some(n => n.toLowerCase() === cleanName.toLowerCase());

  if (isEditing) {
    const invSheet = getInventorySheet(cleanName);
    if (invSheet && invSheet.getLastRow() > 0) {
      let targetSheet = sandbox.getSheets()[0];
      if (targetSheet.getName() === '__CONFIG__') targetSheet = sandbox.getSheets()[1];
      if (targetSheet) {
        targetSheet.clear();
        const data = invSheet.getDataRange().getValues();
        const writeData = data.slice(0, 50); // limit to 50 rows for context
        targetSheet.getRange(1, 1, writeData.length, writeData[0].length).setValues(writeData);
      }
    }
  }

  const sandboxToken = Utilities.getUuid();
  setCfgValue('SANDBOX_TOKEN_' + cleanName, sandboxToken);
  setCfgValue('SANDBOX_OWNER_' + cleanName, email);

  let cfgSheet = sandbox.getSheetByName('__CONFIG__');
  if (!cfgSheet) cfgSheet = sandbox.insertSheet('__CONFIG__');
  
  cfgSheet.getRange('A1:B3').setValues([
    ['TIER_2_URL', getCfgValue('SELF_URL')],
    ['NODE_NAME', cleanName],
    ['SANDBOX_TOKEN', sandboxToken]
  ]);
  cfgSheet.hideSheet();
  
  return buildResponse(200, { status: 'Sandbox provisioned.', sandboxUrl: sandboxUrl, sandboxId: sandboxId });
}

function handleSyncSandbox(payload, email, session) {
  const { nodeName, schema, sandboxId } = payload;
  if (!nodeName || !schema) return buildResponse(400, { error: 'Missing nodeName or schema.' });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cleanName = nodeName.replace(/[^a-zA-Z0-9_]/g, '_');
  const invName   = cleanName + '_Inventory';
  const audName   = cleanName + '_Audits';

  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');
  const isEditing = registry.some(n => n.toLowerCase() === cleanName.toLowerCase());

  if (isEditing) {
    if (!roleAtLeast(session.role, ROLES.HEAD)) return buildResponse(403, { error: 'HEAD required to update existing schema.' });
    const invSheet = getInventorySheet(cleanName);
    if (!invSheet) return buildResponse(404, { error: 'Node not found.' });
    applySchemaHeaders(invSheet, schema);
    setCfgValue('SCHEMA_' + cleanName, JSON.stringify(schema));
    const ver = parseInt(getCfgValue('SCHEMA_VERSION') || '1', 10) + 1;
    setCfgValue('SCHEMA_VERSION', ver.toString());
  } else {
    if (!roleAtLeast(session.role, ROLES.TECH)) return buildResponse(403, { error: 'TECH, SUB-HEAD, or HEAD required to create Node.' });
    if (ss.getSheetByName(invName)) return buildResponse(409, { error: 'Node "' + cleanName + '" already exists.' });
    
    const invSheet = ss.insertSheet(invName);
    applySchemaHeaders(invSheet, schema);

    const audSheet = ss.insertSheet(audName);
    audSheet.getRange('A1:E1').setValues([['Action_ID', 'Timestamp', 'User_Email', 'Operation', 'Payload']]).setFontWeight('bold');

    registry.push(cleanName);
    setCfgValue('NODE_REGISTRY', JSON.stringify(registry));
    setCfgValue('SCHEMA_' + cleanName, JSON.stringify(schema));
    
    // Auto-assign to creator
    if (session.role !== ROLES.HEAD) {
      const um = ss.getSheetByName('User_Map');
      if (um) {
        const data = um.getDataRange().getValues();
        for (let i = 1; i < data.length; i++) {
          if (data[i][0] === email) {
            let allowed = [];
            try { allowed = JSON.parse(data[i][2]); } catch(e) {}
            if (!allowed.includes(cleanName)) {
              allowed.push(cleanName);
              um.getRange(i + 1, 3).setValue(JSON.stringify(allowed));
            }
            break;
          }
        }
      }
    }
  }

  if (sandboxId) {
    try { DriveApp.getFileById(sandboxId).setTrashed(true); } catch(e) {}
  }

  // Clear single-use sandbox token
  setCfgValue('SANDBOX_TOKEN_' + cleanName, 'USED');
  
  const cache = CacheService.getScriptCache();
  cache.remove(cacheKey(cleanName));
  cache.remove(cacheStampKey(cleanName));

  return buildResponse(200, { status: 'Schema Synced successfully.', nodeName: cleanName });
}

function handleGetUsers(session) {
  if (!roleAtLeast(session.role, ROLES.SUB_HEAD)) return buildResponse(403, { error: 'Insufficient role.' });
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const um   = ss.getSheetByName('User_Map');
  if (!um) return buildResponse(200, { users: [], allNodes: [] });
  const data = um.getLastRow() > 1 ? um.getRange(2, 1, um.getLastRow() - 1, 4).getValues() : [];
  const users = data.map(row => ({
    email:        row[0],
    role:         row[1],
    allowedNodes: row[2],
    joinedDate:   row[3]
  }));
  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');
  return buildResponse(200, { users, allNodes: registry });
}

function handleGetPendingNodeDeletions(session) {
  if (!roleAtLeast(session.role, ROLES.SUB_HEAD)) return buildResponse(403, { error: 'Insufficient role.' });
  const pending = JSON.parse(getCfgValue('PENDING_NODE_DELETIONS') || '[]');
  return buildResponse(200, { pending });
}

function handleRequestDeleteNode(payload, email, session) {
  if (!roleAtLeast(session.role, ROLES.TECH)) return buildResponse(403, { error: 'Permission denied.' });
  const { nodeName } = payload;
  if (!nodeName) return buildResponse(400, { error: 'Missing nodeName.' });

  const pending = JSON.parse(getCfgValue('PENDING_NODE_DELETIONS') || '[]');
  if (pending.some(p => p.nodeName === nodeName)) return buildResponse(409, { error: 'Deletion already pending for this node.' });

  pending.push({
    nodeName,
    requester: email,
    timestamp: new Date().toISOString()
  });

  setCfgValue('PENDING_NODE_DELETIONS', JSON.stringify(pending));
  return buildResponse(200, { status: 'Deletion requested. Requires approval from a separate SUB-HEAD or HEAD.' });
}

function handleApproveDeleteNode(payload, email, session) {
  if (!roleAtLeast(session.role, ROLES.SUB_HEAD)) return buildResponse(403, { error: 'Only SUB-HEAD or HEAD can approve node deletion.' });
  const { nodeName } = payload;
  if (!nodeName) return buildResponse(400, { error: 'Missing nodeName.' });

  const pending = JSON.parse(getCfgValue('PENDING_NODE_DELETIONS') || '[]');
  const idx = pending.findIndex(p => p.nodeName === nodeName);
  if (idx === -1) return buildResponse(404, { error: 'Request not found.' });

  const request = pending[idx];
  // Multi-sig: approver must be different from requester
  if (request.requester === email && session.role !== ROLES.HEAD) {
    return buildResponse(403, { error: 'Multi-sig violation: You cannot approve your own deletion request unless you are HEAD.' });
  }

  // Perform permanent deletion
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const invSheet = ss.getSheetByName(nodeName + '_Inventory');
  const audSheet = ss.getSheetByName(nodeName + '_Audits');
  
  const timestamp = Date.now();
  if (invSheet) invSheet.setName('TRASH_' + timestamp + '_' + nodeName + '_Inventory');
  if (audSheet) audSheet.setName('TRASH_' + timestamp + '_' + nodeName + '_Audits');

  const trash = JSON.parse(getCfgValue('TRASH_REGISTRY') || '[]');
  trash.push({ nodeName, deletedAt: timestamp, prefix: 'TRASH_' + timestamp + '_' + nodeName });
  setCfgValue('TRASH_REGISTRY', JSON.stringify(trash));

  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');
  const updatedRegistry = registry.filter(n => n !== nodeName);
  setCfgValue('NODE_REGISTRY', JSON.stringify(updatedRegistry));

  
  // Clean up pending list
  pending.splice(idx, 1);
  setCfgValue('PENDING_NODE_DELETIONS', JSON.stringify(pending));

  // Invalidate cache
  const cache = CacheService.getScriptCache();
  cache.remove(cacheKey(nodeName));
  cache.remove(cacheStampKey(nodeName));

  return buildResponse(200, { status: 'Node "' + nodeName + '" permanently deleted.' });
}

function handleSetConfig(payload, session) {
  if (!roleAtLeast(session.role, ROLES.HEAD)) return buildResponse(403, { error: 'HEAD role required.' });
  const { CONFIG_KEY, CONFIG_VALUE } = payload;
  if (!CONFIG_KEY) return buildResponse(400, { error: 'Missing CONFIG_KEY.' });
  setCfgValue(CONFIG_KEY, CONFIG_VALUE);
  return buildResponse(200, { status: 'Config updated.' });
}

function handleApproveUser(payload, session) {
  if (!roleAtLeast(session.role, ROLES.SUB_HEAD)) return buildResponse(403, { error: 'Insufficient role.' });
  const { targetEmail, role: newRole, allowedNodes } = payload;
  if (!targetEmail || !newRole) return buildResponse(400, { error: 'Missing targetEmail or role.' });

  const targetSession = getUserSession(targetEmail);

  // Chain of Command check: You can't assign/modify roles >= your own rank
  // Only HEAD (rank 4) can manage SUB-HEADs (3) and below.
  // Exception: HEAD rank is unique and shouldn't be assigned via this endpoint easily.
  const myWeight = ROLE_WEIGHT[session.role] || 0;
  const targetWeight = targetSession ? (ROLE_WEIGHT[targetSession.role] || 0) : 0;
  const newRoleWeight = ROLE_WEIGHT[newRole] || 0;

  if (myWeight <= targetWeight && session.role !== ROLES.HEAD) {
    return buildResponse(403, { error: 'Chain of Command: You cannot modify a peer or superior.' });
  }
  if (myWeight <= newRoleWeight && session.role !== ROLES.HEAD) {
    return buildResponse(403, { error: 'Chain of Command: You cannot assign a role equal to or higher than your own.' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const um = ss.getSheetByName('User_Map');
  if (!um) return buildResponse(500, { error: 'User_Map not found.' });

  const data = um.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === targetEmail) {
      um.getRange(i + 1, 2).setValue(newRole);
      um.getRange(i + 1, 3).setValue(allowedNodes || '[]');
      return buildResponse(200, { status: targetEmail + ' updated to ' + newRole });
    }
  }
  return buildResponse(404, { error: 'User not found in User_Map.' });
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function applySchemaHeaders(sheet, schema) {
  // Clear row 1 first
  if (sheet.getLastColumn() > 0) {
    sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), schema.length)).clearContent();
  }
  schema.forEach((col, i) => {
    const colNum = i + 1;
    if (col.type === 'formula' && col.calc) {
      const colLtr = columnToLetter(colNum);
      // ARRAYFORMULA: row 1 shows header name, subsequent rows calculate
      sheet.getRange(1, colNum).setFormula(
        '=ARRAYFORMULA(IF(ROW(' + colLtr + ':' + colLtr + ')=1,"' + col.name + '",IF(A:A="","",' + col.calc + ')))'
      );
    } else {
      sheet.getRange(1, colNum).setValue(col.name).setFontWeight('bold');
    }
  });

}


function buildRowFromSchema(schema, rowData, nodeName, lastRow) {
  return schema.map(col => {
    if (col.type === 'formula') return ''; // formula columns are sheet-computed
    if (col.type === 'id' && col.auto) return (nodeName + '-' + lastRow).toUpperCase();
    if (col.type === 'timestamp' && col.auto) return new Date().toISOString();
    return rowData[col.name] !== undefined ? rowData[col.name] : '';
  });
}


function filterSchemaByRole(schema, role) {
  return schema.filter(col => isColVisible(col, role));
}

function isColVisible(col, role) {
  if (!col.visibleTo || col.visibleTo.length === 0) return true;
  return col.visibleTo.includes(role);
}

function columnToLetter(n) {
  let s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Delegates JWT validation to Tier 1, which holds the Firebase API key.
 * Tier 2 never needs its own copy of the Firebase API key.
 */
function verifyJWT(token) {
  const tier1Url = getCfgValue('TIER_1_URL');
  if (!tier1Url || tier1Url === 'PASTE_TIER1_DIRECTORY_URL_HERE') {
    throw new Error('TIER_1_URL is not configured in Global_Config.');
  }
  try {
    const res  = UrlFetchApp.fetch(tier1Url, {
      method:             'post',
      contentType:        'text/plain',
      payload:            JSON.stringify({ action: 'validate_jwt', jwt: token }),
      muteHttpExceptions: true
    });
    const data = JSON.parse(res.getContentText());
    if (data.valid) return { valid: true, email: data.email };
  } catch (e) { throw new Error('JWT delegation to Tier 1 failed: ' + e.toString()); }
  return { valid: false };
}

function getUserSession(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const um = ss.getSheetByName('User_Map');
  if (!um || um.getLastRow() < 2) return null;
  const data = um.getRange(2, 1, um.getLastRow() - 1, 4).getValues();
  for (const row of data) {
    if (row[0] === email) return { email, role: row[1], allowedNodes: row[2] };
  }
  return null;
}

function getNodesForSession(session) {
  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');
  const allowed  = session.allowedNodes;
  let nodeList = [];
  if (allowed === 'ALL') {
    nodeList = registry.map(name => ({ name, ro: false }));
  } else {
    try {
      const list = JSON.parse(allowed || '[]');
      const justNodeNames = list.map(x => x.replace(':ro', ''));
      nodeList = justNodeNames.filter(n => registry.includes(n)).map(n => ({
        name: n,
        ro: list.includes(n + ':ro') && !list.includes(n)
      }));
    } catch (e) {}
  }
  const unique = [];
  nodeList.forEach(n => { if(!unique.some(u => u.name === n.name)) unique.push(n); });
  return unique.map(info => ({ name: info.name, readOnly: info.ro, schema: filterSchemaByRole(getNodeSchema(info.name), session.role) }));
}

function hasNodeAccess(session, node, requiresWrite) {
  const allowed = session.allowedNodes;
  if (allowed === 'ALL') return true;
  try {
    const list = JSON.parse(allowed);
    if (list.includes(node)) return true;
    if (!requiresWrite && list.includes(node + ':ro')) return true;
    return false;
  } catch (e) { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getInventorySheet(node) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(node + '_Inventory'); }
function getAuditSheet(node)     { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(node + '_Audits'); }

function isDuplicate(auditSheet, actionId) {
  if (!auditSheet || auditSheet.getLastRow() < 2) return false;
  const data = auditSheet.getRange(2, 1, auditSheet.getLastRow() - 1, 1).getValues();
  return data.some(row => row[0] === actionId);
}

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL_CONFIG HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getCfgValue(key) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const cfg  = ss.getSheetByName('Global_Config');
  if (!cfg || cfg.getLastRow() < 2) return null;
  const data = cfg.getRange(2, 1, cfg.getLastRow() - 1, 2).getValues();
  for (const row of data) { if (row[0] === key) return String(row[1]); }
  return null;
}

function setCfgValue(key, value) {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const cfg  = ss.getSheetByName('Global_Config') || ss.insertSheet('Global_Config');
  const data = cfg.getDataRange().getValues();
  for (let i = 0; i < data.length; i++) {
    if (data[i][0] === key) { cfg.getRange(i + 1, 2).setValue(value); return; }
  }
  cfg.appendRow([key, value]);
}

function getNodeSchema(node) {
  try { return JSON.parse(getCfgValue('SCHEMA_' + node) || '[]'); } catch (e) { return []; }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT FIFO ARCHIVING (Daily Trigger)
// ─────────────────────────────────────────────────────────────────────────────

function setupCullTrigger() {
  // Remove old triggers first to avoid duplicates
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'cullAuditLogs')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('cullAuditLogs').timeBased().everyDays(1).atHour(0).create();
  SpreadsheetApp.getUi().alert('✅ Daily audit cull trigger set for midnight.');
}

function cullAuditLogs() {
  const limit   = parseInt(getCfgValue('AUDIT_FIFO_LIMIT')   || '10000', 10);
  const archive = parseInt(getCfgValue('AUDIT_ARCHIVE_SIZE') || '5000',  10);
  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');

  registry.forEach(node => {
    const sheet = getAuditSheet(node);
    if (!sheet || sheet.getLastRow() - 1 <= limit) return;

    // Export oldest rows to Drive CSV
    const oldRows = sheet.getRange(2, 1, archive, sheet.getLastColumn()).getValues();
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const csv     = [headers, ...oldRows].map(r => r.join(',')).join('\n');
    const fname   = node + '_Audit_Archive_' + new Date().toISOString().slice(0, 10) + '.csv';
    DriveApp.createFile(fname, csv, MimeType.CSV);

    // Delete the archived rows from the sheet (oldest = row 2 to row archive+1)
    sheet.deleteRows(2, archive);
  });

}


// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR SERVER FUNCTIONS (called from Sidebar.html)
// ─────────────────────────────────────────────────────────────────────────────

function getAdminData() {
  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');
  const ss       = SpreadsheetApp.getActiveSpreadsheet();
  const um       = ss.getSheetByName('User_Map');
  const users    = um && um.getLastRow() > 1
    ? um.getRange(2, 1, um.getLastRow() - 1, 4).getValues().map(r => ({ email: r[0], role: r[1], allowedNodes: r[2], joinedDate: r[3] }))
    : [];

  const nodes = registry.map(name => ({ name, schema: getNodeSchema(name) }));
  return {
    selfUrl:  getCfgValue('SELF_URL'),
    version:  getCfgValue('SCHEMA_VERSION'),
    fifoLimit:getCfgValue('AUDIT_FIFO_LIMIT'),
    users,
    nodes
  };
}

function sidebarCreateNode(nodeName, schemaJson) {
  try {
    const schema = JSON.parse(schemaJson);
    const result = handleCreateNode({ nodeName, schema }, 'sidebar', { role: ROLES.HEAD, allowedNodes: 'ALL' });
    return JSON.parse(result.getContent());
  } catch (e) {
    return { error: e.toString() };
  }
}

function sidebarUpdateSchema(node, schemaJson) {
  try {
    const schema = JSON.parse(schemaJson);
    const result = handleUpdateSchema({ node, schema }, 'sidebar', { role: ROLES.HEAD, allowedNodes: 'ALL' });
    return JSON.parse(result.getContent());
  } catch (e) {
    return { error: e.toString() };
  }
}

function sidebarApproveUser(targetEmail, role, allowedNodes) {
  try {
    const result = handleApproveUser({ targetEmail, role, allowedNodes }, { role: ROLES.HEAD, allowedNodes: 'ALL' });
    return JSON.parse(result.getContent());
  } catch (e) {
    return { error: e.toString() };
  }
}

function sidebarSetConfig(key, value) {
  try { setCfgValue(key, value); return { status: 'ok' }; }
  catch (e) { return { error: e.toString() }; }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function buildResponse(code, payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function handleRestoreNode(payload, email, session) {
  if (!roleAtLeast(session.role, ROLES.SUB_HEAD)) return buildResponse(403, { error: 'Insufficient role.' });
  const { nodeName } = payload;
  if (!nodeName) return buildResponse(400, { error: 'nodeName required.' });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trash = JSON.parse(getCfgValue('TRASH_REGISTRY') || '[]');
  const entryIdx = trash.findIndex(t => t.nodeName === nodeName);
  if (entryIdx === -1) return buildResponse(404, { error: 'Database not found in trash.' });
  
  const entry = trash[entryIdx];
  const invSheet = ss.getSheetByName(entry.prefix + '_Inventory');
  const audSheet = ss.getSheetByName(entry.prefix + '_Audits');
  
  const newInvName = nodeName + '_Inventory';
  const newAudName = nodeName + '_Audits';
  if (ss.getSheetByName(newInvName) || ss.getSheetByName(newAudName)) {
     return buildResponse(400, { error: 'A live database with this name already exists. Delete it before restoring.' });
  }

  if (invSheet) invSheet.setName(newInvName);
  if (audSheet) audSheet.setName(newAudName);

  const registry = JSON.parse(getCfgValue('NODE_REGISTRY') || '[]');
  if (!registry.includes(nodeName)) {
    registry.push(nodeName);
    setCfgValue('NODE_REGISTRY', JSON.stringify(registry));
  }
  
  trash.splice(entryIdx, 1);
  setCfgValue('TRASH_REGISTRY', JSON.stringify(trash));
  
  return buildResponse(200, { status: "Database " + nodeName + " restored successfully." });
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE STORAGE ENGINE (Self-Hosted Drive Uploads)
// ─────────────────────────────────────────────────────────────────────────────

function handleUploadFile(payload, email, session) {
  // 1. Verify user has permission (USER rank or higher)
  if (!roleAtLeast(session.role, ROLES.USER)) {
    return buildResponse(403, { error: 'Insufficient role to upload files.' });
  }

  const { filename, mimeType, base64Data, nodeName } = payload;
  
  if (!filename || !base64Data) {
    return buildResponse(400, { error: 'Missing filename or base64Data.' });
  }
  
  // 2. Ensure they have access to the specific database node
  if (nodeName && !hasNodeAccess(session, nodeName, true)) {
    return buildResponse(403, { error: 'Access denied to this node.' });
  }

  try {
    // 3. Find or create the Master "BizIMS_Uploads" Folder
    let folderId = getCfgValue('UPLOADS_FOLDER_ID');
    let folder;
    
    if (folderId) {
      try { folder = DriveApp.getFolderById(folderId); } 
      catch (e) { folderId = null; } // Failsafe if user accidentally deleted the folder
    }

    if (!folderId) {
      folder = DriveApp.createFolder('BizIMS_Uploads');
      setCfgValue('UPLOADS_FOLDER_ID', folder.getId());
    }

    // 4. Decode the text back into a binary file
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType || 'application/octet-stream', filename);
    
    // 5. Save to Google Drive
    const newFile = folder.createFile(blob);

    // 6. Make viewable for the React PWA <img> tags
    newFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return buildResponse(200, { success: true, fileUrl: newFile.getUrl() });

  } catch (error) {
    return buildResponse(500, { error: 'Upload failed: ' + error.toString() });
  }
}
