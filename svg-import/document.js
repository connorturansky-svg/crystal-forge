const MAX_BYTES = 1024 * 1024;
const MAX_DEPTH = 32;
const MAX_ELEMENTS = 4096;
const MAX_ATTRS = 32;
const MAX_GEOMETRY_TEXT = 128 * 1024;
const MAX_NUMBER = 1e7;
const MAX_MAPPED = 1e8;
const MAX_SCALE = 1e6;
const MAX_TRANSFORMS = 64;

const SVG_NS = 'http://www.w3.org/2000/svg';
const XML_SPACE = /[ \t\r\n]/;
const ONLY_XML_SPACE = /^[ \t\r\n]*$/;
const NUMBER = '[+-]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][+-]?[0-9]+)?';
const LENGTH = new RegExp(`^(${NUMBER})(px|mm|cm|in|pt|pc|Q)?$`);
const PX_PER_MM = 96 / 25.4;
const UNIT_PX = { px: 1, mm: PX_PER_MM, cm: 10 * PX_PER_MM, in: 96, pt: 96 / 72, pc: 16, Q: PX_PER_MM / 4 };
const IDENTITY = [1, 0, 0, 1, 0, 0];
const GEOMETRY = new Map([
  ['path', ['d']],
  ['polygon', ['points']],
  ['rect', ['x', 'y', 'width', 'height', 'rx', 'ry']],
  ['circle', ['cx', 'cy', 'r']],
  ['ellipse', ['cx', 'cy', 'rx', 'ry']],
]);
const ROOT_ATTRS = new Set(['xmlns', 'version', 'width', 'height', 'viewBox', 'preserveAspectRatio']);
const COMMON_ATTRS = new Set(['id', 'transform', 'fill', 'fill-rule', 'stroke', 'opacity', 'fill-opacity']);
const DESCRIPTIVE = new Set(['title', 'desc', 'metadata']);
const XML_ENTITIES = { amp: '&', lt: '<', gt: '>', apos: "'", quot: '"' };
const COLOR_NAMES = new Set(`
  aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue
  blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk
  crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki
  darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen
  darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue
  dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite
  gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki
  lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan
  lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen
  lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen
  magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen
  mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream
  mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid
  palegoldenrod palegreen paleturquoise palevioletred papayawhipp peachpuff peru pink plum
  powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown
  seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen
  steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen
`.trim().split(/\s+/));

function fail(message) {
  throw new Error(`SVG import: ${message}`);
}

function trimXml(text) {
  let start = 0;
  let end = text.length;
  while (start < end && XML_SPACE.test(text[start])) start++;
  while (end > start && XML_SPACE.test(text[end - 1])) end--;
  return text.slice(start, end);
}

function xmlChar(code) {
  return code === 9 || code === 10 || code === 13 ||
    (code >= 0x20 && code <= 0xd7ff) || (code >= 0xe000 && code <= 0xfffd) ||
    (code >= 0x10000 && code <= 0x10ffff);
}

function checkInput(text) {
  if (typeof text !== 'string') fail('expected plain SVG XML text.');
  if (text.length > MAX_BYTES) fail('file exceeds the 1 MiB UTF-8 limit; simplify the SVG.');
  let bytes = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.codePointAt(i);
    if (!xmlChar(code)) fail('invalid XML character; re-export as UTF-8 SVG.');
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
    if (bytes > MAX_BYTES) fail('file exceeds the 1 MiB UTF-8 limit; simplify the SVG.');
    if (code > 0xffff) i++;
  }
}

function decodeXml(text) {
  return text.replace(/&(?:amp;|lt;|gt;|apos;|quot;|#(?:[0-9]{1,10}|x[0-9a-fA-F]{1,8});)?/g, (entity) => {
    if (entity === '&') fail('unsupported or malformed XML entity; use only XML character references.');
    const value = entity.slice(1, -1);
    if (value[0] !== '#') return XML_ENTITIES[value];
    const code = value[1] === 'x' ? Number.parseInt(value.slice(2), 16) : Number(value.slice(1));
    if (!xmlChar(code)) fail('invalid XML character reference.');
    return String.fromCodePoint(code);
  });
}

