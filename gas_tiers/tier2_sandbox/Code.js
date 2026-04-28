/**
 * BizIMS Sandbox Generator
 * Bound script to the temporary Spreadsheet.
 */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('BizIMS')
    .addItem('Build Schema', 'openSidebar')
    .addToUi();
}

function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
      .setTitle('BizIMS Schema Builder')
      .setWidth(350);
  SpreadsheetApp.getUi().showSidebar(html);
}

function getHeaders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheets()[0];
  if (sheet.getName() === '__CONFIG__') {
     return ss.getSheets()[1] ? getRowHeaders(ss.getSheets()[1]) : [];
  }
  return getRowHeaders(sheet);
}

function getRowHeaders(sheet) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return [];
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  return headers.filter(String);
}

function sanitizeAndSync(schemaObj) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheets()[0];
  if (sheet.getName() === '__CONFIG__') sheet = ss.getSheets()[1];
  
  // 1. Sanitize the Sheet directly
  sheet.clearFormats();
  const dataRange = sheet.getDataRange();
  
  // 2. Obtain Tier 2 URL and Node Name
  const cfg = ss.getSheetByName('__CONFIG__');
  if (!cfg) throw new Error("Missing __CONFIG__ sheet. Cannot communicate with Tier 2 Parent.");
  const map = {};
  cfg.getRange(1, 1, 3, 2).getValues().forEach(r => map[r[0]] = r[1]);
  
  const TIER_2_URL = map['TIER_2_URL'];
  const NODE_NAME = map['NODE_NAME'];
  const SANDBOX_TOKEN = map['SANDBOX_TOKEN'];

  if (!TIER_2_URL) throw new Error("TIER_2_URL not found in config.");

  // Prepend mandatory system columns
  const finalSchema = [
    { name: "ID", type: "id", auto: true, readonly: true },
    ...schemaObj,
    { name: "Timestamp", type: "timestamp", auto: true, readonly: true }
  ];

  // 3. Send payload to Tier 2
  const payload = {
    action: 'SYNC_SANDBOX',
    sandboxToken: SANDBOX_TOKEN,
    nodeName: NODE_NAME,
    schema: finalSchema,
    sandboxId: ss.getId()
  };

  const res = UrlFetchApp.fetch(TIER_2_URL, {
    method: 'post',
    contentType: 'text/plain', // GAS requires plain text for JSON
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const responseJson = JSON.parse(res.getContentText());
  if (res.getResponseCode() === 200 && !responseJson.error) {
     return { status: "success", nodeName: NODE_NAME };
  } else {
     throw new Error(responseJson.error || res.getContentText());
  }
}
