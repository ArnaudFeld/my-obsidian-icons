import {
  App,
  Editor,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TAbstractFile,
  TFile,
  TFolder,
} from "obsidian";
import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import type { Extension } from "@codemirror/state";
import {
  IconRef,
  IconStore,
  isDarkTheme,
  normalizeFolder,
  parseIconRef,
  parseSize,
  renderIconInto,
  themeVar,
} from "./icons";
import { MappingStore, normalizeExt } from "./mapping";
import { ExplorerIcons } from "./explorer";
import { IconPickerModal, PickerResult } from "./picker";
import { IconGalleryModal, IconCheckModal } from "./gallery";
import { IconSuggest, FrontmatterSuggest, collectCatalogRefs } from "./suggest";
import { TabsTitles } from "./tabs-titles";
import { exportIcons, importIcons } from "./exchange";

import { CdnCache, DEVICON_NAMES, SIMPLE_CDN_SLUGS, fetchSimpleSlugs, loadCatalogs, catalogStand, clearCatalogCaches, selfhostLightRefs } from "./cdn";
import { SELFHOST_DATE } from "./selfhost-catalog";

interface InlineSvgIconsSettings {
  iconFolder: string;
  mappingFile: string;
  cdnEnabled: boolean;
  selfhostEnabled: boolean;
  autoLightVariant: boolean;
  showTabIcons: boolean;
  showTitleIcons: boolean;
}

interface PluginEnvelope {
  settings?: InlineSvgIconsSettings;
  cdnCache?: Record<string, string>;
  recentIcons?: string[];
  favoriteIcons?: string[];
}

const RECENT_LIMIT = 10;
const CONFLICT_IDS = ["iconic", "obsidian-iconize", "obsidian-icon-folder"];

const DEFAULT_SETTINGS: InlineSvgIconsSettings = {
  iconFolder: "_assets/icons",
  mappingFile: "_assets/icon-mapping.json",
  cdnEnabled: false,
  selfhostEnabled: false,
  autoLightVariant: true,
  showTabIcons: true,
  showTitleIcons: true,
};

// {{icon:name}}, {{icon:devicon/proxmox}}, {{icon:lucide:folder}},
// {{icon:name|24}}, {{icon:name|1.5em}}, {{icon:name|red}},
// {{icon:name|24|blue}}, {{icon:name|dark:simple/docker}}.
// Zweiter und dritter Teil in beliebiger Reihenfolge: Größe, Farbe
// oder dunkle Variante. Emoji geht nur im Explorer Mapping.
const ICON_TAG_RE =
  /\{\{icon:([A-Za-z0-9_\-/:.]+?)(?:\.svg)?(?:\|([^{}|]*))?(?:\|([^{}|]*))?(?:\|([^{}|]*))?\}\}/g;

function parseTagParams(
  first: string | undefined,
  second: string | undefined,
  third: string | undefined,
): { size?: string; color?: string; darkIcon?: string } {
  let size: string | undefined;
  let color: string | undefined;
  let darkIcon: string | undefined;
  for (const raw of [first, second, third]) {
    const param = (raw ?? "").trim();
    if (!param) continue;
    if (param.startsWith("dark:")) {
      const ref = parseIconRef(param.slice("dark:".length));
      if (ref && !darkIcon) darkIcon = param.slice("dark:".length).trim();
      continue;
    }
    if (!size) {
      const parsed = parseSize(param);
      if (parsed) {
        size = parsed;
        continue;
      }
    }
    if (!color && themeVar(param)) {
      color = param;
    }
  }
  return { size, color, darkIcon };
}

/** Explizite Dunkel Variante, sonst Self-Hosted Auto Light, sonst wie hell. */
function resolveDarkRef(
  ref: IconRef,
  dark: IconRef | null,
  autoLight: boolean,
): IconRef {
  if (!isDarkTheme()) return ref;
  if (dark) return dark;
  if (
    autoLight &&
    ref.kind === "svg" &&
    ref.name.startsWith("selfhosted/")
  ) {
    const key = ref.name.slice("selfhosted/".length);
    if (selfhostLightRefs().has(key)) {
      return { kind: "svg", name: `${ref.name}-light` };
    }
  }
  return ref;
}

class IconWidget extends WidgetType {
  constructor(
    private ref: IconRef,
    private size: string | undefined,
    private color: string | undefined,
    private dark: IconRef | null,
    private store: IconStore,
  ) {
    super();
  }

