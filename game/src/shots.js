// The screenshot scenes behind ?shot=start|play|late|end. Each scene runs
// the real rules forward from a seeded world, steered by an autopilot, so a
// frame is what a short game really looks like and the same seed always
// gives the same frame. The pilot gathers motes and dodges moths; the end
// scene's pilot does the opposite, and is caught, as a reckless player is.

import { FIELD, PULSE, STEP } from './config.js';
import {
  SCREEN_OVER, createWorld, startNight, stepWorld, tryPulse,
} from './world.js';

function nearestMote(state) {
  let best = null;
  let bestScore = Infinity;
  for (const mote of state.motes) {
    const d = Math.hypot(mote.x - state.player.x, mote.y - state.player.y);
    const score = mote.bright ? d * 0.45 : d;
    if (score < bestScore) { bestScore = score; best = mote; }
  }
  return best;
}

function nearestMoth(state) {
  let best = null;
  let bestD = Infinity;
  for (const moth of state.moths) {
    const d = Math.hypot(moth.x - state.player.x, moth.y - state.player.y);
    if (d < bestD) { bestD = d; best = moth; }
  }
  return best;
}

/** An input stand-in: chase motes, flee moths, keep off the walls. */
function makePilot() {
  return {
    direction() {
      return { x: 0, y: 0 };
    },
    steer(state) {
      const p = state.player;
      let x = 0;
      let y = 0;
      const target = nearestMote(state);
      if (target) {
        const dx = target.x - p.x;
        const dy = target.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        x += dx / d;
        y += dy / d;
      }
      for (const moth of state.moths) {
        const dx = p.x - moth.x;
        const dy = p.y - moth.y;
        const d = Math.hypot(dx, dy) || 1;
        if (d < 130) {
          const w = ((130 - d) / 130) * 1.9;
          x += (dx / d) * w;
          y += (dy / d) * w;
        }
      }
      const edge = 60;
      if (p.x < edge) x += (edge - p.x) / edge;
      if (p.x > FIELD.width - edge) x -= (edge - (FIELD.width - p.x)) / edge;
      if (p.y < edge) y += (edge - p.y) / edge;
      if (p.y > FIELD.height - edge) y -= (edge - (FIELD.height - p.y)) / edge;
      const len = Math.hypot(x, y);
      if (len > 1) { x /= len; y /= len; }
      this.current = { x, y };
      return this.current;
    },
    current: { x: 0, y: 0 },
  };
}

/**
 * A pilot that only sees motes: it gathers greedily, never dodges and never
 * pulses, so the moths it ignores end its night — the end scene is a real
 * game, played badly, as a hurried player's would be.
 */
function makeRecklessPilot() {
  return {
    steer(state) {
      const target = nearestMote(state);
      if (!target) return { x: 0, y: 0 };
      const dx = target.x - state.player.x;
      const dy = target.y - state.player.y;
      const d = Math.hypot(dx, dy) || 1;
      return { x: dx / d, y: dy / d };
    },
  };
}

function runSteps(state, pilot, seconds, { pulse = true } = {}) {
  const input = { direction: () => pilot.steer(state) };
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (pulse && state.glow >= PULSE.cost && state.pulseCooldown <= 0) {
      const moth = nearestMoth(state);
      if (moth && Math.hypot(moth.x - state.player.x, moth.y - state.player.y) < 96) {
        tryPulse(state);
      }
    }
    stepWorld(state, input, STEP);
    state.events.length = 0;
    if (state.screen === SCREEN_OVER) break;
  }
}

/** Run one named scene and return { state, now } ready to render. */
export function runScene(name, seed) {
  if (name === 'start') {
    const state = createWorld(seed);
    return { state, now: 2.4 };
  }
  const state = createWorld(seed);
  startNight(state);
  if (name === 'play') {
    runSteps(state, makePilot(), 24);
    return { state, now: 24 };
  }
  if (name === 'late') {
    runSteps(state, makePilot(), 34);
    return { state, now: 34 };
  }
  // end: a reckless pilot is caught; cap the sim so the scene always ends.
  runSteps(state, makeRecklessPilot(), 200, { pulse: false });
  // Let the results screen settle: the sting's flash and shake decay.
  const still = { direction: () => ({ x: 0, y: 0 }) };
  for (let i = 0; i < 45; i += 1) {
    stepWorld(state, still, STEP);
    state.events.length = 0;
  }
  return { state, now: 8 };
}
