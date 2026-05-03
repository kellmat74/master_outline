# Master Outline

A personal Bible-study tool built around Porter Barrington's **Fifteen Master Outlines** from *The Christian Life New Testament* (NKJV, 1984).

The original outlines are scattered through the printed New Testament and tied to that edition's specific page numbers, which makes them unusable on their own. This project extracts them into clean, structured JSON — keeping every word verbatim but replacing the edition-specific page-number references with Bible book/chapter/verse references that work with any translation.

## Status

Early — Phase A (repo bootstrap) complete. Phase B (OCR Outline 1 as a gold-standard sample) is the next step.

See [`.claude/plans/i-would-like-to-twinkling-bubble.md`](../../.claude/plans/i-would-like-to-twinkling-bubble.md) for the full plan.

## Layout

```
.
├── source/        # gitignored — original scanned PDFs (copyrighted, owner's personal copies)
├── pages/         # gitignored — per-page PNGs extracted from the PDFs (cheap to read one at a time)
├── data/          # canonical structured JSON output + JSON Schema
├── ocr_notes/     # human-readable per-outline review notes
├── scripts/       # one-off helpers (page extraction, ref validation, etc.)
└── src/           # Vite + React + TypeScript web viewer
```

## Usage and rights

Porter Barrington's *Christian Life Master Outlines and Study Notes* are © Royal Publishers / Thomas Nelson. This repository is being built for the owner's **personal study only**. He owns a copy of the book; OCR'ing it into a personal study tool is fine. **Sharing beyond immediate family or one small Bible-study group requires revisiting rights with the publisher first.** Do not redistribute the JSON output or the source PDFs.

## Development

```sh
npm install
npm run dev          # web viewer at http://localhost:5173
npm run validate     # validate data/master_outlines.json against data/schema.json
```
