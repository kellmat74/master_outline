import { useMemo, useState } from "react";
import data from "../data/master_outlines.json";
import type { Document, FrontMatterSection, Outline, Point, Reference } from "./types";
import PointView from "./components/PointView";
import VersePopup from "./components/VersePopup";
import { VerseContext } from "./VerseContext";

const doc = data as Document;

export type Selection =
  | { kind: "front"; sectionIndex: number }
  | { kind: "summary"; outlineIndex: number }
  | { kind: "point"; outlineIndex: number; pointIndex: number }
  | { kind: "empty" };

export type Navigate = (s: Selection) => void;

export default function App() {
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeVerse, setActiveVerse] = useState<Reference | null>(null);
  const [selection, setSelection] = useState<Selection>(() =>
    doc.front_matter.length > 0
      ? { kind: "front", sectionIndex: 0 }
      : doc.outlines.length > 0
      ? { kind: "summary", outlineIndex: 0 }
      : { kind: "empty" },
  );

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
          <h1>{doc.title}</h1>
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
        <BlobText text={outline.summary ?? ""} />
        {outline.points.length > 0 && (
          <footer className="transition">
            <p>
              Begin study with point I:{" "}
              <button
                className="link-button"
                onClick={() =>
                  navigate({
                    kind: "point",
                    outlineIndex: selection.outlineIndex,
                    pointIndex: 0,
                  })
                }
              >
                {outline.points[0].primary_reference.display}
              </button>
            </p>
          </footer>
        )}
      </article>
    );
  }

  const outline = doc.outlines[selection.outlineIndex];
  const point = outline.points[selection.pointIndex];
  return (
    <PointView
      outline={outline}
      point={point}
      onNavigateNext={
        selection.pointIndex + 1 < outline.points.length
          ? () =>
              navigate({
                kind: "point",
                outlineIndex: selection.outlineIndex,
                pointIndex: selection.pointIndex + 1,
              })
          : selection.outlineIndex + 1 < doc.outlines.length
          ? () =>
              navigate({
                kind: "summary",
                outlineIndex: selection.outlineIndex + 1,
              })
          : undefined
      }
    />
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

function BlobText({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/);
  return (
    <div className="blob-text">
      {paragraphs.map((p, i) => (
        <p key={i} className="blob-paragraph">
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
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
