import { readFileSync, writeFileSync } from "fs";

// Übernimmt die Version aus package.json in manifest.json und versions.json.
// Aufruf: npm run version (nach Versionserhöhung in package.json).
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const version = pkg.version;
if (!version) {
  console.error("version-bump: keine Version in package.json");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
const { minAppVersion } = manifest;
if (!minAppVersion) {
  console.error("version-bump: keine minAppVersion in manifest.json");
  process.exit(1);
}
manifest.version = version;
writeFileSync("manifest.json", JSON.stringify(manifest, null, 2) + "\n");

let versions = {};
try {
  versions = JSON.parse(readFileSync("versions.json", "utf8"));
} catch {
  // Neu anlegen.
}
versions[version] = minAppVersion;
const ordered = Object.fromEntries(
  Object.entries(versions).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true }),
  ),
);
writeFileSync("versions.json", JSON.stringify(ordered, null, 2) + "\n");
console.log(`version-bump: ${version} (minApp ${minAppVersion})`);
