// Ember & Thyme — the entry program.
// Copies the game and its screenshots into the grader's output directory
// and writes the dossier the scorer re-derives with the same library, so
// the two runs the grader makes write the same bytes every time.

import { cpSync, mkdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const here = process.cwd();

// Fail loudly on a half-built repository instead of handing in a dossier
// the scorer would refuse for a missing game or screenshots.
for (const needed of ['game', 'screenshots']) {
  if (!statSync(join(here, needed)).isDirectory()) {
    throw new Error(`main.ts: ${needed}/ is missing or not a directory`);
  }
}

rmSync(join(outDir, 'game'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
mkdirSync(join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });

cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
