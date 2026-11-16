// Lumen Drift — the simulation. A wisp gathers light motes in a night garden
// while thorn moths hunt it. Gather GAME.goal light before the night timer
// runs out to win; lose a life per moth sting; a pulse of stored glow
// banishes every moth it touches. Pure state and steps: no drawing, no DOM,
// so the screenshot scenes can run it headless from a seed.

import { FIELD, GAME, MOTE, MOTH, PLAYER, PULSE } from './config.js';
import { makeRandom, pointInField, range } from './random.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

export const EVENT_COLLECT = 'collect';
export const EVENT_BRIGHT = 'bright';
export const EVENT_BANISH = 'banish';
export const EVENT_PULSE = 'pulse';
export const EVENT_DENIED = 'denied';
export const EVENT_HIT = 'hit';
export const EVENT_WIN = 'win';
export const EVENT_LOSE = 'lose';

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/** Combo multiplier for a chain length: +1 tier per COMBO steps, capped. */
export function comboTier(combo) {
  return Math.min(GAME.comboMaxTier, 1 + Math.floor(combo / GAME.comboPerTier));
}

export function createWorld(seed) {
  const random = makeRandom(seed);
  const state = {
    random,
    screen: SCREEN_TITLE,
    time: 0,               // seconds since the night began (play only)
    nightLeft: GAME.nightSeconds,
    score: 0,              // light gathered
    lives: PLAYER.startLives,
    combo: 0,
    comboLeft: 0,          // seconds before the chain breaks
    bestCombo: 0,
    glow: 40,              // pulse meter, 0..PULSE.maxGlow
    pulseCooldown: 0,
    pulseRing: null,       // {age} while a pulse is expanding
    shake: 0,              // seconds of screen shake left
    flash: 0,              // seconds of red edge flash left (on a sting)
    player: {
      x: FIELD.width / 2, y: FIELD.height / 2, vx: 0, vy: 0,
      radius: PLAYER.radius,
      invulnerable: 0, trail: [],
    },
    motes: [],
    moths: [],
    particles: [],
    mothClock: MOTH.firstSpawnSeconds,
    brightClock: MOTE.brightEverySeconds * 0.5,
    events: [],
  };
  for (let i = 0; i < MOTE.keepOnField; i += 1) spawnMote(state, false);
  return state;
}

function spawnMote(state, bright) {
  const p = pointInField(state.random, FIELD, 46);
  const mote = {
    x: p.x, y: p.y,
    radius: bright ? MOTE.brightRadius : MOTE.radius,
    value: bright ? MOTE.brightValue : MOTE.value,
    bright,
    phase: range(state.random, 0, Math.PI * 2),
    vx: 0, vy: 0,
    life: bright ? MOTE.brightLifetimeSeconds : Infinity,
  };
  if (bright) {
    const angle = range(state.random, 0, Math.PI * 2);
    mote.vx = Math.cos(angle) * MOTE.brightDriftSpeed;
    mote.vy = Math.sin(angle) * MOTE.brightDriftSpeed;
  }
  state.motes.push(mote);
  return mote;
}

function spawnMoth(state) {
  // Moths drift in from a random edge, never on top of the wisp.
  let p = pointInField(state.random, FIELD, 10);
  for (let tries = 0; tries < 8 && distance(p, state.player) < 190; tries += 1) {
    p = pointInField(state.random, FIELD, 10);
  }
  const edge = Math.floor(state.random() * 4);
  if (edge === 0) p = { x: p.x, y: -MOTH.radius };
  if (edge === 1) p = { x: p.x, y: FIELD.height + MOTH.radius };
  if (edge === 2) p = { x: -MOTH.radius, y: p.y };
  if (edge === 3) p = { x: FIELD.width + MOTH.radius, y: p.y };
  state.moths.push({
    x: p.x, y: p.y, vx: 0, vy: 0,
    radius: MOTH.radius,
    phase: range(state.random, 0, Math.PI * 2),
    wing: range(state.random, 0, Math.PI * 2),
  });
}

