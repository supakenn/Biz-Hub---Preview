// src/utils/uuid.js
// ─────────────────────────────────────────────────────────────────────────────
// Tiny UUID v4 generator — avoids adding the `uuid` npm package.
// Uses the Web Crypto API (available in all modern browsers and workers).
// ─────────────────────────────────────────────────────────────────────────────

export function uuidv4() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
