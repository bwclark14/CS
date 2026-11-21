/* Bit Bench: the simulated micro:bit (hardware state + program runtime). */
'use strict';

const ICONS = {
  HEART:['.#.#.','#####','#####','.###.','..#..'], SMALL_HEART:['.....','.#.#.','.###.','..#..','.....'],
  HAPPY:['.....','.#.#.','.....','#...#','.###.'], SAD:['.....','.#.#.','.....','.###.','#...#'],
  SURPRISED:['.#.#.','.....','..#..','.#.#.','..#..'], ASLEEP:['.....','##.##','.....','.###.','.....'],
  YES:['.....','....#','...#.','#.#..','.#...'], NO:['#...#','.#.#.','..#..','.#.#.','#...#'],
  ARROW_N:['..#..','.###.','#.#.#','..#..','..#..'], ARROW_S:['..#..','..#..','#.#.#','.###.','..#..'],
  ARROW_E:['..#..','...#.','#####','...#.','..#..'], ARROW_W:['..#..','.#...','#####','.#...','..#..'],
  SKULL:['.###.','#.#.#','#####','.###.','.###.'], DIAMOND:['..#..','.#.#.','#...#','.#.#.','..#..'],
  SQUARE:['#####','#...#','#...#','#...#','#####'], TARGET:['..#..','.###.','##.##','.###.','..#..'],
};
const ICON_LABELS = { HEART:'heart', SMALL_HEART:'small heart', HAPPY:'happy', SAD:'sad', SURPRISED:'surprised', ASLEEP:'asleep', YES:'tick', NO:'cross',
  ARROW_N:'arrow up', ARROW_S:'arrow down', ARROW_E:'arrow right', ARROW_W:'arrow left', SKULL:'skull', DIAMOND:'diamond', SQUARE:'square', TARGET:'target' };

const FONT = {
  '0':['.##.','#..#','#..#','#..#','.##.'],'1':['.#.','##.','.#.','.#.','###'],'2':['###.','...#','.##.','#...','####'],
  '3':['###.','...#','.##.','...#','###.'],'4':['..#.','.##.','#.#.','####','..#.'],'5':['####','#...','###.','...#','###.'],
  '6':['.##.','#...','###.','#..#','.##.'],'7':['####','...#','..#.','.#..','.#..'],'8':['.##.','#..#','.##.','#..#','.##.'],
  '9':['.##.','#..#','.###','...#','.##.'],
  A:['.##.','#..#','####','#..#','#..#'],B:['###.','#..#','###.','#..#','###.'],C:['.###','#...','#...','#...','.###'],
  D:['###.','#..#','#..#','#..#','###.'],E:['####','#...','###.','#...','####'],F:['####','#...','###.','#...','#...'],
  G:['.###','#...','#.##','#..#','.##.'],H:['#..#','#..#','####','#..#','#..#'],I:['###','.#.','.#.','.#.','###'],
  J:['..##','...#','...#','#..#','.##.'],K:['#..#','#.#.','##..','#.#.','#..#'],L:['#...','#...','#...','#...','####'],
  M:['#...#','##.##','#.#.#','#...#','#...#'],N:['#...#','##..#','#.#.#','#..##','#...#'],O:['.##.','#..#','#..#','#..#','.##.'],
  P:['###.','#..#','###.','#...','#...'],Q:['.##.','#..#','#..#','#.##','.###'],R:['###.','#..#','###.','#.#.','#..#'],
  S:['.###','#...','.##.','...#','###.'],T:['#####','..#..','..#..','..#..','..#..'],U:['#..#','#..#','#..#','#..#','.##.'],
  V:['#...#','#...#','#...#','.#.#.','..#..'],W:['#...#','#...#','#.#.#','##.##','#...#'],X:['#..#','#..#','.##.','#..#','#..#'],
  Y:['#...#','.#.#.','..#..','..#..','..#..'],Z:['####','..#.','.#..','#...','####'],
  ' ':['..','..','..','..','..'],'!':['#','#','#','.','#'],'?':['###.','...#','.##.','....','.#..'],'.':['.','.','.','.','#'],
  ',':['..','..','..','.#','#.'],'-':['...','...','###','...','...'],'+':['...','.#.','###','.#.','...'],':':['.','#','.','#','.'],
  '=':['...','###','...','###','...'],'%':['#..#','..#.','.#..','#...','#..#'],"'":['#','#','.','.','.'],
};

