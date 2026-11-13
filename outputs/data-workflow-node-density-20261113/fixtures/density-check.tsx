import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataWorkflow, workflowSignature } from '@/components/blocks/data-workflow';
import type { WorkflowDefinition, WorkflowNodeSummary, WorkflowRun } from '@/components/blocks/workflow-model';
import { createWorkflowDemo, summarizeWorkflowDemoNode, workflowTemplates } from './lib/workflow-demo-data';
import { Button } from './components/ui/button';
import { applySettings } from './lib/theme-storage';
import { defaultSettings } from './lib/theme-settings';
import './index.css';
const params=new URLSearchParams(location.search);
applySettings({...defaultSettings,mode:params.get('mode')==='light'?'light':'dark',fontSize:Number(params.get('font')||14)});
function focused():WorkflowDefinition {
 const flow=createWorkflowDemo();flow.nodes.forEach(n=>n.position={x:n.position.x,y:n.position.y-700});return flow;
}
function App(){
 const [flow,setFlow]=useState(focused),[summary,setSummary]=useState<WorkflowNodeSummary|null>(null),[run,setRun]=useState<WorkflowRun|undefined>();
 const [view,setView]=useState('store');
 function portScene(count:number){const next=createWorkflowDemo();next.nodes.find(n=>n.id==='condition')!.position={x:0,y:0};next.nodes.find(n=>n.id==='aggregate')!.position={x:count===4?360:-360,y:0};next.nodes.find(n=>n.id==='notify')!.position={x:360,y:-160};next.nodes.find(n=>n.id==='store')!.position={x:360,y:160};next.nodes.find(n=>n.id==='failure')!.position={x:360,y:320};next.edges.push({id:'condition-error',source:'condition',target:'failure',port:'error'});setFlow(next);setView('condition');setRun(undefined)}
 function status(status:'succeeded'|'failed'|'running'|'pending'|'skipped'|'cancelled') {setRun({id:'known-receipt',workflowId:flow.id,definitionSignature:workflowSignature(flow),status,startedAt:'2026-11-13T00:00:00Z',nodes:[{nodeId:view,status,startedAt:'2026-11-13T00:00:00Z',finishedAt:'2026-11-13T00:00:00.125Z'}]})}
 return <main style={{padding:16}}><div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>
 <Button onClick={()=>{setFlow(focused());setSummary(null);setRun(undefined);setView('store')}}>归档示例</Button>
 {[0,1,2,3].map(count=><Button key={count} onClick={()=>setSummary({type:'fields',fields:[{label:'目标',value:'environment-observations'},{label:'重试',value:0},{label:'覆盖',value:false}].slice(0,count)})}>{count} 行摘要</Button>)}
 <Button onClick={()=>setSummary({type:'fields',fields:[{label:'目标',value:''},{label:'标签',value:null},{label:'校验',value:false}]})}>空值摘要</Button>
 <Button onClick={()=>{setFlow({...flow,nodes:flow.nodes.map(n=>n.id==='store'?{...n,label:'跨流域生态环境观测与人工复核分发节点'.repeat(5),parameters:n.parameters.map(p=>p.key==='destination'?{...p,value:'environment-observations-'.repeat(10)}:p)}:n)});setSummary(null)}}>长名称与目标</Button>
 <Button onClick={()=>portScene(3)}>三个同侧出口</Button><Button onClick={()=>portScene(4)}>四个同侧端点</Button>
 {(['succeeded','failed','running','pending','skipped','cancelled'] as const).map(value=><Button key={value} onClick={()=>status(value)}>{value}</Button>)}
 <Button onClick={()=>setRun(undefined)}>清除回执</Button>
 </div><DataWorkflow workflow={flow} onChange={setFlow} templates={workflowTemplates} getNodeSummary={n=>n.id==='store'&&summary?summary:summarizeWorkflowDemoNode(n)} run={run} initialViewport={{x:params.has("narrow")?20:80,y:100,zoom:1}}/><pre id="host-flow" style={{maxHeight:80,overflow:'auto'}}>{JSON.stringify(flow)}</pre></main>
}
createRoot(document.getElementById('root')!).render(<App/>);
