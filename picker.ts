import { App, Modal, Setting, setIcon } from "obsidian";
import {
  IconStore,
  THEME_COLORS,
  contrastOnBackground,
  parseIconRef,
  parseSize,
  renderIconInto,
  themeVar,
} from "./icons";
import { DEVICON_TAGS } from "./cdn-catalog";

const COLOR_NAMES: Record<(typeof THEME_COLORS)[number], string> = {
  red: "Rot",
  orange: "Orange",
  yellow: "Gelb",
  green: "Grün",
  cyan: "Türkis",
  blue: "Blau",
  purple: "Lila",
  pink: "Pink",
  gray: "Grau",
};

export interface PickerResult {
  icon: string;
  color?: string;
  size?: string;
  iconDark?: string;
}

export interface PickerMeta {
  favorites: string[];
  recent: string[];
  onToggleFavorite: (ref: string) => void;
}

interface PickerItem {
  ref: string;
  label: string;
  group: string;
  hay: string[];
  cdn?: boolean;
}

const PER_GROUP_LIMIT = 80;

/** Suchfutter einmal pro Dialog bauen, nicht pro Tastenschlag. */
function hayForPicker(ref: string): string[] {
  const hay = [ref.toLowerCase()];
  if (ref.startsWith("devicon/")) {
    const tags = DEVICON_TAGS[ref.slice("devicon/".length)];
    if (tags) hay.push(...tags);
  } else if (ref.startsWith("lucide:")) {
    hay.push(ref.slice("lucide:".length).toLowerCase());
  }
  return hay;
}

/**
 * Icon Auswahl mit Suche, Vorschau und Farbe wie bei Iconic:
 * neun Theme Punkte, kein Farbwert und freier Hex Wähler.
 */
export class IconPickerModal extends Modal {
  private query = "";
  private selected: string | null;
  private color: string | undefined;
  private size: string | undefined;
  private darkIcon: string | undefined;
  private pickDark = false;
  private items: PickerItem[] = [];
  private localRefs = new Set<string>();
  private filled = false;
  private searchTimer = 0;
  private listEl!: HTMLElement;
  private saveBtn!: HTMLButtonElement;
  private saveFileBtn!: HTMLButtonElement;
  private colorNameEl!: HTMLElement;
  private colorWarnEl!: HTMLElement;
  private darkLine!: HTMLElement;
  private darkBtn!: HTMLButtonElement;
  private previewBox!: HTMLElement;
  private hexSwatch!: HTMLInputElement;
  private hexText!: HTMLInputElement;

  constructor(
    app: App,
    private store: IconStore,
    initial: PickerResult | null,
    private onDone: (result: PickerResult | null) => void,
    private cdnRefs: string[] = [],
    private onSaveFile?: (ref: string) => void,
    private meta?: PickerMeta,
  ) {
    super(app);
    this.selected = initial?.icon ?? null;
    this.color = initial?.color;
    this.size = initial?.size;
    this.darkIcon = initial?.iconDark;
  }

  /** Katalog trifft nach Dialog Start ein, Liste neu aufbauen. */
  async refreshCdnRefs(refs: string[]): Promise<void> {
    this.cdnRefs = refs;
    // onOpen baut noch: es liest die dann aktuellen cdnRefs.
    if (!this.filled) return;
    const names = await this.store.listSvgNames();
    this.buildItems(names);
    this.renderList();
  }

