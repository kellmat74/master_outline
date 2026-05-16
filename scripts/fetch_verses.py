#!/usr/bin/env python3
"""
One-time script: fetches every scripture reference in master_outlines.json
from API.Bible for all four translations and writes data/verses.json.

Usage:
    python3 scripts/fetch_verses.py

Requires VITE_BIBLE_API_KEY in .env (project root).
Resumes safely if interrupted — already-fetched keys are skipped.
"""

import json
import os
import sys
import time
from pathlib import Path
from typing import Optional

import requests

# ── Config ─────────────────────────────────────────────────────────────────

ROOT = Path(__file__).resolve().parent.parent
DATA_IN = ROOT / "data" / "master_outlines.json"
DATA_OUT = ROOT / "data" / "verses.json"
ENV_FILE = ROOT / ".env"

# Load API key from .env
api_key = None
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        if line.startswith("VITE_BIBLE_API_KEY="):
            api_key = line.split("=", 1)[1].strip()
            break

if not api_key:
    sys.exit("ERROR: VITE_BIBLE_API_KEY not found in .env")

BASE = "https://rest.api.bible/v1"
HEADERS = {"api-key": api_key}

TRANSLATIONS = {
    "NLT":  "d6e14a625393b4da-01",
    "NASB": "b8ee27bcd1cae43a-01",
    "MSG":  "6f11a7de016f942e-01",
    "ASV":  "06125adad2d5898a-01",
}

# ── USFM book code map ──────────────────────────────────────────────────────

USFM = {
    # Old Testament
    "Genesis":          "GEN",
    "Exodus":           "EXO",
    "Leviticus":        "LEV",
    "Numbers":          "NUM",
    "Deuteronomy":      "DEU",
    "1 Samuel":         "1SA",
    "2 Samuel":         "2SA",
    "Psalms":           "PSA",
    "Proverbs":         "PRO",
    "Isaiah":           "ISA",
    "Jeremiah":         "JER",
    "Ezekiel":          "EZK",
    "Daniel":           "DAN",
    "Joel":             "JOL",
    "Micah":            "MIC",
    "Zechariah":        "ZEC",
    "Malachi":          "MAL",
    # New Testament
    "Matthew":          "MAT",
    "Mark":             "MRK",
    "Luke":             "LUK",
    "John":             "JHN",
    "Acts":             "ACT",
    "Romans":           "ROM",
    "1 Corinthians":    "1CO",
    "2 Corinthians":    "2CO",
    "Galatians":        "GAL",
    "Ephesians":        "EPH",
    "Philippians":      "PHP",
    "Colossians":       "COL",
    "1 Thessalonians":  "1TH",
    "2 Thessalonians":  "2TH",
    "1 Timothy":        "1TI",
    "2 Timothy":        "2TI",
    "Titus":            "TIT",
    "Hebrews":          "HEB",
    "James":            "JAS",
    "1 Peter":          "1PE",
    "2 Peter":          "2PE",
    "1 John":           "1JN",
    "Jude":             "JUD",
    "Revelation":       "REV",
}

# ── Helpers ─────────────────────────────────────────────────────────────────

def parse_verse_range(verses_str: str) -> tuple[int, int]:
    """Return (start, end) covering all verse numbers mentioned."""
    nums = []
    for token in verses_str.split(","):
        for part in token.strip().split("-"):
            try:
                nums.append(int(part.strip()))
            except ValueError:
                pass
    if not nums:
        return 1, 1
    return min(nums), max(nums)


def passage_key(usfm_book: str, chapter: int, ctx_start: int, ctx_end: int) -> str:
    return f"{usfm_book}.{chapter}.{ctx_start}-{usfm_book}.{chapter}.{ctx_end}"


def chapter_key(usfm_book: str, chapter: int) -> str:
    return f"{usfm_book}.{chapter}"


def extract_verses(content: list) -> dict[int, str]:
    """Walk the API.Bible content tree and return {verse_number: text}."""
    verse_texts: dict[int, list[str]] = {}

    def walk(node):
        if isinstance(node, dict):
            if node.get("type") == "text":
                attrs = node.get("attrs") or {}
                verse_id = attrs.get("verseId", "")
                if verse_id:
                    try:
                        v_num = int(verse_id.split(".")[-1])
                        verse_texts.setdefault(v_num, []).append(node["text"])
                    except (ValueError, IndexError):
                        pass
            for item in node.get("items", []):
                walk(item)
        elif isinstance(node, list):
            for item in node:
                walk(item)

    for item in content:
        walk(item)

    return {
        v: " ".join("".join(parts).split())
        for v, parts in verse_texts.items()
    }


def fetch_passage_api(bible_id: str, passage_id: str) -> Optional[dict]:
    url = f"{BASE}/bibles/{bible_id}/passages/{passage_id}"
    params = {
        "content-type": "json",
        "include-verse-numbers": "true",
        "include-titles": "false",
        "include-notes": "false",
    }
    try:
        r = requests.get(url, headers=HEADERS, params=params, timeout=15)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        data = r.json().get("data", {})
        verses_dict = extract_verses(data.get("content", []))
        reference = data.get("reference", passage_id)
        return {
            "reference": reference,
            "verses": [{"n": k, "t": v} for k, v in sorted(verses_dict.items())],
        }
    except Exception as e:
        print(f"  ERROR fetching {passage_id} ({bible_id}): {e}")
        return None


