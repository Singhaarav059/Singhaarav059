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
  const COYOTE = 0.09, BUFFER = 0.12, JET = 3000, FUEL = 1.6, PW = 7, PH = 50, SH = 34; // SH: shoulder height
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
  const Wreck = { running: false, start, stop, skin: '#ff5d73', onExit: null, debug: () => S && { ...S.stats, x: Math.round(S.p.x), y: Math.round(S.p.y), bodies: S.bodies.length, fx: S.fx.length, pct: Math.round(progress() * 1000) / 10 }, probe: (x, y) => { if (!S) return null; const h = contentAt(x, y); return h === true ? 'edge' : h ? (h.ch ? 'glyph ' + h.ch : 'box ' + h.el.tagName + '.' + h.el.className + ' ' + Math.round(h.w) + 'x' + Math.round(h.h) + ' fill=' + h.fill + ' under=' + h.under) : solid(x, y) ? 'bg' : 'air'; } };
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
    L.mask.fill(1, Math.floor(SKY / MC) * L.MW);
    L.total = L.MW * (L.MH - Math.floor(SKY / MC));
    L.gh = new Map(); L.bh = new Map();
    const add = (m, o) => { const x0 = Math.floor(o.x / CELL), x1 = Math.floor((o.x + o.w) / CELL), y0 = Math.floor(o.y / CELL), y1 = Math.floor((o.y + o.h) / CELL); for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const k = cy * 4096 + cx; let a = m.get(k); if (!a) m.set(k, (a = [])); a.push(o); } };
    L.glyphs.forEach((g) => add(L.gh, g)); L.boxes.forEach((b) => add(L.bh, b));
    for (let i = 0; i < nT; i++) paintTile(L, i);
  }
  function paintTile(L, i) {
    const { ctx } = L.tiles[i], y0 = i * TILE;
    ctx.setTransform(1, 0, 0, 1, 0, -y0);
    ctx.clearRect(0, y0, L.vw, TILE);
    if (y0 + TILE > SKY) { ctx.fillStyle = L.bg; ctx.fillRect(0, Math.max(SKY, y0), L.vw, TILE); }
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
  function boxAt(x, y, vis) { let r = null; q(S.L.bh, x, y, 0, 0, (b) => { if ((!vis || b.vis) && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h && (!r || b.w * b.h < r.w * r.h)) r = b; }); return r; }
  // projectiles fly over plain page background and stop on content: letters, elements, pictures, rubble
  function contentAt(x, y) {
    const m = solid(x, y); if (!m) return null; if (m === 2 || y >= S.L.WH - 1 || x <= 0 || x >= S.L.vw - 1) return true;
    const g = glyphAt(x, y); if (g) return g;
    const b = boxAt(x, y, true); return b && b.w * b.h < S.vArea * 0.4 ? b : null;
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
    if (g.dead) return; g.dead = true; S.stats.letters++; S.extra += (g.w * g.h) / (MC * MC) * 0.6;
    onTiles(g.y, g.y + g.h, (c) => { c.globalCompositeOperation = 'source-atop'; c.fillStyle = g.under; c.fillRect(g.x - 0.5, g.y, g.w + 1, g.h); });
    if (S.bodies.length >= MAX_BODIES) settleOldest();
    S.bodies.push({ k: 'g', ch: g.ch, font: g.font, color: burnt ? '#3b2a2a' : g.color, x: g.x + g.w / 2, y: g.y + g.h / 2, hw: g.w / 2, hh: g.h / 2 * 0.62, by: baseline(S.L.tiles[0].ctx, g) - (g.y + g.h / 2), vx, vy, a: 0, va: spin ?? rnd(-12, 12), rest: 0 });
    if (Math.random() < 0.2) sfx('tick');
  }
  function detach(b, hx, hy, force) {
    if (b.dead || b.w > S.L.vw * 0.9 || b.w * b.h > 60000) return;
    b.dead = true; S.stats.elements++; S.extra += (b.w * b.h) / (MC * MC) * 0.5;
    const sprite = grab(b.x, b.y, b.w, b.h);
    // everything drawn inside it leaves with it
    q(S.L.gh, b.x, b.y, b.w, b.h, (g) => { if (g.x >= b.x - 1 && g.x + g.w <= b.x + b.w + 1 && g.y >= b.y - 1 && g.y + g.h <= b.y + b.h + 1) g.dead = true; });
    q(S.L.bh, b.x, b.y, b.w, b.h, (c) => { if (c !== b && c.x >= b.x && c.y >= b.y && c.x + c.w <= b.x + b.w && c.y + c.h <= b.y + b.h) c.dead = true; });
    onTiles(b.y, b.y + b.h, (c) => { c.globalCompositeOperation = 'source-atop'; c.fillStyle = b.under; c.fillRect(b.x, b.y, b.w, b.h); });
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
    S.stats.explosions++;
    carve(x, y, r, { shards: Math.round((r / 10) * power), force: 520 * power, power, knockR: 1.35, burn: true });
    for (const b of S.bodies) { const dx = b.x - x, dy = b.y - y, d = Math.hypot(dx, dy) + 1, R = r * 2.4; if (d < R) { const k = 1 - d / R; b.vx += (dx / d) * 900 * k * power; b.vy += (dy / d) * 800 * k * power - 200 * k; b.va += rnd(-12, 12) * k; b.rest = 0; } }
    for (const f of S.fx) if (f.k === 'sand' || f.k === 'bit') { const dx = f.x - x, dy = f.y - y, d = Math.hypot(dx, dy) + 1; if (d < r * 2) { f.vx += (dx / d) * 500; f.vy += (dy / d) * 500 - 100; f.stuck = false; } }
    const P = S.p, dx = P.x - x, dy = P.y - PH / 2 - y, d = Math.hypot(dx, dy);
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
  }
  let loopNode = null;
  function flameSound(on) {
    if (!AC || muted) on = false;
    if (on && !loopNode) { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 650; f.Q.value = 0.5; const g = AC.createGain(); g.gain.value = 0.2; s.connect(f).connect(g).connect(AC.destination); s.start(); loopNode = { s, g }; }
    else if (!on && loopNode) { const n = loopNode; loopNode = null; n.g.gain.setTargetAtTime(0, AC.currentTime, 0.05); setTimeout(() => n.s.stop(), 300); }
  }

  // ------------------------------------------------------------------ the backdrop: an original pixel night city
  function backdrop(vw, vh) {
    const h = vh + 300, cv = document.createElement('canvas'); cv.width = vw; cv.height = h; const c = cv.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#120f2e'); g.addColorStop(0.55, '#2a1c58'); g.addColorStop(0.85, '#4a2a6e'); g.addColorStop(1, '#6b3170'); c.fillStyle = g; c.fillRect(0, 0, vw, h);
    for (let i = 0; i < vw * h / 2600; i++) { c.fillStyle = Math.random() < 0.15 ? '#ffe9a8' : 'rgba(255,255,255,' + rnd(0.3, 0.9) + ')'; const s = Math.random() < 0.1 ? 2 : 1; c.fillRect(rnd(0, vw) | 0, rnd(0, h * 0.7) | 0, s, s); }
    const mx = vw * 0.78 | 0, my = h * 0.16 | 0; c.fillStyle = '#ffe9c4'; for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) if (x * x + y * y <= 256) c.fillRect(mx + x, my + y, 1, 1);
    c.fillStyle = '#e8cfa6'; [[-5, -3, 4], [6, 4, 3], [-2, 8, 2]].forEach(([x, y, r]) => { for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r) c.fillRect(mx + x + xx, my + y + yy, 1, 1); });
    const layers = [['#2c1f55', 0.55, 0.12, '#6f5bd6'], ['#1d1640', 0.72, 0.2, '#ffcf6b'], ['#120d2a', 0.88, 0.28, '#ff9a5c']];
    for (const [col, top, win, wc] of layers) {
      let x = -rnd(0, 30) | 0;
      while (x < vw) {
        const bw = rnd(26, 80) | 0, bh = (h * (1 - top) + rnd(-h * 0.12, h * 0.12)) | 0, by = h - bh;
        c.fillStyle = col; c.fillRect(x, by, bw, bh);
        if (Math.random() < 0.3) c.fillRect(x + (bw / 2 | 0) - 1, by - rnd(8, 26), 2, 26);
        if (Math.random() < 0.25) c.fillRect(x + 4, by - 6, bw - 8, 6);
        c.fillStyle = wc;
        for (let wy = by + 6; wy < h - 4; wy += 7) for (let wx = x + 4; wx < x + bw - 4; wx += 6) if (Math.random() < win) c.fillRect(wx, wy, 2, 3);
        x += bw + (rnd(0, 6) | 0);
      }
    }
    return cv;
  }

  // ------------------------------------------------------------------ player
  function makePlayer(x, y) {
    const scarf = []; for (let i = 0; i < 6; i++) scarf.push({ x, y: y - PH, px: x, py: y - PH });
    return { x, y, vx: 0, vy: 0, grounded: false, face: 1, aim: 0, coyote: 0, buffer: 0, jumps: 0, flip: -1, fuel: FUEL, jet: false, run: 0, land: 0, scarf, recoil: 0, weapon: 0, cd: 0, air: 0, muzzle: 0 };
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
    if (P.jet) { P.vy -= JET * dt; P.fuel -= dt; for (let i = 0; i < 2 && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'fire', x: P.x - P.face * 10, y: P.y - 24, vx: rnd(-30, 30), vy: rnd(160, 300), s: pick([2, 3, 4]), life: rnd(0.12, 0.25), t: 0 }); }
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
    if (P.grounded) { if (!wasG && P.air > 0.3) { P.land = 1; dust(P.x, P.y, 7); sfx('thump'); } P.jumps = 0; P.air = 0; P.flip = -1; } else P.air += dt;
    P.aim = Math.atan2(S.aimY - (P.y - SH), S.aimX - P.x);
    P.face = Math.cos(P.aim) >= 0 ? 1 : -1;
    stepRig(P, dt);
  }
  function stepRig(P, dt) {
    P.land = Math.max(0, P.land - dt * 6);
    P.run += Math.abs(P.vx) * dt * 0.075;
    P.recoil = Math.max(0, P.recoil - dt * 30); P.kr = (P.kr || 0) * Math.exp(-dt * 12);
    P.muzzle -= dt;
    const s = P.scarf; s[0].x = P.x - P.face * 3; s[0].y = P.y - 40;
    for (let i = 1; i < s.length; i++) { const k = s[i], vx = (k.x - k.px) * 0.88, vy = (k.y - k.py) * 0.88; k.px = k.x; k.py = k.y; k.x += vx - P.face * 8 * dt - P.vx * 0.0015; k.y += vy + 400 * dt * dt; }
    for (let it = 0; it < 3; it++) for (let i = 1; i < s.length; i++) { const a = s[i - 1], b = s[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 6) / d; b.x -= dx * f; b.y -= dy * f; }
  }
  function dust(x, y, n) { for (let i = 0; i < n && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'smoke', x: x + rnd(-6, 6), y: y - 2, vx: rnd(-90, 90), vy: rnd(-50, -10), s: rnd(2, 4), life: rnd(0.25, 0.45), t: 0, c: '#9a9fbd' }); }

  // ------------------------------------------------------------------ firing
  const gunLen = (w) => Math.max(...w.px.map((r) => r[0] + r[2]));
  function muzzle(P = S.p) { const w = W[P.weapon], a = P.aim, sx = P.x + Math.cos(a) * 3 * SC, sy = P.y - SH + Math.sin(a) * 3 * SC, l = (gunLen(w) - P.recoil) * SC; return { x: sx + Math.cos(a) * l, y: sy + Math.sin(a) * l, a }; }
  function fire() {
    const P = S.p, w = W[P.weapon];
    if (P.cd > 0) return;
    if (!w.auto && S.fired && !(S.fireQ > 0)) return;
    if (w.kind === 'drone' && S.drones.filter((d) => d.owner === P).length >= 3) return;
    S.fired = true; S.fireQ = 0;
    P.cd = w.cd; S.stats.shots++;
    const m = muzzle(), n0 = S.shots.length;
    P.recoil = Math.min(P.recoil + w.kick, w.kick * 1.6); P.kr = Math.min((P.kr || 0) + w.kr, w.kr * 1.5);
    trauma(w.tr); S.ckx -= Math.cos(m.a) * w.kick * 0.5; S.cky -= Math.sin(m.a) * w.kick * 0.5;
    if (w.push) { P.vx -= Math.cos(m.a) * w.push * (P.grounded ? 0.45 : 1); if (!P.grounded) P.vy -= Math.sin(m.a) * w.push * 0.8; }
    if (w.fl) { S.fx.push({ k: 'light', vx: 0, vy: 0, x: m.x, y: m.y, s: 70 + 40 * w.fl, a: Math.min(0.9, 0.35 * w.fl), life: 0.06, t: 0 }); S.muzzleSize = w.fl; }
    if (w.kind === 'bullet') {
      for (let i = 0; i < w.pellets; i++) { const a = m.a + rnd(-w.spread, w.spread), v = w.speed * rnd(0.85, 1.05); S.shots.push({ k: 'b', x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dmg: w.dmg, pierce: w.pierce, carve: w.carve, life: 1.2, heavy: w.pellets > 1 }); }
      S.muzzle = 0.05; sfx(w.pellets > 1 ? 'heavy' : 'shot');
      if (w.ring) S.fx.push({ k: 'ring', x: m.x, y: m.y, r: 3, max: 22, life: 0.18, t: 0, c: '#c9f6ff' });
      S.fx.push({ k: 'shell', x: P.x, y: P.y - SH, vx: -P.face * rnd(60, 130), vy: rnd(-260, -180), life: 1, t: 0 });
    } else if (w.kind === 'rocket') { S.shots.push({ k: 'r', x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed, life: 4 }); sfx('thump'); S.muzzle = 0.06; }
    else if (w.kind === 'doom') { S.shots.push({ k: 'd', x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed - 80, fuse: 0.5, life: 4 }); sfx('heavy'); S.muzzle = 0.08; S.flash = Math.min(0.3, S.flash + 0.1); }
    else if (w.kind === 'hole') { S.shots.push({ k: 'h', x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed, t: 0, life: 4.2 }); sfx('thump'); }
    else if (w.kind === 'wand') { S.shots.push({ k: 'w', x: m.x, y: m.y, vx: Math.cos(m.a) * w.speed, vy: Math.sin(m.a) * w.speed, life: 2 }); sfx('wand'); }
    else if (w.kind === 'drone') { addDrone(P, m.x, m.y, m.a); net({ t: 'd', x: r1(m.x), y: r1(m.y), a: r3(m.a) }); sfx('beep'); }
    else if (w.kind === 'rail') { rail(m); net({ t: 'r', x: r1(m.x), y: r1(m.y), a: r3(m.a) }); }
    else if (w.kind === 'flame') flames(P, m);
    P.muzzle = S.muzzle;
    if (w.kind !== 'rail' && w.kind !== 'drone' && w.kind !== 'flame') net({ t: 'f', s: S.shots.slice(n0).map(ser) });
  }
  function flames(P, m) { const w = W[5]; for (let i = 0; i < w.pellets && S.fx.length < MAX_FX; i++) { const a = m.a + rnd(-w.spread, w.spread), v = w.speed * rnd(0.7, 1.15); S.fx.push({ k: 'flame', x: m.x, y: m.y, vx: Math.cos(a) * v + P.vx * 0.4, vy: Math.sin(a) * v + P.vy * 0.2, s: pick([2, 3, 3, 4]), life: rnd(0.35, 0.6), t: 0 }); } }
  function addDrone(P, x, y, a) { S.drones.push({ owner: P, x, y, vx: Math.cos(a) * 300, vy: -200, life: 14, cd: 0.5, ph: rnd(0, 6), slot: S.drones.filter((d) => d.owner === P).length % 3 }); }
  function rail(m) {
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
    for (const o of S.bodies) { const t = (o.x - m.x) * dx + (o.y - m.y) * dy; if (t < 0 || t > len) continue; if (Math.hypot(o.x - (m.x + dx * t), o.y - (m.y + dy * t)) < 20) { o.vx += dx * 700; o.vy += dy * 700 - 200; o.rest = 0; } }
    S.beams.push({ x0: m.x, y0: m.y, x1, y1, t: 0 });
    for (let i = 0; i < 26 && S.fx.length < MAX_FX; i++) { const t = Math.random() * len; S.fx.push({ k: 'spark', x: m.x + dx * t, y: m.y + dy * t, vx: rnd(-200, 200), vy: rnd(-260, 80), c: pick(['#c9f6ff', '#57e3ff', '#ffffff']), life: rnd(0.2, 0.5), t: 0 }); }
    S.flash = Math.min(0.4, S.flash + 0.22); S.hitstop = 0.035; sfx('rail');
  }
  function throwGrenade() {
    if (!S || S.paused || S.nadeCd > 0) return; const P = S.p, a = P.aim;
    S.nadeCd = 0.35;
    const n = { k: 'n', x: P.x, y: P.y - SH, vx: Math.cos(a) * 560 + P.vx * 0.4, vy: Math.sin(a) * 560 - 160, fuse: 1.55, life: 5, r: 50 };
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
      const s = S.shots[i]; s.life -= dt; let gone = s.life <= 0;
      if (s.k === 'b') {
        const steps = Math.max(1, Math.ceil(Math.hypot(s.vx, s.vy) * dt / 4));
        for (let k = 0; k < steps && !gone; k++) {
          s.x += s.vx * dt / steps; s.y += s.vy * dt / steps;
          if (s.x < 0 || s.x > L.vw || s.y > L.WH || s.y < S.cam - 400) { gone = true; break; }
          const sp = Math.hypot(s.vx, s.vy), dx = s.vx / sp, dy = s.vy / sp;
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
        for (let k = 0; k < 4 && !gone; k++) { s.x += s.vx * dt / 4; s.y += s.vy * dt / 4; if (s.x < 0 || s.x > L.vw || s.y > L.WH || contentAt(s.x, s.y)) { explode(s.x, s.y, 44, 1.1); gone = true; } }
        if (S.fx.length < MAX_FX) { S.fx.push({ k: 'smoke', x: s.x, y: s.y, vx: rnd(-20, 20), vy: rnd(-30, 10), s: rnd(3, 6), life: rnd(0.4, 0.8), t: 0 }); S.fx.push({ k: 'fire', x: s.x - s.vx * 0.012, y: s.y - s.vy * 0.012, vx: -s.vx * 0.2, vy: -s.vy * 0.2, s: 2, life: 0.12, t: 0 }); }
      } else if (s.k === 'n' || s.k === 'm') {
        s.vy += G * 0.7 * dt; s.fuse -= dt;
        const hit = bounce(s, dt, s.k === 'm' ? 0.3 : 0.45);
        if (hit && Math.abs(s.vy) > 120) sfx('tick');
        if (s.k === 'm' && (hit || glyphAt(s.x, s.y))) s.fuse = Math.min(s.fuse, 0.02);
        if (s.fuse <= 0) { explode(s.x, s.y, s.r || 34, s.k === 'm' ? 0.85 : 1.1); gone = true; }
      } else if (s.k === 'd') {
        s.vy += G * 0.45 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.fuse -= dt;
        if (S.fx.length < MAX_FX) S.fx.push({ k: 'fire', x: s.x, y: s.y, vx: rnd(-30, 30), vy: rnd(-30, 30), s: 3, life: 0.2, t: 0 });
        if (s.fuse <= 0 || contentAt(s.x, s.y)) {
          explode(s.x, s.y, 30, 1, { big: true });
          for (let k = 0; k < 12; k++) S.shots.push({ k: 'm', x: s.x, y: s.y, vx: s.vx * 0.25 + rnd(-460, 460), vy: rnd(-560, -80), fuse: rnd(0.5, 1.3), life: 3, r: 36 });
          gone = true;
        }
      } else if (s.k === 'h') {
        s.t += dt;
        if (s.t < 0.5 && !contentAt(s.x + s.vx * dt, s.y + s.vy * dt)) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - dt * 3.5; s.vy *= 1 - dt * 3.5; if (s.t + dt >= 0.5) sfx('hole'); }
        else blackHole(s, dt);
        if (s.life <= 0) { explode(s.x, s.y, 70, 1.6, { big: true }); gone = true; }
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
        S.shots.push({ k: 'b', x: d.x, y: d.y, vx: Math.cos(a) * 2915, vy: Math.sin(a) * 2915, dmg: 16, pierce: 5, carve: 3, life: 0.6 }); sfx('shot', 0.4);
      }
      if (d.life <= 0) { explode(d.x, d.y, 22, 0.6); S.drones.splice(i, 1); }
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
  function stepBodies(dt) {
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

  // ------------------------------------------------------------------ drawing (1x world, scaled to the screen with crisp pixels)
  function sprite(w) { if (w._spr) return w._spr; const minX = Math.min(...w.px.map((r) => r[0])), minY = Math.min(...w.px.map((r) => r[1])), maxX = Math.max(...w.px.map((r) => r[0] + r[2])), maxY = Math.max(...w.px.map((r) => r[1] + r[3])); const cv = document.createElement('canvas'); cv.width = maxX - minX + 2; cv.height = maxY - minY + 2; const c = cv.getContext('2d'); c.fillStyle = OUT; for (const r of w.px) c.fillRect(r[0] - minX, r[1] - minY, r[2] + 2, r[3] + 2); for (const r of w.px) { c.fillStyle = r[4]; c.fillRect(r[0] - minX + 1, r[1] - minY + 1, r[2], r[3]); } return (w._spr = { cv, ox: minX - 1, oy: minY - 1 }); }
  function draw() {
    const L = S.L, v = S.vctx, cam = Math.round(S.cam);
    v.setTransform(1, 0, 0, 1, 0, 0); v.globalAlpha = 1; v.globalCompositeOperation = 'source-over'; v.imageSmoothingEnabled = false;
    v.drawImage(S.back, 0, -Math.round((cam / Math.max(1, L.WH - S.vh)) * 300));
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
      else if (k === 'fire' || k === 'flame') { const s = Math.max(1, Math.round((f.s || 3) * (1.3 - e * 0.7))); v.fillStyle = e < 0.2 ? '#fffbe3' : e < 0.45 ? '#ffe066' : e < 0.7 ? '#ff9a3d' : e < 0.88 ? '#ff5d4a' : '#6b2a3a'; v.fillRect((f.x - s / 2) | 0, (f.y - s / 2) | 0, s, s); }
      else if (k === 'ember') { v.fillStyle = Math.random() < 0.5 ? '#ffb020' : '#ff5d4a'; v.fillRect(f.x | 0, (f.y - 1) | 0, 2, 2); }
      else if (k === 'smoke') { const s = Math.round(f.s * (0.6 + e)); v.globalAlpha = (1 - e) * 0.5; v.fillStyle = f.c || '#4b4760'; v.fillRect((f.x - s / 2) | 0, (f.y - s / 2) | 0, s, s); v.globalAlpha = 1; }
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
    for (const r of S.remotes.values()) drawPlayer(v, r, r.skin, r.name);
    drawPlayer(v);
    if (!S.touch) { const x = S.aimX | 0, y = S.aimY | 0; v.fillStyle = OUT; v.fillRect(x - 6, y - 1, 13, 3); v.fillRect(x - 1, y - 6, 3, 13); v.fillStyle = '#ffffff'; v.fillRect(x - 5, y, 4, 1); v.fillRect(x + 2, y, 4, 1); v.fillRect(x, y - 5, 1, 4); v.fillRect(x, y + 2, 1, 4); }
    const c = S.ctx, sh = S.trauma * S.trauma * 16, ox = Math.round((rnd(-sh, sh) + S.ckx) * S.k) * S.dpr, oy = Math.round((rnd(-sh, sh) + S.cky) * S.k) * S.dpr;
    c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
    c.fillStyle = '#120f2e'; c.fillRect(0, 0, S.cv.width, S.cv.height);
    c.drawImage(S.view, ox, oy, S.vw * S.k * S.dpr, S.vh * S.k * S.dpr);
    if (S.flash > 0.01) { c.fillStyle = `rgba(255,255,255,${S.flash})`; c.fillRect(0, 0, S.cv.width, S.cv.height); }
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
  function drawPlayer(v, P = S.p, skin = Wreck.skin, name) {
    const f = P.face, w = W[P.weapon] || W[0];
    v.strokeStyle = OUT; v.lineWidth = 8; v.lineCap = 'square'; v.beginPath(); P.scarf.forEach((k, i) => (i ? v.lineTo(k.x, k.y) : v.moveTo(k.x, k.y))); v.stroke();
    v.strokeStyle = '#ffe066'; v.lineWidth = 4; v.stroke();
    // the rig is drawn at half size and scaled up about the feet, so every pixel is a 2x2 block
    v.save(); v.translate(P.x, P.y); v.scale(SC, SC); v.translate(-P.x, -P.y);
    const sq = Math.round(P.land * 3), hipX = P.x, hipY = P.y - 11 + sq, neckY = P.y - 20 + sq, headY = P.y - 25 + sq;
    v.save();
    if (P.flip >= 0) { v.translate(hipX, hipY - 3); v.rotate(-f * P.flip * Math.PI * 2); v.translate(-hipX, -(hipY - 3)); }
    const sp = Math.min(1, Math.abs(P.vx) / RUN), legs = [];
    for (const side of [0, 1]) {
      let fx, fy;
      if (P.grounded) { const ph = P.run + side * Math.PI; fx = hipX + Math.sin(ph) * 7 * sp; fy = P.y - Math.max(0, Math.cos(ph)) * 4 * sp; }
      else { fx = hipX + (side ? 5 : -2) * f; fy = hipY + 7 - (P.flip >= 0 ? 4 : 0); }
      legs.push(ik(hipX, hipY, fx, fy, 6, 6, -f));
    }
    const a = P.aim, ca = Math.cos(a), sa = Math.sin(a), gx = P.x + ca * 3 - ca * P.recoil, gy = neckY + 2 + sa * 3 - sa * P.recoil;
    const shX = P.x, shY = neckY + 2;
    const arm1 = ik(shX, shY, gx, gy, 5, 5, -f), arm2 = w.front ? ik(shX, shY, gx + ca * w.front, gy + sa * w.front, 6, 7, -f) : ik(shX, shY, P.x - f * 2, neckY + 10, 5, 5, f);
    const limb = (pts, col, wd) => { v.strokeStyle = col; v.lineWidth = wd; v.lineCap = 'round'; v.lineJoin = 'round'; v.beginPath(); v.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) v.lineTo(pts[i], pts[i + 1]); v.stroke(); };
    const body = [[hipX, hipY, ...legs[0]], [hipX, hipY, ...legs[1]], [hipX, hipY, P.x + f * 0.5, neckY], [shX, shY, ...arm2]];

    v.fillStyle = OUT; v.fillRect(P.x - f * 4 - 2.5, neckY + 1, 5, 8); v.fillStyle = C.m; v.fillRect(P.x - f * 4 - 1.5, neckY + 2, 3, 6);
    for (const b of body) limb(b, OUT, 4);
    for (const b of body) limb(b, skin, 2);
    const hx = P.x + f * 0.5, hy = headY - 1;
    v.fillStyle = OUT; v.beginPath(); v.arc(hx, hy, 4.6, 0, 7); v.fill(); v.fillStyle = skin; v.beginPath(); v.arc(hx, hy, 3.6, 0, 7); v.fill();
    v.fillStyle = OUT; v.fillRect(Math.round(hx + f * 1.5), Math.round(hy - 1), 1, 2);
    const sp2 = sprite(w); v.save(); v.translate(gx, gy); v.rotate(a - f * (P.kr || 0)); if (f < 0) v.scale(1, -1); v.drawImage(sp2.cv, sp2.ox, sp2.oy);
    if (P.muzzle > 0) { const l = gunLen(w), z = Math.max(0.8, S.muzzleSize || 1); v.fillStyle = '#ffb020'; v.fillRect(l, -3 * z, 9 * z, 6 * z); v.fillStyle = '#ffe066'; v.fillRect(l, -2 * z, 7 * z, 4 * z); v.fillStyle = '#ffffff'; v.fillRect(l, -1 * z, 4 * z, 2 * z); v.fillStyle = '#ffe066'; v.fillRect(l + 9 * z, -0.5 * z, 4 * z, 1 * z); }
    v.restore();
    limb([shX, shY, ...arm1], OUT, 4); limb([shX, shY, ...arm1], skin, 2);
    v.restore(); v.restore();
    if (name) { v.font = '10px Silkscreen, ui-monospace, monospace'; v.textAlign = 'center'; v.textBaseline = 'alphabetic'; v.lineWidth = 3; v.strokeStyle = OUT; v.strokeText(name, P.x, P.y - 66); v.fillStyle = skin; v.fillText(name, P.x, P.y - 66); v.textAlign = 'left'; }
  }

  // ------------------------------------------------------------------ HUD in a shadow root, pixel style
  const CSS = `
  :host{all:initial}
  *{box-sizing:border-box;font-family:Silkscreen,"Press Start 2P",ui-monospace,Menlo,monospace}
  .pn{background:#1c1d2b;color:#e9eaf5;border:2px solid #0b0c14;box-shadow:inset 0 0 0 2px #34364d,0 4px 0 rgba(0,0,0,.35);border-radius:4px}
  .top{position:fixed;left:14px;right:14px;top:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none}
  .meter{width:250px;padding:9px 10px;display:flex;align-items:center;gap:10px;font-size:14px}
  .bar{flex:1;height:12px;background:#0b0c14;border:2px solid #0b0c14;position:relative;overflow:hidden}
  .bar i{position:absolute;inset:0 auto 0 0;width:0;background:repeating-linear-gradient(90deg,#ff5d73 0 6px,#ffb020 6px 12px)}
  .btns{display:flex;gap:6px;pointer-events:auto}
  button{font:inherit;font-size:12px;color:#e9eaf5;background:#262840;border:2px solid #0b0c14;box-shadow:inset 0 -3px 0 #15162a,inset 0 0 0 2px #3c3f60;border-radius:4px;padding:7px 10px;cursor:pointer}
  button:hover{background:#30335a}
  button:active{transform:translateY(1px);box-shadow:inset 0 0 0 2px #3c3f60}
  .wbar{position:fixed;left:50%;bottom:12px;transform:translateX(-50%);display:flex;gap:4px;padding:5px;pointer-events:auto;max-width:calc(100vw - 16px);overflow-x:auto}
  .slot{position:relative;width:64px;height:46px;background:#262840;border:2px solid #0b0c14;box-shadow:inset 0 0 0 2px #3c3f60;display:grid;place-items:center;cursor:pointer;flex:none;border-radius:3px}
  .slot.on{background:#3a3d6a;box-shadow:inset 0 0 0 2px #ffe066}
  .slot canvas{width:56px;height:28px;image-rendering:pixelated}
  .slot span{position:absolute;left:4px;top:1px;font-size:9px;color:#a4a8c8}
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
      <div class="pn wbar"></div>
      <div class="pn help"><b>A</b><b>D</b>run <b>W</b>jump · tap to flip · hold to fly<br><b>S</b>drop <b>Click</b>shoot <b>Right</b>grenade <b>1-0</b>weapons<br><b>Esc</b>pause</div>
      <div class="stick l"><i></i></div><div class="stick r"><i></i></div>
      <div class="tb"><button class="tj">▲</button><button class="tn">✹</button><button class="tw">⇄</button></div>`;
    const $ = (s) => root.querySelector(s), bar = $('.wbar');
    const icon = (w) => { const c = document.createElement('canvas'); c.width = 56; c.height = 28; const g = c.getContext('2d'), s = sprite(w), sc = Math.max(1, Math.floor(Math.min(52 / s.cv.width, 24 / s.cv.height))); g.imageSmoothingEnabled = false; g.drawImage(s.cv, Math.round((56 - s.cv.width * sc) / 2), Math.round((28 - s.cv.height * sc) / 2), s.cv.width * sc, s.cv.height * sc); return c; };
    [...W, NADE].forEach((w, i) => {
      const d = document.createElement('div'); d.className = 'slot'; d.title = w.name; d.innerHTML = `<span>${i < 10 ? (i + 1) % 10 : 'RMB'}</span>`; d.appendChild(icon(w));
      d.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (i < 10) setWeapon(i); else throwGrenade(); }); bar.appendChild(d);
    });
    $('.snd').onclick = toggleMute; $('.rst').onclick = rebuild; $('.ext').onclick = stop;
    root.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));
    document.documentElement.appendChild(host);
    return { host, root, $, pct: $('.pct'), bar: $('.bar i'), wname: $('.wname'), slots: [...bar.children], help: $('.help') };
  }
  function setWeapon(i) {
    const P = S.p; P.weapon = i; P.cd = Math.min(P.cd, 0.12);
    S.hud.slots.forEach((s, k) => s.classList.toggle('on', k === i));
    S.hud.wname.textContent = W[i].name; S.hud.wname.style.opacity = '1'; S.wnameT = 1.4; flameSound(false);
  }
  function labels() { const c = matchMedia('(pointer: coarse)').matches; S.hud.$('.snd').textContent = c ? (muted ? 'x' : '♪') : muted ? 'Sound off' : 'Sound on'; S.hud.$('.rst').textContent = c ? '↻' : 'Rebuild'; S.hud.$('.ext').textContent = c ? '✕' : 'Exit'; }
  function toggleMute() { muted = !muted; try { localStorage.setItem('wreck-muted', muted ? '1' : '0'); } catch {} labels(); if (muted) flameSound(false); }
  // mostly letters knocked off (what you see go), plus elements broken and page carved away
  function progress() { const L = S.L; return clamp(0.7 * S.stats.letters / Math.max(1, L.glyphs.length) + 0.15 * S.stats.elements / Math.max(1, L.boxes.length * 0.5) + 0.15 * S.removed / (L.total * 0.3), 0, 1); }
  function hudTick(dt) {
    const p = progress();
    if ((S.frame & 3) === 0) { S.hud.pct.textContent = Math.floor(p * 100) + '%'; S.hud.bar.style.width = (p * 100).toFixed(1) + '%'; }
    if (S.wnameT > 0 && (S.wnameT -= dt) <= 0) S.hud.wname.style.opacity = '0';
    if (S.time > 12 || S.stats.shots > 30) S.hud.help.style.opacity = '0';
    if (!S.done && p >= 0.7) { S.done = true; overlay('done'); }
  }
  function overlay(kind) {
    S.hud.root.querySelector('.ov')?.remove();
    const d = document.createElement('div'); d.className = 'ov';
    if (kind === 'pause') d.innerHTML = `<div class="pn"><h2>Paused</h2><p>${location.hostname || 'This page'} is waiting.</p><div class="row"><button class="a">Resume</button><button class="b">Rebuild</button><button class="c">Exit</button></div></div>`;
    else { const t = Math.round(S.time); const st = [['Letters knocked off', S.stats.letters], ['Elements broken', S.stats.elements], ['Explosions', S.stats.explosions], ['Eaten by black holes', S.stats.eaten], ['Shots fired', S.stats.shots], ['Time', `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`]]; d.innerHTML = `<div class="pn"><h2>Website destroyed</h2><p>${location.hostname || 'This page'} never stood a chance.</p><div class="st">${st.map(([k, v]) => `<span>${k}</span><span class="v">${typeof v === 'number' ? v.toLocaleString() : v}</span>`).join('')}</div><div class="row"><button class="a">Keep going</button><button class="b go">Rebuild</button><button class="c">Exit</button></div></div>`; }
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

  // ------------------------------------------------------------------ multiplayer
  let roster = [];
  const r1 = (v) => Math.round(v * 10) / 10, r3 = (v) => Math.round(v * 1000) / 1000;
  const num = (v, a, b) => typeof v === 'number' && isFinite(v) ? clamp(v, a, b) : null;
  const net = (m) => { try { Wreck.net?.send(m); } catch {} };
  const KINDS = new Set(['b', 'r', 'n', 'm', 'd', 'h', 'w']);
  const ser = (s) => ({ k: s.k, x: r1(s.x), y: r1(s.y), vx: r1(s.vx), vy: r1(s.vy), dmg: s.dmg, pierce: s.pierce, carve: s.carve, fuse: s.fuse, life: s.life, r: s.r });
  const SKIN_RE = /^#[0-9a-f]{6}$/i;
  function remotePlayer(r) { const p = makePlayer(Math.round(S.L.vw * (0.2 + Math.random() * 0.6)), SKY - 60); p.id = r.id; p.name = String(r.name || 'Player').slice(0, 16); p.skin = SKIN_RE.test(r.skin) ? r.skin : '#4f8cff'; p.tx = p.x; p.ty = p.y; p.tokens = 40; return p; }
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
    S.hud.$('.room').textContent = roster.length > 1 ? `${roster.length} players` : 'Waiting for players';
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
    } else if (m.t === 'f' && Array.isArray(m.s)) {
      for (const s of m.s.slice(0, 12)) {
        if (!s || !KINDS.has(s.k) || R.tokens < 1) continue;
        const x = num(s.x, 0, L.vw), y = num(s.y, -400, L.WH), vx = num(s.vx, -4000, 4000), vy = num(s.vy, -4000, 4000); if ([x, y, vx, vy].includes(null)) continue;
        R.tokens--;
        S.shots.push({ k: s.k, x, y, vx, vy, dmg: num(s.dmg, 0, 40) ?? 10, pierce: num(s.pierce, 0, 6) ?? 1, carve: num(s.carve, 1, 5) ?? 3, fuse: num(s.fuse, 0, 3) ?? 1, life: num(s.life, 0.1, 5) ?? 1, r: num(s.r, 10, 60) ?? undefined, t: 0, remote: true });
      }
      R.recoil = W[R.weapon]?.kick || 2; R.muzzle = 0.05; sfx('shot', 0.35);
    } else if (m.t === 'r') {
      const x = num(m.x, 0, L.vw), y = num(m.y, -400, L.WH), a = num(m.a, -7, 7); if (x == null || y == null || a == null || R.tokens < 10) return;
      R.tokens -= 10; R.recoil = 9; rail({ x, y, a });
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
    S.back = backdrop(S.vw, S.vh); S.vArea = S.vw * S.vh;
  }
  function build() {
    const L = extract(); S.L = L; S.stamp = 1; buildWorld(L);
    S.removed = 0; S.extra = 0; S.sand = 0;
    S.bodies = []; S.shots = []; S.fx = []; S.beams = []; S.drones = []; S.done = false; S.time = 0;
    S.remotes = new Map(); for (const r of roster) if (r.id !== Wreck.selfId) S.remotes.set(r.id, remotePlayer(r));
    S.stats = { letters: 0, elements: 0, explosions: 0, shots: 0, eaten: 0 };
    S.cam = 0; const w = S.p ? S.p.weapon : 0;
    S.p = makePlayer(Math.round(Math.min(L.vw * 0.3, 260)), SKY - 60); S.p.weapon = w;
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
        stepPlayer(dt / 2); stepPlayer(dt / 2);
        const P = S.p; P.cd -= dt; S.nadeCd -= dt;
        if (S.in.fire || S.fireQ > 0) fire(); S.fireQ -= dt;
        flameSound(S.in.fire && W[P.weapon].kind === 'flame');
        stepRemotes(dt);
        stepShots(dt); stepBodies(dt); stepFx(dt);
        if (Wreck.net && (S.sendT = (S.sendT || 0) - dt) <= 0) { S.sendT = 1 / 15; net({ t: 's', x: r1(P.x), y: r1(P.y), vx: r1(P.vx), vy: r1(P.vy), a: r3(P.aim), w: P.weapon, f: P.face, fl: r3(P.flip), j: P.jet ? 1 : 0, g: P.grounded ? 1 : 0, fi: S.in.fire && W[P.weapon].kind === 'flame' ? 1 : 0 }); }
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
    cancelAnimationFrame(S.raf); flameSound(false);
    for (const [t, ev, fn, o] of S.on) t.removeEventListener(ev, fn, o);
    S.cv.remove(); S.hud.host.remove();
    document.documentElement.style.overflow = S.prevOverflow;
    const y = S.prevScroll; S = null; Wreck.running = false; scrollTo(0, y);
    Wreck.onExit?.();
  }
  const me = document.currentScript;
  if (!me || me.dataset.auto !== 'off') { if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true }); else start(); }
})();
