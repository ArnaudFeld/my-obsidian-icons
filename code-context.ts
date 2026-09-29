/**
 * Erkennt, ob eine Stelle im Markdown-Quelltext zu Code gehört.
 *
 * Bewusst über den Dokumenttext und nicht über den Syntaxbaum von Obsidian:
 * Obsidian bringt seinen eigenen Markdown-Parser mit, und der taucht nicht in
 * der üblichen Lezer-Struktur auf. Ein Blick auf den Text ist hier verlässlich
 * und ohne CodeMirror-Import prüfbar.
 */

/** Nur das, was die Prüfung vom Dokument braucht. */
export interface LineSource {
  line(n: number): { number: number; text: string };
  lineAt(pos: number): { number: number; from: number; text: string };
}

/**
 * Zeile, die einen Block mit ``` oder ~~~ aufmacht. Bis zu drei Leerzeichen
 * davor sind erlaubt, alles danach ist Info-String und zählt nicht.
 *
 * Der Info-String einer Backtick-Marke darf selbst keine Backticks enthalten,
 * sonst ist die Zeile ein Inline-Abschnitt und keine Marke. Ohne diese Regel
 * verschiebt eine Zeile wie ```{{icon:x}}``` die Zählung aller folgenden Zeilen.
 */
export function isFenceLine(text: string): boolean {
  const m = /^\s{0,3}(`{3,}|~{3,})(.*)$/.exec(text);
  if (!m) return false;
  const fence = m[1] ?? "";
  const info = m[2] ?? "";
  if (fence.startsWith("`") && info.includes("`")) return false;
  return true;
}

/**
 * Liegt die Position in einem Inline-Code-Abschnitt derselben Zeile? Der
 * Backtick-Lauf vor der Position entscheidet, ein gleich langer Abschluss
 * beendet den Abschnitt. Ohne Abschluss bleibt er bis zum Zeilenende offen, weil
 * er sich erst in der folgenden Zeile schließen kann.
 */
export function insideInlineCode(line: string, posInLine: number): boolean {
  let open = 0;
  let i = 0;
  while (i < line.length && i < posInLine) {
    if (line[i] !== "`") {
      i++;
      continue;
    }
    let run = 0;
    while (line[i + run] === "`") run++;
    if (open === 0) open = run;
    else if (open === run) open = 0;
    i += run;
  }
  return open > 0;
}

/**
 * Gehört die Position zu Code, bleibt der Text stehen. Sonst würde ein Beispiel
 * für {{icon:…}} im Codeblock als Icon erscheinen, beim Tippen gleichermaßen
 * wie im Lesemodus.
 *
 * Zwei Regeln: ein offener Backtick-Lauf auf derselben Zeile, und eine ungerade
 * Anzahl Blockmarken oberhalb der Zeile.
 */
export function insideCode(doc: LineSource, pos: number): boolean {
  const line = doc.lineAt(pos);
  if (insideInlineCode(line.text, pos - line.from)) return true;
  let depth = 0;
  for (let n = 1; n < line.number; n++) {
    if (isFenceLine(doc.line(n).text)) depth++;
  }
  return depth % 2 === 1;
}
