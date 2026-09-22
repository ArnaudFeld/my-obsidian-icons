/* M.O.I. – My Obsidian Icons - no external runtime dependencies */
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
  default: () => MoiPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian11 = require("obsidian");
var import_view = require("@codemirror/view");
var import_state = require("@codemirror/state");

// icons.ts
var import_obsidian = require("obsidian");
function normalizeFolder(raw) {
  return raw.trim().split("/").filter((part) => part && part !== "." && part !== "..").join("/");
}
function isDarkTheme() {
  return document.body.classList.contains("theme-dark");
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
  return ref.kind === "svg" && ref.name.startsWith("devicon/");
}
var resolveCache = /* @__PURE__ */ new Map();
function resolveColor(color) {
  if (!color.startsWith("var("))
    return color;
  const key = `${isDarkTheme() ? "dark" : "light"}|${color}`;
  const hit = resolveCache.get(key);
  if (hit !== void 0)
    return hit;
  const probe = document.createElement("span");
  probe.style.color = color;
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  probe.remove();
  const out = rgb || color;
  if (resolveCache.size > 500)
    resolveCache.clear();
  resolveCache.set(key, out);
  return out;
}
function recolorSingle(svgEl, color) {
  var _a, _b, _c, _d;
  const all = [svgEl, ...Array.from(svgEl.querySelectorAll("*"))];
  const fills = /* @__PURE__ */ new Set();
  const strokes = /* @__PURE__ */ new Set();
  for (const node of all) {
    const el = node;
    const fill = ((_b = (_a = el.getAttribute("fill")) != null ? _a : el.style.fill) != null ? _b : "").trim().toLowerCase();
    const stroke = ((_d = (_c = el.getAttribute("stroke")) != null ? _c : el.style.stroke) != null ? _d : "").trim().toLowerCase();
    for (const [value, set] of [[fill, fills], [stroke, strokes]]) {
      if (!value || value === "none" || value === "transparent" || value === "currentcolor")
        continue;
      if (value.startsWith("url("))
        return;
      set.add(value);
    }
  }
  const concrete = resolveColor(color);
  const repaint = (kind, from) => {
    var _a2;
    for (const node of all) {
      const el = node;
      if (((_a2 = el.getAttribute(kind)) != null ? _a2 : "").trim().toLowerCase() === from) {
        el.setAttribute(kind, concrete);
      }
      const inline = kind === "fill" ? el.style.fill : el.style.stroke;
      if (inline && inline.trim().toLowerCase() === from) {
        if (kind === "fill")
          el.style.fill = concrete;
        else
          el.style.stroke = concrete;
      }
    }
  };
  if (fills.size === 1) {
    const only = [...fills][0];
    repaint("fill", only);
    repaint("stroke", only);
  } else if (fills.size === 0 && strokes.size === 1) {
    const only = [...strokes][0];
    repaint("stroke", only);
  }
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
function decodeCssEscapes(value) {
  return value.replace(
    /\\([0-9a-f]{1,6})\s?/gi,
    (_m, hex) => String.fromCharCode(parseInt(hex, 16))
  ).replace(/\\(.)/gs, "$1");
}
var NAMED_ENTITIES = {
  colon: ":",
  semi: ";",
  lpar: "(",
  rpar: ")",
  tab: "	",
  newline: "\n",
  nbsp: "\xA0",
  quot: '"',
  amp: "&",
  lt: "<",
  gt: ">",
  sol: "/"
};
function decodeEntities(value) {
  return value.replace(
    /&#x([0-9a-f]+);?/gi,
    (_m, hex) => String.fromCharCode(parseInt(hex, 16))
  ).replace(
    /&#([0-9]+);?/g,
    (_m, dec) => String.fromCharCode(parseInt(dec, 10))
  ).replace(/&([a-z]+);?/gi, (_m, name) => {
    const hit = NAMED_ENTITIES[name.toLowerCase()];
    return hit === void 0 ? _m : hit;
  });
}
function cleanCss(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/@import[^;]+;?/gi, "").replace(/url\s*\(\s*(?!#)([^)]*)\)/gi, "").replace(/expression\s*\(/gi, "(").replace(/behaviou?r\s*:/gi, ":");
}
function sanitizeSvg(svg) {
  if (!/<svg[\s>/]/i.test(svg))
    return "";
  const root = /<svg[\s\S]*?<\/svg\s*>/i.exec(svg);
  let out = root ? root[0] : svg;
  out = out.replace(/<script[\s\S]*?<\/script\s*>/gi, "").replace(/<script\b[^>]*>/gi, "").replace(/<\/script\s*>/gi, "").replace(/<foreignobject\b[^>]*\/>/gi, "").replace(/<foreignobject\b[\s\S]*?<\/foreignobject\s*>/gi, "").replace(/<foreignobject\b[\s\S]*$/gi, "").replace(/<(iframe|object|embed)\b[\s\S]*?<\/\1\s*>/gi, "").replace(/<(iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "").replace(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi, (_m, css) => {
    const cleaned = cleanCss(decodeCssEscapes(decodeEntities(css)));
    if (/<\/style|<!--/i.test(cleaned))
      return "";
    return `<style>${cleaned}</style>`;
  }).replace(/<style\b[^>]*>(?![\s\S]*<\/style\s*>)[\s\S]*$/i, "").replace(/[\s/'"]on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "").replace(
    /[\s/'"]style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    (_m, raw) => {
      const body = raw[0] === '"' || raw[0] === "'" ? raw.slice(1, -1) : raw;
      const cleaned = cleanCss(decodeCssEscapes(decodeEntities(body)));
      const esc = cleaned.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
      return ` style="${esc}"`;
    }
  ).replace(
    /[\s/'"](fill|stroke|filter|mask|clip-path|marker|marker-start|marker-mid|marker-end)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    (m, _attr, raw) => {
      const value = decodeCssEscapes(
        decodeEntities(raw.replace(/^['"]|['"]$/g, ""))
      ).trim().toLowerCase();
      if (value.includes("expression"))
        return "";
      const withoutLocal = value.replace(
        /url\s*\(\s*['"]?#[^'")]*['"]?\s*\)/g,
        ""
      );
      if (/url\s*\(/.test(withoutLocal))
        return "";
      if (value.includes(":"))
        return "";
      return m;
    }
  ).replace(
    /[\s/'"](xlink:href|href|src|srcset|to|from|by|values)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi,
    (m, attr, raw) => {
      const value = decodeEntities(raw.replace(/^['"]|['"]$/g, "")).trim().toLowerCase();
      if (value.startsWith("#"))
        return m;
      const name = attr.toLowerCase();
      if ((name === "to" || name === "from" || name === "by" || name === "values") && !value.includes(":") && !value.startsWith("//") && !value.startsWith("\\\\")) {
        return m;
      }
      return "";
    }
  ).replace(
    /<(set|animate|animateTransform|animateMotion)\b[^>]*attributeName\s*=\s*(["']?)\s*on[a-z]*[^>]*\/?>/gi,
    ""
  ).replace(/javascript\s*:/gi, "");
  return out;
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
var THEME_VAR_FALLBACK = {
  gray: "--color-base-70"
};
function themeVar(color) {
  var _a;
  if (!color)
    return null;
  const name = color.trim().toLowerCase();
  if (THEME_COLORS.includes(name)) {
    return `var(${(_a = THEME_VAR_FALLBACK[name]) != null ? _a : `--color-${name}`})`;
  }
  try {
    if (CSS.supports("color", color))
      return color;
  } catch (e) {
    return null;
  }
  return null;
}
function luminance(rgb) {
  const m = /rgba?\(([^)]+)\)/.exec(rgb);
  if (!m)
    return null;
  const parts = m[1].split(",").map((v) => parseFloat(v.trim()));
  if (parts.length < 3 || parts.some((v) => Number.isNaN(v)))
    return null;
  const [r, g, b] = parts.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
var contrastCache = /* @__PURE__ */ new Map();
function contrastOnBackground(color) {
  var _a, _b;
  const key = `${isDarkTheme() ? "dark" : "light"}|${color.trim().toLowerCase()}`;
  if (contrastCache.has(key))
    return (_a = contrastCache.get(key)) != null ? _a : null;
  if (contrastCache.size > 500)
    contrastCache.clear();
  let out = null;
  try {
    const probe = document.createElement("span");
    probe.style.color = resolveColor((_b = themeVar(color)) != null ? _b : color);
    probe.style.background = "var(--background-primary)";
    document.body.appendChild(probe);
    const computed = getComputedStyle(probe);
    const fg = luminance(computed.color);
    const bg = luminance(computed.backgroundColor);
    probe.remove();
    if (fg === null || bg === null) {
      contrastCache.set(key, null);
      return null;
    }
    const [hi, lo] = fg >= bg ? [fg, bg] : [bg, fg];
    out = (hi + 0.05) / (lo + 0.05);
  } catch (e) {
    out = null;
  }
  contrastCache.set(key, out);
  return out;
}
var IconStore = class {
  constructor(app, getFolder, cdn) {
    this.app = app;
    this.getFolder = getFolder;
    this.cdn = cdn;
    this.cache = /* @__PURE__ */ new Map();
    this.lucideCache = null;
    this.lucideSet = null;
  }
  filePath(name) {
    return `${normalizeFolder(this.getFolder())}/${name}.svg`;
  }
  async getSvg(name) {
    var _a;
    const path = this.filePath(name);
    const hit = this.cache.get(path);
    if (hit !== void 0)
      return hit;
    try {
      const file = this.app.vault.getAbstractFileByPath(path);
      if (file instanceof import_obsidian.TFile) {
        const raw = await this.app.vault.read(file);
        if (raw.includes("<svg")) {
          const clean = sanitizeSvg(raw);
          this.cache.set(path, clean);
          return clean;
        }
      }
    } catch (e) {
    }
    if ((_a = this.cdn) == null ? void 0 : _a.enabled()) {
      return this.cdn.getSvg(name);
    }
    return null;
  }
  /** Alle SVGs im Icon Ordner, relativ und ohne Endung, sortiert. */
  async listSvgNames() {
    const folder = normalizeFolder(this.getFolder());
    const prefix = folder + "/";
    return this.app.vault.getFiles().filter((f) => f.path.startsWith(prefix) && f.extension === "svg").map((f) => f.path.slice(prefix.length, -".svg".length)).filter((n) => /^[A-Za-z0-9_\-/]+$/.test(n)).sort((a, b) => a.localeCompare(b));
  }
  lucideIds() {
    if (!this.lucideCache) {
      try {
        this.lucideCache = (0, import_obsidian.getIconIds)();
      } catch (e) {
        return [];
      }
    }
    return this.lucideCache;
  }
  knowsLucide(id) {
    if (!this.lucideSet) {
      const ids = this.lucideIds();
      if (ids.length === 0)
        return false;
      this.lucideSet = new Set(ids);
    }
    return this.lucideSet.has(id);
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
  console.warn(`[moi] nicht gefunden: ${label}`);
}
async function renderIconInto(el, ref, store, opts) {
  el.addClass("obsidian-icon-inline");
  el.removeClass("obsidian-icon-missing");
  el.removeAttribute("title");
  const label = ref.kind === "svg" ? ref.name : ref.kind === "lucide" ? ref.id : ref.char;
  const color = themeVar(opts == null ? void 0 : opts.color);
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
  if (color) {
    recolorSingle(svgEl, color);
  }
  if (opts == null ? void 0 : opts.size) {
    svgEl.setAttribute("width", opts.size);
    svgEl.setAttribute("height", opts.size);
  }
}

// mapping.ts
var import_obsidian2 = require("obsidian");
var EXT_KEY = "__ext__";
function isSafeKey(key) {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
function normalizeExt(raw) {
  const ext = raw.trim().toLowerCase().replace(/^\.+/, "");
  return /^[a-z0-9]+$/.test(ext) ? ext : null;
}
function normalizeEntry(value) {
  if (typeof value === "string") {
    const icon = value.trim();
    return icon ? { icon } : null;
  }
  if (value && typeof value.icon === "string" && value.icon.trim()) {
    const entry = { icon: value.icon.trim() };
    if (typeof value.color === "string" && value.color.trim()) {
      entry.color = value.color.trim();
    }
    const size = typeof value.size === "string" ? parseSize(value.size.trim()) : void 0;
    if (size)
      entry.size = size;
    if (typeof value.iconDark === "string" && parseIconRef(value.iconDark)) {
      entry.iconDark = value.iconDark.trim();
    }
    return entry;
  }
  return null;
}
var MappingStore = class _MappingStore {
  constructor(app, getFile) {
    this.app = app;
    this.getFile = getFile;
    this.data = {};
    /** Aufeinanderfolgende Saves, damit sich parallele Writes nicht überholen. */
    this.saveQueue = Promise.resolve();
    /** Stand Zähler, Load liest neu wenn dazwischen mutiert wurde. */
    this.rev = 0;
  }
  mappingPath() {
    return normalizeFolder(this.getFile());
  }
  isMappingPath(path) {
    return path === this.mappingPath();
  }
  /** Mutation oder Read als Einheit in die Schlange, kein Überholen. */
  enqueue(fn) {
    const run = this.saveQueue.then(fn, fn);
    this.saveQueue = run.then(
      () => void 0,
      () => void 0
    );
    return run;
  }
  async load() {
    for (let i = 0; i < 3; i++) {
      const seen = this.rev;
      await this.enqueue(() => this.readFile());
      if (this.rev === seen)
        return;
    }
  }
  async readFile() {
    try {
      const file = this.app.vault.getAbstractFileByPath(this.mappingPath());
      if (!(file instanceof import_obsidian2.TFile))
        return;
      const raw = await this.app.vault.read(file);
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        this.data = parsed;
        for (const key of Object.keys(this.data)) {
          if (!isSafeKey(key))
            delete this.data[key];
        }
        this.normalizeExtKeys();
      }
    } catch (e) {
      console.warn("[moi] Mapping Datei ung\xFCltig, Stand behalten");
    }
  }
  /** Alte großgeschriebene Endungen im Speicher heilen, nächster Save sichert. */
  normalizeExtKeys() {
    const section = this.data[EXT_KEY];
    if (!section || typeof section !== "object" || Array.isArray(section)) {
      return;
    }
    const rec = section;
    for (const key of Object.keys(rec)) {
      const norm = normalizeExt(key);
      if (norm && norm !== key) {
        if (!Object.prototype.hasOwnProperty.call(rec, norm))
          rec[norm] = rec[key];
        delete rec[key];
      }
    }
  }
  get(path) {
    if (path === EXT_KEY)
      return null;
    return normalizeEntry(this.data[path]);
  }
  entries() {
    const out = [];
    for (const [path, value] of Object.entries(this.data)) {
      if (path === EXT_KEY)
        continue;
      const entry = normalizeEntry(value);
      if (entry)
        out.push([path, entry]);
    }
    return out.sort((a, b) => a[0].localeCompare(b[0]));
  }
  extSection() {
    const section = this.data[EXT_KEY];
    if (section && typeof section === "object" && !Array.isArray(section)) {
      return section;
    }
    return {};
  }
  extEntries() {
    const out = [];
    for (const [ext, value] of Object.entries(this.extSection())) {
      const entry = normalizeEntry(value);
      if (entry)
        out.push([ext, entry]);
    }
    return out.sort((a, b) => a[0].localeCompare(b[0]));
  }
  getExt(ext) {
    const section = this.extSection();
    const direct = normalizeEntry(section[ext]);
    if (direct)
      return direct;
    const norm = normalizeExt(ext);
    return norm && norm !== ext ? normalizeEntry(section[norm]) : null;
  }
  async setExt(ext, entry) {
    var _a;
    const key = (_a = normalizeExt(ext)) != null ? _a : ext;
    if (!isSafeKey(key) || key === EXT_KEY)
      return;
    const clean = { icon: entry.icon };
    if (entry.color)
      clean.color = entry.color;
    if (entry.size)
      clean.size = entry.size;
    if (entry.iconDark)
      clean.iconDark = entry.iconDark;
    await this.enqueue(async () => {
      const section = this.extSection();
      section[key] = clean.color || clean.size || clean.iconDark ? clean : clean.icon;
      this.data[EXT_KEY] = section;
      this.rev++;
      await this.writeFile();
    });
  }
  async removeExt(ext) {
    await this.enqueue(async () => {
      const section = this.extSection();
      const target = ext.replace(/^\.+/, "").toLowerCase();
      let changed = false;
      for (const key of Object.keys(section)) {
        if (!isSafeKey(key))
          continue;
        if (key.replace(/^\.+/, "").toLowerCase() === target) {
          delete section[key];
          changed = true;
        }
      }
      if (changed) {
        if (Object.keys(section).length === 0)
          delete this.data[EXT_KEY];
        else
          this.data[EXT_KEY] = section;
        this.rev++;
        await this.writeFile();
      }
    });
  }
  /**
   * Rangfolge: direkter Pfad, dann Dateityp als Rückfall.
   * Nur für Dateien, Ordner fallen nie unter Dateityp.
   * Bekannte Datei mitgeben spart den zweiten Vault Zugriff.
   */
  resolve(path, knownFile) {
    const direct = this.get(path);
    if (direct)
      return direct;
    const file = knownFile !== void 0 ? knownFile : this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof import_obsidian2.TFile))
      return null;
    const ext = file.extension.trim().toLowerCase();
    if (!ext)
      return null;
    return this.getExt(ext);
  }
  static cleanEntry(entry) {
    const clean = { icon: entry.icon };
    if (entry.color)
      clean.color = entry.color;
    if (entry.size)
      clean.size = entry.size;
    if (entry.iconDark)
      clean.iconDark = entry.iconDark;
    return clean;
  }
  static asStored(entry) {
    const clean = _MappingStore.cleanEntry(entry);
    return clean.color || clean.size || clean.iconDark ? clean : clean.icon;
  }
  async set(path, entry) {
    if (!isSafeKey(path) || path === EXT_KEY)
      return;
    await this.enqueue(async () => {
      this.data[path] = _MappingStore.asStored(entry);
      this.rev++;
      await this.writeFile();
    });
  }
  /** Mehrere Pfade mit nur einem Schreibvorgang, ohne Wettlauf. */
  async setMany(items) {
    const clean = items.filter(
      ([path]) => isSafeKey(path) && path !== EXT_KEY
    );
    if (clean.length === 0)
      return;
    await this.enqueue(async () => {
      for (const [path, entry] of clean) {
        this.data[path] = _MappingStore.asStored(entry);
      }
      this.rev++;
      await this.writeFile();
    });
  }
  /** Import Paket mit nur einem Schreibvorgang. */
  async importAll(items, ext) {
    await this.enqueue(async () => {
      var _a;
      for (const [path, entry] of items) {
        if (!isSafeKey(path) || path === EXT_KEY)
          continue;
        this.data[path] = _MappingStore.asStored(entry);
      }
      if (ext.length > 0) {
        const section = this.extSection();
        for (const [raw, entry] of ext) {
          const key = (_a = normalizeExt(raw)) != null ? _a : raw;
          if (!isSafeKey(key))
            continue;
          section[key] = _MappingStore.asStored(entry);
        }
        this.data[EXT_KEY] = section;
      }
      this.rev++;
      await this.writeFile();
    });
  }
  async remove(path) {
    if (!isSafeKey(path) || path === EXT_KEY)
      return;
    await this.enqueue(async () => {
      if (Object.prototype.hasOwnProperty.call(this.data, path)) {
        delete this.data[path];
        this.rev++;
        await this.writeFile();
      }
    });
  }
  /** Mehrere Pfade mit nur einem Schreibvorgang, ohne Wettlauf. */
  async removeMany(paths) {
    await this.enqueue(async () => {
      let changed = false;
      for (const path of paths) {
        if (!isSafeKey(path) || path === EXT_KEY)
          continue;
        if (Object.prototype.hasOwnProperty.call(this.data, path)) {
          delete this.data[path];
          changed = true;
        }
      }
      if (changed) {
        this.rev++;
        await this.writeFile();
      }
    });
  }
  /** Ordner Umbenennung zieht Kinder mit um. */
  async migrateRename(oldPath, newPath, isFolder) {
    if (oldPath === EXT_KEY || !isSafeKey(oldPath) || !isSafeKey(newPath)) {
      return false;
    }
    return this.enqueue(async () => {
      let changed = false;
      if (Object.prototype.hasOwnProperty.call(this.data, oldPath)) {
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
      if (changed) {
        this.rev++;
        await this.writeFile();
      }
      return changed;
    });
  }
  async removePath(path, isFolder) {
    if (path === EXT_KEY || !isSafeKey(path))
      return false;
    return this.enqueue(async () => {
      let changed = false;
      if (Object.prototype.hasOwnProperty.call(this.data, path)) {
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
      if (changed) {
        this.rev++;
        await this.writeFile();
      }
      return changed;
    });
  }
  /** Offene Saves abwarten, Best Effort beim Entladen. */
  async flush() {
    await this.saveQueue;
  }
  async writeFile() {
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
var import_obsidian5 = require("obsidian");

// frontmatter.ts
function readFrontmatterIcon(app, file) {
  var _a;
  if (!file)
    return null;
  const frontmatter = (_a = app.metadataCache.getFileCache(file)) == null ? void 0 : _a.frontmatter;
  if (!frontmatter || typeof frontmatter.icon !== "string")
    return null;
  if (!parseIconRef(frontmatter.icon))
    return null;
  const out = { icon: frontmatter.icon.trim() };
  if (typeof frontmatter.iconColor === "string" && themeVar(frontmatter.iconColor)) {
    out.color = frontmatter.iconColor.trim();
  }
  if (typeof frontmatter.iconSize === "string") {
    const size = parseSize(frontmatter.iconSize.trim());
    if (size)
      out.size = size;
  }
  if (typeof frontmatter.iconDark === "string" && parseIconRef(frontmatter.iconDark)) {
    out.iconDark = frontmatter.iconDark.trim();
  }
  return out;
}

// tabs-titles.ts
var import_obsidian4 = require("obsidian");

// cdn.ts
var import_obsidian3 = require("obsidian");

// cdn-catalog.ts
var DEVICON_NAMES = [
  "aarch64",
  "adonisjs",
  "aerospike",
  "aframe",
  "aftereffects",
  "akka",
  "algolia",
  "almalinux",
  "alpinejs",
  "amazonwebservices",
  "anaconda",
  "android",
  "androidstudio",
  "angular",
  "angularjs",
  "angularmaterial",
  "ansible",
  "ansys",
  "antdesign",
  "apache",
  "apacheairflow",
  "apachekafka",
  "apachespark",
  "apex",
  "apl",
  "apollographql",
  "appcelerator",
  "apple",
  "appwrite",
  "archlinux",
  "arduino",
  "argocd",
  "artixlinux",
  "astro",
  "atom",
  "awk",
  "axios",
  "azure",
  "azuredevops",
  "azuresqldatabase",
  "babel",
  "babylonjs",
  "backbonejs",
  "ballerina",
  "bamboo",
  "bash",
  "bazel",
  "beats",
  "behance",
  "bevyengine",
  "biome",
  "bitbucket",
  "blazor",
  "blender",
  "bootstrap",
  "bower",
  "browserstack",
  "bulma",
  "bun",
  "c",
  "cairo",
  "cakephp",
  "canva",
  "capacitor",
  "carbon",
  "cassandra",
  "centos",
  "ceylon",
  "chakraui",
  "chartjs",
  "chrome",
  "circleci",
  "clarity",
  "clickhouse",
  "clion",
  "clojure",
  "clojurescript",
  "cloudflare",
  "cloudflareworkers",
  "cloudrun",
  "cmake",
  "cobol",
  "codeac",
  "codecov",
  "codeigniter",
  "codepen",
  "coffeescript",
  "composer",
  "confluence",
  "consul",
  "contao",
  "corejs",
  "cosmosdb",
  "couchbase",
  "couchdb",
  "cpanel",
  "cplusplus",
  "crystal",
  "csharp",
  "css3",
  "cucumber",
  "cypressio",
  "d3js",
  "dart",
  "datadog",
  "datagrip",
  "dataspell",
  "datatables",
  "dbeaver",
  "debian",
  "delphi",
  "denojs",
  "detaspace",
  "devicon",
  "digitalocean",
  "discloud",
  "discordjs",
  "django",
  "djangorest",
  "docker",
  "doctrine",
  "dot-net",
  "dotnetcore",
  "dovecot",
  "dreamweaver",
  "dropwizard",
  "drupal",
  "duckdb",
  "dyalog",
  "dynamodb",
  "dynatrace",
  "eclipse",
  "ecto",
  "elasticsearch",
  "electron",
  "eleventy",
  "elixir",
  "elm",
  "emacs",
  "embeddedc",
  "ember",
  "entityframeworkcore",
  "envoy",
  "erlang",
  "eslint",
  "expo",
  "express",
  "facebook",
  "fastapi",
  "fastify",
  "faunadb",
  "feathersjs",
  "fedora",
  "fiber",
  "figma",
  "filamentphp",
  "filezilla",
  "firebase",
  "firebird",
  "firefox",
  "flask",
  "flutter",
  "forgejo",
  "fortran",
  "foundation",
  "framermotion",
  "framework7",
  "fsharp",
  "fusion",
  "gardener",
  "gatling",
  "gatsby",
  "gazebo",
  "gcc",
  "gentoo",
  "ghost",
  "gimp",
  "git",
  "gitbook",
  "github",
  "githubactions",
  "githubcodespaces",
  "gitkraken",
  "gitlab",
  "gitpod",
  "gitter",
  "gleam",
  "glitch",
  "go",
  "godot",
  "goland",
  "google",
  "googlecloud",
  "googlecolab",
  "gradle",
  "grafana",
  "grails",
  "graphql",
  "groovy",
  "grpc",
  "grunt",
  "gulp",
  "hadoop",
  "handlebars",
  "harbor",
  "hardhat",
  "harvester",
  "haskell",
  "haxe",
  "helm",
  "heroku",
  "hibernate",
  "homebrew",
  "hoppscotch",
  "html5",
  "htmx",
  "hugo",
  "hyperv",
  "ie10",
  "ifttt",
  "illustrator",
  "inertiajs",
  "influxdb",
  "inkscape",
  "insomnia",
  "intellij",
  "ionic",
  "jaegertracing",
  "jamstack",
  "jasmine",
  "java",
  "javascript",
  "jeet",
  "jekyll",
  "jenkins",
  "jest",
  "jetbrains",
  "jetpackcompose",
  "jhipster",
  "jira",
  "jiraalign",
  "jquery",
  "json",
  "jule",
  "julia",
  "junit",
  "jupyter",
  "k3os",
  "k3s",
  "k6",
  "kaggle",
  "kaldi",
  "kalilinux",
  "karatelabs",
  "karma",
  "kdeneon",
  "keras",
  "kibana",
  "knexjs",
  "knockout",
  "kotlin",
  "krakenjs",
  "ktor",
  "kubeflow",
  "kubernetes",
  "labview",
  "laminas",
  "laravel",
  "laraveljetstream",
  "latex",
  "leetcode",
  "less",
  "libgdx",
  "linkedin",
  "linux",
  "linuxmint",
  "liquibase",
  "livewire",
  "llvm",
  "lodash",
  "logstash",
  "love2d",
  "lua",
  "lumen",
  "magento",
  "mapbox",
  "mariadb",
  "markdown",
  "materializecss",
  "materialui",
  "matlab",
  "matplotlib",
  "mattermost",
  "maven",
  "maya",
  "memcached",
  "mercurial",
  "meteor",
  "microsoftsqlserver",
  "minitab",
  "mithril",
  "mobx",
  "mocha",
  "modx",
  "moleculer",
  "mongodb",
  "mongoose",
  "monogame",
  "moodle",
  "msdos",
  "mysql",
  "nano",
  "nats",
  "neo4j",
  "neovim",
  "nestjs",
  "netbeans",
  "netbox",
  "netlify",
  "networkx",
  "newrelic",
  "nextjs",
  "nginx",
  "ngrok",
  "ngrx",
  "nhibernate",
  "nim",
  "nimble",
  "nixos",
  "nodejs",
  "nodemon",
  "nodered",
  "nodewebkit",
  "nomad",
  "norg",
  "notion",
  "npm",
  "npss",
  "nuget",
  "numpy",
  "nuxt",
  "nuxtjs",
  "oauth",
  "objectivec",
  "ocaml",
  "ohmyzsh",
  "okta",
  "openal",
  "openapi",
  "opencl",
  "opencv",
  "opengl",
  "openstack",
  "opensuse",
  "opentelemetry",
  "opera",
  "oracle",
  "ory",
  "p5js",
  "packer",
  "pandas",
  "passport",
  "perl",
  "pfsense",
  "phalcon",
  "phoenix",
  "photonengine",
  "photoshop",
  "php",
  "phpstorm",
  "pixijs",
  "playwright",
  "plotly",
  "pm2",
  "pnpm",
  "podman",
  "poetry",
  "polygon",
  "portainer",
  "postcss",
  "postgresql",
  "postman",
  "powershell",
  "premierepro",
  "primeng",
  "prisma",
  "processing",
  "processwire",
  "prolog",
  "prometheus",
  "protractor",
  "proxmox",
  "pug",
  "pulsar",
  "pulumi",
  "puppeteer",
  "purescript",
  "putty",
  "pycharm",
  "pypi",
  "pyscript",
  "pytest",
  "python",
  "pytorch",
  "qodana",
  "qt",
  "qtest",
  "quarkus",
  "quasar",
  "qwik",
  "r",
  "rabbitmq",
  "racket",
  "radstudio",
  "rails",
  "railway",
  "rancher",
  "raspberrypi",
  "reach",
  "react",
  "reactbootstrap",
  "reactnative",
  "reactnavigation",
  "reactrouter",
  "readthedocs",
  "realm",
  "rect",
  "redhat",
  "redis",
  "redux",
  "reflex",
  "remix",
  "renpy",
  "replit",
  "rexx",
  "rider",
  "rocksdb",
  "rockylinux",
  "rollup",
  "ros",
  "rspec",
  "rstudio",
  "ruby",
  "rubymine",
  "rust",
  "rxjs",
  "safari",
  "salesforce",
  "sanity",
  "sass",
  "scala",
  "scalingo",
  "scikitlearn",
  "sdl",
  "selenium",
  "sema",
  "sentry",
  "sequelize",
  "shopware",
  "shotgrid",
  "sketch",
  "slack",
  "socketio",
  "solidity",
  "solidjs",
  "sonarqube",
  "sourceengine",
  "sourcetree",
  "spack",
  "spicedb",
  "splunk",
  "spring",
  "spss",
  "spyder",
  "sqlalchemy",
  "sqldeveloper",
  "sqlite",
  "ssh",
  "stackblitz",
  "stackoverflow",
  "stata",
  "stenciljs",
  "storybook",
  "streamlit",
  "styledcomponents",
  "stylus",
  "subversion",
  "sulu",
  "supabase",
  "surrealdb",
  "svelte",
  "svgo",
  "swagger",
  "swift",
  "swiper",
  "symfony",
  "tailwindcss",
  "talos",
  "tauri",
  "teleport",
  "tensorflow",
  "terraform",
  "terramate",
  "tex",
  "thealgorithms",
  "threedsmax",
  "threejs",
  "thymeleaf",
  "titaniumsdk",
  "tmux",
  "tomcat",
  "tortoisegit",
  "towergit",
  "traefikmesh",
  "traefikproxy",
  "travis",
  "trello",
  "trpc",
  "turbo",
  "twilio",
  "twitter",
  "typescript",
  "typo3",
  "ubuntu",
  "unifiedmodelinglanguage",
  "unity",
  "unix",
  "unrealengine",
  "uwsgi",
  "v8",
  "vaadin",
  "vagrant",
  "vala",
  "vault",
  "veevalidate",
  "vercel",
  "vertx",
  "vim",
  "visualbasic",
  "visualstudio",
  "vite",
  "vitejs",
  "vitess",
  "vitest",
  "vscode",
  "vscodium",
  "vsphere",
  "vuejs",
  "vuestorefront",
  "vuetify",
  "vulkan",
  "vyper",
  "waku",
  "wasm",
  "web3js",
  "webflow",
  "webgpu",
  "weblate",
  "webpack",
  "webstorm",
  "windows11",
  "windows8",
  "wolfram",
  "woocommerce",
  "wordpress",
  "xamarin",
  "xcode",
  "xd",
  "xml",
  "yaml",
  "yarn",
  "yii",
  "yugabytedb",
  "yunohost",
  "zend",
  "zig",
  "zsh",
  "zustand"
];
var DEVICON_TAGS = {
  "aarch64": ["architecture", "programming", "language", "ARM"],
  "adonisjs": ["nodejs", "framework"],
  "aerospike": ["data", "database", "nosql"],
  "aframe": ["framework", "html", "javascript", "js", "web"],
  "aftereffects": ["video", "editor"],
  "akka": ["framework", "java", "scala", "open-source"],
  "algolia": ["algorithms", "api", "documentation", "tool"],
  "almalinux": ["linux", "os", "open-source"],
  "alpinejs": ["framework", "javascript"],
  "amazonwebservices": ["cloud", "hosting", "server"],
  "anaconda": ["python", "data-science"],
  "android": ["os", "mobile"],
  "androidstudio": ["application", "editor", "jetbrains", "ide", "android", "mobile"],
  "angular": ["framework", "javascript"],
  "angularjs": ["framework", "javascript"],
  "angularmaterial": ["framework", "javascript"],
  "ansible": ["automation", "provisioning", "deployment", "continuous-delivery"],
  "ansys": ["simulation"],
  "antdesign": ["reactjs", "design", "language"],
  "apache": ["php"],
  "apacheairflow": ["platform", "pipeline", "orchestrator", "open-source"],
  "apachekafka": ["streaming", "open-source"],
  "apachespark": ["data-processing", "data-science", "machine-learning"],
  "apex": ["language"],
  "apl": ["programming", "language", "open-source", "cross-platform"],
  "apollographql": ["platform", "graphql", "api"],
  "appcelerator": ["app", "mobile"],
  "apple": ["brand", "mobile"],
  "appwrite": ["cloud", "platform", "server"],
  "archlinux": ["linux", "distribution", "desktop"],
  "arduino": ["microcontroller", "hardware"],
  "argocd": ["gitops", "continuous-delivery"],
  "artixlinux": ["linux", "os", "distribution", "desktop"],
  "astro": ["static site generator", "framework", "web-development"],
  "atom": ["editor"],
  "awk": ["programming", "language", "unix"],
  "axios": ["http", "promise", "nodejs"],
  "azure": ["cloud", "devops"],
  "azuredevops": ["azure", "devops", "cloud", "version control", "vcs"],
  "azuresqldatabase": ["azure", "database", "tool", "sql"],
  "babel": ["javascript", "transpiler"],
  "babylonjs": ["3d", "javascript", "library", "web"],
  "backbonejs": ["javascript", "framework"],
  "ballerina": ["java", "cloud", "server", "networking"],
  "bamboo": ["platform", "integration", "server"],
  "bash": ["shell", "command", "scripting"],
  "bazel": ["build", "automation", "open-source"],
  "beats": ["elastic", "data-transfer"],
  "behance": ["social", "website"],
  "bevyengine": ["game-engine", "game", "rust", "open-source"],
  "biome": ["linter", "javascript", "typescript", "code-quality", "coding-style", "format"],
  "bitbucket": ["version-control"],
  "blazor": ["dotnet", ".net", "framework", "design", "ui"],
  "blender": ["modelling", "python", "3d", "animation"],
  "bootstrap": ["css", "framework", "html", "javascript", "library"],
  "bower": ["package", "manager"],
  "browserstack": ["website", "app", "testing", "tool"],
  "bulma": ["css", "framework"],
  "bun": ["javascript", "zig", "language"],
  "c": ["language"],
  "cairo": ["graphic", "library", "c", "open-source"],
  "cakephp": ["framework"],
  "canva": ["design"],
  "capacitor": ["javascript", "js", "ionic", "framework", "universal"],
  "carbon": ["programming", "language"],
  "cassandra": ["nosql", "database", "open-source"],
  "centos": ["server", "linux"],
  "ceylon": ["language"],
  "chakraui": ["ui", "library"],
  "chartjs": ["javascript", "chart", "framework"],
  "chrome": ["browser"],
  "circleci": ["integration", "platform"],
  "clarity": ["programming", "language", "blockchain"],
  "clickhouse": ["cloud", "column-oriented", "database", "warehouse"],
  "clion": ["jetbrains", "editor", "c", "c++", "cpp", "cplusplus"],
  "clojure": ["language", "jvm"],
  "clojurescript": ["language"],
  "cloudflare": ["web", "cdn", "dns", "proxy", "security"],
  "cloudflareworkers": ["platform", "serverless", "deploy", "performance", "javascript"],
  "cloudrun": ["platform", "serverless", "deploy", "cloud-computing-platform"],
  "cmake": ["build"],
  "cobol": ["language"],
  "codeac": ["platform", "integration"],
  "codecov": ["platform", "integration"],
  "codeigniter": ["php", "framework"],
  "codepen": ["social", "website", "editor"],
  "coffeescript": ["javascript", "transpiler", "language"],
  "composer": ["package", "manager", "php"],
  "confluence": ["collaboration", "documentation", "wiki"],
  "consul": ["networking", "infrastructure", "security", "tool"],
  "contao": ["cms"],
  "corejs": ["javascript", "library", "polyfill", "tool"],
  "cosmosdb": ["database", "nosql", "cloud", "azure"],
  "couchbase": ["database", "nosql", "cloud"],
  "couchdb": ["database"],
  "cpanel": ["hosting", "web hosting", "server", "control panel"],
  "cplusplus": ["language"],
  "crystal": ["programming", "language"],
  "csharp": ["language"],
  "css3": ["language", "programming"],
  "cucumber": ["framework"],
  "cypressio": ["testing", "framework"],
  "dart": ["programming", "language"],
  "datadog": ["monitoring", "platform", "integration"],
  "datagrip": ["jetbrains", "ide", "sql", "database"],
  "dataspell": ["jetbrains", "ide", "jupyter notebook", "data science"],
  "datatables": ["css", "framework", "html", "javascript", "library"],
  "dbeaver": ["tool", "database"],
  "debian": ["os", "server"],
  "delphi": ["language"],
  "denojs": ["javascript", "rust", "runtime"],
  "detaspace": ["cloud", "hosting", "server"],
  "devicon": ["iconset"],
  "digitalocean": ["cloud", "hosting", "database", "storage"],
  "discloud": ["cloud", "hosting", "database", "storage"],
  "discordjs": ["wrapper", "api_wrapper", "nodejs"],
  "djangorest": ["framework", "rest", "api", "python", "web"],
  "docker": ["platform", "deploy"],
  "dot-net": ["framework"],
  "dotnetcore": ["framework"],
  "dovecot": ["imap", "pop3", "e-mail"],
  "dreamweaver": ["web-development", "editor", "software", "tool"],
  "dropwizard": ["java", "framework"],
  "drupal": ["cms"],
  "duckdb": ["database", "sql"],
  "dyalog": ["language"],
  "dynamodb": ["key-value", "database", "java"],
  "dynatrace": ["monitoring", "performance", "cloud"],
  "eclipse": ["editor", "IDE"],
  "ecto": ["data", "elixir", "integration", "query"],
  "elasticsearch": ["elastic", "data", "logs"],
  "electron": ["framework"],
  "eleventy": ["ssg", "static site generator"],
  "elixir": ["language"],
  "elm": ["framework"],
  "emacs": ["editor"],
  "embeddedc": ["language", "programming"],
  "ember": ["framework", "javascript", "web-development", "build"],
  "entityframeworkcore": ["dotnet", ".net", "framework", "database"],
  "envoy": ["proxy", "cloud"],
  "eslint": ["linter", "javascript", "code-quality", "coding-style"],
  "expo": ["framework", "react", "react-native"],
  "express": ["framework"],
  "facebook": ["auth"],
  "fastapi": ["python", "framework"],
  "fastify": ["framework", "web", "node.js", "javascript", "performance"],
  "faunadb": ["database"],
  "feathersjs": ["framework", "rest"],
  "fedora": ["linux", "distribution", "desktop"],
  "fiber": ["framework", "go", "web"],
  "figma": ["design"],
  "filamentphp": ["framework", "laravel"],
  "filezilla": ["ftp"],
  "firebase": ["auth", "hosting", "storage", "cloud"],
  "firebird": ["database"],
  "firefox": ["browser"],
  "flask": ["python", "framework"],
  "flutter": ["framework", "sdk"],
  "forgejo": ["software", "git", "version-control"],
  "fortran": ["programming", "language"],
  "foundation": ["framework", "css"],
  "framermotion": ["library", "open-source", "react", "animation"],
  "framework7": ["framework", "cross-platform", "development", "mobile", "android", "ios"],
  "fsharp": ["language"],
  "fusion": ["design"],
  "gardener": ["kubernetes", "cloud"],
  "gatling": ["framework", "testing"],
  "gatsby": ["reactjs", "framework"],
  "gazebo": ["robotics", "3d"],
  "gcc": ["compiler", "linux"],
  "gentoo": ["linux", "distribution", "desktop"],
  "ghost": ["cms"],
  "gimp": ["graphic"],
  "git": ["version-control"],
  "gitbook": ["documentation", "pages", "git", "markup"],
  "github": ["version-control"],
  "githubactions": ["devops", "integration"],
  "githubcodespaces": ["development", "remote-development", "editor", "browser", "cloud"],
  "gitkraken": ["git", "version-control"],
  "gitlab": ["version-control"],
  "gitpod": ["open-source", "remote-development", "cloud", "IDE"],
  "gitter": ["social", "chat"],
  "gleam": ["language", "programming"],
  "glitch": ["web-apps", "online-platform", "programming-environment", "collaborative-environment"],
  "go": ["language"],
  "godot": ["game-engine", "open-source"],
  "goland": ["jetbrains", "ide", "go"],
  "google": ["auth"],
  "googlecloud": ["google", "cloud"],
  "googlecolab": ["cloud-computing-platform", "data science", "google", "machine-learning", "python", "virtual machine"],
  "gradle": ["open-source", "task-runner"],
  "grafana": ["monitoring", "analytics", "metrics", "logs", "visualization", "web-application"],
  "grails": ["framework", "groovy", "web-development", "jvm", "build"],
  "graphql": ["language", "data", "query"],
  "groovy": ["programming", "language", "jvm"],
  "grpc": ["programming", "c++", "java", "python", "go", "library"],
  "grunt": ["task-runner", "nodejs"],
  "gulp": ["task-runner", "nodejs"],
  "hadoop": ["framework", "big data", "open-source", "software", "library", "framework"],
  "handlebars": ["framework"],
  "harbor": ["docker", "artifact", "oci", "registry"],
  "hardhat": ["ethereum", "development", "solidity", "javascript", "typescript"],
  "harvester": ["kubernetes", "operating-system", "hypervisor", "rancher"],
  "haskell": ["language", "functional"],
  "haxe": ["language"],
  "helm": ["package", "manager", "kubernetes"],
  "heroku": ["cloud"],
  "hibernate": ["database", "framework", "java"],
  "homebrew": ["package", "manager", "linux", "apple", "os"],
  "hoppscotch": ["rest", "testing", "api"],
  "html5": ["programming", "language"],
  "htmx": ["framework", "web", "html", "ui"],
  "hugo": ["framework", "ssg", "static-site-generator", "go", "html", "css"],
  "hyperv": ["hypervisor", "operating-system"],
  "ie10": ["browser"],
  "ifttt": ["automation", "applets", "programming"],
  "illustrator": ["editor", "vector"],
  "inertiajs": ["javascript", "js", "library"],
  "influxdb": ["database", "monitoring", "open-source", "api"],
  "inkscape": ["editor", "vector"],
  "insomnia": ["open-source", "Rest API", "Soap API", "JSON-XML"],
  "intellij": ["jetbrains", "editor", "java"],
  "ionic": ["framework"],
  "jaegertracing": ["monitoring", "tracing"],
  "jamstack": ["javascript", "markup"],
  "jasmine": ["testing"],
  "java": ["programming", "language", "jvm"],
  "javascript": ["programming", "language"],
  "jeet": ["framework", "css"],
  "jekyll": ["ruby", "blog"],
  "jenkins": ["platform", "integration", "server"],
  "jest": ["testing", "javascript"],
  "jetbrains": ["ide"],
  "jetpackcompose": ["framework", "language", "kotlin", "android"],
  "jhipster": ["development", "framework", "java", "platform", "web", "web-application"],
  "jira": ["platform", "organize"],
  "jiraalign": ["development", "integration", "software"],
  "jquery": ["library", "javascript"],
  "json": ["format", "standard", "file-format", "object-notation"],
  "jule": ["programming", "language"],
  "julia": ["programming", "language"],
  "junit": ["testing", "framework", "java"],
  "jupyter": ["programming", "language"],
  "k3os": ["kubernetes", "operating-system", "k3s", "rancher"],
  "k3s": ["kubernetes", "container", "platform"],
  "k6": ["testing", "performance", "load"],
  "kaggle": ["platform", "auth", "machine-learning"],
  "kaldi": ["audio", "open-source", "library"],
  "kalilinux": ["linux", "operating-system", "security"],
  "karatelabs": ["framework", "testing"],
  "karma": ["testing", "test-runner"],
  "kdeneon": ["linux", "operating system", "open-source"],
  "keras": ["machine-learning", "python", "library"],
  "kibana": ["elastic", "dashboard"],
  "knexjs": ["database", "query", "sql", "javascript", "library"],
  "knockout": ["framework", "javascript"],
  "kotlin": ["language", "jetbrains", "jvm"],
  "krakenjs": ["nodejs", "framework"],
  "ktor": ["jetbrains", "kotlin", "framework"],
  "kubeflow": ["kubernetes", "deployment", "machine-learning"],
  "kubernetes": ["container", "deployment"],
  "labview": ["language"],
  "laminas": ["php", "framework", "web", "mvc", "middleware"],
  "laravel": ["php", "framework"],
  "laraveljetstream": ["php", "laravel", "tailwind", "scaffolding"],
  "latex": ["latex3", "latex2e", "markup", "tex", "typesetting-system"],
  "leetcode": ["online-platform", "coding-platform", "platform", "coding", "dsa", "interview-preparation"],
  "less": ["css", "pre-processor"],
  "libgdx": ["framework", "java", "game-development", "cross-platform", "open-source"],
  "linkedin": ["social", "auth"],
  "linux": ["os"],
  "linuxmint": ["os", "linux"],
  "liquibase": ["tool", "database"],
  "livewire": ["framework", "laravel", "php", "open-source"],
  "llvm": ["compiler", "framework", "c++", "open-source"],
  "lodash": ["javascript", "framework"],
  "logstash": ["logs", "elastic"],
  "love2d": ["programming", "game-engine"],
  "lua": ["programming", "language", "object-oriented", "scripting", "procedural", "prototype-based"],
  "lumen": ["laravel", "php", "framework", "micro-framework"],
  "magento": ["php", "framework"],
  "mapbox": ["map", "navigation", "data"],
  "mariadb": ["database", "sql", "open-source"],
  "markdown": ["markup", "language"],
  "materializecss": ["framework", "css", "design", "material-design"],
  "materialui": ["framework", "design", "ui"],
  "matlab": ["programming", "language"],
  "matplotlib": ["plotting", "library", "math", "visualization", "python", "api"],
  "mattermost": ["app", "chat", "collaboration", "open-source", "platform"],
  "maven": ["build"],
  "maya": ["mel", "pymel", "python", "3d", "programming", "vfx"],
  "memcached": ["data", "database", "nosql"],
  "mercurial": ["version-control"],
  "meteor": ["javascript", "framework"],
  "microsoftsqlserver": ["database", "sql", "db"],
  "minitab": ["package", "statistics"],
  "mithril": ["javascript", "framework", "frontend", "js"],
  "mobx": ["state-management", "testing", "reactjs", "nodejs"],
  "mocha": ["testing"],
  "modx": ["cms", "php", "framework"],
  "moleculer": ["nodejs", "javascript", "js", "microservices", "micro-services", "framework"],
  "mongodb": ["database"],
  "mongoose": ["data-model", "nodejs"],
  "monogame": ["engine", "game-engine", "C#", "c-sharp", "csharp"],
  "moodle": ["platform"],
  "msdos": ["os"],
  "mysql": ["database", "language"],
  "nano": ["text editor", "editor", "GNU", "terminal"],
  "nats": ["streaming", "open-source", "go"],
  "neo4j": ["database"],
  "neovim": ["text editor", "editor", "ide", "IDE", "open-source"],
  "nestjs": ["framework"],
  "netbeans": ["ide", "java", "open-source"],
  "netbox": ["network", "automation", "infrastructure", "open-source"],
  "netlify": ["cloud hosting", "serverless", "dynamic websites", "web applications", "open-source"],
  "networkx": ["graph", "library", "python"],
  "newrelic": ["monitoring", "observability", "analysis"],
  "nextjs": ["framework"],
  "nginx": ["server"],
  "ngrok": ["networking", "server"],
  "ngrx": ["state-management", "angular", "redux", "store", "javascript"],
  "nhibernate": ["library", "dotnet", ".net", "object-relational mapper", "orm", "C#"],
  "nim": ["programming", "functional", "object-oriented", "procedural"],
  "nimble": ["package-manager"],
  "nixos": ["os"],
  "nodejs": ["javascript", "language"],
  "nodemon": ["nodejs", "tool", "javascript"],
  "nodered": ["programming", "tool"],
  "nomad": ["container", "virtual machine", "deployment"],
  "norg": ["note-taking", "organization"],
  "notion": ["project-management"],
  "npm": ["package", "manager"],
  "nuget": ["package", "manager"],
  "numpy": ["library", "python"],
  "nuxt": ["js", "javascript", "framework", "fullstack", "vuejs"],
  "nuxtjs": ["js", "javascript", "framework", "frontend", "vuejs"],
  "oauth": ["authentication", "security"],
  "objectivec": ["programming", "language"],
  "ocaml": ["programming", "language"],
  "ohmyzsh": ["shell", "script", "scripting", "language", "command"],
  "okta": ["auth", "security"],
  "openal": ["library", "audio", "game", "3d"],
  "openapi": ["specification", "api", "open-source"],
  "opencl": ["framework", "language", "heterogeneous-computing", "cpp", "api", "khronos"],
  "opencv": ["library", "c/c++", "computer-vision"],
  "opengl": ["library", "graphics", "game", "3d"],
  "openstack": ["infrastructure-as-a-service", "cloud-computing-platform"],
  "opensuse": ["linux", "distribution", "desktop"],
  "opentelemetry": ["telemetry"],
  "opera": ["browser"],
  "oracle": ["database"],
  "ory": ["library", "open-source", "security"],
  "p5js": ["javascript", "js", "library"],
  "packer": ["infrastructure", "infrastructure-as-code", "continuous-delivery"],
  "pandas": ["library", "python"],
  "passport": ["authentication", "security"],
  "perl": ["programming", "language"],
  "pfsense": ["cloud", "network", "open-source", "security", "software"],
  "phalcon": ["php", "framework"],
  "phoenix": ["framework", "build", "web", "web-development", "development", "elixir"],
  "photonengine": ["game", "game-engine"],
  "photoshop": ["editor", "graphic"],
  "php": ["programming", "language"],
  "phpstorm": ["jetbrains", "editor", "php", "web", "html"],
  "pixijs": ["animation", "graphics", "html", "javascript", "library", "visualization"],
  "playwright": ["testing", "framework"],
  "plotly": ["frontend", "machine-learning", "dashboard"],
  "pm2": ["nodejs", "javascript", "js", "manager", "monitoring"],
  "pnpm": ["package", "manager"],
  "podman": ["container", "pods", "docker"],
  "poetry": ["package-manager", "python"],
  "polygon": ["ethereum", "erc20", "blockchain"],
  "portainer": ["docker", "kubernetes", "orchestrator"],
  "postcss": ["pre-processor", "css", "framework"],
  "postgresql": ["database"],
  "postman": ["tool", "testing"],
  "powershell": ["command-line", "shell", "terminal", "cli", "windows", "cmdlets"],
  "premierepro": ["editor", "video"],
  "primeng": ["angular", "ui", "component", "library", "framework"],
  "prisma": ["orm", "nodejs", "typescript"],
  "processing": ["java", "python", "android", "application", "ide", "framework"],
  "processwire": ["cms", "php", "framework"],
  "prolog": ["programming", "logic", "language", "open-source"],
  "prometheus": ["monitoring", "observability", "analysis"],
  "protractor": ["framework", "javascript"],
  "proxmox": ["container", "lxc", "virtual machine"],
  "pug": ["framework", "javascript", "nodejs"],
  "pulsar": ["open-source", "cross-platform", "editor"],
  "pulumi": ["infrastructure-as-code", "cloud"],
  "puppeteer": ["open-source", "devtools protocol", "testing", "extension"],
  "purescript": ["functional", "programming", "javascript"],
  "putty": ["ssh", "server"],
  "pycharm": ["jetbrains", "editor"],
  "pypi": ["python", "package", "programming"],
  "pyscript": ["browser", "python", "html", "framework"],
  "pytest": ["python", "framework", "testing"],
  "python": ["programming", "language"],
  "pytorch": ["programming", "framework", "machine-learning", "python"],
  "qodana": ["jetbrains", "code quality", "security"],
  "qt": ["framework"],
  "qtest": ["testing"],
  "quarkus": ["java", "framework"],
  "quasar": ["framework", "javascript"],
  "qwik": ["framework", "open-source"],
  "r": ["programming", "language"],
  "rabbitmq": ["message-broker", "open-source"],
  "racket": ["programming", "language"],
  "radstudio": ["editor", "IDE"],
  "rails": ["framework"],
  "railway": ["hosting", "platform", "deployment"],
  "rancher": ["kubernetes", "orchestrator"],
  "raspberrypi": ["arm", "computer"],
  "reach": ["web3", "blockchain", "development"],
  "react": ["framework"],
  "reactbootstrap": ["framework", "library", "frontend", "reactjs", "javascript"],
  "reactnative": ["framework"],
  "reactnavigation": ["routing", "navigation", "react native", "app", "open-source"],
  "reactrouter": ["framework", "react"],
  "readthedocs": ["documentation", "python", "open-source"],
  "realm": ["sql", "database", "cloud"],
  "rect": ["programming", "language"],
  "redhat": ["server", "linux"],
  "redis": ["server"],
  "redux": ["framework"],
  "reflex": ["framework", "python", "web"],
  "remix": ["framework", "fullstack", "web"],
  "renpy": ["programming", "game-engine", "engine", "python"],
  "replit": ["software"],
  "rexx": ["language"],
  "rider": ["jetbrains", "ide", "editor", "dotnet"],
  "rocksdb": ["database"],
  "rockylinux": ["os", "open-source", "linux"],
  "rollup": ["bundler", "build", "javascript"],
  "ros": ["robotics"],
  "rspec": ["ruby", "framework", "testing"],
  "rstudio": ["editor", "package", "statistics"],
  "ruby": ["programming", "language"],
  "rubymine": ["jetbrains", "editor"],
  "rust": ["programming", "language"],
  "rxjs": ["javascript", "library", "observability"],
  "safari": ["browser"],
  "salesforce": ["platform", "ecommerce"],
  "sanity": ["CMS"],
  "sass": ["pre-processor", "css"],
  "scala": ["programming", "language", "jvm"],
  "scalingo": ["cloud", "platform", "hosting"],
  "scikitlearn": ["machine-learning", "python", "tool", "library"],
  "sdl": ["library", "cross-platform", "multimedia", "game"],
  "selenium": ["webdrive", "automation"],
  "sema": ["software", "development", "company", "code-review", "open-source"],
  "sentry": ["monitoring", "analytics", "metrics"],
  "sequelize": ["database", "language"],
  "shopware": ["cloud", "platform"],
  "shotgrid": ["web-application", "autodesk", "project-management", "pipeline", "production-tool", "production-tracking"],
  "sketch": ["application"],
  "slack": ["chat"],
  "socketio": ["library", "networking", "websockets"],
  "solidity": ["programming", "language", "blockchain"],
  "solidjs": ["javascript", "framework", "frontend"],
  "sonarqube": ["tool", "security"],
  "sourceengine": ["game-engine", "valve", "javascript"],
  "sourcetree": ["version-control"],
  "spack": ["package-manager", "package", "manager", "python", "open-source"],
  "spicedb": ["database", "authorization", "access-control", "Zanzibar"],
  "splunk": ["platform", "data", "log", "monitoring"],
  "spring": ["framework"],
  "spss": ["package", "statistics"],
  "spyder": ["python", "ide", "editor", "data-science"],
  "sqlalchemy": ["python", "orm"],
  "sqldeveloper": ["tool", "database"],
  "sqlite": ["sql", "database", "db"],
  "ssh": ["security"],
  "stackblitz": ["IDE", "editor", "remote-development"],
  "stackoverflow": ["website", "development", "community"],
  "stata": ["analysis", "data", "data-science", "software", "statistics"],
  "stenciljs": ["framework", "ui"],
  "storybook": ["framework", "documentation", "ui"],
  "streamlit": ["python", "machine-learning", "data-science"],
  "styledcomponents": ["css", "javascript", "js", "library", "nodejs", "web"],
  "stylus": ["css", "pre-processor"],
  "subversion": ["svn", "version"],
  "sulu": ["cms", "platform"],
  "supabase": ["authentication", "cloud-computing-platform", "database", "storage"],
  "surrealdb": ["db", "database", "storage"],
  "svelte": ["javascript", "framework", "compiler"],
  "svgo": ["svg", "optimization", "tool", "javascript", "library", "node.js"],
  "swagger": ["development", "software", "tool"],
  "swift": ["language"],
  "swiper": ["library", "javascript", "open-source"],
  "symfony": ["framework", "php"],
  "tailwindcss": ["css", "framework"],
  "talos": ["container", "linux", "distribution"],
  "tauri": ["nodejs", "rust", "desktop", "framework", "programming"],
  "teleport": ["ssh", "security", "auth", "authentication", "infrastructure"],
  "tensorflow": ["library", "machine-learning", "deep-learning"],
  "terraform": ["deployment", "architecture", "automation"],
  "terramate": ["deployment", "devops", "automation"],
  "tex": ["typesetting-system", "markup", "tex"],
  "thealgorithms": ["organization", "algorithms"],
  "threedsmax": ["3d", "programming", "vfx", "graphic", "graphics", "game"],
  "threejs": ["javascript", "framework"],
  "thymeleaf": ["engine", "html", "java", "server"],
  "titaniumsdk": ["app", "mobile", "javascript", "cross-platform", "sdk"],
  "tmux": ["cli", "terminal", "multiplexer"],
  "tomcat": ["server"],
  "tortoisegit": ["git"],
  "towergit": ["git"],
  "traefikmesh": ["mesh", "kubernetes"],
  "traefikproxy": ["proxy", "router"],
  "travis": ["platform", "integration"],
  "trello": ["platform", "organize"],
  "trpc": ["typescript", "javascript", "typesafe", "api"],
  "turbo": ["spa", "js"],
  "twilio": ["api", "automation", "platform"],
  "twitter": ["auth"],
  "typescript": ["programming", "transpiler", "javascript", "language"],
  "typo3": ["cms", "php"],
  "ubuntu": ["os", "open-source", "linux"],
  "unifiedmodelinglanguage": ["modeling", "design", "language"],
  "unity": ["C#", "c-sharp", "csharp", "engine", "game-engine"],
  "unix": ["os"],
  "unrealengine": ["c++", "engine", "game-engine"],
  "uwsgi": ["hosting"],
  "v8": ["javascript-runtime", "framework", "javascript", "web", "cpp"],
  "vaadin": ["framework", "java", "web"],
  "vagrant": ["platform"],
  "vala": ["programming", "language"],
  "vault": ["tool", "security", "infrastructure"],
  "veevalidate": ["vuejs", "vuejs-library", "package"],
  "vercel": ["hosting", "platform", "deployment", "git"],
  "vertx": ["sdk", "java", "framework"],
  "vim": ["editor"],
  "visualbasic": ["programming", "language"],
  "visualstudio": ["editor"],
  "vite": ["web3", "blockchain", "DAG"],
  "vitejs": ["javascript", "build", "compiler", "esbuild"],
  "vitess": ["sharding", "database", "mysql"],
  "vitest": ["framework", "open-source", "testing", "vite"],
  "vscode": ["editor", "ide"],
  "vscodium": ["editor", "ide", "open-source"],
  "vsphere": ["hypervisor", "operating-system", "vmware"],
  "vuejs": ["framework"],
  "vuestorefront": ["framework"],
  "vuetify": ["css", "framework", "vuejs-library", "material-design"],
  "vulkan": ["api", "3d", "library", "graphics", "game"],
  "vyper": ["blockchain", "ethereum", "language", "programming", "python"],
  "waku": ["react", "javascript", "framework", "web"],
  "wasm": ["binary", "programming", "virtual machine", "web", "language"],
  "web3js": ["blockchain", "ecommerce"],
  "webflow": ["cms", "ecommerce"],
  "webgpu": ["graphics", "framework", "web"],
  "weblate": ["localization"],
  "webpack": ["package", "manager"],
  "webstorm": ["jetbrains", "editor"],
  "windows11": ["os"],
  "windows8": ["os"],
  "wolfram": ["data-science", "functional", "programming"],
  "woocommerce": ["ecommerce"],
  "wordpress": ["cms"],
  "xamarin": ["application", "programming", "editor", "ide", "ios", "mobile"],
  "xcode": ["application", "editor", "ide", "ios", "iphone", "mobile"],
  "xd": ["design", "editor", "ui"],
  "xml": ["markup", "language"],
  "yaml": ["data", "language"],
  "yarn": ["package", "manager", "javascript", "js"],
  "yii": ["php", "framework"],
  "yugabytedb": ["database", "relational", "sql", "scale", "open-source"],
  "yunohost": ["os"],
  "zend": ["php", "framework"],
  "zig": ["language"],
  "zsh": ["shell", "script", "scripting", "language", "command"],
  "zustand": ["framework"]
};

// selfhost-catalog.ts
var SELFHOST_DATE = "2026-09-04";
var SELFHOST_CATALOG = {
  "1panel": { light: true, tags: [] },
  "1password": { light: true, tags: ["Passwords"] },
  "2fauth": { light: true, tags: [] },
  "7-zip": { light: true, tags: [] },
  "8mb-local": { light: true, tags: [] },
  "9router": { light: true, tags: ["Artificial Intelligence"] },
  "accent": { light: true, tags: [] },
  "ace-stream": { light: true, tags: [] },
  "ackee": { light: true, tags: [] },
  "ackify": { light: true, tags: [] },
  "acquiremock": { light: true, tags: [] },
  "activepieces": { light: true, tags: [] },
  "activitypub": { light: true, tags: [] },
  "actual-budget": { light: true, tags: [] },
  "adguard-home": { light: true, tags: [] },
  "adguard-home-central-manager": { light: true, tags: [] },
  "adguardhome-sync": { light: true, tags: [] },
  "adminer": { light: true, tags: [] },
  "adminerevo": { light: true, tags: [] },
  "adnanh-webhook": { light: true, tags: [] },
  "adobe": { light: true, tags: ["Adobe"] },
  "adobe-acrobat": { light: true, tags: ["Adobe"] },
  "adobe-firefly": { light: true, tags: ["Adobe"] },
  "adobe-illustrator": { light: true, tags: ["Adobe", "Creative Cloud"] },
  "adobe-lightroom": { light: true, tags: ["Adobe", "Creative Cloud"] },
  "adobe-photoshop": { light: true, tags: ["Adobe", "Creative Cloud"] },
  "adobe-premiere-pro": { light: true, tags: ["Adobe", "Creative Cloud"] },
  "adventurelog": { light: true, tags: [] },
  "aerie": { light: true, tags: ["Shopping"] },
  "aeterna": { light: true, tags: [] },
  "affine": { light: true, tags: [] },
  "agam-space": { light: true, tags: [] },
  "agent-dvr": { light: false, tags: [] },
  "agent-zero": { light: true, tags: ["Artificial Intelligence"] },
  "agentgateway": { light: true, tags: ["Artificial Intelligence"] },
  "agregarr": { light: true, tags: [] },
  "aiostreams": { light: true, tags: [] },
  "airpipe": { light: true, tags: [] },
  "airsonic": { light: true, tags: [] },
  "airtable": { light: true, tags: [] },
  "airtrail": { light: true, tags: [] },
  "akaunting": { light: true, tags: [] },
  "akkoma": { light: true, tags: [] },
  "alarmpi": { light: true, tags: [] },
  "alaska-airlines": { light: true, tags: ["Airlines"] },
  "alby-hub": { light: true, tags: ["Cryptocurrency"] },
  "alexandrie": { light: true, tags: [] },
  "aliasvault": { light: true, tags: [] },
  "alibaba": { light: true, tags: ["Shopping"] },
  "aliexpress": { light: true, tags: ["Shopping"] },
  "alist": { light: true, tags: [] },
  "almalinux": { light: true, tags: ["Operating System"] },
  "alpine-linux": { light: true, tags: [] },
  "altcha": { light: true, tags: [] },
  "alternativeto": { light: true, tags: [] },
  "amazon": { light: true, tags: ["Amazon"] },
  "amazon-alexa": { light: true, tags: ["Amazon"] },
  "amazon-music": { light: true, tags: ["Amazon"] },
  "amazon-prime": { light: true, tags: ["Amazon"] },
  "amazon-prime-video": { light: true, tags: ["Amazon", "Streaming"] },
  "amazon-rds": { light: true, tags: ["Amazon"] },
  "amazon-s3": { light: true, tags: ["Amazon"] },
  "amazon-web-services": { light: true, tags: ["Amazon"] },
  "ambys": { light: true, tags: [] },
  "amcrest": { light: true, tags: [] },
  "amd": { light: true, tags: [] },
  "american-airlines": { light: true, tags: ["Airlines"] },
  "american-eagle": { light: true, tags: [] },
  "american-express": { light: true, tags: [] },
  "amicoscript": { light: true, tags: [] },
  "amnezia": { light: true, tags: ["VPN"] },
  "amurex": { light: true, tags: [] },
  "an-otter-wiki": { light: true, tags: [] },
  "anchr": { light: true, tags: [] },
  "android": { light: true, tags: ["Google"] },
  "android-auto": { light: true, tags: ["Google"] },
  "android-police": { light: true, tags: ["News"] },
  "android-robot": { light: true, tags: ["Google"] },
  "anibridge": { light: true, tags: [] },
  "animation-digital-network": { light: true, tags: [] },
  "anki": { light: true, tags: [] },
  "anonaddy": { light: true, tags: [] },
  "anonymousoverflow": { light: true, tags: [] },
  "ansible": { light: true, tags: [] },
  "antora": { light: true, tags: [] },
  "antville": { light: true, tags: [] },
  "anyappstart": { light: true, tags: [] },
  "anycable": { light: true, tags: [] },
  "anythingllm": { light: true, tags: ["Artificial Intelligence"] },
  "anytype": { light: true, tags: [] },
  "aol": { light: true, tags: [] },
  "aonsoku": { light: true, tags: [] },
  "apache": { light: true, tags: [] },
  "apache-answer": { light: true, tags: [] },
  "apache-cassandra": { light: true, tags: [] },
  "apache-guacamole": { light: true, tags: [] },
  "apache-kafka": { light: true, tags: [] },
  "apache-superset": { light: true, tags: [] },
  "apache-tika": { light: true, tags: [] },
  "apache-tika-binary": { light: true, tags: [] },
  "apache-tomcat": { light: true, tags: [] },
  "apc": { light: true, tags: [] },
  "apostrophecms": { light: true, tags: [] },
  "app-store": { light: true, tags: ["Apple", "App Store"] },
  "appflowy": { light: false, tags: [] },
  "apple": { light: true, tags: ["Apple"] },
  "apple-homekit": { light: true, tags: ["Apple"] },
  "apple-music": { light: true, tags: ["Apple"] },
  "apple-podcasts": { light: true, tags: ["Apple", "Podcasts"] },
  "apple-retro": { light: false, tags: ["Apple"] },
  "apple-tv": { light: true, tags: ["Apple", "Streaming"] },
  "apprise": { light: true, tags: [] },
  "appwrite": { light: true, tags: [] },
  "aptabase": { light: true, tags: [] },
  "ara-records-ansible": { light: true, tags: [] },
  "arcane": { light: true, tags: [] },
  "arch-linux": { light: true, tags: ["Operating System"] },
  "archiesteamfarm": { light: true, tags: ["Video Games"] },
  "archivebox": { light: true, tags: [] },
  "arduino": { light: true, tags: [] },
  "argo-cd": { light: true, tags: [] },
  "argon-theme": { light: true, tags: [] },
  "argus": { light: true, tags: [] },
  "aria2": { light: true, tags: [] },
  "arr-dashboard": { light: true, tags: [] },
  "arrmatey": { light: true, tags: [] },
  "ars-technica": { light: true, tags: ["News"] },
  "asciinema": { light: true, tags: [] },
  "ashim": { light: true, tags: [] },
  "asp-net-core": { light: true, tags: [] },
  "asrock": { light: true, tags: [] },
  "asterisk": { light: true, tags: [] },
  "astroluma": { light: true, tags: [] },
  "astuto": { light: true, tags: [] },
  "at-t": { light: true, tags: ["Cellular Carriers"] },
  "atera": { light: true, tags: [] },
  "atlas-network": { light: true, tags: [] },
  "atlasnode": { light: true, tags: [] },
  "atomic-crm": { light: true, tags: [] },
  "atria": { light: true, tags: [] },
  "attic-assets": { light: true, tags: [] },
  "atuin": { light: true, tags: [] },
  "audacity": { light: true, tags: [] },
  "audible": { light: true, tags: ["Podcasts"] },
  "audiobookrequest": { light: true, tags: [] },
  "audiobookshelf": { light: true, tags: ["Podcasts"] },
  "audiodeck": { light: true, tags: [] },
  "aureus": { light: true, tags: [] },
  "aurral": { light: true, tags: [] },
  "authelia": { light: true, tags: [] },
  "authentik": { light: true, tags: [] },
  "authgear": { light: true, tags: [] },
  "authman": { light: true, tags: [] },
  "authportal": { light: true, tags: [] },
  "autobrr": { light: true, tags: [] },
  "autocaliweb": { light: true, tags: [] },
  "autokitteh": { light: true, tags: [] },
  "automad": { light: true, tags: [] },
  "automatic1111": { light: true, tags: [] },
  "aviato": { light: true, tags: [] },
  "azirevpn": { light: true, tags: ["VPN"] },
  "azuracast": { light: true, tags: [] },
  "azure-devops": { light: true, tags: ["Microsoft"] },
  "baby-buddy": { light: true, tags: [] },
  "backblaze": { light: true, tags: [] },
  "backrest": { light: true, tags: [] },
  "backuppc": { light: true, tags: [] },
  "bagisto": { light: true, tags: [] },
  "baidu": { light: true, tags: ["Search"] },
  "baikal": { light: true, tags: [] },
  "bandcamp": { light: true, tags: [] },
  "bank-of-america": { light: true, tags: [] },
  "bar-assistant": { light: true, tags: [] },
  "barcode-buddy": { light: true, tags: [] },
  "barkeep": { light: true, tags: [] },
  "baserow": { light: true, tags: [] },
  "basic-memory": { light: true, tags: ["Artificial Intelligence"] },
  "bazarr": { light: true, tags: [] },
  "beaver-habit-tracker": { light: true, tags: [] },
  "beefiles": { light: true, tags: ["Synology"] },
  "beekeeper-studio": { light: true, tags: [] },
  "beeper": { light: true, tags: [] },
  "beephotos": { light: true, tags: ["Synology"] },
  "beestation": { light: true, tags: ["Synology"] },
  "beets": { light: true, tags: [] },
  "beets-flask": { light: true, tags: [] },
  "bentopdf": { light: true, tags: [] },
  "beszel": { light: true, tags: [] },
  "bewcloud": { light: true, tags: ["Cloud Storage"] },
  "bible-gateway": { light: true, tags: [] },
  "biblioreads": { light: true, tags: [] },
  "bichon": { light: true, tags: [] },
  "bigbluebutton": { light: true, tags: [] },
  "bigcapital": { light: true, tags: [] },
  "biltema": { light: true, tags: ["Shopping"] },
  "bin": { light: true, tags: [] },
  "bind-9": { light: true, tags: [] },
  "bitbucket": { light: true, tags: [] },
  "bitcoin": { light: true, tags: ["Cryptocurrency"] },
  "bitify": { light: true, tags: [] },
  "bitvoker": { light: true, tags: [] },
  "bitwarden": { light: true, tags: ["Passwords"] },
  "bitwarden-portal": { light: false, tags: [] },
  "bknd": { light: true, tags: [] },
  "black-candy": { light: true, tags: [] },
  "blender": { light: true, tags: [] },
  "blinko": { light: true, tags: [] },
  "blocky": { light: false, tags: [] },
  "bludit": { light: true, tags: [] },
  "bluesky": { light: true, tags: ["Social"] },
  "bluetooth": { light: true, tags: [] },
  "bolt-diy": { light: true, tags: ["Artificial Intelligence"] },
  "bookhaven": { light: true, tags: [] },
  "bookheaven": { light: true, tags: [] },
  "booklogr": { light: true, tags: [] },
  "booklore": { light: true, tags: [] },
  "bookorbit": { light: true, tags: [] },
  "bookstack": { light: true, tags: [] },
  "bookwyrm": { light: false, tags: [] },
  "boost-mobile": { light: true, tags: ["Cellular Carriers"] },
  "borg": { light: true, tags: [] },
  "borg-ui": { light: true, tags: [] },
  "borgmatic": { light: true, tags: [] },
  "boson": { light: true, tags: [] },
  "box": { light: true, tags: ["Cloud Storage"] },
  "bracket": { light: true, tags: [] },
  "brave": { light: true, tags: ["Browsers"] },
  "briefing": { light: true, tags: [] },
  "broadcastchannel": { light: true, tags: [] },
  "brother": { light: true, tags: [] },
  "budget-board": { light: true, tags: [] },
  "budgetbee": { light: true, tags: [] },
  "budibase": { light: true, tags: [] },
  "buggregator": { light: true, tags: [] },
  "buildbot": { light: true, tags: [] },
  "bulwark": { light: true, tags: [] },
  "bumpsight": { light: true, tags: [] },
  "bun": { light: false, tags: [] },
  "bunkerweb": { light: true, tags: [] },
  "buy-me-a-coffee": { light: true, tags: ["Donations"] },
  "byparr": { light: true, tags: [] },
  "bytestash": { light: true, tags: [] },
  "cachet": { light: true, tags: [] },
  "cachyos": { light: true, tags: ["Operating System"] },
  "caddy": { light: true, tags: [] },
  "caddymanager": { light: true, tags: [] },
  "caderno": { light: true, tags: [] },
  "cadvisor": { light: true, tags: [] },
  "cairn": { light: true, tags: [] },
  "cal-com": { light: true, tags: [] },
  "calagopus": { light: true, tags: ["Video Games"] },
  "calibre": { light: false, tags: [] },
  "calibre-web": { light: true, tags: [] },
  "calico": { light: true, tags: [] },
  "calmness": { light: true, tags: [] },
  "calnode": { light: true, tags: [] },
  "cannery": { light: false, tags: [] },
  "cannoli-shell": { light: false, tags: [] },
  "capacitarr": { light: true, tags: [] },
  "capacitor-runtime": { light: true, tags: [] },
  "capcut": { light: true, tags: [] },
  "capital-one": { light: true, tags: ["Banks"] },
  "caprover": { light: true, tags: [] },
  "carcare": { light: true, tags: ["Automobiles"] },
  "cardinal-apps": { light: true, tags: [] },
  "cardinal-cinema": { light: false, tags: [] },
  "cardinal-media-server": { light: false, tags: [] },
  "cardinal-music": { light: false, tags: [] },
  "cardinal-photos": { light: false, tags: [] },
  "casaos": { light: true, tags: ["Operating System"] },
  "castopod": { light: true, tags: ["Podcasts"] },
  "centos": { light: true, tags: ["Operating System"] },
  "ceph": { light: true, tags: [] },
  "cerbos": { light: true, tags: [] },
  "cert-manager": { light: true, tags: [] },
  "certimate": { light: true, tags: [] },
  "changedetection": { light: true, tags: [] },
  "changelog-nightly": { light: true, tags: [] },
  "channels-dvr": { light: false, tags: [] },
  "charles-schwab": { light: true, tags: ["Banks"] },
  "chartbrew": { light: true, tags: [] },
  "chase": { light: true, tags: ["Banks"] },
  "chatgpt": { light: true, tags: ["Artificial Intelligence"] },
  "chatwoot": { light: true, tags: [] },
  "checkcle": { light: true, tags: [] },
  "checkmate": { light: false, tags: [] },
  "checkmk": { light: true, tags: [] },
  "chevereto": { light: true, tags: [] },
  "chhoto-url": { light: true, tags: [] },
  "chibisafe": { light: true, tags: [] },
  "chili3d": { light: true, tags: [] },
  "chirpy": { light: true, tags: [] },
  "chitchatter": { light: true, tags: [] },
  "chorizard": { light: true, tags: [] },
  "chrome-canary": { light: false, tags: ["Browsers", "Google"] },
  "chromium": { light: true, tags: ["Browsers", "Google"] },
  "cilium": { light: true, tags: [] },
  "cilium-hubble": { light: true, tags: [] },
  "cilium-tetragon": { light: true, tags: [] },
  "ciphermail": { light: true, tags: [] },
  "citibank": { light: true, tags: [] },
  "clamav": { light: true, tags: [] },
  "claude": { light: true, tags: ["Artificial Intelligence"] },
  "clean-slate": { light: true, tags: [] },
  "clickhouse": { light: true, tags: [] },
  "clipable": { light: true, tags: [] },
  "clipcascade": { light: true, tags: [] },
  "cloudbeaver": { light: true, tags: [] },
  "cloudflare": { light: true, tags: [] },
  "cloudflare-zero-trust": { light: true, tags: [] },
  "cloudinary": { light: true, tags: [] },
  "cloudnativepg": { light: true, tags: [] },
  "cloudpanel": { light: true, tags: [] },
  "cloudreve": { light: true, tags: [] },
  "cloudron": { light: true, tags: [] },
  "clovalink": { light: true, tags: [] },
  "cnbc": { light: true, tags: ["News"] },
  "cobalt": { light: true, tags: [] },
  "cockpit": { light: true, tags: [] },
  "codeberg": { light: true, tags: ["Git"] },
  "codepen": { light: true, tags: [] },
  "codeproject-ai-server": { light: true, tags: [] },
  "coder": { light: true, tags: [] },
  "coinmarketcap": { light: true, tags: [] },
  "coinmarketcap-blue": { light: false, tags: [] },
  "colanode": { light: true, tags: [] },
  "colota": { light: true, tags: [] },
  "comentario": { light: true, tags: [] },
  "comfyui": { light: true, tags: ["Artificial Intelligence"] },
  "commafeed": { light: true, tags: [] },
  "commento": { light: true, tags: [] },
  "compose-craft": { light: true, tags: [] },
  "composerize": { light: true, tags: [] },
  "composetoolbox": { light: true, tags: [] },
  "composr": { light: true, tags: [] },
  "compreface": { light: true, tags: [] },
  "conduit": { light: true, tags: [] },
  "conduit-open-webui": { light: true, tags: ["Artificial Intelligence"] },
  "conduwuit": { light: true, tags: [] },
  "coneshare": { light: true, tags: [] },
  "configarr": { light: true, tags: [] },
  "configclarity": { light: true, tags: [] },
  "confluence": { light: true, tags: [] },
  "connectwise-brightgauge": { light: true, tags: [] },
  "connectwise-screenconnect": { light: true, tags: [] },
  "conslee": { light: true, tags: [] },
  "contabo": { light: true, tags: [] },
  "container-hub": { light: true, tags: [] },
  "containerssh": { light: true, tags: [] },
  "contao": { light: true, tags: [] },
  "continuwuity": { light: true, tags: [] },
  "control-d": { light: true, tags: [] },
  "converse": { light: true, tags: [] },
  "convos": { light: true, tags: [] },
  "convoy": { light: true, tags: [] },
  "cookcli": { light: true, tags: [] },
  "cooklang-chef": { light: true, tags: [] },
  "cooler-control": { light: true, tags: [] },
  "coolify": { light: true, tags: [] },
  "copyparty": { light: true, tags: [] },
  "corecontrol": { light: true, tags: [] },
  "coredns": { light: true, tags: [] },
  "costco": { light: true, tags: ["Shopping"] },
  "couchdb": { light: true, tags: [] },
  "counter-analytics": { light: true, tags: [] },
  "countly": { light: true, tags: [] },
  "coursera": { light: true, tags: [] },
  "cr-nmaster": { light: true, tags: [] },
  "crafty-controller": { light: true, tags: [] },
  "creative-commons": { light: true, tags: [] },
  "cronicle": { light: true, tags: [] },
  "crontab-guru": { light: true, tags: [] },
  "cross-seed": { light: true, tags: [] },
  "crosswatch": { light: true, tags: [] },
  "crow-ci": { light: true, tags: [] },
  "crowdsec": { light: true, tags: [] },
  "crowdsec-manager": { light: true, tags: [] },
  "crowdstrike": { light: true, tags: [] },
  "crt-sh": { light: true, tags: [] },
  "crunchyroll": { light: true, tags: ["Streaming"] },
  "cryptgeon": { light: true, tags: [] },
  "cryptomator": { light: true, tags: [] },
  "cryptpad": { light: true, tags: [] },
  "css3": { light: true, tags: [] },
  "ctfreak": { light: true, tags: [] },
  "cup-updates": { light: true, tags: [] },
  "cups": { light: true, tags: [] },
  "curator-bookmarks": { light: true, tags: [] },
  "cyberchef": { light: true, tags: [] },
  "cyberhaven": { light: true, tags: [] },
  "cypht": { light: true, tags: [] },
  "czkawka": { light: false, tags: [] },
  "dadabik": { light: true, tags: [] },
  "daemon-sync": { light: true, tags: [] },
  "dagster": { light: true, tags: [] },
  "dagu": { light: true, tags: [] },
  "dailytxt": { light: true, tags: [] },
  "dalibo": { light: true, tags: [] },
  "dasharr": { light: true, tags: [] },
  "dashlit": { light: true, tags: [] },
  "dashwise": { light: true, tags: [] },
  "databasement": { light: true, tags: [] },
  "databasus": { light: true, tags: [] },
  "datadog": { light: true, tags: [] },
  "datapup": { light: true, tags: [] },
  "datasette": { light: true, tags: [] },
  "davical": { light: true, tags: [] },
  "dawarich": { light: true, tags: [] },
  "daylog": { light: true, tags: [] },
  "dazn": { light: true, tags: ["Streaming"] },
  "db-ui": { light: true, tags: [] },
  "dbackup": { light: true, tags: [] },
  "ddclient": { light: true, tags: [] },
  "ddns-updater": { light: false, tags: [] },
  "debian": { light: true, tags: ["Operating System"] },
  "deepseek": { light: true, tags: ["Artificial Intelligence"] },
  "deezer": { light: true, tags: [] },
  "defguard": { light: true, tags: [] },
  "degoog": { light: true, tags: [] },
  "dell": { light: true, tags: ["Shopping"] },
  "delta-air-lines": { light: true, tags: ["Airlines"] },
  "delta-chat": { light: true, tags: [] },
  "deluge": { light: true, tags: [] },
  "deployrr": { light: true, tags: [] },
  "dev-push": { light: true, tags: [] },
  "devuan": { light: true, tags: ["Operating System"] },
  "dex-auth": { light: true, tags: [] },
  "dfir-iris": { light: true, tags: [] },
  "dflow": { light: true, tags: [] },
  "dhl": { light: true, tags: ["Shipping"] },
  "dify": { light: true, tags: ["Artificial Intelligence"] },
  "digikam": { light: false, tags: [] },
  "digitalocean": { light: true, tags: [] },
  "dillinger": { light: true, tags: [] },
  "directus": { light: true, tags: [] },
  "discopanel": { light: true, tags: ["Minecraft", "Video Games"] },
  "discord": { light: true, tags: ["Social"] },
  "discourse": { light: true, tags: ["Social"] },
  "discover-card": { light: true, tags: ["Banks"] },
  "diskover": { light: true, tags: [] },
  "disney-plus": { light: true, tags: ["Streaming"] },
  "dispatch-tasks": { light: true, tags: [] },
  "dispatcharr": { light: true, tags: [] },
  "diun-dash": { light: true, tags: [] },
  "diyhue": { light: true, tags: [] },
  "dji-logbook": { light: true, tags: [] },
  "docassemble": { light: true, tags: [] },
  "docker": { light: true, tags: [] },
  "docker-volume-backup": { light: false, tags: [] },
  "dockerizalo": { light: true, tags: [] },
  "dockflare": { light: true, tags: [] },
  "dockform": { light: true, tags: [] },
  "dockge": { light: true, tags: [] },
  "docking-station": { light: true, tags: [] },
  "dockpeek": { light: true, tags: [] },
  "dockprobe": { light: true, tags: [] },
  "docktail": { light: true, tags: [] },
  "docmost": { light: true, tags: [] },
  "doco-cd": { light: true, tags: [] },
  "docs-collaboration": { light: true, tags: [] },
  "docsight": { light: true, tags: [] },
  "docspell": { light: true, tags: [] },
  "documenso": { light: true, tags: [] },
  "docusaurus": { light: false, tags: [] },
  "docuseal": { light: true, tags: [] },
  "dokemon": { light: true, tags: [] },
  "dokku": { light: false, tags: [] },
  "dokploy": { light: true, tags: [] },
  "dokuwiki": { light: false, tags: [] },
  "dolibarr": { light: true, tags: [] },
  "domain-locker": { light: true, tags: [] },
  "domain-monitor": { light: true, tags: [] },
  "domain-watchdog": { light: true, tags: [] },
  "domainmod": { light: true, tags: [] },
  "donetick": { light: true, tags: [] },
  "doordash": { light: true, tags: [] },
  "dooropener": { light: true, tags: [] },
  "dope-security": { light: true, tags: [] },
  "doppler": { light: true, tags: [] },
  "dosvault": { light: true, tags: ["Video Games"] },
  "double-take": { light: true, tags: [] },
  "dovecot": { light: true, tags: [] },
  "downtify": { light: true, tags: [] },
  "dozzle": { light: true, tags: [] },
  "drasl": { light: true, tags: [] },
  "draw-io": { light: true, tags: [] },
  "dribdat": { light: true, tags: [] },
  "drivebase": { light: true, tags: [] },
  "drone-ci": { light: true, tags: [] },
  "drop": { light: true, tags: [] },
  "dropbox": { light: true, tags: ["Cloud Storage"] },
  "dropout": { light: true, tags: [] },
  "drupal": { light: true, tags: [] },
  "dub": { light: true, tags: [] },
  "duckdns": { light: true, tags: [] },
  "duckduckgo": { light: true, tags: ["Search"] },
  "dumb-genius": { light: true, tags: [] },
  "dumbassets": { light: true, tags: [] },
  "dumbbudget": { light: true, tags: [] },
  "dumbdo": { light: true, tags: [] },
  "dumbdrop": { light: true, tags: [] },
  "dumbkan": { light: true, tags: [] },
  "dumbpad": { light: true, tags: [] },
  "dumbterm": { light: true, tags: [] },
  "dumbwhois": { light: true, tags: [] },
  "duolingo": { light: true, tags: [] },
  "duplicati": { light: true, tags: [] },
  "dynacat": { light: true, tags: [] },
  "dynamodb-dashboard": { light: true, tags: [] },
  "dynfi": { light: true, tags: ["Firewall"] },
  "e-trade": { light: true, tags: ["Banks"] },
  "easy-redmine": { light: true, tags: [] },
  "easypanel": { light: true, tags: [] },
  "ebay": { light: true, tags: ["Shopping"] },
  "ecowitt": { light: true, tags: [] },
  "edubuntu": { light: true, tags: ["Operating System"] },
  "eenvo": { light: true, tags: [] },
  "eigenfocus": { light: true, tags: [] },
  "ejabberd": { light: true, tags: [] },
  "elastic": { light: true, tags: [] },
  "elasticsearch": { light: true, tags: [] },
  "electronic-arts": { light: true, tags: ["Video Games"] },
  "element": { light: true, tags: [] },
  "element-fm": { light: true, tags: [] },
  "eleventy": { light: true, tags: [] },
  "elk": { light: true, tags: [] },
  "elysian": { light: true, tags: [] },
  "emby": { light: true, tags: ["Streaming"] },
  "emoncms": { light: true, tags: [] },
  "emqx": { light: true, tags: [] },
  "emulatorjs": { light: true, tags: ["Video Games"] },
  "enclosed": { light: true, tags: [] },
  "endless": { light: true, tags: [] },
  "endurain": { light: true, tags: [] },
  "enphase": { light: true, tags: [] },
  "ente-auth": { light: true, tags: [] },
  "ente-locker": { light: true, tags: [] },
  "ente-photos": { light: true, tags: [] },
  "eonvelope": { light: true, tags: [] },
  "ephemera": { light: true, tags: [] },
  "epic-games": { light: true, tags: ["Video Games"] },
  "ergo": { light: true, tags: [] },
  "ersatztv": { light: false, tags: [] },
  "erugo": { light: true, tags: [] },
  "espconnect": { light: true, tags: [] },
  "esphome": { light: true, tags: [] },
  "espocrm": { light: true, tags: [] },
  "eternal-vows": { light: true, tags: [] },
  "etesync": { light: true, tags: [] },
  "etherpad": { light: true, tags: [] },
  "etsy": { light: true, tags: ["Shopping"] },
  "europris": { light: true, tags: ["Shopping"] },
  "evcc": { light: true, tags: [] },
  "evsy": { light: true, tags: [] },
  "excalidash": { light: true, tags: [] },
  "excalidraw": { light: true, tags: [] },
  "exclaimer": { light: true, tags: [] },
  "eziwiki": { light: true, tags: [] },
  "f-droid": { light: true, tags: ["App Store"] },
  "facebook": { light: true, tags: ["Social"] },
  "facebook-messenger": { light: true, tags: ["Social"] },
  "falcon-player": { light: true, tags: [] },
  "fandango": { light: true, tags: [] },
  "fandom": { light: true, tags: [] },
  "faridoon": { light: true, tags: [] },
  "fasten-health": { light: true, tags: [] },
  "fastgpt": { light: true, tags: ["Artificial Intelligence"] },
  "fastmail": { light: true, tags: [] },
  "fava": { light: true, tags: [] },
  "faved": { light: true, tags: [] },
  "fedex": { light: true, tags: ["Shipping"] },
  "fediverse": { light: true, tags: [] },
  "fedora": { light: true, tags: ["Operating System"] },
  "feedbase": { light: true, tags: [] },
  "feedbin": { light: true, tags: [] },
  "feedly": { light: true, tags: [] },
  "feedlynx": { light: true, tags: [] },
  "feedpushr": { light: true, tags: [] },
  "feeds-fun": { light: true, tags: [] },
  "fenrus": { light: false, tags: [] },
  "ferdium": { light: true, tags: [] },
  "ferretdb": { light: true, tags: [] },
  "ferrishare": { light: true, tags: [] },
  "ferron": { light: true, tags: [] },
  "fhem": { light: true, tags: [] },
  "fiberstore": { light: true, tags: ["Artificial Intelligence"] },
  "fidelity": { light: true, tags: ["Banks"] },
  "fider": { light: true, tags: [] },
  "filameter": { light: true, tags: [] },
  "file-browser": { light: true, tags: [] },
  "file-explorer": { light: true, tags: [] },
  "file-portal": { light: true, tags: [] },
  "file-wizard": { light: true, tags: [] },
  "filebrowser-quantum": { light: true, tags: [] },
  "filedrop": { light: true, tags: [] },
  "fileflows": { light: true, tags: [] },
  "filegator": { light: true, tags: [] },
  "filen": { light: true, tags: [] },
  "filepizza": { light: false, tags: [] },
  "filerise": { light: true, tags: [] },
  "filerun": { light: true, tags: [] },
  "filestash": { light: true, tags: ["Cloud Storage"] },
  "filesync": { light: true, tags: [] },
  "filezilla": { light: true, tags: [] },
  "finn": { light: true, tags: ["Shopping"] },
  "firebase": { light: true, tags: [] },
  "firecrawl": { light: true, tags: [] },
  "firefly-iii": { light: true, tags: [] },
  "firefox": { light: false, tags: ["Browsers", "Mozilla"] },
  "fireshare": { light: true, tags: [] },
  "firewalla": { light: true, tags: [] },
  "firezone": { light: true, tags: [] },
  "fittrackee": { light: false, tags: [] },
  "fladder": { light: true, tags: [] },
  "flaresolverr": { light: true, tags: [] },
  "flarum": { light: true, tags: [] },
  "flashpaper": { light: true, tags: [] },
  "flathub": { light: true, tags: ["App Store"] },
  "flatnotes": { light: true, tags: [] },
  "fleet-dm": { light: true, tags: [] },
  "fli-so": { light: true, tags: [] },
  "flightradar24": { light: true, tags: [] },
  "flint": { light: true, tags: [] },
  "flixor": { light: true, tags: [] },
  "flohmarkt": { light: true, tags: [] },
  "flood": { light: true, tags: [] },
  "flow-like": { light: true, tags: [] },
  "flowinquiry": { light: true, tags: [] },
  "flowise": { light: true, tags: ["Artificial Intelligence"] },
  "fluent-reader": { light: true, tags: [] },
  "fluffychat": { light: true, tags: [] },
  "fluidcalendar": { light: true, tags: [] },
  "fluidd": { light: true, tags: [] },
  "fluxer": { light: true, tags: [] },
  "fmd": { light: true, tags: [] },
  "fnos": { light: true, tags: [] },
  "focalboard": { light: true, tags: [] },
  "foldergram": { light: true, tags: [] },
  "folderhost": { light: true, tags: ["Cloud Storage"] },
  "folding-home": { light: true, tags: [] },
  "folo": { light: true, tags: [] },
  "forauth": { light: true, tags: [] },
  "ford": { light: true, tags: ["Automobiles"] },
  "forgejo": { light: true, tags: ["Git"] },
  "formbricks": { light: true, tags: [] },
  "forms-md": { light: true, tags: [] },
  "forte": { light: true, tags: [] },
  "fortinet": { light: true, tags: ["Firewall"] },
  "foss-events": { light: true, tags: [] },
  "framadate": { light: true, tags: [] },
  "frames": { light: true, tags: [] },
  "framework": { light: true, tags: [] },
  "frankmd": { light: true, tags: [] },
  "frappe-books": { light: true, tags: ["Frappe"] },
  "frappe-builder": { light: true, tags: ["Frappe"] },
  "frappe-cloud": { light: true, tags: ["Frappe"] },
  "frappe-crm": { light: true, tags: ["Frappe"] },
  "frappe-erpnext": { light: true, tags: ["Frappe"] },
  "frappe-framework": { light: true, tags: ["Frappe"] },
  "frappe-gameplan": { light: true, tags: ["Frappe"] },
  "frappe-helpdesk": { light: true, tags: ["Frappe"] },
  "frappe-hr": { light: true, tags: ["Frappe"] },
  "frappe-insights": { light: true, tags: ["Frappe"] },
  "frappe-learning": { light: true, tags: ["Frappe"] },
  "frappe-lending": { light: true, tags: ["Frappe"] },
  "free-isp": { light: true, tags: ["Cellular Carriers"] },
  "freebsd": { light: true, tags: ["Operating System"] },
  "freecad": { light: true, tags: [] },
  "freedombox": { light: true, tags: [] },
  "freefinance": { light: true, tags: [] },
  "freeipa": { light: true, tags: [] },
  "freepbx": { light: true, tags: [] },
  "freeradius": { light: true, tags: ["Operating System"] },
  "freeresend": { light: true, tags: [] },
  "freescout": { light: true, tags: [] },
  "freeshard": { light: true, tags: [] },
  "fresh-editor": { light: true, tags: [] },
  "freshrss": { light: true, tags: [] },
  "friendica": { light: true, tags: ["Social"] },
  "frigate": { light: true, tags: [] },
  "frigoligo": { light: true, tags: [] },
  "fritz": { light: true, tags: [] },
  "fubotv": { light: true, tags: ["Streaming"] },
  "fumadocs": { light: false, tags: [] },
  "funkwhale": { light: true, tags: [] },
  "fusionauth": { light: true, tags: [] },
  "gameyfin": { light: true, tags: ["Video Games"] },
  "gandi": { light: true, tags: [] },
  "garage": { light: true, tags: [] },
  "garlic-hub": { light: true, tags: [] },
  "garmin-grafana": { light: true, tags: [] },
  "gathio": { light: true, tags: [] },
  "gatsby": { light: true, tags: [] },
  "gatus": { light: true, tags: [] },
  "gdms": { light: true, tags: [] },
  "geeftlist": { light: true, tags: [] },
  "gentoo": { light: false, tags: ["Operating System"] },
  "geopulse": { light: true, tags: [] },
  "gerbera": { light: true, tags: [] },
  "getcomics": { light: true, tags: [] },
  "ghidra": { light: true, tags: [] },
  "ghostboard": { light: true, tags: [] },
  "ghostfolio": { light: true, tags: [] },
  "ghostty": { light: true, tags: [] },
  "gimp": { light: true, tags: [] },
  "giraffile": { light: true, tags: [] },
  "git": { light: true, tags: ["Git"] },
  "git-pages": { light: true, tags: [] },
  "gitbundle": { light: true, tags: ["Git"] },
  "gitea": { light: true, tags: ["Git"] },
  "github": { light: true, tags: ["Git"] },
  "github-copilot": { light: true, tags: ["Artificial Intelligence", "Git"] },
  "github-release-monitor": { light: true, tags: ["Git"] },
  "gitlab": { light: true, tags: ["Git"] },
  "gitsave": { light: true, tags: ["Git"] },
  "gl-inet": { light: true, tags: [] },
  "glance": { light: true, tags: [] },
  "glances": { light: true, tags: [] },
  "glitchtip": { light: true, tags: [] },
  "global-threat-map": { light: true, tags: [] },
  "globaleaks": { light: true, tags: [] },
  "glowstone": { light: true, tags: ["Minecraft"] },
  "glpi": { light: true, tags: [] },
  "gluetun": { light: true, tags: [] },
  "gmail": { light: true, tags: ["Google"] },
  "gmail-cleaner": { light: true, tags: [] },
  "gns3": { light: true, tags: [] },
  "go2rtc": { light: true, tags: [] },
  "goaccess": { light: true, tags: [] },
  "goatcounter": { light: true, tags: [] },
  "golang": { light: true, tags: [] },
  "gomft": { light: false, tags: [] },
  "goodreads": { light: true, tags: ["Social"] },
  "google": { light: true, tags: ["Google", "Search"] },
  "google-analytics": { light: true, tags: ["Google"] },
  "google-calendar": { light: true, tags: ["Google"] },
  "google-chat": { light: true, tags: ["Google", "Social"] },
  "google-chrome": { light: true, tags: ["Browsers", "Google"] },
  "google-cloud": { light: true, tags: ["Google"] },
  "google-contacts": { light: true, tags: ["Google"] },
  "google-docs": { light: true, tags: ["Google", "Office"] },
  "google-drive": { light: true, tags: ["Google", "Office"] },
  "google-fi": { light: true, tags: ["Cellular Carriers", "Google"] },
  "google-gemini": { light: true, tags: ["Artificial Intelligence", "Google"] },
  "google-home": { light: true, tags: ["Google"] },
  "google-keep": { light: true, tags: ["Google"] },
  "google-maps": { light: true, tags: ["Google"] },
  "google-meet": { light: true, tags: ["Google"] },
  "google-messages": { light: true, tags: ["Google", "Social"] },
  "google-news": { light: true, tags: ["Google"] },
  "google-one": { light: true, tags: ["Google"] },
  "google-photos": { light: true, tags: ["Google"] },
  "google-play": { light: true, tags: ["App Store", "Google"] },
  "google-sheets": { light: true, tags: ["Google", "Office"] },
  "google-shopping": { light: true, tags: ["Google"] },
  "google-slides": { light: true, tags: ["Google", "Office"] },
  "google-tag-manager": { light: true, tags: ["Google"] },
  "google-translate": { light: true, tags: ["Google"] },
  "google-voice": { light: true, tags: ["Google"] },
  "gopeed": { light: true, tags: [] },
  "gophish": { light: true, tags: [] },
  "gossa": { light: false, tags: [] },
  "gosuki": { light: true, tags: [] },
  "gotify": { light: true, tags: [] },
  "gotosocial": { light: true, tags: ["Social"] },
  "grafana": { light: true, tags: [] },
  "grafana-alerts-dashboard": { light: true, tags: [] },
  "grafana-alloy": { light: true, tags: [] },
  "grafana-mimir": { light: true, tags: [] },
  "grafana-pyroscope": { light: true, tags: [] },
  "grafana-tempo": { light: true, tags: [] },
  "gramps": { light: true, tags: [] },
  "grapheneos": { light: true, tags: ["Operating System"] },
  "graphhopper": { light: true, tags: [] },
  "graphite": { light: true, tags: [] },
  "grass-io": { light: true, tags: [] },
  "grav": { light: true, tags: [] },
  "grayjay": { light: true, tags: [] },
  "graylog": { light: true, tags: [] },
  "grimmory": { light: true, tags: [] },
  "grimoire": { light: false, tags: [] },
  "grimoire-ttrpg": { light: true, tags: [] },
  "grist": { light: true, tags: [] },
  "grocy": { light: true, tags: [] },
  "grok": { light: true, tags: ["Artificial Intelligence"] },
  "groly": { light: true, tags: [] },
  "growchief": { light: true, tags: [] },
  "gryt": { light: true, tags: [] },
  "guardian-plex": { light: true, tags: [] },
  "habitat-social": { light: true, tags: [] },
  "habitica": { light: true, tags: [] },
  "hacker-news": { light: true, tags: ["News", "Social"] },
  "hammer-editor": { light: true, tags: [] },
  "hanko": { light: true, tags: [] },
  "haproxy": { light: true, tags: [] },
  "haptic": { light: true, tags: [] },
  "harbor": { light: true, tags: [] },
  "harbor-guard": { light: true, tags: [] },
  "harbor-scale": { light: true, tags: [] },
  "hardcover": { light: true, tags: [] },
  "hashicorp": { light: true, tags: ["HashiCorp"] },
  "hashicorp-boundary": { light: true, tags: ["HashiCorp"] },
  "hashicorp-consul": { light: true, tags: ["HashiCorp"] },
  "hashicorp-nomad": { light: true, tags: ["HashiCorp"] },
  "hashicorp-packer": { light: true, tags: ["HashiCorp"] },
  "hashicorp-terraform": { light: true, tags: ["HashiCorp"] },
  "hashicorp-vagrant": { light: true, tags: [] },
  "hashicorp-vault": { light: true, tags: ["HashiCorp"] },
  "hashicorp-waypoint": { light: true, tags: ["HashiCorp"] },
  "hauk": { light: true, tags: [] },
  "haus": { light: true, tags: [] },
  "hbo": { light: true, tags: ["Streaming"] },
  "hbo-max": { light: true, tags: ["Streaming"] },
  "hdhomerun": { light: true, tags: [] },
  "headlamp": { light: true, tags: [] },
  "headscale": { light: true, tags: ["VPN"] },
  "healthchecks": { light: true, tags: [] },
  "hedgedoc": { light: true, tags: [] },
  "heimdall": { light: true, tags: [] },
  "helium-mobile": { light: true, tags: ["Cellular Carriers"] },
  "helm": { light: true, tags: [] },
  "hemmelig": { light: true, tags: [] },
  "here-now": { light: true, tags: [] },
  "hermesseg": { light: true, tags: [] },
  "heroku": { light: true, tags: [] },
  "hetrixtools": { light: true, tags: [] },
  "hetzner": { light: true, tags: [] },
  "hewlett-packard-enterprise": { light: true, tags: [] },
  "hexabot": { light: true, tags: ["Artificial Intelligence"] },
  "heyform": { light: true, tags: [] },
  "hhf-technology": { light: true, tags: [] },
  "hi-events": { light: true, tags: [] },
  "hister": { light: true, tags: [] },
  "hitkeep": { light: true, tags: [] },
  "hivedav": { light: false, tags: [] },
  "hivemq": { light: true, tags: [] },
  "hollo": { light: true, tags: [] },
  "homarr": { light: true, tags: [] },
  "home-assistant": { light: true, tags: [] },
  "home-assistant-matter-hub": { light: true, tags: [] },
  "home-information": { light: true, tags: [] },
  "homebox": { light: true, tags: [] },
  "homebridge": { light: true, tags: [] },
  "homedash": { light: true, tags: [] },
  "homedock-os": { light: true, tags: ["Operating System"] },
  "homelable": { light: true, tags: [] },
  "homematic-ip": { light: true, tags: [] },
  "homepage": { light: true, tags: [] },
  "homer": { light: true, tags: [] },
  "homescreen-hero": { light: true, tags: [] },
  "hoodik": { light: false, tags: [] },
  "hook0": { light: true, tags: [] },
  "hoppscotch": { light: true, tags: [] },
  "hortusfox": { light: true, tags: [] },
  "hpe-aruba": { light: true, tags: [] },
  "html5": { light: true, tags: [] },
  "hubzilla": { light: true, tags: ["Social"] },
  "huginn": { light: true, tags: [] },
  "hugo": { light: true, tags: [] },
  "hulu": { light: true, tags: ["Streaming"] },
  "humble-bundle": { light: true, tags: ["Shopping", "Video Games"] },
  "humhub": { light: true, tags: ["Social"] },
  "hydrus-web": { light: true, tags: [] },
  "hyperdx": { light: true, tags: [] },
  "hyperhdr": { light: true, tags: [] },
  "hypermind": { light: true, tags: [] },
  "hyperpipe": { light: true, tags: [] },
  "hyvor-relay": { light: true, tags: [] },
  "i-librarian": { light: true, tags: [] },
  "iammeter": { light: true, tags: [] },
  "icinga": { light: true, tags: [] },
  "icloud": { light: true, tags: ["Apple"] },
  "ideon": { light: true, tags: [] },
  "ign": { light: true, tags: ["News", "Video Games"] },
  "ignidash": { light: true, tags: [] },
  "iheartradio": { light: true, tags: ["Podcasts"] },
  "ikuai": { light: true, tags: ["Shopping"] },
  "imdb": { light: true, tags: [] },
  "immich": { light: true, tags: [] },
  "immich-frame": { light: true, tags: [] },
  "immich-kiosk": { light: true, tags: [] },
  "immich-power-tools": { light: true, tags: [] },
  "immich-public-proxy": { light: true, tags: [] },
  "inexogy": { light: true, tags: [] },
  "infisical": { light: true, tags: [] },
  "influxdb": { light: true, tags: [] },
  "initiative-project-management": { light: true, tags: [] },
  "inkscape": { light: true, tags: [] },
  "inoreader": { light: true, tags: [] },
  "inspircd": { light: true, tags: [] },
  "instagram": { light: true, tags: ["Social"] },
  "instagram-reels": { light: true, tags: ["Social"] },
  "installatron": { light: true, tags: [] },
  "instapods": { light: true, tags: [] },
  "instradaogm": { light: true, tags: [] },
  "instructure-canvas": { light: true, tags: [] },
  "intelowl": { light: true, tags: [] },
  "interactive-brokers": { light: true, tags: ["Banks"] },
  "interlock": { light: true, tags: [] },
  "internet-archive": { light: true, tags: [] },
  "intervals-icu": { light: true, tags: [] },
  "inventree": { light: true, tags: [] },
  "investbrain": { light: true, tags: [] },
  "invidious": { light: true, tags: [] },
  "invio": { light: true, tags: [] },
  "invoice-ninja": { light: true, tags: [] },
  "invoiceplane": { light: true, tags: [] },
  "invoicerr": { light: true, tags: [] },
  "invoiceshelf": { light: true, tags: [] },
  "invoke-ai": { light: true, tags: [] },
  "iobroker": { light: true, tags: [] },
  "ipfs": { light: true, tags: [] },
  "iplayarr": { light: true, tags: [] },
  "ipvanish": { light: true, tags: [] },
  "ironcalc": { light: true, tags: [] },
  "ironmount": { light: true, tags: [] },
  "irs": { light: true, tags: [] },
  "it-glue": { light: true, tags: [] },
  "it-tools": { light: true, tags: [] },
  "itsm-ng": { light: true, tags: [] },
  "iventoy": { light: true, tags: ["Operating System"] },
  "jackett": { light: true, tags: [] },
  "java": { light: true, tags: [] },
  "javascript": { light: true, tags: [] },
  "jeedom": { light: true, tags: [] },
  "jekyll": { light: true, tags: [] },
  "jellify": { light: true, tags: [] },
  "jellyfin": { light: true, tags: ["Streaming"] },
  "jellyseerr": { light: true, tags: [] },
  "jellyswarrm": { light: true, tags: [] },
  "jelu": { light: true, tags: [] },
  "jenkins": { light: false, tags: [] },
  "jetblue-airways": { light: true, tags: ["Airlines"] },
  "jetbrains": { light: true, tags: [] },
  "jetkvm": { light: true, tags: [] },
  "jfa-go": { light: true, tags: [] },
  "jinear": { light: true, tags: [] },
  "jira": { light: true, tags: [] },
  "jitsi-meet": { light: true, tags: [] },
  "joomla": { light: true, tags: [] },
  "joplin": { light: true, tags: [] },
  "jotty": { light: true, tags: [] },
  "journiv": { light: true, tags: [] },
  "jsreport": { light: true, tags: [] },
  "jstor": { light: true, tags: [] },
  "jula": { light: true, tags: ["Shopping"] },
  "jump": { light: true, tags: [] },
  "jumpserver": { light: true, tags: [] },
  "jupiterone": { light: true, tags: [] },
  "jupyter": { light: true, tags: [] },
  "jwt-io": { light: true, tags: [] },
  "kagi": { light: true, tags: [] },
  "kali-linux": { light: true, tags: ["Operating System"] },
  "kali-linux-wordmark": { light: true, tags: ["Operating System"] },
  "kamiyomu": { light: true, tags: [] },
  "kan": { light: true, tags: [] },
  "kanba": { light: true, tags: [] },
  "kanboard": { light: true, tags: [] },
  "kaneo": { light: true, tags: [] },
  "kanidm": { light: true, tags: [] },
  "kapowarr": { light: true, tags: [] },
  "karakeep": { light: true, tags: [] },
  "karrot": { light: true, tags: [] },
  "kasm-workspaces": { light: true, tags: [] },
  "kaunta": { light: true, tags: [] },
  "kavita": { light: true, tags: [] },
  "kbin": { light: true, tags: [] },
  "keepassxc": { light: true, tags: ["Passwords"] },
  "keeper": { light: true, tags: [] },
  "keila": { light: true, tags: [] },
  "kener": { light: true, tags: [] },
  "kestra": { light: true, tags: [] },
  "keycloak": { light: true, tags: [] },
  "keyhelp": { light: true, tags: [] },
  "kherad": { light: true, tags: [] },
  "khoj": { light: true, tags: [] },
  "kibana": { light: true, tags: [] },
  "kickstarter": { light: true, tags: ["Shopping"] },
  "kimai": { light: true, tags: [] },
  "kinto": { light: false, tags: [] },
  "kiroshi": { light: true, tags: [] },
  "kitchenowl": { light: true, tags: [] },
  "kite-kubernetes": { light: true, tags: [] },
  "kitsu": { light: true, tags: [] },
  "kiwix": { light: true, tags: [] },
  "kjell-company": { light: true, tags: ["Shopping"] },
  "klipper": { light: true, tags: [] },
  "ko-fi": { light: true, tags: ["Donations"] },
  "kodi": { light: true, tags: [] },
  "koel": { light: true, tags: [] },
  "koito": { light: true, tags: [] },
  "komelia": { light: true, tags: [] },
  "kometa": { light: true, tags: [] },
  "komga": { light: true, tags: [] },
  "komodo": { light: true, tags: [] },
  "komodo-cd": { light: true, tags: [] },
  "komplett": { light: true, tags: ["Shopping"] },
  "kontoj": { light: true, tags: [] },
  "kopia": { light: true, tags: [] },
  "koshelf": { light: true, tags: [] },
  "kostos": { light: true, tags: [] },
  "krakend": { light: true, tags: [] },
  "krusader": { light: true, tags: [] },
  "ksuite": { light: true, tags: ["Infomaniak"] },
  "ksuite-calendar": { light: true, tags: ["Infomaniak"] },
  "ksuite-chk": { light: true, tags: ["Infomaniak"] },
  "ksuite-contacts": { light: true, tags: ["Infomaniak"] },
  "ksuite-docs": { light: true, tags: ["Infomaniak"] },
  "ksuite-grids": { light: true, tags: ["Infomaniak"] },
  "ksuite-kchat": { light: true, tags: ["Infomaniak"] },
  "ksuite-kdrive": { light: true, tags: ["Infomaniak"] },
  "ksuite-kmeet": { light: true, tags: ["Infomaniak"] },
  "ksuite-kpaste": { light: true, tags: ["Infomaniak"] },
  "ksuite-mail": { light: true, tags: ["Infomaniak"] },
  "ksuite-manager": { light: true, tags: ["Infomaniak"] },
  "ksuite-points": { light: true, tags: ["Infomaniak"] },
  "ksuite-swisstransfer": { light: true, tags: ["Infomaniak"] },
  "kubecraft": { light: true, tags: [] },
  "kubernetes": { light: true, tags: [] },
  "kubero": { light: true, tags: [] },
  "kubetail": { light: true, tags: [] },
  "kubuntu": { light: true, tags: ["Operating System"] },
  "kumiho": { light: true, tags: [] },
  "kwsx-radio": { light: true, tags: [] },
  "kyoo": { light: true, tags: [] },
  "lab-dash": { light: true, tags: [] },
  "labelito": { light: true, tags: [] },
  "ladder": { light: true, tags: [] },
  "lan-orangutan": { light: false, tags: [] },
  "lancache-net": { light: true, tags: [] },
  "lancommander": { light: true, tags: [] },
  "langflow": { light: true, tags: [] },
  "langfuse": { light: true, tags: ["Artificial Intelligence"] },
  "languagetool": { light: true, tags: [] },
  "last-fm": { light: true, tags: ["Podcasts"] },
  "lastpass": { light: true, tags: ["Passwords"] },
  "lastsignal": { light: true, tags: [] },
  "latex": { light: true, tags: [] },
  "laudspeaker": { light: true, tags: [] },
  "ldap": { light: true, tags: [] },
  "leafwiki": { light: true, tags: [] },
  "leantime": { light: true, tags: [] },
  "lemmy": { light: true, tags: ["Social"] },
  "lemonade-ai": { light: false, tags: [] },
  "lets-encrypt": { light: true, tags: [] },
  "letterboxd": { light: true, tags: [] },
  "letterfeed": { light: true, tags: [] },
  "lexware": { light: true, tags: [] },
  "libation": { light: true, tags: [] },
  "libera-chat": { light: true, tags: [] },
  "librarything": { light: true, tags: [] },
  "librechat": { light: true, tags: [] },
  "libredb-studio": { light: true, tags: [] },
  "librenms": { light: true, tags: [] },
  "libreoffice": { light: true, tags: ["Office"] },
  "librephotos": { light: true, tags: [] },
  "librespeed": { light: true, tags: [] },
  "libretranslate": { light: true, tags: [] },
  "librewolf": { light: true, tags: ["Browsers"] },
  "librum": { light: true, tags: [] },
  "lidarr": { light: true, tags: [] },
  "lidarr-radarr": { light: true, tags: [] },
  "lidbrainz": { light: true, tags: [] },
  "lightningrod": { light: true, tags: [] },
  "limesurvey": { light: true, tags: [] },
  "linear": { light: true, tags: [] },
  "lingarr": { light: true, tags: [] },
  "linguacafe": { light: true, tags: [] },
  "lingva-translate": { light: true, tags: [] },
  "linkace": { light: true, tags: [] },
  "linkding": { light: true, tags: [] },
  "linkedin": { light: true, tags: ["Social"] },
  "linkstack": { light: true, tags: [] },
  "linkwarden": { light: true, tags: [] },
  "linux": { light: true, tags: ["Operating System"] },
  "linux-containers-lxc": { light: true, tags: [] },
  "linux-update-dashboard": { light: true, tags: [] },
  "linuxgsm": { light: true, tags: [] },
  "linuxserver-io": { light: true, tags: [] },
  "listenarr": { light: true, tags: [] },
  "listenbrainz": { light: true, tags: [] },
  "listing-lab": { light: true, tags: [] },
  "listmonk": { light: true, tags: [] },
  "listseerr": { light: true, tags: [] },
  "litellm": { light: true, tags: ["Artificial Intelligence"] },
  "litlyx": { light: true, tags: [] },
  "little-chat": { light: true, tags: [] },
  "littlelink": { light: true, tags: [] },
  "live-blog": { light: true, tags: [] },
  "livebook": { light: false, tags: [] },
  "livinity": { light: true, tags: ["Operating System"] },
  "liwan": { light: true, tags: [] },
  "llama-cpp": { light: true, tags: [] },
  "lldap": { light: true, tags: [] },
  "lms-mixtape": { light: true, tags: [] },
  "loandash": { light: true, tags: [] },
  "lobe-chat": { light: true, tags: ["Artificial Intelligence"] },
  "lobehub": { light: true, tags: ["Artificial Intelligence"] },
  "local-content-share": { light: true, tags: [] },
  "localess": { light: true, tags: [] },
  "localsend": { light: true, tags: [] },
  "lodestone": { light: true, tags: ["Minecraft"] },
  "logchef": { light: true, tags: [] },
  "logforge": { light: true, tags: [] },
  "loglibrarian": { light: true, tags: [] },
  "loglynx": { light: true, tags: [] },
  "logseq": { light: true, tags: [] },
  "logtide": { light: true, tags: [] },
  "logto": { light: true, tags: [] },
  "logwell": { light: true, tags: [] },
  "loki": { light: true, tags: [] },
  "lollypop-music-player": { light: false, tags: [] },
  "loops": { light: true, tags: ["Social"] },
  "lore-epic-games": { light: true, tags: [] },
  "lowcoder": { light: true, tags: [] },
  "lufin": { light: true, tags: [] },
  "lufthansa": { light: true, tags: ["Airlines"] },
  "lululemon": { light: true, tags: ["Shopping"] },
  "lumio": { light: true, tags: [] },
  "luna-dashboard": { light: true, tags: [] },
  "lunalytics": { light: true, tags: [] },
  "lunar": { light: true, tags: [] },
  "lunasea": { light: true, tags: [] },
  "lyft": { light: true, tags: [] },
  "lyrion-music-server": { light: true, tags: [] },
  "m-t-bank": { light: true, tags: ["Banks"] },
  "m3u-editor": { light: true, tags: [] },
  "macrumors": { light: true, tags: ["News"] },
  "mafl": { light: true, tags: [] },
  "magicmirror2": { light: true, tags: [] },
  "mail-archiver": { light: true, tags: [] },
  "mail-in-a-box": { light: false, tags: [] },
  "mailchimp": { light: true, tags: [] },
  "mailcow": { light: true, tags: [] },
  "mailflow-sh": { light: true, tags: [] },
  "mailgun": { light: true, tags: [] },
  "mailjet": { light: true, tags: [] },
  "mailpit": { light: true, tags: [] },
  "mailstore": { light: true, tags: [] },
  "mainsail": { light: true, tags: [] },
  "maintainerr": { light: true, tags: [] },
  "maintenant": { light: true, tags: [] },
  "maker-management-platform": { light: true, tags: [] },
  "makers-vault": { light: true, tags: [] },
  "maloja": { light: true, tags: [] },
  "manifest": { light: true, tags: [] },
  "mantrae": { light: true, tags: [] },
  "many-notes": { light: true, tags: [] },
  "mariadb": { light: true, tags: [] },
  "markstack": { light: true, tags: [] },
  "marp": { light: true, tags: [] },
  "marpui": { light: true, tags: [] },
  "marreta": { light: true, tags: [] },
  "mashable": { light: true, tags: ["News"] },
  "mastercard": { light: true, tags: ["Banks"] },
  "mastodon": { light: true, tags: ["Social"] },
  "matchexec": { light: false, tags: [] },
  "material-for-mkdocs": { light: true, tags: [] },
  "materialious": { light: true, tags: [] },
  "mathesar": { light: true, tags: [] },
  "matomo": { light: true, tags: [] },
  "matrix": { light: true, tags: ["Social"] },
  "matter": { light: true, tags: [] },
  "matterbridge": { light: true, tags: [] },
  "mattermost": { light: true, tags: ["Social"] },
  "mautic": { light: true, tags: [] },
  "max": { light: true, tags: [] },
  "maxun": { light: true, tags: [] },
  "mayan-edms": { light: true, tags: [] },
  "maybe": { light: true, tags: [] },
  "mazanoke": { light: true, tags: [] },
  "mbin": { light: true, tags: ["Social"] },
  "mealie": { light: true, tags: [] },
  "medama": { light: true, tags: [] },
  "medassist": { light: true, tags: [] },
  "medialyze": { light: true, tags: [] },
  "mediamanager": { light: true, tags: [] },
  "mediamtx": { light: true, tags: [] },
  "mediathekview": { light: false, tags: [] },
  "medikeep": { light: true, tags: [] },
  "mediux": { light: true, tags: [] },
  "medusa": { light: true, tags: [] },
  "meelo": { light: true, tags: [] },
  "meetable": { light: true, tags: [] },
  "mega": { light: true, tags: ["Cloud Storage"] },
  "meilisearch": { light: true, tags: [] },
  "melody-auth": { light: true, tags: [] },
  "memcached": { light: true, tags: [] },
  "meme-search": { light: true, tags: [] },
  "memories": { light: true, tags: ["Nextcloud"] },
  "mend-ai": { light: false, tags: ["Artificial Intelligence"] },
  "mend-container": { light: false, tags: [] },
  "mend-io": { light: true, tags: [] },
  "mend-renovate": { light: false, tags: [] },
  "mend-sast": { light: false, tags: [] },
  "mend-sca": { light: false, tags: [] },
  "mergeable": { light: true, tags: [] },
  "mergerfs": { light: true, tags: [] },
  "mermaid": { light: true, tags: [] },
  "meshcore": { light: true, tags: [] },
  "meshping": { light: true, tags: [] },
  "meshtastic": { light: true, tags: [] },
  "meta": { light: true, tags: ["Social"] },
  "metabase": { light: true, tags: [] },
  "metadata-remote": { light: true, tags: [] },
  "metatana": { light: true, tags: ["Artificial Intelligence"] },
  "metube": { light: true, tags: [] },
  "micro-center": { light: true, tags: ["Shopping"] },
  "microbin": { light: true, tags: [] },
  "microsandbox": { light: true, tags: ["Artificial Intelligence"] },
  "microsoft": { light: true, tags: ["Microsoft"] },
  "microsoft-365": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-access": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-access-2000": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-access-2013": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-access-2018": { light: true, tags: ["Microsoft"] },
  "microsoft-azure": { light: true, tags: ["Microsoft"] },
  "microsoft-bing": { light: true, tags: ["Microsoft", "Search"] },
  "microsoft-clipchamp": { light: true, tags: ["Microsoft"] },
  "microsoft-copilot": { light: true, tags: ["Artificial Intelligence", "Microsoft"] },
  "microsoft-defender": { light: true, tags: ["Microsoft"] },
  "microsoft-defender-2020": { light: true, tags: ["Microsoft"] },
  "microsoft-designer": { light: true, tags: ["Microsoft"] },
  "microsoft-edge": { light: true, tags: ["Browsers", "Microsoft"] },
  "microsoft-entra-id": { light: false, tags: ["Microsoft"] },
  "microsoft-excel": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-excel-2000": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-excel-2013": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-excel-2018": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-forms": { light: true, tags: ["Microsoft"] },
  "microsoft-forms-2016": { light: true, tags: ["Microsoft"] },
  "microsoft-forms-2019": { light: true, tags: ["Microsoft"] },
  "microsoft-foundry": { light: false, tags: ["Artificial Intelligence", "Microsoft"] },
  "microsoft-office": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-onedrive": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-onedrive-2018": { light: true, tags: ["Microsoft"] },
  "microsoft-onenote": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-onenote-2013": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-onenote-2018": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-outlook": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-outlook-2000": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-outlook-2013": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-outlook-2018": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-power-automate": { light: true, tags: ["Microsoft"] },
  "microsoft-powerpoint": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-powerpoint-2000": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-powerpoint-2013": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-powerpoint-2018": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-powertoys": { light: true, tags: ["Microsoft"] },
  "microsoft-sharepoint": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-sharepoint-2013": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-sql-server": { light: true, tags: ["Microsoft"] },
  "microsoft-store": { light: true, tags: ["App Store", "Microsoft"] },
  "microsoft-teams": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-teams-2016": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-teams-2018": { light: true, tags: ["Microsoft", "Office", "Social"] },
  "microsoft-to-do": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-windows": { light: true, tags: ["Microsoft", "Operating System"] },
  "microsoft-word": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-word-2000": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-word-2013": { light: true, tags: ["Microsoft", "Office"] },
  "microsoft-word-2018": { light: true, tags: ["Microsoft", "Office"] },
  "midjourney": { light: true, tags: ["Artificial Intelligence"] },
  "mikopbx": { light: true, tags: [] },
  "mikrotik": { light: true, tags: [] },
  "miles-and-more": { light: true, tags: ["Airlines"] },
  "minarca": { light: true, tags: [] },
  "minecraft": { light: true, tags: [] },
  "minecraft-creeper": { light: true, tags: ["Minecraft", "Video Games"] },
  "minecraft-detailed": { light: false, tags: ["Minecraft", "Video Games"] },
  "mini-qr": { light: true, tags: [] },
  "miniflux": { light: true, tags: [] },
  "minimus": { light: true, tags: [] },
  "minio": { light: true, tags: [] },
  "mint-mobile": { light: false, tags: ["Cellular Carriers"] },
  "minthcm": { light: true, tags: [] },
  "minuspod": { light: false, tags: [] },
  "mirotalk": { light: true, tags: [] },
  "misskey": { light: true, tags: [] },
  "mistral-ai": { light: true, tags: ["Artificial Intelligence"] },
  "mitmproxy": { light: true, tags: [] },
  "mitra": { light: true, tags: [] },
  "mixpost": { light: true, tags: ["Social"] },
  "mkdocs": { light: true, tags: [] },
  "mkvpriority": { light: true, tags: [] },
  "mobilizon": { light: true, tags: [] },
  "mockos": { light: true, tags: [] },
  "modrinth": { light: true, tags: ["Minecraft"] },
  "monero": { light: true, tags: [] },
  "monetr": { light: true, tags: [] },
  "mongodb": { light: true, tags: [] },
  "monica": { light: true, tags: ["Social"] },
  "moocup": { light: true, tags: [] },
  "moodist": { light: true, tags: [] },
  "moodle": { light: true, tags: [] },
  "morphos": { light: false, tags: [] },
  "mosquitto": { light: true, tags: [] },
  "motioneye": { light: true, tags: [] },
  "movary": { light: true, tags: [] },
  "movim": { light: true, tags: [] },
  "mozilla": { light: true, tags: ["Mozilla"] },
  "mozilla-monitor": { light: true, tags: ["Mozilla"] },
  "mozilla-vpn": { light: true, tags: ["Mozilla"] },
  "mqtt": { light: true, tags: [] },
  "mqttx": { light: true, tags: [] },
  "mullvad-vpn": { light: true, tags: ["VPN"] },
  "multi-scrobbler": { light: true, tags: [] },
  "mumble": { light: true, tags: ["Social"] },
  "munin": { light: true, tags: [] },
  "music-assistant": { light: true, tags: [] },
  "music-player-daemon": { light: false, tags: [] },
  "musicbrainz": { light: true, tags: [] },
  "musicbrainz-picard": { light: true, tags: [] },
  "musivault": { light: true, tags: [] },
  "mxroute": { light: true, tags: [] },
  "mydrive": { light: true, tags: ["Cloud Storage"] },
  "myheats": { light: true, tags: [] },
  "myip": { light: true, tags: [] },
  "mysql": { light: true, tags: [] },
  "mysterium": { light: true, tags: ["VPN"] },
  "n8n": { light: true, tags: [] },
  "nagios": { light: true, tags: [] },
  "nakama": { light: true, tags: [] },
  "namecheap": { light: true, tags: [] },
  "nametag": { light: true, tags: [] },
  "nanoclaw": { light: true, tags: ["Artificial Intelligence"] },
  "nanosmart": { light: true, tags: [] },
  "nanote": { light: true, tags: [] },
  "nasa": { light: true, tags: [] },
  "nasa-worm": { light: true, tags: [] },
  "nasdaq": { light: true, tags: ["Banks"] },
  "navidrome": { light: true, tags: [] },
  "navy-federal-credit-union": { light: true, tags: ["Banks"] },
  "neko": { light: true, tags: [] },
  "nemorosa": { light: true, tags: [] },
  "neo4j": { light: true, tags: [] },
  "neodb": { light: true, tags: ["Social"] },
  "neohabit": { light: true, tags: [] },
  "netalertx": { light: true, tags: [] },
  "netbird": { light: true, tags: [] },
  "netboot-xyz": { light: true, tags: [] },
  "netbox": { light: true, tags: [] },
  "netdata": { light: true, tags: [] },
  "netflix": { light: true, tags: ["Streaming"] },
  "netgear": { light: true, tags: [] },
  "netgoat": { light: true, tags: [] },
  "netlify": { light: true, tags: [] },
  "netlock-rmm": { light: true, tags: [] },
  "netonnet": { light: true, tags: ["Shopping"] },
  "netvisor": { light: true, tags: [] },
  "network-ups-tools": { light: true, tags: [] },
  "networking-toolbox": { light: true, tags: [] },
  "new-releases": { light: true, tags: [] },
  "newegg": { light: true, tags: ["Shopping"] },
  "newsblur": { light: true, tags: [] },
  "newshosting": { light: true, tags: ["Usenet"] },
  "newsku": { light: true, tags: [] },
  "nextbeats": { light: true, tags: [] },
  "nextcloud": { light: true, tags: ["Cloud Storage", "Nextcloud"] },
  "nextcloud-calendar": { light: true, tags: ["Nextcloud"] },
  "nextcloud-contacts": { light: true, tags: ["Nextcloud"] },
  "nextcloud-deck": { light: true, tags: ["Nextcloud"] },
  "nextcloud-forms": { light: true, tags: ["Nextcloud"] },
  "nextcloud-mail": { light: true, tags: ["Nextcloud"] },
  "nextcloud-news": { light: true, tags: ["Nextcloud"] },
  "nextcloud-notes": { light: true, tags: ["Nextcloud"] },
  "nextcloud-office": { light: true, tags: ["Nextcloud", "Office"] },
  "nextcloud-office-document": { light: true, tags: ["Nextcloud"] },
  "nextcloud-office-drawing": { light: true, tags: ["Nextcloud"] },
  "nextcloud-office-presentation": { light: true, tags: ["Nextcloud"] },
  "nextcloud-office-spreadsheet": { light: true, tags: ["Nextcloud"] },
  "nextcloud-social": { light: true, tags: ["Nextcloud", "Social"] },
  "nextcloud-tables": { light: true, tags: ["Nextcloud"] },
  "nextcloud-talk": { light: true, tags: ["Nextcloud", "Social"] },
  "nextcloud-tasks": { light: true, tags: ["Nextcloud"] },
  "nextcloudpi": { light: true, tags: ["Nextcloud"] },
  "nextdns": { light: true, tags: [] },
  "nextdoor": { light: true, tags: [] },
  "nexterm": { light: true, tags: [] },
  "nextexplorer": { light: true, tags: [] },
  "nextpvr": { light: true, tags: [] },
  "nezha": { light: true, tags: [] },
  "nforwardauth": { light: true, tags: [] },
  "nginx": { light: true, tags: [] },
  "nginx-proxy-manager": { light: true, tags: [] },
  "nginx-ui": { light: true, tags: [] },
  "nicotine-plus": { light: true, tags: [] },
  "nightlio": { light: true, tags: [] },
  "nightscout": { light: true, tags: [] },
  "nike": { light: true, tags: ["Shopping"] },
  "nimtable": { light: true, tags: [] },
  "nintendo": { light: true, tags: ["Video Games"] },
  "nintendo-switch": { light: true, tags: ["Video Games"] },
  "nirvati": { light: true, tags: [] },
  "nitter": { light: true, tags: [] },
  "nixos": { light: true, tags: [] },
  "njalla": { light: true, tags: [] },
  "nocobase": { light: true, tags: [] },
  "nocodb": { light: true, tags: [] },
  "node-js": { light: false, tags: [] },
  "node-red": { light: true, tags: [] },
  "nodebb": { light: true, tags: [] },
  "nodecast-tv": { light: true, tags: [] },
  "nodecosmos": { light: true, tags: [] },
  "nodemailer": { light: true, tags: [] },
  "nodyx": { light: true, tags: [] },
  "nomad-travel": { light: true, tags: [] },
  "noodle-gallery": { light: true, tags: [] },
  "nordvpn": { light: true, tags: ["VPN"] },
  "norish": { light: true, tags: [] },
  "north-pole-security": { light: true, tags: [] },
  "note-mark": { light: true, tags: [] },
  "notebooklm": { light: true, tags: ["Artificial Intelligence", "Google"] },
  "notediscovery": { light: true, tags: [] },
  "notepad-plus-plus": { light: true, tags: [] },
  "notesnook": { light: true, tags: [] },
  "notifiarr": { light: true, tags: [] },
  "notifuse": { light: true, tags: [] },
  "notion": { light: true, tags: [] },
  "notion-calendar": { light: true, tags: [] },
  "notion-mail": { light: true, tags: [] },
  "noton": { light: true, tags: [] },
  "novu": { light: true, tags: [] },
  "npr": { light: true, tags: ["News"] },
  "npr-one": { light: true, tags: ["News", "Podcasts"] },
  "nps-enhanced": { light: true, tags: [] },
  "nrk-tv": { light: true, tags: ["Streaming"] },
  "ntfy": { light: true, tags: [] },
  "nummo": { light: true, tags: [] },
  "nutalert": { light: true, tags: [] },
  "nuxt": { light: true, tags: [] },
  "nvidia": { light: true, tags: [] },
  "nx-witness": { light: true, tags: [] },
  "nyt-connections": { light: true, tags: ["New York Times"] },
  "nyt-crossword": { light: true, tags: ["New York Times"] },
  "nyt-letter-boxed": { light: true, tags: ["New York Times"] },
  "nyt-mini-crossword": { light: true, tags: ["New York Times"] },
  "nyt-spelling-bee": { light: true, tags: ["New York Times"] },
  "nyt-strands": { light: true, tags: ["New York Times"] },
  "nyt-sudoku": { light: true, tags: ["New York Times"] },
  "nyt-tiles": { light: true, tags: ["New York Times"] },
  "nyt-wordle": { light: true, tags: ["New York Times"] },
  "nzb-dav": { light: true, tags: ["Usenet"] },
  "nzbget": { light: true, tags: ["Usenet"] },
  "oak-homepage": { light: true, tags: [] },
  "oak-identity": { light: true, tags: [] },
  "oauth2-proxy": { light: true, tags: [] },
  "obico": { light: true, tags: [] },
  "obs-bygg": { light: true, tags: ["Shopping"] },
  "observer-ai": { light: true, tags: ["Artificial Intelligence"] },
  "obsidian": { light: true, tags: [] },
  "obtainium": { light: true, tags: [] },
  "octelium": { light: true, tags: [] },
  "octobot": { light: true, tags: [] },
  "octoprint": { light: true, tags: [] },
  "octopus-deploy": { light: true, tags: [] },
  "ocular": { light: true, tags: [] },
  "odoo": { light: true, tags: [] },
  "odysee": { light: true, tags: [] },
  "oikos": { light: true, tags: [] },
  "okd": { light: true, tags: [] },
  "old-navy": { light: true, tags: ["Shopping"] },
  "olivetin": { light: true, tags: [] },
  "ollama": { light: true, tags: ["Artificial Intelligence"] },
  "omada": { light: true, tags: [] },
  "ombi": { light: true, tags: [] },
  "omnipoly": { light: true, tags: [] },
  "omniroute": { light: true, tags: ["Artificial Intelligence"] },
  "omnivore": { light: true, tags: [] },
  "omnom": { light: true, tags: [] },
  "one-hub": { light: true, tags: ["Artificial Intelligence"] },
  "onedev": { light: true, tags: [] },
  "onetime-secret": { light: true, tags: [] },
  "oneuptime": { light: true, tags: [] },
  "onlyoffice": { light: true, tags: [] },
  "onskeskyen": { light: true, tags: [] },
  "ontime": { light: true, tags: [] },
  "onwatch": { light: true, tags: ["Artificial Intelligence"] },
  "onyka": { light: true, tags: [] },
  "onyx": { light: true, tags: ["Artificial Intelligence"] },
  "open-dronelog": { light: true, tags: [] },
  "open-source-initiative": { light: true, tags: [] },
  "open-webui": { light: true, tags: ["Artificial Intelligence"] },
  "openadserver": { light: true, tags: [] },
  "openai": { light: true, tags: ["Artificial Intelligence"] },
  "openaudible": { light: true, tags: [] },
  "openbao": { light: true, tags: [] },
  "openbooks": { light: true, tags: [] },
  "openccu": { light: true, tags: [] },
  "openchangelog": { light: true, tags: [] },
  "openclaw": { light: true, tags: ["Artificial Intelligence"] },
  "opencloud": { light: true, tags: [] },
  "opencut": { light: true, tags: [] },
  "opendns": { light: true, tags: [] },
  "openemr": { light: true, tags: [] },
  "openeuler": { light: true, tags: ["Operating System"] },
  "openfga": { light: true, tags: [] },
  "opengist": { light: true, tags: [] },
  "opengrammar": { light: true, tags: [] },
  "openhab": { light: true, tags: [] },
  "openhands": { light: true, tags: [] },
  "openldap": { light: true, tags: [] },
  "openleaf": { light: true, tags: [] },
  "openlist": { light: true, tags: [] },
  "openmediavault": { light: true, tags: ["Operating System"] },
  "openobserve": { light: true, tags: [] },
  "openpanel": { light: true, tags: [] },
  "openprinting-cups": { light: true, tags: [] },
  "openproject": { light: true, tags: [] },
  "openreads": { light: true, tags: [] },
  "openrouter": { light: true, tags: ["Artificial Intelligence"] },
  "opensearch": { light: true, tags: ["Search"] },
  "openshift": { light: true, tags: [] },
  "openspeedtest": { light: true, tags: [] },
  "opensuse": { light: true, tags: [] },
  "opensuse-alp": { light: true, tags: [] },
  "opensuse-evergreen": { light: true, tags: [] },
  "opensuse-leap": { light: true, tags: [] },
  "opensuse-step": { light: true, tags: [] },
  "opensuse-tumbleweed": { light: true, tags: [] },
  "opentalk": { light: true, tags: [] },
  "opentelemetry": { light: true, tags: [] },
  "opentofu": { light: true, tags: [] },
  "opentogethertube": { light: true, tags: [] },
  "openttd": { light: true, tags: [] },
  "openuem": { light: true, tags: [] },
  "openvas": { light: true, tags: [] },
  "openvpn": { light: true, tags: ["VPN"] },
  "openwa": { light: true, tags: [] },
  "openwrt": { light: true, tags: ["Firewall"] },
  "openzfs": { light: true, tags: [] },
  "openziti": { light: true, tags: [] },
  "opera": { light: false, tags: ["Browsers"] },
  "operately": { light: true, tags: [] },
  "operational": { light: true, tags: [] },
  "opnform": { light: true, tags: [] },
  "opnsense": { light: true, tags: ["Firewall"] },
  "opnsense-v1": { light: true, tags: ["Firewall"] },
  "optistack": { light: true, tags: [] },
  "oracle": { light: true, tags: [] },
  "oracle-apex": { light: true, tags: [] },
  "orange-isp": { light: true, tags: [] },
  "orb": { light: true, tags: [] },
  "orca-slicer": { light: true, tags: [] },
  "origamivault": { light: true, tags: [] },
  "osticket": { light: true, tags: [] },
  "ots": { light: true, tags: [] },
  "our-shopping-list": { light: true, tags: [] },
  "ourschool": { light: true, tags: [] },
  "outline": { light: true, tags: [] },
  "overleaf": { light: true, tags: [] },
  "overseerr": { light: true, tags: [] },
  "ovh": { light: true, tags: [] },
  "ovpn": { light: true, tags: ["VPN"] },
  "ovumcy": { light: true, tags: [] },
  "owlistic": { light: false, tags: [] },
  "owncast": { light: true, tags: [] },
  "owncloud": { light: true, tags: ["Cloud Storage"] },
  "ownfoil": { light: true, tags: ["Video Games"] },
  "owntone": { light: true, tags: [] },
  "owntracks": { light: true, tags: [] },
  "oxicloud": { light: true, tags: ["Cloud Storage"] },
  "oxker": { light: true, tags: [] },
  "pairdrop": { light: true, tags: [] },
  "palmr": { light: true, tags: [] },
  "palo-alto-networks": { light: true, tags: [] },
  "pandora": { light: true, tags: ["Podcasts"] },
  "pango": { light: true, tags: [] },
  "pangolin": { light: true, tags: [] },
  "paperclip-ai": { light: true, tags: ["Artificial Intelligence"] },
  "paperless-home": { light: true, tags: [] },
  "paperless-ngx": { light: true, tags: [] },
  "papermark": { light: true, tags: [] },
  "papermc": { light: true, tags: ["Minecraft"] },
  "papermc-folia": { light: true, tags: ["Minecraft"] },
  "papermc-paper": { light: true, tags: ["Minecraft"] },
  "papermc-velocity": { light: true, tags: ["Minecraft"] },
  "papermerge": { light: true, tags: [] },
  "papra": { light: true, tags: [] },
  "paramount-plus": { light: true, tags: ["Streaming"] },
  "parseable": { light: true, tags: [] },
  "part-db": { light: true, tags: [] },
  "passbolt": { light: true, tags: ["Passwords"] },
  "password-pusher": { light: true, tags: ["Passwords"] },
  "pastefy": { light: true, tags: [] },
  "patchmon": { light: true, tags: [] },
  "patreon": { light: true, tags: ["Donations"] },
  "payload": { light: true, tags: [] },
  "paymenter": { light: true, tags: [] },
  "paypal": { light: true, tags: [] },
  "payram": { light: true, tags: [] },
  "pdfcraft": { light: true, tags: [] },
  "pdfding": { light: true, tags: [] },
  "pdfmathtranslate": { light: true, tags: [] },
  "peacock": { light: true, tags: ["Streaming"] },
  "peanut": { light: true, tags: [] },
  "peer-calls": { light: true, tags: [] },
  "peertube": { light: true, tags: [] },
  "pelican-panel": { light: true, tags: ["Video Games"] },
  "penn-state-nittany-lions": { light: true, tags: ["Sports"] },
  "penpot": { light: true, tags: [] },
  "pent-no": { light: true, tags: [] },
  "peppermint": { light: true, tags: [] },
  "pepperminty-wiki": { light: true, tags: [] },
  "pequeroku": { light: true, tags: [] },
  "perfice": { light: true, tags: [] },
  "perplexity-ai": { light: true, tags: ["Artificial Intelligence"] },
  "perses": { light: true, tags: [] },
  "personal-management-system": { light: true, tags: [] },
  "pf2etools": { light: true, tags: [] },
  "pfsense": { light: true, tags: ["Firewall"] },
  "pg-back-web": { light: true, tags: [] },
  "pgadmin": { light: true, tags: [] },
  "phanpy": { light: true, tags: [] },
  "phice": { light: true, tags: [] },
  "philips-hue": { light: true, tags: [] },
  "phorge": { light: true, tags: [] },
  "phoscon": { light: true, tags: [] },
  "photopea": { light: true, tags: [] },
  "photoprism": { light: true, tags: [] },
  "phpmyadmin": { light: true, tags: [] },
  "phpsysinfo": { light: true, tags: [] },
  "phylum": { light: true, tags: [] },
  "pi-alert": { light: true, tags: [] },
  "pi-hole": { light: true, tags: [] },
  "pi-source": { light: true, tags: [] },
  "pico": { light: true, tags: [] },
  "pico-pixel-player": { light: true, tags: [] },
  "pico-sh": { light: true, tags: [] },
  "picoshare": { light: true, tags: [] },
  "picpeak": { light: true, tags: [] },
  "piefed": { light: true, tags: [] },
  "pigallery2": { light: true, tags: [] },
  "pigeonpod": { light: true, tags: [] },
  "piholevault": { light: true, tags: [] },
  "pikapods": { light: true, tags: [] },
  "pikvm": { light: true, tags: [] },
  "piler": { light: true, tags: [] },
  "pinepods": { light: true, tags: ["Podcasts"] },
  "pingora-proxy-manager": { light: true, tags: [] },
  "pingvin-share": { light: true, tags: [] },
  "pingvin-share-x": { light: true, tags: [] },
  "pinkary": { light: true, tags: [] },
  "pinterest": { light: true, tags: ["Social"] },
  "piped": { light: true, tags: [] },
  "piper-tts": { light: true, tags: [] },
  "piwigo": { light: true, tags: [] },
  "pixelfed": { light: false, tags: ["Social"] },
  "pixelfin": { light: true, tags: [] },
  "pixiv": { light: true, tags: [] },
  "plakar": { light: true, tags: [] },
  "planarally": { light: true, tags: [] },
  "plane": { light: true, tags: [] },
  "planka": { light: true, tags: [] },
  "planning-center": { light: true, tags: [] },
  "planning-center-calendar": { light: true, tags: [] },
  "planning-center-check-ins": { light: true, tags: [] },
  "planning-center-church-center": { light: true, tags: [] },
  "planning-center-giving": { light: true, tags: [] },
  "planning-center-groups": { light: true, tags: [] },
  "planning-center-home": { light: true, tags: [] },
  "planning-center-music-stand": { light: true, tags: [] },
  "planning-center-people": { light: true, tags: [] },
  "planning-center-publishing": { light: true, tags: [] },
  "planning-center-registrations": { light: true, tags: [] },
  "planning-center-services": { light: true, tags: [] },
  "plausible": { light: true, tags: [] },
  "playstation": { light: true, tags: ["Video Games"] },
  "pleroma": { light: true, tags: ["Social"] },
  "plex": { light: true, tags: ["Streaming"] },
  "plex-rewind": { light: true, tags: [] },
  "plexamp": { light: true, tags: [] },
  "plezy": { light: true, tags: [] },
  "plikshare": { light: true, tags: [] },
  "plumio": { light: true, tags: [] },
  "pluton": { light: true, tags: [] },
  "pocket": { light: true, tags: [] },
  "pocket-casts": { light: true, tags: ["Podcasts"] },
  "pocket-id": { light: true, tags: [] },
  "pocketbase": { light: true, tags: [] },
  "podcast-index": { light: true, tags: ["Podcasts"] },
  "podfetch": { light: true, tags: ["Podcasts"] },
  "podman": { light: false, tags: [] },
  "poeticmetric": { light: true, tags: [] },
  "pogocache": { light: true, tags: [] },
  "polaris": { light: true, tags: [] },
  "pomerium": { light: true, tags: [] },
  "porkbun": { light: true, tags: [] },
  "portabase": { light: true, tags: [] },
  "portainer": { light: true, tags: [] },
  "portainer-pink": { light: false, tags: [] },
  "portainer-v1": { light: true, tags: [] },
  "portal-relay": { light: true, tags: [] },
  "portnote": { light: true, tags: [] },
  "portracker": { light: true, tags: [] },
  "positive-intentions": { light: true, tags: [] },
  "post-content": { light: true, tags: [] },
  "postal": { light: true, tags: [] },
  "postcard": { light: true, tags: [] },
  "posteria": { light: true, tags: [] },
  "posterizarr": { light: true, tags: [] },
  "postgresql": { light: true, tags: [] },
  "posthog": { light: true, tags: [] },
  "postiz": { light: true, tags: ["Social"] },
  "power-norway": { light: true, tags: ["Shopping"] },
  "powerdns": { light: true, tags: [] },
  "powerschool": { light: true, tags: [] },
  "powershell-universal": { light: true, tags: [] },
  "poznote": { light: true, tags: [] },
  "prestashop": { light: true, tags: [] },
  "priceghost": { light: true, tags: [] },
  "printables": { light: true, tags: [] },
  "privadovpn": { light: true, tags: ["VPN"] },
  "private-captcha": { light: true, tags: [] },
  "private-internet-access": { light: true, tags: ["VPN"] },
  "privatebin": { light: true, tags: [] },
  "privatefolio": { light: true, tags: [] },
  "profilarr": { light: false, tags: [] },
  "progressive": { light: true, tags: [] },
  "projectsend": { light: true, tags: [] },
  "prometheus": { light: true, tags: [] },
  "proshop": { light: true, tags: ["Shopping"] },
  "prosody": { light: true, tags: [] },
  "proton": { light: true, tags: ["Proton"] },
  "proton-calendar": { light: true, tags: ["Proton"] },
  "proton-drive": { light: true, tags: ["Cloud Storage", "Proton"] },
  "proton-lumo": { light: true, tags: ["Artificial Intelligence", "Proton"] },
  "proton-mail": { light: true, tags: ["Proton"] },
  "proton-mail-bridge": { light: true, tags: ["Proton"] },
  "proton-pass": { light: true, tags: ["Passwords", "Proton"] },
  "proton-vpn": { light: true, tags: ["Proton", "VPN"] },
  "proton-wallet": { light: true, tags: ["Proton"] },
  "protondb": { light: true, tags: ["Video Games"] },
  "prowlarr": { light: true, tags: [] },
  "prowlarr-radarr": { light: true, tags: [] },
  "proxcenter": { light: true, tags: [] },
  "proxmenux": { light: true, tags: [] },
  "proxmox": { light: true, tags: [] },
  "proxmox-helper-scripts": { light: true, tags: [] },
  "prunemate": { light: true, tags: [] },
  "ps5-mqtt": { light: false, tags: ["Video Games"] },
  "psitransfer": { light: true, tags: [] },
  "pswd": { light: true, tags: [] },
  "pterodactyl": { light: false, tags: ["Video Games"] },
  "pufferfish-host": { light: false, tags: [] },
  "pufferpanel": { light: true, tags: [] },
  "pulp-project": { light: true, tags: [] },
  "pulsarr": { light: true, tags: [] },
  "pulse": { light: true, tags: [] },
  "pulseweaver": { light: true, tags: [] },
  "punipuni": { light: true, tags: [] },
  "punyshort": { light: true, tags: [] },
  "purpurmc": { light: true, tags: ["Minecraft"] },
  "push-security": { light: true, tags: [] },
  "pushbase": { light: true, tags: [] },
  "pushover": { light: true, tags: [] },
  "putty": { light: true, tags: [] },
  "pve-notebuddy": { light: true, tags: [] },
  "pve-ups": { light: true, tags: [] },
  "pyload": { light: true, tags: [] },
  "pyshelf": { light: true, tags: [] },
  "python": { light: true, tags: [] },
  "qbittorrent": { light: true, tags: [] },
  "qd": { light: true, tags: [] },
  "qdirstat": { light: true, tags: [] },
  "qdrant": { light: true, tags: [] },
  "qemu": { light: true, tags: [] },
  "qnap": { light: true, tags: [] },
  "quetre": { light: true, tags: [] },
  "qui": { light: true, tags: [] },
  "quick-reference": { light: true, tags: [] },
  "quickbars": { light: true, tags: [] },
  "quickstack": { light: true, tags: [] },
  "quickwit": { light: true, tags: [] },
  "quiet-chat": { light: true, tags: [] },
  "quire-ink": { light: true, tags: [] },
  "qwik": { light: true, tags: [] },
  "rabbitmq": { light: true, tags: [] },
  "rachio": { light: true, tags: [] },
  "rackpad": { light: true, tags: [] },
  "rackpeek": { light: true, tags: [] },
  "rackula": { light: true, tags: [] },
  "radarr": { light: true, tags: [] },
  "radarr-4k": { light: true, tags: [] },
  "radarr-anime": { light: true, tags: [] },
  "radarr-light-hybrid": { light: true, tags: [] },
  "radarr-v1": { light: false, tags: [] },
  "radicale": { light: true, tags: [] },
  "radicle": { light: true, tags: ["Git"] },
  "rahoot": { light: true, tags: [] },
  "raindrop-io": { light: true, tags: [] },
  "rakuten": { light: true, tags: [] },
  "rallly": { light: true, tags: [] },
  "rancher": { light: true, tags: [] },
  "rancher-desktop": { light: true, tags: [] },
  "rancher-epinio": { light: true, tags: [] },
  "rancher-fleet": { light: true, tags: [] },
  "rancher-harvester": { light: true, tags: [] },
  "rancher-hypper": { light: true, tags: [] },
  "rancher-k3os": { light: true, tags: ["Operating System"] },
  "rancher-k3s": { light: true, tags: [] },
  "rancher-kubewarden": { light: true, tags: [] },
  "rancher-longhorn": { light: true, tags: [] },
  "rancher-opni": { light: true, tags: [] },
  "rancher-rio": { light: true, tags: [] },
  "rancher-rke": { light: true, tags: [] },
  "rancher-submariner": { light: true, tags: [] },
  "raneto": { light: true, tags: [] },
  "raspberry-pi": { light: true, tags: [] },
  "rauthy": { light: true, tags: [] },
  "raycast": { light: true, tags: [] },
  "raygun-monitoring": { light: true, tags: [] },
  "razer": { light: true, tags: [] },
  "rclone": { light: true, tags: [] },
  "re-command": { light: true, tags: [] },
  "re-director": { light: true, tags: [] },
  "reactflux": { light: true, tags: [] },
  "reactive-resume": { light: true, tags: [] },
  "readarr": { light: true, tags: [] },
  "readarr-radarr": { light: true, tags: [] },
  "readeck": { light: true, tags: [] },
  "readmeabook": { light: true, tags: [] },
  "real-debrid": { light: true, tags: [] },
  "reality-cruise": { light: true, tags: ["Video Games"] },
  "realtor-com": { light: true, tags: [] },
  "reaparr": { light: true, tags: [] },
  "receipt-wrangler": { light: true, tags: [] },
  "recipesage": { light: true, tags: [] },
  "reclaimerr": { light: true, tags: [] },
  "recyclarr": { light: true, tags: [] },
  "reddit": { light: true, tags: ["Social"] },
  "reddit-downvote": { light: true, tags: ["Social"] },
  "reddit-upvote": { light: true, tags: ["Social"] },
  "redict": { light: false, tags: [] },
  "redis": { light: true, tags: [] },
  "redlib": { light: true, tags: [] },
  "redmine": { light: true, tags: [] },
  "redstone-federal-credit-union": { light: true, tags: ["Banks"] },
  "reel": { light: true, tags: [] },
  "registry-console": { light: true, tags: [] },
  "reitti": { light: true, tags: [] },
  "relaticle": { light: true, tags: [] },
  "relic-storage": { light: true, tags: [] },
  "remmina": { light: true, tags: [] },
  "remoteterm": { light: true, tags: [] },
  "removarr": { light: true, tags: [] },
  "reolink": { light: true, tags: [] },
  "replane": { light: true, tags: [] },
  "repoflow": { light: true, tags: [] },
  "requestly": { light: true, tags: [] },
  "requestrr": { light: true, tags: [] },
  "resilio-sync": { light: true, tags: [] },
  "restreamer": { light: true, tags: [] },
  "retroassembly": { light: true, tags: ["Video Games"] },
  "retype": { light: true, tags: [] },
  "reveal-js": { light: true, tags: [] },
  "revel": { light: true, tags: [] },
  "review-board": { light: true, tags: [] },
  "revolt": { light: true, tags: [] },
  "rgallery": { light: true, tags: [] },
  "rhasspy": { light: true, tags: [] },
  "richy": { light: true, tags: [] },
  "rimgo": { light: true, tags: [] },
  "ring": { light: true, tags: ["Amazon"] },
  "ringlink": { light: true, tags: [] },
  "ripe-atlas": { light: true, tags: [] },
  "riven": { light: true, tags: [] },
  "riverside-fm": { light: true, tags: ["Podcasts"] },
  "robinhood": { light: true, tags: ["Banks"] },
  "robinson": { light: true, tags: [] },
  "roblox": { light: true, tags: ["Video Games"] },
  "rocket-chat": { light: true, tags: [] },
  "rocky-linux": { light: true, tags: ["Operating System"] },
  "romarr": { light: true, tags: ["Video Games"] },
  "romm": { light: true, tags: ["Video Games"] },
  "romm-ps2": { light: true, tags: ["Video Games"] },
  "romm-snes": { light: true, tags: ["Video Games"] },
  "roon": { light: true, tags: [] },
  "rosterhash": { light: true, tags: [] },
  "rotki": { light: false, tags: [] },
  "rotten-tomatoes": { light: true, tags: [] },
  "roundcube": { light: true, tags: [] },
  "rss-bridge": { light: true, tags: [] },
  "rss-com": { light: true, tags: [] },
  "rssbox": { light: true, tags: [] },
  "rsshub": { light: true, tags: [] },
  "rssrise": { light: true, tags: [] },
  "rudder": { light: true, tags: [] },
  "rundeck": { light: true, tags: [] },
  "runson": { light: true, tags: [] },
  "runtipi": { light: true, tags: [] },
  "rurdesk": { light: true, tags: ["Artificial Intelligence"] },
  "rust": { light: true, tags: [] },
  "rusta": { light: true, tags: ["Shopping"] },
  "rustdesk": { light: true, tags: [] },
  "rustfs": { light: true, tags: [] },
  "rustpad": { light: true, tags: [] },
  "rwmarkable": { light: true, tags: [] },
  "rybbit": { light: true, tags: [] },
  "sablier": { light: true, tags: [] },
  "sabnzbd": { light: true, tags: ["Usenet"] },
  "safari": { light: true, tags: ["Apple", "Browsers"] },
  "safebox": { light: true, tags: [] },
  "safeline": { light: true, tags: [] },
  "salesforce": { light: true, tags: [] },
  "salt": { light: true, tags: [] },
  "saltcorn": { light: true, tags: [] },
  "sando": { light: true, tags: [] },
  "sandstorm": { light: true, tags: [] },
  "sandwitches": { light: false, tags: [] },
  "scaleway": { light: true, tags: [] },
  "scanopy": { light: true, tags: [] },
  "scatola-magica": { light: true, tags: [] },
  "schneider-electric": { light: true, tags: [] },
  "scholarsome": { light: true, tags: [] },
  "schoolmessenger": { light: true, tags: [] },
  "scraparr": { light: true, tags: [] },
  "scratch-map": { light: true, tags: [] },
  "screenlite": { light: true, tags: [] },
  "scrob": { light: true, tags: [] },
  "scrobblex": { light: true, tags: [] },
  "scrutiny": { light: true, tags: [] },
  "scrypted": { light: true, tags: [] },
  "scuttle": { light: true, tags: [] },
  "seafile": { light: true, tags: ["Cloud Storage"] },
  "seagate": { light: true, tags: [] },
  "searxng": { light: true, tags: ["Search"] },
  "seaweedfs": { light: false, tags: [] },
  "secluso": { light: true, tags: [] },
  "secrover": { light: true, tags: [] },
  "secureai-tools": { light: true, tags: ["Artificial Intelligence"] },
  "securo": { light: true, tags: [] },
  "seedsync": { light: true, tags: [] },
  "seelf": { light: true, tags: [] },
  "seerr": { light: true, tags: [] },
  "self-hosted-gateway": { light: true, tags: [] },
  "self-hosted-metrics": { light: true, tags: [] },
  "self-hosted-show": { light: true, tags: [] },
  "selfh-st": { light: true, tags: ["News"] },
  "semaphore": { light: true, tags: [] },
  "semaphore-ui": { light: true, tags: [] },
  "sencho": { light: true, tags: [] },
  "send-visee": { light: true, tags: [] },
  "sendgrid": { light: true, tags: [] },
  "senlo": { light: true, tags: [] },
  "sentry": { light: true, tags: [] },
  "seq": { light: true, tags: [] },
  "servarr": { light: true, tags: [] },
  "sftpgo": { light: true, tags: [] },
  "shaarli": { light: true, tags: [] },
  "shako": { light: true, tags: [] },
  "sharkord": { light: true, tags: [] },
  "sharry": { light: true, tags: [] },
  "shelfmark": { light: true, tags: [] },
  "shellhub": { light: true, tags: [] },
  "shelly": { light: true, tags: [] },
  "shields-io": { light: true, tags: [] },
  "shlink": { light: true, tags: [] },
  "shodan": { light: true, tags: [] },
  "shoko-server": { light: true, tags: [] },
  "shopify": { light: true, tags: ["Shopping"] },
  "shopware": { light: true, tags: [] },
  "shuthost": { light: true, tags: [] },
  "sid": { light: true, tags: [] },
  "sidekiq": { light: true, tags: [] },
  "sidero": { light: true, tags: [] },
  "sidero-omni": { light: true, tags: [] },
  "sidero-talos": { light: true, tags: [] },
  "signal": { light: true, tags: ["Social"] },
  "signalcow": { light: false, tags: [] },
  "signature-pdf": { light: true, tags: [] },
  "signoz": { light: true, tags: [] },
  "silex": { light: true, tags: [] },
  "simpledms": { light: true, tags: [] },
  "simplelogin": { light: true, tags: ["Proton"] },
  "simplex-chat": { light: true, tags: ["Social"] },
  "sipeed": { light: true, tags: [] },
  "siyuan": { light: true, tags: [] },
  "skylite-ux": { light: true, tags: [] },
  "skysend": { light: false, tags: [] },
  "skyshowtime": { light: true, tags: ["Streaming"] },
  "slack": { light: true, tags: ["Social"] },
  "slash": { light: true, tags: [] },
  "slashdot": { light: true, tags: ["News"] },
  "slickdeals": { light: true, tags: ["Shopping"] },
  "slidev": { light: false, tags: [] },
  "slotpoll": { light: true, tags: [] },
  "slskd": { light: true, tags: [] },
  "smallstep": { light: true, tags: [] },
  "smart-garage": { light: false, tags: [] },
  "smartfox": { light: true, tags: [] },
  "smlight": { light: true, tags: ["Shopping"] },
  "smore-newsletter": { light: true, tags: [] },
  "snapcast": { light: true, tags: [] },
  "snapchat": { light: true, tags: ["Social"] },
  "snapdrop": { light: true, tags: [] },
  "snapmaker": { light: true, tags: ["Shopping"] },
  "snappymail": { light: true, tags: [] },
  "snikket": { light: true, tags: ["Social"] },
  "snippets-library": { light: true, tags: [] },
  "snowshare": { light: true, tags: [] },
  "social-security-administration": { light: true, tags: [] },
  "socialhome": { light: true, tags: ["Social"] },
  "socket-io": { light: true, tags: [] },
  "sofe": { light: true, tags: [] },
  "sofi": { light: true, tags: ["Banks"] },
  "sogo": { light: true, tags: [] },
  "solarassistant": { light: true, tags: [] },
  "solectrus": { light: true, tags: [] },
  "solidtime": { light: true, tags: [] },
  "sonarqube": { light: true, tags: [] },
  "sonarr": { light: true, tags: [] },
  "sonarr-radarr": { light: true, tags: [] },
  "sonatype-nexus-repository": { light: true, tags: [] },
  "sonobarr": { light: true, tags: [] },
  "sony": { light: true, tags: [] },
  "sortarr": { light: true, tags: [] },
  "sortifyr": { light: true, tags: [] },
  "sosse": { light: true, tags: [] },
  "soulseek": { light: true, tags: [] },
  "soundcloud": { light: true, tags: ["Podcasts"] },
  "sourcehut": { light: true, tags: ["Git"] },
  "southwest-airlines": { light: true, tags: ["Airlines"] },
  "spacebar": { light: true, tags: [] },
  "spacepad": { light: true, tags: [] },
  "speaches": { light: false, tags: ["Artificial Intelligence"] },
  "specifically-clementines": { light: false, tags: [] },
  "specters": { light: true, tags: [] },
  "speedtest": { light: true, tags: [] },
  "speedtest-tracker": { light: true, tags: [] },
  "spendspentspent": { light: true, tags: [] },
  "spinnerr": { light: true, tags: [] },
  "spip": { light: true, tags: [] },
  "spirit-airlines": { light: true, tags: ["Airlines"] },
  "spliit": { light: true, tags: [] },
  "splitpro": { light: true, tags: [] },
  "splunk": { light: true, tags: [] },
  "sponsorblock": { light: true, tags: [] },
  "spoolman": { light: true, tags: [] },
  "spooty": { light: true, tags: [] },
  "sportarr": { light: true, tags: [] },
  "spotify": { light: true, tags: ["Podcasts"] },
  "spotify-for-creators": { light: false, tags: ["Podcasts"] },
  "spotizerr": { light: true, tags: [] },
  "squoosh": { light: false, tags: [] },
  "sshwifty": { light: true, tags: [] },
  "stackspin": { light: true, tags: [] },
  "stalwart": { light: true, tags: [] },
  "standard-notes": { light: true, tags: [] },
  "stash": { light: true, tags: [] },
  "statamic": { light: true, tags: [] },
  "steam": { light: true, tags: ["Shopping", "Video Games"] },
  "steam-deck": { light: true, tags: ["Video Games"] },
  "steamdb": { light: true, tags: ["Video Games"] },
  "steamgriddb": { light: true, tags: ["Video Games"] },
  "stencilbox": { light: true, tags: [] },
  "step-ca": { light: true, tags: [] },
  "stirling-pdf": { light: true, tags: [] },
  "stitchtracker": { light: true, tags: [] },
  "stoat": { light: true, tags: [] },
  "storj": { light: true, tags: [] },
  "stormkit": { light: true, tags: [] },
  "storybook": { light: true, tags: [] },
  "storyden": { light: true, tags: [] },
  "storygraph": { light: true, tags: [] },
  "storyteller": { light: true, tags: [] },
  "strapi": { light: true, tags: [] },
  "strava": { light: true, tags: [] },
  "strava-statistics": { light: true, tags: [] },
  "streamlink": { light: true, tags: [] },
  "streamx": { light: true, tags: [] },
  "streamyfin": { light: true, tags: [] },
  "streamystats": { light: true, tags: [] },
  "string-is": { light: true, tags: [] },
  "stripe": { light: true, tags: ["Banks", "Donations"] },
  "stump": { light: true, tags: [] },
  "stylus": { light: true, tags: [] },
  "subarr": { light: true, tags: [] },
  "subatic": { light: true, tags: [] },
  "subtrackr": { light: true, tags: [] },
  "suggestarr": { light: true, tags: [] },
  "sunshine": { light: true, tags: ["Video Games"] },
  "sunwet": { light: true, tags: [] },
  "supabase": { light: true, tags: [] },
  "super-productivity": { light: true, tags: [] },
  "sure-finance": { light: true, tags: [] },
  "surfshark": { light: true, tags: ["VPN"] },
  "surmai": { light: true, tags: [] },
  "surrealdb": { light: true, tags: [] },
  "surveyjs": { light: true, tags: [] },
  "surveymonkey": { light: true, tags: [] },
  "suwayomi": { light: true, tags: [] },
  "sveltia-cms": { light: true, tags: [] },
  "swagger": { light: true, tags: [] },
  "swarmpit": { light: true, tags: [] },
  "swetrix": { light: true, tags: [] },
  "swiish": { light: true, tags: [] },
  "swing-music": { light: true, tags: [] },
  "swiparr": { light: true, tags: [] },
  "swizzin": { light: true, tags: [] },
  "synapse": { light: true, tags: ["Social"] },
  "sync-in": { light: true, tags: [] },
  "syncloud": { light: true, tags: [] },
  "synclyrics": { light: true, tags: [] },
  "syncthing": { light: true, tags: [] },
  "syncwave": { light: true, tags: [] },
  "synology": { light: true, tags: ["Operating System", "Synology"] },
  "system76": { light: true, tags: [] },
  "t-mobile": { light: true, tags: ["Cellular Carriers"] },
  "tableau": { light: true, tags: [] },
  "taiga": { light: true, tags: [] },
  "tailscale": { light: true, tags: ["VPN"] },
  "tandoor-recipes": { light: true, tags: [] },
  "tangerine-ui": { light: true, tags: [] },
  "target": { light: true, tags: ["Shopping"] },
  "tasktrove": { light: true, tags: [] },
  "tasmoadmin": { light: true, tags: [] },
  "tasmocompiler": { light: true, tags: [] },
  "tautulli": { light: true, tags: [] },
  "teamspeak": { light: true, tags: [] },
  "teamviewer": { light: true, tags: [] },
  "techcrunch": { light: true, tags: ["News"] },
  "technitium": { light: true, tags: [] },
  "teddycloud": { light: true, tags: [] },
  "teknikkdeler": { light: true, tags: ["Shopping"] },
  "telebugs": { light: true, tags: [] },
  "telegram": { light: true, tags: ["Social"] },
  "teleport": { light: true, tags: [] },
  "temps": { light: true, tags: [] },
  "temu": { light: true, tags: ["Shopping"] },
  "tenzu": { light: false, tags: [] },
  "termix": { light: true, tags: [] },
  "teslamate": { light: true, tags: [] },
  "thanos": { light: true, tags: [] },
  "the-lounge": { light: true, tags: [] },
  "the-new-york-times": { light: true, tags: ["News", "New York Times"] },
  "the-verge": { light: true, tags: ["News"] },
  "the-weather-channel": { light: true, tags: ["News"] },
  "thingiverse": { light: true, tags: [] },
  "thingsboard": { light: true, tags: [] },
  "thread": { light: true, tags: [] },
  "threadfin": { light: true, tags: [] },
  "threads": { light: true, tags: ["Social"] },
  "thrifty": { light: true, tags: [] },
  "thunderbird": { light: true, tags: [] },
  "tianji": { light: true, tags: [] },
  "ticc-dash": { light: true, tags: [] },
  "ticktick": { light: true, tags: [] },
  "ticky": { light: true, tags: [] },
  "tidal": { light: true, tags: [] },
  "tiddlywiki": { light: true, tags: [] },
  "tidyquest": { light: true, tags: [] },
  "ties-link-sharing": { light: true, tags: [] },
  "tigera": { light: true, tags: [] },
  "tiktok": { light: true, tags: ["Social"] },
  "tillywork": { light: true, tags: [] },
  "timeful": { light: true, tags: [] },
  "timesy": { light: true, tags: [] },
  "timetagger": { light: true, tags: [] },
  "timetracker": { light: true, tags: [] },
  "tinfoil": { light: true, tags: ["Video Games"] },
  "tiny-tiny-rss": { light: true, tags: [] },
  "tinyfeed": { light: false, tags: [] },
  "tirreno": { light: true, tags: [] },
  "tldraw": { light: true, tags: [] },
  "tmdb": { light: true, tags: [] },
  "todoist": { light: true, tags: [] },
  "tolgee": { light: true, tags: [] },
  "toodoom": { light: true, tags: [] },
  "tooljet": { light: true, tags: [] },
  "tor": { light: true, tags: [] },
  "tor-browser": { light: true, tags: ["Browsers"] },
  "touitomamout": { light: false, tags: [] },
  "toyota": { light: true, tags: ["Automobiles"] },
  "tp-link": { light: true, tags: [] },
  "tpdb": { light: true, tags: [] },
  "trac": { light: true, tags: [] },
  "traccar": { light: true, tags: [] },
  "tracearr": { light: true, tags: [] },
  "trackly": { light: true, tags: [] },
  "tracktor": { light: true, tags: [] },
  "trade-republic": { light: true, tags: [] },
  "tradetally": { light: true, tags: [] },
  "tradingview": { light: true, tags: [] },
  "traefik": { light: true, tags: [] },
  "traefik-manager": { light: true, tags: [] },
  "trailarr": { light: true, tags: [] },
  "trakt": { light: true, tags: [] },
  "transfer-zip": { light: true, tags: [] },
  "transmission": { light: true, tags: [] },
  "transmute": { light: true, tags: [] },
  "travstats": { light: true, tags: [] },
  "trek": { light: true, tags: [] },
  "trello": { light: true, tags: [] },
  "trilium-deprecated": { light: true, tags: [] },
  "trilium-notes": { light: true, tags: [] },
  "trmnl": { light: true, tags: [] },
  "troddit": { light: true, tags: [] },
  "truecommand": { light: true, tags: [] },
  "trueconf": { light: true, tags: [] },
  "truenas-core": { light: true, tags: ["Operating System"] },
  "truenas-scale": { light: true, tags: [] },
  "trusted-cgi": { light: true, tags: [] },
  "tsdproxy": { light: true, tags: [] },
  "tubesync": { light: true, tags: [] },
  "tubetimeout": { light: true, tags: [] },
  "tududi": { light: true, tags: [] },
  "tugtainer": { light: true, tags: [] },
  "tumblr": { light: true, tags: ["Social"] },
  "turnkey-linux": { light: true, tags: ["Operating System"] },
  "tv2-play": { light: true, tags: ["Streaming"] },
  "tvdb": { light: true, tags: [] },
  "tvheadend": { light: true, tags: [] },
  "twake-drive": { light: true, tags: [] },
  "twenty-crm": { light: true, tags: [] },
  "twingate": { light: true, tags: ["VPN"] },
  "twitch": { light: true, tags: ["Social", "Video Games"] },
  "twitchrise": { light: true, tags: [] },
  "twitter": { light: true, tags: ["Social"] },
  "tymeslot": { light: false, tags: [] },
  "typebot": { light: true, tags: [] },
  "typemill": { light: true, tags: [] },
  "typescript": { light: true, tags: [] },
  "typesense": { light: true, tags: [] },
  "typetype": { light: true, tags: [] },
  "typo3": { light: true, tags: [] },
  "u-s-bank": { light: true, tags: ["Banks"] },
  "uber": { light: true, tags: [] },
  "ubiquiti-unifi": { light: true, tags: [] },
  "ublock-origin": { light: true, tags: [] },
  "ubuntu": { light: true, tags: ["Operating System"] },
  "ugreen-nas": { light: true, tags: [] },
  "ui-bakery": { light: true, tags: [] },
  "ultimate-certificate-manager": { light: true, tags: [] },
  "umami": { light: true, tags: [] },
  "umbrelos": { light: true, tags: [] },
  "unblink": { light: true, tags: [] },
  "unbound": { light: true, tags: [] },
  "uncloud": { light: true, tags: [] },
  "undb": { light: true, tags: [] },
  "unifi-voucher-site": { light: true, tags: [] },
  "unimus": { light: true, tags: [] },
  "united-airlines": { light: true, tags: ["Airlines"] },
  "univention-corporate-server": { light: true, tags: [] },
  "unraid": { light: true, tags: ["Operating System"] },
  "unregistry": { light: true, tags: [] },
  "ups": { light: true, tags: ["Shipping"] },
  "upsnap": { light: false, tags: [] },
  "uptime-kuma": { light: true, tags: [] },
  "uptime-monitor": { light: true, tags: [] },
  "uptimekit": { light: true, tags: [] },
  "uptimerobot": { light: true, tags: [] },
  "upvote-rss": { light: true, tags: [] },
  "us-mobile": { light: false, tags: ["Cellular Carriers"] },
  "usaa": { light: true, tags: [] },
  "usertour": { light: true, tags: [] },
  "usps": { light: true, tags: ["Shipping"] },
  "usulnet": { light: true, tags: [] },
  "utorrent": { light: true, tags: [] },
  "v2raya": { light: true, tags: [] },
  "valetudo": { light: true, tags: [] },
  "valkey": { light: true, tags: [] },
  "vanguard": { light: true, tags: ["Banks"] },
  "vanilla-cookbook": { light: true, tags: [] },
  "vaultls": { light: true, tags: [] },
  "vaultwarden": { light: true, tags: ["Passwords"] },
  "vector": { light: true, tags: [] },
  "velero": { light: true, tags: [] },
  "velld": { light: true, tags: [] },
  "verdaccio": { light: true, tags: [] },
  "verifywise": { light: true, tags: ["Artificial Intelligence"] },
  "verizon": { light: true, tags: ["Cellular Carriers"] },
  "vernemq": { light: true, tags: [] },
  "versity": { light: true, tags: [] },
  "vert": { light: true, tags: [] },
  "vertigo-comics": { light: true, tags: [] },
  "vertiv": { light: true, tags: ["Shopping"] },
  "viaplay": { light: true, tags: ["Streaming"] },
  "victoriametrics": { light: true, tags: [] },
  "videogametrackarr": { light: true, tags: ["Video Games"] },
  "vidzy": { light: true, tags: [] },
  "vikunja": { light: true, tags: [] },
  "vimeo": { light: true, tags: [] },
  "vince": { light: true, tags: [] },
  "virola": { light: true, tags: [] },
  "virtualbox": { light: true, tags: [] },
  "virtualbox-2010": { light: false, tags: [] },
  "visa": { light: true, tags: ["Banks"] },
  "visernic": { light: true, tags: [] },
  "viseron": { light: false, tags: [] },
  "visible-by-verizon": { light: true, tags: ["Cellular Carriers"] },
  "visio-meet": { light: true, tags: [] },
  "visual-db": { light: true, tags: [] },
  "visual-studio-code": { light: true, tags: [] },
  "vitepress": { light: true, tags: [] },
  "vito": { light: true, tags: [] },
  "vllm": { light: true, tags: ["Artificial Intelligence"] },
  "vmware-esx": { light: true, tags: [] },
  "vmware-workstation-pro": { light: false, tags: [] },
  "vodia": { light: true, tags: [] },
  "voidauth": { light: true, tags: [] },
  "voilib": { light: true, tags: [] },
  "voltaserve": { light: true, tags: [] },
  "volvo": { light: true, tags: ["Automobiles"] },
  "voron": { light: true, tags: [] },
  "vouchervault": { light: true, tags: [] },
  "voux": { light: true, tags: [] },
  "voxmedia-coral": { light: true, tags: [] },
  "vscodium": { light: true, tags: [] },
  "vue-js": { light: true, tags: [] },
  "vuetorrent": { light: true, tags: [] },
  "vykar": { light: true, tags: [] },
  "wakapi": { light: true, tags: [] },
  "wallabag": { light: true, tags: [] },
  "wallos": { light: true, tags: [] },
  "wally": { light: true, tags: [] },
  "walmart": { light: true, tags: ["Shopping"] },
  "wanderer": { light: true, tags: [] },
  "wapy-dev": { light: true, tags: [] },
  "wardrowbe": { light: true, tags: [] },
  "warpgate": { light: true, tags: [] },
  "warracker": { light: true, tags: [] },
  "wastebin": { light: true, tags: [] },
  "watchguard": { light: true, tags: [] },
  "watchtower": { light: true, tags: [] },
  "watchyourports": { light: true, tags: [] },
  "wattbox": { light: true, tags: [] },
  "wavelog": { light: true, tags: [] },
  "waze": { light: true, tags: ["Google"] },
  "wazuh": { light: true, tags: [] },
  "wealthfolio": { light: true, tags: [] },
  "weam": { light: true, tags: ["Artificial Intelligence"] },
  "weaviate": { light: true, tags: [] },
  "web-check": { light: true, tags: [] },
  "webgazer": { light: true, tags: [] },
  "webhook-tester": { light: true, tags: [] },
  "weblate": { light: true, tags: [] },
  "webmin": { light: true, tags: [] },
  "websocket": { light: true, tags: [] },
  "webtrees": { light: true, tags: [] },
  "wechat": { light: true, tags: ["Social"] },
  "wekan": { light: true, tags: [] },
  "wells-fargo": { light: true, tags: ["Banks"] },
  "western-digital": { light: true, tags: [] },
  "wger": { light: true, tags: [] },
  "whatsapp": { light: true, tags: ["Social"] },
  "whisparr": { light: true, tags: [] },
  "whisper-money": { light: true, tags: [] },
  "whodb": { light: true, tags: [] },
  "wigwam": { light: true, tags: ["Cryptocurrency"] },
  "wiki-go": { light: false, tags: [] },
  "wiki-js": { light: true, tags: [] },
  "wikidocs": { light: true, tags: [] },
  "wikipedia": { light: true, tags: [] },
  "will-be-done": { light: true, tags: [] },
  "willow": { light: true, tags: [] },
  "windmill": { light: true, tags: [] },
  "windows-defender-2016": { light: true, tags: ["Microsoft"] },
  "windows-retro": { light: true, tags: ["Microsoft", "Operating System"] },
  "windows-terminal": { light: true, tags: ["Microsoft"] },
  "wiredoor": { light: true, tags: [] },
  "wireguard": { light: true, tags: ["VPN"] },
  "wireguard-transparent": { light: true, tags: ["VPN"] },
  "wish-com": { light: true, tags: [] },
  "withoutbg": { light: true, tags: [] },
  "wizarr": { light: true, tags: [] },
  "woocommerce": { light: true, tags: [] },
  "woodpecker-ci": { light: true, tags: [] },
  "wordpress": { light: true, tags: [] },
  "workbrew": { light: true, tags: [] },
  "worklenz": { light: true, tags: [] },
  "world-monitor": { light: true, tags: [] },
  "writefreely": { light: true, tags: [] },
  "wrtag": { light: true, tags: [] },
  "wud": { light: false, tags: [] },
  "wygiwyh": { light: true, tags: [] },
  "x": { light: true, tags: ["Social"] },
  "x-p-ferd": { light: true, tags: [] },
  "xbackbone": { light: true, tags: [] },
  "xbox": { light: true, tags: ["Microsoft", "Video Games"] },
  "xbox-game-pass": { light: true, tags: ["Microsoft", "Video Games"] },
  "xen-orchestra": { light: false, tags: [] },
  "xfinity": { light: true, tags: ["Cellular Carriers", "Streaming"] },
  "xibo": { light: true, tags: [] },
  "xmpp": { light: true, tags: ["Social"] },
  "xpipe": { light: true, tags: [] },
  "xplicittrust": { light: true, tags: ["VPN"] },
  "xrsh": { light: true, tags: [] },
  "xubuntu": { light: true, tags: ["Operating System"] },
  "xwiki": { light: true, tags: [] },
  "xxl-sports": { light: true, tags: ["Shopping"] },
  "yabin": { light: true, tags: [] },
  "yacht": { light: true, tags: [] },
  "yacreader": { light: true, tags: [] },
  "yacreaderlibrary": { light: true, tags: [] },
  "yadnsb": { light: true, tags: [] },
  "yahoo": { light: true, tags: ["News", "Search"] },
  "yamlresume": { light: true, tags: [] },
  "yamtrack": { light: true, tags: [] },
  "yandex": { light: true, tags: [] },
  "yarr": { light: true, tags: [] },
  "yeetfile": { light: true, tags: [] },
  "yelp": { light: true, tags: [] },
  "ynab": { light: true, tags: [] },
  "yoink": { light: true, tags: [] },
  "yopass": { light: true, tags: [] },
  "your-spotify": { light: true, tags: [] },
  "yourls": { light: true, tags: [] },
  "youtrack": { light: true, tags: [] },
  "youtubarr": { light: true, tags: [] },
  "youtube": { light: true, tags: ["Google"] },
  "youtube-dl": { light: true, tags: [] },
  "youtube-shorts": { light: true, tags: ["Google", "Social"] },
  "youtube-watcher": { light: true, tags: [] },
  "yt-dlp-web-player": { light: true, tags: [] },
  "yt-zero": { light: true, tags: [] },
  "yubal": { light: true, tags: [] },
  "yugabytedb": { light: true, tags: [] },
  "yundera": { light: true, tags: [] },
  "yunohost": { light: true, tags: [] },
  "yuvomi": { light: true, tags: [] },
  "z-wave": { light: true, tags: [] },
  "z-wave-js-ui": { light: true, tags: [] },
  "zabbix": { light: true, tags: [] },
  "zammad": { light: true, tags: [] },
  "zaneops": { light: true, tags: [] },
  "zed": { light: true, tags: [] },
  "zen-notes": { light: true, tags: [] },
  "zensical": { light: true, tags: [] },
  "zerobyte": { light: true, tags: [] },
  "zerotier": { light: true, tags: ["VPN"] },
  "zigbee": { light: true, tags: [] },
  "zigbee2mqtt": { light: true, tags: [] },
  "ziit": { light: true, tags: [] },
  "zimaos": { light: true, tags: ["Operating System"] },
  "zipcaptions": { light: true, tags: [] },
  "zitadel": { light: true, tags: [] },
  "zoho-mail": { light: true, tags: [] },
  "zoom": { light: true, tags: [] },
  "zoraxy": { light: true, tags: [] },
  "zorin-os": { light: true, tags: ["Operating System"] },
  "zot-registry": { light: true, tags: [] },
  "zotero": { light: true, tags: [] },
  "zrok": { light: true, tags: [] },
  "zscaler": { light: true, tags: [] },
  "zublo": { light: true, tags: [] },
  "zulip": { light: true, tags: [] }
};

// cdn.ts
var SIMPLE_CDN_SLUGS = [
  "homeassistant",
  "homebridge",
  "pihole",
  "truenas",
  "nextcloud",
  "jellyfin",
  "traefikproxy",
  "esphome",
  "unraid",
  "opnsense"
];
var DEVICON_BRANCH = "master";
var SIMPLE_BRANCH = "develop";
var SELFHOST_BRANCH = "main";
var DEVICON_VARIANTS = ["plain", "original", "line"];
var MAX_ENTRIES = 150;
var MAX_BYTES = 15e5;
var MAX_SINGLE_SVG_BYTES = 262144;
var MISSING_TTL_MS = 5 * 60 * 1e3;
var standDates = {
  devicon: null,
  simple: null,
  selfhosted: null
};
function catalogStand() {
  return { ...standDates };
}
function today() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
async function fetchText(url) {
  try {
    const res = await (0, import_obsidian3.requestUrl)({ url });
    if (res.status !== 200)
      return null;
    if (typeof res.text !== "string" || !res.text.includes("<svg")) {
      return null;
    }
    if (res.text.length > MAX_SINGLE_SVG_BYTES)
      return null;
    return res.text;
  } catch (e) {
    return null;
  }
}
async function fetchJson(url) {
  try {
    const res = await (0, import_obsidian3.requestUrl)({ url });
    if (res.status !== 200)
      return null;
    return JSON.parse(res.text);
  } catch (e) {
    return null;
  }
}
async function fetchDeviconSvg(name) {
  if (!/^[a-z0-9]+$/.test(name))
    return null;
  for (const variant of DEVICON_VARIANTS) {
    const svg = await fetchText(
      `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON_BRANCH}/icons/${name}/${name}-${variant}.svg`
    );
    if (svg)
      return sanitizeSvg(svg);
  }
  return null;
}
async function fetchSimpleSvg(slug) {
  if (!/^[a-z0-9]+$/.test(slug))
    return null;
  const svg = await fetchText(
    `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@${SIMPLE_BRANCH}/icons/${slug}.svg`
  );
  return svg ? sanitizeSvg(svg) : null;
}
async function fetchSelfhostSvg(ref) {
  if (!/^[a-z0-9-]+$/.test(ref))
    return null;
  const svg = await fetchText(
    `https://cdn.jsdelivr.net/gh/selfhst/icons@${SELFHOST_BRANCH}/svg/${ref}.svg`
  );
  return svg ? sanitizeSvg(svg) : null;
}
var catalogPromise = null;
function loadCatalogs() {
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const [devicon, simple, selfhost] = await Promise.all([
        loadDeviconCatalog(),
        loadSimpleCatalog(),
        loadSelfhostCatalog()
      ]);
      return {
        deviconNames: devicon.names,
        deviconTags: devicon.tags,
        simpleSlugs: simple.slugs,
        selfhost: selfhost.entries,
        live: {
          devicon: devicon.live,
          simple: simple.live,
          selfhosted: selfhost.live
        }
      };
    })();
    catalogPromise.catch(() => {
      catalogPromise = null;
    });
  }
  return catalogPromise;
}
function clearCatalogCaches() {
  catalogPromise = null;
}
async function loadDeviconCatalog() {
  const raw = await fetchJson(
    `https://cdn.jsdelivr.net/gh/devicons/devicon@${DEVICON_BRANCH}/devicon.json`
  );
  if (Array.isArray(raw) && raw.length > 100) {
    const names = [];
    const tags = {};
    for (const item of raw) {
      const entry = item;
      if (typeof entry.name !== "string" || !/^[a-z0-9]+$/.test(entry.name)) {
        continue;
      }
      names.push(entry.name);
      if (Array.isArray(entry.tags)) {
        const clean = entry.tags.filter(
          (t2) => typeof t2 === "string"
        ).slice(0, 6);
        if (clean.length > 0)
          tags[entry.name] = clean;
      }
    }
    names.sort();
    if (names.length > 100) {
      standDates.devicon = today();
      return { names, tags, live: true };
    }
  }
  return { names: [...DEVICON_NAMES], tags: { ...DEVICON_TAGS }, live: false };
}
async function loadSimpleCatalog() {
  const slugs = await loadSimpleSlugs();
  if (slugs.length > SIMPLE_CDN_SLUGS.length) {
    return { slugs, live: true };
  }
  return { slugs: [...SIMPLE_CDN_SLUGS], live: false };
}
async function loadSimpleSlugs() {
  try {
    const res = await (0, import_obsidian3.requestUrl)({
      url: `https://cdn.jsdelivr.net/gh/simple-icons/simple-icons@${SIMPLE_BRANCH}/slugs.md`
    });
    if (res.status === 200 && typeof res.text === "string") {
      const slugs = [];
      for (const line of res.text.split("\n")) {
        const m = /^\|\s*`[^`]+`\s*\|\s*`([a-z0-9]+)`\s*\|/.exec(line.trim());
        if (m && m[1])
          slugs.push(m[1]);
      }
      const unique = [...new Set(slugs)].sort();
      if (unique.length > SIMPLE_CDN_SLUGS.length) {
        standDates.simple = today();
        return unique;
      }
    }
  } catch (e) {
  }
  return [];
}
function fetchSimpleSlugs() {
  return loadSimpleSlugs();
}
var liveSelfhost = null;
async function loadSelfhostCatalog() {
  const raw = await fetchJson(
    `https://cdn.jsdelivr.net/gh/selfhst/icons@${SELFHOST_BRANCH}/index.json`
  );
  if (Array.isArray(raw) && raw.length > 100) {
    const entries = /* @__PURE__ */ new Map();
    for (const item of raw) {
      const entry = item;
      if (typeof entry.Reference !== "string")
        continue;
      const ref = entry.Reference.toLowerCase();
      if (!/^[a-z0-9-]+$/.test(ref) || entry.SVG !== "Yes")
        continue;
      const tags = typeof entry.Tags === "string" ? entry.Tags.split(",").map((t2) => t2.trim()).filter(Boolean).slice(0, 6) : [];
      entries.set(ref, { light: entry.Light === "Yes", tags });
    }
    if (entries.size > 100) {
      standDates.selfhosted = today();
      liveSelfhost = entries;
      return { entries, live: true };
    }
  }
  const fallback = /* @__PURE__ */ new Map();
  for (const [ref, entry] of Object.entries(SELFHOST_CATALOG)) {
    fallback.set(ref, entry);
  }
  return { entries: fallback, live: false };
}
var lightCache = null;
function selfhostLightRefs() {
  if (!lightCache || lightCache.src !== liveSelfhost) {
    const out = /* @__PURE__ */ new Set();
    for (const [ref, entry] of Object.entries(SELFHOST_CATALOG)) {
      if (entry.light)
        out.add(ref);
    }
    if (liveSelfhost) {
      for (const [ref, entry] of liveSelfhost) {
        if (entry.light)
          out.add(ref);
      }
    }
    lightCache = { src: liveSelfhost, set: out };
  }
  return lightCache.set;
}
function splitCdnRef(name) {
  if (name.startsWith("devicon/")) {
    const key = name.slice("devicon/".length);
    return key && !key.includes("/") ? { kind: "devicon", key } : null;
  }
  if (name.startsWith("simple/")) {
    const key = name.slice("simple/".length);
    return key && !key.includes("/") ? { kind: "simple", key } : null;
  }
  if (name.startsWith("selfhosted/")) {
    const key = name.slice("selfhosted/".length);
    return key && !key.includes("/") ? { kind: "selfhosted", key } : null;
  }
  return null;
}
var CdnCache = class {
  constructor(persist) {
    this.persist = persist;
    this.cache = /* @__PURE__ */ new Map();
    this.missing = /* @__PURE__ */ new Map();
    this.bytes = 0;
    this.saveTimer = 0;
    this.dirty = false;
    try {
      const data = this.persist.load();
      for (const [key, svg] of Object.entries(data)) {
        if (typeof svg !== "string" || !svg.includes("<svg"))
          continue;
        if (this.cache.size >= MAX_ENTRIES || this.bytes + svg.length > MAX_BYTES) {
          break;
        }
        this.add(key, sanitizeSvg(svg));
      }
    } catch (e) {
    }
  }
  has(name) {
    return this.cache.has(name);
  }
  /** Cache Treffer ohne Nachladen, für Speichern als Datei. */
  peek(name) {
    return this.cache.get(name);
  }
  get size() {
    return this.cache.size;
  }
  clear() {
    this.cache.clear();
    this.missing.clear();
    this.bytes = 0;
    this.dirty = false;
    this.persist.save({});
  }
  async getSvg(name) {
    const hit = this.cache.get(name);
    if (hit !== void 0)
      return hit;
    const missedAt = this.missing.get(name);
    if (missedAt !== void 0) {
      if (Date.now() - missedAt < MISSING_TTL_MS)
        return null;
      this.missing.delete(name);
    }
    const split = splitCdnRef(name);
    if (!split)
      return null;
    const svg = split.kind === "devicon" ? await fetchDeviconSvg(split.key) : split.kind === "simple" ? await fetchSimpleSvg(split.key) : await fetchSelfhostSvg(split.key);
    if (!svg) {
      this.missing.set(name, Date.now());
      return null;
    }
    this.add(name, svg);
    this.scheduleSave();
    return svg;
  }
  add(name, svg) {
    if (svg.length > MAX_BYTES)
      return;
    const old = this.cache.get(name);
    if (old !== void 0) {
      this.bytes -= old.length;
      this.cache.delete(name);
    }
    while ((this.cache.size >= MAX_ENTRIES || this.bytes + svg.length > MAX_BYTES) && this.cache.size > 0) {
      const oldest = this.cache.keys().next();
      if (oldest.done)
        break;
      const removed = this.cache.get(oldest.value);
      this.bytes -= removed ? removed.length : 0;
      this.cache.delete(oldest.value);
    }
    this.cache.set(name, svg);
    this.bytes += svg.length;
  }
  scheduleSave() {
    this.dirty = true;
    window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.dirty = false;
      this.persist.save(Object.fromEntries(this.cache));
    }, 2e3);
  }
  flush() {
    window.clearTimeout(this.saveTimer);
    if (!this.dirty)
      return;
    this.dirty = false;
    this.persist.save(Object.fromEntries(this.cache));
  }
};

// tabs-titles.ts
function pickVariant(entry, isDark, hasLightVariant, autoLight = true) {
  const out = { icon: entry.icon };
  if (entry.color)
    out.color = entry.color;
  if (entry.size)
    out.size = entry.size;
  if (isDark && entry.iconDark && parseIconRef(entry.iconDark)) {
    out.icon = entry.iconDark;
    return out;
  }
  if (autoLight && isDark && hasLightVariant && entry.icon.startsWith("selfhosted/") && hasLightVariant(entry.icon.slice("selfhosted/".length))) {
    out.icon = `${entry.icon}-light`;
  }
  return out;
}
var REFRESH_CONCURRENCY = 6;
function hasSelfhostLight(ref) {
  return selfhostLightRefs().has(ref);
}
var TabsTitles = class {
  constructor(app, store, mapping, getOpts) {
    this.app = app;
    this.store = store;
    this.mapping = mapping;
    this.getOpts = getOpts;
    this.timer = 0;
    this.refreshing = false;
  }
  start() {
    this.refreshSoon();
  }
  stop() {
    var _a;
    window.clearTimeout(this.timer);
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const tabEl = leaf.tabHeaderInnerIconEl;
      if (tabEl)
        this.restoreTab(leaf, tabEl);
      const titleEl = leaf.view.containerEl.querySelector(
        ".inline-title"
      );
      if (titleEl) {
        (_a = titleEl.querySelector(":scope > .obsidian-icon-title")) == null ? void 0 : _a.remove();
        delete titleEl.dataset.obsidianIconTitle;
      }
    }
  }
  refreshSoon() {
    window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.refresh(), 80);
  }
  async refresh() {
    if (this.refreshing) {
      this.refreshSoon();
      return;
    }
    this.refreshing = true;
    try {
      const opts = this.getOpts();
      const dark = isDarkTheme();
      const leaves = this.app.workspace.getLeavesOfType("markdown");
      for (let i = 0; i < leaves.length; i += REFRESH_CONCURRENCY) {
        await Promise.all(
          leaves.slice(i, i + REFRESH_CONCURRENCY).map((leaf) => this.refreshLeaf(leaf, opts, dark))
        );
      }
    } finally {
      this.refreshing = false;
    }
  }
  async refreshLeaf(leaf, opts, dark) {
    var _a, _b;
    const path = this.leafPath(leaf);
    const tabEl = leaf.tabHeaderInnerIconEl;
    if (tabEl) {
      const entry = path && opts.tabs ? this.resolveForPath(path, dark) : null;
      if (!entry)
        this.restoreTab(leaf, tabEl);
      else
        await this.paintTab(leaf, tabEl, entry);
    }
    const titleEl = leaf.view.containerEl.querySelector(
      ".inline-title"
    );
    if (titleEl) {
      const entry = path && opts.title ? this.resolveForPath(path, dark) : null;
      const key = entry ? `${dark ? "dark" : "light"}|${entry.icon}|${(_a = entry.color) != null ? _a : ""}|${(_b = entry.size) != null ? _b : ""}` : "";
      const badge = titleEl.querySelector(":scope > .obsidian-icon-title");
      if (titleEl.dataset.obsidianIconTitle !== key || entry && !badge) {
        titleEl.dataset.obsidianIconTitle = key;
        badge == null ? void 0 : badge.remove();
        if (entry)
          await this.paintTitle(titleEl, entry);
      }
    }
  }
  leafPath(leaf) {
    var _a, _b;
    const view = leaf.view;
    if ((_a = view.file) == null ? void 0 : _a.path)
      return view.file.path;
    const stateFile = (_b = view.getState) == null ? void 0 : _b.call(view).file;
    return typeof stateFile === "string" ? stateFile : null;
  }
  resolveForPath(path, dark) {
    const auto = this.getOpts().autoLight;
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian4.TFile) {
      const frontmatter = readFrontmatterIcon(
        this.app,
        file
      );
      if (frontmatter)
        return pickVariant(frontmatter, dark, hasSelfhostLight, auto);
    }
    const mapped = this.mapping.resolve(path);
    if (mapped)
      return pickVariant(mapped, dark, hasSelfhostLight, auto);
    return null;
  }
  async paintTab(leaf, el, entry) {
    const ref = parseIconRef(entry.icon);
    if (!ref) {
      this.restoreTab(leaf, el);
      return;
    }
    if (ref.kind === "lucide" && !this.store.knowsLucide(ref.id)) {
      this.restoreTab(leaf, el);
      return;
    }
    el.empty();
    if (ref.kind === "emoji") {
      el.textContent = ref.char;
    } else if (ref.kind === "lucide") {
      (0, import_obsidian4.setIcon)(el, ref.id);
    } else {
      await renderIconInto(el, ref, this.store, { color: entry.color });
    }
    el.dataset.obsidianIcon = "1";
  }
  restoreTab(leaf, el) {
    if (!el.dataset.obsidianIcon)
      return;
    delete el.dataset.obsidianIcon;
    try {
      (0, import_obsidian4.setIcon)(el, leaf.view.getIcon());
    } catch (e) {
      el.empty();
    }
  }
  async paintTitle(titleEl, entry) {
    const ref = parseIconRef(entry.icon);
    if (!ref)
      return;
    const badge = document.createElement("span");
    badge.addClass("obsidian-icon-title");
    await renderIconInto(badge, ref, this.store, { color: entry.color });
    titleEl.insertBefore(badge, titleEl.firstChild);
  }
};

// explorer.ts
function activeDoc() {
  var _a;
  const anyWindow = window;
  return (_a = anyWindow.activeDocument) != null ? _a : document;
}
var REFRESH_CONCURRENCY2 = 6;
function badgeKey(dark, icon, color, size) {
  return `${dark ? "dark" : "light"}|${icon}|${color != null ? color : ""}|${size != null ? size : ""}`;
}
function isBadgeMutation(records) {
  return records.every((record) => {
    const target = record.target;
    return !!target && typeof target.closest === "function" && target.closest(".obsidian-icon-explorer") !== null;
  });
}
var ExplorerIcons = class {
  constructor(app, store, mapping, getAutoLight = () => true) {
    this.app = app;
    this.store = store;
    this.mapping = mapping;
    this.getAutoLight = getAutoLight;
    this.watchers = /* @__PURE__ */ new Map();
    this.timer = 0;
  }
  start() {
    this.stop();
    this.app.workspace.getLeavesOfType("file-explorer").forEach((leaf) => this.watchLeaf(leaf));
    this.refreshSoon();
  }
  stop() {
    for (const observer of this.watchers.values())
      observer.disconnect();
    this.watchers.clear();
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
    for (const [container, observer] of this.watchers) {
      if (!container.isConnected) {
        observer.disconnect();
        this.watchers.delete(container);
      }
    }
    this.app.workspace.getLeavesOfType("file-explorer").forEach((leaf) => this.watchLeaf(leaf));
    const rows = Array.from(
      activeDoc().querySelectorAll(
        ".nav-files-container .tree-item-self[data-path]"
      )
    );
    for (let i = 0; i < rows.length; i += REFRESH_CONCURRENCY2) {
      await Promise.all(
        rows.slice(i, i + REFRESH_CONCURRENCY2).map((row) => {
          const selfEl = row;
          const path = selfEl.dataset.path;
          return path ? this.renderRow(selfEl, path) : Promise.resolve();
        })
      );
    }
  }
  watchLeaf(leaf) {
    const container = leaf.view.containerEl.querySelector(
      ":scope > .nav-files-container > div"
    );
    if (!container || this.watchers.has(container))
      return;
    const observer = new MutationObserver((muts) => {
      if (!isBadgeMutation(muts))
        this.refreshSoon();
    });
    observer.observe(container, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-path", "class"]
    });
    this.watchers.set(container, observer);
  }
  /** Rangfolge wie in Tabs: Frontmatter, dann Mapping Pfad und Dateityp. */
  resolveForPath(path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof import_obsidian5.TFile) {
      const frontmatter = readFrontmatterIcon(this.app, file);
      if (frontmatter)
        return frontmatter;
    }
    return this.mapping.resolve(path, file);
  }
  async renderRow(selfEl, path) {
    var _a;
    const raw = this.resolveForPath(path);
    if (!raw) {
      (_a = selfEl.querySelector(":scope > .obsidian-icon-explorer")) == null ? void 0 : _a.remove();
      return;
    }
    const dark = isDarkTheme();
    const entry = pickVariant(
      raw,
      dark,
      (ref2) => selfhostLightRefs().has(ref2),
      this.getAutoLight()
    );
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
    const key = badgeKey(dark, entry.icon, entry.color, entry.size);
    if (badge.dataset.ref === key)
      return;
    badge.dataset.ref = key;
    badge.innerHTML = "";
    badge.removeAttribute("style");
    await renderIconInto(badge, ref, this.store, { color: entry.color, size: entry.size });
    if (badge.hasClass("obsidian-icon-missing")) {
      delete badge.dataset.ref;
    }
    badge.addClass("obsidian-icon-explorer");
  }
};

// picker.ts
var import_obsidian7 = require("obsidian");

// i18n.ts
var import_obsidian6 = require("obsidian");
var SLOGANS = {
  en: "Local, lightweight, yours.",
  de: "Lokal, leicht, deins.",
  fr: "Local, l\xE9ger, \xE0 vous.",
  es: "Local, ligero, tuyo."
};
var STRINGS = {
  de: {
    "cmd.reload": "Icons neu laden",
    "cmd.gallery": "Icon Galerie \xF6ffnen",
    "cmd.check": "Icons pr\xFCfen",
    "cmd.export": "Icons exportieren",
    "cmd.import": "Icons importieren",
    "cmd.pickActive": "Icon f\xFCr aktive Datei w\xE4hlen",
    "cmd.insert": "Icon in Notiz einf\xFCgen",
    "menu.change": "Icon \xE4ndern",
    "menu.remove": "Icon entfernen",
    "menu.changeMany": "Icons \xE4ndern ({count})",
    "menu.removeMany": "Icons entfernen ({count})",
    "menu.insert": "Icon einf\xFCgen",
    "notice.iconSaveFailed": "Icon konnte nicht gespeichert werden",
    "notice.iconsSaveFailed": "Icons konnten nicht gespeichert werden",
    "notice.iconsRemoveFailed": "Icons konnten nicht entfernt werden",
    "notice.onlySvg": "Nur SVG Referenzen lassen sich speichern",
    "notice.notInCache": "Icon nicht im Cache, bitte erneut w\xE4hlen",
    "notice.fileExists": "Datei existiert bereits",
    "notice.fileSaveFailed": "Datei konnte nicht gespeichert werden",
    "notice.saved": "Gespeichert: {path}",
    "notice.invalidExt": "Ung\xFCltige Endung",
    "notice.conflict": "{names} ist auch aktiv und ver\xE4ndert Explorer Icons, es kann zu \xDCberschneidungen kommen.",
    "notice.checkOk": "Icons ok: {used} vergeben, {unused} ungenutzt",
    "cat.devicon": "Devicon: {value}",
    "cat.simple": "Simple: {value}",
    "cat.selfhost": "Self-Hosted: {value}",
    "cat.builtinVersion": "eingebaut (v2.17.0)",
    "cat.builtinCurated": "eingebaut (kuratiert)",
    "cat.builtinDate": "eingebaut ({date})",
    "cat.off": "CDN aus, nur Dateien und Lucide.",
    "set.iconFolder.name": "Icon Ordner",
    "set.iconFolder.desc": "Pfad im Vault, ohne f\xFChrenden Schr\xE4gstrich.",
    "set.mappingFile.name": "Mapping Datei",
    "set.mappingFile.desc": "Zuordnung Explorer Pfad auf Icon, als JSON im Vault.",
    "set.ext.name": "Dateityp Icons",
    "set.ext.desc": "R\xFCckfall pro Endung nach Pfad und Frontmatter. Start leer.",
    "set.ext.change": "\xC4ndern",
    "set.ext.add.name": "Endung hinzuf\xFCgen",
    "set.ext.add.desc": "Ohne Punkt, z.B. md.",
    "set.ext.pick": "W\xE4hlen",
    "set.cdn.name": "CDN Nachladen",
    "set.cdn.desc": "Fehlende Devicon und Simple Icons von jsdelivr laden und auf diesem Ger\xE4t cachen. Teilt sich den Cache mit Self-Hosted.",
    "set.selfhost.name": "Self-Hosted Icons",
    "set.selfhost.desc": "Homelab Marken von selfh.st per CDN, CC-BY-4.0 mit Namensnennung in der README.",
    "set.stand.name": "Katalog Stand",
    "set.stand.reload": "Neu laden",
    "set.cache.name": "Icon Cache",
    "set.cache.count": "{count} Icons auf diesem Ger\xE4t.",
    "set.cache.clear": "Leeren",
    "set.autoLight.name": "Helle Variante automatisch",
    "set.autoLight.desc": "Im dunklen Theme die helle Self-Hosted Variante nehmen wenn vorhanden. Hand Wahl gewinnt.",
    "set.tabs.name": "Tab Icons",
    "set.tabs.desc": "Mapping und Frontmatter Icons in der Tableiste zeigen.",
    "set.titles.name": "Titel Icons",
    "set.titles.desc": "Mapping und Frontmatter Icons vor dem Notiz Titel zeigen.",
    "set.export.name": "Paket exportieren",
    "set.export.desc": "Mapping plus genutzte Icons als Datei f\xFCr Zweit Vaults.",
    "set.export.btn": "Exportieren",
    "set.import.name": "Paket importieren",
    "set.import.desc": "icons-export.json einlesen und Icons nach _assets/icons schreiben.",
    "set.import.btn": "Importieren",
    "pick.title": "Icon w\xE4hlen",
    "pick.search.name": "Suchen",
    "pick.search.ph": "Name tippen \u2026",
    "pick.size.name": "Gr\xF6\xDFe (optional)",
    "pick.size.desc": "Leer lassen f\xFCr Standard, Zahl gilt als Pixel.",
    "pick.size.ph": "1.4em oder 20",
    "pick.color": "Farbe",
    "pick.colorOff": "Aus",
    "pick.colorDefault": "Standard",
    "pick.colorNoneTip": "Keine Farbe, Standard verwenden",
    "pick.colorFree": "Freie Farbe w\xE4hlen",
    "pick.hex": "Hex Wert",
    "pick.cancel": "Abbrechen",
    "pick.saveFile": "Als Datei speichern",
    "pick.apply": "\xDCbernehmen",
    "pick.dark": "Dark-Icon w\xE4hlen",
    "pick.darkTip": "Icon f\xFCr den Dark Mode festlegen: danach ein Icon aus der Liste anklicken, es wird nur im dunklen Theme gezeigt.",
    "pick.darkCancel": "Auswahl abbrechen",
    "pick.darkHint": "Jetzt ein Icon aus der Liste anklicken \u2192 wird Dark-Mode-Icon",
    "pick.darkValue": "Dark Mode: {value}",
    "pick.darkSame": "Dark Mode: wie helles Icon",
    "pick.none": "Nichts gefunden",
    "pick.more": "\u2026 {count} weitere, Suche einschr\xE4nken",
    "pick.favToggle": "Favorit umschalten",
    "pick.contrast": "Schwacher Kontrast in diesem Theme ({ratio}:1)",
    "group.favorites": "Favoriten",
    "group.recent": "Zuletzt",
    "group.own": "Eigene",
    "group.devicon": "Devicon",
    "group.simple": "Simple",
    "group.selfhosted": "Self-Hosted",
    "group.lucide": "Lucide",
    "color.red": "Rot",
    "color.orange": "Orange",
    "color.yellow": "Gelb",
    "color.green": "Gr\xFCn",
    "color.cyan": "T\xFCrkis",
    "color.blue": "Blau",
    "color.purple": "Lila",
    "color.pink": "Pink",
    "color.gray": "Grau",
    "gal.title": "Icon Galerie",
    "gal.assigned": "Vergeben ({count} Pfade, {rules} Regeln)",
    "gal.empty": "Noch keine Icons vergeben",
    "gal.remove": "Entfernen",
    "gal.ext": "Dateityp ({count})",
    "gal.unused": "Ungenutzt ({count})",
    "gal.allUsed": "Alles in Verwendung",
    "gal.more": "\u2026 {count} weitere",
    "gal.dark": "dunkel: {value}",
    "check.title": "Icons pr\xFCfen",
    "check.summary": "{used} vergeben, {unused} ungenutzt, {broken} defekt",
    "ex.abort": "Export abgebrochen: {path} existiert bereits",
    "ex.done": "Exportiert: {path}",
    "ex.tooBig": "Import fehlgeschlagen: Datei zu gro\xDF",
    "ex.invalid": "Import fehlgeschlagen: keine g\xFCltige Datei",
    "ex.writeErr": "Import abgebrochen: Schreibfehler, Teilstand bleibt",
    "ex.imported": "Importiert: {entries} Eintr\xE4ge, {files} Dateien ({skipped} \xFCbersprungen)"
  },
  en: {
    "cmd.reload": "Reload icons",
    "cmd.gallery": "Open icon gallery",
    "cmd.check": "Check icons",
    "cmd.export": "Export icons",
    "cmd.import": "Import icons",
    "cmd.pickActive": "Choose icon for active file",
    "cmd.insert": "Insert icon into note",
    "menu.change": "Change icon",
    "menu.remove": "Remove icon",
    "menu.changeMany": "Change icons ({count})",
    "menu.removeMany": "Remove icons ({count})",
    "menu.insert": "Insert icon",
    "notice.iconSaveFailed": "Could not save the icon",
    "notice.iconsSaveFailed": "Could not save the icons",
    "notice.iconsRemoveFailed": "Could not remove the icons",
    "notice.onlySvg": "Only SVG references can be saved",
    "notice.notInCache": "Icon is not in the cache, please select it again",
    "notice.fileExists": "File already exists",
    "notice.fileSaveFailed": "Could not save the file",
    "notice.saved": "Saved: {path}",
    "notice.invalidExt": "Invalid extension",
    "notice.conflict": "{names} is active too and modifies explorer icons, overlaps may occur.",
    "notice.checkOk": "Icons ok: {used} assigned, {unused} unused",
    "cat.devicon": "Devicon: {value}",
    "cat.simple": "Simple: {value}",
    "cat.selfhost": "Self-hosted: {value}",
    "cat.builtinVersion": "built-in (v2.17.0)",
    "cat.builtinCurated": "built-in (curated)",
    "cat.builtinDate": "built-in ({date})",
    "cat.off": "CDN off, only files and Lucide.",
    "set.iconFolder.name": "Icon folder",
    "set.iconFolder.desc": "Path in the vault, without leading slash.",
    "set.mappingFile.name": "Mapping file",
    "set.mappingFile.desc": "Maps explorer paths to icons, stored as JSON in the vault.",
    "set.ext.name": "File type icons",
    "set.ext.desc": "Fallback per extension, after path and frontmatter. Starts empty.",
    "set.ext.change": "Change",
    "set.ext.add.name": "Add extension",
    "set.ext.add.desc": "Without dot, e.g. md.",
    "set.ext.pick": "Pick",
    "set.cdn.name": "Load from CDN",
    "set.cdn.desc": "Fetch missing Devicon and Simple icons from jsdelivr and cache them on this device. Shares the cache with self-hosted.",
    "set.selfhost.name": "Self-hosted icons",
    "set.selfhost.desc": "Homelab brands from selfh.st via CDN, CC-BY-4.0, credit in the README.",
    "set.stand.name": "Catalog version",
    "set.stand.reload": "Reload",
    "set.cache.name": "Icon cache",
    "set.cache.count": "{count} icons on this device.",
    "set.cache.clear": "Clear",
    "set.autoLight.name": "Automatic light variant",
    "set.autoLight.desc": "In dark mode use the light self-hosted variant when available. A manual choice always wins.",
    "set.tabs.name": "Tab icons",
    "set.tabs.desc": "Show mapping and frontmatter icons in the tab bar.",
    "set.titles.name": "Title icons",
    "set.titles.desc": "Show mapping and frontmatter icons in front of the note title.",
    "set.export.name": "Export package",
    "set.export.desc": "Mapping plus used icons as a file for second vaults.",
    "set.export.btn": "Export",
    "set.import.name": "Import package",
    "set.import.desc": "Read icons-export.json and write icons to _assets/icons.",
    "set.import.btn": "Import",
    "pick.title": "Choose icon",
    "pick.search.name": "Search",
    "pick.search.ph": "Type a name \u2026",
    "pick.size.name": "Size (optional)",
    "pick.size.desc": "Leave empty for default, a plain number counts as pixels.",
    "pick.size.ph": "1.4em or 20",
    "pick.color": "Color",
    "pick.colorOff": "Off",
    "pick.colorDefault": "Default",
    "pick.colorNoneTip": "No color, use default",
    "pick.colorFree": "Pick a custom color",
    "pick.hex": "Hex value",
    "pick.cancel": "Cancel",
    "pick.saveFile": "Save as file",
    "pick.apply": "Apply",
    "pick.dark": "Choose dark icon",
    "pick.darkTip": "Set an icon for dark mode: then click an icon in the list, it shows only in the dark theme.",
    "pick.darkCancel": "Cancel selection",
    "pick.darkHint": "Now click an icon in the list \u2192 becomes the dark mode icon",
    "pick.darkValue": "Dark mode: {value}",
    "pick.darkSame": "Dark mode: same as light icon",
    "pick.none": "Nothing found",
    "pick.more": "\u2026 {count} more, narrow the search",
    "pick.favToggle": "Toggle favorite",
    "pick.contrast": "Low contrast in this theme ({ratio}:1)",
    "group.favorites": "Favorites",
    "group.recent": "Recent",
    "group.own": "Own",
    "group.devicon": "Devicon",
    "group.simple": "Simple",
    "group.selfhosted": "Self-Hosted",
    "group.lucide": "Lucide",
    "color.red": "Red",
    "color.orange": "Orange",
    "color.yellow": "Yellow",
    "color.green": "Green",
    "color.cyan": "Cyan",
    "color.blue": "Blue",
    "color.purple": "Purple",
    "color.pink": "Pink",
    "color.gray": "Gray",
    "gal.title": "Icon gallery",
    "gal.assigned": "Assigned ({count} paths, {rules} rules)",
    "gal.empty": "No icons assigned yet",
    "gal.remove": "Remove",
    "gal.ext": "File type ({count})",
    "gal.unused": "Unused ({count})",
    "gal.allUsed": "Everything in use",
    "gal.more": "\u2026 {count} more",
    "gal.dark": "dark: {value}",
    "check.title": "Check icons",
    "check.summary": "{used} assigned, {unused} unused, {broken} broken",
    "ex.abort": "Export cancelled: {path} already exists",
    "ex.done": "Exported: {path}",
    "ex.tooBig": "Import failed: file too large",
    "ex.invalid": "Import failed: not a valid file",
    "ex.writeErr": "Import aborted: write error, partial state remains",
    "ex.imported": "Imported: {entries} entries, {files} files ({skipped} skipped)"
  },
  fr: {
    "cmd.reload": "Recharger les ic\xF4nes",
    "cmd.gallery": "Ouvrir la galerie d'ic\xF4nes",
    "cmd.check": "V\xE9rifier les ic\xF4nes",
    "cmd.export": "Exporter les ic\xF4nes",
    "cmd.import": "Importer les ic\xF4nes",
    "cmd.pickActive": "Choisir une ic\xF4ne pour le fichier actif",
    "cmd.insert": "Ins\xE9rer une ic\xF4ne dans la note",
    "menu.change": "Changer l'ic\xF4ne",
    "menu.remove": "Supprimer l'ic\xF4ne",
    "menu.changeMany": "Changer les ic\xF4nes ({count})",
    "menu.removeMany": "Supprimer les ic\xF4nes ({count})",
    "menu.insert": "Ins\xE9rer une ic\xF4ne",
    "notice.iconSaveFailed": "Impossible d'enregistrer l'ic\xF4ne",
    "notice.iconsSaveFailed": "Impossible d'enregistrer les ic\xF4nes",
    "notice.iconsRemoveFailed": "Impossible de supprimer les ic\xF4nes",
    "notice.onlySvg": "Seules les r\xE9f\xE9rences SVG peuvent \xEAtre enregistr\xE9es",
    "notice.notInCache": "Ic\xF4ne absente du cache, veuillez la res\xE9lectionner",
    "notice.fileExists": "Le fichier existe d\xE9j\xE0",
    "notice.fileSaveFailed": "Impossible d'enregistrer le fichier",
    "notice.saved": "Enregistr\xE9 : {path}",
    "notice.invalidExt": "Extension invalide",
    "notice.conflict": "{names} est aussi actif et modifie les ic\xF4nes de l'explorateur, des chevauchements sont possibles.",
    "notice.checkOk": "Ic\xF4nes ok : {used} attribu\xE9es, {unused} non utilis\xE9es",
    "cat.devicon": "Devicon : {value}",
    "cat.simple": "Simple : {value}",
    "cat.selfhost": "Auto-h\xE9berg\xE9 : {value}",
    "cat.builtinVersion": "int\xE9gr\xE9 (v2.17.0)",
    "cat.builtinCurated": "int\xE9gr\xE9 (s\xE9lection)",
    "cat.builtinDate": "int\xE9gr\xE9 ({date})",
    "cat.off": "CDN d\xE9sactiv\xE9, fichiers et Lucide uniquement.",
    "set.iconFolder.name": "Dossier d'ic\xF4nes",
    "set.iconFolder.desc": "Chemin dans le coffre, sans barre oblique initiale.",
    "set.mappingFile.name": "Fichier de mappage",
    "set.mappingFile.desc": "Associe les chemins de l'explorateur aux ic\xF4nes, en JSON dans le coffre.",
    "set.ext.name": "Ic\xF4nes par type de fichier",
    "set.ext.desc": "Repli par extension, apr\xE8s chemin et frontmatter. Vide au d\xE9part.",
    "set.ext.change": "Modifier",
    "set.ext.add.name": "Ajouter une extension",
    "set.ext.add.desc": "Sans point, par ex. md.",
    "set.ext.pick": "Choisir",
    "set.cdn.name": "Chargement depuis le CDN",
    "set.cdn.desc": "R\xE9cup\xE8re les ic\xF4nes Devicon et Simple manquantes depuis jsdelivr et les met en cache sur cet appareil. Partage le cache avec l'auto-h\xE9bergement.",
    "set.selfhost.name": "Ic\xF4nes auto-h\xE9berg\xE9es",
    "set.selfhost.desc": "Marques homelab de selfh.st via CDN, CC-BY-4.0, mention dans le README.",
    "set.stand.name": "Version du catalogue",
    "set.stand.reload": "Recharger",
    "set.cache.name": "Cache d'ic\xF4nes",
    "set.cache.count": "{count} ic\xF4nes sur cet appareil.",
    "set.cache.clear": "Vider",
    "set.autoLight.name": "Variante claire automatique",
    "set.autoLight.desc": "En mode sombre, utiliser la variante claire auto-h\xE9berg\xE9e si disponible. Un choix manuel prime toujours.",
    "set.tabs.name": "Ic\xF4nes des onglets",
    "set.tabs.desc": "Afficher les ic\xF4nes du mappage et du frontmatter dans la barre d'onglets.",
    "set.titles.name": "Ic\xF4nes des titres",
    "set.titles.desc": "Afficher les ic\xF4nes du mappage et du frontmatter devant le titre de la note.",
    "set.export.name": "Exporter le paquet",
    "set.export.desc": "Mappage et ic\xF4nes utilis\xE9es dans un fichier pour d'autres coffres.",
    "set.export.btn": "Exporter",
    "set.import.name": "Importer le paquet",
    "set.import.desc": "Lire icons-export.json et \xE9crire les ic\xF4nes dans _assets/icons.",
    "set.import.btn": "Importer",
    "pick.title": "Choisir une ic\xF4ne",
    "pick.search.name": "Rechercher",
    "pick.search.ph": "Tapez un nom \u2026",
    "pick.size.name": "Taille (optionnel)",
    "pick.size.desc": "Laissez vide pour la valeur par d\xE9faut, un nombre simple compte en pixels.",
    "pick.size.ph": "1.4em ou 20",
    "pick.color": "Couleur",
    "pick.colorOff": "Off",
    "pick.colorDefault": "Par d\xE9faut",
    "pick.colorNoneTip": "Aucune couleur, utiliser la valeur par d\xE9faut",
    "pick.colorFree": "Choisir une couleur libre",
    "pick.hex": "Valeur hex",
    "pick.cancel": "Annuler",
    "pick.saveFile": "Enregistrer comme fichier",
    "pick.apply": "Appliquer",
    "pick.dark": "Choisir l'ic\xF4ne sombre",
    "pick.darkTip": "D\xE9finir une ic\xF4ne pour le mode sombre : cliquez ensuite sur une ic\xF4ne de la liste, elle ne s'affichera qu'en th\xE8me sombre.",
    "pick.darkCancel": "Annuler la s\xE9lection",
    "pick.darkHint": "Cliquez maintenant sur une ic\xF4ne de la liste \u2192 devient l'ic\xF4ne du mode sombre",
    "pick.darkValue": "Mode sombre : {value}",
    "pick.darkSame": "Mode sombre : comme l'ic\xF4ne claire",
    "pick.none": "Aucun r\xE9sultat",
    "pick.more": "\u2026 {count} de plus, affinez la recherche",
    "pick.favToggle": "Basculer le favori",
    "pick.contrast": "Faible contraste dans ce th\xE8me ({ratio}:1)",
    "group.favorites": "Favoris",
    "group.recent": "R\xE9cents",
    "group.own": "Personnelles",
    "group.devicon": "Devicon",
    "group.simple": "Simple",
    "group.selfhosted": "Auto-h\xE9berg\xE9",
    "group.lucide": "Lucide",
    "color.red": "Rouge",
    "color.orange": "Orange",
    "color.yellow": "Jaune",
    "color.green": "Vert",
    "color.cyan": "Cyan",
    "color.blue": "Bleu",
    "color.purple": "Violet",
    "color.pink": "Rose",
    "color.gray": "Gris",
    "gal.title": "Galerie d'ic\xF4nes",
    "gal.assigned": "Attribu\xE9es ({count} chemins, {rules} r\xE8gles)",
    "gal.empty": "Aucune ic\xF4ne attribu\xE9e",
    "gal.remove": "Supprimer",
    "gal.ext": "Type de fichier ({count})",
    "gal.unused": "Non utilis\xE9es ({count})",
    "gal.allUsed": "Tout est utilis\xE9",
    "gal.more": "\u2026 {count} de plus",
    "gal.dark": "sombre : {value}",
    "check.title": "V\xE9rifier les ic\xF4nes",
    "check.summary": "{used} attribu\xE9es, {unused} non utilis\xE9es, {broken} cass\xE9es",
    "ex.abort": "Export annul\xE9 : {path} existe d\xE9j\xE0",
    "ex.done": "Export\xE9 : {path}",
    "ex.tooBig": "\xC9chec de l'import : fichier trop volumineux",
    "ex.invalid": "\xC9chec de l'import : fichier non valide",
    "ex.writeErr": "Import interrompu : erreur d'\xE9criture, \xE9tat partiel conserv\xE9",
    "ex.imported": "Import\xE9 : {entries} entr\xE9es, {files} fichiers ({skipped} ignor\xE9s)"
  },
  es: {
    "cmd.reload": "Recargar iconos",
    "cmd.gallery": "Abrir galer\xEDa de iconos",
    "cmd.check": "Comprobar iconos",
    "cmd.export": "Exportar iconos",
    "cmd.import": "Importar iconos",
    "cmd.pickActive": "Elegir icono para el archivo activo",
    "cmd.insert": "Insertar icono en la nota",
    "menu.change": "Cambiar icono",
    "menu.remove": "Quitar icono",
    "menu.changeMany": "Cambiar iconos ({count})",
    "menu.removeMany": "Quitar iconos ({count})",
    "menu.insert": "Insertar icono",
    "notice.iconSaveFailed": "No se pudo guardar el icono",
    "notice.iconsSaveFailed": "No se pudieron guardar los iconos",
    "notice.iconsRemoveFailed": "No se pudieron quitar los iconos",
    "notice.onlySvg": "Solo se pueden guardar referencias SVG",
    "notice.notInCache": "El icono no est\xE1 en la cach\xE9, selecci\xF3nalo de nuevo",
    "notice.fileExists": "El archivo ya existe",
    "notice.fileSaveFailed": "No se pudo guardar el archivo",
    "notice.saved": "Guardado: {path}",
    "notice.invalidExt": "Extensi\xF3n no v\xE1lida",
    "notice.conflict": "{names} tambi\xE9n est\xE1 activo y modifica los iconos del explorador, pueden surgir conflictos.",
    "notice.checkOk": "Iconos ok: {used} asignados, {unused} sin usar",
    "cat.devicon": "Devicon: {value}",
    "cat.simple": "Simple: {value}",
    "cat.selfhost": "Autoalojado: {value}",
    "cat.builtinVersion": "integrado (v2.17.0)",
    "cat.builtinCurated": "integrado (selecci\xF3n)",
    "cat.builtinDate": "integrado ({date})",
    "cat.off": "CDN desactivado, solo archivos y Lucide.",
    "set.iconFolder.name": "Carpeta de iconos",
    "set.iconFolder.desc": "Ruta en el ba\xFAl, sin barra inicial.",
    "set.mappingFile.name": "Archivo de mapeo",
    "set.mappingFile.desc": "Asigna rutas del explorador a iconos, como JSON en el ba\xFAl.",
    "set.ext.name": "Iconos por tipo de archivo",
    "set.ext.desc": "Respaldo por extensi\xF3n, tras ruta y frontmatter. Empieza vac\xEDo.",
    "set.ext.change": "Cambiar",
    "set.ext.add.name": "A\xF1adir extensi\xF3n",
    "set.ext.add.desc": "Sin punto, p. ej. md.",
    "set.ext.pick": "Elegir",
    "set.cdn.name": "Cargar desde CDN",
    "set.cdn.desc": "Descarga de jsdelivr los iconos Devicon y Simple que falten y los guarda en cach\xE9 en este dispositivo. Comparte la cach\xE9 con autoalojado.",
    "set.selfhost.name": "Iconos autoalojados",
    "set.selfhost.desc": "Marcas homelab de selfh.st v\xEDa CDN, CC-BY-4.0, cr\xE9dito en el README.",
    "set.stand.name": "Versi\xF3n del cat\xE1logo",
    "set.stand.reload": "Recargar",
    "set.cache.name": "Cach\xE9 de iconos",
    "set.cache.count": "{count} iconos en este dispositivo.",
    "set.cache.clear": "Vaciar",
    "set.autoLight.name": "Variante clara autom\xE1tica",
    "set.autoLight.desc": "En modo oscuro usar la variante clara autoalojada si existe. Una elecci\xF3n manual siempre gana.",
    "set.tabs.name": "Iconos en pesta\xF1as",
    "set.tabs.desc": "Mostrar iconos de mapeo y frontmatter en la barra de pesta\xF1as.",
    "set.titles.name": "Iconos en t\xEDtulos",
    "set.titles.desc": "Mostrar iconos de mapeo y frontmatter delante del t\xEDtulo de la nota.",
    "set.export.name": "Exportar paquete",
    "set.export.desc": "Mapeo e iconos usados como archivo para otros ba\xFAles.",
    "set.export.btn": "Exportar",
    "set.import.name": "Importar paquete",
    "set.import.desc": "Leer icons-export.json y escribir iconos en _assets/icons.",
    "set.import.btn": "Importar",
    "pick.title": "Elegir icono",
    "pick.search.name": "Buscar",
    "pick.search.ph": "Escribe un nombre \u2026",
    "pick.size.name": "Tama\xF1o (opcional)",
    "pick.size.desc": "D\xE9jalo vac\xEDo para el valor por defecto; un n\xFAmero simple cuenta como p\xEDxeles.",
    "pick.size.ph": "1.4em o 20",
    "pick.color": "Color",
    "pick.colorOff": "Off",
    "pick.colorDefault": "Por defecto",
    "pick.colorNoneTip": "Sin color, usar el valor por defecto",
    "pick.colorFree": "Elegir un color libre",
    "pick.hex": "Valor hex",
    "pick.cancel": "Cancelar",
    "pick.saveFile": "Guardar como archivo",
    "pick.apply": "Aplicar",
    "pick.dark": "Elegir icono oscuro",
    "pick.darkTip": "Define un icono para el modo oscuro: luego haz clic en un icono de la lista, solo se mostrar\xE1 en el tema oscuro.",
    "pick.darkCancel": "Cancelar selecci\xF3n",
    "pick.darkHint": "Ahora haz clic en un icono de la lista \u2192 ser\xE1 el icono del modo oscuro",
    "pick.darkValue": "Modo oscuro: {value}",
    "pick.darkSame": "Modo oscuro: igual que el icono claro",
    "pick.none": "Sin resultados",
    "pick.more": "\u2026 {count} m\xE1s, acota la b\xFAsqueda",
    "pick.favToggle": "Alternar favorito",
    "pick.contrast": "Bajo contraste en este tema ({ratio}:1)",
    "group.favorites": "Favoritos",
    "group.recent": "Recientes",
    "group.own": "Propios",
    "group.devicon": "Devicon",
    "group.simple": "Simple",
    "group.selfhosted": "Autoalojado",
    "group.lucide": "Lucide",
    "color.red": "Rojo",
    "color.orange": "Naranja",
    "color.yellow": "Amarillo",
    "color.green": "Verde",
    "color.cyan": "Cian",
    "color.blue": "Azul",
    "color.purple": "Morado",
    "color.pink": "Rosa",
    "color.gray": "Gris",
    "gal.title": "Galer\xEDa de iconos",
    "gal.assigned": "Asignados ({count} rutas, {rules} reglas)",
    "gal.empty": "A\xFAn no hay iconos asignados",
    "gal.remove": "Quitar",
    "gal.ext": "Tipo de archivo ({count})",
    "gal.unused": "Sin usar ({count})",
    "gal.allUsed": "Todo en uso",
    "gal.more": "\u2026 {count} m\xE1s",
    "gal.dark": "oscuro: {value}",
    "check.title": "Comprobar iconos",
    "check.summary": "{used} asignados, {unused} sin usar, {broken} defectuosos",
    "ex.abort": "Exportaci\xF3n cancelada: {path} ya existe",
    "ex.done": "Exportado: {path}",
    "ex.tooBig": "Error de importaci\xF3n: archivo demasiado grande",
    "ex.invalid": "Error de importaci\xF3n: archivo no v\xE1lido",
    "ex.writeErr": "Importaci\xF3n cancelada: error de escritura, queda un estado parcial",
    "ex.imported": "Importado: {entries} entradas, {files} archivos ({skipped} omitidos)"
  }
};
function currentLanguage() {
  try {
    if (typeof import_obsidian6.getLanguage !== "function")
      return "en";
    const raw = (0, import_obsidian6.getLanguage)();
    if (typeof raw !== "string" || raw.length === 0)
      return "en";
    return raw.toLowerCase().split("-")[0];
  } catch (e) {
    return "en";
  }
}
function slogan() {
  var _a;
  return (_a = SLOGANS[currentLanguage()]) != null ? _a : SLOGANS.en;
}
function t(key, vars) {
  var _a, _b, _c;
  const lang = currentLanguage();
  const table = (_a = STRINGS[lang]) != null ? _a : STRINGS.en;
  let out = (_c = (_b = table[key]) != null ? _b : STRINGS.en[key]) != null ? _c : key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}
function colorName(name) {
  return t(`color.${name}`);
}

// picker.ts
var PER_GROUP_LIMIT = 80;
function hayForPicker(ref) {
  const hay = [ref.toLowerCase()];
  if (ref.startsWith("devicon/")) {
    const tags = DEVICON_TAGS[ref.slice("devicon/".length)];
    if (tags)
      hay.push(...tags);
  } else if (ref.startsWith("lucide:")) {
    hay.push(ref.slice("lucide:".length).toLowerCase());
  }
  return hay;
}
var IconPickerModal = class extends import_obsidian7.Modal {
  constructor(app, store, initial, onDone, cdnRefs = [], onSaveFile, meta) {
    var _a;
    super(app);
    this.store = store;
    this.onDone = onDone;
    this.cdnRefs = cdnRefs;
    this.onSaveFile = onSaveFile;
    this.meta = meta;
    this.query = "";
    this.pickDark = false;
    this.items = [];
    this.localRefs = /* @__PURE__ */ new Set();
    this.filled = false;
    this.searchTimer = 0;
    this.previewSeq = 0;
    this.selected = (_a = initial == null ? void 0 : initial.icon) != null ? _a : null;
    this.color = initial == null ? void 0 : initial.color;
    this.size = initial == null ? void 0 : initial.size;
    this.darkIcon = initial == null ? void 0 : initial.iconDark;
  }
  /** Katalog trifft nach Dialog Start ein, Liste neu aufbauen. */
  async refreshCdnRefs(refs) {
    this.cdnRefs = refs;
    if (!this.filled)
      return;
    const names = await this.store.listSvgNames();
    this.buildItems(names);
    this.renderList();
  }
  buildItems(names) {
    var _a, _b, _c, _d;
    const localSet = new Set(names);
    this.localRefs = localSet;
    const groupFor = (ref) => ref.startsWith("devicon/") ? "devicon" : ref.startsWith("simple/") ? "simple" : ref.startsWith("selfhosted/") ? "selfhosted" : "own";
    const byRef = /* @__PURE__ */ new Map();
    for (const ref of this.cdnRefs) {
      byRef.set(ref, {
        ref,
        label: `${ref} \u2B73`,
        group: groupFor(ref),
        hay: hayForPicker(ref),
        cdn: true
      });
    }
    for (const name of names) {
      byRef.set(name, {
        ref: name,
        label: name,
        group: groupFor(name),
        hay: hayForPicker(name)
      });
    }
    const svgItems = [...byRef.values()];
    const lucideItems = this.store.lucideIds().map((id) => ({
      ref: `lucide:${id}`,
      label: id,
      group: "lucide",
      hay: hayForPicker(`lucide:${id}`)
    }));
    const known = /* @__PURE__ */ new Set([
      ...svgItems.map((i) => i.ref),
      ...lucideItems.map((i) => i.ref)
    ]);
    const metaItems = [];
    const seenMeta = /* @__PURE__ */ new Set();
    for (const ref of (_b = (_a = this.meta) == null ? void 0 : _a.favorites) != null ? _b : []) {
      if (known.has(ref) && !seenMeta.has(ref)) {
        seenMeta.add(ref);
        metaItems.push({
          ref,
          label: ref,
          group: "favorites",
          hay: hayForPicker(ref)
        });
      }
    }
    for (const ref of (_d = (_c = this.meta) == null ? void 0 : _c.recent) != null ? _d : []) {
      if (known.has(ref) && !seenMeta.has(ref)) {
        seenMeta.add(ref);
        metaItems.push({
          ref,
          label: ref,
          group: "recent",
          hay: hayForPicker(ref)
        });
      }
    }
    this.items = [...metaItems, ...svgItems, ...lucideItems];
    this.filled = true;
  }
  async onOpen() {
    var _a;
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-icon-picker");
    contentEl.createEl("h3", { text: t("pick.title") });
    this.darkLine = contentEl.createDiv({
      cls: "obsidian-icon-picker-more"
    });
    this.renderDarkLine();
    const names = await this.store.listSvgNames();
    this.buildItems(names);
    new import_obsidian7.Setting(contentEl).setName(t("pick.search.name")).addText((text) => {
      text.setPlaceholder(t("pick.search.ph")).onChange((value) => {
        this.query = value;
        window.clearTimeout(this.searchTimer);
        this.searchTimer = window.setTimeout(() => this.renderList(), 100);
      });
    });
    this.listEl = contentEl.createDiv({ cls: "obsidian-icon-picker-list" });
    this.renderList();
    const colorWrap = contentEl.createDiv({ cls: "obsidian-icon-picker-colors" });
    const colorHead = colorWrap.createDiv({
      cls: "obsidian-icon-picker-colorhead"
    });
    colorHead.createEl("div", {
      text: t("pick.color"),
      cls: "obsidian-icon-picker-label"
    });
    this.colorNameEl = colorHead.createEl("div", {
      cls: "obsidian-icon-picker-colorname"
    });
    const colorBody = colorWrap.createDiv({
      cls: "obsidian-icon-picker-colorbody"
    });
    this.previewBox = colorBody.createDiv({
      cls: "obsidian-icon-picker-bigpreview"
    });
    const dotsCol = colorBody.createDiv();
    const dots = dotsCol.createDiv({ cls: "obsidian-icon-picker-dots" });
    const noneWrap = dots.createDiv({ cls: "obsidian-icon-dotwrap" });
    const none = noneWrap.createEl("button", {
      text: "\u2715",
      cls: "obsidian-icon-dot obsidian-icon-dot-none",
      attr: { title: t("pick.colorNoneTip") }
    });
    noneWrap.createEl("div", {
      text: t("pick.colorOff"),
      cls: "obsidian-icon-dotlabel"
    });
    none.onclick = () => {
      this.color = void 0;
      this.refreshColorUI();
    };
    for (const name of THEME_COLORS) {
      const wrap = dots.createDiv({ cls: "obsidian-icon-dotwrap" });
      const dot = wrap.createEl("button", {
        cls: "obsidian-icon-dot",
        attr: { "aria-label": colorName(name), title: colorName(name) }
      });
      dot.style.background = (_a = themeVar(name)) != null ? _a : `var(--color-${name})`;
      dot.dataset.color = name;
      dot.onclick = () => {
        this.color = name;
        this.refreshColorUI();
      };
      wrap.createEl("div", {
        text: colorName(name),
        cls: "obsidian-icon-dotlabel"
      });
    }
    const hexRow = dotsCol.createDiv({ cls: "obsidian-icon-picker-hexrow" });
    this.hexSwatch = hexRow.createEl("input", {
      cls: "obsidian-icon-dot-hex",
      attr: { type: "color", title: t("pick.colorFree") }
    });
    this.hexText = hexRow.createEl("input", {
      cls: "obsidian-icon-picker-hextext",
      attr: { type: "text", placeholder: "#339af0", title: t("pick.hex") }
    });
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
      cls: "obsidian-icon-picker-warn"
    });
    this.colorWarnEl.style.display = "none";
    this.refreshColorUI();
    const footer = contentEl.createDiv({ cls: "obsidian-icon-picker-footer" });
    const cancel = footer.createEl("button", { text: t("pick.cancel") });
    cancel.onclick = () => this.close();
    this.saveFileBtn = footer.createEl("button", {
      text: t("pick.saveFile")
    });
    this.saveFileBtn.onclick = () => {
      if (this.selected && this.onSaveFile)
        this.onSaveFile(this.selected);
    };
    this.saveBtn = footer.createEl("button", {
      text: t("pick.apply"),
      cls: "mod-cta"
    });
    this.saveBtn.disabled = !this.selected;
    this.updateSaveFileBtn();
    this.darkBtn = footer.createEl("button", {
      text: t("pick.dark"),
      attr: { title: t("pick.darkTip") }
    });
    this.darkBtn.onclick = () => {
      this.pickDark = !this.pickDark;
      this.darkBtn.setText(
        this.pickDark ? t("pick.darkCancel") : t("pick.dark")
      );
      this.renderDarkLine();
    };
    this.saveBtn.onclick = () => {
      var _a2;
      if (!this.selected)
        return;
      const result = { icon: this.selected };
      if (this.color)
        result.color = this.color;
      const size = parseSize((_a2 = this.size) == null ? void 0 : _a2.trim());
      if (size)
        result.size = size;
      if (this.darkIcon && this.darkIcon !== this.selected) {
        result.iconDark = this.darkIcon;
      }
      this.onDone(result);
      this.close();
    };
    new import_obsidian7.Setting(contentEl).setName(t("pick.size.name")).setDesc(t("pick.size.desc")).addText(
      (text) => {
        var _a2;
        return text.setPlaceholder(t("pick.size.ph")).setValue((_a2 = this.size) != null ? _a2 : "").onChange((value) => {
          this.size = value;
        });
      }
    );
  }
  onClose() {
    window.clearTimeout(this.searchTimer);
    this.contentEl.empty();
  }
  refreshColorUI() {
    var _a;
    const dots = this.contentEl.querySelectorAll(".obsidian-icon-dot");
    dots.forEach((d) => {
      const el = d;
      const isNone = el.classList.contains("obsidian-icon-dot-none") && !this.color;
      const isColor = el.dataset.color !== void 0 && el.dataset.color === this.color;
      el.toggleClass("is-selected", isNone || isColor);
    });
    if (!this.color) {
      this.colorNameEl.textContent = t("pick.colorDefault");
    } else if (THEME_COLORS.includes(this.color)) {
      this.colorNameEl.textContent = colorName(this.color);
    } else {
      this.colorNameEl.textContent = this.color;
    }
    if (/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test((_a = this.color) != null ? _a : "")) {
      try {
        this.hexSwatch.value = this.color;
      } catch (e) {
      }
      this.hexText.value = this.color;
    } else if (!this.color) {
      this.hexText.value = "";
    }
    const ratio = this.color ? contrastOnBackground(this.color) : null;
    if (this.colorWarnEl) {
      const low = ratio !== null && ratio < 3;
      this.colorWarnEl.style.display = low ? "" : "none";
      if (low) {
        this.colorWarnEl.textContent = t("pick.contrast", {
          ratio: ratio.toFixed(1)
        });
      }
    }
    void this.updatePreview();
  }
  async updatePreview() {
    const seq = ++this.previewSeq;
    const box = this.previewBox;
    if (!box)
      return;
    box.empty();
    if (!this.selected) {
      box.createDiv({
        text: "?",
        cls: "obsidian-icon-picker-more"
      });
      return;
    }
    const ref = parseIconRef(this.selected);
    if (!ref)
      return;
    await renderIconInto(box, ref, this.store, { color: this.color });
    if (seq !== this.previewSeq)
      return;
    box.addClass("obsidian-icon-picker-bigpreview");
  }
  renderList() {
    this.listEl.empty();
    const groups = [
      "favorites",
      "recent",
      "own",
      "devicon",
      "simple",
      "selfhosted",
      "lucide"
    ];
    const terms = this.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const buckets = /* @__PURE__ */ new Map();
    for (const item of this.items) {
      if (terms.length > 0 && !terms.every((term) => item.hay.some((h) => h.includes(term)))) {
        continue;
      }
      const bucket = buckets.get(item.group);
      if (bucket)
        bucket.push(item);
      else
        buckets.set(item.group, [item]);
    }
    let any = false;
    for (const group of groups) {
      const rows = buckets.get(group);
      if (!rows || rows.length === 0)
        continue;
      any = true;
      this.listEl.createEl("div", {
        text: t(`group.${group}`),
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
        if (this.meta) {
          const fav = row.createEl("button", {
            text: this.meta.favorites.includes(item.ref) ? "\u2605" : "\u2606",
            cls: "obsidian-icon-picker-fav",
            attr: { title: t("pick.favToggle") }
          });
          fav.onclick = (event) => {
            var _a;
            event.stopPropagation();
            (_a = this.meta) == null ? void 0 : _a.onToggleFavorite(item.ref);
            this.renderList();
          };
        }
        row.onclick = () => {
          void this.selectRow(item, row);
        };
      }
      if (rows.length > PER_GROUP_LIMIT) {
        this.listEl.createDiv({
          text: t("pick.more", { count: rows.length - PER_GROUP_LIMIT }),
          cls: "obsidian-icon-picker-more"
        });
      }
    }
    if (!any) {
      this.listEl.createDiv({
        text: t("pick.none"),
        cls: "obsidian-icon-picker-more"
      });
    }
  }
  updateSaveFileBtn() {
    const show = !!this.onSaveFile && !!this.selected && !this.localRefs.has(this.selected) && this.cdnRefs.includes(this.selected);
    this.saveFileBtn.style.display = show ? "" : "none";
  }
  renderDarkLine() {
    if (!this.darkLine)
      return;
    if (this.pickDark) {
      this.darkLine.textContent = t("pick.darkHint");
      return;
    }
    this.darkLine.textContent = this.darkIcon ? t("pick.darkValue", { value: this.darkIcon }) : t("pick.darkSame");
  }
  async selectRow(item, row) {
    this.listEl.querySelectorAll(".is-selected").forEach((el) => el.removeClass("is-selected"));
    row.addClass("is-selected");
    if (item.cdn) {
      this.saveBtn.disabled = true;
      const preview = row.querySelector(
        ".obsidian-icon-picker-preview"
      );
      if (preview)
        preview.textContent = "\u2026";
      const svg = await this.store.getSvg(item.ref);
      if (preview) {
        if (svg)
          preview.innerHTML = svg;
        else
          preview.textContent = "?";
      }
      if (!svg)
        return;
    }
    if (this.pickDark) {
      this.darkIcon = item.ref;
      this.pickDark = false;
      this.darkBtn.setText(t("pick.dark"));
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
  async previewInto(el, item) {
    if (item.ref.startsWith("lucide:")) {
      (0, import_obsidian7.setIcon)(el, item.ref.slice("lucide:".length));
      return;
    }
    if (item.cdn) {
      el.textContent = "\u2B73";
      return;
    }
    const svg = await this.store.getSvg(item.ref);
    if (!el.isConnected)
      return;
    if (svg)
      el.innerHTML = svg;
    else
      el.textContent = "?";
  }
};

// gallery.ts
var import_obsidian8 = require("obsidian");
var PAINT_CONCURRENCY = 6;
function unusedSvgNames(localNames, entries) {
  const local = new Set(localNames);
  for (const entry of entries) {
    const ref = parseIconRef(entry.icon);
    if ((ref == null ? void 0 : ref.kind) === "svg")
      local.delete(ref.name);
    if (entry.iconDark) {
      const dark = parseIconRef(entry.iconDark);
      if ((dark == null ? void 0 : dark.kind) === "svg")
        local.delete(dark.name);
    }
  }
  return [...local].sort((a, b) => a.localeCompare(b));
}
var IconGalleryModal = class extends import_obsidian8.Modal {
  constructor(app, store, mapping, onChanged) {
    super(app);
    this.store = store;
    this.mapping = mapping;
    this.onChanged = onChanged;
    this.closed = true;
  }
  async onOpen() {
    this.closed = false;
    await this.render();
  }
  onClose() {
    this.closed = true;
    this.contentEl.empty();
  }
  /** Vorschaubilder gebündelt malen, Abbruch bei Schließen. */
  async paintAll(paints) {
    for (let i = 0; i < paints.length; i += PAINT_CONCURRENCY) {
      if (this.closed)
        return;
      await Promise.all(
        paints.slice(i, i + PAINT_CONCURRENCY).map(
          ({ el, ref, color }) => renderIconInto(el, ref, this.store, { color })
        )
      );
    }
  }
  async render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("obsidian-icon-gallery");
    contentEl.createEl("h3", { text: t("gal.title") });
    const used = this.mapping.entries();
    const extRules = this.mapping.extEntries();
    contentEl.createEl("div", {
      text: t("gal.assigned", { count: used.length, rules: extRules.length }),
      cls: "obsidian-icon-picker-group"
    });
    if (used.length === 0) {
      contentEl.createDiv({
        text: t("gal.empty"),
        cls: "obsidian-icon-picker-more"
      });
    }
    const paints = [];
    for (const [path, entry] of used) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      const ref = parseIconRef(entry.icon);
      if (ref)
        paints.push({ el: preview, ref, color: entry.color });
      else
        preview.textContent = "?";
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: path });
      const bits = [entry.icon];
      if (entry.color)
        bits.push(entry.color);
      if (entry.size)
        bits.push(entry.size);
      if (entry.iconDark)
        bits.push(t("gal.dark", { value: entry.iconDark }));
      label.createDiv({ text: bits.join(" \xB7 "), cls: "obsidian-icon-picker-more" });
      const remove = row.createEl("button", {
        text: t("gal.remove"),
        cls: "obsidian-icon-gallery-remove"
      });
      remove.onclick = () => {
        void this.mapping.remove(path).then(() => {
          this.onChanged();
          void this.render();
        });
      };
    }
    contentEl.createEl("div", {
      text: t("gal.ext", { count: extRules.length }),
      cls: "obsidian-icon-picker-group"
    });
    for (const [name, entry] of extRules) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      const preview = row.createDiv({ cls: "obsidian-icon-picker-preview" });
      const ref = parseIconRef(entry.icon);
      if (ref)
        paints.push({ el: preview, ref, color: entry.color });
      else
        preview.textContent = "?";
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: `*.${name}` });
      const bits = [entry.icon];
      if (entry.color)
        bits.push(entry.color);
      if (entry.size)
        bits.push(entry.size);
      if (entry.iconDark)
        bits.push(t("gal.dark", { value: entry.iconDark }));
      label.createDiv({ text: bits.join(" \xB7 "), cls: "obsidian-icon-picker-more" });
      const remove = row.createEl("button", {
        text: t("gal.remove"),
        cls: "obsidian-icon-gallery-remove"
      });
      remove.onclick = () => {
        void this.mapping.removeExt(name).then(() => {
          this.onChanged();
          void this.render();
        });
      };
    }
    const local = await this.store.listSvgNames();
    if (this.closed)
      return;
    const entries = [...used, ...extRules].map(([, entry]) => entry);
    const unused = unusedSvgNames(local, entries);
    contentEl.createEl("div", {
      text: t("gal.unused", { count: unused.length }),
      cls: "obsidian-icon-picker-group"
    });
    if (unused.length === 0) {
      contentEl.createDiv({
        text: t("gal.allUsed"),
        cls: "obsidian-icon-picker-more"
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
        cls: "obsidian-icon-picker-more"
      });
    }
    await this.paintAll(paints);
  }
};
var IconCheckModal = class extends import_obsidian8.Modal {
  constructor(app, result) {
    super(app);
    this.result = result;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: t("check.title") });
    contentEl.createDiv({
      text: t("check.summary", {
        used: this.result.used,
        unused: this.result.unused,
        broken: this.result.broken.length
      }),
      cls: "obsidian-icon-picker-more"
    });
    for (const [path, ref] of this.result.broken) {
      const row = contentEl.createDiv({ cls: "obsidian-icon-gallery-row" });
      row.createDiv({ text: "?", cls: "obsidian-icon-picker-preview" });
      const label = row.createDiv({ cls: "obsidian-icon-picker-name" });
      label.createDiv({ text: path });
      label.createDiv({ text: ref, cls: "obsidian-icon-picker-more" });
    }
  }
  onClose() {
    this.contentEl.empty();
  }
};

// suggest.ts
var import_obsidian9 = require("obsidian");
var SUGGEST_LIMIT = 12;
async function collectCatalogRefs(store, opts) {
  const refs = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (ref) => {
    if (!seen.has(ref)) {
      seen.add(ref);
      refs.push(ref);
    }
  };
  for (const name of await store.listSvgNames())
    push(name);
  let deviconTags = { ...DEVICON_TAGS };
  const selfhostTags = /* @__PURE__ */ new Map();
  if (opts.cdn || opts.selfhost) {
    try {
      const catalogs = await loadCatalogs();
      if (opts.cdn) {
        deviconTags = catalogs.deviconTags;
        for (const name of catalogs.deviconNames)
          push(`devicon/${name}`);
        for (const slug of catalogs.simpleSlugs)
          push(`simple/${slug}`);
      }
      if (opts.selfhost) {
        for (const [ref, entry] of catalogs.selfhost) {
          push(`selfhosted/${ref}`);
          if (entry.tags.length > 0)
            selfhostTags.set(ref, entry.tags);
        }
      }
    } catch (e) {
      if (opts.cdn) {
        for (const name of DEVICON_NAMES)
          push(`devicon/${name}`);
        for (const slug of SIMPLE_CDN_SLUGS)
          push(`simple/${slug}`);
      }
    }
  }
  for (const id of store.lucideIds())
    push(`lucide:${id}`);
  return { refs, deviconTags, selfhostTags };
}
function clearCatalogCache() {
  catalogCache = null;
}
var CATALOG_TTL_MS = 3e4;
var catalogCache = null;
async function cachedCatalogRefs(store, opts) {
  const key = `${opts.cdn ? 1 : 0}${opts.selfhost ? 1 : 0}`;
  const now = Date.now();
  if (catalogCache && catalogCache.key === key && now - catalogCache.entry.at < CATALOG_TTL_MS) {
    return catalogCache.entry;
  }
  const catalog = await collectCatalogRefs(store, opts);
  const hay = /* @__PURE__ */ new Map();
  for (const ref of catalog.refs) {
    hay.set(ref, hayFor(ref, catalog.deviconTags, catalog.selfhostTags));
  }
  const entry = { at: now, catalog, hay };
  catalogCache = { key, entry };
  return entry;
}
function hayFor(ref, deviconTags, selfhostTags) {
  var _a, _b;
  const hay = [ref.toLowerCase()];
  if (ref.startsWith("devicon/")) {
    hay.push(...(_a = deviconTags[ref.slice("devicon/".length)]) != null ? _a : []);
  } else if (ref.startsWith("selfhosted/")) {
    hay.push(...(_b = selfhostTags.get(ref.slice("selfhosted/".length))) != null ? _b : []);
  } else if (ref.startsWith("lucide:")) {
    hay.push(ref.slice("lucide:".length).toLowerCase());
  }
  return hay;
}
var IconSuggest = class extends import_obsidian9.EditorSuggest {
  constructor(app, store, opts) {
    super(app);
    this.store = store;
    this.opts = opts;
    this.limit = SUGGEST_LIMIT;
  }
  onTrigger(cursor, editor) {
    var _a;
    const line = editor.getLine(cursor.line).slice(0, cursor.ch);
    const m = /\{\{icon:([A-Za-z0-9_\-/:.]*)$/.exec(line);
    if (!m)
      return null;
    return {
      start: { line: cursor.line, ch: cursor.ch - m[0].length },
      end: cursor,
      query: (_a = m[1]) != null ? _a : ""
    };
  }
  async getSuggestions(ctx) {
    var _a;
    const terms = ctx.query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const { catalog, hay } = await cachedCatalogRefs(this.store, {
      cdn: this.opts.cdn(),
      selfhost: this.opts.selfhost()
    });
    const out = [];
    const seen = /* @__PURE__ */ new Set();
    for (const ref of catalog.refs) {
      if (out.length >= 80)
        break;
      if (seen.has(ref))
        continue;
      const haystack = (_a = hay.get(ref)) != null ? _a : [];
      if (terms.length === 0 || terms.every((term) => haystack.some((h) => h.includes(term)))) {
        seen.add(ref);
        out.push({ ref });
      }
    }
    return out.slice(0, this.limit);
  }
  renderSuggestion(item, el) {
    el.addClass("obsidian-icon-suggest-row");
    const preview = el.createDiv({ cls: "obsidian-icon-picker-preview" });
    el.createDiv({ text: item.ref, cls: "obsidian-icon-picker-name" });
    if (item.ref.startsWith("lucide:")) {
      (0, import_obsidian9.setIcon)(preview, item.ref.slice("lucide:".length));
      return;
    }
    preview.textContent = "\u2026";
    void this.store.getSvg(item.ref).then((svg) => {
      if (!preview.isConnected)
        return;
      if (svg)
        preview.innerHTML = svg;
      else
        preview.textContent = "\u2B73";
    });
  }
  selectSuggestion(item) {
    var _a, _b, _c;
    const ctx = this.context;
    if (!ctx)
      return;
    const editor = ctx.editor;
    const cursor = editor.getCursor();
    const line = (_a = editor.getLine(cursor.line)) != null ? _a : "";
    const before = line.slice(0, cursor.ch);
    const tokenStart = before.lastIndexOf("{{icon:");
    if (tokenStart < 0)
      return;
    const from = { line: cursor.line, ch: tokenStart };
    let endCh = cursor.ch;
    const trail = (_c = (_b = /^[A-Za-z0-9_\-/:.]*/.exec(line.slice(endCh))) == null ? void 0 : _b[0]) != null ? _c : "";
    endCh += trail.length;
    if (line.slice(endCh, endCh + 2) === "}}")
      endCh += 2;
    const after = line.slice(endCh);
    const suffix = after.length > 0 && !/^\s/.test(after) ? " " : "";
    editor.replaceRange(
      `{{icon:${item.ref}}}${suffix}`,
      from,
      { line: cursor.line, ch: endCh }
    );
    this.opts.touch(item.ref);
  }
};
var FrontmatterSuggest = class extends import_obsidian9.EditorSuggest {
  constructor(app, store, sources) {
    super(app);
    this.store = store;
    this.sources = sources;
    this.limit = SUGGEST_LIMIT;
  }
  frontmatterEnd(editor, line) {
    if (editor.getLine(0).trim() !== "---")
      return -1;
    for (let i = 1; i < editor.lineCount(); i++) {
      if (editor.getLine(i).trim() === "---")
        return i;
    }
    return -1;
  }
  onTrigger(cursor, editor) {
    var _a, _b;
    const end = this.frontmatterEnd(editor, cursor.line);
    if (end < 0 || cursor.line === 0 || cursor.line >= end)
      return null;
    const before = editor.getLine(cursor.line).slice(0, cursor.ch);
    let m = /^(\s*icon\s*:\s*["']?)([A-Za-z0-9_\-/:.]*)$/.exec(before);
    if (m) {
      return {
        start: { line: cursor.line, ch: cursor.ch - m[2].length },
        end: cursor,
        query: `icon:${(_a = m[2]) != null ? _a : ""}`
      };
    }
    m = /^(\s*icon(?:Color|Dark)\s*:\s*["']?)([A-Za-z0-9_:\-/#]*)$/.exec(before);
    if (!m)
      return null;
    return {
      start: { line: cursor.line, ch: cursor.ch - m[2].length },
      end: cursor,
      query: `${m[1].includes("Color") ? "color:" : "dark:"}${(_b = m[2]) != null ? _b : ""}`
    };
  }
  async getSuggestions(ctx) {
    if (ctx.query.startsWith("color:")) {
      const q2 = ctx.query.slice("color:".length).toLowerCase();
      return THEME_COLORS.filter((c) => c.includes(q2)).slice(0, this.limit).map((ref) => ({ ref }));
    }
    const matchDark = ctx.query.startsWith("dark:");
    const q = (matchDark ? ctx.query.slice("dark:".length) : ctx.query.slice("icon:".length)).trim().toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);
    const { catalog, hay } = await cachedCatalogRefs(this.store, this.sources());
    return catalog.refs.filter((ref) => {
      var _a;
      const haystack = (_a = hay.get(ref)) != null ? _a : [];
      return terms.length === 0 || terms.every((term) => haystack.some((h) => h.includes(term)));
    }).slice(0, this.limit).map((ref) => ({ ref }));
  }
  renderSuggestion(item, el) {
    var _a;
    el.addClass("obsidian-icon-suggest-row");
    if (THEME_COLORS.includes(item.ref)) {
      const dot = el.createDiv({ cls: "obsidian-icon-dot" });
      dot.style.background = (_a = themeVar(item.ref)) != null ? _a : item.ref;
      el.createDiv({ text: item.ref, cls: "obsidian-icon-picker-name" });
      return;
    }
    const preview = el.createDiv({ cls: "obsidian-icon-picker-preview" });
    el.createDiv({ text: item.ref, cls: "obsidian-icon-picker-name" });
    if (item.ref.startsWith("lucide:")) {
      (0, import_obsidian9.setIcon)(preview, item.ref.slice("lucide:".length));
      return;
    }
    preview.textContent = "\u2026";
    void this.store.getSvg(item.ref).then((svg) => {
      if (!preview.isConnected)
        return;
      if (svg)
        preview.innerHTML = svg;
      else
        preview.textContent = "\u2B73";
    });
  }
  selectSuggestion(item) {
    const ctx = this.context;
    if (!ctx)
      return;
    ctx.editor.replaceRange(item.ref, ctx.start, ctx.end);
  }
};

// exchange.ts
var import_obsidian10 = require("obsidian");
var MAX_IMPORT_FILE_BYTES = 5e5;
var MAX_IMPORT_TOTAL_BYTES = 1e7;
var MAX_IMPORT_FILES = 500;
var MAX_IMPORT_ENTRIES = 5e3;
async function collectFiles(app, store, refs) {
  const files = {};
  for (const raw of refs) {
    const name = normalizeSvgName(raw);
    if (!name || name in files)
      continue;
    const svg = await store.getSvg(name);
    if (svg)
      files[name] = svg;
  }
  return files;
}
function refsOf(entry) {
  const refs = [entry.icon];
  if (entry.iconDark)
    refs.push(entry.iconDark);
  return refs;
}
async function buildPackage(app, store, mapping) {
  const entries = mapping.entries();
  const ext = mapping.extEntries();
  const refs = [];
  for (const [, entry] of [...entries, ...ext])
    refs.push(...refsOf(entry));
  const fullMapping = Object.fromEntries(entries);
  if (ext.length > 0) {
    fullMapping[EXT_KEY] = Object.fromEntries(ext);
  }
  return {
    version: 1,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    mapping: fullMapping,
    files: await collectFiles(app, store, refs)
  };
}
async function exportIcons(app, store, mapping) {
  const pkg = await buildPackage(app, store, mapping);
  const stamp = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const path = `icons-export-${stamp}.json`;
  if (app.vault.getAbstractFileByPath(path) instanceof import_obsidian10.TFile) {
    new import_obsidian10.Notice(t("ex.abort", { path }));
    return;
  }
  await app.vault.create(path, JSON.stringify(pkg, null, 2));
  new import_obsidian10.Notice(t("ex.done", { path }));
}
function isPackage(value) {
  if (!value || typeof value !== "object")
    return false;
  const pkg = value;
  return pkg.version === 1 && typeof pkg.mapping === "object" && pkg.mapping !== null && typeof pkg.files === "object" && pkg.files !== null;
}
function collectImportEntries(mapping, maxEntries) {
  let entries = 0;
  let skipped = 0;
  const pathItems = [];
  for (const [path, value] of Object.entries(mapping)) {
    if (path === EXT_KEY)
      continue;
    if (!path || path.startsWith("/") || path.split("/").includes("..")) {
      skipped++;
      continue;
    }
    const entry = normalizeEntry(value);
    if (!entry || !parseIconRef(entry.icon)) {
      skipped++;
      continue;
    }
    if (entries >= maxEntries) {
      skipped++;
      continue;
    }
    pathItems.push([path, entry]);
    entries++;
  }
  const extItems = [];
  const extSection = mapping[EXT_KEY];
  if (extSection && typeof extSection === "object" && !Array.isArray(extSection)) {
    for (const [raw, value] of Object.entries(
      extSection
    )) {
      const ext = normalizeExt(raw);
      const entry = normalizeEntry(value);
      if (!ext || !entry || !parseIconRef(entry.icon)) {
        skipped++;
        continue;
      }
      if (entries >= maxEntries) {
        skipped++;
        continue;
      }
      extItems.push([ext, entry]);
      entries++;
    }
  }
  return { pathItems, extItems, entries, skipped };
}
function importIcons(app, store, mapping, getFolder, onDone) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = () => {
    var _a;
    const file = (_a = input.files) == null ? void 0 : _a[0];
    if (!file)
      return;
    void (async () => {
      if (file.size > MAX_IMPORT_TOTAL_BYTES) {
        new import_obsidian10.Notice(t("ex.tooBig"));
        return;
      }
      let pkg;
      try {
        pkg = JSON.parse(await file.text());
      } catch (e) {
        new import_obsidian10.Notice(t("ex.invalid"));
        return;
      }
      if (!isPackage(pkg)) {
        new import_obsidian10.Notice(t("ex.invalid"));
        return;
      }
      try {
        const folder = getFolder().trim().replace(/^\/+/, "").replace(/\/+$/, "");
        let written = 0;
        let skipped = 0;
        let writtenBytes = 0;
        for (const [raw, svg] of Object.entries(pkg.files)) {
          const name = normalizeSvgName(raw);
          if (!name || typeof svg !== "string" || !svg.includes("<svg") || svg.length > MAX_IMPORT_FILE_BYTES || written >= MAX_IMPORT_FILES || writtenBytes + svg.length > MAX_IMPORT_TOTAL_BYTES) {
            skipped++;
            continue;
          }
          const path = `${folder}/${name}.svg`;
          if (app.vault.getAbstractFileByPath(path)) {
            skipped++;
            continue;
          }
          const slash = path.lastIndexOf("/");
          if (slash > 0) {
            const dir = path.slice(0, slash);
            if (!app.vault.getAbstractFileByPath(dir)) {
              await app.vault.adapter.mkdir(dir);
            }
          }
          await app.vault.create(path, sanitizeSvg(svg));
          written++;
          writtenBytes += svg.length;
        }
        const {
          pathItems,
          extItems,
          entries,
          skipped: entrySkipped
        } = collectImportEntries(pkg.mapping, MAX_IMPORT_ENTRIES);
        skipped += entrySkipped;
        await mapping.importAll(pathItems, extItems);
        store.clear();
        onDone();
        new import_obsidian10.Notice(
          t("ex.imported", { entries, files: written, skipped })
        );
      } catch (e) {
        new import_obsidian10.Notice(t("ex.writeErr"));
      }
    })();
  };
  input.click();
}

// main.ts
var RECENT_LIMIT = 10;
var FAVORITE_LIMIT = 200;
var CONFLICT_IDS = ["iconic", "obsidian-iconize", "obsidian-icon-folder"];
var DEFAULT_SETTINGS = {
  iconFolder: "_assets/icons",
  mappingFile: "_assets/icon-mapping.json",
  cdnEnabled: false,
  selfhostEnabled: false,
  autoLightVariant: true,
  showTabIcons: true,
  showTitleIcons: true
};
var ICON_TAG_RE = /\{\{icon:([A-Za-z0-9_\-/:.]+?)(?:\.svg)?(?:\|([^{}|]*))?(?:\|([^{}|]*))?(?:\|([^{}|]*))?\}\}/g;
function parseTagParams(first, second, third) {
  let size;
  let color;
  let darkIcon;
  for (const raw of [first, second, third]) {
    const param = (raw != null ? raw : "").trim();
    if (!param)
      continue;
    if (param.startsWith("dark:")) {
      const ref = parseIconRef(param.slice("dark:".length));
      if (ref && !darkIcon)
        darkIcon = param.slice("dark:".length).trim();
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
function resolveDarkRef(ref, dark, autoLight) {
  if (!isDarkTheme())
    return ref;
  if (dark)
    return dark;
  if (autoLight && ref.kind === "svg" && ref.name.startsWith("selfhosted/")) {
    const key = ref.name.slice("selfhosted/".length);
    if (selfhostLightRefs().has(key)) {
      return { kind: "svg", name: `${ref.name}-light` };
    }
  }
  return ref;
}
var IconWidget = class extends import_view.WidgetType {
  constructor(ref, size, color, dark, store) {
    super();
    this.ref = ref;
    this.size = size;
    this.color = color;
    this.dark = dark;
    this.store = store;
    this.darkMode = isDarkTheme();
  }
  eq(other) {
    const a = this.ref;
    const b = other.ref;
    const da = this.dark;
    const db = other.dark;
    return a.kind === b.kind && a.name === b.name && a.id === b.id && a.char === b.char && this.size === other.size && this.color === other.color && this.darkMode === other.darkMode && (da == null ? void 0 : da.name) === (db == null ? void 0 : db.name) && (da == null ? void 0 : da.id) === (db == null ? void 0 : db.id) && (da == null ? void 0 : da.kind) === (db == null ? void 0 : db.kind);
  }
  toDOM() {
    const span = document.createElement("span");
    const ref = this.darkMode && this.dark ? this.dark : this.ref;
    void renderIconInto(span, ref, this.store, {
      size: this.size,
      color: this.color
    }).catch(() => {
      span.setText("?");
    });
    return span;
  }
};
var iconThemeEffect = import_state.StateEffect.define();
function buildIconExtension(store, getAutoLight) {
  const matcher = new import_view.MatchDecorator({
    regexp: new RegExp(ICON_TAG_RE.source, "g"),
    decoration: (match, view, pos) => {
      var _a;
      const ref = parseIconRef((_a = match[1]) != null ? _a : "");
      if (!ref || ref.kind === "emoji")
        return null;
      const end = pos + match[0].length;
      for (const range of view.state.selection.ranges) {
        if (range.from <= end && range.to >= pos)
          return null;
      }
      const { size, color, darkIcon } = parseTagParams(match[2], match[3], match[4]);
      const dark = darkIcon ? parseIconRef(darkIcon) : null;
      const useRef = resolveDarkRef(ref, dark, getAutoLight());
      return import_view.Decoration.replace({
        widget: new IconWidget(useRef, size, color, dark, store),
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
        for (const tr of update.transactions) {
          for (const e of tr.effects) {
            if (e.is(iconThemeEffect)) {
              this.decorations = matcher.createDeco(update.view);
              return;
            }
          }
        }
        this.decorations = matcher.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations }
  );
}
var MoiPlugin = class extends import_obsidian11.Plugin {
  constructor() {
    super(...arguments);
    this.settings = { ...DEFAULT_SETTINGS };
    /** Hinweis bei Iconic oder Iconize, beide kämpfen um dieselben DOM Stellen. */
    this.warnedConflicts = false;
    /** Meta Writes bündeln, das Envelope mit Cache ist groß. */
    this.metaTimer = 0;
    /** CDN Icon aus dem Cache als SVG Datei in den Icon Ordner schreiben. */
    this.savingFiles = /* @__PURE__ */ new Set();
    this.cdnData = {};
    this.recentIcons = [];
    this.favoriteIcons = [];
    /** Aufeinanderfolgende Saves, damit sich parallele Writes nicht überholen. */
    this.dataSaveQueue = Promise.resolve();
    /** Textfelder entprellen, ein Save pro Tipp-Pause reicht. */
    this.settingsTimer = 0;
  }
  async onload() {
    await this.loadAll();
    this.cdn = new CdnCache({
      load: () => this.cdnData,
      save: (data) => {
        this.cdnData = data;
        void this.saveAll();
      }
    });
    this.icons = new IconStore(this.app, () => this.settings.iconFolder, {
      enabled: () => this.settings.cdnEnabled,
      getSvg: (name) => this.cdn.getSvg(name)
    });
    this.mapping = new MappingStore(this.app, () => this.settings.mappingFile);
    await this.mapping.load();
    this.explorer = new ExplorerIcons(
      this.app,
      this.icons,
      this.mapping,
      () => this.settings.autoLightVariant
    );
    this.chrome = new TabsTitles(this.app, this.icons, this.mapping, () => ({
      tabs: this.settings.showTabIcons,
      title: this.settings.showTitleIcons,
      autoLight: this.settings.autoLightVariant
    }));
    this.registerEditorExtension(
      buildIconExtension(this.icons, () => this.settings.autoLightVariant)
    );
    this.registerEditorSuggest(
      new IconSuggest(this.app, this.icons, {
        cdn: () => this.settings.cdnEnabled,
        selfhost: () => this.settings.selfhostEnabled,
        touch: (ref) => this.touchRecent([ref])
      })
    );
    this.registerEditorSuggest(
      new FrontmatterSuggest(this.app, this.icons, () => ({
        cdn: this.settings.cdnEnabled,
        selfhost: this.settings.selfhostEnabled
      }))
    );
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
      })
    );
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => this.chrome.refreshSoon())
    );
    this.registerEvent(
      this.app.workspace.on("file-open", () => this.chrome.refreshSoon())
    );
    this.registerEvent(
      this.app.metadataCache.on("changed", () => this.chrome.refreshSoon())
    );
    this.registerEvent(
      this.app.workspace.on("css-change", () => {
        this.app.workspace.updateOptions();
        this.explorer.refreshSoon();
        this.chrome.refreshSoon();
        this.refreshEditorIcons();
      })
    );
    this.registerEvent(this.app.vault.on("create", (f) => this.onVault(f)));
    this.registerEvent(this.app.vault.on("modify", (f) => this.onVault(f)));
    this.registerEvent(this.app.vault.on("delete", (f) => this.onDelete(f)));
    this.registerEvent(
      this.app.vault.on("rename", (f, oldPath) => this.onRename(f, oldPath))
    );
    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        menu.addItem(
          (item) => item.setTitle(t("menu.change")).setIcon("image-plus").onClick(() => this.openPicker([file.path]))
        );
        if (this.mapping.get(file.path)) {
          menu.addItem(
            (item) => item.setTitle(t("menu.remove")).setIcon("trash").onClick(() => this.removeIcons([file.path]))
          );
        }
      })
    );
    this.registerEvent(
      this.app.workspace.on("files-menu", (menu, files) => {
        const paths = files.map((f) => f.path);
        menu.addItem(
          (item) => item.setTitle(t("menu.changeMany", { count: paths.length })).setIcon("image-plus").onClick(() => this.openPicker(paths))
        );
        if (paths.some((p) => this.mapping.get(p))) {
          menu.addItem(
            (item) => item.setTitle(t("menu.removeMany", { count: paths.length })).setIcon("trash").onClick(() => this.removeIcons(paths))
          );
        }
      })
    );
    this.addCommand({
      id: "reload-icons",
      name: t("cmd.reload"),
      callback: () => {
        this.icons.clear();
        void this.mapping.load().then(() => this.explorer.refresh());
        this.app.workspace.updateOptions();
      }
    });
    this.addCommand({
      id: "open-gallery",
      name: t("cmd.gallery"),
      callback: () => {
        new IconGalleryModal(this.app, this.icons, this.mapping, () => {
          this.refreshViews();
        }).open();
      }
    });
    this.addCommand({
      id: "check-icons",
      name: t("cmd.check"),
      callback: () => {
        void this.runIconCheck().then((result) => {
          if (result.broken.length === 0) {
            new import_obsidian11.Notice(
              t("notice.checkOk", { used: result.used, unused: result.unused })
            );
          } else {
            new IconCheckModal(this.app, result).open();
          }
        });
      }
    });
    this.addCommand({
      id: "export-icons",
      name: t("cmd.export"),
      callback: () => {
        void exportIcons(this.app, this.icons, this.mapping);
      }
    });
    this.addCommand({
      id: "import-icons",
      name: t("cmd.import"),
      callback: () => {
        this.importPackage();
      }
    });
    this.addCommand({
      id: "pick-icon-active-file",
      name: t("cmd.pickActive"),
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file)
          return false;
        if (!checking)
          this.openPicker([file.path]);
        return true;
      }
    });
    this.addCommand({
      id: "insert-icon-at-cursor",
      name: t("cmd.insert"),
      editorCallback: (editor) => {
        this.openInsertPicker(editor);
      }
    });
    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        menu.addItem(
          (item) => item.setTitle(t("menu.insert")).setIcon("plus").onClick(() => this.openInsertPicker(editor))
        );
        const file = view.file;
        if (!(file instanceof import_obsidian11.TFile))
          return;
        menu.addItem(
          (item) => item.setTitle(t("menu.change")).setIcon("image-plus").onClick(() => this.openPicker([file.path]))
        );
        if (this.mapping.get(file.path)) {
          menu.addItem(
            (item) => item.setTitle(t("menu.remove")).setIcon("trash").onClick(() => this.removeIcons([file.path]))
          );
        }
      })
    );
    this.addSettingTab(new MoiSettingTab(this.app, this));
  }
  onunload() {
    var _a, _b, _c, _d;
    window.clearTimeout(this.metaTimer);
    window.clearTimeout(this.settingsTimer);
    (_a = this.cdn) == null ? void 0 : _a.flush();
    void this.saveAll();
    void ((_b = this.mapping) == null ? void 0 : _b.flush());
    (_c = this.explorer) == null ? void 0 : _c.stop();
    (_d = this.chrome) == null ? void 0 : _d.stop();
  }
  warnOnConflicts() {
    var _a;
    if (this.warnedConflicts)
      return;
    this.warnedConflicts = true;
    const plugins = (_a = this.app.plugins) == null ? void 0 : _a.plugins;
    if (!plugins)
      return;
    const found = CONFLICT_IDS.filter((id) => id in plugins);
    if (found.length > 0) {
      new import_obsidian11.Notice(
        `M.O.I.: ${t("notice.conflict", { names: found.join(", ") })}`,
        9e3
      );
    }
  }
  /** Live Preview Deko in allen Editoren neu bauen, etwa nach Theme Wechsel. */
  refreshEditorIcons() {
    var _a;
    for (const leaf of this.app.workspace.getLeavesOfType("markdown")) {
      const editor = (_a = leaf.view.editor) == null ? void 0 : _a.cm;
      if (!editor)
        continue;
      try {
        editor.dispatch({ effects: iconThemeEffect.of(Date.now()) });
      } catch (e) {
      }
    }
  }
  onVault(file) {
    const path = typeof file === "string" ? file : file.path;
    if (this.mapping.isMappingPath(path)) {
      void this.mapping.load().then(() => {
        this.explorer.refresh();
        this.chrome.refreshSoon();
      });
      return;
    }
    this.icons.invalidatePath(path);
    if (path.toLowerCase().endsWith(".svg"))
      clearCatalogCache();
  }
  onRename(file, oldPath) {
    if (this.mapping.isMappingPath(file.path))
      return;
    const isFolder = file instanceof import_obsidian11.TFolder;
    void this.mapping.migrateRename(oldPath, file.path, isFolder).then((changed) => {
      if (changed)
        this.explorer.refreshSoon();
      this.chrome.refreshSoon();
    });
  }
  onDelete(file) {
    const path = file.path;
    if (this.mapping.isMappingPath(path))
      return;
    const isFolder = file instanceof import_obsidian11.TFolder;
    void this.mapping.removePath(path, isFolder).then((changed) => {
      if (changed) {
        this.explorer.refreshSoon();
        this.chrome.refreshSoon();
      }
    });
    this.icons.invalidatePath(path);
    if (path.toLowerCase().endsWith(".svg"))
      clearCatalogCache();
  }
  openExtPicker(ext, initial, onSaved) {
    this.openIconPicker(initial, (result) => {
      void (async () => {
        try {
          await this.mapping.setExt(ext, {
            icon: result.icon,
            ...result.color ? { color: result.color } : {},
            ...result.size ? { size: result.size } : {},
            ...result.iconDark ? { iconDark: result.iconDark } : {}
          });
          this.touchRecent([result.icon]);
          this.explorer.refreshSoon();
          this.chrome.refreshSoon();
          onSaved == null ? void 0 : onSaved();
        } catch (e) {
          new import_obsidian11.Notice(t("notice.iconSaveFailed"));
        }
      })();
    });
  }
  openPicker(paths) {
    const first = paths.length === 1 ? this.mapping.get(paths[0]) : null;
    const initial = first ? {
      icon: first.icon,
      ...first.color ? { color: first.color } : {},
      ...first.size ? { size: first.size } : {},
      ...first.iconDark ? { iconDark: first.iconDark } : {}
    } : null;
    this.openIconPicker(initial, (result) => {
      void this.applyIcons(paths, result);
    });
  }
  /** Tote Favoriten und Zuletzt Einträge entfernen, einmal pro Dialog.
   * Nur Quellen mit vollständigem Stand werden beurteilt, der Rest bleibt.
   */
  async pruneMeta(cdnRefs) {
    const local = new Set(await this.icons.listSvgNames());
    let lucide = null;
    try {
      const ids = this.icons.lucideIds();
      if (ids.length > 0)
        lucide = new Set(ids.map((id) => `lucide:${id}`));
    } catch (e) {
      lucide = null;
    }
    const cdn = this.settings.cdnEnabled ? new Set(
      cdnRefs.filter(
        (ref) => ref.startsWith("devicon/") || ref.startsWith("simple/")
      )
    ) : null;
    const selfhosted = this.settings.selfhostEnabled ? new Set(cdnRefs.filter((ref) => ref.startsWith("selfhosted/"))) : null;
    const sourceSet = (ref) => {
      if (ref.startsWith("lucide:"))
        return lucide;
      if (ref.startsWith("devicon/") || ref.startsWith("simple/"))
        return cdn;
      if (ref.startsWith("selfhosted/"))
        return selfhosted;
      return void 0;
    };
    const known = (ref) => {
      if (local.has(ref))
        return true;
      const set = sourceSet(ref);
      return set !== null && set !== void 0 && set.has(ref);
    };
    const judgeable = (ref) => {
      if (local.has(ref))
        return true;
      return sourceSet(ref) !== null;
    };
    let changed = false;
    const keep = (list) => list.filter((ref) => {
      if (known(ref) || !judgeable(ref))
        return true;
      changed = true;
      return false;
    });
    this.favoriteIcons = keep(this.favoriteIcons);
    this.recentIcons = keep(this.recentIcons).slice(0, RECENT_LIMIT);
    if (changed)
      await this.saveAll();
  }
  /** Gleicher Dialog zum Einfügen als Shortcode in die Notiz. */
  openInsertPicker(editor) {
    var _a;
    const cursor = editor.getCursor();
    const line = (_a = editor.getLine(cursor.line)) != null ? _a : "";
    this.openIconPicker(null, (result) => {
      const parts = [result.icon];
      if (result.size)
        parts.push(result.size);
      if (result.color)
        parts.push(result.color);
      if (result.iconDark)
        parts.push(`dark:${result.iconDark}`);
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
  openIconPicker(initial, onPick) {
    const meta = {
      favorites: [...this.favoriteIcons],
      recent: [...this.recentIcons],
      onToggleFavorite: (ref) => {
        this.toggleFavorite(ref);
        meta.favorites = [...this.favoriteIcons];
      }
    };
    const modal = new IconPickerModal(
      this.app,
      this.icons,
      initial,
      (result) => {
        if (result)
          onPick(result);
      },
      [],
      (ref) => {
        void this.saveCdnToFile(ref);
      },
      meta
    );
    modal.open();
    void this.cdnRefs().then(async (refs) => {
      await this.pruneMeta(refs);
      meta.favorites = [...this.favoriteIcons];
      meta.recent = [...this.recentIcons];
      await modal.refreshCdnRefs(refs);
    }).catch(() => {
    });
  }
  /** Katalog Referenzen, die nur per CDN verfügbar sind, nicht als Datei. */
  async cdnRefs() {
    if (!this.settings.cdnEnabled && !this.settings.selfhostEnabled)
      return [];
    const local = new Set(await this.icons.listSvgNames());
    try {
      const catalog = await collectCatalogRefs(this.icons, {
        cdn: this.settings.cdnEnabled,
        selfhost: this.settings.selfhostEnabled
      });
      return catalog.refs.filter((ref) => ref.includes("/") && !local.has(ref));
    } catch (e) {
      return [];
    }
  }
  async applyIcons(paths, result) {
    const entry = {
      icon: result.icon,
      ...result.color ? { color: result.color } : {},
      ...result.size ? { size: result.size } : {},
      ...result.iconDark ? { iconDark: result.iconDark } : {}
    };
    try {
      await this.mapping.setMany(paths.map((path) => [path, entry]));
    } catch (e) {
      new import_obsidian11.Notice(t("notice.iconsSaveFailed"));
      return;
    }
    this.touchRecent([result.icon]);
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
  }
  touchRecent(refs) {
    const seen = new Set(this.recentIcons);
    for (const ref of refs) {
      if (seen.has(ref)) {
        this.recentIcons = this.recentIcons.filter((r) => r !== ref);
      }
      this.recentIcons.unshift(ref);
      seen.add(ref);
    }
    this.recentIcons = this.recentIcons.slice(0, RECENT_LIMIT);
    this.saveMetaSoon();
  }
  saveMetaSoon() {
    window.clearTimeout(this.metaTimer);
    this.metaTimer = window.setTimeout(() => {
      void this.saveAll();
    }, 500);
  }
  toggleFavorite(ref) {
    const index = this.favoriteIcons.indexOf(ref);
    if (index >= 0)
      this.favoriteIcons.splice(index, 1);
    else
      this.favoriteIcons.push(ref);
    if (this.favoriteIcons.length > FAVORITE_LIMIT) {
      this.favoriteIcons = this.favoriteIcons.slice(-FAVORITE_LIMIT);
    }
    this.saveMetaSoon();
    return index < 0;
  }
  async removeIcons(paths) {
    try {
      await this.mapping.removeMany(paths);
    } catch (e) {
      new import_obsidian11.Notice(t("notice.iconsRemoveFailed"));
      return;
    }
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
  }
  async saveCdnToFile(ref) {
    const parsed = parseIconRef(ref);
    if (!parsed || parsed.kind !== "svg") {
      new import_obsidian11.Notice(t("notice.onlySvg"));
      return;
    }
    const svg = this.cdn.peek(ref);
    if (!svg) {
      new import_obsidian11.Notice(t("notice.notInCache"));
      return;
    }
    const path = `${normalizeFolder(this.settings.iconFolder)}/${parsed.name}.svg`;
    if (this.app.vault.getAbstractFileByPath(path) instanceof import_obsidian11.TFile) {
      new import_obsidian11.Notice(t("notice.fileExists"));
      return;
    }
    if (this.savingFiles.has(path))
      return;
    this.savingFiles.add(path);
    try {
      const slash = path.lastIndexOf("/");
      if (slash > 0) {
        const dir = path.slice(0, slash);
        if (!this.app.vault.getAbstractFileByPath(dir)) {
          await this.app.vault.adapter.mkdir(dir);
        }
      }
      await this.app.vault.create(path, svg);
    } catch (e) {
      new import_obsidian11.Notice(t("notice.fileSaveFailed"));
      return;
    } finally {
      this.savingFiles.delete(path);
    }
    this.icons.invalidatePath(path);
    this.explorer.refreshSoon();
    new import_obsidian11.Notice(t("notice.saved", { path }));
  }
  cacheSize() {
    var _a, _b;
    return (_b = (_a = this.cdn) == null ? void 0 : _a.size) != null ? _b : 0;
  }
  refreshViews() {
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
    this.app.workspace.updateOptions();
  }
  catalogStandText() {
    var _a, _b, _c;
    const stand = catalogStand();
    const parts = [];
    if (this.settings.cdnEnabled) {
      parts.push(
        t("cat.devicon", {
          value: (_a = stand.devicon) != null ? _a : t("cat.builtinVersion")
        })
      );
      parts.push(
        t("cat.simple", { value: (_b = stand.simple) != null ? _b : t("cat.builtinCurated") })
      );
    }
    if (this.settings.selfhostEnabled) {
      parts.push(
        t("cat.selfhost", {
          value: (_c = stand.selfhosted) != null ? _c : t("cat.builtinDate", { date: SELFHOST_DATE })
        })
      );
    }
    return parts.length > 0 ? parts.join(" \xB7 ") : t("cat.off");
  }
  async reloadCatalogs() {
    clearCatalogCaches();
    clearCatalogCache();
    try {
      await loadCatalogs();
    } catch (e) {
    }
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
    this.app.workspace.updateOptions();
  }
  iconStore() {
    return this.icons;
  }
  iconMapping() {
    return this.mapping;
  }
  importPackage() {
    importIcons(this.app, this.icons, this.mapping, () => this.settings.iconFolder, () => {
      this.explorer.refreshSoon();
      this.chrome.refreshSoon();
    });
  }
  /**
   * Prüft alle Mapping Einträge ohne Netz: Datei da, Lucide bekannt,
   * Emoji gesetzt oder per CDN auflösbar. Zählt ungenutzte Dateien.
   */
  async runIconCheck() {
    const broken = [];
    const local = new Set(await this.icons.listSvgNames());
    const lucide = new Set(this.icons.lucideIds());
    const resolvable = new Set(local);
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
      } catch (e) {
        if (this.settings.cdnEnabled) {
          for (const name of DEVICON_NAMES)
            resolvable.add(`devicon/${name}`);
          let slugs = SIMPLE_CDN_SLUGS;
          try {
            const live = await fetchSimpleSlugs();
            if (live.length > 0)
              slugs = live;
          } catch (e2) {
          }
          for (const slug of slugs)
            resolvable.add(`simple/${slug}`);
        }
      }
    }
    const entries = this.mapping.entries();
    const refOk = (ref) => {
      if (!ref)
        return false;
      if (ref.kind === "emoji")
        return ref.char.length > 0;
      if (ref.kind === "lucide")
        return lucide.has(ref.id);
      if (resolvable.has(ref.name))
        return true;
      if (ref.name.startsWith("selfhosted/") && ref.name.endsWith("-light")) {
        const base = ref.name.slice("selfhosted/".length, -"-light".length);
        if (selfhostLightRefs().has(base) && resolvable.has(`selfhosted/${base}`)) {
          return true;
        }
      }
      return (this.settings.cdnEnabled || this.settings.selfhostEnabled) && !!this.cdn.peek(ref.name);
    };
    for (const [path, entry] of [...entries, ...this.mapping.extEntries().map(([ext, value]) => [`*.${ext}`, value])]) {
      if (!refOk(parseIconRef(entry.icon)))
        broken.push([path, entry.icon]);
      if (entry.iconDark && !refOk(parseIconRef(entry.iconDark))) {
        broken.push([`${path} (dunkel)`, entry.iconDark]);
      }
    }
    const used = /* @__PURE__ */ new Set();
    for (const [, entry] of [...entries, ...this.mapping.extEntries()]) {
      const ref = parseIconRef(entry.icon);
      if ((ref == null ? void 0 : ref.kind) === "svg")
        used.add(ref.name);
      if (entry.iconDark) {
        const dark = parseIconRef(entry.iconDark);
        if ((dark == null ? void 0 : dark.kind) === "svg")
          used.add(dark.name);
      }
    }
    let unused = 0;
    for (const name of local) {
      if (!used.has(name))
        unused++;
    }
    return { broken, used: entries.length + this.mapping.extEntries().length, unused };
  }
  clearCache() {
    var _a;
    (_a = this.cdn) == null ? void 0 : _a.clear();
    this.icons.clear();
    this.explorer.refreshSoon();
    this.app.workspace.updateOptions();
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
          { size, color }
        );
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
  isEnvelope(value) {
    if (!value || typeof value !== "object")
      return false;
    const keys = ["settings", "cdnCache", "recentIcons", "favoriteIcons"];
    return keys.some((k) => k in value);
  }
  asStringList(value) {
    if (!Array.isArray(value))
      return [];
    return value.filter((v) => typeof v === "string");
  }
  async loadAll() {
    var _a, _b;
    let raw = null;
    try {
      raw = await this.loadData();
    } catch (e) {
      console.warn("[moi] data.json ung\xFCltig, Standard geladen");
    }
    if (this.isEnvelope(raw)) {
      this.settings = { ...DEFAULT_SETTINGS, ...(_a = raw.settings) != null ? _a : {} };
      this.cdnData = (_b = raw.cdnCache) != null ? _b : {};
      this.recentIcons = this.asStringList(raw.recentIcons).slice(0, RECENT_LIMIT);
      this.favoriteIcons = [...new Set(this.asStringList(raw.favoriteIcons))].slice(-FAVORITE_LIMIT);
    } else {
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...raw != null ? raw : {}
      };
      this.cdnData = {};
      this.recentIcons = [];
      this.favoriteIcons = [];
    }
  }
  saveAll() {
    const run = this.dataSaveQueue.then(() => this.writeAll());
    this.dataSaveQueue = run.then(
      () => void 0,
      () => void 0
    );
    return run;
  }
  async writeAll() {
    const envelope = {
      settings: this.settings,
      cdnCache: this.cdnData,
      recentIcons: this.recentIcons,
      favoriteIcons: this.favoriteIcons
    };
    await this.saveData(envelope);
  }
  async loadSettings() {
    await this.loadAll();
  }
  async saveSettings() {
    await this.saveAll();
    this.icons.clear();
    await this.mapping.load();
    this.explorer.refreshSoon();
    this.chrome.refreshSoon();
    this.refreshEditorIcons();
    this.app.workspace.updateOptions();
  }
  saveSettingsSoon() {
    window.clearTimeout(this.settingsTimer);
    this.settingsTimer = window.setTimeout(() => {
      void this.saveSettings();
    }, 500);
  }
};
var MoiSettingTab = class extends import_obsidian11.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const head = containerEl.createDiv({ cls: "moi-settings-head" });
    head.createEl("h2", { text: "M.O.I. \u2013 My Obsidian Icons" });
    head.createEl("p", { text: slogan(), cls: "moi-settings-slogan" });
    new import_obsidian11.Setting(containerEl).setName(t("set.iconFolder.name")).setDesc(t("set.iconFolder.desc")).addText(
      (text) => text.setPlaceholder("_assets/icons").setValue(this.plugin.settings.iconFolder).onChange(async (value) => {
        this.plugin.settings.iconFolder = normalizeFolder(value) || DEFAULT_SETTINGS.iconFolder;
        this.plugin.saveSettingsSoon();
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.mappingFile.name")).setDesc(t("set.mappingFile.desc")).addText(
      (text) => text.setPlaceholder("_assets/icon-mapping.json").setValue(this.plugin.settings.mappingFile).onChange(async (value) => {
        this.plugin.settings.mappingFile = normalizeFolder(value) || DEFAULT_SETTINGS.mappingFile;
        this.plugin.saveSettingsSoon();
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.ext.name")).setDesc(t("set.ext.desc"));
    for (const [ext, entry] of this.plugin.iconMapping().extEntries()) {
      const row = new import_obsidian11.Setting(containerEl).setName(`*.${ext}`).setDesc(entry.icon);
      const preview = document.createElement("span");
      preview.addClass("obsidian-icon-inline");
      preview.style.width = "18px";
      preview.style.height = "18px";
      row.settingEl.prepend(preview);
      const ref = parseIconRef(entry.icon);
      if (ref) {
        void renderIconInto(preview, ref, this.plugin.iconStore(), {
          color: entry.color
        });
      }
      row.addButton(
        (button) => button.setButtonText(t("set.ext.change")).onClick(() => {
          this.plugin.openExtPicker(
            ext,
            {
              icon: entry.icon,
              ...entry.color ? { color: entry.color } : {},
              ...entry.size ? { size: entry.size } : {},
              ...entry.iconDark ? { iconDark: entry.iconDark } : {}
            },
            () => this.display()
          );
        })
      ).addButton(
        (button) => button.setButtonText("\u2715").onClick(async () => {
          await this.plugin.iconMapping().removeExt(ext);
          this.plugin.refreshViews();
          this.display();
        })
      );
    }
    let newExt = "";
    new import_obsidian11.Setting(containerEl).setName(t("set.ext.add.name")).setDesc(t("set.ext.add.desc")).addText(
      (text) => text.setPlaceholder("md").onChange((value) => {
        newExt = value;
      })
    ).addButton(
      (button) => button.setButtonText(t("set.ext.pick")).onClick(() => {
        const ext = normalizeExt(newExt);
        if (!ext) {
          new import_obsidian11.Notice(t("notice.invalidExt"));
          return;
        }
        this.plugin.openExtPicker(
          ext,
          this.plugin.iconMapping().getExt(ext),
          () => this.display()
        );
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.cdn.name")).setDesc(t("set.cdn.desc")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.cdnEnabled).onChange(async (value) => {
        this.plugin.settings.cdnEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.selfhost.name")).setDesc(t("set.selfhost.desc")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.selfhostEnabled).onChange(async (value) => {
        this.plugin.settings.selfhostEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    const standSetting = new import_obsidian11.Setting(containerEl).setName(t("set.stand.name")).setDesc(this.plugin.catalogStandText()).addButton(
      (button) => button.setButtonText(t("set.stand.reload")).onClick(async () => {
        await this.plugin.reloadCatalogs();
        standSetting.setDesc(this.plugin.catalogStandText());
      })
    );
    const cacheSetting = new import_obsidian11.Setting(containerEl).setName(t("set.cache.name")).setDesc(t("set.cache.count", { count: this.plugin.cacheSize() })).addButton(
      (button) => button.setButtonText(t("set.cache.clear")).onClick(async () => {
        this.plugin.clearCache();
        cacheSetting.setDesc(t("set.cache.count", { count: 0 }));
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.autoLight.name")).setDesc(t("set.autoLight.desc")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.autoLightVariant).onChange(async (value) => {
        this.plugin.settings.autoLightVariant = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.tabs.name")).setDesc(t("set.tabs.desc")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showTabIcons).onChange(async (value) => {
        this.plugin.settings.showTabIcons = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.titles.name")).setDesc(t("set.titles.desc")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.showTitleIcons).onChange(async (value) => {
        this.plugin.settings.showTitleIcons = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.export.name")).setDesc(t("set.export.desc")).addButton(
      (button) => button.setButtonText(t("set.export.btn")).onClick(() => {
        void exportIcons(
          this.plugin.app,
          this.plugin.iconStore(),
          this.plugin.iconMapping()
        );
      })
    );
    new import_obsidian11.Setting(containerEl).setName(t("set.import.name")).setDesc(t("set.import.desc")).addButton(
      (button) => button.setButtonText(t("set.import.btn")).onClick(() => {
        this.plugin.importPackage();
      })
    );
  }
};
