// Export the exact production PCM at the production volume. Run with Node.js 22.22+.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { stripTypeScriptTypes } = require('node:module');
if (!process.argv[2]) throw new Error('Usage: node design/scripts/export-sounds.cjs <output-directory>');
const directory = path.resolve(process.argv[2]);
fs.mkdirSync(directory, { recursive: true });
const source = fs.readFileSync(path.resolve(__dirname, '../../src/components/AudioEngine.ts'), 'utf8');
const compiled = stripTypeScriptTypes(source).replace(/^export\s+/gm, '')
  + '\nglobalThis.soundExports = { synthesizeMetalImpact, METAL_SOUND_PROFILES, MATERIAL_SOUND_VOLUME };';
const context = { Float32Array };
vm.runInNewContext(compiled, context);
const { synthesizeMetalImpact, METAL_SOUND_PROFILES, MATERIAL_SOUND_VOLUME } = context.soundExports;
const sampleRate = 48000;
const order = ['platinum', 'gold', 'obsidian', 'cobalt', 'rosegold', 'emerald'];
function wav(samples) {
  const data = Buffer.alloc(44 + samples.length * 2);
  data.write('RIFF', 0); data.writeUInt32LE(data.length - 8, 4); data.write('WAVE', 8);
  data.write('fmt ', 12); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20);
  data.writeUInt16LE(1, 22); data.writeUInt32LE(sampleRate, 24); data.writeUInt32LE(sampleRate * 2, 28);
  data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return data;
}
const study = new Float32Array(Math.ceil(order.length * 1.3 * sampleRate));
const metadata = [];
order.forEach((material, index) => {
  const button = synthesizeMetalImpact(material, 'button', sampleRate);
  const standalone = Float32Array.from(button, value => value * MATERIAL_SOUND_VOLUME);
  fs.writeFileSync(path.join(directory, `${material}.wav`), wav(standalone));
  ['button', 'select', 'switch'].forEach((kind, hit) => {
    const clip = synthesizeMetalImpact(material, kind, sampleRate);
    const offset = Math.round((index * 1.3 + 0.12 + hit * 0.38) * sampleRate);
    for (let i = 0; i < clip.length; i++) study[offset + i] += clip[i] * MATERIAL_SOUND_VOLUME;
  });
  metadata.push({ material, label: METAL_SOUND_PROFILES[material].label, character: METAL_SOUND_PROFILES[material].description,
    startSeconds: index * 1.3, buttonDurationMs: Math.round(button.length / sampleRate * 1000),
    peak: Math.max(...standalone.map(Math.abs)) });
});
fs.writeFileSync(path.join(directory, 'material-sound-study.wav'), wav(study));
fs.writeFileSync(path.join(directory, 'sounds.json'), JSON.stringify({ sampleRate, order: metadata, interactions: ['button', 'select', 'switch'] }, null, 2) + '\n');
console.log(JSON.stringify({ outputDirectory: directory, durationSeconds: study.length / sampleRate, materials: metadata }, null, 2));