const NOTES = { 'Low C':131,'Low D':147,'Low E':165,'Low F':175,'Low G':196,'Low A':220,'Low B':247,
  'Middle C':262,'Middle D':294,'Middle E':330,'Middle F':349,'Middle G':392,'Middle A':440,'Middle B':494,
  'High C':523,'High D':587,'High E':659,'High F':698,'High G':784,'High A':880,'High B':988 };
const MELODIES = {
  DADADADUM:[[392,180],[392,180],[392,180],[311,700]],
  ENTERTAINER:[[294,150],[311,150],[330,150],[523,300],[330,150],[523,300],[330,150],[523,600]],
  BIRTHDAY:[[262,250],[262,250],[294,500],[262,500],[349,500],[330,900]],
  POWER_UP:[[523,120],[659,120],[784,120],[1047,350]],
  JUMP_UP:[[523,90],[587,90],[659,90],[698,90],[784,200]],
  BA_DING:[[988,120],[1319,450]],
};

/* ---------- audio ---------- */
const Audio = {
  ctx: null, osc: null, gain: null, muted: false,
  ensure() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.gain = this.ctx.createGain(); this.gain.gain.value = 0; this.gain.connect(this.ctx.destination);
      this.osc = this.ctx.createOscillator(); this.osc.type = 'square'; this.osc.connect(this.gain); this.osc.start();
    } catch (e) { this.ctx = null; }
  },
  set(freq) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    if (freq > 0 && !this.muted) { this.osc.frequency.setValueAtTime(freq, t); this.gain.gain.setTargetAtTime(0.05, t, 0.005); }
    else this.gain.gain.setTargetAtTime(0, t, 0.005);
  },
};

/* ---------- hardware state ---------- */
const HW = {
  pins: {}, display: new Array(25).fill(0), buttons: { A: false, B: false }, logo: false,
  temp: 21, light: 128, accel: { x: 0, y: 0, z: -1023 }, tone: 0, motors: { M1: 0, M2: 0 }, neo: {}, activity: {}, reads: {},
  reset() {
    this.pins = {}; this.display.fill(0); this.tone = 0; this.motors = { M1: 0, M2: 0 }; this.neo = {}; this.activity = {}; this.reads = {};
    Audio.set(0);
  },
  out(pin) { return this.pins[pin]; },
  ledLevel(pin) {
    const o = this.pins[pin]; if (!o) return 0;
    if (o.kind === 'd') return o.v ? 1 : 0;
    if (o.kind === 'a') return Math.max(0, Math.min(1, o.v / 1023));
    return 0;
  },
  servoValue(pin) { const o = this.pins[pin]; return o && o.kind === 's' ? o.v : null; },
};

