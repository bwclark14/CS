/* Bit Bench: micro:bit blocks, toolbox, and the two code generators (runnable JS, MicroPython). */
'use strict';

const COL = { basic:'#1E90FF', input:'#C724B1', pins:'#B22222', music:'#E8590C', sensors:'#0F9D58', motors:'#E08A00', neo:'#0BA5A5', serial:'#5C6BC0' };
const pinOpts = () => PIN_LIST.map(p => [p, p]);
const iconOpts = Object.keys(ICONS).map(k => [ICON_LABELS[k], k]);
const noteOpts = Object.keys(NOTES).map(k => [k, String(NOTES[k])]);
const colourOpts = Object.keys(NEO_COLOURS).map(k => [k, k]);
const NEO_RGB = { red:[255,0,0], orange:[255,128,0], yellow:[255,255,0], green:[0,255,0], blue:[0,0,255], indigo:[75,0,130], violet:[138,43,226], purple:[128,0,128], white:[255,255,255], black:[0,0,0] };

const stmt = (o) => Object.assign({ previousStatement: null, nextStatement: null }, o);
const hat = (type, msg, colour, extra) => Object.assign({ type, message0: msg + ' %1 %2', args0: [{ type:'input_dummy' }, { type:'input_statement', name:'DO' }], colour }, extra || {});

