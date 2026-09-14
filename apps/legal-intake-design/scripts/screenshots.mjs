// One-off: capture the screenshots referenced by NOTE.md, TOUR.md and
// APPENDIX.md. Run from apps/legal-intake-design with the dev server up on
// 3080:
//
//   node scripts/screenshots.mjs
//
// Reads PLAYGROUND_PASSWORD from .env.development to pass the gate. Writes
// PNGs to ../../docs/screenshots/. Reduced motion is on so every frame is a
// settled state, not mid-animation.

// playwright is in the pnpm store as a transitive dependency, not linked here.
import { chromium } from '../../../node_modules/.pnpm/playwright@1.57.0/node_modules/playwright/index.mjs';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const BASE = 'http://localhost:3080';
const OUT = resolve('../../docs/screenshots');
mkdirSync(OUT, { recursive: true });

const env = Object.fromEntries(
  readFileSync('.env.development', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [
        l.slice(0, i).trim(),
        l
          .slice(i + 1)
          .trim()
          .replace(/^"|"$/g, ''),
      ];
    }),
);
const password = process.env.PLAYGROUND_PASSWORD ?? env.PLAYGROUND_PASSWORD;
if (!password) throw new Error('PLAYGROUND_PASSWORD not found');

const shots = [
  // file, path, viewport, action after load
  ['01-home', '/en/client/new', 'desktop'],
  ['02-describe', '/en/client/new?demo=1', 'desktop'],
  ['03-confirm', '/en/client/new?demo=1', 'desktop', 'clip-brief'],
  ['04-review', '/en/client/new?demo=review', 'desktop'],
  ['05-sent', '/en/client/new?demo=sent', 'tall'],
  ['06-phone-sent', '/en/client/new?demo=sent', 'phone'],
  ['a1-start', '/en/client/new', 'desktop'],
  ['a2-describe', '/en/client/new?demo=1', 'desktop'],
  ['a3-upload', '/en/client/new?demo=1', 'desktop', 'drag-overlay'],
  ['a4-progress', '/en/client/new?demo=review', 'desktop'],
  ['a5-sent', '/en/client/new?demo=sent', 'tall'],
  ['a6-after', '/en/client/new?demo=quote', 'desktop'],
  // Feature close-ups
  ['f1-document-panel', '/en/client/new?demo=1', 'desktop', 'open-document'],
  ['f2-rail-open', '/en/client/new?demo=sent', 'desktop', 'clip-rail'],
  ['f3-sending-wait', '/en/client/new?demo=review', 'desktop', 'press-send'],
  ['f4-email', '/en/client/new?demo=sent', 'desktop', 'open-email'],
  ['f5-talk-to-a-person', '/en/client/new?demo=1', 'desktop', 'open-talk'],
  ['f6-seems-high', '/en/client/new?demo=quote', 'desktop', 'seems-high'],
  ['f7-no-quote', '/en/client/new?demo=noquote', 'desktop'],
  ['f8-phone-rail', '/en/client/new?demo=sent', 'phone', 'open-phone-rail'],
];

// Click helpers that must not abort the run if a selector has moved.
async function tryClick(page, locators, settle = 800) {
  for (const make of locators) {
    const loc = make();
    if ((await loc.count()) > 0) {
      await loc.first().click();
      await page.waitForTimeout(settle);
      return true;
    }
  }
  console.warn('  (no target found; capturing as-is)');
  return false;
}

const viewports = {
  desktop: { width: 1440, height: 900 },
  tall: { width: 1440, height: 2400 },
  phone: { width: 375, height: 812 },
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: viewports.desktop,
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
});
const page = await context.newPage();

// Pass the gate once; the cookie lives on the context.
await page.goto(`${BASE}/en/client/new`);
const gate = page.locator('input[type="password"]');
if (await gate.count()) {
  await gate.fill(password);
  await page.getByRole('button', { name: /unlock/i }).click();
  await page.waitForURL(/\/en\/client\/new/);
  await page.waitForLoadState('networkidle');
}

for (const [file, path, vp, action] of shots) {
  await page.setViewportSize(viewports[vp]);
  // Each demo link clears the previous demo's session on its own.
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  if (action === 'drag-overlay') {
    // Fire a dragenter with a file so the drop overlay renders.
    await page.evaluate(() => {
      const dt = new DataTransfer();
      dt.items.add(
        new File(['x'], 'contract.pdf', { type: 'application/pdf' }),
      );
      window.dispatchEvent(
        new DragEvent('dragenter', { bubbles: true, dataTransfer: dt }),
      );
      document.body.dispatchEvent(
        new DragEvent('dragover', { bubbles: true, dataTransfer: dt }),
      );
    });
    await page.waitForTimeout(400);
  }

  if (action === 'open-document') {
    // The source link under a document-read value opens the PDF at the passage.
    await tryClick(
      page,
      [
        () => page.getByRole('link', { name: /read from/i }),
        () => page.getByText(/read from .*\.pdf/i),
        () => page.getByRole('button', { name: /documents?/i }),
      ],
      2500,
    );
  }
  if (action === 'press-send') {
    await tryClick(
      page,
      [() => page.getByRole('button', { name: /send to moritz/i })],
      3500,
    );
  }
  if (action === 'open-email') {
    await tryClick(page, [
      () => page.getByRole('button', { name: /read it/i }),
      () => page.getByText(/^read it$/i),
    ]);
  }
  if (action === 'open-talk') {
    await tryClick(page, [
      () => page.getByRole('button', { name: /talk to a person/i }),
      () => page.getByText(/talk to a person/i),
    ]);
  }
  if (action === 'seems-high') {
    await tryClick(page, [
      () => page.getByRole('button', { name: /this seems high/i }),
    ]);
  }
  if (action === 'open-phone-rail') {
    await tryClick(page, [
      () =>
        page.getByRole('button', {
          name: /brief|quote|where your case is|steps/i,
        }),
      () => page.locator('[aria-controls][aria-expanded="false"]'),
    ]);
  }

  if (action === 'clip-rail') {
    await page.screenshot({
      path: `${OUT}/${file}.png`,
      clip: { x: 0, y: 90, width: 300, height: 620 },
    });
  } else if (action === 'clip-brief') {
    // The brief rows on the right: a confirmed value, a sourced one, an unsure one.
    await page.screenshot({
      path: `${OUT}/${file}.png`,
      clip: { x: 900, y: 170, width: 540, height: 480 },
    });
  } else {
    await page.screenshot({ path: `${OUT}/${file}.png`, fullPage: false });
  }
  console.log('wrote', file);
}

await browser.close();
