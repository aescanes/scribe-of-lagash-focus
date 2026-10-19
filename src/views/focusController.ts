// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { App, Component, MarkdownView, Notice, Platform } from "obsidian";
import {
	appearanceBodyClasses,
	availableFonts,
	effectiveFontId,
	FontId,
	FontOption,
	stepFontSize,
	ThemeId,
} from "../data/focusAppearance";
import { keySoundFor } from "../data/keySound";
import { FocusModeId, focusBodyClasses, getFocusMode } from "../data/focusMode";
import { ScribeFocusModeSettings } from "../settings/settings";
import { FocusDock } from "./focusDock";
import { FocusEditorEngine } from "./focusEditor";
import { isFontInstalled } from "./fontDetector";
import { KeySoundPlayer } from "./keySoundPlayer";

/** CSS custom property that carries the font size; the one value set from code. */
const FONT_SIZE_PROPERTY = "--scribe-focus-font-size";

/** Anything open on top of the editor that handles `Esc` for itself. */
const OVERLAY_SELECTOR = ".modal-container, .menu, .suggestion-container";

/**
 * Owns the one piece of live state in this plugin — whether focus mode is on —
 * and reflects it as classes on `<body>` (plus the font-size variable) and the
 * appearance dock. It realizes no effect itself: `styles.css` keys off the
 * classes from `focusBodyClasses` and `appearanceBodyClasses`. Applies to the
 * whole vault, and only while on: the appearance never leaks into the normal
 * workspace, and the on/off state is deliberately not persisted.
 *
 * On desktop, turning focus mode on also asks for the window to go full screen
 * (web Fullscreen API; no Electron API, to stay mobile-safe). While a page is
 * full screen the browser handles `Esc` itself — it exits full screen without
 * ever delivering the key to the page — so leaving full screen by any route is
 * treated as leaving focus mode, which makes a single `Esc` end both.
 */
export class FocusController extends Component {
	private enabled = false;
	private appliedClasses: string[] = [];
	private body: HTMLElement | null = null;
	private dock: FocusDock | null = null;
	private readonly sounds = new KeySoundPlayer();
	/** The fonts installed on this computer; checked each time focus mode turns on. */
	private fonts: readonly FontOption[] = availableFonts(() => false);
	/** Whether this controller put the window into full screen and so must take it out. */
	private enteredFullscreen = false;

	constructor(
		private readonly app: App,
		private readonly getSettings: () => ScribeFocusModeSettings,
		private readonly saveSettings: (patch: Partial<ScribeFocusModeSettings>) => void,
		private readonly editor: FocusEditorEngine,
	) {
		super();
	}

	onload(): void {
		this.registerDomEvent(activeDocument, "keydown", (evt) => this.onEscape(evt));
		// Capture phase: the editor handles Shift+Up/Down (extending the selection) and
		// marks the event handled before it bubbles up here, so only a listener that
		// runs first can see it. It never stops or prevents the event.
		this.registerDomEvent(activeDocument, "keydown", (evt) => this.onDockKey(evt), { capture: true });
		this.registerDomEvent(activeDocument, "keydown", (evt) => this.onKeySound(evt), { capture: true });
		this.registerDomEvent(activeDocument, "fullscreenchange", () => this.onFullscreenChange());
	}

	onunload(): void {
		this.setEnabled(false);
		this.sounds.dispose();
	}

	isEnabled(): boolean {
		return this.enabled;
	}

	toggle(): void {
		this.setEnabled(!this.enabled);
	}

	setEnabled(enabled: boolean): void {
		if (enabled === this.enabled) return;
		if (enabled && !this.app.workspace.getActiveViewOfType(MarkdownView)) {
			new Notice("Open a note to use focus mode.");
			return;
		}
		this.enabled = enabled;
		if (enabled) this.fonts = availableFonts(isFontInstalled);
		this.refresh();
		if (enabled) {
			this.dock = this.addChild(new FocusDock(this.dockHandlers(), this.appearance(), this.getSettings().mode, this.fonts, this.getSettings().keySounds));
			this.dock.show();
			void this.enterFullscreen();
		} else {
			if (this.dock) this.removeChild(this.dock);
			this.dock = null;
			void this.exitFullscreen();
		}
	}

