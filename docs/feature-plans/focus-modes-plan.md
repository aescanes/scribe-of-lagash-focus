# Focus modes — plan

> The first feature to build is [focus-view-and-dock-plan.md](focus-view-and-dock-plan.md)
> (hide the interface plus the appearance dock). This file covers the wider
> mode model that comes after it.

Status: **built.** The hide characteristics are the focus view (see the plan
above); typewriter scrolling and paragraph/line dimming are built in
[`src/views/focusEditor.ts`](../../src/views/focusEditor.ts), and the dock's
Focus mode menu switches between the four modes. Not yet confirmed in Obsidian
by the maintainer.

Decision: every mode hides the interface (the dock only exists in the focus
view), so the modes differ only in centering and dimming. The chosen mode is
saved as `mode` in `data.json`.

Realization: one always-registered CodeMirror 6 extension
(`FocusEditorEngine`) that does nothing while both characteristics are off.
`FocusController.refresh` tells it the dim scope and typewriter flag; it marks
text outside the focused paragraph (`scribe-focus-dimmed`) and scrolls the
cursor line to the middle with `requestMeasure`. Deep work dims everything but the cursor's
on-screen row (where the editor wraps, not the sentence). Reading view is not covered.

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
| `scribe-focus-dim-paragraph` / `-line` | `dim` | A CodeMirror 6 decoration extension dimming everything outside the current block. |

## Scope and settings

Focus mode applies to the whole vault; there is no story folder, exclusion list
or Obsidian settings tab. The entry points are the left ribbon icon and the
"Focus mode" command (bind a key in Hotkeys — plugin guidelines forbid a
default one). The plugin's options live in the focus dock; `data.json` holds the writer's
font size, font and theme. The persisted `mode` was dropped, since nothing
chooses a mode yet.

## Open questions

- Should the on/off state survive restarts? Currently it does not.
  Answer: Focus mode won't survive the restarts of Obsidian.
- Where do the in-focus options live (an overlay, a modal, a side panel), and
  how does a writer reach them with the interface hidden?
  Answer: in-focus options will live in a dock only when the focus mode is enable
  (after the user changes some settings in the dock, those will be reflex instantly
  in the focus mode view (tab with the note)) and will be saved.
- Per-characteristic overrides, or only the four presets? Likely moot: typewriter
  and dimming would arrive as extra toggles in the dock.
- Typewriter and dimming need CodeMirror 6 extensions registered with
  `registerEditorExtension`. Start with one always-registered extension that
  checks the body class and does nothing when it is absent, and move to a
  compartment reconfigured on toggle only if that shows a real cost.
