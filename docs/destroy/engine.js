/*!
 * Wreck: turn the page you are on into a level and destroy it with a stickman.
 * Original engine by Aarav Singh. Load it on any page (bookmarklet) or call Wreck.start().
 */
(() => {
  'use strict';
  if (window.Wreck) { if (!window.Wreck.running) window.Wreck.start(); return; }

  // ---------------------------------------------------------------- constants
  const TILE = 512, CELL = 64, MAX_GLYPHS = 7000, MAX_BOXES = 2600, MAX_BODIES = 1700, MAX_FX = 2600, MAX_DEPTH = 16000;
  const GRAV = 2300, FALL_GRAV = 3300, RUN = 340, ACC_G = 2800, ACC_A = 1500, JUMP_V = 780, JUMP2_V = 680, MAX_FALL = 1700;
  const COYOTE = 0.09, BUFFER = 0.12, JET_THRUST = 3900, JET_FUEL = 1.5, H = 52;
  const INK = '#15172a';

  // ---------------------------------------------------------------- weapons
  // Shapes are [x, y, w, h, colour] rectangles drawn with the rear hand at 0,0 pointing along +x.
  const W = [
    { id: 'pistol', name: 'Pistol', auto: false, cd: 0.15, kind: 'bullet', dmg: 22, pellets: 1, spread: 0.015, speed: 2700, pierce: 2, kick: 3, shake: 1.2, push: 0, front: 0,
      shape: [[0, -4, 13, 5, '#23263a'], [1, 1, 4, 7, '#23263a'], [13, -3, 4, 3, '#4a4f6e'], [3, -5, 7, 1, '#4f5bff']] },
    { id: 'smg', name: 'SMG', auto: true, cd: 0.065, kind: 'bullet', dmg: 11, pellets: 1, spread: 0.07, speed: 2600, pierce: 1, kick: 2, shake: 0.8, push: 0, front: 13,
      shape: [[-9, -2, 7, 4, '#3a3f5c'], [-3, -4, 20, 7, '#23263a'], [6, 3, 4, 9, '#23263a'], [17, -2, 7, 3, '#4a4f6e'], [0, -5, 10, 1, '#18b37e']] },
    { id: 'shotgun', name: 'Shotgun', auto: false, cd: 0.62, kind: 'bullet', dmg: 15, pellets: 9, spread: 0.24, speed: 2300, pierce: 1, kick: 9, shake: 4, push: 180, front: 16,
      shape: [[-12, -2, 11, 6, '#3a3f5c'], [-1, -4, 30, 6, '#23263a'], [12, 2, 10, 4, '#4a4f6e'], [27, -4, 3, 3, '#ff5d73']] },
    { id: 'minigun', name: 'Minigun', auto: true, cd: 0.032, kind: 'bullet', dmg: 9, pellets: 1, spread: 0.1, speed: 2800, pierce: 1, kick: 1.6, shake: 1.1, push: 60, front: 14, spin: 0.45,
      shape: [[-8, -6, 18, 12, '#23263a'], [10, -5, 24, 2, '#4a4f6e'], [10, -1, 24, 2, '#4a4f6e'], [10, 3, 24, 2, '#4a4f6e'], [32, -6, 3, 12, '#3a3f5c'], [-4, -8, 10, 2, '#ffb020']] },
    { id: 'rocket', name: 'Rocket', auto: false, cd: 0.8, kind: 'rocket', dmg: 0, pellets: 1, spread: 0, speed: 950, pierce: 0, kick: 8, shake: 2, push: 120, front: 14,
      shape: [[-16, -5, 42, 10, '#2f6b55'], [24, -7, 5, 14, '#23263a'], [-18, -6, 4, 12, '#23263a'], [1, 5, 4, 7, '#23263a'], [6, -7, 8, 2, '#ffb020']] },
    { id: 'grenade', name: 'Grenade Launcher', auto: false, cd: 0.45, kind: 'grenade', dmg: 0, pellets: 1, spread: 0.02, speed: 1050, pierce: 0, kick: 5, shake: 1.2, push: 40, front: 14,
      shape: [[-8, -4, 14, 9, '#23263a'], [4, -6, 11, 12, '#3a3f5c'], [15, -3, 12, 6, '#23263a'], [8, -7, 4, 1, '#ff5d73']] },
    { id: 'rail', name: 'Railgun', auto: false, cd: 1.05, kind: 'rail', dmg: 260, pellets: 1, spread: 0, speed: 0, pierce: 999, kick: 11, shake: 5, push: 260, front: 18,
      shape: [[-12, -3, 44, 6, '#2b2f4a'], [0, -5, 3, 10, '#4f5bff'], [7, -5, 3, 10, '#4f5bff'], [14, -5, 3, 10, '#4f5bff'], [21, -5, 3, 10, '#4f5bff'], [32, -2, 6, 4, '#8b96ff']] },
    { id: 'flame', name: 'Flamethrower', auto: true, cd: 0.016, kind: 'flame', dmg: 0, pellets: 3, spread: 0.13, speed: 760, pierce: 0, kick: 0.4, shake: 0.15, push: 0, front: 14,
      shape: [[-12, 2, 10, 9, '#ff5d73'], [-4, -4, 26, 6, '#23263a'], [22, -5, 4, 8, '#4a4f6e'], [-10, 0, 6, 2, '#ffb020']] },
    { id: 'cluster', name: 'Cluster Bomb', auto: false, cd: 1.6, kind: 'cluster', dmg: 0, pellets: 1, spread: 0, speed: 880, pierce: 0, kick: 10, shake: 3, push: 220, front: 14,
      shape: [[-14, -7, 36, 13, '#ffb020'], [22, -8, 4, 15, '#23263a'], [-16, -5, 3, 9, '#23263a'], [2, 6, 4, 7, '#23263a'], [-6, -9, 20, 2, '#15172a']] },
    { id: 'hole', name: 'Black Hole', auto: false, cd: 2.4, kind: 'hole', dmg: 0, pellets: 1, spread: 0, speed: 620, pierce: 0, kick: 6, shake: 2, push: 90, front: 14,
      shape: [[-8, -4, 24, 9, '#8b5cf6'], [16, -6, 10, 12, '#15172a'], [18, -4, 6, 8, '#b493ff'], [0, 5, 4, 7, '#23263a']] },
  ];

  // ---------------------------------------------------------------- state
  let S = null;            // the running game
  const Wreck = { running: false, start, stop, skin: '#ff5d73', onExit: null };
  window.Wreck = Wreck;

  // ---------------------------------------------------------------- helpers
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const alphaOf = (c) => {
    if (!c || c === 'transparent') return 0;
    const m = c.match(/\(([^)]+)\)/); if (!m) return 1;
    const slash = m[1].split('/');
    if (slash.length > 1) return parseFloat(slash[1]);
    const p = m[1].split(/[\s,]+/).filter(Boolean);
    return c.startsWith('rgba') && p.length > 3 ? parseFloat(p[3]) : 1;
  };
  const darken = (c, k) => { const m = c.match(/rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/); return m ? `rgb(${m[1] * k | 0},${m[2] * k | 0},${m[3] * k | 0})` : '#2b2f4a'; };
  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); if (r > 0.5) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }

  // ---------------------------------------------------------------- level extraction
  function extract() {
    const sx = scrollX, sy = scrollY, vw = document.documentElement.clientWidth || innerWidth;
    const docH = Math.min(MAX_DEPTH, Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, innerHeight));
    const glyphs = [], boxes = [];
    let bg = getComputedStyle(document.body).backgroundColor;
    if (alphaOf(bg) < 0.05) bg = getComputedStyle(document.documentElement).backgroundColor;
    if (alphaOf(bg) < 0.05) bg = '#ffffff';
    const vArea = vw * innerHeight;

    // boxes: anything with a visible background, border or picture
    const els = document.body.querySelectorAll('*');
    for (let n = 0; n < els.length && boxes.length < MAX_BOXES; n++) {
      const el = els[n];
      if (el.closest('[data-wreck]')) continue;
      const tag = el.tagName;
      if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT' || tag === 'TEMPLATE' || tag === 'HEAD') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 3 || r.height < 3 || r.bottom + sy < 0 || r.top + sy > docH || r.right < 0 || r.left > vw) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0' || cs.display === 'contents') continue;
      const x = r.left + sx, y = r.top + sy, w = r.width, h = r.height;
      let fill = null, grad = null, img = null, stroke = null, sw = 0;
      if (alphaOf(cs.backgroundColor) > 0.04) fill = cs.backgroundColor;
      const bi = cs.backgroundImage;
      if (bi && bi !== 'none') {
        const u = bi.match(/url\(["']?([^"')]+)["']?\)/);
        if (u) img = loadImg(u[1]);
        else { const cols = bi.match(/(rgba?\([^)]*\)|oklch\([^)]*\)|color\([^)]*\)|#[0-9a-f]{3,8}\b)/gi); if (cols && cols.length) grad = cols.slice(0, 4); }
      }
      if (tag === 'IMG' && el.complete && el.naturalWidth) img = el;
      else if (tag === 'CANVAS' || tag === 'VIDEO') img = el;
      else if (tag === 'svg' || tag === 'SVG') { if (el.parentElement?.closest('svg')) continue; img = svgImg(el, cs.color); }
      const bw = parseFloat(cs.borderTopWidth) || 0;
      if (bw > 0.4 && alphaOf(cs.borderTopColor) > 0.08 && cs.borderTopStyle !== 'none') { stroke = cs.borderTopColor; sw = bw; }
      if (!fill && !grad && !img && !stroke) continue;
      // page-sized containers are the backdrop, not blocks
      if (w >= vw * 0.97 && h >= docH * 0.75 && !img) { if (fill) bg = fill; continue; }
      let rad = cs.borderTopLeftRadius; rad = rad.endsWith('%') ? (parseFloat(rad) / 100) * Math.min(w, h) : parseFloat(rad) || 0;
      const area = w * h, hp = Math.min(1100, 20 + Math.sqrt(area) * 2.2);
      boxes.push({ x, y, w, h, r: rad, fill, grad, img, stroke, sw, hp, max: hp, big: area > vArea * 0.28, holes: [], dead: false, weight: clamp(area / 500, 1, 40), tag });
    }

    // glyphs: every visible character, measured where the browser laid it out
    const range = document.createRange();
    const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (t) => (t.nodeValue.trim() ? 1 : 2) });
    let t, stop = false;
    while (!stop && (t = tw.nextNode())) {
      const el = t.parentElement;
      if (!el || el.closest('[data-wreck],script,style,noscript,textarea,select,option')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.opacity === '0') continue;
      const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const color = alphaOf(cs.color) > 0.05 ? cs.color : INK, tt = cs.textTransform, s = t.nodeValue;
      let prevSpace = true;
      for (let i = 0; i < s.length; i++) {
        const cp = s.codePointAt(i), len = cp > 0xffff ? 2 : 1;
        let ch = s.substr(i, len);
        if (/\s/.test(ch)) { prevSpace = true; continue; }
        range.setStart(t, i); range.setEnd(t, i + len);
        i += len - 1;
        const r = range.getBoundingClientRect();
        if (r.width < 0.8 || r.height < 1 || r.right < 0 || r.left > vw) { prevSpace = false; continue; }
        const y = r.top + sy;
        if (y > docH) { stop = true; break; }
        if (tt === 'uppercase' || (tt === 'capitalize' && prevSpace)) ch = ch.toUpperCase(); else if (tt === 'lowercase') ch = ch.toLowerCase();
        prevSpace = false;
        glyphs.push({ ch, x: r.left + sx, y, w: r.width, h: r.height, font, color, heat: 0, dead: false });
        if (glyphs.length >= MAX_GLYPHS) { stop = true; break; }
      }
    }
    return { glyphs, boxes, bg, vw, docH };
  }

  const imgCache = new Map();
  function loadImg(src) {
    if (imgCache.has(src)) return imgCache.get(src);
    const im = new Image(); im.decoding = 'async'; im.src = src; im.onload = () => S && invalidateAll(); imgCache.set(src, im); return im;
  }
  function svgImg(svg, color) {
    try {
      const c = svg.cloneNode(true); const r = svg.getBoundingClientRect();
      c.setAttribute('width', r.width); c.setAttribute('height', r.height);
      if (!c.getAttribute('xmlns')) c.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      c.style.color = color;
      const im = new Image(); im.onload = () => S && invalidateAll();
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(c));
      return im;
    } catch { return null; }
  }

  // ---------------------------------------------------------------- spatial hash for the static world
  function buildHash(L) {
    const map = new Map();
    const add = (o, x, y, w, h) => {
      const x0 = Math.floor(x / CELL), x1 = Math.floor((x + w) / CELL), y0 = Math.floor(y / CELL), y1 = Math.floor((y + h) / CELL);
      for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) { const k = cy * 4096 + cx; let a = map.get(k); if (!a) map.set(k, (a = [])); a.push(o); }
    };
    L.glyphs.forEach((g) => add(g, g.x, g.y, g.w, g.h));
    L.boxes.forEach((b) => { if (!b.big) add(b, b.x, b.y, b.w, b.h); });
    L.hash = map;
    // tiles index (draw order kept: boxes in DOM order, then text)
    L.tiles = [];
    const ti = (y) => Math.floor(y / TILE);
    const tile = (i) => (L.tiles[i] ||= { boxes: [], glyphs: [] });
    L.boxes.forEach((b) => { for (let i = Math.max(0, ti(b.y)); i <= ti(b.y + b.h); i++) tile(i).boxes.push(b); });
    L.glyphs.forEach((g) => { for (let i = Math.max(0, ti(g.y)); i <= ti(g.y + g.h); i++) tile(i).glyphs.push(g); });
    // bigs listed separately for explosions
    L.bigs = L.boxes.filter((b) => b.big);
  }
  let stamp = 1;
  function query(x, y, w, h, fn) {
    const m = S.L.hash, s = ++stamp;
    const x0 = Math.floor(x / CELL), x1 = Math.floor((x + w) / CELL), y0 = Math.floor(y / CELL), y1 = Math.floor((y + h) / CELL);
    for (let cy = y0; cy <= y1; cy++) for (let cx = x0; cx <= x1; cx++) {
      const a = m.get(cy * 4096 + cx); if (!a) continue;
      for (let i = 0; i < a.length; i++) { const o = a[i]; if (o.dead || o._s === s) continue; o._s = s; if (fn(o) === false) return; }
    }
  }
  const pointHit = (px, py) => { let hit = null; query(px, py, 0, 0, (o) => { if (px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h) { hit = o; return false; } }); return hit; };

  // ---------------------------------------------------------------- tile cache (static world drawn once, redrawn when damaged)
  const fontMetrics = new Map();
  function baseline(ctx, g) {
    let m = fontMetrics.get(g.font);
    if (!m) { ctx.font = g.font; const t = ctx.measureText('Hg'); m = { a: t.fontBoundingBoxAscent || t.actualBoundingBoxAscent || 10, d: t.fontBoundingBoxDescent || 3 }; fontMetrics.set(g.font, m); }
    return g.y + (g.h - (m.a + m.d)) / 2 + m.a;
  }
  function paintBox(ctx, b) {
    rr(ctx, b.x, b.y, b.w, b.h, b.r);
    if (b.fill) { ctx.fillStyle = b.fill; ctx.fill(); }
    if (b.grad) { const g = ctx.createLinearGradient(b.x, b.y, b.x + b.w, b.y + b.h); b.grad.forEach((c, i) => { try { g.addColorStop(b.grad.length > 1 ? i / (b.grad.length - 1) : 0, c); } catch {} }); ctx.fillStyle = g; ctx.fill(); }
    if (b.img && (b.img.complete === undefined || b.img.complete) && (b.img.naturalWidth || b.img.videoWidth || b.img.width)) {
      ctx.save(); ctx.clip(); try { ctx.drawImage(b.img, b.x, b.y, b.w, b.h); } catch {} ctx.restore();
    }
    if (b.stroke) { ctx.strokeStyle = b.stroke; ctx.lineWidth = b.sw; ctx.stroke(); }
    if (b.holes.length || b.hp < b.max) {
      ctx.save(); rr(ctx, b.x, b.y, b.w, b.h, b.r); ctx.clip();
      const dmg = 1 - b.hp / b.max;
      if (dmg > 0.35) { // cracks
        ctx.strokeStyle = 'rgba(21,23,42,.35)'; ctx.lineWidth = 1;
        const seed = (b.x * 13 + b.y * 7) | 0; ctx.beginPath();
        for (let k = 0; k < Math.floor(dmg * 7); k++) { let px = b.x + ((seed * (k + 3)) % 97) / 97 * b.w, py = b.y + ((seed * (k + 7)) % 89) / 89 * b.h; ctx.moveTo(px, py); for (let j = 0; j < 4; j++) { px += Math.sin(seed + k * 9 + j) * 14; py += Math.cos(seed * 3 + k + j * 5) * 14; ctx.lineTo(px, py); } }
        ctx.stroke();
      }
      for (const h of b.holes) {
        if (h.r > 5) { // scorch: soft burn with a ragged dark core
          const g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r * 1.8);
          g.addColorStop(0, 'rgba(21,23,42,.42)'); g.addColorStop(0.45, 'rgba(43,47,74,.16)'); g.addColorStop(1, 'rgba(43,47,74,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, h.r * 1.8, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(21,23,42,.5)'; ctx.beginPath();
          for (let k = 0; k < 9; k++) { const a = (k / 9) * Math.PI * 2, rr2 = h.r * (0.35 + 0.25 * Math.abs(Math.sin(h.x * 0.7 + k * 2.3))); ctx.lineTo(h.x + Math.cos(a) * rr2, h.y + Math.sin(a) * rr2); }
          ctx.fill();
        } else { // bullet hole
          ctx.fillStyle = 'rgba(21,23,42,.7)'; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x, h.y, h.r + 1.2, 0, 7); ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  function paintGlyph(ctx, g, y) {
    if (ctx.font !== g.font) ctx.font = g.font;
    ctx.fillStyle = g.heat > 0 ? mixHeat(g.color, g.heat) : g.color;
    ctx.fillText(g.ch, g.x, y);
  }
  const mixHeat = (c, h) => (h > 0.6 ? '#2b2f4a' : h > 0.25 ? '#ff7a3d' : c);
  function drawTile(i) {
    const L = S.L; let t = S.tiles.get(i);
    if (!t) { t = { cv: document.createElement('canvas'), dirty: true, used: 0 }; t.cv.width = Math.ceil(L.vw * S.dpr); t.cv.height = TILE * S.dpr; S.tiles.set(i, t); }
    t.used = S.frame;
    if (!t.dirty) return t;
    const ctx = t.cv.getContext('2d');
    ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, -i * TILE * S.dpr);
    ctx.fillStyle = L.bg; ctx.fillRect(0, i * TILE, L.vw, TILE);
    const d = L.tiles[i];
    if (d) {
      for (const b of d.boxes) if (!b.dead) paintBox(ctx, b);
      ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
      for (const g of d.glyphs) if (!g.dead) paintGlyph(ctx, g, g.by ??= baseline(ctx, g));
    }
    t.dirty = false;
    // keep the cache small
    if (S.tiles.size > 7) { let old = null; for (const [k, v] of S.tiles) if (k !== i && (!old || v.used < old[1].used)) old = [k, v]; if (old) S.tiles.delete(old[0]); }
    return t;
  }
  function invalidate(y0, y1) { for (let i = Math.floor(y0 / TILE); i <= Math.floor(y1 / TILE); i++) { const t = S.tiles.get(i); if (t) t.dirty = true; } }
  function invalidateAll() { if (S) for (const t of S.tiles.values()) t.dirty = true; }

  // ---------------------------------------------------------------- destruction
  function popGlyph(g, vx, vy, burnt) {
    if (g.dead) return; g.dead = true; S.stats.letters++; S.progress += 1;
    invalidate(g.y, g.y + g.h);
    if (S.bodies.length >= MAX_BODIES) recycleBody();
    S.bodies.push({ k: 'g', ch: g.ch, font: g.font, color: burnt ? '#2b2f4a' : g.color, x: g.x + g.w / 2, y: g.y + g.h / 2, by: (g.by ?? g.y + g.h * 0.8) - (g.y + g.h / 2), ox: -g.w / 2, w: g.w, h: g.h,
      vx: vx + rnd(-60, 60), vy: vy + rnd(-80, 20), a: 0, va: rnd(-14, 14), r: Math.max(2, Math.min(g.w, g.h) / 2), sleep: 0, life: 1 });
    if (Math.random() < 0.25) sfx('tick');
  }
  function damageBox(b, dmg, hx, hy, hole) {
    if (b.dead) return;
    b.hp -= dmg;
    if (hole && b.holes.length < 40) b.holes.push({ x: hx, y: hy, r: hole });
    if (b.hp <= 0) shatter(b, hx, hy); else invalidate(b.y, b.y + b.h);
  }
  function shatter(b, hx, hy) {
    b.dead = true; S.stats.elements++; S.progress += b.weight; invalidate(b.y, b.y + b.h);
    // pieces about 36px across, at most ~70 per element, so wide bars break into rubble rather than slabs
    let cols = clamp(Math.round(b.w / 36), 1, 16), rows = clamp(Math.round(b.h / 36), 1, 10);
    while (cols * rows > 70) { if (cols >= rows) cols--; else rows--; }
    cols = Math.max(cols, b.w > 24 ? 2 : 1); rows = Math.max(rows, b.h > 24 ? 2 : 1);
    const P = [];
    for (let j = 0; j <= rows; j++) { P[j] = []; for (let i = 0; i <= cols; i++) { const ex = i === 0 || i === cols, ey = j === 0 || j === rows; P[j][i] = [b.x + (i / cols) * b.w + (ex ? 0 : rnd(-0.3, 0.3) * b.w / cols), b.y + (j / rows) * b.h + (ey ? 0 : rnd(-0.3, 0.3) * b.h / rows)]; } }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const q = [P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i]];
      const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
      const dx = cx - hx, dy = cy - hy, d = Math.hypot(dx, dy) + 1;
      if (S.bodies.length >= MAX_BODIES) recycleBody();
      S.bodies.push({ k: 's', box: b, poly: q.map(([x, y]) => [x - cx, y - cy]), sx: cx, sy: cy, x: cx, y: cy,
        vx: (dx / d) * rnd(120, 420), vy: (dy / d) * rnd(120, 380) - rnd(80, 260), a: 0, va: rnd(-6, 6), r: Math.max(4, Math.min(b.w / cols, b.h / rows) / 2.4), sleep: 0, life: 1 });
    }
    fxBurst(hx, hy, 14, '#ffffff', 200, 500, 0.35);
    sfx('crash', clamp(Math.sqrt(b.w * b.h) / 300, 0.3, 1));
  }
  function recycleBody() { let k = S.bodies.findIndex((o) => o.sleep > 0.5); if (k < 0) k = 0; S.bodies.splice(k, 1); }

  function explode(x, y, r, power) {
    S.stats.explosions++;
    const r2 = r * r;
    query(x - r, y - r, r * 2, r * 2, (o) => {
      const cx = clamp(x, o.x, o.x + o.w), cy = clamp(y, o.y, o.y + o.h), dx = cx - x, dy = cy - y, d2 = dx * dx + dy * dy;
      if (d2 > r2) return;
      const d = Math.sqrt(d2) + 1, k = 1 - d / r;
      if (o.ch) popGlyph(o, (dx / d) * (300 + 1100 * k * power), (dy / d) * (300 + 1000 * k * power) - 260 * power);
      else damageBox(o, (60 + 260 * k) * power, cx, cy, k > 0.5 ? 4 + 8 * k : 0);
    });
    for (const b of S.L.bigs) {
      if (b.dead) continue;
      const cx = clamp(x, b.x, b.x + b.w), cy = clamp(y, b.y, b.y + b.h);
      if ((cx - x) ** 2 + (cy - y) ** 2 < r2) damageBox(b, 90 * power, x, y, 14 + 10 * power);
    }
    for (const o of S.bodies) {
      const dx = o.x - x, dy = o.y - y, d2 = dx * dx + dy * dy, R = r * 1.6;
      if (d2 > R * R) continue;
      const d = Math.sqrt(d2) + 1, k = 1 - d / R;
      o.vx += (dx / d) * 1400 * k * power; o.vy += (dy / d) * 1300 * k * power - 200 * k; o.va += rnd(-20, 20) * k; o.sleep = 0;
    }
    const P = S.p, dx = P.x - x, dy = P.y - H / 2 - y, d = Math.hypot(dx, dy);
    if (d < r * 1.3) { const k = 1 - d / (r * 1.3); P.vx += (dx / (d + 1)) * 900 * k * power; P.vy += (dy / (d + 1)) * 1000 * k * power - 300 * k; P.grounded = false; }
    // effects
    S.flash = Math.min(0.5, S.flash + 0.12 * power);
    S.rings.push({ x, y, r: 4, max: r * 1.35, t: 0 });
    S.fx.push({ k: 'ball', x, y, vx: 0, vy: 0, s: r * 0.62, life: 0.32, t: 0 });
    for (let i = 0; i < 5 * power; i++) S.fx.push({ k: 'ball', x: x + rnd(-r, r) * 0.35, y: y + rnd(-r, r) * 0.35, vx: rnd(-160, 160), vy: rnd(-220, 40), s: r * rnd(0.18, 0.32), life: rnd(0.25, 0.45), t: 0 });
    fxBurst(x, y, 26 * power, '#ffb020', 300, 1100, 0.5);
    fxBurst(x, y, 16 * power, '#ff5d73', 200, 800, 0.6);
    for (let i = 0; i < 12 * power; i++) S.fx.push({ k: 'smoke', x: x + rnd(-r, r) * 0.3, y: y + rnd(-r, r) * 0.3, vx: rnd(-90, 90), vy: rnd(-160, -20), s: rnd(10, 22) * power, life: rnd(0.8, 1.4), t: 0 });
    shake(9 * power); S.hitstop = Math.max(S.hitstop, 0.035 * power);
    sfx('boom', power);
  }

  // ---------------------------------------------------------------- effects
  function fxBurst(x, y, n, color, v0, v1, life) {
    for (let i = 0; i < n && S.fx.length < MAX_FX; i++) { const a = rnd(0, Math.PI * 2), v = rnd(v0, v1); S.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 120, c: color, life: rnd(life * 0.5, life), t: 0 }); }
  }
  const shake = (v) => (S.shake = Math.min(26, S.shake + v));

  // ---------------------------------------------------------------- sound (synthesised, no files)
  let AC = null, noiseBuf = null, muted = false;
  try { muted = localStorage.getItem('wreck-muted') === '1'; } catch {}
  function audio() {
    if (AC) return AC;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return AC;
  }
  let lastTick = 0;
  function sfx(kind, v = 1) {
    if (muted || !AC) return; const t = AC.currentTime;
    if (kind === 'tick') { if (t - lastTick < 0.025) return; lastTick = t; }
    const out = AC.createGain(); out.connect(AC.destination);
    const noise = (dur, type, f, q, vol, f2) => { const s = AC.createBufferSource(); s.buffer = noiseBuf; const fl = AC.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q; const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(fl).connect(g).connect(out); s.start(t, Math.random() * 0.5); s.stop(t + dur); };
    const tone = (dur, type, f, f2, vol) => { const o = AC.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); const g = AC.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur); };
    out.gain.value = 0.5;
    if (kind === 'shot') { noise(0.09, 'bandpass', 2400, 0.7, 0.5 * v); tone(0.06, 'square', 180, 60, 0.12 * v); }
    else if (kind === 'heavy') { noise(0.22, 'lowpass', 1800, 0.5, 0.7); tone(0.16, 'square', 120, 40, 0.2); }
    else if (kind === 'boom') { noise(0.9 * v + 0.2, 'lowpass', 900, 0.4, 0.9, 80); tone(0.5, 'sine', 120, 30, 0.6 * v); }
    else if (kind === 'rail') { tone(0.35, 'sawtooth', 2200, 90, 0.22); noise(0.25, 'highpass', 3000, 0.6, 0.3); }
    else if (kind === 'thump') { tone(0.12, 'sine', 220, 90, 0.35); noise(0.08, 'lowpass', 900, 0.4, 0.3); }
    else if (kind === 'tick') { tone(0.05, 'triangle', rnd(900, 1500), 400, 0.06); }
    else if (kind === 'crash') { noise(0.35 * v + 0.1, 'bandpass', 1200, 0.6, 0.45 * v); }
    else if (kind === 'jump') { tone(0.12, 'triangle', 300, 600, 0.06); }
    else if (kind === 'hole') { tone(1.2, 'sine', 70, 30, 0.5); tone(1.2, 'sawtooth', 160, 40, 0.06); }
  }
  let flameNode = null;
  function flameSound(on) {
    if (!AC || muted) on = false;
    if (on && !flameNode) { const s = AC.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 0.5; const g = AC.createGain(); g.gain.value = 0.18; s.connect(f).connect(g).connect(AC.destination); s.start(); flameNode = { s, g }; }
    else if (!on && flameNode) { const n = flameNode; flameNode = null; n.g.gain.setTargetAtTime(0, AC.currentTime, 0.05); setTimeout(() => n.s.stop(), 300); }
  }

  // ---------------------------------------------------------------- player
  function makePlayer(x, y) {
    const scarf = []; for (let i = 0; i < 7; i++) scarf.push({ x, y: y - H + 6, px: x, py: y - H + 6 });
    return { x, y, vx: 0, vy: 0, grounded: false, face: 1, aim: 0, coyote: 0, buffer: 0, jumps: 0, dropT: 0, dropFrom: null, jumpHeld: false, flip: -1, fuel: JET_FUEL, jet: false, run: 0, land: 0, scarf, recoil: 0, spin: 0, weapon: 0, cd: 0, air: 0 };
  }
  // one-way platforms: the top edges of every intact element and letter
  function platformUnder(x0, x1, yPrev, yNow) {
    let best = null;
    query(x0, yPrev - 2, x1 - x0, yNow - yPrev + 4, (o) => {
      if (o === S.p.dropFrom && S.p.dropT > 0) return;
      if (x1 < o.x || x0 > o.x + o.w) return;
      if (yPrev <= o.y + 1 && yNow >= o.y && (!best || o.y < best.y)) best = o;
    });
    for (const o of S.L.bigs) if (!o.dead && o !== S.p.dropFrom && x1 >= o.x && x0 <= o.x + o.w && yPrev <= o.y + 1 && yNow >= o.y && (!best || o.y < best.y)) best = o;
    return best;
  }
  function stepPlayer(dt) {
    const P = S.p, I = S.in, L = S.L;
    const dir = (I.right ? 1 : 0) - (I.left ? 1 : 0);
    const acc = P.grounded ? ACC_G : ACC_A;
    if (dir) P.vx += dir * acc * dt; else P.vx -= Math.sign(P.vx) * Math.min(Math.abs(P.vx), (P.grounded ? 2400 : 400) * dt);
    if (Math.abs(P.vx) > RUN) P.vx -= Math.sign(P.vx) * Math.min(Math.abs(P.vx) - RUN, (P.grounded ? 3000 : 600) * dt);

    P.coyote = P.grounded ? COYOTE : P.coyote - dt;
    if (I.jumpPressed) { P.buffer = BUFFER; I.jumpPressed = false; }
    P.buffer -= dt;
    if (P.buffer > 0) {
      if (P.coyote > 0) { P.vy = -JUMP_V; P.grounded = false; P.coyote = 0; P.buffer = 0; P.jumps = 1; sfx('jump'); dust(P.x, P.y, 6); }
      else if (P.jumps < 2) { P.vy = -JUMP2_V; P.jumps = 2; P.buffer = 0; P.flip = 0; sfx('jump'); dust(P.x, P.y, 4); }
    }
    // jetpack: hold jump while falling after the double jump
    P.jet = I.jump && !P.grounded && P.jumps >= 2 && P.flip < 0 && P.fuel > 0 && P.vy > -260;
    if (P.jet) { P.vy -= JET_THRUST * dt; P.fuel -= dt; if (S.fx.length < MAX_FX) for (let i = 0; i < 2; i++) S.fx.push({ k: 'fire', x: P.x - P.face * 7, y: P.y - 26, vx: rnd(-40, 40), vy: rnd(250, 420), s: rnd(3, 6), life: rnd(0.15, 0.3), t: 0 }); }
    if (P.grounded) P.fuel = Math.min(JET_FUEL, P.fuel + dt * 1.5);

    const g = P.vy < 0 && I.jump ? GRAV : FALL_GRAV;
    P.vy = Math.min(MAX_FALL, P.vy + g * dt);
    if (P.flip >= 0) { P.flip += dt / 0.42; if (P.flip >= 1) P.flip = -1; }

    // drop through the ledge you stand on
    if (I.down && P.grounded && P.standing) { P.dropFrom = P.standing; P.dropT = 0.22; P.grounded = false; P.y += 2; }
    P.dropT -= dt;

    P.x += P.vx * dt;
    if (P.x < 8) { P.x = 8; P.vx = 0; } if (P.x > L.vw - 8) { P.x = L.vw - 8; P.vx = 0; }
    const yPrev = P.y; P.y += P.vy * dt;
    const wasGrounded = P.grounded; P.grounded = false; P.standing = null;
    if (P.vy >= 0) {
      if (P.y >= L.docH - 2) { P.y = L.docH - 2; P.vy = 0; P.grounded = true; }
      else {
        const pl = platformUnder(P.x - 6, P.x + 6, yPrev, P.y);
        if (pl) { P.y = pl.y; P.vy = 0; P.grounded = true; P.standing = pl; }
      }
    }
    if (P.grounded) { if (!wasGrounded && P.air > 0.25) { P.land = 1; dust(P.x, P.y, 8); sfx('thump'); } P.jumps = 0; P.air = 0; P.flip = -1; }
    else P.air += dt;
    P.land = Math.max(0, P.land - dt * 5);
    P.run += Math.abs(P.vx) * dt * 0.052;
    // aim
    const sx = P.x, sy = P.y - 36;
    P.aim = Math.atan2(S.aimY - sy, S.aimX - sx);
    P.face = Math.cos(P.aim) >= 0 ? 1 : -1;
    P.recoil = Math.max(0, P.recoil - dt * 40);
    // scarf (verlet rope tied to the back of the head)
    const s = P.scarf; s[0].x = P.x - P.face * 4; s[0].y = P.y - H + 8;
    for (let i = 1; i < s.length; i++) { const k = s[i], vx = (k.x - k.px) * 0.9, vy = (k.y - k.py) * 0.9; k.px = k.x; k.py = k.y; k.x += vx - P.face * 10 * dt - P.vx * 0.002; k.y += vy + 500 * dt * dt; }
    for (let it = 0; it < 3; it++) for (let i = 1; i < s.length; i++) { const a = s[i - 1], b = s[i], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, f = (d - 4.5) / d; b.x -= dx * f; b.y -= dy * f; }
  }
  function dust(x, y, n) { for (let i = 0; i < n && S.fx.length < MAX_FX; i++) S.fx.push({ k: 'smoke', x: x + rnd(-8, 8), y: y - 2, vx: rnd(-120, 120), vy: rnd(-60, -10), s: rnd(3, 6), life: rnd(0.3, 0.5), t: 0, c: 'rgba(120,126,150,' }); }

  // ---------------------------------------------------------------- weapons in use
  function muzzle() {
    const P = S.p, wpn = W[P.weapon], a = P.aim, len = wpn.shape.reduce((m, r) => Math.max(m, r[0] + r[2]), 0);
    const sx = P.x + Math.cos(a) * 6, sy = P.y - 36 + Math.sin(a) * 6;
    return { x: sx + Math.cos(a) * (len - P.recoil), y: sy + Math.sin(a) * (len - P.recoil), a };
  }
  function fire() {
    const P = S.p, wpn = W[P.weapon];
    if (wpn.spin) { P.spin = Math.min(1, P.spin + S.dt / wpn.spin); if (P.spin < 1) return; }
    if (P.cd > 0) return;
    P.cd = wpn.cd; S.stats.shots++;
    const m = muzzle();
    P.recoil = wpn.kick; shake(wpn.shake);
    if (wpn.push) { P.vx -= Math.cos(m.a) * wpn.push; if (!P.grounded) P.vy -= Math.sin(m.a) * wpn.push * 0.6; }
    if (wpn.kind === 'bullet') {
      for (let i = 0; i < wpn.pellets; i++) { const a = m.a + rnd(-wpn.spread, wpn.spread) * (wpn.pellets > 1 ? 1 : 0.5), v = wpn.speed * rnd(0.9, 1.05); S.shots.push({ k: 'b', x: m.x, y: m.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, dmg: wpn.dmg, pierce: wpn.pierce, life: 0.7 }); }
      S.muzzle = 0.05; sfx(wpn.pellets > 1 ? 'heavy' : 'shot', wpn.id === 'minigun' ? 0.6 : 1);
      S.fx.push({ k: 'shell', x: P.x, y: P.y - 36, vx: -P.face * rnd(80, 160), vy: rnd(-320, -220), a: 0, life: 0.8, t: 0 });
    } else if (wpn.kind === 'rocket') { S.shots.push({ k: 'r', x: m.x, y: m.y, vx: Math.cos(m.a) * wpn.speed, vy: Math.sin(m.a) * wpn.speed, life: 3 }); sfx('thump'); }
    else if (wpn.kind === 'grenade') { S.shots.push({ k: 'n', x: m.x, y: m.y, vx: Math.cos(m.a) * wpn.speed + P.vx * 0.3, vy: Math.sin(m.a) * wpn.speed - 120, fuse: 1.3, life: 4, bounces: 0 }); sfx('thump'); }
    else if (wpn.kind === 'cluster') { S.shots.push({ k: 'c', x: m.x, y: m.y, vx: Math.cos(m.a) * wpn.speed, vy: Math.sin(m.a) * wpn.speed - 60, fuse: 0.42, life: 3 }); sfx('heavy'); }
    else if (wpn.kind === 'hole') { S.shots.push({ k: 'h', x: m.x, y: m.y, vx: Math.cos(m.a) * wpn.speed, vy: Math.sin(m.a) * wpn.speed, t: 0, life: 4.4 }); sfx('thump'); }
    else if (wpn.kind === 'rail') rail(m);
    else if (wpn.kind === 'flame') {
      for (let i = 0; i < wpn.pellets && S.fx.length < MAX_FX; i++) { const a = m.a + rnd(-wpn.spread, wpn.spread), v = wpn.speed * rnd(0.7, 1.1); S.fx.push({ k: 'flame', x: m.x, y: m.y, vx: Math.cos(a) * v + P.vx * 0.5, vy: Math.sin(a) * v, s: rnd(4, 7), life: rnd(0.35, 0.55), t: 0 }); }
    }
  }
  function rail(m) {
    const dx = Math.cos(m.a), dy = Math.sin(m.a); let len = 2400;
    const hitBoxes = new Set();
    for (let d = 0; d < len; d += 4) {
      const x = m.x + dx * d, y = m.y + dy * d;
      if (x < 0 || x > S.L.vw || y < S.cam - 400 || y > S.cam + S.vh + 400) { len = d; break; }
      query(x - 5, y - 5, 10, 10, (o) => { if (o.ch) popGlyph(o, dx * 900 + rnd(-200, 200), dy * 900 - rnd(100, 300)); else if (!hitBoxes.has(o)) { hitBoxes.add(o); damageBox(o, 260, x, y, 6); } });
    }
    for (const b of S.L.bigs) if (!b.dead && segRect(m.x, m.y, m.x + dx * len, m.y + dy * len, b)) damageBox(b, 140, clamp(m.x, b.x, b.x + b.w), clamp(m.y, b.y, b.y + b.h), 0);
    for (const o of S.bodies) { const t = (o.x - m.x) * dx + (o.y - m.y) * dy; if (t < 0 || t > len) continue; const px = m.x + dx * t, py = m.y + dy * t; if (Math.hypot(o.x - px, o.y - py) < 18) { o.vx += dx * 900; o.vy += dy * 900 - 200; o.sleep = 0; } }
    S.beams.push({ x0: m.x, y0: m.y, x1: m.x + dx * len, y1: m.y + dy * len, t: 0 });
    fxBurst(m.x + dx * len, m.y + dy * len, 10, '#8b96ff', 200, 600, 0.4);
    sfx('rail'); S.hitstop = 0.03;
  }
  const segRect = (x0, y0, x1, y1, b) => { for (let k = 0; k <= 20; k++) { const x = x0 + (x1 - x0) * k / 20, y = y0 + (y1 - y0) * k / 20; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true; } return false; };
  function throwGrenade() {
    const m = muzzle(), P = S.p;
    S.shots.push({ k: 'n', x: P.x, y: P.y - 40, vx: Math.cos(m.a) * 760 + P.vx * 0.4, vy: Math.sin(m.a) * 760 - 220, fuse: 1.5, life: 4, bounces: 0 });
  }
  function solidAt(x, y) { if (y >= S.L.docH) return true; const o = pointHit(x, y); return o && !o.dead ? o : null; }

  function stepShots(dt) {
    for (let i = S.shots.length - 1; i >= 0; i--) {
      const s = S.shots[i]; s.life -= dt; let gone = s.life <= 0;
      if (s.k === 'b') {
        const steps = Math.ceil(Math.hypot(s.vx, s.vy) * dt / 7);
        for (let k = 0; k < steps && !gone; k++) {
          s.x += s.vx * dt / steps; s.y += s.vy * dt / steps;
          if (s.x < 0 || s.x > S.L.vw || s.y > S.L.docH) { gone = true; break; }
          const o = solidAt(s.x, s.y);
          if (o && o !== true) {
            if (o.ch) popGlyph(o, s.vx * 0.35, s.vy * 0.35 - 200);
            else { damageBox(o, s.dmg, s.x, s.y, 2.2); fxBurst(s.x, s.y, 3, '#ffb020', 100, 400, 0.2); }
            if (--s.pierce < 0) gone = true;
          } else if (o === true) { fxBurst(s.x, s.y, 3, '#9aa0b8', 100, 300, 0.2); gone = true; }
        }
      } else if (s.k === 'r') {
        s.vx *= 1 + dt * 1.2; s.vy *= 1 + dt * 1.2;
        for (let k = 0; k < 3 && !gone; k++) { s.x += s.vx * dt / 3; s.y += s.vy * dt / 3; if (s.x < 0 || s.x > S.L.vw || solidAt(s.x, s.y)) { explode(s.x, s.y, 95, 1.15); gone = true; } }
        if (S.fx.length < MAX_FX) S.fx.push({ k: 'smoke', x: s.x, y: s.y, vx: rnd(-20, 20), vy: rnd(-30, 10), s: rnd(4, 7), life: rnd(0.4, 0.7), t: 0 });
      } else if (s.k === 'n' || s.k === 'm') {
        s.vy += GRAV * 0.75 * dt; s.fuse -= dt;
        const nx = s.x + s.vx * dt, ny = s.y + s.vy * dt;
        if (nx < 4 || nx > S.L.vw - 4) s.vx *= -0.6; else s.x = nx;
        const hit = s.vy > 0 && (ny >= S.L.docH - 4 || platformUnder(s.x - 2, s.x + 2, s.y, ny));
        if (hit) { s.vy *= -0.45; s.vx *= 0.75; if (Math.abs(s.vy) > 120) sfx('tick'); if (s.k === 'm') s.fuse = Math.min(s.fuse, 0.05); } else s.y = ny;
        if (s.fuse <= 0) { explode(s.x, s.y, s.k === 'm' ? 58 : 85, s.k === 'm' ? 0.7 : 1); gone = true; }
      } else if (s.k === 'c') {
        s.vy += GRAV * 0.5 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.fuse -= dt;
        if (s.fuse <= 0 || solidAt(s.x, s.y)) {
          for (let k = 0; k < 9; k++) S.shots.push({ k: 'm', x: s.x, y: s.y, vx: s.vx * 0.3 + rnd(-420, 420), vy: s.vy * 0.2 + rnd(-520, -60), fuse: rnd(0.5, 1.1), life: 3 });
          fxBurst(s.x, s.y, 12, '#ffb020', 100, 400, 0.3); sfx('heavy'); shake(4); gone = true;
        }
      } else if (s.k === 'h') {
        s.t += dt;
        if (s.t < 0.45) { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= 1 - dt * 3; s.vy *= 1 - dt * 3; if (s.t > 0.43) sfx('hole'); }
        else blackHole(s, dt);
        if (s.life <= 0) { explode(s.x, s.y, 150, 1.6); gone = true; }
      }
      if (gone) S.shots.splice(i, 1);
    }
  }
  function blackHole(s, dt) {
    const R = 290, pull = clamp((s.t - 0.45) / 0.6, 0, 1);
    query(s.x - R, s.y - R, R * 2, R * 2, (o) => {
      const cx = o.x + o.w / 2, cy = o.y + o.h / 2, dx = s.x - cx, dy = s.y - cy, d = Math.hypot(dx, dy);
      if (d > R) return;
      if (o.ch) { if (Math.random() < pull * dt * (3 + 30 * (1 - d / R) ** 2)) popGlyph(o, dx * 0.8, dy * 0.8); }
      else if (d < R * 0.7) damageBox(o, 160 * dt * pull, cx, cy, 0);
    });
    for (let i = S.bodies.length - 1; i >= 0; i--) {
      const o = S.bodies[i], dx = s.x - o.x, dy = s.y - o.y, d = Math.hypot(dx, dy) + 1;
      if (d > R * 1.4) continue;
      const f = 5200 * pull * (1 - d / (R * 1.4)) + 600 * pull;
      o.vx += (dx / d) * f * dt + (-dy / d) * f * 0.55 * dt; o.vy += (dy / d) * f * dt + (dx / d) * f * 0.55 * dt; o.vx *= 1 - dt * 1.2; o.vy *= 1 - dt * 1.2; o.sleep = 0; o.free = 0.3;
      if (d < 16) { S.bodies.splice(i, 1); S.stats.eaten++; }
    }
    const P = S.p, dx = s.x - P.x, dy = s.y - (P.y - 26), d = Math.hypot(dx, dy) + 1;
    if (d < R) { P.vx += (dx / d) * 900 * pull * dt; P.vy += (dy / d) * 900 * pull * dt; }
    shake(0.25);
  }

  // ---------------------------------------------------------------- debris physics
  function stepBodies(dt) {
    const L = S.L;
    // settled shards fade away after a few seconds so the page stays readable; letters stay where they land
    for (let i = S.bodies.length - 1; i >= 0; i--) { const o = S.bodies[i]; if (o.k === 's' && o.sleep > 0.6) { o.rest = (o.rest || 0) + dt; if (o.rest > 3.5) { o.life -= dt / 1.2; if (o.life <= 0) S.bodies.splice(i, 1); } } }
    for (const o of S.bodies) {
      if (o.sleep > 0.6 && !o.check) continue;
      if (o.free > 0) o.free -= dt; else o.vy += GRAV * 0.85 * dt;
      o.vx *= 1 - dt * 0.35;
      const yPrev = o.y + o.r;
      o.x += o.vx * dt; o.y += o.vy * dt; o.a += o.va * dt;
      if (o.x < o.r) { o.x = o.r; o.vx = Math.abs(o.vx) * 0.4; } else if (o.x > L.vw - o.r) { o.x = L.vw - o.r; o.vx = -Math.abs(o.vx) * 0.4; }
      let ground = null;
      if (o.vy >= 0 && !(o.free > 0)) {
        if (o.y + o.r >= L.docH) ground = L.docH;
        else { const pl = platformUnder(o.x - 1, o.x + 1, yPrev, o.y + o.r); if (pl) ground = pl.y; }
      }
      if (ground != null) {
        o.y = ground - o.r; o.vy = o.vy > 160 ? -o.vy * 0.28 : 0; o.vx *= 0.82; o.va *= 0.7; o.support = ground;
        if (Math.abs(o.vx) < 14 && o.vy === 0) { o.vx = 0; o.sleep += dt; if (o.sleep > 0.6) { o.va = 0; if (o.k === 'g') o.a = Math.round(o.a / (Math.PI / 2)) * (Math.PI / 2); } }
      } else o.sleep = 0;
      o.check = false;
    }
    // wake sleepers whose ledge was destroyed
    if ((S.frame & 15) === 0) for (const o of S.bodies) if (o.sleep > 0.6 && o.support < L.docH && !platformUnder(o.x - 1, o.x + 1, o.y + o.r - 2, o.y + o.r + 2)) { o.sleep = 0; }
  }
  function stepFx(dt) {
    for (let i = S.fx.length - 1; i >= 0; i--) {
      const f = S.fx[i]; f.t += dt;
      if (f.t >= f.life) { S.fx.splice(i, 1); continue; }
      if (f.k === 'spark') { f.vy += 1400 * dt; f.vx *= 1 - dt * 2; }
      else if (f.k === 'ball') { f.vx *= 1 - dt * 3; f.vy = f.vy * (1 - dt * 3) - 120 * dt; }
      else if (f.k === 'smoke') { f.vx *= 1 - dt * 2; f.vy *= 1 - dt * 1.5; f.vy -= 30 * dt; }
      else if (f.k === 'shell') { f.vy += 1800 * dt; f.a = (f.a || 0) + dt * 20; }
      else if (f.k === 'fire') { f.vx *= 1 - dt * 4; }
      else if (f.k === 'flame') {
        f.vx *= 1 - dt * 2.2; f.vy = f.vy * (1 - dt * 2.2) - 260 * dt;
        const o = pointHit(f.x, f.y);
        if (o) {
          if (o.ch) { o.heat += dt * 6; if (o.heat > 1) popGlyph(o, f.vx * 0.3, -rnd(200, 420), true); else invalidate(o.y, o.y + o.h); }
          else damageBox(o, 40 * dt * 6, f.x, f.y, Math.random() < 0.05 ? 2 : 0);
          f.vx *= 0.5; f.vy *= 0.5;
        }
      }
      f.x += f.vx * dt; f.y += f.vy * dt;
    }
    for (let i = S.rings.length - 1; i >= 0; i--) { const r = S.rings[i]; r.t += dt; if (r.t > 0.35) S.rings.splice(i, 1); }
    for (let i = S.beams.length - 1; i >= 0; i--) { const b = S.beams[i]; b.t += dt; if (b.t > 0.35) S.beams.splice(i, 1); }
  }

  // ---------------------------------------------------------------- drawing
  function draw() {
    const ctx = S.ctx, L = S.L, dpr = S.dpr;
    const sh = S.shake, ox = rnd(-sh, sh) * 0.5, oy = rnd(-sh, sh) * 0.5;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = L.bg; ctx.fillRect(0, 0, S.vw, S.vh);
    const top = S.cam + oy;
    for (let i = Math.floor(Math.max(0, top) / TILE); i <= Math.floor((top + S.vh) / TILE); i++) {
      const t = drawTile(i);
      ctx.drawImage(t.cv, ox, i * TILE - top, L.vw, TILE);
    }
    ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, -top * dpr);
    // debris
    ctx.textBaseline = 'alphabetic';
    for (const o of S.bodies) {
      if (o.y < top - 60 || o.y > top + S.vh + 60) continue;
      ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.a);
      if (o.life < 1) { ctx.globalAlpha = Math.max(0, o.life); ctx.scale(0.6 + 0.4 * o.life, 0.6 + 0.4 * o.life); }
      if (o.k === 'g') { ctx.font = o.font; ctx.fillStyle = o.color; ctx.fillText(o.ch, o.ox, o.by); }
      else {
        const b = o.box, q = o.poly; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let k = 1; k < q.length; k++) ctx.lineTo(q[k][0], q[k][1]); ctx.closePath();
        ctx.save(); ctx.clip(); ctx.translate(-o.sx, -o.sy);
        ctx.fillStyle = b.fill || (b.grad && b.grad[0]) || (b.stroke || '#d9dce8'); ctx.fillRect(b.x, b.y, b.w, b.h);
        if (b.img) try { ctx.drawImage(b.img, b.x, b.y, b.w, b.h); } catch {}
        ctx.restore();
        ctx.strokeStyle = 'rgba(21,23,42,.14)'; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    // shots
    for (const s of S.shots) {
      if (s.k === 'b') { const a = Math.atan2(s.vy, s.vx); ctx.strokeStyle = '#ffb020'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - Math.cos(a) * 18, s.y - Math.sin(a) * 18); ctx.stroke(); }
      else if (s.k === 'r') { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(Math.atan2(s.vy, s.vx)); ctx.fillStyle = '#2f6b55'; ctx.fillRect(-10, -3, 14, 6); ctx.fillStyle = '#ff5d73'; ctx.fillRect(4, -3, 4, 6); ctx.fillStyle = '#ffb020'; ctx.fillRect(-16, -2, 6, 4); ctx.restore(); }
      else if (s.k === 'n' || s.k === 'm') { ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(s.x, s.y, s.k === 'm' ? 3.5 : 5, 0, 7); ctx.fill(); ctx.fillStyle = (s.fuse * 10 | 0) % 2 ? '#ff5d73' : '#ffb020'; ctx.fillRect(s.x - 1, s.y - (s.k === 'm' ? 6 : 8), 2, 3); }
      else if (s.k === 'c') { ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.arc(s.x, s.y, 7, 0, 7); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); }
      else if (s.k === 'h') drawHole(ctx, s);
    }
    // effects (fireballs last so they sit on top of smoke)
    S.fx.sort((a, b) => (a.k === 'ball') - (b.k === 'ball'));
    for (const f of S.fx) {
      const k = 1 - f.t / f.life;
      if (f.k === 'spark') { ctx.strokeStyle = f.c; ctx.globalAlpha = k; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - f.vx * 0.02, f.y - f.vy * 0.02); ctx.stroke(); }
      else if (f.k === 'smoke') { ctx.fillStyle = (f.c || 'rgba(70,74,96,') + (0.35 * k) + ')'; ctx.beginPath(); ctx.arc(f.x, f.y, f.s * (1.6 - k * 0.6), 0, 7); ctx.fill(); }
      else if (f.k === 'flame' || f.k === 'fire') { ctx.globalAlpha = Math.min(1, k * 1.4); ctx.fillStyle = k > 0.66 ? '#fff3c4' : k > 0.33 ? '#ffb020' : '#ff5d73'; ctx.beginPath(); ctx.arc(f.x, f.y, f.s * (1.4 - k * 0.5), 0, 7); ctx.fill(); }
      else if (f.k === 'ball') { const e = f.t / f.life, R = f.s * (0.45 + 0.75 * Math.sqrt(e)); ctx.globalAlpha = 1 - e * e; ctx.fillStyle = e < 0.25 ? '#fffbe8' : e < 0.5 ? '#ffd166' : e < 0.75 ? '#ff8a3d' : '#ff5d73'; ctx.beginPath(); ctx.arc(f.x, f.y, R, 0, 7); ctx.fill(); if (e < 0.4) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(f.x, f.y, R * 0.5, 0, 7); ctx.fill(); } }
      else if (f.k === 'shell') { ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a); ctx.fillStyle = '#ffb020'; ctx.fillRect(-2, -1, 4, 2); ctx.restore(); }
    }
    ctx.globalAlpha = 1;
    for (const r of S.rings) { const k = r.t / 0.35; ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 6 * (1 - k) + 1; ctx.beginPath(); ctx.arc(r.x, r.y, r.r + (r.max - r.r) * Math.sqrt(k), 0, 7); ctx.stroke(); }
    for (const b of S.beams) { const k = 1 - b.t / 0.35; ctx.lineCap = 'round'; ctx.strokeStyle = `rgba(79,91,255,${k})`; ctx.lineWidth = 10 * k; ctx.beginPath(); ctx.moveTo(b.x0, b.y0); ctx.lineTo(b.x1, b.y1); ctx.stroke(); ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 3 * k; ctx.stroke(); }
    drawPlayer(ctx);
    if (!S.touch) drawCrosshair(ctx);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (S.flash > 0.01) { ctx.fillStyle = `rgba(255,255,255,${S.flash})`; ctx.fillRect(0, 0, S.vw, S.vh); }
  }
  function drawHole(ctx, s) {
    const on = s.t >= 0.45, k = on ? clamp((s.t - 0.45) / 0.4, 0, 1) : 0, R = 8 + 18 * k;
    if (on) {
      ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.t * 4);
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = ['#8b5cf6', '#ff5d73', '#4f5bff'][i]; ctx.globalAlpha = 0.7; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, R * (2.2 + i * 0.5), R * (0.9 + i * 0.2), i, 0, Math.PI * 1.4); ctx.stroke(); }
      ctx.restore(); ctx.globalAlpha = 1;
      ctx.strokeStyle = 'rgba(255,255,255,.6)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(s.x, s.y, R * 1.35 + Math.sin(s.t * 10) * 2, 0, 7); ctx.stroke();
    }
    ctx.fillStyle = '#05060b'; ctx.beginPath(); ctx.arc(s.x, s.y, on ? R : 6, 0, 7); ctx.fill();
  }
  function drawCrosshair(ctx) {
    const x = S.aimX, y = S.aimY, c = W[S.p.weapon].kind === 'rail' ? '#4f5bff' : INK;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.stroke();
    ctx.strokeStyle = c; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.moveTo(x - 13, y); ctx.lineTo(x - 5, y); ctx.moveTo(x + 5, y); ctx.lineTo(x + 13, y); ctx.moveTo(x, y - 13); ctx.lineTo(x, y - 5); ctx.moveTo(x, y + 5); ctx.lineTo(x, y + 13); ctx.stroke();
  }
  // two-bone inverse kinematics: joint between a and target, bending to side s
  function ik(ax, ay, tx, ty, l1, l2, s) {
    let dx = tx - ax, dy = ty - ay, d = Math.hypot(dx, dy); const max = l1 + l2 - 0.01;
    if (d > max) { dx *= max / d; dy *= max / d; d = max; }
    const a = Math.atan2(dy, dx), c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), b = Math.acos(c) * s;
    return [ax + Math.cos(a - b) * l1, ay + Math.sin(a - b) * l1, ax + dx, ay + dy];
  }
  function drawPlayer(ctx) {
    const P = S.p, f = P.face, wpn = W[P.weapon];
    const squash = P.land * 4;
    const hipX = P.x, hipY = P.y - 21 + squash, neckY = P.y - 38 + squash, headY = P.y - 46 + squash;
    ctx.save();
    if (P.flip >= 0) { ctx.translate(hipX, hipY - 6); ctx.rotate(-f * P.flip * Math.PI * 2); ctx.translate(-hipX, -(hipY - 6)); }
    const lines = [];
    // legs
    const speed = Math.min(1, Math.abs(P.vx) / RUN);
    for (const side of [0, 1]) {
      let fx, fy;
      if (P.grounded) { const ph = P.run + side * Math.PI; fx = hipX + Math.sin(ph) * 13 * speed + f * 1; fy = P.y - Math.max(0, Math.cos(ph)) * 8 * speed; }
      else { fx = hipX + (side ? 7 : -3) * f; fy = hipY + 14 - (P.flip >= 0 ? 8 : 0); }
      const [kx, ky, ex, ey] = ik(hipX, hipY, fx, fy, 12, 12, -f);
      lines.push([hipX, hipY, kx, ky, ex, ey]);
    }
    // gun position and hands
    const a = P.aim, sx = P.x + Math.cos(a) * 6, sy = neckY + 3 + Math.sin(a) * 6, ca = Math.cos(a), sa = Math.sin(a);
    const gx = sx - ca * P.recoil, gy = sy - sa * P.recoil;
    const hand1 = [gx, gy], hand2 = wpn.front ? [gx + ca * wpn.front, gy + sa * wpn.front] : null;
    const shX = P.x - ca * 1, shY = neckY + 3;
    const arm1 = ik(shX, shY, hand1[0], hand1[1], 10, 10, f);
    const arm2 = hand2 ? ik(shX, shY, hand2[0], hand2[1], 10, 11, f) : ik(shX, shY, P.x - f * 6, neckY + 16, 10, 10, -f);
    // halo so the stickman reads on any page colour, then ink
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass ? INK : 'rgba(255,255,255,.9)'; ctx.lineWidth = pass ? 4 : 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (const l of lines) { ctx.moveTo(l[0], l[1]); ctx.lineTo(l[2], l[3]); ctx.lineTo(l[4], l[5]); }
      ctx.moveTo(hipX, hipY); ctx.lineTo(P.x + f * 1, neckY);
      ctx.moveTo(shX, shY); ctx.lineTo(arm2[0], arm2[1]); ctx.lineTo(arm2[2], arm2[3]);
      ctx.stroke();
      if (!pass) { ctx.fillStyle = 'rgba(255,255,255,.9)'; ctx.beginPath(); ctx.arc(P.x + f, headY, 9.5, 0, 7); ctx.fill(); }
    }
    // scarf
    ctx.strokeStyle = Wreck.skin; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(P.scarf[0].x, P.scarf[0].y); for (const k of P.scarf) ctx.lineTo(k.x, k.y); ctx.stroke();
    // jetpack
    ctx.fillStyle = '#3a3f5c'; rr(ctx, P.x - f * 11 - 3, neckY + 1, 6, 13, 2); ctx.fill();
    // head
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(P.x + f, headY, 7, 0, 7); ctx.fill();
    ctx.fillStyle = Wreck.skin; ctx.fillRect(P.x + f - 7, headY - 3, 14, 3);
    ctx.fillStyle = '#fff'; ctx.fillRect(P.x + f * 3 - 1, headY - 1, 3, 3);
    // gun
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(a); if (f < 0) ctx.scale(1, -1);
    for (const r of wpn.shape) { ctx.fillStyle = r[4]; ctx.fillRect(r[0], r[1], r[2], r[3]); }
    if (wpn.id === 'minigun' && P.spin > 0) { ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(12, -6 + ((S.frame * 3) % 12), 20, 1); }
    if (S.muzzle > 0) { const len = wpn.shape.reduce((m, r) => Math.max(m, r[0] + r[2]), 0); ctx.fillStyle = '#fff3c4'; ctx.beginPath(); ctx.moveTo(len, -5); ctx.lineTo(len + 16, 0); ctx.lineTo(len, 5); ctx.fill(); ctx.fillStyle = '#ffb020'; ctx.beginPath(); ctx.arc(len + 2, 0, 4, 0, 7); ctx.fill(); }
    ctx.restore();
    // gun arm on top
    for (const pass of [0, 1]) { ctx.strokeStyle = pass ? INK : 'rgba(255,255,255,.9)'; ctx.lineWidth = pass ? 4 : 8; ctx.beginPath(); ctx.moveTo(shX, shY); ctx.lineTo(arm1[0], arm1[1]); ctx.lineTo(arm1[2], arm1[3]); ctx.stroke(); }
    ctx.restore();
  }

  // ---------------------------------------------------------------- HUD (shadow DOM so the page's CSS cannot reach it)
  const CSS = `
  :host{all:initial}
  *{box-sizing:border-box;font-family:ui-rounded,"SF Pro Rounded",Urbanist,system-ui,-apple-system,"Segoe UI",sans-serif}
  .top{position:fixed;left:16px;right:16px;top:14px;display:flex;justify-content:space-between;align-items:flex-start;gap:10px;pointer-events:none}
  .card{pointer-events:auto;background:rgba(255,255,255,.9);color:#15172a;border:1px solid rgba(21,23,42,.12);border-radius:14px;padding:10px 12px;box-shadow:0 10px 30px -12px rgba(21,23,42,.35);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}
  .meter{width:210px;font-size:12px;font-weight:700;letter-spacing:.02em}
  .meter b{font-size:22px;font-weight:900;margin-right:4px}
  .bar{position:relative;height:8px;border-radius:4px;background:#e6e9f3;margin-top:6px;overflow:hidden}
  .bar i{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,#4f5bff,#8b5cf6,#ff5d73,#ffb020);border-radius:4px;transition:width .25s}
  .btns{display:flex;gap:8px}
  button{pointer-events:auto;font:inherit;font-size:13px;font-weight:800;color:#15172a;background:#fff;border:1px solid rgba(21,23,42,.15);border-bottom-width:3px;border-radius:11px;padding:8px 11px;cursor:pointer}
  button:active{transform:translateY(1px);border-bottom-width:2px}
  .wbar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);display:flex;gap:6px;padding:6px;pointer-events:auto;max-width:calc(100vw - 24px);overflow-x:auto}
  .slot{position:relative;width:62px;height:46px;border-radius:10px;border:1px solid rgba(21,23,42,.1);background:#fff;display:grid;place-items:center;cursor:pointer;flex:none}
  .slot.on{border-color:#15172a;box-shadow:inset 0 0 0 1px #15172a;background:#f4f6fb}
  .slot canvas{width:52px;height:26px}
  .slot span{position:absolute;left:5px;top:2px;font-size:10px;font-weight:800;color:#6b7088}
  .wname{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);font-size:20px;font-weight:900;color:#15172a;background:rgba(255,255,255,.92);padding:6px 14px;border-radius:12px;pointer-events:none;transition:opacity .3s;border:1px solid rgba(21,23,42,.1)}
  .hint{position:fixed;left:16px;bottom:16px;font-size:12px;line-height:1.75;color:#3a3f5c;pointer-events:none;transition:opacity .6s}
  .hint b{display:inline-block;min-width:18px;text-align:center;background:#fff;border:1px solid rgba(21,23,42,.18);border-bottom-width:2px;border-radius:5px;padding:0 4px;margin-right:2px;color:#15172a}
  .done{position:fixed;inset:0;display:grid;place-items:center;background:rgba(21,23,42,.35);pointer-events:auto}
  .done .card{width:min(360px,calc(100vw - 32px));padding:22px;border-radius:22px}
  .done h2{margin:0 0 4px;font-size:26px;font-weight:900}
  .done p.sub{margin:0 0 14px;color:#6b7088;font-size:14px}
  .stats{display:grid;grid-template-columns:1fr auto;gap:6px 12px;font-size:14px;margin-bottom:16px}
  .stats .v{font-weight:900;text-align:right}
  .row{display:flex;gap:8px}.row button{flex:1;padding:11px}
  .row .dark{background:#15172a;color:#fff;border-color:#15172a}
  .stick{position:fixed;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;border:2px solid rgba(21,23,42,.25);background:rgba(255,255,255,.35);pointer-events:none;display:none}
  .stick i{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(21,23,42,.55)}
  .tbtns{position:fixed;right:16px;bottom:78px;display:none;flex-direction:column;gap:10px}
  .tbtns button{width:58px;height:58px;border-radius:18px;font-size:18px;padding:0}
  @media (pointer:coarse){.hint{display:none}.tbtns{display:flex}.slot{width:50px}.slot canvas{width:42px}.meter{width:132px;padding:8px 10px}.meter b{font-size:18px}.btns button{width:40px;height:40px;padding:0;font-size:16px}.top{left:10px;right:10px;top:10px}}
  `;
  function buildHud() {
    const host = document.createElement('div'); host.setAttribute('data-wreck', '');
    host.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
    const root = host.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>
      <div class="top"><div class="card meter"><b class="pct">0%</b>destroyed<div class="bar"><i></i></div></div>
      <div class="btns"><button class="snd" title="Sound (M)"></button><button class="rst" title="Rebuild (R)">Rebuild</button><button class="ext" title="Exit (Esc)">Exit ✕</button></div></div>
      <div class="wname" style="opacity:0"></div>
      <div class="wbar card"></div>
      <div class="hint"><b>A</b><b>D</b> move · <b>W</b> jump, again to flip, hold to fly · <b>S</b> drop<br><b>Click</b> fire · <b>Right-click</b>/<b>Q</b> grenade · <b>1</b>–<b>0</b> or wheel: weapons</div>
      <div class="stick l"><i></i></div><div class="stick r"><i></i></div>
      <div class="tbtns"><button class="tjump">▲</button><button class="tnade">✹</button><button class="tnext">⇄</button></div>`;
    const $ = (s) => root.querySelector(s);
    const bar = $('.wbar');
    W.forEach((w, i) => {
      const d = document.createElement('div'); d.className = 'slot'; d.title = w.name;
      d.innerHTML = `<span>${(i + 1) % 10}</span>`;
      const c = document.createElement('canvas'); c.width = 104; c.height = 52; const g = c.getContext('2d');
      const minX = Math.min(...w.shape.map((r) => r[0])), maxX = Math.max(...w.shape.map((r) => r[0] + r[2])), sc = Math.min(2.2, 90 / (maxX - minX));
      g.translate(52 - ((minX + maxX) / 2) * sc, 26); g.scale(sc, sc); for (const r of w.shape) { g.fillStyle = r[4]; g.fillRect(r[0], r[1], r[2], r[3]); }
      d.appendChild(c); d.addEventListener('pointerdown', (e) => { e.stopPropagation(); setWeapon(i); });
      bar.appendChild(d);
    });
    $('.snd').addEventListener('click', toggleMute); $('.rst').addEventListener('click', rebuild); $('.ext').addEventListener('click', stop);
    root.querySelectorAll('button').forEach((b) => b.addEventListener('pointerdown', (e) => e.stopPropagation()));
    document.documentElement.appendChild(host);
    return { host, root, $, pct: $('.pct'), bar: $('.bar i'), wname: $('.wname'), slots: [...bar.children], hint: $('.hint') };
  }
  function setWeapon(i) {
    const P = S.p; if (i === P.weapon) return; P.weapon = i; P.cd = Math.min(P.cd, 0.15); P.spin = 0;
    S.hud.slots.forEach((s, k) => s.classList.toggle('on', k === i));
    S.hud.wname.textContent = W[i].name; S.hud.wname.style.opacity = '1'; S.wnameT = 1.3;
    flameSound(false);
  }
  function toggleMute() { muted = !muted; try { localStorage.setItem('wreck-muted', muted ? '1' : '0'); } catch {} sndLabel(); if (muted) flameSound(false); }
  function sndLabel() { const c = matchMedia('(pointer: coarse)').matches; S.hud.$('.snd').textContent = c ? (muted ? '🔇' : '🔊') : muted ? 'Sound off' : 'Sound on'; S.hud.$('.rst').textContent = c ? '↻' : 'Rebuild'; S.hud.$('.ext').textContent = c ? '✕' : 'Exit ✕'; }
  function hudTick(dt) {
    const p = clamp(S.progress / S.total, 0, 1);
    S.hud.pct.textContent = Math.floor(p * 100) + '%'; S.hud.bar.style.width = (p * 100).toFixed(1) + '%';
    if (S.wnameT > 0 && (S.wnameT -= dt) <= 0) S.hud.wname.style.opacity = '0';
    if (S.time > 10 || S.stats.shots > 20) S.hud.hint.style.opacity = '0';
    if (!S.doneShown && p >= 0.85) showDone();
  }
  function showDone() {
    S.doneShown = true;
    const t = Math.round(S.time), d = document.createElement('div'); d.className = 'done';
    const st = [['Letters knocked off', S.stats.letters], ['Elements broken', S.stats.elements], ['Explosions', S.stats.explosions], ['Swallowed by black holes', S.stats.eaten], ['Shots fired', S.stats.shots], ['Time', `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`]];
    d.innerHTML = `<div class="card"><h2>Page destroyed</h2><p class="sub">${location.hostname || 'This page'} never stood a chance.</p><div class="stats">${st.map(([k, v]) => `<span>${k}</span><span class="v">${v.toLocaleString?.() ?? v}</span>`).join('')}</div><div class="row"><button class="keep">Keep wrecking</button><button class="again dark">Rebuild</button></div></div>`;
    d.querySelector('.keep').onclick = () => d.remove(); d.querySelector('.again').onclick = () => { d.remove(); rebuild(); };
    d.addEventListener('pointerdown', (e) => e.stopPropagation());
    S.hud.root.appendChild(d);
  }

  // ---------------------------------------------------------------- input
  const KEYMAP = { KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right', KeyW: 'jump', ArrowUp: 'jump', Space: 'jump', KeyS: 'down', ArrowDown: 'down' };
  function onKey(e) {
    if (!S || e.metaKey || e.ctrlKey || e.altKey) return;
    const down = e.type === 'keydown', k = KEYMAP[e.code];
    if (k) { if (down && k === 'jump' && !S.in.jump) S.in.jumpPressed = true; S.in[k] = down; }
    if (down) {
      if (e.code === 'Escape') stop();
      else if (e.code === 'KeyR') rebuild();
      else if (e.code === 'KeyM') toggleMute();
      else if (e.code === 'KeyQ' || e.code === 'KeyE') throwGrenade();
      else if (/^Digit\d$/.test(e.code)) setWeapon((+e.code.slice(5) + 9) % 10);
    }
    e.preventDefault(); e.stopImmediatePropagation();
  }
  function bindInput() {
    const cv = S.cv, I = S.in;
    const toWorld = (e) => { S.aimX = e.clientX; S.aimY = e.clientY + S.cam; S.mouseX = e.clientX; S.mouseY = e.clientY; };
    S.on = [];
    const on = (t, ev, fn, o) => { t.addEventListener(ev, fn, o); S.on.push([t, ev, fn, o]); };
    on(window, 'keydown', onKey, true); on(window, 'keyup', onKey, true);
    on(cv, 'contextmenu', (e) => e.preventDefault());
    on(cv, 'wheel', (e) => { e.preventDefault(); if (Math.abs(e.deltaY) > 4 && S.time - (S.wheelT || 0) > 0.09) { S.wheelT = S.time; setWeapon((S.p.weapon + (e.deltaY > 0 ? 1 : 9)) % 10); } }, { passive: false });
    on(cv, 'pointermove', (e) => { if (e.pointerType === 'mouse') toWorld(e); else touchMove(e); });
    on(cv, 'pointerdown', (e) => {
      audio(); AC?.resume?.();
      if (e.pointerType !== 'mouse') return touchDown(e);
      toWorld(e); if (e.button === 2) throwGrenade(); else I.fire = true;
    });
    on(window, 'pointerup', (e) => { if (e.pointerType !== 'mouse') return touchUp(e); if (e.button !== 2) I.fire = false; });
    on(window, 'pointercancel', touchUp);
    on(window, 'blur', () => { for (const k in I) I[k] = false; });
    on(window, 'resize', () => { clearTimeout(S.rt); S.rt = setTimeout(resize, 150); });
    const tb = (sel, fn, up) => { const b = S.hud.$(sel); on(b, 'pointerdown', (e) => { e.stopPropagation(); audio(); fn(); }); if (up) { on(b, 'pointerup', up); on(b, 'pointerleave', up); } };
    tb('.tjump', () => { I.jumpPressed = true; I.jump = true; }, () => (I.jump = false));
    tb('.tnade', throwGrenade); tb('.tnext', () => setWeapon((S.p.weapon + 1) % 10));
  }
  // twin sticks: left half moves, right half aims and fires
  function touchDown(e) {
    S.touch = true; const left = e.clientX < S.vw / 2, st = S.hud.$(left ? '.stick.l' : '.stick.r');
    S.sticks[left ? 'l' : 'r'] = { id: e.pointerId, x: e.clientX, y: e.clientY, el: st };
    st.style.display = 'block'; st.style.left = e.clientX + 'px'; st.style.top = e.clientY + 'px'; st.firstChild.style.transform = '';
    if (!left) { S.in.fire = true; S.aimX = S.p.x + S.p.face * 200; S.aimY = S.p.y - 36; }
  }
  function touchMove(e) {
    for (const side of ['l', 'r']) {
      const s = S.sticks[side]; if (!s || s.id !== e.pointerId) continue;
      let dx = e.clientX - s.x, dy = e.clientY - s.y; const d = Math.hypot(dx, dy), m = 44; if (d > m) { dx *= m / d; dy *= m / d; }
      s.el.firstChild.style.transform = `translate(${dx}px,${dy}px)`;
      if (side === 'l') { S.in.left = dx < -12; S.in.right = dx > 12; const up = dy < -26; if (up && !S.in.jump) S.in.jumpPressed = true; S.in.jump = up; S.in.down = dy > 30; }
      else if (d > 6) { const a = Math.atan2(dy, dx); S.aimX = S.p.x + Math.cos(a) * 220; S.aimY = S.p.y - 36 + Math.sin(a) * 220; }
    }
  }
  function touchUp(e) {
    for (const side of ['l', 'r']) {
      const s = S.sticks[side]; if (!s || (e && s.id !== e.pointerId)) continue;
      s.el.style.display = 'none'; S.sticks[side] = null;
      if (side === 'l') { S.in.left = S.in.right = S.in.jump = S.in.down = false; } else S.in.fire = false;
    }
  }

  // ---------------------------------------------------------------- lifecycle
  function resize() {
    if (!S) return;
    S.vw = innerWidth; S.vh = innerHeight; S.dpr = Math.min(2, devicePixelRatio || 1);
    S.cv.width = Math.round(S.vw * S.dpr); S.cv.height = Math.round(S.vh * S.dpr);
    S.tiles.clear();
  }
  function build(keepCam) {
    const L = extract(); buildHash(L);
    S.L = L; S.tiles = new Map();
    S.total = Math.max(1, L.glyphs.length + L.boxes.reduce((s, b) => s + b.weight, 0));
    S.progress = 0; S.bodies = []; S.shots = []; S.fx = []; S.rings = []; S.beams = []; S.doneShown = false; S.time = 0;
    S.stats = { letters: 0, elements: 0, explosions: 0, shots: 0, eaten: 0 };
    if (!keepCam) S.cam = clamp(scrollY, 0, Math.max(0, L.docH - innerHeight));
    const w = S.p ? S.p.weapon : 0;
    S.p = makePlayer(Math.min(90, L.vw / 2), S.cam + Math.min(260, innerHeight * 0.3)); S.p.weapon = w;
  }
  function rebuild() { if (!S) return; S.hud.root.querySelector('.done')?.remove(); build(true); }
  function start() {
    if (Wreck.running) return;
    Wreck.running = true;
    const cv = document.createElement('canvas'); cv.setAttribute('data-wreck', '');
    cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483646;cursor:none;touch-action:none;display:block';
    S = { cv, ctx: cv.getContext('2d'), in: {}, sticks: {}, frame: 0, shake: 0, flash: 0, hitstop: 0, muzzle: 0, aimX: innerWidth / 2, aimY: 0, cam: 0, touch: matchMedia('(pointer: coarse)').matches, prevOverflow: document.documentElement.style.overflow, prevScroll: scrollY };
    build(false);
    document.documentElement.appendChild(cv);
    S.hud = buildHud(); resize();
    document.documentElement.style.overflow = 'hidden';
    bindInput(); setWeapon(1); setWeapon(0); sndLabel();
    S.aimY = S.cam + innerHeight / 2;
    let last = performance.now();
    const loop = (now) => {
      if (!S) return;
      let dt = Math.min(1 / 30, (now - last) / 1000); last = now; S.dt = dt; S.frame++;
      S.time += dt;
      if (S.hitstop > 0) { S.hitstop -= dt; dt = 0; }
      if (dt > 0) {
        const sub = 2; for (let i = 0; i < sub; i++) stepPlayer(dt / sub);
        const P = S.p; P.cd -= dt;
        if (S.in.fire) fire(); else { P.spin = Math.max(0, P.spin - dt * 2); }
        flameSound(S.in.fire && W[P.weapon].kind === 'flame');
        stepShots(dt); stepBodies(dt); stepFx(dt);
        // camera follows the stickman down (and up) the page
        const target = clamp(P.y - S.vh * 0.58, 0, Math.max(0, S.L.docH - S.vh));
        const prev = S.cam; S.cam += (target - S.cam) * (1 - Math.exp(-dt * 7));
        if (!S.touch) S.aimY += S.cam - prev; else { S.aimY += S.cam - prev; }
      }
      S.shake *= Math.exp(-(S.dt) * 9); S.flash *= Math.exp(-S.dt * 10); S.muzzle -= S.dt;
      draw(); hudTick(S.dt);
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
    const y = S.cam; S = null; Wreck.running = false; scrollTo(0, y);
    Wreck.onExit?.();
  }

  // bookmarklet: start straight away unless the host page asked to start it itself
  const me = document.currentScript;
  if (!me || me.dataset.auto !== 'off') {
    if (document.readyState === 'loading') addEventListener('DOMContentLoaded', start, { once: true }); else start();
  }
})();
