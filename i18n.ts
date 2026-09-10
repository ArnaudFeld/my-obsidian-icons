import { getLanguage } from "obsidian";

/** Slogan je Sprache, alle anderen Sprachen fallen auf Englisch zurück. */
const SLOGANS: Record<string, string> = {
  en: "Local, lightweight, yours.",
  de: "Lokal, leicht, deins.",
  fr: "Local, léger, à vous.",
  es: "Local, ligero, tuyo.",
};

/**
 * ISO Code der eingestellten App Sprache, ohne Regionsanteil.
 * Ältere Obsidian Versionen kennen getLanguage nicht, dann gilt Englisch.
 */
export function currentLanguage(): string {
  try {
    if (typeof getLanguage !== "function") return "en";
    const raw = getLanguage();
    if (typeof raw !== "string" || raw.length === 0) return "en";
    return raw.toLowerCase().split("-")[0];
  } catch {
    return "en";
  }
}

/** Slogan in der Sprache der App. */
export function slogan(): string {
  return SLOGANS[currentLanguage()] ?? SLOGANS.en;
}
