import { createContext, useContext } from "react";
import type { Reference } from "./types";

export type OpenVerse = (ref: Reference) => void;

export const VerseContext = createContext<OpenVerse>(() => {});

export function useOpenVerse(): OpenVerse {
  return useContext(VerseContext);
}
