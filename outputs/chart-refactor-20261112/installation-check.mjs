import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
const output=new URL('./',import.meta.url).pathname;
const consumer=(await readFile(output+'consumer-path.txt','utf8')).trim();
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1100},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:4196');await page.locator('[data-slot="telemetry-chart"]').waitFor();
 const slider=page.getByRole('slider',{name:'查看采样时间'});await slider.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');assert.match(await page.locator('[data-slot="telemetry-readout"]').innerText(),/10.0 °C/);
 await page.getByRole('button',{name:'插入历史样本',exact:true}).click();assert.match(await page.locator('[data-slot="telemetry-readout"]').innerText(),/00:01:00/);
 await page.getByRole('button',{name:'更换读数',exact:true}).click();assert.match(await page.locator('[data-slot="metric-range"]').innerText(),/高于量程 60.0/);
 assert.match(await page.locator('#invalid-times').innerText(),/2 条记录的时间无效/);
 const table=page.getByRole('region',{name:'净能量时段比较时段比较表'});assert.match(await table.innerText(),/-10.0/);assert.match(await table.innerText(),/无效/);assert.match(await table.innerText(),/缺测/);
 assert.equal(await page.locator('[data-slot="interval-bar"]').count(),2);
 await page.screenshot({path:output+'installed-consumer.png',fullPage:true});
 await page.setViewportSize({width:320,height:900});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth),320);
 await page.evaluate(()=>document.documentElement.classList.remove('dark'));await page.screenshot({path:output+'installed-mobile-light.png',fullPage:true});
 assert.deepEqual(errors,[]);
 const checks=['shadcn CLI independent installation of Graphite, Metric/Indicator, Telemetry Explorer, interval bars and Soil Profile','independent TypeScript check and production build','keyboard exact readings and live timestamp retention','out-of-range position track, signed bars, empty/invalid records and rejected timestamps','320px reflow in installed production build'];
 await writeFile(output+'installation-checks.json',JSON.stringify({consumer,checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