/* What a sensor part currently reads. The arena overrides sonar and line sensors in rover mode. */
function sensorValue(p) {
  if (typeof Arena !== 'undefined' && Arena.active()) {
    const v = Arena.sensorFor(p); if (v !== undefined) return v;
  }
  const s = p.state || {};
  switch (p.type) {
    case 'button': return s.pressed ? 1 : 0;
    case 'pir': return s.on ? 1 : 0;
    case 'line': return s.on ? 1 : 0;
    case 'pot': case 'ldr': case 'moisture': return s.value | 0;
    case 'sonar': return s.value == null ? 100 : s.value;
  }
  return 0;
}
function inputOnPin(pin) {
  return App.project.parts.find(p => PARTS[p.type].kind === 'in' && p.type !== 'sonar' && p.pins.SIG === pin);
}
function readDigital(pin) {
  if (pin === 'P5') return HW.buttons.A ? 0 : 1;
  if (pin === 'P11') return HW.buttons.B ? 0 : 1;
  const p = inputOnPin(pin);
  if (p) { const v = sensorValue(p); return ['pot','ldr','moisture'].includes(p.type) ? (v > 511 ? 1 : 0) : v; }
  const o = HW.pins[pin]; return o ? (o.v ? 1 : 0) : 0;
}
function readAnalog(pin) {
  const p = inputOnPin(pin);
  if (p) { const v = sensorValue(p); return ['pot','ldr','moisture'].includes(p.type) ? v : v * 1023; }
  const o = HW.pins[pin]; if (!o) return 0;
  return o.kind === 'd' ? o.v * 1023 : (o.kind === 'a' ? o.v : 0);
}

/* ---------- runtime ---------- */
class StopSignal extends Error {}
const RT = {
  gen: 0, running: false, t0: 0, h: null, busy: new Set(), warned: new Set(), steps: new Map(), stepDelay: 0, vars: null,
  now() { return performance.now() - this.t0; },
  onState: () => {}, onError: () => {}, serial: () => {},

  start(code) {
    this.stop(true);
    const gen = ++this.gen;
    this.h = { start: [], forever: [], button: { A: [], B: [], AB: [] }, shake: [], logo: [] };
    this.busy = new Set(); this.warned = new Set();
    HW.reset(); this.t0 = performance.now(); this.running = true; this.steps = new Map(); this.vars = null;
    Monitor.reset();
    const mb = makeApi(gen);
    let program;
    try { program = new Function('mb', '"use strict";\n' + code); }
    catch (e) { this.running = false; this.onError('Your program could not start: ' + e.message); this.onState(false); return; }
    this.onState(true);
    (async () => {
      program(mb);
      for (const fn of this.h.start) await fn();
      for (const fn of this.h.forever) {
        (async () => { for (;;) { await fn(); await mb.pause(20); } })().catch(e => this.fail(e, gen));
      }
    })().catch(e => this.fail(e, gen));
  },
  stop(silent) {
    this.gen++; this.running = false; HW.reset();
    if (!silent) this.onState(false);
  },
  fail(e, gen) {
    if (e instanceof StopSignal || gen !== this.gen) return;
    console.error(e);
    this.onError('Program error: ' + (e && e.message ? e.message : e));
    this.stop();
  },
  fire(kind, key) {
    if (!this.running || !this.h) return;
    const list = key ? this.h[kind][key] : this.h[kind];
    const gen = this.gen;
    const what = kind === 'button' ? `Button ${key === 'AB' ? 'A+B' : key} pressed` : kind === 'shake' ? 'micro:bit shaken' : 'Logo touched';
    const hat = kind === 'button' ? `on button ${key === 'AB' ? 'A+B' : key} pressed` : kind === 'shake' ? 'on shake' : 'on logo pressed';
    Monitor.event(list && list.length ? `${what}: the "${hat}" blocks run` : `${what}. No "${hat}" block is listening, so nothing happens.`);
    (list || []).forEach(fn => {
      if (this.busy.has(fn)) return;
      this.busy.add(fn);
      fn().catch(e => this.fail(e, gen)).finally(() => this.busy.delete(fn));
    });
  },
  warnOnce(key, msg) { if (this.warned.has(key)) return; this.warned.add(key); this.serial('⚠ ' + msg); },
};

