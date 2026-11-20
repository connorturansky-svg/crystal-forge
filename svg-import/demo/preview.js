import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { disposeGroup, previewRecipe } from '../../studio-geometry.js';

const directions = {
  reset: [0.65, 1.12, 1.10],
  top: [0, 1, 0.00001],
  bottom: [0, -1, 0.00001],
};
const meshColor = 0x2698a3;

export function createPreview(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', '3D extrusion preview');
  host.append(canvas);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe9f0fa);
  const camera = new THREE.PerspectiveCamera(36, 1, .01, 2000);
  const orbit = new OrbitControls(camera, canvas);
  orbit.enablePan = false;
  orbit.maxPolarAngle = Math.PI;
  const key = new THREE.DirectionalLight(0xfff8ec, 3.1);
  key.position.set(-2, 4, 3);
  const fill = new THREE.DirectionalLight(0xcbe5ff, 1.55);
  fill.position.set(3, -2, -3);
  scene.add(key, fill, new THREE.HemisphereLight(0xeaf4ff, 0xc3cfde, 2.45));

  let mesh = null;
  let target = new THREE.Vector3();
  let radius = 20;
  let frame = 0;
  let activeView = 'reset';
  function draw() {
    if (frame) return;
    frame = requestAnimationFrame(() => { frame = 0; renderer.render(scene, camera); });
  }
  orbit.addEventListener('change', draw);
  function place(direction) {
    const halfY = THREE.MathUtils.degToRad(camera.fov / 2);
    const halfX = Math.atan(Math.tan(halfY) * camera.aspect);
    const distance = radius * 1.02 / Math.sin(Math.min(halfX, halfY));
    camera.position.copy(target).addScaledVector(direction.normalize(), distance);
    camera.near = Math.max(.001, radius / 300);
    camera.far = Math.max(100, distance * 10);
    orbit.minDistance = radius * .3;
    orbit.maxDistance = distance * 3;
    orbit.target.copy(target);
    camera.updateProjectionMatrix();
    orbit.update();
    draw();
  }
  function view(name) {
    activeView = name;
    place(new THREE.Vector3(...directions[name]));
  }
  orbit.addEventListener('start', () => { activeView = null; });
  function resize() {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    camera.aspect = width / height;
    renderer.setSize(width, height);
    camera.updateProjectionMatrix();
    if (activeView) view(activeView);
    else draw();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  function replace(next, reset) {
    const sphere = new THREE.Box3().setFromObject(next).getBoundingSphere(new THREE.Sphere());
    const direction = camera.position.clone().sub(orbit.target);
    if (mesh) disposeGroup(mesh);
    mesh = next;
    scene.add(mesh);
    target = sphere.center;
    radius = Math.max(.1, sphere.radius);
    if (reset) view('reset');
    else draw();
    return direction;
  }
  return {
    view,
    setRecipe(recipe, { reset = false } = {}) {
      const direction = replace(previewRecipe(THREE, recipe, [meshColor]), reset);
      if (!reset) {
        if (activeView) view(activeView);
        else place(direction);
      }
    },
    setPrepared({ positions, indices }) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setIndex(new THREE.BufferAttribute(indices, 1));
      const material = new THREE.MeshStandardMaterial({ color: meshColor, roughness: .55, flatShading: true });
      // Validation does not change model dimensions; keep the exact inspected camera pose.
      replace(new THREE.Mesh(geometry, material), false);
    },
  };
}
