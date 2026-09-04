# Inline SVG Icons

Eigene SVGs, Devicon, Simple Icons und Lucide in Notizen und im Datei Explorer. Ohne Laufzeitabhängigkeiten.

## Shortcode in Notizen

```
{{icon:name}}
{{icon:devicon/proxmox}}
{{icon:simple/homeassistant}}
{{icon:lucide:server}}
{{icon:name|24}}
{{icon:name|1.5em}}
```

Der Standardordner ist `_assets/icons` und lässt sich in den Einstellungen ändern. Ohne Größenangabe gilt 1em, eine Zahl ohne Einheit gilt als Pixel. `lucide:` nutzt die eingebauten Obsidian Icons, ganz ohne Datei.

Fehlt eine Datei, zeigt das Plugin `[name]` mit Tooltip und schreibt eine Warnung in die Konsole.

## Explorer Icons per Rechtsklick

Rechtsklick auf Datei oder Ordner, dann Change icon. Der Dialog zeigt Suche mit Vorschau über eigene SVGs, Devicon, Simple und Lucide. Danach eine Farbreihe mit neun Theme Farben wie bei Iconic, dazu keine und ein freier Hex Wähler. Remove icon löscht die Zuordnung. Mehrfachauswahl bekommt dasselbe Icon auf einmal.

Gespeichert wird in `_assets/icon-mapping.json` im Vault, zum Beispiel:

```json
{
  "Homelab/proxmox.md": { "icon": "devicon/proxmox" },
  "Homelab": { "icon": "simple/homeassistant", "color": "blue" }
}
```

Die Kurzform `"Pfad": "devicon/docker"` ohne Farbe bleibt gültig. Umbenennen und Löschen pflegt die Datei mit, inklusive Kindern bei Ordnern.

Marken Icons unter devicon und simple behalten ihre Originalfarben, die Farbwahl greift dort nicht. Eigene SVGs und Lucide folgen der gewählten Farbe über currentColor.

## Starter Icons

In `starter-icons/` liegen 30 Devicon Homelab Icons, 10 Simple Icons Marken und das Dockhand Logo als Grundstock. Inhalt nach `_assets/icons/` in den Vault kopieren, dann gilt zum Beispiel {{icon:dockhand}}. Erzeugt mit `python3 scripts/fetch-icons.py`.

Lizenzen: Devicon steht unter MIT, Simple Icons unter CC0, Lucide unter ISC. Marken und Logos gehören den jeweiligen Eigentümern und dienen nur der Kennzeichnung in der eigenen Doku.

## Install

1. `npm install --legacy-peer-deps`
2. `npm run build`
3. Ordner mit `manifest.json`, `main.js` und `styles.css` nach `<Vault>/.obsidian/plugins/inline-svg-icons/` kopieren
4. Plugin in Obsidian aktivieren
