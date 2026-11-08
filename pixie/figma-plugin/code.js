// Pixie for Figma — imports a Pixie kit code as variables, text styles and components.
// Designed and built by Hafsoh Bashar.

figma.showUI(__html__, { width: 360, height: 600, themeColors: true });

const PIXIE_URL = 'https://pixie-brand-kits.vercel.app';
const WEIGHT_STYLE = { 300: ['Light'], 400: ['Regular', 'Book', 'Normal'], 500: ['Medium', 'Regular'], 600: ['SemiBold', 'Semi Bold', 'Semibold', 'Bold'], 700: ['Bold', 'SemiBold'], 800: ['ExtraBold', 'Extra Bold', 'Bold'] };

// Which property pickers each semantic colour shows up in.
const SEMANTIC_SCOPES = {
  'bg': ['FRAME_FILL', 'SHAPE_FILL'],
  'surface': ['FRAME_FILL', 'SHAPE_FILL'],
  'surface-2': ['FRAME_FILL', 'SHAPE_FILL'],
  'border': ['STROKE_COLOR'],
  'text': ['TEXT_FILL', 'STROKE_COLOR', 'SHAPE_FILL'],
  'text-muted': ['TEXT_FILL', 'STROKE_COLOR', 'SHAPE_FILL'],
  'link': ['TEXT_FILL'],
  'on-primary': ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'],
  'on-primary-soft': ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'],
  'focus-ring': ['STROKE_COLOR', 'EFFECT_COLOR']
};

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function rgbToHex(c) {
  return '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}
// Figma rejects SVGs where a tag repeats an attribute. Keep the first one, as browsers do.
function cleanSvg(svg) {
  return String(svg).replace(/<([a-zA-Z][\w:-]*)(\s[^<>]*?)?(\/?)>/g, (m, tag, attrs, sl) => {
    if (!attrs) return m;
    const seen = new Set();
    return '<' + tag + attrs.replace(/\s+([\w:-]+)\s*=\s*("[^"]*"|'[^']*')/g, (x, n) => { if (seen.has(n)) return ''; seen.add(n); return x; }) + sl + '>';
  });
}
function progress(step, state, detail) { figma.ui.postMessage({ type: 'progress', step, state, detail: detail || '' }); }

async function findCollection(name) {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  return cols.find(c => c.name === name) || null;
}
async function getOrCreateCollection(name) {
  return (await findCollection(name)) || figma.variables.createVariableCollection(name);
}
async function variablesIn(collection) {
  const all = await figma.variables.getLocalVariablesAsync();
  const map = {};
  all.filter(v => v.variableCollectionId === collection.id).forEach(v => { map[v.name] = v; });
  return map;
}
function upsertVariable(existing, name, collection, type, scopes) {
  let v = existing[name];
  if (!v) { v = figma.variables.createVariable(name, collection, type); existing[name] = v; }
  if (scopes) { try { v.scopes = scopes; } catch (e) { /* older API */ } }
  return v;
}
async function getOrCreatePage(name) {
  let page = figma.root.children.find(p => p.name === name);
  if (!page) { page = figma.createPage(); page.name = name; }
  await page.loadAsync();
  return page;
}

// Bind solid fills and strokes to colour variables: palette colours to their primitive,
// and black (an icon's currentColor) to the semantic text colour so icons follow Light/Dark.
function bindPaints(node, hexToVar, textVar) {
  const walk = n => {
    ['fills', 'strokes'].forEach(key => {
      if (!(key in n)) return;
      const paints = n[key];
      if (!Array.isArray(paints) || !paints.length) return;
      let changed = false;
      const next = paints.map(p => {
        if (p.type !== 'SOLID') return p;
        const hex = rgbToHex(p.color);
        const v = hexToVar[hex] || (hex === '#000000' && textVar) || null;
        if (!v) return p;
        changed = true;
        return figma.variables.setBoundVariableForPaint(p, 'color', v);
      });
      if (changed) n[key] = next;
    });
    if ('children' in n) n.children.forEach(walk);
  };
  walk(node);
}

function svgToComponent(page, existingByName, name, svg, x, y) {
  const node = figma.createNodeFromSvg(cleanSvg(svg));
  let comp = existingByName[name];
  if (comp) {
    comp.children.slice().forEach(c => c.remove());
    comp.resizeWithoutConstraints(node.width, node.height);
    node.children.slice().forEach(c => comp.appendChild(c));
    node.remove();
  } else {
    comp = figma.createComponentFromNode(node);
    comp.name = name;
    page.appendChild(comp);
    comp.x = x; comp.y = y;
  }
  return comp;
}

async function importColour(kit, opts, result) {
  progress('colour', 'active');
  const c = kit.colour, base = kit.name;
  const prim = await getOrCreateCollection(base + ' · Primitives');
  if (prim.modes[0].name !== 'Value') prim.renameMode(prim.modes[0].modeId, 'Value');
  prim.hiddenFromPublishing = false;
  const pv = await variablesIn(prim);
  const hexToVar = {};
  let count = 0;
  for (const [group, scale] of [['brand', c.scale], ['neutral', c.neutral]]) {
    for (const step of Object.keys(scale)) {
      // Primitives stay out of the property pickers; designers pick from Semantic.
      const v = upsertVariable(pv, group + '/' + step, prim, 'COLOR', []);
      v.setValueForMode(prim.modes[0].modeId, hexToRgb(scale[step]));
      if (!hexToVar[scale[step].toUpperCase()]) hexToVar[scale[step].toUpperCase()] = v;
      count++;
    }
  }
  const value = hex => hexToVar[hex.toUpperCase()] ? figma.variables.createVariableAlias(hexToVar[hex.toUpperCase()]) : hexToRgb(hex);
  const scopesFor = name => SEMANTIC_SCOPES[name] || ['ALL_FILLS', 'STROKE_COLOR'];
  let usedModes = false, textVar = null;
  if (opts.lightDark === 'modes') {
    const sem = await getOrCreateCollection(base + ' · Semantic');
    try {
      sem.renameMode(sem.modes[0].modeId, 'Light');
      const dark = sem.modes.find(m => m.name === 'Dark');
      const darkId = dark ? dark.modeId : sem.addMode('Dark');
      const sv = await variablesIn(sem);
      for (const name of Object.keys(c.light)) {
        const v = upsertVariable(sv, name, sem, 'COLOR', scopesFor(name));
        v.setValueForMode(sem.modes[0].modeId, value(c.light[name]));
        v.setValueForMode(darkId, value(c.dark[name]));
        if (name === 'text') textVar = v;
        count++;
      }
      usedModes = true;
    } catch (e) {
      sem.remove();
      result.notes.push('This file’s plan doesn’t allow a second mode, so Light and Dark were created as separate collections.');
    }
  }
  if (!usedModes) {
    for (const [label, set] of [['Light', c.light], ['Dark', c.dark]]) {
      const col = await getOrCreateCollection(base + ' · Semantic ' + label);
      const sv = await variablesIn(col);
      for (const name of Object.keys(set)) {
        const v = upsertVariable(sv, name, col, 'COLOR', scopesFor(name));
        v.setValueForMode(col.modes[0].modeId, value(set[name]));
        if (name === 'text' && label === 'Light') textVar = v;
        count++;
      }
    }
  }
  result.counts.variables += count;
  result.hexToVar = hexToVar;
  result.textVar = textVar;
  progress('colour', 'done', count + ' variables');
}

async function loadFontFor(family, weight) {
  const styles = WEIGHT_STYLE[weight] || ['Regular'];
  for (const style of styles.concat(['Regular'])) {
    try { await figma.loadFontAsync({ family, style }); return { family, style }; } catch (e) { /* try next */ }
  }
  return null;
}

async function importType(kit, result) {
  progress('type', 'active');
  const t = kit.type, base = kit.name;
  const col = await getOrCreateCollection(base + ' · Type');
  if (col.modes[0].name !== 'Value') col.renameMode(col.modes[0].modeId, 'Value');
  const mode = col.modes[0].modeId;
  const tv = await variablesIn(col);
  const fam = {};
  for (const role of ['heading', 'body']) {
    const v = upsertVariable(tv, 'family/' + role, col, 'STRING', ['FONT_FAMILY']);
    v.setValueForMode(mode, t[role]);
    fam[role] = v;
  }
  let count = 2, styles = 0;
  const local = await figma.getLocalTextStylesAsync();
  const missing = new Set();
  for (const s of t.styles) {
    const key = s.name.toLowerCase();
    const size = upsertVariable(tv, 'size/' + key, col, 'FLOAT', ['FONT_SIZE']); size.setValueForMode(mode, s.size);
    const line = upsertVariable(tv, 'line-height/' + key, col, 'FLOAT', ['LINE_HEIGHT']); line.setValueForMode(mode, s.lineHeight);
    const wt = upsertVariable(tv, 'weight/' + key, col, 'FLOAT', ['FONT_WEIGHT']); wt.setValueForMode(mode, s.weight);
    count += 3;
    const family = t[s.family];
    const font = await loadFontFor(family, s.weight);
    if (!font) { missing.add(family); continue; }
    const name = base + '/' + s.name;
    const style = local.find(x => x.name === name) || figma.createTextStyle();
    style.name = name;
    style.fontName = font;
    style.fontSize = s.size;
    style.lineHeight = { unit: 'PIXELS', value: s.lineHeight };
    style.letterSpacing = { unit: 'PERCENT', value: s.size > 30 ? -2 : 0 };
    style.description = s.size + '/' + s.lineHeight + ' · ' + family + ' ' + font.style + ' · made with Pixie';
    try { style.setBoundVariable('fontSize', size); style.setBoundVariable('lineHeight', line); style.setBoundVariable('fontFamily', fam[s.family]); } catch (e) { /* binding not supported on this version */ }
    styles++;
  }
  if (missing.size) result.notes.push('Install ' + Array.from(missing).join(' and ') + ' (free on Google Fonts), then import again to create every text style.');
  result.counts.variables += count;
  result.counts.textStyles += styles;
  progress('type', 'done', styles + ' text styles');
}

async function importSvgSet(kit, result, step, key, pageLabel, prefix, cols, w, h, bindText) {
  progress(step, 'active');
  const page = await getOrCreatePage(kit.name + ' · ' + pageLabel);
  const byName = {};
  page.findAll(n => n.type === 'COMPONENT').forEach(n => { byName[n.name] = n; });
  const names = Object.keys(kit[key].svgs);
  const failed = [];
  let made = 0;
  names.forEach((n, i) => {
    try {
      const comp = svgToComponent(page, byName, prefix + '/' + n, kit[key].svgs[n], (i % cols) * w, Math.floor(i / cols) * h);
      if (kit[key].license) comp.description = kit[key].pack + ' (' + kit[key].style + ') by ' + kit[key].author + ', ' + kit[key].license;
      if (result.hexToVar) bindPaints(comp, result.hexToVar, bindText ? result.textVar : null);
      made++;
    } catch (e) { failed.push(n); }
  });
  if (failed.length) result.notes.push('Skipped ' + failed.length + ' ' + pageLabel.toLowerCase() + ' Figma couldn’t read: ' + failed.join(', ') + '.');
  result.counts[step === 'ill' ? 'illustrations' : 'icons'] = made;
  result.pages[step] = page.id;
  progress(step, 'done', made + ' components');
}

figma.ui.onmessage = async msg => {
  if (msg.type === 'boot') {
    const last = await figma.clientStorage.getAsync('pixie-last').catch(() => null);
    figma.ui.postMessage({ type: 'booted', last: last || null });
  }
  if (msg.type === 'inspect') {
    const exists = !!(await findCollection(msg.name + ' · Primitives')) || !!(await findCollection(msg.name + ' · Type'));
    figma.ui.postMessage({ type: 'inspected', exists });
  }
  if (msg.type === 'import') {
    const kit = msg.kit, opts = msg.opts;
    if (opts.asNew) kit.name = kit.name + ' 2';
    const result = { counts: { variables: 0, textStyles: 0, icons: 0, illustrations: 0 }, notes: [], pages: {} };
    try {
      if (opts.colour && kit.colour) await importColour(kit, opts, result);
      if (opts.type && kit.type) await importType(kit, result);
      if (opts.icons && kit.icons) await importSvgSet(kit, result, 'icons', 'icons', 'Icons', 'Icon', 10, 56, 56, true);
      if (opts.ill && kit.illustrations) await importSvgSet(kit, result, 'ill', 'illustrations', 'Illustrations', 'Illustration', 3, 440, 340, false);
      delete result.hexToVar; delete result.textVar;
      try { await figma.clientStorage.setAsync('pixie-last', { code: msg.code, name: kit.name, at: Date.now() }); } catch (e) { /* storage full */ }
      figma.ui.postMessage({ type: 'done', result, name: kit.name });
      figma.notify('Pixie: ' + kit.name + ' is in your file');
    } catch (e) {
      figma.ui.postMessage({ type: 'error', message: String(e && e.message || e) });
    }
  }
  if (msg.type === 'goto') {
    const page = await figma.getNodeByIdAsync(msg.id);
    if (page && page.type === 'PAGE') { await figma.setCurrentPageAsync(page); figma.viewport.scrollAndZoomIntoView(page.children); }
  }
  if (msg.type === 'open') figma.openExternal(PIXIE_URL);
  if (msg.type === 'close') figma.closePlugin();
};
