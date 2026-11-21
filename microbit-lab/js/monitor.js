/* Bit Bench: watching a program run.
   - signals on the bench wires (direction dots + value badges)
   - the Monitor tab: running now, variables, pins and parts, and a plain-English log of what changed */
'use strict';

const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pct = v => Math.round(Math.max(0, Math.min(1023, v)) / 1023 * 100);
const fmtVal = v => typeof v === 'string' ? `"${v}"` : v === undefined || v === null ? '(empty)' : typeof v === 'number' ? fmtNum(v) : String(v);

const Monitor = {
  log: [], lastOut: {}, lastRead: {}, lastDisplay: '', lastTone: 0, lastVars: {}, changedAt: {}, wires: [], showSignals: true, timer: null, hl: new Set(),

  /* ---------- events from the simulator ---------- */
  reset() {
    this.log = []; this.lastOut = {}; this.lastRead = {}; this.lastDisplay = ''; this.lastTone = 0; this.lastVars = {}; this.changedAt = {};
    this.renderLog();
  },
  note(text) {
    if (!RT.running) return;
    if (this.log.length && this.log[0].text === text) { this.log[0].n++; this.log[0].t = RT.now(); }
    else { this.log.unshift({ t: RT.now(), text, n: 1 }); if (this.log.length > 40) this.log.pop(); }
    this._logDirty = true;
  },
  out(pin) {
    const o = HW.pins[pin]; const key = o ? o.kind + o.v : '';
    if (this.lastOut[pin] === key) return;
    // small steps of a servo or a dimmed LED would flood the log: only note big moves
    const prev = this.lastOut[pin], step = o.kind === 's' ? 10 : o.kind === 'a' ? 64 : 0;
    if (step && prev && prev[0] === o.kind && Math.abs(+prev.slice(1) - o.v) < step) return;
    this.lastOut[pin] = key;
    const parts = App.project.parts.filter(p => !PARTS[p.type].board && Object.entries(p.pins).some(([k, v]) => v === pin && PARTS[p.type].kind === 'out'));
    const val = o.kind === 's' ? o.v + '°' : o.v;
    const what = parts.length ? parts.map(p => this.outMeaning(p, pin, true)).join(', ') : 'nothing is wired to it';
    this.note(`${pin} set to ${val}: ${what}`);
  },
  motor(m) {
    const s = Math.round(HW.motors[m]);
    if (this.lastOut[m] === s) return; this.lastOut[m] = s;
    const side = m === 'M1' ? 'left motor (M1)' : 'right motor (M2)';
    this.note(s === 0 ? `${side} stops` : `${side} runs ${s > 0 ? 'forward' : 'backward'} at ${Math.abs(s)}%`);
  },
  tone(freq) {
    if (this.lastTone === freq) return; this.lastTone = freq;
    if (!freq) return; // stopping after every note would flood the log
    const bz = App.project.parts.some(p => p.type === 'buzzer' && p.pins.SIG === 'P0');
    this.note(`P0 plays a ${freq} Hz note${bz ? ': buzzer sounds' : ' (no buzzer on P0, only the speaker)'}`);
  },
  neo(pin) {
    const a = HW.neo[pin] || [];
    this.note(`${pin} sends colours to the NeoPixel strip: ${this.neoSummary(a)}`);
  },
  read(pin, v) {
    HW.reads[pin] = { v, t: performance.now() };
    const last = this.lastRead[pin];
    const p = App.project.parts.find(q => Object.values(q.pins).includes(pin) && PARTS[q.type].kind === 'in');
    const big = p && ['pot', 'ldr', 'moisture'].includes(p.type) ? 100 : p && p.type === 'sonar' ? 5 : 0.5;
    if (last !== undefined && Math.abs(last - v) < big) return;
    this.lastRead[pin] = v;
    this.note(p ? `Read ${pin} = ${fmtNum(v)} from the ${PARTS[p.type].name.toLowerCase()}: ${this.inMeaning(p, v)}` : `Read ${pin} = ${fmtNum(v)} (nothing is wired to it)`);
  },
  display(desc) {
    if (desc === this.lastDisplay && !desc.startsWith('scrolls')) return;
    this.lastDisplay = desc;
    this.note('Display ' + desc);
  },
  event(text) { this.note(text); },

  /* ---------- plain-English meanings ---------- */
  outMeaning(p, pin, short) {
    const pn = Object.keys(p.pins).find(k => p.pins[k] === pin);
    const o = HW.pins[pin];
    switch (p.type) {
      case 'led': return !o ? 'LED off' : o.kind === 'a' ? (o.v ? `LED glows at ${pct(o.v)}% brightness` : 'LED off') : (o.v ? 'LED turns on' : 'LED turns off');
      case 'traffic': { const c = { R: 'red', Y: 'amber', G: 'green' }[pn]; return `${c} light ${HW.ledLevel(pin) > 0 ? 'on' : 'off'}`; }
      case 'servo':
        if (!o || o.kind !== 's') return short ? 'servo needs a servo write block' : 'waiting for a servo write';
        if (p.props.mode === 'continuous') { const s = Math.round((o.v - 90) / 90 * 100); return s === 0 ? 'servo stopped' : `servo spins ${s > 0 ? 'one way' : 'the other way'} at ${Math.abs(s)}%`; }
        return `servo arm turns to ${Math.round(o.v)}°`;
      case 'buzzer': return HW.tone && pin === 'P0' ? `playing a ${HW.tone} Hz note` : 'quiet';
      case 'neopixel': return this.neoSummary(HW.neo[pin] || []);
    }
    return '';
  },
  inMeaning(p, v) {
    switch (p.type) {
      case 'button': return v ? 'pressed' : 'not pressed';
      case 'pot': return `dial turned ${pct(v)}% of the way`;
      case 'ldr': return v < 300 ? 'dark' : v < 700 ? 'dim' : 'bright';
      case 'moisture': return v < 300 ? 'dry soil' : v < 700 ? 'damp soil' : 'wet soil';
      case 'pir': return v ? 'motion seen!' : 'no motion';
      case 'line': return v ? 'over the black line' : 'over the light floor';
      case 'sonar': return `nearest object ${Math.round(v)} cm away`;
    }
    return '';
  },
  neoSummary(a) {
    const lit = a.filter(c => c && c !== 'black');
    if (!lit.length) return 'all off';
    if (lit.length === a.length && lit.every(c => c === lit[0])) return `all ${lit[0]}`;
    return `${lit.length} of ${a.length} lit (${[...new Set(lit)].join(', ')})`;
  },
  pinValue(p, pn) {
    // the value on the wire right now, as the micro:bit would see or send it
    const pin = p.pins[pn], d = PARTS[p.type];
    if (p.type === 'motor') return { text: `${Math.round(HW.motors[pin] || 0)}%`, level: Math.abs(HW.motors[pin] || 0) / 100 };
    if (d.kind === 'in') {
      if (p.type === 'sonar') { if (pn === 'TRIG') return { text: 'ping', level: 0.5 }; const v = Math.round(sensorValue(p)); return { text: `${v} cm`, level: 1 - Math.min(1, v / 200), num: v, max: 200 }; }
      const v = ['pot', 'ldr', 'moisture'].includes(p.type) ? readAnalog(pin) : readDigital(pin);
      return { text: String(Math.round(v)), level: ['pot', 'ldr', 'moisture'].includes(p.type) ? v / 1023 : v, num: v, max: ['pot', 'ldr', 'moisture'].includes(p.type) ? 1023 : 1 };
    }
    if (p.type === 'buzzer') return { text: HW.tone && pin === 'P0' ? `♪ ${HW.tone} Hz` : '0', level: HW.tone && pin === 'P0' ? 1 : 0 };
    if (p.type === 'neopixel') { const a = HW.neo[pin]; const s = a ? this.neoSummary(a) : 'off'; return { text: s.replace(/^all /, ''), level: a && a.some(c => c !== 'black') ? 1 : 0 }; }
    const o = HW.pins[pin];
    if (!o) return { text: '0', level: 0, num: 0, max: 1 };
    if (o.kind === 's') return { text: `${Math.round(o.v)}°`, level: 1, num: o.v, max: 180 };
    if (o.kind === 'a') return { text: String(o.v), level: o.v / 1023, num: o.v, max: 1023 };
    return { text: String(o.v), level: o.v, num: o.v, max: 1 };
  },

  /* ---------- signals on the bench ---------- */
  bindWires() {
    this.wires = [...document.querySelectorAll('#wires .sig')].map(g => {
      const path = g.querySelector('path'), L = path.getTotalLength(), mid = path.getPointAtLength(L * 0.72); // nearer the part, so labels don't pile up at the micro:bit
      const badge = g.querySelector('.badge');
      badge.setAttribute('transform', `translate(${mid.x} ${mid.y})`);
      return { g, path, L, dot: g.querySelector('.dot'), dot2: g.querySelector('.dot2'), badge, txt: badge.querySelector('text'), box: badge.querySelector('rect'),
        part: App.part(g.dataset.part), pn: g.dataset.pn, pin: g.dataset.pin, dir: g.dataset.dir, _t: '' };
    });
  },
  tickWires(now) {
    const on = RT.running && this.showSignals, still = reduceMotion();
    this.wires.forEach(w => {
      if (!w.part) return;
      if (!on) { if (w._on) { w.dot.setAttribute('opacity', 0); w.dot2.setAttribute('opacity', 0); w.badge.setAttribute('opacity', 0); w.path.style.strokeWidth = ''; w.path.style.opacity = ''; w._on = false; } return; }
      w._on = true;
      const v = this.pinValue(w.part, w.pn);
      const act = HW.activity[w.pin];
      const recent = act && now - act.t < 700;
      w.path.style.strokeWidth = 3 + 3 * Math.min(1, v.level || 0);
      w.path.style.opacity = recent || v.level > 0 ? 1 : 0.5;
      const txt = (w.dir === 'in' ? '← ' : '→ ') + v.text;
      if (txt !== w._t) {
        w.txt.textContent = txt; w._t = txt;
        const bw = Math.max(28, txt.length * 7 + 12); w.box.setAttribute('x', -bw / 2); w.box.setAttribute('width', bw);
      }
      w.badge.setAttribute('opacity', 1);
      if (recent && !still) {
        // dots travel from the micro:bit to the part (output) or from the part to the micro:bit (input)
        [w.dot, w.dot2].forEach((d, k) => {
          let ph = ((now / 900) + k * 0.5) % 1; if (w.dir === 'in') ph = 1 - ph; // each wire path starts at the micro:bit
          const pt = w.path.getPointAtLength(w.L * ph);
          d.setAttribute('cx', pt.x); d.setAttribute('cy', pt.y); d.setAttribute('opacity', 1);
        });
      } else { w.dot.setAttribute('opacity', 0); w.dot2.setAttribute('opacity', 0); }
    });
  },

  /* ---------- the Monitor tab ---------- */
  build() {
    const el = document.getElementById('dock-monitor');
    const sp = RT.stepDelay;
    el.innerHTML = `<div class="mon">
      <section class="mon-box"><h4 id="monNowH">Running now</h4>
        <div class="speed" role="radiogroup" aria-label="Run speed">
          ${[[0, 'Normal'], [450, 'Slow'], [1200, 'Very slow']].map(([v, l]) => `<label><input type="radio" name="speed" value="${v}"${sp === v ? ' checked' : ''}> ${l}</label>`).join('')}
        </div>
        <ul id="monNow" class="mon-now" aria-labelledby="monNowH"></ul></section>
      <section class="mon-box"><h4 id="monVarsH">Variables</h4>
        <table class="mon-t" aria-labelledby="monVarsH"><thead><tr><th scope="col">Name</th><th scope="col">Value now</th></tr></thead><tbody id="monVars"></tbody></table></section>
      <section class="mon-box wide"><h4 id="monPinsH">Pins and parts</h4>
        <table class="mon-t" aria-labelledby="monPinsH"><thead><tr><th scope="col">Pin</th><th scope="col">Signal</th><th scope="col">Value</th><th scope="col">What it means</th></tr></thead><tbody id="monPins"></tbody></table></section>
      <section class="mon-box wide"><h4 id="monLogH">What just changed <span class="hint">(newest first)</span></h4><ol id="monLog" class="mon-log" aria-labelledby="monLogH"></ol></section>
    </div>`;
    this.renderLog(); this.update();
  },
  update() {
    const root = document.getElementById('monPins'); if (!root) return;
    const running = RT.running;
    // running now
    const now = document.getElementById('monNow');
    if (!running) setHtml(now, '<li class="hint">Press Run to start. Choose Slow to watch each block run, one at a time.</li>');
    else {
      const ids = this.activeBlocks();
      const items = ids.slice(0, 4).map(id => {
        const b = App.ws.getBlockById(id); if (!b) return '';
        const root = b.getRootBlock();
        return `<li><span class="mon-hat">${esc(hatName(root))}</span> ▸ ${esc(b.toString(60))}</li>`;
      }).join('');
      setHtml(now, items || '<li class="hint">Waiting (a pause or nothing to do).</li>');
    }
    // variables
    const vars = App.ws.getAllVariables();
    const vb = document.getElementById('monVars');
    if (!vars.length) setHtml(vb, '<tr><td colspan="2" class="hint">No variables yet. Make one in the Variables category and it will show up here.</td></tr>');
    else {
      const rows = vars.map(v => {
        let val = '—';
        if (running && RT.vars && RT.vars[v.name]) { try { val = RT.vars[v.name](); } catch (e) { val = undefined; } }
        const ready = running && RT.vars;
        const shown = ready ? fmtVal(val) : '—';
        const changed = ready && this.lastVars[v.name] !== undefined && this.lastVars[v.name] !== shown;
        // the table always shows the latest value; the log notes a change at most once a second per variable
        const due = performance.now() - (this.changedAt[v.name] || -1e9) > 1000;
        if (changed && due) { this.note(`Variable ${v.name} changed from ${this.lastVars[v.name]} to ${shown}`); this.changedAt[v.name] = performance.now(); }
        if (ready && (due || !changed)) this.lastVars[v.name] = shown;
        const fresh = running && performance.now() - (this.changedAt[v.name] || -1e9) < 1000;
        return `<tr${fresh ? ' class="flash"' : ''}><th scope="row">${esc(v.name)}</th><td class="mono">${esc(shown)}</td></tr>`;
      }).join('');
      setHtml(vb, rows);
    }
    // pins and parts
    let h = '';
    h += `<tr><th scope="row">A</th><td>button A → micro:bit</td><td class="mono">${HW.buttons.A ? 1 : 0}</td><td>${HW.buttons.A ? 'pressed' : 'not pressed'}</td></tr>`;
    h += `<tr><th scope="row">B</th><td>button B → micro:bit</td><td class="mono">${HW.buttons.B ? 1 : 0}</td><td>${HW.buttons.B ? 'pressed' : 'not pressed'}</td></tr>`;
    h += `<tr><th scope="row">LEDs</th><td>micro:bit → display</td><td class="mono">${HW.display.filter(v => v).length} lit</td><td>${esc(this.lastDisplay || 'blank')}</td></tr>`;
    App.project.parts.forEach(p => {
      const d = PARTS[p.type]; if (d.board) return;
      d.pins.forEach(pn => {
        const pin = p.pins[pn]; if (!pin) return;
        const v = this.pinValue(p, pn);
        const isIn = d.kind === 'in' && !(p.type === 'sonar' && pn === 'TRIG');
        const name = d.name + (d.pins.length > 1 ? ` (${pn})` : '');
        const sig = isIn ? `${esc(name)} → micro:bit <span class="tag in">input</span>` : `micro:bit → ${esc(name)} <span class="tag out">output</span>`;
        let meaning = '';
        if (p.type === 'motor') { const s = Math.round(HW.motors[pin] || 0); meaning = s === 0 ? 'stopped' : `${s > 0 ? 'forward' : 'backward'} at ${Math.abs(s)}%`; }
        else if (p.type === 'sonar' && pn === 'TRIG') meaning = 'the micro:bit sends a click of sound';
        else if (isIn) {
          meaning = this.inMeaning(p, v.num);
          if (running && !HW.reads[pin]) meaning += ' <span class="tag warn">your program hasn\'t read this pin yet</span>';
        } else meaning = esc(this.outMeaning(p, pin));
        const meter = v.max ? ` <meter min="0" max="${v.max}" value="${v.num}" aria-hidden="true"></meter>` : '';
        h += `<tr><th scope="row">${pin}</th><td>${sig}</td><td class="mono">${esc(v.text)}${meter}</td><td>${meaning}</td></tr>`;
      });
    });
    setHtml(root, h);
    if (this._logDirty) this.renderLog();
  },
  renderLog() {
    const el = document.getElementById('monLog'); if (!el) return;
    this._logDirty = false;
    el.innerHTML = this.log.length ? this.log.map(e => `<li><time>${(e.t / 1000).toFixed(1)} s</time> ${esc(e.text)}${e.n > 1 ? ` <span class="pill">×${e.n}</span>` : ''}</li>`).join('')
      : `<li class="hint">${RT.running ? 'Nothing has changed yet.' : 'Changes appear here while your program runs: pins set, sensors read, buttons pressed, variables changed.'}</li>`;
  },
  activeBlocks() {
    const now = performance.now(), keep = RT.stepDelay ? RT.stepDelay + 120 : 220;
    return [...RT.steps.entries()].filter(([, t]) => now - t < keep).sort((a, b) => b[1] - a[1]).map(([id]) => id);
  },
  highlight() {
    const ws = App.ws; if (!ws) return;
    const want = new Set(RT.running ? this.activeBlocks() : []);
    const mark = (id, on) => { const b = ws.getBlockById(id); if (b && b.getSvgRoot) b.getSvgRoot().classList.toggle('bb-running', on); };
    this.hl.forEach(id => { if (!want.has(id)) mark(id, false); });
    want.forEach(id => { if (!this.hl.has(id)) mark(id, true); });
    this.hl = want;
  },
  start() {
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.highlight();
      if (!document.getElementById('dock-monitor').hidden) this.update();
    }, 150);
  },
};

function setHtml(el, html) { if (el._h !== html) { el.innerHTML = html; el._h = html; } }
function hatName(b) {
  if (b.type === 'mb_on_button') return `on button ${b.getFieldValue('BTN') === 'AB' ? 'A+B' : b.getFieldValue('BTN')} pressed`;
  return { mb_on_start: 'on start', mb_forever: 'forever', mb_on_shake: 'on shake', mb_on_logo: 'on logo pressed' }[b.type] || b.toString(30);
}
