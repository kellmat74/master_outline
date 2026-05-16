import type { Block, Outline, Point, Reference, Run } from "../types";
import { useOpenVerse } from "../VerseContext";

interface Props {
  outline: Outline;
  point: Point;
  /** When set, the closing transition becomes a clickable link to the next
   *  point (or, on the last point of an outline, the next outline's overview). */
  onNavigateNext?: () => void;
  /** When set (last point of an outline), renders a "Next lesson" nav button. */
  nextOutline?: { number: number; title: string; onNavigate: () => void };
}

export default function PointView({ outline, point, onNavigateNext, nextOutline }: Props) {
  return (
    <article className="point">
      <header className="point-header">
        <p className="outline-breadcrumb">
          Outline {outline.number}
          {outline.title ? ` — ${outline.title}` : ""}
        </p>
        <h2>
          {point.roman}{" "}
          <span className="primary-ref">
            <RunView run={{ t: "ref", ...point.primary_reference }} />
          </span>
        </h2>
      </header>

      <div className="point-body">
        {point.body.map((block, i) => (
          <PointView.Block key={i} block={block} />
        ))}
      </div>

      {point.transition && (
        <footer className="transition">
          <p>
            <TransitionLink
              transition={point.transition}
              onNavigate={onNavigateNext}
            />
          </p>
        </footer>
      )}

      {nextOutline && (
        <div className="nav-footer">
          <button className="nav-btn" onClick={nextOutline.onNavigate}>
            Next Lesson — Outline {nextOutline.number}: {nextOutline.title} →
          </button>
        </div>
      )}
    </article>
  );
}

function TransitionLink({
  transition,
  onNavigate,
}: {
  transition: NonNullable<Point["transition"]>;
  onNavigate?: () => void;
}) {
  const { raw, next_reference, next_title } = transition;

  if (!onNavigate) {
    return <>{raw}</>;
  }

  // Try to surface the reference and title as clickable spans within the raw
  // string so the rest of the wording ("Now turn to ...") is preserved.
  const refIdx = raw.indexOf(next_reference.display);
  const titleIdx = raw.indexOf(next_title);

  // If we can't find the substrings, fall back to a single button covering
  // the whole sentence.
  if (refIdx < 0 || titleIdx < 0) {
    return (
      <button className="link-button transition-link" onClick={onNavigate}>
        {raw}
      </button>
    );
  }

  // Build three spans: ref-clickable, between, title-clickable.
  // We assume ref appears before title (always the case in this work).
  const beforeRef = raw.slice(0, refIdx);
  const refText = raw.slice(refIdx, refIdx + next_reference.display.length);
  const betweenRefAndTitle = raw.slice(
    refIdx + next_reference.display.length,
    titleIdx,
  );
  const titleText = raw.slice(titleIdx, titleIdx + next_title.length);
  const afterTitle = raw.slice(titleIdx + next_title.length);

  return (
    <>
      {beforeRef}
      <button className="link-button transition-link" onClick={onNavigate}>
        {refText}
      </button>
      {betweenRefAndTitle}
      <button className="link-button transition-link" onClick={onNavigate}>
        {titleText}
      </button>
      {afterTitle}
    </>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="paragraph">
          <RunsView runs={block.runs} />
        </p>
      );
    case "subpoint":
      return (
        <p className="subpoint">
          <span className="subpoint-label">{block.label}</span>{" "}
          <RunsView runs={block.runs} />
        </p>
      );
    case "quote":
      return (
        <blockquote className="quote">
          <RunsView runs={block.runs} />
        </blockquote>
      );
  }
}

PointView.Block = BlockView;

function RunsView({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((run, i) => (
        <RunView key={i} run={run} />
      ))}
    </>
  );
}

function RunView({ run }: { run: Run }) {
  const openVerse = useOpenVerse();
  switch (run.t) {
    case "text":
      return <>{run.v}</>;
    case "italic":
      return <em>{run.v}</em>;
    case "smallcaps":
      return <span className="smallcaps">{run.v}</span>;
    case "ref": {
      const ref: Reference = {
        display: run.display,
        book: run.book,
        book_abbrev: run.book_abbrev,
        chapter: run.chapter,
        verses: run.verses,
        ...(run.testament ? { testament: run.testament } : {}),
      };
      return (
        <button
          className="scripture-ref-btn"
          onClick={() => openVerse(ref)}
          title={`Open ${run.display} in NLT`}
        >
          {run.display}
        </button>
      );
    }
  }
}
