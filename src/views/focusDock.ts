// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { Component, setIcon } from "obsidian";
import { DOCK_HIDE_DELAY_MS, dockReduce, DockEvent, DockState, INITIAL_DOCK_STATE } from "../data/dockVisibility";
import { FocusAppearance, FONTS, FontId, THEMES, ThemeId } from "../data/focusAppearance";

export interface FocusDockHandlers {
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
	private sizeEl: HTMLElement | null = null;
	private readonly fontButtons = new Map<FontId, HTMLButtonElement>();
	private readonly themeButtons = new Map<ThemeId, HTMLButtonElement>();

	constructor(
		private readonly handlers: FocusDockHandlers,
		private appearance: FocusAppearance,
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

		this.buildSizeGroup(dock);
		this.buildFontGroup(dock);
		this.buildThemeGroup(dock);

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

		this.update(this.appearance);
	}

	onunload(): void {
		this.clearTimer();
		this.zoneEl?.remove();
		this.dockEl?.remove();
		this.zoneEl = this.dockEl = this.sizeEl = null;
		this.fontButtons.clear();
		this.themeButtons.clear();
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
	update(appearance: FocusAppearance): void {
		this.appearance = appearance;
		this.sizeEl?.setText(String(appearance.fontSize));
		for (const [id, el] of this.fontButtons) this.markSelected(el, id === appearance.fontFamily);
		for (const [id, el] of this.themeButtons) this.markSelected(el, id === appearance.theme);
	}

	private buildSizeGroup(dock: HTMLElement): void {
		const group = dock.createDiv({ cls: "scribe-focus-dock-group" });
		this.button(group, "minus", "Smaller text", () => this.handlers.changeFontSize(-1));
		this.sizeEl = group.createSpan({ cls: "scribe-focus-dock-size" });
		this.button(group, "plus", "Larger text", () => this.handlers.changeFontSize(1));
	}

	private buildFontGroup(dock: HTMLElement): void {
		const group = dock.createDiv({ cls: "scribe-focus-dock-group" });
		for (const font of FONTS) {
			const el = group.createEl("button", {
				cls: `scribe-focus-dock-button scribe-focus-dock-font scribe-focus-font-${font.id}`,
				text: "Aa",
			});
			el.setAttr("aria-label", font.name);
			el.setAttr("title", font.name);
			this.registerDomEvent(el, "click", () => this.handlers.setFont(font.id));
			this.fontButtons.set(font.id, el);
		}
	}

	private buildThemeGroup(dock: HTMLElement): void {
		const group = dock.createDiv({ cls: "scribe-focus-dock-group" });
		for (const theme of THEMES) {
			// The swatch carries the theme's own class so it picks up that theme's
			// colors from the stylesheet, whichever theme is active on <body>.
			const el = group.createEl("button", {
				cls: `scribe-focus-dock-button scribe-focus-dock-swatch scribe-focus-theme-${theme.id}`,
			});
			el.setAttr("aria-label", `${theme.name} theme`);
			el.setAttr("title", `${theme.name} theme`);
			this.registerDomEvent(el, "click", () => this.handlers.setTheme(theme.id));
			this.themeButtons.set(theme.id, el);
		}
	}

	private button(parent: HTMLElement, icon: string, label: string, onClick: () => void): HTMLButtonElement {
		const el = parent.createEl("button", { cls: "scribe-focus-dock-button" });
		el.setAttr("aria-label", label);
		el.setAttr("title", label);
		setIcon(el, icon);
		this.registerDomEvent(el, "click", onClick);
		return el;
	}

	private markSelected(el: HTMLElement, selected: boolean): void {
		el.toggleClass("is-selected", selected);
		el.setAttr("aria-pressed", String(selected));
	}

	private dispatch(event: DockEvent): void {
		const step = dockReduce(this.state, event);
		this.state = step.state;
		if (step.timer !== "keep") this.clearTimer();
		if (step.timer === "start") {
			this.timer = window.setTimeout(() => this.dispatch("timerElapsed"), DOCK_HIDE_DELAY_MS);
		}
		this.dockEl?.toggleClass("is-visible", this.state.visible);
	}

	private clearTimer(): void {
		if (this.timer !== null) window.clearTimeout(this.timer);
		this.timer = null;
	}
}
