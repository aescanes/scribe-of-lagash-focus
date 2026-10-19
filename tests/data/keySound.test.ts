// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { test } from "node:test";
import { clampKeyVolume, KEY_VOLUME, KeyPress, keySoundFor, keyVolumeGain, pickVariant, stepKeyVolume } from "../../src/data/keySound";

function press(key: string, extra: Partial<KeyPress> = {}): KeyPress {
	return { key, ctrlKey: false, metaKey: false, altKey: false, isComposing: false, repeat: false, ...extra };
}

test("typing keys get the key sound, space, Enter and Backspace their own", () => {
	assert.equal(keySoundFor(press("a")), "key");
	assert.equal(keySoundFor(press("A")), "key");
	assert.equal(keySoundFor(press("7")), "key");
	assert.equal(keySoundFor(press(".")), "key");
	assert.equal(keySoundFor(press("ñ")), "key");
	assert.equal(keySoundFor(press("Tab")), "key");
	assert.equal(keySoundFor(press("Backspace")), "backspace");
	assert.equal(keySoundFor(press("Delete")), "backspace");
	assert.equal(keySoundFor(press(" ")), "space");
	assert.equal(keySoundFor(press("Enter")), "enter");
});

test("modifiers, arrows and function keys are silent", () => {
	for (const key of ["Shift", "Control", "Alt", "Meta", "CapsLock", "ArrowUp", "ArrowLeft", "F5", "Escape"]) {
		assert.equal(keySoundFor(press(key)), null, key);
	}
});

test("shortcuts, held keys and composition are silent", () => {
	assert.equal(keySoundFor(press("s", { metaKey: true })), null);
	assert.equal(keySoundFor(press("s", { ctrlKey: true })), null);
	assert.equal(keySoundFor(press("a", { repeat: true })), null);
	assert.equal(keySoundFor(press("a", { isComposing: true })), null);
});

test("pickVariant stays in range and never repeats the last one", () => {
	for (const count of [2, 3, 12]) {
		for (let last = 0; last < count; last++) {
			for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
				const picked = pickVariant(count, last, () => roll);
				assert.ok(picked >= 0 && picked < count, `count ${count} last ${last} roll ${roll}`);
				assert.notEqual(picked, last, `count ${count} last ${last} roll ${roll}`);
			}
		}
	}
});

test("pickVariant with one recording always picks it, and with no history uses the roll", () => {
	assert.equal(pickVariant(1, 0, () => 0.9), 0);
	assert.equal(pickVariant(4, undefined, () => 0.5), 2);
});

test("clampKeyVolume rounds, clamps, and defaults on junk", () => {
	assert.equal(clampKeyVolume(3.6), 4);
	assert.equal(clampKeyVolume(0), KEY_VOLUME.min);
	assert.equal(clampKeyVolume(99), KEY_VOLUME.max);
	assert.equal(clampKeyVolume("5"), KEY_VOLUME.default);
	assert.equal(clampKeyVolume(NaN), KEY_VOLUME.default);
});

test("stepKeyVolume moves one step and stops at the ends", () => {
	assert.equal(stepKeyVolume(4, 1), 5);
	assert.equal(stepKeyVolume(4, -1), 3);
	assert.equal(stepKeyVolume(KEY_VOLUME.max, 1), KEY_VOLUME.max);
	assert.equal(stepKeyVolume(KEY_VOLUME.min, -1), KEY_VOLUME.min);
});

test("keyVolumeGain runs from quiet to full and is always audible", () => {
	assert.equal(keyVolumeGain(KEY_VOLUME.max), 0.5);
	assert.ok(Math.abs(keyVolumeGain(KEY_VOLUME.default) - 0.2) < 1e-9);
	assert.ok(keyVolumeGain(KEY_VOLUME.min) > 0);
	assert.ok(keyVolumeGain(5) > keyVolumeGain(4));
	assert.equal(keyVolumeGain(NaN), keyVolumeGain(KEY_VOLUME.default));
});
