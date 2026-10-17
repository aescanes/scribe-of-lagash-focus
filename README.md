# Scribe of Lagash - Focus Mode

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)
![Minimum Obsidian version](https://img.shields.io/badge/obsidian-%E2%89%A51.10.0-8b6cef)

An [Obsidian](https://obsidian.md) plugin that helps writers **concentrate on
their work and remove distractions** with configurable focus modes. It is part
of the **Scribe of Lagash** series, a set of independent, focused tools for
planning and writing stories in Obsidian.

> **Status: early scaffold.** The plugin's structure, ribbon icon and command are
> in place, but the focus modes don't change how the editor looks yet. Features
> land one at a time — see "Planned next".

## Thank you

If this plugin helps your writing, you can support its development
[buying me a coffee on Ko-fi](https://ko-fi.com/O3J528W3FZ)

<div align="center">

[![Buy me a coffee](assets/images/buy-me-a-coffee.png)](https://ko-fi.com/O3J528W3FZ)

</div>

## Installation

Requires Obsidian ≥1.10.0.

Download `main.js`, `manifest.json`, and `styles.css` from the
[latest release](https://github.com/aescanes/scribe-of-lagash-focus-mode/releases/latest)
and copy them into `<vault>/.obsidian/plugins/scribe-of-lagash-focus-mode/`.

## Scribe of Lagash Plugins

**Scribe of Lagash** is a series of independent, single-concern Obsidian
plugins for planning and writing stories:

- **[Scribe of Lagash - Visualization](https://community.obsidian.md/plugins/scribe-of-lagash-visualization)** ([github repository](https://github.com/aescanes/scribe-of-lagash-visualization)) —
  helps writers visualize their chapters and scenes.
- **[Scribe of Lagash - Goals and Stats](https://community.obsidian.md/plugins/scribe-of-lagash-goals-stats)** ([github repository](https://github.com/aescanes/scribe-of-lagash-goals-stats)) —
  helps writers set goals and see detailed statistics for their story.
- **[Scribe of Lagash - Focus Mode](https://github.com/aescanes/scribe-of-lagash-focus-mode)** —
  helps writers focus on their work and remove distractions.

Each plugin works fine on its own and none requires another. Visualization
and Goals and Stats each have a **Story folder** setting; Focus Mode has no
scope and applies to the whole vault.

### About the name

"Scribe" is the writer at the center of every plugin in the series, and
"Lagash" nods to _Nippur de Lagash_, the classic Argentine comic.

## Current features

### Focus modes

A focus mode is a named bundle of characteristics (hide the interface, center
the line you are writing, dim everything but the current paragraph or sentence).
The plugin has no settings tab: click the focus icon in the left ribbon, or run
the "Toggle focus mode" command, to turn focus mode on and off. Bind the command
to a key combination in Obsidian's Hotkeys; the plugin doesn't ship a default
one. Focus mode applies to the whole vault, and the plugin's own options will
live inside focus mode itself.

| Mode | Characteristics |
| --- | --- |
| Distraction-free | Hides the sidebars, tabs and status bar. |
| Typewriter | Keeps the line you are writing vertically centered. |
| Spotlight | Dims everything except the current paragraph. |
| Deep work | All of the above, with only the current sentence lit. |

The plugin never edits your notes; it only changes how the editor is presented.

## Planned next

- Realize each characteristic: hiding the interface, typewriter scrolling,
  paragraph and sentence dimming.
- Options inside focus mode itself, including choosing the mode and overriding
  individual characteristics.
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
and `styles.css` into `<vault>/.obsidian/plugins/scribe-of-lagash-focus-mode/`,
then enable it from Obsidian's Community Plugins settings.

## Contributing

Found a bug, or have a feature request? Open one on the
[GitHub Issues page](https://github.com/aescanes/scribe-of-lagash-focus-mode/issues) —
there's a template for each.

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, code conventions, and the PR
process. This project follows a [Code of Conduct](CODE_OF_CONDUCT.md).

Found a security issue? See [SECURITY.md](SECURITY.md) instead of opening a public
issue.

See [CHANGELOG.md](CHANGELOG.md) for release history.

## License

[MIT](LICENSE).
