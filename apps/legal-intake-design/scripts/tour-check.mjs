// Walks the guided tour end to end and reports each stop. Run from
// apps/legal-intake-design with the dev server up:
//
//   node scripts/tour-check.mjs
//
// Writes one screenshot per stop to ../public/screenshots/tour/ and prints
// the popover title at each. A stop that never appears is printed as MISSING.

import { chromium } from '../../../node_modules/.pnpm/playwright@1.57.0/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'http://localhost:3080';
const OUT = resolve('../public/screenshots/tour');
mkdirSync(OUT, { recursive: true });

const env = Object.fromEntries(
  readFileSync('.env.development', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
    }),
);
const password = process.env.PLAYGROUND_PASSWORD ?? env.PLAYGROUND_PASSWORD;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));

await page.goto(`${BASE}/en/client/new`);
const gate = page.locator('input[type="password"]');
if (await gate.count()) {
  await gate.fill(password);
  await page.getByRole('button', { name: /unlock/i }).click();
  await page.waitForURL(/\/en\/client\/new/);
}
await page.waitForLoadState('networkidle');

const tourButton = page.getByRole('button', { name: /tour/i });
if (!(await tourButton.count())) {
  console.log('MISSING: Tour button in the nav');
  await browser.close();
  process.exit(1);
}
await tourButton.first().click();

const seen = [];
for (let i = 0; i < 40; i++) {
  const popover = page.locator('.driver-popover');
  try {
    await popover.waitFor({ state: 'visible', timeout: 12000 });
  } catch {
    console.log(`stop ${i + 1}: MISSING (no popover after 12s) url=${page.url()}`);
    break;
  }
  await page.waitForTimeout(500);
  const title = (await popover.locator('.driver-popover-title').textContent())?.trim();
  const url = new URL(page.url());
  console.log(`stop ${String(i + 1).padStart(2)}: ${title}  [${url.search}]`);
  seen.push(title);
  await page.screenshot({ path: `${OUT}/${String(i + 1).padStart(2, '0')}.png` });

  const next = popover.locator('.driver-popover-next-btn');
  const label = (await next.textContent())?.trim();
  await next.click();
  if (/finish/i.test(label ?? '')) {
    console.log('pressed Finish');
    break;
  }
  // Give a navigation or an in-place rebuild time to settle.
  await page.waitForTimeout(800);
}

console.log(`\n${seen.length} stops seen. Expected 28.`);
await browser.close();