Blockly.defineBlocksWithJsonArray([
  hat('mb_on_start', 'on start', COL.basic, { tooltip:'Runs once when the micro:bit starts.' }),
  hat('mb_forever', 'forever', COL.basic, { tooltip:'Runs again and again, for ever.' }),
  stmt({ type:'mb_show_icon', message0:'show icon %1', args0:[{ type:'field_dropdown', name:'ICON', options:iconOpts }], colour:COL.basic }),
  stmt({ type:'mb_show_number', message0:'show number %1', args0:[{ type:'input_value', name:'NUM' }], colour:COL.basic }),
  stmt({ type:'mb_show_string', message0:'show string %1', args0:[{ type:'input_value', name:'TEXT' }], colour:COL.basic }),
  stmt({ type:'mb_clear', message0:'clear screen', colour:COL.basic }),
  stmt({ type:'mb_pause', message0:'pause (ms) %1', args0:[{ type:'input_value', name:'MS', check:'Number' }], colour:COL.basic }),
  stmt({ type:'mb_plot', message0:'plot x %1 y %2', args0:[{ type:'input_value', name:'X', check:'Number' }, { type:'input_value', name:'Y', check:'Number' }], inputsInline:true, colour:COL.basic }),
  stmt({ type:'mb_unplot', message0:'unplot x %1 y %2', args0:[{ type:'input_value', name:'X', check:'Number' }, { type:'input_value', name:'Y', check:'Number' }], inputsInline:true, colour:COL.basic }),

  hat('mb_on_button', 'on button %3 pressed', COL.input),
  hat('mb_on_shake', 'on shake', COL.input),
  hat('mb_on_logo', 'on logo pressed', COL.input),
  { type:'mb_button_is', message0:'button %1 is pressed', args0:[{ type:'field_dropdown', name:'BTN', options:[['A','A'],['B','B'],['A+B','AB']] }], output:'Boolean', colour:COL.input },
  { type:'mb_logo_touched', message0:'logo is touched', output:'Boolean', colour:COL.input },
  { type:'mb_temperature', message0:'temperature (°C)', output:'Number', colour:COL.input },
  { type:'mb_light', message0:'light level', output:'Number', colour:COL.input, tooltip:'0 (dark) to 255 (bright), measured by the LED display.' },
  { type:'mb_accel', message0:'acceleration (mg) %1', args0:[{ type:'field_dropdown', name:'AXIS', options:[['x','x'],['y','y'],['z','z']] }], output:'Number', colour:COL.input },
  { type:'mb_time', message0:'running time (ms)', output:'Number', colour:COL.input },

  stmt({ type:'mb_dwrite', message0:'digital write pin %1 to %2', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }, { type:'input_value', name:'VAL', check:'Number' }], inputsInline:true, colour:COL.pins, tooltip:'Set a pin to 0 (off) or 1 (on).' }),
  stmt({ type:'mb_awrite', message0:'analog write pin %1 to %2', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }, { type:'input_value', name:'VAL', check:'Number' }], inputsInline:true, colour:COL.pins, tooltip:'Set a pin anywhere from 0 to 1023. Good for dimming LEDs.' }),
  { type:'mb_dread', message0:'digital read pin %1', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }], output:'Number', colour:COL.pins, tooltip:'Gives 0 or 1.' },
  { type:'mb_aread', message0:'analog read pin %1', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }], output:'Number', colour:COL.pins, tooltip:'Gives 0 to 1023.' },
  stmt({ type:'mb_servo', message0:'servo write pin %1 to %2 °', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }, { type:'input_value', name:'VAL', check:'Number' }], inputsInline:true, colour:COL.pins, tooltip:'Turn a servo to an angle from 0 to 180.' }),
  { type:'mb_map', message0:'map %1 from low %2 high %3 to low %4 high %5', args0:[{ type:'input_value', name:'V', check:'Number' }, { type:'input_value', name:'A', check:'Number' }, { type:'input_value', name:'B', check:'Number' }, { type:'input_value', name:'C', check:'Number' }, { type:'input_value', name:'D', check:'Number' }], inputsInline:true, output:'Number', colour:COL.pins, tooltip:'Changes a number from one range to another, e.g. 0–1023 into 0–180.' },

  stmt({ type:'mb_tone', message0:'play tone %1 for %2 ms', args0:[{ type:'field_dropdown', name:'NOTE', options:noteOpts }, { type:'input_value', name:'MS', check:'Number' }], inputsInline:true, colour:COL.music }),
  stmt({ type:'mb_melody', message0:'play melody %1', args0:[{ type:'field_dropdown', name:'TUNE', options:Object.keys(MELODIES).map(k => [k.toLowerCase().replace('_', ' '), k]) }], colour:COL.music }),
  stmt({ type:'mb_stop_music', message0:'stop music', colour:COL.music }),

  { type:'mb_sonar', message0:'sonar distance (cm) TRIG %1 ECHO %2', args0:[{ type:'field_dropdown', name:'TRIG', options:pinOpts() }, { type:'field_dropdown', name:'ECHO', options:pinOpts() }], output:'Number', colour:COL.sensors, tooltip:'Distance from an ultrasonic sensor, in cm.' },

  stmt({ type:'mb_motor', message0:'motor %1 run at %2 %', args0:[{ type:'field_dropdown', name:'M', options:[['M1 (left)','M1'],['M2 (right)','M2']] }, { type:'input_value', name:'SPEED', check:'Number' }], inputsInline:true, colour:COL.motors, tooltip:'-100 (full reverse) to 100 (full forward). Needs a motor driver board.' }),
  stmt({ type:'mb_motor_stop', message0:'stop motor %1', args0:[{ type:'field_dropdown', name:'M', options:[['both','both'],['M1','M1'],['M2','M2']] }], colour:COL.motors }),

  stmt({ type:'mb_neo_all', message0:'NeoPixel on %1 show colour %2', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }, { type:'field_dropdown', name:'COL', options:colourOpts }], colour:COL.neo }),
  stmt({ type:'mb_neo_px', message0:'NeoPixel on %1 set LED %2 to %3', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }, { type:'input_value', name:'I', check:'Number' }, { type:'field_dropdown', name:'COL', options:colourOpts }], inputsInline:true, colour:COL.neo }),
  stmt({ type:'mb_neo_clear', message0:'NeoPixel on %1 clear', args0:[{ type:'field_dropdown', name:'PIN', options:pinOpts() }], colour:COL.neo }),

  stmt({ type:'mb_serial', message0:'serial write %1', args0:[{ type:'input_value', name:'V' }], colour:COL.serial, tooltip:'Prints a value in the Serial tab. Handy for checking what a sensor reads.' }),
]);