  eq(other: IconWidget): boolean {
    const a = this.ref as { kind: string; name?: string; id?: string; char?: string };
    const b = other.ref as { kind: string; name?: string; id?: string; char?: string };
    const da = this.dark as unknown as { kind?: string; name?: string; id?: string } | null;
    const db = other.dark as unknown as { kind?: string; name?: string; id?: string } | null;
    return (
      a.kind === b.kind &&
      a.name === b.name &&
      a.id === b.id &&
      a.char === b.char &&
      this.size === other.size &&
      this.color === other.color &&
      da?.name === db?.name &&
      da?.id === db?.id &&
      da?.kind === db?.kind
    );
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    const ref = isDarkTheme() && this.dark ? this.dark : this.ref;
    void renderIconInto(span, ref, this.store, {
      size: this.size,
      color: this.color,
    });
    return span;
  }
}

function buildIconExtension(
  store: IconStore,
  getAutoLight: () => boolean,
): Extension {
  const matcher = new MatchDecorator({
    regexp: new RegExp(ICON_TAG_RE.source, "g"),
    decoration: (match, view, pos) => {
      const ref = parseIconRef(match[1] ?? "");
      if (!ref || ref.kind === "emoji") return null;
      const end = pos + match[0].length;
      for (const range of view.state.selection.ranges) {
        if (range.from <= end && range.to >= pos) return null;
      }
      const { size, color, darkIcon } = parseTagParams(match[2], match[3], match[4]);
      const dark = darkIcon ? parseIconRef(darkIcon) : null;
      const useRef = resolveDarkRef(ref, dark, getAutoLight());
      return Decoration.replace({
        widget: new IconWidget(useRef, size, color, dark, store),
        inclusive: false,
      });
    },
  });

  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = matcher.createDeco(view);
      }
      update(update: ViewUpdate): void {
        this.decorations = matcher.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

export default class InlineSvgIconsPlugin extends Plugin {
  settings: InlineSvgIconsSettings = { ...DEFAULT_SETTINGS };
  private icons!: IconStore;
  private mapping!: MappingStore;
  private explorer!: ExplorerIcons;
  private cdn!: CdnCache;
  private chrome!: TabsTitles;

  async onload(): Promise<void> {
    await this.loadAll();
    this.cdn = new CdnCache({
      load: () => this.cdnData,
      save: (data) => {
        this.cdnData = data;
        void this.saveAll();
      },
    });
    this.icons = new IconStore(this.app, () => this.settings.iconFolder, {
      enabled: () => this.settings.cdnEnabled,
      getSvg: (name) => this.cdn.getSvg(name),
    });
    this.mapping = new MappingStore(this.app, () => this.settings.mappingFile);
    await this.mapping.load();
    this.explorer = new ExplorerIcons(
      this.app,
      this.icons,
      this.mapping,
      () => this.settings.autoLightVariant,
    );
    this.chrome = new TabsTitles(this.app, this.icons, this.mapping, () => ({
      tabs: this.settings.showTabIcons,
      title: this.settings.showTitleIcons,
      autoLight: this.settings.autoLightVariant,
    }));

    // Live Preview (CM6)
    this.registerEditorExtension(
      buildIconExtension(this.icons, () => this.settings.autoLightVariant),
    );

    // Autovervollständigung für {{icon:…}} beim Tippen
    this.registerEditorSuggest(
      new IconSuggest(this.app, this.icons, {
        cdn: () => this.settings.cdnEnabled,
        selfhost: () => this.settings.selfhostEnabled,
        touch: (ref) => this.touchRecent([ref]),
      }),
    );

    // Vorschläge für icon, iconColor und iconDark im Frontmatter
    this.registerEditorSuggest(
      new FrontmatterSuggest(this.app, this.icons, () => ({
        cdn: this.settings.cdnEnabled,
        selfhost: this.settings.selfhostEnabled,
      })),
    );

    // Lesemodus
    this.registerMarkdownPostProcessor(async (el) => {
      await this.postProcess(el);
    });

    this.app.workspace.onLayoutReady(() => {
      this.explorer.start();
      this.chrome.start();
      this.warnOnConflicts();
    });
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
        this.explorer.refreshSoon();
        this.chrome.refreshSoon();
      }),
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.chrome.refreshSoon()),
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.chrome.refreshSoon()),
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.chrome.refreshSoon()),
    );
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.app.workspace.updateOptions();
        this.explorer.refreshSoon();
        this.chrome.refreshSoon();
      }),
    );

    this.registerEvent(this.app.vault.on("create", (f) => this.onVault(f)));
    this.registerEvent(this.app.vault.on("modify", (f) => this.onVault(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.onVault(f)));
    this.registerEvent(
      this.app.vault.on("rename", (f, oldPath) => this.onRename(f, oldPath)),
    );

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem((item) =>
          item
            .setTitle("Change icon")
            .setIcon("image-plus")
            .onClick(() => this.openPicker([file.path])),
        );
        if (this.mapping.get(file.path)) {
          menu.addItem((item) =>
            item
              .setTitle("Remove icon")
              .setIcon("trash")
              .onClick(() => this.removeIcons([file.path])),
          );
        }
      }),
    );
    this.registerEvent(
      this.app.workspace.on("files-menu", (menu, files) => {
        const paths = files.map((f) => f.path);
        menu.addItem((item) =>
          item
            .setTitle(`Change icons (${paths.length})`)
            .setIcon("image-plus")
            .onClick(() => this.openPicker(paths)),
        );
        if (paths.some((p) => this.mapping.get(p))) {
          menu.addItem((item) =>
            item
              .setTitle(`Remove icons (${paths.length})`)
              .setIcon("trash")
              .onClick(() => this.removeIcons(paths)),
          );
        }
      }),
    );

    this.addCommand({
      id: "reload-icons",
      name: "Icons neu laden",
      callback: () => {
        this.icons.clear();
        void this.mapping.load().then(() => this.explorer.refresh());
        this.app.workspace.updateOptions();
      },
    });

    this.addCommand({
      id: "open-gallery",
      name: "Icon Galerie öffnen",
      callback: () => {
        new IconGalleryModal(this.app, this.icons, this.mapping, () => {
          this.refreshViews();
        }).open();
      },
    });

    this.addCommand({
      id: "check-icons",
      name: "Icons prüfen",
      callback: () => {
        void this.runIconCheck().then((result) => {
          if (result.broken.length === 0) {
            new Notice(
              `Icons ok: ${result.used} vergeben, ${result.unused} ungenutzt`,
            );
          } else {
            new IconCheckModal(this.app, result).open();
          }
        });
      },
    });

    this.addCommand({
      id: "export-icons",
      name: "Icons exportieren",
      callback: () => {
        void exportIcons(this.app, this.icons, this.mapping);
      },
    });

    this.addCommand({
      id: "import-icons",
      name: "Icons importieren",
      callback: () => {
        this.importPackage();
      },
    });

    this.addCommand({
      id: "pick-icon-active-file",
      name: "Icon für aktive Datei wählen",
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) this.openPicker([file.path]);
        return true;
      },
    });

    this.addCommand({
      id: "insert-icon-at-cursor",
      name: "Icon in Notiz einfügen",
      editorCallback: (editor) => {
        this.openInsertPicker(editor);
      },
    });

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        menu.addItem((item) =>
          item
            .setTitle("Insert icon")
            .setIcon("plus")
            .onClick(() => this.openInsertPicker(editor)),
        );
        const file = view.file;
        if (!(file instanceof TFile)) return;
        menu.addItem((item) =>
          item
            .setTitle("Change icon")
            .setIcon("image-plus")
            .onClick(() => this.openPicker([file.path])),
        );
        if (this.mapping.get(file.path)) {
          menu.addItem((item) =>
            item
              .setTitle("Remove icon")
              .setIcon("trash")
              .onClick(() => this.removeIcons([file.path])),
          );
        }
      }),
    );

    this.addSettingTab(new InlineSvgIconsSettingTab(this.app, this));
  }

  onunload(): void {
    this.cdn?.flush();
    void this.mapping?.flush();
    this.explorer?.stop();
    this.chrome?.stop();
  }

  /** Hinweis bei Iconic oder Iconize, beide kämpfen um dieselben DOM Stellen. */
  private warnedConflicts = false;

  private warnOnConflicts(): void {
    if (this.warnedConflicts) return;
    this.warnedConflicts = true;
    const plugins = (
      this.app as unknown as { plugins?: { plugins?: Record<string, unknown> } }
    ).plugins?.plugins;
    if (!plugins) return;
    const found = CONFLICT_IDS.filter((id) => id in plugins);
    if (found.length > 0) {
      new Notice(
        `Inline SVG Icons: ${found.join(", ")} ist auch aktiv und verändert Explorer Icons, es kann zu Überschneidungen kommen.`,
        9000,
      );
    }
  }
  private onVault(file: TAbstractFile | string): void {
    const path = typeof file === "string" ? file : file.path;
    if (this.mapping.isMappingPath(path)) {
      void this.mapping.load().then(() => {
        this.explorer.refresh();
        this.chrome.refreshSoon();
      });
      return;
    }
    this.icons.invalidatePath(path);
  }

  private onRename(file: TAbstractFile, oldPath: string): void {
    if (this.mapping.isMappingPath(file.path)) return;
    const isFolder = file instanceof TFolder;
    if (this.mapping.migrateRename(oldPath, file.path, isFolder)) {
      this.explorer.refreshSoon();
    }
    this.chrome.refreshSoon();
  }

  openExtPicker(ext: string, initial: PickerResult | null, onSaved?: () => void): void {
    this.openIconPicker(initial, (result) => {
      void (async () => {
        try {
          await this.mapping.setExt(ext, {
            icon: result.icon,
            ...(result.color ? { color: result.color } : {}),
            ...(result.size ? { size: result.size } : {}),
            ...(result.iconDark ? { iconDark: result.iconDark } : {}),
          });
          this.touchRecent([result.icon]);
          this.explorer.refreshSoon();
          this.chrome.refreshSoon();
          onSaved?.();
        } catch {
          new Notice("Icon konnte nicht gespeichert werden");
        }
      })();
    });
  }

  private openPicker(paths: string[]): void {
    const first = paths.length === 1 ? this.mapping.get(paths[0]) : null;
    const initial: PickerResult | null = first
      ? {
          icon: first.icon,
          ...(first.color ? { color: first.color } : {}),
          ...(first.size ? { size: first.size } : {}),
          ...(first.iconDark ? { iconDark: first.iconDark } : {}),
        }
      : null;
    this.openIconPicker(initial, (result) => {
      void this.applyIcons(paths, result);
    });
  }

  /** Tote Favoriten und Zuletzt Einträge entfernen, einmal pro Dialog.
   * Nur Namespaces mit vollständigem Stand werden beurteilt, der Rest bleibt.
   */
  private async pruneMeta(cdnRefs: string[]): Promise<void> {
    const local = new Set(await this.icons.listSvgNames());
    let lucide: Set<string> | null = null;
    try {
      const ids = this.icons.lucideIds();
      if (ids.length > 0) lucide = new Set(ids.map((id) => `lucide:${id}`));
    } catch {
      lucide = null;
    }
    const cdn =
      this.settings.cdnEnabled || this.settings.selfhostEnabled
        ? new Set(cdnRefs)
        : null;
    const known = (ref: string): boolean => {
      if (local.has(ref)) return true;
      if (ref.startsWith("lucide:")) return lucide !== null && lucide.has(ref);
      if (ref.includes("/")) return cdn !== null && cdn.has(ref);
      return false;
    };
    const judgeable = (ref: string): boolean => {
      if (local.has(ref)) return true;
      if (ref.startsWith("lucide:")) return lucide !== null;
      if (ref.includes("/")) return cdn !== null;
      return true;
    };
    let changed = false;
    const keep = (list: string[]): string[] =>
      list.filter((ref) => {
        if (known(ref) || !judgeable(ref)) return true;
        changed = true;
        return false;
      });
    this.favoriteIcons = keep(this.favoriteIcons);
    this.recentIcons = keep(this.recentIcons).slice(0, RECENT_LIMIT);
    if (changed) await this.saveAll();
  }

  /** Gleicher Dialog zum Einfügen als Shortcode in die Notiz. */
  private openInsertPicker(editor: Editor): void {
    const cursor = editor.getCursor();
    const line = editor.getLine(cursor.line) ?? "";
    this.openIconPicker(null, (result) => {
      const parts = [result.icon];
      if (result.size) parts.push(result.size);
      if (result.color) parts.push(result.color);
      const tag = `{{icon:${parts.join("|")}}}`;
      editor.setCursor(cursor);
      const before = line.slice(0, cursor.ch);
      const after = line.slice(cursor.ch);
      const prefix = before.length > 0 && !/\s$/.test(before) ? " " : "";
      const suffix = after.length > 0 && !/^\s/.test(after) ? " " : "";
      editor.replaceSelection(`${prefix}${tag}${suffix}`);
      this.touchRecent([result.icon]);
    });
  }

  private openIconPicker(
    initial: PickerResult | null,
    onPick: (result: PickerResult) => void,
  ): void {
    void this.cdnRefs().then(async (refs) => {
      await this.pruneMeta(refs);
      new IconPickerModal(this.app, this.icons, initial, (result) => {
        if (result) onPick(result);
      }, refs, (ref) => {
        void this.saveCdnToFile(ref);
      }, {
        favorites: [...this.favoriteIcons],
        recent: [...this.recentIcons],
        onToggleFavorite: (ref) => {
          this.toggleFavorite(ref);
        },
      }).open();
    }).catch(() => {
      new Notice("Icon Auswahl konnte nicht geöffnet werden");
    });
  }

  /** Katalog Referenzen, die nur per CDN verfügbar sind, nicht als Datei. */
  private async cdnRefs(): Promise<string[]> {
    if (!this.settings.cdnEnabled && !this.settings.selfhostEnabled) return [];
    const local = new Set(await this.icons.listSvgNames());
    try {
      const catalog = await collectCatalogRefs(this.icons, {
        cdn: this.settings.cdnEnabled,
        selfhost: this.settings.selfhostEnabled,
      });
      return catalog.refs.filter((ref) => ref.includes("/") && !local.has(ref));
    } catch {
      return [];
    }
  }

  private async applyIcons(paths: string[], result: PickerResult): Promise<void> {
    const entry = {
      icon: result.icon,
      ...(result.color ? { color: result.color } : {}),
      ...(result.size ? { size: result.size } : {}),
      ...(result.iconDark ? { iconDark: result.iconDark } : {}),
    };
    try {
      await this.mapping.setMany(paths.map((path) => [path, entry] as [string, typeof entry]));
    } catch {
      new Notice("Icons konnten nicht gespeichert werden");
      return;
    }
    this.touchRecent([result.icon]);
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
  }

  private touchRecent(refs: string[]): void {
    const seen = new Set(this.recentIcons);
    for (const ref of refs) {
      if (seen.has(ref)) {
        this.recentIcons = this.recentIcons.filter((r) => r !== ref);
      }
      this.recentIcons.unshift(ref);
      seen.add(ref);
    }
    this.recentIcons = this.recentIcons.slice(0, RECENT_LIMIT);
    void this.saveAll();
  }

  toggleFavorite(ref: string): boolean {
    const index = this.favoriteIcons.indexOf(ref);
    if (index >= 0) this.favoriteIcons.splice(index, 1);
    else this.favoriteIcons.push(ref);
    void this.saveAll();
    return index < 0;
  }

  private async removeIcons(paths: string[]): Promise<void> {
    try {
      await this.mapping.removeMany(paths);
    } catch {
      new Notice("Icons konnten nicht entfernt werden");
      return;
    }
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
  }

  /** CDN Icon aus dem Cache als SVG Datei in den Icon Ordner schreiben. */
  private async saveCdnToFile(ref: string): Promise<void> {
    const parsed = parseIconRef(ref);
    if (!parsed || parsed.kind !== "svg") {
      new Notice("Nur SVG Referenzen lassen sich speichern");
      return;
    }
    const svg = this.cdn.peek(ref);
    if (!svg) {
      new Notice("Icon nicht im Cache, bitte erneut wählen");
      return;
    }
    const path = `${normalizeFolder(this.settings.iconFolder)}/${parsed.name}.svg`;
    if (this.app.vault.getAbstractFileByPath(path) instanceof TFile) {
      new Notice("Datei existiert bereits");
      return;
    }
    const slash = path.lastIndexOf("/");
    if (slash > 0) {
      const dir = path.slice(0, slash);
      if (!this.app.vault.getAbstractFileByPath(dir)) {
        await this.app.vault.adapter.mkdir(dir);
      }
    }
    await this.app.vault.create(path, svg);
    this.icons.invalidatePath(path);
    this.explorer.refreshSoon();
    new Notice(`Gespeichert: ${path}`);
  }

  cacheSize(): number {
    return this.cdn?.size ?? 0;
  }

  refreshViews(): void {
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
    this.app.workspace.updateOptions();
  }

  catalogStandText(): string {
    const stand = catalogStand();
    const parts: string[] = [];
    if (this.settings.cdnEnabled) {
      parts.push(`Devicon: ${stand.devicon ?? "eingebaut (v2.17.0)"}`);
      parts.push(`Simple: ${stand.simple ?? "eingebaut (16.29.0)"}`);
    }
    if (this.settings.selfhostEnabled) {
      parts.push(
        `Self-Hosted: ${stand.selfhosted ?? `eingebaut (${SELFHOST_DATE})`}`,
      );
    }
    return parts.length > 0
      ? parts.join(" · ")
      : "CDN aus, nur Dateien und Lucide.";
  }

  async reloadCatalogs(): Promise<void> {
    clearCatalogCaches();
    try {
      await loadCatalogs();
    } catch {
      /* Rückfall bleibt */
    }
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
    this.app.workspace.updateOptions();
  }

  iconStore(): IconStore {
    return this.icons;
  }

  iconMapping(): MappingStore {
    return this.mapping;
  }

  importPackage(): void {
    importIcons(this.app, this.icons, this.mapping, () => this.settings.iconFolder, () => {
      this.explorer.refreshSoon();
      this.chrome.refreshSoon();
    });
  }

  /**
   * Prüft alle Mapping Einträge ohne Netz: Datei da, Lucide bekannt,
   * Emoji gesetzt oder per CDN auflösbar. Zählt ungenutzte Dateien.
   */
  async runIconCheck(): Promise<{
    broken: [string, string][];
    used: number;
    unused: number;
  }> {
    const broken: [string, string][] = [];
    const local = new Set(await this.icons.listSvgNames());
    const lucide = new Set(this.icons.lucideIds());
    const resolvable = new Set<string>(local);
    if (this.settings.cdnEnabled || this.settings.selfhostEnabled) {
      try {
        const catalogs = await loadCatalogs();
        if (this.settings.cdnEnabled) {
          for (const name of catalogs.deviconNames) {
            resolvable.add(`devicon/${name}`);
          }
          for (const slug of catalogs.simpleSlugs) {
            resolvable.add(`simple/${slug}`);
          }
        }
        if (this.settings.selfhostEnabled) {
          for (const ref of catalogs.selfhost.keys()) {
            resolvable.add(`selfhosted/${ref}`);
          }
        }
      } catch {
        if (this.settings.cdnEnabled) {
          for (const name of DEVICON_NAMES) resolvable.add(`devicon/${name}`);
          let slugs = SIMPLE_CDN_SLUGS;
          try {
            const live = await fetchSimpleSlugs();
            if (live.length > 0) slugs = live;
          } catch {
            /* kuratiert */
          }
          for (const slug of slugs) resolvable.add(`simple/${slug}`);
        }
      }
    }
    const entries = this.mapping.entries();
    const refOk = (ref: IconRef | null): boolean => {
      if (!ref) return false;
      if (ref.kind === "emoji") return ref.char.length > 0;
      if (ref.kind === "lucide") return lucide.has(ref.id);
      if (resolvable.has(ref.name)) return true;
      if (
        ref.name.startsWith("selfhosted/") &&
        ref.name.endsWith("-light")
      ) {
        const base = ref.name.slice("selfhosted/".length, -"-light".length);
        if (
          selfhostLightRefs().has(base) &&
          resolvable.has(`selfhosted/${base}`)
        ) {
          return true;
        }
      }
      return (
        (this.settings.cdnEnabled || this.settings.selfhostEnabled) &&
        !!this.cdn.peek(ref.name)
      );
    };
    for (const [path, entry] of [...entries, ...this.mapping.extEntries().map(([ext, value]): [string, typeof value] => [`*.${ext}`, value])]) {
      if (!refOk(parseIconRef(entry.icon))) broken.push([path, entry.icon]);
      if (entry.iconDark && !refOk(parseIconRef(entry.iconDark))) {
        broken.push([`${path} (dunkel)`, entry.iconDark]);
      }
    }
    const used = new Set<string>();
    for (const [, entry] of [...entries, ...this.mapping.extEntries()]) {
      const ref = parseIconRef(entry.icon);
      if (ref?.kind === "svg") used.add(ref.name);
      if (entry.iconDark) {
        const dark = parseIconRef(entry.iconDark);
        if (dark?.kind === "svg") used.add(dark.name);
      }
    }
    let unused = 0;
    for (const name of local) {
      if (!used.has(name)) unused++;
    }
    return { broken, used: entries.length + this.mapping.extEntries().length, unused };
  }

  clearCache(): void {
    this.cdn?.clear();
    this.icons.clear();
    this.explorer.refreshSoon();
    this.app.workspace.updateOptions();
  }

  private async postProcess(el: HTMLElement): Promise<void> {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    while (walker.nextNode()) {
      const current = walker.currentNode as Text;
      if (current.nodeValue && current.nodeValue.includes("{{icon:")) {
        nodes.push(current);
      }
    }
    for (const node of nodes) {
      await this.replaceInTextNode(node);
    }
  }

  private async replaceInTextNode(node: Text): Promise<void> {
    const text = node.nodeValue ?? "";
    const re = new RegExp(ICON_TAG_RE.source, "g");
    let m: RegExpExecArray | null;
    let last = 0;
    let found = false;
    const frag = document.createDocumentFragment();

    while ((m = re.exec(text)) !== null) {
      found = true;
      if (m.index > last) frag.appendText(text.slice(last, m.index));
      const ref = parseIconRef(m[1] ?? "");
      const { size, color, darkIcon } = parseTagParams(m[2], m[3], m[4]);
      const dark = darkIcon ? parseIconRef(darkIcon) : null;
      if (!ref || ref.kind === "emoji") {
        frag.appendText(m[0]);
      } else {
        const span = document.createElement("span");
        await renderIconInto(
          span,
          resolveDarkRef(ref, dark, this.settings.autoLightVariant),
          this.icons,
          { size, color },
        );
        frag.append(span);
      }
      last = m.index + m[0].length;
    }

    if (!found) return;
    if (last < text.length) frag.appendText(text.slice(last));
    node.parentNode?.replaceChild(frag, node);
  }

  private cdnData: Record<string, string> = {};
  private recentIcons: string[] = [];
  private favoriteIcons: string[] = [];

  private isEnvelope(value: unknown): value is PluginEnvelope {
    if (!value || typeof value !== "object") return false;
    const keys = ["settings", "cdnCache", "recentIcons", "favoriteIcons"];
    return keys.some((k) => k in (value as Record<string, unknown>));
  }

  private asStringList(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((v): v is string => typeof v === "string");
  }

  async loadAll(): Promise<void> {
    let raw: unknown = null;
    try {
      raw = await this.loadData();
    } catch {
      console.warn("[inline-svg-icons] data.json ungültig, Standard geladen");
    }
    if (this.isEnvelope(raw)) {
      this.settings = { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) };
      this.cdnData = raw.cdnCache ?? {};
      this.recentIcons = this.asStringList(raw.recentIcons).slice(0, RECENT_LIMIT);
      this.favoriteIcons = [...new Set(this.asStringList(raw.favoriteIcons))];
    } else {
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...((raw as Partial<InlineSvgIconsSettings>) ?? {}),
      };
      this.cdnData = {};
      this.recentIcons = [];
      this.favoriteIcons = [];
    }
  }

  private async saveAll(): Promise<void> {
    const envelope: PluginEnvelope = {
      settings: this.settings,
      cdnCache: this.cdnData,
      recentIcons: this.recentIcons,
      favoriteIcons: this.favoriteIcons,
    };
    await this.saveData(envelope);
  }

  async loadSettings(): Promise<void> {
    await this.loadAll();
  }

  async saveSettings(): Promise<void> {
    await this.saveAll();
    this.icons.clear();
    await this.mapping.load();
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
    this.app.workspace.updateOptions();
  }
}

