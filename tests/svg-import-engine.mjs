import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import Module from 'manifold-3d';
import * as THREE from 'three';
import {exportMaterialBodies} from '../studio-material-export.js';
import {
  buildSvgExtrusionRecipe,
  createSvgImport,
  parseSvgArtwork,
  prepareSvgImport,
  restoreSvgImport,
  serializeSvgImport,
} from '../svg-import/index.js';

const wasm = await Module();
wasm.setup();

const svg = body => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80">${body}</svg>`;
const rect = '<rect x="10" y="10" width="100" height="60"/>';
const fixtureText = name => readFile(new URL(`./fixtures/svg-import/${name}.svg`, import.meta.url), 'utf8');
const fixture = async name => parseSvgArtwork(await fixtureText(name), {name: `${name}.svg`});
const prepare = (record, options) => prepareSvgImport(THREE, wasm, record, options);
const make = async (name, settings) => createSvgImport(await fixture(name), settings);

function near(actual, expected, tolerance, label) {
  assert(Number.isFinite(actual), `${label}: expected a finite number, got ${actual}`);
  assert(Math.abs(actual - expected) <= tolerance,
    `${label}: expected ${expected} ± ${tolerance}, got ${actual}`);
}

function withSolid(prepared, inspect) {
  assert.equal(prepared.bodies.length, 1, 'one printable material body');
  const solid = new wasm.Manifold(prepared.bodies[0].mesh);
  try {
    assert.equal(solid.status(), 'NoError', 'returned mesh reconstructs a closed solid');
    const parts = solid.decompose();
    try {
      assert.equal(parts.length, 1, 'mesh really contains one connected solid');
    } finally {
      parts.forEach(part => part.delete());
    }
    return inspect(solid);
  } finally {
    solid.delete();
  }
}

function checkSolid(result, {width, height, depth, volume, dimTolerance = 0.001, volumeTolerance = 0.01}) {
  const {prepared, report} = result;
  assert.equal(report.parts, 1);
  near(report.bounds.width, width, dimTolerance, 'report width (X)');
  near(report.bounds.height, height, dimTolerance, 'report extrusion height (Y)');
  near(report.bounds.depth, depth, dimTolerance, 'report depth (Z)');
  near(report.volume, volume, volumeTolerance, 'report volume');
  withSolid(prepared, solid => {
    const {min, max} = solid.boundingBox();
    near(max[0] - min[0], width, dimTolerance, 'mesh X span');
    near(max[1] - min[1], height, dimTolerance, 'mesh Y span');
    near(max[2] - min[2], depth, dimTolerance, 'mesh Z span');
    near(min[1], 0, dimTolerance, 'mesh sits on the build plane');
    near(solid.volume(), volume, volumeTolerance, 'mesh volume');
  });
}

function stl(prepared) {
  return exportMaterialBodies(prepared, {name: 'SVG import'}).stls[0].bytes;
}

function inspectBinaryStl(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const count = view.getUint32(80, true);
  assert(count > 0, 'STL includes triangles');
  assert.equal(bytes.byteLength, 84 + 50 * count, 'binary STL triangle count matches its length');
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  const points = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  const cross = new THREE.Vector3();
  let volume = 0;
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < points.length; j++) {
      const xyz = [0, 1, 2].map(axis => {
        const n = view.getFloat32(84 + 50 * i + 12 + 12 * j + 4 * axis, true);
        assert(Number.isFinite(n), 'STL coordinate is finite');
        min[axis] = Math.min(min[axis], n);
        max[axis] = Math.max(max[axis], n);
        return n;
      });
      points[j].set(...xyz);
    }
    const [a, b, c] = points;
    volume += a.dot(cross.crossVectors(b, c)) / 6;
  }
  return {min, max, volume};
}

