import { extrusionLoops, boundsOf, validatePhysicalLoops, distanceToEdge, contains } from './contours.js';
import { readSvgDocument } from './document.js';
import { flattenEllipse, flattenPath } from './path.js';
import { prepareRecipe } from '../studio-geometry.js';
import { addPixelHoleCuts } from '../studio-pixel-builder.js';

export const MAX_SVG_BYTES = 256 * 1024;
const MAX_POINTS = 6000;
const MAX_LOOPS = 128;
const MAX_TRIANGLES = 40000;
const MAX_MM = 500;
const MIN_FEATURE = .05;
const POINT_NUMBER = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/y;

function polygon(text) {
 const numbers = [];
 let cursor = 0;
 while (cursor < text.length) {
  const space = /^[ \t\r\n]*/.exec(text.slice(cursor))[0];
  cursor += space.length;
  if (cursor === text.length) break;
  if (numbers.length && text[cursor] === ',') {
   cursor++;
   cursor += /^[ \t\r\n]*/.exec(text.slice(cursor))[0].length;
  } else if (numbers.length && !space && !/[+-]/.test(text[cursor])) {
   throw Error('Malformed polygon points; separate each coordinate.');
  }
  POINT_NUMBER.lastIndex = cursor;
  const token = POINT_NUMBER.exec(text);
  if (!token || !Number.isFinite(Number(token[0]))) throw Error('Malformed polygon points.');
  numbers.push(Number(token[0]));
  if (numbers.length > MAX_POINTS * 2) throw Error('Polygon exceeds the contour point limit.');
  cursor = POINT_NUMBER.lastIndex;
 }
 if (numbers.length < 6 || numbers.length % 2) throw Error('A polygon needs at least three coordinate pairs.');
 const points = [];
 for (let i = 0; i < numbers.length; i += 2) points.push(numbers.slice(i, i + 2));
 return points;
}

function geometryNumber(value, label, fallback) {
 if (value === undefined && fallback !== undefined) return fallback;
 if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?(?:px)?$/.test(value.trim())) {
  throw Error(`${label} needs a finite SVG user-unit value (or px).`);
 }
 const n = Number(value.trim().replace(/px$/, ''));
 if (!Number.isFinite(n) || Math.abs(n) > 1e9) throw Error(`${label} is outside the supported coordinate range.`);
 return n;
}

function sampleShapes(shapes, tolerance, probes) {
 let count = 0;
 const budget = () => {
  if (++count > MAX_POINTS) throw Error('Artwork exceeds the contour point limit; simplify curves or split the SVG.');
 };
 return shapes.map(({ tag, attrs, fillRule, map }) => {
  const project = point => {
   const next = map(point);
   if (!next.every(v => Number.isFinite(v) && Math.abs(v) <= 1e9)) throw Error('Transformed SVG coordinates are outside the supported range.');
   if (probes) for (let i = 0; i < 2; i++) {
    probes.min[i] = Math.min(probes.min[i], next[i]); probes.max[i] = Math.max(probes.max[i], next[i]);
   }
   return next;
  };
  const n = (key, fallback) => geometryNumber(attrs[key], `${tag} ${key}`, fallback);
  let loops;
  if (tag === 'path') {
   if (!attrs.d?.trim()) throw Error('A filled path needs path data.');
   loops = flattenPath(attrs.d, project, tolerance, budget);
  } else if (tag === 'circle' || tag === 'ellipse') {
   const rx = n(tag === 'circle' ? 'r' : 'rx'), ry = tag === 'circle' ? rx : n('ry');
   if (rx <= 0 || ry <= 0) throw Error('A circle or ellipse needs positive radii.');
   loops = [flattenEllipse(n('cx', 0), n('cy', 0), rx, ry, project, tolerance, budget)];
  } else {
   let points;
   if (tag === 'polygon') points = polygon(attrs.points || '');
   else {
    const x = n('x', 0), y = n('y', 0), w = n('width'), h = n('height');
    if (w <= 0 || h <= 0) throw Error('A rectangle needs positive width and height.');
    if (n('rx', 0) !== 0 || n('ry', 0) !== 0) throw Error('Convert rounded rectangles to closed paths before import.');
    points = [[x,y], [x+w,y], [x+w,y+h], [x,y+h]];
   }
   loops = [points.map(point => { budget(); return project(point); })];
  }
  return { fillRule, loops };
 });
}

function assertText(text) {
 if (typeof text !== 'string' || !text.trim()) throw Error('Choose a non-empty UTF-8 SVG file.');
 if (text.length > MAX_SVG_BYTES || new TextEncoder().encode(text).length > MAX_SVG_BYTES) {
  throw Error('SVG exceeds the 256 KiB input limit; simplify or split the artwork.');
 }
}