function burst(state, x, y, color, count, speed) {
  for (let i = 0; i < count; i += 1) {
    const angle = range(state.random, 0, Math.PI * 2);
    const v = range(state.random, speed * 0.3, speed);
    state.particles.push({
      x, y,
      vx: Math.cos(angle) * v, vy: Math.sin(angle) * v,
      life: range(state.random, 0.3, 0.7), age: 0,
      size: range(state.random, 1.5, 3.4), color,
    });
  }
}

/** Begin the night from the title screen (or restart after an ending). */
export function startNight(state) {
  // A fresh seed drawn from the current stream: a restart is a new night,
  // not a replay of the last one.
  const seed = Math.floor(state.random() * 1_000_000_000) + 1;
  const fresh = createWorld(seed);
  Object.assign(state, fresh);
  state.screen = SCREEN_PLAY;
}

function endNight(state, won) {
  state.screen = won ? SCREEN_WIN : SCREEN_OVER;
  state.events.push(won ? EVENT_WIN : EVENT_LOSE);
}

/** Fire a pulse if the meter and cooldown allow it. */
export function tryPulse(state) {
  if (state.screen !== SCREEN_PLAY) return;
  if (state.pulseCooldown > 0) return;
  if (state.glow < PULSE.cost) {
    state.events.push(EVENT_DENIED);
    state.pulseCooldown = 0.18;
    return;
  }
  state.glow -= PULSE.cost;
  state.pulseCooldown = PULSE.cooldownSeconds;
  state.pulseRing = { age: 0 };
  state.events.push(EVENT_PULSE);
}

function updatePlayer(state, input, dt) {
  const p = state.player;
  const dir = input.direction();
  const ease = Math.min(1, PLAYER.accel * dt);
  p.vx += (dir.x * PLAYER.speed - p.vx) * ease;
  p.vy += (dir.y * PLAYER.speed - p.vy) * ease;
  p.x = Math.min(FIELD.width - p.radius, Math.max(p.radius, p.x + p.vx * dt));
  p.y = Math.min(FIELD.height - p.radius, Math.max(p.radius, p.y + p.vy * dt));
  if (p.invulnerable > 0) p.invulnerable -= dt;
  p.trail.unshift({ x: p.x, y: p.y });
  if (p.trail.length > PLAYER.trailLength) p.trail.length = PLAYER.trailLength;
}

function updateMotes(state, dt) {
  let common = 0;
  for (const mote of state.motes) {
    if (!mote.bright) common += 1;
    mote.phase += dt * 2.4;
    if (mote.bright) {
      mote.life -= dt;
      mote.x += mote.vx * dt;
      mote.y += mote.vy * dt;
      if (mote.x < mote.radius || mote.x > FIELD.width - mote.radius) mote.vx *= -1;
      if (mote.y < mote.radius || mote.y > FIELD.height - mote.radius) mote.vy *= -1;
      mote.x = Math.min(FIELD.width - mote.radius, Math.max(mote.radius, mote.x));
      mote.y = Math.min(FIELD.height - mote.radius, Math.max(mote.radius, mote.y));
    }
  }
  state.motes = state.motes.filter((m) => m.life > 0);
  while (common < MOTE.keepOnField) {
    spawnMote(state, false);
    common += 1;
  }
  state.brightClock -= dt;
  if (state.brightClock <= 0) {
    spawnMote(state, true);
    state.brightClock = MOTE.brightEverySeconds * range(state.random, 0.8, 1.25);
  }
}

function mothSpeed(state) {
  const t = 1 - state.nightLeft / GAME.nightSeconds; // 0 at dusk, 1 at dawn
  return MOTH.baseSpeed + (MOTH.topSpeed - MOTH.baseSpeed) * t;
}

