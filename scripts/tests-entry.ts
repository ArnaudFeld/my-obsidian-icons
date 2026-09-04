import assert from "node:assert/strict";
import {
  normalizeSvgName,
  parseIconRef,
  parseSize,
  sanitizeSvg,
} from "../icons";
import { normalizeEntry, normalizeExt } from "../mapping";
import { pickVariant } from "../tabs-titles";

let count = 0;

function check(name: string, fn: () => void): void {
  fn();
  count++;
  console.log(`ok ${count} - ${name}`);
}

check("Datei ohne Ordner", () => {
  assert.deepEqual(parseIconRef("server"), { kind: "svg", name: "server" });
});

check("Datei mit Ordner und Endung", () => {
  assert.deepEqual(parseIconRef("devicon/proxmox.svg"), {
    kind: "svg",
    name: "devicon/proxmox",
  });
});

check("Führende Schrägstriche fallen weg", () => {
  assert.deepEqual(parseIconRef("/custom/logo"), {
    kind: "svg",
    name: "custom/logo",
  });
});

check("Pfad Tricks sind null", () => {
  assert.equal(parseIconRef(""), null);
  assert.equal(parseIconRef("../x"), null);
  assert.equal(parseIconRef("a b"), null);
});

check("Lucide Form", () => {
  assert.deepEqual(parseIconRef("lucide:folder"), {
    kind: "lucide",
    id: "folder",
  });
  assert.equal(parseIconRef("lucide:"), null);
  assert.equal(parseIconRef("lucide:a b"), null);
});

check("Emoji Form", () => {
  assert.deepEqual(parseIconRef("emoji:📁"), { kind: "emoji", char: "📁" });
  assert.equal(parseIconRef("emoji:"), null);
});

check("SVG Name Norm", () => {
  assert.equal(normalizeSvgName("x.svg"), "x");
  assert.equal(normalizeSvgName(".."), null);
});

check("Größe Norm", () => {
  assert.equal(parseSize("24"), "24px");
  assert.equal(parseSize("1.5em"), "1.5em");
  assert.equal(parseSize("red"), undefined);
  assert.equal(parseSize(""), undefined);
});

check("Eintrag Kurzform", () => {
  assert.deepEqual(normalizeEntry(" devicon/x "), { icon: "devicon/x" });
  assert.equal(normalizeEntry("  "), null);
  assert.equal(normalizeEntry(undefined), null);
});

check("Eintrag Langform wird geputzt", () => {
  assert.deepEqual(
    normalizeEntry({
      icon: " a ",
      color: " red ",
      size: "24",
      iconDark: "lucide:folder",
    }),
    { icon: "a", color: "red", size: "24px", iconDark: "lucide:folder" },
  );
});

check("Eintrag wirft Ungültiges weg", () => {
  assert.deepEqual(
    normalizeEntry({ icon: "a", size: "rot", iconDark: ".." }),
    { icon: "a" },
  );
});

check("Endung Norm", () => {
  assert.equal(normalizeExt("MD"), "md");
  assert.equal(normalizeExt(".md"), "md");
  assert.equal(normalizeExt("m d"), null);
  assert.equal(normalizeExt(""), null);
});

check("Variante hell bleibt", () => {
  assert.deepEqual(
    pickVariant({ icon: "a", color: "red", size: "16px" }, false),
    { icon: "a", color: "red", size: "16px" },
  );
});

check("Variante dunkel per Hand gewinnt", () => {
  assert.deepEqual(
    pickVariant({ icon: "a", iconDark: "lucide:folder" }, true),
    { icon: "lucide:folder" },
  );
});

check("Variante dunkel ungültig fällt zurück", () => {
  assert.deepEqual(pickVariant({ icon: "a", iconDark: ".." }, true), {
    icon: "a",
  });
});

check("Variante Self-Hosted hell automatisch", () => {
  const hasLight = (ref: string): boolean => ref === "technitium";
  assert.deepEqual(
    pickVariant({ icon: "selfhosted/technitium" }, true, hasLight, true),
    { icon: "selfhosted/technitium-light" },
  );
  assert.deepEqual(
    pickVariant({ icon: "selfhosted/technitium" }, true, hasLight, false),
    { icon: "selfhosted/technitium" },
  );
  assert.deepEqual(
    pickVariant({ icon: "selfhosted/anderes" }, true, hasLight, true),
    { icon: "selfhosted/anderes" },
  );
});

check("Sanitizer behält Harmloses", () => {
  const svg = '<svg viewBox="0 0 10 10"><path fill="red"/></svg>';
  assert.equal(sanitizeSvg(svg), svg);
});

check("Sanitizer entfernt Skript und Handler", () => {
  const out = sanitizeSvg(
    '<svg><script>alert(1)</script><path onload="x()" fill="red"/></svg>',
  );
  assert.ok(!out.includes("<script"));
  assert.ok(!out.includes("onload"));
  assert.ok(out.includes('fill="red"'));
});

check("Sanitizer entfernt Fremdkörper und Skript Adressen", () => {
  const out = sanitizeSvg(
    '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml">x</body></foreignObject><a href="javascript:alert(1)">y</a></svg>',
  );
  assert.ok(!out.toLowerCase().includes("foreignobject"));
  assert.ok(!out.includes("javascript:"));
});

console.log(`# ${count} Tests bestanden`);