// Only the accepted XML subset is scanned; nothing is parsed into a DOM or evaluated as CSS.
function scanXml(text, start, end, content) {
  let i = text[0] === '\ufeff' ? 1 : 0;
  const nameToken = /[A-Za-z_][A-Za-z0-9_.:-]*/y;
  const stack = [];
  let rootSeen = false;
  let elements = 0;
  const syntax = (message) => fail(`${message} (character ${i + 1}).`);
  function spaces() {
    const from = i;
    while (i < text.length && XML_SPACE.test(text[i])) i++;
    return i > from;
  }
  function name() {
    nameToken.lastIndex = i;
    const match = nameToken.exec(text);
    if (!match || match[0].length > 128) syntax('Invalid or overlong XML name');
    i = nameToken.lastIndex;
    return match[0];
  }
  if (/^<\?xml[ \t\r\n]/.test(text.slice(i, i + 6))) {
    const declaration = /<\?xml[ \t\r\n]+version[ \t\r\n]*=[ \t\r\n]*(["'])1\.0\1(?:[ \t\r\n]+encoding[ \t\r\n]*=[ \t\r\n]*(["'])[uU][tT][fF]-8\2)?(?:[ \t\r\n]+standalone[ \t\r\n]*=[ \t\r\n]*(["'])(?:yes|no)\3)?[ \t\r\n]*\?>/y;
    declaration.lastIndex = i;
    if (!declaration.test(text)) syntax('Only a well-formed XML 1.0 UTF-8 declaration is supported');
    i = declaration.lastIndex;
  }
  while (i < text.length) {
    if (text[i] !== '<') {
      const next = text.indexOf('<', i);
      const raw = text.slice(i, next < 0 ? text.length : next);
      if (raw.includes(']]>')) syntax('Unexpected CDATA terminator');
      if (!stack.length && !ONLY_XML_SPACE.test(raw)) syntax('Unexpected text outside the root <svg>');
      if (stack.length) content(decodeXml(raw));
      i += raw.length;
      continue;
    }
    if (text.startsWith('<!--', i)) {
      const close = text.indexOf('--', i + 4);
      if (close < 0 || text[close + 2] !== '>') syntax('Malformed XML comment');
      i = close + 3;
      continue;
    }
    if (text.startsWith('<!', i) || text.startsWith('<?', i)) {
      syntax('DOCTYPE, CDATA, and processing instructions are unsupported; export plain SVG');
    }
    if (text.startsWith('</', i)) {
      i += 2;
      const tag = name();
      spaces();
      if (text[i] !== '>' || stack.at(-1) !== tag) syntax(`Unexpected closing tag </${tag}>`);
      stack.pop();
      end();
      i++;
      continue;
    }
    i++;
    const tag = name();
    if (!stack.length) {
      if (rootSeen || tag !== 'svg') syntax('Expected exactly one root <svg> element');
      rootSeen = true;
    }
    if (++elements > MAX_ELEMENTS || stack.length >= MAX_DEPTH) {
      fail(`document exceeds ${MAX_ELEMENTS} elements or ${MAX_DEPTH} levels; simplify or ungroup the SVG.`);
    }
    const attrs = Object.create(null);
    let attrCount = 0;
    const root = !stack.length;
    while (true) {
      const separated = spaces();
      if (text[i] === '>' || text.startsWith('/>', i)) break;
      if (!separated) syntax('Expected whitespace before the next attribute or the end of the tag');
      if (++attrCount > MAX_ATTRS) fail(`too many attributes on <${tag}>; simplify the SVG.`);
      const attr = name();
      if (Object.hasOwn(attrs, attr)) syntax(`Duplicate ${attr} attribute`);
      spaces();
      if (text[i++] !== '=') syntax(`Expected '=' after ${attr}`);
      spaces();
      const quote = text[i++];
      if (quote !== '"' && quote !== "'") syntax(`Expected quoted value for ${attr}`);
      const close = text.indexOf(quote, i);
      if (close < 0) syntax(`Unclosed ${attr} attribute`);
      const geometryText = (tag === 'path' && attr === 'd') || (tag === 'polygon' && attr === 'points');
      if (close - i > (geometryText ? MAX_GEOMETRY_TEXT : 4096)) {
        fail(`${attr} on <${tag}> is too long; simplify or split the artwork.`);
      }
      const raw = text.slice(i, close);
      if (raw.includes('<')) syntax(`Unescaped '<' in ${attr}`);
      attrs[attr] = decodeXml(raw.replace(/\r\n|[\t\r\n]/g, ' '));
      i = close + 1;
    }
    const empty = text[i] === '/';
    i += empty ? 2 : 1;
    start(tag, attrs, root);
    if (empty) end();
    else stack.push(tag);
  }
  if (!rootSeen || stack.length) syntax('Missing or unclosed root <svg>');
}

