import { App, TFile, WorkspaceLeaf } from "obsidian";
import { IconStore, isDarkTheme, parseIconRef, renderIconInto } from "./icons";
import { MappingEntry, MappingStore } from "./mapping";
import { readFrontmatterIcon } from "./frontmatter";
import { pickVariant } from "./tabs-titles";
import { selfhostLightRefs } from "./cdn";

function activeDoc(): Document {
  const anyWindow = window as unknown as { activeDocument?: Document };
  return anyWindow.activeDocument ?? document;
}

/** Gleichzeitige Zeilen beim Nachmalen, begrenzt Netz und DOM Last. */
const REFRESH_CONCURRENCY = 6;

/** Stand Schlüssel am Badge, damit nur echte Änderungen neu malen. */
export function badgeKey(
  dark: boolean,
  icon: string,
  color?: string,
  size?: string,
): string {
  return `${dark ? "dark" : "light"}|${icon}|${color ?? ""}|${size ?? ""}`;
}

/** Eigene Badge Malungen erkennen, sonst Endlosschleife bei Missing. */
export function isBadgeMutation(records: MutationRecord[]): boolean {
  return records.every((record) => {
    const target = record.target as HTMLElement | null;
    return (
      !!target &&
      typeof target.closest === "function" &&
      target.closest(".obsidian-icon-explorer") !== null
    );
  });
}

/**
 * Explorer Icons per MutationObserver, nach dem Muster von Iconic und
 * Iconize: Container suchen, data-path Zeilen ablaufen, Icon span vor den
 * Titel setzen. Quelle ist die Mapping JSON, Darstellung der IconStore.
 */
export class ExplorerIcons {
  private watchers = new Map<HTMLElement, MutationObserver>();
  private timer = 0;
  private refreshing = false;

  constructor(
    private app: App,
    private store: IconStore,
    private mapping: MappingStore,
    private getAutoLight: () => boolean = () => true,
  ) {}

  start(): void {
    this.stop();
    this.app.workspace
      .getLeavesOfType("file-explorer")
      .forEach((leaf) => this.watchLeaf(leaf));
    this.refreshSoon();
  }

  stop(): void {
    for (const observer of this.watchers.values()) observer.disconnect();
    this.watchers.clear();
    window.clearTimeout(this.timer);
    for (const badge of Array.from(
      activeDoc().querySelectorAll(".obsidian-icon-explorer"),
    )) {
      badge.remove();
    }
  }

  refreshSoon(): void {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.refresh(), 80);
  }

  async refresh(): Promise<void> {
    // Läuft noch ein Durchgang, nachher neu anstoßen. Sonst überschreiben
    // sich zwei Läufe im selben Badge und der alte Inhalt bleibt mit neuem
    // dataset.ref stehen.
    if (this.refreshing) {
      this.refreshSoon();
      return;
    }
    this.refreshing = true;
    try {
      await this.runRefresh();
    } finally {
      this.refreshing = false;
    }
  }

  private async runRefresh(): Promise<void> {
    // Getrennte Container abbauen, sonst Leak bei Leaf Wechsel.
    for (const [container, observer] of this.watchers) {
      if (!container.isConnected) {
        observer.disconnect();
        this.watchers.delete(container);
      }
    }
    this.app.workspace
      .getLeavesOfType("file-explorer")
      .forEach((leaf) => this.watchLeaf(leaf));
    const rows = Array.from(
      activeDoc().querySelectorAll(
        ".nav-files-container .tree-item-self[data-path]",
      ),
    );
    for (let i = 0; i < rows.length; i += REFRESH_CONCURRENCY) {
      await Promise.all(
        rows.slice(i, i + REFRESH_CONCURRENCY).map((row) => {
          const selfEl = row as HTMLElement;
          const path = selfEl.dataset.path;
          return path ? this.renderRow(selfEl, path) : Promise.resolve();
        }),
      );
    }
  }

  private watchLeaf(leaf: WorkspaceLeaf): void {
    const container = leaf.view.containerEl.querySelector<HTMLElement>(
      ":scope > .nav-files-container > div",
    );
    if (!container || this.watchers.has(container)) return;
    const observer = new MutationObserver((muts) => {
      // Eigene Badge Malungen ignorieren, sonst Endlosschleife bei Missing.
      if (!isBadgeMutation(muts)) this.refreshSoon();
    });
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-path", "class"],
    });
    this.watchers.set(container, observer);
  }

  /** Rangfolge wie in Tabs: Frontmatter, dann Mapping Pfad und Dateityp. */
  private resolveForPath(path: string): MappingEntry | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      const frontmatter = readFrontmatterIcon(this.app, file);
      if (frontmatter) return frontmatter;
    }
    return this.mapping.resolve(path, file);
  }

  private async renderRow(selfEl: HTMLElement, path: string): Promise<void> {
    const raw = this.resolveForPath(path);
    if (!raw) {
      selfEl.querySelector(":scope > .obsidian-icon-explorer")?.remove();
      return;
    }
    const dark = isDarkTheme();
    const entry = pickVariant(
      raw,
      dark,
      (ref) => selfhostLightRefs().has(ref),
      this.getAutoLight(),
    );
    const ref = parseIconRef(entry.icon);
    let badge = selfEl.querySelector<HTMLElement>(
      ":scope > .obsidian-icon-explorer",
    );
    if (!ref) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = activeDoc().createSpan();
      badge.className = "obsidian-icon-explorer";
      const inner = selfEl.querySelector(".tree-item-inner");
      if (inner) inner.insertAdjacentElement("beforebegin", badge);
      else selfEl.prepend(badge);
    }
    const key = badgeKey(dark, entry.icon, entry.color, entry.size);
    if (badge.dataset.ref === key) return;
    badge.dataset.ref = key;
    badge.replaceChildren();
    badge.removeAttribute("style");
    await renderIconInto(badge, ref, this.store, {
      color: entry.color,
      size: entry.size,
    });
    if (badge.hasClass("obsidian-icon-missing")) {
      delete badge.dataset.ref;
    }
    badge.addClass("obsidian-icon-explorer");
  }
}
