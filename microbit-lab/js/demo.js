/* Bit Bench: the demo project. A light sensor, an LED and a servo gauge; in demo mode the light level
   rises and falls on its own (day and night) so a newcomer can just watch. */
'use strict';

const DEMO_PROJECT = { nextId: 4, parts: [
  { id: 'p1', type: 'ldr', x: 320, y: 20, pins: { SIG: 'P1' }, props: {}, state: { value: 900 } },
  { id: 'p2', type: 'led', x: 450, y: 20, pins: { SIG: 'P0' }, props: { color: 'yellow' }, state: {} },
  { id: 'p3', type: 'servo', x: 580, y: 20, pins: { SIG: 'P2' }, props: { mode: '180°' }, state: {} },
] };

const _n = v => ({ shadow: { type: 'math_number', fields: { NUM: v } } });
const _light = () => ({ block: { type: 'variables_get', fields: { VAR: { id: 'demo-light' } } } });
const DEMO_BLOCKS = { variables: [{ name: 'light', id: 'demo-light' }], blocks: { languageVersion: 0, blocks: [
  { type: 'mb_on_start', x: 20, y: 20, inputs: { DO: { block: { type: 'mb_show_icon', fields: { ICON: 'HAPPY' } } } } },
  { type: 'mb_forever', x: 20, y: 140, inputs: { DO: { block: {
    type: 'variables_set', fields: { VAR: { id: 'demo-light' } }, inputs: { VALUE: { block: { type: 'mb_aread', fields: { PIN: 'P1' } } } },
    next: { block: {
      type: 'mb_servo', fields: { PIN: 'P2' },
      inputs: { VAL: { block: { type: 'mb_map', inputs: { V: _light(), A: _n(0), B: _n(1023), C: _n(0), D: _n(180) } } } },
      next: { block: {
        type: 'controls_if', extraState: { hasElse: true }, inputs: {
          IF0: { block: { type: 'logic_compare', fields: { OP: 'LT' }, inputs: { A: _light(), B: { block: { type: 'math_number', fields: { NUM: 300 } } } } } },
          DO0: { block: { type: 'mb_dwrite', fields: { PIN: 'P0' }, inputs: { VAL: _n(1) }, next: { block: { type: 'mb_show_icon', fields: { ICON: 'ASLEEP' } } } } },
          ELSE: { block: { type: 'mb_dwrite', fields: { PIN: 'P0' }, inputs: { VAL: _n(0) }, next: { block: { type: 'mb_show_icon', fields: { ICON: 'HAPPY' } } } } },
        },
        next: { block: { type: 'mb_pause', inputs: { MS: _n(100) } } },
      } },
    } },
  } } } },
] } };

const Demo = {
  active: false, t0: 0,
  load(autoplay) {
    if (App.checking) App.checking.cancel = true;
    RT.stop();
    App.loadProject(JSON.parse(JSON.stringify(DEMO_PROJECT)));
    App.ws.clear();
    Blockly.serialization.workspaces.load(DEMO_BLOCKS, App.ws);
    App.setView('bench'); App.setCode('blocks'); App.leftTab('parts');
    App.save();
    if (autoplay) this.play();
  },
  play() {
    App.dock('monitor');
    if (!document.querySelector('.dock').classList.contains('big')) document.querySelector('#btnDockSize').click();
    App.run();
    this.active = true; this.t0 = performance.now();
    document.getElementById('demoBar').hidden = false;
  },
  stop() {
    this.active = false;
    document.getElementById('demoBar').hidden = true;
  },
  tick(now) {
    if (!this.active) return;
    if (!RT.running) { this.stop(); return; }
    const ldr = App.project.parts.find(p => p.type === 'ldr');
    if (!ldr) { this.stop(); return; }
    // one day every 14 seconds: bright, dusk, dark, dawn
    const t = (now - this.t0) / 14000;
    const v = Math.round(560 + 440 * Math.cos(t * 2 * Math.PI));
    if (v !== ldr.state.value) {
      ldr.state.value = v;
      const s = document.querySelector(`[data-inp="${ldr.id}"]`), o = document.getElementById('o-' + ldr.id);
      if (s) s.value = v; if (o) o.textContent = v;
    }
    const phase = v > 800 ? 'Daytime: bright' : v > 300 ? (Math.sin(t * 2 * Math.PI) > 0 ? 'Dusk: getting darker' : 'Dawn: getting lighter') : 'Night: dark';
    const el = document.getElementById('demoPhase');
    if (el.textContent !== phase) el.textContent = phase;
  },
};
