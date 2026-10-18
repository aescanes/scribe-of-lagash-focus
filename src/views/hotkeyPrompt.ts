// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { App, Modal, Notice, Setting } from "obsidian";

/** What the Hotkeys screen's search box is filled with. */
const HOTKEY_SEARCH = "Focus mode";

/** Long enough for the Hotkeys tab to finish drawing its list. */
const SEARCH_RETRY_MS = 150;

/** The parts of Obsidian's (undocumented) Hotkeys tab that this relies on. */
interface HotkeysTab {
	searchComponent?: { setValue(value: string): unknown; inputEl?: HTMLInputElement };
	updateHotkeyVisibility?: () => void;
}

/** The parts of Obsidian's (undocumented) settings modal that this relies on. */
interface SettingModal {
	open(): void;
	openTabById(id: string): unknown;
	activeTab?: HotkeysTab;
}

function getSettingModal(app: App): SettingModal | null {
	const candidate = (app as unknown as { setting?: Partial<SettingModal> }).setting;
	if (candidate && typeof candidate.open === "function" && typeof candidate.openTabById === "function") {
		return candidate as SettingModal;
	}
	return null;
}

/**
 * Fills the search box and makes the list react to it. `setValue` alone only
 * changes the text, so the same `input` event typing would send is fired too,
 * which is what Obsidian filters on.
 */
function applySearch(tab: HotkeysTab | undefined): void {
	const search = tab?.searchComponent;
	if (!search) return;
	search.setValue(HOTKEY_SEARCH);
	search.inputEl?.dispatchEvent(new Event("input", { bubbles: true }));
	tab?.updateHotkeyVisibility?.();
}

/**
 * Opens Obsidian's own Hotkeys screen filtered to this plugin's command, so the
 * writer gets Obsidian's key capture and conflict warnings. There is no public
 * API for this: it uses the undocumented `app.setting`, feature-detected, and
 * returns `false` (never throws) if Obsidian no longer has it so the caller can
 * fall back to written instructions.
 */
export function openHotkeySettings(app: App): boolean {
	const setting = getSettingModal(app);
	if (!setting) return false;
	try {
		setting.open();
		setting.openTabById("hotkeys");
		applySearch(setting.activeTab);
		// The tab can finish drawing its list after the call above and show it unfiltered
		// (the box says "Focus mode" but nothing is filtered until you edit it), so apply
		// the search once more when it has settled.
		window.setTimeout(() => applySearch(setting.activeTab), SEARCH_RETRY_MS);
		return true;
	} catch {
		return false;
	}
}

/** Opens the Hotkeys screen, or tells the writer where to find it if that isn't possible. */
export function setHotkey(app: App): void {
	if (!openHotkeySettings(app)) {
		new Notice(`Open settings, then hotkeys, and search for "${HOTKEY_SEARCH}".`);
	}
}

/**
 * Shown the first time the plugin is enabled, and again from a command. The
 * plugin never picks a key itself (Obsidian's guidelines forbid default
 * hotkeys); this only sends the writer to choose one.
 */
export class HotkeyPromptModal extends Modal {
	onOpen(): void {
		this.titleEl.setText("Set a hotkey for Scribe of Lagash focus mode");
		this.contentEl.createEl("p", {
			text: "Focus mode hides everything except the current note. A hotkey is the quickest way to turn it on and off.",
		});
		this.contentEl.createEl("p", {
			text:
				'Choose a key combination for "Focus mode" in the hotkeys screen. You can change it later, ' +
				'or open this prompt again with the "Set focus mode hotkey" command.',
		});
		new Setting(this.contentEl)
			.addButton((b) => b.setButtonText("Maybe later").onClick(() => this.close()))
			.addButton((b) =>
				b
					.setButtonText("Set hotkey")
					.setCta()
					.onClick(() => {
						this.close();
						setHotkey(this.app);
					}),
			);
	}

	onClose(): void {
		this.contentEl.empty();
	}
}