// on button: dropdown field placed after the hat's inputs
Blockly.Blocks.mb_on_button = {
  init() {
    this.appendDummyInput().appendField('on button').appendField(new Blockly.FieldDropdown([['A','A'],['B','B'],['A+B','AB']]), 'BTN').appendField('pressed');
    this.appendStatementInput('DO');
    this.setColour(COL.input);
  },
};
// show leds: a 5 x 5 grid of tick boxes
Blockly.Blocks.mb_show_leds = {
  init() {
    this.appendDummyInput().appendField('show leds');
    for (let r = 0; r < 5; r++) {
      const inp = this.appendDummyInput();
      for (let c = 0; c < 5; c++) inp.appendField(new Blockly.FieldCheckbox('FALSE'), `L${r}${c}`);
    }
    this.setPreviousStatement(true); this.setNextStatement(true); this.setColour(COL.basic);
  },
};
const ledRows = b => [0,1,2,3,4].map(r => [0,1,2,3,4].map(c => b.getFieldValue(`L${r}${c}`) === 'TRUE' ? '#' : '.').join(''));

const HATS = ['mb_on_start','mb_forever','mb_on_button','mb_on_shake','mb_on_logo'];

/* ---------- toolbox ---------- */
const N = v => ({ shadow: { type:'math_number', fields: { NUM: v } } });
const T = v => ({ shadow: { type:'text', fields: { TEXT: v } } });
const TOOLBOX = { kind:'categoryToolbox', contents: [
  { kind:'category', name:'Basic', colour:COL.basic, contents: [
    { kind:'block', type:'mb_on_start' }, { kind:'block', type:'mb_forever' },
    { kind:'block', type:'mb_show_icon' }, { kind:'block', type:'mb_show_leds' },
    { kind:'block', type:'mb_show_number', inputs:{ NUM:N(0) } }, { kind:'block', type:'mb_show_string', inputs:{ TEXT:T('Hello!') } },
    { kind:'block', type:'mb_pause', inputs:{ MS:N(500) } }, { kind:'block', type:'mb_clear' },
    { kind:'block', type:'mb_plot', inputs:{ X:N(2), Y:N(2) } }, { kind:'block', type:'mb_unplot', inputs:{ X:N(2), Y:N(2) } } ] },
  { kind:'category', name:'Input', colour:COL.input, contents: [
    { kind:'block', type:'mb_on_button' }, { kind:'block', type:'mb_on_shake' }, { kind:'block', type:'mb_on_logo' },
    { kind:'block', type:'mb_button_is' }, { kind:'block', type:'mb_logo_touched' }, { kind:'block', type:'mb_temperature' }, { kind:'block', type:'mb_light' },
    { kind:'block', type:'mb_accel' }, { kind:'block', type:'mb_time' } ] },
  { kind:'category', name:'Pins', colour:COL.pins, contents: [
    { kind:'block', type:'mb_dwrite', inputs:{ VAL:N(1) } }, { kind:'block', type:'mb_awrite', inputs:{ VAL:N(1023) } },
    { kind:'block', type:'mb_dread' }, { kind:'block', type:'mb_aread' },
    { kind:'block', type:'mb_servo', inputs:{ VAL:N(90) } },
    { kind:'block', type:'mb_map', inputs:{ V:N(0), A:N(0), B:N(1023), C:N(0), D:N(180) } } ] },
  { kind:'category', name:'Music', colour:COL.music, contents: [
    { kind:'block', type:'mb_tone', inputs:{ MS:N(500) } }, { kind:'block', type:'mb_melody' }, { kind:'block', type:'mb_stop_music' } ] },
  { kind:'category', name:'Sensors', colour:COL.sensors, contents: [
    { kind:'label', text:'Potentiometer, light and moisture sensors: use analog read (Pins).' },
    { kind:'label', text:'Buttons, motion and line sensors: use digital read (Pins).' },
    { kind:'block', type:'mb_sonar', fields:{ TRIG:'P1', ECHO:'P2' } } ] },
  { kind:'category', name:'Motors', colour:COL.motors, contents: [
    { kind:'block', type:'mb_motor', inputs:{ SPEED:N(60) } }, { kind:'block', type:'mb_motor_stop' },
    { kind:'label', text:'Servos are in Pins.' } ] },
  { kind:'category', name:'NeoPixel', colour:COL.neo, contents: [
    { kind:'block', type:'mb_neo_all' }, { kind:'block', type:'mb_neo_px', inputs:{ I:N(0) } }, { kind:'block', type:'mb_neo_clear' } ] },
  { kind:'sep' },
  { kind:'category', name:'Logic', colour:'#5B80A5', contents: [
    { kind:'block', type:'controls_if' }, { kind:'block', type:'controls_if', extraState:{ hasElse:true } },
    { kind:'block', type:'logic_compare' }, { kind:'block', type:'logic_operation' }, { kind:'block', type:'logic_negate' }, { kind:'block', type:'logic_boolean' } ] },
  { kind:'category', name:'Loops', colour:'#5BA55B', contents: [
    { kind:'block', type:'controls_repeat_ext', inputs:{ TIMES:N(4) } }, { kind:'block', type:'controls_whileUntil' },
    { kind:'block', type:'controls_for', inputs:{ FROM:N(0), TO:N(4), BY:N(1) } } ] },
  { kind:'category', name:'Maths', colour:'#5B67A5', contents: [
    { kind:'block', type:'math_number' }, { kind:'block', type:'math_arithmetic', inputs:{ A:N(0), B:N(0) } },
    { kind:'block', type:'math_random_int', inputs:{ FROM:N(0), TO:N(10) } }, { kind:'block', type:'math_round' },
    { kind:'block', type:'math_modulo', inputs:{ DIVIDEND:N(10), DIVISOR:N(3) } } ] },
  { kind:'category', name:'Text', colour:'#5BA58C', contents: [ { kind:'block', type:'text' }, { kind:'block', type:'text_join' } ] },
  { kind:'category', name:'Variables', colour:'#A55B80', custom:'VARIABLE' },
  { kind:'category', name:'Serial', colour:COL.serial, contents: [ { kind:'block', type:'mb_serial', inputs:{ V:T('hello') } } ] },
] };

