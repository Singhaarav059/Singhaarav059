/*!
 * Wreck v2: the page you are on becomes solid, destructible terrain over a night city.
 * Original engine, art and sound by Aarav Singh. Load it on any page (bookmarklet) or call Wreck.start().
 */
(() => {
  'use strict';
  if (window.Wreck) { if (!window.Wreck.running) window.Wreck.start(); return; }

  // ------------------------------------------------------------------ constants
  const SKY = 220, TILE = 512, MC = 2, CELL = 64, MAX_PAGE = 7000, MAX_GLYPHS = 6500, MAX_BOXES = 2400;
  const MAX_BODIES = 420, MAX_FX = 3200, MAX_SAND = 1400;
  const G = 2300, RUN = 300, ACC_G = 2600, ACC_A = 1500, JUMP_V = 720, JUMP2_V = 660, MAX_FALL = 1600, SC = 2; // SC: stickman pixel size
  const COYOTE = 0.09, BUFFER = 0.12, JET = 3000, FUEL = 1.6, PW = 7, PH = 54, SH = 31; // SH: aim height (the grip)
  const OUT = '#0d0e18';

  // ------------------------------------------------------------------ weapons
  // Pixel sprites as [x, y, w, h, colour], rear grip at 0,0, pointing +x.
  const C = { d: '#1b1d2e', m: '#3a3d58', l: '#6c7194', b: '#4f8cff', c: '#57e3ff', o: '#ffb020', r: '#ff5d73', g: '#2fd08a', p: '#a77bff', w: '#f2f4ff', y: '#ffe066' };
  const W = [
    { id: 'pistol', name: 'Pistol', auto: false, cd: 0.16, kind: 'bullet', dmg: 16, pellets: 1, spread: 0.012, speed: 2875, pierce: 6, carve: 4, kick: 4, shake: 1, push: 0, front: 0, kr: 0.42, tr: 0.12, fl: 1.15,
      px: [[0, -3, 11, 4, C.d], [1, 1, 3, 5, C.d], [11, -2, 3, 2, C.m], [2, -4, 7, 1, C.b], [9, -3, 1, 1, C.c]] },
    { id: 'smg', name: 'SMG', auto: true, cd: 0.068, kind: 'bullet', dmg: 8, pellets: 1, spread: 0.07, speed: 2500, pierce: 4, carve: 3, kick: 2.6, shake: 0.6, push: 14, front: 10, kr: 0.12, tr: 0.07, fl: 0.95,
      px: [[-6, -2, 5, 3, C.m], [-1, -3, 16, 5, C.d], [5, 2, 3, 6, C.d], [15, -2, 5, 2, C.m], [1, -4, 9, 1, C.g], [12, -1, 2, 1, C.c]] },
    { id: 'shotgun', name: 'Shotgun', auto: false, cd: 0.62, kind: 'bullet', dmg: 12, pellets: 10, spread: 0.17, speed: 2190, pierce: 3, carve: 3, kick: 7, shake: 3, push: 230, front: 13, ring: true, kr: 0.55, tr: 0.42, fl: 1.9,
      px: [[-9, -1, 8, 4, C.m], [-1, -3, 23, 4, C.d], [9, 1, 8, 3, C.l], [21, -3, 2, 2, C.r], [2, -4, 6, 1, C.r]] },
    { id: 'rocket', name: 'Rocket', auto: false, cd: 0.85, kind: 'rocket', speed: 420, kick: 6, shake: 2, push: 120, front: 11, kr: 0.3, tr: 0.3, fl: 1.5,
      px: [[-12, -4, 32, 7, '#2c6b57'], [19, -5, 4, 9, C.d], [-14, -5, 3, 9, C.d], [1, 3, 3, 5, C.d], [4, -5, 7, 1, C.o], [-6, -1, 18, 1, '#3f8a72']] },
    { id: 'rail', name: 'Railgun', auto: false, cd: 1.1, kind: 'rail', kick: 9, shake: 5.5, push: 260, front: 14, kr: 0.34, tr: 0.55, fl: 1.6,
      px: [[-9, -2, 34, 5, C.d], [0, -4, 2, 9, C.b], [5, -4, 2, 9, C.b], [10, -4, 2, 9, C.b], [15, -4, 2, 9, C.b], [25, -1, 5, 3, C.c], [-9, 2, 6, 3, C.m]] },
    { id: 'flame', name: 'Flamethrower', auto: true, cd: 0.0167, kind: 'flame', pellets: 4, spread: 0.12, speed: 520, kick: 0.5, shake: 0.12, push: 0, front: 11, kr: 0.015, tr: 0.012, fl: 0,
      px: [[-9, 1, 8, 7, C.r], [-3, -3, 20, 4, C.d], [17, -4, 3, 6, C.l], [-8, 0, 5, 1, C.o], [3, -4, 8, 1, C.o]] },
    { id: 'doom', name: 'Doomsday', auto: false, cd: 1.9, kind: 'doom', speed: 700, kick: 11, shake: 4, push: 300, front: 11, kr: 0.55, tr: 0.55, fl: 2.2,
      px: [[-11, -5, 28, 10, C.o], [17, -6, 3, 12, C.d], [-13, -4, 2, 8, C.d], [2, 5, 3, 5, C.d], [-5, -7, 16, 2, C.d], [-1, -1, 10, 2, C.r]] },
    { id: 'drone', name: 'Drone', auto: false, cd: 0.4, kind: 'drone', kick: 1.5, shake: 0.2, push: 0, front: 6, kr: 0.1, tr: 0.02, fl: 0,
      px: [[-4, -4, 14, 8, C.m], [-2, -2, 6, 4, C.d], [5, -2, 3, 2, C.g], [10, -1, 3, 2, C.d], [-1, 4, 2, 4, C.d]] },
    { id: 'hole', name: 'Black Hole', auto: false, cd: 1.6, kind: 'hole', speed: 560, kick: 9, shake: 2, push: 140, front: 11, kr: 0.34, tr: 0.3, fl: 0,
      px: [[-7, -3, 20, 7, C.p], [13, -5, 8, 11, C.d], [15, -3, 4, 7, '#d2bcff'], [0, 4, 3, 5, C.d], [-5, -4, 10, 1, '#d2bcff']] },
    { id: 'wand', name: 'Sand Wand', auto: false, cd: 0.9, kind: 'wand', speed: 620, kick: 2, shake: 0.4, push: 0, front: 0, grasp: true, kr: 0.8, tr: 0.08, fl: 0,
      px: [[0, -1, 20, 2, C.m], [20, -2, 4, 4, C.y], [21, -3, 2, 6, C.y], [19, -1, 6, 2, C.y], [-2, -1, 3, 2, C.d]] },
  ];
  const NADE = { name: 'Grenade', px: [[-3, -3, 6, 7, '#2c6b57'], [-1, -5, 2, 2, C.l], [1, -5, 3, 1, C.o]] };

  // ------------------------------------------------------------------ state
  let S = null;
  const Wreck = { running: false, start, stop, preview, skin: '#5b6bd6', onExit: null, debug: () => S && { ...S.stats, x: Math.round(S.p.x), y: Math.round(S.p.y), bodies: S.bodies.length, fx: S.fx.length, pct: Math.round(progress() * 1000) / 10 }, probe: (x, y) => { if (!S) return null; const h = contentAt(x, y); return h === true ? 'edge' : h ? (h.ch ? 'glyph ' + h.ch : 'box ' + h.el.tagName + '.' + h.el.className + ' ' + Math.round(h.w) + 'x' + Math.round(h.h) + ' fill=' + h.fill + ' under=' + h.under) : solid(x, y) ? 'bg' : 'air'; } };
  window.Wreck = Wreck;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[(Math.random() * a.length) | 0];
  const alphaOf = (c) => {
    if (!c || c === 'transparent') return 0;
    const m = c.match(/\(([^)]+)\)/); if (!m) return 1;
    const sl = m[1].split('/'); if (sl.length > 1) return parseFloat(sl[1]);
    const p = m[1].split(/[\s,]+/).filter(Boolean); return c.startsWith('rgba') && p.length > 3 ? parseFloat(p[3]) : 1;
  };
  function rrect(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); if (r > 0.5 && ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

  // ------------------------------------------------------------------ reading the page
  function extract() {
    const sx = scrollX, sy = scrollY, vw = Wreck.width || document.documentElement.clientWidth || innerWidth;
    const docH = Math.min(MAX_PAGE, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, innerHeight));
    let bg = getComputedStyle(document.body).backgroundColor;
    if (alphaOf(bg) < 0.05) bg = getComputedStyle(document.documentElement).backgroundColor;
    if (alphaOf(bg) < 0.05) bg = '#ffffff';
    const boxes = [], glyphs = [], byEl = new Map();
    const els = document.body.querySelectorAll('*');
    for (let n = 0; n < els.length && boxes.length < MAX_BOXES; n++) {
      const el = els[n];
      if (el.closest('[data-wreck]')) continue;
      const tag = el.tagName;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TEMPLATE|HEAD|LINK|META)$/.test(tag)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 3 || r.height < 3 || r.bottom + sy < 0 || r.top + sy > docH || r.right < 0 || r.left > vw) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'contents') continue;
      let fill = null, grad = null, img = null, stroke = null, sw = 0;
      if (alphaOf(cs.backgroundColor) > 0.04) fill = cs.backgroundColor;
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        const u = bi.match(/url\(["']?([^"')]+)["']?\)/);
        if (u) img = loadImg(u[1]);
        else { const cols = bi.match(/(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8}\b)/gi); if (cols) grad = cols.slice(0, 4); }
      }
      if (tag === 'IMG') img = el; else if (tag === 'CANVAS' || tag === 'VIDEO') img = el;
      else if (tag === 'svg') { if (el.parentElement?.closest('svg')) continue; img = svgImg(el, cs.color); }
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw > 0.4 && alphaOf(cs.borderTopColor) > 0.08 && cs.borderTopStyle !== 'none') { stroke = cs.borderTopColor; sw = bw; }
      if (!fill && !grad && !img && !stroke) continue;
      const x = r.left + sx, y = r.top + sy + SKY, w = r.width, h = r.height;
      if (w >= vw * 0.97 && h >= docH * 0.75 && !img) { if (fill) bg = fill; continue; }
      let rad = cs.borderTopLeftRadius; rad = rad.endsWith('%') ? (parseFloat(rad) / 100) * Math.min(w, h) : parseFloat(rad) || 0;
      const b = { el, x, y, w, h, r: rad, fill, grad, img, stroke, sw, hp: 25 + Math.sqrt(w * h) * 1.4, hits: 0, dead: false };
      boxes.push(b); byEl.set(el, b);
    }
    const underOf = (el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const b = byEl.get(e); if (b && (b.fill || b.grad)) return b.fill || b.grad[0]; } return bg; };
    for (const b of boxes) { b.under = underOf(b.el.parentElement); b.vis = !!(b.img || b.stroke || b.grad || (b.fill && b.fill !== b.under)); }
    // every visible character, measured where the browser laid it out
    const range = document.createRange();
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (t.nodeValue.trim() ? 1 : 2) });
    let t, stop = false;
    while (!stop && (t = tw.nextNode())) {
      const el = t.parentElement;
      if (!el || el.closest('[data-wreck],script,style,noscript,textarea,select,option')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
      if (hiddenText(el)) continue;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, color = alphaOf(cs.color) > 0.05 ? cs.color : '#1f2328', tt = cs.textTransform, s = t.nodeValue, under = underOf(el);
      let prevSpace = true;
      for (let i = 0; i < s.length; i++) {
        const cp = s.codePointAt(i), len = cp > 0xffff ? 2 : 1; let ch = s.substr(i, len);
        if (/\s/.test(ch)) { prevSpace = true; continue; }
        range.setStart(t, i); range.setEnd(t, i + len); i += len - 1;
        const r = range.getBoundingClientRect();
        if (r.width < 0.8 || r.height < 1 || r.right < 0 || r.left > vw) { prevSpace = false; continue; }
        if (r.top + sy > docH) { stop = true; break; }
        if (tt === 'uppercase' || (tt === 'capitalize' && prevSpace)) ch = ch.toUpperCase(); else if (tt === 'lowercase') ch = ch.toLowerCase();
        prevSpace = false;
        glyphs.push({ ch, x: r.left + sx, y: r.top + sy + SKY, w: r.width, h: r.height, font, color, under, dead: false, burn: 0 });
        if (glyphs.length >= MAX_GLYPHS) { stop = true; break; }
      }
    }
    return { boxes, glyphs, bg, vw, pageH: docH, WH: SKY + docH };
  }
  // screen-reader-only and skip-link text is clipped away; the page never shows it
  function hiddenText(el) {
    for (let e = el, n = 0; e && n < 4; e = e.parentElement, n++) {
      const cs = getComputedStyle(e), r = e.getBoundingClientRect();
      if ((cs.clip && cs.clip !== 'auto') || /inset\(50%|circle\(0/.test(cs.clipPath)) return true;
      if ((r.width <= 2 || r.height <= 2) && cs.overflow !== 'visible') return true;
      if (cs.position === 'absolute' && (r.right < 0 || r.bottom < -1000)) return true;
    }
    return false;
  }
  const imgCache = new Map();
  function loadImg(src) { if (imgCache.has(src)) return imgCache.get(src); const im = new Image(); im.src = src; imgCache.set(src, im); return im; }
  function svgImg(svg, color) {
    try {
      const c = svg.cloneNode(true), r = svg.getBoundingClientRect();
      c.setAttribute('width', r.width); c.setAttribute('height', r.height);
      if (!c.getAttribute('xmlns')) c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      c.style.color = color;
      const im = new Image(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(c)); return im;
    } catch { return null; }
  }
  const ready = (im) => im && (im.tagName === 'CANVAS' || (im.tagName === 'VIDEO' ? im.readyState >= 2 : im.complete && im.naturalWidth > 0));

  // ------------------------------------------------------------------ terrain: tiles of page pixels + a solidity mask
  function buildWorld(L) {
    const vw = L.vw, WH = L.WH, nT = Math.ceil(WH / TILE);
    L.tiles = [];
    for (let i = 0; i < nT; i++) { const cv = document.createElement('canvas'); cv.width = vw; cv.height = TILE; L.tiles.push({ cv, ctx: cv.getContext('2d') }); }
    L.MW = Math.ceil(vw / MC); L.MH = Math.ceil(WH / MC);
    L.mask = new Uint8Array(L.MW * L.MH);           // 0 air, 1 page, 2 rubble
    if (L.art) {   // a map: solid wherever it is painted
      const d = L.art.getContext('2d').getImageData(0, 0, L.vw, WH).data; let n = 0;
      for (let cy = 0; cy < L.MH; cy++) for (let cx = 0; cx < L.MW; cx++) { const x = Math.min(L.vw - 1, cx * MC + 1), y = Math.min(WH - 1, cy * MC + 1); if (d[(y * L.vw + x) * 4 + 3] > 100) { L.mask[cy * L.MW + cx] = 1; n++; } }
      for (const b of L.boxes) for (let cy = Math.floor(b.y / MC); cy <= Math.floor((b.y + b.h) / MC); cy++) for (let cx = Math.floor(b.x / MC); cx <= Math.floor((b.x + b.w) / MC); cx++) if (cy >= 0 && cx >= 0 && cy < L.MH && cx < L.MW && !L.mask[cy * L.MW + cx]) { L.mask[cy * L.MW + cx] = 1; n++; }
      L.total = Math.max(1, n);
    } else { L.mask.fill(1, Math.floor(SKY / MC) * L.MW); L.total = L.MW * (L.MH - Math.floor(SKY / MC)); }
    L.gh = new Map(); L.bh = new Map();
    const add = (m, o) => { const x0 = Math.floor(o.x / CELL), x1 = Math.floor((o.x + o.w) / CELL), y0 = Math.floor(o.y / CELL), y1 = Math.floor((o.y + o.h) / CELL); for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const k = cy * 4096 + cx; let a = m.get(k); if (!a) m.set(k, (a = [])); a.push(o); } };
    L.glyphs.forEach((g) => add(L.gh, g)); L.boxes.forEach((b) => add(L.bh, b));
    for (let i = 0; i < nT; i++) paintTile(L, i);
  }
  function paintTile(L, i) {
    const { ctx } = L.tiles[i], y0 = i * TILE;
    ctx.setTransform(1, 0, 0, 1, 0, -y0);
    ctx.clearRect(0, y0, L.vw, TILE);
    if (L.art) ctx.drawImage(L.art, 0, 0);
    else if (y0 + TILE > SKY) { ctx.fillStyle = L.bg; ctx.fillRect(0, Math.max(SKY, y0), L.vw, TILE); }
    for (const b of L.boxes) if (b.y < y0 + TILE && b.y + b.h > y0) paintBox(ctx, b);
    ctx.textBaseline = 'alphabetic';
    for (const g of L.glyphs) if (g.y < y0 + TILE && g.y + g.h > y0) { if (ctx.font !== g.font) ctx.font = g.font; ctx.fillStyle = g.color; ctx.fillText(g.ch, g.x, baseline(ctx, g)); }
  }
  function paintBox(ctx, b) {
    rrect(ctx, b.x, b.y, b.w, b.h, b.r);
    if (b.fill) { ctx.fillStyle = b.fill; ctx.fill(); }
    if (b.grad) { const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h); b.grad.forEach((c, i) => { try { g.addColorStop(b.grad.length > 1 ? i / (b.grad.length - 1) : 0, c); } catch {} }); ctx.fillStyle = g; ctx.fill(); }
    if (b.img && ready(b.img)) { ctx.save(); ctx.clip(); try { ctx.drawImage(b.img, b.x, b.y, b.w, b.h); } catch {} ctx.restore(); }
    if (b.stroke) { ctx.strokeStyle = b.stroke; ctx.lineWidth = b.sw; ctx.stroke(); }
  }
  const metrics = new Map();
  function baseline(ctx, g) {
    if (g.by != null) return g.by;
    let m = metrics.get(g.font);
    if (!m) { ctx.font = g.font; const t = ctx.measureText('Hg'); m = { a: t.fontBoundingBoxAscent || t.actualBoundingBoxAscent || 10, d: t.fontBoundingBoxDescent || 3 }; metrics.set(g.font, m); }
    return (g.by = g.y + (g.h - (m.a + m.d)) / 2 + m.a);
  }
  // run fn(ctx) on every tile overlapping a vertical span, in world coordinates
  function onTiles(y0, y1, fn) { const L = S.L; for (let i = Math.max(0, Math.floor(y0 / TILE)); i <= Math.min(L.tiles.length - 1, Math.floor(y1 / TILE)); i++) { const c = L.tiles[i].ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, -i * TILE); fn(c); c.restore(); } }
  // copy a world rectangle of terrain pixels into its own canvas
  function grab(x, y, w, h) {
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h));
    const c = cv.getContext('2d'), L = S.L;
    for (let i = Math.max(0, Math.floor(y / TILE)); i <= Math.min(L.tiles.length - 1, Math.floor((y + h) / TILE)); i++) c.drawImage(L.tiles[i].cv, -x, i * TILE - y);
    return cv;
  }
  const solid = (x, y) => { const L = S.L; if (x < 0 || x >= L.vw || y >= L.WH) return 1; if (y < 0) return 0; return L.mask[(y / MC | 0) * L.MW + (x / MC | 0)]; };
  function setCell(cx, cy, v) {
    const L = S.L; if (cx < 0 || cy < 0 || cx >= L.MW || cy >= L.MH) return;
    const k = cy * L.MW + cx, o = L.mask[k];
    if (o === v) return;
    if (o === 1 && v === 0) S.removed++;
    L.mask[k] = v;
  }
  function q(m, x, y, w, h, fn) {
    const s = ++S.stamp, x0 = Math.floor(x / CELL), x1 = Math.floor((x + w) / CELL), y0 = Math.floor(y / CELL), y1 = Math.floor((y + h) / CELL);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const a = m.get(cy * 4096 + cx); if (!a) continue; for (const o of a) { if (o.dead || o._s === s) continue; o._s = s; if (fn(o) === false) return; } }
  }
  const glyphAt = (x, y) => { let r = null; q(S.L.gh, x, y, 0, 0, (g) => { if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) { r = g; return false; } }); return r; };
  function boxAt(x, y, vis) { let r = null; q(S.L.bh, x, y, 0, 0, (b) => { if ((!vis || (b.vis && b.w * b.h <= 30000 && b.w < S.L.vw * 0.6)) && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h && (!r || b.w * b.h < r.w * r.h)) r = b; }); return r; }
  // projectiles fly over plain page background and stop on content: letters, elements, pictures, rubble
  function contentAt(x, y) {
    const m = solid(x, y); if (!m) return null; if (m === 2 || y >= S.L.WH - 1 || x <= 0 || x >= S.L.vw - 1) return true;
    const g = glyphAt(x, y); if (g) return g;
    // only element-sized things stop bullets (buttons, cards, pictures, inputs); big containers are paper they pass through
    const b = boxAt(x, y, true); if (b && b.w * b.h <= 30000 && b.w < S.L.vw * 0.6) return b; return S.L.art ? true : null;
  }
  function colorAt(x, y) { const g = Math.random() < 0.35 && glyphAt(x, y); if (g) return g.color; const b = boxAt(x, y); return b ? b.fill || (b.grad && b.grad[0]) || b.stroke || b.under : S.L.bg; }

  // ------------------------------------------------------------------ destruction
  function jagged(x, y, r, n = 16) { const p = [], seed = Math.random() * 10; for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2, rr = r * (0.8 + 0.2 * Math.sin(seed + k * 2.7) + rnd(-0.06, 0.06)); p.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return p; }
  function carve(x, y, r, o = {}) {
    const L = S.L;
    // letters in the blast are knocked loose first, so their whole shape leaves the page
    if (o.knock !== false) q(L.gh, x - r * 1.4, y - r * 1.4, r * 2.8, r * 2.8, (g) => {
      const cx = g.x + g.w / 2, cy = g.y + g.h / 2, d = Math.hypot(cx - x, cy - y);
      if (d < r * (o.knockR || 1.15)) { const k = 1 - d / (r * 1.6), a = Math.atan2(cy - y, cx - x); knock(g, Math.cos(a) * (o.force || 300) * k + rnd(-60, 60), Math.sin(a) * (o.force || 300) * k - rnd(60, 220)); }
    });
    const poly = jagged(x, y, r);
    // pixel debris: samples of what was there
    const bits = o.bits ?? Math.min(36, r * 1.4);
    for (let i = 0; i < bits && S.fx.length < MAX_FX; i++) {
      const a = rnd(0, 6.283), d = Math.sqrt(Math.random()) * r, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
      if (!solid(px, py)) continue;
      S.fx.push({ k: 'bit', x: px, y: py, vx: Math.cos(a) * rnd(60, 380) * (o.power || 1), vy: Math.sin(a) * rnd(60, 300) * (o.power || 1) - rnd(80, 260), c: colorAt(px, py), s: pick([1, 2, 2, 3]), life: rnd(0.8, 1.8), t: 0 });
    }
    // big shards cut out of the page itself
    for (let i = 0; i < (o.shards || 0); i++) shard(x, y, r);
    const r2 = r * r * 0.81;
    for (let cy = Math.floor((y - r) / MC); cy <= Math.floor((y + r) / MC); cy++) for (let cx = Math.floor((x - r) / MC); cx <= Math.floor((x + r) / MC); cx++) {
      const dx = cx * MC + 1 - x, dy = cy * MC + 1 - y; if (dx * dx + dy * dy <= r2) setCell(cx, cy, 0);
    }
    // pixels, with a scorched rim on what is left
    onTiles(y - r - 4, y + r + 4, (c) => {
      c.globalCompositeOperation = 'destination-out'; c.beginPath(); poly.forEach(([px, py], k) => (k ? c.lineTo(px, py) : c.moveTo(px, py))); c.closePath(); c.fill();
      if (o.scorch !== false) { c.globalCompositeOperation = 'source-atop'; c.strokeStyle = o.burn ? 'rgba(40,20,20,.55)' : 'rgba(25,20,40,.32)'; c.lineWidth = o.burn ? 5 : 3; c.stroke(); }
    });
    // small elements caught in it come loose
    if (o.detach !== false) q(L.bh, x - r, y - r, r * 2, r * 2, (b) => { if (b.w * b.h < 9000 && Math.hypot(b.x + b.w / 2 - x, b.y + b.h / 2 - y) < r + Math.max(b.w, b.h) * 0.3) detach(b, x, y, (o.force || 300) * 0.8); });
  }
  function carveLine(x0, y0, x1, y1, w) {
    const minX = Math.min(x0, x1) - w, maxX = Math.max(x0, x1) + w, minY = Math.min(y0, y1) - w, maxY = Math.max(y0, y1) + w;
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let cy = Math.floor(minY / MC); cy <= Math.floor(maxY / MC); cy++) for (let cx = Math.floor(minX / MC); cx <= Math.floor(maxX / MC); cx++) {
      const px = cx * MC + 1, py = cy * MC + 1, t = clamp(((px - x0) * dx + (py - y0) * dy) / l2, 0, 1), ex = x0 + dx * t - px, ey = y0 + dy * t - py;
      if (ex * ex + ey * ey <= (w / 2) * (w / 2)) setCell(cx, cy, 0);
    }
    onTiles(minY, maxY, (c) => { c.globalCompositeOperation = 'destination-out'; c.lineCap = 'round'; c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.globalCompositeOperation = 'source-atop'; c.strokeStyle = 'rgba(40,60,140,.4)'; c.lineWidth = w + 6; c.stroke(); });
  }
  // where a bullet lands on the page it punches a small scorched hole and kicks out paper
  function paperHole(x, y, dx, dy, r) {
    carve(x, y, r, { bits: 0, knock: false, detach: false });
    for (let i = 0; i < 7 && S.fx.length < MAX_FX; i++) { const a = Math.atan2(-dy, -dx) + rnd(-1.4, 1.4), v = rnd(60, 220); S.fx.push({ k: 'bit', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, c: colorAt(x, y), s: pick([1, 2, 2]), life: rnd(0.5, 1), t: 0 }); }
    for (let i = 0; i < 2; i++) { const a = Math.atan2(-dy, -dx) + rnd(-1, 1), v = rnd(150, 420); S.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, c: '#ffe066', life: rnd(0.05, 0.16), t: 0 }); }
    S.fx.push({ k: 'ring', x, y, r: 1, max: 6, life: 0.1, t: 0 }); if (Math.random() < 0.35) sfx('tick');
  }
  // a bullet's small ink splash in the letter's own colour
  function inkPop(x, y, dx, dy, c) { for (let i = 0; i < 6 && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'bit', x, y, vx: dx * rnd(80, 260) + rnd(-120, 120), vy: dy * rnd(80, 200) - rnd(60, 220), c, s: pick([1, 2, 2]), life: rnd(0.5, 1.1), t: 0 }); }
  function impact(x, y, dx, dy, c) { for (let i = 0; i < 5 && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'spark', x, y, vx: -dx * rnd(80, 260) + rnd(-160, 160), vy: -dy * rnd(80, 220) + rnd(-180, 60), c: i < 2 ? '#ffe066' : c, life: rnd(0.12, 0.3), t: 0 }); S.fx.push({ k: 'ring', x, y, r: 1, max: 7, life: 0.12, t: 0 }); }
  // loose letters and pieces react to fire: pushed, spun, flashed; pieces break after a few hits
  function bodyAt(x, y, s) {
    for (let i = S.bodies.length - 1; i >= 0; i--) {
      const o = S.bodies[i]; if (o === s.lastBody) continue;
      const dx = x - o.x, dy = y - o.y; if (dx * dx + dy * dy > (o.hw + o.hh) * (o.hw + o.hh)) continue;
      const ca = Math.cos(-o.a), sa = Math.sin(-o.a), u = dx * ca - dy * sa, v = dx * sa + dy * ca;
      if (Math.abs(u) <= o.hw + 1 && Math.abs(v) <= o.hh + 1) { s.lastBody = o; return o; }
    }
    return null;
  }
  function hitBody(o, s, dx, dy) {
    o.rest = 0;
    if (o.k === 'g') { o.vx += dx * 320; o.vy += dy * 320 - 160; o.va += rnd(-20, 20); inkPop(s.x, s.y, dx, dy, o.color); return; }
    const m = Math.min(1, 4000 / Math.max(1, o.hw * o.hh * 4)), heavy = s.heavy ? 90 : 60;
    o.vx += dx * heavy * 4 * m; o.vy += dy * heavy * 4 * m - 120 * m; o.va += ((s.x - o.x) * dy - (s.y - o.y) * dx) * 0.004 * 4;
    S.fx.push({ k: 'flashb', o, vx: 0, vy: 0, life: 0.05, t: 0, x: o.x, y: o.y });
    impact(s.x, s.y, dx, dy, '#ffffff'); sfx('tick');
    if (++o.hits > (o.frag ? 3 : 8)) shatterBody(o, s.x, s.y);
  }
  function shatterBody(o, hx, hy) {
    const i = S.bodies.indexOf(o); if (i >= 0) S.bodies.splice(i, 1);
    if (o.tri || o.frag || o.hw * o.hh < 60) { for (let k = 0; k < 14 && S.fx.length < MAX_FX; k++) S.fx.push({ k: 'bit', x: o.x + rnd(-o.hw, o.hw), y: o.y + rnd(-o.hh, o.hh), vx: rnd(-260, 260), vy: rnd(-320, 40), c: pick(['#ffffff', '#e6e9f3', '#c9cde6']), s: pick([2, 3]), life: rnd(0.6, 1.2), t: 0 }); sfx('crash', 0.4); return; }
    const cols = o.hw > 60 ? 3 : 2, rows = o.hh > 40 ? 3 : 2, pw = (o.hw * 2) / cols, ph = (o.hh * 2) / rows, ca = Math.cos(o.a), sa = Math.sin(o.a);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(pw)); cv.height = Math.max(1, Math.ceil(ph));
      cv.getContext('2d').drawImage(o.sprite, (c * o.sprite.width) / cols, (r * o.sprite.height) / rows, o.sprite.width / cols, o.sprite.height / rows, 0, 0, cv.width, cv.height);
      const lx = -o.hw + pw * (c + 0.5), ly = -o.hh + ph * (r + 0.5), wx = o.x + lx * ca - ly * sa, wy = o.y + lx * sa + ly * ca, d = Math.hypot(wx - hx, wy - hy) + 1;
      S.bodies.push({ k: 's', sprite: cv, frag: true, hits: 0, x: wx, y: wy, hw: pw / 2, hh: ph / 2, vx: o.vx + ((wx - hx) / d) * rnd(120, 280), vy: o.vy + ((wy - hy) / d) * rnd(80, 220) - 120, a: o.a, va: rnd(-8, 8), rest: 0 });
    }
    sfx('crash', 0.7);
  }
  function knock(g, vx, vy, burnt, spin) {
    if (g.dead) return; g.dead = true; S.stats.letters++; gainXP(1); S.extra += (g.w * g.h) / (MC * MC) * 0.6;
    onTiles(g.y, g.y + g.h, (c) => { c.globalCompositeOperation = 'source-atop'; c.fillStyle = g.under; c.fillRect(g.x - 0.5, g.y, g.w + 1, g.h); });
    if (S.bodies.length >= MAX_BODIES) settleOldest();
    S.bodies.push({ k: 'g', ch: g.ch, font: g.font, color: burnt ? '#3b2a2a' : g.color, x: g.x + g.w / 2, y: g.y + g.h / 2, hw: g.w / 2, hh: g.h / 2 * 0.62, by: baseline(S.L.tiles[0].ctx, g) - (g.y + g.h / 2), vx, vy, a: 0, va: spin ?? rnd(-12, 12), rest: 0 });
    if (Math.random() < 0.2) sfx('tick');
  }
  function detach(b, hx, hy, force) {
    if (b.dead || b.w > S.L.vw * 0.9 || b.w * b.h > 60000) return;
    b.dead = true; S.stats.elements++; gainXP(6); S.extra += (b.w * b.h) / (MC * MC) * 0.5;
    const sprite = grab(b.x, b.y, b.w, b.h);
    // everything drawn inside it leaves with it
    q(S.L.gh, b.x, b.y, b.w, b.h, (g) => { if (g.x >= b.x - 1 && g.x + g.w <= b.x + b.w + 1 && g.y >= b.y - 1 && g.y + g.h <= b.y + b.h + 1) g.dead = true; });
    q(S.L.bh, b.x, b.y, b.w, b.h, (c) => { if (c !== b && c.x >= b.x && c.y >= b.y && c.x + c.w <= b.x + b.w && c.y + c.h <= b.y + b.h) c.dead = true; });
    if (b.clear) { onTiles(b.y, b.y + b.h, (c) => { c.globalCompositeOperation = 'destination-out'; c.fillRect(b.x - 1, b.y - 1, b.w + 2, b.h + 2); }); for (let cy = Math.floor(b.y / MC); cy <= Math.floor((b.y + b.h) / MC); cy++) for (let cx = Math.floor(b.x / MC); cx <= Math.floor((b.x + b.w) / MC); cx++) setCell(cx, cy, 0); }
    else onTiles(b.y, b.y + b.h, (c) => { c.globalCompositeOperation = 'source-atop'; c.fillStyle = b.under; c.fillRect(b.x, b.y, b.w, b.h); });
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2, a = Math.atan2(cy - hy, cx - hx);
    if (S.bodies.length >= MAX_BODIES) settleOldest();
    S.bodies.push({ k: 's', sprite, hits: 0, x: cx, y: cy, hw: b.w / 2, hh: b.h / 2, vx: Math.cos(a) * force + rnd(-40, 40), vy: Math.sin(a) * force - rnd(120, 260), a: 0, va: rnd(-5, 5) * (300 / (b.w + 60)), rest: 0 });
    sfx('crash', clamp(Math.sqrt(b.w * b.h) / 200, 0.3, 1));
  }
  function shard(x, y, r) {
    const a0 = rnd(0, 6.283), s = rnd(r * 0.35, r * 0.8), cx = x + Math.cos(a0) * r * 0.45, cy = y + Math.sin(a0) * r * 0.45;
    if (!solid(cx, cy)) return;
    const pts = [0, 1, 2].map((k) => { const a = a0 + k * 2.09 + rnd(-0.5, 0.5), d = s * rnd(0.5, 1); return [Math.cos(a) * d, Math.sin(a) * d]; });
    const minX = Math.min(...pts.map((p) => p[0])), maxX = Math.max(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1])), maxY = Math.max(...pts.map((p) => p[1]));
    const w = maxX - minX, h = maxY - minY; if (w < 3 || h < 3) return;
    const src = grab(cx + minX, cy + minY, w, h), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    const c = cv.getContext('2d'); c.beginPath(); pts.forEach(([px, py], k) => (k ? c.lineTo(px - minX, py - minY) : c.moveTo(px - minX, py - minY))); c.closePath(); c.clip(); c.drawImage(src, 0, 0);
    const d = Math.hypot(cx - x, cy - y) + 1;
    if (S.bodies.length >= MAX_BODIES) settleOldest();
    S.bodies.push({ k: 's', sprite: cv, tri: pts.map(([px, py]) => [px - (minX + maxX) / 2, py - (minY + maxY) / 2]), x: cx + (minX + maxX) / 2, y: cy + (minY + maxY) / 2, hw: w / 2, hh: h / 2,
      vx: ((cx - x) / d) * rnd(250, 600), vy: ((cy - y) / d) * rnd(200, 500) - rnd(200, 420), a: 0, va: rnd(-14, 14), rest: 0 });
  }
  // a settled body becomes terrain: drawn into the page and made solid, so rubble piles up
  function settle(o) {
    const L = S.L, ca = Math.cos(o.a), sa = Math.sin(o.a);
    onTiles(o.y - o.hw - o.hh, o.y + o.hw + o.hh, (c) => {
      c.globalCompositeOperation = 'source-over'; c.translate(o.x, o.y); c.rotate(o.a);
      if (o.k === 'g') { c.font = o.font; c.fillStyle = o.color; c.textBaseline = 'alphabetic'; c.fillText(o.ch, -o.hw, o.by); }
      else c.drawImage(o.sprite, -o.hw, -o.hh, o.hw * 2, o.hh * 2);
    });
    const fw = o.k === 'g' ? o.hw * 0.7 : o.hw, fh = o.k === 'g' ? o.hh * 0.9 : o.hh;
    for (let v = -fh; v <= fh; v += MC) for (let u = -fw; u <= fw; u += MC) {
      if (o.tri && !inTri(u, v, o.tri)) continue;
      const wx = o.x + u * ca - v * sa, wy = o.y + u * sa + v * ca, k = ((wy / MC) | 0) * L.MW + ((wx / MC) | 0);
      if (wx >= 0 && wx < L.vw && wy >= 0 && wy < L.WH && L.mask[k] === 0) L.mask[k] = 2;
    }
  }
  const inTri = (x, y, t) => { const s = (a, b) => (x - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (y - b[1]); const d1 = s(t[0], t[1]), d2 = s(t[1], t[2]), d3 = s(t[2], t[0]); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
  function settleOldest() { const i = S.bodies.findIndex((o) => o.rest > 0); const o = S.bodies.splice(i < 0 ? 0 : i, 1)[0]; if (o) settle(o); }

  function explode(x, y, r, power, o = {}) {
    S.stats.explosions++; gainXP(3);
    carve(x, y, r, { shards: Math.round((r / 10) * power), force: 520 * power, power, knockR: 1.35, burn: true });
    for (const b of S.bodies) { const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy) + 1, R = r * 2.4; if (d < R) { const k = 1 - d / R; b.vx += (dx / d) * 900 * k * power; b.vy += (dy / d) * 800 * k * power - 200 * k; b.va += rnd(-12, 12) * k; b.rest = 0; } }
    for (const f of S.fx) if (f.k === 'sand' || f.k === 'bit') { const dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy) + 1; if (d < r * 2) { f.vx += (dx / d) * 500; f.vy += (dy / d) * 500 - 100; f.stuck = false; } }
    const P = S.p, dx = P.x - x, dy = P.y - PH / 2 - y, d = Math.hypot(dx, dy);
    const bd = Math.hypot(clamp(x, P.x - 8, P.x + 8) - x, clamp(y, P.y - 56, P.y) - y);   // blast distance to the nearest part of the body
    if (Wreck.net && P.alive && bd < r * 1.25) hurt((BLAST[o.w] ?? 60) * (1 - bd / (r * 1.25)) * (o.owner === me() ? 0.5 : 1), o.owner, o.w || 'rocket');
    if (d < r * 2) { const k = 1 - d / (r * 2); P.vx += (dx / (d + 1)) * 700 * k * power; P.vy += (dy / (d + 1)) * 760 * k * power - 220 * k; P.grounded = false; }
    // fire: a pixel fireball, embers that stick and keep burning, smoke
    S.fx.push({ k: 'ring', x, y, r: r * 0.4, max: r * 1.9, life: 0.28, t: 0 }); S.fx.push({ k: 'light', vx: 0, vy: 0, x, y, s: r * 4, a: 0.9, life: 0.3, t: 0 });
    const n = Math.round(r * 0.9 * power) + (o.big ? 60 : 0);
    for (let i = 0; i < n && S.fx.length < MAX_FX; i++) { const a = rnd(0, 6.283), v = rnd(30, 260) * power * (o.big ? 1.8 : 1); S.fx.push({ k: 'fire', x: x + rnd(-r, r) * 0.3, y: y + rnd(-r, r) * 0.3, vx: Math.cos(a) * v, vy: Math.sin(a) * v - rnd(20, 140), s: pick([2, 3, 4, 5, 6]) * (o.big ? 1.6 : 1), life: rnd(0.35, 0.9), t: 0 }); }
    for (let i = 0; i < 10 * power && S.fx.length < MAX_FX; i++) { const a = rnd(0, 6.283), v = rnd(150, 520); S.fx.push({ k: 'ember', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, life: rnd(1.5, 3.2), t: 0 }); }
    for (let i = 0; i < 8 * power && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'smoke', x: x + rnd(-r, r) * 0.4, y: y + rnd(-r, r) * 0.4, vx: rnd(-40, 40), vy: rnd(-90, -20), s: rnd(6, 14) * power, life: rnd(0.9, 1.8), t: 0 });
    S.flash = Math.min(0.45, S.flash + 0.08 * power * (o.big ? 3 : 1)); shake(7 * power * (o.big ? 1.8 : 1)); S.hitstop = Math.max(S.hitstop, 0.03 * power);
    sfx('boom', Math.min(1.4, power));
  }
  // screen shake as trauma (0..1), felt as trauma squared, like a camera on a spring
  const shake = (v) => (S.trauma = Math.min(1, S.trauma + v / 18));
  const trauma = (v) => (S.trauma = Math.min(1, S.trauma + v));

  // ------------------------------------------------------------------ sound (synthesised in the browser)
  let AC = null, noiseBuf = null, muted = false;
  try { muted = localStorage.getItem('wreck-muted') === '1'; } catch {}
  function audio() {
    if (AC) return AC;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return AC;
  }
  const lastSfx = {};
  function sfx(kind, v = 1) {
    if (muted || !AC) return; const t = AC.currentTime;
    if (lastSfx[kind] && t - lastSfx[kind] < (kind === 'tick' ? 0.03 : kind === 'shot' ? 0.02 : 0.01)) return; lastSfx[kind] = t;
    const out = AC.createGain(); out.gain.value = 0.45; out.connect(AC.destination);
    const noise = (dur, type, f, qv, vol, f2) => { const s = AC.createBufferSource(); s.buffer = noiseBuf; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = qv; const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur); };
    const tone = (dur, type, f, f2, vol) => { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur); };
    if (kind === 'shot') { noise(0.08, 'bandpass', 2600, 0.8, 0.5 * v); tone(0.05, 'square', 220, 70, 0.1 * v); }
    else if (kind === 'heavy') { noise(0.24, 'lowpass', 2000, 0.5, 0.75); tone(0.18, 'square', 130, 40, 0.22); }
    else if (kind === 'boom') { noise(0.7 * v + 0.25, 'lowpass', 1000, 0.4, 0.9, 70); tone(0.45, 'sine', 110, 28, 0.6 * v); }
    else if (kind === 'rail') { tone(0.4, 'sawtooth', 2400, 80, 0.22); noise(0.3, 'highpass', 3200, 0.6, 0.35); tone(0.25, 'sine', 90, 40, 0.4); }
    else if (kind === 'thump') { tone(0.12, 'sine', 220, 80, 0.35); noise(0.08, 'lowpass', 900, 0.4, 0.3); }
    else if (kind === 'tick') tone(0.04, 'triangle', rnd(900, 1600), 400, 0.05);
    else if (kind === 'crash') noise(0.3 * v + 0.1, 'bandpass', 1300, 0.6, 0.45 * v);
    else if (kind === 'jump') tone(0.1, 'square', 320, 640, 0.04);
    else if (kind === 'hole') { tone(1.4, 'sine', 70, 28, 0.5); tone(1.4, 'sawtooth', 150, 40, 0.05); }
    else if (kind === 'wand') { tone(0.3, 'triangle', 900, 1800, 0.12); tone(0.3, 'sine', 1400, 2600, 0.06); }
    else if (kind === 'sand') noise(0.6, 'highpass', 2500, 0.3, 0.12);
    else if (kind === 'beep') tone(0.06, 'square', 1200, 1200, 0.05);
    else if (kind === 'rank') { tone(0.12, 'square', 523, 523, 0.08); setTimeout(() => tone(0.12, 'square', 659, 659, 0.08), 110); setTimeout(() => tone(0.25, 'square', 784, 1046, 0.09), 220); }
    else if (kind === 'charge') { tone(0.3, 'sawtooth', 200, 1800, 0.12); tone(0.3, 'sine', 400, 2400, 0.08); }
    else if (kind === 'pump') { noise(0.05, 'bandpass', 1800, 2, 0.35); setTimeout(() => sfx('tick'), 70); }
    else if (kind === 'hurt') { tone(0.12, 'square', 300, 120, 0.15); noise(0.08, 'bandpass', 900, 1, 0.3); }
  }
  let loopNode = null;
  function flameSound(on) {
    if (!AC || muted) on = false;
    if (on && !loopNode) { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 0.5; const g = AC.createGain(); g.gain.value = 0.2; s.connect(f).connect(g).connect(AC.destination); s.start(); loopNode = { s, g }; }
    else if (!on && loopNode) { const n = loopNode; loopNode = null; n.g.gain.setTargetAtTime(0, AC.currentTime, 0.05); setTimeout(() => n.s.stop(), 300); }
  }

  // ------------------------------------------------------------------ the backdrop: an original pixel night city
  const THEMES = {
    city: { sky: ['#0d0b24', '#1f1747', '#3b2466', '#5d2f72'], stars: 1, moon: 1 },
    day: { sky: ['#4aa6ff', '#86c8ff', '#c6e8ff', '#e8f6ff'], sun: '#fff6c9', ridges: ['#b8dcfa', '#9fcdf3', '#86bdea'], cloud: 'rgba(255,255,255,.75)' },
    cave: { sky: ['#05040c', '#0d0b1c', '#16122b', '#1d1838'], glints: 1, ridges: ['#141126', '#100e1f', '#0c0a17'], hang: 1 },
    dawn: { sky: ['#1d2a63', '#4f4a9a', '#c77fc0', '#ffb3c7'], sun: '#ffe1ea', stars: 0.4, ridges: ['#5a5ca8', '#43448a', '#2e2f68'], cloud: 'rgba(255,214,230,.35)' },
    pcb: { sky: ['#041009', '#082014', '#0c2a1b', '#0f3322'], grid: '#135c39', ridges: ['#0b2a1b', '#082215', '#061a10'] },
    volcano: { sky: ['#12060c', '#2e0b19', '#5c1620', '#a8361d'], embers: 1, ridges: ['#3a1018', '#2a0b12', '#1a070c'], volcano: 1 },
  };
  function backdrop(vw, vh, theme = 'city') {
    const T = THEMES[theme] || THEMES.city;
    if (theme !== 'city') return themedBack(vw, vh, T);
    const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return [cv, cv.getContext('2d')]; };
    const [sky, c] = mk(vw, vh);
    const g = c.createLinearGradient(0, 0, 0, vh); g.addColorStop(0, '#0d0b24'); g.addColorStop(0.5, '#1f1747'); g.addColorStop(0.8, '#3b2466'); g.addColorStop(1, '#5d2f72'); c.fillStyle = g; c.fillRect(0, 0, vw, vh);
    for (let i = 0; i < vw * vh / 2200; i++) { const y = rnd(0, vh * 0.75) | 0, a = 0.25 + 0.75 * (1 - y / (vh * 0.75)); c.fillStyle = Math.random() < 0.12 ? `rgba(255,233,168,${a})` : `rgba(255,255,255,${a * rnd(0.4, 1)})`; c.fillRect(rnd(0, vw) | 0, y, Math.random() < 0.08 ? 2 : 1, Math.random() < 0.08 ? 2 : 1); }
    const mx = (vw * 0.8) | 0, my = 46, mg = c.createRadialGradient(mx, my, 10, mx, my, 120); mg.addColorStop(0, 'rgba(255,220,190,.35)'); mg.addColorStop(1, 'rgba(255,220,190,0)'); c.fillStyle = mg; c.fillRect(mx - 120, my - 120, 240, 240);
    for (let y = -18; y <= 18; y++) for (let x = -18; x <= 18; x++) { const d = x * x + y * y; if (d <= 324) { c.fillStyle = d > 270 ? '#f3d6b8' : x + y > 6 ? '#efd0ae' : '#fff1dc'; c.fillRect(mx + x, my + y, 1, 1); } }
    c.fillStyle = '#e4c29e'; [[-6, -4, 4], [7, 5, 3], [-2, 9, 2], [5, -9, 2]].forEach(([x, y, r]) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) c.fillRect(mx + x + xx, my + y + yy, 1, 1); });
    // city layers, back to front: colour, height, window colour, window density, parallax travel
    const specs = [['#2b2160', 120, '#7d6be0', 0.06], ['#1d1646', 92, '#ffcf6b', 0.1], ['#120d2b', 64, '#ff9a5c', 0.14]];
    const lights = [], layers = specs.map(([col, hk, wc, wd], li) => {
      const h = hk + 30, [cv, x] = mk(vw, h); let px = -((rnd(0, 30)) | 0);
      while (px < vw) {
        const bw = (rnd(28, 86)) | 0, bh = (h * rnd(0.45, 0.95)) | 0, by = h - bh;
        x.fillStyle = col; x.fillRect(px, by, bw, bh);
        x.fillStyle = shadeHex(col, 1.35); x.fillRect(px + bw - 2, by, 2, bh); x.fillRect(px, by, bw, 1);           // lit edge
        if (Math.random() < 0.35) { x.fillStyle = col; x.fillRect(px + 4, by - 6, bw - 8, 6); }                     // roof step
        if (li > 0 && Math.random() < 0.3) { x.fillStyle = col; x.fillRect(px + 6, by - 12, 10, 12); x.fillRect(px + 7, by - 14, 8, 2); } // water tank
        if (Math.random() < 0.35) { const ax = px + ((bw * rnd(0.3, 0.7)) | 0); x.fillStyle = col; x.fillRect(ax, by - 26, 2, 26); lights.push({ li, x: ax, y: by - 27, ph: rnd(0, 6) }); }
        x.fillStyle = wc; for (let wy = by + 6; wy < h - 4; wy += 7) for (let wx = px + 4; wx < px + bw - 5; wx += 6) if (Math.random() < wd) x.fillRect(wx, wy, 2, 3);
        if (li === 1 && Math.random() < 0.18 && bw > 40) { const nc = pick(['#ff5d73', '#57e3ff', '#b6ff7a', '#ff9ef0']), ny = by + 14; const ng = x.createRadialGradient(px + bw / 2, ny + 5, 2, px + bw / 2, ny + 5, 40); ng.addColorStop(0, nc + '66'); ng.addColorStop(1, nc + '00'); x.fillStyle = ng; x.fillRect(px - 20, ny - 30, bw + 40, 70); x.strokeStyle = nc; x.lineWidth = 2; x.strokeRect(px + 6, ny, bw - 12, 10); x.fillStyle = nc; for (let k = px + 10; k < px + bw - 10; k += 5) x.fillRect(k, ny + 4, 3, 2); } // neon sign
        px += bw + ((rnd(0, 6)) | 0);
      }
      return { cv, h };
    });
    const clouds = Array.from({ length: 6 }, () => ({ x: rnd(0, vw), y: rnd(vh * 0.08, vh * 0.45), w: rnd(60, 160), sp: rnd(4, 12) }));
    return { sky, layers, lights, clouds, vw, vh };
  }
  function themedBack(vw, vh, T) {
    const mk = (w, h) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; return [cv, cv.getContext('2d')]; };
    const [sky, c] = mk(vw, vh), g = c.createLinearGradient(0, 0, 0, vh); T.sky.forEach((col, i) => g.addColorStop(i / (T.sky.length - 1), col)); c.fillStyle = g; c.fillRect(0, 0, vw, vh);
    if (T.stars) for (let i = 0; i < (vw * vh / 2600) * T.stars; i++) { c.fillStyle = `rgba(255,255,255,${rnd(0.2, 0.8)})`; c.fillRect(rnd(0, vw) | 0, rnd(0, vh * 0.6) | 0, 1, 1); }
    if (T.glints) for (let i = 0; i < vw * vh / 5000; i++) { c.fillStyle = pick(['#57e3ff', '#ff79c6', '#b493ff']); c.globalAlpha = rnd(0.2, 0.6); c.fillRect(rnd(0, vw) | 0, rnd(0, vh) | 0, 1, 1); } c.globalAlpha = 1;
    if (T.grid) { c.fillStyle = T.grid; for (let x = 0; x < vw; x += 32) c.fillRect(x, 0, 1, vh); for (let y = 0; y < vh; y += 32) c.fillRect(0, y, vw, 1); for (let i = 0; i < 40; i++) { c.fillStyle = '#1e7d50'; const x = rnd(0, vw) | 0, y = rnd(0, vh) | 0; c.fillRect(x, y, rnd(20, 90) | 0, 1); } }
    if (T.sun) { const sx = vw * 0.78, sy = vh * 0.2, sg = c.createRadialGradient(sx, sy, 8, sx, sy, 140); sg.addColorStop(0, T.sun + 'cc'); sg.addColorStop(1, T.sun + '00'); c.fillStyle = sg; c.fillRect(sx - 140, sy - 140, 280, 280); c.fillStyle = T.sun; c.beginPath(); c.arc(sx, sy, 22, 0, 7); c.fill(); }
    if (T.embers) for (let i = 0; i < vw * vh / 3000; i++) { c.fillStyle = pick(['#ff7a3d', '#ffb020', '#ff4d5e']); c.globalAlpha = rnd(0.3, 0.8); c.fillRect(rnd(0, vw) | 0, rnd(0, vh) | 0, 1, 1); } c.globalAlpha = 1;
    if (T.hang) for (let x = 0; x < vw; x += 14) { const h = rnd(10, 70); c.fillStyle = '#0a0814'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 14, 0); c.lineTo(x + 7, h); c.fill(); }
    const layers = (T.ridges || []).map((col, li) => {
      const h = 90 + li * 40, [cv, x] = mk(vw, h), n = noise1(Math.random, 6 + li * 4);
      x.fillStyle = col; x.beginPath(); x.moveTo(0, h);
      for (let px = 0; px <= vw; px += 6) { let y = h * (0.15 + 0.7 * n(px / vw)); if (T.volcano && li === 0 && Math.abs(px - vw * 0.35) < 120) y = Math.min(y, h * 0.05 + Math.abs(px - vw * 0.35) * 0.5); x.lineTo(px, y); }
      x.lineTo(vw, h); x.fill();
      if (T.volcano && li === 0) { x.fillStyle = '#ff7a3d'; x.fillRect(vw * 0.35 - 10, h * 0.05, 20, 3); }
      return { cv, h };
    });
    const clouds = T.cloud ? Array.from({ length: 7 }, () => ({ x: rnd(0, vw), y: rnd(vh * 0.05, vh * 0.4), w: rnd(70, 180), sp: rnd(5, 14) })) : [];
    return { sky, layers, lights: [], clouds, vw, vh, cloud: T.cloud, view: 1 };
  }
  function drawBack(v, B, cam, time) {
    v.drawImage(B.sky, 0, 0);
    for (const c of B.clouds) { const x = ((c.x + time * c.sp) % (B.vw + c.w * 2)) - c.w; v.fillStyle = B.cloud || 'rgba(120,96,190,.18)'; v.fillRect(x | 0, c.y | 0, c.w | 0, 6); v.fillRect((x + c.w * 0.15) | 0, (c.y - 4) | 0, (c.w * 0.6) | 0, 4); v.fillRect((x + c.w * 0.3) | 0, (c.y + 6) | 0, (c.w * 0.5) | 0, 3); }
    if (Math.sin(time * 0.37) > 0.995) { const sx = (time * 997) % B.vw, sy = (time * 431) % (B.vh * 0.4); v.fillStyle = '#ffffff'; for (let k = 0; k < 18; k++) v.fillRect((sx - k * 3) | 0, (sy + k) | 0, 2, 1); }
    B.layers.forEach((L, li) => {
      const y = B.view ? Math.round(B.vh - L.h + 10 - cam * 0.03 * (li + 1)) : Math.round(SKY + 6 - L.h - cam * (0.25 + li * 0.2));   // maps: on the horizon; pages: on the page's top edge
      v.drawImage(L.cv, 0, y);
      for (const l of B.lights) if (l.li === li && Math.sin(time * 2.4 + l.ph) > 0.2) { v.fillStyle = '#ff4d5e'; v.fillRect(l.x, y + l.y, 2, 2); v.fillStyle = 'rgba(255,77,94,.35)'; v.fillRect(l.x - 1, y + l.y - 1, 4, 4); }
    });
  }


  // ------------------------------------------------------------------ player
  function makePlayer(x, y) {
    const scarf = []; for (let i = 0; i < 6; i++) scarf.push({ x, y: y - PH, px: x, py: y - PH });
    return { x, y, vx: 0, vy: 0, grounded: false, face: 1, aim: 0, coyote: 0, buffer: 0, jumps: 0, flip: -1, fuel: FUEL, jet: false, run: 0, land: 0, scarf, recoil: 0, weapon: 0, cd: 0, air: 0, muzzle: 0, hp: MAX_HP, alive: true, shield: 0, hurtT: 0, respawnT: 0, charge: -1, pumpT: -1, bloom: 0 };
  }
  function hits(x, y) {
    for (let yy = y - PH; yy < y; yy += MC) for (let xx = x - PW; xx <= x + PW; xx += MC) if (solid(xx, yy)) return true;
    return solid(x - PW, y - 1) || solid(x + PW, y - 1);
  }
  function stepPlayer(dt) {
    const P = S.p, I = S.in;
    const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    if (dir) P.vx += dir * (P.grounded ? ACC_G : ACC_A) * dt; else P.vx -= Math.sign(P.vx) * Math.min(Math.abs(P.vx), (P.grounded ? 2000 : 300) * dt);
    if (Math.abs(P.vx) > RUN) P.vx -= Math.sign(P.vx) * Math.min(Math.abs(P.vx) - RUN, (P.grounded ? 2600 : 500) * dt);
    P.coyote = P.grounded ? COYOTE : P.coyote - dt;
    if (I.jumpPressed) { P.buffer = BUFFER; I.jumpPressed = false; }
    P.buffer -= dt;
    if (P.buffer > 0) {
      if (P.coyote > 0) { P.vy = -JUMP_V; P.grounded = false; P.coyote = 0; P.buffer = 0; P.jumps = 1; sfx('jump'); dust(P.x, P.y, 5); }
      else if (P.jumps < 2) { P.vy = -JUMP2_V; P.jumps = 2; P.buffer = 0; P.flip = 0; sfx('jump'); }
    }
    P.jet = I.jump && !P.grounded && P.jumps >= 2 && P.flip < 0 && P.fuel > 0 && P.vy > -200;
    if (P.jet) { P.vy -= JET * dt; P.fuel -= dt; for (let i = 0; i < 3 && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'fire', x: P.x + rnd(-6, 6), y: P.y - 1, vx: rnd(-25, 25) + P.vx * 0.2, vy: rnd(220, 380), s: pick([2, 3, 3, 4]), life: rnd(0.12, 0.26), t: 0 }); }
    if (P.grounded) P.fuel = Math.min(FUEL, P.fuel + dt * 1.4);
    P.vy = Math.min(MAX_FALL, P.vy + (P.vy < 0 && I.jump ? G : G * 1.45) * dt + (I.down ? 2400 * dt : 0));
    if (P.flip >= 0) { P.flip += dt / 0.4; if (P.flip >= 1) P.flip = -1; }
    const nx = clamp(P.x + P.vx * dt, PW + 1, S.L.vw - PW - 1);
    if (!hits(nx, P.y)) P.x = nx;
    else { let up = 0; for (let s = 1; s <= 8; s++) if (!hits(nx, P.y - s)) { up = s; break; } if (up && (P.grounded || up <= 3)) { P.x = nx; P.y -= up; } else P.vx = 0; }
    const wasG = P.grounded; P.grounded = false;
    const ny = P.y + P.vy * dt;
    if (P.vy >= 0) {
      if (hits(P.x, ny)) { let y = P.y; while (!hits(P.x, y + 1) && y < ny) y++; P.y = y; P.vy = 0; P.grounded = true; }
      else { P.y = ny; if (wasG && P.vy < 400) { for (let s = 1; s <= 6; s++) if (hits(P.x, P.y + s)) { P.y += s - 1; P.grounded = true; P.vy = 0; break; } } }
    } else {
      if (hits(P.x, ny)) { let y = P.y; while (!hits(P.x, y - 1) && y > ny) y--; P.y = y; P.vy = 0; } else P.y = ny;
    }
    if (hits(P.x, P.y)) { for (let s = 1; s < 40; s++) if (!hits(P.x, P.y - s)) { P.y -= s; break; } }
    if (P.y > S.L.WH) P.y = S.L.WH;
    if (S.L.lava && P.y > S.L.lava + 8) { if (Wreck.net) hurt(70 * dt, 'lava', 'lava'); else { P.vy = -1150; P.jumps = 1; } if (Math.random() < 0.5) S.fx.push({ k: 'fire', x: P.x + rnd(-8, 8), y: P.y - rnd(0, 20), vx: rnd(-60, 60), vy: rnd(-260, -120), s: pick([3, 4, 5]), life: rnd(0.2, 0.4), t: 0 }); }
    if (P.grounded) { if (!wasG && P.air > 0.3) { P.land = 1; dust(P.x, P.y, 7); sfx('thump'); } P.jumps = 0; P.air = 0; P.flip = -1; } else P.air += dt;
    P.aim = Math.atan2(S.aimY - (P.y - SH), S.aimX - P.x);
    for (let it = 0; it < 2; it++) { P.face = Math.cos(P.aim) >= 0 ? 1 : -1; const m = muzzle(P); if (Math.hypot(S.aimX - m.x, S.aimY - m.y) >= 24) P.aim = Math.atan2(S.aimY - m.y, S.aimX - m.x); }
    P.face = Math.cos(P.aim) >= 0 ? 1 : -1;
    stepRig(P, dt);
  }
  function stepRig(P, dt) {
    P.land = Math.max(0, P.land - dt * 6);
    P.run += Math.abs(P.vx) * dt * 0.05;
    P.kv = (P.kv || 0) + (-P.recoil * 420 - (P.kv || 0) * 30) * dt; P.recoil += P.kv * dt;            // gun kick spring
    P.krv = (P.krv || 0) + (-(P.kr || 0) * 300 - (P.krv || 0) * 24) * dt; P.kr = (P.kr || 0) + P.krv * dt; // gun flip spring
    P.bloom = Math.max(0, (P.bloom || 0) - dt * 0.6);
    P.muzzle -= dt;
    const s = P.scarf; s[0].x = P.x - P.face * 3; s[0].y = P.y - 40;
    for (let i = 1; i < s.length; i++) { const k = s[i], vx = (k.x - k.px) * 0.88, vy = (k.y - k.py) * 0.88; k.px = k.x; k.py = k.y; k.x += vx - P.face * 8 * dt - P.vx * 0.0015; k.y += vy + 400 * dt * dt; }
    for (let it = 0; it < 3; it++) for (let i = 1; i < s.length; i++) { const a = s[i - 1], b = s[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 6) / d; b.x -= dx * f; b.y -= dy * f; }
  }
  function dust(x, y, n) { for (let i = 0; i < n && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'smoke', x: x + rnd(-6, 6), y: y - 2, vx: rnd(-90, 90), vy: rnd(-50, -10), s: rnd(2, 4), life: rnd(0.25, 0.45), t: 0, c: '#9a9fbd' }); }

  // ------------------------------------------------------------------ firing
  const gunLen = (w) => (GUN_ART[w.id] || GUN_ART.pistol).mx;
  function muzzle(P = S.p) {
    const w = W[P.weapon] || W[0], g = GUN_ART[w.id] || GUN_ART.pistol, a = P.aim, ca = Math.cos(a), sa = Math.sin(a), f = P.face, rc = P.recoil || 0;
    const gx = P.x + f + ca * (12 - rc), gy = P.y - 31 + sa * (12 - rc);
    return { x: gx + g.mx * ca - f * g.my * sa, y: gy + g.mx * sa + f * g.my * ca, a };
  }
  function fire() {
    const P = S.p, w = W[P.weapon];
    if (!P.alive || P.cd > 0 || P.charge >= 0) return;
    // semi guns: a fresh press fires at once; held, they repeat a little slower than their cooldown
    if (!w.auto && !(S.fireQ > 0) && !(S.in.fire && P.cd < -0.12)) return;
    if (w.kind === 'rail') { P.charge = 0; P.cd = w.cd; S.fireQ = 0; const m = muzzle(); S.fx.push({ k: 'ring', x: m.x, y: m.y, r: 120, max: 4, life: 0.3, t: 0, c: '#2b5bff' }); sfx('charge'); return; }
    if (w.kind === 'drone' && S.drones.filter((d) => d.owner === P).length >= 3) return;
    S.fired = true; S.fireQ = 0;
    P.cd = w.cd; S.stats.shots++;
    const m = muzzle(), n0 = S.shots.length;
    P.recoil = Math.min(P.recoil + w.kick, w.kick * 1.6); P.kv = 0; P.kr = Math.min((P.kr || 0) + w.kr, w.kr * 1.5); P.krv = 0;
    trauma(w.tr); S.ckx -= Math.cos(m.a) * w.kick * 0.5; S.cky -= Math.sin(m.a) * w.kick * 0.5;
    if (w.push) { P.vx -= Math.cos(m.a) * w.push * (P.grounded ? 0.45 : 1); if (!P.grounded) P.vy -= Math.sin(m.a) * w.push * 0.8; }
    if (w.fl) { S.fx.push({ k: 'light', vx: 0, vy: 0, x: m.x, y: m.y, s: 70 + 40 * w.fl, a: Math.min(0.9, 0.35 * w.fl), life: 0.06, t: 0 }); S.muzzleSize = w.fl; }
    if (w.kind === 'bullet') {
      // bullets land where you aim: their range is the distance to the cursor (online they fly on, to reach players)
      const dist = Math.max(50, Math.hypot(S.aimX - m.x, S.aimY - m.y)), spread = w.spread + (w.auto ? P.bloom : 0);
      for (let i = 0; i < w.pellets; i++) { const a = m.a + rnd(-spread, spread) * (w.pellets > 1 ? 1 : Math.random()), v = w.speed * (w.pellets > 1 ? rnd(0.82, 1.08) : 1); S.shots.push({ k: 'b', x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dmg: w.dmg, pierce: w.pierce, carve: w.carve, life: 1.2, heavy: w.pellets > 1, range: Wreck.net ? 4000 : dist * (w.pellets > 1 ? rnd(0.86, 1.12) : 1), w: w.id, owner: me() }); }
      if (w.auto) P.bloom = Math.min(0.1, (P.bloom || 0) + 0.014);
      S.muzzle = 0.05; sfx(w.pellets > 1 ? 'heavy' : 'shot');
      if (w.ring) S.fx.push({ k: 'ring', x: m.x, y: m.y, r: 3, max: 22, life: 0.18, t: 0, c: '#c9f6ff' });
      if (w.id === 'shotgun') P.pumpT = 0; else S.fx.push({ k: 'shell', x: P.x, y: P.y - SH, vx: -P.face * rnd(60, 140) + P.vx * 0.5, vy: rnd(-260, -170), life: 1, t: 0 });
    } else if (w.kind === 'rocket') { S.shots.push({ k: 'r', x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed, life: 4, range: Math.max(50, Math.hypot(S.aimX - m.x, S.aimY - m.y)), owner: me() }); sfx('thump'); S.muzzle = 0.06; }
    else if (w.kind === 'doom') { S.shots.push({ k: 'd', owner: me(), x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed - 80, fuse: 0.5, life: 4 }); sfx('heavy'); S.muzzle = 0.08; S.flash = Math.min(0.3, S.flash + 0.1); }
    else if (w.kind === 'hole') { S.shots.push({ k: 'h', owner: me(), x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed, t: 0, life: 4.2 }); sfx('thump'); }
    else if (w.kind === 'wand') { S.shots.push({ k: 'w', x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed, life: 2 }); sfx('wand'); }
    else if (w.kind === 'drone') { addDrone(P, m.x, m.y, m.a); net({ t: 'd', x: r1(m.x), y: r1(m.y), a: r3(m.a) }); sfx('beep'); }
    else if (w.kind === 'flame') flames(P, m);
    P.muzzle = S.muzzle;
    if (w.kind !== 'drone' && w.kind !== 'flame') net({ t: 'f', s: S.shots.slice(n0).map(ser) });
  }
  function stepWeapon(P, dt) {
    const w = W[P.weapon];
    if (P.charge >= 0) {
      P.charge += dt; P.recoil += rnd(-1, 1) * P.charge * 1.2;
      if (P.charge >= 0.3) {
        P.charge = -1; const m = muzzle(); S.stats.shots++;
        P.recoil = Math.min(P.recoil + w.kick, w.kick * 1.6); P.kv = 0; P.kr = Math.min((P.kr || 0) + w.kr, w.kr * 1.5); P.krv = 0;
        trauma(w.tr); S.ckx -= Math.cos(m.a) * w.kick * 0.5; S.cky -= Math.sin(m.a) * w.kick * 0.5;
        P.vx -= Math.cos(m.a) * w.push * (P.grounded ? 0.45 : 1); if (!P.grounded) P.vy -= Math.sin(m.a) * w.push * 0.8;
        S.fx.push({ k: 'light', vx: 0, vy: 0, x: m.x, y: m.y, s: 150, a: 0.8, life: 0.08, t: 0 }); S.muzzleSize = w.fl; S.muzzle = 0.06;
        rail(m, me()); net({ t: 'r', x: r1(m.x), y: r1(m.y), a: r3(m.a) });
      }
    }
    if (P.pumpT >= 0) { const t0 = P.pumpT; P.pumpT += dt; if (t0 < 0.14 && P.pumpT >= 0.14) { sfx('pump'); P.kr = Math.min((P.kr || 0) + 0.2, 0.4); P.krv = 0; S.fx.push({ k: 'shell', x: P.x, y: P.y - SH, vx: -P.face * rnd(60, 140), vy: rnd(-260, -170), life: 1, t: 0, red: 1 }); } if (P.pumpT > 0.4) P.pumpT = -1; }
  }
  function flames(P, m) { const w = W[5]; for (let i = 0; i < w.pellets && S.fx.length < MAX_FX; i++) { const a = m.a + rnd(-w.spread, w.spread), v = w.speed * rnd(0.7, 1.15); S.fx.push({ k: 'flame', owner: P === S.p ? me() : P.id, x: m.x, y: m.y, vx: Math.cos(a) * v + P.vx * 0.4, vy: Math.sin(a) * v + P.vy * 0.2, s: pick([2, 3, 3, 4]), life: rnd(0.35, 0.6), t: 0 }); } }
  function addDrone(P, x, y, a) { S.drones.push({ owner: P, x, y, vx: Math.cos(a) * 300, vy: -200, life: 14, cd: 0.5, ph: rnd(0, 6), slot: S.drones.filter((d) => d.owner === P).length % 3 }); }
  function rail(m, owner) {
    const dx = Math.cos(m.a), dy = Math.sin(m.a), L = S.L;
    let len = 0; while (len < 3000) { const x = m.x + dx * len, y = m.y + dy * len; if (x < -10 || x > L.vw + 10 || y < -50 || y > L.WH) break; len += 6; }
    const x1 = m.x + dx * len, y1 = m.y + dy * len;
    for (let d = 0; d < len; d += 6) {
      const x = m.x + dx * d, y = m.y + dy * d;
      q(L.gh, x - 6, y - 6, 12, 12, (g) => { const cx = g.x + g.w / 2, cy = g.y + g.h / 2; if (Math.abs((cx - m.x) * dy - (cy - m.y) * dx) < 9) knock(g, dx * rnd(300, 700) + rnd(-80, 80), dy * 500 - rnd(150, 350)); });
      q(L.bh, x - 2, y - 2, 4, 4, (b) => { if (b.w * b.h < 16000) detach(b, x - dx * 30, y - dy * 30, 380); });
      if ((d / 6 | 0) % 3 === 0 && solid(x, y) && S.fx.length < MAX_FX) S.fx.push({ k: 'bit', x, y, vx: -dy * rnd(-260, 260) + dx * 80, vy: dx * rnd(-260, 260) - 120, c: colorAt(x, y), s: pick([1, 2, 2]), life: rnd(0.6, 1.4), t: 0 });
    }
    carveLine(m.x, m.y, x1, y1, 9);
    if (Wreck.net && owner !== me() && S.p.alive) { const P = S.p, cx = P.x, cy = P.y - 28, t2 = clamp((cx - m.x) * dx + (cy - m.y) * dy, 0, len); if (Math.hypot(m.x + dx * t2 - cx, m.y + dy * t2 - cy) < 16) hurt(80, owner, 'rail'); }
    for (const o of S.bodies) { const t = (o.x - m.x) * dx + (o.y - m.y) * dy; if (t < 0 || t > len) continue; if (Math.hypot(o.x - (m.x + dx * t), o.y - (m.y + dy * t)) < 20) { o.vx += dx * 700; o.vy += dy * 700 - 200; o.rest = 0; } }
    S.beams.push({ x0: m.x, y0: m.y, x1, y1, t: 0 });
    for (let i = 0; i < 26 && S.fx.length < MAX_FX; i++) { const t = Math.random() * len; S.fx.push({ k: 'spark', x: m.x + dx * t, y: m.y + dy * t, vx: rnd(-200, 200), vy: rnd(-260, 80), c: pick(['#c9f6ff', '#57e3ff', '#ffffff']), life: rnd(0.2, 0.5), t: 0 }); }
    S.flash = Math.min(0.4, S.flash + 0.22); S.hitstop = 0.035; sfx('rail');
  }
  function throwGrenade() {
    if (!S || S.paused || S.nadeCd > 0) return; const P = S.p, a = P.aim;
    if (!S.p.alive) return; S.nadeCd = 4.5; S.nadeMax = 4.5;
    const n = { k: 'n', owner: me(), x: P.x, y: P.y - SH, vx: Math.cos(a) * 560 + P.vx * 0.4, vy: Math.sin(a) * 560 - 160, fuse: 1.55, life: 5, r: 50 };
    S.shots.push(n); net({ t: 'f', s: [ser(n)] });
    sfx('jump');
  }
  function bounce(s, dt, rest) {
    const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
    if (solid(nx, s.y)) s.vx *= -rest; else s.x = nx;
    if (solid(s.x, ny)) { s.vy *= -rest; s.vx *= 0.8; return true; } s.y = ny; return false;
  }
  function stepShots(dt) {
    const L = S.L;
    for (let i = S.shots.length - 1; i >= 0; i--) {
      const s = S.shots[i]; s.life -= dt; let gone = s.life <= 0; S.cur = s.owner || null;
      if (s.k === 'b') {
        const steps = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vy) * dt / 4));
        for (let k = 0; k < steps && !gone; k++) {
          s.x += s.vx * dt / steps; s.y += s.vy * dt / steps;
          const sp = Math.hypot(s.vx, s.vy), dx = s.vx / sp, dy = s.vy / sp;
          if (s.range != null && (s.range -= sp * dt / steps) <= 0) {   // landed on the cursor: hit whatever is there
            const body = bodyAt(s.x, s.y, s), hit = !body && contentAt(s.x, s.y);
            if (body) hitBody(body, s, dx, dy);
            else if (hit && hit.ch) { knock(hit, dx * rnd(230, 430) + rnd(-40, 40), dy * rnd(150, 350) - rnd(90, 200), false, rnd(-22, 22)); inkPop(s.x, s.y, dx, dy, hit.color); }
            else if (hit && hit !== true && hit !== s.last) { impact(s.x, s.y, dx, dy, hit.fill || hit.stroke || '#ffffff'); if (++hit.hits >= (hit.w * hit.h < 6000 ? 3 : hit.w * hit.h < 30000 ? 5 : 8)) detach(hit, s.x - dx * 20, s.y - dy * 20, 300); }
            else if (solid(s.x, s.y)) paperHole(s.x, s.y, dx, dy, s.heavy ? 2.2 : s.w === 'drone' ? 3.6 : 2.8);
            gone = true; break;
          }
          if (s.x < 0 || s.x > L.vw || s.y > L.WH || s.y < -400) { gone = true; break; }
          const who = playerAt(s.x, s.y, s.owner);
          if (who) { impact(s.x, s.y, dx, dy, who.skin || Wreck.skin); if (who === S.p) hurt(DMG[s.w] ?? 10, s.owner, s.w); gone = true; break; }
          const body = bodyAt(s.x, s.y, s);
          if (body) { hitBody(body, s, dx, dy); if (body.k !== 'g' || --s.pierce < 0) gone = true; continue; }
          const hit = contentAt(s.x, s.y);
          if (hit && hit === s.last) continue;   // still inside the element it already hit
          if (hit) s.last = hit;
          if (hit && hit.ch) { knock(hit, dx * rnd(230, 430) + rnd(-40, 40), dy * rnd(150, 350) - rnd(90, 200), false, rnd(-22, 22)); inkPop(s.x, s.y, dx, dy, hit.color); if (--s.pierce < 0) gone = true; continue; }
          if (hit) {
            impact(s.x, s.y, dx, dy, hit === true ? '#c9cde6' : hit.fill || hit.stroke || '#ffffff');
            if (hit === true) carve(s.x, s.y, 2.5, { bits: 4, knock: false, detach: false, scorch: false });
            else if (++hit.hits >= (hit.w * hit.h < 6000 ? 3 : hit.w * hit.h < 30000 ? 5 : 8)) detach(hit, s.x - dx * 20, s.y - dy * 20, 300);
            gone = true;
          }
        }
      } else if (s.k === 'r') {
        const sp = Math.hypot(s.vx, s.vy), acc = Math.min(1100, sp + 1500 * dt) / sp; s.vx *= acc; s.vy *= acc;
        for (let k = 0; k < 4 && !gone; k++) { s.x += s.vx * dt / 4; s.y += s.vy * dt / 4; if (s.range != null) s.range -= Math.hypot(s.vx, s.vy) * dt / 4; if (s.x < 0 || s.x > L.vw || s.y > L.WH || contentAt(s.x, s.y) || playerAt(s.x, s.y, s.owner) || (s.range != null && s.range <= 0)) { explode(s.x, s.y, 44, 1.1, { owner: s.owner, w: 'rocket' }); gone = true; } }
        if (S.fx.length < MAX_FX) { S.fx.push({ k: 'smoke', x: s.x, y: s.y, vx: rnd(-20, 20), vy: rnd(-30, 10), s: rnd(3, 6), life: rnd(0.4, 0.8), t: 0 }); S.fx.push({ k: 'fire', x: s.x - s.vx * 0.012, y: s.y - s.vy * 0.012, vx: -s.vx * 0.2, vy: -s.vy * 0.2, s: 2, life: 0.12, t: 0 }); }
      } else if (s.k === 'n' || s.k === 'm') {
        s.vy += G * 0.7 * dt; s.fuse -= dt;
        const hit = bounce(s, dt, s.k === 'm' ? 0.3 : 0.45);
        if (hit && Math.abs(s.vy) > 120) sfx('tick');
        if (s.k === 'm' && (hit || glyphAt(s.x, s.y))) s.fuse = Math.min(s.fuse, 0.02);
        if (s.fuse <= 0) { explode(s.x, s.y, s.r || 34, s.k === 'm' ? 0.85 : 1.1, { owner: s.owner, w: s.k === 'm' ? 'bomblet' : 'grenade' }); gone = true; }
      } else if (s.k === 'd') {
        s.vy += G * 0.45 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.fuse -= dt;
        if (S.fx.length < MAX_FX) S.fx.push({ k: 'fire', x: s.x, y: s.y, vx: rnd(-30, 30), vy: rnd(-30, 30), s: 3, life: 0.2, t: 0 });
        if (s.fuse <= 0 || contentAt(s.x, s.y)) {
          explode(s.x, s.y, 30, 1, { big: true, owner: s.owner, w: 'bomblet' });
          for (let k = 0; k < 12; k++) S.shots.push({ k: 'm', owner: s.owner, x: s.x, y: s.y, vx: s.vx * 0.25 + rnd(-460, 460), vy: rnd(-560, -80), fuse: rnd(0.5, 1.3), life: 3, r: 36 });
          gone = true;
        }
      } else if (s.k === 'h') {
        s.t += dt;
        if (s.t < 0.5 && !contentAt(s.x + s.vx * dt, s.y + s.vy * dt)) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - dt * 3.5; s.vy *= 1 - dt * 3.5; if (s.t + dt >= 0.5) sfx('hole'); }
        else blackHole(s, dt);
        if (s.life <= 0) { explode(s.x, s.y, 70, 1.6, { big: true, owner: s.owner, w: 'hole' }); gone = true; }
      } else if (s.k === 'w') {
        s.vy += 300 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
        if (S.fx.length < MAX_FX) S.fx.push({ k: 'spark', x: s.x, y: s.y, vx: rnd(-60, 60), vy: rnd(-60, 60), c: pick(['#ffe066', '#ffffff', '#a77bff']), life: 0.3, t: 0 });
        if (s.x < 0 || s.x > L.vw || s.y > L.WH || contentAt(s.x, s.y)) { sandify(s.x, s.y, 40); gone = true; }
      }
      if (gone) S.shots.splice(i, 1);
    }
    // drones hover by the stickman, hunt the nearest text and shoot it
    for (let i = S.drones.length - 1; i >= 0; i--) {
      const d = S.drones[i], P = d.owner; d.life -= dt; d.ph += dt * 3; d.cd -= dt;
      const tx = P.x + (d.slot - 1) * 40, ty = P.y - 100 - d.slot * 10 + Math.sin(d.ph) * 6;
      d.vx += (tx - d.x) * 8 * dt; d.vy += (ty - d.y) * 8 * dt; d.vx *= 1 - dt * 3; d.vy *= 1 - dt * 3; d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.cd <= 0) {
        let best = null, bd = 1e9;
        q(L.gh, d.x - 360, d.y - 60, 720, 520, (g) => { const dd = Math.hypot(g.x - d.x, g.y - d.y); if (dd < bd) { bd = dd; best = g; } });
        const a = best ? Math.atan2(best.y + best.h / 2 - d.y, best.x + best.w / 2 - d.x) : Math.PI / 2 + rnd(-0.3, 0.3);
        d.aim = a; d.cd = 0.16;
        S.shots.push({ k: 'b', x: d.x, y: d.y, vx: Math.cos(a) * 2915, vy: Math.sin(a) * 2915, dmg: 16, pierce: 5, carve: 3, life: 0.6, w: 'drone', owner: d.owner === S.p ? me() : d.owner.id }); sfx('shot', 0.4);
      }
      if (d.life <= 0) { explode(d.x, d.y, 22, 0.6, { owner: d.owner === S.p ? me() : d.owner.id, w: 'drone' }); S.drones.splice(i, 1); }
    }
  }
  function blackHole(s, dt) {
    const R = 240, pull = clamp((s.t - 0.5) / 0.5, 0, 1), L = S.L;
    q(L.gh, s.x - R, s.y - R, R * 2, R * 2, (g) => { const d = Math.hypot(g.x - s.x, g.y - s.y); if (d < R && Math.random() < pull * dt * (2 + 26 * (1 - d / R) ** 2)) knock(g, (s.x - g.x) * 1.4, (s.y - g.y) * 1.4); });
    q(L.bh, s.x - R * 0.6, s.y - R * 0.6, R * 1.2, R * 1.2, (b) => { if (b.w * b.h < 12000 && Math.random() < pull * dt * 2) detach(b, s.x, s.y, -200); });
    const core = 8 + 14 * pull + Math.sin(s.t * 9) * 2;
    if ((S.frame & 1) === 0) carve(s.x, s.y, core, { bits: 4, knock: false, scorch: false, detach: false, force: 0 });
    for (let i = S.bodies.length - 1; i >= 0; i--) {
      const o = S.bodies[i], dx = s.x - o.x, dy = s.y - o.y, d = Math.hypot(dx, dy) + 1;
      if (d > R * 1.5) continue;
      const f = (4200 * (1 - d / (R * 1.5)) + 500) * pull;
      o.vx += ((dx / d) * f + (-dy / d) * f * 0.5) * dt; o.vy += ((dy / d) * f + (dx / d) * f * 0.5) * dt - G * dt * pull; o.vx *= 1 - dt; o.vy *= 1 - dt; o.rest = 0;
      if (d < core + 6) { S.bodies.splice(i, 1); S.stats.eaten++; }
    }
    for (const f of S.fx) if (f.k === 'bit' || f.k === 'sand') { const dx = s.x - f.x, dy = s.y - f.y, d = Math.hypot(dx, dy) + 1; if (d < R) { f.vx += (dx / d) * 2600 * pull * dt + (-dy / d) * 900 * dt; f.vy += (dy / d) * 2600 * pull * dt + (dx / d) * 900 * dt - G * dt; f.stuck = false; if (d < core) f.t = f.life; } }
    const P = S.p, dx = s.x - P.x, dy = s.y - (P.y - 12), d = Math.hypot(dx, dy) + 1; if (d < R) { P.vx += (dx / d) * 700 * pull * dt; P.vy += (dy / d) * 700 * pull * dt; }
    shake(0.2);
  }
  // the wand turns a circle of page into falling sand
  function sandify(x, y, r) {
    const L = S.L;
    q(L.gh, x - r, y - r, r * 2, r * 2, (g) => { if (Math.hypot(g.x + g.w / 2 - x, g.y + g.h / 2 - y) < r) knock(g, rnd(-60, 60), rnd(-120, 0)); });
    for (let cy = Math.floor((y - r) / MC); cy <= Math.floor((y + r) / MC); cy++) for (let cx = Math.floor((x - r) / MC); cx <= Math.floor((x + r) / MC); cx++) {
      const px = cx * MC + 1, py = cy * MC + 1; if ((px - x) ** 2 + (py - y) ** 2 > r * r || !solid(px, py)) continue;
      if (S.sand < MAX_SAND && Math.random() < 0.55) { S.fx.push({ k: 'sand', x: px, y: py, vx: rnd(-20, 20), vy: rnd(-40, 20), c: colorAt(px, py), life: 12, t: rnd(0, 0.2) }); S.sand++; }
      setCell(cx, cy, 0);
    }
    onTiles(y - r, y + r, (c) => { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); });
    for (let i = 0; i < 30; i++) S.fx.push({ k: 'spark', x, y, vx: rnd(-300, 300), vy: rnd(-300, 200), c: pick(['#ffe066', '#ffffff', '#a77bff']), life: rnd(0.2, 0.5), t: 0 });
    sfx('sand'); shake(1.5);
  }

  // ------------------------------------------------------------------ bodies and particles
  function stepBodies(dt) { S.cur = null;
    const L = S.L;
    for (let i = S.bodies.length - 1; i >= 0; i--) {
      const o = S.bodies[i];
      o.vy = Math.min(MAX_FALL, o.vy + G * 0.9 * dt); o.vx *= 1 - dt * 0.4;
      o.x += o.vx * dt; o.y += o.vy * dt; o.a += o.va * dt;
      if (o.x < o.hw * 0.5) { o.x = o.hw * 0.5; o.vx = Math.abs(o.vx) * 0.4; } else if (o.x > L.vw - o.hw * 0.5) { o.x = L.vw - o.hw * 0.5; o.vx = -Math.abs(o.vx) * 0.4; }
      // contact: corners against terrain, with a tipping torque about the deepest one
      const ca = Math.cos(o.a), sa = Math.sin(o.a); let deep = 0, rx = 0, n = 0;
      for (const [u, v] of [[-o.hw, o.hh], [o.hw, o.hh], [-o.hw, -o.hh], [o.hw, -o.hh], [0, o.hh]]) {
        const wx = o.x + u * ca - v * sa, wy = o.y + u * sa + v * ca;
        if (solid(wx, wy)) { let d = 0; while (d < 14 && solid(wx, wy - d)) d++; n++; if (d > deep) { deep = d; rx = wx - o.x; } }
      }
      if (n) {
        o.y -= deep;
        if (o.vy > 0) o.vy = o.vy > 220 ? -o.vy * 0.22 : 0;
        o.vx *= 0.86; o.va = o.va * 0.82 - rx * 0.055 * (n === 1 ? 1 : 0.25);
        if (Math.abs(o.vx) < 18 && Math.abs(o.vy) < 30 && Math.abs(o.va) < 0.6 && n >= 2) { o.rest += dt; if (o.rest > (o.k === 'g' ? 0.6 : o.frag ? 2 : 4)) { settle(o); S.bodies.splice(i, 1); continue; } } else o.rest = 0;
      } else o.rest = 0;
      if (o.y > L.WH + 50) S.bodies.splice(i, 1);
    }
  }
  function stepFx(dt) {
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const f = S.fx[i]; f.t += dt;
      if (f.t >= f.life) { if (f.k === 'sand') S.sand--; S.fx.splice(i, 1); continue; }
      const k = f.k;
      if (k === 'bit' || k === 'sand') {
        f.vy = Math.min(900, f.vy + G * dt); f.vx *= 1 - dt * 0.6;
        const nx = f.x + f.vx * dt, ny = f.y + f.vy * dt;
        if (solid(nx, ny)) {
          if (k === 'sand') { // slide like sand, then become terrain
            if (!solid(f.x - 2, f.y + 2)) { f.x -= 2; f.y += 2; f.vy = 0; continue; } if (!solid(f.x + 2, f.y + 2)) { f.x += 2; f.y += 2; f.vy = 0; continue; }
            stamp(f.x, f.y, f.c, 2); S.sand--; S.fx.splice(i, 1); continue;
          }
          if (Math.abs(f.vy) > 140) { f.vy *= -0.3; f.vx *= 0.6; } else { stamp(f.x, f.y - 1, f.c, f.s); S.fx.splice(i, 1); continue; }
        } else { f.x = nx; f.y = ny; }
        continue;
      }
      if (k === 'spark') { f.vy += 1300 * dt; f.vx *= 1 - dt * 2; }
      else if (k === 'smoke') { f.vx *= 1 - dt * 2; f.vy = f.vy * (1 - dt * 1.5) - 25 * dt; }
      else if (k === 'shell') { f.vy += 1500 * dt; if (solid(f.x, f.y + f.vy * dt)) { f.vy *= -0.35; f.vx *= 0.6; } }
      else if (k === 'fire') { f.vx *= 1 - dt * 3; f.vy = f.vy * (1 - dt * 3) - 160 * dt; }
      else if (k === 'ember') {
        if (!f.stuck) { f.vy += G * 0.8 * dt; if (solid(f.x + f.vx * dt, f.y + f.vy * dt)) { f.stuck = true; f.vx = f.vy = 0; } }
        else { if (Math.random() < dt * 1.2) carve(f.x, f.y + 1, 2.5, { bits: 0, knock: false, detach: false, burn: true }); if (Math.random() < dt * 4 && S.fx.length < MAX_FX) S.fx.push({ k: 'fire', x: f.x + rnd(-2, 2), y: f.y - 2, vx: 0, vy: -40, s: pick([1, 2]), life: 0.3, t: 0 }); if (!solid(f.x, f.y + 2)) f.stuck = false; }
      } else if (k === 'flame') {
        S.cur = f.owner || null;
        if (f.owner !== me() && S.p.alive && Math.abs(f.x - S.p.x) < 9 && f.y < S.p.y && f.y > S.p.y - 56) hurt(72 * dt, f.owner, 'flame');
        f.vx *= 1 - dt * 2; f.vy = f.vy * (1 - dt * 2) - 220 * dt;
        const g = glyphAt(f.x, f.y);
        if (g) { g.burn += dt * 5; if (g.burn > 1) knock(g, f.vx * 0.2, -rnd(160, 320), true); f.vx *= 0.5; f.vy *= 0.5; }
        else if (solid(f.x, f.y)) { if (Math.random() < 0.18) carve(f.x, f.y, 3, { bits: 1, knock: false, detach: false, burn: true }); if (Math.random() < 0.03 && S.fx.length < MAX_FX) S.fx.push({ k: 'ember', x: f.x, y: f.y, vx: 0, vy: 0, stuck: true, life: rnd(1.5, 3), t: 0 }); f.vx *= 0.3; f.vy *= 0.3; const b = boxAt(f.x, f.y); if (b && Math.random() < 0.05) { b.hp -= 8; if (b.hp <= 0) detach(b, f.x, f.y, 200); } }
      }
      if (f.vx) f.x += f.vx * dt; if (f.vy) f.y += f.vy * dt;   // rings and lights have no velocity
    }
    for (let i = S.beams.length - 1; i >= 0; i--) if ((S.beams[i].t += dt) > 0.4) S.beams.splice(i, 1);
  }
  function stamp(x, y, c, s) {
    const L = S.L; if (x < 0 || x >= L.vw || y < 0 || y >= L.WH) return;
    onTiles(y, y + s, (ctx) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, s, s); });
    const k = ((y / MC) | 0) * L.MW + ((x / MC) | 0); if (L.mask[k] === 0) L.mask[k] = 2;
  }


  // ------------------------------------------------------------------ art: hi-res pixel sprites painted in code
  // Shapes are painted flat, snapped to hard pixels and outlined. Light comes from the upper right.
  const shadeHex = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(k > 1 ? v + (255 - v) * (k - 1) : v * k))); return '#' + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1); };
  function pixel(w, h, paint, ox = 0, oy = 0) {
    const cv = document.createElement('canvas'); cv.width = w + 2; cv.height = h + 2;
    const c = cv.getContext('2d'); c.translate(1 - ox, 1 - oy); paint(c); c.setTransform(1, 0, 0, 1, 0, 0);
    const im = c.getImageData(0, 0, cv.width, cv.height), d = im.data, Wd = cv.width, Hd = cv.height, on = new Uint8Array(Wd * Hd);
    for (let i = 0; i < Wd * Hd; i++) { if (d[i * 4 + 3] >= 128) { on[i] = 1; d[i * 4 + 3] = 255; } else d[i * 4 + 3] = 0; }
    for (let y = 0; y < Hd; y++) for (let x = 0; x < Wd; x++) { const i = y * Wd + x; if (on[i]) continue; if ((x > 0 && on[i - 1]) || (x < Wd - 1 && on[i + 1]) || (y > 0 && on[i - Wd]) || (y < Hd - 1 && on[i + Wd])) { d[i * 4] = 11; d[i * 4 + 1] = 12; d[i * 4 + 2] = 20; d[i * 4 + 3] = 255; } }
    c.putImageData(im, 0, 0); return { cv, ox: ox - 1, oy: oy - 1 };
  }
  const Rf = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const Pf = (c, col, pts) => { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); };
  const Ef = (c, col, x, y, rx, ry) => { c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); };

  // the powered suit, built per plate colour
  const suits = new Map();
  // original suit designs; each is a helmet (and sometimes fixed plating) on the same armoured body
  const SKINS = [
    { id: 'standard', name: 'Standard', rank: 0 },
    { id: 'ronin', name: 'Ronin', rank: 1 },
    { id: 'diver', name: 'Diver', rank: 2 },
    { id: 'robot', name: 'Robot', rank: 3 },
    { id: 'astro', name: 'Astro', rank: 4 },
    { id: 'sentinel', name: 'Sentinel', rank: 5 },
    { id: 'phantom', name: 'Phantom', rank: 7, plate: '#2a2d40' },
    { id: 'juggernaut', name: 'Juggernaut', rank: 9 },
    { id: 'golden', name: 'Golden', rank: 11, plate: '#e2a93b' },
  ];
  const skinOf = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
  function helmet(id, c, k) {
    const { base, b1, b2, b3, gm, gm1, gm2, glow, glow1 } = k;
    const dome = () => { Pf(c, base, [[3, 5], [6, 1], [11, 0], [14, 2], [16, 6], [16, 12], [14, 15], [8, 16], [4, 14], [3, 9]]); Pf(c, b2, [[3, 9], [4, 14], [8, 16], [9, 14], [6, 12], [5, 8]]); Rf(c, b1, 8, 1, 4, 1); Rf(c, b1, 12, 2, 2, 2); Rf(c, '#ffffff', 10, 1, 1, 1); };
    Rf(c, gm2, 6, 13, 5, 5); Rf(c, gm, 7, 14, 3, 3);
    if (id === 'ronin') { dome(); Pf(c, '#e8b04a', [[6, 2], [2, -4], [4, -4], [8, 1]]); Pf(c, '#e8b04a', [[10, 1], [14, -4], [16, -4], [12, 2]]); Rf(c, '#fff1b0', 3, -4, 1, 1); Rf(c, '#fff1b0', 15, -4, 1, 1); Pf(c, gm2, [[9, 7], [16, 7], [16, 9], [10, 9]]); Rf(c, glow, 10, 7, 6, 1); Pf(c, gm2, [[8, 10], [16, 10], [15, 15], [9, 15]]); Rf(c, gm1, 10, 12, 5, 1); Rf(c, gm1, 10, 14, 4, 1); Pf(c, b2, [[2, 8], [5, 7], [5, 14], [2, 13]]); }
    else if (id === 'diver') { Ef(c, base, 9, 8, 8, 8); Ef(c, b2, 7, 10, 5, 5); Ef(c, '#9fd8ff', 11, 8, 5, 5); Ef(c, '#1b2440', 11, 8, 4, 4); Rf(c, glow1, 10, 7, 1, 1); Rf(c, glow1, 13, 7, 1, 1); Rf(c, '#ffffff', 9, 5, 2, 1); Rf(c, b1, 6, 1, 5, 1); [[3, 8], [9, 1], [16, 8], [9, 15]].forEach(([x, y]) => Rf(c, gm1, x, y, 1, 1)); }
    else if (id === 'robot') { Rf(c, base, 3, 2, 14, 13); Rf(c, b1, 3, 2, 14, 2); Rf(c, b2, 3, 12, 14, 3); Rf(c, gm1, 9, -3, 1, 5); Rf(c, '#ff5d73', 8, -4, 3, 2); Rf(c, '#0f2b2a', 6, 5, 10, 7); Rf(c, '#2fd08a', 8, 7, 2, 2); Rf(c, '#2fd08a', 12, 7, 2, 2); Rf(c, '#2fd08a', 9, 10, 4, 1); Rf(c, gm1, 2, 7, 1, 3); Rf(c, gm1, 17, 7, 1, 3); }
    else if (id === 'astro') { Ef(c, '#e8ecf8', 9, 8, 7.5, 8); Pf(c, '#c3c9df', [[2, 9], [4, 14], [8, 16], [9, 14], [5, 11]]); Ef(c, '#e8b04a', 11, 8, 5, 4.5); Ef(c, '#b8822a', 10, 10, 3, 2); Rf(c, '#fff6c9', 12, 6, 3, 1); Rf(c, base, 3, 7, 2, 4); Rf(c, glow, 3, 8, 1, 1); Rf(c, '#ffffff', 7, 1, 3, 1); }
    else if (id === 'sentinel') { dome(); Pf(c, glow, [[4, 3], [8, -4], [11, -3], [8, 2]]); Pf(c, glow1, [[7, -2], [8, -4], [9, -3]]); Pf(c, gm2, [[9, 7], [16, 7], [16, 10], [10, 10]]); Rf(c, glow, 10, 8, 6, 1); Pf(c, b2, [[12, 11], [16, 11], [15, 15], [12, 15]]); }
    else if (id === 'phantom') { dome(); Rf(c, '#ff3d7f', 11, 8, 2, 1); Rf(c, '#ff3d7f', 14, 8, 2, 1); Rf(c, '#ffb3cf', 11, 8, 1, 1); Rf(c, '#ffb3cf', 14, 8, 1, 1); Rf(c, b3, 6, 6, 1, 7); }
    else if (id === 'juggernaut') { Pf(c, base, [[2, 3], [15, 2], [17, 6], [17, 14], [13, 16], [4, 16], [2, 12]]); Rf(c, b1, 3, 3, 13, 2); Rf(c, b2, 3, 7, 14, 2); Rf(c, gm2, 9, 9, 8, 2); Rf(c, glow, 10, 9, 6, 1); Rf(c, b2, 2, 12, 15, 2); Rf(c, gm1, 4, 13, 1, 1); Rf(c, gm1, 7, 13, 1, 1); Rf(c, gm1, 10, 13, 1, 1); }
    else { dome(); Pf(c, gm2, [[9, 7], [16, 7], [16, 10], [10, 10]]); Rf(c, glow, 10, 8, 6, 1); Rf(c, glow1, 13, 8, 2, 1); Rf(c, b3, 6, 6, 1, 7); Rf(c, gm1, 4, 9, 2, 3); Rf(c, glow, 4, 10, 1, 1); Rf(c, b2, 12, 12, 3, 1); Rf(c, gm2, 13, 13, 2, 1); }
  }
  function suit(plate, skinId = 'standard') {
    const sk = skinOf(skinId), key = plate + sk.id; if (suits.has(key)) return suits.get(key);
    const base = sk.plate || plate, b1 = shadeHex(base, 1.35), b2 = shadeHex(base, 0.7), b3 = shadeHex(base, 0.5);
    const gm = '#3b4054', gm1 = '#6a7190', gm2 = '#262a38', glow = sk.id === 'phantom' ? shadeHex(plate, 1.6) : shadeHex(base, 1.75), glow1 = '#f2fdff';
    const part = (w, h, jx, jy, paint) => { const s = pixel(w, h, paint); return { cv: s.cv, jx: jx + 1, jy: jy + 1 }; };
    const P = {
      head: part(18, 22, 8, 21, (c) => { c.translate(0, 4); helmet(sk.id, c, { base, b1, b2, b3, gm, gm1, gm2, glow, glow1 }); }),
      torso: part(17, 21, 8, 0, (c) => {
        Pf(c, gm, [[2, 1], [15, 1], [14, 16], [3, 16]]);
        Pf(c, base, [[2, 2], [15, 2], [14, 11], [11, 14], [6, 14], [3, 11]]);
        Rf(c, b2, 2, 2, 3, 9); Rf(c, b1, 12, 3, 2, 7); Rf(c, '#ffffff', 13, 3, 1, 2);
        Ef(c, gm2, 9, 7, 3, 3); Ef(c, glow, 9, 7, 2, 2); Rf(c, glow1, 9, 6, 1, 1);
        Rf(c, b3, 8, 11, 2, 3); Rf(c, gm2, 3, 15, 11, 2); Rf(c, glow, 8, 15, 2, 1);
        Pf(c, gm, [[3, 17], [14, 17], [14, 20], [3, 20]]); Rf(c, gm2, 3, 17, 3, 3);
      }),
      upper: part(8, 12, 4, 0, (c) => { Ef(c, base, 4, 3, 4, 3.5); Rf(c, b1, 5, 1, 2, 2); Rf(c, b2, 0, 3, 2, 3); Rf(c, gm, 1, 6, 6, 5); Rf(c, gm1, 5, 6, 1, 5); }),
      fore: part(7, 13, 3, 0, (c) => { Rf(c, base, 0, 0, 7, 7); Rf(c, b2, 0, 0, 2, 7); Rf(c, b1, 5, 1, 1, 5); Rf(c, glow, 2, 3, 2, 1); Rf(c, gm2, 0, 7, 7, 5); Rf(c, gm1, 4, 8, 2, 1); Rf(c, gm1, 1, 10, 5, 1); }),
      thigh: part(9, 13, 4, 0, (c) => { Pf(c, base, [[0, 0], [9, 0], [8, 13], [1, 13]]); Rf(c, b2, 0, 0, 2, 13); Rf(c, b1, 6, 1, 1, 10); Rf(c, gm2, 2, 6, 5, 1); }),
      shin: part(11, 16, 4, 0, (c) => {
        Rf(c, gm2, 2, 0, 5, 3); Ef(c, gm1, 4, 1, 2, 1.5);
        Pf(c, base, [[1, 2], [8, 2], [8, 9], [1, 9]]); Rf(c, b2, 1, 2, 2, 7); Rf(c, b1, 6, 3, 1, 5);
        Pf(c, b2, [[0, 9], [8, 9], [8, 11], [11, 12], [11, 14], [0, 14]]); Rf(c, base, 1, 9, 6, 2); Rf(c, b1, 8, 12, 2, 1);
        Rf(c, gm2, 0, 14, 11, 2); Rf(c, glow, 3, 15, 4, 1);
      }),
      pack: part(8, 14, 4, 0, (c) => { Rf(c, gm, 0, 0, 8, 12); Rf(c, gm2, 0, 0, 2, 12); Rf(c, base, 2, 1, 5, 3); Rf(c, gm1, 6, 4, 1, 7); Rf(c, gm2, 1, 11, 6, 3); Rf(c, glow, 2, 12, 4, 1); }),
      glow,
    };
    suits.set(key, P); return P;
  }

  // weapons in grip coordinates: grip at 0,0, barrel along +x; mx/my is the muzzle
  const GD = '#1c1f2e', GM = '#343a52', GL = '#565e80', GH = '#9aa3c7';
  const GUN_ART = {
    pistol: { mx: 15, my: -4, w: 19, h: 11, ox: -3, oy: -6, paint: (c) => { Rf(c, GM, -3, -6, 15, 3); Rf(c, GH, -2, -6, 13, 1); Rf(c, GD, -3, -3, 14, 2); Rf(c, GL, 12, -5, 3, 2); Pf(c, GD, [[-3, -2], [2, -2], [1, 4], [-3, 4]]); Rf(c, GM, -2, -1, 2, 1); Rf(c, GD, 2, -2, 3, 2); Rf(c, '#4f8cff', 4, -5, 3, 1); } },
    smg: { mx: 24, my: -4, w: 35, h: 15, ox: -10, oy: -8, paint: (c) => { Rf(c, GM, -10, -4, 6, 3); Rf(c, GD, -10, -2, 3, 2); Rf(c, GD, -4, -6, 20, 6); Rf(c, GL, -4, -6, 20, 1); Rf(c, GH, 0, -6, 6, 1); Rf(c, '#2fd08a', 0, -4, 9, 1); Rf(c, '#b6ff7a', 0, -4, 3, 1); Rf(c, GM, 16, -5, 8, 3); Rf(c, GL, 22, -5, 2, 3); Rf(c, GD, 6, 0, 4, 7); Rf(c, GM, 6, 0, 1, 7); Rf(c, GD, -2, 0, 3, 5); Rf(c, GL, 2, -8, 8, 2); } },
    shotgun: { mx: 32, my: -5, w: 45, h: 12, ox: -12, oy: -7, paint: (c) => { Pf(c, GM, [[-12, -4], [-2, -5], [-2, -1], [-12, 1]]); Rf(c, GD, -12, -1, 10, 2); Rf(c, GD, -2, -6, 12, 5); Rf(c, GL, -2, -6, 12, 1); Rf(c, GM, 10, -6, 22, 2); Rf(c, GH, 10, -6, 22, 1); Rf(c, GD, 10, -4, 20, 2); Rf(c, GL, 14, -3, 9, 3); Rf(c, GM, 14, -1, 9, 1); Rf(c, GD, 16, -3, 1, 3); Rf(c, GD, 19, -3, 1, 3); Rf(c, GD, -1, -1, 3, 4); Rf(c, '#ff5d73', 31, -7, 1, 1); } },
    rocket: { mx: 28, my: -4, w: 45, h: 18, ox: -16, oy: -12, paint: (c) => { Rf(c, '#2c6b57', -14, -8, 40, 9); Rf(c, '#4a9a7e', -14, -8, 40, 2); Rf(c, '#1d4a3c', -14, -1, 40, 2); Rf(c, '#ffb020', -8, -8, 4, 9); Rf(c, GD, -6, -8, 1, 9); Rf(c, GD, 24, -9, 4, 11); Rf(c, GL, 25, -9, 1, 11); Rf(c, GD, -16, -9, 3, 11); Rf(c, GD, 4, -11, 5, 3); Rf(c, '#ff5d73', 5, -10, 2, 1); Rf(c, GD, 0, 1, 3, 5); Rf(c, GD, 10, 1, 3, 4); } },
    rail: { mx: 36, my: -3, w: 51, h: 15, ox: -14, oy: -8, paint: (c) => { Rf(c, GM, -14, -3, 5, 5); Rf(c, GD, -10, -5, 40, 6); Rf(c, GM, -10, -5, 40, 1); for (let i = 0; i < 5; i++) { Rf(c, '#2b5bff', i * 5, -7, 3, 10); Rf(c, '#9fd0ff', i * 5 + 1, -7, 1, 10); } Rf(c, GL, 28, -6, 8, 2); Rf(c, GL, 28, -2, 8, 2); Rf(c, '#57e3ff', 30, -4, 6, 2); Rf(c, GD, -2, 1, 3, 5); } },
    flame: { mx: 27, my: -2, w: 41, h: 15, ox: -12, oy: -7, paint: (c) => { Rf(c, '#ff5d73', -12, -2, 8, 9); Rf(c, '#ffa0ad', -11, -1, 2, 7); Rf(c, '#c9405a', -6, -2, 2, 9); Rf(c, GM, -4, -4, 24, 4); Rf(c, GL, -4, -4, 24, 1); Rf(c, GD, 20, -6, 6, 8); Rf(c, GL, 21, -6, 1, 8); Rf(c, '#ffb020', 26, -3, 2, 2); Rf(c, GD, 0, 0, 3, 5); } },
    doom: { mx: 28, my: -3, w: 45, h: 21, ox: -14, oy: -13, paint: (c) => { Rf(c, '#ffb020', -12, -9, 36, 12); Rf(c, '#ffd27a', -12, -9, 36, 2); Rf(c, '#c98a10', -12, 1, 36, 2); for (let i = 0; i < 5; i++) Rf(c, GD, -8 + i * 6, -9, 2, 12); Rf(c, GD, 24, -10, 4, 14); Rf(c, GD, -14, -8, 3, 10); Rf(c, GD, 2, 3, 3, 5); Rf(c, GD, 12, 3, 3, 4); Rf(c, '#ff5d73', -2, -12, 3, 3); } },
    drone: { mx: 12, my: -6, w: 17, h: 16, ox: -4, oy: -11, paint: (c) => { Rf(c, GM, -4, -6, 16, 10); Rf(c, GL, -4, -6, 16, 1); Rf(c, '#0f2b2a', -2, -4, 9, 6); Rf(c, '#2fd08a', 0, -2, 3, 2); Rf(c, '#b6ff7a', 4, -3, 2, 1); Rf(c, GL, 10, -10, 1, 4); Rf(c, '#ff5d73', 10, -11, 1, 1); } },
    hole: { mx: 24, my: -1, w: 35, h: 15, ox: -8, oy: -7, paint: (c) => { Rf(c, '#8b5cf6', -8, -5, 24, 8); Rf(c, '#b493ff', -8, -5, 24, 1); Rf(c, '#5b3aa6', -8, 2, 24, 1); Ef(c, GD, 20, -1, 6, 6); Ef(c, '#05060b', 20, -1, 4, 4); Rf(c, '#d2bcff', 19, -2, 2, 2); Rf(c, GD, 0, 3, 3, 5); } },
    wand: { mx: 25, my: -1, w: 30, h: 9, ox: -3, oy: -5, paint: (c) => { Rf(c, GM, -2, -1, 24, 2); Rf(c, GL, -2, -1, 24, 1); Pf(c, '#ffe066', [[22, -4], [26, -1], [22, 3], [19, -1]]); Rf(c, '#fff7c2', 21, -2, 2, 1); Rf(c, GD, -2, -2, 6, 4); } },
    nade: { mx: 0, my: 0, w: 8, h: 10, ox: -4, oy: -6, paint: (c) => { Ef(c, '#2c6b57', 0, 0, 3.5, 4); Rf(c, '#4a9a7e', 1, -3, 1, 3); Rf(c, GL, -1, -6, 2, 2); Rf(c, '#ffb020', 1, -6, 3, 1); } },
  };
  const puffs = new Map();
  function puff(r, a, b, c3) {
    const k = r + a; if (puffs.has(k)) return puffs.get(k);
    const s = r * 2 + 1, cv = document.createElement('canvas'); cv.width = cv.height = s; const x = cv.getContext('2d');
    for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) { const d = xx * xx + yy * yy; if (d > r * r + r * 0.6) continue; const l = (xx - yy) / (r || 1); x.fillStyle = l > 0.45 ? a : l < -0.35 || d > r * r - r ? c3 : b; x.fillRect(xx + r, yy + r, 1, 1); }
    puffs.set(k, cv); return cv;
  }
  const FIRE = [['#ffffff', '#fff6d0', '#ffe066'], ['#fff6d0', '#ffe066', '#ffb020'], ['#ffe066', '#ffb020', '#ff7a3d'], ['#ffb020', '#ff7a3d', '#e0465d'], ['#ff7a3d', '#c9405a', '#6b2a3a']];
  const SMOKE = [['#8c87a8', '#6a6585', '#4b4760'], ['#77738f', '#58546e', '#3c3950']];
  function gunSprite(id) { const g = GUN_ART[id] || GUN_ART.pistol; if (!g.s) g.s = pixel(g.w, g.h, g.paint, g.ox, g.oy); return g; }

  // draw a suited player; P.aim is the world aim, feet at P.x, P.y
  function drawSuit(c, P, plate, skinId) {
    const parts = suit(plate, skinId), f = P.face, w = W[P.weapon] || W[0], g = gunSprite(w.id);
    const lim = (pt, ax, ay, bx, by) => { const a = Math.atan2(by - ay, bx - ax) - Math.PI / 2; c.save(); c.translate(Math.round(ax), Math.round(ay)); c.rotate(a); c.drawImage(pt.cv, -pt.jx, -pt.jy); c.restore(); };
    c.save(); c.translate(Math.round(P.x), Math.round(P.y)); if (f < 0) c.scale(-1, 1);
    const air = !P.grounded, aim = f < 0 ? Math.PI - P.aim : P.aim, spd = Math.min(1, Math.abs(P.vx) / RUN), bob = air ? 0 : Math.abs(Math.sin(P.run)) * spd * 1.5, sq = (P.land || 0) * 4;
    const hip = [0, -25 - bob + sq], neck = [1, -44 - bob + sq], sh = [1, -38 - bob + sq];
    if (P.flip >= 0) { c.translate(0, -24); c.rotate(P.flip * Math.PI * 2); c.translate(0, 24); }
    const legs = [0, 1].map((side) => {
      let fx, fy;
      if (!air) { const ph = P.run + side * Math.PI; fx = Math.sin(ph) * 11 * spd + (side ? 2 : -2); fy = -Math.max(0, Math.cos(ph)) * 6 * spd; }
      else { fx = side ? 7 : -4; fy = -10 - (side ? 4 : 0); }
      return ik(hip[0], hip[1], fx, fy, 12, 13, -1);
    });
    const ca = Math.cos(aim), sa = Math.sin(aim), rc = P.recoil || 0;
    const grip = [sh[0] + ca * (12 - rc), sh[1] + 7 + sa * (12 - rc)];
    const fg = w.front ? [grip[0] + ca * w.front, grip[1] + sa * w.front] : [sh[0] - 2, sh[1] + 18];
    const rear = ik(sh[0], sh[1], grip[0], grip[1], 10, 11, 1), front = ik(sh[0], sh[1], fg[0], fg[1], 10, 11, w.front ? 1 : -1);
    lim(parts.pack, neck[0] - 6, neck[1] + 3, neck[0] - 6, neck[1] + 20);
    lim(parts.thigh, hip[0], hip[1], legs[1][0], legs[1][1]); lim(parts.shin, legs[1][0], legs[1][1], legs[1][2], legs[1][3]);
    lim(parts.upper, sh[0], sh[1], front[0], front[1]); lim(parts.fore, front[0], front[1], front[2], front[3]);
    lim(parts.torso, neck[0], neck[1], hip[0], hip[1] + 1);
    const hd = parts.head; c.save(); c.translate(neck[0], neck[1] + 1); c.rotate(clamp(aim * 0.35, -0.3, 0.3)); c.drawImage(hd.cv, -hd.jx, -hd.jy); c.restore();
    lim(parts.thigh, hip[0], hip[1], legs[0][0], legs[0][1]); lim(parts.shin, legs[0][0], legs[0][1], legs[0][2], legs[0][3]);
    c.save(); c.translate(Math.round(grip[0]), Math.round(grip[1])); c.rotate(aim - (P.kr || 0)); c.drawImage(g.s.cv, g.s.ox, g.s.oy);
    if (P.muzzle > 0 && w.kind !== 'drone') { const z = Math.max(0.9, S.muzzleSize || 1); c.translate(g.mx, g.my); Rf(c, '#ffb020', 0, -4 * z, 11 * z, 8 * z); Rf(c, '#ffe066', 0, -3 * z, 9 * z, 6 * z); Rf(c, '#ffffff', 0, -1.5 * z, 5 * z, 3 * z); Rf(c, '#ffe066', 11 * z, -1 * z, 5 * z, 2 * z); }
    c.restore();
    lim(parts.upper, sh[0], sh[1], rear[0], rear[1]); lim(parts.fore, rear[0], rear[1], rear[2], rear[3]);
    c.restore();
  }

  // a suit standing on a little platform, for the start screen
  function preview(canvas, plate, t, aim, weapon = 1, skinId) {
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height);
    const k = Math.floor(canvas.height / 80) || 1; c.scale(k, k);
    const w = canvas.width / k, h = canvas.height / k, P = { x: w / 2, y: h - 10, vx: 0, grounded: true, run: 0, land: 0, flip: -1, recoil: 0, kr: 0, weapon, face: Math.cos(aim) >= 0 ? 1 : -1, aim, muzzle: 0 };
    const S0 = S; if (!S) S = { muzzleSize: 1 };
    try { Rf(c, '#07080f', w / 2 - 24, h - 10, 48, 4); Rf(c, '#3c3f60', w / 2 - 23, h - 10, 46, 1); P.y -= Math.round(Math.abs(Math.sin(t * 2)) * 1); drawSuit(c, P, plate, skinId); } finally { S = S0; }
  }

  // ------------------------------------------------------------------ maps: original themed levels, generated from a fixed seed
  // Every player builds the same map from the same seed, so rooms share one level.
  function rng32(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const hashStr = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; };
  function noise1(r, cells) { const v = Array.from({ length: cells + 2 }, r); return (u) => { const x = clamp(u, 0, 1) * cells, i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f); return v[i] * (1 - s) + v[i + 1] * s; }; }
  // texture: speckle a clipped area with darker and lighter pixels
  function speckle(c, r, x, y, w, h, cols, n) { for (let i = 0; i < n; i++) { c.fillStyle = cols[(r() * cols.length) | 0]; c.fillRect((x + r() * w) | 0, (y + r() * h) | 0, r() < 0.3 ? 2 : 1, r() < 0.3 ? 2 : 1); } }
  function poly(c, col, pts) { c.fillStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath(); c.fill(); }
  // pixel-art edge light: lit top edges, shaded undersides, dark outline into the air
  function edgePass(cv, top, under) {
    const c = cv.getContext('2d'), im = c.getImageData(0, 0, cv.width, cv.height), d = im.data, W2 = cv.width, H2 = cv.height, a = (x, y) => x >= 0 && y >= 0 && x < W2 && y < H2 && d[(y * W2 + x) * 4 + 3] > 128;
    const T = [1, 3, 5].map((k) => parseInt(top.slice(k, k + 2), 16)), U = [1, 3, 5].map((k) => parseInt(under.slice(k, k + 2), 16)), set = [], put = (x, y, col, al = 255) => set.push([x, y, col, al]);
    for (let y = 0; y < H2; y++) for (let x = 0; x < W2; x++) { if (!a(x, y)) continue; if (!a(x, y - 1)) { put(x, y, T); if (a(x, y + 1)) put(x, y + 1, T, 150); } else if (!a(x, y + 1)) put(x, y, U); else if (!a(x - 1, y) || !a(x + 1, y)) put(x, y, U, 120); }
    for (const [x, y, col, al] of set) { const i = (y * W2 + x) * 4, k = al / 255; d[i] = d[i] * (1 - k) + col[0] * k; d[i + 1] = d[i + 1] * (1 - k) + col[1] * k; d[i + 2] = d[i + 2] * (1 - k) + col[2] * k; }
    c.putImageData(im, 0, 0);
  }
  // crisp text on a sign: glyph records so the letters can be shot off
  function signText(c, glyphs, text, x, y, size, color, under) {
    c.font = `700 ${size}px Silkscreen, ui-monospace, monospace`; c.textBaseline = 'alphabetic'; let cx = x;
    for (const ch of text) { const w = c.measureText(ch).width; if (ch !== ' ') { c.fillStyle = color; c.fillText(ch, cx, y); glyphs.push({ ch, x: cx, y: y - size, w, h: size * 1.15, font: c.font, color, under, dead: false, burn: 0, by: y }); } cx += w + 1; }
    return cx - x;
  }
  const crate = (boxes, x, y, s, fill, band) => boxes.push({ x, y, w: s, h: s, r: 2, fill, stroke: band, sw: 3, hp: 60, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' });

  const MAPS = {
    isles: { name: 'Floating Isles', theme: 'day', height: 1650, gen(c, W2, H2, r, boxes, glyphs, spawns) {
      const rows = [300, 560, 820, 1080, 1340];
      rows.forEach((ry, ri) => {
        let x = 30 + r() * 120;
        while (x < W2 - 160) {
          const w = 170 + r() * 260, top = ry + r() * 70 - 35, th = 34 + r() * 26, depth = 70 + r() * 110, n = noise1(r, 6);
          const pts = []; for (let k = 0; k <= 12; k++) pts.push([x + (k / 12) * w, top + (n(k / 12) - 0.5) * 8]);
          for (let k = 12; k >= 0; k--) { const u = k / 12, edge = Math.sin(u * Math.PI); pts.push([x + u * w + (r() - 0.5) * 10, top + th + edge * depth * (0.55 + r() * 0.45)]); }
          poly(c, '#5a6585', pts);
          c.save(); c.clip(new Path2D(`M${pts.map((p) => p.join(' ')).join(' L')} Z`)); speckle(c, r, x, top, w, th + depth, ['#4b5574', '#68739a', '#515b7c'], (w * (th + depth)) / 18);
          for (let s = top + 18; s < top + th + depth; s += 14) { c.fillStyle = 'rgba(40,46,70,.35)'; c.fillRect(x, s | 0, w, 1); }
          c.fillStyle = '#2e9a58'; c.fillRect(x - 2, top - 4, w + 4, 12); c.restore();
          poly(c, '#3fbf6f', pts.slice(0, 13).map(([px, py]) => [px, py - 4]).concat([[x + w + 2, top + 4], [x - 2, top + 4]]));
          for (let gx = x; gx < x + w; gx += 2) if (r() < 0.45) { c.fillStyle = r() < 0.5 ? '#7be39b' : '#58d184'; c.fillRect(gx | 0, (top - 6 - r() * 3) | 0, 1, 3); }
          for (let fx = x + 8; fx < x + w - 8; fx += 18 + r() * 30) { c.fillStyle = pick2(r, ['#ff79c6', '#ffe066', '#ffffff']); c.fillRect(fx | 0, (top - 7) | 0, 2, 2); }
          if (w > 240 && r() < 0.7) { const tx = x + w * (0.2 + r() * 0.6); c.fillStyle = '#3b4054'; c.fillRect(tx - 3, top - 40, 6, 40); [[0, -52, 18], [-12, -42, 13], [12, -42, 13], [0, -64, 12]].forEach(([dx, dy, rr], k) => { c.fillStyle = k === 3 ? '#4fd17f' : '#2fae63'; c.beginPath(); c.arc(tx + dx, top + dy, rr, 0, 7); c.fill(); c.fillStyle = '#7be39b'; c.fillRect(tx + dx + rr * 0.2, top + dy - rr * 0.6, 3, 2); }); }
          if (r() < 0.6) crate(boxes, (x + w * (0.15 + r() * 0.6)) | 0, (top - 26) | 0, 22, '#ff8a3d', '#a8501d');
          if (ri === 0) spawns.push([x + w / 2, top - 10]);
          x += w + 70 + r() * 150;
        }
      });
      c.fillStyle = '#3d7fd6'; c.fillRect(0, H2 - 50, W2, 50); c.fillStyle = '#5fa0ef'; for (let x = 0; x < W2; x += 6) if (r() < 0.5) c.fillRect(x, H2 - 50 + ((r() * 6) | 0), 4, 1);
      const sx = W2 * 0.5 - 70; boxes.push({ x: sx, y: 210, w: 140, h: 36, r: 3, fill: '#2f3650', stroke: '#ffe066', sw: 2, hp: 80, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' });
      c.fillStyle = '#2f3650'; c.fillRect(sx + 66, 246, 8, 50);
      signText(c, glyphs, 'WRECK', sx + 14, 236, 20, '#ffe066', '#2f3650');
    } },
    caverns: { name: 'Crystal Caverns', theme: 'cave', height: 1800, gen(c, W2, H2, r, boxes, glyphs, spawns) {
      const S2 = 10, gw = Math.ceil(W2 / S2), gh = Math.ceil(H2 / S2); let g = new Uint8Array(gw * gh);
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) g[y * gw + x] = y * S2 < 220 ? 0 : x === 0 || x === gw - 1 || y === gh - 1 ? 1 : r() < 0.5 ? 1 : 0;
      for (let it = 0; it < 5; it++) { const n2 = new Uint8Array(g.length); for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; s += xx < 0 || yy < 0 || xx >= gw || yy >= gh ? 1 : g[yy * gw + xx]; } n2[y * gw + x] = y * S2 < 220 ? 0 : s >= 5 ? 1 : 0; } g = n2; }
      for (let x = 0; x < gw; x++) for (let y = 22; y < 26; y++) g[y * gw + x] = 1;          // a ceiling crust under the entrance hall
      for (let k = 0; k < 4; k++) { const hx = ((0.15 + k * 0.23) * gw) | 0; for (let y = 22; y < 26; y++) for (let x = hx; x < hx + 4; x++) g[y * gw + x] = 0; }   // shafts down
      for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (g[y * gw + x]) { const n = (x * 7 + y * 13) % 3; c.fillStyle = ['#2d2a45', '#302c4a', '#2a2742'][n]; c.fillRect(x * S2, y * S2, S2, S2); }
      speckle(c, r, 0, 220, W2, H2 - 220, ['#25223b', '#3a365a', '#221f36'], (W2 * H2) / 40);
      for (let y = 1; y < gh - 1; y++) for (let x = 1; x < gw - 1; x++) {
        const on = g[y * gw + x], up = g[(y - 1) * gw + x], dn = g[(y + 1) * gw + x];
        if (on && !up && r() < 0.045) crystal(c, r, x * S2 + 5, y * S2, -1);
        if (on && !dn && r() < 0.12) { if (r() < 0.82) poly(c, '#24213a', [[x * S2, (y + 1) * S2], [x * S2 + 10, (y + 1) * S2], [x * S2 + 5, (y + 1) * S2 + 12 + r() * 14]]); else crystal(c, r, x * S2 + 5, (y + 1) * S2, 1); }
      }
      for (let k = 0; k < 6; k++) spawns.push([W2 * (0.1 + k * 0.16), 200]);
      const sx = W2 * 0.5 - 90; boxes.push({ x: sx, y: 120, w: 180, h: 34, r: 3, fill: '#1a1830', stroke: '#57e3ff', sw: 2, hp: 80, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' });
      signText(c, glyphs, 'DIG DEEP', sx + 12, 145, 18, '#57e3ff', '#1a1830');
    } },
    rooftops: { name: 'Neon Rooftops', theme: 'city', height: 1500, gen(c, W2, H2, r, boxes, glyphs, spawns) {
      const ground = H2 - 70; c.fillStyle = '#23263a'; c.fillRect(0, ground, W2, 70); c.fillStyle = '#ffe066'; for (let x = 10; x < W2; x += 60) c.fillRect(x, ground + 32, 26, 3);
      let x = 20; const words = ['NEON', 'WRECK', 'PIXEL', 'OPEN', 'HOTEL', 'ARCADE'];
      while (x < W2 - 80) {
        const w = 130 + r() * 150, top = 330 + r() * 560, col = pick2(r, ['#2b2f55', '#33275a', '#24345a', '#3a2a50']);
        c.fillStyle = col; c.fillRect(x, top, w, ground - top);
        c.fillStyle = shadeHex(col, 1.3); c.fillRect(x, top, w, 4); c.fillRect(x + w - 3, top, 3, ground - top);
        c.fillStyle = shadeHex(col, 0.75); c.fillRect(x, top + 4, 3, ground - top);
        for (let wy = top + 18; wy < ground - 14; wy += 18) for (let wx = x + 10; wx < x + w - 14; wx += 16) { const lit = r() < 0.45; c.fillStyle = lit ? pick2(r, ['#ffcf6b', '#ffe9a8', '#9fd8ff']) : '#171a2e'; c.fillRect(wx, wy, 8, 10); if (lit) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(wx, wy, 8, 2); } }
        if (r() < 0.6) { const tx = x + 14 + r() * (w - 50); c.fillStyle = '#3b4054'; c.fillRect(tx, top - 34, 30, 30); c.fillRect(tx + 4, top - 6, 4, 6); c.fillRect(tx + 22, top - 6, 4, 6); c.fillStyle = '#4f5674'; c.fillRect(tx, top - 34, 30, 4); }
        if (r() < 0.7) boxes.push({ x: (x + w - 44 - r() * 30) | 0, y: (top - 18) | 0, w: 28, h: 18, r: 1, fill: '#8a90ad', stroke: '#4a4f6e', sw: 2, hp: 50, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' });
        if (r() < 0.5) { const ax = x + w * 0.5; c.fillStyle = '#4a4f6e'; c.fillRect(ax, top - 60, 2, 60); c.fillStyle = '#ff4d5e'; c.fillRect(ax - 1, top - 62, 4, 3); }
        if (r() < 0.45 && w > 150) { const bw = Math.min(w - 20, 150), bx = x + (w - bw) / 2, by = top - 80, nc = pick2(r, ['#ff5d73', '#57e3ff', '#b6ff7a', '#ff9ef0']); c.fillStyle = '#3b4054'; c.fillRect(bx + 10, by + 40, 4, 40); c.fillRect(bx + bw - 14, by + 40, 4, 40); boxes.push({ x: bx, y: by, w: bw, h: 40, r: 2, fill: '#141526', stroke: nc, sw: 3, hp: 90, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' }); signText(c, glyphs, pick2(r, words), bx + 12, by + 29, 18, nc, '#141526'); }
        spawns.push([x + w / 2, top - 6]);
        x += w + 40 + r() * 70;
      }
    } },
    peak: { name: 'Frozen Peak', theme: 'dawn', height: 1700, gen(c, W2, H2, r, boxes, glyphs, spawns) {
      const n = noise1(r, 7), n2 = noise1(r, 23), hgt = (u) => 360 + (1 - Math.sin(u * Math.PI) * 0.9) * 520 + (n(u) - 0.5) * 260 + (n2(u) - 0.5) * 50;
      const pts = [[0, H2]]; for (let x = 0; x <= W2; x += 8) pts.push([x, hgt(x / W2)]); pts.push([W2, H2]);
      poly(c, '#5a6788', pts); c.save(); c.clip(new Path2D(`M${pts.map((p) => p.join(' ')).join(' L')} Z`));
      speckle(c, r, 0, 300, W2, H2 - 300, ['#4f5b7c', '#66739a', '#53607f'], (W2 * H2) / 30);
      for (let k = 0; k < 14; k++) { const ix = r() * W2, iy = hgt(ix / W2) + 80 + r() * 700; poly(c, '#9fd8ff', [[ix, iy], [ix + 30 + r() * 40, iy + 6], [ix + 20, iy + 26], [ix - 16, iy + 18]]); c.fillStyle = '#e6f7ff'; c.fillRect(ix + 4, iy + 4, 8, 2); }
      for (let k = 0; k < 5; k++) { const cx = W2 * (0.12 + r() * 0.76), cy = hgt(cx / W2) + 160 + r() * 600, rw = 60 + r() * 90; c.save(); c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.ellipse(cx, cy, rw, 26 + r() * 22, 0, 0, 7); c.fill(); c.restore(); }
      c.restore();
      for (let x = 0; x < W2; x += 2) { const y = hgt(x / W2); c.fillStyle = '#f4f8ff'; c.fillRect(x, y - 3, 2, 9 + ((r() * 4) | 0)); c.fillStyle = '#c9dcff'; c.fillRect(x, y + 6, 2, 2); }
      for (let k = 0; k < 16; k++) { const tx = r() * W2, ty = hgt(tx / W2) + 2, s = 0.7 + r() * 0.6; for (let l = 0; l < 3; l++) poly(c, l === 2 ? '#2f7a5a' : '#256b4d', [[tx - 14 * s + l * 3 * s, ty - l * 12 * s], [tx + 14 * s - l * 3 * s, ty - l * 12 * s], [tx, ty - (l * 12 + 20) * s]]); c.fillStyle = '#ffffff'; c.fillRect(tx - 2, ty - 44 * s, 4, 3); c.fillStyle = '#3b4054'; c.fillRect(tx - 2, ty, 4, 6); }
      for (let k = 0; k < 5; k++) crate(boxes, (W2 * (0.1 + k * 0.2)) | 0, (hgt(0.1 + k * 0.2) - 24) | 0, 22, '#9fd8ff', '#4f8cff');
      for (let k = 0; k < 6; k++) { const sx = W2 * (0.08 + k * 0.17); spawns.push([sx, hgt(sx / W2) - 12]); }
    } },
    circuit: { name: 'Circuit Board', theme: 'pcb', height: 1600, gen(c, W2, H2, r, boxes, glyphs, spawns) {
      const slabs = [];
      for (let y = 320; y < H2 - 120; y += 230) { let x = 10 + r() * 80; while (x < W2 - 120) { const w = 220 + r() * 320; slabs.push([x, y + r() * 60, Math.min(w, W2 - x - 10), 40 + r() * 24]); x += w + 60 + r() * 110; } }
      slabs.push([0, H2 - 60, W2, 60]);
      for (const [x, y, w, h] of slabs) {
        c.fillStyle = '#1f8f5a'; c.fillRect(x, y, w, h); c.fillStyle = '#26a868'; c.fillRect(x, y, w, 3); c.fillStyle = '#17734a'; c.fillRect(x, y + h - 3, w, 3);
        for (let tx = x + 8; tx < x + w - 8; tx += 10 + r() * 14) { c.fillStyle = '#e8b04a'; const ty = y + 8 + r() * (h - 16); c.fillRect(tx, ty, 18 + r() * 40, 2); c.fillRect(tx, ty, 2, 6 + r() * 8); c.fillStyle = '#ffd27a'; c.fillRect(tx - 1, ty - 1, 3, 3); }
        for (let cx = x + 20; cx < x + w - 60; cx += 90 + r() * 90) {
          if (r() < 0.55) { const cw = 46 + r() * 30; c.fillStyle = '#9aa3c7'; for (let p = cx + 4; p < cx + cw - 3; p += 6) { c.fillRect(p, y - 4, 3, 4); } boxes.push({ x: cx | 0, y: (y - 22) | 0, w: cw | 0, h: 18, r: 1, fill: '#15161f', stroke: '#3a3d58', sw: 1, hp: 70, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' }); signText(c, glyphs, 'IC' + ((r() * 9 + 1) | 0), cx + 6, y - 8, 10, '#e6eaff', '#15161f'); }
          else { boxes.push({ x: cx | 0, y: (y - 26) | 0, w: 14, h: 26, r: 4, fill: '#4f8cff', stroke: '#2b5bff', sw: 2, hp: 40, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' }); }
        }
        spawns.push([x + w / 2, y - 30]);
      }
      const sx = W2 * 0.5 - 80; boxes.push({ x: sx, y: 200, w: 160, h: 34, r: 2, fill: '#0f3d2a', stroke: '#e8b04a', sw: 2, hp: 80, hits: 0, dead: false, vis: true, clear: true, under: 'transparent' });
      signText(c, glyphs, 'OVERCLOCK', sx + 10, 224, 14, '#e8b04a', '#0f3d2a');
    } },
    forge: { name: 'Lava Forge', theme: 'volcano', height: 1600, lava: 1600 - 110, gen(c, W2, H2, r, boxes, glyphs, spawns) {
      const rows = [300, 540, 780, 1020, 1260];
      rows.forEach((ry) => { let x = 20 + r() * 100; while (x < W2 - 140) {
        const w = 160 + r() * 240, top = ry + r() * 60 - 30, th = 30 + r() * 30, pts = [];
        for (let k = 0; k <= 10; k++) pts.push([x + (k / 10) * w, top + (r() - 0.5) * 6]);
        for (let k = 10; k >= 0; k--) pts.push([x + (k / 10) * w + (r() - 0.5) * 12, top + th + Math.sin((k / 10) * Math.PI) * (30 + r() * 40)]);
        poly(c, '#2a2333', pts); c.save(); c.clip(new Path2D(`M${pts.map((p) => p.join(' ')).join(' L')} Z`));
        speckle(c, r, x, top, w, th + 80, ['#221c2a', '#352c40', '#1d1824'], (w * (th + 80)) / 16);
        for (let k = 0; k < 4; k++) { const cx = x + r() * w; c.fillStyle = '#ff7a3d'; c.fillRect(cx, top + 6 + r() * th, 1 + ((r() * 2) | 0), 6 + r() * 10); }
        c.restore(); c.fillStyle = '#ff5d4a'; for (let gx = x; gx < x + w; gx += 2) if (r() < 0.25) c.fillRect(gx, top + th + 24 + r() * 20, 2, 2);
        if (r() < 0.5) crate(boxes, (x + w * (0.2 + r() * 0.6)) | 0, (top - 24) | 0, 22, '#4a4f6e', '#ff7a3d');
        spawns.push([x + w / 2, top - 8]); x += w + 80 + r() * 140; } });
      const ly = H2 - 110; for (let y = ly; y < H2; y++) { c.fillStyle = y < ly + 6 ? '#ffe066' : y < ly + 16 ? '#ffb020' : '#ff6a2a'; c.fillRect(0, y, W2, 1); }
      for (let k = 0; k < W2 / 6; k++) { c.fillStyle = r() < 0.5 ? '#fff6d0' : '#ffd27a'; c.fillRect(r() * W2, ly + 4 + r() * 90, 3, 2); }
    } },
  };
  const pick2 = (r, a) => a[(r() * a.length) | 0];
  function crystal(c, r, x, y, dir) {
    const col = pick2(r, [['#57e3ff', '#b2f6ff', '#2b9fc4'], ['#ff79c6', '#ffc2e6', '#c44a92'], ['#b493ff', '#e3d6ff', '#7a52d6']]), n = 2 + ((r() * 3) | 0);
    const g = c.createRadialGradient(x, y + dir * 10, 2, x, y + dir * 10, 30); g.addColorStop(0, col[0] + '55'); g.addColorStop(1, col[0] + '00'); c.fillStyle = g; c.fillRect(x - 30, y + dir * 10 - 30, 60, 60);
    for (let i = 0; i < n; i++) { const h = 10 + r() * 18, w = 4 + r() * 4, ox = (i - n / 2) * 5 + (r() - 0.5) * 3, tilt = (r() - 0.5) * 6; poly(c, col[0], [[x + ox - w / 2, y], [x + ox + w / 2, y], [x + ox + tilt + w / 4, y + dir * h], [x + ox + tilt - w / 4, y + dir * h * 0.92]]); c.fillStyle = col[1]; c.fillRect(x + ox - 1, y + dir * 2, 1, dir * h * 0.6); }
  }
  // build a level record for a map id at this width; the same id and width always gives the same map
  function makeMap(id, vw) {
    const M = MAPS[id] || MAPS.isles, H2 = M.height, r = rng32(hashStr(id + ':' + vw));
    const cv = document.createElement('canvas'); cv.width = vw; cv.height = H2; const c = cv.getContext('2d');
    const boxes = [], glyphs = [], spawns = [];
    M.gen(c, vw, H2, r, boxes, glyphs, spawns);
    edgePass(cv, ...({ day: ['#8a96bd', '#3a4260'], cave: ['#4f4a78', '#1b1930'], city: ['#5a5f8f', '#15172b'], dawn: ['#ffffff', '#3d4866'], pcb: ['#3fd58d', '#0f4d31'], volcano: ['#ff7a3d', '#140f19'] }[M.theme] || ['#ffffff', '#000000']));
    for (const b of boxes) { b.under = 'transparent'; b.hp0 = b.hp; }
    return { map: id, theme: M.theme, art: cv, boxes, glyphs, bg: null, vw, pageH: H2, WH: H2, spawns: spawns.length ? spawns : [[vw / 2, 100]], lava: M.lava };
  }
  Wreck.maps = Object.entries(MAPS).map(([id, m]) => ({ id, name: m.name }));
  // a small picture of a map for the menu
  Wreck.mapThumb = (id, canvas) => {
    const L = makeMap(id, 1280), c = canvas.getContext('2d'), k = canvas.width / 1280; c.imageSmoothingEnabled = true;
    const B = backdrop(1280, Math.ceil(canvas.height / k), L.theme); c.save(); c.scale(k, k); c.drawImage(B.sky, 0, 0); B.layers.forEach((Ly, li) => c.drawImage(Ly.cv, 0, B.vh - Ly.h + 10 - li * 0)); c.drawImage(L.art, 0, 0); for (const b of L.boxes) paintBox(c, b); c.restore();
  };

  // ------------------------------------------------------------------ drawing (1x world, scaled to the screen with crisp pixels)
  function sprite(w) { if (w._spr) return w._spr; const minX = Math.min(...w.px.map((r) => r[0])), minY = Math.min(...w.px.map((r) => r[1])), maxX = Math.max(...w.px.map((r) => r[0] + r[2])), maxY = Math.max(...w.px.map((r) => r[1] + r[3])); const cv = document.createElement('canvas'); cv.width = maxX - minX + 2; cv.height = maxY - minY + 2; const c = cv.getContext('2d'); c.fillStyle = OUT; for (const r of w.px) c.fillRect(r[0] - minX, r[1] - minY, r[2] + 2, r[3] + 2); for (const r of w.px) { c.fillStyle = r[4]; c.fillRect(r[0] - minX + 1, r[1] - minY + 1, r[2], r[3]); } return (w._spr = { cv, ox: minX - 1, oy: minY - 1 }); }
  function draw() {
    const L = S.L, v = S.vctx, cam = Math.round(S.cam);
    v.setTransform(1, 0, 0, 1, 0, 0); v.globalAlpha = 1; v.globalCompositeOperation = 'source-over'; v.imageSmoothingEnabled = false;
    drawBack(v, S.back, cam, S.time + S.frame / 600);
    for (let i = Math.max(0, Math.floor(cam / TILE)); i <= Math.min(L.tiles.length - 1, Math.floor((cam + S.vh) / TILE)); i++) v.drawImage(L.tiles[i].cv, 0, i * TILE - cam);
    v.setTransform(1, 0, 0, 1, 0, -cam);
    v.textBaseline = 'alphabetic';
    for (const o of S.bodies) {
      if (o.y < cam - 200 || o.y > cam + S.vh + 200) continue;
      v.save(); v.translate(o.x, o.y); v.rotate(o.a);
      if (o.k === 'g') { v.font = o.font; v.fillStyle = o.color; v.fillText(o.ch, -o.hw, o.by); }
      else v.drawImage(o.sprite, -o.hw, -o.hh, o.hw * 2, o.hh * 2);
      v.restore();
    }
    for (const f of S.fx) {
      if (f.y < cam - 40 || f.y > cam + S.vh + 40) continue;
      const e = f.t / f.life, k = f.k;
      if (k === 'bit' || k === 'sand') { v.fillStyle = f.c; v.fillRect(f.x | 0, f.y | 0, f.s || 2, f.s || 2); }
      else if (k === 'spark') { v.fillStyle = f.c; v.fillRect(f.x | 0, f.y | 0, 2, 2); v.globalAlpha = 0.5; v.fillRect((f.x - f.vx * 0.015) | 0, (f.y - f.vy * 0.015) | 0, 1, 1); v.globalAlpha = 1; }
      else if (k === 'fire' || k === 'flame') { const r = Math.max(1, Math.round((f.s || 3) * (1.25 - e * 0.65) * 0.7)), pal = FIRE[Math.min(4, (e * 5) | 0)], img = puff(r, ...pal); v.drawImage(img, (f.x - r) | 0, (f.y - r) | 0); }
      else if (k === 'ember') { v.fillStyle = Math.random() < 0.5 ? '#ffb020' : '#ff5d4a'; v.fillRect(f.x | 0, (f.y - 1) | 0, 2, 2); }
      else if (k === 'smoke') { const r = Math.max(1, Math.round(f.s * (0.6 + e) * 0.55)), img = puff(r, ...(f.c ? ['#c9cde6', '#9a9fbd', '#6c7194'] : SMOKE[r & 1])); v.globalAlpha = (1 - e) * 0.75; v.drawImage(img, (f.x - r) | 0, (f.y - r) | 0); v.globalAlpha = 1; }
      else if (k === 'shell') { v.fillStyle = '#ffcf3d'; v.fillRect(f.x | 0, f.y | 0, 3, 2); }
      else if (k === 'light') { const g = v.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.s); g.addColorStop(0, `rgba(255,214,120,${f.a * (1 - e)})`); g.addColorStop(1, 'rgba(255,160,60,0)'); v.globalCompositeOperation = 'lighter'; v.fillStyle = g; v.fillRect(f.x - f.s, f.y - f.s, f.s * 2, f.s * 2); v.globalCompositeOperation = 'source-over'; }
      else if (k === 'flashb') { v.globalAlpha = 1 - e; v.fillStyle = '#ffffff'; v.save(); v.translate(f.o.x, f.o.y); v.rotate(f.o.a); v.fillRect(-f.o.hw, -f.o.hh, f.o.hw * 2, f.o.hh * 2); v.restore(); v.globalAlpha = 1; }
      else if (k === 'ring') { const r = f.r + (f.max - f.r) * Math.sqrt(e); v.strokeStyle = f.c || '#ffffff'; v.globalAlpha = 1 - e; v.lineWidth = Math.max(1, 4 * (1 - e)); v.beginPath(); v.arc(f.x, f.y, r, 0, 7); v.stroke(); v.globalAlpha = 1; }
    }
    for (const s of S.shots) {
      if (s.k === 'b') { v.strokeStyle = '#ffe066'; v.lineWidth = 2; v.beginPath(); v.moveTo(s.x, s.y); v.lineTo(s.x - s.vx * 0.009, s.y - s.vy * 0.009); v.stroke(); v.fillStyle = '#ffffff'; v.fillRect(s.x - 1, s.y - 1, 2, 2); }
      else if (s.k === 'r') { v.save(); v.translate(s.x, s.y); v.rotate(Math.atan2(s.vy, s.vx)); v.fillStyle = OUT; v.fillRect(-8, -3, 13, 6); v.fillStyle = '#2c6b57'; v.fillRect(-7, -2, 9, 4); v.fillStyle = C.r; v.fillRect(2, -2, 3, 4); v.restore(); }
      else if (s.k === 'n' || s.k === 'm') { v.fillStyle = OUT; v.fillRect(s.x - 3, s.y - 3, 7, 7); v.fillStyle = s.k === 'm' ? C.o : '#2c6b57'; v.fillRect(s.x - 2, s.y - 2, 5, 5); if ((s.fuse * 8 | 0) % 2) { v.fillStyle = C.r; v.fillRect(s.x, s.y - 4, 1, 2); } }
      else if (s.k === 'd') { v.fillStyle = OUT; v.fillRect(s.x - 5, s.y - 5, 11, 11); v.fillStyle = C.o; v.fillRect(s.x - 4, s.y - 4, 9, 9); v.fillStyle = C.r; v.fillRect(s.x - 1, s.y - 4, 3, 9); }
      else if (s.k === 'w') { v.fillStyle = '#ffffff'; v.fillRect(s.x - 2, s.y - 2, 4, 4); v.fillStyle = '#ffe066'; v.fillRect(s.x - 1, s.y - 1, 2, 2); }
      else if (s.k === 'h') drawHole(v, s);
    }
    for (const d of S.drones) drawDrone(v, d);
    for (const b of S.beams) { const e = b.t / 0.4, w = Math.max(1, Math.round(12 * (1 - e))); v.lineCap = 'butt'; v.strokeStyle = '#2b5bff'; v.lineWidth = w + 4; v.globalAlpha = 1 - e; v.beginPath(); v.moveTo(b.x0, b.y0); v.lineTo(b.x1, b.y1); v.stroke(); v.strokeStyle = '#57e3ff'; v.lineWidth = w; v.stroke(); v.strokeStyle = '#ffffff'; v.lineWidth = Math.max(1, w / 3); v.stroke(); v.globalAlpha = 1; }
    for (const r of S.remotes.values()) if (r.alive) drawPlayer(v, r, r.skin, r.name, r.suit, r.rank);
    if (S.p.alive) drawPlayer(v);
    if (!S.touch) { const x = S.aimX | 0, y = S.aimY | 0; v.fillStyle = OUT; v.fillRect(x - 6, y - 1, 13, 3); v.fillRect(x - 1, y - 6, 3, 13); v.fillStyle = '#ffffff'; v.fillRect(x - 5, y, 4, 1); v.fillRect(x + 2, y, 4, 1); v.fillRect(x, y - 5, 1, 4); v.fillRect(x, y + 2, 1, 4); }
    const c = S.ctx, sh = S.trauma * S.trauma * 16, ox = Math.round((rnd(-sh, sh) + S.ckx) * S.k) * S.dpr, oy = Math.round((rnd(-sh, sh) + S.cky) * S.k) * S.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
    c.fillStyle = '#120f2e'; c.fillRect(0, 0, S.cv.width, S.cv.height);
    c.drawImage(S.view, ox, oy, S.vw * S.k * S.dpr, S.vh * S.k * S.dpr);
    if (S.flash > 0.01) { c.fillStyle = `rgba(255,255,255,${S.flash})`; c.fillRect(0, 0, S.cv.width, S.cv.height); }
    if (Wreck.net && (S.p.hurtT > 0 || S.p.hp < 30)) { const a = Math.min(0.55, S.p.hurtT * 1.6 + (S.p.hp < 30 && S.p.alive ? 0.15 + 0.08 * Math.sin(S.frame / 6) : 0)), gr = c.createRadialGradient(S.cv.width / 2, S.cv.height / 2, S.cv.height * 0.35, S.cv.width / 2, S.cv.height / 2, S.cv.height * 0.8); gr.addColorStop(0, 'rgba(255,40,60,0)'); gr.addColorStop(1, `rgba(255,40,60,${a})`); c.fillStyle = gr; c.fillRect(0, 0, S.cv.width, S.cv.height); }
  }
  function drawHole(v, s) {
    const on = s.t >= 0.5, k = on ? clamp((s.t - 0.5) / 0.5, 0, 1) : 0, R = 5 + 14 * k;
    if (on) { v.save(); v.translate(s.x, s.y); v.rotate(s.t * 5); for (let i = 0; i < 3; i++) { v.strokeStyle = ['#a77bff', '#ff5d73', '#57e3ff'][i]; v.lineWidth = 2; v.beginPath(); v.ellipse(0, 0, R * (2.1 + i * 0.6), R * (0.7 + i * 0.2), i * 0.9, 0, Math.PI * 1.3); v.stroke(); } v.restore(); }
    v.fillStyle = '#ffffff'; v.beginPath(); v.arc(s.x, s.y, (on ? R : 4) + 2, 0, 7); v.fill();
    v.fillStyle = '#000000'; v.beginPath(); v.arc(s.x, s.y, on ? R : 4, 0, 7); v.fill();
  }
  function drawDrone(v, d) {
    const x = d.x | 0, y = d.y | 0, sp = (S.frame >> 1) % 2;
    v.fillStyle = OUT; v.fillRect(x - 8, y - 3, 17, 7); v.fillRect(x - 10, y - 6, 7, 2); v.fillRect(x + 4, y - 6, 7, 2);
    v.fillStyle = C.m; v.fillRect(x - 7, y - 2, 15, 5); v.fillStyle = d.life < 2 && (S.frame & 4) ? C.r : C.g; v.fillRect(x - 1, y - 1, 3, 2);
    v.fillStyle = '#c9cde6'; v.fillRect(x - (sp ? 11 : 9), y - 6, sp ? 9 : 5, 1); v.fillRect(x + (sp ? 3 : 5), y - 6, sp ? 9 : 5, 1);
    if (d.aim != null) { v.fillStyle = OUT; v.fillRect(x + Math.cos(d.aim) * 6 - 1, y + 3 + Math.sin(d.aim) * 3, 3, 3); }
  }
  function ik(ax, ay, tx, ty, l1, l2, s) { let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy); const m = l1 + l2 - 0.01; if (d > m) { dx *= m / d; dy *= m / d; d = m; } const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c) * s; return [ax + Math.cos(a - b) * l1, ay + Math.sin(a - b) * l1, ax + dx, ay + dy]; }
  function drawPlayer(v, P = S.p, skin = Wreck.skin, name, suitId = Wreck.suit, rank) {
    if (P.shield > 0 && (S.frame >> 2) % 2) v.globalAlpha = 0.45;
    drawSuit(v, P, /^#[0-9a-f]{6}$/i.test(skin) ? skin : '#5b6bd6', suitId); v.globalAlpha = 1;
    if (P.hurtT > 0 && (S.frame >> 1) % 2) { v.globalCompositeOperation = 'lighter'; v.globalAlpha = 0.35; drawSuit(v, P, '#ff3040', suitId); v.globalAlpha = 1; v.globalCompositeOperation = 'source-over'; }
    if (Wreck.net && name && P.hp < MAX_HP) { v.fillStyle = OUT; v.fillRect(P.x - 15, P.y - 80, 30, 5); v.fillStyle = P.hp > 50 ? '#2fd08a' : P.hp > 25 ? '#ffb020' : '#ff4d5e'; v.fillRect(P.x - 14, P.y - 79, Math.max(0, 28 * P.hp / MAX_HP), 3); }
    if (name && rank != null) { const tw = (v.font = '10px Silkscreen, ui-monospace, monospace', v.measureText(name).width); v.drawImage(badge(rank, 12), Math.round(P.x - tw / 2 - 15), P.y - 76); }
    if (name) { v.font = '10px Silkscreen, ui-monospace, monospace'; v.textAlign = 'center'; v.textBaseline = 'alphabetic'; v.lineWidth = 3; v.strokeStyle = OUT; v.strokeText(name, P.x, P.y - 66); v.fillStyle = '#ffffff'; v.fillText(name, P.x, P.y - 66); v.textAlign = 'left'; }
  }


  // ------------------------------------------------------------------ HUD in a shadow root, pixel style
  const CSS = `
  :host{all:initial}
  *{box-sizing:border-box;font-family:Silkscreen,"Press Start 2P",ui-monospace,Menlo,monospace}
  .pn{background:linear-gradient(#232540,#1a1b2e);color:#e9eaf5;border:2px solid #07080f;box-shadow:inset 2px 2px 0 #4a4e78,inset -2px -2px 0 #0e0f1c,0 4px 0 rgba(0,0,0,.45);border-radius:3px}
  .top{position:fixed;left:14px;right:14px;top:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none}
  .meter{width:250px;padding:9px 10px;display:flex;align-items:center;gap:10px;font-size:14px}
  .bar{flex:1;height:12px;background:#0b0c14;border:2px solid #0b0c14;position:relative;overflow:hidden}
  .bar i{position:absolute;inset:0 auto 0 0;width:0;background:repeating-linear-gradient(90deg,#ff7a3d 0 5px,#ffb020 5px 7px);box-shadow:inset 0 2px 0 rgba(255,255,255,.35)}
  .btns{display:flex;gap:6px;pointer-events:auto}
  button{font:inherit;font-size:12px;color:#e9eaf5;background:#2b2e4e;border:2px solid #07080f;box-shadow:inset 2px 2px 0 #4f5486,inset -2px -3px 0 #15162a;border-radius:4px;padding:7px 10px;cursor:pointer}
  button:hover{background:#30335a}
  button:active{transform:translateY(1px);box-shadow:inset 0 0 0 2px #3c3f60}
  .wbar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:4px;padding:5px;pointer-events:auto;max-width:calc(100vw - 16px);overflow-x:auto}
  .slot{position:relative;width:64px;height:46px;background:#141526;border:2px solid #07080f;box-shadow:inset 2px 2px 0 #0a0b16,inset -1px -1px 0 #3c3f60;display:grid;place-items:center;cursor:pointer;flex:none;border-radius:3px}
  .slot.on{background:#2b2d52;box-shadow:inset 0 0 0 2px #ffe066,0 0 0 2px #07080f,0 0 12px rgba(255,224,102,.35)}
  .slot canvas{width:56px;height:28px;image-rendering:pixelated}
  .slot span{position:absolute;left:4px;top:1px;font-size:9px;color:#a4a8c8}
  .hp{position:fixed;left:14px;top:60px;width:250px;padding:7px 10px;display:flex;align-items:center;gap:10px;font-size:12px;pointer-events:none}
  .hbar{flex:1;height:10px;background:#0b0c14;border:2px solid #0b0c14;position:relative;overflow:hidden}.hbar i{position:absolute;inset:0 auto 0 0;width:100%;background:#2fd08a;box-shadow:inset 0 2px 0 rgba(255,255,255,.35)}
  .feed{position:fixed;right:14px;top:58px;display:flex;flex-direction:column;align-items:flex-end;gap:4px;pointer-events:none}.kf{padding:5px 9px;font-size:11px}
  .dead{white-space:pre-line;position:fixed;left:50%;top:40%;transform:translate(-50%,-50%);font-size:26px;color:#ff8a9a;text-shadow:3px 3px 0 #07080f;pointer-events:none;text-align:center}
  .slot .cdv{position:absolute;inset:auto 0 0 0;height:0;background:rgba(7,8,15,.7)}
  .xpp{position:fixed;left:50%;top:14px;transform:translateX(-50%);padding:5px 10px;font-size:12px;color:#ffe066;pointer-events:none;transition:opacity .4s}
  .promo{position:fixed;left:50%;top:22%;transform:translateX(-50%);display:flex;gap:12px;align-items:center;padding:12px 16px;pointer-events:none;animation:pr 3.2s ease both}
  .promo canvas{width:48px;height:48px;image-rendering:pixelated}.promo b{display:block;font-size:20px;font-weight:400;color:#ffe066}.promo small{display:block;font-size:10px;color:#a4a8c8}
  @keyframes pr{0%{opacity:0;transform:translate(-50%,-12px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}85%{opacity:1}100%{opacity:0}}
  .wname{position:fixed;left:50%;bottom:76px;transform:translateX(-50%);padding:6px 12px;font-size:14px;pointer-events:none;transition:opacity .3s}
  .help{position:fixed;left:14px;bottom:12px;padding:9px 11px;font-size:11px;line-height:2;pointer-events:none;transition:opacity .8s}
  .help b{display:inline-block;min-width:16px;text-align:center;background:#0b0c14;border-radius:2px;padding:0 4px;margin-right:3px;color:#ffe066;font-weight:400}
  .ov{position:fixed;inset:0;display:grid;place-items:center;background:rgba(10,8,30,.55);pointer-events:auto}
  .ov .pn{width:min(380px,calc(100vw - 28px));padding:20px}
  .ov h2{margin:0 0 6px;font-size:22px;font-weight:400;color:#ffe066}
  .ov p{margin:0 0 14px;color:#a4a8c8;font-size:11px;line-height:1.6}
  .st{display:grid;grid-template-columns:1fr auto;gap:8px 12px;font-size:11px;margin-bottom:16px}.st .v{color:#ffe066;text-align:right}
  .row{display:flex;gap:8px}.row button{flex:1;padding:11px 6px}.row .go{background:#ff5d73;box-shadow:inset 0 -3px 0 #b23a4e,inset 0 0 0 2px #ff8a9a}
  .stick{position:fixed;width:116px;height:116px;margin:-58px 0 0 -58px;border-radius:50%;border:2px solid rgba(255,255,255,.35);background:rgba(28,29,43,.35);pointer-events:none;display:none}
  .stick i{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;background:rgba(255,224,102,.7)}
  .tb{position:fixed;right:12px;bottom:76px;display:none;flex-direction:column;gap:8px;pointer-events:auto}.tb button{width:54px;height:54px;font-size:16px;padding:0}
  @media (pointer:coarse){.help{display:none}.tb{display:flex}.slot{width:48px;height:40px}.slot canvas{width:42px;height:21px}.meter{width:150px;font-size:12px}.btns button{padding:8px}}
  `;
  function buildHud() {
    if (!document.getElementById('wreck-font')) { const l = document.createElement('link'); l.id = 'wreck-font'; l.rel = 'stylesheet'; l.href = 'https://fonts.googleapis.com/css2?family=Silkscreen&display=swap'; l.setAttribute('data-wreck', ''); document.head.appendChild(l); }
    const host = document.createElement('div'); host.setAttribute('data-wreck', ''); host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>
      <div class="top"><div class="pn meter"><div class="bar"><i></i></div><span class="pct">0%</span></div>
      <div class="pn room" style="display:none;padding:9px 10px;font-size:12px"></div>
      <div class="btns"><button class="snd"></button><button class="rst">Rebuild</button><button class="ext">Exit</button></div></div>
      <div class="pn wname" style="opacity:0"></div>
      <div class="pn hp" style="display:none"><span>HP</span><div class="hbar"><i></i></div><b class="hpn">100</b></div>
      <div class="feed"></div>
      <div class="pn xpp" style="opacity:0"></div>
      <div class="dead" style="display:none"></div>
      <div class="pn wbar"></div>
      <div class="pn help"><b>A</b><b>D</b>run <b>W</b>jump · tap to flip · hold to fly<br><b>S</b>drop <b>Click</b>shoot <b>Right</b>grenade <b>1-0</b>weapons<br><b>Esc</b>pause</div>
      <div class="stick l"><i></i></div><div class="stick r"><i></i></div>
      <div class="tb"><button class="tj">▲</button><button class="tn">✹</button><button class="tw">⇄</button></div>`;
    const $ = (s) => root.querySelector(s), bar = $('.wbar');
    const icon = (w) => { const c = document.createElement('canvas'); c.width = 56; c.height = 28; const g = c.getContext('2d'), s = gunSprite(w.id || 'nade').s, sc = Math.max(1, Math.floor(Math.min(52 / s.cv.width, 24 / s.cv.height))); g.imageSmoothingEnabled = false; g.drawImage(s.cv, Math.round((56 - s.cv.width * sc) / 2), Math.round((28 - s.cv.height * sc) / 2), s.cv.width * sc, s.cv.height * sc); return c; };
    [...W, NADE].forEach((w, i) => {
      const d = document.createElement('div'); d.className = 'slot'; d.title = w.name; d.innerHTML = `<span>${i < 10 ? (i + 1) % 10 : 'RMB'}</span>`; d.appendChild(icon(w));
      d.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (i < 10) setWeapon(i); else throwGrenade(); }); bar.appendChild(d);
    });
    $('.snd').onclick = toggleMute; $('.rst').onclick = rebuild; $('.ext').onclick = stop;
    root.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));
    document.documentElement.appendChild(host);
    const nslot = bar.lastChild; const cdv = document.createElement('div'); cdv.className = 'cdv'; nslot.appendChild(cdv);
    return { host, root, $, pct: $('.pct'), bar: $('.bar i'), wname: $('.wname'), slots: [...bar.children], help: $('.help'), cdv, xp: $('.xpp'), hpw: $('.hp'), hbar: $('.hbar i'), hpn: $('.hpn'), dead: $('.dead') };
  }
  function setWeapon(i) {
    const P = S.p; if (P.weapon !== i) { P.kr = -0.9; P.krv = 0; sfx('tick'); } P.weapon = i; P.cd = Math.max(P.cd, 0.12); P.charge = -1;
    S.hud.slots.forEach((s, k) => s.classList.toggle('on', k === i));
    S.hud.wname.textContent = W[i].name; S.hud.wname.style.opacity = '1'; S.wnameT = 1.4; flameSound(false);
  }
  function labels() { const c = matchMedia('(pointer: coarse)').matches; S.hud.$('.snd').textContent = c ? (muted ? 'x' : '♪') : muted ? 'Sound off' : 'Sound on'; S.hud.$('.rst').textContent = c ? '↻' : 'Rebuild'; S.hud.$('.ext').textContent = c ? '✕' : 'Exit'; }
  function toggleMute() { muted = !muted; try { localStorage.setItem('wreck-muted', muted ? '1' : '0'); } catch {} labels(); if (muted) flameSound(false); }
  // mostly letters knocked off (what you see go), plus elements broken and page carved away
  function progress() { const L = S.L; if (L.art) return clamp(0.6 * S.removed / (L.total * 0.3) + 0.25 * S.stats.letters / Math.max(1, L.glyphs.length) + 0.15 * S.stats.elements / Math.max(1, L.boxes.length), 0, 1); return clamp(0.7 * S.stats.letters / Math.max(1, L.glyphs.length) + 0.15 * S.stats.elements / Math.max(1, L.boxes.length * 0.5) + 0.15 * S.removed / (L.total * 0.3), 0, 1); }
  function hudTick(dt) {
    const p = progress();
    if ((S.frame & 3) === 0) { S.hud.pct.textContent = Math.floor(p * 100) + '%'; S.hud.bar.style.width = (p * 100).toFixed(1) + '%'; }
    if (S.wnameT > 0 && (S.wnameT -= dt) <= 0) S.hud.wname.style.opacity = '0';
    if ((S.frame & 3) === 0) {
      S.hud.cdv.style.height = (Math.max(0, S.nadeCd) / (S.nadeMax || 1) * 100).toFixed(0) + '%';
      const on = !!Wreck.net; S.hud.hpw.style.display = on ? '' : 'none';
      if (on) { const hp = Math.max(0, Math.round(S.p.hp)); S.hud.hbar.style.width = hp + '%'; S.hud.hbar.style.background = hp > 50 ? '#2fd08a' : hp > 25 ? '#ffb020' : '#ff4d5e'; S.hud.hpn.textContent = hp; }
      S.hud.dead.style.display = S.p.alive ? 'none' : ''; if (!S.p.alive) S.hud.dead.textContent = `Destroyed by ${S.p.lastBy && S.p.lastBy !== me() ? nameOf(S.p.lastBy) : 'yourself'}\nRespawning in ${Math.max(1, Math.ceil(S.p.respawnT))}`;
    }
    if (S.time > 12 || S.stats.shots > 30) S.hud.help.style.opacity = '0';
    for (const [m, xp] of [[0.25, 40], [0.5, 80]]) if (p >= m && !(S.miles || (S.miles = {}))[m]) { S.miles[m] = 1; S.cur = null; gainXP(xp); }
    if (!S.done && p >= 0.7) { S.done = true; S.cur = null; gainXP(250); overlay('done'); }
    if (S.xpT > 0 && (S.xpT -= dt) <= 0) { S.xpBuf = 0; S.hud.xp.style.opacity = '0'; } else if (S.xpBuf) { S.hud.xp.textContent = `+${S.xpBuf} XP`; S.hud.xp.style.opacity = '1'; }
  }
  function overlay(kind) {
    S.hud.root.querySelector('.ov')?.remove();
    const d = document.createElement('div'); d.className = 'ov';
    if (kind === 'pause') d.innerHTML = `<div class="pn"><h2>Paused</h2><p>${location.hostname || 'This page'} is waiting.</p><div class="row"><button class="a">Resume</button><button class="b">Rebuild</button><button class="c">Exit</button></div></div>`;
    else { const t = Math.round(S.time); const st = [['XP earned', S.xpGain || 0], ['Rank', Wreck.progress().name], ['Letters knocked off', S.stats.letters], ['Elements broken', S.stats.elements], ['Explosions', S.stats.explosions], ['Eaten by black holes', S.stats.eaten], ['Shots fired', S.stats.shots], ['Time', `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`]]; d.innerHTML = `<div class="pn"><h2>Website destroyed</h2><p>${location.hostname || 'This page'} never stood a chance.</p><div class="st">${st.map(([k, v]) => `<span>${k}</span><span class="v">${typeof v === 'number' ? v.toLocaleString() : v}</span>`).join('')}</div><div class="row"><button class="a">Keep going</button><button class="b go">Rebuild</button><button class="c">Exit</button></div></div>`; }
    d.querySelector('.a').onclick = () => { d.remove(); S.paused = false; }; d.querySelector('.b').onclick = () => { d.remove(); S.paused = false; rebuild(); }; d.querySelector('.c').onclick = stop;
    d.addEventListener('pointerdown', (e) => e.stopPropagation());
    S.paused = true; S.in.fire = false; S.hud.root.appendChild(d);
  }

  // ------------------------------------------------------------------ input
  const KEYS = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', Space: 'jump', KeyS: 'down', ArrowDown: 'down' };
  function onKey(e) {
    if (!S || e.metaKey || e.ctrlKey || e.altKey) return;
    const down = e.type === 'keydown', k = KEYS[e.code];
    if (k) { if (down && k === 'jump' && !S.in.jump) S.in.jumpPressed = true; S.in[k] = down; }
    if (down && !e.repeat) {
      if (e.code === 'Escape') { if (S.paused) { S.hud.root.querySelector('.ov')?.remove(); S.paused = false; } else overlay('pause'); }
      else if (e.code === 'KeyR') rebuild();
      else if (e.code === 'KeyM') toggleMute();
      else if (e.code === 'KeyQ' || e.code === 'KeyE' || e.code === 'KeyG') throwGrenade();
      else if (/^Digit\d$/.test(e.code)) setWeapon((+e.code.slice(5) + 9) % 10);
    }
    e.preventDefault(); e.stopImmediatePropagation();
  }
  function bindInput() {
    const cv = S.cv, I = S.in; S.on = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); S.on.push([t, ev, fn, o]); };
    const aimAt = (e) => { S.mx = e.clientX / S.k; S.my = e.clientY / S.k; };
    on(window, 'keydown', onKey, true); on(window, 'keyup', onKey, true);
    on(cv, 'contextmenu', (e) => e.preventDefault());
    on(cv, 'wheel', (e) => { e.preventDefault(); if (Math.abs(e.deltaY) > 4 && S.time - (S.wheelT || 0) > 0.09) { S.wheelT = S.time; setWeapon((S.p.weapon + (e.deltaY > 0 ? 1 : 9)) % 10); } }, { passive: false });
    on(cv, 'pointermove', (e) => (e.pointerType === 'mouse' ? aimAt(e) : touchMove(e)));
    on(cv, 'pointerdown', (e) => { audio(); AC?.resume?.(); if (e.pointerType !== 'mouse') return touchDown(e); aimAt(e); if (e.button === 2) throwGrenade(); else { I.fire = true; S.fired = false; S.fireQ = 0.25; } });
    on(window, 'pointerup', (e) => { if (e.pointerType !== 'mouse') return touchUp(e); if (e.button !== 2) I.fire = false; });
    on(window, 'pointercancel', touchUp);
    on(window, 'blur', () => { for (const k in I) I[k] = false; });
    on(window, 'resize', () => { clearTimeout(S.rt); S.rt = setTimeout(() => S && resize(), 200); });
    const tb = (sel, fn, up) => { const b = S.hud.$(sel); on(b, 'pointerdown', (e) => { e.stopPropagation(); audio(); fn(); }); if (up) { on(b, 'pointerup', up); on(b, 'pointerleave', up); } };
    tb('.tj', () => { I.jumpPressed = true; I.jump = true; }, () => (I.jump = false)); tb('.tn', throwGrenade); tb('.tw', () => setWeapon((S.p.weapon + 1) % 10));
  }
  function touchDown(e) {
    S.touch = true; const left = e.clientX < S.sw / 2, st = S.hud.$(left ? '.stick.l' : '.stick.r');
    S.sticks[left ? 'l' : 'r'] = { id: e.pointerId, x: e.clientX, y: e.clientY, el: st };
    st.style.display = 'block'; st.style.left = e.clientX + 'px'; st.style.top = e.clientY + 'px'; st.firstChild.style.transform = '';
    if (!left) { S.in.fire = true; S.fired = false; S.fireQ = 0.25; S.tAim = S.p.aim; }
  }
  function touchMove(e) {
    for (const side of ['l', 'r']) {
      const s = S.sticks[side]; if (!s || s.id !== e.pointerId) continue;
      let dx = e.clientX - s.x, dy = e.clientY - s.y; const d = Math.hypot(dx, dy), m = 42; if (d > m) { dx *= m / d; dy *= m / d; }
      s.el.firstChild.style.transform = `translate(${dx}px,${dy}px)`;
      if (side === 'l') { S.in.left = dx < -12; S.in.right = dx > 12; const up = dy < -24; if (up && !S.in.jump) S.in.jumpPressed = true; S.in.jump = up; S.in.down = dy > 30; }
      else if (d > 6) S.tAim = Math.atan2(dy, dx);
    }
  }
  function touchUp(e) { for (const side of ['l', 'r']) { const s = S.sticks[side]; if (!s || (e && e.pointerId !== undefined && s.id !== e.pointerId)) continue; s.el.style.display = 'none'; S.sticks[side] = null; if (side === 'l') S.in.left = S.in.right = S.in.jump = S.in.down = false; else S.in.fire = false; } }

  // ------------------------------------------------------------------ ranks and XP (kept in this browser)
  const RANKS = [['Recruit', 0], ['Rookie', 300], ['Scrapper', 800], ['Breaker', 1500], ['Demolisher', 2500], ['Wrecker', 4000], ['Sapper', 6000], ['Bombardier', 9000], ['Siege Master', 13000], ['Annihilator', 18000], ['Worldbreaker', 25000], ['Legend', 35000]];
  const XP_KEY = 'wreck-xp';
  let xpTotal = 0; try { xpTotal = Math.max(0, parseInt(localStorage.getItem(XP_KEY), 10) || 0); } catch {}
  const rankOf = (xp) => { let r = 0; RANKS.forEach(([, need], i) => { if (xp >= need) r = i; }); return r; };
  let saveT = 0;
  function gainXP(n, why) {
    if (!S || !(n > 0) || (S.cur && S.cur !== me())) return;   // only what you destroyed counts
    const before = rankOf(xpTotal); xpTotal += n; S.xpGain = (S.xpGain || 0) + n; S.xpBuf = (S.xpBuf || 0) + n; S.xpT = 1.2;
    if (performance.now() - saveT > 1500) saveXP();
    const after = rankOf(xpTotal); if (after > before) promote(after);
  }
  function saveXP() { saveT = performance.now(); try { localStorage.setItem(XP_KEY, String(xpTotal)); } catch {} }
  function promote(r) {
    saveXP(); sfx('rank');
    const unlocked = SKINS.filter((s) => s.rank === r).map((s) => s.name);
    const d = document.createElement('div'); d.className = 'promo pn';
    d.innerHTML = `<canvas width="48" height="48"></canvas><div><small>Promoted to</small><b>${RANKS[r][0]}</b>${unlocked.length ? `<small>${unlocked.join(' and ')} suit unlocked</small>` : ''}</div>`;
    d.querySelector('canvas').getContext('2d').drawImage(badge(r, 48), 0, 0);
    S.hud.root.appendChild(d); setTimeout(() => d.remove(), 3200);
    Wreck.onRank?.(r);
  }
  // pixel rank badges: chevrons, then stripes with a star, then stars, then a wreath
  const badges = new Map();
  function badge(r, size) {
    const k = r + ':' + size; if (badges.has(k)) return badges.get(k);
    const s = pixel(16, 16, (c) => {
      const gold = r >= 10 ? '#ffd24a' : r >= 6 ? '#e8b04a' : '#c9cde6', dark = r >= 6 ? '#8a5a12' : '#4a4f6e';
      Pf(c, '#1c1f2e', [[1, 1], [15, 1], [15, 11], [8, 15], [1, 11]]); Pf(c, dark, [[2, 2], [14, 2], [14, 10], [8, 14], [2, 10]]);
      const chev = (y) => { Pf(c, gold, [[3, y], [8, y + 3], [13, y], [13, y + 2], [8, y + 5], [3, y + 2]]); };
      const star = (x, y, z = 1) => { Pf(c, gold, [[x, y - 3 * z], [x + 1 * z, y - 1 * z], [x + 3 * z, y - 1 * z], [x + 1.5 * z, y + 0.5 * z], [x + 2 * z, y + 3 * z], [x, y + 1.5 * z], [x - 2 * z, y + 3 * z], [x - 1.5 * z, y + 0.5 * z], [x - 3 * z, y - 1 * z], [x - 1 * z, y - 1 * z]]); };
      if (r === 0) Rf(c, gold, 5, 7, 6, 2);
      else if (r <= 3) for (let i = 0; i < r; i++) chev(3 + i * 3);
      else if (r <= 5) { chev(7); chev(10); star(8, 5, 0.8); if (r === 5) Rf(c, gold, 4, 3, 8, 1); }
      else if (r <= 9) { const n = r - 5; for (let i = 0; i < n; i++) star(n === 1 ? 8 : 4 + i * (8 / (n - 1)), 7, n > 2 ? 0.75 : 1); }
      else { star(8, 6, 1.3); Pf(c, gold, [[3, 10], [5, 13], [8, 14], [11, 13], [13, 10], [11, 12], [8, 13], [5, 12]]); if (r === 11) { Rf(c, '#ffffff', 7, 2, 2, 1); } }
    });
    const cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.drawImage(s.cv, 0, 0, size, size);
    badges.set(k, cv); return cv;
  }
  Wreck.ranks = RANKS.map(([name, xp]) => ({ name, xp }));
  Wreck.skins = SKINS.map((s) => ({ id: s.id, name: s.name, rank: s.rank }));
  Wreck.progress = () => { const r = rankOf(xpTotal); return { xp: xpTotal, rank: r, name: RANKS[r][0], next: RANKS[r + 1] ? { name: RANKS[r + 1][0], xp: RANKS[r + 1][1] } : null, floor: RANKS[r][1] }; };
  Wreck.badge = badge;
  Wreck.suit = 'standard';

  // ------------------------------------------------------------------ health and PvP (online only)
  const MAX_HP = 100, RESPAWN = 3, SHIELD = 1.5;
  const DMG = { pistol: 22, smg: 9, shotgun: 11, drone: 5 };
  const BLAST = { rocket: 95, grenade: 85, bomblet: 40, drone: 60, hole: 70 };
  const WNAME = { lava: 'Lava', pistol: 'Pistol', smg: 'SMG', shotgun: 'Shotgun', rocket: 'Rocket', rail: 'Railgun', flame: 'Flamethrower', bomblet: 'Doomsday', grenade: 'Grenade', drone: 'Drone', hole: 'Black Hole' };
  const me = () => Wreck.selfId || 'me';
  // a bullet at x, y hits a living player other than its owner (shields still stop bullets)
  function playerAt(x, y, owner) {
    if (!Wreck.net) return null;
    const P = S.p; if (P.alive && owner !== me() && Math.abs(x - P.x) <= 8 && y <= P.y && y >= P.y - 56) return P;
    for (const R of S.remotes.values()) if (R.alive && owner !== R.id && Math.abs(x - R.x) <= 8 && y <= R.y && y >= R.y - 56) return R;
    return null;
  }
  function hurt(dmg, by, w) {
    const P = S.p; if (!Wreck.net || !P.alive || P.shield > 0 || !(dmg > 0)) return;
    P.hp -= dmg; P.hurtT = 0.3; P.lastBy = by; trauma(Math.min(0.5, dmg / 120)); sfx('hurt');
    if (P.hp <= 0) die(P, by, w, true);
  }
  function die(P, by, w, local) {
    P.alive = false; P.hp = 0;
    burstSuit(P, local ? Wreck.skin : P.skin);
    if (local) { P.respawnT = RESPAWN; S.deaths = (S.deaths || 0) + 1; net({ t: 'die', by: typeof by === 'string' ? by : '', w: w || '' }); feed(by, me(), w); sfx('boom', 0.8); }
  }
  // the suit comes apart: plates fly off as debris
  function burstSuit(P, plate) {
    const parts = suit(/^#[0-9a-f]{6}$/i.test(plate) ? plate : '#5b6bd6', P === S.p ? Wreck.suit : P.suit);
    for (const k of ['head', 'torso', 'upper', 'upper', 'fore', 'fore', 'thigh', 'thigh', 'shin', 'shin', 'pack']) {
      const p = parts[k]; S.bodies.push({ k: 's', sprite: p.cv, frag: true, hits: 0, x: P.x + rnd(-8, 8), y: P.y - rnd(10, 50), hw: p.cv.width / 2, hh: p.cv.height / 2, vx: rnd(-320, 320) + P.vx * 0.5, vy: rnd(-520, -180), a: rnd(-1, 1), va: rnd(-14, 14), rest: 0 });
    }
    for (let i = 0; i < 26 && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'fire', x: P.x + rnd(-10, 10), y: P.y - rnd(10, 50), vx: rnd(-200, 200), vy: rnd(-260, 40), s: pick([3, 4, 5, 6]), life: rnd(0.3, 0.7), t: 0 });
    S.fx.push({ k: 'ring', x: P.x, y: P.y - 28, r: 6, max: 60, life: 0.3, t: 0 }); S.fx.push({ k: 'light', vx: 0, vy: 0, x: P.x, y: P.y - 28, s: 160, a: 0.9, life: 0.3, t: 0 });
  }
  function spawnAt() { const L = S.L; if (L.spawns) { const s = L.spawns[(Math.random() * L.spawns.length) | 0]; return [Math.round(s[0] + rnd(-20, 20)), Math.round(s[1]) - 40]; } return [Math.round(rnd(0.15, 0.85) * L.vw), SKY - 60]; }
  function respawn() {
    const P = S.p, sp = spawnAt(); P.x = sp[0]; P.y = sp[1]; P.vx = P.vy = 0; P.hp = MAX_HP; P.alive = true; P.shield = SHIELD; P.cd = 0.3; P.flip = -1; P.charge = -1;
    S.fx.push({ k: 'ring', x: P.x, y: P.y - 28, r: 60, max: 4, life: 0.35, t: 0, c: '#57e3ff' });
  }
  const nameOf = (id) => (id === 'lava' ? 'Lava' : id === me() ? 'You' : S.remotes.get(id)?.name || (roster.find((r) => r.id === id)?.name) || 'Someone');
  function feed(by, victim, w) {
    if (by === me() && victim !== me()) { S.kills = (S.kills || 0) + 1; S.cur = null; gainXP(100); }
    const line = by && by !== victim ? `${nameOf(by)} ✕ ${nameOf(victim)}  ·  ${WNAME[w] || ''}` : `${nameOf(victim)} self-destructed`;
    const el = document.createElement('div'); el.className = 'pn kf'; el.textContent = line; S.hud.$('.feed').prepend(el);
    setTimeout(() => el.remove(), 5000); while (S.hud.$('.feed').children.length > 5) S.hud.$('.feed').lastChild.remove();
    hudRoom();
  }
  function hudRoom() { if (!S?.hud) return; S.hud.$('.room').textContent = `${roster.length || 1} players · ${S.kills || 0} kills · ${S.deaths || 0} deaths`; }

  // ------------------------------------------------------------------ multiplayer
  let roster = [];
  const r1 = (v) => Math.round(v * 10) / 10, r3 = (v) => Math.round(v * 1000) / 1000;
  const num = (v, a, b) => typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : null;
  const net = (m) => { try { Wreck.net?.send(m); } catch {} };
  const KINDS = new Set(['b', 'r', 'n', 'm', 'd', 'h', 'w']);
  const ser = (s) => ({ k: s.k, x: r1(s.x), y: r1(s.y), vx: r1(s.vx), vy: r1(s.vy), dmg: s.dmg, pierce: s.pierce, carve: s.carve, fuse: s.fuse, life: s.life, r: s.r, w: s.w, range: s.range != null ? Math.round(s.range) : undefined });
  const SKIN_RE = /^#[0-9a-f]{6}$/i;
  function remotePlayer(r) { const sp = spawnAt(); const p = makePlayer(sp[0], sp[1]); p.id = r.id; p.name = String(r.name || 'Player').slice(0, 16); p.suit = skinOf(r.suit).id; p.rank = Number.isInteger(r.rank) ? clamp(r.rank, 0, RANKS.length - 1) : 0; p.skin = SKIN_RE.test(r.skin) ? r.skin : '#4f8cff'; p.tx = p.x; p.ty = p.y; p.tokens = 40; p.hp = MAX_HP; p.alive = true; return p; }
  function stepRemotes(dt) {
    for (const R of S.remotes.values()) {
      R.tx += R.vx * dt; R.ty += R.vy * dt;                     // dead-reckon between updates, then ease toward it
      const k = 1 - Math.exp(-dt * 14); R.x += (R.tx - R.x) * k; R.y += (R.ty - R.y) * k;
      if (R.flip >= 0) { R.flip += dt / 0.4; if (R.flip >= 1) R.flip = -1; }
      R.tokens = Math.min(60, R.tokens + dt * 40);
      if (R.fi && W[R.weapon]?.kind === 'flame') flames(R, muzzle(R));
      stepRig(R, dt);
    }
  }
  Wreck.roster = (list, selfId) => {
    roster = (Array.isArray(list) ? list : []).filter((r) => r && typeof r.id === 'string').slice(0, 8); Wreck.selfId = selfId;
    if (!S) return;
    for (const r of roster) if (r.id !== selfId && !S.remotes.has(r.id)) S.remotes.set(r.id, remotePlayer(r));
    for (const id of [...S.remotes.keys()]) if (!roster.some((r) => r.id === id)) S.remotes.delete(id);
    hudRoom();
  };
  Wreck.remote = (id, m) => {
    if (!S || !m || typeof m !== 'object') return;
    if (m.t === 'rb') return rebuild(true);
    const R = S.remotes.get(id); if (!R) return;
    const L = S.L;
    if (m.t === 's') {
      const x = num(m.x, 0, L.vw), y = num(m.y, -400, L.WH); if (x == null || y == null) return;
      R.tx = x; R.ty = y; R.vx = num(m.vx, -2000, 2000) ?? 0; R.vy = num(m.vy, -2000, 2000) ?? 0; R.aim = num(m.a, -7, 7) ?? 0;
      R.weapon = Number.isInteger(m.w) && m.w >= 0 && m.w < W.length ? m.w : 0; R.face = m.f < 0 ? -1 : 1; R.grounded = !!m.g; R.jet = !!m.j; R.fi = !!m.fi;
      const fl = num(m.fl, -1, 1); if (fl != null && fl >= 0 && R.flip < 0) R.flip = fl;
      if (Math.hypot(R.x - x, R.y - y) > 300) { R.x = x; R.y = y; }   // teleport rather than fly across the map
      R.hp = num(m.hp, 0, MAX_HP) ?? R.hp; R.shield = m.sh ? 1 : 0; if (m.al === 1 && !R.alive) { R.alive = true; R.x = x; R.y = y; } else if (m.al === 0) R.alive = false;
    } else if (m.t === 'die') {
      if (R.alive) die(R, m.by, m.w, false);
      feed(typeof m.by === 'string' ? m.by.slice(0, 64) : '', id, typeof m.w === 'string' ? m.w.slice(0, 12) : '');
    } else if (m.t === 'f' && Array.isArray(m.s)) {
      for (const s of m.s.slice(0, 12)) {
        if (!s || !KINDS.has(s.k) || R.tokens < 1) continue;
        const x = num(s.x, 0, L.vw), y = num(s.y, -400, L.WH), vx = num(s.vx, -4000, 4000), vy = num(s.vy, -4000, 4000); if ([x, y, vx, vy].includes(null)) continue;
        R.tokens--;
        S.shots.push({ k: s.k, owner: id, w: typeof s.w === 'string' ? s.w.slice(0, 12) : undefined, range: num(s.range, 0, 4000) ?? undefined, x, y, vx, vy, dmg: num(s.dmg, 0, 40) ?? 10, pierce: num(s.pierce, 0, 6) ?? 1, carve: num(s.carve, 1, 5) ?? 3, fuse: num(s.fuse, 0, 3) ?? 1, life: num(s.life, 0.1, 5) ?? 1, r: num(s.r, 10, 60) ?? undefined, t: 0, remote: true });
      }
      R.recoil = W[R.weapon]?.kick || 2; R.muzzle = 0.05; sfx('shot', 0.35);
    } else if (m.t === 'r') {
      const x = num(m.x, 0, L.vw), y = num(m.y, -400, L.WH), a = num(m.a, -7, 7); if (x == null || y == null || a == null || R.tokens < 10) return;
      R.tokens -= 10; R.recoil = 9; rail({ x, y, a }, id);
    } else if (m.t === 'd') {
      const x = num(m.x, 0, L.vw), y = num(m.y, -400, L.WH), a = num(m.a, -7, 7); if (x == null || y == null || a == null || R.tokens < 5) return;
      if (S.drones.filter((d) => d.owner === R).length < 3) { R.tokens -= 5; addDrone(R, x, y, a); }
    }
  };

  // ------------------------------------------------------------------ lifecycle
  // the world is the page's width; the view scales it to the window (multiplayer pins the width so every player gets the same level)
  function resize() {
    S.sw = innerWidth; S.sh = innerHeight; S.dpr = Math.min(2, devicePixelRatio || 1);
    S.k = S.sw / S.L.vw; S.vw = S.L.vw; S.vh = Math.ceil(S.sh / S.k);
    S.cv.width = Math.round(S.sw * S.dpr); S.cv.height = Math.round(S.sh * S.dpr);
    S.view.width = S.vw; S.view.height = S.vh; S.vctx = S.view.getContext('2d');
    S.back = backdrop(S.vw, S.vh, S.L.theme || 'city'); if (S.L.art) S.back.view = 1; S.vArea = S.vw * S.vh;
  }
  function build() {
    const L = Wreck.map ? makeMap(Wreck.map, Wreck.width || document.documentElement.clientWidth || innerWidth) : extract(); S.L = L; S.stamp = 1; buildWorld(L);
    S.removed = 0; S.extra = 0; S.sand = 0;
    S.bodies = []; S.shots = []; S.fx = []; S.beams = []; S.drones = []; S.done = false; S.time = 0;
    S.remotes = new Map(); for (const r of roster) if (r.id !== Wreck.selfId) S.remotes.set(r.id, remotePlayer(r));
    S.stats = { letters: 0, elements: 0, explosions: 0, shots: 0, eaten: 0 };
    S.cam = 0; const w = S.p ? S.p.weapon : 0;
    const sp = spawnAt(); S.p = makePlayer(sp[0], sp[1]); S.p.weapon = w;
  }
  function rebuild(fromNet) {
    if (!S) return;
    if (Wreck.net && !Wreck.net.isHost && fromNet !== true) return toast('Only the host can rebuild');
    if (Wreck.net?.isHost && fromNet !== true) net({ t: 'rb' });
    S.hud.root.querySelector('.ov')?.remove(); S.paused = false; build();
  }
  function toast(t) { S.hud.wname.textContent = t; S.hud.wname.style.opacity = '1'; S.wnameT = 1.6; }
  function start() {
    if (Wreck.running) return; Wreck.running = true;
    const cv = document.createElement('canvas'); cv.setAttribute('data-wreck', '');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483646;cursor:none;touch-action:none;display:block;image-rendering:pixelated';
    S = { cv, ctx: cv.getContext('2d'), view: document.createElement('canvas'), in: {}, sticks: {}, frame: 0, trauma: 0, ckx: 0, cky: 0, fireQ: 0, flash: 0, hitstop: 0, muzzle: 0, nadeCd: 0, mx: 300, my: 300, touch: matchMedia('(pointer: coarse)').matches, prevOverflow: document.documentElement.style.overflow, prevScroll: scrollY };
    scrollTo(0, 0); build();
    document.documentElement.appendChild(cv); S.hud = buildHud(); resize();
    document.documentElement.style.overflow = 'hidden';
    bindInput(); setWeapon(S.p.weapon); labels();
    if (Wreck.net) { S.hud.$('.room').style.display = ''; Wreck.roster(roster, Wreck.selfId); }
    let t0 = performance.now();
    const loop = (now) => {
      if (!S) return;
      let dt = Math.min(1 / 30, (now - t0) / 1000); t0 = now; S.frame++;
      if (S.paused) dt = 0;
      S.time += dt;
      if (S.hitstop > 0) { S.hitstop -= dt; dt *= 0.08; }
      if (dt > 0) {
        if (S.touch && S.tAim != null) { S.aimX = S.p.x + Math.cos(S.tAim) * 200; S.aimY = S.p.y - SH + Math.sin(S.tAim) * 200; } else { S.aimX = S.mx; S.aimY = S.my + S.cam; }
        const Pl = S.p; Pl.shield = Math.max(0, Pl.shield - dt); Pl.hurtT = Math.max(0, Pl.hurtT - dt);
        if (Pl.alive) { stepPlayer(dt / 2); stepPlayer(dt / 2); stepWeapon(Pl, dt); } else if ((Pl.respawnT -= dt) <= 0) respawn();
        const P = S.p; P.cd -= dt; S.nadeCd -= dt;
        if (S.in.fire || S.fireQ > 0) fire(); S.fireQ -= dt;
        flameSound(S.in.fire && W[P.weapon].kind === 'flame');
        stepRemotes(dt);
        stepShots(dt); stepBodies(dt); stepFx(dt);
        if (Wreck.net && (S.sendT = (S.sendT || 0) - dt) <= 0) { S.sendT = 1 / 15; net({ t: 's', x: r1(P.x), y: r1(P.y), vx: r1(P.vx), vy: r1(P.vy), a: r3(P.aim), w: P.weapon, f: P.face, fl: r3(P.flip), j: P.jet ? 1 : 0, g: P.grounded ? 1 : 0, fi: S.in.fire && W[P.weapon].kind === 'flame' ? 1 : 0, hp: Math.round(P.hp), al: P.alive ? 1 : 0, sh: P.shield > 0 ? 1 : 0 }); }
        const target = clamp(P.y - S.vh * 0.55, 0, Math.max(0, S.L.WH - S.vh));
        S.cam += (target - S.cam) * (1 - Math.exp(-dt * 6));
      }
      S.trauma = Math.max(0, S.trauma - (1 / 60) * 1.4); S.ckx *= 0.78; S.cky *= 0.78; S.flash *= 0.86; S.muzzle -= 1 / 60; S.p.muzzle = S.muzzle;
      draw(); hudTick(dt);
      S.raf = requestAnimationFrame(loop);
    };
    S.raf = requestAnimationFrame(loop);
  }
  function stop() {
    if (!S) return;
    cancelAnimationFrame(S.raf); flameSound(false); saveXP();
    for (const [t, ev, fn, o] of S.on) t.removeEventListener(ev, fn, o);
    S.cv.remove(); S.hud.host.remove();
    document.documentElement.style.overflow = S.prevOverflow;
    const y = S.prevScroll; S = null; Wreck.running = false; scrollTo(0, y);
    Wreck.onExit?.();
  }
  const thisScript = document.currentScript;
  if (!thisScript || thisScript.dataset.auto !== 'off') { if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true }); else start(); }
})();
