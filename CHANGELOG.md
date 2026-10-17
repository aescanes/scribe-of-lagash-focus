# Changelog

All notable changes to this project are documented in this file. The format
is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Initial scaffold: build, test, lint and release tooling shared with the other
  Scribe of Lagash plugins.
- Four focus modes (distraction-free, typewriter, spotlight, deep work), each a
  bundle of characteristics.
- A focus icon in the left ribbon, a status-bar item and a "Toggle focus mode"
  command (no default hotkey). There is no settings tab and no story-folder
  scope; focus mode applies to the whole vault. Turning it on only sets body
  classes for now; the characteristics themselves aren't implemented yet.