export async function parseSvgArtwork(text, { name = 'artwork.svg' } = {}) {
 assertText(text);
 const document = readSvgDocument(text);
 if (!document.shapes.length) throw Error('SVG contains no supported filled artwork.');
 const probes = { min:[Infinity,Infinity], max:[-Infinity,-Infinity] };
 sampleShapes(document.shapes, 1e10, probes);
 const initialSpan = Math.min(...probes.max.map((v, i) => v - probes.min[i]));
 if (!(initialSpan > 0)) throw Error('Artwork has zero area; draw a closed filled outline.');
 // The second pass is in transformed source units; validate the scaled error again at recipe time.
 let tolerance = initialSpan / 12000;
 let shapes = sampleShapes(document.shapes, tolerance);
 let bounds = boundsOf(shapes.flatMap(s => s.loops));
 const targetTolerance = Math.min(bounds.width, bounds.height) / 12000;
 if (targetTolerance > 0 && targetTolerance < tolerance * .8) {
  tolerance = targetTolerance;
  shapes = sampleShapes(document.shapes, tolerance);
  bounds = boundsOf(shapes.flatMap(s => s.loops));
 }
 if (!(bounds.width > 0 && bounds.height > 0)) throw Error('Artwork has zero area.');
 if (document.withinViewport && shapes.some(shape => shape.loops.some(loop => loop.some(point => !document.withinViewport(point))))) {
  throw Error('Artwork extends outside the SVG viewport. Fit the page to the drawing or crop it to closed paths before import.');
 }
 const loops = extrusionLoops(shapes, MAX_LOOPS);
 bounds = boundsOf(loops.map(l => l.points));
 if (!globalThis.crypto?.subtle) throw Error('Source hashing needs a secure browser context; serve the demo on localhost.');
 const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
 const sha256 = Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
 const source = {
  name: String(name).split(/[/\\]/).at(-1).slice(0, 160) || 'artwork.svg',
  sha256, dimensions: document.dimensions ?? null, viewBox: document.viewBox ?? null
 };
 return { loops, bounds, source, tolerance, warnings: document.warnings ?? [],
  components: loops.filter(loop => loop.kind === 'outer').length };
}

function physicalNumber(value, label, min, max) {
 if (!Number.isFinite(value) || value < min || value > max) throw Error(`${label} must be ${min}–${max} mm.`);
 return value;
}

function dimensionsOf(record) {
 const { widthMm, heightMm, depthMm, rotationDeg } = record.dimensions;
 physicalNumber(widthMm, 'Target width', .5, MAX_MM);
 physicalNumber(heightMm, 'Target height', .5, MAX_MM);
 physicalNumber(depthMm, 'Extrusion depth', .2, 100);
 if (!Number.isFinite(rotationDeg) || Math.abs(rotationDeg) > 360) throw Error('Rotation must be between −360° and 360°.');
 return { widthMm, heightMm, depthMm, rotationDeg };
}

function checkedRecord(record) {
 if (record?.version !== 1 || record.kind !== 'svg-extrusion' || !Array.isArray(record.loops) || !record.loops.length ||
     record.loops.length > MAX_LOOPS || typeof record.aspectLocked !== 'boolean' || !record.dimensions ||
     !Number.isFinite(record.tolerance) || record.tolerance <= 0 || record.tolerance > 1e9 ||
     typeof record.source?.name !== 'string' || record.source.name.length > 160 ||
     !/^[0-9a-f]{64}$/.test(record.source.sha256)) {
  throw Error('Invalid or unsupported SVG extrusion record.');
 }
 let total = 0;
 for (const loop of record.loops) {
  if (!['outer','hole'].includes(loop?.kind) || !Array.isArray(loop.points) || (total += loop.points.length) > MAX_POINTS ||
      loop.points.length < 3 || loop.points.some(p => !Array.isArray(p) || p.length !== 2 ||
        p.some(v => !Number.isFinite(v) || Math.abs(v) > 1e9))) {
   throw Error('Invalid or excessive saved contour geometry.');
  }
 }
 const viewport = record.source.dimensions;
 const viewBox = record.source.viewBox;
 if ((viewport !== null && (!viewport || !Number.isFinite(viewport.widthMm) || viewport.widthMm <= 0 ||
      !Number.isFinite(viewport.heightMm) || viewport.heightMm <= 0)) ||
     (viewBox !== null && (!Array.isArray(viewBox) || viewBox.length !== 4 || !viewBox.every(Number.isFinite) ||
      viewBox[2] <= 0 || viewBox[3] <= 0))) throw Error('Invalid SVG source dimensions in saved record.');
 dimensionsOf(record);
 return record;
}

export function createSvgImport(artwork, { widthMm, heightMm, depthMm, rotationDeg = 0 } = {}) {
 if (!artwork?.bounds) throw Error('Parse an SVG before setting its dimensions.');
 const aspectLocked = heightMm === undefined;
 const record = checkedRecord({
  version: 1, kind: 'svg-extrusion', source: structuredClone(artwork.source),
  loops: structuredClone(artwork.loops), tolerance: artwork.tolerance, aspectLocked,
  dimensions: { widthMm, heightMm: heightMm ?? widthMm * artwork.bounds.height / artwork.bounds.width, depthMm, rotationDeg }
 });
 buildSvgExtrusionRecipe(record);
 return record;
}

