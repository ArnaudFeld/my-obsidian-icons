import { App, TFile, getIconIds, setIcon } from "obsidian";

export type IconRef =
  | { kind: "svg"; name: string }
  | { kind: "lucide"; id: string }
  | { kind: "emoji"; char: string };

export function normalizeFolder(raw: string): string {
  return raw
    .trim()
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

/** Dunkles Theme aktiv, ein Testpunkt für alle Stellen. */
export function isDarkTheme(): boolean {
  return document.body.classList.contains("theme-dark");
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

/**
 * Devicon Dateien sind oft mehrfarbig mit festem fill. Einfarbige lassen
 * sich trotzdem umfärben, mehrfarbige bleiben unangetastet.
 */
export function isBrandSvg(ref: IconRef): boolean {
  return ref.kind === "svg" && ref.name.startsWith("devicon/");
}

/** Theme Variable zu konkretem rgb auflösen, für SVG Attribute nötig. */
const resolveCache = new Map<string, string>();

export function resolveColor(color: string): string {
  if (!color.startsWith("var(")) return color;
  const key = `${isDarkTheme() ? "dark" : "light"}|${color}`;
  const hit = resolveCache.get(key);
  if (hit !== undefined) return hit;
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  const out = rgb || color;
  if (resolveCache.size > 500) resolveCache.clear();
  resolveCache.set(key, out);
  return out;
}

/**
 * Färbt ein SVG um, nur wenn es effektiv einfarbig ist: genau eine
 * fill oder stroke Farbe, kein Verlauf. Mehrfarbiges bleibt wie es ist.
 */
function recolorSingle(svgEl: SVGSVGElement, color: string): void {
  const all: Element[] = [svgEl, ...Array.from(svgEl.querySelectorAll("*"))];
  const fills = new Set<string>();
  const strokes = new Set<string>();
  for (const node of all) {
    const el = node as SVGElement;
    const fill = (el.getAttribute("fill") ?? el.style.fill ?? "").trim().toLowerCase();
    const stroke = (el.getAttribute("stroke") ?? el.style.stroke ?? "").trim().toLowerCase();
    for (const [value, set] of [[fill, fills], [stroke, strokes]] as const) {
      if (!value || value === "none" || value === "transparent" || value === "currentcolor") continue;
      if (value.startsWith("url(")) return;
      set.add(value);
    }
  }
  const concrete = resolveColor(color);
  const repaint = (kind: "fill" | "stroke", from: string) => {
    for (const node of all) {
      const el = node as SVGElement;
      if ((el.getAttribute(kind) ?? "").trim().toLowerCase() === from) {
        el.setAttribute(kind, concrete);
      }
      const inline = kind === "fill" ? el.style.fill : el.style.stroke;
      if (inline && inline.trim().toLowerCase() === from) {
        if (kind === "fill") el.style.fill = concrete;
        else el.style.stroke = concrete;
      }
    }
  };
  if (fills.size === 1) {
    const only = [...fills][0];
    repaint("fill", only);
    repaint("stroke", only);
  } else if (fills.size === 0 && strokes.size === 1) {
    const only = [...strokes][0];
    repaint("stroke", only);
  }
}

export function parseSize(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (/^[0-9]+(\.[0-9]+)?$/.test(raw)) return `${raw}px`;
  if (/^[0-9]+(\.[0-9]+)?(px|em|rem|%|pt)$/.test(raw)) return raw;
  return undefined;
}

/** Zahlen Entities auflösen, nur zur Prüfung von Attribut Werten. */
const NAMED_ENTITIES: Record<string, string> = {
  colon: ":",
  semi: ";",
  lpar: "(",
  rpar: ")",
  tab: "\t",
  newline: "\n",
  nbsp: " ",
  quot: '"',
  amp: "&",
  lt: "<",
  gt: ">",
  sol: "/",
};

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_m, hex: string) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&#([0-9]+);?/g, (_m, dec: string) =>
      String.fromCharCode(parseInt(dec, 10)),
    )
    .replace(/&([a-z]+);?/gi, (_m, name: string) => {
      const hit = NAMED_ENTITIES[name.toLowerCase()];
      return hit === undefined ? _m : hit;
    });
}

