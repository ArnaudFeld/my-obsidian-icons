import { App, Notice, TFile } from "obsidian";
import { IconStore, normalizeSvgName, sanitizeSvg } from "./icons";
import { EXT_KEY, IconMapping, MappingEntry, MappingStore, normalizeEntry, normalizeExt } from "./mapping";

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

async function collectFiles(
  app: App,
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
  app: App,
  store: IconStore,
  mapping: MappingStore,
): Promise<IconPackage> {
  const entries = mapping.entries();
  const ext = mapping.extEntries();
  const refs: string[] = [];
  for (const [, entry] of [...entries, ...ext]) refs.push(...refsOf(entry));
  const fullMapping: IconMapping = Object.fromEntries(entries);
  if (ext.length > 0) {
    fullMapping[EXT_KEY] = Object.fromEntries(ext) as unknown as MappingEntry;
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    mapping: fullMapping,
    files: await collectFiles(app, store, refs),
  };
}

export async function exportIcons(
  app: App,
  store: IconStore,
  mapping: MappingStore,
): Promise<void> {
  const pkg = await buildPackage(app, store, mapping);
  const stamp = new Date().toISOString().slice(0, 10);
  const path = `icons-export-${stamp}.json`;
  if (app.vault.getAbstractFileByPath(path) instanceof TFile) {
    new Notice(`Export abgebrochen: ${path} existiert bereits`);
    return;
  }
  await app.vault.create(path, JSON.stringify(pkg, null, 2));
  new Notice(`Exportiert: ${path}`);
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
export function importIcons(
  app: App,
  store: IconStore,
  mapping: MappingStore,
  getFolder: () => string,
  onDone: () => void,
): void {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    void (async () => {
      try {
        const pkg: unknown = JSON.parse(await file.text());
        if (!isPackage(pkg)) {
          new Notice("Import fehlgeschlagen: keine gültige Datei");
          return;
        }
        const folder = getFolder().trim().replace(/^\/+/, "").replace(/\/+$/, "");
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
        let entries = 0;
        for (const [path, value] of Object.entries(pkg.mapping)) {
          if (path === EXT_KEY) continue;
          if (path.includes("..") || path.startsWith("/")) continue;
          const entry = normalizeEntry(value as string | MappingEntry);
          if (!entry) continue;
          await mapping.set(path, entry);
          entries++;
        }
        const extSection: unknown = pkg.mapping[EXT_KEY];
        if (extSection && typeof extSection === "object" && !Array.isArray(extSection)) {
          for (const [raw, value] of Object.entries(
            extSection as Record<string, string | MappingEntry>,
          )) {
            const ext = normalizeExt(raw);
            const entry = normalizeEntry(value);
            if (!ext || !entry) continue;
            await mapping.setExt(ext, entry);
            entries++;
          }
        }
        store.clear();
        onDone();
        new Notice(
          `Importiert: ${entries} Einträge, ${written} Dateien (${skipped} übersprungen)`,
        );
      } catch {
        new Notice("Import fehlgeschlagen: keine gültige Datei");
      }
    })();
  };
  input.click();
}
