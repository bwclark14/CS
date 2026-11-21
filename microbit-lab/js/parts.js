/* Bit Bench: part catalogue, bench drawing and wiring rules. */
'use strict';

const PIN_LIST = ['P0','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10','P11','P12','P13','P14','P15','P16','P19','P20'];
const CROC_PINS = ['P0','P1','P2'];                 // the big rings: reachable with crocodile clips
const DISPLAY_PINS = ['P3','P4','P6','P7','P10'];    // shared with the LED display (V2)
const BUTTON_PINS = { P5: 'button A', P11: 'button B' };
const I2C_PINS = ['P19','P20'];
const DRIVER_PINS = { M1: ['P8','P12'], M2: ['P0','P16'] }; // the motor driver board's fixed pins
const SOCKETS = ['M1','M2'];

const CAT = {
  Outputs: { c: 'var(--out)', pcb: '#1F4FA8' },
  Inputs:  { c: 'var(--in)',  pcb: '#5B2A8C' },
  Motors:  { c: 'var(--mot)', pcb: '#2B2B2B' },
  Boards:  { c: 'var(--board)', pcb: '#1E7A44' },
};

const NEO_COLOURS = { red:'#FF2A2A', orange:'#FF8A1F', yellow:'#FFE14A', green:'#2BE36B', blue:'#3A7BFF', indigo:'#6A4BFF', violet:'#C04BFF', purple:'#9B30FF', white:'#FFFFFF', black:'#111111' };
const LED_COLOURS = { red:'#FF3B30', yellow:'#FFD60A', green:'#30D158', blue:'#3A86FF', white:'#F5F5F5' };

const PARTS = {
  led: { name:'LED', cat:'Outputs', pins:['SIG'], kind:'out', w:110, h:120,
    props:{ color:{ label:'Colour', options:Object.keys(LED_COLOURS), def:'red' } },
    blurb:'Lights when its pin is set to 1. Use analog write (0 to 1023) to make it dimmer or brighter.' },
  traffic: { name:'Traffic lights', cat:'Outputs', pins:['R','Y','G'], kind:'out', w:120, h:150,
    blurb:'Three LEDs on one module: red, yellow and green, each on its own pin.' },
  buzzer: { name:'Buzzer', cat:'Outputs', pins:['SIG'], kind:'out', w:110, h:120,
    blurb:'Plays music and tones. micro:bit music always comes out of pin P0 (and the V2 speaker), so wire it to P0.' },
  neopixel: { name:'NeoPixel strip', cat:'Outputs', pins:['DIN'], kind:'out', w:150, h:110,
    props:{ count:{ label:'LEDs', options:['8','12','16'], def:'8' } },
    blurb:'A strip of colour LEDs you control one at a time, all from a single data pin.' },
  servo: { name:'Servo', cat:'Motors', pins:['SIG'], kind:'out', w:130, h:130,
    props:{ mode:{ label:'Type', options:['180°','continuous'], def:'180°' } },
    blurb:'A 180° servo turns its arm to an angle (0 to 180). A continuous servo spins instead: 90 is stop, 0 and 180 are full speed.' },
  motor: { name:'DC motor + wheel', cat:'Motors', pins:['M'], kind:'motor', w:130, h:130,
    props:{ },
    blurb:'Needs a motor driver board: the micro:bit cannot power a motor directly. Plug it into socket M1 or M2.' },
  button: { name:'Push button', cat:'Inputs', pins:['SIG'], kind:'in', w:110, h:120,
    blurb:'Reads 1 while pressed and 0 when released (digital read). Click it on the bench to press it.' },
  pot: { name:'Potentiometer', cat:'Inputs', pins:['SIG'], kind:'in', w:110, h:120,
    blurb:'A dial. Analog read gives 0 to 1023 as you turn it.' },
  ldr: { name:'Light sensor', cat:'Inputs', pins:['SIG'], kind:'in', w:110, h:120,
    blurb:'A light-dependent resistor. Analog read gives a bigger number when it is brighter (0 to 1023).' },
  moisture: { name:'Soil moisture', cat:'Inputs', pins:['SIG'], kind:'in', w:110, h:130,
    blurb:'Push it into soil. Analog read: dry soil gives a low number, wet soil a high one.' },
  pir: { name:'Motion (PIR)', cat:'Inputs', pins:['SIG'], kind:'in', w:110, h:120,
    blurb:'Spots people moving. Digital read gives 1 when it sees motion.' },
  sonar: { name:'Ultrasonic distance', cat:'Inputs', pins:['TRIG','ECHO'], kind:'in', w:140, h:110,
    props:{ mount:{ label:'On rover', options:['front','none'], def:'front' } },
    blurb:'Sends a click of sound and times the echo to measure distance in cm. Use the sonar block with its TRIG and ECHO pins.' },
  line: { name:'Line sensor', cat:'Inputs', pins:['SIG'], kind:'in', w:110, h:110,
    props:{ mount:{ label:'On rover', options:['left','right','centre'], def:'left' } },
    blurb:'Shines infrared at the floor. Digital read gives 1 over a dark line, 0 over the light floor.' },
  breakout: { name:'Edge breakout', cat:'Boards', board:true, w:300, h:130,
    blurb:'Plugs onto the edge connector and gives you every pin, not just the three big rings P0, P1 and P2.' },
  motordriver: { name:'Motor driver board', cat:'Boards', board:true, w:300, h:150,
    blurb:'A breakout with a motor chip and its own battery. Drives motor M1 with pins P8 and P12 and motor M2 with pins P0 and P16.' },
};

