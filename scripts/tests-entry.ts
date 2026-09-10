import assert from "node:assert/strict";
import {
  normalizeFolder,
  normalizeSvgName,
  parseIconRef,
  parseSize,
  sanitizeSvg,
} from "../icons";
import { MappingStore, normalizeEntry, normalizeExt } from "../mapping";
import type { IconMapping } from "../mapping";
import { collectImportEntries } from "../exchange";
import {
  currentLanguage,
  slogan,
  colorName,
  t,
  missingTranslations,
} from "../i18n";
import { badgeKey, isBadgeMutation } from "../explorer";
import { unusedSvgNames } from "../gallery";
import { setStubLanguage } from "./obsidian-stub";
import { pickVariant } from "../tabs-titles";
import { CdnCache, MISSING_TTL_MS } from "../cdn";
import { cachedCatalogRefs } from "../suggest";
import { IconStore } from "../icons";
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

check("Sanitizer ohne Anführungszeichen und Rahmen", () => {
  const out = sanitizeSvg(
    "<svg onload=alert(1)><img src=x onerror=alert(2)><iframe src=\"data:text/html,x\"></iframe></svg>",
  );
  assert.ok(!out.includes("onload"));
  assert.ok(!out.includes("onerror"));
  assert.ok(!out.toLowerCase().includes("iframe"));
});

check("Sanitizer kodierte Adressen und Stil Import", () => {
  const out = sanitizeSvg(
    '<svg><a xlink:href="&#106;avascript:alert(1)"><text>x</text></a><style>@import \'https://evil/x.css\';.a{fill:red}</style></svg>',
  );
  assert.ok(!out.includes("xlink:href"));
  assert.ok(!out.includes("@import"));
  assert.ok(out.includes(".a{fill:red}"));
});

check("Sanitizer behält Verlauf und interne Verweise", () => {
  const svg =
    '<svg><defs><linearGradient id="g"></linearGradient></defs><path fill="url(#g)"/><use href="#x"/></svg>';
  const out = sanitizeSvg(svg);
  assert.ok(out.includes('fill="url(#g)"'));
  assert.ok(out.includes('href="#x"'));
});

check("Sanitizer Trenner Schrägstrich und Anführungszeichen", () => {
  const out = sanitizeSvg(
    '<svg/onload=alert(1)><animate/onbegin=alert(2) attributeName=x dur=1s/><a href="#"onload=alert(3)><text>k</text></a></svg>',
  );
  assert.ok(!out.includes("onload"));
  assert.ok(!out.includes("onbegin"));
  assert.ok(out.includes("<text>k</text>"));
});

check("Sanitizer SMIL-Werte und benannte Entities", () => {
  const out = sanitizeSvg(
    '<svg><a href="#ok"><text>x</text><animate attributeName="href" values="&#106;avascript:alert(1)" dur="1s"/></a>' +
      '<a href="#x"><text>k</text><animate attributeName="href" from="#" to="javascript&colon;alert(1)" dur="1s"/></a></svg>',
  );
  assert.ok(!out.includes("values="));
  assert.ok(!out.includes("javascript:"));
  assert.ok(out.includes("<text>x</text>"));
});

check("Sanitizer Stil-Attribut und srcset", () => {
  const out = sanitizeSvg(
    '<svg><circle style="fill:red;background:url(http://evil/?c=1)"/><image srcset="http://evil/x.svg 1x"/></svg>',
  );
  assert.ok(!out.includes("http://evil"));
  assert.ok(out.includes("fill:red"));
  assert.ok(!out.includes("srcset"));
});

check("Sanitizer Skript mit Quelle ohne Close", () => {
  const out = sanitizeSvg(
    '<svg><script href="data:text/javascript,alert(1)"/><circle fill="red"/></svg>',
  );
  assert.ok(!out.includes("<script"));
  assert.ok(out.includes('fill="red"'));
});
check("Sanitizer offenes Fremdobjekt und to Schema", () => {
  const out = sanitizeSvg(
    '<svg><foreignObject><body xmlns="http://www.w3.org/1999/xhtml"><img src=x onerror=alert(1)>',
  );
  assert.ok(!out.toLowerCase().includes("foreignobject"));
  assert.ok(!out.includes("onerror"));
  const anim = sanitizeSvg(
    '<svg><animate attributeName="x" to="100"/><set attributeName="href" to="javascript:alert(1)"/></svg>',
  );
  assert.ok(anim.includes('to="100"'));
  assert.ok(!anim.includes("javascript:"));
});

