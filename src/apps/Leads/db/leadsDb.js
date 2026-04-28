// src/apps/Leads/demoDb/leadsDb.js
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Dexie.js Schema
//
// INVARIANT: This is the ONLY source of truth for scraped leads, tags, and
// user annotations. Nothing in this database is ever synced back to Firebase
// or any other cloud service.
//
// Payload schema is calibrated against the Outscraper "Master Leads" CSV
// (see src/apps/Leads/.samples/Master Leads.csv for column reference).
// ─────────────────────────────────────────────────────────────────────────────

import Dexie from "dexie";

export const leadsDb = new Dexie("BizLeadsV2");

// ─── Schema Version History ───────────────────────────────────────────────────
// v1: Initial schema — calibrated to Outscraper column names
leadsDb.version(1).stores({
  /**
   * prospects
   * Primary key: id  ←  CSV column: place_id
   *
   * Indexed fields (used by searchWorker filter cursor):
   *   batch_id        — groups results from a single scraping job
   *   category        — from CSV: main_category (lowercased)
   *   city            — from CSV: city col OR parsed from query col
   *   rating          — from CSV: rating (float 1.0–5.0)
   *   review_count    — from CSV: reviews (integer)
   *   has_website     — 0|1 — from CSV: website column
   *   has_socials     — 0|1 — from CSV: facebook|instagram|twitter|etc
   *   is_new          — 1 if added in the latest batch, else 0
   *   scraped_at      — epoch ms
   *   name            — from CSV: name
   *
   * Non-indexed stored fields:
   *   emails          — string[]  ← CSV "emails" col (comma-delimited)
   *   phones          — string[]  ← CSV "phones" col (comma-delimited)
   *   active_email    — user-selected primary email (Dexie only, never synced)
   *   active_phone    — user-selected primary phone (Dexie only, never synced)
   *   website         — string | null
   *   address         — full address string
   *   maps_url        — from CSV: link col
   *   hours           — from CSV: workday_timing col
   *   price_level     — 1–4 | null
   *   socials         — { facebook, instagram, twitter, linkedin, tiktok, youtube }
   *   description     — from CSV: description
   *   is_spending_on_ads — bool
   *   owner_name      — from CSV: owner_name
   *   featured_image  — from CSV: featured_image
   *   categories      — string[] from CSV: categories col (comma-delimited)
   *   review_keywords — string
   *   is_temporarily_closed — bool
   *   closed_on       — string | null
   */
  prospects: `
    id,
    batch_id,
    category,
    city,
    rating,
    review_count,
    has_website,
    has_socials,
    is_new,
    scraped_at,
    name
  `,

  /**
   * tags
   * Primary key: id (auto-incremented)
   * Indexed: name, created_at
   */
  tags: `
    ++id,
    name,
    created_at
  `,

  /**
   * prospect_tags  (many-to-many join table)
   * Primary key: [prospect_id+tag_id] (compound)
   * Indexed: prospect_id, tag_id, tagged_at
   *
   * Extra stored field:
   *   remarks  — user annotation for this prospect+tag pair (Dexie only)
   */
  prospect_tags: `
    [prospect_id+tag_id],
    prospect_id,
    tag_id,
    tagged_at
  `,
});

// v2: Add Biz Reach tables
leadsDb.version(2).stores({
  reach_templates: `++id, name, type`,
  reach_campaigns: `++id, name, tagId, status`,
});

// v3: Add last_contacted index to prospects
leadsDb.version(3).stores({
  prospects: `
    id,
    batch_id,
    category,
    city,
    rating,
    review_count,
    has_website,
    has_socials,
    is_new,
    scraped_at,
    name,
    last_contacted
  `,
});

// v4: Add local_state table for Workspace Refactor
leadsDb.version(4).stores({
  prospects: `
    id,
    batch_id,
    category,
    city,
    rating,
    review_count,
    has_website,
    has_socials,
    is_new,
    scraped_at,
    name,
    last_contacted
  `,
  tags: `
    ++id,
    name,
    created_at
  `,
  prospect_tags: `
    [prospect_id+tag_id],
    prospect_id,
    tag_id,
    tagged_at
  `,
  reach_templates: `++id, name, type`,
  reach_campaigns: `++id, name, tagId, status`,
  local_state: 'key, value'
});

