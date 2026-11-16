// Lumen Drift — drawing. Everything is canvas shapes and gradients: no
// images, no fonts to load. `now` is a seconds clock for ambient motion
// (glow breathing, fireflies) that sits outside the fixed-step simulation.

import { COLORS, FIELD, GAME, PLAYER, PULSE } from './config.js';
import { makeRandom } from './random.js';
import {
  SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN, comboTier,
} from './world.js';

// The garden backdrop is fixed: one seeded scatter of stars, fireflies and
// grass, drawn the same way on every frame.
const sceneryRandom = makeRandom(20261);
const STARS = Array.from({ length: 90 }, () => ({
  x: sceneryRandom() * FIELD.width,
  y: sceneryRandom() * FIELD.height * 0.62,
  r: 0.6 + sceneryRandom() * 1.3,
  tw: sceneryRandom() * Math.PI * 2,
}));
const FIREFLIES = Array.from({ length: 22 }, () => ({
  x: sceneryRandom() * FIELD.width,
  y: 120 + sceneryRandom() * (FIELD.height - 180),
  ph: sceneryRandom() * Math.PI * 2,
  sp: 0.3 + sceneryRandom() * 0.7,
}));
const GRASS = Array.from({ length: 130 }, () => ({
  x: sceneryRandom() * FIELD.width,
  h: 14 + sceneryRandom() * 30,
  lean: (sceneryRandom() - 0.5) * 10,
}));

