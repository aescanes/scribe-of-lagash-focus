// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { test } from "node:test";
import { KEY_SOUND_KINDS } from "../../src/data/keySound";
import { KEY_SOUND_DATA } from "../../src/data/keySoundData";

test("every kind has recordings, and normal keys have several", () => {
	for (const kind of KEY_SOUND_KINDS) assert.ok(KEY_SOUND_DATA[kind].length >= 1, kind);
	assert.ok(KEY_SOUND_DATA.key.length > KEY_SOUND_DATA.space.length);
});

test("each recording is valid base64 for an MP3 of a plausible size", () => {
	for (const kind of KEY_SOUND_KINDS) {
		for (const data of KEY_SOUND_DATA[kind]) {
			assert.match(data, /^[A-Za-z0-9+/]+={0,2}$/, kind);
			const bytes = Buffer.from(data, "base64");
			// An ID3 tag or an MPEG frame sync starts an MP3; the sounds are a few KB each.
			assert.ok(bytes.subarray(0, 3).toString("latin1") === "ID3" || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0), kind);
			assert.ok(bytes.length > 1000 && bytes.length < 20000, `${kind}: ${bytes.length} bytes`);
		}
	}
});
