# Lizenzen der mitgelieferten Fremdinhalte

M.O.I. selbst steht unter der MIT-Lizenz, siehe [LICENSE](LICENSE). Diese Datei führt
auf, was an fremden Daten und Icons im Repository steckt.

Zur Übersicht: Lucide ist **nicht** mitgeliefert. Das Plugin ruft nur die Icon-Liste von
Obsidian ab, die Lucide-Symbole kommen von Obsidian selbst. Deshalb steht Lucide hier nicht.

## selfh.st Icons

- Dateien: `selfhost-catalog.ts` (etwa 2450 Einträge aus `index.json`),
  `starter-icons/dockhand.svg`, `starter-icons/technitium.svg`, `starter-icons/adguard-home.svg`
- Lizenz: Creative Commons Attribution 4.0 International (CC-BY-4.0)
- Namensnennung: selfh.st, <https://selfh.st/icons>
- Lizenztext: <https://github.com/selfhst/icons/blob/main/LICENSE>

CC-BY-4.0 verlangt eine Namensnennung. Sie steht hier und am Ende der README, das ist die
geforderte Angabe. Marken und Logos gehören ihren jeweiligen Inhabern und dienen nur der
eigenen Zuordnung in der Dokumentation.

## Devicon

- Dateien: `cdn-catalog.ts` (Namen und Tags aus `devicon.json`),
  `starter-icons/devicon/` (30 Symbole)
- Lizenz: MIT
- Copyright: Copyright (c) 2015 konpa
- Lizenztext: <https://github.com/devicons/devicon/blob/master/LICENSE>

## Simple Icons

- Dateien: `starter-icons/simple/` (10 Symbole)
- Lizenz: CC0 1.0 Universal (Public Domain Dedication)
- Lizenztext: <https://github.com/simple-icons/simple-icons/blob/develop/LICENSE.md>

CC0 verlangt keine Namensnennung, sie wird hier der Vollständigkeit halber genannt.

## Erzeugt, nicht von Hand

`cdn-catalog.ts` und `selfhost-catalog.ts` sind Generateureignisse von
`python3 scripts/fetch-icons.py` und tragen im Kopf einen Hinweis darauf. Sie nicht von Hand
pflegen, sondern neu erzeugen:

```
npm run fetch-icons
```

Der Inhalt stammt von den Quellen oben und ändert sich mit deren Veröffentlichungen, nicht
mit diesem Repository.