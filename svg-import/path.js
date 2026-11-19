const MAX_SOURCE = 4 * 1024 * 1024;
const MAX_COMMANDS = 100_000;
const MAX_POINTS = 200_000;
const MAX_VISITS = 400_000;
const MAX_DEPTH = 24;
const TAU = 2 * Math.PI;
const LETTER = /[a-z]/i;
const SPACE = /[ \t\r\n]/;
const ARITY = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7 };

function tooComplex(detail) {
  throw new Error(`SVG geometry is too complex (${detail}); simplify the outline or increase the flattening tolerance.`);
}

function finite(x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error("SVG geometry has non-finite coordinates; check the coordinates and transform or rescale the outline.");
  }
  return [x, y];
}

const same = (a, b) => a[0] === b[0] && a[1] === b[1];
const midpoint = (a, b) => [a[0] * 0.5 + b[0] * 0.5, a[1] * 0.5 + b[1] * 0.5];

function chordDistance(p, a, b) {
  const [dx, dy] = finite(b[0] - a[0], b[1] - a[1]);
  const [px, py] = finite(p[0] - a[0], p[1] - a[1]);
  const scale = Math.max(Math.abs(dx), Math.abs(dy));
  if (scale === 0) return Math.hypot(px, py);
  const sx = dx / scale, sy = dy / scale, norm = Math.hypot(sx, sy);
  const ux = sx / norm, uy = sy / norm;
  const projection = px * ux + py * uy;
  if (projection <= 0) return Math.hypot(px, py);
  if (projection >= scale * norm) return Math.hypot(p[0] - b[0], p[1] - b[1]);
  return Math.abs(px * uy - py * ux);
}

function flattener(map, tolerance, budget) {
  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    throw new Error("SVG flattening tolerance must be a positive finite number.");
  }
  if (typeof map !== "function" || (budget !== undefined && typeof budget !== "function")) {
    throw new TypeError("SVG flattening requires a map function and, if supplied, a budget callback.");
  }
  let visits = 0, emitted = 0;
  const project = ([x, y]) => {
    const result = map(finite(x, y));
    return finite(result?.[0], result?.[1]);
  };
  const visit = () => {
    if (++visits > MAX_VISITS) tooComplex("subdivision limit");
  };
  const store = (points, point) => {
    if (++emitted > MAX_POINTS) tooComplex("point limit");
    budget?.();
    points.push(point);
  };
  function loop(first) {
    const points = [];
    store(points, first);
    // Keep a return to the start only if it turns out to be an interior vertex.
    let pendingStart = false;
    return {
      add(point) {
        if (same(point, pendingStart ? first : points.at(-1))) return;
        if (pendingStart) store(points, first);
        pendingStart = same(point, first);
        if (!pendingStart) store(points, point);
      },
      finish(label) {
        for (let i = 2; i < points.length; i++) {
          if (!same(points[i], first) && !same(points[i], points[1])) return points;
        }
        throw new Error(`${label} has fewer than three distinct vertices; remove the degenerate outline or use a finer tolerance.`);
      },
    };
  }
  function bezier(points, add, depth = 0, minDepth = 0) {
    visit();
    const first = points[0], last = points.at(-1);
    if (depth >= minDepth && points.slice(1, -1).every(p => chordDistance(p, first, last) <= tolerance)) {
      add(last);
      return;
    }
    if (depth === MAX_DEPTH) tooComplex("Bézier subdivision depth");
    const left = [first], right = [last];
    let row = points;
    while (row.length > 1) {
      row = row.slice(1).map((p, i) => midpoint(row[i], p));
      left.push(row[0]);
      right.push(row.at(-1));
    }
    bezier(left, add, depth + 1, minDepth);
    bezier(right.reverse(), add, depth + 1, minDepth);
  }
  function conic(sample, a, b, first, last, add, depth = 0) {
    visit();
    const mid = (a + b) / 2;
    const middle = sample(mid);
    // Recover the rational quadratic control from the mapped midpoint so map only sees on-arc points.
    const chordMid = midpoint(first, last), k = 1 + 1 / Math.cos((b - a) / 2);
    const control = finite(
      chordMid[0] + k * (middle[0] - chordMid[0]), chordMid[1] + k * (middle[1] - chordMid[1]),
    );
    if (chordDistance(control, first, last) <= tolerance) {
      add(last);
      return;
    }
    if (depth === MAX_DEPTH || mid === a || mid === b) tooComplex("elliptical arc subdivision depth");
    conic(sample, a, mid, first, middle, add, depth + 1);
    conic(sample, mid, b, middle, last, add, depth + 1);
  }
  function arc(sample, start, sweep, first, last, add) {
    // Even at coarse tolerance an arc plus close needs an interior vertex.
    const count = Math.max(2, Math.ceil(Math.abs(sweep) / (Math.PI / 2)));
    let a = start, left = first;
    for (let i = 1; i <= count; i++) {
      const b = start + sweep * (i / count);
      const right = i === count ? last : sample(b);
      conic(sample, a, b, left, right, add);
      a = b;
      left = right;
    }
  }
  return { project, loop, bezier, arc };
}

