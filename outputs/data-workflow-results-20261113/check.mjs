import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const out = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1360, height: 1100 } });
page.setDefaultTimeout(7000);
const errors = [], checks = [];
page.on('pageerror', error => errors.push(error.message));
const url = 'http://127.0.0.1:4195/results-check.html';
const detail = page.locator('.wf-result-detail');
async function go(query = '') {
  await page.goto(url + query);
  await page.locator('.wf-header').waitFor();
}
async function select(id, tab = '输出') {
  await page.locator(`[data-run-node="${id}"]`).click();
  const button = detail.getByRole('tab', { name: tab, exact: true });
  if (await button.count()) await button.click();
}
async function payload(label = '输出数据') {
  return JSON.parse(await detail.getByLabel(label, { exact: true }).innerText());
}
async function assertFits() {
  const bounds = await page.evaluate(() => ({
    document: document.documentElement.scrollWidth,
    viewport: innerWidth,
    results: document.querySelector('.wf-results')?.getBoundingClientRect().toJSON(),
    body: document.querySelector('.wf-results-body')?.getBoundingClientRect().toJSON(),
    nav: document.querySelector('.wf-run-navigation')?.getBoundingClientRect().toJSON(),
    detail: document.querySelector('.wf-result-detail')?.getBoundingClientRect().toJSON(),
  }));
  assert.ok(bounds.document <= bounds.viewport + 1, JSON.stringify(bounds));
  if (bounds.detail) {
    assert.ok(bounds.detail.right <= bounds.results.right + 1);
    assert.ok(bounds.detail.left >= bounds.results.left - 1);
    assert.ok(bounds.detail.top >= bounds.body.top);
    assert.ok(bounds.nav.right <= bounds.detail.left + 1 || bounds.nav.bottom <= bounds.detail.top + 1);
  }
  return bounds;
}

