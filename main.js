/* Inline SVG Icons - no external runtime dependencies */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => InlineSvgIconsPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");
var import_view = require("@codemirror/view");

// icons.ts
var import_obsidian = require("obsidian");
function normalizeFolder(raw) {
  return raw.trim().replace(/^\/+/, "").replace(/\/+$/, "");
}
function normalizeSvgName(raw) {
  let name = raw.trim().replace(/^\/+/, "");
  if (!name || name.includes(".."))
    return null;
  if (name.toLowerCase().endsWith(".svg"))
    name = name.slice(0, -4);
  if (!name || !/^[A-Za-z0-9_\-/]+$/.test(name))
    return null;
  return name;
}
function parseIconRef(raw) {
  const text = raw.trim().replace(/^\/+/, "");
  if (!text || text.includes(".."))
    return null;
  if (text.startsWith("lucide:")) {
    const id = text.slice("lucide:".length).trim();
    return id && /^[A-Za-z0-9-]+$/.test(id) ? { kind: "lucide", id } : null;
  }
  if (text.startsWith("emoji:")) {
    const char = text.slice("emoji:".length);
    return char ? { kind: "emoji", char } : null;
  }
  const name = normalizeSvgName(text);
  return name ? { kind: "svg", name } : null;
}
function isBrandSvg(ref) {
  return ref.kind === "svg" && (ref.name.startsWith("devicon/") || ref.name.startsWith("simple/"));
}
function parseSize(raw) {
  if (!raw)
    return void 0;
  if (/^[0-9]+(\.[0-9]+)?$/.test(raw))
    return `${raw}px`;
  if (/^[0-9]+(\.[0-9]+)?(px|em|rem|%|pt)$/.test(raw))
    return raw;
  return void 0;
}
function sanitizeSvg(svg) {
  return svg.replace(/<script[\s\S]*?<\/script\s*>/gi, "").replace(/\son\w+\s*=\s*("[^"]*"|'[^']*')/gi, "").replace(/javascript\s*:/gi, "");
}
var THEME_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "cyan",
  "blue",
  "purple",
  "pink",
  "gray"
];
function themeVar(color) {
  if (!color)
    return null;
  const name = color.trim().toLowerCase();
  if (THEME_COLORS.includes(name)) {
    return `var(--color-${name})`;
  }
  try {
    if (CSS.supports("color", color))
      return color;
  } catch (e) {
    return null;
  }
  return null;
}
var IconStore = class {
  constructor(app, getFolder) {
    this.app = app;
    this.getFolder = getFolder;
    this.cache = /* @__PURE__ */ new Map();
  }
  filePath(name) {
    return `${normalizeFolder(this.getFolder())}/${name}.svg`;
  }
  async getSvg(name) {
    const path = this.filePath(name);
    const hit = this.cache.get(path);
    if (hit !== void 0)
      return hit;
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (!(file instanceof import_obsidian.TFile))
        return null;
      const raw = await this.app.vault.read(file);
      if (!raw.includes("<svg"))
        return null;
      const clean = sanitizeSvg(raw);
      this.cache.set(path, clean);
      return clean;
    } catch (e) {
      return null;
    }
  }
  /** Alle SVGs im Icon Ordner, relativ und ohne Endung, sortiert. */
  async listSvgNames() {
    const folder = normalizeFolder(this.getFolder());
    const prefix = folder + "/";
    return this.app.vault.getFiles().filter((f) => f.path.startsWith(prefix) && f.extension === "svg").map((f) => f.path.slice(prefix.length, -".svg".length)).filter((n) => /^[A-Za-z0-9_\-/]+$/.test(n)).sort((a, b) => a.localeCompare(b));
  }
  lucideIds() {
    try {
      return (0, import_obsidian.getIconIds)();
    } catch (e) {
      return [];
    }
  }
  handlesPath(path) {
    const folder = normalizeFolder(this.getFolder());
    return path === folder || path.startsWith(folder + "/");
  }
  invalidatePath(path) {
    if (!this.handlesPath(path))
      return;
    if (path.toLowerCase().endsWith(".svg")) {
      this.cache.delete(path);
    } else {
      this.clear();
    }
  }
  clear() {
    this.cache.clear();
  }
};
function renderMissing(el, label) {
  el.addClass("obsidian-icon-missing");
  el.setAttribute("title", `Icon nicht gefunden: ${label}`);
  el.textContent = `[${label}]`;
  console.warn(`[inline-svg-icons] nicht gefunden: ${label}`);
}
async function renderIconInto(el, ref, store, opts) {
  el.addClass("obsidian-icon-inline");
  const label = ref.kind === "svg" ? ref.name : ref.kind === "lucide" ? ref.id : ref.char;
  const color = !isBrandSvg(ref) ? themeVar(opts == null ? void 0 : opts.color) : null;
  if (opts == null ? void 0 : opts.size) {
    el.style.width = opts.size;
    el.style.height = opts.size;
  }
  if (ref.kind === "emoji") {
    el.textContent = ref.char;
    return;
  }
  if (ref.kind === "lucide") {
    el.empty();
    (0, import_obsidian.setIcon)(el, ref.id);
    const svgEl2 = el.querySelector("svg");
    if (!svgEl2) {
      el.empty();
      renderMissing(el, `lucide:${label}`);
      return;
    }
    if (color)
      el.style.color = color;
    if (opts == null ? void 0 : opts.size) {
      svgEl2.setAttribute("width", opts.size);
      svgEl2.setAttribute("height", opts.size);
    }
    return;
  }
  const svg = await store.getSvg(ref.name);
  if (!svg) {
    renderMissing(el, label);
    return;
  }
  el.innerHTML = svg;
  const svgEl = el.querySelector("svg");
  if (!svgEl) {
    el.empty();
    renderMissing(el, label);
    return;
  }
  if (color)
    el.style.color = color;
  if (!isBrandSvg(ref) && !svgEl.hasAttribute("fill") && !svgEl.hasAttribute("stroke")) {
    svgEl.setAttribute("fill", "currentColor");
  }
  if (opts == null ? void 0 : opts.size) {
    svgEl.setAttribute("width", opts.size);
    svgEl.setAttribute("height", opts.size);
  }
}

