// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { Component, setIcon } from "obsidian";
import { DOCK_HIDE_DELAY_MS, dockReduce, DockEvent, DockState, INITIAL_DOCK_STATE } from "../data/dockVisibility";
import { FocusModeId, FOCUS_MODES } from "../data/focusMode";
import { FocusAppearance, FONT_SIZE, FONTS, FontId, THEMES, ThemeId } from "../data/focusAppearance";
import { DockMenu, DockMenuHandle } from "./dockMenu";

/** Lucide icon per focus mode, for the menu and its trigger. */
/** What the info panel's miniature dock shows for each control, and its one-line explanation. */
const DOCK_GUIDE: readonly { lead: "mode" | "font" | "size" | "theme" | "sounds" | "info"; label: string; text: string }[] = [
	{ lead: "mode", label: "Focus mode", text: "How the page is dimmed or centered." },
	{ lead: "font", label: "Font", text: "The typeface of your text." },
	{ lead: "size", label: "A\u2212 A+", text: "Make the text smaller or larger." },
	{ lead: "theme", label: "Theme", text: "The color of the page." },
	{ lead: "sounds", label: "Key sounds", text: "Typing sounds (coming soon)." },
	{ lead: "info", label: "", text: "Dock info." },
];

/** The shortcuts the info panel lists: the keys, then what they do. */
const SHORTCUTS: readonly { keys: readonly string[]; alternative?: string; action: string }[] = [
	{ keys: ["Shift", "\u2191"], alternative: "move the mouse to the bottom center", action: "Show the dock" },
	{ keys: ["Shift", "\u2193"], action: "Hide the dock" },
];

const MODE_ICONS: Record<FocusModeId, string> = {
	"distraction-free": "file-text",
	typewriter: "keyboard",
	spotlight: "pilcrow",
	"deep-work": "target",
};

export interface FocusDockHandlers {
	setMode(id: FocusModeId): void;
	changeFontSize(direction: 1 | -1): void;
	setFont(id: FontId): void;
	setTheme(id: ThemeId): void;
}

/**
 * The macOS-Dock-style bar at the bottom center of the focus view. All of the
 * when-to-show logic is `dockReduce`; this class only turns DOM events into
 * its events and runs the single hide timer it asks for. A separate invisible
 * hot zone along the bottom edge is what brings the dock back, since the dock
 * itself is translated off-screen (and pointer-transparent) while hidden.
 */
export class FocusDock extends Component {
	private state: DockState = INITIAL_DOCK_STATE;
	private timer: number | null = null;
	private zoneEl: HTMLElement | null = null;
	private dockEl: HTMLElement | null = null;
	private smallerEl: HTMLButtonElement | null = null;
	private largerEl: HTMLButtonElement | null = null;
	private modeMenu: DockMenu<FocusModeId> | null = null;
	private soundsEl: HTMLButtonElement | null = null;
	private infoButtonEl: HTMLButtonElement | null = null;
	private infoEl: HTMLElement | null = null;
	private keySounds = false;
	private fontMenu: DockMenu<FontId> | null = null;
	private themeMenu: DockMenu<ThemeId> | null = null;

	constructor(
		private readonly handlers: FocusDockHandlers,
		private appearance: FocusAppearance,
		private mode: FocusModeId,
	) {
		super();
	}

