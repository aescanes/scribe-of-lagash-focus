// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { addIcon, Plugin } from "obsidian";
import { DEFAULT_SETTINGS, normalizeSettings, ScribeFocusModeSettings } from "./settings/settings";
import { FocusController } from "./views/focusController";
import { FocusEditorEngine } from "./views/focusEditor";
import { FOCUS_ICON_ID, FOCUS_ICON_SVG } from "./views/focusIcon";
import { ScribeFocusModeSettingTab } from "./settings/settingsTab";
import { HotkeyPromptModal } from "./views/hotkeyPrompt";

export default class ScribeFocusModePlugin extends Plugin {
	settings: ScribeFocusModeSettings = { ...DEFAULT_SETTINGS };
	private controller!: FocusController;

	async onload(): Promise<void> {
		await this.loadSettings();

		addIcon(FOCUS_ICON_ID, FOCUS_ICON_SVG);

		const editor = new FocusEditorEngine();
		this.registerEditorExtension(editor.extension());

		this.controller = this.addChild(
			new FocusController(
				this.app,
				() => this.settings,
				(patch) => this.updateSettings(patch),
				editor,
			),
		);

		// The left ribbon is the plugin's only visible entry point; the settings tab only holds the support link.
		this.addRibbonIcon(FOCUS_ICON_ID, "(SL) Focus mode", () => this.controller.toggle()).addClass(
			"scribe-ribbon-icon",
		);

		this.addSettingTab(new ScribeFocusModeSettingTab(this.app, this));

		// No default hotkey (plugin guidelines): bind one in Hotkeys.
		this.addCommand({
			id: "focus-mode",
			name: "Focus mode",
			callback: () => this.controller.toggle(),
		});

		this.addCommand({
			id: "set-focus-mode-hotkey",
			name: "Set focus mode hotkey",
			callback: () => new HotkeyPromptModal(this.app).open(),
		});

		// The first time the plugin is enabled, ask for a hotkey once the workspace is
		// ready (immediately, if the plugin was enabled from settings mid-session).
		if (!this.settings.hotkeyPrompted) {
			this.app.workspace.onLayoutReady(() => void this.promptForHotkey());
		}
	}

	async loadSettings(): Promise<void> {
		this.settings = normalizeSettings(await this.loadData());
	}

	/** Marked as shown before it opens, so a dismissed prompt never comes back on its own. */
	private async promptForHotkey(): Promise<void> {
		this.settings = { ...this.settings, hotkeyPrompted: true };
		await this.saveData(this.settings);
		new HotkeyPromptModal(this.app).open();
	}

	/** Merges into the in-memory settings first so the caller can re-render at once, then saves. */
	private updateSettings(patch: Partial<ScribeFocusModeSettings>): void {
		this.settings = normalizeSettings({ ...this.settings, ...patch });
		void this.saveData(this.settings);
	}
}
