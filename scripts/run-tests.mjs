import esbuild from "esbuild";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "..", "..");
const outFile = join(
  tmpdir(),
  `inline-svg-icons-tests-${process.pid}.cjs`,
);

await esbuild.build({
  entryPoints: [join(root, "scripts", "tests-entry.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "es2018",
  logLevel: "silent",
  outfile: outFile,
  alias: { obsidian: join(root, "scripts", "obsidian-stub.ts") },
});

try {
  createRequire(import.meta.url)(outFile);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  rmSync(outFile, { force: true });
}
