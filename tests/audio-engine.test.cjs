const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
const source = fs.readFileSync('src/components/AudioEngine.ts', 'utf8');
const compiled = stripTypeScriptTypes(source).replace(/^export\s+/gm, '')
  + '\nglobalThis.audioExports = { ImmortalAudioEngine, METAL_SOUND_PROFILES, synthesizeMetalImpact, MATERIAL_SOUND_VOLUME };';

function harness(initialState = 'running') {
  let time = 0;
  const contexts = [];
  const parameter = () => ({ value: 0, cancelScheduledValues() {}, setTargetAtTime(value) { this.value = value; } });
  class FakeAudioContext {
    constructor() {
      this.state = initialState; this.currentTime = 0; this.sampleRate = 48000;
      this.buffers = []; this.sources = []; this.destination = {}; contexts.push(this);
    }
    createGain() { return { gain: parameter(), connect() {} }; }
    createDynamicsCompressor() {
      return { threshold: parameter(), knee: parameter(), ratio: parameter(), attack: parameter(), release: parameter(), connect() {} };
    }
    createBuffer(channels, length, rate) {
      const buffer = { length, sampleRate: rate, copyToChannel(data) { this.samples = new Float32Array(data); } };
      this.buffers.push(buffer); return buffer;
    }
    createBufferSource() {
      const source = {
        buffer: null, connected: false, stopped: false,
        connect() { this.connected = true; }, disconnect() { this.connected = false; },
        start() { this.started = true; }, stop() { this.stopped = true; },
      };
      this.sources.push(source); return source;
    }
    resume() { return new Promise(resolve => { this.unlock = () => { this.state = 'running'; resolve(); }; }); }
  }
  const context = { Float32Array, performance: { now: () => time }, window: { AudioContext: FakeAudioContext } };
  vm.runInNewContext(compiled, context);
  const exports = context.audioExports;
  return { ...exports, contexts, engine: new exports.ImmortalAudioEngine(), advance(ms) { time += ms; } };
}

const kinds = ['button', 'metal', 'switch', 'select'];

test('Classic and omitted materials are silent and never create an AudioContext', () => {
  const h = harness();
  for (const kind of kinds) { h.engine.playClick(kind, 'classic'); h.advance(100); }
  h.engine.playClick('metal');
  assert.equal(h.contexts.length, 0);
  assert.equal(h.synthesizeMetalImpact('classic').length, 0);
});

test('six metal identities are distinct, short, bounded and have zero endpoints', () => {
  const h = harness();
  const metals = Object.keys(h.METAL_SOUND_PROFILES);
  assert.equal(metals.length, 6);
  const clips = [];
  for (const material of metals) {
    for (const kind of kinds) {
      const clip = h.synthesizeMetalImpact(material, kind, 48000);
      assert.ok(clip.length > 1000 && clip.length <= 48000 * 0.18, material + ':' + kind);
      assert.ok(clip[0] === 0 && clip.at(-1) === 0);
      assert.ok(clip.every(Number.isFinite));
      assert.ok(Math.max(...clip.map(Math.abs)) <= 0.401);
      if (kind === 'button') clips.push(clip);
    }
  }
  for (let a = 0; a < clips.length; a++) for (let b = a + 1; b < clips.length; b++) {
    let product = 0, energyA = 0, energyB = 0;
    for (let i = 0; i < Math.min(clips[a].length, clips[b].length); i++) {
      product += clips[a][i] * clips[b][i]; energyA += clips[a][i] ** 2; energyB += clips[b][i] ** 2;
    }
    assert.ok(Math.abs(product / Math.sqrt(energyA * energyB)) < 0.9, 'materials must have different waveforms');
  }
});

test('one shared context caches buffers and suppresses duplicate gesture sounds', () => {
  const h = harness();
  h.engine.playClick('button', 'gold');
  h.advance(10); h.engine.playClick('button', 'gold');
  assert.equal(h.contexts[0].sources.length, 1);
  h.advance(100); h.engine.playClick('button', 'gold');
  assert.equal(h.contexts.length, 1); assert.equal(h.contexts[0].buffers.length, 1);
  assert.equal(h.contexts[0].sources[0].buffer, h.contexts[0].sources[1].buffer);
  h.advance(100); h.engine.playClick('button', 'platinum');
  assert.equal(h.contexts[0].buffers.length, 2);
  h.contexts[0].sources[0].onended();
  assert.equal(h.contexts[0].sources[0].connected, false);
});

test('mute is shared, stops active voices and does not allocate or play while disabled', () => {
  const h = harness(); let changes = 0;
  const unsubscribe = h.engine.subscribe(() => changes++);
  h.engine.playClick('switch', 'obsidian');
  h.engine.enabled = false;
  assert.equal(h.contexts[0].sources[0].stopped, true);
  h.advance(100); h.engine.playClick('button', 'gold');
  assert.equal(h.contexts[0].sources.length, 1); assert.equal(h.engine.getEnabled(), false);
  h.engine.enabled = false; assert.equal(changes, 1);
  h.engine.enabled = true; h.advance(100); h.engine.playClick('select', 'emerald');
  assert.equal(h.contexts[0].sources.length, 2); assert.equal(changes, 2);
  unsubscribe(); h.engine.enabled = false; assert.equal(changes, 2);
});

test('rapid input has a four-voice budget', () => {
  const h = harness();
  for (let i = 0; i < 12; i++) { h.engine.playClick('metal', 'platinum'); h.advance(40); }
  assert.equal(h.contexts[0].sources.filter(source => !source.stopped).length, 4);
});

test('unlock keeps only the latest metal request and Classic cancels queued audio', async () => {
  const h = harness('suspended');
  h.engine.playClick('button', 'gold'); h.advance(60);
  h.engine.playClick('button', 'cobalt'); h.advance(20);
  h.contexts[0].unlock(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(h.contexts[0].sources.length, 1);
  assert.deepEqual(h.contexts[0].sources[0].buffer.samples, h.synthesizeMetalImpact('cobalt', 'button'));
  const silent = harness('suspended');
  silent.engine.playClick('metal', 'gold'); silent.advance(50);
  silent.engine.playClick('metal', 'classic'); silent.contexts[0].unlock();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(silent.contexts[0].sources.length, 0);
});

test('muting or a delayed unlock drops stale feedback', async () => {
  for (const mode of ['mute', 'late']) {
    const h = harness('suspended'); h.engine.playClick('button', 'gold');
    if (mode === 'mute') h.engine.enabled = false;
    else h.advance(500);
    h.contexts[0].unlock(); await new Promise(resolve => setImmediate(resolve));
    assert.equal(h.contexts[0].sources.length, 0);
  }
});
