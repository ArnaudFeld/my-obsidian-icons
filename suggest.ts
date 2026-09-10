import {
  App,
  Editor,
  EditorPosition,
  EditorSuggest,
  EditorSuggestContext,
  EditorSuggestTriggerInfo,
  setIcon,
} from "obsidian";
import { DEVICON_NAMES, DEVICON_TAGS } from "./cdn-catalog";
import { SIMPLE_CDN_SLUGS, fetchSimpleSlugs, loadCatalogs } from "./cdn";
import { IconStore, THEME_COLORS, themeVar } from "./icons";

export interface SuggestItem {
  ref: string;
}

const SUGGEST_LIMIT = 12;

export interface CatalogRefs {
  refs: string[];
  deviconTags: Record<string, string[]>;
  selfhostTags: Map<string, string[]>;
}

/** Alle wählbaren Referenzen: Dateien, Kataloge und Lucide. */
export async function collectCatalogRefs(
  store: IconStore,
  opts: { cdn: boolean; selfhost: boolean },
): Promise<CatalogRefs> {
  const refs: string[] = [];
  const seen = new Set<string>();
  const push = (ref: string) => {
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push(ref);
    }
  };
  for (const name of await store.listSvgNames()) push(name);
  let deviconTags: Record<string, string[]> = { ...DEVICON_TAGS };
  const selfhostTags = new Map<string, string[]>();
  if (opts.cdn || opts.selfhost) {
    try {
      const catalogs = await loadCatalogs();
      if (opts.cdn) {
        deviconTags = catalogs.deviconTags;
        for (const name of catalogs.deviconNames) push(`devicon/${name}`);
        for (const slug of catalogs.simpleSlugs) push(`simple/${slug}`);
      }
      if (opts.selfhost) {
        for (const [ref, entry] of catalogs.selfhost) {
          push(`selfhosted/${ref}`);
          if (entry.tags.length > 0) selfhostTags.set(ref, entry.tags);
        }
      }
    } catch {
      if (opts.cdn) {
        for (const name of DEVICON_NAMES) push(`devicon/${name}`);
        for (const slug of SIMPLE_CDN_SLUGS) push(`simple/${slug}`);
      }
    }
  }
  for (const id of store.lucideIds()) push(`lucide:${id}`);
  return { refs, deviconTags, selfhostTags };
}

/** Suggest Cache leeren, nach Neu laden und bei SVG Anlage oder Löschen. */
export function clearCatalogCache(): void {
  catalogCache = null;
}

/** Ältere Form ohne Self-Hosted. */
export async function collectIconRefs(
  store: IconStore,
  cdnEnabled: boolean,
): Promise<string[]> {
  const catalog = await collectCatalogRefs(store, {
    cdn: cdnEnabled,
    selfhost: false,
  });
  return catalog.refs;
}

interface CachedCatalog {
  at: number;
  catalog: CatalogRefs;
  hay: Map<string, string[]>;
}

/** Katalog pro Tastenschlag wäre Vault Scan plus 10000er Aufbau, daher Cache. */
const CATALOG_TTL_MS = 30_000;
let catalogCache: { key: string; entry: CachedCatalog } | null = null;

export async function cachedCatalogRefs(
  store: IconStore,
  opts: { cdn: boolean; selfhost: boolean },
): Promise<CachedCatalog> {
  const key = `${opts.cdn ? 1 : 0}${opts.selfhost ? 1 : 0}`;
  const now = Date.now();
  if (
    catalogCache &&
    catalogCache.key === key &&
    now - catalogCache.entry.at < CATALOG_TTL_MS
  ) {
    return catalogCache.entry;
  }
  const catalog = await collectCatalogRefs(store, opts);
  const hay = new Map<string, string[]>();
  for (const ref of catalog.refs) {
    hay.set(ref, hayFor(ref, catalog.deviconTags, catalog.selfhostTags));
  }
  const entry: CachedCatalog = { at: now, catalog, hay };
  catalogCache = { key, entry };
  return entry;
}

