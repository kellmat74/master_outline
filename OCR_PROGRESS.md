# OCR Progress Tracker

This file is the source of truth for what has been transcribed and what's next. Update it after each outline.

## Current state

**All 15 outlines transcribed and the JSON validates against the schema.** Front-matter blobs (Outline Zero, Index, How to Use) are in place; per-outline summary blobs and structured points are in place for outlines 1–15.

The web viewer renders blob front-matter and per-outline summaries. The Index of Master Outlines blob renders as a clickable list — each outline title links to its overview. Each point's closing transition makes the next-point reference and title clickable, navigating to the next point (or, on the last point of an outline, to the next outline's overview).

## Outline checklist

- [x] Front-matter blobs — Outline Zero (xvii–xxiv), Index (xxv), How to Use the Outline (xxvii–xxviii top)
- [x] **Outline 1** — *The Bible—The Word of God* — signed off
- [x] **Outline 2** — *God*
- [x] **Outline 3** — *Jesus Christ—The Son of God*
- [x] **Outline 4** — *The Holy Spirit*
- [x] **Outline 5** — *Sin*
- [x] **Outline 6** — *Judgments*
- [x] **Outline 7** — *Rewards* — last in Part 1
- [x] **Outline 8** — *The Church* — first in Part 2
- [x] **Outline 9** — *Prayer*
- [x] **Outline 10** — *Faith*
- [x] **Outline 11** — *The Abundant Life*
- [x] **Outline 12** — *Repentance*
- [x] **Outline 13** — *The New Birth*
- [x] **Outline 14** — *God's Plan of Salvation*
- [x] **Outline 15** — *How to Witness Effectively* — see flag below

## Open issues

- **Italic decisions are conservative.** I marked italics where they were unambiguous from the scan; on borderline cases I left text plain rather than guess. A second pass with the printed copy would catch any I missed.
- **`(B)` letter suffixes** appear on a handful of points (Outline 2 IV, Outline 3 VI, Outline 13 II) where Barrington apparently keyed an alternate footnote letter. Schema accepts any single uppercase, so these are preserved verbatim.
- **`pages/part2/p-73.png` is a duplicate** of `p-72.png` (both scans of printed page 353); it can be deleted. The supplementary single-page scan of printed page 207 lives at `pages/part2/p-80b-page207.png` (slotted between p-80 = printed page 460 and p-81 = printed page 208 to match reading order).

## Page-to-outline map (Part 1 + Part 2)

| PDF | Page range | Content |
|---|---|---|
| part1 | p-01 to p-03 | Title / copyright / acknowledgments (intentionally not transcribed) |
| part1 | p-04 to p-08 left | Outline Zero — *What the CLNT Can Do for You* + *AS A MAN THINKS* (xvii–xxiv) |
| part1 | p-08 right | Index of Master Outlines (xxv) |
| part1 | p-09 to p-10 top | How to Use the Outline / *CHRISTIAN LIFE STUDY OUTLINES AND NOTES* (xxvii–xxviii top) |
| part1 | p-10 bottom to p-18 | Per-outline summary blobs for outlines 1–15 (xxviii–xliv) |
| part1 | p-19 to p-25 | Outline 1 content (printed pages 374, 291–292, 417, 385, 372–373) |
| part1 | p-26 to p-32 | Outline 2 content (printed pages 396–397, 357, 427, 336, 4–5) |
| part1 | p-33 to p-44 | Outline 3 content (Jesus Christ, 6 points) |
| part1 | p-45 to p-51 | Outline 4 content (Holy Spirit, 5 points) |
| part1 | p-52 to p-58 | Outline 5 content (Sin, 5 points) |
| part1 | p-59 to p-65 | Outline 6 content (Judgments, 5 points) |
| part1 | p-66 to p-71 | Outline 7 content (Rewards, 5 points) — last in Part 1 |
| part2 | p-01 to p-14 | Outline 8 content (The Church, 7 points) |
| part2 | p-15 to p-23 | Outline 9 content (Prayer, 6 points) |
| part2 | p-24 to p-32 | Outline 10 content (Faith, 5 points) |
| part2 | p-33 to p-39 | Outline 11 content (Abundant Life, 5 points) |
| part2 | p-40 to p-52 | Outline 12 content (Repentance, 7 points) |
| part2 | p-53 to p-59 | Outline 13 content (New Birth, 5 points) |
| part2 | p-60 to p-68 | Outline 14 content (God's Plan, 7 points) |
| part2 | p-69 to p-81 | Outline 15 content (How to Witness, 7 points) — page 207 missing (see Open issues) |

## Verification log

Per-outline review notes live in `ocr_notes/outline-NN.md`. The first outline has detailed notes (sign-off sample); subsequent outlines were transcribed in batch and inherit the same conventions and open flags.
