/**
 * NLT API client (api.nlt.to)
 *
 * Converts our structured Reference objects into NLT API ref strings,
 * fetches passage HTML, parses it into typed verse objects, and caches
 * results in sessionStorage so repeated opens don't re-fetch.
 */

import type { Reference } from "../types";

// ── Book name → NLT API identifier ────────────────────────────────────────

const BOOK_MAP: Record<string, string> = {
  // Old Testament
  Genesis: "Gen",
  Exodus: "Exod",
  Leviticus: "Lev",
  Numbers: "Num",
  Deuteronomy: "Deut",
  "1 Samuel": "1Sam",
  "2 Samuel": "2Sam",
  Psalms: "Ps",
  Proverbs: "Prov",
  Isaiah: "Isa",
  Jeremiah: "Jer",
  Ezekiel: "Ezek",
  Daniel: "Dan",
  Joel: "Joel",
  Micah: "Mic",
  Zechariah: "Zech",
  Malachi: "Mal",
  // New Testament
  Matthew: "Matt",
  Mark: "Mark",
  Luke: "Luke",
  John: "John",
  Acts: "Acts",
  Romans: "Rom",
  "1 Corinthians": "1Cor",
  "2 Corinthians": "2Cor",
  Galatians: "Gal",
  Ephesians: "Eph",
  Philippians: "Phil",
  Colossians: "Col",
  "1 Thessalonians": "1Thess",
  "2 Thessalonians": "2Thess",
  "1 Timothy": "1Tim",
  "2 Timothy": "2Tim",
  Titus: "Titus",
  Hebrews: "Heb",
  James: "Jas",
  "1 Peter": "1Pet",
  "2 Peter": "2Pet",
  "1 John": "1John",
  Jude: "Jude",
  Revelation: "Rev",
};

// ── Verse range parsing ────────────────────────────────────────────────────

/** Parse a verses string like "16", "16-19", "13, 18-23", "1-11" into
 *  { start, end } integers for the first contiguous range. */
function parseVerseRange(verses: string): { start: number; end: number } {
  // Take only the first range/token (handles "13, 18-23" → use 13)
  const first = verses.split(",")[0].trim();
  const parts = first.split("-").map((s) => parseInt(s.trim(), 10));
  const start = parts[0] ?? 1;
  const end = parts[1] ?? start;
  return { start, end };
}

/** Build an NLT API ref string from a Reference, with ±context verses
 *  padded around the cited range. */
export function buildNLTRef(ref: Reference, context = 2): string {
  const apiBook = BOOK_MAP[ref.book];
  if (!apiBook) throw new Error(`Unknown book: ${ref.book}`);

  const { start, end } = parseVerseRange(ref.verses);
  const ctxStart = Math.max(1, start - context);
  const ctxEnd = end + context; // API will cap at chapter boundary

  if (ctxStart === ctxEnd) {
    return `${apiBook}.${ref.chapter}.${ctxStart}`;
  }
  return `${apiBook}.${ref.chapter}.${ctxStart}-${ctxEnd}`;
}

// ── Parsed verse ───────────────────────────────────────────────────────────

export interface ParsedVerse {
  /** Verse number within the chapter. */
  number: number;
  /** Plain text of the verse (footnote markers stripped). */
  text: string;
  /** True if this verse falls within the originally cited range. */
  cited: boolean;
}

export interface FetchedPassage {
  /** Header as returned by the API, e.g. "John 3:16-17, NLT" */
  header: string;
  verses: ParsedVerse[];
}

// ── HTML parser ────────────────────────────────────────────────────────────

function parseNLTHtml(
  html: string,
  citedStart: number,
  citedEnd: number,
): FetchedPassage {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const header =
    doc.querySelector(".bk_ch_vs_header")?.textContent?.trim() ?? "";

  const verses: ParsedVerse[] = [];
  doc.querySelectorAll("verse_export").forEach((el) => {
    const vnEl = el.querySelector(".vn");
    if (!vnEl) return;
    const number = parseInt(vnEl.textContent ?? "0", 10);

    // Remove footnote anchors and their inline spans before extracting text
    el.querySelectorAll(".a-tn, .tn").forEach((n) => n.remove());

    const text = (el.textContent ?? "")
      .replace(/^\s*\d+\s*/, "") // strip leading verse number
      .trim();

    verses.push({
      number,
      text,
      cited: number >= citedStart && number <= citedEnd,
    });
  });

  return { header, verses };
}

// ── Fetch + cache ──────────────────────────────────────────────────────────

const CACHE_PREFIX = "nlt_v1_";

/** Build an NLT API ref string for the full chapter containing a Reference. */
export function buildChapterRef(ref: Reference): string {
  const apiBook = BOOK_MAP[ref.book];
  if (!apiBook) throw new Error(`Unknown book: ${ref.book}`);
  return `${apiBook}.${ref.chapter}`;
}

export async function fetchChapter(ref: Reference): Promise<FetchedPassage> {
  const { start, end } = parseVerseRange(ref.verses);
  const apiRef = buildChapterRef(ref);
  const cacheKey = CACHE_PREFIX + apiRef;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { html } = JSON.parse(cached) as { html: string };
      return parseNLTHtml(html, start, end);
    }
  } catch {
    // ignore
  }

  const url = `https://api.nlt.to/api/passages?ref=${encodeURIComponent(apiRef)}&key=TEST`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NLT API error: ${res.status}`);
  const html = await res.text();

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ html }));
  } catch {
    // Storage full — ignore
  }

  return parseNLTHtml(html, start, end);
}

export async function fetchPassage(ref: Reference): Promise<FetchedPassage> {
  const { start, end } = parseVerseRange(ref.verses);
  const apiRef = buildNLTRef(ref);
  const cacheKey = CACHE_PREFIX + apiRef;

  // Check sessionStorage cache
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const { html } = JSON.parse(cached) as { html: string };
      return parseNLTHtml(html, start, end);
    }
  } catch {
    // sessionStorage unavailable or JSON corrupt — proceed to fetch
  }

  const url = `https://api.nlt.to/api/passages?ref=${encodeURIComponent(apiRef)}&key=TEST`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NLT API error: ${res.status}`);
  const html = await res.text();

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ html }));
  } catch {
    // Storage full — ignore
  }

  return parseNLTHtml(html, start, end);
}
