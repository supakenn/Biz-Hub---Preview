// src/apps/Leads/workers/searchWorker.js
// ─────────────────────────────────────────────────────────────────────────────
// BizLeads V2 — Web Worker: Advanced Prospect Search
//
// This worker runs off the main UI thread to avoid jank during complex filter
// cursor passes over potentially thousands of Dexie records.
//
// COMMUNICATION PROTOCOL:
//   Main thread → Worker:  { type: "SEARCH", payload: SearchPayload }
//   Worker → Main thread:  { type: "RESULTS", results: Prospect[], total: number }
//                          { type: "ERROR",   message: string }
//
// SearchPayload shape:
//   {
//     query:        string,        // free-text search (name, address, category)
//     filters:      FilterShape,   // structured filter object (see below)
//     page:         number,        // 0-indexed page (for infinite scroll)
//     pageSize:     number,        // items per page (default 30)
//   }
//
// FilterShape:
//   {
//     cities:       string[],      // include only these cities (empty = all)
//     categories:   string[],      // include only these categories (empty = all)
//     excludeCities:       string[],
//     excludeCategories:   string[],
//     ratingMin:    number,        // 0–5
//     ratingMax:    number,        // 0–5
//     reviewMin:    number,
//     reviewMax:    number,
//     requireWebsite:  boolean | null,   // true=require, false=exclude, null=any
//     requireSocials:  boolean | null,
//     onlyNew:      boolean,
//     tagIds:       number[],      // return only prospects tagged with ANY of these
//     excludeTagIds: number[],     // exclude prospects tagged with ANY of these
//     matchMode:    "ANY" | "ALL", // OR vs AND for city/category filters
//   }
// ─────────────────────────────────────────────────────────────────────────────

import { leadsDb } from "../demoDb/leadsDb.js";

// ─── Message Handler ─────────────────────────────────────────────────────────
self.addEventListener("message", async (event) => {
  const { type, payload } = event.data;

  if (type !== "SEARCH") return;

  try {
    const results = await runSearch(payload);
    self.postMessage({ type: "RESULTS", ...results });
  } catch (err) {
    self.postMessage({ type: "ERROR", message: err.message });
  }
});

// ─── Core Search Logic ───────────────────────────────────────────────────────
async function runSearch({ query = "", filters = {}, page = 0, pageSize = 30 }) {
    /* Simulation Mode: Logic hidden for preview */
    console.log('Demo: Action processed');
    return;
  } = filters;

  const q = query.toLowerCase().trim();

  // ── Step 1: Resolve tag ID sets (for join filtering) ──────────────────────
  let includedProspectIds = null; // null = no restriction
  let excludedProspectIds = new Set();

  if (tagIds.length > 0) {
    const includeJoins = await leadsDb.prospect_tags
      .where("tag_id")
      .anyOf(tagIds)
      .toArray();
    includedProspectIds = new Set(includeJoins.map((j) => j.prospect_id));
  }

  if (excludeTagIds.length > 0) {
    const excludeJoins = await leadsDb.prospect_tags
      .where("tag_id")
      .anyOf(excludeTagIds)
      .toArray();
    excludeJoins.forEach((j) => excludedProspectIds.add(j.prospect_id));
  }

  // ── Step 2: Build a filtered collection via Dexie cursor ─────────────────
  // Start from the full table; use .filter() for complex multi-field predicates.
  // For a large dataset (10k+ records) this is still fast in a worker thread.
  const allMatches = await leadsDb.prospects
    .filter((p) => {
      // Tag inclusion filter
      if (includedProspectIds !== null && !includedProspectIds.has(p.id)) return false;

      // Tag exclusion filter
      if (excludedProspectIds.has(p.id)) return false;

      // "New" filter
      if (onlyNew && p.is_new !== 1) return false;

      // Rating range
      if (p.rating < ratingMin || p.rating > ratingMax) return false;

      // Review count range
      if (p.review_count < reviewMin || p.review_count > reviewMax) return false;

      // Asset filters (tri-state)
      if (requireWebsite === true  && p.has_website !== 1) return false;
      if (requireWebsite === false && p.has_website === 1) return false;
      if (requireSocials === true  && p.has_socials !== 1) return false;
      if (requireSocials === false && p.has_socials === 1) return false;

      // City filters
      const pCity = p.city || "";
      if (excludeCities.length > 0 && excludeCities.includes(pCity)) return false;
      if (cities.length > 0) {
        const cityMatch = cities.includes(pCity);
        if (matchMode === "ALL" && !cityMatch) return false;
        if (matchMode === "ANY" && !cityMatch && categories.length === 0) return false;
      }

      // Category filters
      const pCat = p.category || "";
      if (excludeCategories.length > 0 && excludeCategories.includes(pCat)) return false;
      if (categories.length > 0) {
        const catMatch = categories.includes(pCat);
        if (matchMode === "ALL" && !catMatch) return false;
        if (matchMode === "ANY" && cities.length > 0 && !catMatch && !cities.includes(pCity)) return false;
        if (matchMode === "ANY" && cities.length === 0 && !catMatch) return false;
      }

      // Free-text keyword search — matches across ALL text fields
      // (mirrors the GAS Supabase OR-filter across all columns)
      if (q) {
        const haystack = [
          p.name,
          p.address,
          p.category,
          p.description,
          p.review_keywords,
          p.owner_name,
          p.hours,
          ...(Array.isArray(p.categories) ? p.categories : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    })
    .toArray();

  // ── Step 3: Sort (newest first by scraped_at) ────────────────────────────
  allMatches.sort((a, b) => (b.scraped_at || 0) - (a.scraped_at || 0));

  // ── Step 4: Paginate ─────────────────────────────────────────────────────
  const total  = allMatches.length;
  const start  = page * pageSize;
  const paged  = allMatches.slice(start, start + pageSize);

  return { results: paged, total };
}
