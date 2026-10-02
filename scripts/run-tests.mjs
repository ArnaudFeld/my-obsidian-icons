import esbuild from "esbuild";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const outFile = join(tmpdir(), `moi-icons-tests-${process.pid}.mjs`);

await esbuild.build({
  entryPoints: [join(root, "scripts", "tests-entry.ts")],
  bundle: true,
  platform: "node",
  format: "esm",
  target: "es2022",
  logLevel: "silent",
  outfile: outFile,
  alias: { obsidian: join(root, "scripts", "obsidian-stub.ts") },
});

try {
  await import(pathToFileURL(outFile).href);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  rmSync(outFile, { force: true });
}
