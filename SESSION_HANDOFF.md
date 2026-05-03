# Session Handoff — How to Resume OCR Work in a Fresh Session

The OCR transcription of Porter Barrington's outlines must run in a **fresh chat session**, not appended to a long conversation. PDF page reads return images, and the per-request image-dimension limit is reached quickly when many images accumulate. Each fresh session starts with an empty image budget.

## How to start a fresh session

Open a new chat in this repo and paste this prompt:

> Continue the Master Outline project. Read `~/.claude/plans/i-would-like-to-twinkling-bubble.md` for the plan, `SESSION_HANDOFF.md` for OCR mechanics, and `src/types.ts` for the data shape. Then proceed with the next phase per the todo at the top of `OCR_PROGRESS.md`.

## OCR mechanics

The PDFs have already been rasterized to per-page PNGs (1800px max long side, well under the API limit) under `pages/`:

- `pages/part1/p-01.png` through `p-71.png` — front matter + Master Outlines 1–7
- `pages/part2/p-01.png` through `p-81.png` — Master Outlines 8–15

**Read pages one (or two) at a time** with the Read tool; do not bulk-read. After every ~10 pages, transcribe what you have to JSON, save, and consider whether to checkpoint with a commit.

## Conversion rules (cheat sheet)

Full rules in the plan. Quick reference:

- `(Page 104—Luke 2:52)` → scripture-ref `Luke 2:52`. **Strip the page-number prefix.**
- `(Pages 410, 411—1 Pet. 2:1-10)` → scripture-ref `1 Pet. 2:1-10`.
- `Now turn to Page 98, 99, Luke 1:26-35, for point number III: TITLE.` → keep verbatim minus the page numbers: `Now turn to Luke 1:26-35, for point number III: TITLE.`
- `Notes continued on next page` / `(continued from preceding page)` → strip; merge surrounding paragraph.
- Bottom-of-page numbers (`263`, `98`, etc.) → strip from body, save as `source_page` on the point.
- `(verses 34, 35)` / `(verse 16)` → keep verbatim.
- `(OT)` markers → keep both as display text and as structured `testament: "OT"`.
- Italic emphasis in source → preserve as `{"t":"italic","v":"..."}` runs.
- Small-caps `Lord` → preserve as `{"t":"smallcaps","v":"Lord"}` runs.
- **Bleed-through ghost text → ignore** (mirrored, often partial).
- Book-name abbreviations: keep Barrington's exact spelling as `book_abbrev`; also store canonical form as `book`.

## Per-outline workflow

1. Open `OCR_PROGRESS.md` and pick the next outline.
2. Read its pages from `pages/part1/` or `pages/part2/`. The user scanned each outline's pages in **outline reading order**, so consecutive PNG files cover consecutive points within an outline.
3. Transcribe each point into the JSON structure under `outlines[]`.
4. Append uncertainties / judgment calls to `ocr_notes/outline-NN.md`.
5. Run `npm run validate` to confirm the JSON still validates against the schema.
6. Update `OCR_PROGRESS.md` and commit.

## Outline 1 is the gold-standard sample

The first outline is for Matt to review carefully. Stop after Outline 1 is in the JSON, ask for sign-off, and capture his corrections. Only then proceed to Outlines 2–15.

## What NOT to do

- Don't paste large excerpts into the chat. The transcription belongs in `data/master_outlines.json` — that file is the user's personal study tool from his own owned copy. Chat responses should describe progress, not reproduce content.
- Don't commit the `source/` PDFs or `pages/` PNGs (already gitignored).
- Don't rasterize the PDFs again — the PNGs are stable.

## Useful commands

```sh
# Re-rasterize pages (only if source PDFs change)
pdftoppm -png -scale-to 1800 "source/Part 1-7.pdf"  pages/part1/p
pdftoppm -png -scale-to 1800 "source/Part 8-15.pdf" pages/part2/p

# Validate the JSON against the schema
npm run validate

# Run the viewer
npm run dev
```