function hayFor(
  ref: string,
  deviconTags: Record<string, string[]>,
  selfhostTags: Map<string, string[]>,
): string[] {
  const hay = [ref.toLowerCase()];
  if (ref.startsWith("devicon/")) {
    hay.push(...(deviconTags[ref.slice("devicon/".length)] ?? []));
  } else if (ref.startsWith("selfhosted/")) {
    hay.push(...(selfhostTags.get(ref.slice("selfhosted/".length)) ?? []));
  } else if (ref.startsWith("lucide:")) {
    hay.push(ref.slice("lucide:".length).toLowerCase());
  }
  return hay;
}

/**
 * Autovervollständigung für {{icon:…}} beim Tippen, mit Vorschau.
 * Devicon Suche nutzt zusätzlich die Tags aus devicon.json.
 */
export class IconSuggest extends EditorSuggest<SuggestItem> {
  constructor(
    app: App,
    private store: IconStore,
    private opts: {
      cdn: () => boolean;
      selfhost: () => boolean;
      touch: (ref: string) => void;
    },
  ) {
    super(app);
    this.limit = SUGGEST_LIMIT;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line).slice(0, cursor.ch);
    const m = /\{\{icon:([A-Za-z0-9_\-/:.]*)$/.exec(line);
    if (!m) return null;
    return {
      start: { line: cursor.line, ch: cursor.ch - m[0].length },
      end: cursor,
      query: m[1] ?? "",
    };
  }

  async getSuggestions(ctx: EditorSuggestContext): Promise<SuggestItem[]> {
    const terms = ctx.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const { catalog, hay } = await cachedCatalogRefs(this.store, {
      cdn: this.opts.cdn(),
      selfhost: this.opts.selfhost(),
    });
    const out: SuggestItem[] = [];
    const seen = new Set<string>();
    for (const ref of catalog.refs) {
      if (out.length >= 80) break;
      if (seen.has(ref)) continue;
      const haystack = hay.get(ref) ?? [];
      if (
        terms.length === 0 ||
        terms.every((term) => haystack.some((h) => h.includes(term)))
      ) {
        seen.add(ref);
        out.push({ ref });
      }
    }
    return out.slice(0, this.limit);
  }

  renderSuggestion(item: SuggestItem, el: HTMLElement): void {
    el.addClass("obsidian-icon-suggest-row");
    const preview = el.createDiv({ cls: "obsidian-icon-picker-preview" });
    el.createDiv({ text: item.ref, cls: "obsidian-icon-picker-name" });
    if (item.ref.startsWith("lucide:")) {
      setIcon(preview, item.ref.slice("lucide:".length));
      return;
    }
    preview.textContent = "…";
    void this.store.getSvg(item.ref).then((svg) => {
      if (!preview.isConnected) return;
      if (svg) preview.innerHTML = svg;
      else preview.textContent = "⭳";
    });
  }

  selectSuggestion(item: SuggestItem): void {
    const ctx = this.context;
    if (!ctx) return;
    const editor = ctx.editor;
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line) ?? "";
    const before = line.slice(0, cursor.ch);
    const tokenStart = before.lastIndexOf("{{icon:");
    if (tokenStart < 0) return;
    const from = { line: cursor.line, ch: tokenStart };
    let endCh = cursor.ch;
    // Rest Token nach Cursor mitnehmen, sonst bleibt Müll wie o}} stehen.
    const trail = /^[A-Za-z0-9_\-/:.]*/.exec(line.slice(endCh))?.[0] ?? "";
    endCh += trail.length;
    if (line.slice(endCh, endCh + 2) === "}}") endCh += 2;
    const after = line.slice(endCh);
    const suffix = after.length > 0 && !/^\s/.test(after) ? " " : "";
    editor.replaceRange(
      `{{icon:${item.ref}}}${suffix}`,
      from,
      { line: cursor.line, ch: endCh },
    );
    this.opts.touch(item.ref);
  }
}

