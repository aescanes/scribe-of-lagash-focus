// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { DEFAULT_APPEARANCE, FocusAppearance, normalizeAppearance } from "../data/focusAppearance";

/**
 * Persisted state. There is no settings tab: the options live in the focus
 * dock, which writes the writer's last font size, font and theme here.
 */
export type ScribeFocusModeSettings = FocusAppearance;

export const DEFAULT_SETTINGS: ScribeFocusModeSettings = { ...DEFAULT_APPEARANCE };

/**
 * Coerces persisted data — which may be absent, partial, or from an older
 * version (including the earlier `mode` field, which is dropped) — into a
 * fully valid settings object. `loadData()` returns whatever was last
 * written, so every field is re-checked here rather than trusted.
 */
export function normalizeSettings(stored: unknown): ScribeFocusModeSettings {
	const record = typeof stored === "object" && stored !== null ? (stored as Record<string, unknown>) : null;
	return normalizeAppearance(record);
}
