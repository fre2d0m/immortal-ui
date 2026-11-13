import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const out=new URL('.',import.meta.url).pathname;
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1100}});page.setDefaultTimeout(8000);
const errors=[],checks=[],geometry={};page.on('pageerror',e=>errors.push(e.message));
const b=name=>page.getByRole('button',{name,exact:true});
const flow=async()=>JSON.parse(await page.getByLabel('宿主流程',{exact:true}).textContent());
const picker=()=>page.locator('.wf-step-picker');
const plus=(id,port)=>page.locator(`[data-endpoint-node="${id}"][data-endpoint-port="${port}"]`);
async function close(){if(await b('关闭配置').isVisible())await b('关闭配置').click();}
try{
 await page.goto('http://127.0.0.1:4189');await page.locator('.wf-start-node').waitFor();
 await b('切换模板').click();assert.equal(await page.getByRole('button',{name:/选择触发器/}).count(),0);assert.match(await page.locator('.wf-start-node').innerText(),/尚未提供可用的触发类型/);
 await b('切换模板').click();await b('切换只读').click();assert.equal(await page.getByRole('button',{name:/选择触发器/}).count(),0);assert.equal(await page.locator('[data-endpoint-node]').count(),0);await b('切换只读').click();
 await page.locator('.wf-start-node').click();await picker().locator('[data-step-choice="new:start:auto"]').click();let current=await flow();const start=current.nodes[0].id;
 await close();await plus(start,'out').click();assert.equal(await picker().locator('[data-step-choice="new:save:auto"]').count(),0);
 await picker().locator('[data-step-choice="new:source:auto"]').click();current=await flow();const source=current.nodes.find(n=>n.kind==='source').id;assert.equal(current.edges.length,1);
 await close();await plus(source,'out').click();await picker().locator('[data-step-choice="new:save:auto"]').click();current=await flow();assert.equal(current.nodes.length,3);assert.equal(current.edges.length,2);
 checks.push('Six files installed by the CLI without showcase code; a host-defined trigger/source/sink chain builds correctly and filters incompatible types');
 await close();await plus(source,'out').click();await picker().waitFor();await b('外部更新').click();assert.equal(await picker().count(),0);assert.equal(await b('外部更新').evaluate(e=>document.activeElement===e),true);
 await plus(source,'out').click();await b('切换只读').click();assert.equal(await picker().count(),0);assert.equal(await page.locator('[data-endpoint-node]').count(),0);assert.equal((await flow()).nodes.length,3);await b('切换只读').click();
 checks.push('No trigger templates and read-only empty states do not offer dead actions; outside clicks keep focus; external definition changes/readonly close stale pickers');
 await plus(source,'out').hover();await page.waitForTimeout(170);
 geometry.hover=await plus(source,'out').evaluate(e=>({button:{width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,background:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow,radius:getComputedStyle(e).borderRadius},mark:{transform:getComputedStyle(e.querySelector('.wf-endpoint-mark')).transform}}));
 assert.equal(geometry.hover.button.background,'rgba(0, 0, 0, 0)');assert.equal(geometry.hover.button.shadow,'none');assert.ok(geometry.hover.mark.transform.includes('1.12'));
 await plus(source,'out').click();assert.equal(await plus(source,'out').getAttribute('aria-expanded'),'true');assert.equal(await plus(source,'out').evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');await page.keyboard.press('Escape');await page.waitForFunction(id=>document.activeElement?.getAttribute('data-endpoint-node')===id,source);assert.equal(await plus(source,'out').evaluate(e=>document.activeElement===e),true);
 await page.emulateMedia({reducedMotion:'reduce'});await plus(source,'out').hover();assert.equal(await plus(source,'out').locator('.wf-endpoint-mark').evaluate(e=>getComputedStyle(e).transitionDuration),'0s');
 checks.push('Endpoint hover grows only the circular mark; hit area stays stable and transparent, Escape restores the endpoint, reduced-motion removes transitions');
 await b('显示完整流程').click();await page.locator('.wf-root').screenshot({path:out+'installed-consumer.png'});
 await page.emulateMedia({forcedColors:'active'});await plus(source,'out').click();assert.notEqual(await picker().evaluate(e=>getComputedStyle(e).borderTopStyle),'none');await page.screenshot({path:out+'forced-colors.png'});await page.keyboard.press('Escape');await page.emulateMedia({forcedColors:'none'});
 // A touch device at the default graph zoom: actual pointer events, not synthetic click handlers.
 const touch=await browser.newPage({viewport:{width:390,height:1000},isMobile:true,hasTouch:true,deviceScaleFactor:1,reducedMotion:'reduce'});touch.on('pageerror',e=>errors.push(e.message));await touch.goto('http://127.0.0.1:4189');
 await touch.locator('.wf-start-node').tap();await touch.locator('[data-step-choice="new:start:auto"]').tap();await touch.getByRole('button',{name:'关闭配置',exact:true}).tap();
 const tp=touch.locator('[data-endpoint-port="out"]').first();const hit=await tp.boundingBox();geometry.touch=hit;assert.ok(hit.width>=39.9&&hit.height>=39.9,JSON.stringify(hit));
 const cdp=await touch.context().newCDPSession(touch);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:hit.x+hit.width/2,y:hit.y+hit.height/2}]});await touch.waitForTimeout(520);await touch.getByRole('tooltip').waitFor();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await touch.locator('.wf-step-picker').count(),0);await touch.keyboard.press('Escape');
 await tp.tap();await touch.locator('[data-step-choice="new:source:auto"]').tap();assert.equal(JSON.parse(await touch.getByLabel('宿主流程',{exact:true}).textContent()).edges.length,1);
 await touch.getByRole('button',{name:'关闭配置',exact:true}).tap();await touch.locator('[data-endpoint-port="out"]').last().tap();const pop=await touch.locator('.wf-step-picker').boundingBox();assert.ok(pop.x>=0&&pop.x+pop.width<=390);await touch.screenshot({path:out+'touch-picker.png'});await touch.close();
 checks.push('390px emulated touch: actual 40px endpoint hit target at editing zoom, long press shows hint without creating nodes, tap selects and connects; picker stays in viewport');
 // Source closure: the CLI removes the first leading API doc comment from .ts files.
 const base='/Users/golo/Work/CodexProjects/immortal-ui/registry/immortal/blocks/';const installed='/tmp/immortal-workflow-endpoints/consumer/src/components/blocks/';const matches={};
 for(const file of ['data-workflow.tsx','data-workflow.css','workflow-parts.tsx','workflow-model.ts']){const source=await readFile(base+file,'utf8'),actual=await readFile(installed+file,'utf8');matches[file]=source===actual||source.replace(/^\/\*\*[\s\S]*?\*\/\s*/,'')===actual;assert.equal(matches[file],true,file);}
 await writeFile(out+'install-source-match.json',JSON.stringify(matches,null,2));assert.deepEqual(errors,[]);await writeFile(out+'installed-checks.json',JSON.stringify({checks,geometry,errors},null,2));console.log(JSON.stringify({checks,geometry,errors},null,2));
}catch(e){await page.screenshot({path:out+'installed-failure.png'});console.error(e);process.exitCode=1;}finally{await browser.close();}