function boundedNumber(token, label) {
  const value = Number(token);
  if (token.length > 64 || !Number.isFinite(value) || Math.abs(value) > MAX_NUMBER ||
      (Math.abs(value) < 1e-12 && /[1-9]/.test(token.split(/[eE]/, 1)[0]))) {
    fail(`${label} contains a number outside the supported range; rescale the artwork.`);
  }
  return value;
}

function lengthPx(text, label) {
  const match = LENGTH.exec(trimXml(text));
  if (!match) fail(`${label} must use a number or an absolute unit (px, mm, cm, in, pt, pc, Q).`);
  const px = boundedNumber(match[1], label) * UNIT_PX[match[2] ?? 'px'];
  if (Math.abs(px) > MAX_NUMBER) fail(`${label} is too large; rescale the artwork.`);
  return px;
}

function numberList(text, label, max) {
  const source = trimXml(text);
  const number = new RegExp(NUMBER, 'y');
  const separator = /[ \t\r\n]+(?:,[ \t\r\n]*)?|,[ \t\r\n]*/y;
  const values = [];
  let i = 0;
  while (i < source.length) {
    number.lastIndex = i;
    const match = number.exec(source);
    if (!match || values.length === max) fail(`invalid ${label} number list.`);
    values.push(boundedNumber(match[0], label));
    i = number.lastIndex;
    if (i === source.length) break;
    separator.lastIndex = i;
    if (!separator.test(source) || separator.lastIndex === source.length) fail(`invalid ${label} number separator.`);
    i = separator.lastIndex;
  }
  return values;
}

// SVG matrices act on column vectors; list operations and local transforms postmultiply.
function multiply([a, b, c, d, e, f], [g, h, j, k, l, m]) {
  return [a*g + c*h, b*g + d*h, a*j + c*k, b*j + d*k, a*l + c*m + e, b*l + d*m + f];
}

function checkedMatrix(m) {
  const [a, b, c, d, e, f] = m;
  const determinant = a*d - b*c;
  const linear = Math.max(Math.abs(a), Math.abs(b), Math.abs(c), Math.abs(d));
  if (!m.every(Number.isFinite) || Math.abs(determinant) < linear / MAX_SCALE ||
      determinant === 0 || linear > MAX_SCALE || Math.max(Math.abs(e), Math.abs(f)) > MAX_MAPPED) {
    fail('transform is singular or outside the supported scale or translation; apply or simplify transforms.');
  }
  return m;
}

function transformOperation(type, v) {
  const [x, y, z] = v;
  if (type === 'matrix' && v.length === 6) return v;
  if (type === 'translate' && (v.length === 1 || v.length === 2)) return [1, 0, 0, 1, x, y ?? 0];
  if (type === 'scale' && (v.length === 1 || v.length === 2)) return [x, 0, 0, y ?? x, 0, 0];
  if (type === 'rotate' && (v.length === 1 || v.length === 3)) {
    const radians = (x % 360) * Math.PI / 180;
    const c = Math.cos(radians);
    const s = Math.sin(radians);
    return [c, s, -s, c, y === undefined ? 0 : (1 - c)*y + s*z, y === undefined ? 0 : (1 - c)*z - s*y];
  }
  if ((type === 'skewX' || type === 'skewY') && v.length === 1) {
    const t = Math.tan((x % 180) * Math.PI / 180);
    return type === 'skewX' ? [1, 0, t, 1, 0, 0] : [1, t, 0, 1, 0, 0];
  }
  fail(`unsupported transform or wrong argument count for ${type}.`);
}

