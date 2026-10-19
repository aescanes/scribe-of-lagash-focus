// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { KEY_SOUND_KINDS, KeySoundKind, pickVariant } from "../data/keySound";
import { KEY_SOUND_DATA } from "../data/keySoundData";

/**
 * Overall loudness, and the balance between kinds. The samples are already
 * levelled per kind (normal keys quietest, space loudest); this is what to turn
 * down if the sounds are too much.
 */
const MASTER_VOLUME = 0.2;
const KIND_VOLUME: Record<KeySoundKind, number> = { key: 1, space: 1, enter: 1, backspace: 1 };

/** Each press varies a little in pitch and loudness, so it never sounds like one looped clip. */
const PITCH_SPREAD = 0.06;
const VOLUME_SPREAD = 0.2;

function base64ToBytes(data: string): ArrayBuffer {
	const binary = window.atob(data);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return bytes.buffer;
}

/**
 * Plays the embedded key sounds with the Web Audio API, which starts a sound
 * with almost no delay (an `<audio>` element would lag behind the typing). Each
 * kind has several recordings and a press picks one at random, never the one
 * just played. The audio context and the decoded samples are made lazily, the
 * first time they are needed, and released by `dispose`.
 */
export class KeySoundPlayer {
	private context: AudioContext | null = null;
	private readonly buffers = new Map<KeySoundKind, AudioBuffer[]>();
	private readonly lastPlayed = new Map<KeySoundKind, number>();
	private loading: Promise<void> | null = null;

	/** Decodes the samples once; call it early so the first key press is not silent. */
	load(): Promise<void> {
		this.loading ??= this.decodeAll();
		return this.loading;
	}

	play(kind: KeySoundKind): void {
		const variants = this.buffers.get(kind);
		const context = this.context;
		if (!variants || variants.length === 0 || !context) {
			void this.load();
			return;
		}
		// Browsers start a context suspended until the page has had a user gesture; typing is one.
		if (context.state === "suspended") void context.resume();

		const source = context.createBufferSource();
		const variant = pickVariant(variants.length, this.lastPlayed.get(kind), Math.random);
		this.lastPlayed.set(kind, variant);
		source.buffer = variants[variant];
		source.playbackRate.value = 1 - PITCH_SPREAD / 2 + Math.random() * PITCH_SPREAD;
		const gain = context.createGain();
		gain.gain.value = MASTER_VOLUME * KIND_VOLUME[kind] * (1 - Math.random() * VOLUME_SPREAD);
		source.connect(gain).connect(context.destination);
		source.start();
	}

	dispose(): void {
		void this.context?.close();
		this.context = null;
		this.buffers.clear();
		this.lastPlayed.clear();
		this.loading = null;
	}

	private async decodeAll(): Promise<void> {
		try {
			const context = (this.context ??= new AudioContext());
			for (const kind of KEY_SOUND_KINDS) {
				const variants: AudioBuffer[] = [];
				for (const data of KEY_SOUND_DATA[kind]) variants.push(await context.decodeAudioData(base64ToBytes(data)));
				this.buffers.set(kind, variants);
			}
		} catch (error) {
			// Sounds are a nicety: if decoding fails typing goes on silently, and a later toggle retries.
			console.error("Scribe of Lagash Focus: could not load the key sounds", error);
			this.loading = null;
		}
	}
}