/* ---------- JavaScript (runs in the simulator) ---------- */
const JG = javascript.javascriptGenerator, JO = javascript.Order;
JG.addReservedWords('mb');
JG.INFINITE_LOOP_TRAP = 'await mb.tick();\n';
const jv = (b, n, d) => JG.valueToCode(b, n, JO.NONE) || d;
const q = s => JSON.stringify(s);
const jhat = call => (b, g) => `mb.${call}(async () => {\n${g.statementToCode(b, 'DO')}});\n`;
Object.assign(JG.forBlock, {
  mb_on_start: jhat('onStart'), mb_forever: jhat('forever'), mb_on_shake: jhat('onShake'), mb_on_logo: jhat('onLogo'),
  mb_on_button: (b, g) => `mb.onButton(${q(b.getFieldValue('BTN'))}, async () => {\n${g.statementToCode(b, 'DO')}});\n`,
  mb_show_icon: b => `mb.showIcon(${q(b.getFieldValue('ICON'))});\n`,
  mb_show_leds: b => `mb.showLeds(${q(ledRows(b))});\n`,
  mb_show_number: b => `await mb.showNumber(${jv(b, 'NUM', 0)});\n`,
  mb_show_string: b => `await mb.showString(${jv(b, 'TEXT', "''")});\n`,
  mb_clear: () => 'mb.clear();\n',
  mb_pause: b => `await mb.pause(${jv(b, 'MS', 0)});\n`,
  mb_plot: b => `mb.plot(${jv(b, 'X', 0)}, ${jv(b, 'Y', 0)});\n`,
  mb_unplot: b => `mb.unplot(${jv(b, 'X', 0)}, ${jv(b, 'Y', 0)});\n`,
  mb_button_is: b => [`mb.buttonPressed(${q(b.getFieldValue('BTN'))})`, JO.FUNCTION_CALL],
  mb_logo_touched: () => ['mb.logoTouched()', JO.FUNCTION_CALL],
  mb_temperature: () => ['mb.temperature()', JO.FUNCTION_CALL],
  mb_light: () => ['mb.lightLevel()', JO.FUNCTION_CALL],
  mb_accel: b => [`mb.acceleration(${q(b.getFieldValue('AXIS'))})`, JO.FUNCTION_CALL],
  mb_time: () => ['mb.runningTime()', JO.FUNCTION_CALL],
  mb_dwrite: b => `mb.digitalWrite(${q(b.getFieldValue('PIN'))}, ${jv(b, 'VAL', 0)});\n`,
  mb_awrite: b => `mb.analogWrite(${q(b.getFieldValue('PIN'))}, ${jv(b, 'VAL', 0)});\n`,
  mb_dread: b => [`mb.digitalRead(${q(b.getFieldValue('PIN'))})`, JO.FUNCTION_CALL],
  mb_aread: b => [`mb.analogRead(${q(b.getFieldValue('PIN'))})`, JO.FUNCTION_CALL],
  mb_servo: b => `mb.servoWrite(${q(b.getFieldValue('PIN'))}, ${jv(b, 'VAL', 90)});\n`,
  mb_map: b => [`mb.map(${['V','A','B','C','D'].map(n => jv(b, n, 0)).join(', ')})`, JO.FUNCTION_CALL],
  mb_tone: b => `await mb.playTone(${Number(b.getFieldValue('NOTE'))}, ${jv(b, 'MS', 500)});\n`,
  mb_melody: b => `await mb.playMelody(${q(b.getFieldValue('TUNE'))});\n`,
  mb_stop_music: () => 'mb.stopMusic();\n',
  mb_sonar: b => [`mb.distance(${q(b.getFieldValue('TRIG'))}, ${q(b.getFieldValue('ECHO'))})`, JO.FUNCTION_CALL],
  mb_motor: b => `mb.motor(${q(b.getFieldValue('M'))}, ${jv(b, 'SPEED', 0)});\n`,
  mb_motor_stop: b => `mb.motorStop(${q(b.getFieldValue('M'))});\n`,
  mb_neo_all: b => `mb.neoShowColour(${q(b.getFieldValue('PIN'))}, ${q(b.getFieldValue('COL'))});\n`,
  mb_neo_px: b => `mb.neoSetPixel(${q(b.getFieldValue('PIN'))}, ${jv(b, 'I', 0)}, ${q(b.getFieldValue('COL'))});\n`,
  mb_neo_clear: b => `mb.neoClear(${q(b.getFieldValue('PIN'))});\n`,
  mb_serial: b => `mb.serial(${jv(b, 'V', "''")});\n`,
});

