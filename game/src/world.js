// The World is the whole game state and its rules: the keeper's boat,
// pearls, jellies, tides, score, hull, and the start/win/lose flow.

import {
  VIEW_WIDTH, VIEW_HEIGHT, PEARLS_TO_BLOOM, START_HULL, MAX_HULL,
  PEARL_SCORE, SHELL_SCORE, PLAYER_RADIUS, PLAYER_SPEED, DASH_SPEED,
  DASH_TIME, DASH_COOLDOWN, TIDES, PEARLS_PER_TIDE,
} from './config.js';
import { makeRng } from './random.js';
import { makePearl, makeJelly, makeDriftPrize, makeSpark, isOffstage } from './entities.js';

const BEST_KEY = 'tidebloom-best';

export class World {
  constructor(sound) {
    this.sound = sound;
    this.rng = makeRng((Math.random() * 1e9) | 0);
    this.state = 'title'; // title | playing | paused | won | lost
    this.best = 0;
    try { this.best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch { this.best = 0; }
    this.resetRun();
  }

  resetRun() {
    this.player = {
      x: VIEW_WIDTH / 2, y: VIEW_HEIGHT / 2 + 60,
      vx: 0, vy: 0, r: PLAYER_RADIUS, face: -Math.PI / 2,
      dashT: 0, dashCd: 0, invulnT: 0, shield: false,
    };
    this.pearls = [];
    this.jellies = [];
    this.prizes = [];
    this.sparks = [];
    this.score = 0;
    this.pearlsGot = 0;
    this.hull = START_HULL;
    this.tide = 1;
    this.time = 0;
    this.spawnT = 0.4;
    this.prizeT = 7;
    this.banner = '';
    this.bannerT = 0;
    this.shake = 0;
    this.flash = '';
    this.flashT = 0;
    for (let i = 0; i < 5; i++) this.pearls.push(makePearl(this.rng, this.player));
  }

  start() {
    this.resetRun();
    this.state = 'playing';
    this.say('Gather the bloom pearls!', 1.6);
    this.sound.levelUp();
  }

  say(text, seconds) {
    this.banner = text;
    this.bannerT = seconds;
  }

  tideRow() {
    return TIDES[Math.min(this.tide, TIDES.length) - 1];
  }

  saveBest() {
    if (this.score > this.best) {
      this.best = this.score;
      try { localStorage.setItem(BEST_KEY, String(this.best)); } catch { /* private mode */ }
    }
  }

  burst(x, y, color, count) {
    for (let i = 0; i < count; i++) this.sparks.push(makeSpark(x, y, color, this.rng));
  }

  update(dt, input) {
    this.updateSparks(dt);
    if (this.bannerT > 0) this.bannerT -= dt;
    if (this.flashT > 0) this.flashT -= dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 26);

    if (this.state === 'title') {
      if (input.takePress('enter') || input.takeClick()) this.start();
      return;
    }
    if (this.state === 'won' || this.state === 'lost') {
      if (input.takePress('r', 'enter') || input.takeClick()) this.start();
      return;
    }
    if (input.takePress('p', 'escape')) {
      this.state = this.state === 'paused' ? 'playing' : 'paused';
      return;
    }
    if (this.state !== 'playing') return;

    this.time += dt;
    this.sound.padStep(dt, true);
    this.movePlayer(dt, input);
    this.spawnThings(dt);
    this.moveThings(dt);
    this.collide();
  }

  movePlayer(dt, input) {
    const p = this.player;
    let ax = input.axisX();
    let ay = input.axisY();

    // Holding the mouse steers the boat toward the pointer.
    if (input.mouseDown) {
      const dx = input.mouseX - p.x;
      const dy = input.mouseY - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 24) { ax = dx / d; ay = dy / d; }
    }
    const len = Math.hypot(ax, ay) || 1;
    ax /= len; ay /= len;

    if (p.dashCd > 0) p.dashCd -= dt;
    if (p.invulnT > 0) p.invulnT -= dt;
    const wantsDash = input.dashHeld() || input.takePress('j');
    if (wantsDash && p.dashCd <= 0 && (ax || ay)) {
      p.dashT = DASH_TIME;
      p.dashCd = DASH_COOLDOWN;
      this.sound.dash();
      this.burst(p.x, p.y, '#d9f4e8', 7);
    }

