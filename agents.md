# Academia Arena — agent notes

The React + TypeScript rewrite described in [docs/plan.md](docs/plan.md) is complete: the
game runs entirely in the browser on boardgame.io's Local transport, and the legacy
`index.html` prototype has been removed now that its rules are covered by
`src/game/game.ts`.

Read [docs/development.md](docs/development.md) before changing anything. It lists the
commands, the file layout, the rule set and the CI jobs.

## Rules for changes

- Keep game logic in `src/game/` free of React imports so the same `Game` object can run
  on a server later.
- Keep every user-visible string in both `src/i18n/en.json` and `src/i18n/zh.json`.
  `src/i18n/i18n.test.ts` checks language parity and dynamic keys; verify component
  keys when adding or changing them.
- Add a failing assertion in `src/game/boundaries.test.ts` before changing a rule, and
  make it pass with the smallest change to `src/game/game.ts`.
- Pin GitHub Actions by full commit SHA. `bun run check` must pass locally before a pull
  request is opened; `CI` runs the same command.
- `vite.config.ts` keeps `base: "/Academia-Arena/"`; changing it breaks the Pages URL.
