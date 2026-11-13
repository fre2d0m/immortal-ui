import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DataWorkflow } from '@/components/blocks/data-workflow';
import { workflowSignature, type WorkflowPublication } from '@/components/blocks/workflow-model';
import { createWorkflowDemo, summarizeWorkflowDemoNode, workflowTemplates } from './lib/workflow-demo-data';
import { runWorkflowDemo } from './lib/workflow-demo-runner';
import { applySettings } from './lib/theme-storage';
import { defaultSettings } from './lib/theme-settings';
import './index.css';
const params=new URLSearchParams(location.search);
applySettings({...defaultSettings,mode:params.get('mode')==='light'?'light':'dark',fontSize:Number(params.get('font')||14)});
function initial(){const flow=createWorkflowDemo();if(params.has('long'))flow.nodes.forEach(n=>n.label+='，跨年度观测复核任务'.repeat(8));return flow;}
function App(){
 const [flow,setFlow]=useState(initial);
 const [publication,setPublication]=useState<WorkflowPublication|undefined>(()=>params.has('unknown')?undefined:{workflowId:flow.id,status:'draft'});
 return <main style={{padding:16}}><DataWorkflow workflow={flow} publication={publication} onChange={setFlow} templates={workflowTemplates} getNodeSummary={summarizeWorkflowDemoNode} onSave={async()=>{}} onRun={(v,c)=>runWorkflowDemo(v,(params.get('scenario')||'normal') as 'normal',c,{delayMs:20})}/>
 <div aria-label="验收宿主控制">
 <button id="publish" onClick={()=>setPublication({workflowId:flow.id,status:'published',definitionSignature:workflowSignature(flow)})}>模拟宿主发布回执</button>
 <button id="unpublish" onClick={()=>setPublication({workflowId:flow.id,status:'draft'})}>模拟宿主草稿状态</button>
 <button id="mismatched" onClick={()=>setPublication({workflowId:'another',status:'published',definitionSignature:workflowSignature(flow)})}>其他流程记录</button>
 <button id="move" onClick={()=>setFlow(f=>({...f,nodes:f.nodes.map((n,i)=>i===0?{...n,position:{x:n.position.x+20,y:n.position.y+20}}:n)}))}>移动布局</button>
 <button id="edit" onClick={()=>setFlow(f=>({...f,nodes:f.nodes.map(n=>n.id==='condition'?{...n,parameters:n.parameters.map(p=>p.key==='threshold'?{...p,value:Number(p.value)+1}:p)}:n)}))}>修改条件</button>
 <button id="one-issue" onClick={()=>setFlow(f=>({...f,nodes:f.nodes.map(n=>n.id==='condition'?{...n,label:''}:n)}))}>一个问题</button>
 <button id="two-issues" onClick={()=>setFlow(f=>({...f,nodes:f.nodes.map(n=>['condition','water'].includes(n.id)?{...n,label:''}:n)}))}>两个问题</button>
 <button id="fix" onClick={()=>setFlow(initial())}>修复定义</button>
 <button id="add-node" onClick={()=>setFlow(f=>({...f,nodes:[...f.nodes,{...f.nodes[0],id:'extra-'+f.nodes.length}]}))}>增加节点</button>
 <button id="empty" onClick={()=>setFlow(f=>({...f,nodes:[],edges:[]}))}>空节点</button>
 </div>
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
