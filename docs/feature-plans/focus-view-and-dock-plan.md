# Focus view and appearance dock — plan

Status: **built and confirmed in Obsidian** (see "Verification"). This is the first real feature of the plugin and
supersedes the four-mode idea in [focus-modes-plan.md](focus-modes-plan.md) for
now (see "Relationship to the mode model").

## Goal

One action — the ribbon icon, the "Focus mode" command, or a key
combination the writer binds to that command — turns Obsidian into a single
note on a clean page. A macOS-Dock-style bar at the bottom center, hidden most
of the time, lets the writer change the font size, font, and theme, and the
note reflects each change instantly.

## Behavior

### Entering and leaving

- Toggling on hides everything except the current note: both sidebars, the
  left ribbon, the tab strip and view header, the status bar, and the window
  title bar. Toggling off restores all of it exactly as it was.
- The note shown is the active one. If the active leaf isn't a note (a canvas,
  the graph, an empty tab) focus mode doesn't turn on and shows a `Notice`
  saying why — decided when the writer toggles, not by a scope setting. (v1
  checks for a Markdown view.)
- There is deliberately no exit button in the dock: an "x" there reads as
  "close the dock", not "leave focus mode". With the ribbon hidden, the ways
  out are the command (and its key
  combination), and `Esc` (skipped when a modal, menu or
  suggestion list is open, or something already handled the key).
- On desktop, turning focus mode on also puts the window in full screen, and
  turning it off takes it out again. It uses the web Fullscreen API (not an
  Electron API, to stay mobile-safe) and is best effort: if the request is
  refused, focus mode carries on in the normal window. While full screen, the
  browser handles `Esc` itself and never delivers it to the page, so the
  controller treats the window leaving full screen as leaving focus mode; one
  `Esc` ends both. `Esc` works the same whether or not the dock is showing or
  has keyboard focus.
- Layout, open files, and scroll position are never changed by entering or
  leaving, so leaving puts the writer back precisely where they were.

### The dock

- A small rounded bar anchored at the bottom center of the window, floating
  over the note, in the same visual spirit as the macOS Dock (translucent
  background, soft shadow, slight lift on hover).
- **Visibility:** it appears for 3 seconds when focus mode turns on, so the
  writer learns it exists, then slides down and fades out. It never covers the
  text for good.
- **Reveal:** moving the pointer into an invisible hot zone along the bottom
  center edge slides it back up. While the pointer is over the dock, or a
  control in it has keyboard focus or an open popover, it stays; 3 seconds
  after the pointer leaves (and focus is gone) it hides again.
- **Controls (v1):**
  - **Font size** — smaller / larger buttons with the current size shown,
    stepped within a clamped range.
  - **Font** — system font stacks: Georgia, Garamond, Baskerville, Palatino,
    Times New Roman, Courier New and Helvetica. Garamond, Baskerville and Palatino
    are hidden when not installed (a canvas width check, `fontDetector.ts`). No bundled font files: that keeps the plugin small and
    dependency-free. Applied to the note's body text and title only; code keeps
    Obsidian's monospace font.
  - **Theme** — four presets, each a background color plus a text color:
    Paper, Sepia, Dark and Night (low contrast).
- **Instant:** every control applies as it is clicked, with no confirm step.
- **Persistence:** the last font size, font, and theme are saved and reused the
  next time focus mode turns on. The on/off state itself is not saved: focus
  mode is always off after Obsidian restarts. The appearance exists only while
  focus mode is on.
- **Keyboard:** with focus mode on, `Shift` + `Up arrow` shows the dock for 3
  seconds and `Shift` + `Down arrow` hides it at once, even if the pointer is
  over it. Neither key is swallowed, so they still extend the selection. They
  are read in the capture phase, because the editor marks the event handled
  before it reaches a normal listener.

This is where the plugin's options live, as decided: there is no Obsidian
settings tab.

## Design

### Rule: colors only in CSS