class InlineSvgIconsSettingTab extends PluginSettingTab {
  constructor(
    app: App,
    private plugin: InlineSvgIconsPlugin,
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    new Setting(containerEl)
      .setName("Icon Ordner")
      .setDesc("Pfad im Vault, ohne führenden Schrägstrich.")
      .addText((text) =>
        text
          .setPlaceholder("_assets/icons")
          .setValue(this.plugin.settings.iconFolder)
          .onChange(async (value) => {
            this.plugin.settings.iconFolder =
              normalizeFolder(value) || DEFAULT_SETTINGS.iconFolder;
            await this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName("Mapping Datei")
      .setDesc("Zuordnung Explorer Pfad auf Icon, als JSON im Vault.")
      .addText((text) =>
        text
          .setPlaceholder("_assets/icon-mapping.json")
          .setValue(this.plugin.settings.mappingFile)
          .onChange(async (value) => {
            this.plugin.settings.mappingFile =
              normalizeFolder(value) || DEFAULT_SETTINGS.mappingFile;
            await this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName("Dateityp Icons")
      .setDesc("Rückfall pro Endung nach Pfad und Frontmatter. Start leer.");
    for (const [ext, entry] of this.plugin.iconMapping().extEntries()) {
      const row = new Setting(containerEl).setName(`*.${ext}`).setDesc(entry.icon);
      const preview = document.createElement("span");
      preview.addClass("obsidian-icon-inline");
      preview.style.width = "18px";
      preview.style.height = "18px";
      row.settingEl.prepend(preview);
      const ref = parseIconRef(entry.icon);
      if (ref) {
        void renderIconInto(preview, ref, this.plugin.iconStore(), {
          color: entry.color,
        });
      }
      row
        .addButton((button) =>
          button.setButtonText("Ändern").onClick(() => {
            this.plugin.openExtPicker(
              ext,
              {
                icon: entry.icon,
                ...(entry.color ? { color: entry.color } : {}),
                ...(entry.size ? { size: entry.size } : {}),
                ...(entry.iconDark ? { iconDark: entry.iconDark } : {}),
              },
              () => this.display(),
            );
          }),
        )
        .addButton((button) =>
          button.setButtonText("✕").onClick(async () => {
            await this.plugin.iconMapping().removeExt(ext);
            this.plugin.refreshViews();
            this.display();
          }),
        );
    }
    let newExt = "";
    new Setting(containerEl)
      .setName("Endung hinzufügen")
      .setDesc("Ohne Punkt, z.B. md.")
      .addText((text) =>
        text.setPlaceholder("md").onChange((value) => {
          newExt = value;
        }),
      )
      .addButton((button) =>
        button.setButtonText("Wählen").onClick(() => {
          const ext = normalizeExt(newExt);
          if (!ext) {
            new Notice("Ungültige Endung");
            return;
          }
          this.plugin.openExtPicker(
            ext,
            this.plugin.iconMapping().getExt(ext),
            () => this.display(),
          );
        }),
      );
    new Setting(containerEl)
      .setName("CDN Nachladen")
      .setDesc(
        "Fehlende Devicon und Simple Icons von jsdelivr laden und auf diesem Gerät cachen.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.cdnEnabled)
          .onChange(async (value) => {
            this.plugin.settings.cdnEnabled = value;
            await this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName("Self-Hosted Icons")
      .setDesc(
        "Homelab Marken von selfh.st per CDN, CC-BY-4.0 mit Namensnennung in der README.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.selfhostEnabled)
          .onChange(async (value) => {
            this.plugin.settings.selfhostEnabled = value;
            await this.plugin.saveSettings();
          }),
      );
    const standSetting = new Setting(containerEl)
      .setName("Katalog Stand")
      .setDesc(this.plugin.catalogStandText())
      .addButton((button) =>
        button.setButtonText("Neu laden").onClick(async () => {
          await this.plugin.reloadCatalogs();
          standSetting.setDesc(this.plugin.catalogStandText());
        }),
      );
    const cacheSetting = new Setting(containerEl)
      .setName("Icon Cache")
      .setDesc(`${this.plugin.cacheSize()} Icons auf diesem Gerät.`)
      .addButton((button) =>
        button.setButtonText("Leeren").onClick(async () => {
          this.plugin.clearCache();
          cacheSetting.setDesc("0 Icons auf diesem Gerät.");
        }),
      );
    new Setting(containerEl)
      .setName("Helle Variante automatisch")
      .setDesc(
        "Im dunklen Theme die helle Self-Hosted Variante nehmen wenn vorhanden. Hand Wahl gewinnt.",
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoLightVariant)
          .onChange(async (value) => {
            this.plugin.settings.autoLightVariant = value;
            await this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName("Tab Icons")
      .setDesc("Mapping und Frontmatter Icons in der Tableiste zeigen.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTabIcons)
          .onChange(async (value) => {
            this.plugin.settings.showTabIcons = value;
            await this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName("Titel Icons")
      .setDesc("Mapping und Frontmatter Icons vor dem Notiz Titel zeigen.")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showTitleIcons)
          .onChange(async (value) => {
            this.plugin.settings.showTitleIcons = value;
            await this.plugin.saveSettings();
          }),
      );
    new Setting(containerEl)
      .setName("Paket exportieren")
      .setDesc("Mapping plus genutzte Icons als Datei für Zweit Vaults.")
      .addButton((button) =>
        button.setButtonText("Exportieren").onClick(() => {
          void exportIcons(
            this.plugin.app,
            this.plugin.iconStore(),
            this.plugin.iconMapping(),
          );
        }),
      );
    new Setting(containerEl)
      .setName("Paket importieren")
      .setDesc("icons-export.json einlesen und Icons nach _assets/icons schreiben.")
      .addButton((button) =>
        button.setButtonText("Importieren").onClick(() => {
          this.plugin.importPackage();
        }),
      );
  }
}
