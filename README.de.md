# M.O.I. – My Obsidian Icons

English: [README.md](README.md)

Der Slogan erscheint im Einstellungs-Tab in der Sprache von Obsidian: *Local, lightweight, yours.* (de *Lokal, leicht, deins.*, fr *Local, léger, à vous.*, es *Local, ligero, tuyo.*). Alle weiteren Sprachen bekommen die englische Fassung.

Eigene SVGs, Devicon, Simple Icons und Lucide in Notizen und im Datei Explorer. Ohne Laufzeitabhängigkeiten.

## Shortcode in Notizen

```
{{icon:name}}
{{icon:devicon/proxmox}}
{{icon:simple/homeassistant}}
{{icon:lucide:server}}
{{icon:name|24}}
{{icon:name|1.5em}}
{{icon:name|red}}
{{icon:name|24|blue}}
{{icon:name|dark:simple/docker}}
{{icon:emoji:📁}}
```

Der Standardordner ist `_assets/icons` und lässt sich in den Einstellungen ändern. Ohne Größenangabe gilt 1em, eine Zahl ohne Einheit gilt als Pixel. Zweiter bis vierter Teil in beliebiger Reihenfolge: Größe, Farbe als Theme Name oder CSS Farbe, oder dunkle Variante mit `dark:`. `lucide:` nutzt die eingebauten Obsidian Icons, ganz ohne Datei. `emoji:` zeigt ein Emoji Zeichen, ebenfalls ohne Datei. Beim Tippen von `{{icon:` schlägt das Plugin Namen mit Vorschau vor, Devicon Suche versteht zusätzlich Tags wie database.

Fehlt eine Datei, zeigt das Plugin `[name]` mit Tooltip und schreibt eine Warnung in die Konsole.

## Explorer Icons per Rechtsklick

Rechtsklick auf Datei oder Ordner, dann Icon ändern. Im Picker lassen sich Farbe und optionale Größe je Eintrag setzen, zum Beispiel Homelab auf 1.4em. Das geht auch per Rechtsklick in der geöffneten Notiz. Der Befehl Icon für aktive Datei wählen öffnet denselben Dialog und lässt sich unter Einstellungen, Hotkeys mit einem Kürzel belegen. Wer den Shortcode in den Text schreiben will, nimmt Rechtsklick, Icon einfügen oder den Befehl Icon in Notiz einfügen, ebenfalls mit Kürzel belegbar. Der Dialog zeigt Suche mit Vorschau über eigene SVGs, Devicon, Simple und Lucide. Danach eine Farbreihe mit neun Theme Farben wie bei Iconic, dazu keine und ein freier Hex Wähler. Icon entfernen löscht die Zuordnung. Mehrfachauswahl bekommt dasselbe Icon auf einmal.
Gespeichert wird in `_assets/icon-mapping.json` im Vault, zum Beispiel:

```json
{
  "Homelab/proxmox.md": { "icon": "devicon/proxmox" },
  "Homelab": { "icon": "simple/homeassistant", "color": "blue", "iconDark": "simple/homeassistant" }
}
```

Die Kurzform `"Pfad": "devicon/docker"` ohne Farbe bleibt gültig. Umbenennen und Löschen pflegt die Datei mit, inklusive Kindern bei Ordnern. `iconDark` nennt eine Variante für das dunkle Theme, im Shortcode geht das als `{{icon:name|dark:simple/docker}}`.

## Dateityp Icons

In den Einstellungen je Endung ein Icon als Rückfall nach Pfad und Frontmatter, zum Beispiel md auf lucide:file-text. Start leer, Endung ohne Punkt. Gilt für Explorer, Tabs und Titel, Ordner fallen nie darunter. Gespeichert unter `__ext__` in derselben Mapping Datei, Export und Galerie kennen den Bereich.

## Tabs, Titel und Frontmatter

Tableiste und Notiz Titel zeigen dasselbe Icon aus Mapping oder Frontmatter, je Bereich abschaltbar. Im Frontmatter gelten `icon`, `iconColor`, `iconSize` und `iconDark`, Frontmatter gewinnt gegen Mapping. Beim Bearbeiten der Quelle schlägt das Plugin Werte für `icon`, `iconColor` und `iconDark` vor.

## Export und Import

Die Befehle Icons exportieren und Icons importieren sowie die Knöpfe in den Einstellungen packen Mapping plus genutzte SVGs in eine `icons-export-YYYY-MM-DD.json` im Vault oder lesen sie ein. Vorhandene Dateien bleiben beim Import stehen, Dateien über 500 KB sowie mehr als 10 MB oder 500 Dateien pro Paket werden übersprungen, ebenso mehr als 5000 Mapping Einträge.

Devicon Dateien mit genau einer Farbe werden bei gewählter Farbe umgefärbt, mehrfarbige und Verläufe behalten ihre Originalfarben. Das gilt auch für eigene SVGs und Simple Icons mit genau einer festen Farbe, zum Beispiel schwarze Pfade. Alles ohne feste Farbe folgt der gewählten Farbe über currentColor.

