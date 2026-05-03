import type { Block, Outline, Point, Run } from "../types";

interface Props {
  outline: Outline;
  point: Point;
}

export default function PointView({ outline, point }: Props) {
  return (
    <article className="point">
      <header className="point-header">
        <p className="outline-breadcrumb">
          Outline {outline.number}
          {outline.title ? ` — ${outline.title}` : ""}
        </p>
        <h2>
          {point.roman}
          {point.letter && point.letter !== "A" ? `(${point.letter})` : "(A)"}{" "}
          <span className="primary-ref">
            <RunView run={{ t: "ref", ...point.primary_reference }} />
          </span>
        </h2>
        <p className="source-pages">printed page {point.source_page}</p>
      </header>

      <div className="point-body">
        {point.body.map((block, i) => (
          <PointView.Block key={i} block={block} />
        ))}
      </div>

      {point.transition && (
        <footer className="transition">
          <p>{point.transition.raw}</p>
        </footer>
      )}
    </article>
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
  switch (run.t) {
    case "text":
      return <>{run.v}</>;
    case "italic":
      return <em>{run.v}</em>;
    case "smallcaps":
      return <span className="smallcaps">{run.v}</span>;
    case "ref":
      return (
        <em
          className="scripture-ref"
          title={`${run.book} ${run.chapter}:${run.verses}${run.testament ? ` (${run.testament})` : ""}`}
        >
          {run.display}
          {run.testament ? ` (${run.testament})` : ""}
        </em>
      );
  }
}
