import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const out=new URL('./',import.meta.url).pathname;
const b=await chromium.launch({channel:'chrome',headless:true});
const checks=[],errors=[],warnings=[];
function observe(p){p.setDefaultTimeout(7000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(['error','warning'].includes(m.type()))warnings.push(m.text());});}
function status(p,name){return p.locator(`[data-workflow-status="${name}"]`);}
const base='http://127.0.0.1:4196/header-status-check.html';
let page;
try {
  for(const mode of ['dark','light']) {
    const c=await b.newContext({viewport:{width:1360,height:1000},deviceScaleFactor:2});page=await c.newPage();observe(page);
    await page.goto(base+'?mode='+mode);await page.locator('.wf-header-states').waitFor();
    assert.deepEqual(await page.locator('.wf-header-state-value').allTextContents(),['Draft','11 nodes','0 issues']);
    const metrics=await page.locator('.wf-header-state').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),svg=e.querySelector('svg'),is=getComputedStyle(svg),r=e.getBoundingClientRect();return {tag:e.tagName,cursor:s.cursor,bg:s.backgroundColor,shadow:s.boxShadow,h:r.height,y:r.y,font:s.fontSize,gap:s.gap,color:s.color,icon:{w:is.width,h:is.height,stroke:is.strokeWidth},expanded:e.getAttribute('aria-expanded'),tab:e.tabIndex};}));
    assert.equal(new Set(metrics.map(m=>m.h+':'+m.y+':'+m.font+':'+m.gap)).size,1);
    for(const m of metrics){assert.equal(m.tag,'SPAN');assert.equal(m.cursor,'default');assert.equal(m.bg,'rgba(0, 0, 0, 0)');assert.equal(m.shadow,'none');assert.equal(m.expanded,null);assert.equal(m.tab,0);assert.deepEqual(m.icon,{w:'14px',h:'14px',stroke:'1.75px'});}
    for(const name of ['publication','nodes','validation']) {
      const el=status(page,name);await page.mouse.move(0,0);await page.getByRole('button',{name:'Save draft',exact:true}).focus();await page.keyboard.press('Escape');await page.getByRole('tooltip').waitFor({state:'hidden'});await el.hover();await page.waitForFunction(label=>[...document.querySelectorAll('[role=tooltip]')].some(e=>e.textContent===label),await el.getAttribute('aria-label'));
      assert.equal(await page.getByRole('tooltip').innerText(),await el.getAttribute('aria-label'));
      await page.getByRole('tooltip').hover();assert.ok(await page.getByRole('tooltip').isVisible());await page.keyboard.press('Escape');await page.getByRole('tooltip').waitFor({state:'hidden'});
      await page.getByRole('button',{name:'Save draft',exact:true}).focus();await el.focus();await page.getByRole('tooltip').waitFor();
      assert.equal(await el.evaluate(e=>getComputedStyle(e).outlineStyle),'solid');await page.keyboard.press('Escape');
      await el.click();await page.keyboard.press('Enter');assert.equal(await page.locator('.wf-drawer,[role="menu"],[role="dialog"]').count(),0);
      assert.equal(await page.locator('.wf-results-toggle').getAttribute('aria-expanded'),'false');
      const feedback=await el.evaluate(e=>({bg:getComputedStyle(e).backgroundColor,transform:getComputedStyle(e).transform}));assert.equal(feedback.bg,'rgba(0, 0, 0, 0)');assert.equal(feedback.transform,'none');
    }
    await page.mouse.move(0,0);await page.keyboard.press('Escape');await page.locator('.wf-header').screenshot({path:out+`header-${mode}.png`});
    await page.locator('#publish').click();assert.equal((await status(page,'publication').innerText()).trim(),'Published');assert.equal(await status(page,'publication').getAttribute('data-state'),'published');
    await page.locator('#edit').click();assert.equal((await status(page,'publication').innerText()).trim(),'Unpublished changes');
    await page.locator('#unknown').click();assert.equal((await status(page,'publication').innerText()).trim(),'Unknown');
    await page.locator('#draft').click();assert.equal((await status(page,'publication').innerText()).trim(),'Draft');
    await page.locator('#one-issue').click();assert.equal((await status(page,'validation').innerText()).trim(),'1 issue');assert.equal(await status(page,'validation').getAttribute('data-state'),'warning');
    await page.locator('#two-issues').click();assert.equal((await status(page,'validation').innerText()).trim(),'2 issues');assert.equal(await status(page,'validation').getAttribute('data-state'),'invalid');
    await status(page,'validation').hover();await page.getByRole('tooltip').waitFor();assert.match(await page.getByRole('tooltip').innerText(),/Connection reference/);await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Test workflow',exact:true}).click();assert.match(await page.locator('.wf-notice').innerText(),/Cannot test/);assert.equal(await page.locator('#host-run-count').innerText(),'0');
    await page.getByRole('button',{name:'Close configuration',exact:true}).click();await page.locator('#fix').click();
    await page.getByRole('button',{name:'Test workflow',exact:true}).click();await page.locator('.wf-results-summary [data-status="succeeded"]').waitFor();
    await page.locator('[data-run-node="aggregate"]').click();assert.equal(JSON.parse(await page.getByLabel('Output data',{exact:true}).innerText()).value,20);
    await page.locator('#single').click();assert.equal((await status(page,'nodes').innerText()).trim(),'1 node');
    await page.locator('#empty').click();assert.equal((await status(page,'nodes').innerText()).trim(),'0 nodes');
    checks.push({name:mode+' shared metric geometry, hover/focus/click semantics, live states and 20 C execution',metrics});await c.close();
  }
  const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});page=await c.newPage();observe(page);await page.goto(base+'?font=20');await page.locator('.wf-header-states').waitFor();
  const session=await c.newCDPSession(page);
  for(const name of ['publication','nodes','validation']) {
    const el=status(page,name);await el.scrollIntoViewIfNeeded();const r=await el.boundingBox();assert.ok(r.height>=40&&r.width>=40);
    await el.tap();assert.equal(await page.locator('.wf-drawer').count(),0);assert.equal(await page.getByRole('tooltip').count(),0);
    await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2}]});
    await page.getByRole('tooltip').waitFor();await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.equal(await page.getByRole('tooltip').innerText(),await el.getAttribute('aria-label'));assert.equal(await page.locator('.wf-drawer').count(),0);
    await page.locator('.wf-identity h3').tap();await page.getByRole('tooltip').waitFor({state:'hidden'});
  }
  // A scroll gesture cancels the pending long-press hint.
  const r=await status(page,'nodes').boundingBox();
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+8,y:r.y+8}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+30,y:r.y+25}]});
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(500);assert.equal(await page.getByRole('tooltip').count(),0);
  await page.locator('#publish').click();await page.locator('#edit').click();await page.locator('.wf-header').scrollIntoViewIfNeeded();
  assert.equal((await status(page,'publication').innerText()).trim(),'Unpublished changes');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  const boxes=await page.locator('.wf-header-state').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};}));
  for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y);}
  await page.locator('.wf-header').screenshot({path:out+'header-touch-20px.png'});checks.push({name:'390px touch with 20px text, shared long-press hints, inert tap, cancelled scroll and long publication value',boxes});await c.close();
  const source='/Users/golo/Work/CodexProjects/immortal-ui/registry/immortal/blocks/',installed='/tmp/immortal-workflow-edge-actions/consumer/src/components/blocks/';
  for(const f of ['data-workflow.tsx','data-workflow.css','workflow-parts.tsx'])assert.ok(await readFile(source+f,'utf8')===await readFile(installed+f,'utf8'),f);
  assert.deepEqual(errors,[]);await writeFile(out+'checks.json',JSON.stringify({checks,errors,warnings,installedParity:true},null,2));console.log(JSON.stringify({groups:checks.length,errors,warnings}));
}catch(e){console.error(e);if(page&&!page.isClosed())await page.screenshot({path:out+'failure.png',fullPage:true});process.exitCode=1;}finally{await b.close();}