## CDN Nachladen

In den Einstellungen lässt sich CDN Nachladen einschalten. Fehlt ein devicon oder simple Icon als Datei, lädt das Plugin es von jsdelivr und cacht es auf dem Gerät, begrenzt auf 150 Einträge und 1,5 MB. Fehlschläge versucht es nach 5 Minuten neu. Die Namenslisten kommen live aus devicon.json, slugs.md und selfh.st index.json, mit eingebautem Rückfall und Stand Anzeige plus Neu laden Knopf. Im Picker stehen alle Namen mit Wolkensymbol, die Auswahl lädt bei Bedarf nach. Offline gilt der Cache weiter. Über Als Datei speichern landet ein CDN Icon als SVG in _assets/icons, zum Beispiel zum Bearbeiten oder für Git.

Eigener Schalter für Self-Hosted Icons von selfh.st als `selfhosted:name`, etwa 2.400 Homelab Marken mit Tags. Im dunklen Theme automatisch die helle Variante wenn vorhanden und Helle Variante automatisch an ist, eine von Hand gewählte Dunkel Variante gewinnt immer.

## Sync und Geräte

Der CDN Cache liegt in `data.json` und wird von Obsidian Sync mit synchronisiert, obwohl er pro Gerät gedacht ist. Bei geteilten Vaults also Größe und Traffic im Blick behalten, notfalls Icon Cache in den Einstellungen leeren.

Die Mapping Datei ist für Sync gemacht, aber ohne Zusammenführung: Setzen zwei Geräte gleichzeitig verschiedene Icons, gewinnt jeweils der letzte Schreibende. Konflikt Kopien liest das Plugin nicht. Wird die Mapping Datei bei laufendem Plugin gelöscht, bleibt der Speicher erhalten und schreibt sich beim nächsten Setzen neu.

## Picker Extras

Der Picker zeigt oben Favoriten und Zuletzt verwendet, jeweils nur wenn vorhanden. Der Stern in jeder Zeile heftet ein Icon an oder löst es wieder. Über Dark-Icon wählen lässt sich eine Variante für das dunkle Theme festlegen, danach ein Icon aus der Liste anklicken. Bei schlechter Lesbarkeit der gewählten Farbe auf dem Theme Hintergrund warnt der Picker. Beide Listen liegen pro Gerät in den Plugin Daten.

## Galerie und Konflikte

Der Befehl Icon Galerie öffnen listet alle vergebenen Icons mit Pfad und Entfernen Knopf sowie ungenutzte Dateien im Icon Ordner. Der Befehl Icons prüfen meldet Mapping Einträge ohne Ziel und zählt ungenutzte Dateien, ohne Netz. Der Befehl Icons neu laden liest Ordner und Caches neu ein. Ist Iconic, Iconize oder Icon Folder gleichzeitig aktiv, zeigt das Plugin einmal pro Sitzung einen Hinweis, da alle um dieselben DOM Stellen konkurrieren.

## Mobil

Alle Befehle laufen auf dem Handy. Zum Einfügen unterwegs lege unter Einstellungen, Symbolleiste einen Befehl wie Icon in Notiz einfügen auf die mobile Toolbar, Plugins können dort keine Knöpfe direkt anlegen. Rechtsklick heißt lange drücken.

## Sprache

Die Oberfläche richtet sich nach der Spracheinstellung von Obsidian und liegt auf Deutsch, Englisch, Französisch und Spanisch vor. Das betrifft Befehle, Kontextmenüs, den Einstellungs-Tab, den Picker, die Galerie und alle Meldungen. Der Slogan folgt derselben Sprache. Steht Obsidian auf einer anderen Sprache, greift Englisch.

Die Warnungen in der Entwicklerkonsole bleiben deutsch, das sind Meldungen für die Fehlersuche und keine Texte der Oberfläche. Diese Fassung ist die deutsche, die englische liegt in `README.md`.

## Starter Icons

In `starter-icons/` liegen 30 Devicon Homelab Icons, 10 Simple Icons Marken sowie Dockhand, Technitium und AdGuard Home als Grundstock. Inhalt nach `_assets/icons/` in den Vault kopieren, dann gilt zum Beispiel {{icon:dockhand}}. Erzeugt mit `python3 scripts/fetch-icons.py`.

Lizenzen: Devicon steht unter MIT, Simple Icons unter CC0, Lucide unter ISC, selfh.st Icons unter CC-BY-4.0 mit Namensnennung an selfh.st. Marken und Logos gehören den jeweiligen Eigentümern und dienen nur der Kennzeichnung in der eigenen Doku.

## Install

1. `npm install --legacy-peer-deps`
2. `npm run build`
3. Ordner mit `manifest.json`, `main.js` und `styles.css` nach `<Vault>/.obsidian/plugins/my-obsidian-icons/` kopieren
4. Plugin in Obsidian aktivieren