export function buildSvgExtrusionRecipe(input, { pixelHoles = [] } = {}) {
 const record = checkedRecord(input);
 const outer = record.loops.filter(l => l.kind === 'outer');
 if (outer.length !== 1) throw Error(`Artwork contains ${outer.length} independent pieces. Export each connected piece as a separate SVG.`);
 const sourceBounds = boundsOf(record.loops.map(l => l.points));
 const { widthMm, heightMm, depthMm, rotationDeg } = dimensionsOf(record);
 const sx = widthMm / sourceBounds.width, sz = heightMm / sourceBounds.height;
 if (!Number.isFinite(sx) || !Number.isFinite(sz) || record.tolerance * Math.max(sx, sz) > MIN_FEATURE) {
  throw Error('Requested scale exceeds the 0.05 mm curve tolerance; reduce dimensions or simplify extreme aspect ratios.');
 }
 if (record.aspectLocked && Math.abs(sx/sz - 1) > 1e-8) throw Error('Saved locked dimensions do not preserve the artwork aspect ratio.');
 const radians = rotationDeg * Math.PI / 180, c = Math.cos(radians), s = Math.sin(radians);
 const cx = (sourceBounds.minX + sourceBounds.maxX) / 2, cz = (sourceBounds.minY + sourceBounds.maxY) / 2;
 const project = ([u,v]) => {
  const x = (u-cx)*sx, z = (v-cz)*sz;
  return [x*c-z*s, x*s+z*c];
 };
 const outline = outer[0].points.map(project);
 const holes = record.loops.filter(l => l.kind === 'hole').map(l => l.points.map(project));
 validatePhysicalLoops(outline, holes, MIN_FEATURE);
 const fit = boundsOf([outline]);
 const warnings = ['Mesh validation does not establish Cura slicing, minimum printable walls, physical fit or structural safety.'];
 if (!record.aspectLocked) warnings.push('Unlocked width and height may distort the source artwork.');
 const recipe = { positive:[{ kind:'extrude', outline, holes, height:depthMm }], negative:[], secondary:[],
  dualMaterial:false, bounds:{width:fit.width, depth:fit.height, height:depthMm}, warnings };
 addPixelHoleCuts(recipe, pixelHoles);
 for (const [i, cut] of recipe.negative.entries()) {
  const center = [cut.position[0], cut.position[2]];
  const clearance = cut.radius + 1;
  if (!contains(outline, center) || distanceToEdge(outline, center) < clearance ||
      holes.some(h => contains(h, center) || distanceToEdge(h, center) < clearance)) {
   throw Error(`Pixel hole ${i+1} is in or too close to an existing void or edge. Move it onto solid material in Build.`);
  }
 }
 return recipe;
}

export function prepareSvgImport(THREE, wasm, record, { pixelHoles = [], onProgress } = {}) {
 const recipe = buildSvgExtrusionRecipe(record, { pixelHoles });
 const prepared = prepareRecipe(THREE, wasm, recipe, { onProgress });
 const { mesh, volume } = prepared.bodies[0];
 const { vertProperties, numProp, triVerts } = mesh;
 const triangles = triVerts.length / 3;
 if (!Number.isFinite(volume) || volume <= 0 || !triangles || triangles > MAX_TRIANGLES) {
  throw Error('Prepared geometry has invalid volume or exceeds the 40,000-triangle limit.');
 }
 const min = [Infinity,Infinity,Infinity], max = [-Infinity,-Infinity,-Infinity];
 for (let i = 0; i < vertProperties.length; i += numProp) for (let j = 0; j < 3; j++) {
  const value = vertProperties[i+j];
  if (!Number.isFinite(value)) throw Error('Prepared geometry has a non-finite vertex.');
  min[j] = Math.min(min[j], value); max[j] = Math.max(max[j], value);
 }
 const [width,height,depth] = max.map((v,i) => v-min[i]);
 if (['width','height','depth'].some(key => {
  const measured = {width,height,depth}[key];
  return Math.abs(measured-recipe.bounds[key]) > .001;
 })) throw Error('Prepared mesh dimensions do not agree with the requested recipe.');
 return { prepared, report:{ bounds:{width,height,depth}, volume, parts:prepared.bodies.length, triangles, warnings:recipe.warnings } };
}

export function serializeSvgImport(record) {
 buildSvgExtrusionRecipe(record);
 return JSON.stringify(record);
}

export function restoreSvgImport(json) {
 if (typeof json !== 'string' || json.length > 512 * 1024) throw Error('Invalid or excessive saved SVG extrusion JSON.');
 let record;
 try { record = JSON.parse(json); }
 catch { throw Error('Malformed saved SVG extrusion JSON.'); }
 buildSvgExtrusionRecipe(record);
 return record;
}