	/**
	 * Best effort: the request needs a recent user gesture (the ribbon click or
	 * hotkey provides one) and can be refused, in which case focus mode simply
	 * carries on in the normal window.
	 */
	private async enterFullscreen(): Promise<void> {
		const doc = activeDocument;
		if (!Platform.isDesktop || doc.fullscreenElement) return;
		try {
			await doc.documentElement.requestFullscreen();
		} catch {
			return;
		}
		this.enteredFullscreen = true;
		// Focus mode was switched off while the request was pending.
		if (!this.enabled) void this.exitFullscreen();
	}

	private async exitFullscreen(): Promise<void> {
		if (!this.enteredFullscreen) return;
		// Cleared first: the `fullscreenchange` this triggers must not read as the writer leaving.
		this.enteredFullscreen = false;
		if (!activeDocument.fullscreenElement) return;
		try {
			await activeDocument.exitFullscreen();
		} catch {
			// Already out of full screen; nothing to undo.
		}
	}

	private onFullscreenChange(): void {
		if (this.enteredFullscreen && !activeDocument.fullscreenElement) {
			this.enteredFullscreen = false;
			this.setEnabled(false);
		}
	}

	/** Re-derives the body classes, font size, and dock from the current state. */
	refresh(): void {
		this.clearClasses();
		if (this.enabled) this.applyClasses();
		const { dim, typewriterScroll } = getFocusMode(this.getSettings().mode).characteristics;
		this.editor.set(this.enabled, this.enabled ? dim : "none", this.enabled && typewriterScroll);
		this.dock?.update(this.appearance(), this.getSettings().mode, this.getSettings().keySounds);
		// Decoded ahead of the first key press, so that press is not silent.
		if (this.enabled && this.getSettings().keySounds) void this.sounds.load();
	}

	private dockHandlers() {
		return {
			changeFontSize: (direction: 1 | -1) =>
				this.change({ fontSize: stepFontSize(this.getSettings().fontSize, direction) }),
			setMode: (mode: FocusModeId) => this.change({ mode }),
			setKeySounds: (keySounds: boolean) => this.change({ keySounds }),
			setFont: (fontFamily: FontId) => this.change({ fontFamily }),
			setTheme: (theme: ThemeId) => this.change({ theme }),
		};
	}

	/** Applies a dock change to the note at once, then saves it. */
	private change(patch: Partial<ScribeFocusModeSettings>): void {
		this.saveSettings(patch);
		this.refresh();
	}

	/** Bubble phase, so a popover or the editor that already used `Esc` wins. */
	private onEscape(evt: KeyboardEvent): void {
		if (!this.enabled || evt.defaultPrevented || evt.key !== "Escape") return;
		// Handled whether or not the dock is showing or has focus: keys bubble up from it too.
		if (!activeDocument.querySelector(OVERLAY_SELECTOR)) this.setEnabled(false);
	}

	/** Shift+Up slides the dock up, Shift+Down slides it away. */
	private onDockKey(evt: KeyboardEvent): void {
		if (!this.enabled || !evt.shiftKey || evt.ctrlKey || evt.metaKey || evt.altKey) return;
		if (evt.key === "ArrowUp") this.dock?.show();
		else if (evt.key === "ArrowDown") this.dock?.hide();
	}

	/**
	 * The settings as shown: a saved font that is not installed here (settings
	 * can come from another computer) is shown as the default, but not saved
	 * over, so it comes back where the font exists.
	 */
	private appearance(): ScribeFocusModeSettings {
		const settings = this.getSettings();
		return { ...settings, fontFamily: effectiveFontId(settings.fontFamily, this.fonts) };
	}

	/** Typing in the note's editor clicks, while focus mode and key sounds are both on. */
	private onKeySound(evt: KeyboardEvent): void {
		if (!this.enabled || !this.getSettings().keySounds) return;
		if (!(evt.target instanceof Element) || !evt.target.closest(".cm-content")) return;
		const kind = keySoundFor(evt);
		if (kind) this.sounds.play(kind);
	}

	private applyClasses(): void {
		const appearance = this.appearance();
		this.body = activeDocument.body;
		this.appliedClasses = [
			...focusBodyClasses(getFocusMode(appearance.mode)),
			...appearanceBodyClasses(appearance),
		];
		this.body.addClass(...this.appliedClasses);
		this.body.style.setProperty(FONT_SIZE_PROPERTY, `${appearance.fontSize}px`);
	}

	private clearClasses(): void {
		if (this.body && this.appliedClasses.length > 0) this.body.removeClass(...this.appliedClasses);
		this.body?.style.removeProperty(FONT_SIZE_PROPERTY);
		this.appliedClasses = [];
		this.body = null;
	}
}
