// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import assert from "node:assert/strict";
import { test } from "node:test";
import { DockEvent, dockReduce, DockState, INITIAL_DOCK_STATE } from "../../src/data/dockVisibility";

function run(events: DockEvent[]): { state: DockState; timers: string[] } {
	let state = INITIAL_DOCK_STATE;
	const timers: string[] = [];
	for (const event of events) {
		const step = dockReduce(state, event);
		state = step.state;
		timers.push(step.timer);
	}
	return { state, timers };
}

test("showing starts the hide timer, and it hides when the timer elapses", () => {
	const { state, timers } = run(["show", "timerElapsed"]);
	assert.deepEqual(timers, ["start", "cancel"]);
	assert.equal(state.visible, false);
});

test("hovering reveals the dock and holds it open", () => {
	const { state, timers } = run(["pointerEnter"]);
	assert.equal(state.visible, true);
	assert.deepEqual(timers, ["cancel"]);
});

test("leaving restarts the countdown rather than hiding at once", () => {
	const { state, timers } = run(["pointerEnter", "pointerLeave"]);
	assert.equal(state.visible, true);
	assert.deepEqual(timers, ["cancel", "start"]);
});

test("a stale timer does nothing while the pointer is inside", () => {
	const { state } = run(["show", "pointerEnter", "timerElapsed"]);
	assert.equal(state.visible, true);
});

test("keyboard focus holds the dock open even after the pointer leaves", () => {
	const { state, timers } = run(["pointerEnter", "focusIn", "pointerLeave"]);
	assert.equal(state.visible, true);
	assert.equal(timers[2], "keep");
	assert.equal(run(["pointerEnter", "focusIn", "pointerLeave", "focusOut"]).timers[3], "start");
});

test("showing while hovered does not start a timer", () => {
	assert.equal(run(["pointerEnter", "show"]).timers[1], "cancel");
});

test("leaving a dock that is not visible starts nothing", () => {
	assert.equal(run(["pointerLeave"]).timers[0], "keep");
});

test("hide resets everything", () => {
	const { state } = run(["pointerEnter", "focusIn", "hide"]);
	assert.deepEqual(state, INITIAL_DOCK_STATE);
});

test("an open menu holds the dock open, and closing it restarts the countdown", () => {
	const open = run(["pointerEnter", "menuOpen", "pointerLeave", "timerElapsed"]);
	assert.equal(open.state.visible, true);
	assert.equal(open.timers[2], "keep");
	assert.equal(run(["menuOpen", "menuClose"]).timers[1], "start");
});