  private buildItems(names: string[]): void {
    const localSet = new Set(names);
    this.localRefs = localSet;
    const groupFor = (ref: string): string =>
      ref.startsWith("devicon/")
        ? "Devicon"
        : ref.startsWith("simple/")
          ? "Simple"
          : ref.startsWith("selfhosted/")
            ? "Self-Hosted"
            : "Eigene";
    const byRef = new Map<string, PickerItem>();
    for (const ref of this.cdnRefs) {
      byRef.set(ref, {
        ref,
        label: `${ref} ⭳`,
        group: groupFor(ref),
        hay: hayForPicker(ref),
        cdn: true,
      });
    }
    for (const name of names) {
      byRef.set(name, {
        ref: name,
        label: name,
        group: groupFor(name),
        hay: hayForPicker(name),
      });
    }
    const svgItems = [...byRef.values()];
    const lucideItems: PickerItem[] = this.store
      .lucideIds()
      .map((id) => ({
        ref: `lucide:${id}`,
        label: id,
        group: "Lucide",
        hay: hayForPicker(`lucide:${id}`),
      }));
    const known = new Set([
      ...svgItems.map((i) => i.ref),
      ...lucideItems.map((i) => i.ref),
    ]);
    const metaItems: PickerItem[] = [];
    const seenMeta = new Set<string>();
    for (const ref of this.meta?.favorites ?? []) {
      if (known.has(ref) && !seenMeta.has(ref)) {
        seenMeta.add(ref);
        metaItems.push({ ref, label: ref, group: "Favoriten", hay: hayForPicker(ref) });
      }
    }
    for (const ref of this.meta?.recent ?? []) {
      if (known.has(ref) && !seenMeta.has(ref)) {
        seenMeta.add(ref);
        metaItems.push({ ref, label: ref, group: "Zuletzt", hay: hayForPicker(ref) });
      }
    }
    this.items = [...metaItems, ...svgItems, ...lucideItems];
    this.filled = true;
  }

  async onOpen(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-icon-picker");
    contentEl.createEl("h3", { text: "Icon wählen" });
    this.darkLine = contentEl.createDiv({
      cls: "obsidian-icon-picker-more",
    });
    this.renderDarkLine();

    const names = await this.store.listSvgNames();
    this.buildItems(names);

    new Setting(contentEl).setName("Suchen").addText((text) => {
      text.setPlaceholder("Name tippen …").onChange((value) => {
        this.query = value;
        window.clearTimeout(this.searchTimer);
        this.searchTimer = window.setTimeout(() => this.renderList(), 100);
      });
    });

    this.listEl = contentEl.createDiv({ cls: "obsidian-icon-picker-list" });
    this.renderList();

    const colorWrap = contentEl.createDiv({ cls: "obsidian-icon-picker-colors" });
    const colorHead = colorWrap.createDiv({
      cls: "obsidian-icon-picker-colorhead",
    });
    colorHead.createEl("div", {
      text: "Farbe",
      cls: "obsidian-icon-picker-label",
    });
    this.colorNameEl = colorHead.createEl("div", {
      cls: "obsidian-icon-picker-colorname",
    });
    const colorBody = colorWrap.createDiv({
      cls: "obsidian-icon-picker-colorbody",
    });
    this.previewBox = colorBody.createDiv({
      cls: "obsidian-icon-picker-bigpreview",
    });
    const dotsCol = colorBody.createDiv();
    const dots = dotsCol.createDiv({ cls: "obsidian-icon-picker-dots" });
    const noneWrap = dots.createDiv({ cls: "obsidian-icon-dotwrap" });
    const none = noneWrap.createEl("button", {
      text: "✕",
      cls: "obsidian-icon-dot obsidian-icon-dot-none",
      attr: { title: "Keine Farbe, Standard verwenden" },
    });
    noneWrap.createEl("div", {
      text: "Aus",
      cls: "obsidian-icon-dotlabel",
    });
    none.onclick = () => {
      this.color = undefined;
      this.refreshColorUI();
    };
    for (const name of THEME_COLORS) {
      const wrap = dots.createDiv({ cls: "obsidian-icon-dotwrap" });
      const dot = wrap.createEl("button", {
        cls: "obsidian-icon-dot",
        attr: { "aria-label": COLOR_NAMES[name], title: COLOR_NAMES[name] },
      });
      dot.style.background = themeVar(name) ?? `var(--color-${name})`;
      dot.dataset.color = name;
      dot.onclick = () => {
        this.color = name;
        this.refreshColorUI();
      };
      wrap.createEl("div", {
        text: COLOR_NAMES[name],
        cls: "obsidian-icon-dotlabel",
      });
    }
    const hexRow = dotsCol.createDiv({ cls: "obsidian-icon-picker-hexrow" });
    this.hexSwatch = hexRow.createEl("input", {
      cls: "obsidian-icon-dot-hex",
      attr: { type: "color", title: "Freie Farbe wählen" },
    }) as HTMLInputElement;
    this.hexText = hexRow.createEl("input", {
      cls: "obsidian-icon-picker-hextext",
      attr: { type: "text", placeholder: "#339af0", title: "Hex Wert" },
    }) as HTMLInputElement;
    this.hexSwatch.oninput = () => {
      this.color = this.hexSwatch.value;
      this.refreshColorUI();
    };
    this.hexText.onchange = () => {
      const value = this.hexText.value.trim();
      if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        this.color = value;
      }
      this.refreshColorUI();
    };
    this.colorWarnEl = colorWrap.createDiv({
      cls: "obsidian-icon-picker-warn",
    });
    this.colorWarnEl.style.display = "none";
    this.refreshColorUI();

