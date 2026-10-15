import * as THREE from 'three';
import { getMerkabaFrameFaces, MERKABA_VIEW } from './merkabaMark';

export type HeroMarkController = {
  setPointer: (x: number, y: number, active: boolean) => void;
  dispose: () => void;
};
type Options = { onReady: () => void; onFailure: () => void };

// Local studio softboxes give the chrome something to reflect, including a
// narrow strip that travels across the bevels during a hover quarter turn.
function makeStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const width = 256, height = 128;
  const pixels = new Float32Array(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const u = x / width, v = y / height;
    const softbox = Math.exp(-Math.pow((u-.23)/.105, 8)-Math.pow((v-.35)/.23, 8))*6;
    const strip = Math.exp(-Math.pow((u-.70)/.018, 4)-Math.pow((v-.45)/.31, 8))*9;
    const bounce = Math.exp(-Math.pow((u-.93)/.08, 4)-Math.pow((v-.62)/.12, 4))*1.7;
    const base = .035 + .065*Math.max(0, Math.sin(v*Math.PI));
    const i = (y*width+x)*4;
    pixels[i] = base + softbox + strip*.82 + bounce;
    pixels[i+1] = base + softbox*.98 + strip*.92 + bounce*.92;
    pixels[i+2] = base*1.06 + softbox*.94 + strip + bounce*.79;
    pixels[i+3] = 1;
  }
  const texture = new THREE.DataTexture(pixels,width,height,THREE.RGBAFormat,THREE.FloatType);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.needsUpdate = true;
  const generator = new THREE.PMREMGenerator(renderer);
  try { return generator.fromEquirectangular(texture); }
  finally { texture.dispose(); generator.dispose(); }
}

function createFrame() {
  const group = new THREE.Group();
  const faces = getMerkabaFrameFaces();
  for (let finish=0;finish<2;finish++) for (const bevel of [false,true]) {
    const positions: number[] = [], normals: number[] = [];
    faces.filter(face=>face.finish===finish && face.bevel===bevel).forEach(face=>{
      const vertices = face.points.map(point=>new THREE.Vector3(...point));
      const normal = new THREE.Vector3(...face.normal);
      const winding = new THREE.Vector3().subVectors(vertices[1],vertices[0])
        .cross(new THREE.Vector3().subVectors(vertices[2],vertices[0])).dot(normal);
      for(let i=1;i<vertices.length-1;i++) {
        const triangle = winding>0 ? [vertices[0],vertices[i],vertices[i+1]] : [vertices[0],vertices[i+1],vertices[i]];
        triangle.forEach(vertex=>{ positions.push(...vertex.toArray()); normals.push(...normal.toArray()); });
      }
    });
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
    const material = new THREE.MeshPhysicalMaterial({
      color: finish ? 0xe4dfd5 : 0xd5dce6,
      metalness: 1,
      roughness: bevel ? .10 : .18,
      clearcoat: .08,
      clearcoatRoughness: .15,
      envMapIntensity: 1.05,
    });
    // Project reflections into a nearby studio sphere. With an infinite sky
    // and an orthographic camera, an entire flat facet reflects one colour;
    // local parallax makes the softbox travel along the metal instead.
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMarkWorldPosition;')
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvMarkWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMarkWorldPosition;')
        .replace('#include <envmap_physical_pars_fragment>', THREE.ShaderChunk.envmap_physical_pars_fragment.replace(
          'vec4 envMapColor = textureCubeUV( envMap, envMapRotation * reflectVec, roughness );',
          `float alongRay = dot(vMarkWorldPosition, reflectVec);
           float distanceToStudio = -alongRay + sqrt(max(0.001, alongRay * alongRay + 12.96 - dot(vMarkWorldPosition, vMarkWorldPosition)));
           vec3 localReflection = normalize(vMarkWorldPosition + reflectVec * distanceToStudio);
           vec4 envMapColor = textureCubeUV(envMap, envMapRotation * localReflection, roughness);`
        ));
    };
    material.customProgramCacheKey = () => 'merkaba-local-studio-v1';
    group.add(new THREE.Mesh(geometry,material));
  }
  return group;
}

