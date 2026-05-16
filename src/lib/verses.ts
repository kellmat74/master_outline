/**
 * Static verse data client.
 *
 * All scripture content is pre-fetched from API.Bible and stored in
 * data/verses.json. No network calls happen at runtime.
 *
 * Public API mirrors the old nlt.ts shape so VersePopup needs minimal changes.
 */

import type { Reference } from "../types";
import versesData from "../../data/verses.json";

// ── Translation config ─────────────────────────────────────────────────────

export type TranslationId = "NLT" | "NASB" | "MSG" | "ASV";

export interface TranslationInfo {
  id: TranslationId;
  label: string;
  full: string;
}

export const TRANSLATIONS: TranslationInfo[] = [
  { id: "NLT",  label: "NLT",  full: "New Living Translation" },
  { id: "NASB", label: "NASB", full: "New American Standard Bible (1995)" },
  { id: "MSG",  label: "MSG",  full: "The Message" },
  { id: "ASV",  label: "ASV",  full: "American Standard Version" },
];

export const DEFAULT_TRANSLATION: TranslationId = "NLT";

// ── USFM book code map ─────────────────────────────────────────────────────

const USFM: Record<string, string> = {
  // Old Testament
  Genesis:         "GEN",
  Exodus:          "EXO",
  Leviticus:       "LEV",
  Numbers:         "NUM",
  Deuteronomy:     "DEU",
  "1 Samuel":      "1SA",
  "2 Samuel":      "2SA",
  Psalms:          "PSA",
  Proverbs:        "PRO",
  Isaiah:          "ISA",
  Jeremiah:        "JER",
  Ezekiel:         "EZK",
  Daniel:          "DAN",
  Joel:            "JOL",
  Micah:           "MIC",
  Zechariah:       "ZEC",
  Malachi:         "MAL",
  // New Testament
  Matthew:         "MAT",
  Mark:            "MRK",
  Luke:            "LUK",
  John:            "JHN",
  Acts:            "ACT",
  Romans:          "ROM",
  "1 Corinthians": "1CO",
  "2 Corinthians": "2CO",
  Galatians:       "GAL",
  Ephesians:       "EPH",
  Philippians:     "PHP",
  Colossians:      "COL",
  "1 Thessalonians": "1TH",
  "2 Thessalonians": "2TH",
  "1 Timothy":     "1TI",
  "2 Timothy":     "2TI",
  Titus:           "TIT",
  Hebrews:         "HEB",
  James:           "JAS",
  "1 Peter":       "1PE",
  "2 Peter":       "2PE",
  "1 John":        "1JN",
  Jude:            "JUD",
  Revelation:      "REV",
};

// ── Verse range parsing ────────────────────────────────────────────────────

function parseVerseRange(verses: string): { start: number; end: number } {
  const nums: number[] = [];
  for (const token of verses.split(",")) {
    for (const part of token.trim().split("-")) {
      const n = parseInt(part.trim(), 10);
      if (!isNaN(n)) nums.push(n);
    }
  }
  if (nums.length === 0) return { start: 1, end: 1 };
  return { start: Math.min(...nums), end: Math.max(...nums) };
}

// ── Key builders (must match scripts/fetch_verses.py) ─────────────────────

function passageKey(usfm: string, chapter: number, ctxStart: number, ctxEnd: number): string {
  return `${usfm}.${chapter}.${ctxStart}-${usfm}.${chapter}.${ctxEnd}`;
}

function chapterKey(usfm: string, chapter: number): string {
  return `${usfm}.${chapter}`;
}

// ── Public types (same shape as old nlt.ts) ────────────────────────────────

export interface ParsedVerse {
  number: number;
  text: string;
  cited: boolean;
}

export interface FetchedPassage {
  header: string;
  verses: ParsedVerse[];
}

// ── Typed data access ──────────────────────────────────────────────────────

type VersesFile = {
  passages: Record<string, Record<string, { reference: string; verses: { n: number; t: string }[] }>>;
  chapters: Record<string, Record<string, { reference: string; verses: { n: number; t: string }[] }>>;
};

const db = versesData as unknown as VersesFile;

// ── Public API ─────────────────────────────────────────────────────────────

export function fetchPassage(ref: Reference, translation: TranslationId): FetchedPassage {
  const usfm = USFM[ref.book];
  if (!usfm) throw new Error(`Unknown book: ${ref.book}`);

  const { start, end } = parseVerseRange(ref.verses);
  const ctxStart = Math.max(1, start - 2);
  const ctxEnd = end + 2;
  const key = passageKey(usfm, ref.chapter, ctxStart, ctxEnd);

  const entry = db.passages?.[translation]?.[key];
  if (!entry) {
    // Fallback: try NLT if requested translation missing
    const fallback = db.passages?.["NLT"]?.[key];
    if (fallback) {
      return buildPassage(fallback, start, end);
    }
    throw new Error(`Passage not found: ${key} (${translation})`);
  }
  return buildPassage(entry, start, end);
}

export function fetchChapter(ref: Reference, translation: TranslationId): FetchedPassage {
  const usfm = USFM[ref.book];
  if (!usfm) throw new Error(`Unknown book: ${ref.book}`);

  const { start, end } = parseVerseRange(ref.verses);
  const key = chapterKey(usfm, ref.chapter);

  const entry = db.chapters?.[translation]?.[key];
  if (!entry) {
    const fallback = db.chapters?.["NLT"]?.[key];
    if (fallback) {
      return buildPassage(fallback, start, end);
    }
    throw new Error(`Chapter not found: ${key} (${translation})`);
  }
  return buildPassage(entry, start, end);
}

function buildPassage(
  entry: { reference: string; verses: { n: number; t: string }[] },
  citedStart: number,
  citedEnd: number,
): FetchedPassage {
  return {
    header: entry.reference,
    verses: entry.verses.map((v) => ({
      number: v.n,
      text: v.t,
      cited: v.n >= citedStart && v.n <= citedEnd,
    })),
  };
}