    const speed = p.dashT > 0 ? DASH_SPEED : PLAYER_SPEED;
    if (p.dashT > 0) p.dashT -= dt;
    const tx = ax * speed;
    const ty = ay * speed;
    const blend = 1 - Math.pow(0.0001, dt);
    p.vx += (tx - p.vx) * blend;
    p.vy += (ty - p.vy) * blend;
    p.x = Math.min(VIEW_WIDTH - p.r, Math.max(p.r, p.x + p.vx * dt));
    p.y = Math.min(VIEW_HEIGHT - p.r, Math.max(86 + p.r, p.y + p.vy * dt));
    if (Math.abs(p.vx) + Math.abs(p.vy) > 12) p.face = Math.atan2(p.vy, p.vx);
    if ((Math.abs(p.vx) > 40 || Math.abs(p.vy) > 40) && this.rng() < dt * 9) {
      this.sparks.push(makeSpark(p.x - p.vx * 0.05, p.y - p.vy * 0.05, '#bfe8d8', this.rng));
    }
  }

  spawnThings(dt) {
    const row = this.tideRow();
    this.spawnT -= dt;
    if (this.spawnT <= 0 && this.jellies.length < row.jellyCap) {
      this.jellies.push(makeJelly(this.rng, row.jellySpeed * (0.85 + this.rng() * 0.4)));
      this.spawnT = row.spawnEvery;
    }
    while (this.pearls.length < 5) this.pearls.push(makePearl(this.rng, this.player));
    this.prizeT -= dt;
    if (this.prizeT <= 0) {
      this.prizes.push(makeDriftPrize(this.rng));
      this.prizeT = 9 + this.rng() * 6;
    }
  }

  moveThings(dt) {
    for (const j of this.jellies) {
      j.x += j.vx * dt;
      j.y += j.vy * dt + Math.sin(this.time * 2.2 + j.pulse) * 9 * dt;
      j.pulse += dt * 3;
      if (isOffstage(j)) j.gone = true;
    }
    this.jellies = this.jellies.filter((j) => !j.gone);
    for (const pl of this.pearls) pl.bob += dt * 2.4;
    for (const pr of this.prizes) {
      pr.spin += dt * 1.4;
      pr.life -= dt;
      if (pr.life <= 0) pr.taken = true;
    }
    this.prizes = this.prizes.filter((p) => !p.taken);
  }

  updateSparks(dt) {
    for (const s of this.sparks) {
      s.age += dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vx *= 0.96;
      s.vy *= 0.96;
    }
    this.sparks = this.sparks.filter((s) => s.age < s.life);
  }

  collide() {
    const p = this.player;
    const hit = (e) => Math.hypot(e.x - p.x, e.y - p.y) < e.r + p.r - 3;

    for (const pl of this.pearls) {
      if (!pl.taken && hit(pl)) {
        pl.taken = true;
        this.pearlsGot += 1;
        this.score += PEARL_SCORE;
        this.sound.collect();
        this.burst(pl.x, pl.y, '#ffe9a8', 10);
        const newTide = Math.min(TIDES.length, 1 + Math.floor(this.pearlsGot / PEARLS_PER_TIDE));
        if (newTide > this.tide) {
          this.tide = newTide;
          this.say(`The tide rises — level ${this.tide}!`, 2);
          this.sound.levelUp();
        }
        if (this.pearlsGot >= PEARLS_TO_BLOOM) {
          this.score += Math.max(0, 300 - Math.floor(this.time) * 2);
          this.state = 'won';
          this.saveBest();
          this.sound.win();
          this.burst(p.x, p.y, '#8fe3b0', 30);
        }
      }
    }
    this.pearls = this.pearls.filter((pl) => !pl.taken);

    for (const pr of this.prizes) {
      if (!pr.taken && hit(pr)) {
        pr.taken = true;
        if (pr.kind === 'star') {
          this.hull = Math.min(MAX_HULL, this.hull + 1);
          this.score += 15;
          this.say('Starfish mends the boat! +1 hull', 1.6);
          this.sound.heal();
        } else {
          p.shield = true;
          this.score += SHELL_SCORE;
          this.say('Shell shield — one sting blocked!', 1.6);
          this.sound.shell();
        }
        this.burst(pr.x, pr.y, '#ffb454', 10);
      }
    }
    this.prizes = this.prizes.filter((pr) => !pr.taken);

    if (p.invulnT > 0) return;
    for (const j of this.jellies) {
      if (hit(j)) {
        j.gone = true;
        if (p.shield) {
          p.shield = false;
          p.invulnT = 1.1;
          this.say('The shell shield breaks!', 1.4);
          this.sound.shell();
          this.burst(p.x, p.y, '#9fd8e8', 12);
        } else {
          this.hull -= 1;
          p.invulnT = 1.4;
          this.shake = 9;
          this.flash = '#ff7a6b';
          this.flashT = 0.22;
          this.sound.sting();
          this.burst(p.x, p.y, '#ff7a6b', 14);
          if (this.hull <= 0) {
            this.state = 'lost';
            this.saveBest();
            this.sound.lose();
          } else {
            this.say(`Stung! Hull ${this.hull} left`, 1.4);
          }
        }
        const push = Math.atan2(p.y - j.y, p.x - j.x);
        p.vx = Math.cos(push) * 320;
        p.vy = Math.sin(push) * 320;
        break;
      }
    }
    this.jellies = this.jellies.filter((j) => !j.gone);
  }
}
