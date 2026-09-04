import { App, TFile, getIconIds, setIcon } from "obsidian";

export type IconRef =
  | { kind: "svg"; name: string }
  | { kind: "lucide"; id: string }
  | { kind: "emoji"; char: string };

export function normalizeFolder(raw: string): string {
  return raw.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

/** Vault SVG Pfad ohne Endung, z.B. "devicon/proxmox". Null bei Pfad Tricks. */
export function normalizeSvgName(raw: string): string | null {
  let name = raw.trim().replace(/^\/+/, "");
  if (!name || name.includes("..")) return null;
  if (name.toLowerCase().endsWith(".svg")) name = name.slice(0, -4);
  if (!name || !/^[A-Za-z0-9_\-/]+$/.test(name)) return null;
  return name;
}

/**
 * Referenz Formen:
 * - "ordner/name" oder "name" -> eigene SVG Datei im Icon Ordner
 * - "lucide:folder" -> eingebautes Obsidian Icon, keine Datei nötig
 * - "emoji:📁" -> Geräte Emoji, keine Datei nötig
 */
export function parseIconRef(raw: string): IconRef | null {
  const text = raw.trim().replace(/^\/+/, "");
  if (!text || text.includes("..")) return null;
  if (text.startsWith("lucide:")) {
    const id = text.slice("lucide:".length).trim();
    return id && /^[A-Za-z0-9-]+$/.test(id) ? { kind: "lucide", id } : null;
  }
  if (text.startsWith("emoji:")) {
    const char = text.slice("emoji:".length);
    return char ? { kind: "emoji", char } : null;
  }
  const name = normalizeSvgName(text);
  return name ? { kind: "svg", name } : null;
}

/** Marken Icons behalten Originalfarben, dort greift keine Farbwahl. */
export function isBrandSvg(ref: IconRef): boolean {
  return (
    ref.kind === "svg" &&
    (ref.name.startsWith("devicon/") || ref.name.startsWith("simple/"))
  );
}

export function parseSize(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (/^[0-9]+(\.[0-9]+)?$/.test(raw)) return `${raw}px`;
  if (/^[0-9]+(\.[0-9]+)?(px|em|rem|%|pt)$/.test(raw)) return raw;
  return undefined;
}

/** Minimaler Schutz für eigene Vault Dateien, kein Ersatz für volle Sanitizer. */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "")
    .replace(/javascript\s*:/gi, "");
}

export const THEME_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "gray",
] as const;

/** Theme Name -> CSS Variable, Hex und CSS Farben direkt, sonst null. */
export function themeVar(color: string | undefined): string | null {
  if (!color) return null;
  const name = color.trim().toLowerCase();
  if ((THEME_COLORS as readonly string[]).includes(name)) {
    return `var(--color-${name})`;
  }
  try {
    if (CSS.supports("color", color)) return color;
  } catch {
    return null;
  }
  return null;
}

export class IconStore {
  private cache = new Map<string, string>();

  constructor(
    private app: App,
    private getFolder: () => string,
  ) {}

  private filePath(name: string): string {
    return `${normalizeFolder(this.getFolder())}/${name}.svg`;
  }

  async getSvg(name: string): Promise<string | null> {
    const path = this.filePath(name);
    const hit = this.cache.get(path);
    if (hit !== undefined) return hit;
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof TFile)) return null;
      const raw = await this.app.vault.read(file);
      if (!raw.includes("<svg")) return null;
      const clean = sanitizeSvg(raw);
      this.cache.set(path, clean);
      return clean;
    } catch {
      return null;
    }
  }

  /** Alle SVGs im Icon Ordner, relativ und ohne Endung, sortiert. */
  async listSvgNames(): Promise<string[]> {
    const folder = normalizeFolder(this.getFolder());
    const prefix = folder + "/";
    return this.app.vault
      .getFiles()
      .filter((f) => f.path.startsWith(prefix) && f.extension === "svg")
      .map((f) => f.path.slice(prefix.length, -".svg".length))
      .filter((n) => /^[A-Za-z0-9_\-/]+$/.test(n))
      .sort((a, b) => a.localeCompare(b));
  }

  lucideIds(): string[] {
    try {
      return getIconIds();
    } catch {
      return [];
    }
  }

  handlesPath(path: string): boolean {
    const folder = normalizeFolder(this.getFolder());
    return path === folder || path.startsWith(folder + "/");
  }

  invalidatePath(path: string): void {
    if (!this.handlesPath(path)) return;
    if (path.toLowerCase().endsWith(".svg")) {
      this.cache.delete(path);
    } else {
      this.clear();
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export function renderMissing(el: HTMLElement, label: string): void {
  el.addClass("obsidian-icon-missing");
  el.setAttribute("title", `Icon nicht gefunden: ${label}`);
  el.textContent = `[${label}]`;
  console.warn(`[inline-svg-icons] nicht gefunden: ${label}`);
}

/**
 * Malt eine Referenz in ein span. Ergänzt die Klasse obsidian-icon-inline,
 * vorhandene Klassen bleiben. Fehlende Icons zeigen einen Platzhalter.
 */
export async function renderIconInto(
  el: HTMLElement,
  ref: IconRef,
  store: IconStore,
  opts?: { size?: string; color?: string },
): Promise<void> {
  el.addClass("obsidian-icon-inline");
  const label =
    ref.kind === "svg" ? ref.name : ref.kind === "lucide" ? ref.id : ref.char;
  const color = !isBrandSvg(ref) ? themeVar(opts?.color) : null;
  if (opts?.size) {
    el.style.width = opts.size;
    el.style.height = opts.size;
  }

  if (ref.kind === "emoji") {
    el.textContent = ref.char;
    return;
  }

  if (ref.kind === "lucide") {
    el.empty();
    setIcon(el, ref.id);
    const svgEl = el.querySelector("svg");
    if (!svgEl) {
      el.empty();
      renderMissing(el, `lucide:${label}`);
      return;
    }
    if (color) el.style.color = color;
    if (opts?.size) {
      svgEl.setAttribute("width", opts.size);
      svgEl.setAttribute("height", opts.size);
    }
    return;
  }

  const svg = await store.getSvg(ref.name);
  if (!svg) {
    renderMissing(el, label);
    return;
  }
  el.innerHTML = svg;
  const svgEl = el.querySelector("svg");
  if (!svgEl) {
    el.empty();
    renderMissing(el, label);
    return;
  }
  if (color) el.style.color = color;
  if (
    !isBrandSvg(ref) &&
    !svgEl.hasAttribute("fill") &&
    !svgEl.hasAttribute("stroke")
  ) {
    svgEl.setAttribute("fill", "currentColor");
  }
  if (opts?.size) {
    svgEl.setAttribute("width", opts.size);
    svgEl.setAttribute("height", opts.size);
  }
}
