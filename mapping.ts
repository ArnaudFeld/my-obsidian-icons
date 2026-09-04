import { App, TAbstractFile, TFile } from "obsidian";
import { normalizeFolder, parseIconRef, parseSize } from "./icons";

export interface MappingEntry {
  icon: string;
  color?: string;
  size?: string;
  iconDark?: string;
}

export type IconMapping = Record<string, string | MappingEntry>;

/** Reservierter Schlüssel für Dateityp Regeln in derselben Datei. */
export const EXT_KEY = "__ext__";

/** Schlüssel, die den Speicher korrumpieren würden, immer abweisen. */
export function isSafeKey(key: string): boolean {
  return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}

/** Endung normieren: klein, ohne Punkt, nur Buchstaben und Zahlen. */
export function normalizeExt(raw: string): string | null {
  const ext = raw.trim().toLowerCase().replace(/^\.+/, "");
  return /^[a-z0-9]+$/.test(ext) ? ext : null;
}

/** String Kurzform bleibt gültig und bedeutet keine Farbe. */
export function normalizeEntry(
  value: string | MappingEntry | undefined,
): MappingEntry | null {
  if (typeof value === "string") {
    const icon = value.trim();
    return icon ? { icon } : null;
  }
  if (value && typeof value.icon === "string" && value.icon.trim()) {
    const entry: MappingEntry = { icon: value.icon.trim() };
    if (typeof value.color === "string" && value.color.trim()) {
      entry.color = value.color.trim();
    }
    const size =
      typeof value.size === "string" ? parseSize(value.size.trim()) : undefined;
    if (size) entry.size = size;
    if (typeof value.iconDark === "string" && parseIconRef(value.iconDark)) {
      entry.iconDark = value.iconDark.trim();
    }
    return entry;
  }
  return null;
}

/**
 * Zuordnung Vault Pfad -> Icon, als JSON Datei im Vault.
 * Bleibt in Git und Sync erhalten, im Gegensatz zu data.json.
 */
export class MappingStore {
  private data: IconMapping = {};
  /** Aufeinanderfolgende Saves, damit sich parallele Writes nicht überholen. */
  private saveQueue: Promise<void> = Promise.resolve();

  constructor(
    private app: App,
    private getFile: () => string,
  ) {}

  private mappingPath(): string {
    return normalizeFolder(this.getFile());
  }

  isMappingPath(path: string): boolean {
    return path === this.mappingPath();
  }

  async load(): Promise<void> {
    const run = this.saveQueue.then(
      () => this.readFile(),
      () => this.readFile(),
    );
    this.saveQueue = run.then(
      () => undefined,
      () => undefined,
    );
    await run;
  }

