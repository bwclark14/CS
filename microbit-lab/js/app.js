/* Bit Bench: UI glue. */
'use strict';

const $ = s => document.querySelector(s);
const SAVE_KEY = 'bitbench.v1';
const store = {
  get() { try { return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { return null; } },
  set(v) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(v)); } catch (e) {} },
};
const DEFAULT_STATE = { pot: { value: 512 }, ldr: { value: 600 }, moisture: { value: 600 }, sonar: { value: 100 }, button: { pressed: false }, pir: { on: false }, line: { on: false } };

const App = {
  project: { parts: [], nextId: 1 }, view: 'bench', ws: null, selected: null, done: {}, mission: null, checking: null,

  init() {
    const saved = store.get();
    if (saved && saved.project) this.loadProject(saved.project, false);
    this.done = (saved && saved.done) || {};
    this.ws = Blockly.inject('blockly', {
      toolbox: TOOLBOX, renderer: 'zelos', media: 'https://unpkg.com/blockly@10.4.3/media/', trashcan: true, sounds: false,
      zoom: { controls: true, wheel: true, startScale: 0.8, maxScale: 2, minScale: 0.4 },
      grid: { spacing: 24, length: 2, colour: '#e3e0d8', snap: true }, move: { scrollbars: true, drag: true, wheel: false },
    });
    this.ws.addChangeListener(Blockly.Events.disableOrphans);
    try { Blockly.serialization.workspaces.load((saved && saved.blocks) || STARTER, this.ws); }
    catch (e) { Blockly.serialization.workspaces.load(STARTER, this.ws); }
    this.ws.addChangeListener(e => { if (e.isUiEvent) return; this.codeChanged(); });

    Arena.init($('#arena'));
    RT.onState = on => this.paintRunState(on);
    RT.onError = msg => { this.serial('✗ ' + msg); this.toast(msg); this.dock('serial'); };
    RT.serial = line => this.serial(line);

    this.bindUi();
    this.renderPalette(); this.renderAll(); this.renderMissions();
    if (!saved) setTimeout(() => $('#help').showModal(), 300);
    let last = performance.now();
    const frame = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; this.tick(dt, now); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
    window.addEventListener('resize', () => Blockly.svgResize(this.ws));
  },

  /* ---------- saving ---------- */
  cleanProject() {
    return { nextId: this.project.nextId, parts: this.project.parts.map(p => ({ id: p.id, type: p.type, x: Math.round(p.x), y: Math.round(p.y), pins: p.pins, props: p.props, state: p.state })) };
  },
  save() { clearTimeout(this._sv); this._sv = setTimeout(() => store.set({ project: this.cleanProject(), blocks: Blockly.serialization.workspaces.save(this.ws), done: this.done }), 300); },
  loadProject(pr, render = true) {
    const parts = (pr.parts || []).filter(p => PARTS[p.type]).map((p, i) => {
      const d = PARTS[p.type], props = {};
      Object.entries(d.props || {}).forEach(([k, v]) => { props[k] = (p.props && v.options.includes(p.props[k])) ? p.props[k] : v.def; });
      return { id: p.id || 'p' + (i + 1), type: p.type, x: +p.x || 400, y: +p.y || 40, pins: Object.assign({}, p.pins), props, state: Object.assign({}, DEFAULT_STATE[p.type], p.state) };
    });
    this.project = { parts, nextId: Math.max(pr.nextId || 1, parts.length + 1) };
    this.selected = null;
    if (render) this.renderAll();
  },

  /* ---------- parts ---------- */
  slotFree(x, y, w, h, skip) {
    if (x < MB.x + MB.w + 20 && y < BOARD.y + 160 && x + w > 0) return false;
    return !this.project.parts.some(p => p !== skip && !PARTS[p.type].board && x < p.x + partW(p) + 10 && x + w + 10 > p.x && y < p.y + PARTS[p.type].h + 10 && y + h + 10 > p.y);
  },
  findSlot(w, h) {
    for (let y = 20; y + h <= 720; y += 30) for (let x = 320; x + w <= 830; x += 30) if (this.slotFree(x, y, w, h)) return { x, y };
    for (let y = 390; y + h <= 600; y += 30) for (let x = 20; x + w <= 330; x += 30) if (this.slotFree(x, y, w, h)) return { x, y };
    return { x: 340 + Math.random() * 400, y: 30 + Math.random() * 300 };
  },
  addPart(type, opts) {
    const d = PARTS[type];
    opts = opts || {};
    if (d.board) {
      const old = boardPart(this.project);
      if (old) { this.project.parts = this.project.parts.filter(p => p !== old); this.toast(`Swapped the ${PARTS[old.type].name} for the ${d.name}.`); }
    }
    const props = {};
    Object.entries(d.props || {}).forEach(([k, v]) => { props[k] = (opts.props && opts.props[k]) || v.def; });
    const p = { id: 'p' + this.project.nextId++, type, x: 0, y: 0, pins: {}, props, state: Object.assign({}, DEFAULT_STATE[type]) };
    if (!d.board) {
      const pos = opts.x != null ? { x: opts.x, y: opts.y } : this.findSlot(partW(p), d.h);
      p.x = pos.x; p.y = pos.y;
    }
    this.project.parts.push(p);
    (d.pins || []).forEach(pn => {
      if (opts.pins && opts.pins[pn]) p.pins[pn] = opts.pins[pn];
      else if (pn === 'M') { const used = this.project.parts.filter(q => q.type === 'motor' && q !== p).map(q => q.pins.M); p.pins.M = SOCKETS.find(s => !used.includes(s)) || 'M1'; }
      else p.pins[pn] = freePin(this.project, type);
    });
    if (!opts.quiet) { this.selected = p.id; this.renderAll(); this.save(); }
    return p;
  },
  removePart(id) {
    this.project.parts = this.project.parts.filter(p => p.id !== id);
    if (this.selected === id) this.selected = null;
    this.renderAll(); this.save();
  },
  part(id) { return this.project.parts.find(p => p.id === id); },

  renderPalette() {
    const cats = {};
    Object.entries(PARTS).forEach(([k, d]) => (cats[d.cat] = cats[d.cat] || []).push(k));
    let h = '';
    ['Boards', 'Outputs', 'Inputs', 'Motors'].forEach(c => {
      h += `<div class="pal-cat" style="--c:${CAT[c].c}">${c}</div><div class="pal-grid">`;
      cats[c].forEach(k => { h += `<button class="pal-item" data-add="${k}" title="${esc(PARTS[k].blurb)}">${miniIcon(k)}<span>${esc(PARTS[k].name)}</span></button>`; });
      h += '</div>';
    });
    $('#palette').innerHTML = h;
  },

  renderAll() {
    this.renderBench(); this.renderInspector(); this.renderInputs(); this.renderChecks();
    if (this.codeTab === 'python') this.renderPython();
  },

  renderBench() {
    const pr = this.project;
    let s = `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>`;
    const b = boardPart(pr);
    if (b) s += drawBoard(b).replace('class="part board"', `class="part board${this.selected === b.id ? ' sel' : ''}"`);
    s += drawMicrobit(pr);
    pr.parts.forEach(p => {
      if (PARTS[p.type].board) return;
      s += `<g class="part${this.selected === p.id ? ' sel' : ''}" data-id="${p.id}" transform="translate(${p.x} ${p.y})">${DRAW[p.type](p)}</g>`;
    });
    s += `<g id="wires" pointer-events="none">${this.wiresSvg()}</g>`;
    if (!pr.parts.length) s += `<text x="525" y="130" text-anchor="middle" fill="#fff" opacity=".55" font-size="18" font-family="Atkinson Hyperlegible">Add parts from the Parts list</text>`;
    const svg = $('#bench');
    svg.innerHTML = s;
    // fit the view to what is on the bench so parts stay a readable size
    let mx = MB.x + MB.w + 20, my = (b ? BOARD.y + 160 : MB.y + MB.h + 20);
    pr.parts.forEach(p => { if (!PARTS[p.type].board) { mx = Math.max(mx, p.x + partW(p) + 20); my = Math.max(my, p.y + PARTS[p.type].h + 20); } });
    mx = Math.max(mx, 620); my = Math.max(my, 400);
    if (!pr.parts.length) mx = Math.max(mx, 760);
    svg.setAttribute('viewBox', `0 0 ${Math.ceil(mx)} ${Math.ceil(my)}`);
    pr.parts.forEach(p => {
      const g = $(`#bench [data-id="${p.id}"]`); p._el = {};
      if (g) g.querySelectorAll('[data-r]').forEach(e => { p._el[e.dataset.r] = e; });
    });
    this.leds = [...Array(25)].map((_, i) => $('#led' + i));
  },
  wiresSvg() {
    const pr = this.project;
    let s = '';
    pr.parts.forEach(p => {
      const d = PARTS[p.type]; if (d.board) return;
      d.pins.forEach((pn, i) => {
        const pin = p.pins[pn]; if (!pin) return;
        const a = pn === 'M' ? socketAnchor(pr, pin) : pinAnchor(pr, pin);
        const e = partPinAnchor(p, i);
        const col = pn === 'M' ? (pin === 'M1' ? '#FF5A36' : '#3AB8FF') : wireColour(pin);
        s += `<path class="wire${a.ok ? '' : ' badwire'}" d="${wirePath(a, e)}" stroke="${a.ok ? col : '#FF4D4D'}"/>`;
        s += `<circle cx="${a.x}" cy="${a.y}" r="4" fill="${a.ok ? col : '#FF4D4D'}"/>`;
      });
    });
    return s;
  },

  renderInspector() {
    const el = $('#inspector'), p = this.part(this.selected);
    if (!p) { el.hidden = true; return; }
    const d = PARTS[p.type];
    let h = `<h3>${esc(d.name)}</h3><p>${esc(d.blurb)}</p>`;
    (d.pins || []).forEach(pn => {
      const opts = pn === 'M' ? SOCKETS : PIN_LIST;
      h += `<label>${pn === 'M' ? 'Socket' : esc(pn) + ' wire'} <select data-pin="${pn}">${opts.map(o => `<option${o === p.pins[pn] ? ' selected' : ''}>${o}</option>`).join('')}</select></label>`;
    });
    Object.entries(d.props || {}).forEach(([k, v]) => {
      h += `<label>${esc(v.label)} <select data-prop="${k}">${v.options.map(o => `<option${o === p.props[k] ? ' selected' : ''}>${esc(o)}</option>`).join('')}</select></label>`;
    });
    h += `<div class="row"><button class="del" data-del="${p.id}">Remove</button><button class="btn" data-desel>Done</button></div>`;
    el.innerHTML = h; el.hidden = false;
  },

  renderInputs() {
    const pr = this.project, arena = Arena.active() && Arena.hasRover().ok;
    const slider = (id, label, min, max, val, unit) => `<div class="inp"><b>${label}</b><output id="o-${id}">${val}${unit || ''}</output><input type="range" min="${min}" max="${max}" value="${val}" data-inp="${id}" aria-label="${label}"></div>`;
    const toggle = (id, label, on, txt) => `<div class="inp"><b>${label}</b><output></output><button class="tog" data-tog="${id}" aria-pressed="${!!on}">${txt}</button></div>`;
    let h = `<div class="inputs"><div class="inp-head">micro:bit</div>`;
    h += slider('temp', 'Temperature', -5, 50, HW.temp, ' °C') + slider('light', 'Light level', 0, 255, HW.light);
    h += slider('ax', 'Tilt left/right (x)', -1023, 1023, HW.accel.x) + slider('ay', 'Tilt forward/back (y)', -1023, 1023, HW.accel.y);
    h += `<div class="inp"><b>Gestures</b><output></output><span style="grid-column:1/-1;display:flex;gap:6px"><button class="tog" data-act="shake">Shake</button><button class="tog" data-act="logo">Touch logo</button></span></div>`;
    const sensors = pr.parts.filter(p => PARTS[p.type].kind === 'in');
    if (sensors.length) h += `<div class="inp-head">Sensors on the bench</div>`;
    sensors.forEach(p => {
      const nm = `${PARTS[p.type].name} (${PARTS[p.type].pins.map(k => p.pins[k]).join('/')})`;
      const fromArena = arena && ((p.type === 'sonar' && p.props.mount === 'front') || p.type === 'line');
      if (fromArena) { h += `<div class="inp"><b>${esc(nm)}</b><output>set by the arena</output></div>`; return; }
      if (p.type === 'button') h += toggle(p.id, nm, p.state.pressed, p.state.pressed ? 'Pressed' : 'Hold to press');
      else if (p.type === 'pir') h += toggle(p.id, nm, p.state.on, p.state.on ? 'Motion!' : 'No motion');
      else if (p.type === 'line') h += toggle(p.id, nm, p.state.on, p.state.on ? 'Over the line' : 'Over the floor');
      else if (p.type === 'sonar') h += slider(p.id, nm, 2, 200, p.state.value, ' cm');
      else h += slider(p.id, nm, 0, 1023, p.state.value);
    });
    h += '</div>';
    $('#dock-inputs').innerHTML = h;
  },

  renderChecks() {
    const list = wiringChecks(this.project);
    $('#dock-checks').innerHTML = list.map(c => `<div class="check ${c.lvl}"><span class="ic">${c.lvl === 'good' ? '✓' : c.lvl === 'bad' ? '!' : '?'}</span><span>${esc(c.msg)}</span></div>`).join('');
    const bad = list.filter(c => c.lvl === 'bad').length, warn = list.filter(c => c.lvl === 'warn').length;
    const pill = $('#checkCount');
    pill.textContent = bad + warn || '✓';
    pill.className = 'pill ' + (bad ? 'bad' : warn ? 'warn' : 'good');
  },

  renderPython() {
    const src = toPython(this.ws);
    this.pySrc = src;
    const kw = /(#.*$)|('(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*")|\b(from|import|def|return|if|elif|else|while|for|in|range|True|False|None|and|or|not|pass|global|int|abs|min|max)\b|\b(\d+(?:\.\d+)?)\b/gm;
    $('#pycode').innerHTML = esc(src).replace(kw, (m, c, s, k, n) => c ? `<span class="c">${c}</span>` : s ? `<span class="s">${s}</span>` : k ? `<span class="k">${k}</span>` : `<span class="n">${n}</span>`);
  },

  /* ---------- per-frame ---------- */
  tick(dt, now) {
    if (this.leds && this.leds[0]) HW.display.forEach((v, i) => { const e = this.leds[i]; const f = v > 0 ? `rgba(255,${40 + v * 4},${30 + v * 2},${0.35 + v / 14})` : '#3a1010'; if (e._f !== f) { e.setAttribute('fill', f); e._f = f; } });
    const driver = boardPart(this.project);
    const hasDriver = driver && driver.type === 'motordriver';
    this.project.parts.forEach(p => {
      const e = p._el; if (!e) return;
      const pin = p.pins.SIG;
      switch (p.type) {
        case 'led': { const b = HW.ledLevel(pin); e.dome.setAttribute('opacity', 0.3 + 0.7 * b); e.glow.setAttribute('opacity', b * 0.75); break; }
        case 'traffic': ['R', 'Y', 'G'].forEach(k => e[k].setAttribute('opacity', 0.22 + 0.78 * HW.ledLevel(p.pins[k]))); break;
        case 'buzzer': { const on = HW.tone > 0 && pin === 'P0'; e.waves.setAttribute('opacity', on ? 0.5 + 0.5 * Math.sin(now / 40) : 0); break; }
        case 'neopixel': { const a = HW.neo[p.pins.DIN] || []; for (let i = 0; i < +p.props.count; i++) { const c = a[i] && a[i] !== 'black' ? NEO_COLOURS[a[i]] : '#333'; if (e['px' + i]._c !== c) { e['px' + i].setAttribute('fill', c); e['px' + i]._c = c; } } break; }
        case 'servo': {
          const v = HW.servoValue(pin);
          if (p.props.mode === 'continuous') {
            const sp = v == null ? 0 : (v - 90) / 90; p._rot = ((p._rot || 0) + sp * dt * 400) % 360;
            e.horn.setAttribute('transform', `rotate(${p._rot} 80 63)`); e.ang.textContent = v == null ? 'stopped' : `speed ${Math.round(sp * 100)}%`;
          } else {
            const a = v == null ? (p._a || 90) : v; p._a = p._a == null ? a : p._a + (a - p._a) * Math.min(1, dt * 10);
            e.horn.setAttribute('transform', `rotate(${p._a - 90} 80 63)`); e.ang.textContent = `${Math.round(p._a)}°`;
          }
          break;
        }
        case 'motor': { const sp = hasDriver ? HW.motors[p.pins.M] || 0 : 0; p._rot = ((p._rot || 0) + sp / 100 * dt * 720) % 360; e.wheel.setAttribute('transform', `rotate(${p._rot})`); e.spd.textContent = `${Math.round(sp)}%`; break; }
        case 'button': e.cap.setAttribute('fill', p.state.pressed ? '#8a1d16' : '#E23A2E'); e.cap.setAttribute('r', p.state.pressed ? 13 : 15); break;
        case 'pot': e.knob.setAttribute('transform', `rotate(${-135 + p.state.value / 1023 * 270} 55 60)`); e.val.textContent = p.state.value; break;
        case 'ldr': e.sun.setAttribute('opacity', 0.15 + p.state.value / 1200); e.val.textContent = p.state.value; break;
        case 'moisture': e.soil.setAttribute('fill', `hsl(28,45%,${38 - p.state.value / 1023 * 26}%)`); e.val.textContent = p.state.value; break;
        case 'pir': e.dot.setAttribute('fill', sensorValue(p) ? '#FF2A2A' : '#400'); break;
        case 'sonar': e.val.textContent = `${Math.round(sensorValue(p))} cm`; break;
        case 'line': e.dot.setAttribute('fill', sensorValue(p) ? '#30D158' : '#300'); break;
      }
    });
    if (this.view === 'arena') {
      Arena.step(dt); Arena.draw();
      if (!this._ai || now - this._ai > 200) { $('#arenaInfo').textContent = Arena.info(); this._ai = now; }
    }
  },

  paintButtons() {
    ['A', 'B'].forEach(k => { const e = $('#btn' + k); if (e) e.setAttribute('fill', HW.buttons[k] ? '#FF5A36' : '#222'); });
  },
  paintRunState(on) {
    $('#btnRun').textContent = on ? '↻ Restart' : '▶ Run';
    $('#btnStop').disabled = !on;
    const st = $('#runState'); st.textContent = on ? 'Running' : 'Stopped'; st.classList.toggle('on', on);
  },

  /* ---------- running ---------- */
  run() {
    Audio.ensure();
    if (this.view === 'arena') Arena.reset();
    RT.start(toJS(this.ws));
  },
  stop() { RT.stop(); },
  codeChanged() {
    this.save();
    if (this.codeTab === 'python') this.renderPython();
    if (RT.running && !this.checking) { clearTimeout(this._rr); this._rr = setTimeout(() => { if (RT.running) RT.start(toJS(this.ws)); }, 700); }
  },
  serial(line) {
    const el = $('#serial');
    el.textContent += line + '\n';
    if (el.textContent.length > 20000) el.textContent = el.textContent.slice(-15000);
    el.parentElement.scrollTop = el.parentElement.scrollHeight;
  },
  toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.remove('show'), 3200); },

  /* ---------- views and tabs ---------- */
  setView(v) {
    this.view = v;
    document.querySelectorAll('[data-view]').forEach(b => { const on = b.dataset.view === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#view-bench').hidden = v !== 'bench'; $('#view-arena').hidden = v !== 'arena';
    $('#arenaPick').hidden = v !== 'arena'; $('#btnRoverReset').hidden = v !== 'arena';
    this.renderInputs();
  },
  dock(k) {
    document.querySelectorAll('[data-dock]').forEach(b => { const on = b.dataset.dock === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    ['inputs', 'checks', 'serial'].forEach(x => { $('#dock-' + x).hidden = x !== k; });
  },
  codeTab: 'blocks',
  setCode(k) {
    this.codeTab = k;
    document.querySelectorAll('[data-code]').forEach(b => { const on = b.dataset.code === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#code-blocks').hidden = k !== 'blocks'; $('#code-python').hidden = k !== 'python';
    $('#btnCopyPy').hidden = $('#btnDownloadPy').hidden = k !== 'python';
    if (k === 'python') this.renderPython(); else setTimeout(() => Blockly.svgResize(this.ws), 0);
  },
  leftTab(k) {
    document.querySelectorAll('[data-tab]').forEach(b => { const on = b.dataset.tab === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
    $('#tab-parts').hidden = k !== 'parts'; $('#tab-missions').hidden = k !== 'missions';
  },

  /* ---------- missions ---------- */
  renderMissions() {
    $('#missionList').innerHTML = `<p class="hint">Missions set up the parts for you and check your program automatically.</p>` +
      MISSIONS.map((m, i) => `<button class="mis${this.done[m.id] ? ' done' : ''}" data-mission="${m.id}"><span class="num">${this.done[m.id] ? '✓' : i + 1}</span><span><span class="t">${esc(m.title)}</span><br><span class="lv">${esc(m.level)}</span></span></button>`).join('');
    $('#missionCount').textContent = `${Object.keys(this.done).filter(k => MISSIONS.some(m => m.id === k)).length}/${MISSIONS.length}`;
  },
  openMission(id) {
    const m = MISSIONS.find(x => x.id === id); if (!m) return;
    this.mission = m;
    const partsList = m.parts.length ? m.parts.map(p => PARTS[p.type].name + (Object.keys(p.pins).length ? ' on ' + Object.values(p.pins).join('/') : '')).join(', ') : 'Just the micro:bit.';
    $('#missionDetail').innerHTML = `<button class="back" data-back>← All missions</button>
      <h3>${esc(m.title)}</h3><div class="lv hint">${esc(m.level)}${this.done[m.id] ? ' · completed ✓' : ''}</div>
      <div class="goal">${esc(m.goal)}</div>
      <p class="hint"><b>Parts:</b> ${esc(partsList)}</p>
      <div class="row"><button class="btn" data-setup>Set up the parts</button><button class="btn primary" data-check>Check my program</button></div>
      <div id="missionResult"></div>
      <ol>${m.steps.map(s => `<li>${s}</li>`).join('')}</ol>
      <details><summary>Stuck? Get a hint</summary><p>${m.hint}</p></details>
      <p class="real"><b>On real hardware:</b> ${esc(m.real)}</p>`;
    $('#missionList').hidden = true; $('#missionDetail').hidden = false;
  },
  setupMission() {
    const m = this.mission;
    const hasParts = this.project.parts.length > 0;
    if (hasParts && !confirm('Replace the parts on your bench with the parts for this mission? Your blocks stay as they are.')) return;
    RT.stop();
    this.project = { parts: [], nextId: 1 };
    m.parts.forEach(p => this.addPart(p.type, { pins: p.pins, props: p.props, quiet: true }));
    this.selected = null; this.renderAll(); this.save();
    if (m.arena) { Arena.setArena(m.arena); $('#arenaPick').value = m.arena; this.setView('arena'); } else this.setView('bench');
    this.toast('Parts are on the bench. Now build the program.');
  },
  async checkMission() {
    const m = this.mission, out = $('#missionResult');
    const need = {};
    m.parts.forEach(p => { need[p.type] = (need[p.type] || 0) + 1; });
    const missing = Object.entries(need).filter(([t, n]) => this.project.parts.filter(p => p.type === t).length < n).map(([t]) => PARTS[t].name);
    const mismatch = m.parts.filter(mp => !PARTS[mp.type].board && !this.project.parts.some(p => p.type === mp.type && Object.entries(mp.pins).every(([k, v]) => p.pins[k] === v)));
    if (missing.length || mismatch.length) {
      out.innerHTML = `<div class="result bad">This check needs ${missing.length ? 'these parts: ' + esc(missing.join(', ')) : 'the parts on the pins listed above'}. Press <b>Set up the parts</b>.</div>`;
      return;
    }
    if (this.checking) this.checking.cancel = true;
    const token = { cancel: false }; this.checking = token;
    out.innerHTML = `<div class="result wait">Checking… watch the ${m.arena ? 'arena' : 'bench'}. ${m.arena ? 'This takes up to a minute.' : ''}</div>`;
    const saved = this.project.parts.map(p => [p, Object.assign({}, p.state)]);
    if (m.arena) { Arena.setArena(m.arena); $('#arenaPick').value = m.arena; this.setView('arena'); }
    this.run();
    let result;
    try {
      if (!RT.running) throw new MissionFail('Your program did not start. Check the Serial tab for an error.');
      await m.check(makeHarness(token));
      result = { ok: true };
    } catch (e) {
      result = { ok: false, msg: e instanceof MissionFail ? e.message : 'Something went wrong while checking: ' + e.message };
    }
    if (token.cancel) return;
    this.checking = null;
    RT.stop();
    saved.forEach(([p, st]) => { p.state = st; });
    this.renderInputs();
    if (result.ok) {
      this.done[m.id] = true; this.save(); this.renderMissions();
      out.innerHTML = `<div class="result good"><b>Mission complete!</b> Your program passed every test.</div>`;
    } else out.innerHTML = `<div class="result bad"><b>Not yet.</b> ${esc(result.msg)}</div>`;
  },

  /* ---------- events ---------- */
  bindUi() {
    $('#btnRun').onclick = () => this.run();
    $('#btnStop').onclick = () => { if (this.checking) this.checking.cancel = true; this.checking = null; this.stop(); };
    $('#btnMute').onclick = e => { Audio.muted = !Audio.muted; e.currentTarget.textContent = Audio.muted ? '🔇 Muted' : '🔊 Sound'; e.currentTarget.setAttribute('aria-pressed', Audio.muted); Audio.set(HW.tone); };
    $('#btnHelp').onclick = () => $('#help').showModal();
    $('#btnClearSerial').onclick = () => { $('#serial').textContent = ''; };
    $('#btnNew').onclick = () => {
      if (!confirm('Start a new empty project? Your current parts and blocks will be cleared. Save them to a file first if you want to keep them.')) return;
      RT.stop(); this.project = { parts: [], nextId: 1 }; this.selected = null;
      this.ws.clear(); Blockly.serialization.workspaces.load(STARTER, this.ws); this.renderAll(); this.save();
      $('.menu').open = false;
    };
    $('#btnExport').onclick = () => {
      const data = JSON.stringify({ app: 'bit-bench', version: 1, project: this.cleanProject(), blocks: Blockly.serialization.workspaces.save(this.ws) }, null, 1);
      download('bit-bench-project.json', data, 'application/json'); $('.menu').open = false;
    };
    $('#fileImport').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      try {
        const data = JSON.parse(await f.text());
        if (!data.project || !Array.isArray(data.project.parts)) throw new Error('not a Bit Bench project');
        RT.stop(); this.loadProject(data.project);
        this.ws.clear(); Blockly.serialization.workspaces.load(data.blocks || STARTER, this.ws);
        this.save(); this.toast('Project opened.');
      } catch (err) { this.toast('That file could not be opened: ' + err.message); }
      e.target.value = ''; $('.menu').open = false;
    };
    $('#btnCopyPy').onclick = async () => { try { await navigator.clipboard.writeText(this.pySrc || ''); this.toast('MicroPython copied.'); } catch (e) { this.toast('Select the code and copy it.'); } };
    $('#btnDownloadPy').onclick = () => download('main.py', this.pySrc || '', 'text/x-python');
    $('#arenaPick').onchange = e => { Arena.setArena(e.target.value); };
    $('#btnRoverReset').onclick = () => Arena.reset();

    document.addEventListener('click', e => {
      const t = e.target.closest('[data-add],[data-tab],[data-view],[data-dock],[data-code],[data-del],[data-desel],[data-mission],[data-back],[data-setup],[data-check]');
      if (!t) return;
      const ds = t.dataset;
      if (ds.add) { this.addPart(ds.add); if (window.matchMedia('(max-width:760px)').matches) $('.stage').scrollIntoView({ behavior: 'smooth' }); }
      else if (ds.tab) this.leftTab(ds.tab);
      else if (ds.view) this.setView(ds.view);
      else if (ds.dock) this.dock(ds.dock);
      else if (ds.code) this.setCode(ds.code);
      else if (ds.del) this.removePart(ds.del);
      else if ('desel' in ds) { this.selected = null; this.renderBench(); this.renderInspector(); }
      else if (ds.mission) this.openMission(ds.mission);
      else if ('back' in ds) { $('#missionList').hidden = false; $('#missionDetail').hidden = true; }
      else if ('setup' in ds) this.setupMission();
      else if ('check' in ds) this.checkMission();
    });
    $('#inspector').addEventListener('change', e => {
      const p = this.part(this.selected); if (!p) return;
      const t = e.target;
      if (t.dataset.pin) p.pins[t.dataset.pin] = t.value;
      if (t.dataset.prop) p.props[t.dataset.prop] = t.value;
      this.renderBench(); this.renderInputs(); this.renderChecks(); this.save();
      if (this.codeTab === 'python') this.renderPython();
    });
    // inputs dock
    const dockIn = $('#dock-inputs');
    dockIn.addEventListener('input', e => {
      const k = e.target.dataset.inp; if (!k) return;
      const v = +e.target.value, o = $('#o-' + k);
      if (k === 'temp') HW.temp = v; else if (k === 'light') HW.light = v; else if (k === 'ax') HW.accel.x = v; else if (k === 'ay') HW.accel.y = v;
      else { const p = this.part(k); if (p) p.state.value = v; }
      if (o) o.textContent = v + (k === 'temp' ? ' °C' : (this.part(k) && this.part(k).type === 'sonar' ? ' cm' : ''));
    });
    dockIn.addEventListener('change', () => this.save());
    dockIn.addEventListener('pointerdown', e => {
      const a = e.target.closest('[data-act]');
      if (a) {
        if (a.dataset.act === 'shake') { HW.accel.z = 2600; RT.fire('shake'); setTimeout(() => { HW.accel.z = -1023; }, 300); }
        if (a.dataset.act === 'logo') { HW.logo = true; RT.fire('logo'); const up = () => { HW.logo = false; window.removeEventListener('pointerup', up); }; window.addEventListener('pointerup', up); }
        return;
      }
      const t = e.target.closest('[data-tog]'); if (!t) return;
      const p = this.part(t.dataset.tog); if (!p) return;
      if (p.type === 'button') {
        p.state.pressed = true; this.renderInputs();
        const up = () => { p.state.pressed = false; this.renderInputs(); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointerup', up);
      } else { p.state.on = !p.state.on; this.renderInputs(); this.save(); }
    });
    this.bindBench();
    // keyboard: A and B press the micro:bit buttons when focus isn't in a text field or the blocks
    const keyBtn = (e, down) => {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toUpperCase(); if (k !== 'A' && k !== 'B') return;
      if (e.target.closest('input,select,textarea,#blockly,.blocklyWidgetDiv')) return;
      HW.buttons[k] = down; if (down) RT.fire('button', HW.buttons.A && HW.buttons.B ? 'AB' : k); this.paintButtons();
    };
    window.addEventListener('keydown', e => keyBtn(e, true));
    window.addEventListener('keyup', e => keyBtn(e, false));
  },

  bindBench() {
    const svg = $('#bench');
    const pt = e => { const m = svg.getScreenCTM().inverse(); const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m); return { x: p.x, y: p.y }; };
    let drag = null;
    svg.addEventListener('pointerdown', e => {
      const btn = e.target.closest('[data-btn]');
      if (btn) {
        const k = btn.dataset.btn; HW.buttons[k] = true; this.paintButtons();
        RT.fire('button', HW.buttons.A && HW.buttons.B ? 'AB' : k);
        const up = () => { HW.buttons[k] = false; this.paintButtons(); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointerup', up); return;
      }
      if (e.target.closest('[data-touch]')) {
        HW.logo = true; RT.fire('logo');
        const up = () => { HW.logo = false; window.removeEventListener('pointerup', up); }; window.addEventListener('pointerup', up); return;
      }
      const g = e.target.closest('.part'); if (!g) { if (this.selected) { this.selected = null; this.renderBench(); this.renderInspector(); } return; }
      const p = this.part(g.dataset.id); if (!p) return;
      if (e.target.closest('[data-press]') && RT.running) {
        p.state.pressed = true; this.renderInputs();
        const up = () => { p.state.pressed = false; this.renderInputs(); window.removeEventListener('pointerup', up); };
        window.addEventListener('pointerup', up); return;
      }
      const s = pt(e);
      drag = { p, g, ox: s.x - p.x, oy: s.y - p.y, sx: s.x, sy: s.y, moved: false };
      svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove', e => {
      if (!drag || PARTS[drag.p.type].board) return;
      const s = pt(e);
      if (!drag.moved && Math.hypot(s.x - drag.sx, s.y - drag.sy) < 4) return;
      drag.moved = true; drag.g.classList.add('dragging');
      const p = drag.p;
      p.x = Math.max(0, Math.min(1400 - partW(p), s.x - drag.ox)); p.y = Math.max(0, Math.min(900 - PARTS[p.type].h, s.y - drag.oy));
      drag.g.setAttribute('transform', `translate(${p.x} ${p.y})`);
      $('#wires').innerHTML = this.wiresSvg();
    });
    const end = () => {
      if (!drag) return;
      const { p, moved } = drag; drag = null;
      if (moved) this.save();
      this.selected = p.id; this.leftTab('parts'); this.renderBench(); this.renderInspector();
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  },
};

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

function miniIcon(k) {
  const c = CAT[PARTS[k].cat].pcb;
  const inner = {
    led: '<circle cx="14" cy="13" r="6" fill="#FF3B30"/><rect x="11" y="18" width="6" height="5" fill="#ccc"/>',
    traffic: '<rect x="10" y="4" width="8" height="20" rx="2" fill="#111"/><circle cx="14" cy="8" r="2.4" fill="#FF3B30"/><circle cx="14" cy="14" r="2.4" fill="#FFD60A"/><circle cx="14" cy="20" r="2.4" fill="#30D158"/>',
    buzzer: '<circle cx="14" cy="14" r="8" fill="#111"/><circle cx="14" cy="14" r="2" fill="#444"/>',
    neopixel: '<rect x="3" y="10" width="22" height="8" rx="2" fill="#111"/><rect x="5" y="12" width="4" height="4" fill="#f44"/><rect x="12" y="12" width="4" height="4" fill="#4f4"/><rect x="19" y="12" width="4" height="4" fill="#44f"/>',
    servo: '<rect x="5" y="10" width="18" height="11" rx="2" fill="#2C5BD6"/><rect x="15" y="4" width="3" height="10" fill="#fff"/>',
    motor: '<rect x="3" y="11" width="10" height="7" fill="#F4C20D"/><circle cx="18" cy="14" r="7" fill="#222"/><circle cx="18" cy="14" r="5" fill="#ffcf33"/>',
    button: '<rect x="7" y="7" width="14" height="14" rx="2" fill="#ddd"/><circle cx="14" cy="14" r="5" fill="#E23A2E"/>',
    pot: '<circle cx="14" cy="14" r="8" fill="#2D6CDF"/><circle cx="14" cy="14" r="5" fill="#eee"/><rect x="13" y="8" width="2" height="5" fill="#333"/>',
    ldr: '<circle cx="14" cy="15" r="6" fill="#C9763A"/><circle cx="21" cy="7" r="3" fill="#FFD23F"/>',
    moisture: '<path d="M9 5h10v8l-2 11h-2l-1-11-1 11h-2L9 13z" fill="#DCE6A8"/>',
    pir: '<path d="M7 18a7 7 0 0 1 14 0z" fill="#f4f4f4"/>',
    sonar: '<rect x="3" y="9" width="22" height="10" rx="2" fill="#1B6DB3"/><circle cx="9" cy="14" r="4" fill="#ccc"/><circle cx="19" cy="14" r="4" fill="#ccc"/>',
    line: '<rect x="7" y="9" width="14" height="10" rx="2" fill="#111"/><circle cx="11" cy="14" r="2" fill="#557"/><circle cx="17" cy="14" r="2" fill="#755"/>',
    breakout: '<rect x="3" y="11" width="22" height="8" fill="#1E7A44"/><g fill="#E8C66A"><circle cx="7" cy="15" r="1.3"/><circle cx="11" cy="15" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="19" cy="15" r="1.3"/><circle cx="23" cy="15" r="1.3"/></g><rect x="6" y="6" width="16" height="5" fill="#111"/>',
    motordriver: '<rect x="3" y="9" width="22" height="12" fill="#7A1F1F"/><rect x="11" y="12" width="7" height="6" fill="#111"/><rect x="4" y="17" width="5" height="3" fill="#2a8a3a"/><rect x="19" y="17" width="5" height="3" fill="#2a8a3a"/>',
  }[k] || '';
  return `<svg viewBox="0 0 28 28" width="28" height="28" aria-hidden="true"><rect width="28" height="28" rx="6" fill="${c}" opacity=".18"/>${inner}</svg>`;
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.Blockly || !window.javascript || !window.python) {
    document.body.innerHTML = '<p style="padding:24px;font-family:sans-serif">Bit Bench could not load its blocks editor. Check your internet connection and reload the page.</p>';
    return;
  }
  App.init();
});
