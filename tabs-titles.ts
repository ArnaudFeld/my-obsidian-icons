import { App, TFile, WorkspaceLeaf, setIcon } from "obsidian";
import { IconStore, parseIconRef, renderIconInto } from "./icons";
import { MappingEntry, MappingStore } from "./mapping";
import { FrontmatterIcon, readFrontmatterIcon } from "./frontmatter";
import { selfhostLightRefs } from "./cdn";

export interface ResolvedEntry {
  icon: string;
  color?: string;
  size?: string;
}

/** Dunkle Variante wählen wenn das Theme dunkel ist und eine hinterlegt ist. */
export function pickVariant(
  entry: {
    icon: string;
    color?: string;
    size?: string;
    iconDark?: string;
  },
  isDark: boolean,
  hasLightVariant?: (ref: string) => boolean,
  autoLight = true,
): ResolvedEntry {
  const out: ResolvedEntry = { icon: entry.icon };
  if (entry.color) out.color = entry.color;
  if (entry.size) out.size = entry.size;
  if (isDark && entry.iconDark && parseIconRef(entry.iconDark)) {
    out.icon = entry.iconDark;
    return out;
  }
  if (
    autoLight &&
    isDark &&
    hasLightVariant &&
    entry.icon.startsWith("selfhosted/") &&
    hasLightVariant(entry.icon.slice("selfhosted/".length))
  ) {
    out.icon = `${entry.icon}-light`;
  }
  return out;
}

function isDarkTheme(): boolean {
  return document.body.classList.contains("theme-dark");
}

function hasSelfhostLight(ref: string): boolean {
  return selfhostLightRefs().has(ref);
}

/**
 * Icons in Tableiste und Notiz Titel aus Frontmatter oder Mapping.
 * Bereiche einzeln abschaltbar, Standard Icons werden wiederhergestellt.
 */
export class TabsTitles {
  private timer = 0;

  constructor(
    private app: App,
    private store: IconStore,
    private mapping: MappingStore,
    private getOpts: () => { tabs: boolean; title: boolean; autoLight: boolean },
  ) {}

  start(): void {
    this.refreshSoon();
  }

  stop(): void {
    window.clearTimeout(this.timer);
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const tabEl = (
        leaf as unknown as { tabHeaderInnerIconEl?: HTMLElement }
      ).tabHeaderInnerIconEl;
      if (tabEl) this.restoreTab(leaf, tabEl);
      const titleEl = leaf.view.containerEl.querySelector(
        ".inline-title .obsidian-icon-title",
      );
      titleEl?.remove();
    }
  }

  refreshSoon(): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.refresh(), 80);
  }

  async refresh(): Promise<void> {
    const opts = this.getOpts();
    const dark = isDarkTheme();
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const path = this.leafPath(leaf);
      const tabEl = (
        leaf as unknown as { tabHeaderInnerIconEl?: HTMLElement }
      ).tabHeaderInnerIconEl;
      if (tabEl) {
        const entry = path && opts.tabs ? this.resolveForPath(path, dark) : null;
        if (!entry) this.restoreTab(leaf, tabEl);
        else await this.paintTab(tabEl, entry);
      }
      const titleEl = leaf.view.containerEl.querySelector(
        ".inline-title",
      ) as HTMLElement | null;
      if (titleEl) {
        titleEl.querySelector(":scope > .obsidian-icon-title")?.remove();
        const entry = path && opts.title ? this.resolveForPath(path, dark) : null;
        if (entry) await this.paintTitle(titleEl, entry);
      }
    }
  }

  private leafPath(leaf: WorkspaceLeaf): string | null {
    const view = leaf.view as unknown as {
      file?: TFile;
      getState?: () => { file?: unknown };
    };
    if (view.file?.path) return view.file.path;
    const stateFile = view.getState?.().file;
    return typeof stateFile === "string" ? stateFile : null;
  }

  private resolveForPath(path: string, dark: boolean): ResolvedEntry | null {
    const auto = this.getOpts().autoLight;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      const frontmatter: FrontmatterIcon | null = readFrontmatterIcon(
        this.app,
        file,
      );
      if (frontmatter) return pickVariant(frontmatter, dark, hasSelfhostLight, auto);
    }
    const mapped: MappingEntry | null = this.mapping.resolve(path);
    if (mapped) return pickVariant(mapped, dark, hasSelfhostLight, auto);
    return null;
  }

  private async paintTab(el: HTMLElement, entry: ResolvedEntry): Promise<void> {
    const ref = parseIconRef(entry.icon);
    if (!ref) {
      return;
    }
    el.empty();
    if (ref.kind === "emoji") {
      el.textContent = ref.char;
    } else if (ref.kind === "lucide") {
      setIcon(el, ref.id);
    } else {
      await renderIconInto(el, ref, this.store, { color: entry.color });
    }
    el.dataset.obsidianIcon = "1";
  }

  private restoreTab(leaf: WorkspaceLeaf, el: HTMLElement): void {
    if (!el.dataset.obsidianIcon) return;
    delete el.dataset.obsidianIcon;
    try {
      setIcon(el, leaf.view.getIcon());
    } catch {
      el.empty();
    }
  }

  private async paintTitle(
    titleEl: HTMLElement,
    entry: ResolvedEntry,
  ): Promise<void> {
    const ref = parseIconRef(entry.icon);
    if (!ref) return;
    const badge = document.createElement("span");
    badge.addClass("obsidian-icon-title");
    await renderIconInto(badge, ref, this.store, { color: entry.color });
    titleEl.insertBefore(badge, titleEl.firstChild);
  }
}