function ellipseSample(project, cx, cy, rx, ry, cos, sin) {
  return (theta) => {
    const x = rx * (theta === Math.PI / 2 || theta === 3 * Math.PI / 2 ? 0 : Math.cos(theta));
    const y = ry * (theta === Math.PI ? 0 : Math.sin(theta));
    return project([cx + cos * x - sin * y, cy + sin * x + cos * y]);
  };
}

function endpointArc(from, to, rx, ry, rotation, large, sweep, project) {
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (rotation % 360) * (Math.PI / 180);
  const cos = Math.cos(phi), sin = Math.sin(phi);
  const [dx, dy] = midpoint(from, [-to[0], -to[1]]);
  const u = (cos * dx + sin * dy) / rx;
  const v = (-sin * dx + cos * dy) / ry;
  const h = Math.hypot(u, v);
  if (!(h > 0) || !Number.isFinite(h)) {
    throw new Error("SVG arc endpoints and radii exceed numeric precision; rescale the outline or adjust the arc radii.");
  }
  // SVG endpoint-to-center conversion: enlarge small radii, then solve in unit-circle space.
  if (h > 1) [rx, ry] = finite(rx * h, ry * h);
  const radius = Math.min(1, h);
  const ux = u / h, uy = v / h;
  const offset = (large === sweep ? -1 : 1) * Math.sqrt((1 - radius) * (1 + radius));
  const cu = offset * uy, cv = -offset * ux;
  const x = rx * cu, y = ry * cv;
  const [mx, my] = midpoint(from, to);
  const [cx, cy] = finite(mx + cos * x - sin * y, my + sin * x + cos * y);
  const start = Math.atan2(radius * uy - cv, radius * ux - cu);
  const short = 2 * Math.asin(radius);
  const angle = (sweep ? 1 : -1) * (large ? TAU - short : short);
  const sample = ellipseSample(project, cx, cy, rx, ry, cos, sin);
  // Probe input-space extrema even on a coarse bounds-estimation pass.
  const xExtreme = Math.atan2(-ry * sin, rx * cos);
  const yExtreme = Math.atan2(ry * cos, rx * sin);
  const direction = Math.sign(angle);
  for (const theta of [xExtreme, xExtreme + Math.PI, yExtreme, yExtreme + Math.PI]) {
    const delta = (direction * (theta - start)) % TAU;
    const offset = delta < 0 ? delta + TAU : delta;
    if (offset > 0 && offset < Math.abs(angle)) sample(start + direction * offset);
  }
  return { sample, start, angle };
}

/** Flatten explicitly closed SVG subpaths. For error bounds, map must be affine.
 * Map also receives probes/Bézier controls; budget counts only emitted vertices.
 */
