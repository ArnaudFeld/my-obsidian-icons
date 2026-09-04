import { App, TFile } from "obsidian";
import { parseIconRef, parseSize, themeVar } from "./icons";

export interface FrontmatterIcon {
  icon: string;
  color?: string;
  size?: string;
  iconDark?: string;
}

/**
 * Liest icon, iconColor, iconSize und iconDark aus dem Frontmatter.
 * Gilt nur für diese Notiz und gewinnt gegen Mapping und Regeln.
 */
export function readFrontmatterIcon(
  app: App,
  file: TFile | null,
): FrontmatterIcon | null {
  if (!file) return null;
  const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
  if (!frontmatter || typeof frontmatter.icon !== "string") return null;
  if (!parseIconRef(frontmatter.icon)) return null;
  const out: FrontmatterIcon = { icon: frontmatter.icon.trim() };
  if (
    typeof frontmatter.iconColor === "string" &&
    themeVar(frontmatter.iconColor)
  ) {
    out.color = frontmatter.iconColor.trim();
  }
  if (typeof frontmatter.iconSize === "string") {
    const size = parseSize(frontmatter.iconSize.trim());
    if (size) out.size = size;
  }
  if (
    typeof frontmatter.iconDark === "string" &&
    parseIconRef(frontmatter.iconDark)
  ) {
    out.iconDark = frontmatter.iconDark.trim();
  }
  return out;
}
