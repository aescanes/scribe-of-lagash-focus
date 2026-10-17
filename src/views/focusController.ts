// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { Component } from "obsidian";
import { FocusMode, focusBodyClasses, getFocusMode } from "../data/focusMode";
import type { ScribeFocusModeSettings } from "../settings/settings";

/**
 * Owns the one piece of live state in this plugin — whether focus mode is on —
 * and reflects it as classes on `<body>` plus a status-bar item. It does not
 * realize any characteristic itself: `styles.css` (and, later, editor
 * extensions) key off the classes from `focusBodyClasses`, so each feature
 * lands without touching this wiring. Applies to the whole vault.
 */
export class FocusController extends Component {
	private enabled = false;
	private appliedClasses: string[] = [];
	private body: HTMLElement | null = null;

	constructor(
		private readonly getSettings: () => ScribeFocusModeSettings,
		private readonly statusBarEl: HTMLElement,
	) {
		super();
	}

	onload(): void {
		this.statusBarEl.addClass("scribe-focus-status-bar", "mod-clickable");
		this.registerDomEvent(this.statusBarEl, "click", () => this.toggle());
		this.refresh();
	}

	onunload(): void {
		this.clearClasses();
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	toggle(): void {
		this.setEnabled(!this.enabled);
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled;
		this.refresh();
	}

	/** Re-derives the body classes and status bar from the current state and settings. */
	refresh(): void {
		const mode = getFocusMode(this.getSettings().mode);
		this.clearClasses();
		if (this.enabled) this.applyClasses(mode);
		this.renderStatusBar(mode);
	}

	private applyClasses(mode: FocusMode): void {
		this.body = activeDocument.body;
		this.appliedClasses = focusBodyClasses(mode);
		this.body.addClass(...this.appliedClasses);
	}

	private clearClasses(): void {
		if (this.body && this.appliedClasses.length > 0) this.body.removeClass(...this.appliedClasses);
		this.appliedClasses = [];
		this.body = null;
	}

	private renderStatusBar(mode: FocusMode): void {
		this.statusBarEl.toggleClass("mod-hidden", !this.enabled);
		if (this.enabled) this.statusBarEl.setText(`(SL) Focus: ${mode.name}`);
	}
}
