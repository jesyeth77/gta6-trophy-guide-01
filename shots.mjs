// Screenshot script for the Leonida Trophy Guide v2 (run once, by hand):
// serves app/ on :8091, seeds 13 of 55 trophies as earned (v2 storage keys),
// and takes 4 JPEGs of the app's own code at 1280x800 — checklist with a guide
// open, roadmap, missables, and a silver-filtered view. Not part of the app.
import { chromium } from '/home/hatch/workspace/octra/sesi-permanen/node_modules/playwright-core/index.mjs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const EARNED = [
  'Just Like Paradise', 'Paradise Lost', 'T**s Ass Drug Money', 'Trust',
  'Break the Bank', 'Master of None', 'Stick Fiddler', 'Baited My Tackle',
  'Whip It Good', 'A Classic Blitz Play', 'Treat Yo Self', 'On the Spot',
  'Personal Best',
];
const server = spawn(process.execPath, [join(here, 'serve.ts'), '--port', '8091'], { stdio: 'pipe' });
await new Promise((r) => setTimeout(r, 1200));

const browser = await chromium.launch({
  executablePath: '/home/hatch/.cache/ms-playwright/chromium-1187/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const shots = [
  { file: '1-checklist.jpg', url: 'http://127.0.0.1:8091/?spoilers=off#trophy-40' },
  { file: '2-roadmap.jpg', url: 'http://127.0.0.1:8091/?spoilers=off#roadmap' },
  { file: '3-missables.jpg', url: 'http://127.0.0.1:8091/?spoilers=off#missables' },
  { file: '4-silver.jpg', url: 'http://127.0.0.1:8091/?spoilers=off', grade: 'silver' },
];
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.addInitScript((names) => {
    localStorage.setItem('leonida-trophy-guide-v2', JSON.stringify(names));
    localStorage.setItem('leonida-trophy-guide-v2-spoilers', '0');
  }, EARNED);
  await page.goto(s.url, { waitUntil: 'networkidle' });
  if (s.grade) {
    await page.selectOption('#grade', s.grade);
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(here, 'screenshots', s.file), type: 'jpeg', quality: 80 });
  console.log('shot:', s.file);
  await page.close();
}
await browser.close();
server.kill();
console.log('done');
