// Lumen Drift — boot and the frame loop. Owns the canvas, the real input
// and the audio; the world itself lives in world.js and steps at a fixed
// rate so play is the same on every machine. A ?shot=<scene>&seed=<n> URL
// renders one deterministic scene instead, for the entry's screenshots.

import { STEP } from './config.js';
import { createAudio } from './audio.js';
import { createInput } from './input.js';
import { render } from './render.js';
import { runScene } from './shots.js';
import {
  SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN,
  EVENT_BANISH, EVENT_BRIGHT, EVENT_COLLECT, EVENT_DASH, EVENT_DENIED,
  EVENT_HIT, EVENT_LOSE, EVENT_PHASE, EVENT_PULSE, EVENT_SHARD, EVENT_WIN,
  createWorld, startNight, stepWorld, tryDash, tryPulse,
} from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');

if (shotName) {
  const seed = Number(params.get('seed') ?? 1) || 1;
  const { state, now } = runScene(shotName, seed);
  render(ctx, state, now);
  window.__shotReady = true;
  document.body.dataset.shot = shotName;
} else {
  const input = createInput(canvas);
  const audio = createAudio();
  const state = createWorld((Date.now() % 90000) + 7);

  // The player's best score, kept between visits. Storage can be missing
  // or blocked (a private window, a sandboxed frame): the game just plays
  // without a record then.
  const BEST_KEY = 'lumen-drift-best';
  try {
    state.best = Number(window.localStorage.getItem(BEST_KEY)) || 0;
  } catch { state.best = 0; }
  function saveBest() {
    state.best = Math.max(state.best || 0, state.score);
    try {
      window.localStorage.setItem(BEST_KEY, String(state.best));
    } catch { /* no storage: the record lives only in this page */ }
  }

  function playEvents() {
    for (const event of state.events) {
      if (event === EVENT_COLLECT) audio.collect(state.combo);
      else if (event === EVENT_BRIGHT) audio.bright();
      else if (event === EVENT_SHARD) audio.shard();
      else if (event === EVENT_DASH) audio.dash();
      else if (event === EVENT_PHASE) audio.phase();
      else if (event === EVENT_BANISH) audio.banish();
      else if (event === EVENT_PULSE) audio.pulse();
      else if (event === EVENT_DENIED) audio.denied();
      else if (event === EVENT_HIT) audio.hit();
      else if (event === EVENT_WIN) { audio.win(); audio.stopPad(); saveBest(); }
      else if (event === EVENT_LOSE) { audio.lose(); audio.stopPad(); saveBest(); }
    }
    state.events.length = 0;
  }

  let last = performance.now();
  let accumulator = 0;

  function frame(nowMs) {
    const now = nowMs / 1000;
    let elapsed = (nowMs - last) / 1000;
    last = nowMs;
    if (elapsed > 0.25) elapsed = 0.25;
    accumulator += elapsed;

    if (input.take('mute')) audio.setMuted(!audio.isMuted());

    if (state.screen === SCREEN_PLAY && input.take('pause')) {
      state.paused = !state.paused;
    }

    if (state.screen === SCREEN_TITLE || state.screen === SCREEN_OVER
      || state.screen === SCREEN_WIN) {
      const pick = input.takeDifficulty();
      if (pick !== null && pick !== state.difficulty) {
        // Rebuild the title world at the new goal so the title screen's
        // own text (and the night that follows) matches the pick.
        const fresh = createWorld((Date.now() % 90000) + 7, pick);
        fresh.best = state.best;
        Object.assign(state, fresh);
      }
      if (input.take('confirm')) {
        audio.unlock();
        startNight(state);
        input.take('pulse'); // the same click must not fire a pulse
        input.take('dash');
        audio.start();
        audio.startPad();
      }
    } else if (state.screen === SCREEN_PLAY && !state.paused) {
      if (input.take('pulse')) {
        audio.unlock();
        tryPulse(state);
      }
      if (input.take('dash')) {
        audio.unlock();
        tryDash(state);
      }
    } else {
      input.take('pulse');
      input.take('dash');
    }

    while (accumulator >= STEP) {
      stepWorld(state, input, STEP);
      accumulator -= STEP;
    }
    playEvents();
    render(ctx, state, now);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
