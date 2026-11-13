import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
const output = new URL('.',import.meta.url).pathname;
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1280,height:1100},reducedMotion:'reduce'});const errors=[];p.on('pageerror',e=>errors.push(e.message));
try {
 await p.goto('http://127.0.0.1:4189');await p.locator('.react-flow__node').first().waitFor();
 await p.getByRole('button',{name:'保存草稿',exact:true}).click();await p.getByRole('status').filter({hasText:'保存服务不可用'}).waitFor();await p.getByRole('button',{name:'切换保存结果',exact:true}).click();await p.getByRole('button',{name:'保存草稿',exact:true}).click();await p.getByRole('status').filter({hasText:'草稿已保存'}).waitFor();
 await p.getByRole('button',{name:'测试流程',exact:true}).click();await p.getByRole('button',{name:'外部更新',exact:true}).click();await p.waitForTimeout(850);assert.match(await p.locator('.wf-notice').innerText(),/流程已更新/);assert.ok(await p.getByText('暂无本次运行记录',{exact:true}).isVisible());
 await p.getByRole('button',{name:'测试流程',exact:true}).click();await p.getByRole('status').filter({hasText:'本次运行：已完成'}).waitFor();assert.ok(await p.locator('.wf-canvas').isVisible());assert.match(await p.locator('.wf-run-meta').innerText(),/2025-12-31/);assert.match(await p.locator('.wf-run-meta').innerText(),/2026-01-01/);
 await p.locator('.wf-runs').getByRole('button',{name:'数据存储',exact:true}).click();assert.deepEqual(await p.locator('.wf-payload pre').allTextContents(),['0','false']);
 await p.getByRole('tab',{name:'配置',exact:true}).click();await p.getByLabel('专用字段映射',{exact:true}).fill('payload.value');assert.equal(await p.getByLabel('专用字段映射',{exact:true}).inputValue(),'payload.value');await p.getByRole('button',{name:'撤销',exact:true}).click();assert.equal(await p.getByLabel('专用字段映射',{exact:true}).inputValue(),'');
 await p.getByRole('button',{name:'切换只读',exact:true}).click();assert.equal(await p.getByLabel('节点名称',{exact:true}).getAttribute('readonly'),'');assert.equal(await p.getByLabel('专用字段映射',{exact:true}).getAttribute('readonly'),'');assert.equal(await p.getByRole('button',{name:'移除节点',exact:true}).count(),0);assert.equal(await p.locator('.react-flow__node.draggable').count(),0);
 await p.getByRole('button',{name:'外部更新',exact:true}).click();assert.ok(await p.getByText('暂无本次运行记录',{exact:true}).isVisible());assert.equal(await p.getByRole('button',{name:'撤销',exact:true}).count(),0);
 assert.deepEqual(errors,[]);await p.locator('.wf-root').screenshot({path:output+'installed-consumer.png'});
 const checks=['CLI installs six source files including shared Tabs, no Panel','independent typecheck and production bundle','save failure and acknowledged success','stale run ignored after external definition update','canvas persists, cross-year UTC dates, 0 input and false output','host-specific field configuration participates in undo and read-only behavior','read-only canvas and external run invalidation'];
 await writeFile(output+'installation-checks.json',JSON.stringify({checks,errors},null,2));console.log(JSON.stringify({checks,errors},null,2));
}finally{await b.close();}
