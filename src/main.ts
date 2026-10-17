// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, normalizeSettings, ScribeFocusModeSettings } from "./settings/settings";
import { FocusController } from "./views/focusController";

/** Lucide icon bundled with Obsidian; a custom one can replace it later via `addIcon`. */
const RIBBON_ICON = "focus";

export default class ScribeFocusModePlugin extends Plugin {
	settings: ScribeFocusModeSettings = { ...DEFAULT_SETTINGS };
	private controller!: FocusController;

	async onload(): Promise<void> {
		await this.loadSettings();

		this.controller = this.addChild(new FocusController(() => this.settings, this.addStatusBarItem()));

		// The left ribbon is the plugin's only entry point; there is no settings tab.
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
		this.settings = normalizeSettings((await this.loadData()) as Partial<ScribeFocusModeSettings> | null);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
		this.controller.refresh();
	}
}
