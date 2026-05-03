# Outline 1 — The Bible—The Word of God

## Pages covered

- `pages/part1/p-19.png` — printed page 374 — Point I(A)
- `pages/part1/p-20.png` — printed page 291 — Point II(A) (start)
- `pages/part1/p-21.png` — printed page 292 — Point II(A) (continued)
- `pages/part1/p-22.png` — printed page 417 — Point III(A)
- `pages/part1/p-23.png` — printed page 385 — Point IV(A)
- `pages/part1/p-24.png` — printed page 372 — Point V(A) (start)
- `pages/part1/p-25.png` — printed page 373 — Point V(A) (continued)

The outline title and the list of point headers were also confirmed from the front-matter overview on `p-09` (page xxvii) and `p-10` (page xxviii — "MASTER OUTLINE NUMBER ONE — The Bible—The Word of God").

## Italics preserved

- I(A) opening: `is` in *"All Scripture* **is** *given by inspiration of God."*
- I(A) paragraph 2: `as they were` and `was` (both translator-italics from the quoted verses)
- III(A): `as they were` (same quotation re-cited)
- IV(A) opening: `is` in *"For the word of God* **is** *living and powerful...."*

## Small caps

- I(A) paragraph 2: `Lord` rendered as smallcaps (`{"t":"smallcaps","v":"Lord"}`) for the divine-name styling in *"The Spirit of the LORD spoke by me."*

## ALL-CAPS emphasis (NOT smallcaps)

In V(A), Barrington uses ALL-CAPS emphasis for `IS`, `WORD`, and `WORDs` to drive home the distinction between the Word of God and the words within it. These are kept as plain text in upper case (no smallcaps run). **Worth a sanity check on review** — I read the casing as printed: `"it IS the WORD of God"` and `"the Word of God contains the WORDs of God"` (note the lowercase `s` on the second occurrence; that appears to be a deliberate small-cap-style typesetting of `Words` where the trailing `s` retains its lowercase form).

## References — page-prefix stripping

All cross-references in the form `(Page nnn—...)` had the `Page nnn—` prefix stripped per the conversion rules. OT references (`(Ps. 119:11 OT)`, `(2 Sam. 23:2 OT)`, etc.) had no page prefix to strip; the `OT` marker is kept both in the `display` string and as `testament: "OT"` in the structured fields.

Notable transition normalization examples:
- I→II source: `Now turn to Pages 291, 292 and read 1 Cor. 2:14-16, for point number II: ...`
  → stored: `Now turn to 1 Cor. 2:14-16, for point number II: ...`  *(both page numbers and the redundant "and read" dropped, matching the pattern in the plan example)*
- II→III source: `Now turn to Page 417, 2 Pet. 1:21, for point number III: ...`
  → stored: `Now turn to 2 Pet. 1:21, for point number III: ...`

## Page-spanning points (`source_page` is start-of-point only)

The schema only records a single `source_page` per point. Point II(A) spans printed pages 291–292, and Point V(A) spans 372–373. I stored the *first* printed page in `source_page` and merged the body across the `Notes continued on next page` / `(continued from preceding page)` boundary per the conversion rules. **If you'd like both pages preserved per point, I can change the schema to `source_pages: number[]`.**

## V(A) closing — no scripture transition

Outline 1's last point closes with `Now turn to Master Study Outlines, Page xxix, for lesson number two.` — i.e. it sends the reader back to the front-matter index, not to a Bible reference. I therefore omitted the `transition` field on V(A) (the schema makes it optional) and instead added the cleaned closing instruction as the final paragraph of the body: *"Now turn to Master Study Outlines for lesson number two."*

If you want every point to carry a `transition`, an alternative is to relax the schema so `next_reference` is optional when the transition points back to the index. **Flagging this for sign-off — the same pattern will recur at the end of every outline.**

## Bleed-through

Bleed-through is visible on most pages (especially the verso-side ghosts on `p-04`, `p-05`, `p-09`, `p-19`–`p-25`) but did not force any judgment calls on Outline 1's text. Foreground text is always reliably distinguishable from the mirrored ghost.

## Front matter — interleaved blob layout (per Matt's direction)

Schema and `master_outlines.json` were extended to support the interleaved layout Matt requested:

- `front_matter[]` now accepts a `kind: "blob"` variant with a plain-text `text` field (the original `kind: "section"` with structured `body: Block[]` is still allowed).
- `Outline.summary?: string` was added as an optional plain-text blob, holding each outline's introductory paragraphs and printed point-list as it appears in the front-matter overview pages (xxviii–xliv).

Render order matches Matt's spec:

1. `front_matter[0]` — *Master Outline Zero — What the Christian Life New Testament Can Do for You* (pages xvii–xxiv; PNGs 4–8 left). Includes the embedded `AS A MAN THINKS` devotional (xxi–xxii).
2. `front_matter[1]` — *Index of Master Outlines* (page xxv; PNG 8 right).
3. `front_matter[2]` — *How to Use the Outline* (pages xxvii and xxviii top; PNG 9 + top of PNG 10 left, ending at the `CHRISTIAN LIFE STUDY OUTLINES` section header).
4. `outlines[0].summary` — Outline 1 summary (xxviii bottom + xxix top).
5. `outlines[0].points` — the structured I(A)–V(A) content, unchanged.

Subsequent outlines will follow the same pattern: each outline's printed front-matter summary lives in its `summary` blob, then its full per-point notes live in `points`.

Pages 1–3 (cover, copyright, foreword, acknowledgments) are intentionally excluded per Matt's direction.

### Things to watch in the blobs

- **Edition-specific page numbers preserved.** Per Matt's "they can be blobs" guidance, I did **not** strip the `(Page nnn—…)` references inside the blob text (e.g. `(Page 188—John 14:6)` in Outline 1's summary, `page 374` / `page 291` / `page xli` etc. in Outline 0 and How-to-Use). They're historical context, not navigation. Easy to strip later if you change your mind.
- **Light formatting in the blobs.** Lists were kept as line-broken plain text with leading spaces for indentation (e.g. the eight reasons to study, the AS A MAN THINKS devotional list, the Index entries with right-aligned roman page numbers). Italics were dropped — blobs render verbatim. The viewer will need to handle line breaks (`\n`) and double-newlines (`\n\n`) for paragraph spacing.
- **Outline 0 paragraphs that span page breaks** were merged into single paragraphs (the print layout broke a paragraph at the bottom of xvii, xviii, etc.; the blob restores the prose flow).

## Things explicitly flagged for human eyes

1. The use of italic on the second `is` in *"it is the Word of God"* (last sentence of the I(A) opening paragraph). I did **not** mark it italic — on the scan it's not clearly distinguishable from upright. Worth eyeballing the printed copy.
2. The `WORD` / `WORDs` casing in V(A) — see "ALL-CAPS emphasis" above.
3. The decision to omit `transition` on the last point of each outline — see "V(A) closing" above.
4. `source_page` (singular) vs. spanning pages — see "Page-spanning points" above.
