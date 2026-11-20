import { prepareSvgImport } from '../index.js';
import { exportMaterialBodies } from '../../studio-material-export.js';

self.onmessage = async ({ data: { record, threeModule, manifoldModule } }) => {
  const progress = text => self.postMessage({ type: 'progress', text });
  try {
    progress('Loading the Manifold engine…');
    const [THREE, manifold] = await Promise.all([import(threeModule), import(manifoldModule)]);
    const wasm = await manifold.default();
    wasm.setup();
    progress('Checking the solid with Manifold…');
    const { prepared, report } = prepareSvgImport(THREE, wasm, record, { onProgress: progress });
    progress('Preparing STL and 3MF…');
    const output = exportMaterialBodies(prepared, {
      name: record.source.name.replace(/\.svg$/i, ''),
      colours: ['#2698A3FF', '#FFD070FF'],
    });
    const files = {
      stl: { ...output.stls[0], mime: 'model/stl' },
      threemf: { name: output.filename, bytes: output.threeMF, mime: 'model/3mf' },
    };
    const { vertProperties, numProp, triVerts } = prepared.bodies[0].mesh;
    const positions = new Float32Array(vertProperties.length / numProp * 3);
    for (let source = 0, target = 0; source < vertProperties.length; source += numProp) {
      positions[target++] = vertProperties[source];
      positions[target++] = vertProperties[source + 1];
      positions[target++] = vertProperties[source + 2];
    }
    const indices = new Uint32Array(triVerts);
    self.postMessage({ type: 'ready', report, files, mesh: { positions, indices } }, [
      files.stl.bytes.buffer, files.threemf.bytes.buffer, positions.buffer, indices.buffer,
    ]);
  } catch (error) {
    self.postMessage({ type: 'error', text: error.message || 'Mesh validation failed.' });
  }
};