Per [AGENTS.md](../../AGENTS.md), colors are never set from JavaScript. So a
theme is a body class (`scribe-focus-theme-<id>`) and its colors are CSS custom
properties defined in `styles.css`. Code only chooses which class is present.
Font size is the one runtime number, set with `style.setProperty` on `<body>`,
which the guidelines allow for computed values. A font is also a class
(`scribe-focus-font-<id>`) whose stack lives in CSS.

### Hiding the interface

Done with CSS keyed off body classes, as the existing `focusBodyClasses`
contract already anticipates (`scribe-focus-active`, `-hide-sidebars`,
`-hide-status-bar`, `-hide-tabs`). Hiding with CSS rather than collapsing the
splits through the workspace API means there is nothing to restore, the writer
can't accidentally reopen a sidebar mid-session, and a crash or disabled plugin
can't leave the layout altered. The spike confirmed it works in the maintainer's vault (see "Risks").

### Applying appearance to the note

Theme colors and the font apply to the editor and reading view of the active
note only, through the plugin's own variables (`--scribe-focus-bg`,
`--scribe-focus-fg`, …) used in selectors like
`.scribe-focus-active .cm-content`, rather than by redefining Obsidian's core
variables such as `--background-primary` (decided: no core color is
overridden for now). The cost is that syntax-highlighted headings and links
keep their normal colors in v1.

### Code layout

| Piece | Where | Notes |
| --- | --- | --- |
| Appearance model | `src/data/focusAppearance.ts` (pure) | Theme and font tables, size range and step, `normalizeAppearance`, `stepFontSize`, and the body classes for an appearance. Unit-tested. |
| Dock visibility | `src/data/dockVisibility.ts` (pure) | A small state machine: events (`shown`, `pointerEnter`, `pointerLeave`, `focusIn`, `focusOut`, `timerElapsed`) to `{ state, timer }`. All the 3-second logic lives here, with the timer injected, so it is tested without a DOM. |
| Dock UI | `src/views/focusDock.ts` | A `Component` that builds the DOM (`createDiv`, no HTML strings), registers pointer and focus listeners with `registerDomEvent`, owns the one timer through `registerInterval` or a cleared `setTimeout`, and calls back into the controller. |
| Controller | `src/views/focusController.ts` | Existing. Gains the dock, the appearance state, the "active leaf is a note" check, and applying the appearance classes and font-size variable. |
| Persisted state | `src/settings/settings.ts` | Replace the unused `mode` with `fontSize`, `fontFamily`, `theme`, normalized as before. |
| Styles | `styles.css` | Hide rules, theme and font classes, the dock, its hot zone, and the slide and fade transition (skipped under `prefers-reduced-motion`). |

### Relationship to the mode model

The four modes (distraction-free, typewriter, spotlight, deep work) are not
built by this plan. `FOCUS_MODES` and `focusBodyClasses` stay, and v1 behaves
as the distraction-free mode — the hide characteristics — with the appearance
dock added. Typewriter, spotlight, and deep work come later and would show up
as more dock controls. The persisted `mode` field is dropped for now, since
nothing chooses a mode yet, and returns when something does.

## Hotkey prompt

Obsidian's guidelines forbid a plugin from shipping a default hotkey, and there
is no public API to assign one or to open the Hotkeys screen. So the first time
the plugin is enabled (and after the workspace is ready) it shows a dialog
explaining focus mode with "Maybe later" and "Set hotkey". "Set hotkey" opens
Obsidian's own Hotkeys screen filtered to "Focus mode", which gives the
writer Obsidian's key capture and conflict warnings. The "shown" flag is saved
before the dialog opens, so dismissing it never brings it back by itself; the
"Set focus mode hotkey" command reopens it. Disabling and re-enabling the
plugin doesn't re-prompt, because `data.json` is kept.

Opening that screen uses the undocumented `app.setting` (the same approach many
community plugins use). It is feature-detected and falls back to a `Notice`
with written instructions, but it can break or be questioned in review.

Not verified in Obsidian yet: the prompt on first enable (and from a fresh
vault with no `data.json`), that the Hotkeys screen opens already filtered, and
the fallback `Notice` path.

## Build order

All steps are written. The spike was done by the maintainer by hand after the
code existed.