  private async readFile(): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(this.mappingPath());
      if (!(file instanceof TFile)) return;
      const raw = await this.app.vault.read(file);
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        this.data = parsed as IconMapping;
        for (const key of Object.keys(this.data)) {
          if (!isSafeKey(key)) delete this.data[key];
        }
        this.normalizeExtKeys();
      }
    } catch {
      console.warn("[inline-svg-icons] Mapping Datei ungültig, Stand behalten");
    }
  }

  /** Alte großgeschriebene Endungen im Speicher heilen, nächster Save sichert. */
  private normalizeExtKeys(): void {
    const section: unknown = this.data[EXT_KEY];
    if (!section || typeof section !== "object" || Array.isArray(section)) {
      return;
    }
    const rec = section as Record<string, string | MappingEntry>;
    for (const key of Object.keys(rec)) {
      const norm = normalizeExt(key);
      if (norm && norm !== key) {
        if (!(norm in rec)) rec[norm] = rec[key];
        delete rec[key];
      }
    }
  }

  get(path: string): MappingEntry | null {
    if (path === EXT_KEY) return null;
    return normalizeEntry(this.data[path]);
  }

  entries(): [string, MappingEntry][] {
    const out: [string, MappingEntry][] = [];
    for (const [path, value] of Object.entries(this.data)) {
      if (path === EXT_KEY) continue;
      const entry = normalizeEntry(value);
      if (entry) out.push([path, entry]);
    }
    return out.sort((a, b) => a[0].localeCompare(b[0]));
  }

  private extSection(): Record<string, string | MappingEntry> {
    const section: unknown = this.data[EXT_KEY];
    if (section && typeof section === "object" && !Array.isArray(section)) {
      return section as Record<string, string | MappingEntry>;
    }
    return {};
  }

  extEntries(): [string, MappingEntry][] {
    const out: [string, MappingEntry][] = [];
    for (const [ext, value] of Object.entries(this.extSection())) {
      const entry = normalizeEntry(value);
      if (entry) out.push([ext, entry]);
    }
    return out.sort((a, b) => a[0].localeCompare(b[0]));
  }

  getExt(ext: string): MappingEntry | null {
    const section = this.extSection();
    const direct = normalizeEntry(section[ext]);
    if (direct) return direct;
    const norm = normalizeExt(ext);
    return norm && norm !== ext ? normalizeEntry(section[norm]) : null;
  }

  async setExt(ext: string, entry: MappingEntry): Promise<void> {
    const key = normalizeExt(ext) ?? ext;
    if (!isSafeKey(key)) return;
    const clean: MappingEntry = { icon: entry.icon };
    if (entry.color) clean.color = entry.color;
    if (entry.size) clean.size = entry.size;
    if (entry.iconDark) clean.iconDark = entry.iconDark;
    const section = this.extSection();
    section[key] = clean.color || clean.size || clean.iconDark ? clean : clean.icon;
    this.data[EXT_KEY] = section as unknown as MappingEntry;
    await this.save();
  }

  async removeExt(ext: string): Promise<void> {
    const section = this.extSection();
    const target = ext.replace(/^\.+/, "").toLowerCase();
    let changed = false;
    for (const key of Object.keys(section)) {
      if (!isSafeKey(key)) continue;
      if (key.replace(/^\.+/, "").toLowerCase() === target) {
        delete section[key];
        changed = true;
      }
    }
    if (changed) {
      if (Object.keys(section).length === 0) delete this.data[EXT_KEY];
      else this.data[EXT_KEY] = section as unknown as MappingEntry;
      await this.save();
    }
  }

  /**
   * Rangfolge: direkter Pfad, dann Dateityp als Rückfall.
   * Nur für Dateien, Ordner fallen nie unter Dateityp.
   * Bekannte Datei mitgeben spart den zweiten Vault Zugriff.
   */
  resolve(path: string, knownFile?: TAbstractFile | null): MappingEntry | null {
    const direct = this.get(path);
    if (direct) return direct;
    const file =
      knownFile !== undefined
        ? knownFile
        : this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return null;
    const ext = file.extension.trim().toLowerCase();
    if (!ext) return null;
    return this.getExt(ext);
  }

  private static cleanEntry(entry: MappingEntry): MappingEntry {
    const clean: MappingEntry = { icon: entry.icon };
    if (entry.color) clean.color = entry.color;
    if (entry.size) clean.size = entry.size;
    if (entry.iconDark) clean.iconDark = entry.iconDark;
    return clean;
  }

  private static asStored(entry: MappingEntry): string | MappingEntry {
    const clean = MappingStore.cleanEntry(entry);
    return clean.color || clean.size || clean.iconDark ? clean : clean.icon;
  }

  async set(path: string, entry: MappingEntry): Promise<void> {
    if (!isSafeKey(path)) return;
    this.data[path] = MappingStore.asStored(entry);
    await this.save();
  }

  /** Mehrere Pfade mit nur einem Schreibvorgang, ohne Wettlauf. */
  async setMany(items: [string, MappingEntry][]): Promise<void> {
    const clean = items.filter(([path]) => isSafeKey(path));
    if (clean.length === 0) return;
    for (const [path, entry] of clean) {
      this.data[path] = MappingStore.asStored(entry);
    }
    await this.save();
  }

  async remove(path: string): Promise<void> {
    if (!isSafeKey(path)) return;
    if (path in this.data) {
      delete this.data[path];
      await this.save();
    }
  }

  /** Mehrere Pfade mit nur einem Schreibvorgang, ohne Wettlauf. */
  async removeMany(paths: string[]): Promise<void> {
    let changed = false;
    for (const path of paths) {
      if (!isSafeKey(path)) continue;
      if (path in this.data) {
        delete this.data[path];
        changed = true;
      }
    }
    if (changed) await this.save();
  }

  /** Ordner Umbenennung zieht Kinder mit um. */
  migrateRename(oldPath: string, newPath: string, isFolder: boolean): boolean {
    if (oldPath === EXT_KEY || !isSafeKey(oldPath) || !isSafeKey(newPath)) {
      return false;
    }
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
    if (changed) void this.save();
    return changed;
  }

  removePath(path: string, isFolder: boolean): boolean {
    if (path === EXT_KEY || !isSafeKey(path)) return false;
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
    if (changed) void this.save();
    return changed;
  }

  private save(): Promise<void> {
    const run = this.saveQueue.then(() => this.writeFile());
    this.saveQueue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }

  /** Offene Saves abwarten, Best Effort beim Entladen. */
  async flush(): Promise<void> {
    await this.saveQueue;
  }

  private async writeFile(): Promise<void> {
    const path = this.mappingPath();
    const content = JSON.stringify(this.data, null, 2) + "\n";
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
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
}