/* ---------- geometry ---------- */
const MB = { x: 40, y: 22, w: 250, h: 200 };
const BOARD = { x: 20, y: 210 };
const PADS = { P0: 60, P1: 112, P2: 164, '3V': 210, GND: 240 }; // x offsets on the micro:bit edge
const HEADER = [
  ['P0','P1','P2','P3','P4','P5','P6','P7','P8','P9','P10'],
  ['P11','P12','P13','P14','P15','P16','P19','P20','3V','GND'],
];

function boardPart(project) { return project.parts.find(p => PARTS[p.type].board); }

function pinAnchor(project, pin) {
  const b = boardPart(project);
  if (b) {
    for (let r = 0; r < 2; r++) {
      const i = HEADER[r].indexOf(pin);
      if (i >= 0) return { x: BOARD.x + 22 + i * 26 + (r ? 13 : 0), y: BOARD.y + 36 + r * 30, ok: true };
    }
  }
  if (PADS[pin] !== undefined && CROC_PINS.includes(pin)) return { x: MB.x + PADS[pin], y: MB.y + MB.h - 22, ok: true };
  // unreachable: point at the edge connector
  return { x: MB.x + MB.w / 2, y: MB.y + MB.h - 4, ok: false };
}
function socketAnchor(project, s) {
  const b = boardPart(project);
  if (b && b.type === 'motordriver') return { x: BOARD.x + (s === 'M1' ? 60 : 240), y: BOARD.y + 128, ok: true };
  return { x: MB.x + MB.w / 2, y: MB.y + MB.h - 4, ok: false };
}
function partPinAnchor(p, i) {
  const d = PARTS[p.type], n = d.pins.length, w = partW(p);
  return { x: p.x + w * (i + 1) / (n + 1), y: p.y + d.h - 6 };
}
function partW(p) {
  if (p.type === 'neopixel') return Math.max(150, (+p.props.count) * 15 + 30);
  return PARTS[p.type].w;
}