function readTransform(value) {
  if (value === undefined) return IDENTITY;
  const text = trimXml(value);
  if (text === 'none') return IDENTITY;
  const operation = /([A-Za-z]{1,16})[ \t\r\n]*\(([^()]*)\)/y;
  const separator = /[ \t\r\n]+(?:,[ \t\r\n]*)?|,[ \t\r\n]*/y;
  let matrix = IDENTITY;
  let i = 0;
  let count = 0;
  while (i < text.length) {
    operation.lastIndex = i;
    const match = operation.exec(text);
    if (!match || ++count > MAX_TRANSFORMS) fail('invalid or overly complex transform list.');
    const next = checkedMatrix(transformOperation(match[1], numberList(match[2], 'transform', 6)));
    matrix = checkedMatrix(multiply(matrix, next));
    i = operation.lastIndex;
    if (i === text.length) return matrix;
    separator.lastIndex = i;
    if (!separator.test(text) || separator.lastIndex === text.length) break;
    i = separator.lastIndex;
  }
  fail('invalid transform list; separate transforms with a space or comma.');
}

function viewport(attrs) {
  const viewBox = attrs.viewBox === undefined ? null : numberList(attrs.viewBox, 'viewBox', 4);
  if (viewBox && (viewBox.length !== 4 || viewBox[2] <= 0 || viewBox[3] <= 0)) {
    fail('viewBox must have four numbers and positive width and height.');
  }
  const aspect = trimXml(attrs.preserveAspectRatio ?? 'xMidYMid meet');
  const align = /^(xMin|xMid|xMax)(YMin|YMid|YMax)(?:[ \t\r\n]+meet)?$/.exec(aspect);
  if (!align && aspect !== 'none') {
    fail('unsupported preserveAspectRatio; use an SVG alignment with meet, or none (slice requires clipping).');
  }
  if ((attrs.width === undefined) !== (attrs.height === undefined)) {
    fail('provide both absolute SVG width and height, or omit both to size from artwork bounds.');
  }
  let dimensions = null;
  if (attrs.width !== undefined) {
    const widthPx = lengthPx(attrs.width, 'SVG width');
    const heightPx = lengthPx(attrs.height, 'SVG height');
    if (widthPx <= 0 || heightPx <= 0) fail('SVG width and height must be positive.');
    dimensions = { widthMm: widthPx / PX_PER_MM, heightMm: heightPx / PX_PER_MM, widthPx, heightPx };
  }
  let matrix = IDENTITY;
  if (viewBox) {
    const [x, y, w, h] = viewBox;
    const width = dimensions?.widthPx ?? w;
    const height = dimensions?.heightPx ?? h;
    let sx = width / w;
    let sy = height / h;
    let dx = 0;
    let dy = 0;
    if (align) {
      sx = sy = Math.min(sx, sy);
      const anchor = { min: 0, mid: 0.5, max: 1 };
      dx = (width - w*sx) * anchor[align[1].slice(1).toLowerCase()];
      dy = (height - h*sy) * anchor[align[2].slice(1).toLowerCase()];
    }
    matrix = checkedMatrix([sx, 0, 0, sy, dx - x*sx, dy - y*sy]);
  }
  return { viewBox, dimensions, matrix };
}

function solidFill(value) {
  const fill = value.toLowerCase();
  if (COLOR_NAMES.has(fill) || /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{3}f|[0-9a-f]{6}ff)$/.test(fill)) return true;
  const rgb = /^rgb\([ \t\r\n]*([0-9]{1,3}%?)(?:[ \t\r\n]*,[ \t\r\n]*|[ \t\r\n]+)([0-9]{1,3}%?)(?:[ \t\r\n]*,[ \t\r\n]*|[ \t\r\n]+)([0-9]{1,3}%?)[ \t\r\n]*\)$/.exec(fill);
  if (!rgb) return false;
  const percentages = rgb[1].endsWith('%');
  const commas = fill.split(',').length - 1;
  return (commas === 0 || commas === 2) && rgb.slice(1).every((channel) =>
    channel.endsWith('%') === percentages && Number.parseInt(channel, 10) <= (percentages ? 100 : 255));
}

