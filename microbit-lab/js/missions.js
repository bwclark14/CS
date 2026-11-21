/* Bit Bench: missions. Each one sets up parts and has an automatic check that drives the inputs and watches the outputs. */
'use strict';

const P = (type, pins, props, x, y) => ({ type, pins: pins || {}, props: props || {}, x, y });

const MISSIONS = [
  { id:'hello', title:'Hello, micro:bit', level:'Start here', parts:[],
    goal:'Show a heart when button A is pressed and a happy face when button B is pressed.',
    steps:['Drag an <b>on button A pressed</b> block (Input) into the workspace.','Put <b>show icon heart</b> (Basic) inside it.','Do the same for button B with a happy face.','Press Run, then click A and B on the micro:bit.'],
    hint:'You need two separate <b>on button … pressed</b> blocks: one for A, one for B.',
    real:'On a real micro:bit buttons A and B are wired to pins P5 and P11. That is why the Wiring check warns you if you use those pins.',
    async check(t) {
      await t.wait(400); await t.press('A');
      if (!await t.until(() => t.isIcon('HEART'), 1500)) t.fail('After pressing A the display did not show a heart.');
      await t.press('B');
      if (!await t.until(() => t.isIcon('HAPPY'), 1500)) t.fail('After pressing B the display did not show a happy face.');
    } },

  { id:'blink', title:'Blink an LED', level:'★', parts:[P('led', { SIG:'P0' }, { color:'red' })],
    goal:'Make the LED on P0 flash on and off every half a second, for ever.',
    steps:['Use a <b>forever</b> block.','Inside: <b>digital write pin P0 to 1</b>, <b>pause 500</b>, <b>digital write pin P0 to 0</b>, <b>pause 500</b>.','Run it.'],
    hint:'Without the second pause the LED switches off and straight back on, too fast to see.',
    real:'A bare LED needs a resistor (about 100 Ω) in series or it can burn out. LED modules like this one have the resistor built in. Connect the long leg (+) to the pin and the short leg to GND.',
    async check(t) {
      const led = t.part('led');
      const n = await t.countChanges(() => t.led(led) > 0.5, 4000);
      if (n < 4) t.fail(`The LED changed ${n} time${n === 1 ? '' : 's'} in 4 seconds. It should flash on and off at least twice.`);
    } },

  { id:'traffic', title:'Traffic lights', level:'★', parts:[P('traffic', { R:'P0', Y:'P1', G:'P2' })],
    goal:'Run a UK traffic light sequence: red, red and amber, green, amber, then back to red.',
    steps:['In <b>forever</b>, turn on red (P0) and pause.','Add yellow (P1) as well, pause.','Turn off red and yellow, turn on green (P2), pause.','Green off, yellow on, pause. Yellow off.'],
    hint:'Every light you turn on must be turned off again with <b>digital write … to 0</b>.',
    real:'Real traffic lights are a classic example of a sequence controlled by a timer, and also a safety system: green and red must never be on together.',
    async check(t) {
      const tl = t.part('traffic'); const seen = new Set();
      await t.watch(() => { const s = ['R','Y','G'].map(k => t.led(tl, k) > 0.5 ? k : '-').join(''); seen.add(s); }, 12000, () => ['R--','RY-','--G','-Y-'].every(s => seen.has(s)));
      if (seen.has('R-G') || seen.has('RYG')) t.fail('Red and green were on at the same time. That would be dangerous at a real crossing!');
      const miss = [['R--','red on its own'],['RY-','red and amber'],['--G','green on its own'],['-Y-','amber on its own']].filter(([s]) => !seen.has(s)).map(x => x[1]);
      if (miss.length) t.fail('These steps never showed: ' + miss.join(', ') + '.');
    } },

  { id:'night', title:'Night light', level:'★★', parts:[P('ldr', { SIG:'P1' }), P('led', { SIG:'P0' }, { color:'yellow' })],
    goal:'Turn the LED on when it gets dark (light sensor reads below 300) and off when it is light.',
    steps:['In <b>forever</b>, add an <b>if … else</b> block (Logic).','Condition: <b>analog read pin P1</b> &lt; <b>300</b>.','If true: <b>digital write pin P0 to 1</b>. Else: write 0.','Run it and move the light sensor slider in the Inputs tab.'],
    hint:'Use <b>Serial write</b> with <b>analog read pin P1</b> to see the sensor value while you test.',
    real:'Street lights work like this. The number 300 is a threshold: choosing a good one means testing in real light, which is why engineers log sensor readings first.',
    async check(t) {
      const ldr = t.part('ldr'), led = t.part('led');
      t.set(ldr, 'value', 800);
      if (!await t.until(() => t.led(led) < 0.5, 1500)) t.fail('When it was bright (800) the LED stayed on.');
      t.set(ldr, 'value', 100);
      if (!await t.until(() => t.led(led) > 0.5, 1500)) t.fail('When it was dark (100) the LED did not come on.');
      t.set(ldr, 'value', 900);
      if (!await t.until(() => t.led(led) < 0.5, 1500)) t.fail('When it got bright again the LED did not go off.');
    } },

  { id:'dimmer', title:'Dimmer switch', level:'★★', parts:[P('pot', { SIG:'P1' }), P('led', { SIG:'P0' }, { color:'white' })],
    goal:'Make the potentiometer control how bright the LED is.',
    steps:['In <b>forever</b>, use <b>analog write pin P0 to …</b>.','Plug <b>analog read pin P1</b> into it.','Turn the dial in the Inputs tab.'],
    hint:'Analog read gives 0 to 1023 and analog write takes 0 to 1023, so you can plug one straight into the other.',
    real:'The micro:bit can\'t make a real in-between voltage. Analog write flicks the pin on and off very fast (PWM): the more time it is on, the brighter the LED looks.',
    async check(t) {
      const pot = t.part('pot'), led = t.part('led');
      t.set(pot, 'value', 0);
      if (!await t.until(() => t.led(led) < 0.1, 1500)) t.fail('With the dial at 0 the LED should be off.');
      t.set(pot, 'value', 1023);
      if (!await t.until(() => t.led(led) > 0.9, 1500)) t.fail('With the dial at 1023 the LED should be fully bright.');
      t.set(pot, 'value', 512);
      if (!await t.until(() => t.led(led) > 0.35 && t.led(led) < 0.65, 1500)) t.fail('With the dial halfway the LED should be about half bright. Are you using analog write?');
    } },

  { id:'gauge', title:'Servo gauge', level:'★★', parts:[P('pot', { SIG:'P1' }), P('servo', { SIG:'P0' })],
    goal:'Make the servo arm follow the dial: 0 points at 0°, 1023 points at 180°.',
    steps:['In <b>forever</b>, add <b>servo write pin P0 to …</b>.','Use <b>map</b> to turn the 0–1023 reading into 0–180.','Put <b>analog read pin P1</b> in the first gap of map.'],
    hint:'map ( analog read P1 ) from low 0 high 1023 to low 0 high 180',
    real:'Servos draw a lot of current when they move. On a real build, power more than one servo from a battery pack on a breakout board, not from the micro:bit.',
    async check(t) {
      const pot = t.part('pot'), sv = t.part('servo');
      t.set(pot, 'value', 0);
      if (!await t.until(() => t.servo(sv) !== null && t.servo(sv) < 15, 1500)) t.fail('With the dial at 0 the servo should point near 0°.');
      t.set(pot, 'value', 1023);
      if (!await t.until(() => t.servo(sv) > 165, 1500)) t.fail('With the dial at 1023 the servo should point near 180°.');
      t.set(pot, 'value', 512);
      if (!await t.until(() => t.servo(sv) > 70 && t.servo(sv) < 110, 1500)) t.fail('With the dial halfway the servo should point near 90°. Did you use map?');
    } },

  { id:'plant', title:'Thirsty plant', level:'★★', parts:[P('moisture', { SIG:'P1' })],
    goal:'Show a sad face when the soil is dry (below 300) and a happy face when it is wet enough.',
    steps:['In <b>forever</b>, use <b>if … else</b>.','Test <b>analog read pin P1</b> &lt; 300.','Show the sad icon if true, the happy icon if not.'],
    hint:'Moisture sensors give a low number when the soil is dry.',
    real:'Moisture sensors corrode if they are powered all the time. Real projects often power them from a pin and switch them on only when taking a reading.',
    async check(t) {
      const m = t.part('moisture');
      t.set(m, 'value', 100);
      if (!await t.until(() => t.isIcon('SAD'), 1500)) t.fail('Dry soil (100) should show a sad face.');
      t.set(m, 'value', 700);
      if (!await t.until(() => t.isIcon('HAPPY'), 1500)) t.fail('Wet soil (700) should show a happy face.');
    } },

  { id:'alarm', title:'Intruder alarm', level:'★★', parts:[P('pir', { SIG:'P1' }), P('buzzer', { SIG:'P0' })],
    goal:'When the motion sensor sees movement, sound the alarm.',
    steps:['In <b>forever</b>, add an <b>if</b> block.','Test <b>digital read pin P1</b> = 1.','Inside, <b>play tone</b> or <b>play melody</b>.','Run it, then switch Motion on in the Inputs tab.'],
    hint:'Digital read gives 1 when there is motion.',
    real:'PIR stands for passive infrared: it senses the heat given off by people. Most PIR modules take up to a minute to settle after power-up, so real alarms ignore the first readings.',
    async check(t) {
      const pir = t.part('pir');
      t.set(pir, 'on', false);
      await t.wait(300);
      if (await t.until(() => t.tone(), 1200)) t.fail('The alarm sounded when nothing was moving.');
      t.set(pir, 'on', true);
      if (!await t.until(() => t.tone(), 2000)) t.fail('Motion was detected but the buzzer stayed quiet. Is the buzzer on P0?');
    } },

  { id:'parking', title:'Parking sensor', level:'★★★', parts:[P('sonar', { TRIG:'P1', ECHO:'P2' }, { mount:'none' }), P('buzzer', { SIG:'P0' })],
    goal:'Beep when something is closer than 20 cm. Stay quiet when it is further away.',
    steps:['In <b>forever</b>, use an <b>if</b> block.','Test <b>sonar distance TRIG P1 ECHO P2</b> &lt; 20.','Play a short tone inside.','Bonus: make it beep faster as things get closer.'],
    hint:'Use a short tone, like 100 ms, followed by a pause.',
    real:'Most ultrasonic sensors are made for 5 V. With a micro:bit, use a 3 V version (or a level shifter), or the readings will be wrong.',
    async check(t) {
      const s = t.part('sonar');
      t.set(s, 'value', 80); await t.wait(300);
      if (await t.until(() => t.tone(), 1200)) t.fail('It beeped when the nearest thing was 80 cm away.');
      t.set(s, 'value', 10);
      if (!await t.until(() => t.tone(), 2000)) t.fail('Something was 10 cm away but there was no beep.');
    } },

  { id:'mood', title:'Mood lamp', level:'★★', parts:[P('neopixel', { DIN:'P0' }, { count:'8' })],
    goal:'Button A turns the NeoPixel strip red. Button B turns it blue.',
    steps:['Use <b>on button A pressed</b> with <b>NeoPixel on P0 show colour red</b>.','Do the same for B with blue.','Bonus: use <b>set LED</b> in a loop to make a rainbow.'],
    hint:'The NeoPixel blocks are in their own category.',
    real:'Each NeoPixel can use up to 60 mA at full white. A long strip needs its own power supply, never the micro:bit\'s 3 V pin.',
    async check(t) {
      await t.wait(300); await t.press('A');
      if (!await t.until(() => t.neoAll('P0', 'red'), 1500)) t.fail('After button A the strip was not all red.');
      await t.press('B');
      if (!await t.until(() => t.neoAll('P0', 'blue'), 1500)) t.fail('After button B the strip was not all blue.');
    } },

  { id:'drive', title:'First drive', level:'Rover ★★', arena:'room',
    parts:[P('motordriver'), P('motor', { M:'M1' }), P('motor', { M:'M2' })],
    goal:'Build a rover. Drive forward when button A is pressed. Stop when button B is pressed.',
    steps:['On button A: <b>motor M1 run at 60</b> and <b>motor M2 run at 60</b>.','On button B: <b>stop motor both</b>.','Open the Rover arena tab, Run, and press A.'],
    hint:'Motor M1 is the left wheel and M2 is the right wheel. Both must turn the same way to go straight.',
    real:'A motor driver is needed because motors take far more current than a micro:bit pin can give, and they make electrical noise. The driver board has its own batteries.',
    async check(t) {
      await t.arena('room'); await t.wait(300);
      await t.press('A'); await t.wait(2000);
      if (t.stats().dist < 40) t.fail('After pressing A the rover hardly moved.');
      await t.press('B'); await t.wait(400);
      const d = t.stats().dist; await t.wait(1000);
      if (t.stats().dist - d > 3) t.fail('After pressing B the rover kept moving.');
    } },

  { id:'dodger', title:'Wall dodger', level:'Rover ★★★', arena:'room',
    parts:[P('motordriver'), P('motor', { M:'M1' }), P('motor', { M:'M2' }), P('sonar', { TRIG:'P13', ECHO:'P14' }, { mount:'front' })],
    goal:'Drive around the obstacle room for 20 seconds without crashing. Use the sonar to spot walls.',
    steps:['In <b>forever</b>: if <b>sonar distance TRIG P13 ECHO P14</b> &lt; 20, back up a little and turn.','Else, drive forward.','Turn by running one motor forward and the other backward.'],
    hint:'Turn for a set time, e.g. M1 at 50, M2 at -50, pause 400 ms. Try different times.',
    real:'Robot vacuum cleaners started with exactly this rule: drive until you bump or sense something, then turn.',
    async check(t) {
      await t.arena('room'); await t.wait(20000);
      const s = t.stats();
      if (s.dist < 250) t.fail(`The rover only travelled ${(s.dist / 200).toFixed(2)} m. It needs to keep exploring (at least 1.25 m).`);
      if (s.bumps > 1) t.fail(`The rover crashed ${s.bumps} times. Try turning sooner or for longer.`);
    } },

  { id:'liner', title:'Line follower', level:'Rover ★★★', arena:'line',
    parts:[P('motordriver'), P('motor', { M:'M1' }), P('motor', { M:'M2' }), P('line', { SIG:'P13' }, { mount:'left' }), P('line', { SIG:'P14' }, { mount:'right' })],
    goal:'Follow the black line round the track for 20 seconds.',
    steps:['The two sensors sit either side of the line. Each reads 1 when it is over black.','If the left sensor (P13) sees black, steer left: slow M1, speed up M2.','If the right sensor (P14) sees black, steer right.','Otherwise drive straight.'],
    hint:'Use slow speeds (about 40) while you test. Fast rovers overshoot the bends.',
    real:'Warehouse robots and some factory carts follow lines or tape on the floor in just this way.',
    async check(t) {
      await t.arena('line'); await t.wait(20000);
      const s = t.stats(), pct = s.moving ? s.onLine / s.moving : 0;
      if (s.dist < 400) t.fail(`The rover only travelled ${(s.dist / 200).toFixed(2)} m. It needs to get at least 2 m round the track.`);
      if (pct < 0.7) t.fail(`The rover was on the line ${Math.round(pct * 100)}% of the time. Aim for at least 70%.`);
    } },

  { id:'maze', title:'Maze challenge', level:'Rover ★★★★', arena:'maze',
    parts:[P('motordriver'), P('motor', { M:'M1' }), P('motor', { M:'M2' }), P('sonar', { TRIG:'P13', ECHO:'P14' }, { mount:'front' })],
    goal:'Get from the start to the green finish within 60 seconds.',
    steps:['Plan the route first: how far forward, which way to turn.','Time your turns: how long does a 90° turn take at your speed?','Or try a smarter way: use the sonar to decide when to turn.'],
    hint:'A quarter turn at speed 50 in each direction takes about 0.4 seconds. Test and adjust.',
    real:'Micromouse competitions have run since the 1970s: tiny robots race to solve a maze they have never seen.',
    async check(t) {
      await t.arena('maze');
      if (!await t.until(() => t.stats().goal, 60000)) t.fail('The rover did not reach the finish within 60 seconds.');
    } },
];

