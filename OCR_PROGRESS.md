# OCR Progress Tracker

This file is the source of truth for what has been transcribed and what's next. Update it after each outline.

## Current state

Repo bootstrapped. Per-page PNGs extracted. Web viewer scaffold builds. **Outline 1 is fully transcribed (structured points + summary blob), and the three front-matter blobs (Outline 0, Index, How to Use) are in place. JSON validates against the schema.**

Schema/types extended (per Matt's direction): `front_matter[]` accepts a `kind: "blob"` variant with a `text: string`; `Outline.summary?: string` holds each outline's printed front-matter overview as a blob. Render order interleaves: front-matter blobs → Outline 1 summary → Outline 1 points → Outline 2 summary → Outline 2 points → ….

Pages mapped so far (Part 1):
- `p-01`–`p-08` — front matter prelims (title, copyright, foreword, acknowledgments, "What the CLNT Can Do for You", "AS A MAN THINKS", "Index of Master Outlines")
- `p-09`–`p-18` — front-matter "Christian Life Study Outlines and Notes" overview listing every outline's points (pages xxvii–xliv)
- `p-19` — Outline 1, Point I(A), printed page 374
- `p-20`–`p-21` — Outline 1, Point II(A), printed pages 291–292
- `p-22` — Outline 1, Point III(A), printed page 417
- `p-23` — Outline 1, Point IV(A), printed page 385
- `p-24`–`p-25` — Outline 1, Point V(A), printed pages 372–373

## Next action

**Awaiting Matt's sign-off on Outline 1 (now including the front-matter blobs and per-outline summary blob).** Review:

- `data/master_outlines.json` — front-matter blobs + Outline 1 summary + Outline 1 structured points.
- `ocr_notes/outline-01.md` — judgment calls flagged for human eyes (italics, ALL-CAPS in V(A), the V→? closing, page-spanning points, and notes on the new blob layout).

Once approved, the next pass:

1. Confirm where Outline 2 starts in `pages/part1/` (likely `p-26`) and verify each outline's printed summary is captured before its content pages.
2. For each outline 2–15: add `summary` blob from the front-matter overview pages, then transcribe structured points the same way as Outline 1.

## Outline checklist

- [x] Front-matter blobs — *Outline 0* (xvii–xxiv), *Index* (xxv), *How to Use the Outline* (xxvii–xxviii top); **awaiting sign-off**
- [x] **Outline 1** — *The Bible—The Word of God* — summary blob + structured points; **awaiting Matt's sign-off**
- [ ] Outline 2
- [ ] Outline 3
- [ ] Outline 4
- [ ] Outline 5
- [ ] Outline 6
- [ ] Outline 7 — last in `Part 1-7.pdf`
- [ ] Outline 8 — first in `Part 8-15.pdf`
- [ ] Outline 9
- [ ] Outline 10
- [ ] Outline 11
- [ ] Outline 12
- [ ] Outline 13
- [ ] Outline 14
- [ ] Outline 15 (evangelism / "How to Share God's Plan of Salvation" — confirmed from xix)

## Page-to-outline map (fill in as discovered)

| PDF | Page range | Content |
|---|---|---|
| part1 | p-01 to p-03 | Title / copyright / acknowledgments |
| part1 | p-04 to p-07 | "What the CLNT Can Do for You" + "AS A MAN THINKS" (xvii–xxiv) |
| part1 | p-08 | Index of Master Outlines (xxv) |
| part1 | p-09 to p-18 | "Christian Life Study Outlines and Notes" overview (xxvii–xliv) |
| part1 | p-19 | Outline 1, Point I(A) — pg 374 |
| part1 | p-20 to p-21 | Outline 1, Point II(A) — pgs 291–292 |
| part1 | p-22 | Outline 1, Point III(A) — pg 417 |
| part1 | p-23 | Outline 1, Point IV(A) — pg 385 |
| part1 | p-24 to p-25 | Outline 1, Point V(A) — pgs 372–373 |
| part1 | p-26+ | Outline 2 starts (to be confirmed) |
| part2 | p-01 | Outline 8 starts (to be verified) |

## Verification log

Per-outline review notes live in `ocr_notes/outline-NN.md`. Each entry should list:
- Pages covered
- Any words / phrases I was uncertain about (with the OCR'd guess)
- Bleed-through judgment calls
- Reference parsing failures
- Any deviations from the conversion rules with rationale
