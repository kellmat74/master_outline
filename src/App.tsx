import { useMemo, useState } from "react";
import data from "../data/master_outlines.json";
import type { Document, FrontMatterSection, Outline, Point, Reference } from "./types";
import PointView from "./components/PointView";
import VersePopup from "./components/VersePopup";
import { VerseContext } from "./VerseContext";

const doc = data as Document;

export type Selection =
  | { kind: "landing" }
  | { kind: "front"; sectionIndex: number }
  | { kind: "summary"; outlineIndex: number }
  | { kind: "point"; outlineIndex: number; pointIndex: number }
  | { kind: "empty" };

export type Navigate = (s: Selection) => void;

export default function App() {
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeVerse, setActiveVerse] = useState<Reference | null>(null);
  const [selection, setSelection] = useState<Selection>({ kind: "landing" });

  const filtered = useMemo(() => filterOutlines(doc.outlines, query), [query]);

  const navigate: Navigate = (s) => {
    setSelection(s);
    setSidebarOpen(false);
    const main = document.querySelector(".main");
    if (main) main.scrollTop = 0;
  };

  return (
    <VerseContext.Provider value={setActiveVerse}>
    <div className="app">
      <div
        className={`sidebar-backdrop${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
      <button
        className="sidebar-toggle"
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        onClick={() => setSidebarOpen((v) => !v)}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <header className="sidebar-header">
          <h1>
            <button
              className={`sidebar-title-btn${selection.kind === "landing" ? " selected" : ""}`}
              onClick={() => navigate({ kind: "landing" })}
            >
              {doc.title}
            </button>
          </h1>
          <p className="compiler">{doc.compiler}</p>
          <input
            type="search"
            placeholder="Search outlines…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search"
          />
        </header>

        {doc.front_matter.length > 0 && (
          <section className="sidebar-section">
            <h2>Front matter</h2>
            <ul>
              {doc.front_matter.map((s, i) => (
                <li key={i}>
                  <button
                    className={
                      selection.kind === "front" && selection.sectionIndex === i
                        ? "selected"
                        : ""
                    }
                    onClick={() => navigate({ kind: "front", sectionIndex: i })}
                  >
                    {s.title}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="sidebar-section">
          <h2>Master Outlines</h2>
          {filtered.length === 0 && <p className="empty">No outlines yet.</p>}
          <ol>
            {filtered.map(({ outline, originalIndex }) => (
              <li key={outline.number}>
                <details open={selectionInOutline(selection, originalIndex)}>
                  <summary>
                    <span className="outline-number">{outline.number}.</span>{" "}
                    {outline.title || <em>(untitled)</em>}
                  </summary>
                  <ul>
                    {outline.summary && (
                      <li>
                        <button
                          className={
                            selection.kind === "summary" &&
                            selection.outlineIndex === originalIndex
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            navigate({
                              kind: "summary",
                              outlineIndex: originalIndex,
                            })
                          }
                        >
                          Overview
                        </button>
                      </li>
                    )}
                    {outline.points.map((p, pi) => (
                      <li key={`${p.roman}-${pi}`}>
                        <button
                          className={
                            selection.kind === "point" &&
                            selection.outlineIndex === originalIndex &&
                            selection.pointIndex === pi
                              ? "selected"
                              : ""
                          }
                          onClick={() =>
                            navigate({
                              kind: "point",
                              outlineIndex: originalIndex,
                              pointIndex: pi,
                            })
                          }
                        >
                          {p.roman} — {p.primary_reference.display}
                        </button>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ))}
          </ol>
        </section>
      </aside>

      <main className="main">
        <SelectionView selection={selection} navigate={navigate} />
      </main>
    </div>
    {activeVerse && (
      <VersePopup
        reference={activeVerse}
        onClose={() => setActiveVerse(null)}
      />
    )}
    </VerseContext.Provider>
  );
}

function SelectionView({
  selection,
  navigate,
}: {
  selection: Selection;
  navigate: Navigate;
}) {
  if (selection.kind === "landing") {
    return <LandingPage navigate={navigate} />;
  }

  if (selection.kind === "empty") {
    return (
      <div className="placeholder">
        <h2>No content yet.</h2>
        <p>
          Run the OCR pipeline to populate <code>data/master_outlines.json</code>.
          See <code>SESSION_HANDOFF.md</code>.
        </p>
      </div>
    );
  }

  if (selection.kind === "front") {
    const section = doc.front_matter[selection.sectionIndex];
    return <FrontMatterView section={section} navigate={navigate} />;
  }

  if (selection.kind === "summary") {
    const outline = doc.outlines[selection.outlineIndex];
    return (
      <article className="point">
        <header className="point-header">
          <p className="outline-breadcrumb">
            Outline {outline.number}
            {outline.title ? ` — ${outline.title}` : ""}
          </p>
          <h2>Overview</h2>
        </header>
        <BlobText text={outline.summary ?? ""} stripNavHints />
        {outline.points.length > 0 && (
          <footer className="nav-footer">
            <button
              className="nav-btn"
              onClick={() =>
                navigate({
                  kind: "point",
                  outlineIndex: selection.outlineIndex,
                  pointIndex: 0,
                })
              }
            >
              Begin Study — Point I: {outline.points[0].primary_reference.display} →
            </button>
          </footer>
        )}
      </article>
    );
  }

  const outline = doc.outlines[selection.outlineIndex];
  const point = outline.points[selection.pointIndex];
  const isLastPoint = selection.pointIndex + 1 >= outline.points.length;
  const nextOutline = isLastPoint && selection.outlineIndex + 1 < doc.outlines.length
    ? doc.outlines[selection.outlineIndex + 1]
    : null;

  return (
    <PointView
      outline={outline}
      point={point}
      onNavigateNext={
        !isLastPoint
          ? () =>
              navigate({
                kind: "point",
                outlineIndex: selection.outlineIndex,
                pointIndex: selection.pointIndex + 1,
              })
          : nextOutline
          ? () =>
              navigate({
                kind: "summary",
                outlineIndex: selection.outlineIndex + 1,
              })
          : undefined
      }
      nextOutline={
        nextOutline
          ? {
              number: nextOutline.number,
              title: nextOutline.title,
              onNavigate: () =>
                navigate({
                  kind: "summary",
                  outlineIndex: selection.outlineIndex + 1,
                }),
            }
          : undefined
      }
    />
  );
}

// ── Landing page ──────────────────────────────────────────────────────────

const TOPICS = [
  { n: 1,  label: "The Bible",          sub: "The Word of God" },
  { n: 2,  label: "God",                sub: "His nature & attributes" },
  { n: 3,  label: "Jesus Christ",       sub: "The Son of God" },
  { n: 4,  label: "The Holy Spirit",    sub: "His person & work" },
  { n: 5,  label: "Sin",                sub: "Its nature & consequences" },
  { n: 6,  label: "Judgments",          sub: "God's justice" },
  { n: 7,  label: "Rewards",            sub: "Faithful living" },
  { n: 8,  label: "The Church",         sub: "The body of Christ" },
  { n: 9,  label: "Prayer",             sub: "Communicating with God" },
  { n: 10, label: "Faith",              sub: "Trust & assurance" },
  { n: 11, label: "The Abundant Life",  sub: "Living fully in Christ" },
  { n: 12, label: "Repentance",         sub: "Turning back to God" },
  { n: 13, label: "The New Birth",      sub: "Born again" },
  { n: 14, label: "God's Plan",         sub: "Salvation explained" },
  { n: 15, label: "Witnessing",         sub: "Sharing your faith" },
];

function LandingPage({ navigate }: { navigate: Navigate }) {
  const firstOutlineIdx = 0;
  const introSectionIdx = doc.front_matter.findIndex((s) =>
    /What the Christian Life/i.test(s.title)
  );

  return (
    <div className="landing">
      {/* Hero — mirrors the PDF cover */}
      <div className="landing-hero">
        <div className="landing-rule" />
        <h1 className="landing-title">The Christian Life<br />New Testament</h1>
        <p className="landing-subtitle">Fifteen Master Outlines</p>
        <div className="landing-rule" />
        <p className="landing-compiler">Compiled by {doc.compiler}</p>
        <p className="landing-edition">{doc.edition}</p>
      </div>

      {/* Modern pitch */}
      <div className="landing-pitch">
        <div className="landing-pitch-grid">
          <div className="landing-pitch-card">
            <span className="landing-pitch-icon">📖</span>
            <strong>Doctrine made clear</strong>
            <p>15 structured studies on the core beliefs of the Christian faith — from the Bible's authority to witnessing — built directly from scripture.</p>
          </div>
          <div className="landing-pitch-card">
            <span className="landing-pitch-icon">🔗</span>
            <strong>Every verse at your fingertips</strong>
            <p>Tap any scripture reference to read the passage in the NLT, with surrounding context and a full-chapter view.</p>
          </div>
          <div className="landing-pitch-card">
            <span className="landing-pitch-icon">🧭</span>
            <strong>Designed to be followed in order</strong>
            <p>Each outline builds on the last. Start with Outline 1 and follow the links — the path is laid out for you.</p>
          </div>
        </div>
      </div>

      {/* Topic grid */}
      <div className="landing-topics">
        <h2 className="landing-section-heading">The 15 Outlines</h2>
        <div className="landing-topic-grid">
          {TOPICS.map((t) => {
            const outlineIdx = doc.outlines.findIndex((o) => o.number === t.n);
            return (
              <button
                key={t.n}
                className="landing-topic-card"
                onClick={() => navigate({ kind: "summary", outlineIndex: outlineIdx })}
              >
                <span className="landing-topic-num">{t.n}</span>
                <span className="landing-topic-label">{t.label}</span>
                <span className="landing-topic-sub">{t.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CTAs */}
      <div className="landing-ctas">
        <button
          className="nav-btn landing-cta-primary"
          onClick={() => navigate({ kind: "summary", outlineIndex: firstOutlineIdx })}
        >
          Start with Outline 1 →
        </button>
        {introSectionIdx >= 0 && (
          <button
            className="landing-cta-secondary"
            onClick={() => navigate({ kind: "front", sectionIndex: introSectionIdx })}
          >
            Read Porter Barrington's introduction
          </button>
        )}
      </div>

      <p className="landing-copyright">{doc.source_copyright_notice}</p>
    </div>
  );
}

function FrontMatterView({
  section,
  navigate,
}: {
  section: FrontMatterSection;
  navigate: Navigate;
}) {
  // Special-case: render the Index of Master Outlines as a clickable list.
  const isIndex =
    section.kind === "blob" && /Index of Master Outlines/i.test(section.title);

  return (
    <article className="point">
      <header className="point-header">
        <h2>{section.title}</h2>
      </header>
      {section.kind === "blob" ? (
        isIndex ? (
          <IndexBlob text={section.text} navigate={navigate} />
        ) : (
          <BlobText text={section.text} />
        )
      ) : (
        section.body.map((b, i) => <PointView.Block key={i} block={b} />)
      )}
    </article>
  );
}

/** Renders the "Index of Master Outlines" blob as a clickable list of
 *  outlines. Lines matching `^\s*<N>\. <title>` become buttons that navigate
 *  to outline N's summary. Other lines render as-is. */
function IndexBlob({ text, navigate }: { text: string; navigate: Navigate }) {
  const lines = text.split("\n");
  return (
    <div className="blob-text index-blob">
      {lines.map((line, i) => {
        const match = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
        if (match) {
          const num = parseInt(match[2], 10);
          const outlineIdx = doc.outlines.findIndex((o) => o.number === num);
          if (outlineIdx >= 0) {
            return (
              <p key={i} className="blob-paragraph">
                <span className="index-leader">{match[1]}{match[2]}.</span>{" "}
                <button
                  className="link-button index-link"
                  onClick={() =>
                    navigate({ kind: "summary", outlineIndex: outlineIdx })
                  }
                >
                  {match[3]}
                </button>
              </p>
            );
          }
        }
        // Blank lines and headers render as paragraphs / spacers.
        return (
          <p key={i} className="blob-paragraph">
            {line || " "}
          </p>
        );
      })}
    </div>
  );
}

function BlobText({ text, stripNavHints = false }: { text: string; stripNavHints?: boolean }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="blob-text">
      {paragraphs.map((p, i) => {
        const lines = p.split("\n").filter(
          (line) => !(stripNavHints && /^\s*\(Now turn to /i.test(line))
        );
        if (lines.every((l) => !l.trim())) return null;
        return (
          <p key={i} className="blob-paragraph">
            {lines.map((line, j, arr) => (
              <span key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

// ---------- search ----------

function filterOutlines(
  outlines: Outline[],
  query: string,
): { outline: Outline; originalIndex: number }[] {
  const q = query.trim().toLowerCase();
  const tagged = outlines.map((outline, originalIndex) => ({ outline, originalIndex }));
  if (!q) return tagged;
  return tagged
    .map(({ outline, originalIndex }) => {
      const matchedPoints = outline.points.filter((p) => pointMatches(p, q));
      if (
        matchedPoints.length > 0 ||
        outline.title.toLowerCase().includes(q) ||
        (outline.summary?.toLowerCase().includes(q) ?? false)
      ) {
        return { outline: { ...outline, points: matchedPoints.length > 0 ? matchedPoints : outline.points }, originalIndex };
      }
      return null;
    })
    .filter((x): x is { outline: Outline; originalIndex: number } => x !== null);
}

function pointMatches(p: Point, q: string): boolean {
  if (p.primary_reference.display.toLowerCase().includes(q)) return true;
  for (const block of p.body) {
    for (const run of block.runs) {
      if ("v" in run && run.v.toLowerCase().includes(q)) return true;
      if (run.t === "ref" && run.display.toLowerCase().includes(q)) return true;
    }
  }
  return false;
}

function selectionInOutline(selection: Selection, outlineIndex: number): boolean {
  return (
    (selection.kind === "point" && selection.outlineIndex === outlineIndex) ||
    (selection.kind === "summary" && selection.outlineIndex === outlineIndex)
  );
}
