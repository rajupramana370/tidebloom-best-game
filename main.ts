// Tidebloom's hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ — plain files a desktop
// browser opens offline. This program copies game/ and screenshots/ to
// the output directory and writes dossier.json there with the kit's
// vendored buildDossier, byte for byte as the scorer rebuilds it.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (In the grader's container the output is /output and no variable is set.)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps are the gate's own (see RULES.txt): the dossier text cap shapes
// the bytes; the rest refuse here what the scorer would refuse anyway.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
