// Lumen Drift — tuning constants. Every number the game balances on lives here.

// The arena, in logical pixels. The canvas is exactly this size.
export const FIELD = { width: 960, height: 600 };

// One simulation step: the world advances in fixed steps so a run (and a
// screenshot scene) is the same every time it is played from the same seed.
export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  speed: 268,          // px per second, top speed
  accel: 10,           // velocity easing toward the input direction, per second
  startLives: 3,
  invulnerableSeconds: 2,
  trailLength: 16,     // points of glow trail kept behind the wisp
};

export const MOTE = {
  radius: 8,
  brightRadius: 11,
  shardRadius: 10,
  value: 10,           // light for a common mote
  brightValue: 30,     // light for a bright mote
  shardValue: 60,      // light for a rare star shard
  keepOnField: 5,      // common motes the world tries to keep available
  brightEverySeconds: 11,
  brightLifetimeSeconds: 8,
  brightDriftSpeed: 26,
  shardEverySeconds: 24,   // a star shard appears about this often
  shardLifetimeSeconds: 7, // and is gone again this quickly: chase it or lose it
  shardDriftSpeed: 55,
  glowGain: 9,         // pulse meter gained per mote of either kind
  shardGlowGain: 20,   // a shard refills much more of the pulse meter
};

// A short burst of speed on Shift: the wisp's escape move. It costs nothing
// but time — the cooldown is the price, so a dash spent early is a dash that
// is not there when a moth corners you.
export const DASH = {
  speed: 660,            // px per second while dashing
  seconds: 0.16,         // how long one dash lasts
  cooldownSeconds: 2.2,  // before the next dash is ready
};

export const MOTH = {
  radius: 13,
  baseSpeed: 66,       // px per second at the start of the night
  topSpeed: 132,       // px per second near dawn
  wobbleHz: 1.7,       // wingbeat wobble of its chase path
  wobblePx: 26,
  firstSpawnSeconds: 1.6,
  spawnStartSeconds: 2.2,  // seconds between moths at the start
  spawnEndSeconds: 0.7,   // seconds between moths near dawn
  maxAlive: 16,
  banishValue: 5,      // light for a moth destroyed by a pulse
};

export const PULSE = {
  cost: 35,            // glow meter spent per pulse
  maxGlow: 100,
  radius: 138,
  expandSeconds: 0.22,
  cooldownSeconds: 0.45,
};

export const GAME = {
  goal: 2400,          // light to gather before the night ends: the win
  nightSeconds: 150,   // the night's length; dawn at zero
  comboWindowSeconds: 1.7,  // collect again within this to grow the combo
  comboPerTier: 3,     // combo count per multiplier tier (x1, x2, x3, x4)
  comboMaxTier: 4,
};

// The night garden palette.
export const COLORS = {
  skyTop: '#0b0e24',
  skyBottom: '#1b1440',
  hillFar: '#141233',
  hillNear: '#0d0b26',
  grass: '#12103a',
  wispCore: '#fff6d8',
  wispGlow: '#ffd76a',
  mote: '#ffcf5e',
  moteBright: '#ffeeb0',
  shard: '#aee9ff',
  shardCore: '#e8fbff',
  mothBody: '#3a1440',
  mothWing: '#7a2d6d',
  mothEye: '#ff5d7a',
  pulse: '#9be7ff',
  text: '#f4ead2',
  textDim: '#a79fd0',
  danger: '#ff5d7a',
  good: '#8dff9a',
};
