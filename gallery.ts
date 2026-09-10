import { App, Modal } from "obsidian";
import { IconRef, IconStore, parseIconRef, renderIconInto } from "./icons";
import { MappingStore } from "./mapping";
import { t } from "./i18n";

/** Gleichzeitige Vorschaubilder, wie im Explorer begrenzt. */
const PAINT_CONCURRENCY = 6;

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

  private closed = true;

  async onOpen(): Promise<void> {
    this.closed = false;
    await this.render();
  }

  onClose(): void {
    this.closed = true;
    this.contentEl.empty();
  }

  /** Vorschaubilder gebündelt malen, Abbruch bei Schließen. */
  private async paintAll(
    paints: { el: HTMLElement; ref: IconRef; color?: string }[],
  ): Promise<void> {
    for (let i = 0; i < paints.length; i += PAINT_CONCURRENCY) {
      if (this.closed) return;
      await Promise.all(
        paints.slice(i, i + PAINT_CONCURRENCY).map(({ el, ref, color }) =>
          renderIconInto(el, ref, this.store, { color }),
        ),
      );
    }
  }

  private async render(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-icon-gallery");
    contentEl.createEl("h3", { text: t("gal.title") });

    const used = this.mapping.entries();
    const extRules = this.mapping.extEntries();
    contentEl.createEl("div", {
      text: t("gal.assigned", { count: used.length, rules: extRules.length }),
      cls: "obsidian-icon-picker-group",
    });
    if (used.length === 0) {
      contentEl.createDiv({
        text: t("gal.empty"),
        cls: "obsidian-icon-picker-more",
      });
    }
    const paints: { el: HTMLElement; ref: IconRef; color?: string }[] = [];
    for (const [path, entry] of used) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      const ref = parseIconRef(entry.icon);
      if (ref) paints.push({ el: preview, ref, color: entry.color });
      else preview.textContent = "?";
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: path });
      const bits = [entry.icon];
      if (entry.color) bits.push(entry.color);
      if (entry.size) bits.push(entry.size);
      if (entry.iconDark) bits.push(t("gal.dark", { value: entry.iconDark }));
      label.createDiv({ text: bits.join(" · "), cls: "obsidian-icon-picker-more" });
      const remove = row.createEl("button", {
        text: t("gal.remove"),
        cls: "obsidian-icon-gallery-remove",
      }) as HTMLButtonElement;
      remove.onclick = () => {
        void this.mapping.remove(path).then(() => {
          this.onChanged();
          void this.render();
        });
      };
    }

    contentEl.createEl("div", {
      text: t("gal.ext", { count: extRules.length }),
      cls: "obsidian-icon-picker-group",
    });
    for (const [name, entry] of extRules) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      const ref = parseIconRef(entry.icon);
      if (ref) paints.push({ el: preview, ref, color: entry.color });
      else preview.textContent = "?";
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: `*.${name}` });
      const bits = [entry.icon];
      if (entry.color) bits.push(entry.color);
      if (entry.size) bits.push(entry.size);
      if (entry.iconDark) bits.push(t("gal.dark", { value: entry.iconDark }));
      label.createDiv({ text: bits.join(" · "), cls: "obsidian-icon-picker-more" });
      const remove = row.createEl("button", {
        text: t("gal.remove"),
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
    if (this.closed) return;
    for (const [, entry] of [...used, ...extRules]) {
      const ref = parseIconRef(entry.icon);
      if (ref?.kind === "svg") local.delete(ref.name);
      if (entry.iconDark) {
        const dark = parseIconRef(entry.iconDark);
        if (dark?.kind === "svg") local.delete(dark.name);
      }
    }
    const unused = [...local].sort((a, b) => a.localeCompare(b));
    contentEl.createEl("div", {
      text: t("gal.unused", { count: unused.length }),
      cls: "obsidian-icon-picker-group",
    });
    if (unused.length === 0) {
      contentEl.createDiv({
        text: t("gal.allUsed"),
        cls: "obsidian-icon-picker-more",
      });
    }
    for (const name of unused.slice(0, 100)) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      paints.push({ el: preview, ref: { kind: "svg", name } });
      row.createDiv({ text: name, cls: "obsidian-icon-picker-name" });
    }
    if (unused.length > 100) {
      contentEl.createDiv({
        text: t("gal.more", { count: unused.length - 100 }),
        cls: "obsidian-icon-picker-more",
      });
    }
    await this.paintAll(paints);
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
    contentEl.createEl("h3", { text: t("check.title") });
    contentEl.createDiv({
      text: t("check.summary", {
        used: this.result.used,
        unused: this.result.unused,
        broken: this.result.broken.length,
      }),
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
