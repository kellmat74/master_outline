#!/usr/bin/env node
/**
 * Walks every scripture reference in data/master_outlines.json and reports
 * any whose structured fields don't round-trip with the display string, or
 * whose chapter/verses look malformed.
 *
 * Run: node scripts/validate_refs.mjs
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = join(__dirname, "..", "data", "master_outlines.json");
const doc = JSON.parse(readFileSync(dataPath, "utf8"));

const issues = [];
let refCount = 0;

function checkRef(ref, where) {
  refCount++;
  const { display, book, book_abbrev, chapter, verses } = ref;
  if (!display || !book || !book_abbrev || !chapter || !verses) {
    issues.push({ where, ref, why: "missing required field" });
    return;
  }
  if (typeof chapter !== "number" || chapter < 1) {
    issues.push({ where, ref, why: `chapter not a positive integer: ${chapter}` });
  }
  if (!/^[\d,\s–-]+$/.test(verses)) {
    issues.push({ where, ref, why: `verses doesn't look like a verse range: "${verses}"` });
  }
  // round-trip: display should at least contain the chapter and verses
  if (!display.includes(String(chapter))) {
    issues.push({ where, ref, why: `display "${display}" doesn't contain chapter ${chapter}` });
  }
}

function walkRuns(runs, where) {
  for (const run of runs) {
    if (run.t === "ref") checkRef(run, where);
  }
}

function walkBlocks(blocks, where) {
  for (const block of blocks) walkRuns(block.runs, where);
}

for (const [i, section] of doc.front_matter.entries()) {
  walkBlocks(section.body, `front_matter[${i}] "${section.title}"`);
}

for (const outline of doc.outlines) {
  for (const point of outline.points) {
    const where = `Outline ${outline.number} ${point.roman}(${point.letter})`;
    checkRef(point.primary_reference, `${where} primary_reference`);
    walkBlocks(point.body, `${where} body`);
    if (point.transition) {
      checkRef(point.transition.next_reference, `${where} transition.next_reference`);
    }
  }
}

console.log(`Walked ${refCount} references.`);
if (issues.length === 0) {
  console.log("All references look well-formed.");
  process.exit(0);
}

console.error(`\n${issues.length} issue(s) found:\n`);
for (const { where, ref, why } of issues) {
  console.error(`  - ${where}: ${why}`);
  console.error(`    ${JSON.stringify(ref)}`);
}
process.exit(1);