    const footer = contentEl.createDiv({ cls: "obsidian-icon-picker-footer" });
    const cancel = footer.createEl("button", { text: "Abbrechen" });
    cancel.onclick = () => this.close();
    this.saveFileBtn = footer.createEl("button", {
      text: "Als Datei speichern",
    }) as HTMLButtonElement;
    this.saveFileBtn.onclick = () => {
      if (this.selected && this.onSaveFile) this.onSaveFile(this.selected);
    };
    this.saveBtn = footer.createEl("button", {
      text: "Übernehmen",
      cls: "mod-cta",
    }) as HTMLButtonElement;
    this.saveBtn.disabled = !this.selected;
    this.updateSaveFileBtn();
    this.darkBtn = footer.createEl("button", {
      text: "Dark-Icon wählen",
      attr: {
        title:
          "Icon für den Dark Mode festlegen: danach ein Icon aus der Liste anklicken, es wird nur im dunklen Theme gezeigt.",
      },
    }) as HTMLButtonElement;
    this.darkBtn.onclick = () => {
      this.pickDark = !this.pickDark;
      this.darkBtn.setText(
        this.pickDark ? "Auswahl abbrechen" : "Dark-Icon wählen",
      );
      this.renderDarkLine();
    };
    this.saveBtn.onclick = () => {
      if (!this.selected) return;
      const result: PickerResult = { icon: this.selected };
      if (this.color) result.color = this.color;
      const size = parseSize(this.size?.trim());
      if (size) result.size = size;
      if (this.darkIcon && this.darkIcon !== this.selected) {
        result.iconDark = this.darkIcon;
      }
      this.onDone(result);
      this.close();
    };