/* ---------- SVG helpers ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]);
const WIRE_COL = ['#FF5A36','#FFD23F','#3AB8FF','#7CF0A8','#FF7AD9','#B98CFF','#FFFFFF','#FF9F1C'];
function wireColour(pin) { const n = parseInt(String(pin).replace(/\D/g, ''), 10) || 0; return WIRE_COL[n % WIRE_COL.length]; }

function card(p, inner) {
  const d = PARTS[p.type], w = partW(p), h = d.h, cat = CAT[d.cat];
  let pins = '';
  d.pins.forEach((name, i) => {
    const x = w * (i + 1) / (d.pins.length + 1);
    const lab = p.pins[name] || '—';
    pins += `<circle cx="${x}" cy="${h - 6}" r="4.5" fill="#E8C66A" stroke="#7a5f1b"/>` +
            `<text x="${x}" y="${h - 16}" text-anchor="middle" font-size="10" fill="#fff" font-family="JetBrains Mono" opacity=".85">${esc(name)}:${esc(lab)}</text>`;
  });
  return `<rect class="card" x="0" y="0" width="${w}" height="${h}" rx="10" fill="${cat.pcb}" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>` +
    `<circle cx="9" cy="9" r="3" fill="#0006"/><circle cx="${w - 9}" cy="9" r="3" fill="#0006"/>` +
    `<text x="${w / 2}" y="20" text-anchor="middle" font-size="12" font-weight="700" fill="#fff" font-family="Atkinson Hyperlegible">${esc(p.label || d.name)}</text>` +
    inner + pins;
}

const DRAW = {
  led(p) {
    const c = LED_COLOURS[p.props.color] || '#f33';
    return card(p, `<circle data-r="glow" cx="55" cy="58" r="30" fill="${c}" opacity="0" filter="url(#glow)"/>
      <path d="M43 76 v-20 a12 12 0 0 1 24 0 v20 z" data-r="dome" fill="${c}" opacity=".35" stroke="#0005"/>
      <rect x="40" y="76" width="30" height="5" rx="2" fill="#ddd"/>`);
  },
  traffic(p) {
    return card(p, `<rect x="40" y="28" width="40" height="86" rx="8" fill="#111"/>
      <circle data-r="R" cx="60" cy="45" r="11" fill="#FF3B30" opacity=".25"/>
      <circle data-r="Y" cx="60" cy="71" r="11" fill="#FFD60A" opacity=".25"/>
      <circle data-r="G" cx="60" cy="97" r="11" fill="#30D158" opacity=".25"/>`);
  },
  buzzer(p) {
    return card(p, `<circle cx="55" cy="60" r="24" fill="#151515" stroke="#444" stroke-width="2"/><circle cx="55" cy="60" r="5" fill="#333"/>
      <g data-r="waves" opacity="0" stroke="#FFD23F" stroke-width="3" fill="none" stroke-linecap="round">
      <path d="M86 46 q8 14 0 28"/><path d="M94 40 q12 20 0 40"/><path d="M24 46 q-8 14 0 28"/><path d="M16 40 q-12 20 0 40"/></g>`);
  },
  neopixel(p) {
    const n = +p.props.count, w = partW(p);
    let s = `<rect x="10" y="38" width="${w - 20}" height="34" rx="6" fill="#111"/>`;
    for (let i = 0; i < n; i++) s += `<rect data-r="px${i}" x="${18 + i * 15}" y="47" width="11" height="15" rx="2" fill="#333" stroke="#000"/>`;
    return card(p, s);
  },
  servo(p) {
    return card(p, `<rect x="25" y="38" width="80" height="50" rx="6" fill="#2C5BD6" stroke="#0004"/>
      <rect x="15" y="56" width="100" height="10" rx="3" fill="#2C5BD6"/>
      <circle cx="80" cy="63" r="12" fill="#ddd"/>
      <g data-r="horn" transform="rotate(0 80 63)"><rect x="77" y="28" width="6" height="38" rx="3" fill="#fff" stroke="#888"/><circle cx="80" cy="63" r="6" fill="#fff" stroke="#888"/></g>
      <text data-r="ang" x="42" y="104" font-size="11" fill="#fff" font-family="JetBrains Mono">0°</text>`);
  },
  motor(p) {
    let spokes = '';
    for (let i = 0; i < 6; i++) spokes += `<line x1="0" y1="0" x2="0" y2="-24" stroke="#999" stroke-width="3" transform="rotate(${i * 60})"/>`;
    return card(p, `<rect x="12" y="50" width="50" height="30" rx="4" fill="#F4C20D" stroke="#0004"/>
      <g transform="translate(88 64)"><circle r="30" fill="#222"/><circle r="25" fill="#ffcf33"/><g data-r="wheel">${spokes}</g><circle r="6" fill="#fff"/></g>
      <text data-r="spd" x="14" y="44" font-size="11" fill="#fff" font-family="JetBrains Mono">0%</text>`);
  },
  button(p) {
    return card(p, `<g class="press" data-press="1"><rect x="32" y="36" width="46" height="46" rx="6" fill="#ddd" stroke="#888"/>
      <circle data-r="cap" cx="55" cy="59" r="15" fill="#E23A2E" stroke="#8a1d16" stroke-width="2"/></g>`);
  },
  pot(p) {
    return card(p, `<circle cx="55" cy="60" r="24" fill="#2D6CDF" stroke="#0005"/>
      <g data-r="knob"><circle cx="55" cy="60" r="15" fill="#eee"/><rect x="53" y="44" width="4" height="13" fill="#333"/></g>
      <text data-r="val" x="55" y="98" text-anchor="middle" font-size="11" fill="#fff" font-family="JetBrains Mono">0</text>`);
  },
  ldr(p) {
    return card(p, `<circle cx="55" cy="56" r="17" fill="#C9763A" stroke="#7a3d12"/><path d="M45 50 h20 M45 56 h20 M45 62 h20" stroke="#4a2306" stroke-width="2"/>
      <g data-r="sun" fill="#FFD23F"><circle cx="88" cy="38" r="7"/></g>
      <text data-r="val" x="55" y="98" text-anchor="middle" font-size="11" fill="#fff" font-family="JetBrains Mono">0</text>`);
  },
  moisture(p) {
    return card(p, `<path d="M38 32 h34 v30 l-6 46 h-6 l-4-46 h-2 l-4 46 h-6 l-6-46 z" fill="#DCE6A8" stroke="#7a8a2c"/>
      <rect data-r="soil" x="22" y="78" width="66" height="22" rx="4" fill="#6b4a2b" opacity=".85"/>
      <text data-r="val" x="55" y="114" text-anchor="middle" font-size="11" fill="#fff" font-family="JetBrains Mono">0</text>`);
  },
  pir(p) {
    return card(p, `<path d="M30 74 a25 25 0 0 1 50 0 z" fill="#f4f4f4" stroke="#bbb"/><path d="M37 74 a18 18 0 0 1 36 0" fill="none" stroke="#ddd"/>
      <circle data-r="dot" cx="55" cy="88" r="5" fill="#400"/>`);
  },
  sonar(p) {
    return card(p, `<rect x="16" y="34" width="108" height="40" rx="4" fill="#1B6DB3"/>
      <circle cx="44" cy="54" r="16" fill="#c9ccd1" stroke="#777"/><circle cx="44" cy="54" r="10" fill="#333"/>
      <circle cx="96" cy="54" r="16" fill="#c9ccd1" stroke="#777"/><circle cx="96" cy="54" r="10" fill="#333"/>
      <text data-r="val" x="70" y="86" text-anchor="middle" font-size="11" fill="#fff" font-family="JetBrains Mono">0 cm</text>`);
  },
  line(p) {
    return card(p, `<rect x="30" y="34" width="50" height="34" rx="4" fill="#111"/>
      <circle cx="45" cy="51" r="7" fill="#223" stroke="#557"/><circle cx="65" cy="51" r="7" fill="#311" stroke="#755"/>
      <circle data-r="dot" cx="55" cy="78" r="4" fill="#300"/>`);
  },
};

/* micro:bit + board, drawn once per structure change */
function drawMicrobit(project) {
  const { x, y, w, h } = MB;
  let s = `<g id="mb">`;
  s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#1b1b1f" stroke="#000"/>`;
  s += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${h - 6}" rx="12" fill="none" stroke="#333"/>`;
  // logo (touch)
  s += `<g class="mb-logo" data-touch="logo"><ellipse cx="${x + w / 2}" cy="${y + 22}" rx="16" ry="9" fill="none" stroke="#E8C66A" stroke-width="3"/>
        <circle cx="${x + w / 2 - 7}" cy="${y + 22}" r="2.5" fill="#E8C66A"/><circle cx="${x + w / 2 + 7}" cy="${y + 22}" r="2.5" fill="#E8C66A"/></g>`;
  // LEDs
  const gx = x + w / 2 - 50, gy = y + 42;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    s += `<rect id="led${r * 5 + c}" x="${gx + c * 22 + 7}" y="${gy + r * 22 + 3}" width="8" height="14" rx="2" fill="#3a1010"/>`;
  }
  // buttons
  [['A', x + 28], ['B', x + w - 28]].forEach(([n, bx]) => {
    s += `<g class="mb-btn" data-btn="${n}"><rect x="${bx - 15}" y="${y + 80}" width="30" height="30" rx="4" fill="#bbb"/>
          <circle id="btn${n}" cx="${bx}" cy="${y + 95}" r="10" fill="#222"/>
          <text x="${bx}" y="${y + 128}" text-anchor="middle" fill="#fff" font-size="15" font-weight="700" font-family="Atkinson Hyperlegible">${n}</text></g>`;
  });
  // edge pads
  s += `<rect x="${x + 10}" y="${y + h - 40}" width="${w - 20}" height="36" fill="#1b1b1f"/>`;
  for (let i = 0; i < 21; i++) s += `<rect x="${x + 22 + i * 10.3}" y="${y + h - 14}" width="5" height="12" fill="#C9A646"/>`;
  Object.entries(PADS).forEach(([n, px]) => {
    s += `<circle cx="${x + px}" cy="${y + h - 22}" r="12" fill="#C9A646"/><circle cx="${x + px}" cy="${y + h - 22}" r="6" fill="#22413A"/>
          <text x="${x + px}" y="${y + h - 40}" text-anchor="middle" fill="#fff" font-size="11" font-weight="700" font-family="JetBrains Mono">${n.replace('P', '')}</text>`;
  });
  s += `</g>`;
  return s;
}

