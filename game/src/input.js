// Keyboard and mouse state. The world reads a plain snapshot each step:
// a movement direction (-1..1 on each axis), and edge-triggered buttons the
// main loop drains once per frame (pulse, confirm, mute).

const MOVE_KEYS = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  KeyA: 'left', KeyD: 'right', KeyW: 'up', KeyS: 'down',
};

export function createInput(canvas) {
  const held = { left: false, right: false, up: false, down: false };
  const pressed = { pulse: false, confirm: false, mute: false };
  const pointer = { x: 0, y: 0, down: false };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  window.addEventListener('keydown', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) {
      held[move] = true;
      event.preventDefault();
      return;
    }
    if (event.repeat) return;
    if (event.code === 'Space') { pressed.pulse = true; event.preventDefault(); }
    if (event.code === 'Enter' || event.code === 'KeyR') pressed.confirm = true;
    if (event.code === 'KeyM') pressed.mute = true;
  });

  window.addEventListener('keyup', (event) => {
    const move = MOVE_KEYS[event.code];
    if (move) held[move] = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    const p = canvasPoint(event);
    pointer.x = p.x; pointer.y = p.y;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const p = canvasPoint(event);
    pointer.x = p.x; pointer.y = p.y;
    pointer.down = true;
    pressed.pulse = true;
    pressed.confirm = true;
  });

  window.addEventListener('pointerup', () => { pointer.down = false; });

  return {
    /** Current movement direction, normalised: {x, y} each in -1..1. */
    direction() {
      const x = (held.right ? 1 : 0) - (held.left ? 1 : 0);
      const y = (held.down ? 1 : 0) - (held.up ? 1 : 0);
      if (x !== 0 && y !== 0) {
        const inv = Math.SQRT1_2;
        return { x: x * inv, y: y * inv };
      }
      return { x, y };
    },
    pointer,
    /** Take a button press if one happened since the last drain. */
    take(name) {
      const was = pressed[name];
      pressed[name] = false;
      return was;
    },
  };
}
