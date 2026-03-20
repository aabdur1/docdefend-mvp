// Dynamic rules loader for payer downcoding policies and CMS benchmarks
// Reads JSON data files from server/data/, caches in memory, supports reload
// JSON files are updated by n8n automation pipeline (or manually)

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');

let policies = null;
let benchmarks = null;
let dxOverrides = null;
let lastLoadTime = null;

/**
 * Load (or reload) all rule data files from disk.
 * Call on server start and after n8n pushes updates.
 * Returns true on success, false on failure (server continues with previous/fallback data).
 */
export function loadRules() {
  try {
    const policiesRaw = readFileSync(join(DATA_DIR, 'downcode-policies.json'), 'utf-8');
    const parsedPolicies = JSON.parse(policiesRaw);
    if (!parsedPolicies?.policies || typeof parsedPolicies.policies !== 'object') {
      throw new Error('Invalid policies format: missing "policies" object');
    }

    const benchmarksRaw = readFileSync(join(DATA_DIR, 'cms-peer-benchmarks.json'), 'utf-8');
    const parsedBenchmarks = JSON.parse(benchmarksRaw);
    if (!parsedBenchmarks?.benchmarks || typeof parsedBenchmarks.benchmarks !== 'object') {
      throw new Error('Invalid benchmarks format: missing "benchmarks" object');
    }

    // Only assign after both files parse and validate successfully
    policies = parsedPolicies;
    benchmarks = parsedBenchmarks;

    // Optional overrides file (may not exist yet)
    try {
      const overridesRaw = readFileSync(join(DATA_DIR, 'dx-complexity-overrides.json'), 'utf-8');
      dxOverrides = JSON.parse(overridesRaw);
    } catch {
      dxOverrides = null;
    }

    lastLoadTime = new Date().toISOString();

    // Staleness warning
    const daysSinceUpdate = policies.lastUpdated
      ? Math.floor((Date.now() - new Date(policies.lastUpdated).getTime()) / 86400000)
      : null;
    if (daysSinceUpdate !== null && daysSinceUpdate > 30) {
      console.warn(`[rulesLoader] WARNING: Rules are ${daysSinceUpdate} days old — consider running the n8n update pipeline`);
    }

    console.log(`[rulesLoader] Loaded rules: ${Object.keys(policies.policies).length} policies, ${Object.keys(benchmarks.benchmarks).length} specialties (updated: ${policies.lastUpdated})`);
    return true;
  } catch (err) {
    console.error('[rulesLoader] Failed to load rules:', err.message);
    return false;
  }
}

export function getPolicies() { return policies; }
export function getBenchmarks() { return benchmarks; }
export function getDxOverrides() { return dxOverrides; }
export function getLastLoadTime() { return lastLoadTime; }

/**
 * Get staleness info for the health check endpoint.
 */
export function getRulesStatus() {
  const dataUpdated = policies?.lastUpdated || null;
  const daysSinceUpdate = dataUpdated
    ? Math.floor((Date.now() - new Date(dataUpdated).getTime()) / 86400000)
    : null;

  return {
    loaded: policies !== null,
    lastLoadTime,
    dataUpdated,
    daysSinceUpdate,
    stale: daysSinceUpdate !== null && daysSinceUpdate > 30,
  };
}