function toJS(ws) {
  JG.init(ws);
  const parts = ws.getTopBlocks(true).filter(b => HATS.includes(b.type) && b.isEnabled()).map(b => JG.blockToCode(b));
  return JG.finish(parts.join('\n'));
}

/* ---------- MicroPython (for real hardware) ---------- */
const PG = python.pythonGenerator, PO = python.Order;
PG.INFINITE_LOOP_TRAP = null;
PG.INDENT = '    ';
const pv = (b, n, d) => PG.valueToCode(b, n, PO.NONE) || d;
const pyPin = p => 'pin' + p.slice(1);
const pyBtn = k => k === 'AB' ? '(button_a.is_pressed() and button_b.is_pressed())' : `button_${k.toLowerCase()}.is_pressed()`;
const pyInt = s => /^-?\d+$/.test(s) ? s : `int(${s})`;
function need(key, code) { PG.definitions_[key] = code; }
function neoDef(pin) {
  need('import_neopixel', 'import neopixel');
  const p = App.project.parts.find(x => x.type === 'neopixel' && x.pins.DIN === pin);
  const n = p ? p.props.count : 8, name = 'np' + pin.slice(1);
  need('np_' + pin, `${name} = neopixel.NeoPixel(${pyPin(pin)}, ${n})`);
  return name;
}
function pyMotorHelper() {
  need('def_motor', 'def motor(m, speed):\n    # motor driver board: M1 on pin8/pin12, M2 on pin0/pin16\n    a, b = (pin8, pin12) if m == 1 else (pin0, pin16)\n    duty = int(min(100, abs(speed)) * 1023 / 100)\n    if speed >= 0:\n        a.write_analog(duty)\n        b.write_digital(0)\n    else:\n        a.write_digital(0)\n        b.write_analog(duty)');
}
const rgb = c => '(' + NEO_RGB[c].join(', ') + ')';
Object.assign(PG.forBlock, {
  mb_on_start: () => '', mb_forever: () => '', mb_on_button: () => '', mb_on_shake: () => '', mb_on_logo: () => '',
  mb_show_icon: b => `display.show(Image.${b.getFieldValue('ICON')})\n`,
  mb_show_leds: b => `display.show(Image('${ledRows(b).map(r => r.replace(/#/g, '9').replace(/\./g, '0')).join(':')}'))\n`,
  mb_show_number: b => `display.scroll(${pv(b, 'NUM', '0')})\n`,
  mb_show_string: b => `display.scroll(${pv(b, 'TEXT', "''")})\n`,
  mb_clear: () => 'display.clear()\n',
  mb_pause: b => `sleep(${pv(b, 'MS', '0')})\n`,
  mb_plot: b => `display.set_pixel(${pyInt(pv(b, 'X', '0'))}, ${pyInt(pv(b, 'Y', '0'))}, 9)\n`,
  mb_unplot: b => `display.set_pixel(${pyInt(pv(b, 'X', '0'))}, ${pyInt(pv(b, 'Y', '0'))}, 0)\n`,
  mb_button_is: b => [pyBtn(b.getFieldValue('BTN')), PO.ATOMIC],
  mb_logo_touched: () => ['pin_logo.is_touched()', PO.FUNCTION_CALL],
  mb_temperature: () => ['temperature()', PO.FUNCTION_CALL],
  mb_light: () => ['display.read_light_level()', PO.FUNCTION_CALL],
  mb_accel: b => [`accelerometer.get_${b.getFieldValue('AXIS')}()`, PO.FUNCTION_CALL],
  mb_time: () => ['running_time()', PO.FUNCTION_CALL],
  mb_dwrite: b => `${pyPin(b.getFieldValue('PIN'))}.write_digital(${pv(b, 'VAL', '0')})\n`,
  mb_awrite: b => `${pyPin(b.getFieldValue('PIN'))}.write_analog(${pyInt(pv(b, 'VAL', '0'))})\n`,
  mb_dread: b => [`${pyPin(b.getFieldValue('PIN'))}.read_digital()`, PO.FUNCTION_CALL],
  mb_aread: b => [`${pyPin(b.getFieldValue('PIN'))}.read_analog()`, PO.FUNCTION_CALL],
  mb_servo: b => {
    need('def_servo', 'def servo_write(pin, angle):\n    # 0.5 ms to 2.5 ms pulse every 20 ms\n    pin.set_analog_period(20)\n    pin.write_analog(int(26 + max(0, min(180, angle)) * 102 / 180))');
    return `servo_write(${pyPin(b.getFieldValue('PIN'))}, ${pv(b, 'VAL', '90')})\n`;
  },
  mb_map: b => { const [v, a, bb, c, d] = ['V','A','B','C','D'].map(n => pv(b, n, '0')); return [`((${v}) - ${a}) * (${d} - ${c}) / (${bb} - ${a}) + ${c}`, PO.ADDITIVE]; },
  mb_tone: b => { need('import_music', 'import music'); return `music.pitch(${b.getFieldValue('NOTE')}, ${pyInt(pv(b, 'MS', '500'))})\n`; },
  mb_melody: b => { need('import_music', 'import music'); return `music.play(music.${b.getFieldValue('TUNE')})\n`; },
  mb_stop_music: () => { need('import_music', 'import music'); return 'music.stop()\n'; },
  mb_sonar: b => {
    need('import_machine', 'from machine import time_pulse_us');
    need('def_sonar', 'def sonar_cm(trig, echo):\n    echo.read_digital()\n    trig.write_digital(1)\n    trig.write_digital(0)\n    t = time_pulse_us(echo, 1, 25000)\n    return int(t / 58) if t > 0 else 0');
    return [`sonar_cm(${pyPin(b.getFieldValue('TRIG'))}, ${pyPin(b.getFieldValue('ECHO'))})`, PO.FUNCTION_CALL];
  },
  mb_motor: b => { pyMotorHelper(); return `motor(${b.getFieldValue('M').slice(1)}, ${pv(b, 'SPEED', '0')})\n`; },
  mb_motor_stop: b => { pyMotorHelper(); const m = b.getFieldValue('M'); return m === 'both' ? 'motor(1, 0)\nmotor(2, 0)\n' : `motor(${m.slice(1)}, 0)\n`; },
  mb_neo_all: b => { const n = neoDef(b.getFieldValue('PIN')); return `${n}.fill(${rgb(b.getFieldValue('COL'))})\n${n}.show()\n`; },
  mb_neo_px: b => { const n = neoDef(b.getFieldValue('PIN')); return `${n}[${pyInt(pv(b, 'I', '0'))}] = ${rgb(b.getFieldValue('COL'))}\n${n}.show()\n`; },
  mb_neo_clear: b => `${neoDef(b.getFieldValue('PIN'))}.clear()\n`,
  mb_serial: b => `print(${pv(b, 'V', "''")})\n`,
});
// Blockly's own version imports the 'numbers' module, which MicroPython doesn't have
PG.forBlock.math_change = function (b) {
  const name = PG.nameDB_.getName(b.getFieldValue('VAR'), Blockly.Names.NameType.VARIABLE);
  return `${name} += ${pv(b, 'DELTA', '0')}\n`;
};

