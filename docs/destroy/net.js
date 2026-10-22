/*!
 * Wreck online: rooms of up to 8 players over WebRTC (PeerJS). The host relays every message,
 * so each player only talks to the host. PeerJS's public broker is used only to introduce peers.
 */
(() => {
  'use strict';
  const PREFIX = 'wreck-sh-', MAX = 8, WIDTH = 1280;
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const SKIN_RE = /^#[0-9a-f]{6}$/i;
  let peer = null, isHost = false, room = null, hostConn = null, started = false, level = () => '';
  const conns = new Map();            // host only: peer id -> connection
  const players = new Map();          // id -> { id, name, skin }
  let ui = { status() {}, lobby() {}, start() {}, left() {} };

  const SUITS = new Set(['standard', 'ronin', 'diver', 'robot', 'astro', 'sentinel', 'phantom', 'juggernaut', 'golden', 'islander', 'spelunker', 'neon', 'frost', 'chip', 'ember', 'hazard', 'medic', 'commander', 'pumpkin', 'ghost', 'bat', 'snowman', 'antlers', 'gift']);
  const look = (p) => ({ suit: SUITS.has(p.suit) ? p.suit : 'standard', rank: Number.isInteger(p.rank) && p.rank >= 0 && p.rank < 12 ? p.rank : 0 });
  const cleanName = (s) => String(s || '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 16) || 'Player';
  const code = () => Array.from({ length: 6 }, () => ALPHA[(Math.random() * ALPHA.length) | 0]).join('');
  const list = () => [...players.values()];
  const me = () => players.get(peer?.id);

  function newPeer(id) {
    return new Promise((resolve, reject) => {
      const p = id ? new Peer(id, { debug: 0 }) : new Peer({ debug: 0 });
      const t = setTimeout(() => { p.destroy(); reject(new Error('timeout')); }, 9000);
      p.on('open', () => { clearTimeout(t); resolve(p); });
      p.on('error', (e) => { clearTimeout(t); p.destroy(); reject(e); });
    });
  }

  // ---------------------------------------------------------------- host
  async function host(c, self) {
    peer = await newPeer(PREFIX + c);
    isHost = true; room = c; started = false;
    players.clear(); players.set(peer.id, { id: peer.id, ...self, ...look(self) });
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        if (conns.size >= MAX - 1) { conn.send({ t: 'full' }); setTimeout(() => conn.close(), 300); return; }
        conns.set(conn.peer, conn);
      });
      conn.on('data', (m) => fromClient(conn.peer, m));
      conn.on('close', () => { conns.delete(conn.peer); players.delete(conn.peer); rosterOut(); });
      conn.on('error', () => {});
    });
    peer.on('disconnected', () => { try { peer.reconnect(); } catch {} });
    attach(); rosterOut();
    return c;
  }
  const rate = new Map();
  function fromClient(id, m) {
    if (!m || typeof m !== 'object' || typeof m.t !== 'string') return;
    // drop floods: at most 90 messages a second from one player
    const now = performance.now(), r = rate.get(id) || { t: now, n: 0 }; if (now - r.t > 1000) { r.t = now; r.n = 0; } if (++r.n > 90) return; rate.set(id, r);
    if (m.t === 'hi') {
      players.set(id, { id, name: cleanName(m.name), skin: SKIN_RE.test(m.skin) ? m.skin : '#4f8cff', ...look(m) });
      conns.get(id)?.send({ t: 'welcome', level: level(), started, you: id });
      rosterOut(); return;
    }
    if (!players.has(id) || !['s', 'f', 'r', 'd', 'die', 'db'].includes(m.t)) return;
    const out = { ...m, id };
    for (const [pid, c] of conns) if (pid !== id) c.send(out);
    Wreck.remote(id, m);
  }
  function rosterOut() { const l = list(); for (const c of conns.values()) c.send({ t: 'roster', players: l }); Wreck.roster(l, peer?.id); ui.lobby(l, { room, isHost }); }

  // ---------------------------------------------------------------- client
  function join(c, self) {
    return new Promise(async (resolve, reject) => {
      try { peer = await newPeer(); } catch (e) { return reject(e); }
      isHost = false; room = c;
      const conn = peer.connect(PREFIX + c, { reliable: true });
      const t = setTimeout(() => { reject(new Error('peer-unavailable')); leave(true); }, 8000);
      peer.on('error', (e) => { if (e.type === 'peer-unavailable') { clearTimeout(t); reject(e); leave(true); } });
      conn.on('open', () => { hostConn = conn; conn.send({ t: 'hi', ...self }); });
      conn.on('data', (m) => {
        if (!m || typeof m !== 'object') return;
        if (m.t === 'full') { clearTimeout(t); reject(new Error('full')); leave(true); }
        else if (m.t === 'welcome') {
          clearTimeout(t);
          if (typeof m.level === 'string' && m.level !== level()) { const lv = m.level.slice(0, 800); location.href = (lv.startsWith('map:') ? `?map=${encodeURIComponent(lv.slice(4))}` : lv.startsWith('url:') ? `?url=${encodeURIComponent(lv.slice(4))}` : `?user=${encodeURIComponent(lv)}`) + `&room=${c}`; return; }
          attach(); resolve(c); if (m.started) ui.start();
        } else if (m.t === 'roster' && Array.isArray(m.players)) {
          players.clear();
          for (const p of m.players.slice(0, MAX)) if (p && typeof p.id === 'string') players.set(p.id, { id: p.id.slice(0, 64), name: cleanName(p.name), skin: SKIN_RE.test(p.skin) ? p.skin : '#4f8cff', ...look(p) });
          Wreck.roster(list(), peer.id); ui.lobby(list(), { room, isHost });
        } else if (m.t === 'go') ui.start();
        else if (m.t === 'rb') Wreck.remote(null, { t: 'rb' });
        else if (typeof m.id === 'string' && m.id !== peer.id) Wreck.remote(m.id, m);
      });
      conn.on('close', () => { if (peer) { ui.status('The host left the room.'); leave(true); } });
    });
  }

  // ---------------------------------------------------------------- shared
  function attach() {
    Wreck.width = WIDTH;
    Wreck.net = {
      isHost,
      send(m) {
        if (!peer) return;
        if (isHost) { const out = { ...m, id: peer.id }; for (const c of conns.values()) c.send(out); }
        else hostConn?.send(m);
      },
    };
  }
  function leave(quiet) {
    try { peer?.destroy(); } catch {}
    peer = null; hostConn = null; conns.clear(); players.clear(); room = null; isHost = false; started = false;
    Wreck.net = null; Wreck.width = null; Wreck.roster([], null);
    if (!quiet) ui.status(''); ui.left();
  }
  // quick match: join the first open public room, or open one and wait
  async function quick(self) {
    for (let n = 1; n <= 6; n++) {
      const c = 'QUICK' + n;
      try { return await join(c, self); } catch (e) { if (e.message === 'full') continue; }
      try { await host(c, self); startGame(); return c; } catch (e) { if (e.type === 'unavailable-id') continue; throw e; }
    }
    throw new Error('busy');
  }
  function startGame() { if (!isHost) return; started = true; for (const c of conns.values()) c.send({ t: 'go' }); ui.start(); }

  window.WreckNet = {
    init(opts) { ui = { ...ui, ...opts.ui }; level = typeof opts.level === 'function' ? opts.level : () => opts.level; },
    create: (self) => host(code(), self), join, quick, leave, start: startGame,
    get room() { return room; }, get isHost() { return isHost; }, get inRoom() { return !!peer; },
  };
})();
