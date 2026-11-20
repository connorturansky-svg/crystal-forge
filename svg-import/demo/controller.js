import { buildSvgExtrusionRecipe, createSvgImport, MAX_SVG_BYTES, parseSvgArtwork } from '../index.js';
import { createPreview } from './preview.js';

const $ = id => document.getElementById(id);
const samples = new Set(['rectangle.svg', 'circle.svg', 'clockwork.svg', 'nested.svg', 'curves.svg']);
const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 3 });
const dimensionsKey = record => JSON.stringify(record.dimensions);
const WORKER_TIMEOUT_MS = 30_000;

function showContours(artwork) {
  const { bounds, loops, source, components } = artwork;
  const pad = Math.max(bounds.width, bounds.height) * .09;
  const svg = $('contours');
  svg.setAttribute('viewBox', [bounds.minX - pad, bounds.minY - pad, bounds.width + pad * 2, bounds.height + pad * 2].join(' '));
  svg.querySelector('path')?.remove();
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('fill-rule', 'evenodd');
  path.setAttribute('d', loops.map(({ points }) => `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z`).join(''));
  svg.append(path);
  const holes = loops.filter(loop => loop.kind === 'hole').length;
  const summary = `${components} ${components === 1 ? 'outer contour' : 'outer contours'} · ${holes} ${holes === 1 ? 'hole' : 'holes'}`;
  $('contour-title').textContent = `${source.name}: ${summary}`;
  $('contour-count').textContent = summary;
  $('source-name').textContent = source.dimensions
    ? `${source.name} · ${number.format(source.dimensions.widthMm)} × ${number.format(source.dimensions.heightMm)} mm source`
    : source.name;
  $('source-name').hidden = false;
}

