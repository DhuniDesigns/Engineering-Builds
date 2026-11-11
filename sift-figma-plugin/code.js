// Sift — tag, categorize and arrange a moodboard. Designed and built by Hafsoh Bashar.
figma.showUI(__html__, { width: 320, height: 560, themeColors: true });

const TAGS_KEY = 'sift-tags';   // the user's own tags, stored on each node
const AUTO_KEY = 'sift-auto';   // cached smart tags: { sig, colour, hue, swatch }
let items = [];                  // node ids Sift is working with
let lastArrange = null;          // snapshot for Undo

const post = msg => figma.ui.postMessage(msg);

// ---------- reading the board ----------
function hasImageFill(n) {
  return 'fills' in n && Array.isArray(n.fills) && n.fills.some(f => f.type === 'IMAGE' && f.visible !== false);
}
function typeOf(n) {
  if (n.type === 'TEXT') return 'Typography';
  if (hasImageFill(n)) return 'Photo';
  if ('findOne' in n) {
    if (n.findOne(hasImageFill)) return 'Photo';
    const texts = n.findAll(c => c.type === 'TEXT').length;
    const shapes = n.findAll(c => c.type !== 'TEXT' && c.type !== 'FRAME' && c.type !== 'GROUP').length;
    if (texts && texts >= shapes) return 'Typography';
  }
  return 'UI';
}
function shapeOf(n) {
  const r = n.width / Math.max(1, n.height);
  return r > 1.15 ? 'Landscape' : r < 0.87 ? 'Portrait' : 'Square';
}
const isBoardItem = n => n.visible !== false && !n.locked && n.type !== 'SLICE' && n.type !== 'CONNECTOR' && n.width > 8 && n.height > 8;

function collect(mode) {
  let nodes;
  if (mode === 'selection') {
    nodes = figma.currentPage.selection.slice();
    // One frame or section selected: use what's inside it.
    if (nodes.length === 1 && (nodes[0].type === 'SECTION' || (nodes[0].type === 'FRAME' && !hasImageFill(nodes[0]) && nodes[0].children.length > 1))) nodes = nodes[0].children.slice();
  } else {
    nodes = [];
    figma.currentPage.children.forEach(n => {
      if (n.type === 'SECTION') n.children.forEach(c => nodes.push(c));   // includes sections Sift made earlier
      else nodes.push(n);
    });
  }
  return nodes.filter(isBoardItem);
}
function readTags(n) {
  try { return JSON.parse(n.getPluginData(TAGS_KEY) || '[]'); } catch (e) { return []; }
}
function describe(n) {
  return { id: n.id, name: n.name, shape: shapeOf(n), type: typeOf(n), tags: readTags(n), auto: (() => { try { return JSON.parse(n.getPluginData(AUTO_KEY) || 'null'); } catch (e) { return null; } })(), sig: Math.round(n.width) + 'x' + Math.round(n.height) };
}

async function scan(mode) {
  const nodes = collect(mode);
  items = nodes.map(n => n.id);
  const list = nodes.map(describe);
  post({ type: 'items', items: list, mode });
  // Thumbnails for colour analysis, only where the cache is stale. The UI's canvas does the maths.
  for (const n of nodes) {
    const d = list.find(x => x.id === n.id);
    if (d.auto && d.auto.sig === d.sig) continue;
    try {
      const bytes = await n.exportAsync({ format: 'PNG', constraint: { type: 'WIDTH', value: 32 } });
      post({ type: 'thumb', id: n.id, bytes, sig: d.sig });
    } catch (e) { post({ type: 'thumb', id: n.id, bytes: null, sig: d.sig }); }
  }
  post({ type: 'scanDone' });
}

async function nodesFor(ids) {
  const out = [];
  for (const id of ids) { const n = await figma.getNodeByIdAsync(id); if (n && !n.removed) out.push(n); }
  return out;
}