test('rectangle: proportional fit, explicit height, 90° rotation, and Z-up binary STL', async () => {
  const artwork = await fixture('rectangle');
  const proportional = createSvgImport(artwork, {widthMm: 64, depthMm: 6});
  checkSolid(await prepare(proportional), {width: 64, height: 6, depth: 32, volume: 64 * 32 * 6});

  const stretched = createSvgImport(artwork, {widthMm: 64, heightMm: 24, depthMm: 6});
  checkSolid(await prepare(stretched), {width: 64, height: 6, depth: 24, volume: 64 * 24 * 6});
  const rotated = createSvgImport(artwork, {widthMm: 64, heightMm: 24, depthMm: 6, rotationDeg: 90});
  const result = await prepare(rotated);
  checkSolid(result, {width: 24, height: 6, depth: 64, volume: 64 * 24 * 6});
  const {min, max, volume} = inspectBinaryStl(stl(result.prepared));
  [24, 64, 6].forEach((size, axis) => near(max[axis] - min[axis], size, 0.001, `STL axis ${axis} span`));
  near(min[2], 0, 0.001, 'STL starts at Z=0');
  near(volume, 64 * 24 * 6, 0.01, 'Z-up conversion preserves outward winding and volume');
});

test('circle and cubic/arc silhouette: true outline bounds and analytic volumes', async () => {
  const circle = await make('circle', {widthMm: 64, depthMm: 5});
  checkSolid(await prepare(circle), {
    width: 64, height: 5, depth: 64, volume: Math.PI * 32 ** 2 * 5, volumeTolerance: 160,
  });
  const curves = await make('curves', {widthMm: 80, depthMm: 4});
  // Cubic reach = 27; the arc adds 20. The integral under the cubic cap is 1620.
  checkSolid(await prepare(curves), {
    width: 80, height: 4, depth: 47, volume: (1620 + 400 * Math.PI) * 4,
    dimTolerance: 0.3, volumeTolerance: 175,
  });
});

test('clockwork: all five cutouts survive fill and extrusion in a single solid', async () => {
  const record = await make('clockwork', {widthMm: 100, depthMm: 5});
  const result = await prepare(record);
  checkSolid(result, {width: 100, height: 5, depth: 100, volume: (6780 - 338 - 4 * 120) * 5});
  withSolid(result.prepared, solid => {
    for (const [x, z] of [[0, 0], [27, 0], [-27, 0], [0, 27], [0, -27]]) {
      near(probeVolume(solid, x, z, 5), 0, 0.00001, `cutout at (${x}, ${z}) goes through`);
    }
    near(probeVolume(solid, 15, 15, 5), 0.25 * 5, 0.00001, 'web between cutouts remains solid');
  });
});

test('nested transforms: nonuniform SVG scale applies to both outline and cutout', async () => {
  const record = await make('nested', {widthMm: 120, depthMm: 7});
  const result = await prepare(record);
  checkSolid(result, {width: 120, height: 7, depth: 60, volume: (60 * 40 - 20 * 10 - 20 * 10) * 3 * 7});
  withSolid(result.prepared, solid => {
    near(probeVolume(solid, -10, 0, 7), 0, 0.00001, 'transformed cutout remains open through the full depth');
    near(probeVolume(solid, 32, 0, 7), 0.25 * 7, 0.00001, 'adjacent artwork remains solid');
  });
});

function probeVolume(solid, x, z, height) {
  const box = wasm.Manifold.cube([0.5, height + 2, 0.5]);
  const probe = box.translate([x - 0.25, -1, z - 0.25]);
  const hit = solid.intersect(probe);
  try {
    return hit.volume();
  } finally {
    hit.delete();
    probe.delete();
    box.delete();
  }
}

test('pixel holes remove real material, and a bore in a natural SVG void is rejected', async () => {
  const rectangle = await make('rectangle', {widthMm: 64, depthMm: 6});
  const hole = {x: 11, z: -5, diameter: 10, clearance: 0.4};
  const options = {pixelHoles: [hole]};
  const withoutBore = await prepare(rectangle);
  const withBore = await prepare(rectangle, options);
  const removed = Math.PI * ((hole.diameter + hole.clearance) / 2) ** 2 * 6;
  near(withoutBore.report.volume - withBore.report.volume, removed, removed * 0.015, 'cylindrical material removed');
  checkSolid(withBore, {width: 64, height: 6, depth: 32, volume: 64 * 32 * 6 - removed, volumeTolerance: removed * 0.015});
  withSolid(withBore.prepared, solid => {
    near(probeVolume(solid, hole.x, hole.z, 6), 0, 0.00001, 'new bore is open through both faces');
    near(probeVolume(solid, 0, 0, 6), 0.25 * 6, 0.00001, 'material outside the bore is preserved');
  });

  const clockwork = await make('clockwork', {widthMm: 100, depthMm: 5});
  await assert.rejects(async () => prepare(clockwork, {pixelHoles: [{...hole, x: 0, z: 0}]}),
    /does not cut|no material|void|no intersection/i);
});

