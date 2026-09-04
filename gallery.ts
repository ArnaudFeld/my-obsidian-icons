import { App, Modal } from "obsidian";
import { IconStore, parseIconRef, renderIconInto } from "./icons";
import { MappingStore } from "./mapping";

/**
 * Galerie aller genutzten Icons plus ungenutzte Dateien im Icon Ordner.
 * Zum Aufräumen vor Sync, Entfernen direkt in der Zeile möglich.
 */
export class IconGalleryModal extends Modal {
  constructor(
    app: App,
    private store: IconStore,
    private mapping: MappingStore,
    private onChanged: () => void,
  ) {
    super(app);
  }

  async onOpen(): Promise<void> {
    await this.render();
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async render(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-icon-gallery");
    contentEl.createEl("h3", { text: "Icon Galerie" });

    const used = this.mapping.entries();
    const extRules = this.mapping.extEntries();
    contentEl.createEl("div", {
      text: `Vergeben (${used.length} Pfade, ${extRules.length} Regeln)`,
      cls: "obsidian-icon-picker-group",
    });
    if (used.length === 0) {
      contentEl.createDiv({
        text: "Noch keine Icons vergeben",
        cls: "obsidian-icon-picker-more",
      });
    }
    for (const [path, entry] of used) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      const ref = parseIconRef(entry.icon);
      if (ref) await renderIconInto(preview, ref, this.store, { color: entry.color });
      else preview.textContent = "?";
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: path });
      const bits = [entry.icon];
      if (entry.color) bits.push(entry.color);
      if (entry.size) bits.push(entry.size);
      if (entry.iconDark) bits.push(`dunkel: ${entry.iconDark}`);
      label.createDiv({ text: bits.join(" · "), cls: "obsidian-icon-picker-more" });
      const remove = row.createEl("button", {
        text: "Entfernen",
        cls: "obsidian-icon-gallery-remove",
      }) as HTMLButtonElement;
      remove.onclick = () => {
        void this.mapping.remove(path).then(() => {
          this.onChanged();
          void this.render();
        });
      };
    }

    const ext = this.mapping.extEntries();
    contentEl.createEl("div", {
      text: `Dateityp (${ext.length})`,
      cls: "obsidian-icon-picker-group",
    });
    for (const [name, entry] of ext) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      const ref = parseIconRef(entry.icon);
      if (ref) await renderIconInto(preview, ref, this.store, { color: entry.color });
      else preview.textContent = "?";
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: `*.${name}` });
      const bits = [entry.icon];
      if (entry.color) bits.push(entry.color);
      if (entry.size) bits.push(entry.size);
      if (entry.iconDark) bits.push(`dunkel: ${entry.iconDark}`);
      label.createDiv({ text: bits.join(" · "), cls: "obsidian-icon-picker-more" });
      const remove = row.createEl("button", {
        text: "Entfernen",
        cls: "obsidian-icon-gallery-remove",
      }) as HTMLButtonElement;
      remove.onclick = () => {
        void this.mapping.removeExt(name).then(() => {
          this.onChanged();
          void this.render();
        });
      };
    }

    const local = new Set(await this.store.listSvgNames());
    for (const [, entry] of [...used, ...this.mapping.extEntries()]) {
      const ref = parseIconRef(entry.icon);
      if (ref?.kind === "svg") local.delete(ref.name);
      if (entry.iconDark) {
        const dark = parseIconRef(entry.iconDark);
        if (dark?.kind === "svg") local.delete(dark.name);
      }
    }
    const unused = [...local].sort((a, b) => a.localeCompare(b));
    contentEl.createEl("div", {
      text: `Ungenutzt (${unused.length})`,
      cls: "obsidian-icon-picker-group",
    });
    if (unused.length === 0) {
      contentEl.createDiv({
        text: "Alles in Verwendung",
        cls: "obsidian-icon-picker-more",
      });
    }
    for (const name of unused.slice(0, 100)) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      const svg = await this.store.getSvg(name);
      if (svg) preview.innerHTML = svg;
      else preview.textContent = "?";
      row.createDiv({ text: name, cls: "obsidian-icon-picker-name" });
    }
    if (unused.length > 100) {
      contentEl.createDiv({
        text: `… ${unused.length - 100} weitere`,
        cls: "obsidian-icon-picker-more",
      });
    }
  }
}

/** Ergebnis Anzeige für den Befehl Icons prüfen. */
export class IconCheckModal extends Modal {
  constructor(
    app: App,
    private result: { broken: [string, string][]; used: number; unused: number },
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: "Icons prüfen" });
    contentEl.createDiv({
      text: `${this.result.used} vergeben, ${this.result.unused} ungenutzt, ${this.result.broken.length} defekt`,
      cls: "obsidian-icon-picker-more",
    });
    for (const [path, ref] of this.result.broken) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      row.createDiv({ text: "?", cls: "obsidian-icon-picker-preview" });
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: path });
      label.createDiv({ text: ref, cls: "obsidian-icon-picker-more" });
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