try {
  await go();
  assert.equal(await page.locator('.wf-statusbar').count(), 0);
  assert.equal(await page.getByRole('button', { name: '调试', exact: true }).count(), 0);
  assert.equal(await page.locator('.wf-results-toggle').getAttribute('aria-expanded'), 'false');
  const icon = await page.locator('.wf-identity-icon').evaluate(e => {
    const c = getComputedStyle(e), svg = getComputedStyle(e.querySelector('svg'));
    return { width: c.width, height: c.height, radius: c.borderRadius, background: c.backgroundImage, shadow: c.boxShadow, svg: svg.width };
  });
  assert.equal(icon.width, '40px'); assert.equal(icon.height, '40px'); assert.equal(icon.radius, '50%');
  assert.equal(icon.svg, '16px'); assert.notEqual(icon.background, 'none'); assert.notEqual(icon.shadow, 'none');
  await page.locator('.wf-header').screenshot({ path: out + 'header-dark.png' });
  await page.getByRole('button', { name: '配置校验：通过', exact: true }).click();
  await page.getByRole('button', { name: '关闭侧栏', exact: true }).click();
  checks.push({ name: 'header identity and separate validation', icon });

  for (const [scenario, expected, terminal] of [['normal', 20, 'store'], ['warm', 26, 'notify']]) {
    await go(`?scenario=${scenario}`);
    await page.getByRole('button', { name: '测试流程', exact: true }).click();
    await page.getByRole('button', { name: '测试流程', exact: true }).waitFor();
    assert.equal(await page.locator('.wf-results-toggle').getAttribute('aria-expanded'), 'true');
    assert.equal(await page.locator('.wf-run-node-list [aria-current="true"]').getAttribute('data-run-node'), terminal);
    await select('aggregate');
    const value = await payload();
    assert.equal(value.value, expected); assert.equal(value.sampleCount, 3); assert.equal(value.unit, '°C');
    await detail.getByRole('tab', { name: '输入', exact: true }).click();
    assert.ok((await payload('输入数据')).length > 0);
    assert.equal(await page.locator('.wf-inspector').count(), 0);
    await detail.getByRole('button', { name: '查看节点配置', exact: true }).click();
    assert.equal(await page.locator('.wf-inspector').count(), 1);
    await page.getByRole('button', { name: '查看执行数据', exact: true }).click();
    assert.equal(await page.locator('.wf-inspector').count(), 0);
    assert.equal(await detail.locator('.wf-result-heading h4').evaluate(e => e === document.activeElement), true);
    await detail.getByRole('tab', { name: '输出', exact: true }).click();
    await assertFits();
    await page.locator('.wf-results').screenshot({ path: out + `${scenario}-result.png` });
    checks.push({ name: `data-driven ${scenario}`, value, defaultNode: terminal });
  }

  await go('?scenario=failure');
  await page.getByRole('button', { name: '测试流程', exact: true }).click();
  await page.getByRole('button', { name: '测试流程', exact: true }).waitFor();
  assert.equal(await page.locator('[data-run-node="weather"]').getAttribute('aria-current'), 'true');
  assert.match(await detail.innerText(), /HTTP 数据源不可用/);
  await page.locator('.wf-results').screenshot({ path: out + 'failed-result.png' });
  checks.push({ name: 'failed run opens first failure', text: await detail.innerText() });

  await go('?fixed');
  await page.locator('.wf-results-toggle').click();
  assert.match(await page.locator('.wf-results-toggle').innerText(), /总耗时 3.00 s/);
  assert.equal(await page.locator('[data-run-node="weather"]').getAttribute('aria-current'), 'true');
  assert.equal(await payload(), null);
  await page.getByRole('button', { name: '仅看失败节点（2）', exact: true }).click();
  assert.equal(await page.locator('[data-run-node]').count(), 2);
  await page.getByRole('button', { name: '仅看失败节点（2）', exact: true }).click();
  assert.equal(await page.locator('[data-run-node]').count(), 12);
  await select('event'); assert.equal(await payload(), false);
  await detail.getByRole('tab', { name: '输入', exact: true }).click(); assert.equal(await payload('输入数据'), 0);
  assert.match(await detail.innerText(), /尝试 0 次/);
  await select('parallel'); assert.deepEqual(await payload(), []);
  await detail.getByRole('tab', { name: '输入', exact: true }).click(); assert.equal(await payload('输入数据'), '');
  await select('water'); assert.equal((await payload()).value, -5);
  await select('quality'); assert.match(await detail.innerText(), /未提供.*回执.*无法判断是否执行/);
  await select('notify'); assert.match(await detail.innerText(), /已跳过/);
  assert.equal(await detail.getByLabel('输出数据', { exact: true }).innerText(), '未提供');
  for (const [id, status] of [['join', '已取消'], ['condition', '等待中'], ['store', '执行中']]) {
    await select(id); assert.match(await detail.innerText(), new RegExp(status));
  }
  await select('unknown-receipt'); assert.equal(await detail.getByRole('button', { name: '查看节点配置', exact: true }).count(), 0);
  await page.locator('.wf-run-context > summary').click();
  assert.match(await page.locator('.wf-run-context').innerText(), /2026-11-12 23:59:59.000 UTC/);
  assert.match(await page.locator('.wf-run-context').innerText(), /2026-11-13 00:00:02.000 UTC/);
  await page.locator('.wf-run-context > summary').click();
  await select('aggregate'); assert.equal((await payload()).value, 20);
  await page.locator('#replace-receipt').click();
  await select('aggregate'); assert.equal((await payload()).value, 26);
  await page.locator('.wf-results-toggle').focus();
  await page.keyboard.press('Enter'); assert.equal(await page.locator('.wf-results-body').count(), 0);
  await page.keyboard.press('Enter'); await detail.waitFor();
  await detail.getByRole('tab', { name: '输出', exact: true }).focus();
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => document.querySelector('.wf-result-data [data-state="active"][role="tab"]')?.textContent === '输入');
  await page.locator('#change-definition').click();
  assert.equal(await page.locator('[data-run-node]').count(), 0);
  assert.equal(await page.locator('.wf-run-context').count(), 0);
  checks.push({ name: 'all receipt states, raw values, metadata, filter, keyboard, changed input and stale definitions', passed: true });

  await go('?readonly'); assert.equal(await page.locator('.wf-results').count(), 0);
  await go('?readonly&fixed'); assert.equal(await page.locator('.wf-results').count(), 1);
  assert.equal(await page.getByRole('button', { name: '测试流程', exact: true }).count(), 0);
  checks.push({ name: 'optional execution connection and read-only receipt', passed: true });

  for (const option of ['requestFail', 'partialFail']) {
    await go('?' + option); await page.getByRole('button', { name: '测试流程', exact: true }).click();
    await page.locator('.wf-run-message').waitFor();
    assert.match(await page.locator('.wf-run-message').innerText(), /无法取得完整运行结果：执行服务/);
    if (option === 'partialFail') assert.equal(await page.locator('[data-run-node]').count(), 12);
    checks.push({ name: option, passed: true });
  }
  await go('?slow'); await page.getByRole('button', { name: '测试流程', exact: true }).click();
  await page.locator('[data-run-node="event"]').waitFor();
  await page.getByRole('button', { name: '停止等待', exact: true }).click();
  assert.equal(await page.locator('[data-run-node]').count(), 11);
  assert.match(await page.locator('.wf-run-message').innerText(), /最后一次回执.*尚未确认/);
  checks.push({ name: 'cancel preserves last receipt without fabricating cancelled state', passed: true });
  await go('?slow'); await page.getByRole('button', { name: '测试流程', exact: true }).click();
  await page.locator('[data-run-node="event"]').waitFor();
  await select('aggregate');
  await page.waitForFunction(() => document.querySelector('[data-run-node="water"]')?.textContent?.includes('执行中'));
  assert.equal(await page.locator('[data-run-node="aggregate"]').getAttribute('aria-current'), 'true');
  await page.getByRole('button', { name: '停止等待', exact: true }).click();
  checks.push({ name: 'streaming updates preserve explicit selection', passed: true });

  for (const mode of ['dark', 'light']) {
    await page.setViewportSize({ width: 1360, height: 1100 });
    await go(`?fixed&mode=${mode}`); await page.locator('.wf-results-toggle').click();
    await page.locator('.wf-root').screenshot({ path: out + `workspace-${mode}.png` });
    const wide = await assertFits();
    await select('weather', '输入');
    await page.getByRole('button', { name: '仅看失败节点（2）', exact: true }).click();
    await page.getByRole('button', { name: '展开工作区', exact: true }).click();
    await page.locator('dialog[open] .wf-results').waitFor();
    assert.equal(await detail.getByRole('tab', { name: '输入', exact: true }).getAttribute('aria-selected'), 'true');
    assert.equal(await page.getByRole('button', { name: '仅看失败节点（2）', exact: true }).getAttribute('aria-pressed'), 'true');
    await assertFits();
    await page.getByRole('button', { name: '收起工作区', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await go(`?fixed&long&font=20&mode=${mode}`); await page.locator('.wf-results-toggle').click();
    const narrow = await assertFits();
    await select('aggregate');
    await page.locator('.wf-results').screenshot({ path: out + `narrow-${mode}-20px.png` });
    checks.push({ name: `layout ${mode}`, wide, narrow });
  }
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const mobile = await touch.newPage(); await mobile.goto(url + '?fixed');
  await mobile.locator('.wf-results-toggle').tap();
  await mobile.locator('[data-run-node="aggregate"]').tap();
  await mobile.getByRole('tab', { name: '输入', exact: true }).tap();
  const targets = await mobile.locator('.wf-result-data [role="tab"]').evaluateAll(es => es.map(e => e.getBoundingClientRect().height));
  assert.ok(targets.every(h => h >= 40));
  assert.deepEqual(JSON.parse(await mobile.getByLabel('输入数据', { exact: true }).innerText()), [18, 20, 22]);
  await touch.close();
  checks.push({ name: 'touch selection and 40px tabs', targets });
  assert.deepEqual(errors, []);
  await writeFile(out + 'checks.json', JSON.stringify({ checks, errors }, null, 2));
  console.log({ checks: checks.length, errors });
} catch (error) {
  await page.screenshot({ path: out + 'failure.png', fullPage: true });
  console.error(error); process.exitCode = 1;
} finally { await browser.close(); }