/**
 * Vorschläge für icon, iconColor und iconDark im Frontmatter,
 * funktioniert beim Bearbeiten der Quelle im Source Modus.
 */
export class FrontmatterSuggest extends EditorSuggest<SuggestItem> {
  constructor(
    app: App,
    private store: IconStore,
    private sources: () => { cdn: boolean; selfhost: boolean },
  ) {
    super(app);
    this.limit = SUGGEST_LIMIT;
  }

  private frontmatterEnd(editor: Editor, line: number): number {
    if (editor.getLine(0).trim() !== "---") return -1;
    for (let i = 1; i < editor.lineCount(); i++) {
      if (editor.getLine(i).trim() === "---") return i;
    }
    return -1;
  }

  onTrigger(
    cursor: EditorPosition,
    editor: Editor,
  ): EditorSuggestTriggerInfo | null {
    const end = this.frontmatterEnd(editor, cursor.line);
    if (end < 0 || cursor.line === 0 || cursor.line >= end) return null;
    const before = editor.getLine(cursor.line).slice(0, cursor.ch);
    let m = /^(\s*icon\s*:\s*["']?)([A-Za-z0-9_\-/:.]*)$/.exec(before);
    if (m) {
      return {
        start: { line: cursor.line, ch: cursor.ch - m[2].length },
        end: cursor,
        query: `icon:${m[2] ?? ""}`,
      };
    }
    m = /^(\s*icon(?:Color|Dark)\s*:\s*["']?)([A-Za-z0-9_:\-/#]*)$/.exec(before);
    if (!m) return null;
    return {
      start: { line: cursor.line, ch: cursor.ch - m[2].length },
      end: cursor,
      query: `${m[1].includes("Color") ? "color:" : "dark:"}${m[2] ?? ""}`,
    };
  }

  async getSuggestions(ctx: EditorSuggestContext): Promise<SuggestItem[]> {
    if (ctx.query.startsWith("color:")) {
      const q = ctx.query.slice("color:".length).toLowerCase();
      return (THEME_COLORS as readonly string[])
        .filter((c) => c.includes(q))
        .slice(0, this.limit)
        .map((ref) => ({ ref }));
    }
    const matchDark = ctx.query.startsWith("dark:");
    const q = (matchDark ? ctx.query.slice("dark:".length) : ctx.query.slice("icon:".length))
      .trim()
      .toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const { catalog, hay } = await cachedCatalogRefs(this.store, this.sources());
    return catalog.refs
      .filter((ref) => {
        const haystack = hay.get(ref) ?? [];
        return (
          terms.length === 0 ||
          terms.every((term) => haystack.some((h) => h.includes(term)))
        );
      })
      .slice(0, this.limit)
      .map((ref) => ({ ref }));
  }

  renderSuggestion(item: SuggestItem, el: HTMLElement): void {
    el.addClass("obsidian-icon-suggest-row");
    if ((THEME_COLORS as readonly string[]).includes(item.ref)) {
      const dot = el.createDiv({ cls: "obsidian-icon-dot" });
      dot.style.background = themeVar(item.ref) ?? item.ref;
      el.createDiv({ text: item.ref, cls: "obsidian-icon-picker-name" });
      return;
    }
    const preview = el.createDiv({ cls: "obsidian-icon-picker-preview" });
    el.createDiv({ text: item.ref, cls: "obsidian-icon-picker-name" });
    if (item.ref.startsWith("lucide:")) {
      setIcon(preview, item.ref.slice("lucide:".length));
      return;
    }
    preview.textContent = "…";
    void this.store.getSvg(item.ref).then((svg) => {
      if (!preview.isConnected) return;
      if (svg) preview.innerHTML = svg;
      else preview.textContent = "⭳";
    });
  }

  selectSuggestion(item: SuggestItem): void {
    const ctx = this.context;
    if (!ctx) return;
    ctx.editor.replaceRange(item.ref, ctx.start, ctx.end);
  }
}
