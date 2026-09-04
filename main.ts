import {
  App,
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
  normalizeFolder,
  parseIconRef,
  parseSize,
  renderIconInto,
} from "./icons";
import { MappingStore } from "./mapping";
import { ExplorerIcons } from "./explorer";
import { IconPickerModal, PickerResult } from "./picker";

interface InlineSvgIconsSettings {
  iconFolder: string;
  mappingFile: string;
}

const DEFAULT_SETTINGS: InlineSvgIconsSettings = {
  iconFolder: "_assets/icons",
  mappingFile: "_assets/icon-mapping.json",
};

// {{icon:name}}, {{icon:devicon/proxmox}}, {{icon:lucide:folder}},
// {{icon:name|24}}, {{icon:name|1.5em}}. Emoji geht nur im Explorer Mapping.
const ICON_TAG_RE =
  /\{\{icon:([A-Za-z0-9_\-/:.]+?)(?:\.svg)?(?:\|([0-9]+(?:\.[0-9]+)?(?:px|em|rem|%|pt)?))?\}\}/g;

type SvgLoader = (ref: IconRef, size?: string) => void;

class IconWidget extends WidgetType {
  constructor(
    private ref: IconRef,
    private size: string | undefined,
    private store: IconStore,
  ) {
    super();
  }

  eq(other: IconWidget): boolean {
    const a = this.ref as { kind: string; name?: string; id?: string; char?: string };
    const b = other.ref as { kind: string; name?: string; id?: string; char?: string };
    return (
      a.kind === b.kind &&
      a.name === b.name &&
      a.id === b.id &&
      a.char === b.char &&
      this.size === other.size
    );
  }

  toDOM(): HTMLElement {
    const span = document.createElement("span");
    void renderIconInto(span, this.ref, this.store, { size: this.size });
    return span;
  }
}

function buildIconExtension(store: IconStore): Extension {
  const matcher = new MatchDecorator({
    regexp: new RegExp(ICON_TAG_RE.source, "g"),
    decoration: (match) => {
      const ref = parseIconRef(match[1] ?? "");
      if (!ref || ref.kind === "emoji") return null;
      const size = parseSize(match[2]);
      return Decoration.replace({
        widget: new IconWidget(ref, size, store),
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

  async onload(): Promise<void> {
    await this.loadSettings();
    this.icons = new IconStore(this.app, () => this.settings.iconFolder);
    this.mapping = new MappingStore(this.app, () => this.settings.mappingFile);
    await this.mapping.load();
    this.explorer = new ExplorerIcons(this.app, this.icons, this.mapping);

    // Live Preview (CM6)
    this.registerEditorExtension(buildIconExtension(this.icons));

    // Lesemodus
    this.registerMarkdownPostProcessor(async (el) => {
      await this.postProcess(el);
    });

    this.app.workspace.onLayoutReady(() => this.explorer.start());
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.explorer.refreshSoon()),
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

    this.addSettingTab(new InlineSvgIconsSettingTab(this.app, this));
  }

  onunload(): void {
    this.explorer?.stop();
  }

  private onVault(file: TAbstractFile | string): void {
    const path = typeof file === "string" ? file : file.path;
    if (this.mapping.isMappingPath(path)) {
      void this.mapping.load().then(() => this.explorer.refresh());
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
  }

  private openPicker(paths: string[]): void {
    const first = paths.length === 1 ? this.mapping.get(paths[0]) : null;
    const initial: PickerResult | null = first
      ? { icon: first.icon, ...(first.color ? { color: first.color } : {}) }
      : null;
    new IconPickerModal(this.app, this.icons, initial, (result) => {
      if (result) void this.applyIcons(paths, result);
    }).open();
  }

  private async applyIcons(paths: string[], result: PickerResult): Promise<void> {
    for (const path of paths) {
      await this.mapping.set(path, {
        icon: result.icon,
        ...(result.color ? { color: result.color } : {}),
      });
    }
    this.explorer.refreshSoon();
  }

  private async removeIcons(paths: string[]): Promise<void> {
    for (const path of paths) await this.mapping.remove(path);
    this.explorer.refreshSoon();
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
      const size = parseSize(m[2]);
      if (!ref || ref.kind === "emoji") {
        frag.appendText(m[0]);
      } else {
        const span = document.createElement("span");
        await renderIconInto(span, ref, this.icons, { size });
        frag.append(span);
      }
      last = m.index + m[0].length;
    }

    if (!found) return;
    if (last < text.length) frag.appendText(text.slice(last));
    node.parentNode?.replaceChild(frag, node);
  }

  async loadSettings(): Promise<void> {
    this.settings = { ...DEFAULT_SETTINGS, ...((await this.loadData()) ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    this.icons.clear();
    await this.mapping.load();
    this.explorer.refreshSoon();
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
  }
}
