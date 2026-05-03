import { useMemo, useState } from "react";
import data from "../data/master_outlines.json";
import type { Document, FrontMatterSection, Outline, Point } from "./types";
import PointView from "./components/PointView";

const doc = data as Document;

type Selection =
  | { kind: "front"; sectionIndex: number }
  | { kind: "summary"; outlineIndex: number }
  | { kind: "point"; outlineIndex: number; pointIndex: number }
  | { kind: "empty" };

export default function App() {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Selection>(() =>
    doc.front_matter.length > 0
      ? { kind: "front", sectionIndex: 0 }
      : doc.outlines.length > 0
      ? { kind: "summary", outlineIndex: 0 }
      : { kind: "empty" },
  );

  const filtered = useMemo(() => filterOutlines(doc.outlines, query), [query]);

  return (
    <div className="app">
      <aside className="sidebar">
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
                    onClick={() => setSelection({ kind: "front", sectionIndex: i })}
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
                            setSelection({
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
                            setSelection({
                              kind: "point",
                              outlineIndex: originalIndex,
                              pointIndex: pi,
                            })
                          }
                        >
                          {p.roman}
                          {p.letter && p.letter !== "A" ? `(${p.letter})` : ""} —{" "}
                          {p.primary_reference.display}
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
        <SelectionView selection={selection} />
      </main>
    </div>
  );
}

function SelectionView({ selection }: { selection: Selection }) {
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
    return <FrontMatterView section={section} />;
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
      </article>
    );
  }

  const outline = doc.outlines[selection.outlineIndex];
  const point = outline.points[selection.pointIndex];
  return <PointView outline={outline} point={point} />;
}

function FrontMatterView({ section }: { section: FrontMatterSection }) {
  return (
    <article className="point">
      <header className="point-header">
        <h2>{section.title}</h2>
      </header>
      {section.kind === "blob" ? (
        <BlobText text={section.text} />
      ) : (
        section.body.map((b, i) => <PointView.Block key={i} block={b} />)
      )}
    </article>
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