// mapping.ts
var import_obsidian2 = require("obsidian");
function normalizeEntry(value) {
  if (typeof value === "string") {
    const icon = value.trim();
    return icon ? { icon } : null;
  }
  if (value && typeof value.icon === "string" && value.icon.trim()) {
    const entry = { icon: value.icon.trim() };
    if (value.color && value.color.trim())
      entry.color = value.color.trim();
    return entry;
  }
  return null;
}
var MappingStore = class {
  constructor(app, getFile) {
    this.app = app;
    this.getFile = getFile;
    this.data = {};
  }
  mappingPath() {
    return normalizeFolder(this.getFile());
  }
  isMappingPath(path) {
    return path === this.mappingPath();
  }
  async load() {
    this.data = {};
    try {
      const file = this.app.vault.getAbstractFileByPath(this.mappingPath());
      if (!(file instanceof import_obsidian2.TFile))
        return;
      const raw = await this.app.vault.read(file);
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        this.data = parsed;
      }
    } catch (e) {
      console.warn("[inline-svg-icons] Mapping Datei ung\xFCltig, leer gestartet");
    }
  }
  get(path) {
    return normalizeEntry(this.data[path]);
  }
  async set(path, entry) {
    this.data[path] = entry.color ? { icon: entry.icon, color: entry.color } : entry.icon;
    await this.save();
  }
  async remove(path) {
    if (path in this.data) {
      delete this.data[path];
      await this.save();
    }
  }
  /** Ordner Umbenennung zieht Kinder mit um. */
  migrateRename(oldPath, newPath, isFolder) {
    let changed = false;
    if (oldPath in this.data) {
      this.data[newPath] = this.data[oldPath];
      delete this.data[oldPath];
      changed = true;
    }
    if (isFolder) {
      const prefix = oldPath + "/";
      for (const key of Object.keys(this.data)) {
        if (key.startsWith(prefix)) {
          this.data[newPath + key.slice(oldPath.length)] = this.data[key];
          delete this.data[key];
          changed = true;
        }
      }
    }
    if (changed)
      void this.save();
    return changed;
  }
  removePath(path, isFolder) {
    let changed = false;
    if (path in this.data) {
      delete this.data[path];
      changed = true;
    }
    if (isFolder) {
      const prefix = path + "/";
      for (const key of Object.keys(this.data)) {
        if (key.startsWith(prefix)) {
          delete this.data[key];
          changed = true;
        }
      }
    }
    if (changed)
      void this.save();
    return changed;
  }
  async save() {
    const path = this.mappingPath();
    const content = JSON.stringify(this.data, null, 2) + "\n";
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian2.TFile) {
      await this.app.vault.modify(file, content);
      return;
    }
    const slash = path.lastIndexOf("/");
    if (slash > 0) {
      const dir = path.slice(0, slash);
      if (!this.app.vault.getAbstractFileByPath(dir)) {
        await this.app.vault.adapter.mkdir(dir);
      }
    }
    await this.app.vault.create(path, content);
  }
};

