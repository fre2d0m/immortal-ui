import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {DataWorkflow} from '@/components/blocks/data-workflow';
import {createWorkflowDemo,summarizeWorkflowDemoNode,workflowTemplates} from './lib/workflow-demo-data';
import {runWorkflowDemo} from './lib/workflow-demo-runner';
import {applySettings} from './lib/theme-storage';
import {defaultSettings} from './lib/theme-settings';
import './index.css';
const params=new URLSearchParams(location.search);
applySettings({...defaultSettings,mode:params.get('mode')==='light'?'light':'dark',fontSize:Number(params.get('font')||14),primary:'#5865d9'});
function App(){const [flow,setFlow]=useState(createWorkflowDemo);const [save,setSave]=useState(true);const [run,setRun]=useState(true);
return <main style={{padding:16}}><DataWorkflow workflow={flow} onChange={setFlow} templates={workflowTemplates} getNodeSummary={summarizeWorkflowDemoNode} onSave={save?async()=>{await new Promise(resolve=>setTimeout(resolve,500));}:undefined} onRun={run?(f,c)=>runWorkflowDemo(f,'normal',c,{delayMs:20}):undefined}/><fieldset style={{display:'flex',gap:16,marginTop:16}}><legend>验收宿主能力切换</legend><label><input type="checkbox" aria-label="提供保存" checked={save} onChange={e=>setSave(e.target.checked)}/>提供保存</label><label><input type="checkbox" aria-label="提供运行" checked={run} onChange={e=>setRun(e.target.checked)}/>提供运行</label></fieldset></main>}
createRoot(document.getElementById('root')!).render(<App/>);
