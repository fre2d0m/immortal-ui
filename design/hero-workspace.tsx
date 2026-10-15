// Archived art source for the former raster hero. Run Vite and open
// /design/hero-workspace.html at 1440×960 to capture #hero-workspace.
// The homepage now renders the interactive src/components/HeroWorkspace.tsx.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, Bell, Box, ChevronDown, CircleHelp, CreditCard, LayoutDashboard, Plus, Search, Settings2, Users } from 'lucide-react';
import { ImmortalButton, ImmortalCard, ImmortalBadge, ImmortalTabs } from '../src/components/ImmortalComponents';
import { ImmortalMark } from '../src/components/ImmortalMark';
import { MetalConfigProvider } from '../src/components/WebGLMetalEngine';
import '../src/index.css';
import './hero-workspace.css';

function Workspace() {
  const [activeTab, setActiveTab] = React.useState('overview');
  return (
    <div id="hero-workspace">
      <aside className="workspace-sidebar">
        <div className="workspace-brand"><ImmortalMark width={25} height={25} /><span>Forma</span><ChevronDown size={13} /></div>
        <div className="workspace-search"><Search size={14} /> Search anything <kbd>⌘ K</kbd></div>
        <small>WORKSPACE</small>
        {[[LayoutDashboard, 'Overview'], [Box, 'Projects'], [Users, 'Customers'], [CreditCard, 'Transactions']].map(([Icon, text], i) => {
          const Glyph = Icon as typeof Box;
          return <div key={String(text)} className={`workspace-nav ${i === 0 ? 'selected' : ''}`}><Glyph size={16} /><span>{String(text)}</span>{i === 1 && <b>12</b>}</div>;
        })}
        <small>FAVORITES</small>
        <div className="workspace-nav"><span className="workspace-dot" />Website redesign</div>
        <div className="workspace-nav"><span className="workspace-dot gold" />Mobile application</div>
        <div className="workspace-sidebar-bottom"><div className="workspace-nav"><Settings2 size={16} />Settings</div><div className="workspace-nav"><CircleHelp size={16} />Help & support</div><div className="workspace-profile"><span>AL</span><div>Alex Laurent<small>Personal workspace</small></div></div></div>
      </aside>
      <main className="workspace-main">
        <header><span>Workspace <i>/</i> <strong>Overview</strong></span><div><Search size={16} /><Bell size={16} /><span className="workspace-avatar">AL</span></div></header>
        <div className="workspace-content">
          <div className="workspace-title"><div><h1>A little clarity. A lot of progress.</h1><p>Here's what's happening with your business today.</p></div><ImmortalButton variant="metallic" size="sm"><Plus size={13} /> New project</ImmortalButton></div>
          <div className="workspace-toolbar"><ImmortalTabs activeId={activeTab} onChange={setActiveTab} tabs={[{id:'overview',label:'Overview'},{id:'analytics',label:'Analytics'},{id:'reports',label:'Reports'}]} /><span>Oct 1 – Oct 31, 2026 <ChevronDown size={12} /></span></div>
          <div className="workspace-kpis">
            {[['Total revenue','$48,290.00','18.6%'],['Active projects','24','12.8%'],['New customers','1,429','8.2%']].map(([title,value,change], i)=><ImmortalCard key={title}><div className="workspace-kpi-label">{title}<ArrowUpRight size={14}/></div><strong>{value}</strong><p><span>↗ {change}</span> vs. last month</p><svg viewBox="0 0 240 44" aria-hidden="true"><path d={i===0?'M0 39L16 34L29 37L45 24L63 29L78 18L92 21L107 13L124 21L144 14L161 18L178 8L194 12L213 3L239 6':i===1?'M0 38L21 37L37 29L52 32L69 19L86 24L105 20L126 26L145 13L162 15L180 5L204 10L222 3L239 4':'M0 38L24 32L44 36L62 23L78 26L99 18L120 21L139 17L158 20L180 9L199 13L221 5L239 5'} stroke={i===1?'#aaa390':'#8ea57b'} strokeWidth="1.5" fill="none"/></svg></ImmortalCard>)}
          </div>
          <div className="workspace-charts">
            <ImmortalCard><div className="workspace-chart-heading"><div><h2>Revenue overview</h2><p>Steady growth, thoughtfully built.</p></div><ImmortalBadge dotColor="green">On track</ImmortalBadge></div><div className="workspace-chart"><div className="workspace-chart-axis"><span>$50k</span><span>$35k</span><span>$20k</span><span>$5k</span></div><svg viewBox="0 0 600 195" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="chartArea" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#9daf83" stopOpacity=".23"/><stop offset="1" stopColor="#9daf83" stopOpacity="0"/></linearGradient></defs>{[20,70,120,170].map(y=><path key={y} d={`M0 ${y}H600`} stroke="#ffffff" strokeOpacity=".065" strokeDasharray="3 5"/>)}<path d="M0 170C25 167 35 130 58 137S93 162 119 125S153 143 176 113S209 117 236 100S270 120 295 86S331 107 354 74S391 81 414 64S450 88 474 47S513 67 535 35S570 49 600 15V195H0Z" fill="url(#chartArea)"/><path d="M0 170C25 167 35 130 58 137S93 162 119 125S153 143 176 113S209 117 236 100S270 120 295 86S331 107 354 74S391 81 414 64S450 88 474 47S513 67 535 35S570 49 600 15" stroke="#b4c39b" strokeWidth="2" fill="none"/></svg></div><div className="workspace-months"><span>Oct 01</span><span>Oct 07</span><span>Oct 14</span><span>Oct 21</span><span>Oct 31</span></div></ImmortalCard>
            <ImmortalCard><div className="workspace-chart-heading"><div><h2>Your team</h2><p>Good things, made together.</p></div><Plus size={14}/></div>{[['JL','Jamie Lee','Product design'],['SP','Sofia Park','Engineering'],['OM','Oliver Martin','Marketing']].map(([initials,name,role])=><div className="workspace-member" key={name}><span>{initials}</span><div>{name}<small>{role}</small></div><span className="workspace-presence"/></div>)}<ImmortalButton variant="default" size="sm">Manage members <ArrowUpRight size={13}/></ImmortalButton></ImmortalCard>
          </div>
        </div>
      </main>
    </div>
  );
}
createRoot(document.getElementById('root')!).render(<MetalConfigProvider><Workspace /></MetalConfigProvider>);