check("Sanitizer verwirft HTML nach Root SVG", () => {
  const out = sanitizeSvg(
    '<svg width="20" height="20"><rect/></svg><div>evil</div>',
  );
  assert.ok(!out.includes("<div>"));
  assert.ok(out.includes("<svg"));
});

check("Sanitizer externe Paint URLs", () => {
  const out = sanitizeSvg(
    '<svg><rect fill="url(http://evil/x#f)" filter="url(//evil/f)"/><path fill="url(#g)"/></svg>',
  );
  assert.ok(!out.includes("http://evil"));
  assert.ok(!out.includes("//evil"));
  assert.ok(out.includes('fill="url(#g)"'));
});

check("Sanitizer kodiertes Stil URL", () => {
  const out = sanitizeSvg(
    '<svg><circle style="background:url&#40;http://evil/x&#41;"/></svg>',
  );
  assert.ok(!out.includes("http://evil"));
});

check("Sanitizer CSS Escape URL", () => {
  const out = sanitizeSvg(
    '<svg><circle style="fill:\\75rl(http://evil/x)"/></svg>',
  );
  assert.ok(!out.includes("http://evil"));
});

check("Sanitizer SMIL Event Attribute", () => {
  const out = sanitizeSvg(
    '<svg><set attributeName="onload" to="x"/><animate attributeName="x" to="100"/></svg>',
  );
  assert.ok(!out.toLowerCase().includes("onload"));
  assert.ok(out.includes('to="100"'));
});

check("Sanitizer ungeschlossenes Stil", () => {
  const out = sanitizeSvg(
    '<svg><style>rect{fill:url(http://evil/x)}<rect fill="red"/></svg>',
  );
  assert.ok(!out.includes("http://evil"));
});

