import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const base=process.env.CHECK_BASE||'http://127.0.0.1:4195';
const flow=process.env.CHECK_FLOW||'http://127.0.0.1:4177/#/blocks/data-workflow';
const out=new URL(process.env.CHECK_OUT||'./',import.meta.url).pathname;
await mkdir(out,{recursive:true});
const b=await chromium.launch({channel:'chrome',headless:true});
const p=await b.newPage({viewport:{width:1200,height:1100},deviceScaleFactor:2});
p.setDefaultTimeout(8000);
const checks=[],errors=[];p.on('pageerror',e=>errors.push(e.message));
async function measure(locator){return locator.evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{label:e.getAttribute('aria-label'),w:r.width,h:r.height,radius:s.borderRadius,outline:s.outlineWidth,scale:s.scale,bg:s.backgroundImage,shadow:s.boxShadow,focus:e.matches(':focus-visible')}}));}
function circles(xs,min=24){assert.ok(xs.length>0);for(const x of xs){assert.ok(Math.abs(x.w-x.h)<.1,JSON.stringify(x));assert.equal(x.radius,'50%');assert.ok(x.w>=min-.1,JSON.stringify(x));}}
try{
 for(const query of ['?mode=dark','?mode=light','?radius=0','?radius=20&pill=1','?height=48&font=20']){
  await p.goto(base+'/icon-check.html'+query);await p.locator('#matrix').waitFor();
  const sizes=await measure(p.locator('#matrix button'));assert.equal(sizes.length,24);circles(sizes);
  circles(await measure(p.locator('#disabled,#busy,#input-row button,#tab-row > button')));
  const input=await p.locator('#input-row input').boundingBox();assert.equal((await measure(p.locator('#input-row button')))[0].h,input.height);
  const horizontal=await p.locator('#horizontal button').evaluateAll(es=>es.map(e=>{const s=getComputedStyle(e);return[s.borderTopLeftRadius,s.borderTopRightRadius,s.borderBottomRightRadius,s.borderBottomLeftRadius]}));assert.deepEqual(horizontal[1],['0px','0px','0px','0px']);assert.equal(horizontal[0][1],'0px');assert.equal(horizontal[2][0],'0px');
  assert.notEqual(await p.locator('#text').evaluate(e=>getComputedStyle(e).borderRadius),'50%');
  if(query==='?mode=dark'||query==='?mode=light')await p.locator('main').screenshot({path:out+`matrix-${query.includes('dark')?'dark':'light'}.png`});
  checks.push({name:'variants, sizes, themes, groups and mixed rows '+query,sizes,horizontal});
 }
 await p.goto(base+'/icon-check.html');await p.locator('#actions').waitFor();
 const more=p.getByRole('button',{name:'更多',exact:true});await more.hover();circles(await measure(more));await p.locator('#actions').screenshot({path:out+'hover.png'});
 await p.mouse.down();await p.waitForTimeout(180);const pressed=await measure(more);circles(pressed);assert.equal(pressed[0].scale,'0.96');await p.locator('#actions').screenshot({path:out+'pressed.png'});await p.mouse.up();
 await more.focus();await p.keyboard.press('Tab');const focus=await measure(p.getByRole('button',{name:'展开',exact:true}));circles(focus);assert.equal(focus[0].focus,true);await p.locator('#actions').screenshot({path:out+'focus.png'});
 await p.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});circles(await measure(p.locator('#actions button')));await p.locator('#actions').screenshot({path:out+'forced-colors.png'});await p.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});checks.push({name:'hover, press, keyboard focus, forced colors and reduced motion',pressed,focus});
 await p.goto(flow);await p.locator('.wf-header').waitFor();circles(await measure(p.locator('.wf-actions button,.wf-canvas-toolbar button,.wf-zoom-controls button')));
 await p.getByRole('button',{name:'更多流程操作',exact:true}).click();await p.getByRole('menu').waitFor();circles(await measure(p.locator('.wf-actions button')));await p.locator('.wf-header').screenshot({path:out+'header-menu-open.png'});await p.keyboard.press('Escape');await p.getByRole('menu').waitFor({state:'hidden'});
 await p.getByRole('button',{name:'保存草稿',exact:true}).click();await p.getByRole('button',{name:'保存草稿（已保存）',exact:true}).waitFor();circles(await measure(p.locator('.wf-actions button')));
 await p.getByRole('button',{name:'测试流程',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.wf-results-summary .wf-status')?.dataset.status==='succeeded');circles(await measure(p.locator('.wf-actions button')));
 await p.getByRole('button',{name:'展开工作区',exact:true}).click();await p.locator('dialog[open]').waitFor();circles(await measure(p.locator('dialog[open] .wf-actions button')));await p.getByRole('button',{name:'收起工作区',exact:true}).click();
 const plus=await p.locator('.wf-graph-add').first().evaluate(e=>{const s=getComputedStyle(e),halo=getComputedStyle(e,'::before'),mark=getComputedStyle(e.querySelector('.wf-endpoint-mark'));return{w:s.width,h:s.height,bg:s.backgroundColor,halo:[halo.width,halo.height],mark:[mark.width,mark.height]}});assert.deepEqual(plus.halo,['20px','20px']);assert.deepEqual(plus.mark,['12px','12px']);assert.equal(plus.bg,'rgba(0, 0, 0, 0)');
 await p.mouse.move(0,0);await p.locator('.wf-header').screenshot({path:out+'workflow-header.png'});await p.locator('.wf-canvas-toolbar').screenshot({path:out+'workflow-toolbar.png'});checks.push({name:'workflow menu, save, mock run, expand and graph affordances',plus});
 const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let t=await ctx.newPage();t.on('pageerror',e=>errors.push(e.message));await t.goto(base+'/icon-check.html?font=20');await t.locator('#matrix').waitFor();circles(await measure(t.locator('#matrix button,#input-row button,#tab-row > button')),40);assert.ok(await t.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await t.screenshot({path:out+'touch-390.png',fullPage:true});
 await t.close();t=await ctx.newPage();t.on('pageerror',e=>errors.push(e.message));await t.goto(flow);await t.locator('.wf-header').waitFor();assert.equal(await t.evaluate(()=>matchMedia('(pointer: coarse)').matches),true);circles(await measure(t.locator('.wf-actions button,.wf-canvas-toolbar button,.wf-zoom-controls button')),40);await t.getByRole('button',{name:'更多流程操作',exact:true}).tap();await t.getByRole('menu').waitFor();await t.screenshot({path:out+'touch-workflow-menu.png',fullPage:true});await ctx.close();checks.push({name:'390px, 20px text and touch targets',passed:true});
 assert.deepEqual(errors,[]);await writeFile(out+'checks.json',JSON.stringify({checks,errors},null,2));console.log({groups:checks.length,errors});
}catch(e){await p.screenshot({path:out+'failure.png',fullPage:true});console.error(e);process.exitCode=1;}finally{await b.close();}
