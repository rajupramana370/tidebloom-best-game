// Tidebloom entry point: fits the canvas, runs the fixed-step loop and
// wires the world, input, sound and renderer together. In screenshot
// mode (?shot=...) it draws one deterministic scene and stops the clock.

import { VIEW_WIDTH, VIEW_HEIGHT } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { SoundKeeper } from './audio.js';
import { drawWorld } from './render.js';
import { buildShotScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_WIDTH;
canvas.height = VIEW_HEIGHT;

const sound = new SoundKeeper();
const world = new World(sound);
const input = new Input(canvas);

const status = document.getElementById('status');
let lastState = '';
function announce() {
  if (!status || world.state === lastState) return;
  lastState = world.state;
  status.textContent = {
    title: 'Tidebloom. Press Enter or click to start.',
    playing: 'Sailing. Gather the bloom pearls.',
    paused: 'Paused.',
    won: 'You saved the bloom. Press R to play again.',
    lost: 'The boat broke up. Press R to try again.',
  }[world.state] || '';
}

window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'm') {
    sound.ensure();
    sound.toggleMute();
  }
  if (e.key === 'Enter' || e.key === ' ') sound.ensure();
});
canvas.addEventListener('mousedown', () => sound.ensure());

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  const seed = Number(params.get('seed')) || 1;
  buildShotScene(world, shot, seed);
  drawWorld(ctx, world, input);
  window.__shotReady = true;
} else {
  const STEP = 1 / 60;
  let acc = 0;
  let last = performance.now();
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000);
    last = now;
    while (acc >= STEP) {
      world.update(STEP, input);
      input.endFrame();
      acc -= STEP;
    }
    announce();
    drawWorld(ctx, world, input);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
