import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataWorkflow } from '@/components/blocks/data-workflow';
import { workflowSignature, type WorkflowRun } from '@/components/blocks/workflow-model';
import { createWorkflowDemo, summarizeWorkflowDemoNode, workflowTemplates } from './lib/workflow-demo-data';
import { runWorkflowDemo } from './lib/workflow-demo-runner';
import { applySettings } from './lib/theme-storage';
import { defaultSettings } from './lib/theme-settings';
import './index.css';
const params=new URLSearchParams(location.search);
applySettings({...defaultSettings,mode:params.get('mode')==='light'?'light':'dark',fontSize:Number(params.get('font')||14)});
function initial(){const f=createWorkflowDemo();if(params.has('long')){f.name='生态环境多源数据处理与结果追溯'.repeat(5);f.nodes.forEach(n=>{n.label+=' · 跨年度测量站点校核任务'.repeat(5)})}return f;}
function fixed(flow: ReturnType<typeof initial>): WorkflowRun {return {id:'receipt-2026-11-13',workflowId:flow.id,definitionSignature:workflowSignature(flow),status:'failed',startedAt:'2026-11-12T23:59:59Z',finishedAt:'2026-11-13T00:00:02Z',nodes:[
 {nodeId:'event',status:'succeeded',startedAt:'2026-11-12T23:59:59Z',finishedAt:'2026-11-12T23:59:59.100Z',input:0,output:false,attempts:0},
 {nodeId:'parallel',status:'succeeded',input:'',output:[]},
 {nodeId:'water',status:'succeeded',input:[],output:{value:-5,unit:'°C'}},
 {nodeId:'weather',status:'failed',message:'气象数据读取失败：连接不可用。',input:{site:'north-bank'},output:null,attempts:3},
 {nodeId:'join',status:'cancelled'},
 {nodeId:'aggregate',status:'succeeded',input:[18,20,22],output:{value:20,unit:'°C',sampleCount:3}},
 {nodeId:'condition',status:'pending'},
 {nodeId:'notify',status:'skipped',message:'条件未命中'},
 {nodeId:'store',status:'running'},
 {nodeId:'unknown-receipt',status:'failed',message:'回执中的节点不在当前定义中。'}
]};}
function App(){const[flow,setFlow]=useState(initial);const[run,setRun]=useState<WorkflowRun|undefined>(()=>params.has('fixed')?fixed(flow):undefined);return <main style={{padding:16}}><DataWorkflow workflow={flow} onChange={params.has('readonly')?undefined:setFlow} templates={workflowTemplates} getNodeSummary={summarizeWorkflowDemoNode} run={run} onRun={params.has('readonly')?undefined:async(value,context)=>{if(params.has('requestFail'))throw new Error('执行服务不可用');if(params.has('partialFail')){context.onUpdate({...fixed(value),status:'running'});throw new Error('执行服务中断');}if(params.has('delayed'))await new Promise(r=>setTimeout(r,500));return runWorkflowDemo(value,(params.get('scenario')||'normal') as 'normal',context,{delayMs:params.has('slow')?700:20})}}/><button id="change-definition" onClick={()=>setFlow(f=>({...f,name:f.name+' 新版'}))}>替换定义</button><button id="replace-receipt" onClick={()=>setRun(r=>r?{...r,id:r.id+'-new',nodes:r.nodes.map(n=>n.nodeId==='aggregate'?{...n,output:{value:26,unit:'°C',sampleCount:3}}:n)}:r)}>替换回执</button><pre id="host-flow" hidden>{JSON.stringify(flow)}</pre></main>};
createRoot(document.getElementById('root')!).render(<App/>);
