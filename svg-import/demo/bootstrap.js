(async () => {
  const project = new URL('../../', document.currentScript.src);
  const localThree = new URL('node_modules/three/', project);
  const localManifold = new URL('node_modules/manifold-3d/manifold.js', project);
  async function available(url) {
    try {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(3000) });
      return response.ok && /javascript|ecmascript/.test(response.headers.get('content-type') ?? '');
    } catch {
      return false;
    }
  }
  const [threeLocal, manifoldLocal] = await Promise.all([
    available(new URL('build/three.module.js', localThree)), available(localManifold),
  ]);
  const three = threeLocal ? localThree : new URL('https://cdn.jsdelivr.net/npm/three@0.165.0/');
  const threeModule = new URL('build/three.module.js', three).href;
  const manifoldModule = manifoldLocal ? localManifold.href : 'https://cdn.jsdelivr.net/npm/manifold-3d@3.5.4/manifold.js';
  const importMap = document.createElement('script');
  importMap.type = 'importmap';
  importMap.textContent = JSON.stringify({ imports: {
    three: threeModule,
    'three/addons/': new URL('examples/jsm/', three).href,
  } });
  document.head.append(importMap);
  const { start } = await import('./controller.js');
  start({ threeModule, manifoldModule });
})().catch(error => {
  document.querySelector('#status').textContent = 'Demo unavailable.';
  document.querySelector('#preview-message').textContent = '3D preview unavailable.';
  const message = document.querySelector('#error');
  message.textContent = `Could not start the SVG import demo. Serve the project root on localhost and reload. (${error.message})`;
  message.hidden = false;
});
