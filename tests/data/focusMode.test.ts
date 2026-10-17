// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { test } from "node:test";
import {
	DEFAULT_FOCUS_MODE,
	FOCUS_MODES,
	focusBodyClasses,
	getFocusMode,
	isFocusModeId,
	nextFocusMode,
} from "../../src/data/focusMode";

test("mode ids are unique and the default exists", () => {
	const ids = FOCUS_MODES.map((m) => m.id);
	assert.equal(new Set(ids).size, ids.length);
	assert.ok(isFocusModeId(DEFAULT_FOCUS_MODE));
});

test("isFocusModeId rejects unknown values", () => {
	assert.equal(isFocusModeId("typewriter"), true);
	assert.equal(isFocusModeId("nope"), false);
	assert.equal(isFocusModeId(undefined), false);
});

test("getFocusMode falls back to the first mode", () => {
	assert.equal(getFocusMode("spotlight").id, "spotlight");
	assert.equal(getFocusMode("nope").id, FOCUS_MODES[0].id);
});

test("nextFocusMode walks the list and wraps", () => {
	assert.equal(nextFocusMode("distraction-free"), "typewriter");
	assert.equal(nextFocusMode(FOCUS_MODES[FOCUS_MODES.length - 1].id), FOCUS_MODES[0].id);
});

test("body classes reflect the mode's characteristics", () => {
	assert.deepEqual(focusBodyClasses(getFocusMode("typewriter")), [
		"scribe-focus-active",
		"scribe-focus-mode-typewriter",
		"scribe-focus-hide-sidebars",
		"scribe-focus-hide-status-bar",
		"scribe-focus-hide-tabs",
		"scribe-focus-typewriter",
		"scribe-focus-dim-line",
	]);
	assert.deepEqual(focusBodyClasses(getFocusMode("deep-work")), [
		"scribe-focus-active",
		"scribe-focus-mode-deep-work",
		"scribe-focus-hide-sidebars",
		"scribe-focus-hide-status-bar",
		"scribe-focus-hide-tabs",
		"scribe-focus-dim-line",
	]);
});