// ---------- arranging ----------
function absPos(n) { const t = n.absoluteTransform; return { x: t[0][2], y: t[1][2] }; }
function fitTo(n, w, h) {
  // Scale a node into w x h. Images and frames resize; text and groups scale so nothing distorts.
  const k = Math.min(w / n.width, h / n.height);
  if (Math.abs(k - 1) < 0.001) return;
  if (n.type === 'GROUP' || n.type === 'TEXT' || n.type === 'BOOLEAN_OPERATION' || n.type === 'VECTOR') n.rescale(k);
  else if ('resize' in n) n.resize(n.width * k, n.height * k);
}
function keyFor(n, groupBy, autoById) {
  if (groupBy === 'shape') return shapeOf(n);
  if (groupBy === 'type') return typeOf(n);
  if (groupBy === 'colour') return (autoById[n.id] && autoById[n.id].colour) || 'Unsorted';
  const t = readTags(n);
  if (groupBy.indexOf('cat:') === 0) {
    const cat = (cats || []).find(c => 'cat:' + c.id === groupBy);
    if (cat) {
      const inCat = cat.tags.map(x => x.toLowerCase());
      const hit = t.find(x => inCat.indexOf(x.toLowerCase()) > -1);
      return hit || 'No ' + cat.name.toLowerCase();
    }
  }
  return t[0] || 'Untagged';
}
let cats = [];
function masonry(nodes, cols, gap, width, ox, oy, parent) {
  const heights = new Array(cols).fill(0);
  nodes.forEach(n => {
    fitTo(n, width, 100000);
    const c = heights.indexOf(Math.min.apply(null, heights));
    if (parent) parent.appendChild(n);
    n.x = ox + c * (width + gap);
    n.y = oy + heights[c];
    heights[c] += n.height + gap;
  });
  return { w: cols * width + (cols - 1) * gap, h: Math.max.apply(null, heights) - gap };
}
function canCrop(n) {
  // Only image layers that resize cleanly get cropped to the cell; everything else fits inside.
  return hasImageFill(n) && 'resize' in n && (n.type === 'RECTANGLE' || n.type === 'FRAME' || n.type === 'ELLIPSE' || n.type === 'COMPONENT' || n.type === 'INSTANCE');
}
function grid(nodes, cols, gap, width, height, fit, ox, oy) {
  nodes.forEach((n, i) => {
    if (fit === 'fill' && canCrop(n)) {
      n.resize(width, height);
      n.fills = n.fills.map(f => (f.type === 'IMAGE' ? Object.assign({}, f, { scaleMode: 'FILL' }) : f));
    } else fitTo(n, width, height);
    const c = i % cols, r = Math.floor(i / cols);
    n.x = ox + c * (width + gap) + (width - n.width) / 2;
    n.y = oy + r * (height + gap) + (height - n.height) / 2;
  });
}

async function arrange(o) {
  const nodes = (await nodesFor(o.ids)).filter(isBoardItem);
  if (!nodes.length) return post({ type: 'error', message: 'Select or scan some images first.' });
  // Reading order, so the new layout keeps the board's rough story.
  nodes.sort((a, b) => { const A = absPos(a), B = absPos(b); return Math.abs(A.y - B.y) > 40 ? A.y - B.y : A.x - B.x; });
  const origin = nodes.reduce((m, n) => { const p = absPos(n); return { x: Math.min(m.x, p.x), y: Math.min(m.y, p.y) }; }, { x: Infinity, y: Infinity });
  lastArrange = { moves: nodes.map(n => ({ id: n.id, parent: n.parent.id, index: n.parent.children.indexOf(n), x: n.x, y: n.y, w: n.width, h: n.height, fills: hasImageFill(n) ? JSON.stringify(n.fills) : null, rescale: n.type === 'GROUP' || n.type === 'TEXT' || n.type === 'BOOLEAN_OPERATION' || n.type === 'VECTOR' })), sections: [] };
  const page = figma.currentPage;
  // Lift everything to the page first so coordinates are simple.
  nodes.forEach(n => { if (n.parent !== page) { const p = absPos(n); page.appendChild(n); n.x = p.x; n.y = p.y; } });
  const width = Math.max(40, o.width), gap = Math.max(0, o.gap), cols = Math.max(1, o.columns);
  let summary;
  if (o.layout === 'grid') {
    const height = Math.max(40, o.height || width);
    grid(nodes, cols, gap, width, height, o.fit, origin.x, origin.y);
    summary = 'Arranged ' + nodes.length + ' items in a ' + cols + '-column grid';
  } else if (o.layout === 'masonry') {
    masonry(nodes, cols, gap, width, origin.x, origin.y, null);
    summary = 'Arranged ' + nodes.length + ' items in masonry';
  } else {
    const groups = {};
    cats = o.cats || [];
    nodes.forEach(n => { const k = keyFor(n, o.groupBy, o.auto || {}); (groups[k] = groups[k] || []).push(n); });
    const order = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    let x = origin.x;
    const pad = 48, top = 80;
    for (const k of order) {
      const s = figma.createSection();
      s.name = k + ' · ' + groups[k].length;
      page.appendChild(s);
      s.x = x; s.y = origin.y;
      const c = Math.min(cols, groups[k].length);
      const size = masonry(groups[k], c, gap, width, pad, top, s);
      s.resizeWithoutConstraints(size.w + pad * 2, size.h + top + pad);
      lastArrange.sections.push(s.id);
      x += s.width + gap * 3;
    }
    summary = 'Arranged into ' + order.length + (order.length === 1 ? ' section' : ' sections');
  }
  figma.commitUndo();
  figma.viewport.scrollAndZoomIntoView(lastArrange.sections.length ? await nodesFor(lastArrange.sections) : nodes);
  post({ type: 'arranged', summary });
}

