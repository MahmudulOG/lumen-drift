// A small seeded random generator (mulberry32). The world takes all of its
// randomness from one of these, so a seed fully decides a run: the screenshot
// scenes replay a seed and always land on the same frame.

export function makeRandom(seed) {
  let state = seed >>> 0;
  return function random() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random float in [min, max). */
export function range(random, min, max) {
  return min + random() * (max - min);
}

/** Random point inside the field, kept `pad` px away from the edges. */
export function pointInField(random, field, pad) {
  return {
    x: range(random, pad, field.width - pad),
    y: range(random, pad, field.height - pad),
  };
}