function paint(attrs, parent) {
  const rule = trimXml(attrs['fill-rule'] ?? 'inherit');
  if (rule !== 'nonzero' && rule !== 'evenodd' && rule !== 'inherit') fail('fill-rule must be nonzero or evenodd.');
  const fill = trimXml(attrs.fill ?? 'inherit');
  if (fill !== 'inherit' && fill !== 'none' && !solidFill(fill)) {
    fail('unsupported fill paint; use an opaque solid color, not a URL, gradient, or transparent paint.');
  }
  const stroke = trimXml(attrs.stroke ?? 'none');
  if (stroke !== 'none' && stroke !== 'inherit') {
    fail('strokes are unsupported; convert strokes to closed filled outlines before export.');
  }
  for (const attr of ['opacity', 'fill-opacity']) {
    if (attrs[attr] === undefined) continue;
    const value = trimXml(attrs[attr]);
    if (!/^(?:\+?0*1(?:\.0*)?|100%)$/.test(value) && value !== 'inherit') {
      fail(`${attr} must be fully opaque; remove transparency before export.`);
    }
  }
  return { fillRule: rule === 'inherit' ? parent?.fillRule ?? 'nonzero' : rule, fill: fill === 'inherit' ? parent?.fill ?? 'black' : fill };
}

function geometry(tag, raw) {
  const attrs = {};
  if (tag === 'path') {
    const d = trimXml(raw.d ?? '');
    if (!/^[Mm]/.test(d)) fail('path d must start with a move command.');
    // Validate the character set and bound numeric tokens; the path parser owns SVG command grammar.
    const token = new RegExp(`([MmZzLlHhVvCcSsQqTtAa])|[ ,\\t\\r\\n]+|(${NUMBER})`, 'y');
    let i = 0;
    let arc = false;
    let operand = 0;
    while (i < d.length) {
      // Arc flags are individual digits, even when followed immediately by the next value.
      if (arc && (operand === 3 || operand === 4) && (d[i] === '0' || d[i] === '1')) {
        i++;
        operand++;
        continue;
      }
      token.lastIndex = i;
      const match = token.exec(d);
      if (!match) fail('path d contains an unsupported character or number.');
      if (match[1]) {
        arc = match[1] === 'A' || match[1] === 'a';
        operand = 0;
      } else if (match[2]) {
        boundedNumber(match[2], 'path d');
        if (arc) operand = (operand + 1) % 7;
      }
      i = token.lastIndex;
    }
    attrs.d = d;
  } else if (tag === 'polygon') {
    const points = numberList(raw.points ?? '', 'polygon points', MAX_GEOMETRY_TEXT);
    if (points.length < 6 || points.length % 2 !== 0) fail('polygon points must contain at least three complete coordinate pairs.');
    attrs.points = points.join(' ');
  } else {
    const positive = tag === 'rect' ? ['width', 'height'] : tag === 'circle' ? ['r'] : ['rx', 'ry'];
    for (const key of GEOMETRY.get(tag)) {
      const optional = !positive.includes(key);
      if (raw[key] === undefined && optional) continue;
      const px = lengthPx(raw[key] ?? '0', `${tag} ${key}`);
      if ((!optional && px <= 0) || ((key === 'rx' || key === 'ry') && px < 0)) {
        fail(`${tag} ${key} must be ${optional ? 'nonnegative' : 'positive'}.`);
      }
      if (tag === 'rect' && (key === 'rx' || key === 'ry') && px > 0) {
        fail('convert rounded rectangles to closed paths before import.');
      }
      attrs[key] = String(px);
    }
  }
  return attrs;
}

/**
 * Read the supported filled SVG subset as data. Shape maps keep SVG's Y-down axes and return
 * millimetres when dimensions is present; otherwise coordinates can be fitted to artwork bounds.
 * The viewport supplies an affine mapping, not a clip. No SVG markup is returned.
 */
