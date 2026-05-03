# OCR Progress Tracker

This file is the source of truth for what has been transcribed and what's next. Update it after each outline.

## Current state

Repo bootstrapped. Per-page PNGs extracted. Web viewer scaffold builds. Data file is empty stub. **No outlines transcribed yet.**

## Next action

**Phase B — OCR Outline 1 (gold-standard sample).** Read `pages/part1/p-NN.png` files covering Outline 1 starting from where the front matter ends. Transcribe each point into `data/master_outlines.json`. After Outline 1 is complete, stop and ask Matt for sign-off before proceeding.

Front matter (xvii–xxi sampled so far) starts around `pages/part1/p-04.png`. The first outline begins after the front matter — find the title page that introduces "Master Outline Number One" and start there.

## Outline checklist

- [ ] Front matter (title page, foreword, "What the CLNT Can Do for You", "AS A MAN THINKS", table of contents)
- [ ] **Outline 1** — title TBD — gold-standard sample, requires sign-off
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
| part1 | p-01 to ~p-03 | Cover / copyright / title pages |
| part1 | ~p-04 to ~p-07 | Front matter (foreword, "What the CLNT Can Do for You", devotional) |
| part1 | ?? | Outline 1 starts |
| part2 | p-01 | Outline 8 starts (verify) |

## Verification log

Per-outline review notes live in `ocr_notes/outline-NN.md`. Each entry should list:
- Pages covered
- Any words / phrases I was uncertain about (with the OCR'd guess)
- Bleed-through judgment calls
- Reference parsing failures
- Any deviations from the conversion rules with rationale