function drawBoard(b) {
  const { x, y } = BOARD, w = 300, h = b.type === 'motordriver' ? 150 : 110;
  let s = `<g class="part board" data-id="${b.id}">`;
  s += `<rect class="card" x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${b.type === 'motordriver' ? '#7A1F1F' : '#1E7A44'}" stroke="#0006"/>`;
  s += `<rect x="${x + 20}" y="${y - 4}" width="${w - 40}" height="14" rx="3" fill="#111"/>`;
  HEADER.forEach((row, r) => row.forEach((pin, i) => {
    const px = x + 22 + i * 26 + (r ? 13 : 0), py = y + 36 + r * 30;
    const used = b.type === 'motordriver' && [...DRIVER_PINS.M1, ...DRIVER_PINS.M2].includes(pin);
    s += `<rect x="${px - 6}" y="${py - 6}" width="12" height="12" fill="#111"/><circle cx="${px}" cy="${py}" r="3" fill="${used ? '#888' : '#E8C66A'}"/>
          <text x="${px}" y="${py + 17}" text-anchor="middle" font-size="8.5" fill="#fff" font-family="JetBrains Mono" opacity=".9">${pin.replace('P', '')}</text>`;
  }));
  if (b.type === 'motordriver') {
    s += `<rect x="${x + 120}" y="${y + 96}" width="60" height="30" rx="3" fill="#111"/><text x="${x + 150}" y="${y + 115}" text-anchor="middle" font-size="9" fill="#bbb" font-family="JetBrains Mono">DRIVER</text>`;
    [['M1', 60], ['M2', 240]].forEach(([n, ox]) => {
      s += `<rect x="${x + ox - 18}" y="${y + 112}" width="36" height="22" rx="3" fill="#2a8a3a"/><circle cx="${x + ox - 8}" cy="${y + 123}" r="4" fill="#ccc"/><circle cx="${x + ox + 8}" cy="${y + 123}" r="4" fill="#ccc"/>
            <text x="${x + ox}" y="${y + 106}" text-anchor="middle" font-size="11" font-weight="700" fill="#fff" font-family="JetBrains Mono">${n}</text>`;
    });
  }
  s += `<text x="${x + w - 10}" y="${y + 24}" text-anchor="end" font-size="11" font-weight="700" fill="#fff" opacity=".8" font-family="Atkinson Hyperlegible">${esc(PARTS[b.type].name)}</text>`;
  s += `</g>`;
  return s;
}