// explorer.ts
function activeDoc() {
  var _a;
  const anyWindow = window;
  return (_a = anyWindow.activeDocument) != null ? _a : document;
}
var ExplorerIcons = class {
  constructor(app, store, mapping) {
    this.app = app;
    this.store = store;
    this.mapping = mapping;
    this.observers = [];
    this.containers = /* @__PURE__ */ new Set();
    this.timer = 0;
  }
  start() {
    this.stop();
    this.app.workspace.getLeavesOfType("file-explorer").forEach((leaf) => this.watchLeaf(leaf));
    this.refreshSoon();
  }
  stop() {
    for (const observer of this.observers)
      observer.disconnect();
    this.observers = [];
    this.containers.clear();
    window.clearTimeout(this.timer);
    for (const badge of Array.from(
      activeDoc().querySelectorAll(".obsidian-icon-explorer")
    )) {
      badge.remove();
    }
  }
  refreshSoon() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.refresh(), 80);
  }
  async refresh() {
    this.app.workspace.getLeavesOfType("file-explorer").forEach((leaf) => this.watchLeaf(leaf));
    const rows = activeDoc().querySelectorAll(
      ".nav-files-container .tree-item-self[data-path]"
    );
    for (const row of Array.from(rows)) {
      const selfEl = row;
      const path = selfEl.dataset.path;
      if (path)
        await this.renderRow(selfEl, path);
    }
  }
  watchLeaf(leaf) {
    const container = leaf.view.containerEl.querySelector(
      ":scope > .nav-files-container > div"
    );
    if (!container || this.containers.has(container))
      return;
    this.containers.add(container);
    const observer = new MutationObserver(() => this.refreshSoon());
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-path", "class"]
    });
    this.observers.push(observer);
  }
  async renderRow(selfEl, path) {
    var _a, _b;
    const raw = this.mapping.get(path);
    if (!raw) {
      (_a = selfEl.querySelector(":scope > .obsidian-icon-explorer")) == null ? void 0 : _a.remove();
      return;
    }
    const entry = raw;
    const ref = parseIconRef(entry.icon);
    let badge = selfEl.querySelector(
      ":scope > .obsidian-icon-explorer"
    );
    if (!ref) {
      badge == null ? void 0 : badge.remove();
      return;
    }
    if (!badge) {
      badge = activeDoc().createElement("span");
      badge.className = "obsidian-icon-explorer";
      const inner = selfEl.querySelector(".tree-item-inner");
      if (inner)
        inner.insertAdjacentElement("beforebegin", badge);
      else
        selfEl.prepend(badge);
    }
    const key = `${entry.icon}|${(_b = entry.color) != null ? _b : ""}`;
    if (badge.dataset.ref === key)
      return;
    badge.dataset.ref = key;
    badge.innerHTML = "";
    badge.removeAttribute("style");
    await renderIconInto(badge, ref, this.store, { color: entry.color });
    badge.addClass("obsidian-icon-explorer");
  }
};

