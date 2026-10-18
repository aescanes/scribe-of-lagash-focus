// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

/** Wide, varied glyphs, so two different fonts almost never measure the same. */
const SAMPLE = "mmmmmmmmmmlli0Oqgy";

/** Generic families to compare against; a font that is missing renders as whichever one is named. */
const BASELINES = ["monospace", "serif", "sans-serif"];

/**
 * Whether `family` is installed on this computer. The browser gives no list of
 * fonts, and `document.fonts.check` answers true for fonts that don't exist,
 * so this draws a sample in the font with each generic family as the fallback
 * and compares widths: if the font is missing, the text is drawn in the
 * fallback and the width matches it exactly. Works on mobile too.
 */
export function isFontInstalled(family: string): boolean {
	// The global `createEl` makes a detached element; `activeDocument.createEl` would try to
	// append it to the document and throw.
	const context = createEl("canvas").getContext("2d");
	if (!context) return false;
	const measure = (font: string): number => {
		context.font = `72px ${font}`;
		return context.measureText(SAMPLE).width;
	};
	return BASELINES.some((base) => measure(`"${family}", ${base}`) !== measure(base));
}