/** CSS Säuberung für style Blöcke und Attribute, Verläufe mit url(#) bleiben. */
function cleanCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/@import[^;]+;?/gi, "")
    .replace(/url\s*\(\s*(?!#)([^)]*)\)/gi, "")
    .replace(/expression\s*\(/gi, "(")
    .replace(/behaviou?r\s*:/gi, ":");
}

/** Minimaler Schutz für eigene Vault Dateien, kein Ersatz für volle Sanitizer. */
export function sanitizeSvg(svg: string): string {
  return svg
    .replace(/<script[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*>/gi, "")
    .replace(/<\/script\s*>/gi, "")
    .replace(/<foreignobject\b[^>]*\/>/gi, "")
    .replace(/<foreignobject\b[\s\S]*?<\/foreignobject\s*>/gi, "")
    .replace(/<foreignobject\b[\s\S]*$/gi, "")
    .replace(/<(iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "")
    .replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_m, css: string) => {
      return `<style>${cleanCss(css)}</style>`;
    })
    .replace(/[\s/'"]on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(
      /[\s/'"]style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
      (_m, raw: string) => {
        const quote = raw[0] === '"' || raw[0] === "'" ? raw[0] : "";
        const body = quote ? raw.slice(1, -1) : raw;
        return ` style=${quote}${cleanCss(body)}${quote}`;
      },
    )
    .replace(
      /[\s/'"](xlink:href|href|src|srcset|to|from|by|values)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
      (m, attr: string, raw: string) => {
        const value = decodeEntities(raw.replace(/^['"]|['"]$/g, ""))
          .trim()
          .toLowerCase();
        if (value.startsWith("#")) return m;
        const name = attr.toLowerCase();
        if (
          (name === "to" || name === "from" || name === "by" || name === "values") &&
          !value.includes(":")
        ) {
          return m;
        }
        return "";
      },
    )
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

/** Theme Namen ohne eigene --color-* Variable brauchen einen Ersatz. */
const THEME_VAR_FALLBACK: Record<string, string> = {
  gray: "--color-base-70",
};

/** Theme Name -> CSS Variable, Hex und CSS Farben direkt, sonst null. */
export function themeVar(color: string | undefined): string | null {
  if (!color) return null;
  const name = color.trim().toLowerCase();
  if ((THEME_COLORS as readonly string[]).includes(name)) {
    return `var(${THEME_VAR_FALLBACK[name] ?? `--color-${name}`})`;
  }
  try {
    if (CSS.supports("color", color)) return color;
  } catch {
    return null;
  }
  return null;
}

function luminance(rgb: string): number | null {
  const m = /rgba?\(([^)]+)\)/.exec(rgb);
  if (!m) return null;
  const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
  if (parts.length < 3 || parts.some((v) => Number.isNaN(v))) return null;
  const [r, g, b] = parts.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Kontrast der Farbe zum Theme Hintergrund als Verhältnis, z.B. 4.5.
 * Null wenn nicht bestimmbar. Für die Warnung im Picker.
 * Ergebnisse je Farbe zwischengespeichert, eine DOM Sonde pro Farbe reicht.
 */
const contrastCache = new Map<string, number | null>();

export function contrastOnBackground(color: string): number | null {
  const key = `${isDarkTheme() ? "dark" : "light"}|${color.trim().toLowerCase()}`;
  if (contrastCache.has(key)) return contrastCache.get(key) ?? null;
  let out: number | null = null;
  try {
    const probe = document.createElement("span");
    probe.style.color = resolveColor(themeVar(color) ?? color);
    probe.style.background = "var(--background-primary)";
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe);
    const fg = luminance(computed.color);
    const bg = luminance(computed.backgroundColor);
    probe.remove();
    if (fg === null || bg === null) {
      contrastCache.set(key, null);
      return null;
    }
    const [hi, lo] = fg >= bg ? [fg, bg] : [bg, fg];
    out = (hi + 0.05) / (lo + 0.05);
  } catch {
    out = null;
  }
  contrastCache.set(key, out);
  return out;
}

export class IconStore {
  private cache = new Map<string, string>();
  private lucideCache: string[] | null = null;
  private lucideSet: Set<string> | null = null;

  constructor(
    private app: App,
    private getFolder: () => string,
    private cdn?: {
      enabled: () => boolean;
      getSvg: (name: string) => Promise<string | null>;
    },
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
      if (file instanceof TFile) {
        const raw = await this.app.vault.read(file);
        if (raw.includes("<svg")) {
          const clean = sanitizeSvg(raw);
          this.cache.set(path, clean);
          return clean;
        }
      }
    } catch {
      /* weiter zum CDN Fallback */
    }
    if (this.cdn?.enabled()) {
      return this.cdn.getSvg(name);
    }
    return null;
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
    if (!this.lucideCache) {
      try {
        this.lucideCache = getIconIds();
      } catch {
        return [];
      }
    }
    return this.lucideCache;
  }

  knowsLucide(id: string): boolean {
    if (!this.lucideSet) this.lucideSet = new Set(this.lucideIds());
    return this.lucideSet.has(id);
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
  el.removeClass("obsidian-icon-missing");
  el.removeAttribute("title");
  const label =
    ref.kind === "svg" ? ref.name : ref.kind === "lucide" ? ref.id : ref.char;
  const color = themeVar(opts?.color);
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
  if (color) {
    recolorSingle(svgEl, color);
  }
  if (opts?.size) {
    svgEl.setAttribute("width", opts.size);
    svgEl.setAttribute("height", opts.size);
  }
}