function glyphCols(ch) {
  const g = FONT[ch] || FONT[String(ch).toUpperCase()] || FONT['?'];
  const w = g[0].length, cols = [];
  for (let c = 0; c < w; c++) cols.push(g.map(row => row[c] === '#' ? 9 : 0));
  return cols;
}
function fmtNum(n) {
  n = Number(n);
  if (!isFinite(n)) return String(n);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

function makeApi(gen) {
  const alive = () => { if (RT.gen !== gen) throw new StopSignal(); };
  const sleep = ms => new Promise((res, rej) => setTimeout(() => (RT.gen === gen ? res() : rej(new StopSignal())), ms));
  let ticks = 0;
  const act = (pin, dir, val) => { HW.activity[pin] = { dir, val, t: performance.now() }; };
  const setImage = rows => { for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) HW.display[r * 5 + c] = rows[r][c] === '#' ? 9 : 0; };
  const showStatic = ch => {
    HW.display.fill(0);
    const cols = glyphCols(ch), off = Math.floor((5 - cols.length) / 2);
    cols.forEach((col, i) => col.forEach((v, r) => { if (off + i >= 0 && off + i < 5) HW.display[r * 5 + off + i] = v; }));
  };
  const scroll = async text => {
    const cols = [];
    for (const ch of String(text)) { cols.push(...glyphCols(ch)); cols.push([0, 0, 0, 0, 0]); }
    for (let i = 0; i <= cols.length + 4; i++) {
      alive();
      for (let c = 0; c < 5; c++) {
        const col = cols[i - 4 + c] || [0, 0, 0, 0, 0];
        for (let r = 0; r < 5; r++) HW.display[r * 5 + c] = col[r];
      }
      await sleep(95);
    }
  };
  const pinPart = (type, key, pin) => App.project.parts.find(p => p.type === type && p.pins[key] === pin);
  const neoArr = pin => {
    if (!HW.neo[pin]) { const p = pinPart('neopixel', 'DIN', pin); HW.neo[pin] = new Array(p ? +p.props.count : 8).fill('black'); }
    return HW.neo[pin];
  };
  const api = {
    onStart(fn) { RT.h.start.push(fn); }, forever(fn) { RT.h.forever.push(fn); },
    onButton(b, fn) { RT.h.button[b].push(fn); }, onShake(fn) { RT.h.shake.push(fn); }, onLogo(fn) { RT.h.logo.push(fn); },
    async pause(ms) { alive(); await sleep(Math.max(0, Number(ms) || 0)); },
    step(id) { alive(); RT.steps.set(id, performance.now()); if (RT.stepDelay) return sleep(RT.stepDelay); },
    watchVars(getters) { RT.vars = getters; },
    async tick() { alive(); if (++ticks % 40 === 0) await sleep(0); },
    // display
    showIcon(name) { alive(); setImage(ICONS[name] || ICONS.HEART); Monitor.display(`shows the ${ICON_LABELS[name] || name} icon`); },
    showLeds(rows) { alive(); setImage(rows); Monitor.display('shows your LED pattern'); },
    async showNumber(n) { alive(); const s = fmtNum(n); Monitor.display(s.length === 1 ? `shows ${s}` : `scrolls ${s}`); if (s.length === 1) showStatic(s); else await scroll(s); },
    async showString(s) { alive(); s = String(s); Monitor.display(s.length <= 1 ? `shows "${s}"` : `scrolls "${s}"`); if (s.length <= 1) showStatic(s || ' '); else await scroll(s); },
    clear() { alive(); HW.display.fill(0); Monitor.display('cleared'); },
    plot(x, y) { alive(); x = Math.round(x); y = Math.round(y); if (x >= 0 && x < 5 && y >= 0 && y < 5) HW.display[y * 5 + x] = 9; },
    unplot(x, y) { alive(); x = Math.round(x); y = Math.round(y); if (x >= 0 && x < 5 && y >= 0 && y < 5) HW.display[y * 5 + x] = 0; },
    // input
    buttonPressed(b) { return b === 'AB' ? HW.buttons.A && HW.buttons.B : !!HW.buttons[b]; },
    logoTouched() { return HW.logo; },
    temperature() { return Math.round(HW.temp); },
    lightLevel() { return Math.round(HW.light); },
    acceleration(axis) { return Math.round(HW.accel[axis] || 0); },
    runningTime() { return Math.round(performance.now() - RT.t0); },
    // pins
    digitalWrite(pin, v) { alive(); HW.pins[pin] = { kind: 'd', v: Number(v) ? 1 : 0 }; act(pin, 'out', HW.pins[pin].v); Monitor.out(pin); },
    analogWrite(pin, v) { alive(); HW.pins[pin] = { kind: 'a', v: Math.max(0, Math.min(1023, Math.round(Number(v) || 0))) }; act(pin, 'out', HW.pins[pin].v); Monitor.out(pin); },
    servoWrite(pin, a) { alive(); HW.pins[pin] = { kind: 's', v: Math.round(Math.max(0, Math.min(180, Number(a) || 0))) }; act(pin, 'out', HW.pins[pin].v); Monitor.out(pin); },
    digitalRead(pin) { const v = readDigital(pin); act(pin, 'in', v); Monitor.read(pin, v); return v; },
    analogRead(pin) { const v = Math.round(readAnalog(pin)); act(pin, 'in', v); Monitor.read(pin, v); return v; },
    map(v, a, b, c, d) { return b === a ? c : (Number(v) - a) * (d - c) / (b - a) + c; },
    // music
    async playTone(freq, ms) { alive(); HW.tone = Number(freq) || 0; Audio.set(HW.tone); act('P0', 'out', HW.tone); Monitor.tone(HW.tone); try { await sleep(Math.max(0, Number(ms) || 0)); } finally { HW.tone = 0; Audio.set(0); } await sleep(10); },
    async playMelody(name) { for (const [f, ms] of MELODIES[name] || []) await api.playTone(f, ms); },
    stopMusic() { HW.tone = 0; Audio.set(0); },
    // sensors
    distance(trig, echo) {
      const p = App.project.parts.find(q => q.type === 'sonar' && q.pins.TRIG === trig && q.pins.ECHO === echo);
      if (!p) { RT.warnOnce('sonar' + trig + echo, `No ultrasonic sensor is wired with TRIG ${trig} and ECHO ${echo}, so it reads 0.`); return 0; }
      const v = Math.round(sensorValue(p));
      act(trig, 'out', 1); act(echo, 'in', v); Monitor.read(echo, v);
      return v;
    },
    // motors
    motor(m, speed) {
      alive();
      const b = boardPart(App.project);
      if (!b || b.type !== 'motordriver') RT.warnOnce('nodriver', 'Motor blocks need a motor driver board on the bench.');
      speed = Math.max(-100, Math.min(100, Number(speed) || 0));
      HW.motors[m] = speed; act(m, 'out', speed); Monitor.motor(m);
      const [a, c] = DRIVER_PINS[m], duty = Math.round(Math.abs(speed) * 10.23);
      HW.pins[a] = { kind: 'a', v: speed >= 0 ? duty : 0 }; HW.pins[c] = { kind: 'a', v: speed < 0 ? duty : 0 };
    },
    motorStop(m) { (m === 'both' ? ['M1', 'M2'] : [m]).forEach(k => api.motor(k, 0)); },
    // neopixel
    neoShowColour(pin, col) { alive(); const a = neoArr(pin); a.fill(col); act(pin, 'out', col); Monitor.neo(pin); },
    neoSetPixel(pin, i, col) { alive(); const a = neoArr(pin); i = Math.round(i); if (i >= 0 && i < a.length) a[i] = col; act(pin, 'out', col); Monitor.neo(pin); },
    neoClear(pin) { alive(); neoArr(pin).fill('black'); act(pin, 'out', 'off'); Monitor.neo(pin); },
    // serial
    serial(v) { alive(); RT.serial(typeof v === 'number' ? fmtNum(v) : String(v)); },
  };
  return api;
}
