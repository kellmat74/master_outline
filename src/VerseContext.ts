import { createContext, useContext } from "react";
import type { Reference } from "./types";
import type { TranslationId } from "./lib/verses";
import { DEFAULT_TRANSLATION } from "./lib/verses";

export type OpenVerse = (ref: Reference) => void;

export interface VerseContextValue {
  openVerse: OpenVerse;
  translation: TranslationId;
  setTranslation: (t: TranslationId) => void;
}

export const VerseContext = createContext<VerseContextValue>({
  openVerse: () => {},
  translation: DEFAULT_TRANSLATION,
  setTranslation: () => {},
});

export function useVerseContext(): VerseContextValue {
  return useContext(VerseContext);
}

/** Convenience hook — keeps call sites that only need openVerse unchanged. */
export function useOpenVerse(): OpenVerse {
  return useContext(VerseContext).openVerse;
}
