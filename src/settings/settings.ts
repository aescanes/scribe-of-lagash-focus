// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { DEFAULT_APPEARANCE, FocusAppearance, normalizeAppearance } from "../data/focusAppearance";

/**
 * Persisted state. There is no settings tab: the appearance options live in
 * the focus dock, which writes the writer's last font size, font and theme here.
 */
export interface ScribeFocusModeSettings extends FocusAppearance {
	/**
	 * Whether the first-run hotkey prompt has been shown. Set as soon as it is
	 * shown, even if dismissed, so it never nags; the writer can reopen it with
	 * the "Set focus mode hotkey" command.
	 */
	hotkeyPrompted: boolean;
}

export const DEFAULT_SETTINGS: ScribeFocusModeSettings = { ...DEFAULT_APPEARANCE, hotkeyPrompted: false };

/**
 * Coerces persisted data — which may be absent, partial, or from an older
 * version (including the earlier `mode` field, which is dropped) — into a
 * fully valid settings object. `loadData()` returns whatever was last
 * written, so every field is re-checked here rather than trusted.
 */
export function normalizeSettings(stored: unknown): ScribeFocusModeSettings {
	const record = typeof stored === "object" && stored !== null ? (stored as Record<string, unknown>) : null;
	return { ...normalizeAppearance(record), hotkeyPrompted: record?.hotkeyPrompted === true };
}
