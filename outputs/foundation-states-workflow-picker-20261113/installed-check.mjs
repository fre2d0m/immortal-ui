import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const root='/Users/golo/Work/CodexProjects/immortal-ui', installed='/tmp/immortal-foundation-states/consumer';
const out=new URL('.',import.meta.url).pathname;
const trim=s=>s.replace(/^\/\*\*[\s\S]*?\*\/\s*/,'').trim();
for(const file of ['data-workflow.tsx','workflow-parts.tsx','workflow-model.ts','data-workflow.css'])assert.equal(trim(await readFile(`${root}/registry/immortal/blocks/${file}`,'utf8')),trim(await readFile(`${installed}/src/components/blocks/${file}`,'utf8')));
assert.equal(trim(await readFile(`${root}/src/components/ui/tabs.tsx`,'utf8')),trim(await readFile(`${installed}/src/components/ui/tabs.tsx`,'utf8')));
const css=await readFile(installed+'/src/index.css','utf8');assert.ok(css.includes('[aria-selected="true"]'));assert.ok(css.includes('var(--muted-foreground) 65%')); // theme installed through CLI, not a source import
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}}), errors=[],measurements=[];
page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
try{
 for(const mode of ['dark','light']){
  await page.goto('http://127.0.0.1:4189/?mode='+mode);await page.getByRole('button',{name:'显示完整流程',exact:true}).click();await page.locator('[data-endpoint-node="join"][data-endpoint-port="error"]').click();const picker=page.locator('.wf-step-picker');await picker.waitFor();
  const second=picker.getByRole('tab',{name:'连接已有'});await second.hover();await page.waitForTimeout(250);
  const info=await picker.evaluate(el=>{const second=el.querySelectorAll('[role=tab]')[1],s=getComputedStyle(second),list=el.querySelector('[role=tablist]').getBoundingClientRect(),pane=el.querySelector('[role=tabpanel]:not([hidden])').getBoundingClientRect();return{list:list.toJSON(),pane:pane.toJSON(),background:s.backgroundImage,fill:s.backgroundColor,shadow:s.boxShadow,selectedCount:el.querySelectorAll('[aria-selected=true]').length}});
  assert.equal(info.background,'none');assert.equal(info.fill,'rgba(0, 0, 0, 0)');assert.equal(info.shadow,'none');assert.equal(info.selectedCount,1);assert.ok(info.list.bottom+11<=info.pane.top);measurements.push({mode,...info});await picker.screenshot({path:out+`installed-picker-${mode}.png`});
  await second.click();await page.locator('[data-step-choice="existing:failure:auto"]').click();await page.waitForFunction(()=>JSON.parse(document.querySelector('#host-state').textContent).edges.some(e=>e.source==='join'&&e.target==='failure'&&e.port==='error'));
 }
 assert.deepEqual(errors,[]);await writeFile(out+'installed-checks.json',JSON.stringify({checks:['Fresh CLI install of Graphite + data-workflow matches four block source files and shared Tabs','Installed theme in both modes: transparent inactive hover; one selected tab; 12px gap between tabs and active results','Choosing existing failure node calls host onChange with join→failure/error'],measurements,errors},null,2));console.log('Fresh installed consumer verified in dark and light themes.');
}catch(e){await page.screenshot({path:out+'installed-failure.png'});console.error(e);console.error(errors);process.exitCode=1}finally{await browser.close()}
