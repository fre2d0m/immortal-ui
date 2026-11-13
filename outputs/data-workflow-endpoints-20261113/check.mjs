import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const output = new URL('.', import.meta.url).pathname;
const browser = await chromium.launch({channel:'chrome',headless:true});
const page = await browser.newPage({viewport:{width:1600,height:1200},reducedMotion:'reduce'});
page.setDefaultTimeout(8000);
const errors=[],checks=[],geometry={};page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
const url=(process.env.WORKFLOW_PREVIEW_URL ?? 'http://127.0.0.1:4177')+'/#/blocks/data-workflow';
const button=name=>page.getByRole('button',{name,exact:true});
const node=id=>page.locator(`.react-flow__node[data-id="${id}"]`);
const port=(id,p)=>page.locator(`[data-endpoint-node="${id}"][data-endpoint-port="${p}"]`);
const picker=()=>page.locator('.wf-step-picker');
async function close(){if(await button('关闭配置').isVisible())await button('关闭配置').click();}
async function fit(){await close();await button('显示完整流程').click();}
async function snapshot(){await button('保存草稿').click();await page.waitForFunction(()=>document.querySelector('.wf-identity').textContent.includes('已保存'));return page.evaluate(()=>JSON.parse(localStorage.getItem('immortal-workflow-demo-draft-v2')));}
async function importFlow(flow){await page.locator('.wf-root input[type=file]').setInputFiles({name:'flow.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(flow))});await page.waitForFunction(flow=>document.querySelector('.wf-identity h3')?.textContent===flow.name&&document.querySelectorAll('.react-flow__node').length===flow.nodes.length&&flow.nodes.every(n=>{const el=document.querySelector(`.react-flow__node[data-id="${n.id}"]`);if(!el)return false;const m=new DOMMatrix(getComputedStyle(el).transform);return m.m41===n.position.x&&m.m42===n.position.y;}),flow);await fit();await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));}
async function openPort(id,p){await fit();await port(id,p).click();await picker().waitFor();}
async function choose(template,p='auto'){await picker().locator(`[data-step-choice="new:${template}:${p}"]`).click();await picker().waitFor({state:'hidden'});await page.locator('.wf-inspector').waitFor();}
async function theme(mode,fontSize=14){await page.evaluate(async({mode,fontSize})=>{const{applySettings}=await import('/src/lib/theme-storage.ts');const{defaultSettings}=await import('/src/lib/theme-settings.ts');applySettings({...defaultSettings,mode,fontSize});},{mode,fontSize});}
try{
 await page.goto(url);await node('event').waitFor();await button('恢复示例').click();
 const original=await snapshot();
 assert.equal(await button('添加节点').count(),0);assert.equal(await button('流程大纲').count(),0);
 for(const mode of ['dark','light']){await theme(mode);await page.locator('.wf-root').screenshot({path:output+`overview-${mode}.png`});}
 checks.push('Node library and outline entry points removed; every editable input/output has a visible plus');
 assert.equal(await page.locator('[data-endpoint-node]').count(),26);
 await button('空白流程').click();assert.equal(await page.locator('.react-flow__node').count(),0);
 assert.equal(await page.locator('.wf-start-node').evaluate(el=>getComputedStyle(el).borderStyle),'dashed');
 await page.locator('.wf-root').screenshot({path:output+'empty.png'});
 const start=page.getByRole('button',{name:/选择触发器/});await start.focus();await page.keyboard.press('Enter');
 assert.equal(await picker().locator('[data-step-choice]').count(),3);
 assert.equal(await page.getByLabel('搜索可连接节点',{exact:true}).evaluate(el=>document.activeElement===el),true);
 await page.keyboard.press('Escape');assert.equal(await picker().count(),0);assert.equal(await start.evaluate(el=>document.activeElement===el),true);
 assert.equal((await snapshot()).nodes.length,0);
 await start.click();await page.getByLabel('搜索可连接节点',{exact:true}).fill('手动');await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');
 let flow=await snapshot();assert.equal(flow.nodes.length,1);assert.equal(flow.nodes[0].kind,'trigger');assert.equal(flow.edges.length,0);const trigger=flow.nodes[0].id;
 checks.push('Dashed empty node opens trigger-only picker; Escape restores focus without mutation; search/ArrowDown/Enter creates a trigger');
 await openPort(trigger,'out');assert.equal(await picker().locator('[data-step-choice="new:quality:auto"]').count(),0);assert.equal(await picker().locator('[data-step-choice="new:event:auto"]').count(),0);
 await choose('parallel');flow=await snapshot();let parallel=flow.nodes.find(n=>n.kind==='parallel').id;
 assert.deepEqual(flow.edges.map(({source,target,port})=>({source,target,port})),[{source:trigger,target:parallel,port:'out'}]);
 await openPort(parallel,'out');await choose('mqtt');flow=await snapshot();const first=flow.nodes.find(n=>n.operation==='source').id;
 await openPort(parallel,'out');await choose('http');flow=await snapshot();const second=flow.nodes.find(n=>n.operation==='source'&&n.id!==first).id;
 assert.equal(flow.edges.filter(e=>e.source===parallel&&e.port==='out').length,2);
 await openPort(first,'out');await choose('join');flow=await snapshot();const join=flow.nodes.find(n=>n.kind==='join').id;
 await openPort(second,'out');await picker().getByRole('tab',{name:'连接已有',exact:true}).click();
 assert.equal(await picker().locator(`[data-step-choice="existing:${join}:auto"]`).count(),1);
 await picker().locator(`[data-step-choice="existing:${join}:auto"]`).click();
 flow=await snapshot();assert.equal(flow.nodes.length,5);assert.equal(flow.edges.filter(e=>e.target===join).length,2);
 checks.push('Trigger → parallel → two data sources → shared existing join is built with endpoint picks and correct connections');
 const before=structuredClone(flow);await openPort(first,'out');assert.match(await picker().innerText(),/插入步骤/);assert.equal(await picker().getByRole('tab',{name:'连接已有'}).count(),0);
 await choose('quality','out');flow=await snapshot();const quality=flow.nodes.find(n=>n.kind==='quality').id;
 assert.ok(flow.edges.some(e=>e.source===first&&e.target===quality));assert.ok(flow.edges.some(e=>e.source===quality&&e.target===join));assert.ok(!flow.edges.some(e=>e.source===first&&e.target===join));
 assert.equal(flow.edges.filter(e=>e.source===second&&e.target===join).length,1);
 for(const n of before.nodes)assert.deepEqual(flow.nodes.find(v=>v.id===n.id).position,n.position);
 await button('撤销').click();assert.deepEqual(await snapshot(),before);await button('重做').click();assert.deepEqual(await snapshot(),flow);
 checks.push('Occupied output inserts one step and preserves both ends, unrelated branches and existing positions; a single undo/redo restores the entire edit');
 await openPort(quality,'error');assert.equal(await picker().locator('[data-step-choice="new:aggregate:auto"]').count(),0);await choose('failure');flow=await snapshot();assert.ok(flow.edges.some(e=>e.source===quality&&e.port==='error'&&flow.nodes.find(n=>n.id===e.target).kind==='failure'));
 await importFlow(original);await openPort('water','in');await choose('parallel','out');flow=await snapshot();const upstream=flow.nodes.find(n=>!original.nodes.some(o=>o.id===n.id));assert.ok(flow.edges.some(e=>e.source==='parallel'&&e.target===upstream.id));assert.ok(flow.edges.some(e=>e.source===upstream.id&&e.target==='water'));
 checks.push('Failure picker excludes observation processors; input endpoint can insert upstream while preserving the source');
 await importFlow(original);await openPort('condition','false');assert.equal(await picker().locator('[data-step-choice="new:condition:true"]').count(),1);assert.equal(await picker().locator('[data-step-choice="new:condition:false"]').count(),1);await choose('condition','false');flow=await snapshot();const nested=flow.nodes.find(n=>!original.nodes.some(o=>o.id===n.id));assert.ok(flow.edges.some(e=>e.source==='condition'&&e.port==='false'&&e.target===nested.id));assert.ok(flow.edges.some(e=>e.source===nested.id&&e.port==='false'&&e.target==='store'));
 checks.push('Condition continuation is explicitly selected and retains the original false branch');
 // Actual handle drag to an empty part of the canvas.
 const small={...original,name:'端点拖放验证',nodes:[{...original.nodes.find(n=>n.id==='event'),position:{x:0,y:0}}],edges:[]};await importFlow(small);await fit();
 let handle=await node('event').locator('.react-flow__handle[data-handleid="out"]').boundingBox();let bounds=await page.locator('.wf-canvas').boundingBox();
 await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width-180,bounds.y+bounds.height-160,{steps:12});await page.mouse.up();await picker().waitFor();
 const box=await picker().boundingBox();assert.ok(box.x>=0&&box.x+box.width<=1600&&box.y>=0&&box.y+box.height<=1200);
 await page.locator('.wf-root').screenshot({path:output+'drag-picker.png'});
 await page.keyboard.press('Escape');assert.deepEqual(await snapshot(),small);
 // Repeat and select, ensuring no orphan was created before the choice.
 handle=await node('event').locator('.react-flow__handle[data-handleid="out"]').boundingBox();bounds=await page.locator('.wf-canvas').boundingBox();
 await page.mouse.move(handle.x+handle.width/2,handle.y+handle.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width-190,bounds.y+bounds.height-170,{steps:12});await page.mouse.up();await choose('mqtt');flow=await snapshot();assert.equal(flow.nodes.length,2);assert.equal(flow.edges.length,1);assert.equal(flow.edges[0].source,'event');
 checks.push('Dragging a handle to empty canvas opens the nearby picker; Escape makes no edit, choosing adds node and edge atomically');
 // Valid drag still works and invalid drops on a node do not create a picker.
 const isolated={...original,name:'已有节点连线验证',nodes:[{...original.nodes.find(n=>n.id==='event'),position:{x:0,y:0}},{...original.nodes.find(n=>n.id==='water'),position:{x:400,y:0}}],edges:[]};await importFlow(isolated);
 const source=await node('event').locator('.react-flow__handle[data-handleid="out"]').boundingBox();const target=await node('water').locator('.react-flow__handle[data-handleid="in"]').boundingBox();
 await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:12});await page.mouse.up();assert.equal(await picker().count(),0);assert.equal((await snapshot()).edges.length,1);
 checks.push('Direct drag to an existing compatible handle still creates one edge without opening a picker');
 const connected=await snapshot();
 const body=await node('water').boundingBox();
 await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();await page.mouse.move(body.x+body.width/2,body.y+body.height/2,{steps:12});await page.mouse.up();
 assert.equal(await picker().count(),0);assert.deepEqual(await snapshot(),connected);
 await button('更多流程操作').click();await page.getByRole('menuitem',{name:'添加触发器',exact:true}).click();await picker().waitFor();assert.equal(await picker().locator('[data-step-choice]').count(),3);await choose('schedule');flow=await snapshot();assert.equal(flow.nodes.filter(n=>n.kind==='trigger').length,2);
 await openPort('water','out');await page.getByLabel('搜索可连接节点',{exact:true}).fill('no-such-template');assert.match(await picker().innerText(),/没有匹配的节点/);await page.keyboard.press('Escape');assert.deepEqual(await snapshot(),flow);
 checks.push('Dropping on an incompatible node body makes no edit; secondary menu adds another trigger; unmatched searches and Escape leave the graph intact');
 // Expanded dialog and overflow-sensitive narrow layout.
 await button('展开工作区').click();await openPort('water','out');assert.equal(await page.locator('dialog[open] .wf-step-picker').count(),1);await page.keyboard.press('Escape');assert.equal(await page.locator('dialog[open]').count(),1);await button('收起工作区').click();
 for(const mode of ['dark','light']){await page.setViewportSize({width:320,height:900});await theme(mode,20);await button('空白流程').click();await page.locator('.wf-start-node').click();let box=await picker().boundingBox();assert.ok(box.x>=0&&box.x+box.width<=320&&box.y>=0&&box.y+box.height<=900,JSON.stringify(box));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);geometry[mode]=box;await page.screenshot({path:output+`narrow-picker-${mode}.png`});await page.keyboard.press('Escape');}
 checks.push('Expanded workspace keeps picker in the dialog; Escape closes picker first. 320px and 20px text stay within viewport in both themes');
 await page.setViewportSize({width:1600,height:1200});await theme('dark');await importFlow(original);
 await page.locator('.wf-root').screenshot({path:output+'overview-final.png'});
 assert.deepEqual(errors,[]);
 await writeFile(output+'checks.json',JSON.stringify({checks,geometry,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}catch(error){await page.screenshot({path:output+'failure.png'});console.error(error);process.exitCode=1;}finally{await browser.close();}
