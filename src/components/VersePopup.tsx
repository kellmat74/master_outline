import { useEffect, useRef, useState } from "react";
import { fetchPassage } from "../lib/nlt";
import type { Reference } from "../types";

interface Props {
  reference: Reference;
  onClose: () => void;
}

export default function VersePopup({ reference, onClose }: Props) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "ok"; header: string; verses: { number: number; text: string; cited: boolean }[] }
    | { status: "error"; message: string }
  >({ status: "loading" });

  const dialogRef = useRef<HTMLDivElement>(null);

  // Fetch on mount / reference change
  useEffect(() => {
    setState({ status: "loading" });
    let cancelled = false;
    fetchPassage(reference)
      .then((p) => {
        if (!cancelled)
          setState({ status: "ok", header: p.header, verses: p.verses });
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "Failed to load verse.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  // Trap focus inside the dialog
  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  // Esc to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent background scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    // Backdrop
    <div
      className="verse-backdrop"
      onClick={onClose}
      role="presentation"
    >
      {/* Dialog — stop clicks from reaching backdrop */}
      <div
        ref={dialogRef}
        className="verse-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Scripture: ${reference.display}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="verse-dialog-header">
          <span className="verse-dialog-ref">{reference.display}</span>
          <span className="verse-dialog-translation">NLT</span>
          <button
            className="verse-close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="verse-dialog-body">
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
                {state.verses.map((v) => (
                  <p
                    key={v.number}
                    className={`verse-row${v.cited ? " cited" : " context"}`}
                  >
                    <span className="verse-num">{v.number}</span>
                    <span className="verse-text">{v.text}</span>
                  </p>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
