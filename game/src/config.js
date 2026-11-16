// Tidebloom configuration: world size, goals, palette and the tide table.
// Everything visual in the game traces back to these constants.

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 720;

export const PEARLS_TO_BLOOM = 25; // collect this many bloom pearls to win
export const START_HULL = 3;
export const MAX_HULL = 5;
export const PEARL_SCORE = 10;
export const SHELL_SCORE = 25;

export const PLAYER_RADIUS = 17;
export const PLAYER_SPEED = 265;
export const DASH_SPEED = 640;
export const DASH_TIME = 0.16;
export const DASH_COOLDOWN = 0.9;

// One row per tide level: how fast and how crowded the lagoon gets.
export const TIDES = [
  { level: 1, jellySpeed: 46, jellyCap: 3, spawnEvery: 1.15 },
  { level: 2, jellySpeed: 58, jellyCap: 4, spawnEvery: 1.0 },
  { level: 3, jellySpeed: 72, jellyCap: 5, spawnEvery: 0.88 },
  { level: 4, jellySpeed: 88, jellyCap: 7, spawnEvery: 0.76 },
  { level: 5, jellySpeed: 104, jellyCap: 9, spawnEvery: 0.64 },
  { level: 6, jellySpeed: 122, jellyCap: 11, spawnEvery: 0.54 },
];
export const PEARLS_PER_TIDE = 5;

export const COLORS = {
  deep: '#07332f',
  water: '#0b4f46',
  waterLight: '#12705f',
  sand: '#e8d8a8',
  foam: '#d9f4e8',
  pearl: '#ffe9a8',
  pearlCore: '#fff7d6',
  jelly: '#e58bb1',
  jellyDark: '#b34a7d',
  star: '#ffb454',
  shell: '#9fd8e8',
  boat: '#f4e3c2',
  boatTrim: '#c85a3a',
  lantern: '#ffd76a',
  ink: '#06231f',
  paper: '#fdf6e0',
  danger: '#ff7a6b',
  good: '#8fe3b0',
};
