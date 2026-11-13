import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out = new URL('./', import.meta.url).pathname;
const root = '/Users/golo/Work/CodexProjects/immortal-ui/registry/immortal/blocks/';
const consumer = '/tmp/immortal-workflow-edge-actions/consumer/src/components/blocks/';
for (const file of ['data-workflow.tsx', 'data-workflow.css', 'workflow-parts.tsx']) {
  assert.equal(await readFile(root + file, 'utf8'), await readFile(consumer + file, 'utf8'));
}
const b = await chromium.launch({channel:'chrome',headless:true});
const p = await b.newPage({viewport:{width:1280,height:1000}});
p.setDefaultTimeout(7000);
const checks=[],errors=[];
p.on('pageerror', e => errors.push(e.message));
try {
  for (const mode of ['dark','light']) {
    await p.goto(`http://127.0.0.1:4196/?mode=${mode}&scenario=warm`);
    const icon=await p.locator('.wf-identity-icon').evaluate(e=>{const c=getComputedStyle(e);return{width:c.width,height:c.height,radius:c.borderRadius,gradient:c.backgroundImage,shadow:c.boxShadow}});
    assert.equal(icon.width,'40px');assert.equal(icon.height,'40px');assert.equal(icon.radius,'50%');assert.notEqual(icon.gradient,'none');assert.notEqual(icon.shadow,'none');
    await p.getByRole('button',{name:'测试流程',exact:true}).click();
    await p.getByRole('button',{name:'测试流程',exact:true}).waitFor();
    assert.equal(await p.locator('[aria-current="true"][data-run-node]').getAttribute('data-run-node'),'notify');
    await p.locator('[data-run-node="aggregate"]').click();
    assert.equal(JSON.parse(await p.getByLabel('输出数据',{exact:true}).innerText()).value,26);
    await p.getByRole('tab',{name:'输入',exact:true}).click();
    await p.getByRole('tab',{name:'输出',exact:true}).hover();
    assert.equal(await p.getByRole('tab',{name:'输入',exact:true}).getAttribute('aria-selected'),'true');
    assert.equal(await p.getByRole('tab',{name:'输出',exact:true}).getAttribute('aria-selected'),'false');
    assert.equal(await p.locator('.wf-result-data [role="tab"][aria-selected="true"]').count(),1);
    const hover=await p.getByRole('tab',{name:'输出',exact:true}).evaluate(e=>({shadow:getComputedStyle(e).boxShadow,bg:getComputedStyle(e).backgroundImage}));
    assert.equal(hover.shadow,'none');assert.equal(hover.bg,'none');
    await p.locator('.wf-results').screenshot({path:out+`installed-${mode}.png`});
    checks.push({name:`installed ${mode} actual demo run and tabs`,icon,hover});
  }
  await p.goto('http://127.0.0.1:4196/?scenario=failure');
  await p.getByRole('button',{name:'测试流程',exact:true}).click();
  await p.getByRole('button',{name:'测试流程',exact:true}).waitFor();
  assert.equal(await p.locator('[aria-current="true"][data-run-node]').getAttribute('data-run-node'),'weather');
  assert.match(await p.locator('.wf-result-message').innerText(),/HTTP 数据源不可用/);
  checks.push({name:'installed failure selected and detailed',passed:true});
  const touch=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const m=await touch.newPage();await m.goto('http://127.0.0.1:4196/?fixed');
  await m.locator('.wf-results-toggle').tap();
  await m.locator('[data-run-node="aggregate"]').tap();
  await m.getByRole('tab',{name:'输入',exact:true}).tap();
  const heights=await m.locator('.wf-result-data [role="tab"]').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
  assert.ok(heights.every(h=>h>=40));
  assert.deepEqual(JSON.parse(await m.getByLabel('输入数据',{exact:true}).innerText()),[18,20,22]);
  assert.ok(await m.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await m.locator('.wf-results').screenshot({path:out+'installed-touch.png'});
  await touch.close();checks.push({name:'installed touch and width',heights});
  await p.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await p.getByRole('tab',{name:'输入',exact:true}).focus();
  assert.equal(await p.getByRole('tab',{name:'输入',exact:true}).evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  assert.equal(await p.locator('.wf-run-node-list [aria-current="true"]').evaluate(e=>getComputedStyle(e).outlineWidth),'2px');
  await p.locator('.wf-results').screenshot({path:out+'installed-forced-colors.png'});
  checks.push({name:'forced colors and keyboard focus',passed:true});
  assert.deepEqual(errors,[]);
  await writeFile(out+'installed-checks.json',JSON.stringify({checks,errors,exactInstalledFiles:true},null,2));
  console.log({checks:checks.length,errors});
} catch(e){await p.screenshot({path:out+'installed-failure.png'});console.error(e);process.exitCode=1;}finally{await b.close();}
