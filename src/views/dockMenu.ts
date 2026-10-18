// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { Component, setIcon } from "obsidian";

export interface DockMenuOption<T extends string> {
	id: T;
	name: string;
	description: string;
	/** Extra classes for the option's leading preview and its name (a font or theme class). */
	previewCls: string;
	/** Draws the leading preview into the given element. */
	renderPreview(el: HTMLElement): void;
}

/**
 * One dropdown in the dock: a trigger button that opens a popover list above
 * it, with a heading, a preview, name and description per option, and a check
 * on the selected one. The popover lives inside the dock so the dock's pointer
 * tracking treats it as part of the dock, and it is built on open and removed
 * on close. The dock owns "only one open at a time" and outside-click handling.
 */
/** What the dock needs from any menu, whatever its option type. */
export interface DockMenuHandle {
	isOpen(): boolean;
	close(): void;
	contains(node: Node | null): boolean;
}

export class DockMenu<T extends string> extends Component implements DockMenuHandle {
	private readonly rootEl: HTMLElement;
	private readonly triggerEl: HTMLButtonElement;
	private readonly leadEl: HTMLElement;
	private readonly valueEl: HTMLElement;
	private popoverEl: HTMLElement | null = null;
	private selected: T;

	constructor(
		parent: HTMLElement,
		private readonly heading: string,
		private readonly options: readonly DockMenuOption<T>[],
		selected: T,
		private readonly onSelect: (id: T) => void,
		private readonly onOpenChange: (open: boolean) => void,
		private readonly renderTriggerLead: (el: HTMLElement, id: T) => void,
		triggerCls: string,
	) {
		super();
		this.selected = selected;
		this.rootEl = parent.createDiv({ cls: "scribe-focus-dock-menu" });
		this.triggerEl = this.rootEl.createEl("button", { cls: `scribe-focus-dock-trigger ${triggerCls}` });
		this.triggerEl.setAttr("aria-haspopup", "menu");
		this.triggerEl.setAttr("aria-expanded", "false");
		this.triggerEl.setAttr("aria-label", heading);
		this.leadEl = this.triggerEl.createSpan({ cls: "scribe-focus-dock-lead" });
		this.valueEl = this.triggerEl.createSpan({ cls: "scribe-focus-dock-value" });
		setIcon(this.triggerEl.createSpan({ cls: "scribe-focus-dock-chevron" }), "chevrons-up-down");
		this.setValueText();
	}

	onload(): void {
		this.registerDomEvent(this.triggerEl, "click", () => (this.isOpen() ? this.close() : this.open()));
		this.registerDomEvent(this.rootEl, "keydown", (evt) => this.onKey(evt));
	}

	onunload(): void {
		this.close();
		this.rootEl.remove();
	}

	isOpen(): boolean {
		return this.popoverEl !== null;
	}

	contains(node: Node | null): boolean {
		return node !== null && this.rootEl.contains(node);
	}

	setSelected(id: T): void {
		this.selected = id;
		this.setValueText();
		if (this.popoverEl) this.markSelected();
	}

	open(): void {
		if (this.popoverEl) return;
		this.onOpenChange(true);
		const popover = this.rootEl.createDiv({ cls: "scribe-focus-dock-popover" });
		popover.setAttr("role", "menu");
		popover.setAttr("aria-label", this.heading);
		popover.createDiv({ cls: "scribe-focus-dock-popover-heading", text: this.heading });
		for (const option of this.options) {
			const item = popover.createEl("button", { cls: "scribe-focus-dock-item" });
			item.dataset.id = option.id;
			item.setAttr("role", "menuitemradio");
			option.renderPreview(item.createSpan({ cls: `scribe-focus-dock-lead ${option.previewCls}` }));
			const text = item.createSpan({ cls: "scribe-focus-dock-item-text" });
			text.createSpan({ cls: `scribe-focus-dock-item-name ${option.previewCls}`, text: option.name });
			text.createSpan({ cls: "scribe-focus-dock-item-desc", text: option.description });
			setIcon(item.createSpan({ cls: "scribe-focus-dock-check" }), "check");
			item.addEventListener("click", (evt) => {
				this.onSelect(option.id);
				this.close();
				// Only a keyboard activation (detail 0) hands focus back to the trigger. After
				// a mouse click that would count as keyboard focus and pin the dock open.
				if (evt.detail === 0) this.triggerEl.focus();
			});
		}
		this.popoverEl = popover;
		this.triggerEl.setAttr("aria-expanded", "true");
		this.markSelected();
	}

	close(): void {
		if (!this.popoverEl) return;
		this.popoverEl.remove();
		this.popoverEl = null;
		this.triggerEl.setAttr("aria-expanded", "false");
		this.onOpenChange(false);
	}

	private items(): HTMLElement[] {
		return Array.from(this.rootEl.querySelectorAll<HTMLElement>(".scribe-focus-dock-item"));
	}

	private setValueText(): void {
		this.leadEl.empty();
		this.renderTriggerLead(this.leadEl, this.selected);
		this.valueEl.setText(this.options.find((o) => o.id === this.selected)?.name ?? "");
	}

	private markSelected(): void {
		for (const item of this.items()) {
			const on = item.dataset.id === this.selected;
			item.toggleClass("is-selected", on);
			item.setAttr("aria-checked", String(on));
		}
	}

	/** Arrow keys move through the open list; Esc closes it and is kept from leaving focus mode. */
	private onKey(evt: KeyboardEvent): void {
		if (!this.popoverEl) {
			if (evt.target === this.triggerEl && evt.key === "ArrowUp") {
				evt.preventDefault();
				this.open();
				this.items().find((item) => item.hasClass("is-selected"))?.focus();
			}
			return;
		}
		if (evt.key === "Escape") {
			evt.preventDefault();
			this.close();
			this.triggerEl.focus();
			return;
		}
		if (evt.key !== "ArrowUp" && evt.key !== "ArrowDown") return;
		if (evt.shiftKey) return;
		evt.preventDefault();
		const items = this.items();
		const at = items.indexOf(activeDocument.activeElement as HTMLElement);
		const step = evt.key === "ArrowDown" ? 1 : -1;
		const next = at === -1 ? (step === 1 ? 0 : items.length - 1) : (at + step + items.length) % items.length;
		items[next]?.focus();
	}
}