export function start(dependencies) {
  const cameraButtons = [...document.querySelectorAll('[data-view]')];
  const dimensionsFields = [$('width'), $('height'), $('depth'), $('rotation')];
  const [width, height, depth, rotation] = dimensionsFields;
  let preview;
  try {
    preview = createPreview($('viewport'));
    $('preview-message').textContent = 'Choose an SVG to preview its extrusion.';
  } catch {
    $('preview-message').textContent = '3D preview requires WebGL. Contours, mesh validation and downloads are still available.';
  }

  let artwork, record, validation, job, request;
  let selectedSample = '';
  let validInput = false;
  let message = 'Choose an SVG to start.';
  const setError = (text = '') => {
    $('error').textContent = text;
    $('error').hidden = !text;
  };
  function showGeometry(label) {
    $('geometry-state').textContent = label;
    $('geometry-state').hidden = !preview;
  }
  function sync() {
    const canAct = Boolean(record && validInput && !request && !job);
    $('validate').disabled = !canAct || Boolean(validation);
    $('cancel').hidden = !job;
    $('stl').disabled = $('threemf').disabled = !canAct || !validation;
    $('settings').disabled = !artwork;
    $('status').textContent = request ? 'Reading artwork…' : message;
    for (const button of cameraButtons) button.disabled = !preview || !record;
  }
  function stopJob() {
    if (!job) return;
    clearTimeout(job.timer);
    job.worker.terminate();
    job = null;
  }
  function invalidate() {
    stopJob();
    validation = null;
    $('report').hidden = true;
    $('report-empty').hidden = false;
  }
  function dimensionOptions(source, useCurrentValues) {
    const previous = record?.dimensions ?? { widthMm: 60, heightMm: 60, depthMm: 5, rotationDeg: 0 };
    const locked = $('lock').checked;
    const widthMm = useCurrentValues ? width.valueAsNumber : previous.widthMm;
    const heightMm = locked ? undefined : (useCurrentValues ? height.valueAsNumber : previous.heightMm);
    if (locked) {
      const derived = widthMm * source.bounds.height / source.bounds.width;
      if (useCurrentValues) height.value = Number.isFinite(derived) ? String(Number(derived.toPrecision(10))) : '';
    }
    return {
      widthMm, heightMm,
      depthMm: useCurrentValues ? depth.valueAsNumber : previous.depthMm,
      rotationDeg: useCurrentValues ? rotation.valueAsNumber : previous.rotationDeg,
    };
  }
  function updateDimensions() {
    if (!artwork) return;
    height.readOnly = $('lock').checked;
    dimensionsFields.forEach(field => field.removeAttribute('aria-invalid'));
    try {
      const next = createSvgImport(artwork, dimensionOptions(artwork, true));
      if (dimensionsKey(next) !== dimensionsKey(record)) {
        preview?.setRecipe(buildSvgExtrusionRecipe(next));
        invalidate();
        showGeometry('Unvalidated preview');
        message = 'Dimensions updated. Validate the mesh to enable downloads.';
      }
      record = next;
      validInput = true;
      setError();
    } catch (error) {
      validInput = false;
      if (job) {
        stopJob();
        message = 'Validation canceled. Enter valid dimensions to try again.';
      }
      dimensionsFields.filter(field => !field.validity.valid).forEach(field => field.setAttribute('aria-invalid', 'true'));
      setError(`${error.message} The preview still shows the last accepted dimensions.`);
    }
    sync();
  }
  async function load(name, read, sample = '') {
    request?.abort();
    const loading = new AbortController();
    request = loading;
    if (job) {
      stopJob();
      message = 'Validation canceled. Validate the displayed model to enable downloads.';
    }
    setError();
    sync();
    try {
      const text = await read(loading.signal);
      if (request !== loading) return;
      const parsed = await parseSvgArtwork(text, { name });
      if (request !== loading) return;
      const next = createSvgImport(parsed, dimensionOptions(parsed, false));
      preview?.setRecipe(buildSvgExtrusionRecipe(next), { reset: true });
      artwork = parsed;
      record = next;
      selectedSample = sample;
      width.value = next.dimensions.widthMm;
      height.value = Number(next.dimensions.heightMm.toPrecision(10));
      depth.value = next.dimensions.depthMm;
      rotation.value = next.dimensions.rotationDeg;
      dimensionsFields.forEach(field => field.removeAttribute('aria-invalid'));
      validInput = true;
      invalidate();
      showContours(artwork);
      showGeometry('Unvalidated preview');
      if (preview) $('preview-message').hidden = true;
      message = 'Artwork loaded. Validate the mesh to enable downloads.';
      setError();
    } catch (error) {
      if (request !== loading) return;
      setError(`Could not import ${name}: ${error.message}${record ? ' The previous model is still shown.' : ''}`);
    } finally {
      if (request === loading) {
        request = null;
        $('sample').value = selectedSample;
        sync();
      }
    }
  }
  function loadSample(sample) {
    if (!samples.has(sample)) return;
    load(sample, async signal => {
      const response = await fetch(new URL(`../../tests/fixtures/svg-import/${sample}`, import.meta.url), {
        signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
      });
      if (!response.ok) throw Error(`Sample could not be loaded (HTTP ${response.status}).`);
      return response.text();
    }, sample);
  }
  function showReport({ bounds, volume, parts, triangles }) {
    $('extents').textContent = `${[bounds.width, bounds.depth, bounds.height].map(value => number.format(value)).join(' × ')} mm`;
    $('volume').textContent = `${number.format(volume)} mm³`;
    $('parts').textContent = number.format(parts);
    $('triangles').textContent = number.format(triangles);
    $('report').hidden = false;
    $('report-empty').hidden = true;
  }
  function validate() {
    if ($('validate').disabled) return;
    invalidate();
    setError();
    message = 'Starting mesh validation…';
    try {
      const worker = new Worker(new URL('./validation-worker.js', import.meta.url), { type: 'module' });
      const attempt = { worker };
      job = attempt;
      const finish = (error, result) => {
        if (job !== attempt) return;
        const cancelHadFocus = document.activeElement === $('cancel');
        stopJob();
        if (error) {
          message = 'Mesh not validated.';
          setError(error);
        } else {
          validation = result.files;
          showReport(result.report);
          message = 'Manifold validated the mesh. STL and 3MF are ready to download.';
          if (preview) {
            try {
              preview.setPrepared(result.mesh);
              showGeometry('Validated Manifold mesh');
            } catch {
              setError('The validated 3D mesh could not be displayed. Downloads still use the validated mesh.');
            }
          }
        }
        sync();
        if (cancelHadFocus) $(error ? 'validate' : 'stl').focus();
      };
      attempt.timer = setTimeout(() => finish('Mesh validation timed out after 30 seconds. Try smaller or simpler artwork.'), WORKER_TIMEOUT_MS);
      worker.onmessage = ({ data }) => {
        if (job !== attempt) return;
        if (data.type === 'progress') {
          message = data.text;
          sync();
        } else if (data.type === 'ready') finish(null, data);
        else if (data.type === 'error') finish(data.text);
      };
      worker.onerror = event => {
        event.preventDefault();
        finish('The validation worker could not start or stopped unexpectedly. Reload and retry.');
      };
      worker.onmessageerror = () => finish('Could not read the validation result. Try again.');
      worker.postMessage({ record, ...dependencies });
    } catch (error) {
      stopJob();
      setError(`Could not start validation: ${error.message}`);
      message = 'Mesh not validated.';
    }
    sync();
    if (job) $('cancel').focus();
  }
  function download(format) {
    const file = validation?.[format];
    if (!file || $(format).disabled) return;
    const url = URL.createObjectURL(new Blob([file.bytes], { type: file.mime }));
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  $('sample').addEventListener('change', event => loadSample(event.target.value));
  $('file').addEventListener('change', event => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    load(file.name, () => {
      if (file.size > MAX_SVG_BYTES) throw Error(`Choose an SVG no larger than ${MAX_SVG_BYTES / 1024} KiB.`);
      return file.text();
    });
  });
  $('dimensions').addEventListener('submit', event => event.preventDefault());
  for (const field of dimensionsFields) field.addEventListener('input', updateDimensions);
  $('lock').addEventListener('change', updateDimensions);
  for (const button of cameraButtons) button.addEventListener('click', () => preview?.view(button.dataset.view));
  $('validate').addEventListener('click', validate);
  $('cancel').addEventListener('click', () => {
    stopJob();
    message = 'Validation canceled. Validate again when ready.';
    sync();
    $('validate').focus();
  });
  $('stl').addEventListener('click', () => download('stl'));
  $('threemf').addEventListener('click', () => download('threemf'));
  $('sample').disabled = $('file').disabled = false;
  loadSample('clockwork.svg');
}
