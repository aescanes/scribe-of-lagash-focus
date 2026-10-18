// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	appearanceBodyClasses,
	availableFonts,
	clampFontSize,
	DEFAULT_APPEARANCE,
	FONT_SIZE,
	FONTS,
	normalizeAppearance,
	stepFontSize,
	THEMES,
} from "../../src/data/focusAppearance";

test("font and theme ids are unique, and the defaults exist", () => {
	assert.equal(new Set(FONTS.map((f) => f.id)).size, FONTS.length);
	assert.equal(new Set(THEMES.map((t) => t.id)).size, THEMES.length);
	assert.ok(FONTS.some((f) => f.id === DEFAULT_APPEARANCE.fontFamily));
	assert.ok(THEMES.some((t) => t.id === DEFAULT_APPEARANCE.theme));
});

test("clampFontSize rounds, clamps, and defaults on junk", () => {
	assert.equal(clampFontSize(20.4), 20);
	assert.equal(clampFontSize(1), FONT_SIZE.min);
	assert.equal(clampFontSize(500), FONT_SIZE.max);
	assert.equal(clampFontSize("18"), FONT_SIZE.default);
	assert.equal(clampFontSize(NaN), FONT_SIZE.default);
});

test("stepFontSize moves by one step and stops at the ends", () => {
	assert.equal(stepFontSize(18, 1), 18 + FONT_SIZE.step);
	assert.equal(stepFontSize(18, -1), 18 - FONT_SIZE.step);
	assert.equal(stepFontSize(FONT_SIZE.max, 1), FONT_SIZE.max);
	assert.equal(stepFontSize(FONT_SIZE.min, -1), FONT_SIZE.min);
});

test("normalizeAppearance keeps valid fields and replaces invalid ones", () => {
	assert.deepEqual(normalizeAppearance(null), DEFAULT_APPEARANCE);
	assert.deepEqual(normalizeAppearance({ fontSize: 99, fontFamily: "comic", theme: "sepia" }), {
		fontSize: FONT_SIZE.max,
		fontFamily: DEFAULT_APPEARANCE.fontFamily,
		theme: "sepia",
	});
});

test("body classes name the font and theme", () => {
	assert.deepEqual(appearanceBodyClasses({ fontSize: 18, fontFamily: "courier-new", theme: "night" }), [
		"scribe-focus-font-courier-new",
		"scribe-focus-theme-night",
	]);
});

test("fonts with a probe are offered only when one of its families is installed", () => {
	const none = availableFonts(() => false);
	assert.ok(none.length > 0);
	assert.ok(none.every((f) => !f.probe));
	assert.ok(!none.some((f) => f.id === "garamond"));

	const withBaskerville = availableFonts((family) => family === "Baskerville Old Face");
	assert.ok(withBaskerville.some((f) => f.id === "baskerville"));
	assert.ok(!withBaskerville.some((f) => f.id === "garamond"));

	assert.equal(availableFonts(() => true).length, FONTS.length);
});

test("the default font is always available", () => {
	assert.ok(availableFonts(() => false).some((f) => f.id === DEFAULT_APPEARANCE.fontFamily));
});
