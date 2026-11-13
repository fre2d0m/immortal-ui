import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';

const out=new URL('./',import.meta.url).pathname;
const base='http://127.0.0.1:4196/english-check.html';
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[],warnings=[];
const context=await browser.newContext({viewport:{width:1360,height:1100},deviceScaleFactor:2});
const page=await context.newPage();
page.setDefaultTimeout(8000);
page.on('pageerror',e=>errors.push(e.message));
page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')warnings.push(m.text());});
const button=(name,p=page)=>p.getByRole('button',{name,exact:true});
async function english(p=page) {
  const content=await p.locator('.wf-root').evaluate(e=>[e.innerText,...[...e.querySelectorAll('*')].flatMap(el=>['aria-label','title','placeholder'].map(a=>el.getAttribute(a)||'')),...[...e.querySelectorAll('input,textarea')].map(el=>el.value)].join('\n'));
  assert.equal(/\p{Script=Han}/u.test(content),false,content);
}
async function chrome(p=page) {
  const result=await p.locator('.wf-icon-toolbar').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return {label:e.getAttribute('aria-label'),border:s.borderWidth,bg:s.backgroundColor,children:[...e.querySelectorAll(':scope > button')].map(b=>{const r=b.getBoundingClientRect();return{w:r.width,h:r.height,radius:getComputedStyle(b).borderRadius};})};}));
  assert.equal(result.find(t=>t.label==='Workflow actions').border,'0px');
  assert.equal(result.find(t=>t.label==='Edit history').border,'0px');
  assert.equal(result.find(t=>t.label==='Canvas view').border,'1px');
  for(const toolbar of result)for(const b of toolbar.children){assert.equal(b.radius,'50%');assert.ok(Math.abs(b.w-b.h)<.2);}
  return result;
}
async function closeInspector(p=page){const close=button('Close configuration',p);if(await close.count())await close.click();}
async function start(p=page){await button('Test workflow',p).click();await p.locator('.wf-results-summary [data-status="succeeded"],.wf-results-summary [data-status="failed"]').waitFor();}
try {
  for(const mode of ['dark','light']) {
    await page.goto(base+'?mode='+mode);
    await page.locator('.react-flow__node[data-id="water"]').waitFor();
    await english();
    const toolbars=await chrome();
    const validation=page.locator('[data-workflow-status="validation"]');
    assert.equal(await validation.evaluate(e=>e.tagName),'SPAN');
    assert.equal(await validation.getAttribute('aria-expanded'),null);
    assert.equal(await validation.getAttribute('data-state'),'valid');
    const before=await page.locator('.wf-canvas').boundingBox();
    await validation.click();await page.mouse.move(0,0);await page.keyboard.press('Escape');
    assert.equal(await page.locator('.wf-drawer').count(),0);
    assert.deepEqual(await page.locator('.wf-canvas').boundingBox(),before);
    await validation.hover();await page.getByRole('tooltip').waitFor();
    assert.match(await page.getByRole('tooltip').innerText(),/Validation: Passed/);
    await page.keyboard.press('Escape');await page.mouse.move(0,0);await button('Save draft').focus();await validation.focus();await page.getByRole('tooltip').waitFor();await page.keyboard.press('Escape');
    await page.locator('#one-issue').click();
    assert.equal(await validation.getAttribute('data-state'),'warning');assert.equal((await validation.innerText()).trim(),'1');
    await startInvalid();
    await page.locator('#two-issues').click();
    assert.equal(await validation.getAttribute('data-state'),'invalid');assert.equal((await validation.innerText()).trim(),'2');
    await english();await closeInspector();await validation.click();assert.equal(await page.locator('.wf-drawer').count(),0);
    await page.locator('#fix').click();
    await page.getByLabel('Provide run',{exact:true}).uncheck();await chrome();
    await page.getByLabel('Provide save',{exact:true}).uncheck();await chrome();
    assert.equal(await page.locator('.wf-actions > button').count(),2);
    await button('More workflow actions').focus();await page.keyboard.press('ArrowRight');await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Expand workspace');
    await page.getByLabel('Provide run',{exact:true}).check();await page.getByLabel('Provide save',{exact:true}).check();
    await page.locator('.react-flow__node[data-id="water"]').click();
    await page.getByRole('textbox',{name:'Node name',exact:true}).fill('North bank temperature review');
    await button('Undo').click();assert.equal(await page.getByRole('textbox',{name:'Node name',exact:true}).inputValue(),'North bank temperature');
    await button('Redo').click();assert.equal(await page.getByRole('textbox',{name:'Node name',exact:true}).inputValue(),'North bank temperature review');
    await page.getByText('Execution policy',{exact:true}).click();await page.getByText('Node definition',{exact:true}).click();await english();
    await page.locator('.wf-inspector').screenshot({path:out+`configuration-${mode}.png`});await closeInspector();
    await page.locator('#fix').click();
    await button('More workflow actions').click();await english();await page.getByRole('menuitem',{name:'Workflow settings',exact:true}).click();
    assert.match(await page.getByRole('textbox',{name:'Workflow name',exact:true}).inputValue(),/Watershed/);await english();await closeInspector();
    await button('Expand workspace').click();await page.getByRole('dialog').waitFor();await english();await chrome();await button('Collapse workspace').click();
    await button('Fit workflow').click();await page.mouse.move(0,0);await page.keyboard.press('Escape');await page.locator('.wf-root').screenshot({path:out+`workflow-${mode}.png`});
    checks.push({name:mode+' read-only validation, restored header, keyboard, edit history, forms and expanded workspace',toolbars});
  }
  for(const scenario of ['normal','warm','missing','failure']) {
    await page.goto(base+'?scenario='+scenario);await start();await english();
    if(scenario==='failure') {
      assert.equal(await page.locator('[aria-current="true"][data-run-node]').getAttribute('data-run-node'),'weather');
      assert.match(await page.locator('.wf-result-message').innerText(),/Demo HTTP source unavailable/);
      await button('Failed nodes only (2)').click();
      assert.ok(await page.locator('[data-run-node]').count()>=1);
    } else {
      await page.locator('[data-run-node="aggregate"]').click();
      const aggregate=JSON.parse(await page.getByLabel('Output data',{exact:true}).innerText());
      assert.equal(aggregate.value,scenario==='warm'?26:20);
      await page.getByRole('tab',{name:'Input',exact:true}).click();await page.getByRole('tab',{name:'Output',exact:true}).hover();
      assert.equal(await page.locator('.wf-result-data [role="tab"][aria-selected="true"]').count(),1);
      assert.equal(await page.getByRole('tab',{name:'Input',exact:true}).getAttribute('aria-selected'),'true');
      await page.getByRole('tab',{name:'Execution info',exact:true}).click();await english();
    }
    await page.locator('.wf-results').screenshot({path:out+`results-${scenario}.png`});
    checks.push({name:'English run results with '+scenario+' inputs',passed:true});
  }
  await page.goto(base);
  await page.locator('.react-flow__node[data-id="water"]').click({button:'right'});await page.getByRole('menuitem',{name:'Configure node',exact:true}).waitFor();await english();await page.keyboard.press('Escape');
  await page.locator('[data-edge-insert]').first().click();await page.locator('.wf-step-picker').waitFor();await english();await page.locator('.wf-step-picker').screenshot({path:out+'insert-picker.png'});await page.keyboard.press('Escape');
  await page.locator('.react-flow__node[data-id="water"] .wf-endpoint-button').first().click();await page.getByRole('tab',{name:'Connect existing',exact:true}).waitFor();await english();await page.getByRole('tab',{name:'Connect existing',exact:true}).click();await english();await page.keyboard.press('Escape');
  await page.locator('#empty').click();await page.locator('.wf-start-node').click();await english();await page.getByRole('button',{name:/Manual trigger/}).click();assert.equal(await page.locator('.react-flow__node').count(),1);await english();await closeInspector();
  await page.locator('input[type="file"]').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{ broken')});
  await page.locator('.wf-notice:not(:empty)').waitFor();await english();
  checks.push({name:'Node context menu, edge insertion, compatible candidates, empty trigger and import error',passed:true});
  const touch=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  const phone=await touch.newPage();phone.setDefaultTimeout(8000);phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(base+'?font=20&long');await phone.locator('.wf-root').waitFor();
  assert.equal(await phone.evaluate(()=>matchMedia('(pointer:coarse)').matches),true);
  const mobileToolbars=await chrome(phone);
  assert.ok(mobileToolbars.every(t=>t.children.every(b=>b.w>=40&&b.h>=40)));
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await phone.locator('[data-workflow-status="validation"]').tap();assert.equal(await phone.locator('.wf-drawer').count(),0);
  await button('More workflow actions',phone).tap();await english(phone);await phone.screenshot({path:out+'touch-menu.png',fullPage:true});await phone.keyboard.press('Escape');
  await phone.locator('#empty').click();await phone.locator('.wf-start-node').tap();await english(phone);
  const picker=await phone.locator('.wf-step-picker').boundingBox();assert.ok(picker.x>=0&&picker.x+picker.width<=390&&picker.y>=0&&picker.y+picker.height<=844);
  await phone.screenshot({path:out+'touch-trigger.png',fullPage:true});await phone.keyboard.press('Escape');
  await phone.locator('#fix').click();await start(phone);await phone.locator('[data-run-node="water"]').tap();await english(phone);
  assert.ok(await phone.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await phone.screenshot({path:out+'touch-results.png',fullPage:true});await touch.close();
  checks.push({name:'390px touch, 20px font, long name, compact menus and results',mobileToolbars,picker});
  await legacyDraft();
  assert.deepEqual(errors,[]);
  await writeFile(out+'checks.json',JSON.stringify({checks,errors,warnings},null,2));
  console.log(JSON.stringify({groups:checks.length,errors,warnings}));
} catch(error) {
  await page.screenshot({path:out+'failure.png',fullPage:true});
  await writeFile(out+'failure.txt',String(error)+'\n'+JSON.stringify({checks,errors,warnings},null,2));
  console.error(error);process.exitCode=1;
} finally {await browser.close();}

async function startInvalid() {
  await button('Test workflow').click();await page.locator('.wf-inspector').waitFor();
  assert.equal((await page.locator('#host-run-count').innerText()).trim(),'0');
  assert.match(await page.locator('.wf-notice').innerText(),/Cannot test: 1 configuration issue/);
  assert.equal(await page.locator('.wf-left').count(),0);await english();
}
async function legacyDraft() {
  const original=JSON.parse(await readFile('/tmp/workflow-demo-before.json','utf8')).workflow;
  const legacyContext=await browser.newContext({viewport:{width:1440,height:1100}});
  await legacyContext.addInitScript(flow=>localStorage.setItem('immortal-workflow-demo-draft-v2',JSON.stringify(flow)),original);
  const p=await legacyContext.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4177/#/blocks/data-workflow');await p.locator('.wf-root').waitFor();await english(p);await chrome(p);
  assert.match(await p.locator('.wf-identity h3').innerText(),/Watershed monitoring/);
  await button('Save draft',p).click();await button('Save draft (saved)',p).waitFor();
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('immortal-workflow-demo-draft-v2')));
  assert.deepEqual(saved.edges,original.edges);
  assert.deepEqual(saved.nodes.map(n=>[n.id,n.position]),original.nodes.map(n=>[n.id,n.position]));
  await p.locator('.wf-root').screenshot({path:out+'showcase-migrated-draft.png'});
  await p.getByRole('combobox',{name:'Demo input scenario',exact:true}).selectOption('warm');await start(p);await p.locator('[data-run-node="aggregate"]').click();
  assert.equal(JSON.parse(await p.getByLabel('Output data',{exact:true}).innerText()).value,26);await english(p);
  await legacyContext.close();checks.push({name:'Actual showcase: legacy labels migrated, topology preserved, warmer input computes 26 C',passed:true});
}
