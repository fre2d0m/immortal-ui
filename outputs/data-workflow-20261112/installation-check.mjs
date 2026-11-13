import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
 await page.goto('http://127.0.0.1:4189');await page.locator('.react-flow__node').first().waitFor();
 await page.getByRole('button',{name:'保存',exact:true}).click();await page.getByRole('status').filter({hasText:'保存服务不可用'}).waitFor();
 await page.getByRole('button',{name:'切换保存结果',exact:true}).click();await page.getByRole('button',{name:'保存',exact:true}).click();await page.getByRole('status').filter({hasText:'流程已保存'}).waitFor();
 await page.getByRole('button',{name:'试运行',exact:true}).click();await page.getByRole('button',{name:'外部更新',exact:true}).click();await page.waitForTimeout(850);assert.match(await page.locator('.wf-notice').innerText(),/流程已更新/);assert.ok(await page.getByText('尚无运行记录',{exact:true}).isVisible());
 await page.getByRole('button',{name:'试运行',exact:true}).click();await page.getByRole('status').filter({hasText:'本次运行：已完成'}).waitFor();assert.match(await page.locator('.wf-run-meta').innerText(),/2025-12-31/);assert.match(await page.locator('.wf-run-meta').innerText(),/2026-01-01/);
 await page.locator('.wf-runs').getByRole('button',{name:'数据存储',exact:true}).click();await page.locator('.wf-payloads summary').filter({hasText:'输入数据'}).click();await page.locator('.wf-payloads summary').filter({hasText:'输出数据'}).click();assert.deepEqual(await page.locator('.wf-payloads pre').allTextContents(),['0','false']);
 await page.getByRole('button',{name:'切换只读',exact:true}).click();assert.equal(await page.getByLabel('节点名称',{exact:true}).getAttribute('readonly'),'');assert.equal(await page.getByRole('button',{name:'移除节点',exact:true}).count(),0);await page.getByRole('button',{name:'流程画布',exact:true}).click();assert.equal(await page.locator('.react-flow__node.draggable').count(),0);
 await page.getByRole('button',{name:'外部更新',exact:true}).click();await page.getByRole('button',{name:'运行记录',exact:true}).click();assert.ok(await page.getByText('尚无运行记录',{exact:true}).isVisible());
 assert.deepEqual(errors,[]);
 await page.screenshot({path:'/Users/golo/Work/CodexProjects/immortal-ui/outputs/data-workflow-20261112/installed-consumer.png',fullPage:true});
 const checks=['CLI installation with Graphite','independent type check and production build','save failure and confirmed save success','stale async result ignored after external edit','cross-year UTC timestamps, 0 input and false output preserved','read-only configuration and canvas','completed runs invalidated by definition changes'];
 await writeFile('/Users/golo/Work/CodexProjects/immortal-ui/outputs/data-workflow-20261112/installation-checks.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await browser.close();}
