const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');

// Run the production scheduler with a fake GPU; browser checks cover actual GLSL output.
const source = fs.readFileSync('src/components/WebGLMetalEngine.tsx', 'utf8');
const scheduler = source.slice(source.indexOf('interface RegisteredSurface'), source.indexOf('export const sharedMetalEngine'));
const compiled = stripTypeScriptTypes(scheduler + '\nglobalThis.engineForTest = new SharedWebGLShaderEngine();');

function harness() {
  let now = 0;
  let nextId = 0;
  const frames = new Map();
  const listeners = new Map();
  const observers = [];
  const uniforms = {};
  const document = {
    hidden: false,
    addEventListener(name, listener) { listeners.set(name, listener); },
    removeEventListener(name) { listeners.delete(name); },
  };
  const context = {
    document,
    DEFAULT_HOVER_SWEEP_DEG: 90,
    METAL_MATERIALS: {
      gold: { highRGB: [1, 0.9, 0.5], midRGB: [0.8, 0.6, 0.1], darkRGB: [0.1, 0.08, 0.02] },
    },
    performance: { now: () => now },
    requestAnimationFrame(callback) { const id = ++nextId; frames.set(id, callback); return id; },
    cancelAnimationFrame(id) { frames.delete(id); },
    IntersectionObserver: class {
      constructor(callback) { this.callback = callback; observers.push(this); }
      observe() {}
      unobserve() {}
      disconnect() {}
    },

  };
  vm.runInNewContext(compiled, context);
  const engine = context.engineForTest;
  engine.initGL = () => {};
  engine.glCanvas = { width: 256, height: 256 };
  engine.program = {};
  engine.uniforms = new Proxy({}, { get: (_, name) => name });
  engine.gl = {
    viewport() {}, uniform1f(name, value) { uniforms[name] = value; },
    uniform3fv() {}, drawArrays() {}, TRIANGLES: 4,
  };
  const tick = () => {
    now += 1000 / 60;
    const callbacks = [...frames.values()]; frames.clear();
    callbacks.forEach(callback => callback(now));
  };
  const settle = () => {
    for (let i = 0; i < 200 && frames.size; i++) tick();
    assert.equal(frames.size, 0, 'settled surfaces must stop scheduling frames');
  };
  const surface = id => {
    const state = { hovered: false, focused: false, mouseX: 0, mouseY: 0, materialOverride: 'gold' };
    const result = {
      id, canvas: { width: 200, height: 80 },
      ctx2d: { drawImage() { result.draws++; } },
      getState: () => state, currentHoverRad: 0, currentHoverIntensity: 0,
      visible: false, dirty: true, draws: 0,
    };
    engine.register(result);
    return { result, state };
  };
  const visible = (surface, value) => observers.at(-1).callback([
    { target: surface.result.canvas, isIntersecting: value },
  ]);
  return { engine, frames, listeners, uniforms, document, tick, settle, surface, visible };
}

test('only visible surfaces paint, and idle surfaces stop immediately', () => {
  const h = harness();
  const first = h.surface('first');
  const offscreen = h.surface('offscreen');
  assert.equal(h.frames.size, 0);
  h.visible(first, true); h.tick();
  assert.equal(first.result.draws, 1);
  assert.equal(offscreen.result.draws, 0);
  assert.equal(h.frames.size, 0);
});

test('quarter turns settle in both directions without repainting static neighbours', () => {
  const h = harness();
  const control = h.surface('control');
  const neighbour = h.surface('neighbour');
  h.visible(control, true); h.visible(neighbour, true); h.tick();
  control.state.hovered = true;
  h.engine.invalidate('control'); h.settle();
  assert.ok(Math.abs(control.result.currentHoverRad - Math.PI / 2) < 0.00001);
  assert.equal(neighbour.result.draws, 1);
  control.state.hovered = false;
  h.engine.invalidate('control'); h.settle();
  assert.equal(control.result.currentHoverRad, 0);
  assert.equal(control.result.currentHoverIntensity, 0);
  assert.equal(neighbour.result.draws, 1);
});

test('Auto Flow pauses offscreen and in hidden tabs, resumes, and cleans up on unmount', () => {
  const h = harness();
  const control = h.surface('flow');
  control.state.autoFlowOverride = true;
  h.visible(control, true); h.tick(); h.tick();
  assert.equal(h.frames.size, 1);
  assert.equal(control.result.draws, 2);
  h.visible(control, false); h.tick();
  assert.equal(h.frames.size, 0);
  assert.equal(control.result.draws, 2);
  h.visible(control, true);
  assert.equal(h.frames.size, 1);
  h.document.hidden = true; h.listeners.get('visibilitychange')();
  assert.equal(h.frames.size, 0);
  h.document.hidden = false; h.listeners.get('visibilitychange')(); h.tick();
  assert.equal(control.result.draws, 3);
  h.engine.unregister('flow');
  assert.equal(h.frames.size, 0);
  assert.equal(h.listeners.size, 0);
});

test('optical changes and focused controls wake a settled renderer', () => {
  const h = harness();
  const control = h.surface('config');
  h.visible(control, true); h.tick();
  h.engine.globalConfig.dispersion = 50;
  h.engine.invalidate(); h.tick();
  assert.equal(control.result.draws, 2);
  assert.equal(h.uniforms.u_dispersion, 0.5);
  h.engine.globalConfig.hoverSweepDeg = 180;
  control.state.focused = true;
  h.engine.invalidate('config'); h.settle();
  assert.ok(Math.abs(control.result.currentHoverRad - Math.PI) < 0.00001);
});