check("Ordner Norm wirft Punkte raus", () => {
  assert.equal(normalizeFolder("_assets/icons"), "_assets/icons");
  assert.equal(normalizeFolder("/a//b/"), "a/b");
  assert.equal(normalizeFolder("../../x"), "x");
  assert.equal(normalizeFolder("a/./b"), "a/b");
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

await checkAsync("Entfernen findet jede Schreibweise", async () => {
  const app = testApp();
  app.vault.files.set(
    "_assets/icon-mapping.json",
    JSON.stringify({ __ext__: { MD: "server" } }),
  );
  const store = testStore(app);
  await store.load();
  await store.removeExt(".MD");
  assert.equal(store.getExt("md"), null);
});

await checkAsync("CDN Fehlschlag versucht neu nach TTL", async () => {  const cache = new CdnCache({ load: () => ({}), save: () => {} });
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

await checkAsync("Cache aus data.json wird sanitiert", async () => {
  const cache = new CdnCache({
    load: () => ({
      "devicon/x": '<svg onload=alert(1)><path fill="red"/></svg>',
    }),
    save: () => {},
  });
  const svg = cache.peek("devicon/x") ?? "";
  assert.ok(!svg.includes("onload"));
  assert.ok(svg.includes('fill="red"'));
});

await checkAsync("Cache aus data.json bleibt gedeckelt", async () => {
  const data: Record<string, string> = {};
  for (let i = 0; i < 200; i++) {
    data[`devicon/n${i}`] = "<svg><path/></svg>";
  }
  const cache = new CdnCache({ load: () => data, save: () => {} });
  assert.ok(cache.size <= 150);
});

await checkAsync("Proto Schlüssel landen nicht im Speicher", async () => {
  const app = testApp();
  const store = testStore(app);
  await store.set("__proto__", { icon: "x" });
  await store.setMany([["constructor", { icon: "x" }]]);
  await store.setExt("__proto__", { icon: "x" });
  assert.deepEqual(store.entries(), []);
  assert.deepEqual(store.extEntries(), []);
  assert.equal(
    ({} as Record<string, unknown>)["icon" as string],
    undefined,
  );
});

await checkAsync("Suggest Katalog kommt aus dem Cache", async () => {
  const app = testApp();
  app.vault.files.set("_assets/icons/server.svg", "<svg/>");
  const store = new IconStore(
    app as unknown as import("obsidian").App,
    () => "_assets/icons",
  );
  const first = await cachedCatalogRefs(store, { cdn: false, selfhost: false });
  assert.ok(first.catalog.refs.includes("server"));
  assert.deepEqual(first.hay.get("server"), ["server"]);
  const second = await cachedCatalogRefs(store, { cdn: false, selfhost: false });
  assert.equal(second, first);
});

await checkAsync("Import-Batch schreibt alles auf einmal", async () => {
  const app = testApp();
  const store = testStore(app);
  let writes = 0;
  const origCreate = app.vault.create.bind(app.vault);
  const origModify = app.vault.modify.bind(app.vault);
  app.vault.create = async (path: string, content: string) => {
    writes++;
    return origCreate(path, content);
  };
  app.vault.modify = async (file: never, content: string) => {
    writes++;
    return origModify(file, content);
  };
  await store.importAll(
    [
      ["a.md", { icon: "eins" }],
      ["b.md", { icon: "zwei" }],
    ],
    [["md", { icon: "server" }]],
  );
  assert.equal(writes, 1);
  assert.deepEqual(store.get("a.md"), { icon: "eins" });
  assert.deepEqual(store.getExt("md"), { icon: "server" });
});

await checkAsync("Set während Load geht nicht verloren", async () => {
  const app = testApp();
  const store = testStore(app);
  await store.set("a.md", { icon: "eins" });
  await Promise.all([store.load(), store.set("b.md", { icon: "zwei" })]);
  assert.deepEqual(store.get("a.md"), { icon: "eins" });
  assert.deepEqual(store.get("b.md"), { icon: "zwei" });
  const raw = app.vault.files.get("_assets/icon-mapping.json") ?? "";
  const parsed = JSON.parse(raw) as Record<string, unknown>;
  assert.deepEqual(parsed["a.md"], "eins");
  assert.deepEqual(parsed["b.md"], "zwei");
});

await checkAsync("removePath löscht Datei und Ordner Kinder", async () => {
  const app = testApp();
  const store = testStore(app);
  await store.setMany([
    ["ordner/a.md", { icon: "eins" }],
    ["ordner/b.md", { icon: "zwei" }],
    ["anders.md", { icon: "drei" }],
  ]);
  assert.equal(await store.removePath("ordner", true), true);
  assert.equal(store.get("ordner/a.md"), null);
  assert.equal(store.get("ordner/b.md"), null);
  assert.deepEqual(store.get("anders.md"), { icon: "drei" });
  assert.equal(await store.removePath("nix.md", false), false);
  assert.equal(await store.removePath("anders.md", false), true);
  assert.equal(store.get("anders.md"), null);
});

await checkAsync("migrateRename zieht Kinder mit um", async () => {
  const app = testApp();
  const store = testStore(app);
  await store.setMany([
    ["alt/a.md", { icon: "eins" }],
    ["solo.md", { icon: "zwei" }],
  ]);
  assert.equal(await store.migrateRename("alt", "neu", true), true);
  assert.deepEqual(store.get("neu/a.md"), { icon: "eins" });
  assert.equal(store.get("alt/a.md"), null);
  assert.deepEqual(store.get("solo.md"), { icon: "zwei" });
});

await checkAsync("Reservierter Schlüssel bleibt unangetastet", async () => {
  const app = testApp();
  const store = testStore(app);
  await store.set("__ext__", { icon: "x" });
  await store.setMany([["__ext__", { icon: "x" }]]);
  await store.remove("__ext__");
  await store.setExt("__ext__", { icon: "x" });
  assert.deepEqual(store.entries(), []);
  assert.deepEqual(store.extEntries(), []);
  assert.equal(app.vault.files.get("_assets/icon-mapping.json"), undefined);
});

await checkAsync("Proto Namen lösen keinen Schreibvorgang aus", async () => {
  const app = testApp();
  const store = testStore(app);
  let writes = 0;
  const origCreate = app.vault.create.bind(app.vault);
  const origModify = app.vault.modify.bind(app.vault);
  app.vault.create = async (path: string, content: string) => {
    writes++;
    return origCreate(path, content);
  };
  app.vault.modify = async (file: never, content: string) => {
    writes++;
    return origModify(file, content);
  };
  await store.set("a.md", { icon: "eins" });
  assert.equal(writes, 1);
  await store.remove("toString");
  await store.removeMany(["valueOf"]);
  assert.equal(writes, 1);
});

await checkAsync("Import sammelt nur gültige Einträge", async () => {
  const pkg = {
    "a.md": "eins",
    "a..b.md": "zwei",
    "../x.md": "böse",
    "": "leer",
    "/abs.md": "abs",
    "kaputt.md": { icon: "../x" },
    __ext__: { md: "server", "BÖSE": "x" },
  } as unknown as IconMapping;
  const res = collectImportEntries(pkg, 5000);
  assert.deepEqual(
    res.pathItems.map(([p]) => p).sort(),
    ["a..b.md", "a.md"],
  );
  assert.deepEqual(res.extItems, [["md", { icon: "server" }]]);
  assert.equal(res.entries, 3);
  assert.equal(res.skipped, 5);
});

await checkAsync("Import deckelt Einträge", async () => {
  const mapping: Record<string, string> = {};
  for (let i = 0; i < 10; i++) mapping[`f${i}.md`] = "x";
  const res = collectImportEntries(mapping as IconMapping, 3);
  assert.equal(res.entries, 3);
  assert.equal(res.pathItems.length, 3);
  assert.equal(res.skipped, 7);
});

check("Slogan folgt der App Sprache", () => {
  setStubLanguage("de-AT");
  assert.equal(currentLanguage(), "de");
  assert.equal(slogan(), "Lokal, leicht, deins.");
  setStubLanguage("fr");
  assert.equal(slogan(), "Local, léger, à vous.");
  setStubLanguage("es");
  assert.equal(slogan(), "Local, ligero, tuyo.");
  setStubLanguage("it");
  assert.equal(slogan(), "Local, lightweight, yours.");
  setStubLanguage("en");
  assert.equal(currentLanguage(), "en");
  assert.equal(slogan(), "Local, lightweight, yours.");
});

check("UI Texte zweisprachig mit Platzhaltern", () => {
  setStubLanguage("de");
  assert.equal(t("menu.change"), "Icon ändern");
  assert.equal(t("pick.apply"), "Übernehmen");
  assert.equal(colorName("green"), "Grün");
  setStubLanguage("en");
  assert.equal(t("menu.change"), "Change icon");
  assert.equal(t("pick.apply"), "Apply");
  assert.equal(colorName("green"), "Green");
  assert.equal(t("notice.saved", { path: "a.svg" }), "Saved: a.svg");
  assert.equal(t("set.cache.count", { count: 3 }), "3 icons on this device.");
  setStubLanguage("it");
  assert.equal(t("menu.change"), "Change icon");
  setStubLanguage("en");
});

check("Keine fehlenden Übersetzungen", () => {
  assert.deepEqual(missingTranslations(), []);
});

check("UI Texte in vier Sprachen", () => {
  setStubLanguage("fr");
  assert.equal(t("menu.change"), "Changer l'icône");
  assert.equal(t("pick.apply"), "Appliquer");
  setStubLanguage("es");
  assert.equal(t("menu.change"), "Cambiar icono");
  assert.equal(t("pick.apply"), "Aplicar");
  setStubLanguage("it");
  assert.equal(t("menu.change"), "Change icon");
  setStubLanguage("en");
});

check("Explorer Badge Schlüssel", () => {
  assert.equal(badgeKey(false, "server"), "light|server||");
  assert.equal(badgeKey(true, "server", "red", "20"), "dark|server|red|20");
});

check("Explorer erkennt eigene Badge Mutationen", () => {
  const badge = {
    closest: (sel: string) =>
      sel === ".obsidian-icon-explorer" ? ({} as Element) : null,
  };
  const other = { closest: () => null };
  const asRecord = (target: unknown): MutationRecord =>
    ({ target } as unknown as MutationRecord);
  assert.equal(isBadgeMutation([asRecord(badge)]), true);
  assert.equal(isBadgeMutation([asRecord(other)]), false);
  assert.equal(isBadgeMutation([asRecord(badge), asRecord(other)]), false);
});

check("Galerie findet ungenutzte Dateien", () => {
  const entries = [
    { icon: "server" },
    { icon: "lucide:folder", iconDark: "router" },
  ];
  assert.deepEqual(unusedSvgNames(["server", "router", "db"], entries), ["db"]);
  assert.deepEqual(unusedSvgNames([], entries), []);
});

console.log(`# ${count} Tests bestanden (final)`);