// picker.ts
var import_obsidian3 = require("obsidian");
var PER_GROUP_LIMIT = 80;
var IconPickerModal = class extends import_obsidian3.Modal {
  constructor(app, store, initial, onDone) {
    var _a;
    super(app);
    this.store = store;
    this.onDone = onDone;
    this.query = "";
    this.items = [];
    this.selected = (_a = initial == null ? void 0 : initial.icon) != null ? _a : null;
    this.color = initial == null ? void 0 : initial.color;
  }
  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-icon-picker");
    contentEl.createEl("h3", { text: "Icon w\xE4hlen" });
    const names = await this.store.listSvgNames();
    const svgItems = names.map((n) => ({
      ref: n,
      label: n,
      group: n.startsWith("devicon/") ? "Devicon" : n.startsWith("simple/") ? "Simple" : "Eigene"
    }));
    const lucideItems = this.store.lucideIds().map((id) => ({ ref: `lucide:${id}`, label: id, group: "Lucide" }));
    this.items = [...svgItems, ...lucideItems];
    new import_obsidian3.Setting(contentEl).setName("Suchen").addText((text) => {
      text.setPlaceholder("Name tippen \u2026").onChange((value) => {
        this.query = value;
        this.renderList();
      });
    });
    this.listEl = contentEl.createDiv({ cls: "obsidian-icon-picker-list" });
    this.renderList();
    const colorWrap = contentEl.createDiv({ cls: "obsidian-icon-picker-colors" });
    colorWrap.createEl("div", {
      text: "Farbe",
      cls: "obsidian-icon-picker-label"
    });
    const dots = colorWrap.createDiv({ cls: "obsidian-icon-picker-dots" });
    const none = dots.createEl("button", {
      text: "keine",
      cls: "obsidian-icon-dot obsidian-icon-dot-none"
    });
    none.onclick = () => {
      this.color = void 0;
      this.markDots();
    };
    for (const name of THEME_COLORS) {
      const dot = dots.createEl("button", {
        cls: "obsidian-icon-dot",
        attr: { "aria-label": name, title: name }
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
      attr: { type: "color", title: "Freie Farbe" }
    });
    if (this.color && themeVar(this.color) && !THEME_COLORS.includes(this.color)) {
      try {
        hex.value = this.color;
      } catch (e) {
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
      text: "\xDCbernehmen",
      cls: "mod-cta"
    });
    this.saveBtn.disabled = !this.selected;
    this.saveBtn.onclick = () => {
      if (!this.selected)
        return;
      const result = { icon: this.selected };
      if (this.color)
        result.color = this.color;
      this.onDone(result);
      this.close();
    };
  }
  onClose() {
    this.contentEl.empty();
  }
  markDots() {
    const dots = this.contentEl.querySelectorAll(".obsidian-icon-dot");
    dots.forEach((d) => {
      const el = d;
      const isNone = el.classList.contains("obsidian-icon-dot-none") && !this.color;
      const isColor = el.dataset.color !== void 0 && el.dataset.color === this.color;
      el.toggleClass("is-selected", isNone || isColor);
    });
  }
  matches(ref) {
    const q = this.query.trim().toLowerCase();
    if (!q)
      return true;
    const hay = ref.toLowerCase();
    return q.split(/\s+/).every((term) => hay.includes(term));
  }
  renderList() {
    this.listEl.empty();
    const groups = ["Eigene", "Devicon", "Simple", "Lucide"];
    let any = false;
    for (const group of groups) {
      const rows = this.items.filter(
        (item) => item.group === group && this.matches(item.ref)
      );
      if (rows.length === 0)
        continue;
      any = true;
      this.listEl.createEl("div", {
        text: group,
        cls: "obsidian-icon-picker-group"
      });
      for (const item of rows.slice(0, PER_GROUP_LIMIT)) {
        const row = this.listEl.createDiv({
          cls: "obsidian-icon-picker-row"
        });
        if (item.ref === this.selected)
          row.addClass("is-selected");
        const preview = row.createDiv({
          cls: "obsidian-icon-picker-preview"
        });
        void this.previewInto(preview, item);
        row.createDiv({ text: item.label, cls: "obsidian-icon-picker-name" });
        row.onclick = () => {
          this.selected = item.ref;
          this.saveBtn.disabled = false;
          this.listEl.querySelectorAll(".is-selected").forEach((el) => el.removeClass("is-selected"));
          row.addClass("is-selected");
        };
      }
      if (rows.length > PER_GROUP_LIMIT) {
        this.listEl.createDiv({
          text: `\u2026 ${rows.length - PER_GROUP_LIMIT} weitere, Suche einschr\xE4nken`,
          cls: "obsidian-icon-picker-more"
        });
      }
    }
    if (!any) {
      this.listEl.createDiv({
        text: "Nichts gefunden",
        cls: "obsidian-icon-picker-more"
      });
    }
  }
  async previewInto(el, item) {
    if (item.ref.startsWith("lucide:")) {
      (0, import_obsidian3.setIcon)(el, item.ref.slice("lucide:".length));
      return;
    }
    const svg = await this.store.getSvg(item.ref);
    if (svg)
      el.innerHTML = svg;
    else
      el.textContent = "?";
  }
};

