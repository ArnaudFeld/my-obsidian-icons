import { App, TFile } from "obsidian";
import { normalizeFolder } from "./icons";

export interface MappingEntry {
  icon: string;
  color?: string;
}

export type IconMapping = Record<string, string | MappingEntry>;

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
    if (value.color && value.color.trim()) entry.color = value.color.trim();
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
    this.data = {};
    try {
      const file = this.app.vault.getAbstractFileByPath(this.mappingPath());
      if (!(file instanceof TFile)) return;
      const raw = await this.app.vault.read(file);
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        this.data = parsed as IconMapping;
      }
    } catch {
      console.warn("[inline-svg-icons] Mapping Datei ungültig, leer gestartet");
    }
  }

  get(path: string): MappingEntry | null {
    return normalizeEntry(this.data[path]);
  }

  async set(path: string, entry: MappingEntry): Promise<void> {
    this.data[path] = entry.color ? { icon: entry.icon, color: entry.color } : entry.icon;
    await this.save();
  }

  async remove(path: string): Promise<void> {
    if (path in this.data) {
      delete this.data[path];
      await this.save();
    }
  }

  /** Ordner Umbenennung zieht Kinder mit um. */
  migrateRename(oldPath: string, newPath: string, isFolder: boolean): boolean {
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

  private async save(): Promise<void> {
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
