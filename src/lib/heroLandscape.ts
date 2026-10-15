import * as THREE from 'three';
import { METAL_MATERIALS, MetalMaterialId } from '../components/WebGLMetalEngine';
import { rockGeometry, seatRock, seededRandom } from './rockGeometry';
import { HERO_SCENE_LAYOUT } from './heroLayout';

type LandscapeOptions = { onReady: () => void; onFailure: () => void };
export type LandscapeController = { dispose: () => void; setPaused: (paused: boolean) => void; setPointer: (x: number, y: number) => void };

const groundHeight = (x: number, z: number) => .06 + .1 * Math.sin(x * .7 + z * .6) + .1 * Math.cos(z * 1.7 + x * .25);

// An HDR studio sky is generated locally; no remote environment maps or requests.
function makeEnvironment(renderer: THREE.WebGLRenderer) {
  const width = 512, height = 256;
  const pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    const latitude = 1 - y / height;
    for (let x = 0; x < width; x++) {
      const longitude = x / width;
      const sky = Math.pow(Math.max(0, Math.sin(latitude * Math.PI)), .6);
      const softbox = Math.exp(-Math.pow((longitude - .22) / .09, 8) - Math.pow((latitude - .36) / .20, 6)) * 5;
      const strip = Math.exp(-Math.pow((longitude - .71) / .025, 4) - Math.pow((latitude - .43) / .25, 6)) * 3;
      const horizon = Math.exp(-Math.pow((latitude - .57) / .05, 2));
      const base = latitude < .57 ? .16 + sky * .35 : .035;
      const i = (y * width + x) * 4;
      pixels[i] = base + softbox * 1.0 + strip * .79 - horizon * .09;
      pixels[i + 1] = base * .98 + softbox * .94 + strip * .89 - horizon * .07;
      pixels[i + 2] = base * .91 + softbox * .80 + strip * 1.0 - horizon * .06;
      if (latitude > .60) { pixels[i] += .025; pixels[i + 1] += .045; }
      pixels[i + 3] = 1;
    }
  }
  const texture = new THREE.DataTexture(pixels, width, height, THREE.RGBAFormat, THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture);
  texture.dispose(); pmrem.dispose();
  return environment;
}

const noiseGLSL = `
float landscapeHash(vec3 p) { p = fract(p * .3183099 + vec3(.1,.2,.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float landscapeNoise(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(landscapeHash(i), landscapeHash(i+vec3(1,0,0)),f.x), mix(landscapeHash(i+vec3(0,1,0)),landscapeHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(landscapeHash(i+vec3(0,0,1)),landscapeHash(i+vec3(1,0,1)),f.x),mix(landscapeHash(i+vec3(0,1,1)),landscapeHash(i+vec3(1,1,1)),f.x),f.y),f.z);
}`;


