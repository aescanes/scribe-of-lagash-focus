# AGENTS.md

Guidance for AI agents working on this repository. Read this before making changes.

## Concept

**Scribe of Lagash - Focus** is an Obsidian plugin that helps writers
concentrate on their work and remove distractions through focus modes — named
bundles of characteristics such as hiding the interface, typewriter scrolling,
and dimming everything but the current paragraph or line. It is the third
plugin in the **"Scribe of Lagash"** series — a set of independent,
single-concern Obsidian plugins for planning and writing stories. The series
shares one per-note frontmatter vocabulary, `scribe-note-*`, but this plugin
doesn't read any note property yet; if it ever does, centralize the key list in
`src/types.ts` and never hardcode a key string.

Rules:

- The plugin **never edits chapter/scene notes** — body or frontmatter. It only
  changes how the editor is *presented*, and stores its own settings in plugin
  data.

## Design decisions (from the maintainer)

- **No Obsidian settings tab.** The plugin's options live in the focus dock,
  which is only available while focus mode is on. Don't add a `PluginSettingTab`.
- **No story folder, exclusions or other scope.** Focus mode applies to the
  whole vault.
- **Entry points:** the left-ribbon icon and a command. The command has no
  default hotkey (Obsidian guidelines). Instead, the first time the plugin is
  enabled a prompt (`HotkeyPromptModal`) sends the writer to Obsidian's Hotkeys
  screen; it is shown once (`hotkeyPrompted` in `data.json`) and reopened by the
  "Set focus mode hotkey" command. That screen is opened through the
  undocumented `app.setting`, feature-detected in `openHotkeySettings`, with a
  `Notice` fallback — it is not public API, so recheck it after Obsidian updates. `Esc` leaves focus mode; `Shift` + `Up arrow` shows the dock and
  `Shift` + `Down arrow` hides it.
- **Spell check is always off in focus mode** (the editor's `spellcheck`
  attribute, in `focusEditor.ts`). No setting or dock control, nothing saved.
- **Focus mode never survives a restart**, and the appearance (font size, font,
  theme) applies only while it is on.
- **Colors:** themes use the plugin's own `--scribe-focus-*` variables on the
  editor; no Obsidian core color is overridden.

## Status

The focus view (hide the interface) and the appearance dock are built and
confirmed in Obsidian — see "Verification" in
[`docs/feature-plans/focus-view-and-dock-plan.md`](docs/feature-plans/focus-view-and-dock-plan.md).
The four focus modes (distraction-free, typewriter, spotlight, deep work), key
sounds, the info panel and font detection are built too, but not all of them are
confirmed in Obsidian yet — see
[`docs/feature-plans/focus-modes-plan.md`](docs/feature-plans/focus-modes-plan.md).
Update this file and the plans as features land.

## Architecture

This project reuses the **structure and conventions** of the first two series
plugins (Visualization and Goals and Stats): the same build/test/release
tooling and the `(SL) ` prefix for generated files.

- Entry point: [`src/main.ts`](src/main.ts) → `ScribeFocusModePlugin` — onload
  wiring only: loads settings, registers the editor extension, creates the
  `FocusController`, adds the left-ribbon icon and the "Focus mode" command, and
  merges and saves dock changes.
- [`src/data/`](src/data/) — **pure, no Obsidian imports**, unit-tested:
  - `focusMode` — the `FOCUS_MODES` table, `FocusCharacteristics`, and
    `focusBodyClasses` (the mode → `<body>` class contract).
  - `focusAppearance` — the fonts (`availableFonts`, `effectiveFontId`), themes,
    font-size range, `normalizeAppearance`, `stepFontSize`, and
    `appearanceBodyClasses`.
  - `dockVisibility` — `dockReduce`, the state machine behind the dock's
    3-second show/hide (held open by the pointer, focus or an open menu).
  - `keySound` — `keySoundFor` (which key press gets which sound) and
    `pickVariant` (which recording) — and `keySoundData`, the generated,
    embedded samples (checked only for shape by its test).
  - Rule of thumb: a file with no Obsidian, DOM or CodeMirror imports belongs
    here; anything that touches them belongs in `views/`.
- [`src/views/focusController.ts`](src/views/focusController.ts) — owns the
  on/off state, applies and clears the body classes and the font-size variable,
  creates and removes the dock, drives the editor engine and key sounds, and
  handles `Esc` and `Shift` + `Up`/`Down arrow`.
- [`src/views/focusDock.ts`](src/views/focusDock.ts) — the bottom-center dock
  and its hot zone (the whole bottom edge); turns DOM events into `dockReduce`
  events, runs the one hide timer, and builds the info panel.
- [`src/views/dockMenu.ts`](src/views/dockMenu.ts) — one dropdown of the dock.
- [`src/views/focusEditor.ts`](src/views/focusEditor.ts) — the CodeMirror 6
  extension: dimming, typewriter scrolling and spell check off.
- [`src/views/keySoundPlayer.ts`](src/views/keySoundPlayer.ts) — plays the key
  sounds with the Web Audio API.
- [`src/views/fontDetector.ts`](src/views/fontDetector.ts) — checks which fonts
  are installed (canvas width test).