export function flattenPath(d, map, tolerance, budget) {
  if (typeof d !== "string") throw new TypeError("SVG path data must be a string.");
  if (d.length > MAX_SOURCE) tooComplex("path data length limit");
  const { project, loop, bezier, arc } = flattener(map, tolerance, budget);
  const number = /[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/y;
  const loops = [];
  let pos = 0, commands = 0, command = null, previous = null;
  let current = [0, 0], origin, contour, subpathAt, mapped, control;

  function fail(message, at = pos) {
    throw new Error(`Malformed SVG path at offset ${at}: ${message}.`);
  }
  function skipSpace() {
    while (pos < d.length && SPACE.test(d[pos])) pos++;
  }
  function read(isFlag, commaAllowed) {
    skipSpace();
    if (commaAllowed && d[pos] === ",") {
      pos++;
      skipSpace();
    }
    if (isFlag) {
      if (d[pos] !== "0" && d[pos] !== "1") fail(`command ${command} requires a 0 or 1 arc flag`);
      return Number(d[pos++]);
    }
    number.lastIndex = pos;
    const match = number.exec(d);
    if (!match) fail(`expected a number for command ${command}`);
    const value = Number(match[0]);
    if (!Number.isFinite(value)) fail(`command ${command} requires finite numbers`);
    pos = number.lastIndex;
    return value;
  }
  function openError() {
    throw new Error(`Open SVG subpath at offset ${subpathAt}; close it with Z before starting another subpath or ending the path.`);
  }
  function begin(point, at) {
    current = origin = point;
    subpathAt = at;
    mapped = project(point);
    contour = loop(mapped);
  }

  for (;;) {
    skipSpace();
    if (pos === d.length) break;
    const at = pos, explicit = LETTER.test(d[pos]);
    if (explicit) command = d[pos++];
    if (!command) fail(origin ? "expected a path command" : "path must begin with M or m", at);
    const op = command.toUpperCase();
    if (op !== "Z" && !Object.hasOwn(ARITY, op)) fail(`unsupported command ${command}`, at);
    if (!origin && op !== "M") fail("path must begin with M or m", at);
    if (++commands > MAX_COMMANDS) tooComplex("path command limit");
    if (op === "Z") {
      if (contour) loops.push(contour.finish(`SVG subpath at offset ${subpathAt}`));
      current = origin;
      contour = command = null;
      previous = op;
      continue;
    }
    if (op === "M" && contour) openError();
    const args = Array.from({ length: ARITY[op] }, (_, i) =>
      read(op === "A" && (i === 3 || i === 4), !explicit || i > 0));
    const relative = command !== op;
    const [ox, oy] = relative ? current : [0, 0];
    const point = (i) => finite(ox + args[i], oy + args[i + 1]);
    if (op === "M") {
      begin(point(0), at);
      command = relative ? "l" : "L";
      previous = op;
      continue;
    }
    if (!contour) begin(current, at);
    const reflect = () => finite(
      current[0] + (current[0] - control[0]), current[1] + (current[1] - control[1]),
    );
    let end, handles = [];
    switch (op) {
      case "L": end = point(0); break;
      case "H": end = finite(ox + args[0], current[1]); break;
      case "V": end = finite(current[0], oy + args[0]); break;
      case "C": handles = [point(0), point(2)]; end = point(4); break;
      case "S":
        handles = [previous === "C" || previous === "S" ? reflect() : current, point(0)];
        end = point(2);
        break;
      case "Q": handles = [point(0)]; end = point(2); break;
      case "T":
        handles = [previous === "Q" || previous === "T" ? reflect() : current];
        end = point(0);
        break;
      case "A": end = point(5); break;
    }
    const target = project(end);
    if (handles.length) {
      const controls = handles.map(project);
      const bends = controls.some(p => chordDistance(p, mapped, target) > 0);
      bezier([mapped, ...controls, target], contour.add, 0, bends ? 2 : 0);
    } else if (op === "A" && args[0] !== 0 && args[1] !== 0 && !same(current, end)) {
      const { sample, start, angle } = endpointArc(current, end, ...args.slice(0, 5), project);
      arc(sample, start, angle, mapped, target, contour.add);
    } else {
      contour.add(target);
    }
    control = handles.at(-1);
    current = end;
    mapped = target;
    previous = op;
  }
  if (contour) openError();
  return loops;
}

/** Flatten a circle or ellipse into one loop, using an affine map. */
export function flattenEllipse(cx, cy, rx, ry, map, tolerance, budget) {
  finite(cx, cy);
  if (!Number.isFinite(rx) || !Number.isFinite(ry) || rx <= 0 || ry <= 0) {
    throw new Error("SVG ellipse requires positive finite radii.");
  }
  const { project, loop, arc } = flattener(map, tolerance, budget);
  const sample = ellipseSample(project, cx, cy, rx, ry, 1, 0);
  const first = sample(0);
  const contour = loop(first);
  arc(sample, 0, TAU, first, first, contour.add);
  return contour.finish("SVG ellipse");
}
