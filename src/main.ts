// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { Plugin } from "obsidian";
import type { FocusAppearance } from "./data/focusAppearance";
import { DEFAULT_SETTINGS, normalizeSettings, ScribeFocusModeSettings } from "./settings/settings";
import { FocusController } from "./views/focusController";

/** Lucide icon bundled with Obsidian; a custom one can replace it later via `addIcon`. */
const RIBBON_ICON = "focus";

export default class ScribeFocusModePlugin extends Plugin {
	settings: ScribeFocusModeSettings = { ...DEFAULT_SETTINGS };
	private controller!: FocusController;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.controller = this.addChild(
			new FocusController(
				this.app,
				() => this.settings,
				(patch) => this.updateAppearance(patch),
			),
		);

		// The left ribbon is the plugin's only visible entry point; there is no settings tab.
		this.addRibbonIcon(RIBBON_ICON, "(SL) Focus: Toggle focus mode", () => this.controller.toggle()).addClass(
			"scribe-ribbon-icon",
		);

		// No default hotkey (plugin guidelines): bind one in Hotkeys.
		this.addCommand({
			id: "toggle-focus-mode",
			name: "Toggle focus mode",
			callback: () => this.controller.toggle(),
		});
	}

	async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}

	/** Merges into the in-memory settings first so the caller can re-render at once, then saves. */
	private updateAppearance(patch: Partial<FocusAppearance>): void {
		this.settings = normalizeSettings({ ...this.settings, ...patch });
		void this.saveData(this.settings);
	}
}
