// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { App, PluginSettingTab, Setting } from "obsidian";
import type { SettingDefinitionItem } from "obsidian";
import type ScribeFocusModePlugin from "../main";

const SUPPORT_NAME = "If this plugin helps your writing, you can support its development";
const SUPPORT_URL = "https://ko-fi.com/O3J528W3FZ";

/**
 * Only holds the support link: the appearance options live in the focus dock,
 * not here. Declarative path (Obsidian 1.13+) and `display()` fallback share
 * `renderSupportButton`.
 */
export class ScribeFocusModeSettingTab extends PluginSettingTab {
	constructor(app: App, plugin: ScribeFocusModePlugin) {
		super(app, plugin);
	}

	private renderSupportButton(setting: Setting): void {
		setting.addButton((button) =>
			button
				.setButtonText("Buy me a coffee")
				.setCta()
				.onClick(() => window.open(SUPPORT_URL)),
		);
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				type: "group",
				heading: "Support",
				items: [
					{
						name: SUPPORT_NAME,
						searchable: false,
						render: (setting) => this.renderSupportButton(setting),
					},
				],
			},
		];
	}

	/** @deprecated Fallback for Obsidian < 1.13.0; see `getSettingDefinitions()`. */
	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Support").setHeading();
		this.renderSupportButton(new Setting(containerEl).setName(SUPPORT_NAME));
	}
}
