// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

// Pure appearance model for the focus view — no Obsidian imports, unit-tested.
// Colors and font stacks live in styles.css, keyed by the ids below; code only
// decides which ids are active, so no color is ever set from JavaScript.

export type FontId = "georgia" | "times-new-roman" | "courier-new" | "helvetica";
export type ThemeId = "paper" | "sepia" | "dark" | "night";

export interface FontOption {
	id: FontId;
	name: string;
	/** The short line shown under the name in the dock's menu. */
	description: string;
}

export interface ThemeOption {
	id: ThemeId;
	name: string;
	description: string;
}

/** In display order. Every font is a system font, so nothing is bundled. */
export const FONTS: readonly FontOption[] = [
	{ id: "georgia", name: "Georgia", description: "Serif · classic book text" },
	{ id: "times-new-roman", name: "Times New Roman", description: "Serif · traditional print" },
	{ id: "courier-new", name: "Courier New", description: "Mono · a typescript feel" },
	{ id: "helvetica", name: "Helvetica", description: "Sans · clean and neutral" },
];

/** In display order. */
export const THEMES: readonly ThemeOption[] = [
	{ id: "paper", name: "Paper", description: "Warm white" },
	{ id: "sepia", name: "Sepia", description: "Dried clay" },
	{ id: "dark", name: "Dark", description: "Neutral dark" },
	{ id: "night", name: "Night", description: "Dark, low glare" },
];

/** Font size in pixels. */
export const FONT_SIZE = { min: 12, max: 36, step: 2, default: 18 } as const;

export interface FocusAppearance {
	fontSize: number;
	fontFamily: FontId;
	theme: ThemeId;
}

export const DEFAULT_APPEARANCE: FocusAppearance = {
	fontSize: FONT_SIZE.default,
	fontFamily: FONTS[0].id,
	theme: THEMES[0].id,
};

export function isFontId(value: unknown): value is FontId {
	return FONTS.some((font) => font.id === value);
}

export function isThemeId(value: unknown): value is ThemeId {
	return THEMES.some((theme) => theme.id === value);
}

/** Rounds to a whole pixel and clamps to the allowed range; anything non-numeric becomes the default. */
export function clampFontSize(value: unknown): number {
	if (typeof value !== "number" || !Number.isFinite(value)) return FONT_SIZE.default;
	return Math.min(FONT_SIZE.max, Math.max(FONT_SIZE.min, Math.round(value)));
}

/** One step larger (`1`) or smaller (`-1`), staying inside the allowed range. */
export function stepFontSize(size: number, direction: 1 | -1): number {
	return clampFontSize(size + direction * FONT_SIZE.step);
}

/**
 * Coerces persisted data — which may be absent, partial, or from an older
 * version — into a valid appearance, re-checking every field.
 */
export function normalizeAppearance(stored: Partial<Record<keyof FocusAppearance, unknown>> | null): FocusAppearance {
	return {
		fontSize: clampFontSize(stored?.fontSize),
		fontFamily: isFontId(stored?.fontFamily) ? stored.fontFamily : DEFAULT_APPEARANCE.fontFamily,
		theme: isThemeId(stored?.theme) ? stored.theme : DEFAULT_APPEARANCE.theme,
	};
}

/** Body classes that select the font and theme; the stylesheet owns what they look like. */
export function appearanceBodyClasses(appearance: FocusAppearance): string[] {
	return [`scribe-focus-font-${appearance.fontFamily}`, `scribe-focus-theme-${appearance.theme}`];
}
