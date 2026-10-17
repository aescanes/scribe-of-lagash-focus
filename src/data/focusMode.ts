// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

// Pure focus-mode definitions — no Obsidian imports, unit-tested. A mode is a
// named bundle of "characteristics" (what the editor hides, centers or dims);
// the views layer decides how to realize each one. Every mode hides the
// interface — the dock that switches modes only exists in the focus view — so
// the modes differ only in how the text is centered and dimmed.

export type FocusModeId = "distraction-free" | "typewriter" | "spotlight" | "deep-work";

/** How much of the note outside the writer's current position is dimmed. */
export type DimScope = "none" | "paragraph" | "line";

export interface FocusCharacteristics {
	/** Collapse both sidebars and the ribbon. */
	hideSidebars: boolean;
	/** Hide the status bar. */
	hideStatusBar: boolean;
	/** Hide the tab strip and note header. */
	hideTabs: boolean;
	/** Keep the active line vertically centered while typing. */
	typewriterScroll: boolean;
	/** Dim everything except the current paragraph or line. */
	dim: DimScope;
}

export interface FocusMode {
	id: FocusModeId;
	name: string;
	description: string;
	characteristics: FocusCharacteristics;
}

/** In display order; the first entry is the default mode. */
export const FOCUS_MODES: readonly FocusMode[] = [
	{
		id: "distraction-free",
		name: "Distraction-free",
		description: "Only the page, nothing dimmed.",
		characteristics: { hideSidebars: true, hideStatusBar: true, hideTabs: true, typewriterScroll: false, dim: "none" },
	},
	{
		id: "typewriter",
		name: "Typewriter",
		description: "Keeps the line you are writing in a box at the middle.",
		characteristics: { hideSidebars: true, hideStatusBar: true, hideTabs: true, typewriterScroll: true, dim: "line" },
	},
	{
		id: "spotlight",
		name: "Spotlight",
		description: "Dims all but the current paragraph.",
		characteristics: { hideSidebars: true, hideStatusBar: true, hideTabs: true, typewriterScroll: false, dim: "paragraph" },
	},
	{
		id: "deep-work",
		name: "Deep work",
		description: "Dims all but the current line.",
		characteristics: { hideSidebars: true, hideStatusBar: true, hideTabs: true, typewriterScroll: false, dim: "line" },
	},
];

export const DEFAULT_FOCUS_MODE: FocusModeId = "distraction-free";

export function isFocusModeId(value: unknown): value is FocusModeId {
	return FOCUS_MODES.some((mode) => mode.id === value);
}

/** The mode for `id`; falls back to the default for anything unrecognized. */
export function getFocusMode(id: unknown): FocusMode {
	return FOCUS_MODES.find((mode) => mode.id === id) ?? FOCUS_MODES[0];
}

/** The mode after `id` in display order, wrapping around — for a "cycle" command. */
export function nextFocusMode(id: FocusModeId): FocusModeId {
	const index = FOCUS_MODES.findIndex((mode) => mode.id === id);
	return FOCUS_MODES[(index + 1) % FOCUS_MODES.length].id;
}

/**
 * Body classes that express an active mode: one for "focus is on", one for the
 * mode itself, and one per characteristic that is switched on. Keeping the
 * styling in CSS keyed off these means the stylesheet, not JavaScript, owns
 * how each characteristic looks.
 */
export function focusBodyClasses(mode: FocusMode): string[] {
	const c = mode.characteristics;
	const classes = ["scribe-focus-active", `scribe-focus-mode-${mode.id}`];
	if (c.hideSidebars) classes.push("scribe-focus-hide-sidebars");
	if (c.hideStatusBar) classes.push("scribe-focus-hide-status-bar");
	if (c.hideTabs) classes.push("scribe-focus-hide-tabs");
	if (c.typewriterScroll) classes.push("scribe-focus-typewriter");
	if (c.dim !== "none") classes.push(`scribe-focus-dim-${c.dim}`);
	return classes;
}