// main.ts
var DEFAULT_SETTINGS = {
  iconFolder: "_assets/icons",
  mappingFile: "_assets/icon-mapping.json"
};
var ICON_TAG_RE = /\{\{icon:([A-Za-z0-9_\-/:.]+?)(?:\.svg)?(?:\|([0-9]+(?:\.[0-9]+)?(?:px|em|rem|%|pt)?))?\}\}/g;
var IconWidget = class extends import_view.WidgetType {
  constructor(ref, size, store) {
    super();
    this.ref = ref;
    this.size = size;
    this.store = store;
  }
  eq(other) {
    const a = this.ref;
    const b = other.ref;
    return a.kind === b.kind && a.name === b.name && a.id === b.id && a.char === b.char && this.size === other.size;
  }
  toDOM() {
    const span = document.createElement("span");
    void renderIconInto(span, this.ref, this.store, { size: this.size });
    return span;
  }
};
function buildIconExtension(store) {
  const matcher = new import_view.MatchDecorator({
    regexp: new RegExp(ICON_TAG_RE.source, "g"),
    decoration: (match) => {
      var _a;
      const ref = parseIconRef((_a = match[1]) != null ? _a : "");
      if (!ref || ref.kind === "emoji")
        return null;
      const size = parseSize(match[2]);
      return import_view.Decoration.replace({
        widget: new IconWidget(ref, size, store),
        inclusive: false
      });
    }
  });
  return import_view.ViewPlugin.fromClass(
    class {
      constructor(view) {
        this.decorations = matcher.createDeco(view);
      }
      update(update) {
        this.decorations = matcher.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations }
  );
}
var InlineSvgIconsPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
  }
  async onload() {
    await this.loadSettings();
    this.icons = new IconStore(this.app, () => this.settings.iconFolder);
    this.mapping = new MappingStore(this.app, () => this.settings.mappingFile);
    await this.mapping.load();
    this.explorer = new ExplorerIcons(this.app, this.icons, this.mapping);
    this.registerEditorExtension(buildIconExtension(this.icons));
    this.registerMarkdownPostProcessor(async (el) => {
      await this.postProcess(el);
    });
    this.app.workspace.onLayoutReady(() => this.explorer.start());
    this.registerEvent(
      this.app.workspace.on("layout-change", () => this.explorer.refreshSoon())
    );
    this.registerEvent(this.app.vault.on("create", (f) => this.onVault(f)));
    this.registerEvent(this.app.vault.on("modify", (f) => this.onVault(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.onVault(f)));
    this.registerEvent(
      this.app.vault.on("rename", (f, oldPath) => this.onRename(f, oldPath))
    );
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem(
          (item) => item.setTitle("Change icon").setIcon("image-plus").onClick(() => this.openPicker([file.path]))
        );
        if (this.mapping.get(file.path)) {
          menu.addItem(
            (item) => item.setTitle("Remove icon").setIcon("trash").onClick(() => this.removeIcons([file.path]))
          );
        }
      })
    );
    this.registerEvent(
      this.app.workspace.on("files-menu", (menu, files) => {
        const paths = files.map((f) => f.path);
        menu.addItem(
          (item) => item.setTitle(`Change icons (${paths.length})`).setIcon("image-plus").onClick(() => this.openPicker(paths))
        );
        if (paths.some((p) => this.mapping.get(p))) {
          menu.addItem(
            (item) => item.setTitle(`Remove icons (${paths.length})`).setIcon("trash").onClick(() => this.removeIcons(paths))
          );
        }
      })
    );
    this.addCommand({
      id: "reload-icons",
      name: "Icons neu laden",
      callback: () => {
        this.icons.clear();
        void this.mapping.load().then(() => this.explorer.refresh());
        this.app.workspace.updateOptions();
      }
    });
    this.addSettingTab(new InlineSvgIconsSettingTab(this.app, this));
  }
  onunload() {
    var _a;
    (_a = this.explorer) == null ? void 0 : _a.stop();
  }
  onVault(file) {
    const path = typeof file === "string" ? file : file.path;
    if (this.mapping.isMappingPath(path)) {
      void this.mapping.load().then(() => this.explorer.refresh());
      return;
    }
    this.icons.invalidatePath(path);
  }
  onRename(file, oldPath) {
    if (this.mapping.isMappingPath(file.path))
      return;
    const isFolder = file instanceof import_obsidian4.TFolder;
    if (this.mapping.migrateRename(oldPath, file.path, isFolder)) {
      this.explorer.refreshSoon();
    }
  }
  openPicker(paths) {
    const first = paths.length === 1 ? this.mapping.get(paths[0]) : null;
    const initial = first ? { icon: first.icon, ...first.color ? { color: first.color } : {} } : null;
    new IconPickerModal(this.app, this.icons, initial, (result) => {
      if (result)
        void this.applyIcons(paths, result);
    }).open();
  }
  async applyIcons(paths, result) {
    for (const path of paths) {
      await this.mapping.set(path, {
        icon: result.icon,
        ...result.color ? { color: result.color } : {}
      });
    }
    this.explorer.refreshSoon();
  }
  async removeIcons(paths) {
    for (const path of paths)
      await this.mapping.remove(path);
    this.explorer.refreshSoon();
  }
  async postProcess(el) {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const current = walker.currentNode;
      if (current.nodeValue && current.nodeValue.includes("{{icon:")) {
        nodes.push(current);
      }
    }
    for (const node of nodes) {
      await this.replaceInTextNode(node);
    }
  }
  async replaceInTextNode(node) {
    var _a, _b, _c;
    const text = (_a = node.nodeValue) != null ? _a : "";
    const re = new RegExp(ICON_TAG_RE.source, "g");
    let m;
    let last = 0;
    let found = false;
    const frag = document.createDocumentFragment();
    while ((m = re.exec(text)) !== null) {
      found = true;
      if (m.index > last)
        frag.appendText(text.slice(last, m.index));
      const ref = parseIconRef((_b = m[1]) != null ? _b : "");
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
    if (!found)
      return;
    if (last < text.length)
      frag.appendText(text.slice(last));
    (_c = node.parentNode) == null ? void 0 : _c.replaceChild(frag, node);
  }
  async loadSettings() {
    var _a;
    this.settings = { ...DEFAULT_SETTINGS, ...(_a = await this.loadData()) != null ? _a : {} };
  }
  async saveSettings() {
    await this.saveData(this.settings);
    this.icons.clear();
    await this.mapping.load();
    this.explorer.refreshSoon();
    this.app.workspace.updateOptions();
  }
};
var InlineSvgIconsSettingTab = class extends import_obsidian4.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian4.Setting(containerEl).setName("Icon Ordner").setDesc("Pfad im Vault, ohne f\xFChrenden Schr\xE4gstrich.").addText(
      (text) => text.setPlaceholder("_assets/icons").setValue(this.plugin.settings.iconFolder).onChange(async (value) => {
        this.plugin.settings.iconFolder = normalizeFolder(value) || DEFAULT_SETTINGS.iconFolder;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian4.Setting(containerEl).setName("Mapping Datei").setDesc("Zuordnung Explorer Pfad auf Icon, als JSON im Vault.").addText(
      (text) => text.setPlaceholder("_assets/icon-mapping.json").setValue(this.plugin.settings.mappingFile).onChange(async (value) => {
        this.plugin.settings.mappingFile = normalizeFolder(value) || DEFAULT_SETTINGS.mappingFile;
        await this.plugin.saveSettings();
      })
    );
  }
};
