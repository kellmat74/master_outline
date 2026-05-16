import { useEffect, useRef, useState } from "react";
import { fetchPassage, fetchChapter } from "../lib/nlt";
import type { Reference } from "../types";

type Mode = "passage" | "chapter";

type FetchState =
  | { status: "loading" }
  | { status: "ok"; header: string; verses: { number: number; text: string; cited: boolean }[] }
  | { status: "error"; message: string };

interface Props {
  reference: Reference;
  onClose: () => void;
}

export default function VersePopup({ reference, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("passage");
  const [state, setState] = useState<FetchState>({ status: "loading" });

  const dialogRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const firstCitedRef = useRef<HTMLParagraphElement>(null);

  // Fetch whenever reference or mode changes
  useEffect(() => {
    setState({ status: "loading" });
    let cancelled = false;
    const fetcher = mode === "chapter" ? fetchChapter : fetchPassage;
    fetcher(reference)
      .then((p) => {
        if (!cancelled)
          setState({ status: "ok", header: p.header, verses: p.verses });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Failed to load.",
          });
      });
    return () => { cancelled = true; };
  }, [reference, mode]);

  // After chapter loads, scroll body so first cited verse is near the top
  useEffect(() => {
    if (mode === "chapter" && state.status === "ok") {
      setTimeout(() => {
        firstCitedRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
      }, 60);
    }
  }, [mode, state.status]);

  // Focus dialog on open
  useEffect(() => { dialogRef.current?.focus(); }, []);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const bookChapter = `${reference.book} ${reference.chapter}`;

  return (
    <div className="verse-backdrop" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        className={`verse-dialog${mode === "chapter" ? " verse-dialog--chapter" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Scripture: ${reference.display}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="verse-dialog-header">
          <span className="verse-dialog-ref">
            {mode === "chapter" ? bookChapter : reference.display}
          </span>
          <span className="verse-dialog-translation">NLT</span>
          <button className="verse-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className="verse-dialog-body" ref={bodyRef}>
          {state.status === "loading" && (
            <p className="verse-loading">Loading…</p>
          )}
          {state.status === "error" && (
            <p className="verse-error">{state.message}</p>
          )}
          {state.status === "ok" && (
            <>
              <p className="verse-api-header">{state.header}</p>
              <div className="verse-list">
                {state.verses.map((v, i) => {
                  const isFirstCited = v.cited && state.status === "ok" &&
                    !state.verses.slice(0, i).some((vv) => vv.cited);
                  return (
                    <p
                      key={v.number}
                      ref={isFirstCited ? firstCitedRef : undefined}
                      className={`verse-row${v.cited ? " cited" : " context"}`}
                    >
                      <span className="verse-num">{v.number}</span>
                      <span className="verse-text">{v.text}</span>
                    </p>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="verse-dialog-footer">
          {mode === "passage" ? (
            <button
              className="verse-expand-btn"
              onClick={() => setMode("chapter")}
            >
              View full chapter ({bookChapter})
            </button>
          ) : (
            <button
              className="verse-expand-btn"
              onClick={() => {
                setMode("passage");
                bodyRef.current?.scrollTo({ top: 0 });
              }}
            >
              ← Back to {reference.display}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
