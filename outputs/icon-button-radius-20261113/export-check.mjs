import {chromium} from 'playwright';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const out=new URL('./',import.meta.url).pathname;
const b=await chromium.launch({channel:'chrome',headless:true});
try {
 const p=await b.newPage({viewport:{width:1440,height:1000}});p.setDefaultTimeout(8000);
 await p.goto('http://127.0.0.1:4177/#/theme');await p.locator('#open-theme-editor').click();
 await p.getByText('基础尺寸与间距',{exact:true}).click();
 await p.getByText('文字按钮与按钮组使用胶囊形',{exact:true}).waitFor();
 const pending=p.waitForEvent('download');await p.getByRole('button',{name:'下载主题 CSS',exact:true}).click();const file=await pending;
 const path=out+'exported-theme.css';await file.saveAs(path);
 const content=await readFile(path,'utf8'),source=await readFile('registry/immortal/styles/graphite.css','utf8');
 assert.ok(content.startsWith(source));assert.match(content,/border-radius: 50%;/);assert.ok(content.includes('--button-radius: 6px'));
 await writeFile(out+'export-check.json',JSON.stringify({sourceMatches:true,defaultTextRadius:'6px',iconRadius:'50%',filename:file.suggestedFilename()},null,2));console.log('Theme export matches shared source with current settings.');
}finally{await b.close();}
