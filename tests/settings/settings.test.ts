// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SETTINGS, normalizeSettings } from "../../src/settings/settings";

test("absent or malformed data yields the defaults", () => {
	assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
	assert.deepEqual(normalizeSettings("nope"), DEFAULT_SETTINGS);
});

test("a valid mode is kept and an unknown one falls back to the default", () => {
	assert.equal(normalizeSettings({ mode: "spotlight" }).mode, "spotlight");
	assert.equal(normalizeSettings({ mode: "nope" }).mode, DEFAULT_SETTINGS.mode);
});

test("valid stored values are kept", () => {
	assert.deepEqual(normalizeSettings({ fontSize: 24, fontFamily: "courier-new", theme: "night" }), {
		fontSize: 24,
		fontFamily: "courier-new",
		theme: "night",
		hotkeyPrompted: false,
		mode: DEFAULT_SETTINGS.mode,
		keySounds: false,
	});
});

test("hotkeyPrompted is kept only when it is exactly true", () => {
	assert.equal(normalizeSettings({ hotkeyPrompted: true }).hotkeyPrompted, true);
	assert.equal(normalizeSettings({ hotkeyPrompted: "yes" }).hotkeyPrompted, false);
	assert.equal(DEFAULT_SETTINGS.hotkeyPrompted, false);
});

test("keySounds is kept only when it is exactly true", () => {
	assert.equal(normalizeSettings({ keySounds: true }).keySounds, true);
	assert.equal(normalizeSettings({ keySounds: "on" }).keySounds, false);
	assert.equal(DEFAULT_SETTINGS.keySounds, false);
});
