/**
 * Immortal UI's Merkaba: two regular, interpenetrating tetrahedral frames.
 * The SVG is an orthographic projection of bevelled 3D struts, not a flat star.
 * Used by React and by design/scripts/export-mark.ts for identical brand assets.
 */
type V3 = [number, number, number];
type V2 = [number, number];
export type MerkabaFrameFace = { points: V3[]; normal: V3; finish: number; bevel: boolean };
type Face = MerkabaFrameFace;
export const MERKABA_VIEW = { direction: [3.7, 2.7, 6.5] as V3, halfExtent: 64 / 30.8 };
const add = (a: V3, b: V3): V3 => a.map((v, i) => v + b[i]) as V3;
const sub = (a: V3, b: V3): V3 => a.map((v, i) => v - b[i]) as V3;
const mul = (a: V3, s: number): V3 => a.map(v => v * s) as V3;
const dot = (a: V3, b: V3) => a.reduce((v, n, i) => v + n * b[i], 0);
const cross = (a: V3, b: V3): V3 => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const unit = (v: V3) => mul(v, 1 / Math.hypot(...v));
const camera = unit(MERKABA_VIEW.direction);
const right = unit(cross([0, 1, 0], camera));
const up = cross(camera, right);
const light = unit([-0.55, 0.8, 0.6]);
const project = (v: V3): V2 => [64 + dot(v, right)*30.8, 64 - dot(v, up)*30.8];
const n = (v: number) => Number(v.toFixed(3));
const path = (points: V3[]) => points.map((p, i) => `${i ? 'L' : 'M'}${project(p).map(n).join(' ')}`).join('') + 'Z';

export function getMerkabaFrameFaces(): MerkabaFrameFace[] {
  const faces: Face[] = [];
  const vertices: V3[] = [[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]];
  const append = (points: V3[], normal: V3, finish: number, bevel: boolean) => {
    faces.push({ points, normal, finish, bevel });
  };
  for (let tetra = 0; tetra < 2; tetra++) {
    const tips = vertices.map(p => mul(p, tetra ? -1 : 1));
    for (let a = 0; a < 4; a++) for (let b = a+1; b < 4; b++) {
      const start = tips[a], end = tips[b];
      const direction = unit(sub(end,start));
      const outward = unit(add(start,end));
      const side = unit(cross(direction,outward));
      const w = 0.132, bevel = 0.034;
      const section: V2[] = [[-w+bevel,-w],[w-bevel,-w],[w,-w+bevel],[w,w-bevel],[w-bevel,w],[-w+bevel,w],[-w,w-bevel],[-w,-w+bevel]];
      const position = (t: number, s: V2) => add(add(start,mul(sub(end,start),t)),add(mul(outward,s[0]),mul(side,s[1])));
      section.forEach((s,i) => {
        const next = section[(i+1)%8];
        const normal = unit(add(mul(outward,next[1]-s[1]),mul(side,s[0]-next[0])));
        append([position(0,s),position(0,next),position(1,next),position(1,s)],normal,tetra,i%2===1);
      });
      append(section.map(s=>position(0,s)).reverse(),mul(direction,-1),tetra,false);
      append(section.map(s=>position(1,s)),direction,tetra,false);
    }
  }
  return faces;
}

/** Split intersecting struts on their actual face planes, so crossings occlude
 * correctly even in the large master. An average-depth sort produces seams. */
function orderSurfaces(polygons: Face[]): Face[] {
  if (!polygons.length) return [];
  const plane = polygons[0];
  const offset = dot(plane.normal,plane.points[0]);
  const front: Face[] = [], back: Face[] = [], coplanar: Face[] = [];
  for (const polygon of polygons) {
    const distances = polygon.points.map(p=>dot(plane.normal,p)-offset);
    const positive = distances.some(d=>d>1e-6), negative = distances.some(d=>d< -1e-6);
    if (!positive && !negative) { coplanar.push(polygon); continue; }
    if (!negative) { front.push(polygon); continue; }
    if (!positive) { back.push(polygon); continue; }
    const f: V3[] = [], b: V3[] = [];
    for (let i=0;i<polygon.points.length;i++) {
      const j=(i+1)%polygon.points.length;
      const point=polygon.points[i], distance=distances[i], next=distances[j];
      if (distance>=-1e-6) f.push(point);
      if (distance<=1e-6) b.push(point);
      if ((distance>1e-6 && next< -1e-6)||(distance< -1e-6 && next>1e-6)) {
        const intersection=add(point,mul(sub(polygon.points[j],point),distance/(distance-next)));
        f.push(intersection); b.push(intersection);
      }
    }
    if(f.length>=3) front.push({...polygon,points:f});
    if(b.length>=3) back.push({...polygon,points:b});
  }
  return dot(plane.normal,camera)>0
    ? [...orderSurfaces(back),...coplanar,...orderSurfaces(front)]
    : [...orderSurfaces(front),...coplanar,...orderSurfaces(back)];
}

const faces = orderSurfaces(getMerkabaFrameFaces().filter(face => dot(face.normal, camera) >= 0.001));
const hex = (rgb: number[]) => '#' + rgb.map(v=>Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0')).join('');
function metalColour(value: number, finish: number) {
  // Both tetrahedra stay predominantly platinum. The inner frame has a quiet,
  // warm alloy reflection that separates overlapping surfaces at small sizes.
  return hex(finish ? [value*1.035,value*1.01,value*.95] : [value*.94,value*.975,value*1.035]);
}

export function getMerkabaArtwork(id: string) {
  const gradients = new Map<string, { id: string; markup: string }>();
  const polygons = faces.map(face => {
    const brightness = dot(face.normal, light);
    const facing = dot(face.normal, camera);
    const key = `${face.finish}-${face.bevel ? 'b' : 'f'}-${Math.round(brightness*18)}-${Math.round(facing*8)}`;
    let gradient = gradients.get(key);
    if (!gradient) {
      const index = gradients.size;
      const gid = `${id}-${index}`;
      const base = 112 + brightness*80 + (face.bevel ? 27 : 0);
      const stops = [
        [0,base*.65], [.16,base*.95], [.28,Math.min(255,base*1.5)],
        [.36,Math.min(255,base*1.7)], [.405,base*.5], [.57,base*.35],
        [.72,base*.68], [.85,Math.min(255,base*1.55)], [1,base*.82],
      ];
      const markup = `<linearGradient id="${gid}" x1="18" y1="6" x2="99" y2="122" gradientUnits="userSpaceOnUse">${stops.map(([offset,value])=>`<stop offset="${offset}" stop-color="${metalColour(value,face.finish)}"/>`).join('')}</linearGradient>`;
      gradient = { id: gid, markup };
      gradients.set(key,gradient);
    }
    return `<path d="${path(face.points)}" fill="url(#${gradient.id})"/>`;
  });
  return `<defs>${[...gradients.values()].map(gradient=>gradient.markup).join('')}</defs><g stroke-linejoin="round">${polygons.join('')}</g>`;
}

export function getMerkabaSvg(id = 'immortal-merkaba', framed = false) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" fill="none"><title>Immortal UI — Merkaba</title>${framed ? '<rect x="2" y="2" width="124" height="124" rx="32" fill="#0b0b0d" stroke="#3f3f46" stroke-width="2"/>' : ''}${getMerkabaArtwork(id)}</svg>\n`;
}