def fetch_chapter_api(bible_id: str, chapter_id: str) -> Optional[dict]:
    url = f"{BASE}/bibles/{bible_id}/chapters/{chapter_id}"
    params = {
        "content-type": "json",
        "include-verse-numbers": "true",
        "include-titles": "false",
        "include-notes": "false",
    }
    try:
        r = requests.get(url, headers=HEADERS, params=params, timeout=15)
        if r.status_code == 404:
            return None
        r.raise_for_status()
        data = r.json().get("data", {})
        verses_dict = extract_verses(data.get("content", []))
        reference = data.get("reference", chapter_id)
        return {
            "reference": reference,
            "verses": [{"n": k, "t": v} for k, v in sorted(verses_dict.items())],
        }
    except Exception as e:
        print(f"  ERROR fetching chapter {chapter_id} ({bible_id}): {e}")
        return None

# ── Collect references ───────────────────────────────────────────────────────

doc = json.loads(DATA_IN.read_text())

passage_refs: list[tuple[str, int, str]] = []  # (book, chapter, verses)
chapter_refs: set[tuple[str, int]] = set()     # (book, chapter)


def collect_ref(r: dict):
    passage_refs.append((r["book"], r["chapter"], r["verses"]))
    chapter_refs.add((r["book"], r["chapter"]))


def collect_runs(runs: list):
    for run in runs:
        if run.get("t") == "ref":
            collect_ref(run)


for outline in doc["outlines"]:
    for point in outline["points"]:
        collect_ref(point["primary_reference"])
        for block in point["body"]:
            collect_runs(block.get("runs", []))
        tr = point.get("transition")
        if tr and tr.get("next_reference"):
            collect_ref(tr["next_reference"])

# Deduplicate passage refs
unique_passages: set[tuple[str, int, int, int]] = set()  # (book, ch, ctx_start, ctx_end)
for book, chapter, verses in passage_refs:
    if book not in USFM:
        print(f"WARNING: unknown book '{book}' — skipping")
        continue
    start, end = parse_verse_range(verses)
    ctx_start = max(1, start - 2)
    ctx_end = end + 2
    unique_passages.add((book, chapter, ctx_start, ctx_end))

unique_chapters: set[tuple[str, int]] = set()
for book, chapter in chapter_refs:
    if book not in USFM:
        continue
    unique_chapters.add((book, chapter))

total_calls = (len(unique_passages) + len(unique_chapters)) * len(TRANSLATIONS)
print(f"Passages to fetch: {len(unique_passages)}")
print(f"Chapters to fetch: {len(unique_chapters)}")
print(f"Translations:      {len(TRANSLATIONS)}")
print(f"Total API calls:   {total_calls}")
print()

# ── Load existing output (resume support) ───────────────────────────────────

if DATA_OUT.exists():
    existing = json.loads(DATA_OUT.read_text())
    print(f"Resuming from existing {DATA_OUT.name}")
else:
    existing = {"passages": {}, "chapters": {}}

for abbr in TRANSLATIONS:
    existing["passages"].setdefault(abbr, {})
    existing["chapters"].setdefault(abbr, {})

# ── Fetch passages ───────────────────────────────────────────────────────────

passage_list = sorted(unique_passages)
done = 0
skipped = 0

print("=== Fetching passages ===")
for book, chapter, ctx_start, ctx_end in passage_list:
    usfm = USFM[book]
    pid = passage_key(usfm, chapter, ctx_start, ctx_end)
    for abbr, bible_id in TRANSLATIONS.items():
        if pid in existing["passages"][abbr]:
            skipped += 1
            continue
        result = fetch_passage_api(bible_id, pid)
        if result:
            existing["passages"][abbr][pid] = result
        done += 1
        total_fetched = done + skipped
        if total_fetched % 50 == 0:
            print(f"  {total_fetched}/{total_calls} ({skipped} cached)...")
            DATA_OUT.write_text(json.dumps(existing, ensure_ascii=False))
        time.sleep(0.12)

# ── Fetch chapters ───────────────────────────────────────────────────────────

chapter_list = sorted(unique_chapters)

print(f"\n=== Fetching chapters ===")
for book, chapter in chapter_list:
    usfm = USFM[book]
    cid = chapter_key(usfm, chapter)
    for abbr, bible_id in TRANSLATIONS.items():
        if cid in existing["chapters"][abbr]:
            skipped += 1
            continue
        result = fetch_chapter_api(bible_id, cid)
        if result:
            existing["chapters"][abbr][cid] = result
        done += 1
        total_fetched = done + skipped
        if total_fetched % 50 == 0:
            print(f"  {total_fetched}/{total_calls} ({skipped} cached)...")
            DATA_OUT.write_text(json.dumps(existing, ensure_ascii=False))
        time.sleep(0.12)

# ── Save final output ────────────────────────────────────────────────────────

DATA_OUT.write_text(json.dumps(existing, ensure_ascii=False, indent=None))
size_mb = DATA_OUT.stat().st_size / 1_048_576
print(f"\nDone. {done} fetched, {skipped} cached.")
print(f"Written: {DATA_OUT}  ({size_mb:.1f} MB)")
