/* Bit Bench: top-down rover arena. World is 600 x 400 units; 1 unit = 0.5 cm. */
'use strict';

const ARENAS = {
  room: {
    name: 'Obstacle room', start: { x: 70, y: 330, h: -Math.PI / 2 },
    rects: [{ x: 170, y: 0, w: 18, h: 200 }, { x: 380, y: 200, w: 18, h: 200 }, { x: 260, y: 90, w: 60, h: 50 }, { x: 470, y: 70, w: 50, h: 50 }],
  },
  line: {
    name: 'Line track', start: { x: 300, y: 72, h: 0 }, rects: [],
    line: (() => { const pts = []; for (let i = 0; i <= 96; i++) { const a = -Math.PI / 2 + i / 96 * Math.PI * 2;
      const wob = 1 + 0.12 * Math.sin(a * 3); pts.push({ x: 300 + 225 * Math.cos(a) * wob, y: 200 + 128 * Math.sin(a) }); } return pts; })(),
  },
  maze: {
    name: 'Maze', start: { x: 50, y: 350, h: -Math.PI / 2 },
    rects: [{ x: 100, y: 120, w: 16, h: 280 }, { x: 100, y: 120, w: 160, h: 16 }, { x: 220, y: 240, w: 16, h: 160 }, { x: 236, y: 240, w: 140, h: 16 },
            { x: 340, y: 0, w: 16, h: 170 }, { x: 460, y: 120, w: 16, h: 280 }, { x: 476, y: 120, w: 60, h: 16 }],
    goal: { x: 520, y: 340, r: 30 },
  },
};