function updateMoths(state, dt) {
  state.mothClock -= dt;
  const t = 1 - state.nightLeft / GAME.nightSeconds;
  const interval = MOTH.spawnStartSeconds
    + (MOTH.spawnEndSeconds - MOTH.spawnStartSeconds) * t;
  if (state.mothClock <= 0 && state.moths.length < MOTH.maxAlive) {
    spawnMoth(state);
    state.mothClock = interval;
  }
  const speed = mothSpeed(state);
  for (const moth of state.moths) {
    moth.wing += dt * 14;
    const toPlayer = Math.atan2(state.player.y - moth.y, state.player.x - moth.x);
    const wobble = Math.sin(state.time * MOTH.wobbleHz * Math.PI * 2 + moth.phase)
      * MOTH.wobblePx;
    const angle = toPlayer + (wobble / 160);
    moth.vx = Math.cos(angle) * speed;
    moth.vy = Math.sin(angle) * speed;
    moth.x += moth.vx * dt;
    moth.y += moth.vy * dt;
  }
}

function updatePulse(state, dt) {
  if (state.pulseCooldown > 0) state.pulseCooldown -= dt;
  if (!state.pulseRing) return;
  state.pulseRing.age += dt;
  const r = PULSE.radius * (state.pulseRing.age / PULSE.expandSeconds);
  state.moths = state.moths.filter((moth) => {
    if (distance(moth, state.player) <= r + moth.radius) {
      state.score += MOTH.banishValue;
      burst(state, moth.x, moth.y, '#c084fc', 8, 120);
      state.events.push(EVENT_BANISH);
      return false;
    }
    return true;
  });
  if (state.pulseRing.age >= PULSE.expandSeconds) state.pulseRing = null;
}

function updateCollisions(state) {
  const p = state.player;
  for (const mote of [...state.motes]) {
    if (distance(mote, p) < mote.radius + p.radius + 3) {
      state.motes.splice(state.motes.indexOf(mote), 1);
      state.combo = state.comboLeft > 0 ? state.combo + 1 : 1;
      state.comboLeft = GAME.comboWindowSeconds;
      state.bestCombo = Math.max(state.bestCombo, state.combo);
      const gained = mote.value * comboTier(state.combo);
      state.score += gained;
      state.glow = Math.min(PULSE.maxGlow, state.glow + MOTE.glowGain);
      burst(state, mote.x, mote.y, mote.bright ? '#ffeeb0' : '#ffcf5e', mote.bright ? 14 : 9, 130);
      state.events.push(mote.bright ? EVENT_BRIGHT : EVENT_COLLECT);
    }
  }
  if (p.invulnerable <= 0) {
    for (const moth of [...state.moths]) {
      if (distance(moth, p) < moth.radius + p.radius - 2) {
        state.moths.splice(state.moths.indexOf(moth), 1);
        state.lives -= 1;
        state.combo = 0;
        state.comboLeft = 0;
        p.invulnerable = PLAYER.invulnerableSeconds;
        state.shake = 0.35;
        state.flash = 0.3;
        burst(state, p.x, p.y, '#ff5d7a', 16, 170);
        state.events.push(EVENT_HIT);
        break;
      }
    }
  }
}

function updateParticles(state, dt) {
  for (const pt of state.particles) {
    pt.age += dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vx *= 0.96;
    pt.vy *= 0.96;
  }
  state.particles = state.particles.filter((pt) => pt.age < pt.life);
}

/**
 * Advance the world one fixed step. `input` is anything with direction()
 * (the real input, or a screenshot scene's autopilot). Events the step
 * produced are left in state.events for the caller to drain.
 */
export function stepWorld(state, input, dt) {
  if (state.screen === SCREEN_PLAY) {
    state.time += dt;
    state.nightLeft = Math.max(0, GAME.nightSeconds - state.time);
    if (state.comboLeft > 0) {
      state.comboLeft -= dt;
      if (state.comboLeft <= 0) state.combo = 0;
    }
    updatePlayer(state, input, dt);
    updateMotes(state, dt);
    updateMoths(state, dt);
    updatePulse(state, dt);
    updateCollisions(state);
    if (state.score >= GAME.goal) endNight(state, true);
    else if (state.lives <= 0) endNight(state, false);
    else if (state.nightLeft <= 0) endNight(state, false);
  }
  // Shake and flash decay on every screen, so an ending never freezes
  // mid-flinch on the results screen.
  if (state.shake > 0) state.shake -= dt;
  if (state.flash > 0) state.flash -= dt;
  updateParticles(state, dt);
}