	onload(): void {
		const body = activeDocument.body;
		const zone = body.createDiv({ cls: "scribe-focus-dock-zone" });
		const dock = body.createDiv({ cls: "scribe-focus-dock" });
		dock.setAttr("role", "toolbar");
		dock.setAttr("aria-label", "Focus mode appearance");
		this.zoneEl = zone;
		this.dockEl = dock;

		this.buildModeMenu(dock);
		dock.createDiv({ cls: "scribe-focus-dock-divider" });
		this.buildFontMenu(dock);
		dock.createDiv({ cls: "scribe-focus-dock-divider" });
		this.buildSizeGroup(dock);
		dock.createDiv({ cls: "scribe-focus-dock-divider" });
		this.buildThemeMenu(dock);
		dock.createDiv({ cls: "scribe-focus-dock-divider" });
		this.buildSoundsToggle(dock);
		dock.createDiv({ cls: "scribe-focus-dock-divider" });
		this.buildInfoButton(dock);

		this.registerDomEvent(zone, "mouseenter", () => this.dispatch("pointerEnter"));
		this.registerDomEvent(zone, "mouseleave", () => this.dispatch("pointerLeave"));
		this.registerDomEvent(dock, "mouseenter", () => this.dispatch("pointerEnter"));
		this.registerDomEvent(dock, "mouseleave", () => this.dispatch("pointerLeave"));
		// A mouse click also focuses a button; only keyboard focus should hold the
		// dock open, or it would never hide again after the first click.
		this.registerDomEvent(dock, "focusin", (evt) => {
			if ((evt.target as HTMLElement).matches(":focus-visible")) this.dispatch("focusIn");
		});
		this.registerDomEvent(dock, "focusout", () => this.dispatch("focusOut"));
		// A click anywhere else closes an open menu.
		this.registerDomEvent(activeDocument, "pointerdown", (evt) => {
			const target = evt.target as Node | null;
			for (const menu of this.menus()) if (!menu.contains(target)) menu.close();
			if (this.infoEl && !this.infoButtonEl?.contains(target)) this.closeInfo();
		});
		// Capture phase and prevented, so Esc closes the panel without also leaving focus mode.
		this.registerDomEvent(
			activeDocument,
			"keydown",
			(evt) => {
				if (evt.key !== "Escape" || !this.infoEl) return;
				evt.preventDefault();
				this.closeInfo();
			},
			{ capture: true },
		);

		this.update(this.appearance, this.mode);
	}

	onunload(): void {
		this.clearTimer();
		this.infoEl?.remove();
		this.infoEl = null;
		this.zoneEl?.remove();
		this.dockEl?.remove();
		this.modeMenu?.unload();
		this.fontMenu?.unload();
		this.themeMenu?.unload();
		this.zoneEl = this.dockEl = this.smallerEl = this.largerEl = null;
		this.modeMenu = this.fontMenu = this.themeMenu = this.soundsEl = null;
	}

	/** Slides the dock up and starts the hide countdown. */
	show(): void {
		this.dispatch("show");
	}

	/** Slides the dock away at once, even if the pointer is still over it. */
	hide(): void {
		this.dispatch("hide");
	}

	/** Reflects a new appearance in the dock's own controls. */
	update(appearance: FocusAppearance, mode: FocusModeId): void {
		this.appearance = appearance;
		this.mode = mode;
		this.modeMenu?.setSelected(mode);
		if (this.smallerEl) this.smallerEl.disabled = appearance.fontSize <= FONT_SIZE.min;
		if (this.largerEl) this.largerEl.disabled = appearance.fontSize >= FONT_SIZE.max;
		this.fontMenu?.setSelected(appearance.fontFamily);
		this.themeMenu?.setSelected(appearance.theme);
	}

	private buildSizeGroup(dock: HTMLElement): void {
		const group = dock.createDiv({ cls: "scribe-focus-dock-group" });
		this.smallerEl = this.sizeButton(group, "\u2212", "Smaller text", -1);
		this.largerEl = this.sizeButton(group, "+", "Larger text", 1);
	}

	/** An "A" with a small sign beside it, so the pair reads as a text-size control. */
	private sizeButton(parent: HTMLElement, sign: string, label: string, direction: 1 | -1): HTMLButtonElement {
		const el = parent.createEl("button", { cls: "scribe-focus-dock-size" });
		el.setAttr("aria-label", label);
		el.setAttr("title", label);
		el.createSpan({ text: "A" });
		el.createEl("sup", { text: sign });
		this.registerDomEvent(el, "click", () => this.handlers.changeFontSize(direction));
		return el;
	}

