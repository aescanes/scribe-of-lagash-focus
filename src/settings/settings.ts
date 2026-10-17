// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { DEFAULT_FOCUS_MODE, FocusModeId, isFocusModeId } from "../data/focusMode";

/**
 * Persisted state. There is no settings tab: the plugin's options will live
 * inside focus mode itself, so this only holds what that UI will write.
 */
export interface ScribeFocusModeSettings {
	/** The mode the toggle switches on. */
	mode: FocusModeId;
}

export const DEFAULT_SETTINGS: ScribeFocusModeSettings = {
	mode: DEFAULT_FOCUS_MODE,
};

/**
 * Coerces persisted data — which may be absent, partial, or from an older
 * version — into a fully valid settings object. `loadData()` returns whatever
 * was last written, so every field is re-checked here rather than trusted.
 */
export function normalizeSettings(stored: Partial<ScribeFocusModeSettings> | null): ScribeFocusModeSettings {
	const merged = { ...DEFAULT_SETTINGS, ...(stored ?? {}) };
	return {
		mode: isFocusModeId(merged.mode) ? merged.mode : DEFAULT_SETTINGS.mode,
	};
}