/* ---------- the test harness ---------- */
class MissionFail extends Error {}
function makeHarness(token) {
  const live = () => { if (token.cancel) throw new MissionFail('Check stopped.'); };
  const t = {
    wait: ms => new Promise(r => setTimeout(r, ms)).then(live),
    async until(fn, ms) { const end = performance.now() + ms; while (performance.now() < end) { live(); if (!RT.running) return false; if (fn()) return true; await new Promise(r => setTimeout(r, 25)); } return fn(); },
    async watch(fn, ms, done) { const end = performance.now() + ms; while (performance.now() < end) { live(); fn(); if (done && done()) return; await new Promise(r => setTimeout(r, 25)); } },
    async countChanges(fn, ms) { let last = fn(), n = 0; await t.watch(() => { const v = fn(); if (v !== last) { n++; last = v; } }, ms); return n; },
    async press(b) { HW.buttons[b] = true; RT.fire('button', b); App.paintButtons(); await t.wait(150); HW.buttons[b] = false; App.paintButtons(); await t.wait(50); },
    part(type) { return App.project.parts.find(p => p.type === type); },
    set(p, k, v) { p.state[k] = v; App.renderInputs(); },
    led(p, k) { return HW.ledLevel(p.pins[k || 'SIG']); },
    servo(p) { return HW.servoValue(p.pins.SIG); },
    tone() { return HW.tone > 0 && App.project.parts.some(p => p.type === 'buzzer' && p.pins.SIG === 'P0'); },
    isIcon(name) { const rows = ICONS[name]; return HW.display.every((v, i) => (v > 0) === (rows[Math.floor(i / 5)][i % 5] === '#')); },
    neoAll(pin, col) { const a = HW.neo[pin]; return !!a && a.every(c => c === col); },
    async arena(k) { App.setView('arena'); document.getElementById('arenaPick').value = k; Arena.setArena(k); await t.wait(50); },
    stats() { return Arena.stats; },
    fail(msg) { throw new MissionFail(msg); },
  };
  return t;
}
