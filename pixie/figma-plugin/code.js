// Pixie for Figma — imports a Pixie kit code as variables, text styles and components.
// Designed and built by Hafsoh Bashar.

figma.showUI(__html__, { width: 360, height: 580, themeColors: true });

const WEIGHT_STYLE = { 300: ['Light'], 400: ['Regular', 'Book', 'Normal'], 500: ['Medium', 'Regular'], 600: ['SemiBold', 'Semi Bold', 'Semibold', 'Bold'], 700: ['Bold', 'SemiBold'], 800: ['ExtraBold', 'Extra Bold', 'Bold'] };

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}
function rgbToHex(c) {
  return '#' + [c.r, c.g, c.b].map(v => Math.round(v * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
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
function upsertVariable(existing, name, collection, type) {
  if (existing[name]) return existing[name];
  const v = figma.variables.createVariable(name, collection, type);
  existing[name] = v;
  return v;
}
async function getOrCreatePage(name) {
  let page = figma.root.children.find(p => p.name === name);
  if (!page) { page = figma.createPage(); page.name = name; }
  await page.loadAsync();
  return page;
}

// Bind solid fills and strokes that match a primitive colour to that variable.
function bindPaints(node, hexToVar) {
  const walk = n => {
    ['fills', 'strokes'].forEach(key => {
      if (!(key in n)) return;
      const paints = n[key];
      if (!Array.isArray(paints) || !paints.length) return;
      let changed = false;
      const next = paints.map(p => {
        if (p.type !== 'SOLID') return p;
        const v = hexToVar[rgbToHex(p.color)];
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
  const node = figma.createNodeFromSvg(svg);
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
  const pv = await variablesIn(prim);
  const hexToVar = {};
  let count = 0;
  for (const [group, scale] of [['brand', c.scale], ['neutral', c.neutral]]) {
    for (const step of Object.keys(scale)) {
      const v = upsertVariable(pv, group + '/' + step, prim, 'COLOR');
      v.setValueForMode(prim.modes[0].modeId, hexToRgb(scale[step]));
      if (!hexToVar[scale[step].toUpperCase()]) hexToVar[scale[step].toUpperCase()] = v;
      count++;
    }
  }
  const value = hex => hexToVar[hex.toUpperCase()] ? figma.variables.createVariableAlias(hexToVar[hex.toUpperCase()]) : hexToRgb(hex);
  let usedModes = false;
  if (opts.lightDark === 'modes') {
    const sem = await getOrCreateCollection(base + ' · Semantic');
    try {
      sem.renameMode(sem.modes[0].modeId, 'Light');
      let dark = sem.modes.find(m => m.name === 'Dark');
      const darkId = dark ? dark.modeId : sem.addMode('Dark');
      const sv = await variablesIn(sem);
      for (const name of Object.keys(c.light)) {
        const v = upsertVariable(sv, name, sem, 'COLOR');
        v.setValueForMode(sem.modes[0].modeId, value(c.light[name]));
        v.setValueForMode(darkId, value(c.dark[name]));
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
        const v = upsertVariable(sv, name, col, 'COLOR');
        v.setValueForMode(col.modes[0].modeId, value(set[name]));
        count++;
      }
    }
  }
  result.counts.variables += count;
  result.hexToVar = hexToVar;
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
  const mode = col.modes[0].modeId;
  const tv = await variablesIn(col);
  const fam = {};
  for (const role of ['heading', 'body']) {
    const v = upsertVariable(tv, 'family/' + role, col, 'STRING');
    v.setValueForMode(mode, t[role]);
    fam[role] = v;
  }
  let count = 2, styles = 0;
  const local = await figma.getLocalTextStylesAsync();
  const missing = new Set();
  for (const s of t.styles) {
    const key = s.name.toLowerCase();
    const size = upsertVariable(tv, 'size/' + key, col, 'FLOAT'); size.setValueForMode(mode, s.size);
    const line = upsertVariable(tv, 'line-height/' + key, col, 'FLOAT'); line.setValueForMode(mode, s.lineHeight);
    const wt = upsertVariable(tv, 'weight/' + key, col, 'FLOAT'); wt.setValueForMode(mode, s.weight);
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
    try { style.setBoundVariable('fontSize', size); style.setBoundVariable('lineHeight', line); style.setBoundVariable('fontFamily', fam[s.family]); } catch (e) { /* binding not supported on this version */ }
    styles++;
  }
  if (missing.size) result.notes.push('Install ' + Array.from(missing).join(' and ') + ' from Google Fonts to create every text style.');
  result.counts.variables += count;
  result.counts.textStyles += styles;
  progress('type', 'done', styles + ' text styles');
}

async function importIcons(kit, result) {
  progress('icons', 'active');
  const page = await getOrCreatePage(kit.name + ' · Icons');
  const byName = {};
  page.findAll(n => n.type === 'COMPONENT').forEach(n => { byName[n.name] = n; });
  const names = Object.keys(kit.icons.svgs);
  names.forEach((n, i) => {
    const comp = svgToComponent(page, byName, 'Icon/' + n, kit.icons.svgs[n], (i % 10) * 56, Math.floor(i / 10) * 56);
    if (result.hexToVar) bindPaints(comp, result.hexToVar);
  });
  result.counts.icons = names.length;
  result.pages.icons = page.id;
  progress('icons', 'done', names.length + ' components');
}

async function importIllustrations(kit, result) {
  progress('ill', 'active');
  const page = await getOrCreatePage(kit.name + ' · Illustrations');
  const byName = {};
  page.findAll(n => n.type === 'COMPONENT').forEach(n => { byName[n.name] = n; });
  const ids = Object.keys(kit.illustrations.svgs);
  ids.forEach((id, i) => {
    const comp = svgToComponent(page, byName, 'Illustration/' + id, kit.illustrations.svgs[id], (i % 3) * 440, Math.floor(i / 3) * 340);
    if (result.hexToVar) bindPaints(comp, result.hexToVar);
  });
  result.counts.illustrations = ids.length;
  result.pages.ill = page.id;
  progress('ill', 'done', ids.length + ' components');
}

figma.ui.onmessage = async msg => {
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
      if (opts.icons && kit.icons) await importIcons(kit, result);
      if (opts.ill && kit.illustrations) await importIllustrations(kit, result);
      delete result.hexToVar;
      figma.ui.postMessage({ type: 'done', result, name: kit.name });
      figma.notify('Pixie: ' + kit.name + ' imported');
    } catch (e) {
      figma.ui.postMessage({ type: 'error', message: String(e && e.message || e) });
    }
  }
  if (msg.type === 'goto') {
    const page = await figma.getNodeByIdAsync(msg.id);
    if (page && page.type === 'PAGE') { await figma.setCurrentPageAsync(page); figma.viewport.scrollAndZoomIntoView(page.children); }
  }
  if (msg.type === 'close') figma.closePlugin();
};
