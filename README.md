# Scribe of Lagash - Focus

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Minimum Obsidian version](https://img.shields.io/badge/obsidian-%E2%89%A51.10.0-8b6cef)

An [Obsidian](https://obsidian.md) plugin that helps writers **concentrate on
their work and remove distractions** with a distraction-free focus view and four
focus modes. It is part
of the **Scribe of Lagash** series, a set of independent, focused tools for
planning and writing stories in Obsidian.

> **Status: early version.** The focus view, the four focus modes and the
> appearance dock are in place; more features land one at a time — see
> "Planned next".

## Thank you

If this plugin helps your writing, you can support its development
[buying me a coffee on Ko-fi](https://ko-fi.com/O3J528W3FZ)

<div align="center">

[![Buy me a coffee](assets/images/buy-me-a-coffee.png)](https://ko-fi.com/O3J528W3FZ)

</div>

## Installation

Requires Obsidian ≥1.10.0.

Download `main.js`, `manifest.json`, and `styles.css` from the
[latest release](https://github.com/aescanes/scribe-of-lagash-focus/releases/latest)
and copy them into `<vault>/.obsidian/plugins/scribe-of-lagash-focus/`.

## Scribe of Lagash Plugins

**Scribe of Lagash** is a series of independent, single-concern Obsidian
plugins for planning and writing stories:

- **[Scribe of Lagash - Visualization](https://community.obsidian.md/plugins/scribe-of-lagash-visualization)** ([github repository](https://github.com/aescanes/scribe-of-lagash-visualization)) —
  helps writers visualize their chapters and scenes.
- **[Scribe of Lagash - Goals and Stats](https://community.obsidian.md/plugins/scribe-of-lagash-goals-stats)** ([github repository](https://github.com/aescanes/scribe-of-lagash-goals-stats)) —
  helps writers set goals and see detailed statistics for their story.
- **[Scribe of Lagash - Focus](https://github.com/aescanes/scribe-of-lagash-focus)** —
  helps writers focus on their work and remove distractions.

Each plugin works fine on its own and none requires another. Visualization
and Goals and Stats each have a **Story folder** setting; Focus Mode has no
scope and applies to the whole vault.

### About the name

"Scribe" is the writer at the center of every plugin in the series, and
"Lagash" nods to _Nippur de Lagash_, the classic Argentine comic.

## Current features

### Focus view

Click the full-screen icon in the left ribbon, or run the "Focus mode"
command, to hide everything except the current note: both sidebars, the ribbon,
the tab strip and view header, the status bar, the title bar and any other
panes. Leave with `Esc` or by running the same command again.

**Hotkey.** The first time you enable the plugin it asks you to choose a key
combination for "Focus mode" and opens Obsidian's Hotkeys screen for
you. The plugin never picks a key itself (Obsidian's guidelines forbid default
hotkeys). You can change the key at any time in Hotkeys, or reopen the prompt
with the "Set focus mode hotkey" command. Focus mode applies to the whole vault, and is always off after
Obsidian restarts.

On desktop, focus mode also takes the window full screen and leaves it again
when you exit; `Esc` ends both at once.

### Focus modes

Pick a mode from the **Focus mode** menu in the dock. Every mode hides the
interface the same way (see above); they differ in how the text itself is
shown. Your choice is remembered for next time.

| Mode | What it does |
| --- | --- |
| **Distraction-free** (default) | Only the page: nothing is dimmed and the text scrolls normally. |
| **Typewriter** | Keeps the line you are writing in a box at the middle of the screen, like paper rolling through a typewriter: the text moves past the box and everything outside it is dimmed. Inside the box only the line with the cursor is lit. The note title is hidden, and the page gets extra space above and below so the first and last lines can reach the middle too. |
| **Spotlight** | Dims everything except the paragraph you are writing. A paragraph is the run of lines between blank lines. |
| **Deep work** | Like Spotlight, but narrower: dims everything except the line you are writing. The text is not centered and the note title stays. A line is one row as the editor wraps it, so it ends where the text moves to the next row, even mid-sentence. |

Notes:

- Typewriter scrolling and dimming follow the cursor, so they apply in the
  editor (Live Preview and Source mode). Reading view is shown undimmed.
- Dimming only changes how the editor looks. Your note is never edited.

### Appearance dock

A small bar at the bottom center of the screen, like the macOS Dock. It shows
for 3 seconds when focus mode turns on, then hides. Move the pointer to the
bottom middle of the window, or press `Shift` + `Up arrow`, to bring it back;
`Shift` + `Down arrow` hides it right away.
It changes the note instantly and remembers your choices:

- **Focus mode** — Distraction-free, Typewriter, Spotlight or Deep work (see above).
- **Text size** — smaller and larger.
- **Font** — Georgia, Times New Roman, Courier New or Helvetica, applied to the
  note's text and title (code keeps its own font).
- **Theme** — Paper, Sepia, Dark or Night.
- **Key sounds** — a preview of the on/off switch; it does not play sounds yet.
- **Info** — the `i` button at the right end opens a large, centered panel with
  a miniature of the dock and a one-line explanation of each control, then the
  dock shortcuts (`Shift` + `Up arrow` or moving the mouse to the bottom center shows the
  dock, `Shift` + `Down arrow` hides it). Click anywhere or press `Esc` to close it.

The plugin has no settings tab, never edits your notes, and only changes how
the editor looks while focus mode is on.

## Planned next

- Key sounds.
- Dimming and typewriter scrolling in Reading view.
- More themes and fonts.
- Session extras that pair with Goals and Stats, such as a timer.

## Development

```bash
npm install
npm run prepare  # activate the Husky pre-commit hook (once; npm install skips it because ignore-scripts=true)
npm run dev    # watch build, outputs main.js
npm run build  # type-check + production build
npm test       # unit tests (Node's built-in runner; no test framework dependency)
npm run validate # typecheck + test + lint + lint:css (run before every commit)
```

### Supply-chain safety

- Every dependency in `package.json` is pinned to an exact version — no `^`/`~`
  ranges and no `latest`. `.npmrc` sets `save-exact=true` so future
  `npm install <pkg>` additions stay pinned by default.
- `.npmrc` also sets `ignore-scripts=true`, so `npm install`/`npm ci` never
  runs a dependency's `preinstall`/`install`/`postinstall` script
  automatically. The only dependency that ships one is `esbuild`, and its
  script just optimizes linking its already-installed platform binary — the
  build works fine without it. On the rare platform where it doesn't (e.g. an
  environment without a matching prebuilt `@esbuild/*` package), run
  `npm run rebuild:esbuild` to explicitly and visibly opt that one script back
  in for that single command.

To try the plugin in a vault, copy (or symlink) `manifest.json`, `main.js`,
and `styles.css` into `<vault>/.obsidian/plugins/scribe-of-lagash-focus/`,
then enable it from Obsidian's Community Plugins settings.

## Contributing

Found a bug, or have a feature request? Open one on the
[GitHub Issues page](https://github.com/aescanes/scribe-of-lagash-focus/issues) —
there's a template for each.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, code conventions, and the PR
process. This project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

Found a security issue? See [SECURITY.md](SECURITY.md) instead of opening a public
issue.

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

[MIT](LICENSE).