	private buildModeMenu(dock: HTMLElement): void {
		this.modeMenu = this.addChild(
			new DockMenu<FocusModeId>(
				dock,
				"Focus mode",
				FOCUS_MODES.map((mode) => ({
					id: mode.id,
					name: mode.name,
					description: mode.description,
					previewCls: "",
					renderPreview: (el) => setIcon(el, MODE_ICONS[mode.id]),
				})),
				this.mode,
				(id) => this.handlers.setMode(id),
				(open) => this.onMenuOpenChange(open),
				(el, id) => setIcon(el, MODE_ICONS[id]),
				"scribe-focus-dock-trigger-mode",
			),
		);
	}

	private buildSoundsToggle(dock: HTMLElement): void {
		const el = dock.createEl("button", { cls: "scribe-focus-dock-toggle" });
		this.soundsEl = el;
		this.registerDomEvent(el, "click", () => {
			this.keySounds = !this.keySounds;
			this.renderSounds();
		});
		this.renderSounds();
	}

	private renderSounds(): void {
		const el = this.soundsEl;
		if (!el) return;
		el.empty();
		el.toggleClass("is-on", this.keySounds);
		el.setAttr("aria-pressed", String(this.keySounds));
		setIcon(el.createSpan({ cls: "scribe-focus-dock-lead" }), this.keySounds ? "volume-2" : "volume-x");
		el.createSpan({ text: "Key sounds" });
		el.createSpan({ cls: "scribe-focus-dock-toggle-state", text: this.keySounds ? "On" : "Off" });
	}

	private buildFontMenu(dock: HTMLElement): void {
		this.fontMenu = this.addChild(
			new DockMenu<FontId>(
				dock,
				"Font",
				FONTS.map((font) => ({
					id: font.id,
					name: font.name,
					description: font.description,
					previewCls: `scribe-focus-dock-font scribe-focus-font-${font.id}`,
					renderPreview: (el) => el.setText("Aa"),
				})),
				this.appearance.fontFamily,
				(id) => this.handlers.setFont(id),
				(open) => this.onMenuOpenChange(open),
				// No font class here: the trigger follows the font active on <body>.
				(el) => el.createSpan({ cls: "scribe-focus-dock-font", text: "Aa" }),
				"scribe-focus-dock-trigger-font",
			),
		);
	}

	private buildThemeMenu(dock: HTMLElement): void {
		this.themeMenu = this.addChild(
			new DockMenu<ThemeId>(
				dock,
				"Theme",
				THEMES.map((theme) => ({
					id: theme.id,
					name: theme.name,
					description: theme.description,
					// The swatch carries the theme's own class so it picks up that theme's
					// colors from the stylesheet, whichever theme is active on <body>.
					previewCls: `scribe-focus-theme-${theme.id}`,
					renderPreview: (el) => el.addClass("scribe-focus-dock-swatch"),
				})),
				this.appearance.theme,
				(id) => this.handlers.setTheme(id),
				(open) => this.onMenuOpenChange(open),
				(el) => el.createSpan({ cls: "scribe-focus-dock-swatch" }),
				"scribe-focus-dock-trigger-theme",
			),
		);
	}

	private buildInfoButton(dock: HTMLElement): void {
		const el = dock.createEl("button", { cls: "scribe-focus-dock-size" });
		el.setAttr("aria-label", "Keyboard shortcuts");
		el.setAttr("title", "Keyboard shortcuts");
		el.setAttr("aria-haspopup", "dialog");
		setIcon(el, "info");
		this.infoButtonEl = el;
		this.registerDomEvent(el, "click", () => (this.infoEl ? this.closeInfo() : this.openInfo()));
	}

