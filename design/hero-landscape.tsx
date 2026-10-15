// Export at 1280×590; ?foreground=1 isolates the rocks for the loading fallback.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HeroLandscape } from '../src/components/HeroLandscape';
import '../src/index.css';
import '../src/site.css';
import './hero-landscape.css';
// Foreground-only export keeps the workspace in its own stable DOM layer.
if (new URLSearchParams(window.location.search).has('foreground')) document.documentElement.dataset.export = 'foreground';
createRoot(document.getElementById('root')!).render(<HeroLandscape />);
