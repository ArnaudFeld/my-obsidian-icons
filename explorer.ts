import { App, WorkspaceLeaf } from "obsidian";
import { IconStore, parseIconRef, renderIconInto } from "./icons";
import { MappingStore } from "./mapping";
import { pickVariant } from "./tabs-titles";
import { selfhostLightRefs } from "./cdn";

function activeDoc(): Document {
  const anyWindow = window as unknown as { activeDocument?: Document };
  return anyWindow.activeDocument ?? document;
}

/**
 * Explorer Icons per MutationObserver, nach dem Muster von Iconic und
 * Iconize: Container suchen, data-path Zeilen ablaufen, Icon span vor den
 * Titel setzen. Quelle ist die Mapping JSON, Darstellung der IconStore.
 */
export class ExplorerIcons {
  private observers: MutationObserver[] = [];
  private containers = new Set<HTMLElement>();
  private timer = 0;

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
    for (const observer of this.observers) observer.disconnect();
    this.observers = [];
    this.containers.clear();
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
    this.app.workspace
      .getLeavesOfType("file-explorer")
      .forEach((leaf) => this.watchLeaf(leaf));
    const rows = activeDoc().querySelectorAll(
      ".nav-files-container .tree-item-self[data-path]",
    );
    for (const row of Array.from(rows)) {
      const selfEl = row as HTMLElement;
      const path = selfEl.dataset.path;
      if (path) await this.renderRow(selfEl, path);
    }
  }

  private watchLeaf(leaf: WorkspaceLeaf): void {
    const container = leaf.view.containerEl.querySelector(
      ":scope > .nav-files-container > div",
    ) as HTMLElement | null;
    if (!container || this.containers.has(container)) return;
    this.containers.add(container);
    const observer = new MutationObserver(() => this.refreshSoon());
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-path", "class"],
    });
    this.observers.push(observer);
  }

  private async renderRow(selfEl: HTMLElement, path: string): Promise<void> {
    const raw = this.mapping.resolve(path);
    if (!raw) {
      selfEl
        .querySelector(":scope > .obsidian-icon-explorer")
        ?.remove();
      return;
    }
    const dark = document.body.classList.contains("theme-dark");
    const entry = pickVariant(
      raw,
      dark,
      (ref) => selfhostLightRefs().has(ref),
      this.getAutoLight(),
    );
    const ref = parseIconRef(entry.icon);
    let badge = selfEl.querySelector(
      ":scope > .obsidian-icon-explorer",
    ) as HTMLElement | null;
    if (!ref) {
      badge?.remove();
      return;
    }
    if (!badge) {
      badge = activeDoc().createElement("span");
      badge.className = "obsidian-icon-explorer";
      const inner = selfEl.querySelector(".tree-item-inner");
      if (inner) inner.insertAdjacentElement("beforebegin", badge);
      else selfEl.prepend(badge);
    }
    const key = `${dark ? "dark" : "light"}|${entry.icon}|${entry.color ?? ""}|${entry.size ?? ""}`;
    if (badge.dataset.ref === key) return;
    badge.dataset.ref = key;
    badge.innerHTML = "";
    badge.removeAttribute("style");
    await renderIconInto(badge, ref, this.store, { color: entry.color, size: entry.size });
    badge.addClass("obsidian-icon-explorer");
  }
}
