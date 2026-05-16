/**
 * Reader progress — persisted in localStorage.
 *
 * Tracks:
 *  - Last navigation selection (for auto-resume)
 *  - Set of visited point/summary keys (for sidebar markers)
 */

import type { Selection } from "../App";

const LAST_KEY    = "progress_last";
const VISITED_KEY = "progress_visited";

// ── Last selection ─────────────────────────────────────────────────────────

export function saveLastSelection(sel: Selection): void {
  if (sel.kind === "landing" || sel.kind === "empty") return;
  try { localStorage.setItem(LAST_KEY, JSON.stringify(sel)); } catch { /* quota */ }
}

export function loadLastSelection(): Selection | null {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    return raw ? (JSON.parse(raw) as Selection) : null;
  } catch { return null; }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(LAST_KEY);
    localStorage.removeItem(VISITED_KEY);
  } catch { /* ignore */ }
}

// ── Visited set ────────────────────────────────────────────────────────────

/** Stable key for a point or summary selection. */
export function selectionKey(sel: Selection): string | null {
  if (sel.kind === "point")   return `${sel.outlineIndex}:${sel.pointIndex}`;
  if (sel.kind === "summary") return `${sel.outlineIndex}:s`;
  if (sel.kind === "front")   return `f:${sel.sectionIndex}`;
  return null;
}

export function pointKey(outlineIndex: number, pointIndex: number): string {
  return `${outlineIndex}:${pointIndex}`;
}

export function summaryKey(outlineIndex: number): string {
  return `${outlineIndex}:s`;
}

export function loadVisited(): Set<string> {
  try {
    const raw = localStorage.getItem(VISITED_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch { return new Set(); }
}

export function saveVisited(visited: Set<string>): void {
  try { localStorage.setItem(VISITED_KEY, JSON.stringify([...visited])); } catch { /* quota */ }
}
