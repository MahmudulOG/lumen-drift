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
- **Dash:** Shift — a short burst of speed in the direction you last moved,
  on a 2.2-second cooldown; your escape when a moth corners you
- **Pause:** P or Esc
- **Restart:** R or click on the end screens
- **Mute:** M

## What's in the garden

- **Star shards:** a rare icy diamond worth 60 light appears every ~24
  seconds, drifts fast, and vanishes after 7 — chase it or lose it. It also
  refills a big chunk of your pulse glow.
- **Three phases of night:** Dusk, Midnight and Pre-Dawn, each announced on
  a banner; the moths hunt a little faster in each phase, on top of the
  steady ramp toward dawn.
- **Floating score popups** on every collect and banish, a combo timer bar
  that drains under the combo counter, and a dash-readiness bar in the HUD,
  so every system the game runs is visible while you play.
- **Three difficulties** on the title screen (keys 1/2/3): Chill (1,800
  light, gentler moths), Normal (2,400) and Bold (3,000, faster and thicker
  moths) — the goal, moth speed and spawn rate all follow the pick.
- **Elder moths:** a big crowned moth drifts in every ~21 seconds — slower
  than the swarm but twice the size, it takes **two pulses** to banish
  (the first leaves it visibly cracked) and pays 25 light when it falls.
- **A best-score record** kept in the browser between visits, shown on the
  title and end screens next to the night's own result.

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
