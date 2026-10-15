import React from 'react';
import { createRoot } from 'react-dom/client';
import { HeroMark3D } from '../src/components/HeroMark3D';
import { ImmortalMark } from '../src/components/ImmortalMark';
import '../src/site.css';
import './merkaba-motion.css';

createRoot(document.getElementById('root')!).render(<main>
  <header><div><ImmortalMark width={32} height={32}/><strong>Immortal UI</strong></div><span>MERKABA / MOTION STUDY</span></header>
  <section><HeroMark3D/></section>
  <footer><span>48-second orbit</span><span>Hover to shift the studio light</span><span>Platinum / champagne</span></footer>
</main>);