function toPython(ws) {
  PG.init(ws);
  need('import_microbit', 'from microbit import *');
  const I = PG.INDENT;
  const dedent = s => s.split('\n').map(l => l.startsWith(I) ? l.slice(I.length) : l).join('\n');
  let start = '', loop = '', events = '', loops = 0;
  const body = b => PG.statementToCode(b, 'DO');
  ws.getTopBlocks(true).filter(b => HATS.includes(b.type) && b.isEnabled()).forEach(b => {
    const s = body(b);
    if (b.type === 'mb_on_start') start += dedent(s);
    else if (b.type === 'mb_forever') { loops++; loop += s; }
    else {
      const cond = b.type === 'mb_on_shake' ? "accelerometer.was_gesture('shake')"
        : b.type === 'mb_on_logo' ? 'pin_logo.is_touched()'
        : b.getFieldValue('BTN') === 'AB' ? 'button_a.is_pressed() and button_b.is_pressed()'
        : `button_${b.getFieldValue('BTN').toLowerCase()}.was_pressed()`;
      events += `${I}if ${cond}:\n${PG.prefixLines(s || I + 'pass\n', I)}`;
    }
  });
  let code = start;
  if (loop || events) {
    code += (code ? '\n' : '') + 'while True:\n' + loop + events + (events && !loop ? `${I}sleep(20)\n` : '');
  }
  if (!code.trim()) code = '# Add an "on start" or "forever" block to begin.\n';
  return PG.finish(code).replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

const STARTER = { blocks: { languageVersion: 0, blocks: [
  { type:'mb_on_start', x:30, y:30, inputs:{ DO:{ block:{ type:'mb_show_icon', fields:{ ICON:'HAPPY' } } } } },
  { type:'mb_forever', x:30, y:170 },
] } };
