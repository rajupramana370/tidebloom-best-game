// Deterministic screenshot scenes: ?shot=<name>&seed=<n> rebuilds one
// frozen moment of the game from the seed alone, steps it a fixed number
// of fixed-size steps, and flags window.__shotReady when it is drawn.

import { makeRng } from './random.js';
import { makePearl, makeJelly, makeDriftPrize } from './entities.js';

const STEP = 1 / 60;

function settle(world, steps) {
  const idle = { axisX: () => 0, axisY: () => 0, dashHeld: () => false, takePress: () => false, takeClick: () => false, mouseDown: false, mouseX: 0, mouseY: 0 };
  for (let i = 0; i < steps; i++) {
    world.time += STEP;
    world.moveThings(STEP);
    world.updateSparks(STEP);
  }
  void idle;
}

function stockLagoon(world, seed, pearls, jellies, prizes) {
  const rng = makeRng(seed);
  world.rng = rng;
  world.pearls = [];
  world.jellies = [];
  world.prizes = [];
  for (let i = 0; i < pearls; i++) world.pearls.push(makePearl(rng, world.player));
  for (let i = 0; i < jellies; i++) {
    const j = makeJelly(rng, 60);
    j.x = 120 + rng() * 1040;
    j.y = 140 + rng() * 480;
    world.jellies.push(j);
  }
  for (let i = 0; i < prizes; i++) world.prizes.push(makeDriftPrize(rng));
}

export function buildShotScene(world, name, seed) {
  world.resetRun();
  if (name === 'title') {
    world.state = 'title';
    stockLagoon(world, seed, 5, 2, 1);
    settle(world, 40);
    return;
  }
  world.state = 'playing';
  if (name === 'play') {
    world.score = 70;
    world.pearlsGot = 7;
    world.tide = 2;
    world.hull = 3;
    world.time = 41;
    world.player.x = 470; world.player.y = 400; world.player.face = -0.5;
    stockLagoon(world, seed, 5, 4, 1);
    settle(world, 50);
    return;
  }
  if (name === 'dash') {
    world.score = 160;
    world.pearlsGot = 16;
    world.tide = 4;
    world.hull = 2;
    world.time = 96;
    world.player.x = 700; world.player.y = 360; world.player.face = 0.25;
    world.player.shield = true;
    stockLagoon(world, seed, 5, 7, 1);
    world.say('The tide rises — level 4!', 99);
    settle(world, 30);
    return;
  }
  // win: the bloom is complete, festival colours everywhere.
  world.state = 'won';
  world.score = 640;
  world.pearlsGot = 25;
  world.tide = 6;
  world.hull = 2;
  world.time = 154;
  world.best = 640;
  stockLagoon(world, seed, 3, 1, 0);
  world.burst(world.player.x, world.player.y, '#8fe3b0', 24);
  settle(world, 12);
}
