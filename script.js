import * as THREE from 'three';
import { Stereogram } from './Stereogram.js'

console.clear();

const renderer = new THREE.WebGLRenderer({
  antialias: false
});

renderer.setPixelRatio(1);
renderer.setSize(
  window.innerWidth,
  window.innerHeight
);

document.body.appendChild(renderer.domElement);


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 2, 5);

camera.position.z = 4;

const mesh = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1, 0.35, 256, 32),
  new THREE.MeshDepthMaterial()
);

scene.add(mesh);

const depthTarget = new THREE.WebGLRenderTarget(
  window.innerWidth,
  window.innerHeight
);

const stereoCanvas = document.createElement("canvas");

stereoCanvas.width = window.innerWidth;
stereoCanvas.height = window.innerHeight;

const postScene = new THREE.Scene();
const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const stereoTexture = new THREE.CanvasTexture(stereoCanvas);

stereoTexture.minFilter = THREE.NearestFilter;
stereoTexture.magFilter = THREE.NearestFilter;

const postQuad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.MeshBasicMaterial({ map: stereoTexture })
);

postScene.add(postQuad);

function buildDepthMap(depthPixels, width, height) {
  const depthMap = [];

  for (let y = 0; y < height; y++) {
    depthMap[y] = new Float32Array(width);

    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const depth = depthPixels[i] / 255;
      depthMap[y][x] = depth;
    }
  }

  return depthMap;
}

// let tick = 0;

function animate(delta) {
  // console.log(delta)
  requestAnimationFrame(animate);

  mesh.rotation.x += 0.03;
  mesh.rotation.y += 0.02;

  renderer.setRenderTarget(depthTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  const { width, height } = renderer.domElement;
  const depthPixels = new Uint8Array( width * height * 4 );

  renderer.readRenderTargetPixels( depthTarget, 0, 0, width, height, depthPixels);

  const depthMap = buildDepthMap( depthPixels, width, height);

  Stereogram.render({
    el: stereoCanvas,
    width,
    height,
    depthMap,
    colors: [
      [255, 255, 255, 255],
      [255, 0, 255, 255],
      [255, 0, 0, 255],
      [0, 0, 0, 255],
    ]
  }, Math.round(delta * 0.05) || 0);

  stereoTexture.needsUpdate = true;

  renderer.render(
    postScene,
    postCamera
  );
}

animate();

window.addEventListener( "resize", () => {
  
  const width = window.innerWidth;
  const height = window.innerHeight;

  renderer.setSize( width, height );
  camera.aspect = width / height;

  camera.updateProjectionMatrix();

  depthTarget.setSize( width, height );

  stereoCanvas.width = width;
  stereoCanvas.height = height;
  
});
