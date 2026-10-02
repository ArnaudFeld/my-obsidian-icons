# Contributing

Thanks for looking at M.O.I. Bug reports, translations and pull requests are welcome.

## Build

```
npm install --legacy-peer-deps
npm run build
```

`--legacy-peer-deps` is required: `obsidian` asks for an older `@codemirror/state` than the one
the other dev dependencies pull in.

## Before you open a pull request

```
npm run typecheck    # plugin tree and scripts/, both must be clean
npm test             # 77 tests, all green
npm run format:check # prettier, no differences allowed
```

`npm run format` fixes formatting. Please run it before committing; a formatting-only commit on
its own is fine, but keep it separate from logic changes so it stays reviewable.

Do not commit `main.js`. Obsidian's plugin guidelines ask for the built file to live only in
releases, and it is generated anyway.

## What to touch where

| Area | Files |
|---|---|
| Shortcode parsing, sanitizer, rendering | `icons.ts` |
| Mapping storage, queue, rename and delete | `mapping.ts` |
| Settings validation on load | `settings.ts` |
| Code block detection for the editor | `code-context.ts` |
| CDN fetching and catalogs | `cdn.ts`, `cdn-catalog.ts`, `selfhost-catalog.ts` |
| User interface texts | `i18n.ts`, all four languages must stay in sync |

`i18n.ts` has a test that fails when the languages drift apart. Add the key to all four tables
in the same commit, otherwise `npm test` will stop.

## Translations

German, English, French and Spanish are complete. When you add a text, put it into all four
tables. English is the fallback, so a missing key shows up in the interface as the raw key
instead of a sentence.

`pick.colorOff` in French and Spanish was translated by a non-native speaker and reads a little
stiff. Native corrections are welcome.

## Tests

`scripts/tests-entry.ts` holds everything, run with `npm test`. The harness bundles the entry
point with esbuild and points the `obsidian` import at `scripts/obsidian-stub.ts`, so tests run
in plain Node without a vault.

Only pure logic is tested. Icon rendering, the explorer badges and the CodeMirror extension
need a real Obsidian to check, so say so in a bug report if something looks wrong there.

The stub can simulate a network via `setStubFetch` and count `requestUrl` calls via
`stubFetchCalls`. Use it when you add anything that fetches.

## Reporting a security issue

Please don't open a public issue. Send it to the maintainer directly and wait for a fix
before disclosing. Obsidian scans every release of a plugin automatically, and an early
public report gives attackers a head start.

## Style

No comments explaining what the code obviously does. Comments are for the reason behind a
decision, for the order of operations that has to stay stable, and for the limits that exist
because of something outside the repository.

Keep console output minimal. There are four warnings, all prefixed `[moi]`, and they stay in
German because they are meant for debugging rather than for the interface.