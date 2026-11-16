// Factories and spawners for everything that floats in the lagoon:
// bloom pearls to gather, moon-jellies to avoid, and helpful drift-prizes.

import { VIEW_WIDTH, VIEW_HEIGHT } from './config.js';
import { randRange } from './random.js';

const MARGIN = 56;

export function makePearl(rng, awayFrom) {
  let x = 0;
  let y = 0;
  for (let tries = 0; tries < 12; tries++) {
    x = randRange(rng, MARGIN, VIEW_WIDTH - MARGIN);
    y = randRange(rng, 110, VIEW_HEIGHT - MARGIN);
    if (!awayFrom || Math.hypot(x - awayFrom.x, y - awayFrom.y) > 130) break;
  }
  return { kind: 'pearl', x, y, r: 13, bob: rng() * Math.PI * 2, taken: false };
}

export function makeJelly(rng, speed) {
  // Jellies drift in from a random edge and cross the lagoon.
  const side = Math.floor(rng() * 4);
  const drift = randRange(rng, -0.5, 0.5);
  let x; let y; let vx; let vy;
  if (side === 0) { x = -30; y = randRange(rng, 90, VIEW_HEIGHT - 60); vx = speed; vy = speed * drift; }
  else if (side === 1) { x = VIEW_WIDTH + 30; y = randRange(rng, 90, VIEW_HEIGHT - 60); vx = -speed; vy = speed * drift; }
  else if (side === 2) { x = randRange(rng, 60, VIEW_WIDTH - 60); y = -30; vx = speed * drift; vy = speed; }
  else { x = randRange(rng, 60, VIEW_WIDTH - 60); y = VIEW_HEIGHT + 30; vx = speed * drift; vy = -speed; }
  return { kind: 'jelly', x, y, vx, vy, r: 19, pulse: rng() * Math.PI * 2, gone: false };
}

export function makeDriftPrize(rng) {
  // A starfish mends the boat; a shell guards it from one sting.
  const star = rng() < 0.55;
  return {
    kind: star ? 'star' : 'shell',
    x: randRange(rng, MARGIN, VIEW_WIDTH - MARGIN),
    y: randRange(rng, 120, VIEW_HEIGHT - MARGIN),
    r: 15,
    spin: rng() * Math.PI * 2,
    life: 11,
    taken: false,
  };
}

export function makeSpark(x, y, color, rng) {
  const a = rng() * Math.PI * 2;
  const sp = randRange(rng, 30, 170);
  return { x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: randRange(rng, 0.3, 0.8), age: 0, color, size: randRange(rng, 2, 4.5) };
}

export function isOffstage(e, pad = 70) {
  return e.x < -pad || e.x > VIEW_WIDTH + pad || e.y < -pad || e.y > VIEW_HEIGHT + pad;
}