export function readSvgDocument(text) {
  checkInput(text);
  const frames = [];
  const shapes = [];
  const warnings = [];
  let dimensions = null;
  let viewBox = null;
  let withinViewport = null;
  scanXml(text, (tag, attrs, root) => {
    const parent = frames.at(-1);
    const descriptive = DESCRIPTIVE.has(tag);
    const keys = GEOMETRY.get(tag);
    if (parent && !parent.container && !(parent.shape && descriptive)) {
      fail(`unsupported child <${tag}> of <${parent.tag}>; descriptions must be plain text and shapes cannot contain geometry.`);
    }
    if (!root && tag !== 'g' && !keys && !descriptive) {
      fail(`unsupported element <${tag}>; export closed solid fills as paths, polygons, rectangles, circles, or ellipses.`);
    }
    for (const attr of Object.keys(attrs)) {
      if ((descriptive ? attr === 'id' : COMMON_ATTRS.has(attr)) ||
          (root && ROOT_ATTRS.has(attr)) || keys?.includes(attr)) continue;
      fail(`unsupported attribute ${attr} on <${tag}>; remove styles, links and effects, and use direct fill attributes.`);
    }
    if (descriptive) {
      frames.push({ tag, descriptive: true });
      return;
    }
    const appearance = paint(attrs, parent);
    const local = readTransform(attrs.transform);
    let matrix;
    if (root) {
      if (attrs.xmlns !== undefined && attrs.xmlns !== SVG_NS) fail('root xmlns must be the SVG namespace.');
      if (attrs.version !== undefined && !/^(?:1\.[01]|2\.0)$/.test(attrs.version)) fail('unsupported SVG version.');
      const size = viewport(attrs);
      ({ dimensions, viewBox } = size);
      const mm = dimensions ? 1 / PX_PER_MM : 1;
      // The outer SVG transform operates on the viewport, unlike group/shape transforms.
      const viewportToOutput = multiply([mm, 0, 0, mm, 0, 0], local);
      matrix = checkedMatrix(multiply(viewportToOutput, size.matrix));
      const width = dimensions?.widthPx ?? viewBox?.[2];
      const height = dimensions?.heightPx ?? viewBox?.[3];
      if (width !== undefined) {
        const [a,b,c,d,e,f] = viewportToOutput;
        const determinant = a*d-b*c;
        const slack = Math.max(width,height)*1e-10;
        withinViewport = ([x,y]) => {
          const u = (d*(x-e)-c*(y-f))/determinant;
          const v = (a*(y-f)-b*(x-e))/determinant;
          return u >= -slack && v >= -slack && u <= width+slack && v <= height+slack;
        };
      }
    } else {
      matrix = checkedMatrix(multiply(parent.matrix, local));
    }
    if (keys) {
      if (appearance.fill === 'none') fail(`fill="none" on <${tag}> produces no filled outline. Add a solid fill or remove the shape.`);
      const [a, b, c, d, e, f] = matrix;
      shapes.push({
        tag,
        attrs: geometry(tag, attrs),
        fillRule: appearance.fillRule,
        map([x, y]) {
          if (!Number.isFinite(x) || !Number.isFinite(y) || Math.max(Math.abs(x), Math.abs(y)) > MAX_MAPPED) {
            fail('shape coordinate exceeds the supported range; rescale the artwork.');
          }
          const point = [a*x + c*y + e, b*x + d*y + f];
          if (!point.every(Number.isFinite) || point.some((coordinate) => Math.abs(coordinate) > MAX_MAPPED)) {
            fail('transformed shape exceeds the supported range; rescale the artwork.');
          }
          return point;
        },
      });
    }
    frames.push({ tag, container: root || tag === 'g', shape: Boolean(keys), matrix, ...appearance });
  }, () => frames.pop(), (value) => {
    if (!frames.at(-1)?.descriptive && !ONLY_XML_SPACE.test(value)) fail('unexpected text; convert visible text to closed paths.');
  });
  if (!shapes.length) fail('no supported filled shapes found.');
  return { shapes, dimensions, viewBox, warnings, withinViewport };
}