// ─── Private Parsing Helpers ──────────────────────────────────────────────────

/**
 * Split a comma-delimited string into a trimmed, deduped, non-empty array.
 * Handles null / undefined / already-array inputs gracefully.
 *
 * CSV example:  "a@b.com, c@d.com, a@b.com"  →  ["a@b.com", "c@d.com"]
 *
 * @param {string|string[]|null|undefined} raw
 * @returns {string[]}
 */
function parseDelimitedField(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map((s) => s.trim());
  return [...new Set(
    String(raw).split(",").map((s) => s.trim()).filter(Boolean)
  )];
}

/**
 * Extract a city name from an Outscraper query string.
 * Query format: "category in city, province, country"
 *
 * e.g. "supply chain in quezon city, metro manila, philippines"
 *       → "quezon city"
 *
 * @param {string|null} query
 * @returns {string}
 */
function extractCityFromQuery(query) {
  if (!query) return "";
  const match = String(query).match(/\bin\s+([^,]+)/i);
  return match ? match[1].trim() : "";
}

/**
 * Returns true if any of the social platform columns are populated.
 *
 * @param {Object} item
 * @returns {boolean}
 */
function hasSocials(item) {
  return !!(
    item.facebook  || item.instagram || item.twitter  ||
    item.linkedin  || item.tiktok    || item.youtube
  );
}

// ─── Convenience Helpers ──────────────────────────────────────────────────────

/**
 * Hydrate a raw GAS payload array into Dexie.
 *
 * Called by LeadsContext after receiving a Firestore inbox document.
 * Each item is normalized from the Outscraper CSV column names to the
 * Dexie prospects schema before insertion.
 *
 * Key column mappings (CSV → Dexie):
 *   place_id          → id
 *   main_category     → category
 *   query             → city (via extractCityFromQuery)
 *   reviews           → review_count
 *   link              → maps_url
 *   workday_timing    → hours
 *   emails (delim.)   → emails[]
 *   phones (delim.)   → phones[]
 *   facebook/ig/etc.  → socials{}
 *
 * @param {Object[]} items   — raw payload items from GAS/Firestore
 * @param {string}   batchId — UUID for this scraping job
 * @returns {Promise<number>} number of records upserted
 */
export async function hydrateBatch(items, batchId) {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
      },

      // ── Extra enrichment (stored, not indexed) ─────────────────────────────
      description:           item.description     || null,
      is_spending_on_ads:    item.is_spending_on_ads === true || item.is_spending_on_ads === "true",
      owner_name:            item.owner_name       || null,
      featured_image:        item.featured_image   || null,
      categories:            parseDelimitedField(item.categories),
      review_keywords:       item.review_keywords  || null,
      is_temporarily_closed: item.is_temporarily_closed === true || item.is_temporarily_closed === "true",
      closed_on:             item.closed_on        || null,
    };
  });

  await leadsDb.prospects.bulkPut(normalized);
  return normalized.length;
}

/**
 * Assign a tag (by name) to an array of prospect IDs.
 * Creates the tag record if it doesn't already exist.
 *
 * @param {string}   tagName
 * @param {string[]} prospectIds
 * @param {string}   [remarks=""]
 */
export async function assignTag(tagName, prospectIds, remarks = "") {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  } else {
    tagId = await leadsDb.tags.add({ name: trimmed, created_at: Date.now() });
  }

  const now = Date.now();
  const joinRows = prospectIds.map((pid) => ({
    prospect_id: pid,
    tag_id:      tagId,
    tagged_at:   now,
    remarks,
  }));

  await leadsDb.prospect_tags.bulkPut(joinRows);
}

/**
 * Fetch all prospects associated with a given tag ID.
 *
 * @param {number} tagId
 * @returns {Promise<Object[]>}
 */
export async function getProspectsByTag(tagId) {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
}

/**
 * Remove all prospect_tags rows for a given tag, then delete the tag itself.
 *
 * @param {number} tagId
 */
export async function deleteTag(tagId) {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
}

/**
 * Remove all prospect associations for a tag without deleting the tag itself.
 *
 * @param {number} tagId
 */
export async function clearTagLeads(tagId) {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
}

/**
 * Delete specific prospects and all their tag associations.
 *
 * @param {string[]} prospectIds
 */
export async function deleteProspects(prospectIds) {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
}
