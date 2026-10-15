import React, { useEffect, useRef, useState } from 'react';
import { ImmortalMark } from './ImmortalMark';
import type { HeroMarkController } from '../lib/heroMark3D';

/** Only the homepage wordmark is animated; all other brand marks remain SVG. */
export function HeroMark3D() {
  const canvasHost=useRef<HTMLSpanElement>(null);
  const controller=useRef<HeroMarkController | null>(null);
  const pointer=useRef({x:0,y:0,active:false});
  const [renderer,setRenderer]=useState<'loading'|'webgl'|'poster'>('loading');
  const [reducedMotion,setReducedMotion]=useState(()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(()=>{
    const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setReducedMotion(preference.matches);
    preference.addEventListener('change',update); update();
    return ()=>preference.removeEventListener('change',update);
  },[]);
  useEffect(()=>{
    if(reducedMotion) {setRenderer('poster');return;}
    if(!canvasHost.current) return;
    let cancelled=false;
    // A fresh canvas is required after forceContextLoss, including when system
    // motion preferences change or React refreshes this effect in development.
    const canvas=document.createElement('canvas');
    canvas.className='hero-mark-canvas';
    canvasHost.current.appendChild(canvas);
    setRenderer('loading');
    import('../lib/heroMark3D').then(({createHeroMark})=>{
      if(cancelled || !canvas.isConnected) return;
      try {
        controller.current=createHeroMark(canvas,{
          onReady:()=>{if(!cancelled)setRenderer('webgl');},
          onFailure:()=>{if(!cancelled)setRenderer('poster');},
        });
        const {x,y,active}=pointer.current;
        controller.current.setPointer(x,y,active);
      } catch {if(!cancelled)setRenderer('poster');}
    }).catch(()=>{if(!cancelled)setRenderer('poster');});
    return ()=>{cancelled=true;controller.current?.dispose();controller.current=null;canvas.remove();};
  },[reducedMotion]);
  const move=(event: React.PointerEvent<HTMLSpanElement>)=>{
    if(event.pointerType==='touch') return;
    const rect=event.currentTarget.getBoundingClientRect();
    const x=(event.clientX-rect.left)/rect.width*2-1;
    const y=(event.clientY-rect.top)/rect.height*2-1;
    pointer.current={x,y,active:true};controller.current?.setPointer(x,y,true);
  };
  return <span className="hero-intro-mark hero-mark-3d" data-renderer={renderer} data-motion={reducedMotion?'reduced':'auto'} aria-hidden="true"
    onPointerEnter={move} onPointerMove={move} onPointerLeave={()=>{pointer.current={x:0,y:0,active:false};controller.current?.setPointer(0,0,false);}}>
    <ImmortalMark className="hero-mark-poster" />
    <span ref={canvasHost} className="hero-mark-canvas-host" />
  </span>;
}
