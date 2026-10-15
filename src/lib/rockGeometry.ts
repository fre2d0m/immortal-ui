import * as THREE from 'three';

export function seededRandom(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6d2b79f5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function hash(x: number, y: number, z: number, seed: number) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(seed, 1274126177);
  h = Math.imul(h ^ h >>> 13, 1274126177);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}

function noise(x: number, y: number, z: number, seed: number) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  let fx = x - ix, fy = y - iy, fz = z - iz;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;
  return mix(
    mix(mix(hash(ix,iy,iz,seed), hash(ix+1,iy,iz,seed), fx), mix(hash(ix,iy+1,iz,seed), hash(ix+1,iy+1,iz,seed), fx), fy),
    mix(mix(hash(ix,iy,iz+1,seed), hash(ix+1,iy,iz+1,seed), fx), mix(hash(ix,iy+1,iz+1,seed), hash(ix+1,iy+1,iz+1,seed), fx), fy), fz,
  );
}

/** Fractured rock: sharp planes, nonconvex chips, eroded strata, and granular relief. */
export function rockGeometry(seed: number, detail = 224) {
  const geometry = new THREE.SphereGeometry(1, detail, Math.round(detail * .72));
  const positions = geometry.attributes.position;
  const weathering = new Float32Array(positions.count * 2);
  const random = seededRandom(seed * 1024);
  const planes = Array.from({ length: 15 }, (_, i) => {
    const y = 1 - (i + .5) / 7.5;
    const angle = i * Math.PI * (3 - Math.sqrt(5)) + seed;
    return { normal: new THREE.Vector3(Math.cos(angle) * Math.sqrt(1-y*y), y, Math.sin(angle) * Math.sqrt(1-y*y)), distance: .68 + random() * .31 };
  });
  const chips = [
    [-.88, .29, .44], [.71,.47,.53], [.12,.94,.32], [-.3,-.1,.96], [.82,-.2,-.5], [-.7,.65,-.2],
  ].map(values => ({
    direction: new THREE.Vector3(values[0] + (random()-.5)*.22, values[1] + (random()-.5)*.25, values[2]).normalize(),
    radius: .24 + random() * .24,
    depth: .10 + random() * .12,
  }));
  const direction = new THREE.Vector3();
  const sample = (x: number, y: number, z: number, frequency: number) => noise(x*frequency + seed*3.7,y*frequency,z*frequency,seed);
  const layerTiltX = (random() - .5) * .5;
  const layerTiltZ = (random() - .5) * .5;
  for (let i = 0; i < positions.count; i++) {
    direction.fromBufferAttribute(positions, i).normalize();
    let blend = 0;
    for (const plane of planes) {
      const dot = direction.dot(plane.normal);
      if (dot > .05) blend += Math.exp(-plane.distance / dot * 72);
    }
    const hull = -Math.log(blend) / 72;
    const x = direction.x * hull, y = direction.y * hull, z = direction.z * hull;
    const coarse = sample(x,y,z,3.2);
    const medium = sample(x,y,z,10.5);
    const grit = sample(x,y,z,29);
    let relief = (coarse-.5)*.14 + (medium-.5)*.045 + (grit-.5)*.010;
    let chipped = 0;
    for (const chip of chips) {
      const distance = direction.distanceToSquared(chip.direction) / (chip.radius * chip.radius);
      chipped += Math.pow(Math.max(0, 1-distance), 1.25) * chip.depth;
    }
    const layer = y + x*layerTiltX + z*layerTiltZ + (sample(x,y,z,4.5)-.5)*.16;
    let fracture = 0;
    for (const level of [-.37, .04, .42]) {
      const width = .025 + coarse*.024;
      const groove = Math.max(0, 1-Math.abs(layer-level)/width);
      fracture += groove*groove * (.030 + medium*.050);
    }
    const crossFault = Math.max(0, 1-Math.abs(x*.78+z*.44+.12+(coarse-.5)*.11)/.027);
    fracture += crossFault*crossFault * .055 * Math.max(0, y+.5);
    relief -= chipped + fracture;
    direction.multiplyScalar(hull + relief);
    // An uneven, buried underside; no rounded display plinth or visible flat base.
    positions.setXYZ(i, direction.x, Math.max(-.76, direction.y), direction.z);
    weathering[i*2] = Math.min(1, fracture*9 + chipped*2.2);
    weathering[i*2+1] = medium;
  }
  geometry.setAttribute('rockWeathering', new THREE.BufferAttribute(weathering, 2));
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Seat the actual rotated mesh in the ground, rather than guessing its center. */
export function seatRock(rock: THREE.Mesh, groundY: number, burial: number) {
  rock.position.y = 0;
  rock.updateMatrix();
  const positions = rock.geometry.attributes.position;
  const vertex = new THREE.Vector3();
  let bottom = Infinity;
  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i).applyMatrix4(rock.matrix);
    bottom = Math.min(bottom, vertex.y);
  }
  rock.position.y = groundY - bottom - burial;
  rock.updateMatrix();
}