    new Setting(contentEl)
      .setName("Größe (optional)")
      .setDesc("Leer lassen für Standard, Zahl gilt als Pixel.")
      .addText((text) =>
        text
          .setPlaceholder("1.4em oder 20")
          .setValue(this.size ?? "")
          .onChange((value) => {
            this.size = value;
          }),
      );
  }

  onClose(): void {
    window.clearTimeout(this.searchTimer);
    this.contentEl.empty();
  }

  private refreshColorUI(): void {
    const dots = this.contentEl.querySelectorAll(".obsidian-icon-dot");
    dots.forEach((d) => {
      const el = d as HTMLElement;
      const isNone =
        el.classList.contains("obsidian-icon-dot-none") && !this.color;
      const isColor =
        el.dataset.color !== undefined && el.dataset.color === this.color;
      el.toggleClass("is-selected", isNone || isColor);
    });
    if (!this.color) {
      this.colorNameEl.textContent = "Standard";
    } else if (
      (THEME_COLORS as readonly string[]).includes(this.color) &&
      this.color in COLOR_NAMES
    ) {
      this.colorNameEl.textContent =
        COLOR_NAMES[this.color as (typeof THEME_COLORS)[number]];
    } else {
      this.colorNameEl.textContent = this.color;
    }
    if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(this.color ?? "")) {
      try {
        this.hexSwatch.value = this.color as string;
      } catch {
        /* ignore */
      }
      this.hexText.value = this.color as string;
    } else if (!this.color) {
      this.hexText.value = "";
    }
    const ratio = this.color ? contrastOnBackground(this.color) : null;
    if (this.colorWarnEl) {
      const low = ratio !== null && ratio < 3;
      this.colorWarnEl.style.display = low ? "" : "none";
      if (low) {
        this.colorWarnEl.textContent = `Schwacher Kontrast in diesem Theme (${ratio.toFixed(1)}:1)`;
      }
    }
    void this.updatePreview();
  }

  private async updatePreview(): Promise<void> {
    const box = this.previewBox;
    if (!box) return;
    box.empty();
    if (!this.selected) {
      box.createDiv({
        text: "?",
        cls: "obsidian-icon-picker-more",
      });
      return;
    }
    const ref = parseIconRef(this.selected);
    if (!ref) return;
    await renderIconInto(box, ref, this.store, { color: this.color });
    box.addClass("obsidian-icon-picker-bigpreview");
  }

  private renderList(): void {
    this.listEl.empty();
    const groups = [
      "Favoriten",
      "Zuletzt",
      "Eigene",
      "Devicon",
      "Simple",
      "Self-Hosted",
      "Lucide",
    ];
    const terms = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const buckets = new Map<string, PickerItem[]>();
    for (const item of this.items) {
      if (
        terms.length > 0 &&
        !terms.every((term) => item.hay.some((h) => h.includes(term)))
      ) {
        continue;
      }
      const bucket = buckets.get(item.group);
      if (bucket) bucket.push(item);
      else buckets.set(item.group, [item]);
    }
    let any = false;
    for (const group of groups) {
      const rows = buckets.get(group);
      if (!rows || rows.length === 0) continue;
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
        if (this.meta) {
          const fav = row.createEl("button", {
            text: this.meta.favorites.includes(item.ref) ? "★" : "☆",
            cls: "obsidian-icon-picker-fav",
            attr: { title: "Favorit umschalten" },
          }) as HTMLButtonElement;
          fav.onclick = (event) => {
            event.stopPropagation();
            this.meta?.onToggleFavorite(item.ref);
            this.renderList();
          };
        }
        row.onclick = () => {
          void this.selectRow(item, row);
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

  private updateSaveFileBtn(): void {
    const show =
      !!this.onSaveFile &&
      !!this.selected &&
      !this.localRefs.has(this.selected) &&
      this.cdnRefs.includes(this.selected);
    this.saveFileBtn.style.display = show ? "" : "none";
  }

  private renderDarkLine(): void {
    if (!this.darkLine) return;
    if (this.pickDark) {
      this.darkLine.textContent =
        "Jetzt ein Icon aus der Liste anklicken → wird Dark-Mode-Icon";
      return;
    }
    this.darkLine.textContent = this.darkIcon
      ? `Dark Mode: ${this.darkIcon}`
      : "Dark Mode: wie helles Icon";
  }

  private async selectRow(item: PickerItem, row: HTMLElement): Promise<void> {
    this.listEl
      .querySelectorAll(".is-selected")
      .forEach((el) => el.removeClass("is-selected"));
    row.addClass("is-selected");
    if (item.cdn) {
      this.saveBtn.disabled = true;
      const preview = row.querySelector(
        ".obsidian-icon-picker-preview",
      ) as HTMLElement | null;
      if (preview) preview.textContent = "…";
      const svg = await this.store.getSvg(item.ref);
      if (preview) {
        if (svg) preview.innerHTML = svg;
        else preview.textContent = "?";
      }
      if (!svg) return;
    }
    if (this.pickDark) {
      this.darkIcon = item.ref;
      this.pickDark = false;
      this.darkBtn.setText("Dark-Icon wählen");
      this.renderDarkLine();
      this.saveBtn.disabled = !this.selected;
      row.removeClass("is-selected");
      return;
    }
    this.selected = item.ref;
    this.saveBtn.disabled = false;
    this.updateSaveFileBtn();
    void this.updatePreview();
  }

  private async previewInto(el: HTMLElement, item: PickerItem): Promise<void> {
    if (item.ref.startsWith("lucide:")) {
      setIcon(el, item.ref.slice("lucide:".length));
      return;
    }
    if (item.cdn) {
      el.textContent = "⭳";
      return;
    }
    const svg = await this.store.getSvg(item.ref);
    if (svg) el.innerHTML = svg;
    else el.textContent = "?";
  }
}
