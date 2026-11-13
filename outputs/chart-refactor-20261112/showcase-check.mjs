import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const output=new URL('./',import.meta.url).pathname;
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1100},reducedMotion:'reduce'});page.setDefaultTimeout(10000);
const errors=[],checks=[];page.on('pageerror',e=>errors.push(e.message));
try{
 for(const route of ['components','blocks','theme','blocks/greenhouse-control','blocks/soil-profile','blocks/device-detail','']){
  await page.goto('http://127.0.0.1:4177/#/'+route);await page.locator('main').waitFor();
  if(route==='blocks/greenhouse-control') {await page.locator('[data-slot="telemetry-chart"]').waitFor();assert.match(await page.locator('[data-slot="telemetry-readout"]').innerText(),/24.6 °C/);}
  if(route==='') await page.getByText('消息接收趋势',{exact:true}).click();
  for(const mode of ['dark','light']){
   await page.evaluate(mode=>document.documentElement.classList.toggle('dark',mode==='dark'),mode);
   await page.setViewportSize({width:1440,height:1100});
   if(['theme','blocks/soil-profile','blocks/greenhouse-control'].includes(route)) await page.screenshot({path:output+`${route.replaceAll('/','-')}-${mode}.png`,fullPage:true});
   if(route==='components'){await page.locator('.catalog-section').first().screenshot({path:output+`catalog-${mode}.png`,style:'.site-header{visibility:hidden}'});}
   if(route==='blocks'){await page.locator('.catalog-tile').filter({hasText:'遥测历史查询'}).screenshot({path:output+`catalog-history-${mode}.png`,style:'.site-header{visibility:hidden}'});}
   await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' '+mode);
   await page.evaluate(()=>{for(const t of ['--body-font-size','--support-font-size','--text-sm'])document.documentElement.style.setProperty(t,'20px')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,route+' 20px '+mode);
   await page.evaluate(()=>document.documentElement.removeAttribute('style'));
  }
  checks.push(route||'home');
 }
 assert.deepEqual(errors,[]);await writeFile(output+'showcase-checks.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
