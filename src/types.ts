/**
 * TypeScript types for the Master Outline JSON data model.
 *
 * The data is organized as:
 *   Document
 *     ├─ front_matter: Section[]
 *     └─ outlines: Outline[]
 *           └─ points: Point[]
 *                 ├─ primary_reference: Reference
 *                 ├─ body: Block[]            // paragraphs / subpoints
 *                 │     └─ runs: Run[]        // typed inline runs
 *                 └─ transition: Transition
 *
 * Inline text is a sequence of typed Runs so the renderer can italicize
 * scripture refs, preserve emphasis, and (later) inject verse text without
 * touching anything else.
 */

// ---------- Inline runs ----------

/** Plain text run — the default for body prose. */
export interface TextRun {
  t: "text";
  v: string;
}

/** Italic emphasis preserved from the printed text. */
export interface ItalicRun {
  t: "italic";
  v: string;
}

/** Small-caps run, used for the Lord-name styling Barrington preserves. */
export interface SmallCapsRun {
  t: "smallcaps";
  v: string;
}

/** A scripture reference. Display string is verbatim (Barrington's abbreviation);
 *  structured fields are normalized for parsing / linking / future verse injection. */
export interface ReferenceRun {
  t: "ref";
  /** Verbatim display, e.g. "1 Pet. 2:1-10" or "Eph. 2:19-22". */
  display: string;
  /** Canonical book name, e.g. "1 Peter", "Ephesians". */
  book: string;
  /** Verbatim abbreviation as printed, e.g. "1 Pet.", "Eph.". */
  book_abbrev: string;
  chapter: number;
  /** Verses as printed: "16", "13-19", "1-11", "13, 18-23", etc. */
  verses: string;
  /** "OT" if Barrington marked the ref as Old-Testament; otherwise omitted. */
  testament?: "OT";
}

export type Run = TextRun | ItalicRun | SmallCapsRun | ReferenceRun;

// ---------- Body blocks ----------

export interface Paragraph {
  type: "paragraph";
  runs: Run[];
}

export interface Subpoint {
  type: "subpoint";
  /** Verbatim label as printed: "(1)", "(2)", "(3)". */
  label: string;
  runs: Run[];
}

/** A block-level scripture quotation, e.g. an indented passage. */
export interface QuoteBlock {
  type: "quote";
  runs: Run[];
}

export type Block = Paragraph | Subpoint | QuoteBlock;

// ---------- Reference (used for primary refs and transition refs) ----------

export interface Reference {
  display: string;
  book: string;
  book_abbrev: string;
  chapter: number;
  verses: string;
  testament?: "OT";
}

// ---------- Point ----------

export interface Transition {
  /** Verbatim transition sentence with edition-specific page numbers stripped. */
  raw: string;
  /** Roman numeral of the next point this transition leads to. */
  next_roman: string;
  /** Title of the next point as Barrington names it. */
  next_title: string;
  /** Scripture reference the reader is sent to next. */
  next_reference: Reference;
}

export interface Point {
  /** Roman numeral of the point: "I", "II", "III", etc. */
  roman: string;
  /** Letter suffix; in this work always "A". */
  letter: string;
  /** Physical page number in the printed book where this point lives. */
  source_page: number;
  /** Primary scripture reference associated with this point's location. */
  primary_reference: Reference;
  /** Body content of the point: paragraphs and sub-points in order. */
  body: Block[];
  /** Closing transition sentence; absent on the last point of the last outline. */
  transition?: Transition;
}

// ---------- Outline ----------

export interface Outline {
  /** 1-15. */
  number: number;
  /** Title as Barrington names it (filled from each outline's first page). */
  title: string;
  /** Optional plain-text blob: the per-outline introduction + point list as
   *  printed in the front-matter overview pages (xxviii–xliv). Rendered as-is
   *  before the structured `points`. */
  summary?: string;
  points: Point[];
}

// ---------- Front matter ----------

/** Structured front-matter (rich tree of typed blocks/runs). */
export interface FrontMatterStructured {
  kind: "section";
  title: string;
  /** Roman / arabic source page numbers as printed (e.g. "xvii", "xviii"). */
  source_pages: string[];
  body: Block[];
}

/** Plain-text front-matter blob. Used for the preamble pages (Outline 0,
 *  Index, How-to-Use, etc.) which don't follow the per-point conversion
 *  pattern. The viewer renders `text` verbatim with paragraph breaks. */
export interface FrontMatterBlob {
  kind: "blob";
  title: string;
  source_pages: string[];
  text: string;
}

export type FrontMatterSection = FrontMatterStructured | FrontMatterBlob;

// ---------- Document ----------

export interface Document {
  title: string;
  compiler: string;
  edition: string;
  source_copyright_notice: string;
  front_matter: FrontMatterSection[];
  outlines: Outline[];
}
