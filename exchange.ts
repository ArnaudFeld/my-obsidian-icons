import { App, Notice, TFile } from "obsidian";
import {
  IconStore,
  normalizeSvgName,
  parseIconRef,
  sanitizeSvg,
} from "./icons";
import {
  EXT_KEY,
  IconMapping,
  MappingEntry,
  MappingStore,
  normalizeEntry,
  normalizeExt,
} from "./mapping";
import { t } from "./i18n";

export interface IconPackage {
  version: 1;
  exportedAt: string;
  mapping: IconMapping;
  files: Record<string, string>;
}

/** Einzelne Import Datei, schützt vor Vault Bloat durch Riesen Pakete. */
export const MAX_IMPORT_FILE_BYTES = 500_000;
/** Gesamt Paket, schützt vor vielen fast großen Dateien. */
export const MAX_IMPORT_TOTAL_BYTES = 10_000_000;
export const MAX_IMPORT_FILES = 500;
/** Mapping Einträge Obergrenze, schützt die Mapping Datei vor Bloat. */
export const MAX_IMPORT_ENTRIES = 5000;

async function collectFiles(
  store: IconStore,
  refs: string[],
): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  for (const raw of refs) {
    const name = normalizeSvgName(raw);
    if (!name || name in files) continue;
    const svg = await store.getSvg(name);
    if (svg) files[name] = svg;
  }
  return files;
}

function refsOf(entry: MappingEntry): string[] {
  const refs = [entry.icon];
  if (entry.iconDark) refs.push(entry.iconDark);
  return refs;
}

/** Mapping plus genutzte SVG Dateien als Paket für Zweit Vaults. */
export async function buildPackage(
  store: IconStore,
  mapping: MappingStore,
): Promise<IconPackage> {
  const entries = mapping.entries();
  const ext = mapping.extEntries();
  const refs: string[] = [];
  for (const [, entry] of [...entries, ...ext]) refs.push(...refsOf(entry));
  const fullMapping: IconMapping = {};
  for (const [path, entry] of entries) fullMapping[path] = entry;
  if (ext.length > 0) {
    // Zur Laufzeit ist die Dateityp-Sektion eine Map Endung -> Eintrag.
    // IconMapping erlaubt an der Wertposition nur string | MappingEntry,
    // deshalb der Cast. Das Object.fromEntries davor war die Quelle der
    // untypisierten Zuweisung, die Loop ersetzt es ohne any.
    const extSection: Record<string, MappingEntry> = {};
    for (const [extName, entry] of ext) extSection[extName] = entry;
    fullMapping[EXT_KEY] = extSection as unknown as MappingEntry;
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    mapping: fullMapping,
    files: await collectFiles(store, refs),
  };
}

/** Freier Dateiname am Stempel, notfalls mit -2, -3 für den zweiten Export. */
export function freeExportName(
  taken: (path: string) => boolean,
  stamp: string,
): string {
  const base = `icons-export-${stamp}`;
  let path = `${base}.json`;
  let n = 2;
  while (taken(path)) {
    path = `${base}-${n}.json`;
    n++;
  }
  return path;
}

export async function exportIcons(
  app: App,
  store: IconStore,
  mapping: MappingStore,
): Promise<void> {
  const pkg = await buildPackage(store, mapping);
  const stamp = new Date().toISOString().slice(0, 10);
  const path = freeExportName(
    (p) => app.vault.getAbstractFileByPath(p) instanceof TFile,
    stamp,
  );
  await app.vault.create(path, JSON.stringify(pkg, null, 2));
  new Notice(t("ex.done", { path }));
}

function isPackage(value: unknown): value is IconPackage {
  if (!value || typeof value !== "object") return false;
  const pkg = value as Record<string, unknown>;
  return (
    pkg.version === 1 &&
    typeof pkg.mapping === "object" &&
    pkg.mapping !== null &&
    typeof pkg.files === "object" &&
    pkg.files !== null
  );
}

/**
 * Paket einlesen: SVG Dateien nach _assets/icons schreiben,
 * vorhandene bleiben, Mapping Einträge übernehmen.
 */
export interface ImportEntryResult {
  pathItems: [string, MappingEntry][];
  extItems: [string, MappingEntry][];
  entries: number;
  skipped: number;
}

/** Mapping Anteil eines Pakets filtern, rein und damit testbar. */
export function collectImportEntries(
  mapping: IconMapping,
  maxEntries: number,
): ImportEntryResult {
  let entries = 0;
  let skipped = 0;
  const pathItems: [string, MappingEntry][] = [];
  for (const [path, value] of Object.entries(mapping)) {
    if (path === EXT_KEY) continue;
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
  const extItems: [string, MappingEntry][] = [];
  const extSection: unknown = mapping[EXT_KEY];
  if (
    extSection &&
    typeof extSection === "object" &&
    !Array.isArray(extSection)
  ) {
    for (const [raw, value] of Object.entries(
      extSection as Record<string, string | MappingEntry>,
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

export function importIcons(
  app: App,
  store: IconStore,
  mapping: MappingStore,
  getFolder: () => string,
  onDone: () => void,
): void {
  const input = createEl("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    void (async () => {
      if (file.size > MAX_IMPORT_TOTAL_BYTES) {
        new Notice(t("ex.tooBig"));
        return;
      }
      let pkg: unknown;
      try {
        pkg = JSON.parse(await file.text());
      } catch {
        new Notice(t("ex.invalid"));
        return;
      }
      if (!isPackage(pkg)) {
        new Notice(t("ex.invalid"));
        return;
      }
      try {
        const folder = getFolder()
          .trim()
          .replace(/^\/+/, "")
          .replace(/\/+$/, "");
        let written = 0;
        let skipped = 0;
        let writtenBytes = 0;
        for (const [raw, svg] of Object.entries(pkg.files)) {
          const name = normalizeSvgName(raw);
          if (
            !name ||
            typeof svg !== "string" ||
            !svg.includes("<svg") ||
            svg.length > MAX_IMPORT_FILE_BYTES ||
            written >= MAX_IMPORT_FILES ||
            writtenBytes + svg.length > MAX_IMPORT_TOTAL_BYTES
          ) {
            skipped++;
            continue;
          }
          // Die Bereinigung kann alles entfernen, etwa ein reines Script oder
          // ein fremdes Fragment. Dann keine leere Datei in den Vault schreiben.
          const clean = sanitizeSvg(svg);
          if (!clean.includes("<svg")) {
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
          await app.vault.create(path, clean);
          written++;
          writtenBytes += clean.length;
        }
        const {
          pathItems,
          extItems,
          entries,
          skipped: entrySkipped,
        } = collectImportEntries(pkg.mapping, MAX_IMPORT_ENTRIES);
        skipped += entrySkipped;
        await mapping.importAll(pathItems, extItems);
        store.clear();
        onDone();
        new Notice(t("ex.imported", { entries, files: written, skipped }));
      } catch {
        new Notice(t("ex.writeErr"));
      }
    })();
  };
  input.click();
}
