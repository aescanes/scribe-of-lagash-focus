# Focus modes — plan

Status: scaffold done (state, settings, commands, body classes); every
characteristic below is still to build.

## Model

A **mode** (`FocusMode` in [`src/data/focusMode.ts`](../../src/data/focusMode.ts))
is an id, a name, a description and a `FocusCharacteristics` bundle. Turning
focus mode on adds classes to `<body>` (`focusBodyClasses`); the stylesheet and
later editor extensions key off those classes, so `FocusController` never needs
to know how a characteristic is realized.

| Class | Characteristic | Planned realization |
| --- | --- | --- |
| `scribe-focus-hide-sidebars` | `hideSidebars` | CSS hiding both sidebars and the ribbon (or collapsing via the workspace API and restoring on exit). |
| `scribe-focus-hide-status-bar` | `hideStatusBar` | CSS. Note this also hides this plugin's own status-bar item — the ribbon is hidden too, so the command is the only toggle left; revisit. |
| `scribe-focus-hide-tabs` | `hideTabs` | CSS on the tab strip and note header. |
| `scribe-focus-typewriter` | `typewriterScroll` | A CodeMirror 6 extension keeping the cursor line centered. |
| `scribe-focus-dim-paragraph` / `-sentence` | `dim` | A CodeMirror 6 decoration extension dimming everything outside the current block. |

## Scope and settings

Focus mode applies to the whole vault; there is no story folder, exclusion list
or Obsidian settings tab. The entry points are the left ribbon icon and the
"Toggle focus mode" command (bind a key in Hotkeys — plugin guidelines forbid a
default one). The plugin's options will live inside focus mode itself; the
persisted `mode` in `data.json` is what that UI will write.

## Open questions

- Should the on/off state survive restarts? Currently it does not.
- Where do the in-focus options live (an overlay, a modal, a side panel), and
  how does a writer reach them with the interface hidden?
- Per-characteristic overrides, or only the four presets?
- Which editor extensions need registering via `registerEditorExtension`, and
  do they need a reconfigure on settings change?
