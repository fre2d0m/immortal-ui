import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const output = new URL('.', import.meta.url).pathname;
const base='http://127.0.0.1:4190';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}});
page.setDefaultTimeout(8000);
const errors=[], checks=[], measurements=[];
function watch(p){p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});}
watch(page);
async function selected(loc){await page.waitForFunction(el=>el.getAttribute('aria-selected')==='true',await loc.elementHandle());}
const pause=()=>page.evaluate(()=>new Promise(resolve=>setTimeout(resolve,230)));
const css=loc=>loc.evaluate(el=>{const c=getComputedStyle(el);return {background:c.backgroundImage,color:c.color,fill:c.backgroundColor,shadow:c.boxShadow,outline:c.outlineStyle,outlineWidth:c.outlineWidth,selected:el.getAttribute('aria-selected'),rect:el.getBoundingClientRect().toJSON()}});
function clearSurface(s){assert.equal(s.background,'none');assert.equal(s.shadow,'none');assert.ok(s.fill==='rgba(0, 0, 0, 0)'||s.fill==='transparent',JSON.stringify(s));}
async function checkTabs(id){
 const root=page.locator(`#${id}`), tabs=root.getByRole('tab'), list=root.getByRole('tablist');
 const first=tabs.nth(0), second=tabs.nth(1);
 const before=await second.boundingBox();await second.hover();await pause();clearSurface(await css(second));
 assert.equal(await first.getAttribute('aria-selected'),'true');assert.equal(await second.getAttribute('aria-selected'),'false');
 assert.deepEqual(await second.boundingBox(),before);
 await page.evaluate(id=>{const l=document.querySelector(`#${id} [role=tablist]`);window.__frames=[];const start=performance.now();function capture(){const rows=[...l.querySelectorAll('[role=tab]')].map(e=>({selected:e.getAttribute('aria-selected'),bg:getComputedStyle(e).backgroundImage,fill:getComputedStyle(e).backgroundColor,shadow:getComputedStyle(e).boxShadow}));window.__frames.push({rows,indicator:getComputedStyle(l,'::before').opacity});if(performance.now()-start<280)requestAnimationFrame(capture)}requestAnimationFrame(capture)},id);
 await page.mouse.down();await pause();await page.mouse.up();await pause();
 const frames=await page.evaluate(()=>window.__frames);assert.ok(frames.length>=4);
 for(const f of frames){assert.equal(f.rows.filter(r=>r.selected==='true').length,1);for(const row of f.rows){assert.equal(row.bg,'none',id);assert.equal(row.shadow,'none',id)}assert.equal(f.indicator,'1');}
 assert.equal(await second.getAttribute('aria-selected'),'true');assert.equal(await root.getByRole('tabpanel').innerText(),'处理记录');
 await first.focus();await selected(first);assert.equal(await first.getAttribute('aria-selected'),'true');
 await page.keyboard.press(id.startsWith('vertical')?'ArrowDown':'ArrowRight');await selected(second);assert.equal(await second.getAttribute('aria-selected'),'true');
 await page.keyboard.press(id.startsWith('vertical')?'ArrowDown':'ArrowRight');await selected(first);assert.equal(await first.getAttribute('aria-selected'),'true'); // disabled tab skipped
 assert.equal(await first.evaluate(e=>e.matches(':focus-visible')),true);const f=await css(first);assert.notEqual(f.outline,'none');
 measurements.push({id,animationFrames:frames.length,hover:await css(second),focusOutline:f.outlineWidth});
}
async function pickerGeometry(p){return p.locator('.wf-step-picker').evaluate(el=>{const list=el.querySelector('[role=tablist]'),panel=el.querySelector('[role=tabpanel]:not([hidden])')??el.querySelector('.wf-step-choices');return {popup:el.getBoundingClientRect().toJSON(),header:el.querySelector('.wf-step-picker-heading').getBoundingClientRect().toJSON(),search:el.querySelector('.wf-search').getBoundingClientRect().toJSON(),list:list?.getBoundingClientRect().toJSON(),panel:panel.getBoundingClientRect().toJSON(),heading:panel.querySelector('.wf-step-group > small')?.getBoundingClientRect().toJSON(),scroll:panel.scrollTop,shellScrollLeft:el.scrollLeft,shellScrollWidth:el.scrollWidth,shellClientWidth:el.clientWidth,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight}})}
function separated(g){assert.equal(g.shellScrollLeft,0);assert.ok(g.shellScrollWidth<=g.shellClientWidth);assert.ok(g.header.left>=g.popup.left+14);assert.ok(g.list.bottom+11<=g.panel.top,JSON.stringify(g));assert.ok(g.panel.height>60,JSON.stringify(g));if(g.scroll===0&&g.heading)assert.ok(g.heading.top>=g.list.bottom+11);}
async function longPicker(mode,font,width,height){
 await page.setViewportSize({width,height});await page.goto(`${base}/state-check.html?mode=${mode}&font=${font}&long`);await page.locator('#open-picker').click();
 const picker=page.locator('.wf-step-picker'), search=page.getByLabel('搜索可连接节点');
 let g=await pickerGeometry(page);separated(g);assert.ok(g.popup.x>=0&&g.popup.right<=width&&g.popup.y>=0&&g.popup.bottom<=height);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),width);
 await picker.getByRole('tab',{name:'连接已有'}).hover();await pause();clearSurface(await css(picker.getByRole('tab',{name:'连接已有'})));
 await picker.screenshot({path:output+`long-picker-${mode}-${width}-${font}.png`});
 const start=g;await picker.getByRole('tabpanel').hover();await page.mouse.wheel(0,1000);await pause();g=await pickerGeometry(page);assert.ok(g.scroll>0);assert.deepEqual(g.list,start.list);assert.deepEqual(g.header,start.header);assert.deepEqual(g.search,start.search);
 await search.focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('End');assert.equal(await page.locator('[data-step-choice="new:49"]').evaluate(e=>e===document.activeElement),true);
 const last=await page.locator('[data-step-choice="new:49"]').boundingBox(), panel=await picker.getByRole('tabpanel').boundingBox();assert.ok(last.y>=panel.y&&last.y+last.height<=panel.y+panel.height+1);
 await picker.getByRole('tab',{name:'连接已有'}).click();assert.equal(await picker.getByRole('tabpanel').count(),1);assert.equal(await picker.locator('[data-step-choice]').count(),30);separated(await pickerGeometry(page));
 await search.fill('节点 30');assert.equal(await picker.locator('[data-step-choice]').count(),1);await search.fill('not-found');assert.equal(await picker.locator('[data-step-choice]').count(),0);assert.match(await picker.innerText(),/没有匹配的节点/);
 await search.fill('');await page.keyboard.press('ArrowDown');await page.keyboard.press('End');await page.keyboard.press('Enter');assert.equal(await page.locator('#chosen').innerText(),'existing:29');assert.equal(await picker.count(),0);
 await page.locator('#open-picker').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.id==='open-picker');assert.equal(await page.locator('#open-picker').evaluate(e=>e===document.activeElement),true);
 measurements.push({mode,font,width,height,geometry:start});
}
try{
 for(const mode of ['dark','light']){
  await page.goto(`${base}/state-check.html?mode=${mode}`);
  for(const id of ['default','line','vertical','vertical-line'])await checkTabs(id);
  const manual=page.locator('#manual');await manual.getByRole('tab').nth(0).focus();await page.keyboard.press('ArrowRight');await pause();assert.equal(await manual.getByRole('tab').nth(1).evaluate(e=>e===document.activeElement),true);assert.equal(await manual.getByRole('tab').nth(0).getAttribute('aria-selected'),'true');clearSurface(await css(manual.getByRole('tab').nth(1)));await page.keyboard.press('Space');await pause();assert.equal(await manual.getByRole('tab').nth(1).getAttribute('aria-selected'),'true');
  const fallback=page.locator('#fallback');await fallback.getByRole('tab').nth(1).hover();await pause();clearSurface(await css(fallback.getByRole('tab').nth(1)));assert.notEqual((await css(fallback.getByRole('tab').nth(0))).background,'none');await fallback.getByRole('tab').nth(1).click();await pause();assert.equal(await fallback.getByRole('tab').nth(1).getAttribute('aria-selected'),'true');clearSurface(await css(fallback.getByRole('tab').nth(0)));
  for(const id of ['navigation','filters','segments']){const items=page.locator(`#${id} > *`);await items.nth(1).hover();await pause();const unselected=await css(items.nth(1));assert.equal(unselected.background,'none');assert.equal(unselected.shadow,'none');assert.notEqual((await css(items.nth(0))).background,'none');}
  const check=page.locator('#check'),sw=page.locator('#switch');for(const control of [check,sw]){await control.hover();assert.equal(await control.getAttribute('aria-checked'),'false');await control.click();assert.equal(await control.getAttribute('aria-checked'),'true')}
  const slider=page.getByRole('slider');await slider.hover();assert.equal(await slider.getAttribute('aria-valuenow'),'40');await slider.focus();await page.keyboard.press('ArrowRight');assert.equal(await slider.getAttribute('aria-valuenow'),'41');
  await page.locator('#input').fill('交互检查');assert.equal(await page.locator('#input').inputValue(),'交互检查');assert.equal(await page.locator('#readonly').inputValue(),'只读内容');
  await page.locator('#menu').click();await page.getByRole('menuitem',{name:'查看详情'}).hover();assert.equal(await page.getByRole('menuitemcheckbox').getAttribute('aria-checked'),'true');assert.equal(await page.getByRole('menuitemcheckbox').locator('[data-state="checked"]').innerText(),'✓');await page.keyboard.press('Escape');
  await page.screenshot({path:output+`foundation-${mode}.png`,fullPage:true});
 }
 checks.push('Dark/light default, line, vertical and manual tabs: one persistent selection; hover, press and animation frames have no second raised surface; keyboard navigation skips disabled tabs and keeps visible focus; upstream static fallback remains selected.');
 checks.push('Navigation, filters and single selection segments have flat hover distinct from selected state. Checkbox, switch, slider, text input and checked menu state retain their own behavior.');
 for(const args of [['dark',14,1280,1000],['light',14,1280,1000],['dark',20,320,480],['light',20,320,480],['dark',20,390,640]])await longPicker(...args);
 checks.push('50 new and 30 existing choices: only result pane scrolls; heading/search/tabs stay fixed; both panels, search/no-match, End/Enter to last choice and Escape focus restore work in dark/light, 320px width, 480px height and 20px text.');
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto(base+'/state-check.html');await page.locator('#default [role=tab]').nth(1).click();const duration=await page.locator('#default [role=tablist]').evaluate(e=>getComputedStyle(e,'::before').transitionDuration);assert.ok(duration.split(',').every(v=>parseFloat(v)<0.01),duration);
 await page.emulateMedia({forcedColors:'active'});await page.locator('#default [role=tab]').nth(0).focus();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('#default [aria-selected=true]').count(),1);await page.screenshot({path:output+'forced-colors.png'});await page.emulateMedia({forcedColors:'none',reducedMotion:'no-preference'});
 checks.push('Reduced motion disables indicator travel; forced colors keeps one selected tab and keyboard focus.');
 const touch=await browser.newPage({viewport:{width:390,height:640},hasTouch:true,isMobile:true});watch(touch);await touch.goto(base+'/state-check.html?mode=dark&font=20&long');await touch.locator('#open-picker').tap();const tabs=touch.locator('.wf-step-picker [role=tab]');for(let i=0;i<2;i++){const b=await tabs.nth(i).boundingBox();assert.ok(b.height>=40&&b.width>=40)}await tabs.nth(1).tap();assert.equal(await tabs.nth(1).getAttribute('aria-selected'),'true');separated(await pickerGeometry(touch));await touch.getByLabel('搜索可连接节点').fill('节点 30');await touch.locator('[data-step-choice="existing:29"]').tap();assert.equal(await touch.locator('#chosen').innerText(),'existing:29');await touch.close();checks.push('Touch-emulated Chrome: 40px tab targets, switching and selecting an existing choice work.');
 // Actual workflow: the endpoint in the reported screenshot, plus both graph mutations.
 await page.setViewportSize({width:1600,height:1200});await page.goto(base+'/#/blocks/data-workflow');await page.getByRole('button',{name:'恢复示例',exact:true}).click();await page.getByRole('button',{name:'显示完整流程',exact:true}).click();await page.locator('[data-endpoint-node="join"][data-endpoint-port="error"]').click();await page.locator('.wf-step-picker').waitFor();separated(await pickerGeometry(page));await page.locator('.wf-step-picker').getByRole('tab',{name:'连接已有'}).hover();await pause();clearSurface(await css(page.locator('.wf-step-picker').getByRole('tab',{name:'连接已有'})));await page.locator('.wf-step-picker').screenshot({path:output+'workflow-picker-dark.png'});
 await page.locator('.wf-step-picker').getByRole('tab',{name:'连接已有'}).click();await page.locator('[data-step-choice="existing:failure:auto"]').click();await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('immortal-workflow-demo-draft-v2')).edges.some(e=>e.source==='join'&&e.target==='failure'&&e.port==='error'));
 await page.getByRole('button',{name:'恢复示例',exact:true}).click();await page.getByRole('button',{name:'显示完整流程',exact:true}).click();await page.locator('[data-endpoint-node="join"][data-endpoint-port="error"]').click();await page.locator('[data-step-choice="new:failure:auto"]').click();await page.getByRole('button',{name:'保存草稿',exact:true}).click();await page.waitForFunction(()=>{const f=JSON.parse(localStorage.getItem('immortal-workflow-demo-draft-v2'));return f.nodes.length===12&&f.edges.some(e=>e.source==='join'&&e.port==='error'&&e.target!=='failure')});
 checks.push('Actual demo endpoint 合并多源观测 / 失败: heading is below tabs, inactive hover is flat; choosing existing adds join→failure/error, choosing new adds one failure node and the corresponding edge.');
 assert.deepEqual(errors,[]);
 await writeFile(output+'checks.json',JSON.stringify({checks,measurements,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}catch(error){await page.screenshot({path:output+'failure.png',fullPage:true});await writeFile(output+'failure.json',JSON.stringify({message:String(error),checks,measurements,errors},null,2));console.error(error);process.exitCode=1;}finally{await browser.close();}
