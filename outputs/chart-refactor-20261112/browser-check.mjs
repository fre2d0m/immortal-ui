import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {writeFile,readFile} from 'node:fs/promises';
const output = new URL('./',import.meta.url).pathname;
const browser = await chromium.launch({channel:'chrome',headless:true});
const context = await browser.newContext({viewport:{width:1440,height:1100},reducedMotion:'reduce'});
const page = await context.newPage();page.setDefaultTimeout(8000);
const errors=[],checks=[],measurements=[];
page.on('pageerror',e=>errors.push(e.message));
const base='http://127.0.0.1:4177/';
const chart=page.locator('[data-slot="telemetry-chart"]');
const readout=page.locator('[data-slot="telemetry-readout"]');
const paths=()=>chart.locator('path[data-series="a"]').evaluateAll(els=>els.map(e=>e.getAttribute('d')));
const noOverflow=async(label)=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,label);
const theme=async(mode)=>{await page.evaluate(mode=>document.documentElement.classList.toggle('dark',mode==='dark'),mode);};
const choose=async(name,option)=>{await page.getByRole('combobox',{name,exact:true}).click();await page.getByRole('option',{name:option,exact:true}).click();};
const download=async()=>{const waiting=page.waitForEvent('download');await page.getByRole('button',{name:'导出 CSV',exact:true}).click();return readFile(await (await waiting).path(),'utf8');};
try{
 await page.goto(base+'#/blocks/telemetry-explorer');await chart.waitFor();
 await page.getByLabel('历史数据场景',{exact:true}).selectOption('known');
 await page.getByText('8 条采样记录',{exact:true}).waitFor();
 assert.match(await readout.innerText(),/2026-01-01 00:15:00 UTC/);assert.match(await readout.innerText(),/20.0 °C/);assert.match(await readout.innerText(),/估算/);assert.equal(await chart.locator('[data-quality="estimated"]').count(),1);
 const initialPaths=await paths();assert.equal(initialPaths.length,2);
 const numbers=initialPaths.map(d=>d.match(/-?\d+(?:\.\d+)?/g).map(Number));
 assert.equal(numbers[0][0],8);assert.ok(Math.abs(numbers[0][2]-39.2)<.0001);assert.equal(numbers[1][0],320);assert.equal(numbers[1][2],632);
 assert.ok(Math.abs(numbers[0][1]-122.6666667)<.0001);assert.equal(numbers[1][1],176);assert.equal(numbers[1][3],16);
 const plot=chart.locator('svg[data-slot="telemetry-plot"]').first();await plot.scrollIntoViewIfNeeded();const box=await plot.boundingBox();
 await page.mouse.move(box.x+box.width*39.2/640,box.y+box.height/2);
 await page.waitForFunction(()=>document.querySelector('[data-slot="telemetry-readout"]').textContent.includes('23:56:00'));
 assert.match(await readout.innerText(),/10.0 °C/);assert.match(await readout.innerText(),/无此时刻采样/);
 const slider=page.getByRole('slider',{name:'查看采样时间',exact:true});await slider.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');await page.keyboard.press('ArrowRight');
 assert.match(await readout.innerText(),/23:58:00/);assert.match(await readout.innerText(),/缺测/);
 await page.keyboard.press('Tab');assert.equal(await page.getByRole('button',{name:'下一个采样',exact:true}).evaluate(el=>el===document.activeElement),true);
 await chart.getByRole('button',{name:'测点 B',exact:true}).click();assert.deepEqual(await paths(),initialPaths);
 assert.equal(await chart.getByRole('button',{name:'测点 B',exact:true}).getAttribute('aria-pressed'),'false');
 await chart.getByRole('button',{name:'测点 B',exact:true}).click();
 const csv=await download();assert.ok(!csv.includes('999'));assert.equal(csv.trim().split('\r\n').length,9);assert.match(csv,/2026-01-01T00:15:00.000Z,"a","测点 A","°C",20,"valid"/);assert.match(csv,/,"missing"/);
 await page.getByRole('tab',{name:'数据表',exact:true}).click();const table=page.getByRole('region',{name:'采样数据表',exact:true});assert.equal(await table.locator('tbody tr').count(),8);assert.match(await table.innerText(),/20.0 °C/);assert.match(await table.innerText(),/估算/);
 await page.getByLabel('开始时间',{exact:true}).fill('2026-01-01T00:00');assert.equal(await download(),csv);await page.getByRole('button',{name:'查询',exact:true}).click();await page.getByText('4 条采样记录',{exact:true}).waitFor();assert.equal((await download()).trim().split('\r\n').length,5);
 checks.push('known input: elapsed-time geometry, shared domain, last-received duplicate, exact pointer/keyboard readings, missing versus absent, table/CSV precision and applied-query context');
 await page.getByLabel('历史数据场景',{exact:true}).selectOption('mixed');await page.getByRole('tab',{name:'趋势图',exact:true}).click();assert.equal(await page.locator('[data-slot="telemetry-unit"]').count(),2);
 for(const scenario of ['single','constant','empty','invalid','extreme']){
  await page.getByLabel('历史数据场景',{exact:true}).selectOption(scenario);
  if(scenario==='empty') assert.equal(await chart.count(),0);
  else if(scenario==='single') {assert.ok(await chart.locator('circle').count()>=1);assert.match(await readout.innerText(),/0.0 °C/);}
  else if(scenario==='invalid'){assert.equal(await chart.locator('svg[data-slot="telemetry-plot"]').count(),0);await page.getByRole('tab',{name:'数据表',exact:true}).click();assert.match(await table.innerText(),/缺测/);assert.match(await table.innerText(),/无效/);await page.getByRole('tab',{name:'趋势图',exact:true}).click();}
  else {assert.ok(!(await chart.innerHTML()).includes('NaN'));if(scenario==='extreme') assert.match(await chart.innerText(),/超界已扩展/);}
 }
 checks.push('single, constant, missing/invalid/empty and extreme datasets; different units split into separate panels');
 await page.getByLabel('历史数据场景',{exact:true}).selectOption('mixed');
 for(const mode of ['dark','light']){
  await theme(mode);await page.setViewportSize({width:1440,height:1100});await chart.screenshot({style:'.site-header{visibility:hidden}',path:output+`history-${mode}.png`});
  const contrast=await page.evaluate(()=>{
   const ctx=document.createElement('canvas').getContext('2d');const root=getComputedStyle(document.documentElement);
   const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3).map(n=>n/255);};
   const luminance=c=>rgb(c).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
   const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
   const colors=['--card','--surface-top','--surface-bottom'].map(n=>root.getPropertyValue(n));
   const text=[...document.querySelectorAll('[data-slot="telemetry-chart"] .text-muted-foreground')].map(e=>getComputedStyle(e).color);
   const traces=[...document.querySelectorAll('[data-slot="telemetry-chart"] path[data-series]')].map(e=>getComputedStyle(e).stroke);
   return {text:Math.min(...text.flatMap(c=>colors.map(b=>ratio(c,b)))),trace:Math.min(...traces.flatMap(c=>colors.map(b=>ratio(c,b))))};
  });assert.ok(contrast.text>=4.5,JSON.stringify(contrast));assert.ok(contrast.trace>=3,JSON.stringify(contrast));measurements.push({mode,...contrast});
  await page.setViewportSize({width:320,height:900});await noOverflow('history '+mode);await chart.screenshot({style:'.site-header{visibility:hidden}',path:output+`history-mobile-${mode}.png`});
  await page.evaluate(()=>{for(const token of ['--body-font-size','--support-font-size','--text-sm']) document.documentElement.style.setProperty(token,'20px');});await noOverflow('history 20px '+mode);await chart.screenshot({style:'.site-header{visibility:hidden}',path:output+`history-large-text-${mode}.png`});
  await page.evaluate(()=>document.documentElement.removeAttribute('style'));
 }
 checks.push('history light/dark, 320px reflow and 20px text, measured text >=4.5:1 and trace >=3:1');
 await page.setViewportSize({width:1440,height:1100});await page.goto(base+'#/components/metric-card');await page.locator('[data-slot="metric-trend"]').waitFor();
 const normalPoints=await page.locator('[data-slot="metric-trend"] polyline').last().getAttribute('points');
 await choose('数据场景','零值');assert.match(await page.locator('[data-slot="data-card-value"]').innerText(),/0.0/);assert.notEqual(await page.locator('[data-slot="metric-trend"] polyline').last().getAttribute('points'),normalPoints);
 await choose('数据场景','跨年窗口');assert.match(await page.locator('[data-slot="metric-trend"]').innerText(),/2025-12-31/);assert.match(await page.locator('[data-slot="metric-trend"]').innerText(),/2026-01-01/);
 for(const scenario of ['单点','常量','无效数据','无数据','负值','超出范围','不规则采样与长缺口']) await choose('数据场景',scenario);
 await choose('卡片内可视化','范围');await choose('数据场景','超出范围');assert.match(await page.locator('[data-slot="metric-range"]').innerText(),/高于量程 58.6/);
 await page.goto(base+'#/components/indicator-card');await page.locator('[data-slot="indicator-card"]').waitFor();
 const aggregate=await page.evaluate(async()=>{const {dataCardDemo}=await import('/src/lib/data-card-demo-data.ts');const d=dataCardDemo();return {value:d.result.value,count:d.result.sampleCount,expected:d.result.expectedCount,sum:d.result.inputs.reduce((n,p)=>n+(p.value??0),0),last:d.calculations.at(-1).value,previous:d.previousResult.value};});
 assert.equal(aggregate.count,87);assert.equal(aggregate.expected,90);assert.ok(Math.abs(aggregate.sum/87-24.6)<1e-10);assert.equal(aggregate.value,aggregate.last);assert.equal(aggregate.previous,24.2);assert.match(await page.locator('[data-slot="indicator-card"]').innerText(),/87 \/ 90/);assert.match(await page.locator('[data-slot="indicator-card"]').innerText(),/\+0.4 °C/);
 checks.push('metric alternate input changes value/path/range together; indicator mean 24.6 = sum / 87, same last result and +0.4 comparison');
 await page.goto(base+'outputs/chart-refactor-20261112/fixture.html');await chart.waitFor();const fixtureSlider=page.getByRole('slider',{name:'查看采样时间'});await fixtureSlider.focus();await page.keyboard.press('Home');await page.keyboard.press('ArrowRight');assert.match(await readout.innerText(),/00:01:00/);
 await page.getByRole('button',{name:'插入历史样本',exact:true}).click();assert.match(await readout.innerText(),/00:01:00/);assert.match(await readout.innerText(),/10.0 °C/);
 await page.getByRole('button',{name:'移除所选样本',exact:true}).click();assert.match(await readout.innerText(),/所选采样不在当前窗口/);await page.getByRole('button',{name:'返回最新采样'}).click();assert.match(await readout.innerText(),/00:02:00/);
 assert.equal(await page.locator('[data-slot="range-position"]').getAttribute('style'),'left: 0%;');
 const bars=await page.locator('[data-slot="interval-bar"]').evaluateAll(els=>els.map(el=>({left:parseFloat(el.style.left),width:parseFloat(el.style.width)})));assert.ok(Math.abs(bars[0].width-100/3)<.001);assert.ok(Math.abs(bars[1].width-200/3)<.001);assert.equal(bars.length,2);
 assert.match(await page.getByRole('region',{name:'净能量时段比较时段比较表'}).innerText(),/-10.0/);assert.match(await page.locator('main').innerText(),/未提供有效安装深度/);assert.match(await page.locator('#invalid-times').innerText(),/2 条记录的时间无效/);
 await page.getByRole('button',{name:'更换读数',exact:true}).click();assert.equal(await page.locator('[data-slot="range-position"]').getAttribute('style'),'left: 100%;');assert.match(await page.locator('[data-slot="metric-range"]').innerText(),/高于量程 60.0/);
 checks.push('live insertion retains inspected timestamp; missing selected sample is explicit; minimum/outlier track markers; signed bars and unknown soil positions');
 for(const mode of ['dark','light']){
  await theme(mode);
  for(const width of [505,288]){await page.locator('#card-width').evaluate((el,w)=>el.style.width=w+'px',width);await page.locator('#card-width').screenshot({path:output+`card-${width}-${mode}.png`});assert.equal(await page.locator('#card-width').evaluate(e=>e.scrollWidth>e.clientWidth),false);}
  await page.setViewportSize({width:320,height:900});await noOverflow('fixture '+mode);await page.evaluate(()=>{for(const token of ['--body-font-size','--support-font-size','--text-sm']) document.documentElement.style.setProperty(token,'20px');});await noOverflow('fixture large text '+mode);await page.locator('main').screenshot({path:output+`edges-large-text-${mode}.png`});await page.evaluate(()=>document.documentElement.removeAttribute('style'));await page.setViewportSize({width:1440,height:1100});
 }
 await page.emulateMedia({forcedColors:'active'});await chart.screenshot({style:'.site-header{visibility:hidden}',path:output+'forced-colors.png'});assert.equal(await chart.locator('circle').first().evaluate(e=>getComputedStyle(e).fill),'rgb(0, 0, 0)');await page.emulateMedia({forcedColors:'none'});
 checks.push('505px and 288px cards, long labels, all edge figures at 320px/20px, forced system colors and reduced-motion preference');
 const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});const mobile=await touch.newPage();await mobile.goto(base+'#/blocks/telemetry-explorer');await mobile.getByLabel('历史数据场景',{exact:true}).selectOption('known');const touchPlot=mobile.locator('[data-slot="telemetry-plot"]').first();await touchPlot.scrollIntoViewIfNeeded();const touchBox=await touchPlot.boundingBox();await mobile.touchscreen.tap(touchBox.x+touchBox.width*.5,touchBox.y+touchBox.height*.5);assert.match(await mobile.locator('[data-slot="telemetry-readout"]').innerText(),/00:05:00/);await mobile.getByRole('button',{name:'上一个采样',exact:true}).tap();assert.match(await mobile.locator('[data-slot="telemetry-readout"]').innerText(),/23:58:00/);await touch.close();checks.push('touch selects an actual sample and 40px previous/next controls work');
 assert.deepEqual(errors,[]);
 await writeFile(output+'browser-checks.json',JSON.stringify({browser:await browser.version(),checks,measurements,aggregate,errors},null,2));console.log(JSON.stringify({checks,measurements,aggregate,errors},null,2));
}catch(e){await page.screenshot({path:output+'browser-failure.png',fullPage:true});throw e;}finally{await browser.close();}
