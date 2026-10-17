# Changelog

All notable changes to this project are documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Initial scaffold: build, test, lint and release tooling shared with the other
  Scribe of Lagash plugins.
- Focus view: a full-screen icon in the left ribbon and a "Toggle focus mode" command
  (no default hotkey) hide the sidebars, ribbon, tabs, view header, status bar,
  title bar and other panes, leaving only the current note. `Esc` leaves. The
  plugin has no settings tab and applies to the whole vault; focus mode is
  always off after a restart.
- On desktop, focus mode also goes full screen, and leaving full screen (`Esc`)
  leaves focus mode. `Esc` works whether or not the dock is showing.
- Appearance dock: a bottom-center bar that shows for 3 seconds, reappears when
  the pointer reaches the bottom middle (or on `Shift` + `Up arrow`; `Shift` + `Down arrow` hides it), and
  changes text size, font (Georgia, Times New Roman, Courier New, Helvetica)
  and theme (Paper, Sepia, Dark, Night) instantly. Choices are remembered.
