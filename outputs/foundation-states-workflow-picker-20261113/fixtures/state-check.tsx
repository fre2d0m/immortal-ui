import { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Tabs as Primitive, RadioGroup, DropdownMenu } from 'radix-ui';
import { Database } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './components/ui/tabs';
import { Checkbox } from './components/ui/checkbox';
import { Switch } from './components/ui/switch';
import { Slider } from './components/ui/slider';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { WorkflowStepPicker } from '../registry/immortal/blocks/workflow-parts';
import '../registry/immortal/blocks/data-workflow.css';
import './index.css';
import { applySettings } from './lib/theme-storage';
import { defaultSettings } from './lib/theme-settings';
const params=new URLSearchParams(location.search);
applySettings({...defaultSettings, mode: params.get('mode')==='light'?'light':'dark', fontSize:Number(params.get('font')||14)});
function Example({id,variant='default',orientation='horizontal',manual=false}:{id:string,variant?:'default'|'line',orientation?:'vertical'|'horizontal',manual?:boolean}){
 return <section id={id}><h2>{id}</h2><Tabs defaultValue="one" orientation={orientation} activationMode={manual?'manual':'automatic'}><TabsList variant={variant} aria-label={id}><TabsTrigger value="one">观测数据</TabsTrigger><TabsTrigger value="two">处理结果</TabsTrigger><TabsTrigger value="three" disabled>未开放</TabsTrigger></TabsList><TabsContent value="one">观测记录</TabsContent><TabsContent value="two">处理记录</TabsContent></Tabs></section>;
}
function App(){
 const container=useRef<HTMLDivElement>(null), opener=useRef<HTMLButtonElement>(null);
 const [point,setPoint]=useState<{x:number,y:number}|null>(null),[chosen,setChosen]=useState(''),[filter,setFilter]=useState(false);
 const choices=Array.from({length:50},(_,i)=>({id:`new:${i}`,label:`数据处理节点 ${i+1}`,description:i===49?'最后一个节点，用于核对列表末端的键盘访问。':'核对输入记录、处理结果与异常分发',group:i<25?'数据处理':'输出与异常',icon:<Database/>})).concat(Array.from({length:30},(_,i)=>({id:`existing:${i}`,label:`已有节点 ${i+1}`,description:'已在当前流程中配置',group:'现有步骤',icon:<Database/>,existing:true})));
 return <main style={{padding:16,maxWidth:1000,margin:'auto'}}>
 <style>{`section {margin:0 0 24px} h2{font-size:1em;margin:0 0 12px;font-weight:500} .audit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,380px),1fr));gap:24px}.audit-controls{display:flex;align-items:center;flex-wrap:wrap;gap:16px;margin:16px 0}.audit-label{display:flex;align-items:center;gap:8px}`}</style>
 <Button ref={opener} id="open-picker" onClick={event=>{const r=event.currentTarget.getBoundingClientRect();setPoint({x:r.x,y:r.bottom});}}>打开长列表</Button><output id="chosen">{chosen}</output>
 <div className="audit-grid" style={{marginTop:24}}>
 <Example id="default"/><Example id="line" variant="line"/><Example id="vertical" orientation="vertical"/><Example id="vertical-line" orientation="vertical" variant="line"/><Example id="manual" manual/>
 <section id="fallback"><h2>未带滑块的上游 Tabs</h2><Primitive.Root defaultValue="one" data-slot="tabs"><Primitive.List data-slot="tabs-list" data-variant="default"><Primitive.Trigger data-slot="tabs-trigger" value="one">观测数据</Primitive.Trigger><Primitive.Trigger data-slot="tabs-trigger" value="two">处理结果</Primitive.Trigger></Primitive.List><Primitive.Content value="one">观测记录</Primitive.Content><Primitive.Content value="two">处理记录</Primitive.Content></Primitive.Root></section>
 </div>
 <section id="related"><h2>不同职责的基础控件</h2>
 <nav className="audit-controls" id="navigation"><a data-slot="navigation-link" href="#overview" aria-current="page">设备概览</a><a data-slot="navigation-link" href="#history">历史数据</a></nav>
 <div className="audit-controls" id="filters"><button data-slot="filter-chip" aria-pressed="true">已选筛选</button><button data-slot="filter-chip" aria-pressed={filter} onClick={()=>setFilter(!filter)}>另一个筛选</button></div>
 <RadioGroup.Root defaultValue="auto" className="audit-controls" id="segments" aria-label="工作模式"><RadioGroup.Item data-slot="segmented-control-item" value="auto">自动</RadioGroup.Item><RadioGroup.Item data-slot="segmented-control-item" value="manual">手动</RadioGroup.Item></RadioGroup.Root>
 <div className="audit-controls"><label className="audit-label"><Checkbox id="check"/>启用规则</label><label className="audit-label"><Switch id="switch"/>接收数据</label><Checkbox aria-label="禁用复选框" disabled/><Button id="action">执行操作</Button><Button disabled>不可操作</Button></div>
 <div className="audit-controls"><Input id="readonly" readOnly value="只读内容" aria-label="只读输入"/><Input id="input" placeholder="可编辑内容" aria-label="可编辑输入"/></div>
 <Slider id="slider" aria-label="采样比例" defaultValue={[40]} max={100}/>
 <DropdownMenu.Root><DropdownMenu.Trigger asChild><Button id="menu" style={{marginTop:24}}>打开选项</Button></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content data-slot="dropdown-menu-content"><DropdownMenu.CheckboxItem data-slot="dropdown-menu-checkbox-item" checked>显示数据<DropdownMenu.ItemIndicator>✓</DropdownMenu.ItemIndicator></DropdownMenu.CheckboxItem><DropdownMenu.Item data-slot="dropdown-menu-item">查看详情</DropdownMenu.Item></DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>
 </section>
 <div ref={container} className="wf-root" style={{border:0,background:"transparent"}}/>
 {point&&<WorkflowStepPicker point={point} title="选择下一步" context={params.has('long')?'合并多源观测与跨站点环境记录的异常处理步骤 / 失败':'合并多源观测 / 失败'} choices={choices} container={container} onChoose={id=>{setChosen(id);setPoint(null)}} onClose={()=>setPoint(null)} onRestoreFocus={()=>opener.current?.focus()}/>}
 </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
