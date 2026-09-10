import { getLanguage } from "obsidian";

/** Slogan je Sprache, alle anderen Sprachen fallen auf Englisch zurück. */
const SLOGANS: Record<string, string> = {
  en: "Local, lightweight, yours.",
  de: "Lokal, leicht, deins.",
  fr: "Local, léger, à vous.",
  es: "Local, ligero, tuyo.",
};

/** Alle UI Texte. Deutsch wie bisher, Englisch neu. */
const STRINGS: Record<string, Record<string, string>> = {
  de: {
    "cmd.reload": "Icons neu laden",
    "cmd.gallery": "Icon Galerie öffnen",
    "cmd.check": "Icons prüfen",
    "cmd.export": "Icons exportieren",
    "cmd.import": "Icons importieren",
    "cmd.pickActive": "Icon für aktive Datei wählen",
    "cmd.insert": "Icon in Notiz einfügen",

    "menu.change": "Icon ändern",
    "menu.remove": "Icon entfernen",
    "menu.changeMany": "Icons ändern ({count})",
    "menu.removeMany": "Icons entfernen ({count})",
    "menu.insert": "Icon einfügen",

    "notice.iconSaveFailed": "Icon konnte nicht gespeichert werden",
    "notice.iconsSaveFailed": "Icons konnten nicht gespeichert werden",
    "notice.iconsRemoveFailed": "Icons konnten nicht entfernt werden",
    "notice.onlySvg": "Nur SVG Referenzen lassen sich speichern",
    "notice.notInCache": "Icon nicht im Cache, bitte erneut wählen",
    "notice.fileExists": "Datei existiert bereits",
    "notice.fileSaveFailed": "Datei konnte nicht gespeichert werden",
    "notice.saved": "Gespeichert: {path}",
    "notice.invalidExt": "Ungültige Endung",
    "notice.conflict":
      "{names} ist auch aktiv und verändert Explorer Icons, es kann zu Überschneidungen kommen.",
    "notice.checkOk": "Icons ok: {used} vergeben, {unused} ungenutzt",

    "cat.devicon": "Devicon: {value}",
    "cat.simple": "Simple: {value}",
    "cat.selfhost": "Self-Hosted: {value}",
    "cat.builtinVersion": "eingebaut (v2.17.0)",
    "cat.builtinCurated": "eingebaut (kuratiert)",
    "cat.builtinDate": "eingebaut ({date})",
    "cat.off": "CDN aus, nur Dateien und Lucide.",

    "set.iconFolder.name": "Icon Ordner",
    "set.iconFolder.desc": "Pfad im Vault, ohne führenden Schrägstrich.",
    "set.mappingFile.name": "Mapping Datei",
    "set.mappingFile.desc":
      "Zuordnung Explorer Pfad auf Icon, als JSON im Vault.",
    "set.ext.name": "Dateityp Icons",
    "set.ext.desc":
      "Rückfall pro Endung nach Pfad und Frontmatter. Start leer.",
    "set.ext.change": "Ändern",
    "set.ext.add.name": "Endung hinzufügen",
    "set.ext.add.desc": "Ohne Punkt, z.B. md.",
    "set.ext.pick": "Wählen",
    "set.cdn.name": "CDN Nachladen",
    "set.cdn.desc":
      "Fehlende Devicon und Simple Icons von jsdelivr laden und auf diesem Gerät cachen. Teilt sich den Cache mit Self-Hosted.",
    "set.selfhost.name": "Self-Hosted Icons",
    "set.selfhost.desc":
      "Homelab Marken von selfh.st per CDN, CC-BY-4.0 mit Namensnennung in der README.",
    "set.stand.name": "Katalog Stand",
    "set.stand.reload": "Neu laden",
    "set.cache.name": "Icon Cache",
    "set.cache.count": "{count} Icons auf diesem Gerät.",
    "set.cache.clear": "Leeren",
    "set.autoLight.name": "Helle Variante automatisch",
    "set.autoLight.desc":
      "Im dunklen Theme die helle Self-Hosted Variante nehmen wenn vorhanden. Hand Wahl gewinnt.",
    "set.tabs.name": "Tab Icons",
    "set.tabs.desc": "Mapping und Frontmatter Icons in der Tableiste zeigen.",
    "set.titles.name": "Titel Icons",
    "set.titles.desc":
      "Mapping und Frontmatter Icons vor dem Notiz Titel zeigen.",
    "set.export.name": "Paket exportieren",
    "set.export.desc": "Mapping plus genutzte Icons als Datei für Zweit Vaults.",
    "set.export.btn": "Exportieren",
    "set.import.name": "Paket importieren",
    "set.import.desc":
      "icons-export.json einlesen und Icons nach _assets/icons schreiben.",
    "set.import.btn": "Importieren",

    "pick.title": "Icon wählen",
    "pick.search.name": "Suchen",
    "pick.search.ph": "Name tippen …",
    "pick.size.name": "Größe (optional)",
    "pick.size.desc": "Leer lassen für Standard, Zahl gilt als Pixel.",
    "pick.size.ph": "1.4em oder 20",
    "pick.color": "Farbe",
    "pick.colorOff": "Aus",
    "pick.colorDefault": "Standard",
    "pick.colorNoneTip": "Keine Farbe, Standard verwenden",
    "pick.colorFree": "Freie Farbe wählen",
    "pick.hex": "Hex Wert",
    "pick.cancel": "Abbrechen",
    "pick.saveFile": "Als Datei speichern",
    "pick.apply": "Übernehmen",
    "pick.dark": "Dark-Icon wählen",
    "pick.darkTip":
      "Icon für den Dark Mode festlegen: danach ein Icon aus der Liste anklicken, es wird nur im dunklen Theme gezeigt.",
    "pick.darkCancel": "Auswahl abbrechen",
    "pick.darkHint":
      "Jetzt ein Icon aus der Liste anklicken → wird Dark-Mode-Icon",
    "pick.darkValue": "Dark Mode: {value}",
    "pick.darkSame": "Dark Mode: wie helles Icon",
    "pick.none": "Nichts gefunden",
    "pick.more": "… {count} weitere, Suche einschränken",
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
    "color.green": "Grün",
    "color.cyan": "Türkis",
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
    "gal.more": "… {count} weitere",
    "gal.dark": "dunkel: {value}",

    "check.title": "Icons prüfen",
    "check.summary": "{used} vergeben, {unused} ungenutzt, {broken} defekt",

    "ex.abort": "Export abgebrochen: {path} existiert bereits",
    "ex.done": "Exportiert: {path}",
    "ex.tooBig": "Import fehlgeschlagen: Datei zu groß",
    "ex.invalid": "Import fehlgeschlagen: keine gültige Datei",
    "ex.writeErr": "Import abgebrochen: Schreibfehler, Teilstand bleibt",
    "ex.imported":
      "Importiert: {entries} Einträge, {files} Dateien ({skipped} übersprungen)",
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
    "notice.conflict":
      "{names} is active too and modifies explorer icons, overlaps may occur.",
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
    "set.mappingFile.desc":
      "Maps explorer paths to icons, stored as JSON in the vault.",
    "set.ext.name": "File type icons",
    "set.ext.desc":
      "Fallback per extension, after path and frontmatter. Starts empty.",
    "set.ext.change": "Change",
    "set.ext.add.name": "Add extension",
    "set.ext.add.desc": "Without dot, e.g. md.",
    "set.ext.pick": "Pick",
    "set.cdn.name": "Load from CDN",
    "set.cdn.desc":
      "Fetch missing Devicon and Simple icons from jsdelivr and cache them on this device. Shares the cache with self-hosted.",
    "set.selfhost.name": "Self-hosted icons",
    "set.selfhost.desc":
      "Homelab brands from selfh.st via CDN, CC-BY-4.0, credit in the README.",
    "set.stand.name": "Catalog version",
    "set.stand.reload": "Reload",
    "set.cache.name": "Icon cache",
    "set.cache.count": "{count} icons on this device.",
    "set.cache.clear": "Clear",
    "set.autoLight.name": "Automatic light variant",
    "set.autoLight.desc":
      "In dark mode use the light self-hosted variant when available. A manual choice always wins.",
    "set.tabs.name": "Tab icons",
    "set.tabs.desc": "Show mapping and frontmatter icons in the tab bar.",
    "set.titles.name": "Title icons",
    "set.titles.desc":
      "Show mapping and frontmatter icons in front of the note title.",
    "set.export.name": "Export package",
    "set.export.desc": "Mapping plus used icons as a file for second vaults.",
    "set.export.btn": "Export",
    "set.import.name": "Import package",
    "set.import.desc":
      "Read icons-export.json and write icons to _assets/icons.",
    "set.import.btn": "Import",

    "pick.title": "Choose icon",
    "pick.search.name": "Search",
    "pick.search.ph": "Type a name …",
    "pick.size.name": "Size (optional)",
    "pick.size.desc": "Leave empty for default, a plain number counts as pixels.",
    "pick.size.ph": "1.4em or 20",
    "pick.color": "Color",
    "pick.colorOff": "Off",
    "pick.colorNoneTip": "No color, use default",
    "pick.colorFree": "Pick a custom color",
    "pick.hex": "Hex value",
    "pick.cancel": "Cancel",
    "pick.saveFile": "Save as file",
    "pick.apply": "Apply",
    "pick.dark": "Choose dark icon",
    "pick.darkTip":
      "Set an icon for dark mode: then click an icon in the list, it shows only in the dark theme.",
    "pick.darkCancel": "Cancel selection",
    "pick.darkHint": "Now click an icon in the list → becomes the dark mode icon",
    "pick.darkValue": "Dark mode: {value}",
    "pick.darkSame": "Dark mode: same as light icon",
    "pick.none": "Nothing found",
    "pick.more": "… {count} more, narrow the search",
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
    "gal.more": "… {count} more",
    "gal.dark": "dark: {value}",

    "check.title": "Check icons",
    "check.summary": "{used} assigned, {unused} unused, {broken} broken",

    "ex.abort": "Export cancelled: {path} already exists",
    "ex.done": "Exported: {path}",
    "ex.tooBig": "Import failed: file too large",
    "ex.invalid": "Import failed: not a valid file",
    "ex.writeErr": "Import aborted: write error, partial state remains",
    "ex.imported":
      "Imported: {entries} entries, {files} files ({skipped} skipped)",
  },
};

/**
 * ISO Code der eingestellten App Sprache, ohne Regionsanteil.
 * Ältere Obsidian Versionen kennen getLanguage nicht, dann gilt Englisch.
 */
export function currentLanguage(): string {
  try {
    if (typeof getLanguage !== "function") return "en";
    const raw = getLanguage();
    if (typeof raw !== "string" || raw.length === 0) return "en";
    return raw.toLowerCase().split("-")[0];
  } catch {
    return "en";
  }
}

/** Slogan in der Sprache der App. */
export function slogan(): string {
  return SLOGANS[currentLanguage()] ?? SLOGANS.en;
}

/** UI Text in der Sprache der App, Platzhalter als {name}. */
export function t(key: string, vars?: Record<string, string | number>): string {
  const lang = currentLanguage();
  const table = STRINGS[lang] ?? STRINGS.en;
  let out = table[key] ?? STRINGS.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.split(`{${name}}`).join(String(value));
    }
  }
  return out;
}

/** Anzeigename einer Theme Farbe. */
export function colorName(name: string): string {
  return t(`color.${name}`);
}
