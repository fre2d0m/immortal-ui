import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {writeFile} from 'node:fs/promises';
const out=new URL('./',import.meta.url).pathname;
const b=await chromium.launch({channel:'chrome',headless:true}),results=[];
try {
  const p=await b.newPage({viewport:{width:1200,height:900}});
  for(const mode of ['dark','light']) {
    await p.goto('http://127.0.0.1:4196/header-status-check.html?mode='+mode);await p.locator('.wf-header-states').waitFor();
    await p.locator('.wf-header').screenshot({path:out+`header-${mode}.png`});
    for(const action of [null,'publish','edit','one-issue','two-issues']) {
      if(action)await p.locator('#'+action).click();
      const sample=await p.locator('.wf-header-states').evaluate(e=>{
        const ctx=new OffscreenCanvas(1,1).getContext('2d');
        const rgb=s=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=s;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(c=>c/255)};
        const lum=rgb=>rgb.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);
        const bg=lum(rgb(getComputedStyle(e.closest('.wf-root')).backgroundColor));
        const contrast=color=>{const fg=lum(rgb(color));return(Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)};
        return [...e.querySelectorAll('.wf-header-state')].map(el=>({name:el.dataset.workflowStatus,state:el.dataset.state,text:el.textContent,textContrast:contrast(getComputedStyle(el).color),iconContrast:contrast(getComputedStyle(el.querySelector('svg')).color)}));
      });
      for(const v of sample){assert.ok(v.textContrast>=4.5,JSON.stringify(v));assert.ok(v.iconContrast>=3,JSON.stringify(v));}
      results.push({mode,action,sample});
    }
  }
  await p.emulateMedia({forcedColors:'active',reducedMotion:'reduce'});
  await p.keyboard.press('Tab');await p.locator('[data-workflow-status="publication"]').focus();
  assert.equal(await p.locator('[data-workflow-status="publication"]').evaluate(e=>getComputedStyle(e).outlineStyle),'solid');
  assert.equal((await p.locator('[data-workflow-status="publication"]').innerText()).trim(),'Unpublished changes');
  await p.locator('.wf-header').screenshot({path:out+'forced-colors.png'});
  await writeFile(out+'contrast.json',JSON.stringify(results,null,2));
  console.log({stateSamples:results.length,minText:Math.min(...results.flatMap(r=>r.sample.map(s=>s.textContrast))),minIcon:Math.min(...results.flatMap(r=>r.sample.map(s=>s.iconContrast)))});
}finally{await b.close();}
