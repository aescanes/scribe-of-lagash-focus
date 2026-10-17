// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { test } from "node:test";
import { DEFAULT_SETTINGS, normalizeSettings } from "../../src/settings/settings";

test("absent data yields the defaults", () => {
	assert.deepEqual(normalizeSettings(null), DEFAULT_SETTINGS);
});

test("an unknown mode falls back and a valid one is kept", () => {
	assert.equal(normalizeSettings({ mode: "bogus" as never }).mode, DEFAULT_SETTINGS.mode);
	assert.equal(normalizeSettings({ mode: "spotlight" }).mode, "spotlight");
});