export function createHeroLandscape(canvas: HTMLCanvasElement, options: LandscapeOptions): LandscapeController {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, window.innerWidth < 640 ? 1.25 : 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-8, 8, 4, -4, .1, 80);
  const target = new THREE.Vector3(0, HERO_SCENE_LAYOUT.targetY, 0);
  camera.position.set(0, HERO_SCENE_LAYOUT.cameraY, HERO_SCENE_LAYOUT.cameraZ);
  camera.lookAt(target);
  const environment = makeEnvironment(renderer);
  scene.environment = environment.texture;
  const art = new THREE.Group();
  art.position.y = HERO_SCENE_LAYOUT.groundY;
  scene.add(art);
  scene.add(new THREE.HemisphereLight(0xe4e9d4, 0x262b12, 1.5));
  const key = new THREE.DirectionalLight(0xfff1d2, 3.8);
  key.position.set(-4, 8, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 5, bottom: -5, near: .1, far: 25 });
  key.shadow.normalBias = .035; key.shadow.bias = -.0003; key.shadow.radius = 3;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xc7d9ff, 1.8);
  fill.position.set(5, 4, -3); scene.add(fill);

  const rockSpecs: { id: MetalMaterialId; position: [number, number, number]; scale: [number, number, number]; rotation: [number, number, number]; seed: number }[] = [
    { id: 'obsidian', position: [-4.65, .43, .40], scale: [.90,.74,.71], rotation: [.14,.55,-.18], seed: 8 },
    { id: 'gold', position: [-2.1, .90, -.04], scale: [1.66,1.12,1.06], rotation: [.07,-.20,.08], seed: 2 },
    { id: 'platinum', position: [2.55, 1.04, -.15], scale: [1.22,1.40,1.00], rotation: [.16,.44,-.23], seed: 5 },
    { id: 'cobalt', position: [.70,.35,1.02], scale: [.77,.53,.63], rotation: [.04,.45,.13], seed: 11 },
  ];
  const contactCanvas = document.createElement('canvas');
  contactCanvas.width = contactCanvas.height = 128;
  const contactContext = contactCanvas.getContext('2d')!;
  const gradient = contactContext.createRadialGradient(64,64,4,64,64,64);
  gradient.addColorStop(0,'rgba(0,0,0,.72)'); gradient.addColorStop(.45,'rgba(0,0,0,.38)'); gradient.addColorStop(1,'rgba(0,0,0,0)');
  contactContext.fillStyle = gradient; contactContext.fillRect(0,0,128,128);
  const contactTexture = new THREE.CanvasTexture(contactCanvas);
  const contactMaterial = new THREE.MeshBasicMaterial({ map: contactTexture, transparent: true, depthWrite: false, opacity: .72 });
  for (const spec of rockSpecs) {
    const preset = METAL_MATERIALS[spec.id];
    const color = new THREE.Color().setRGB(...preset.midRGB, THREE.SRGBColorSpace);
    color.lerp(new THREE.Color().setRGB(...preset.highRGB, THREE.SRGBColorSpace), .22);
    if (spec.id === 'obsidian') color.multiplyScalar(.40);
    const material = new THREE.MeshPhysicalMaterial({ color, metalness: 1, roughness: spec.id === 'platinum' ? .25 : .34, clearcoat: .025, clearcoatRoughness: .40, envMapIntensity: 1.0 });
    material.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 rockWeathering; varying vec2 vRockWeathering; varying vec3 vRockPosition;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRockPosition = position; vRockWeathering = rockWeathering;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\nvarying vec3 vRockPosition; varying vec2 vRockWeathering;\n${noiseGLSL}`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor += vRockWeathering.x*.16 + vRockWeathering.y*.055 + landscapeNoise(vRockPosition*47.0)*.025;')
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          float footprint=max(length(dFdx(vRockPosition)),length(dFdy(vRockPosition)));
          float fineRelief=1.0-smoothstep(.006,.024,footprint);
          float grain=landscapeNoise(vRockPosition*35.0)*.0035 + landscapeNoise(vRockPosition*90.0)*.0013*fineRelief;
          vec3 sigmaX=dFdx(-vViewPosition), sigmaY=dFdy(-vViewPosition);
          vec3 R1=cross(sigmaY,normal), R2=cross(normal,sigmaX);
          float det=dot(sigmaX,R1);
          vec3 gradient=sign(det)*(dFdx(grain)*R1+dFdy(grain)*R2);
          normal=normalize(abs(det)*normal-gradient);
        `)
        .replace('#include <aomap_fragment>', '#include <aomap_fragment>\nreflectedLight.indirectDiffuse *= 1.0-vRockWeathering.x*.50; reflectedLight.indirectSpecular *= 1.0-vRockWeathering.x*.34;');
    };
    const rock = new THREE.Mesh(rockGeometry(spec.seed), material);
    rock.position.set(...spec.position); rock.scale.set(...spec.scale); rock.rotation.set(...spec.rotation);
    seatRock(rock, groundHeight(spec.position[0],spec.position[2]), spec.id === 'cobalt' ? .07 : .14);
    rock.castShadow = true; art.add(rock);
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(spec.scale[0]*2.05,spec.scale[2]*2.1), contactMaterial);
    contact.rotation.x = -Math.PI/2;
    contact.position.set(spec.position[0],groundHeight(spec.position[0],spec.position[2])+.007,spec.position[2]);
    art.add(contact);
  }

  // Sparse, real-depth blades break the seam where the static meadow meets rock.
  const bladeGeometry = new THREE.BufferGeometry();
  bladeGeometry.setAttribute('position',new THREE.Float32BufferAttribute([-.006,0,0,.006,0,0,-.004,.12,.02,.004,.12,.02,0,.24,.065],3));
  bladeGeometry.setIndex([0,1,2,1,3,2,2,3,4]); bladeGeometry.computeVertexNormals();
  const bladeMaterial = new THREE.MeshStandardMaterial({color:0x56623b,roughness:1,side:THREE.DoubleSide});
  const tufts = new THREE.InstancedMesh(bladeGeometry,bladeMaterial,720);
  const grassRandom = seededRandom(6081), dummy = new THREE.Object3D(), grassColor = new THREE.Color();
  rockSpecs.forEach((spec,rockIndex) => {
    for (let i=0;i<180;i++) {
      const angle=grassRandom()*Math.PI*2;
      const radius=.72+grassRandom()*.34;
      const x=spec.position[0]+Math.cos(angle)*spec.scale[0]*radius;
      const z=spec.position[2]+Math.sin(angle)*spec.scale[2]*radius;
      dummy.position.set(x,groundHeight(x,z)-.012,z);
      dummy.rotation.set(0,grassRandom()*Math.PI*2,(grassRandom()-.5)*.65);
      dummy.scale.set(.7+grassRandom()*.5,.35+grassRandom()*.65,1);
      dummy.updateMatrix(); tufts.setMatrixAt(rockIndex*180+i,dummy.matrix);
      grassColor.setHSL(.19+grassRandom()*.045,.18+grassRandom()*.2,.22+grassRandom()*.14);
      tufts.setColorAt(rockIndex*180+i,grassColor);
    }
  });
  art.add(tufts);

  const groundGeometry = new THREE.PlaneGeometry(13.4, 4.6, 120, 40);
  groundGeometry.rotateX(-Math.PI / 2);
  const gp = groundGeometry.attributes.position;
  for (let i = 0; i < gp.count; i++) gp.setY(i, groundHeight(gp.getX(i), gp.getZ(i)) - .015);
  groundGeometry.computeVertexNormals();
  const groundMaterial = new THREE.ShadowMaterial({ opacity: .40 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.receiveShadow = true; art.add(ground);

  let disposed = false, paused = false, visible = true, frame = 0, lastTime = 0, elapsed = 0;
  let pointerX = 0, pointerY = 0, easedX = 0, easedY = 0;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const render = () => {
    if (disposed) return;
    camera.position.x = easedX * .20; camera.position.y = HERO_SCENE_LAYOUT.cameraY + easedY * .10;
    camera.lookAt(target); scene.environmentRotation.y = Math.sin(elapsed * .12) * .035;
    renderer.render(scene, camera);
  };
  const animate = (time: number) => {
    frame = 0;
    if (disposed || paused || !visible || document.hidden || motion.matches) return;
    if (time - lastTime > 31) {
      elapsed += Math.min((time - lastTime) / 1000, .05); lastTime = time;
      easedX += (pointerX - easedX) * .05; easedY += (pointerY - easedY) * .05;
      render();
    }
    frame = requestAnimationFrame(animate);
  };
  const updatePlayback = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = performance.now();
    if (!paused && visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(animate);
    else render();
  };
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    const worldWidth = HERO_SCENE_LAYOUT.worldWidth;
    const worldHeight = worldWidth * height / width;
    camera.left = -worldWidth / 2; camera.right = worldWidth / 2;
    camera.top = worldHeight / 2; camera.bottom = -worldHeight / 2;
    camera.updateProjectionMatrix();
    render();
  };
  const observer = new ResizeObserver(resize); observer.observe(canvas);
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; updatePlayback(); }, { rootMargin: '60px' });
  intersection.observe(canvas);
  document.addEventListener('visibilitychange', updatePlayback);
  motion.addEventListener('change', updatePlayback);
  const lost = (event: Event) => { event.preventDefault(); paused = true; updatePlayback(); options.onFailure(); };
  canvas.addEventListener('webglcontextlost', lost);
  resize(); render(); options.onReady(); updatePlayback();

  return {
    setPointer(x, y) { pointerX = x; pointerY = y; },
    setPaused(value) { paused = value; updatePlayback(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback); motion.removeEventListener('change', updatePlayback);
      canvas.removeEventListener('webglcontextlost', lost);
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) {
          geometries.add(object.geometry);
          (Array.isArray(object.material) ? object.material : [object.material]).forEach(material => materials.add(material));
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      contactTexture.dispose(); environment.dispose(); renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
