// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

// Pure rule for which key sound a key press gets — no Obsidian imports,
// unit-tested.

export type KeySoundKind = "key" | "space" | "enter" | "backspace";

export const KEY_SOUND_KINDS: readonly KeySoundKind[] = ["key", "space", "enter", "backspace"];

/** The parts of a `KeyboardEvent` this reads, so it can be tested without a DOM. */
export interface KeyPress {
	key: string;
	ctrlKey: boolean;
	metaKey: boolean;
	altKey: boolean;
	isComposing: boolean;
	repeat: boolean;
}

/**
 * The sound for a key press, or `null` for silence. Only typing makes a sound:
 * letters, digits and punctuation, Tab, space, Enter, and Backspace or Delete.
 * Arrows, modifiers, function keys and shortcuts (Ctrl, Cmd or Alt held) are
 * silent, as are held-key repeats (which would machine-gun) and keys sent
 * while an input method is composing.
 */
export function keySoundFor(press: KeyPress): KeySoundKind | null {
	if (press.isComposing || press.repeat || press.ctrlKey || press.metaKey || press.altKey) return null;
	if (press.key === " ") return "space";
	if (press.key === "Enter") return "enter";
	if (press.key === "Backspace" || press.key === "Delete") return "backspace";
	if (press.key === "Tab") return "key";
	// A printable character is a single code point; "ArrowUp", "Shift" and the like are longer.
	return [...press.key].length === 1 ? "key" : null;
}