function wirePath(a, b) {
  const dy = Math.max(40, Math.abs(b.y - a.y) * 0.5);
  return `M${a.x},${a.y} C${a.x},${a.y + dy} ${b.x},${b.y + dy} ${b.x},${b.y}`;
}

/* ---------- wiring rules: these are the lessons ---------- */
function wiringChecks(project) {
  const out = [];
  const b = boardPart(project);
  const boards = project.parts.filter(p => PARTS[p.type].board);
  if (boards.length > 1) out.push({ lvl: 'bad', msg: 'Only one board can plug into the micro:bit edge connector at a time. Remove one of them.' });
  const use = {};
  const claim = (pin, who) => { (use[pin] = use[pin] || []).push(who); };
  if (b && b.type === 'motordriver') { DRIVER_PINS.M1.forEach(p => claim(p, 'motor driver (M1)')); DRIVER_PINS.M2.forEach(p => claim(p, 'motor driver (M2)')); }
  let servos = 0, motors = 0;
  project.parts.forEach(p => {
    const d = PARTS[p.type];
    if (d.board) return;
    const nm = p.label || d.name;
    if (p.type === 'servo') servos++;
    if (p.type === 'motor') {
      motors++;
      if (!b || b.type !== 'motordriver') out.push({ lvl: 'bad', msg: `${nm}: a motor needs a motor driver board. The micro:bit pins can't supply enough current and could be damaged.` });
      return;
    }
    d.pins.forEach(pn => {
      const pin = p.pins[pn];
      if (!pin) { out.push({ lvl: 'bad', msg: `${nm}: its ${pn} wire isn't connected to a pin.` }); return; }
      claim(pin, `${nm} (${pn})`);
      if (!b && !CROC_PINS.includes(pin)) out.push({ lvl: 'bad', msg: `${nm} uses ${pin}. Without a breakout board you can only reach the big rings P0, P1 and P2. Add an edge breakout or choose P0 to P2.` });
      if (DISPLAY_PINS.includes(pin)) out.push({ lvl: 'warn', msg: `${pin} is shared with the LED display. ${nm} may flicker or misread while the display is on. Pick another pin if you can.` });
      if (BUTTON_PINS[pin]) out.push({ lvl: 'warn', msg: `${pin} is also ${BUTTON_PINS[pin]}. Pressing that button will change what ${nm} sees.` });
      if (I2C_PINS.includes(pin)) out.push({ lvl: 'warn', msg: `${pin} carries I2C data for the accelerometer and compass. Avoid it for ${nm}.` });
    });
    if (p.type === 'buzzer' && p.pins.SIG !== 'P0') out.push({ lvl: 'warn', msg: `${nm} is on ${p.pins.SIG}. micro:bit music plays on P0, so the buzzer will stay silent. Move it to P0.` });
  });
  Object.entries(use).forEach(([pin, who]) => { if (who.length > 1) out.push({ lvl: 'bad', msg: `Two things are on ${pin}: ${who.join(' and ')}. Each pin can only do one job.` }); });
  const motorSockets = project.parts.filter(p => p.type === 'motor').map(p => p.pins.M);
  if (new Set(motorSockets).size < motorSockets.length) out.push({ lvl: 'bad', msg: 'Two motors are plugged into the same socket. Use M1 for one and M2 for the other.' });
  if (servos >= 2 && (!b || b.type !== 'motordriver')) out.push({ lvl: 'warn', msg: `${servos} servos can pull more current than the micro:bit's 3V pin gives. On real hardware, power them from a battery pack on a breakout board.` });
  if (!out.length && project.parts.some(p => !PARTS[p.type].board)) out.push({ lvl: 'good', msg: 'Wiring looks good. Every part has its own pin and every pin can be reached.' });
  if (!project.parts.length) out.push({ lvl: 'good', msg: 'Nothing wired yet. Add a part from the Parts list.' });
  return out;
}

function freePin(project, type) {
  const b = boardPart(project);
  const used = new Set();
  project.parts.forEach(p => Object.values(p.pins || {}).forEach(v => used.add(v)));
  if (b && b.type === 'motordriver') [...DRIVER_PINS.M1, ...DRIVER_PINS.M2].forEach(p => used.add(p));
  if (type === 'buzzer' && !used.has('P0')) return 'P0';
  const order = b ? ['P0','P1','P2','P13','P14','P15','P8','P12','P16','P9'] : CROC_PINS;
  return order.find(p => !used.has(p)) || order[0];
}
