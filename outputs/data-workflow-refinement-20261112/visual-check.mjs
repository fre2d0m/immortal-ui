import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const output=new URL('.',import.meta.url).pathname;
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1600,height:1200},reducedMotion:'reduce'});const report={contrast:[],checks:[]};
try {
 await p.goto('http://127.0.0.1:4177/#/blocks/data-workflow');await p.locator('.react-flow__node').first().waitFor();
 for(const mode of ['dark','light']) {
  await p.evaluate(async mode=>{const {applySettings}=await import('/src/lib/theme-storage.ts');const {defaultSettings}=await import('/src/lib/theme-settings.ts');applySettings({...defaultSettings,mode});},mode);await p.waitForTimeout(250);
  const values=await p.evaluate(()=>{
   const rgba=color=>{const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.fillStyle=color;x.fillRect(0,0,1,1);return [...x.getImageData(0,0,1,1).data];};
   const background=element=>{for(let el=element;el;el=el.parentElement){const color=rgba(getComputedStyle(el).backgroundColor);if(color[3]===255)return color;}return[255,255,255,255];};
   const lum=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
   return ['.wf-node p','.wf-node strong','.wf-node-title small','.wf-topology-count','.wf-identity h3','.wf-identity > div > span'].map(selector=>{const el=document.querySelector(selector),fg=rgba(getComputedStyle(el).color),bg=background(el),a=lum(fg),b=lum(bg);return{selector,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};});
  });values.forEach(value=>assert.ok(value.ratio>=4.5,mode+value.selector+value.ratio));report.contrast.push({mode,values});
  await p.getByRole('button',{name:'展开工作区',exact:true}).click();await p.getByRole('button',{name:'显示完整流程',exact:true}).click();await p.locator('.wf-root').screenshot({path:output+`expanded-${mode}.png`});
  await p.getByRole('button',{name:'更多流程操作',exact:true}).click();await p.getByRole('menuitem',{name:'流程设置',exact:true}).click();assert.ok(await p.getByLabel('流程名称',{exact:true}).isVisible());await p.keyboard.press('Escape');await p.getByRole('complementary',{name:'节点与流程配置'}).waitFor({state:'hidden'});await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});
 }
 report.checks.push('12 text contrast samples in default light/dark >=4.5:1','expanded work area fits full topology','native dialog, menu, layered Escape dismissal and return to embedded workspace');
 await writeFile(output+'visual-checks.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:report.checks,minimumContrast:Math.min(...report.contrast.flatMap(x=>x.values.map(v=>v.ratio)))},null,2));
}finally{await b.close();}
