import React from "react";
import { ArrowRight, Check, FileCode2, FolderTree } from "lucide-react";
import { CodeBlock } from "../components/CodeBlock";

const firstComponent = `import { ImmortalButton } from './components/ImmortalComponents';
import { MetalConfigProvider } from './components/WebGLMetalEngine';
import { ToastProvider } from './components/ImmortalToast';
import './index.css';

export default function App() {
  return (
    <MetalConfigProvider>
      <ToastProvider>
        <ImmortalButton variant="metallic">Hello, Immortal UI</ImmortalButton>
      </ToastProvider>
    </MetalConfigProvider>
  );
}`;
const tailwindConfig = `// vite.config.ts — in a React + Vite project
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});`;

export const gettingStartedSections = [
  ["overview", "Overview"],
  ["requirements", "Requirements"],
  ["get-source", "Get the source"],
  ["dependencies", "Install dependencies"],
  ["styles", "Add shared styles"],
  ["first-component", "First component"],
];

export function GettingStarted() {
  return (
    <article className="doc-article min-w-0">
      <header id="overview" className="mb-10">
        <p className="site-eyebrow">DOCUMENTATION / INTRODUCTION</p>
        <h1 className="site-page-title mt-4">Getting started</h1>
        <p className="site-page-description">
          From the source files to your first component. Keep the code in your
          project and make it your own.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-xs text-zinc-400">
          <span className="rounded-md border border-white/10 px-2.5 py-1.5">
            React + TypeScript
          </span>
          <span className="rounded-md border border-white/10 px-2.5 py-1.5">
            Tailwind CSS 4
          </span>
          <span className="rounded-md border border-white/10 px-2.5 py-1.5">
            Manual installation
          </span>
        </div>
      </header>
      <div className="mb-10 rounded-xl border border-white/10 bg-white/[0.025] p-5 text-sm leading-7 text-zinc-400">
        <strong className="text-zinc-200">Choose your starting point.</strong>{" "}
        To explore this repository, clone it and run the showcase. To add
        components to an existing React app, follow the manual integration steps
        below. An npm package and installation CLI are not available yet.
      </div>
      <section id="requirements" className="doc-section">
        <span className="doc-step">01</span>
        <h2>Check your environment</h2>
        <p>
          This guide assumes a React + TypeScript application using Vite and
          Tailwind CSS 4. Use Node.js 22.22 or later in the Node.js 22 release
          line for this repository.
        </p>
        <p>
          No API keys or backend services are needed. The default Classic Dark
          material uses CSS; the six metal materials use WebGL in the browser.
        </p>
      </section>
      <section id="get-source" className="doc-section">
        <span className="doc-step">02</span>
        <h2>Get the source</h2>
        <p>
          Clone the repository. These commands run the showcase locally; they do
          not install components into another application.
        </p>
        <CodeBlock
          label="Terminal · run the showcase"
          code={`git clone https://github.com/fre2d0m/immortal-ui.git\ncd immortal-ui\nnpm install --legacy-peer-deps\nnpm run dev`}
        />
        <p>
          For an existing app, copy the five supporting component files and
          shared stylesheet into your own <code>src/</code>. Keep the supporting
          engines alongside the components.
        </p>
        <CodeBlock
          label="Files to copy into your app"
          code={`src/\n  components/                    # Copy these five files\n    ImmortalComponents.tsx\n    ImmortalModal.tsx\n    ImmortalToast.tsx\n    WebGLMetalEngine.tsx\n    AudioEngine.ts\n  index.css                      # Merge into your global stylesheet`}
        />
      </section>
      <section id="dependencies" className="doc-section">
        <span className="doc-step">03</span>
        <h2>Install the dependencies</h2>
        <p>
          In your existing React app, install the dependencies imported by the
          source and the Tailwind Vite integration. Keep your app's existing
          React and React DOM setup.
        </p>
        <CodeBlock
          label="Terminal · in your existing app"
          code={`npm install lucide-react\nnpm install -D tailwindcss@4 @tailwindcss/vite@4`}
        />
        <p>
          Enable the Tailwind plugin alongside your React plugin. If your app
          already uses Tailwind CSS 4, retain its existing configuration.
        </p>
        <CodeBlock code={tailwindConfig} label="vite.config.ts" />
      </section>
      <section id="styles" className="doc-section">
        <span className="doc-step">04</span>
        <h2>Add the shared styles</h2>
        <p>
          Merge the repository's <code>src/index.css</code> into your global
          stylesheet, preserving its CSS variables, registered angle property,
          and optical effect classes. Keep a single Tailwind import at the top.
        </p>
        <CodeBlock
          label="src/index.css"
          code={`@import "tailwindcss";\n\n/* Include the shared variables, surfaces, and effect classes\n   from Immortal UI's src/index.css below this import. */`}
        />
        <p>
          The stylesheet also includes showcase page backgrounds and typography.
          When integrating into an existing site, retain your own body styles if
          you only want the component surfaces.
        </p>
      </section>
      <section id="first-component" className="doc-section">
        <span className="doc-step">05</span>
        <h2>Render your first component</h2>
        <p>
          Wrap your interface in <code>MetalConfigProvider</code> for shared
          material settings. Add <code>ToastProvider</code> if you use
          notifications. This example assumes the copied components live in{" "}
          <code>src/components/</code>.
        </p>
        <CodeBlock code={firstComponent} label="src/App.tsx" />
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 p-4 text-sm leading-7 text-zinc-400">
          <Check size={16} className="mt-1 shrink-0 text-zinc-200" />
          <p>
            You're ready. Start with the default CSS material, or add{" "}
            <code>material="gold"</code> to the button to try a metal finish.
          </p>
        </div>
      </section>
      <div className="mt-12 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-2">
        <a href="#/components/button" className="doc-next-link">
          <FileCode2 size={18} />
          <span>
            <strong>Explore Button</strong>
            <small>Preview, usage, and API</small>
          </span>
          <ArrowRight size={16} />
        </a>
        <a href="#/examples/cards" className="doc-next-link">
          <FolderTree size={18} />
          <span>
            <strong>See examples</strong>
            <small>Put components together</small>
          </span>
          <ArrowRight size={16} />
        </a>
      </div>
    </article>
  );
}
