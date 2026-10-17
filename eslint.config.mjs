// SPDX-License-Identifier: MIT
// Copyright (C) 2026 aescanes

import { defineConfig, globalIgnores } from "eslint/config";
import obsidianmd from "eslint-plugin-obsidianmd";

export default defineConfig([
	globalIgnores(["main.js", ".test-build/**"]),
	// The Obsidian team's own recommended config — the same guideline checks
	// their plugin review runs, kept current by them instead of guessed at here.
	...obsidianmd.configs.recommended,
	{
		// This repo's build/version scripts and eslint.config.mjs itself aren't
		// part of tsconfig.json's project (it only includes **/*.ts), so
		// typescript-eslint's project service needs an explicit allowance for
		// them. tsconfigRootDir is pinned so the right tsconfig.json is found
		// even when ESLint runs from a different cwd (e.g. an editor extension).
		languageOptions: {
			parserOptions: {
				projectService: { allowDefaultProject: ["*.mjs"] },
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	{
		// Build/version scripts run directly under Node, outside the shipped
		// plugin bundle, so they get Node globals.
		files: ["*.mjs"],
		languageOptions: { globals: { process: "readonly", console: "readonly" } },
	},
	{
		// Tests and the build/version scripts never ship in the plugin bundle,
		// so two rules aimed at the shipped code don't apply: Node built-ins are
		// fine here, and node:test's `test()` calls trip no-floating-promises
		// because the test runner — not this code — awaits them.
		files: ["tests/**/*.ts", "*.mjs"],
		rules: {
			"obsidianmd/no-nodejs-modules": "off",
			"@typescript-eslint/no-floating-promises": "off",
		},
	},
	{
		// The build/version scripts' whole job is printing to the terminal.
		files: ["*.mjs"],
		rules: { "obsidianmd/rule-custom-message": "off" },
	},
	{
		// "(SL) Focus:" is this plugin's own command-palette/ribbon prefix (short
		// for "Scribe of Lagash"), used so the series' entries group together —
		// sentence-casing it into "(Sl)" would mangle that on-purpose prefix. "Focus"
		// goes in the case-sensitive `ignoreWords` list so the capital after the
		// prefix survives, without touching lowercase "focus" elsewhere. "Scribe"
		// and "Lagash" are there for the same reason: they are the series name.
		files: ["src/**/*.ts"],
		rules: {
			"obsidianmd/ui/sentence-case": [
				"warn",
				{ enforceCamelCaseLower: true, acronyms: ["SL"], ignoreWords: ["Focus", "Scribe", "Lagash"] },
			],
		},
	},
]);