export function createHeroMark(canvas: HTMLCanvasElement, options: Options): HeroMarkController {
  const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1,2.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-MERKABA_VIEW.halfExtent,MERKABA_VIEW.halfExtent,MERKABA_VIEW.halfExtent,-MERKABA_VIEW.halfExtent,.1,30);
  camera.position.set(...MERKABA_VIEW.direction); camera.lookAt(0,0,0);
  const frame = createFrame(); scene.add(frame);
  let environment: THREE.WebGLRenderTarget | undefined;
  let disposed=false, lost=false, visible=true, request=0, lastTime=0, previousRender=0;
  let elapsed=0, hover=0, hoverTarget=0, x=0, y=0, targetX=0, targetY=0;
  let environmentAngle=0, sweepTarget=0;
  const key = new THREE.DirectionalLight(0xf6f5ef,2.2);
  key.position.set(-3,5,6); scene.add(key);
  const movingLight = new THREE.PointLight(0xf2f6ff,38,16,2);
  movingLight.position.set(-2,2,3.5); scene.add(movingLight);
  const edge = new THREE.DirectionalLight(0xd2e1ff,1.8);
  edge.position.set(4,-1,-3); scene.add(edge);
  const render = () => {
    if(disposed || lost) return;
    frame.rotation.set(Math.sin(elapsed*.21)*.055+y*.07,elapsed*Math.PI*2/48+x*.10,Math.sin(elapsed*.12)*.025);
    scene.environmentRotation.y = environmentAngle+x*.18;
    scene.environmentRotation.x = y*.12;
    key.position.x = -3+x*2;
    movingLight.position.set(Math.sin(environmentAngle)*3+x,2+Math.cos(environmentAngle)*1.3-y,3.5);
    movingLight.intensity = 18+hover*48;
    renderer.render(scene,camera);
  };
  const animate = (time: number) => {
    request=0;
    if(disposed || lost || !visible || document.hidden) return;
    const delta = Math.min((time-lastTime)/1000,.05); lastTime=time;
    elapsed+=delta;
    const blend = 1-Math.exp(-delta*6);
    hover+=(hoverTarget-hover)*blend;
    x+=(targetX-x)*blend; y+=(targetY-y)*blend;
    // Entering advances a quarter turn; while hovered the studio strip keeps
    // drifting. Leaving decays the speed without resetting the reflection.
    sweepTarget+=delta*hover*.42;
    environmentAngle+=(sweepTarget-environmentAngle)*(1-Math.exp(-delta*3));
    if(time-previousRender>=1000/30) { render(); previousRender=time; }
    request=requestAnimationFrame(animate);
  };
  const playback = () => {
    cancelAnimationFrame(request); request=0;
    lastTime=performance.now();
    if(!disposed && !lost && visible && !document.hidden) request=requestAnimationFrame(animate);
  };
  const resize = () => {
    const {width,height}=canvas.getBoundingClientRect();
    if(!width || !height || disposed || lost) return;
    renderer.setSize(width,height,false);
    render();
  };
  const resizeObserver = new ResizeObserver(resize);
  const intersection = new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;playback();});
  const contextLost = (event: Event) => {event.preventDefault();lost=true;playback();options.onFailure();};
  const dispose = () => {
    if(disposed) return;
    disposed=true; cancelAnimationFrame(request);
    resizeObserver.disconnect(); intersection.disconnect();
    document.removeEventListener('visibilitychange',playback);
    canvas.removeEventListener('webglcontextlost',contextLost);
    frame.traverse(object=>{
      if(object instanceof THREE.Mesh) { object.geometry.dispose(); object.material.dispose(); }
    });
    environment?.dispose(); renderer.dispose(); renderer.forceContextLoss();
  };
  try {
    environment=makeStudioEnvironment(renderer); scene.environment=environment.texture;
    resizeObserver.observe(canvas); intersection.observe(canvas);
    document.addEventListener('visibilitychange',playback);
    canvas.addEventListener('webglcontextlost',contextLost);
    resize(); options.onReady(); playback();
  } catch(error) { dispose(); throw error; }
  return {
    setPointer(nextX,nextY,active) {
      if(active && !hoverTarget) sweepTarget+=Math.PI/2;
      hoverTarget=active ? 1 : 0;
      targetX=active ? Math.max(-1,Math.min(1,nextX)) : 0;
      targetY=active ? Math.max(-1,Math.min(1,nextY)) : 0;
    },
    dispose,
  };
}