test('parsing, recipe generation, serialization, and STL export are deterministic', async () => {
  const settings = {widthMm: 100, depthMm: 7, rotationDeg: 23};
  const first = await make('clockwork', settings);
  const second = await make('clockwork', settings);
  const serialized = serializeSvgImport(first);
  assert.deepEqual(serializeSvgImport(second), serialized);
  const restored = restoreSvgImport(serialized);
  assert.deepEqual(serializeSvgImport(restored), serialized);
  const options = {pixelHoles: [{x: 14, z: 14, diameter: 3, clearance: 0.2}]};
  const recipe = buildSvgExtrusionRecipe(first, options);
  assert.deepEqual(buildSvgExtrusionRecipe(second, options), recipe);
  assert.deepEqual(buildSvgExtrusionRecipe(restored, options), recipe);
  const a = await prepare(first, options);
  const b = await prepare(restored, options);
  assert.deepEqual(a.report, b.report);
  assert.deepEqual(stl(a.prepared), stl(b.prepared));
  const first3mf = exportMaterialBodies(a.prepared).threeMF;
  assert.deepEqual(first3mf, exportMaterialBodies(b.prepared).threeMF);
  const container = Buffer.from(first3mf).toString('utf8');
  assert.match(container, /<model unit="millimeter"/);
  assert.match(container, /<triangle v1="/);
});

test('disconnected artwork parses but cannot produce a printable result', async () => {
  const artwork = await fixture('islands');
  await assert.rejects(async () => {
    const record = createSvgImport(artwork, {widthMm: 80, depthMm: 5});
    await prepare(record);
  }, /independent (?:pieces|parts|solids)|disconnected|separate (?:pieces|parts|solids)/i);
});

test('fill rules follow the element winding, not the appearance of a second outline', async () => {
  const outer = 'M 0 0 H 40 V 40 H 0 Z';
  const same = 'M 10 10 H 30 V 30 H 10 Z';
  const reverse = 'M 10 10 V 30 H 30 V 10 Z';
  for (const [rule, inner, volume] of [
    ['evenodd', same, 3600], ['nonzero', same, 4800], ['nonzero', reverse, 3600],
  ]) {
    const artwork = await parseSvgArtwork(svg(`<path fill-rule="${rule}" d="${outer} ${inner}"/>`));
    checkSolid(await prepare(createSvgImport(artwork, {widthMm:40,depthMm:3})),
      {width:40,height:3,depth:40,volume});
  }
});

test('absolute viewport units and viewBox mapping do not bypass explicit print scaling', async () => {
  const artwork = await parseSvgArtwork('<svg width="2in" height="25.4mm" viewBox="0 0 20 20" preserveAspectRatio="none"><rect width="20" height="20"/></svg>');
  near(artwork.source.dimensions.widthMm, 50.8, 1e-8, 'SVG viewport width in mm');
  near(artwork.source.dimensions.heightMm, 25.4, 1e-8, 'SVG viewport height in mm');
  checkSolid(await prepare(createSvgImport(artwork, {widthMm:80,depthMm:3})),
    {width:80,height:3,depth:40,volume:9600});
});

test('contour limits reject open, crossing, microscopic, and oversized artwork', async () => {
  await assert.rejects(parseSvgArtwork(svg('<path d="M 0 0 H 30 V 30"/>')), /clos/i);
  await assert.rejects(parseSvgArtwork(svg('<path d="M 0 0 L 30 30 L 0 30 L 30 0 Z"/>')), /intersect|area/i);
  await assert.rejects(parseSvgArtwork(svg(' '.repeat(256 * 1024) + rect)), /256 KiB/);
  await assert.rejects(parseSvgArtwork(svg('<rect x="110" y="0" width="30" height="30"/>')), /outside the SVG viewport/i);
  const artwork = await parseSvgArtwork(svg('<path fill-rule="evenodd" d="M 0 0 H 100 V 70 H 0 Z M 30 30 H 30.001 V 30.001 H 30 Z"/>'));
  assert.throws(() => createSvgImport(artwork, {widthMm:100,depthMm:3}), /too small/i);
});

test('thousands of source vertices remain bounded and produce closed export geometry', async () => {
  const regular = n => Array.from({length:n}, (_,i) => {
    const angle = 2*Math.PI*i/n;
    return `${(40+35*Math.cos(angle)).toFixed(7)},${(40+35*Math.sin(angle)).toFixed(7)}`;
  }).join(' ');
  const start = performance.now();
  const art = await parseSvgArtwork(svg(`<polygon points="${regular(3000)}"/>`));
  const result = await prepare(createSvgImport(art, {widthMm:70,depthMm:4}));
  checkSolid(result, {width:70,height:4,depth:70,volume:Math.PI*35**2*4,volumeTolerance:1});
  assert(performance.now()-start < 5000, 'bounded fixture should prepare within five seconds');
  await assert.rejects(parseSvgArtwork(svg(`<polygon points="${regular(6500)}"/>`)), /point limit|too long|exceeds/i);
});

test('invalid extrusion dimensions and invalid serialized records are rejected', async () => {
  const artwork = await fixture('rectangle');
  const settings = {widthMm: 64, depthMm: 6};
  for (const invalid of [
    {widthMm: 0}, {widthMm: Infinity}, {heightMm: -1}, {heightMm: NaN},
    {depthMm: 0}, {depthMm: -4}, {rotationDeg: Infinity},
  ]) {
    assert.throws(() => createSvgImport(artwork, {...settings, ...invalid}), Error,
      `invalid settings: ${Object.keys(invalid)[0]} = ${Object.values(invalid)[0]}`);
  }
  const serialized = serializeSvgImport(createSvgImport(artwork, settings));
  assert.throws(() => restoreSvgImport('null'), Error);
  assert.throws(() => restoreSvgImport('{}'), Error);
  assert.throws(() => restoreSvgImport('{'), Error);
  const invalid = JSON.parse(serialized);
  invalid.dimensions.depthMm = -1;
  assert.throws(() => restoreSvgImport(JSON.stringify(invalid)), Error);
});

for (const [name, text] of [
  ['non-SVG root', '<drawing/>'],
  ['mismatched XML tags', '<svg><g></svg>'],
  ['empty artwork', svg('')],
  ['zero-area fill', svg('<rect x="10" y="10" width="0" height="20"/>')],
  ['invalid path data', svg('<path d="M 0 0 L 10"/>')],
  ['external vector reference', svg(`${rect}<use href="https://example.invalid/sample.svg#square"/>`)],
  ['external raster image', svg(`${rect}<image href="https://example.invalid/sample.png" width="10" height="10"/>`)],
  ['inline raster image element', svg(`${rect}<image width="10" height="10"/>`)],
  ['script element (inert JSON)', svg(`${rect}<script type="application/json">{}</script>`)],
  ['text', svg(`${rect}<text x="2" y="2">Sample</text>`)],
  ['filter', svg(`${rect}<filter id="soften"/>`)],
  ['referenced paint', svg('<rect x="10" y="10" width="100" height="60" fill="url(#sample-paint)"/>')],
  ['stroke on a filled shape', svg('<rect x="10" y="10" width="100" height="60" stroke="black"/>')],
  ['stroke-only artwork', svg('<path fill="none" stroke="black" d="M 10 10 H 35 V 35 Z"/>')],
]) {
  test(`invalid input: ${name}`, async () => {
    await assert.rejects(async () => parseSvgArtwork(text, {name: `${name}.svg`}), Error);
  });
}