- [`src/views/hotkeyPrompt.ts`](src/views/hotkeyPrompt.ts) — the first-run
  hotkey prompt and the helper that opens Obsidian's Hotkeys screen.
- [`src/settings/settings.ts`](src/settings/settings.ts) — persisted appearance
  (`fontSize`, `fontFamily`, `theme`), `mode`, `keySounds`, `hotkeyPrompted`, and
  `normalizeSettings`.
- [`styles.css`](styles.css) — prefer Obsidian's own CSS variables. Plugin
  classes are prefixed `.scribe-`. The magenta brand accent is defined once as
  `--scribe-accent` / `--scribe-accent-soft`; never introduce another raw hex
  (the one exception: the four focus theme presets' background and text colors,
  defined only as `--scribe-focus-bg` / `--scribe-focus-fg` per theme class),
  never set a color from JavaScript, never override a core Obsidian color.
  Focus effects are CSS rules keyed off the body classes.

## Conventions (enforced — don't violate)

### Obsidian plugin guidelines — check before every code change

Verify changes against the official
[Obsidian plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines);
Obsidian's automated review rejects releases that break them. The rules that
bite most often:

- **Use `this.app`**, never a global `app`; use `activeDocument` / `activeWindow`
  rather than `document` / `window` (popout windows).
- **Resource cleanup:** register listeners/intervals with `registerEvent()`,
  `registerDomEvent()`, `registerInterval()`, or `addCommand()`. Anything else
  that mutates global state (like the body classes) must be undone in
  `onunload()`.
- **No hardcoded inline styles** — styling goes in `styles.css`; toggle classes
  from code.
- **DOM, not HTML strings** — `createEl()` / `createDiv()` / `createSpan()`;
  never `innerHTML` / `outerHTML` / `insertAdjacentHTML`.
- **Vault access:** `getFileByPath()` / `getAbstractFileByPath()`;
  `normalizePath()` every user-supplied path.
- **Commands:** no default hotkeys; `callback` for unconditional,
  `checkCallback` for conditional, `editorCallback` when it needs the editor.
- **Workspace:** don't touch `workspace.activeLeaf` or cache view instances.
- **Async:** `async`/`await` over `.then()`; a floating promise gets an explicit
  `void`. `console` output is errors only.
- **Mobile-safe:** no Node/Electron APIs, no regex lookbehind (`isDesktopOnly`
  is `false`).

### Other conventions

- **Don't run `git` write commands.** Never run `git add`, `git commit`, or
  `git push` — the maintainer stages, commits, and pushes by hand. When asked to
  supply a commit message, give the message text only and do **not** append a
  `Co-Authored-By:` trailer or any other attribution line.
- **Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0-beta.2/):**
  `<type>[optional scope]: <description>`.
- **Branch names reuse the type as a prefix:** `<type>/<short-kebab-slug>`.
- **Never modify a chapter/scene note — body or frontmatter.**
- **TypeScript with `strictNullChecks`.** Avoid `any` where a real type exists.
- **Comments explain *why*, not *what*.** Match the existing sparse style.
- **Keep diffs focused** — no drive-by formatting or refactoring.
- **Use US English only** — in code, comments, UI text, docs, and commit messages.
- Every source file starts with the SPDX `MIT` header + copyright line.
- **License is MIT** — no copyleft or MIT-incompatible dependencies.

### Supply-chain rules

- All deps pinned to **exact** versions (`.npmrc` → `save-exact=true`).
- `.npmrc` → `ignore-scripts=true`; `esbuild`'s postinstall is opted back in only
  via `npm run rebuild:esbuild`.
- **Prefer a small amount of first-party code over adding a dependency.**

## Commands

```bash
npm install
npm run prepare  # activate Husky hooks — needed once, since ignore-scripts=true
npm run dev      # esbuild watch → main.js (inline sourcemap)
npm run build    # tsc --noEmit type-check + minified production bundle → main.js
npm test         # esbuild-compile tests/**/*.test.ts → .test-build, run node --test
npm run lint     # eslint, with @typescript-eslint type-checked rules on src/
npm run lint:css # stylelint styles.css
npm run validate # typecheck + test + lint + lint:css — what the pre-commit hook runs
```

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs build, test,
eslint and stylelint on push/PR to `main`, on Node 24.

Tests use Node's built-in `node:test`. They live under [`tests/`](tests/), which
mirrors `src/`: the spec for `src/data/<name>.ts` is `tests/data/<name>.test.ts`.
Only pure modules with no Obsidian imports are unit-tested.

## Testing changes in a real vault

This repo lives inside a test vault's plugin folder, so `npm run dev` already
writes `main.js` in place. Enable the plugin in Community Plugins and reload it
after each rebuild.

## Releasing

Maintainer-only, from a clean `main`; feature PRs never bump the version. Make
sure `CHANGELOG.md`'s `## [Unreleased]` section is complete, then
`npm run version-minor` (or `-patch` / `-major`), then `git push --follow-tags`.
See [CONTRIBUTING.md](CONTRIBUTING.md).

## Docs to keep in sync

When behavior changes, update `README.md`, `CHANGELOG.md` ("Unreleased"), the
relevant plan under [`docs/feature-plans/`](docs/feature-plans/), and
`CONTRIBUTING.md` if conventions change.
