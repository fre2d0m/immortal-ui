import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile,writeFile } from 'node:fs/promises';
const output='/Users/golo/Work/CodexProjects/immortal-ui/outputs/data-workflow-20261112';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1600,height:1100},reducedMotion:'reduce'});page.setDefaultTimeout(10000);
const exportFlow=async()=>{const wait=page.waitForEvent('download');await page.getByRole('button',{name:'导出流程 JSON',exact:true}).click();const file=await wait;return JSON.parse(await readFile(await file.path(),'utf8'));};
const report={contrast:[],checks:[]};
try {
 await page.goto('http://127.0.0.1:4177/#/blocks/data-workflow');await page.locator('.react-flow__minimap-node').first().waitFor();assert.equal(await page.locator('.react-flow__minimap-node').count(),11);
 const mini=await page.locator('.react-flow__minimap').boundingBox();const svg=await page.locator('.react-flow__minimap-svg').boundingBox();assert.ok(Math.abs(mini.width-svg.width)<=2);assert.ok(Math.abs(mini.height-svg.height)<=2);
 for(const mode of ['dark','light']) {
  await page.evaluate(async mode=>{const {applySettings}=await import('/src/lib/theme-storage.ts');const {defaultSettings}=await import('/src/lib/theme-settings.ts');applySettings({...defaultSettings,mode});},mode);await page.waitForTimeout(200);
  const colors=await page.evaluate(()=>{
   const rgba=c=>{const cv=document.createElement('canvas');cv.width=cv.height=1;const cx=cv.getContext('2d');cx.fillStyle=c;cx.fillRect(0,0,1,1);return [...cx.getImageData(0,0,1,1).data];};
   const bg=e=>{let current=e;while(current){const color=rgba(getComputedStyle(current).backgroundColor);if(color[3]===255)return color;current=current.parentElement;}return[255,255,255,255];};
   const lum=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   const selectors=['.wf-node p','.wf-node strong','.wf-node-footer','.wf-inspector p','.wf-inspector label','.wf-canvas-help'];
   return selectors.map(selector=>{const e=document.querySelector(selector),fg=rgba(getComputedStyle(e).color),background=bg(e),a=lum(fg),b=lum(background);return{selector,foreground:fg,background,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
  });for(const color of colors)assert.ok(color.ratio>=4.5,mode+color.selector+color.ratio);report.contrast.push({mode,colors});
  await page.setViewportSize({width:320,height:900});
  await page.evaluate(async mode=>{const {applySettings}=await import('/src/lib/theme-storage.ts');const {defaultSettings}=await import('/src/lib/theme-settings.ts');applySettings({...defaultSettings,mode,fontSize:20});},mode);
  await page.getByRole('button',{name:'节点列表',exact:true}).click();await page.locator('.wf-node-list').getByRole('button',{name:/北岸水温观测/}).click();
  const long='北岸水温观测 · 跨流域生态环境多数据源观测与长期样本质量核查';await page.getByLabel('节点名称',{exact:true}).fill(long.repeat(4));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
  await page.locator('.wf-inspector').scrollIntoViewIfNeeded();await page.screenshot({path:output+'/theme-20px-'+mode+'.png'});
  await page.getByLabel('节点名称',{exact:true}).fill('北岸水温观测');await page.setViewportSize({width:1600,height:1100});
 }
 report.checks.push('default dark/light text contrast at least 4.5:1','real Theme Studio fontSize 20 at 320px with long names','minimap node count and SVG/container geometry');
 await page.evaluate(async()=>{const {applySettings}=await import('/src/lib/theme-storage.ts');const {defaultSettings}=await import('/src/lib/theme-settings.ts');applySettings({...defaultSettings,mode:'dark'});});
 await page.getByRole('button',{name:'展开工作区',exact:true}).click();await page.getByRole('button',{name:'连接',exact:true}).first().click();await page.getByRole('button',{name:'移除连接 edge-4',exact:true}).click();await page.getByRole('button',{name:'流程画布',exact:true}).click();await page.getByRole('button',{name:'显示完整流程',exact:true}).click();await page.waitForTimeout(200);
 const source=await page.locator('.react-flow__node[data-id="water"] .react-flow__handle.source[data-handleid="out"]').boundingBox();const target=await page.locator('.react-flow__node[data-id="join"] .react-flow__handle.target').boundingBox();await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();await page.mouse.move(target.x+target.width/2,target.y+target.height/2,{steps:25});await page.mouse.up();const connected=await exportFlow();assert.equal(connected.edges.length,11);assert.ok(connected.edges.some(e=>e.source==='water'&&e.target==='join'&&e.port==='out'));
 await page.locator('.wf-root').screenshot({path:output+'/workflow-overview-dark.png'});report.checks.push('pointer handle-to-handle connection');
 await page.emulateMedia({forcedColors:'active'});assert.ok(['rgb(0, 0, 0)','rgb(255, 255, 255)'].includes(await page.locator('.react-flow__edge-path').first().evaluate(e=>getComputedStyle(e).stroke)));await page.emulateMedia({forcedColors:'none'});await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'从空流程开始',exact:true}).click();assert.ok(await page.getByText('从一个事件开始',{exact:true}).isVisible());
 for(const term of ['手动触发','数据存储']){await page.getByRole('button',{name:'添加节点',exact:true}).click();await page.getByLabel('搜索节点类型',{exact:true}).fill(term);await page.locator('.wf-library').getByRole('button',{name:new RegExp(term)}).click();}
 const draft=await exportFlow();assert.equal(draft.nodes.length,2);await page.getByRole('button',{name:'连接',exact:true}).first().click();await page.getByRole('combobox',{name:'来源节点',exact:true}).selectOption(draft.nodes.find(n=>n.kind==='trigger').id);await page.getByRole('combobox',{name:'目标节点',exact:true}).selectOption(draft.nodes.find(n=>n.kind==='sink').id);await page.locator('.wf-connect-form').getByRole('button',{name:'连接',exact:true}).click();await page.getByRole('button',{name:'演示试运行',exact:true}).click();await page.getByRole('status').filter({hasText:'本次运行：已完成'}).waitFor();report.checks.push('empty-state creation, manual trigger to sink execution','forced-colors edges remain visible');
 await writeFile(output+'/additional-checks.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,minimumContrast:Math.min(...report.contrast.flatMap(mode=>mode.colors.map(c=>c.ratio)))},null,2));
}catch(e){await page.screenshot({path:output+'/audit-failure.png',fullPage:true});throw e;}finally{await browser.close();}
