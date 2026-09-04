import assert from "node:assert/strict";
import {
  normalizeSvgName,
  parseIconRef,
  parseSize,
  sanitizeSvg,
} from "../icons";
import { MappingStore, normalizeEntry, normalizeExt } from "../mapping";
import { pickVariant } from "../tabs-titles";
import { CdnCache, MISSING_TTL_MS } from "../cdn";
import { App } from "./obsidian-stub";

let count = 0;

function check(name: string, fn: () => void): void {
  fn();
  count++;
  console.log(`ok ${count} - ${name}`);
}

async function checkAsync(name: string, fn: () => Promise<void>): Promise<void> {
  await fn();
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

check("Eintrag mit Zahl Werten stürzt nicht ab", () => {
  assert.deepEqual(
    normalizeEntry({
      icon: "a",
      size: 24 as unknown as string,
      color: 5 as unknown as string,
    }),
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

function testApp(): App {
  return new App();
}

function testStore(app: App): MappingStore {
  return new MappingStore(
    app as unknown as import("obsidian").App,
    () => "_assets/icon-mapping.json",
  );
}

await checkAsync("Parallele Saves verlieren nichts", async () => {
  const app = testApp();
  const store = testStore(app);
  await Promise.all([
    store.setMany([
      ["a.md", { icon: "eins" }],
      ["b.md", { icon: "zwei" }],
    ]),
    store.set("c.md", { icon: "drei" }),
  ]);
  const raw = app.vault.files.get("_assets/icon-mapping.json") ?? "";
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  assert.deepEqual(parsed["a.md"], "eins");
  assert.deepEqual(parsed["b.md"], "zwei");
  assert.deepEqual(parsed["c.md"], "drei");
});

await checkAsync("Kaputte Datei behält Stand", async () => {
  const app = testApp();
  const store = testStore(app);
  await store.set("a.md", { icon: "eins" });
  app.vault.files.set("_assets/icon-mapping.json", "{kaputt");
  await store.load();
  assert.deepEqual(store.get("a.md"), { icon: "eins" });
});

await checkAsync("Endung groß wird klein", async () => {
  const app = testApp();
  const store = testStore(app);
  await store.setExt("MD", { icon: "server" });
  assert.deepEqual(store.getExt("md"), { icon: "server" });
  assert.deepEqual(store.getExt("MD"), { icon: "server" });
  const raw = app.vault.files.get("_assets/icon-mapping.json") ?? "";
  assert.ok(raw.includes('"md"'));
  assert.ok(!raw.includes('"MD"'));
  await store.removeExt("MD");
  assert.equal(store.getExt("md"), null);
});

await checkAsync("Alte große Endung heilt beim Laden", async () => {
  const app = testApp();
  app.vault.files.set(
    "_assets/icon-mapping.json",
    JSON.stringify({ __ext__: { MD: "server" } }),
  );
  const store = testStore(app);
  await store.load();
  assert.deepEqual(store.getExt("md"), { icon: "server" });
});

await checkAsync("CDN Fehlschlag versucht neu nach TTL", async () => {
  const cache = new CdnCache({ load: () => ({}), save: () => {} });
  const realNow = Date.now;
  try {
    Date.now = () => 1_000_000;
    assert.equal(await cache.getSvg("devicon/xyz"), null);
    assert.equal(
      (cache as unknown as { missing: Map<string, number> }).missing.get(
        "devicon/xyz",
      ),
      1_000_000,
    );
    assert.equal(await cache.getSvg("devicon/xyz"), null);
    assert.equal(
      (cache as unknown as { missing: Map<string, number> }).missing.get(
        "devicon/xyz",
      ),
      1_000_000,
    );
    Date.now = () => 1_000_000 + MISSING_TTL_MS + 1;
    assert.equal(await cache.getSvg("devicon/xyz"), null);
    assert.equal(
      (cache as unknown as { missing: Map<string, number> }).missing.get(
        "devicon/xyz",
      ),
      1_000_000 + MISSING_TTL_MS + 1,
    );
  } finally {
    Date.now = realNow;
  }
});

console.log(`# ${count} Tests bestanden (mit async)`);
