# Changelog

All notable changes to this project are documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Key sound volume: two buttons in the dock, next to the Key sounds switch, make the
  sounds quieter or louder in five steps (disabled while the sounds are off; the
  level is remembered).
- Key sounds: a switch in the dock (off by default, remembered) plays a recorded
  mechanical keyboard as you type in focus mode, with twelve normal keys and
  separate sounds for space, Enter and Backspace.
- Spell check is switched off in the editor while focus mode is on, with no
  setting; it returns when focus mode ends.
- Garamond, Baskerville and Palatino fonts. They are offered in the dock only
  when installed on the writer's computer (detected when focus mode turns on).
- An info button at the right end of the dock that opens a large, centered
  panel: a miniature of the dock with a one-line explanation of each control,
  and the dock's keyboard shortcuts.
- Focus modes, chosen from the dock's Focus mode menu and remembered: Typewriter
  (keeps the current line centered), Spotlight (dims all but the current
  paragraph) and Deep work (dims all but the current line), alongside
  the default Distraction-free. Every mode hides the interface.

### Changed
- The dock now comes back when the pointer reaches any part of the bottom edge of
  the window, not only the bottom center.
- Redesigned the appearance dock: a wider bar that follows the active focus
  theme, with font and theme dropdowns (name, description and a check on the
  current choice) and flat A− / A+ text-size buttons. An open dropdown keeps
  the dock from hiding; `Esc` closes it without leaving focus mode.

## [0.1.0](https://github.com/aescanes/scribe-of-lagash-focus/releases/tag/0.1.0) - 2026-10-17

### Added
- Initial scaffold: build, test, lint and release tooling shared with the other
  Scribe of Lagash plugins.
- Focus view: a full-screen icon in the left ribbon and a "Focus mode" command
  (no default hotkey) hide the sidebars, ribbon, tabs, view header, status bar,
  title bar and other panes, leaving only the current note. `Esc` leaves. The
  plugin has no settings tab and applies to the whole vault; focus mode is
  always off after a restart.
- On desktop, focus mode also goes full screen, and leaving full screen (`Esc`)
  leaves focus mode. `Esc` works whether or not the dock is showing.
- First-run hotkey prompt: the first time the plugin is enabled it asks for a
  key combination for "Focus mode" and opens Obsidian's Hotkeys screen
  filtered to it. A "Set focus mode hotkey" command reopens the prompt. The
  plugin still ships no default hotkey.
- Appearance dock: a bottom-center bar that shows for 3 seconds, reappears when
  the pointer reaches the bottom middle (or on `Shift` + `Up arrow`; `Shift` + `Down arrow` hides it), and
  changes text size, font (Georgia, Times New Roman, Courier New, Helvetica)
  and theme (Paper, Sepia, Dark, Night) instantly. Choices are remembered.
