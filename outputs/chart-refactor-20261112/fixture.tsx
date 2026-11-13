import {useState} from 'react';
import {createRoot} from 'react-dom/client';
import '../../src/index.css';
import {TelemetryExplorer} from '@/components/blocks/telemetry-explorer';
import {TelemetryChart} from '@/components/iot/telemetry-chart';
import {MetricCard} from '@/components/iot/metric-card';
import {RangeGauge} from '@/components/iot/range-gauge';
import {DailyHistogram} from '@/components/iot/daily-histogram';
import {SoilProfile} from '@/components/blocks/soil-profile';
import {Button} from '@/components/ui/button';
const now=Date.UTC(2026,0,1);
const initial=[{timestamp:now,value:0},{timestamp:now+60_000,value:10},{timestamp:now+120_000,value:20}];
function Fixture(){
 const [points,setPoints]=useState(initial),[value,setValue]=useState(-10);
 return <main className="mx-auto grid grid-cols-1 max-w-5xl gap-6 p-4">
  <h1 className="text-xl">图表边界验收 · 演示数据</h1>
  <div className="flex flex-wrap gap-3"><Button onClick={()=>setPoints([...initial,{timestamp:now+30_000,value:-20}])}>插入历史样本</Button><Button onClick={()=>setPoints(initial.filter(p=>p.timestamp!==now+60_000))}>移除所选样本</Button><Button onClick={()=>setValue(value===-10?60:-10)}>更换读数</Button></div>
  <TelemetryChart label="实时验证" mode="live" data={points} unit="°C" precision={1} window={{from:now,to:now+120_000}} maxGapMs={90_000}/>
  <div id="card-width" style={{width:'505px',maxWidth:'100%'}}><MetricCard definition={{id:'long',type:'number',label:'北区地下二层环境监测站空气温度观测点长名称验证',subject:'源设备与测量通道保持完整',unit:'°C',precision:1,range:{min:-10,max:50}}} observation={{value,sampledAt:now,quality:'good'}} source={{device:'验证探头'}} now={now} visualization="trend" history={{points:[...points,{timestamp:now+180_000,value}],label:'原始观测',domain:{min:-10,max:50},maxGapMs:90_000}}/></div>
  <RangeGauge label="量程位置验证" value={value} min={-10} max={50} target={{low:10,high:30}} unit="°C" precision={1}/>
  <DailyHistogram label="净能量时段比较" unit="kWh" precision={1} description="2025-12-31 至 2026-01-01 UTC · 宿主提供的小时净输入" data={[{label:'2025-12-31 23:00',value:-10},{label:'2026-01-01 00:00',value:0},{label:'2026-01-01 01:00',value:20},{label:'缺测时段',value:null},{label:'无效时段',value:NaN}]}/>
  <div id="invalid-times"><TelemetryExplorer title="无效时间验证" metrics={[{id:'probe',label:'探头',unit:'°C'}]} now={now} initialQuery={{metricIds:['probe'],from:now,to:now+120_000}} initialResult={{series:[{id:'probe',label:'探头',unit:'°C',precision:1,data:[{timestamp:NaN,value:10},{timestamp:1e19,value:20}]}]}} onQuery={async()=>({series:[]})}/></div>
  <SoilProfile title="不规则深度与未知位置" sampledAt={now} layers={[{id:'10cm',depthCm:10,moisture:0,temperature:-1},{id:'30cm',depthCm:30,moisture:null,temperature:2},{id:'unknown',depthCm:NaN,moisture:3,temperature:4}]}/>
 </main>;
}
createRoot(document.getElementById('root')!).render(<Fixture/>);
