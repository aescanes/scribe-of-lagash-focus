// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

// Pure show/hide logic for the focus dock — no Obsidian or DOM imports,
// unit-tested. The view feeds it events and does what `timer` says; the
// 3-second rule lives here so it can be tested without a clock.

/** How long the dock stays up once nothing is holding it open. */
export const DOCK_HIDE_DELAY_MS = 3000;

export interface DockState {
	visible: boolean;
	/** The pointer is over the dock or its hot zone. */
	pointerInside: boolean;
	/** Keyboard focus is inside the dock. */
	focusInside: boolean;
	/** A dropdown menu is open; the dock must not slide away from under it. */
	menuOpen: boolean;
}

export type DockEvent = "show" | "pointerEnter" | "pointerLeave" | "focusIn" | "focusOut" | "menuOpen" | "menuClose" | "timerElapsed" | "hide";

/**
 * What the view must do with its single hide timer: `start` clears any
 * running timer and starts a fresh one, `cancel` clears it, `keep` leaves it
 * alone. Restarting rather than stacking is what stops timers piling up.
 */
export type DockTimerAction = "start" | "cancel" | "keep";

export interface DockStep {
	state: DockState;
	timer: DockTimerAction;
}

export const INITIAL_DOCK_STATE: DockState = {
	visible: false,
	pointerInside: false,
	focusInside: false,
	menuOpen: false,
};

function held(state: DockState): boolean {
	return state.pointerInside || state.focusInside || state.menuOpen;
}

/** The state after `event`, plus what to do with the hide timer. */
export function dockReduce(state: DockState, event: DockEvent): DockStep {
	switch (event) {
		case "show": {
			const next = { ...state, visible: true };
			return { state: next, timer: held(next) ? "cancel" : "start" };
		}
		case "pointerEnter":
			return { state: { ...state, visible: true, pointerInside: true }, timer: "cancel" };
		case "focusIn":
			return { state: { ...state, visible: true, focusInside: true }, timer: "cancel" };
		case "menuOpen":
			return { state: { ...state, visible: true, menuOpen: true }, timer: "cancel" };
		case "menuClose": {
			const next = { ...state, menuOpen: false };
			return { state: next, timer: next.visible && !held(next) ? "start" : "keep" };
		}
		case "pointerLeave": {
			const next = { ...state, pointerInside: false };
			return { state: next, timer: next.visible && !held(next) ? "start" : "keep" };
		}
		case "focusOut": {
			const next = { ...state, focusInside: false };
			return { state: next, timer: next.visible && !held(next) ? "start" : "keep" };
		}
		case "timerElapsed":
			// A timer that fires while something is holding the dock open is stale.
			return held(state) ? { state, timer: "keep" } : { state: { ...state, visible: false }, timer: "cancel" };
		case "hide":
			return { state: INITIAL_DOCK_STATE, timer: "cancel" };
	}
}
