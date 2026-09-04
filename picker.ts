import { App, Modal, Setting, setIcon } from "obsidian";
import { IconStore, THEME_COLORS, themeVar } from "./icons";

export interface PickerResult {
  icon: string;
  color?: string;
}

interface PickerItem {
  ref: string;
  label: string;
  group: string;
}

const PER_GROUP_LIMIT = 80;

/**
 * Icon Auswahl mit Suche, Vorschau und Farbe wie bei Iconic:
 * neun Theme Punkte, kein Farbwert und freier Hex Wähler.
 */
export class IconPickerModal extends Modal {
  private query = "";
  private selected: string | null;
  private color: string | undefined;
  private items: PickerItem[] = [];
  private listEl!: HTMLElement;
  private saveBtn!: HTMLButtonElement;

  constructor(
    app: App,
    private store: IconStore,
    initial: PickerResult | null,
    private onDone: (result: PickerResult | null) => void,
  ) {
    super(app);
    this.selected = initial?.icon ?? null;
    this.color = initial?.color;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-icon-picker");
    contentEl.createEl("h3", { text: "Icon wählen" });

    const names = await this.store.listSvgNames();
    const svgItems: PickerItem[] = names.map((n) => ({
      ref: n,
      label: n,
      group: n.startsWith("devicon/")
        ? "Devicon"
        : n.startsWith("simple/")
          ? "Simple"
          : "Eigene",
    }));
    const lucideItems: PickerItem[] = this.store
      .lucideIds()
      .map((id) => ({ ref: `lucide:${id}`, label: id, group: "Lucide" }));
    this.items = [...svgItems, ...lucideItems];

    new Setting(contentEl).setName("Suchen").addText((text) => {
      text.setPlaceholder("Name tippen …").onChange((value) => {
        this.query = value;
        this.renderList();
      });
    });

    this.listEl = contentEl.createDiv({ cls: "obsidian-icon-picker-list" });
    this.renderList();

    const colorWrap = contentEl.createDiv({ cls: "obsidian-icon-picker-colors" });
    colorWrap.createEl("div", {
      text: "Farbe",
      cls: "obsidian-icon-picker-label",
    });
    const dots = colorWrap.createDiv({ cls: "obsidian-icon-picker-dots" });
    const none = dots.createEl("button", {
      text: "keine",
      cls: "obsidian-icon-dot obsidian-icon-dot-none",
    });
    none.onclick = () => {
      this.color = undefined;
      this.markDots();
    };
    for (const name of THEME_COLORS) {
      const dot = dots.createEl("button", {
        cls: "obsidian-icon-dot",
        attr: { "aria-label": name, title: name },
      });
      dot.style.background = `var(--color-${name})`;
      dot.dataset.color = name;
      dot.onclick = () => {
        this.color = name;
        this.markDots();
      };
    }
    const hex = dots.createEl("input", {
      cls: "obsidian-icon-dot-hex",
      attr: { type: "color", title: "Freie Farbe" },
    }) as HTMLInputElement;
    if (this.color && themeVar(this.color) && !THEME_COLORS.includes(this.color as (typeof THEME_COLORS)[number])) {
      try {
        hex.value = this.color;
      } catch {
        /* ignore */
      }
    }
    hex.onchange = () => {
      this.color = hex.value;
      this.markDots();
    };
    this.markDots();

    const footer = contentEl.createDiv({ cls: "obsidian-icon-picker-footer" });
    const cancel = footer.createEl("button", { text: "Abbrechen" });
    cancel.onclick = () => this.close();
    this.saveBtn = footer.createEl("button", {
      text: "Übernehmen",
      cls: "mod-cta",
    }) as HTMLButtonElement;
    this.saveBtn.disabled = !this.selected;
    this.saveBtn.onclick = () => {
      if (!this.selected) return;
      const result: PickerResult = { icon: this.selected };
      if (this.color) result.color = this.color;
      this.onDone(result);
      this.close();
    };
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private markDots(): void {
    const dots = this.contentEl.querySelectorAll(".obsidian-icon-dot");
    dots.forEach((d) => {
      const el = d as HTMLElement;
      const isNone =
        el.classList.contains("obsidian-icon-dot-none") && !this.color;
      const isColor =
        el.dataset.color !== undefined && el.dataset.color === this.color;
      el.toggleClass("is-selected", isNone || isColor);
    });
  }

  private matches(ref: string): boolean {
    const q = this.query.trim().toLowerCase();
    if (!q) return true;
    const hay = ref.toLowerCase();
    return q.split(/\s+/).every((term) => hay.includes(term));
  }

  private renderList(): void {
    this.listEl.empty();
    const groups = ["Eigene", "Devicon", "Simple", "Lucide"];
    let any = false;
    for (const group of groups) {
      const rows = this.items.filter(
        (item) => item.group === group && this.matches(item.ref),
      );
      if (rows.length === 0) continue;
      any = true;
      this.listEl.createEl("div", {
        text: group,
        cls: "obsidian-icon-picker-group",
      });
      for (const item of rows.slice(0, PER_GROUP_LIMIT)) {
        const row = this.listEl.createDiv({
          cls: "obsidian-icon-picker-row",
        });
        if (item.ref === this.selected) row.addClass("is-selected");
        const preview = row.createDiv({
          cls: "obsidian-icon-picker-preview",
        });
        void this.previewInto(preview, item);
        row.createDiv({ text: item.label, cls: "obsidian-icon-picker-name" });
        row.onclick = () => {
          this.selected = item.ref;
          this.saveBtn.disabled = false;
          this.listEl
            .querySelectorAll(".is-selected")
            .forEach((el) => el.removeClass("is-selected"));
          row.addClass("is-selected");
        };
      }
      if (rows.length > PER_GROUP_LIMIT) {
        this.listEl.createDiv({
          text: `… ${rows.length - PER_GROUP_LIMIT} weitere, Suche einschränken`,
          cls: "obsidian-icon-picker-more",
        });
      }
    }
    if (!any) {
      this.listEl.createDiv({
        text: "Nichts gefunden",
        cls: "obsidian-icon-picker-more",
      });
    }
  }

  private async previewInto(el: HTMLElement, item: PickerItem): Promise<void> {
    if (item.ref.startsWith("lucide:")) {
      setIcon(el, item.ref.slice("lucide:".length));
      return;
    }
    const svg = await this.store.getSvg(item.ref);
    if (svg) el.innerHTML = svg;
    else el.textContent = "?";
  }
}