	/**
	 * Appended to <body>, not to the dock: the dock is transformed, which would
	 * make a fixed child centre on the dock instead of the window.
	 */
	private openInfo(): void {
		if (this.infoEl) return;
		for (const menu of this.menus()) menu.close();
		const panel = activeDocument.body.createDiv({ cls: "scribe-focus-info" });
		panel.setAttr("role", "dialog");
		panel.setAttr("aria-label", "Keyboard shortcuts");
		const card = panel.createDiv({ cls: "scribe-focus-info-card" });
		card.createDiv({ cls: "scribe-focus-info-title", text: "The dock" });
		this.buildGuide(card);
		card.createDiv({ cls: "scribe-focus-info-title", text: "Keyboard shortcuts" });
		for (const shortcut of SHORTCUTS) {
			const row = card.createDiv({ cls: "scribe-focus-info-row" });
			const keys = row.createSpan({ cls: "scribe-focus-info-keys" });
			shortcut.keys.forEach((key, i) => {
				if (i > 0) keys.createSpan({ cls: "scribe-focus-info-plus", text: "+" });
				keys.createEl("kbd", { text: key });
			});
			if (shortcut.alternative) {
				keys.createSpan({ cls: "scribe-focus-info-plus", text: "or" });
				keys.createSpan({ cls: "scribe-focus-info-alternative", text: shortcut.alternative });
			}
			row.createSpan({ cls: "scribe-focus-info-action", text: shortcut.action });
		}
		this.infoEl = panel;
		this.dispatch("menuOpen");
	}

	/** A non-interactive miniature of the dock, its parts numbered to match a short list below it. */
	private buildGuide(card: HTMLElement): void {
		const mini = card.createDiv({ cls: "scribe-focus-info-mini" });
		mini.setAttr("aria-hidden", "true");
		const list = card.createDiv({ cls: "scribe-focus-info-list" });
		// Two columns, each its own block so the rows inside line up on their left edge.
		const columns = [list.createDiv({ cls: "scribe-focus-info-column" }), list.createDiv({ cls: "scribe-focus-info-column" })];
		DOCK_GUIDE.forEach((part, i) => {
			const item = mini.createDiv({ cls: "scribe-focus-info-mini-item" });
			const lead = item.createSpan({ cls: "scribe-focus-dock-lead" });
			if (part.lead === "mode") setIcon(lead, MODE_ICONS[this.mode]);
			else if (part.lead === "font") lead.createSpan({ cls: "scribe-focus-dock-font", text: "Aa" });
			else if (part.lead === "theme") lead.createSpan({ cls: "scribe-focus-dock-swatch" });
			else if (part.lead === "sounds") setIcon(lead, "volume-x");
			else if (part.lead === "info") setIcon(lead, "info");
			if (part.label) item.createSpan({ text: part.label });
			item.createSpan({ cls: "scribe-focus-info-badge", text: String(i + 1) });

			const row = columns[i < 3 ? 0 : 1].createDiv({ cls: "scribe-focus-info-list-row" });
			row.createSpan({ cls: "scribe-focus-info-badge", text: String(i + 1) });
			row.createSpan({ text: part.text });
		});
	}

	private closeInfo(): void {
		if (!this.infoEl) return;
		this.infoEl.remove();
		this.infoEl = null;
		this.dispatch("menuClose");
	}

	private menus(): DockMenuHandle[] {
		return [this.modeMenu, this.fontMenu, this.themeMenu].filter((m): m is NonNullable<typeof m> => m !== null);
	}

	/** Only one menu is open at a time, and an open one keeps the dock from hiding. */
	private onMenuOpenChange(open: boolean): void {
		if (open) for (const menu of this.menus()) if (menu.isOpen()) menu.close();
		this.dispatch(open ? "menuOpen" : "menuClose");
	}

	private dispatch(event: DockEvent): void {
		const step = dockReduce(this.state, event);
		this.state = step.state;
		if (step.timer !== "keep") this.clearTimer();
		if (step.timer === "start") {
			this.timer = window.setTimeout(() => this.dispatch("timerElapsed"), DOCK_HIDE_DELAY_MS);
		}
		this.dockEl?.toggleClass("is-visible", this.state.visible);
		if (!this.state.visible) {
			for (const menu of this.menus()) menu.close();
			this.closeInfo();
		}
	}

	private clearTimer(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
	}
}
