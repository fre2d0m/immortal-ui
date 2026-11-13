import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';

const output = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1600, height: 1200 }, reducedMotion: 'reduce' });
page.setDefaultTimeout(8000);
const url = 'http://127.0.0.1:4177/#/blocks/data-workflow';
const checks = [], measurements = {}, errors = [];
page.on('pageerror', error => errors.push(error.message));
const button = name => page.getByRole('button', { name, exact: true });
const node = id => page.locator(`.react-flow__node[data-id="${id}"]`);
const summary = id => node(id).locator('.wf-node-summary');
const close = async () => { if (await button('关闭配置').isVisible()) await button('关闭配置').click(); };
const reset = async () => { await button('恢复示例').click(); await node('event').waitFor(); };
const select = async id => { await close(); await node(id).click(); };
const theme = async (mode, fontSize = 14) => {
  await page.evaluate(async ({ mode, fontSize }) => {
    const { applySettings } = await import('/src/lib/theme-storage.ts');
    const { defaultSettings } = await import('/src/lib/theme-settings.ts');
    applySettings({ ...defaultSettings, mode, fontSize });
  }, { mode, fontSize });
};
const geometry = () => page.locator('.wf-node').evaluateAll(nodes => nodes.map(n => ({
  width: n.offsetWidth, height: n.offsetHeight,
  heading: n.querySelector('.wf-node-heading').offsetHeight,
  summary: n.querySelector('.wf-node-summary').offsetHeight,
})));
try {
  await page.goto(url);
  await node('event').waitFor();
  for (const mode of ['dark', 'light']) {
    await theme(mode);
    measurements[mode] = await geometry();
    assert.equal(measurements[mode].length, 11);
    assert.ok(measurements[mode].every(n => n.width === 232 && n.height === 168));
    assert.equal(new Set(measurements[mode].map(n => n.heading)).size, 1);
    assert.equal(new Set(measurements[mode].map(n => n.summary)).size, 1);
    await page.locator('.wf-root').screenshot({ path: output + `overview-${mode}.png` });
  }
  checks.push('11 nodes have the same 232×168 bounds and aligned heading/summary regions in both themes');
  assert.deepEqual(await node('aggregate').locator('dt').allTextContents(), ['指标', '方法', '固定窗口']);
  assert.deepEqual(await node('aggregate').locator('dd').allTextContents(), ['water.temperature', '算术平均', '20 min']);
  assert.match(await summary('condition').innerText(), /输入聚合值\s*≥\s*21/);
  assert.equal(await node('condition').locator('.wf-node-summary').textContent().then(text => text.includes('°C')), false);
  await select('condition');
  await page.getByLabel('比较阈值', { exact: false }).fill('0');
  assert.match(await summary('condition').innerText(), /≥\s*0/);
  await button('撤销').click();
  assert.match(await summary('condition').innerText(), /≥\s*21/);
  await page.getByRole('combobox', { name: /比较方式/ }).selectOption('lt');
  await page.getByLabel('比较阈值', { exact: false }).fill('-5');
  assert.match(await summary('condition').innerText(), /<\s*-5/);
  await page.getByLabel('比较阈值', { exact: false }).fill('');
  assert.match(await summary('condition').innerText(), /未配置/);
  await reset();
  checks.push('Condition summary tracks 0, negative, missing threshold and operator edits; undo restores summary; no guessed unit');
  await select('aggregate');
  await page.getByRole('combobox', { name: /聚合方法/ }).selectOption('max');
  await page.getByLabel('窗口开始', { exact: false }).fill('2026-11-12T00:10:00Z');
  assert.deepEqual(await node('aggregate').locator('dd').allTextContents(), ['water.temperature', '最大值', '10 min']);
  await close();
  await button('测试流程').click();
  await button('停止等待').waitFor({ state: 'hidden' });
  await page.locator('.wf-console').getByRole('button', { name: '水温窗口聚合', exact: true }).click();
  const data = JSON.parse(await page.getByLabel('输出数据', { exact: true }).innerText());
  assert.equal(data.value, 22);
  assert.equal(data.sampleCount, 2);
  assert.equal(data.method, 'max');
  assert.equal(data.inputWindow.from, '2026-11-12T00:10:00.000Z');
  measurements.run = await geometry();
  assert.equal(new Set(measurements.run.map(n => n.height)).size, 1);
  await page.locator('.wf-root').screenshot({ path: output + 'configured-run.png' });
  checks.push('Changed window 00:10–00:20 and max method show 10 min/maximum and produce 22 °C from 2 records; run rows stay separate and all nodes retain equal height');
  await reset();
  const download = page.waitForEvent('download');
  await button('更多流程操作').click();
  await page.getByRole('menuitem', { name: '导出流程 JSON', exact: true }).click();
  const flow = JSON.parse(await readFile(await (await download).path(), 'utf8'));
  flow.nodes.forEach(n => n.parameters.reverse());
  flow.name = '参数顺序验证';
  await page.locator('.wf-root input[type=file]').setInputFiles({ name: 'reordered.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(flow)) });
  await page.getByRole('heading', { name: '参数顺序验证', exact: true }).waitFor();
  assert.deepEqual(await node('aggregate').locator('dd').allTextContents(), ['water.temperature', '算术平均', '20 min']);
  assert.match(await summary('condition').innerText(), /输入聚合值\s*≥\s*21/);
  checks.push('Export/import with every parameter array reversed retains the same summary meaning and ordering');
  flow.nodes.find(n => n.id === 'condition').position.x = 1600;
  flow.edges.push({ id: 'condition-failure', source: 'condition', target: 'failure', port: 'error' });
  await page.locator('.wf-root input[type=file]').setInputFiles({ name: 'ports.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(flow)) });
  await page.waitForFunction(() => document.querySelectorAll('.react-flow__node[data-id=condition] .react-flow__handle-left').length === 4);
  assert.equal(await node('condition').locator('.wf-node').evaluate(el => el.offsetHeight), 168);
  const offsets = await node('condition').locator('.react-flow__handle-left').evaluateAll(els => els.map(el => parseFloat(getComputedStyle(el).top)).sort((a,b) => a-b));
  assert.ok(offsets.slice(1).every((value, i) => value-offsets[i] === 42));
  await reset();
  checks.push('Four ports on one side keep 42px separation and the same node height');
  const longName = '跨流域生态环境观测与人工复核分发节点'.repeat(5), longTarget = 'environment-observations-'.repeat(10);
  await select('store');
  await page.getByLabel('节点名称', { exact: true }).fill(longName);
  await page.getByLabel('目标引用', { exact: false }).fill(longTarget);
  assert.ok((await node('store').getAttribute('aria-label')).includes(longTarget));
  assert.equal(await page.getByLabel('目标引用', { exact: false }).inputValue(), longTarget);
  assert.ok(await node('store').locator('dd').evaluate(el => el.scrollWidth > el.clientWidth));
  await close();
  for (const mode of ['dark', 'light']) {
    await page.setViewportSize({ width: 320, height: 900 });
    await theme(mode, 20);
    measurements[`narrow-${mode}`] = await geometry();
    assert.equal(new Set(measurements[`narrow-${mode}`].map(n => n.height)).size, 1);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
    await button('流程大纲').focus();
    await page.keyboard.press('Enter');
    await page.locator('.wf-node-list').getByRole('button', { name: new RegExp(longName) }).focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.getByLabel('目标引用', { exact: false }).inputValue(), longTarget);
    await page.locator('.wf-inspector').scrollIntoViewIfNeeded();
    await page.screenshot({ path: output + `narrow-${mode}.png` });
    await close();
  }
  checks.push('Long labels/targets, 20px font and 320px viewport: equal node heights, no document overflow; keyboard outline opens complete untruncated configuration');
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await touch.newPage();
  await mobile.goto(url);
  await mobile.locator('.wf-node').first().waitFor();
  await mobile.getByRole('button', { name: '流程大纲', exact: true }).tap();
  await mobile.locator('.wf-node-list').getByRole('button', { name: /北岸水温观测/ }).tap();
  assert.equal(await mobile.getByLabel('连接引用', { exact: false }).inputValue(), 'north-bank-mqtt');
  await touch.close();
  checks.push('Touch outline provides access to the full connection value');
  assert.deepEqual(errors, []);
  await writeFile(output + 'checks.json', JSON.stringify({ browser: browser.version(), checks, measurements, errors }, null, 2));
  console.log(JSON.stringify({ checks, errors }, null, 2));
} catch (error) {
  await page.screenshot({ path: output + 'failure.png', fullPage: true });
  throw error;
} finally {
  await browser.close();
}
