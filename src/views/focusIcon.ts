// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

/** Custom icon for the ribbon; registered in `main.ts` via `addIcon`. */
export const FOCUS_ICON_ID = "scribe-focus-fullscreen";

/**
 * Lucide "fullscreen" (ISC license), scaled from the 24-unit box it was
 * authored in up to Obsidian's 100-unit icon box — Obsidian wraps this in its
 * own `<svg viewBox="0 0 100 100">`, so this is content only, not a full
 * `<svg>`. Shipped here instead of relying on the built-in name because
 * Obsidian bundles its own, often older, copy of Lucide. `currentColor` so the
 * icon follows the theme; the ribbon is tinted via the `scribe-ribbon-icon`
 * class.
 */
export const FOCUS_ICON_SVG =
	`<g fill="none" stroke="currentColor" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">` +
	`<path d="M12.5 29.17V20.83a8.33 8.33 0 0 1 8.33-8.33h8.33"/>` +
	`<path d="M70.83 12.5h8.33a8.33 8.33 0 0 1 8.33 8.33v8.33"/>` +
	`<path d="M87.5 70.83v8.33a8.33 8.33 0 0 1-8.33 8.33h-8.33"/>` +
	`<path d="M29.17 87.5H20.83a8.33 8.33 0 0 1-8.33-8.33v-8.33"/>` +
	`<rect width="41.67" height="33.33" x="29.17" y="33.33" rx="4.17"/></g>`;
