import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataWorkflow } from '@/components/blocks/data-workflow';
import { createWorkflowDemo, summarizeWorkflowDemoNode, workflowTemplates } from './lib/workflow-demo-data';
import { runWorkflowDemo } from './lib/workflow-demo-runner';
import { applySettings } from './lib/theme-storage';
import { defaultSettings } from './lib/theme-settings';
import './index.css';
const params=new URLSearchParams(location.search);
applySettings({...defaultSettings,mode:params.get('mode')==='light'?'light':'dark',fontSize:Number(params.get('font')||14)});
function initial(){const flow=createWorkflowDemo();if(params.has('simple')){flow.nodes=flow.nodes.filter(n=>['event','water','weather'].includes(n.id));flow.nodes.forEach((n,i)=>n.position={x:i===0?0:440,y:i===2?280:0});flow.edges=[{id:'connection',source:'event',target:'water',port:'out'}]}if(params.has('empty')){flow.nodes=[];flow.edges=[]}return flow}
function App(){const[flow,setFlow]=useState(initial);const[saved,setSaved]=useState('');return <main style={{padding:16}}><DataWorkflow workflow={flow} onChange={params.has('readonly')?undefined:setFlow} templates={workflowTemplates} getNodeSummary={summarizeWorkflowDemoNode} onSave={params.has('readonly')?undefined:async value=>{if(params.has('failSave'))throw new Error('测试保存失败，草稿保留');setSaved(JSON.stringify(value))}} onRun={params.has('readonly')?undefined:(value,context)=>runWorkflowDemo(value,'normal',context,{delayMs:params.has('slow')?1000:20})}/><pre id="host-flow" hidden>{JSON.stringify(flow)}</pre><pre id="host-saved" hidden>{saved}</pre></main>};
createRoot(document.getElementById('root')!).render(<App/>);
