import {createRoot} from 'react-dom/client';
import {useState} from 'react';
import {DataWorkflow} from './components/blocks/data-workflow';
import {createWorkflowDemo,workflowTemplates,summarizeWorkflowDemoNode} from './demo';
import './index.css';
const params=new URLSearchParams(location.search);
document.documentElement.classList.toggle('dark',params.get('mode')!=='light');
function App(){const [flow,setFlow]=useState(createWorkflowDemo());return <main style={{padding:16}}><p style={{marginBottom:16}}>独立安装验证 · 演示数据</p><DataWorkflow workflow={flow} onChange={setFlow} templates={workflowTemplates} getNodeSummary={summarizeWorkflowDemoNode}/><pre id="host-state" style={{maxHeight:100,overflow:'auto'}}>{JSON.stringify(flow)}</pre></main>}
createRoot(document.getElementById('root')!).render(<App/>);
