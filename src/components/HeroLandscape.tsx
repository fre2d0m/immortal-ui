import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { LandscapeController } from '../lib/heroLandscape';
import { getMeadowGroundY } from '../lib/heroLayout';

export function HeroLandscape() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controller = useRef<LandscapeController | null>(null);
  const [renderer, setRenderer] = useState<'loading' | 'webgl' | 'poster'>('loading');
  useLayoutEffect(() => {
    const figure = canvasRef.current?.parentElement;
    if (!figure) return;
    const resize = () => {
      const { width, height } = figure.getBoundingClientRect();
      figure.style.setProperty('--meadow-ground-y', `${getMeadowGroundY(width,height)}px`);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(figure);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let cancelled = false;
    import('../lib/heroLandscape').then(async ({ createHeroLandscape }) => {
      const images = canvasRef.current?.parentElement?.querySelectorAll<HTMLImageElement>('[data-scene-layer]');
      await Promise.all(Array.from(images || []).map(image => image.decode().catch(() => undefined)));
      if (cancelled || !canvasRef.current) return;
      try {
        controller.current = createHeroLandscape(canvasRef.current, {
          onReady: () => setRenderer('webgl'),
          onFailure: () => setRenderer('poster'),
        });
      } catch { setRenderer('poster'); }
    }).catch(() => { if (!cancelled) setRenderer('poster'); });
    return () => { cancelled = true; controller.current?.dispose(); controller.current = null; };
  }, []);
  return (
    <figure className="hero-landscape" data-renderer={renderer} aria-label="A dark business workspace emerging from a meadow, with gold, chrome, obsidian and cobalt metal stones." onPointerMove={event => {
      const rect = event.currentTarget.getBoundingClientRect();
      controller.current?.setPointer((event.clientX - rect.left) / rect.width * 2 - 1, (event.clientY - rect.top) / rect.height * 2 - 1);
    }} onPointerLeave={() => controller.current?.setPointer(0, 0)}>
      <div className="hero-landscape-glow" />
      <div className="hero-scene-poster" aria-hidden="true"><img src={`${import.meta.env.BASE_URL}hero/landscape-foreground.webp`} width="1280" height="590" alt="" fetchPriority="high" draggable="false" /></div>
      <div className="hero-workspace-image"><img data-scene-layer src={`${import.meta.env.BASE_URL}hero/workspace.jpg`} alt="Forma business dashboard, composed with Immortal UI cards, tabs, badges and buttons." width="1360" height="820" draggable="false" /></div>
      <img data-scene-layer className="hero-meadow hero-meadow-back" src={`${import.meta.env.BASE_URL}hero/meadow.webp`} width="2172" height="724" alt="" aria-hidden="true" draggable="false" />
      <canvas ref={canvasRef} className="hero-landscape-canvas" aria-hidden="true" />
      <img className="hero-meadow hero-meadow-front" src={`${import.meta.env.BASE_URL}hero/meadow.webp`} width="2172" height="724" alt="" aria-hidden="true" draggable="false" />
      <div className="hero-landscape-mist" />
    </figure>
  );
}
