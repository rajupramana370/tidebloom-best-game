// Every pixel of Tidebloom is drawn here with canvas paths: the lagoon,
// the keeper's boat, pearls, jellies, the HUD and every screen.

import { VIEW_WIDTH, VIEW_HEIGHT, PEARLS_TO_BLOOM, MAX_HULL, COLORS } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'center', bold = true) {
  ctx.font = `${bold ? '700' : '400'} ${size}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

export function drawWorld(ctx, world, input) {
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake, (Math.random() - 0.5) * world.shake);
  }
  drawLagoon(ctx, world);
  for (const pl of world.pearls) drawPearl(ctx, pl, world.time);
  for (const pr of world.prizes) drawPrize(ctx, pr);
  for (const j of world.jellies) drawJelly(ctx, j);
  drawSparks(ctx, world);
  drawBoat(ctx, world);
  ctx.restore();

  if (world.flashT > 0) {
    ctx.fillStyle = `rgba(255, 90, 70, ${world.flashT * 0.55})`;
    ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  }
  drawHud(ctx, world, input);

  if (world.state === 'title') drawTitle(ctx, world);
  else if (world.state === 'paused') drawPaused(ctx);
  else if (world.state === 'won') drawEnd(ctx, world, true);
  else if (world.state === 'lost') drawEnd(ctx, world, false);
}

function drawLagoon(ctx, world) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_HEIGHT);
  g.addColorStop(0, COLORS.waterLight);
  g.addColorStop(0.45, COLORS.water);
  g.addColorStop(1, COLORS.deep);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);

  // Sandy rim at the top, where the keeper's dock sits.
  ctx.fillStyle = COLORS.sand;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(VIEW_WIDTH, 0);
  ctx.lineTo(VIEW_WIDTH, 62);
  for (let x = VIEW_WIDTH; x >= 0; x -= 64) {
    ctx.quadraticCurveTo(x - 32, 86 + Math.sin(x * 0.05) * 8, x - 64, 62);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(0, 66, VIEW_WIDTH, 3);

  // Slow light rays and drifting motes give the water depth.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 5; i++) {
    const x = 130 + i * 250 + Math.sin(world.time * 0.24 + i * 1.7) * 26;
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x + 70, 70);
    ctx.lineTo(x + 170, VIEW_HEIGHT);
    ctx.lineTo(x + 40, VIEW_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Reed tufts and rocks, placed from the run's own time so they sway.
  ctx.strokeStyle = '#0a3d35';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const tufts = [60, 300, 560, 830, 1090, 1225];
  for (let i = 0; i < tufts.length; i++) {
    const x = tufts[i];
    const sway = Math.sin(world.time * 1.3 + i * 2.1) * 6;
    for (let b = -1; b <= 1; b++) {
      ctx.beginPath();
      ctx.moveTo(x + b * 9, VIEW_HEIGHT);
      ctx.quadraticCurveTo(x + b * 12, VIEW_HEIGHT - 44, x + b * 16 + sway, VIEW_HEIGHT - 74 - Math.abs(b) * -10);
      ctx.stroke();
    }
  }
  ctx.fillStyle = 'rgba(6, 35, 31, 0.55)';
  for (const [x, y, r] of [[150, 210, 26], [1130, 300, 34], [240, 560, 20], [1030, 590, 22]]) {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPearl(ctx, pl, time) {
  const y = pl.y + Math.sin(pl.bob) * 5;
  const glow = 0.5 + Math.sin(pl.bob * 1.4) * 0.18;
  const g = ctx.createRadialGradient(pl.x, y, 2, pl.x, y, 30);
  g.addColorStop(0, `rgba(255, 233, 168, ${glow})`);
  g.addColorStop(1, 'rgba(255, 233, 168, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(pl.x, y, 30, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.pearl;
  ctx.beginPath(); ctx.arc(pl.x, y, pl.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.pearlCore;
  ctx.beginPath(); ctx.arc(pl.x - 4, y - 4, 5.5, 0, Math.PI * 2); ctx.fill();
  void time;
}

function drawPrize(ctx, pr) {
  const blink = pr.life < 2.5 ? (Math.sin(pr.life * 14) > 0 ? 1 : 0.25) : 1;
  ctx.save();
  ctx.globalAlpha = blink;
  ctx.translate(pr.x, pr.y);
  ctx.rotate(Math.sin(pr.spin) * 0.25);
  if (pr.kind === 'star') {
    ctx.fillStyle = COLORS.star;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 === 0 ? 16 : 7;
      ctx[i === 0 ? 'moveTo' : 'lineTo'](Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#a35b12';
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = COLORS.shell;
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.arc(0, 4, 14, 0.15 * Math.PI, 0.85 * Math.PI, true);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#4d86a3';
    ctx.lineWidth = 2;
    for (const a of [-0.6, 0, 0.6]) {
      ctx.beginPath();
      ctx.moveTo(0, 12);
      ctx.lineTo(Math.sin(a) * 13, 4 - Math.cos(a) * 11);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawJelly(ctx, j) {
  const squash = 1 + Math.sin(j.pulse) * 0.1;
  ctx.save();
  ctx.translate(j.x, j.y);
  ctx.scale(1, squash);
  ctx.fillStyle = 'rgba(229, 139, 177, 0.28)';
  ctx.beginPath(); ctx.arc(0, 0, j.r + 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.jelly;
  ctx.beginPath();
  ctx.arc(0, 0, j.r, Math.PI, 0);
  ctx.quadraticCurveTo(j.r, 8, j.r - 4, 12);
  ctx.lineTo(-j.r + 4, 12);
  ctx.quadraticCurveTo(-j.r, 8, -j.r, 0);
  ctx.fill();
  ctx.fillStyle = COLORS.jellyDark;
  ctx.beginPath(); ctx.arc(-6, -6, 3, 0, Math.PI * 2); ctx.arc(6, -6, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = COLORS.jelly;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let t = -1; t <= 1; t++) {
    ctx.beginPath();
    ctx.moveTo(t * 9, 12);
    ctx.quadraticCurveTo(t * 11 + Math.sin(j.pulse + t) * 4, 24, t * 9, 34 + Math.sin(j.pulse * 1.3 + t * 2) * 4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSparks(ctx, world) {
  for (const s of world.sparks) {
    ctx.globalAlpha = Math.max(0, 1 - s.age / s.life);
    ctx.fillStyle = s.color;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBoat(ctx, world) {
  const p = world.player;
  const blink = p.invulnT > 0 && Math.sin(world.time * 26) > 0;
  ctx.save();
  ctx.translate(p.x, p.y);
  // Lantern glow first, under the hull.
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 52);
  g.addColorStop(0, 'rgba(255, 215, 106, 0.4)');
  g.addColorStop(1, 'rgba(255, 215, 106, 0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, 52, 0, Math.PI * 2); ctx.fill();
  if (p.shield) {
    ctx.strokeStyle = 'rgba(159, 216, 232, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, p.r + 9, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.rotate(p.face);
  ctx.globalAlpha = blink ? 0.35 : 1;
  // Hull: a little round coracle with a striped rim.
  ctx.fillStyle = COLORS.boatTrim;
  ctx.beginPath(); ctx.arc(0, 0, p.r + 3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.boat;
  ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b98d54';
  ctx.beginPath(); ctx.arc(0, 0, p.r - 7, 0, Math.PI * 2); ctx.fill();
  // The keeper: hood, face and a lantern held toward the bow.
  ctx.fillStyle = '#2e7d6b';
  ctx.beginPath(); ctx.arc(-1, 0, 8.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f7cf9a';
  ctx.beginPath(); ctx.arc(1.5, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = COLORS.lantern;
  ctx.beginPath(); ctx.arc(p.r - 2, 0, 5.5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#7a4a12';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.r - 2, 0, 5.5, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Dash cooldown pip under the boat.
  if (world.state === 'playing') {
    const ready = p.dashCd <= 0;
    ctx.fillStyle = 'rgba(6, 35, 31, 0.55)';
    roundRect(ctx, p.x - 18, p.y + p.r + 10, 36, 6, 3); ctx.fill();
    ctx.fillStyle = ready ? COLORS.good : '#e8d8a8';
    roundRect(ctx, p.x - 18, p.y + p.r + 10, 36 * (ready ? 1 : 1 - p.dashCd / 0.9), 6, 3); ctx.fill();
  }
}

function heart(ctx, x, y, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = filled ? '#ff8a7a' : 'rgba(255,255,255,0.22)';
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.bezierCurveTo(-13, -3, -7, -13, 0, -6);
  ctx.bezierCurveTo(7, -13, 13, -3, 0, 7);
  ctx.fill();
  ctx.restore();
}

function drawHud(ctx, world, input) {
  ctx.fillStyle = 'rgba(6, 35, 31, 0.62)';
  roundRect(ctx, 14, 12, VIEW_WIDTH - 28, 52, 14); ctx.fill();

  text(ctx, `SCORE ${world.score}`, 34, 39, 24, COLORS.paper, 'left');
  text(ctx, `PEARLS ${world.pearlsGot} / ${PEARLS_TO_BLOOM}`, 330, 39, 24, COLORS.pearl, 'left');
  text(ctx, `TIDE ${world.tide}`, 620, 39, 24, '#9fd8e8', 'left');
  const mm = Math.floor(world.time / 60);
  const ss = String(Math.floor(world.time % 60)).padStart(2, '0');
  text(ctx, `${mm}:${ss}`, 790, 39, 24, COLORS.paper, 'left');
  for (let i = 0; i < MAX_HULL; i++) heart(ctx, 925 + i * 32, 39, i < world.hull);
  if (world.player.shield) text(ctx, 'SHIELD', 1130, 39, 20, COLORS.shell, 'left');
  text(ctx, inputSoundLabel(world), VIEW_WIDTH - 30, 39, 18, 'rgba(253,246,224,0.75)', 'right');

  if (world.bannerT > 0 && world.state === 'playing') {
    ctx.fillStyle = 'rgba(6, 35, 31, 0.72)';
    const w = world.banner.length * 13.5 + 44;
    roundRect(ctx, (VIEW_WIDTH - w) / 2, 84, w, 44, 12); ctx.fill();
    text(ctx, world.banner, VIEW_WIDTH / 2, 107, 23, COLORS.pearl);
  }
}

function inputSoundLabel(world) {
  return world.sound.muted ? 'M SOUND OFF' : 'M SOUND ON';
}

function panel(ctx, w, h) {
  const x = (VIEW_WIDTH - w) / 2;
  const y = (VIEW_HEIGHT - h) / 2;
  ctx.fillStyle = 'rgba(4, 26, 22, 0.78)';
  ctx.fillRect(0, 0, VIEW_WIDTH, VIEW_HEIGHT);
  ctx.fillStyle = 'rgba(253, 246, 224, 0.97)';
  roundRect(ctx, x, y, w, h, 22); ctx.fill();
  ctx.strokeStyle = COLORS.boatTrim;
  ctx.lineWidth = 4;
  roundRect(ctx, x, y, w, h, 22); ctx.stroke();
  return { x, y };
}

function drawTitle(ctx, world) {
  const { x, y } = panel(ctx, 700, 470);
  const cx = VIEW_WIDTH / 2;
  text(ctx, 'TIDEBLOOM', cx, y + 62, 58, '#0b4f46');
  text(ctx, 'Keeper of the Lagoon', cx, y + 112, 25, '#c85a3a');
  text(ctx, 'The moon-jellies have scattered the bloom pearls.', cx, y + 168, 21, COLORS.ink, 'center', false);
  text(ctx, `Gather ${PEARLS_TO_BLOOM} pearls before your little boat breaks up!`, cx, y + 198, 21, COLORS.ink, 'center', false);
  text(ctx, 'MOVE  WASD / Arrows, or hold the mouse', cx, y + 252, 20, '#0b4f46');
  text(ctx, 'DASH  Shift / Space / J  •  PAUSE  P  •  SOUND  M', cx, y + 284, 20, '#0b4f46');
  text(ctx, 'Starfish mend the boat. Shells block one sting.', cx, y + 322, 19, COLORS.ink, 'center', false);
  text(ctx, 'Every 5 pearls, the tide rises and the jellies quicken.', cx, y + 350, 19, COLORS.ink, 'center', false);
  ctx.fillStyle = '#c85a3a';
  roundRect(ctx, cx - 130, y + 382, 260, 52, 14); ctx.fill();
  text(ctx, 'CLICK OR PRESS ENTER', cx, y + 409, 20, '#ffffff');
  if (world.best > 0) text(ctx, `Best score so far: ${world.best}`, cx, y + 458 - 6, 18, '#7a6a45');
  void x;
}

function drawPaused(ctx) {
  const { y } = panel(ctx, 430, 210);
  text(ctx, 'PAUSED', VIEW_WIDTH / 2, y + 62, 40, '#0b4f46');
  text(ctx, 'Press P to keep sailing', VIEW_WIDTH / 2, y + 122, 21, COLORS.ink, 'center', false);
  text(ctx, 'The lagoon waits for no one else.', VIEW_WIDTH / 2, y + 156, 18, '#7a6a45', 'center', false);
}

function drawEnd(ctx, world, won) {
  const { y } = panel(ctx, 640, 400);
  const cx = VIEW_WIDTH / 2;
  text(ctx, won ? 'THE BLOOM IS SAVED!' : 'THE BOAT BROKE UP', cx, y + 64, 40, won ? '#12705f' : '#b3402e');
  text(ctx, won ? 'Lanterns light all over the lagoon tonight.' : 'The jellies keep the pearls… this time.', cx, y + 112, 21, COLORS.ink, 'center', false);
  text(ctx, `Score  ${world.score}`, cx, y + 176, 32, '#0b4f46');
  text(ctx, `Pearls ${world.pearlsGot} of ${PEARLS_TO_BLOOM}  •  Tide ${world.tide}  •  Best ${world.best}`, cx, y + 222, 21, COLORS.ink, 'center', false);
  const mm = Math.floor(world.time / 60);
  const ss = String(Math.floor(world.time % 60)).padStart(2, '0');
  text(ctx, `Time ${mm}:${ss}`, cx, y + 256, 20, '#7a6a45');
  ctx.fillStyle = '#c85a3a';
  roundRect(ctx, cx - 140, y + 292, 280, 54, 14); ctx.fill();
  text(ctx, 'PLAY AGAIN — R OR CLICK', cx, y + 320, 20, '#ffffff');
}