function drawBackground(ctx, now) {
  const sky = ctx.createLinearGradient(0, 0, 0, FIELD.height);
  sky.addColorStop(0, COLORS.skyTop);
  sky.addColorStop(1, COLORS.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);

  // Moon, top right, with a soft halo.
  const moon = ctx.createRadialGradient(828, 84, 6, 828, 84, 90);
  moon.addColorStop(0, 'rgba(255,244,200,0.85)');
  moon.addColorStop(0.25, 'rgba(255,244,200,0.28)');
  moon.addColorStop(1, 'rgba(255,244,200,0)');
  ctx.fillStyle = moon;
  ctx.fillRect(720, 0, 240, 200);
  ctx.fillStyle = '#fdf3c4';
  ctx.beginPath();
  ctx.arc(828, 84, 24, 0, Math.PI * 2);
  ctx.fill();

  for (const star of STARS) {
    const a = 0.35 + 0.3 * Math.sin(now * 1.3 + star.tw);
    ctx.fillStyle = `rgba(230,235,255,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rolling hills.
  ctx.fillStyle = COLORS.hillFar;
  ctx.beginPath();
  ctx.moveTo(0, 500);
  ctx.bezierCurveTo(240, 452, 420, 520, 640, 486);
  ctx.bezierCurveTo(800, 462, 900, 496, 960, 478);
  ctx.lineTo(960, 600);
  ctx.lineTo(0, 600);
  ctx.fill();
  ctx.fillStyle = COLORS.hillNear;
  ctx.beginPath();
  ctx.moveTo(0, 548);
  ctx.bezierCurveTo(260, 512, 520, 566, 760, 536);
  ctx.bezierCurveTo(860, 524, 920, 540, 960, 532);
  ctx.lineTo(960, 600);
  ctx.lineTo(0, 600);
  ctx.fill();

  // Grass silhouettes along the bottom.
  ctx.strokeStyle = COLORS.grass;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const blade of GRASS) {
    ctx.moveTo(blade.x, FIELD.height);
    ctx.quadraticCurveTo(
      blade.x + blade.lean * 0.4, FIELD.height - blade.h * 0.6,
      blade.x + blade.lean, FIELD.height - blade.h,
    );
  }
  ctx.stroke();

  // Drifting fireflies.
  for (const fly of FIREFLIES) {
    const x = fly.x + Math.sin(now * fly.sp + fly.ph) * 16;
    const y = fly.y + Math.cos(now * fly.sp * 0.8 + fly.ph) * 10;
    const a = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(now * 2 + fly.ph * 3));
    ctx.fillStyle = `rgba(190,255,170,${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMote(ctx, mote, now) {
  const bob = Math.sin(mote.phase) * 3;
  const y = mote.y + bob;
  const pulse = 1 + 0.12 * Math.sin(now * 3 + mote.phase);
  const r = mote.radius * pulse;
  const glow = ctx.createRadialGradient(mote.x, y, 1, mote.x, y, r * 3.1);
  const color = mote.bright ? COLORS.moteBright : COLORS.mote;
  glow.addColorStop(0, 'rgba(255,220,130,0.55)');
  glow.addColorStop(1, 'rgba(255,220,130,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(mote.x, y, r * 3.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(mote.x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(mote.x - r * 0.25, y - r * 0.25, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  if (mote.bright) {
    ctx.strokeStyle = 'rgba(255,238,176,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(mote.x, y, r * 1.7 + Math.sin(now * 5) * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawMoth(ctx, moth, now) {
  const flap = Math.sin(moth.wing) * 0.5;
  ctx.save();
  ctx.translate(moth.x, moth.y);
  const angle = Math.atan2(moth.vy, moth.vx);
  ctx.rotate(angle + Math.PI / 2);
  // Wings.
  ctx.fillStyle = COLORS.mothWing;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.rotate(side * (0.7 + flap * 0.35));
    ctx.beginPath();
    ctx.ellipse(side * 10, -4, 11, 6, side * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body: a dark thorn teardrop.
  ctx.fillStyle = COLORS.mothBody;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.quadraticCurveTo(7, 0, 0, 13);
  ctx.quadraticCurveTo(-7, 0, 0, -13);
  ctx.fill();
  // Eyes.
  ctx.fillStyle = COLORS.mothEye;
  ctx.beginPath();
  ctx.arc(-3, -6, 1.8, 0, Math.PI * 2);
  ctx.arc(3, -6, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  void now;
}

function drawWisp(ctx, state, now) {
  const p = state.player;
  // Trail.
  p.trail.forEach((point, i) => {
    const t = 1 - i / PLAYER.trailLength;
    ctx.fillStyle = `rgba(255,205,100,${(0.10 * t).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(point.x, point.y, PLAYER.radius * t * 0.9, 0, Math.PI * 2);
    ctx.fill();
  });
  const blink = p.invulnerable > 0 && Math.floor(now * 14) % 2 === 0;
  const breathe = 1 + 0.07 * Math.sin(now * 4);
  const r = PLAYER.radius * breathe;
  const glow = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, r * 3.4);
  glow.addColorStop(0, blink ? 'rgba(255,160,160,0.5)' : 'rgba(255,215,106,0.55)');
  glow.addColorStop(1, 'rgba(255,215,106,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = blink ? '#ffb3ab' : COLORS.wispCore;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.wispGlow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
  ctx.fill();
}

function drawPulse(ctx, state) {
  if (!state.pulseRing) return;
  const t = state.pulseRing.age / 0.22;
  const r = 138 * t;
  ctx.strokeStyle = `rgba(155,231,255,${(0.75 * (1 - t)).toFixed(3)})`;
  ctx.lineWidth = 4 * (1 - t) + 1;
  ctx.beginPath();
  ctx.arc(state.player.x, state.player.y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawParticles(ctx, state) {
  for (const pt of state.particles) {
    const a = 1 - pt.age / pt.life;
    ctx.globalAlpha = Math.max(0, a);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * a + 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function bar(ctx, x, y, w, h, frac, fill, back = 'rgba(255,255,255,0.14)') {
  ctx.fillStyle = back;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.min(1, Math.max(0, frac)), h);
}

function drawHud(ctx, state) {
  ctx.textBaseline = 'top';
  // Light gathered, against the goal.
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.textAlign = 'left';
  ctx.fillText(`LIGHT ${state.score} / ${GAME.goal}`, 16, 12);
  bar(ctx, 16, 34, 250, 9, state.score / GAME.goal, COLORS.mote);
  // Night left.
  const mm = Math.floor(state.nightLeft / 60);
  const ss = Math.floor(state.nightLeft % 60).toString().padStart(2, '0');
  ctx.textAlign = 'center';
  ctx.fillStyle = state.nightLeft < 20 ? COLORS.danger : COLORS.text;
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.fillText(`DAWN IN ${mm}:${ss}`, FIELD.width / 2, 11);
  // Lives, as wisp orbs.
  ctx.textAlign = 'right';
  ctx.font = '700 15px system-ui, sans-serif';
  ctx.fillStyle = COLORS.text;
  ctx.fillText('LIVES', FIELD.width - 86, 12);
  for (let i = 0; i < PLAYER.startLives; i += 1) {
    const x = FIELD.width - 62 + i * 22;
    ctx.fillStyle = i < state.lives ? COLORS.wispGlow : 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(x, 19, 7, 0, Math.PI * 2);
    ctx.fill();
  }
  // Combo and glow, bottom corners.
  ctx.textAlign = 'left';
  if (state.combo >= 2) {
    ctx.fillStyle = COLORS.moteBright;
    ctx.font = '700 16px system-ui, sans-serif';
    ctx.fillText(`COMBO x${comboTier(state.combo)}  (${state.combo} chain)`, 16, FIELD.height - 30);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '600 12px system-ui, sans-serif';
  ctx.fillText('GLOW — SPACE / CLICK: PULSE', FIELD.width - 16, FIELD.height - 46);
  bar(ctx, FIELD.width - 166, FIELD.height - 30, 150, 9, state.glow / PULSE.maxGlow,
    state.glow >= PULSE.cost ? COLORS.pulse : 'rgba(155,231,255,0.4)');
}

function centerText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, FIELD.width / 2, y);
}

function drawTitle(ctx, state, now) {
  // The wisp hovers centre stage under the title, motes already drifting.
  for (const mote of state.motes) drawMote(ctx, mote, now);
  drawWisp(ctx, { player: { ...state.player, trail: [], invulnerable: 0 } }, now);
  centerText(ctx, 'LUMEN DRIFT', 120, '800 64px system-ui, sans-serif', COLORS.wispGlow);
  centerText(ctx, 'Gather the light before dawn. Dodge the thorn moths.', 200,
    '500 19px system-ui, sans-serif', COLORS.text);
  centerText(ctx, 'Move: WASD / arrow keys      Pulse: Space or click (costs glow)', 268,
    '600 15px system-ui, sans-serif', COLORS.textDim);
  centerText(ctx, `Collect motes to build glow and combos. Reach ${GAME.goal} light to win.`, 292,
    '600 15px system-ui, sans-serif', COLORS.textDim);
  const blink = 0.6 + 0.4 * Math.sin(now * 3);
  ctx.globalAlpha = blink;
  centerText(ctx, 'CLICK OR PRESS ENTER TO BEGIN', 356,
    '700 18px system-ui, sans-serif', COLORS.good);
  ctx.globalAlpha = 1;
}

function drawEnd(ctx, state, won) {
  ctx.fillStyle = 'rgba(5,6,18,0.55)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  centerText(ctx, won ? 'DAWN BREAKS — YOU WIN' : 'THE GARDEN GOES DARK',
    168, '800 40px system-ui, sans-serif', won ? COLORS.good : COLORS.danger);
  centerText(ctx, `Light gathered: ${state.score} of ${GAME.goal}`, 232,
    '600 20px system-ui, sans-serif', COLORS.text);
  centerText(ctx, `Best combo chain: ${state.bestCombo}    Time in the night: ${Math.floor(state.time)}s`,
    264, '600 16px system-ui, sans-serif', COLORS.textDim);
  centerText(ctx, won ? 'The garden glows again because of you.' : 'The motes scatter… this time.',
    300, '500 16px system-ui, sans-serif', COLORS.textDim);
  centerText(ctx, 'CLICK OR PRESS R TO PLAY AGAIN', 356,
    '700 17px system-ui, sans-serif', COLORS.good);
}

/** Draw the whole scene for `state`. `now` is seconds, for ambient motion. */
export function render(ctx, state, now) {
  ctx.save();
  if (state.shake > 0) {
    const s = state.shake * 14;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }
  drawBackground(ctx, now);
  if (state.screen === SCREEN_TITLE) {
    drawTitle(ctx, state, now);
  } else {
    for (const mote of state.motes) drawMote(ctx, mote, now);
    for (const moth of state.moths) drawMoth(ctx, moth, now);
    drawPulse(ctx, state);
    drawWisp(ctx, state, now);
    drawParticles(ctx, state);
    if (state.screen === SCREEN_PLAY) drawHud(ctx, state);
    if (state.screen === SCREEN_OVER) { drawHud(ctx, state); drawEnd(ctx, state, false); }
    if (state.screen === SCREEN_WIN) { drawHud(ctx, state); drawEnd(ctx, state, true); }
  }
  ctx.restore();
  if (state.flash > 0) {
    ctx.strokeStyle = `rgba(255,93,122,${(state.flash * 1.6).toFixed(3)})`;
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, FIELD.width, FIELD.height);
  }
}