async function undo() {
  if (!lastArrange) return;
  for (const m of lastArrange.moves.slice().reverse()) {
    const n = await figma.getNodeByIdAsync(m.id);
    const parent = await figma.getNodeByIdAsync(m.parent);
    if (!n || !parent) continue;
    if (m.rescale) { if (n.width) n.rescale(m.w / n.width); } else if ('resize' in n) n.resize(m.w, m.h);
    if (m.fills) { try { n.fills = JSON.parse(m.fills); } catch (e) { /* keep current fills */ } }
    parent.insertChild(Math.min(m.index, parent.children.length), n);
    n.x = m.x; n.y = m.y;
  }
  for (const id of lastArrange.sections) { const s = await figma.getNodeByIdAsync(id); if (s && s.children.length === 0) s.remove(); }
  lastArrange = null;
  figma.commitUndo();
  post({ type: 'undone' });
}

// ---------- messages ----------
figma.on('selectionchange', () => post({ type: 'selection', ids: figma.currentPage.selection.map(n => n.id) }));

figma.ui.onmessage = async msg => {
  try {
    if (msg.type === 'scan') await scan(msg.mode);
    if (msg.type === 'saveAuto') {
      const n = await figma.getNodeByIdAsync(msg.id);
      if (n) n.setPluginData(AUTO_KEY, JSON.stringify(msg.auto));
    }
    if (msg.type === 'tag' || msg.type === 'untag') {
      const nodes = await nodesFor(msg.ids);
      nodes.forEach(n => {
        const t = readTags(n).filter(x => x.toLowerCase() !== msg.tag.toLowerCase());
        if (msg.type === 'tag') t.push(msg.tag);
        n.setPluginData(TAGS_KEY, JSON.stringify(t));
      });
      post({ type: 'tagsChanged', updates: nodes.map(n => ({ id: n.id, tags: readTags(n) })) });
    }
    if (msg.type === 'saveCats') figma.root.setPluginData('sift-cats', JSON.stringify(msg.cats));
    if (msg.type === 'renameTag' || msg.type === 'deleteTag') {
      // Applies to every layer Sift has scanned on this page.
      const nodes = await nodesFor(items);
      const updates = [];
      nodes.forEach(n => {
        const t = readTags(n);
        if (!t.includes(msg.tag || msg.from)) return;
        const next = msg.type === 'deleteTag' ? t.filter(x => x !== msg.tag) : t.map(x => (x === msg.from ? msg.to : x)).filter((x, i, a) => a.indexOf(x) === i);
        n.setPluginData(TAGS_KEY, JSON.stringify(next));
        updates.push({ id: n.id, tags: next });
      });
      post({ type: 'tagsChanged', updates });
    }
    if (msg.type === 'select') {
      const nodes = await nodesFor(msg.ids);
      figma.currentPage.selection = nodes;
      if (nodes.length) figma.viewport.scrollAndZoomIntoView(nodes);
    }
    if (msg.type === 'arrange') await arrange(msg);
    if (msg.type === 'undo') await undo();
    if (msg.type === 'boot') {
      let saved = [];
      try { saved = JSON.parse(figma.root.getPluginData('sift-cats') || '[]'); } catch (e) { saved = []; }
      post({ type: 'cats', cats: saved });
      post({ type: 'selection', ids: figma.currentPage.selection.map(n => n.id) });
    }
  } catch (e) {
    post({ type: 'error', message: String((e && e.message) || e) });
  }
};