1. **Spike:** done — in the maintainer's vault the CSS selectors hide everything
   except the current note. Not separately recorded: a vault with split panes
   and a pop-out window; recheck those if a problem is reported.
2. **Hide the interface:** done — the selectors are wired to the body classes,
   with the "active view is a note" guard.
3. **Appearance model and tests:** done — `focusAppearance.ts`.
4. **Dock visibility logic and tests:** done — `dockVisibility.ts`.
5. **Dock UI:** done — `focusDock.ts`.
6. **Persistence and polish:** persistence done; README and CHANGELOG updated.

## Testing

- Unit tests (`node:test`) for `focusAppearance` (clamping, stepping,
  normalizing unknown or out-of-range stored values, class output) and
  `dockVisibility` (initial 3-second show, hover keeps it open, leave restarts
  the countdown, focus keeps it open, repeated events don't stack timers).
- Manual checklist in a real vault: toggle from ribbon, command, and a bound
  hotkey; both sidebars open beforehand and closed beforehand; split panes;
  switching notes while focused; Live Preview, Source mode, and Reading view;
  reload the plugin while focus mode is on (everything must come back).

## Verification

The pure logic is unit-tested. Confirmed by hand in Obsidian by the maintainer:
the hide selectors; the font, size, theme and cursor-color styling; code blocks
keeping their monospace font; the dock's slide, 3-second timing, hot zone
reveal and keyboard focus behavior; `Esc` (against Vim mode, open popovers, and
in full screen with the dock showing, hovered or keyboard-focused); full
screen starting and exiting cleanly from the ribbon icon, the command palette
and a hotkey, including with macOS native full screen already on; and the
bottom hot zone not getting in the way of clicking or scrolling the note.

Nothing is outstanding. If the hot zone ever interferes (it is an invisible,
always pointer-active box over the note), replace it with a document-level
pointer-position listener so nothing sits on top of the note.

## Risks

- **Hiding by CSS depends on Obsidian's class names**, which are not a stable
  API and may vary by version and theme. The spike mitigates it; the fallback
  is collapsing the splits through the workspace API and restoring their
  previous state on exit.
- **Other panes and pop-out windows:** "everything except the current note"
  is unclear with several panes open. Proposed v1: only the active note's pane
  is shown. Needs the spike to confirm it is feasible with CSS alone.
- **Mobile** has no hover and a different chrome, and `isDesktopOnly` is
  `false`. Proposed: v1 is verified on desktop; on mobile a tap on the bottom
  edge reveals the dock. If that proves awkward the plugin should become
  desktop-only before release rather than ship a broken mobile experience.
- **Themes and the dock look:** a community theme can restyle or fight the
  plugin's CSS. The dock uses only the plugin's own classes and variables.
- **Accessibility:** a hover-only dock is unreachable by keyboard. The dock
  must also be reachable by a command that reveals it and moves focus into it,
  and contrast of the preset themes must meet a readable minimum.

## Open questions

1. **Theme coloring depth.** Own variables on the editor only (proposed, safer,
   headings and links keep their normal colors), or scoped overrides of
   Obsidian's core variables while focus mode is active (richer, but breaks the
   "never override a core color" rule in AGENTS.md)?
   Answer: For now don't override a core color. (Applied.)
2. **`Esc` to leave?** Convenient, but `Esc` already means things in the editor
   and in popovers. Alternative: only the command, the hotkey, and the dock's
   exit button.
   Answer: `Esc` to leave.
3. **Theme and font lists.** How many presets, and which? Proposed to start
   with 3 to 4 themes and 3 fonts, easy to extend in the pure tables.
   Answer: For now we need the 4 "most common" fonts for writers.
4. **Font scope.** Apply the chosen font to the note's body text only, or also
   to headings and code blocks?
   Answer: Apply the font in title and body only.
5. **Does leaving focus mode keep the appearance?** Proposed: the appearance
   only exists while focus mode is on and never leaks into the normal
   workspace.
   Answer: The appearance will only applied when focus-mode is enable.
6. **Dock command.** Add a "Show focus menu" command (needed for keyboard
   access) in v1?
   Answer: No, when focus-mode is enable we can show the dock menu with shift + up arrow key
