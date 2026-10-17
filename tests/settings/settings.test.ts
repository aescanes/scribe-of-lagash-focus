// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SETTINGS, normalizeSettings } from "../../src/settings/settings";

test("absent or malformed data yields the defaults", () => {
	assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
	assert.deepEqual(normalizeSettings("nope"), DEFAULT_SETTINGS);
});

test("the dropped mode field is ignored", () => {
	assert.deepEqual(normalizeSettings({ mode: "spotlight" }), DEFAULT_SETTINGS);
});

test("valid stored values are kept", () => {
	assert.deepEqual(normalizeSettings({ fontSize: 24, fontFamily: "courier-new", theme: "night" }), {
		fontSize: 24,
		fontFamily: "courier-new",
		theme: "night",
		hotkeyPrompted: false,
	});
});

test("hotkeyPrompted is kept only when it is exactly true", () => {
	assert.equal(normalizeSettings({ hotkeyPrompted: true }).hotkeyPrompted, true);
	assert.equal(normalizeSettings({ hotkeyPrompted: "yes" }).hotkeyPrompted, false);
	assert.equal(DEFAULT_SETTINGS.hotkeyPrompted, false);
});
