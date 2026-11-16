# Lumen Drift

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/MahmudulOG/lumen-drift/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/MahmudulOG/lumen-drift/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

A tiny game of light and moths, built for the make.fun "Make the best game"
bounty ([best-game-01](https://make.fun/bounty/best-game-01)).

You are a wisp in a night garden. Gather glowing motes to build light and
combos, spend stored glow on a pulse that banishes the thorn moths hunting
you, and reach **2,400 light before dawn** (150 seconds) to win. A moth's
sting costs one of your 3 lives.

- **Move:** WASD or arrow keys
- **Pulse:** Space or click (costs 35 glow; motes refill it)
- **Restart:** R or click on the end screens
- **Mute:** M

## Layout

- `game/` — the game itself: plain static files, no build step, no network.
  Open `game/index.html` through any static server and play.
  - `game/src/config.js` — all tuning constants
  - `game/src/world.js` — the simulation (rules, spawning, collisions)
  - `game/src/render.js` — canvas drawing and the HUD
  - `game/src/input.js` — keyboard and mouse
  - `game/src/audio.js` — WebAudio-synthesised sound, no audio files
  - `game/src/shots.js` — deterministic screenshot scenes (`?shot=play&seed=7`)
  - `game/src/main.js` — boot and the frame loop
- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to the
  output directory and writes `dossier.json` (run `node serve.ts` to play
  locally, `MAKEFUN_OUTPUT_DIR=out node main.ts` to hand in).
- `screenshots/` — real renders of the game, one per scene in `shots.json`.

MIT licensed — see `LICENSE`.
