import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const base = new URL(process.env.CRYSTAL_FORGE_URL || 'http://127.0.0.1:4321/');
if (!base.pathname.endsWith('/')) base.pathname += '/';
const demoUrl = new URL('svg-import/demo/', base);
const evidence = process.env.SVG_IMPORT_QA_DIR;
if (evidence) await mkdir(evidence, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CRYSTAL_FORGE_BROWSER_EXECUTABLE || undefined,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1360, height: 900 }, acceptDownloads: true });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => {
  if (message.type() === 'error' && message.text().includes('THREE.')) errors.push(message.text());
});
const field = id => page.locator(`#${id}`);
const button = name => page.getByRole('button', { name, exact: true });
const upload = (name, payload) => field('file').setInputFiles({
  name, mimeType: 'image/svg+xml', buffer: Buffer.from(payload),
});

async function selectSample(name) {
  await field('sample').selectOption(name);
  await page.waitForFunction(
    name => document.querySelector('#source-name').textContent.startsWith(name),
    name,
  );
}
async function validated() {
  await field('report').waitFor({ state: 'visible', timeout: 35_000 }).catch(async error => {
    throw new Error(`Missing validation report: ${await field('status').textContent()} ${await field('error').textContent()}`, { cause: error });
  });
  assert.equal(await field('parts').textContent(), '1');
  assert.ok(Number((await field('triangles').textContent()).replace(/\D/g, '')) > 0);
  assert.equal(await field('stl').isEnabled(), true);
  assert.equal(await field('threemf').isEnabled(), true);
}
async function download(id) {
  const [result] = await Promise.all([page.waitForEvent('download'), field(id).click()]);
  const stream = await result.createReadStream();
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return { name: result.suggestedFilename(), bytes: Buffer.concat(chunks) };
}
async function capture(name) {
  if (evidence) await page.screenshot({ path: join(evidence, name), fullPage: true });
}

try {
  await page.goto(demoUrl.href);
  await page.getByRole('heading', { name: 'SVG import', exact: true }).waitFor();
  await page.getByText('clockwork.svg', { exact: true }).waitFor();
  assert.match(await field('contour-count').textContent(), /1 outer contour · 5 holes/);
  assert.equal(await field('stl').isDisabled(), true);
  const canvas = page.getByRole('img', { name: '3D extrusion preview' });
  const iso = await canvas.screenshot();
  await button('Top').focus();
  await page.keyboard.press('Enter');
  const top = await canvas.screenshot();
  assert.notDeepEqual(top, iso);
  await button('Underside').focus();
  await page.keyboard.press('Space');
  assert.notDeepEqual(await canvas.screenshot(), top);
  await button('Reset view').focus();
  await page.keyboard.press('Enter');
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 95, box.y + box.height / 2 - 25, { steps: 6 });
  await page.mouse.up();
  assert.notDeepEqual(await canvas.screenshot(), iso);
  await button('Reset view').click();

  await field('validate').click();
  await validated();
  await page.getByText('Validated Manifold mesh', { exact: true }).waitFor();
  assert.notDeepEqual(await canvas.screenshot(), iso);
  await capture('svg-import-demo-desktop.png');
  await button('Top').press('Enter');
  const checkedTop = await canvas.screenshot();
  await capture('svg-import-demo-checked-top.png');
  await button('Underside').press('Space');
  assert.notDeepEqual(await canvas.screenshot(), checkedTop);
  await capture('svg-import-demo-checked-underside.png');
  await button('Reset view').click();
  const stl = await download('stl');
  assert.equal(stl.name, 'clockwork-primary.stl');
  assert.ok(stl.bytes.length > 84);
  assert.equal(84 + 50 * stl.bytes.readUInt32LE(80), stl.bytes.length);
  assert.equal(stl.bytes.readUInt32LE(80), Number((await field('triangles').textContent()).replace(/\D/g, '')));
  const threemf = await download('threemf');
  assert.equal(threemf.name, 'clockwork.3mf');
  assert.equal(threemf.bytes.readUInt32LE(0), 0x04034b50);
  assert.ok(threemf.bytes.includes(Buffer.from('3D/3dmodel.model')));

  const contour = await field('contours').locator('path').getAttribute('d');
  await upload('unsupported.svg', '<svg xmlns="http://www.w3.org/2000/svg"><text x="0" y="12">Text</text></svg>');
  await page.getByRole('alert').waitFor();
  assert.match(await field('error').textContent(), /unsupported\.svg.+previous model/i);
  assert.equal(await field('contours').locator('path').getAttribute('d'), contour);
  await validated();
  assert.equal(await field('geometry-state').textContent(), 'Validated Manifold mesh');
  await capture('svg-import-demo-rejection.png');

  for (const sample of ['circle.svg', 'nested.svg', 'curves.svg', 'rectangle.svg']) {
    await selectSample(sample);
    assert.equal(await field('stl').isDisabled(), true);
    assert.equal(await field('geometry-state').textContent(), 'Unvalidated preview');
  }
  assert.equal(await field('height').getAttribute('readonly'), '');
  const previousHeight = await field('height').inputValue();
  await field('width').fill('80');
  assert.notEqual(await field('height').inputValue(), previousHeight);
  await field('lock').uncheck();
  await field('height').fill('21');
  await field('depth').fill('7');
  await field('rotation').fill('90');
  await field('validate').click();
  await validated();
  assert.match(await field('extents').textContent(), /^21 × 80 × 7 mm$/);
  await field('depth').fill('0');
  await page.getByRole('alert').waitFor();
  assert.equal(await field('validate').isDisabled(), true);
  assert.equal(await field('threemf').isDisabled(), true);
  await field('depth').fill('8');
  assert.equal(await field('report').isHidden(), true);
  assert.equal(await field('threemf').isDisabled(), true);
  assert.equal(await field('geometry-state').textContent(), 'Unvalidated preview');

  const workerUrl = '**/svg-import/demo/validation-worker.js';
  await page.route(workerUrl, route => route.fulfill({
    contentType: 'text/javascript',
    body: `self.onmessage = () => self.postMessage({type:'progress',text:'Waiting for test validation…'});`,
  }));
  await field('validate').click();
  await page.getByText('Waiting for test validation…').waitFor();
  await button('Cancel validation').press('Enter');
  assert.match(await field('status').textContent(), /canceled/i);
  assert.equal(await field('stl').isDisabled(), true);
  assert.equal(await field('geometry-state').textContent(), 'Unvalidated preview');
  await page.clock.install();
  await field('validate').click();
  await page.getByText('Waiting for test validation…').waitFor();
  await page.clock.fastForward(30_001);
  await page.getByRole('alert').waitFor();
  assert.match(await field('error').textContent(), /timed out/i);
  assert.equal(await field('stl').isDisabled(), true);
  await page.unroute(workerUrl);
  await field('validate').click();
  await validated();

  await upload('local.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20"/></svg>');
  await page.getByText('local.svg', { exact: true }).waitFor();
  assert.equal(await field('sample').inputValue(), '');
  assert.equal(await field('stl').isDisabled(), true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await page.getByText('clockwork.svg', { exact: true }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await capture('svg-import-demo-mobile.png');
  assert.deepEqual(errors, []);
  console.log('SVG import browser checks passed.');
} finally {
  await browser.close();
}
