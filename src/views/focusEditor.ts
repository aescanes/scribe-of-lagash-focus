// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { Extension, Prec, RangeSetBuilder, StateEffect } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { DimScope } from "../data/focusMode";

const dimMark = Decoration.mark({ class: "scribe-focus-dimmed" });

/** Sent to every editor when the mode changes, so they redraw without an edit. */
const refreshEffect = StateEffect.define<null>();

/** The measured on-screen row under the cursor, once the editor has laid out. */
const rowEffect = StateEffect.define<{ from: number; to: number }>();

/**
 * The editor half of the focus modes: typewriter scrolling and dimming. One
 * always-registered CodeMirror extension that does nothing while both are off,
 * so switching mode only needs `set` — no extension is added or removed.
 * It writes only editor decorations and the scroll position, never the note.
 */
export class FocusEditorEngine {
	dim: DimScope = "none";
	typewriter = false;
	readonly views = new Set<EditorView>();

	set(dim: DimScope, typewriter: boolean): void {
		if (dim === this.dim && typewriter === this.typewriter) return;
		this.dim = dim;
		this.typewriter = typewriter;
		for (const view of this.views) view.dispatch({ effects: refreshEffect.of(null) });
	}

	extension(): Extension {
		return focusExtension(this);
	}
}

function focusExtension(engine: FocusEditorEngine): Extension {
	return Prec.highest(
		ViewPlugin.fromClass(
			class {
				decorations: DecorationSet;
				/** The cursor's on-screen row; only trustworthy after layout, so it is measured, not computed in `update`. */
				private row: { from: number; to: number } | null = null;

				constructor(private readonly view: EditorView) {
					engine.views.add(view);
					this.decorations = this.build();
				}

				update(update: ViewUpdate): void {
					let refreshed = false;
					let measured = false;
					for (const tr of update.transactions) {
						for (const effect of tr.effects) {
							if (effect.is(refreshEffect)) refreshed = true;
							if (effect.is(rowEffect)) {
								this.row = effect.value;
								measured = true;
							}
						}
					}
					// Until the new row is measured, keep the old one carried along with the edit.
					if (this.row && update.docChanged) {
						this.row = { from: update.changes.mapPos(this.row.from, -1), to: update.changes.mapPos(this.row.to, 1) };
					}
					const moved = update.docChanged || update.selectionSet || update.geometryChanged || refreshed;
					if (moved || measured || update.viewportChanged) this.decorations = this.build();
					if (engine.dim === "line" && moved) this.measureRow();
					if (engine.typewriter && (update.selectionSet || update.docChanged || refreshed)) this.center();
				}

				destroy(): void {
					engine.views.delete(this.view);
				}

				/** Dims every visible stretch of text outside the focused paragraph or line. */
				private build(): DecorationSet {
					const builder = new RangeSetBuilder<Decoration>();
					if (engine.dim === "none") return builder.finish();
					const focus = this.focusRange(engine.dim);
					for (const { from, to } of this.view.visibleRanges) {
						if (from < focus.from) builder.add(from, Math.min(to, focus.from), dimMark);
						if (to > focus.to) builder.add(Math.max(from, focus.to), to, dimMark);
					}
					return builder.finish();
				}

				/** A paragraph runs between blank lines; a line is one row as wrapped on screen, so it ends where the editor moves to the next row. */
				private focusRange(scope: DimScope): { from: number; to: number } {
					const { doc, selection } = this.view.state;
					const head = selection.main.head;
					const line = doc.lineAt(head);
					if (scope === "line") {
						const row = this.row;
						// The text line stands in until the row is measured; always keep the cursor lit.
						const from = Math.min(row ? row.from : line.from, head);
						const to = Math.max(row ? row.to : line.to, head);
						return { from, to };
					}
					let first = line.number;
					let last = line.number;
					if (line.text.trim() !== "") {
						while (first > 1 && doc.line(first - 1).text.trim() !== "") first--;
						while (last < doc.lines && doc.line(last + 1).text.trim() !== "") last++;
					}
					return { from: doc.line(first).from, to: doc.line(last).to };
				}

				/** Reads the wrapped row after layout, then redraws the dimming around it. */
				private measureRow(): void {
					this.view.requestMeasure({
						key: this,
						// Ask the layout which positions sit at the left and right edges of the
						// cursor's row, rather than trusting `moveToLineBoundary`, which does not
						// stop at soft wraps here.
						read: (view) => {
							const head = view.state.selection.main.head;
							const coords = view.coordsAtPos(head);
							if (!coords) return null;
							const y = (coords.top + coords.bottom) / 2;
							const box = view.contentDOM.getBoundingClientRect();
							const from = view.posAtCoords({ x: box.left + 1, y }, false);
							const to = view.posAtCoords({ x: box.right - 1, y }, false);
							return { from: Math.min(from, head), to: Math.max(to, head) };
						},
						write: (row, view) => {
							if (!row || (row.from === this.row?.from && row.to === this.row?.to)) return;
							// Not inside the measure itself: CodeMirror refuses a dispatch while it is
							// measuring, and swallows the error, so the row would silently never apply.
							queueMicrotask(() => {
								if (engine.views.has(view)) view.dispatch({ effects: rowEffect.of(row) });
							});
						},
					});
				}

				/**
				 * Scrolls so the cursor's row sits at the vertical middle of the window, where
				 * the stylesheet draws the typewriter box. The window, not the scroller: with
				 * the interface hidden they coincide, and it keeps text and box aligned.
				 */
				private center(): void {
					const head = this.view.state.selection.main.head;
					this.view.requestMeasure({
						read: (view) => view.coordsAtPos(head),
						write: (rect, view) => {
							if (!rect) return;
							view.scrollDOM.scrollTop += (rect.top + rect.bottom) / 2 - activeWindow.innerHeight / 2;
						},
					});
				}
			},
			{ decorations: (plugin) => plugin.decorations },
		),
	);
}