const Arena = {
  key: 'room', rover: null, trail: [], stats: null, canvas: null, ctx: null, wasBumping: false,
  init(canvas) { this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.reset(); },
  active() { return App.view === 'arena'; },
  def() { return ARENAS[this.key]; },
  setArena(k) { this.key = k; this.reset(); },
  reset() {
    const s = this.def().start;
    this.rover = { x: s.x, y: s.y, h: s.h };
    this.trail = []; this.wasBumping = false;
    this.stats = { dist: 0, bumps: 0, onLine: 0, moving: 0, goal: false, t: 0 };
  },
  hasRover() {
    const p = App.project.parts, b = boardPart(App.project);
    const m1 = p.some(q => q.type === 'motor' && q.pins.M === 'M1'), m2 = p.some(q => q.type === 'motor' && q.pins.M === 'M2');
    return { ok: !!(b && b.type === 'motordriver' && m1 && m2), driver: !!(b && b.type === 'motordriver'), m1, m2 };
  },
  blocked(x, y, r) {
    if (x - r < 0 || y - r < 0 || x + r > 600 || y + r > 400) return true;
    return this.def().rects.some(q => x + r > q.x && x - r < q.x + q.w && y + r > q.y && y - r < q.y + q.h);
  },
  solidAt(x, y) { return this.blocked(x, y, 0); },
  ray(x, y, h) {
    const dx = Math.cos(h), dy = Math.sin(h);
    for (let d = 0; d < 400; d += 1) if (this.solidAt(x + dx * d, y + dy * d)) return d;
    return 400;
  },
  onLine(x, y) {
    const L = this.def().line; if (!L) return false;
    for (let i = 0; i < L.length - 1; i++) {
      const a = L[i], b = L[i + 1], vx = b.x - a.x, vy = b.y - a.y;
      const t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / (vx * vx + vy * vy)));
      const px = a.x + vx * t - x, py = a.y + vy * t - y;
      if (px * px + py * py < 9 * 9) return true;
    }
    return false;
  },
  sensorPos(mount) {
    const r = this.rover, fx = Math.cos(r.h), fy = Math.sin(r.h), lx = Math.sin(r.h), ly = -Math.cos(r.h);
    const side = mount === 'left' ? 10 : mount === 'right' ? -10 : 0;
    return { x: r.x + fx * 17 + lx * side, y: r.y + fy * 17 + ly * side };
  },
  sensorFor(p) {
    if (!this.hasRover().ok) return undefined;
    if (p.type === 'sonar' && p.props.mount === 'front') {
      const r = this.rover;
      return Math.min(200, this.ray(r.x + Math.cos(r.h) * 18, r.y + Math.sin(r.h) * 18, r.h) * 0.5);
    }
    if (p.type === 'line') { const s = this.sensorPos(p.props.mount); return this.onLine(s.x, s.y) ? 1 : 0; }
    return undefined;
  },
  step(dt) {
    if (!RT.running || !this.hasRover().ok) return;
    const r = this.rover, L = HW.motors.M1 * 0.6, R = HW.motors.M2 * 0.6; // units per second
    const v = (L + R) / 2, w = (R - L) / 26;
    const steps = 4;
    let bump = false;
    for (let i = 0; i < steps; i++) {
      const d = dt / steps;
      const nh = r.h - w * d; // screen coords: positive right-wheel speed turns left (anticlockwise)
      const nx = r.x + Math.cos(nh) * v * d, ny = r.y + Math.sin(nh) * v * d;
      if (this.blocked(nx, ny, 17)) { bump = true; if (!this.blocked(r.x, r.y, 17)) r.h = nh; }
      else { this.stats.dist += Math.hypot(nx - r.x, ny - r.y); r.x = nx; r.y = ny; r.h = nh; }
    }
    if (bump && !this.wasBumping) this.stats.bumps++;
    this.wasBumping = bump;
    this.stats.t += dt;
    if (Math.abs(v) > 1 || Math.abs(w) > 0.05) {
      this.stats.moving += dt;
      if (this.def().line && this.onLine(r.x, r.y)) this.stats.onLine += dt;
    }
    const g = this.def().goal;
    if (g && Math.hypot(r.x - g.x, r.y - g.y) < g.r) this.stats.goal = true;
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last.x - r.x, last.y - r.y) > 4) { this.trail.push({ x: r.x, y: r.y }); if (this.trail.length > 600) this.trail.shift(); }
  },
  draw() {
    const c = this.ctx, S = 2; if (!c) return;
    c.setTransform(S, 0, 0, S, 0, 0);
    c.fillStyle = '#ECE8DC'; c.fillRect(0, 0, 600, 400);
    c.strokeStyle = 'rgba(0,0,0,.06)'; c.lineWidth = 0.5;
    for (let x = 0; x <= 600; x += 20) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 400); c.stroke(); }
    for (let y = 0; y <= 400; y += 20) { c.beginPath(); c.moveTo(0, y); c.lineTo(600, y); c.stroke(); }
    const d = this.def();
    if (d.line) { c.strokeStyle = '#111'; c.lineWidth = 16; c.lineJoin = 'round'; c.beginPath(); d.line.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke(); }
    if (d.goal) { c.fillStyle = 'rgba(30,138,76,.25)'; c.beginPath(); c.arc(d.goal.x, d.goal.y, d.goal.r, 0, 7); c.fill(); c.fillStyle = '#1E7A44'; c.font = 'bold 12px sans-serif'; c.textAlign = 'center'; c.fillText('FINISH', d.goal.x, d.goal.y + 4); }
    c.fillStyle = '#5B4636'; d.rects.forEach(q => c.fillRect(q.x, q.y, q.w, q.h));
    c.strokeStyle = '#5B4636'; c.lineWidth = 6; c.strokeRect(3, 3, 594, 394);
    // trail
    c.strokeStyle = 'rgba(255,90,54,.45)'; c.lineWidth = 2; c.beginPath();
    this.trail.forEach((p, i) => i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y)); c.stroke();
    const st = this.hasRover();
    const r = this.rover;
    c.save(); c.translate(r.x, r.y); c.rotate(r.h);
    // sonar beam
    const sonar = App.project.parts.find(p => p.type === 'sonar' && p.props.mount === 'front');
    if (sonar && st.ok) {
      const dist = this.ray(r.x + Math.cos(r.h) * 18, r.y + Math.sin(r.h) * 18, r.h);
      c.fillStyle = 'rgba(58,184,255,.18)'; c.beginPath(); c.moveTo(18, 0); c.lineTo(18 + Math.min(dist, 400), -10); c.lineTo(18 + Math.min(dist, 400), 10); c.closePath(); c.fill();
    }
    c.fillStyle = '#222'; c.fillRect(-12, -19, 18, 6); c.fillRect(-12, 13, 18, 6); // wheels
    c.fillStyle = st.ok ? '#C0392B' : '#888'; c.beginPath(); c.roundRect(-17, -14, 34, 28, 6); c.fill();
    c.fillStyle = '#1b1b1f'; c.fillRect(-9, -9, 16, 18);
    for (let i = 0; i < 25; i++) { const on = HW.display[i] > 0; c.fillStyle = on ? '#FF3B30' : '#3a1010'; c.fillRect(-7 + (i % 5) * 3, -7 + Math.floor(i / 5) * 3, 2, 2); }
    if (sonar) { c.fillStyle = '#c9ccd1'; c.beginPath(); c.arc(15, -6, 3.5, 0, 7); c.arc(15, 6, 3.5, 0, 7); c.fill(); }
    c.restore();
    App.project.parts.filter(p => p.type === 'line').forEach(p => {
      const s = this.sensorPos(p.props.mount), on = st.ok && this.onLine(s.x, s.y);
      c.fillStyle = on ? '#30D158' : '#FFD23F'; c.beginPath(); c.arc(s.x, s.y, 2.6, 0, 7); c.fill();
    });
    if (!st.ok) {
      c.fillStyle = 'rgba(22,33,63,.82)'; c.fillRect(120, 140, 360, 120);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 15px sans-serif';
      c.fillText('Build a rover first', 300, 170);
      c.font = '12px sans-serif';
      c.fillText((st.driver ? '✓' : '✗') + ' Motor driver board', 300, 196);
      c.fillText((st.m1 ? '✓' : '✗') + ' DC motor in socket M1 (left wheel)', 300, 214);
      c.fillText((st.m2 ? '✓' : '✗') + ' DC motor in socket M2 (right wheel)', 300, 232);
    }
  },
  info() {
    const s = this.stats;
    return `left M1 ${String(Math.round(HW.motors.M1)).padStart(4)}%   right M2 ${String(Math.round(HW.motors.M2)).padStart(4)}%\n` +
      `travelled ${(s.dist * 0.5 / 100).toFixed(2)} m   bumps ${s.bumps}` +
      (this.def().line ? `   on line ${s.moving ? Math.round(100 * s.onLine / s.moving) : 0}%` : '') +
      (this.def().goal ? `   ${s.goal ? 'FINISHED ✓' : 'find the finish'}` : '');
  },
};
