
/* =========================================================
   MISSION 7 · micro:bit radio
   ========================================================= */
function hl(src){ // tiny highlighter for TypeScript snippets
  const KW = new Set("let const function if else return for of in while true false".split(" "));
  return src.split("\n").map(ln => {
    const ci = ln.indexOf("//"); let code = ci >= 0 ? ln.slice(0, ci) : ln, com = ci >= 0 ? ln.slice(ci) : "";
    code = code.replace(/("[^"]*")|(\b\d+\b)|(\b[A-Za-z_]+\b)/g, (m, s, n, w) => s ? `\u0001s${s}\u0002` : n ? `\u0001n${n}\u0002` : KW.has(w) ? `\u0001k${w}\u0002` : w);
    code = esc(code).replace(/\u0001(\w)(.*?)\u0002/g, (m, c, t) => `<span class="${c}">${t}</span>`);
    return code + (com ? `<span class="c">${esc(com)}</span>` : "");
  }).join("\n");
}
function copyText(t, btn){
  const done = () => { const o = btn.textContent; btn.textContent = "Copied"; setTimeout(() => btn.textContent = o, 1200); };
  if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, () => {}); else { const a = document.createElement("textarea"); a.value = t; document.body.appendChild(a); a.select(); try{ document.execCommand("copy"); done(); }catch(e){} a.remove(); }
}

const MB_CODE = {
  smile: `radio.setGroup(1)
input.onButtonPressed(Button.A, function () {
    radio.sendString("smile")
})
input.onButtonPressed(Button.B, function () {
    radio.sendString("frown")
})
radio.onReceivedString(function (receivedString) {
    if (receivedString == "smile") {
        basic.showIcon(IconNames.Happy)
    } else if (receivedString == "frown") {
        basic.showIcon(IconNames.Sad)
    }
})`,
  num: `let n = 0
radio.setGroup(1)
input.onButtonPressed(Button.A, function () {
    n += 1
    basic.showNumber(n)
})
input.onButtonPressed(Button.B, function () {
    radio.sendNumber(n)
})
radio.onReceivedNumber(function (receivedNumber) {
    basic.showNumber(receivedNumber)
})`,
  pktA: `radio.setGroup(1)
let message = "MEET AT THE BIKE SHED AT 3"
let size = 12
let packets: string[] = []
// split the message into numbered packets like "1/3:MEET AT THE "
let total = Math.ceil(message.length / size)
for (let i = 0; i < total; i++) {
    packets.push("" + (i + 1) + "/" + total + ":" + message.substr(i * size, size))
}
input.onButtonPressed(Button.A, function () {
    for (let p of packets) {
        radio.sendString(p)
        basic.pause(100)
    }
})
radio.onReceivedString(function (receivedString) {
    // the receiver asks for a missing packet, e.g. "RESEND 2"
    if (receivedString.substr(0, 6) == "RESEND") {
        let n = parseInt(receivedString.substr(7))
        radio.sendString(packets[n - 1])
    }
})`,
  pktB: `radio.setGroup(1)
let parts: string[] = []
let total = 0
radio.onReceivedString(function (receivedString) {
    // a packet looks like "2/3:BIKE SHED A"
    let slash = receivedString.indexOf("/")
    let colon = receivedString.indexOf(":")
    let num = parseInt(receivedString.substr(0, slash))
    total = parseInt(receivedString.substr(slash + 1, colon - slash - 1))
    parts[num - 1] = receivedString.substr(colon + 1)
    led.plotBarGraph(num, total)
})
input.onButtonPressed(Button.A, function () {
    // look for a gap and ask for it again
    for (let i = 0; i < total; i++) {
        if (!parts[i]) {
            radio.sendString("RESEND " + (i + 1))
            return
        }
    }
    basic.showString(parts.join(""))
})`,
  ackA: `let me = "A"
radio.setGroup(1)
input.onButtonPressed(Button.A, function () {
    radio.sendString("B:" + me + ":HI")
})
input.onButtonPressed(Button.B, function () {
    radio.sendString("C:" + me + ":HI")
})
radio.onReceivedString(function (receivedString) {
    // TO:FROM:DATA
    let parts = receivedString.split(":")
    if (parts[0] == me) {
        if (parts[2] == "ACK") {
            basic.showIcon(IconNames.Yes)
        } else {
            basic.showString(parts[2])
            radio.sendString(parts[1] + ":" + me + ":ACK")
        }
    }
})`,
  ackB: `let me = "B"
radio.setGroup(1)
input.onButtonPressed(Button.A, function () {
    radio.sendString("A:" + me + ":YO")
})
radio.onReceivedString(function (receivedString) {
    // TO:FROM:DATA
    let parts = receivedString.split(":")
    if (parts[0] == me) {
        if (parts[2] == "ACK") {
            basic.showIcon(IconNames.Yes)
        } else {
            basic.showString(parts[2])
            radio.sendString(parts[1] + ":" + me + ":ACK")
        }
    }
})`,
  iotA: `// Greenhouse SENSOR
radio.setGroup(1)
basic.forever(function () {
    radio.sendValue("temp", input.temperature())
    basic.pause(1000)
})
radio.onReceivedString(function (receivedString) {
    if (receivedString == "FAN ON") {
        basic.showIcon(IconNames.Yes)
    }
})`,
  iotB: `// Greenhouse BASE STATION
radio.setGroup(1)
radio.onReceivedValue(function (name, value) {
    if (name == "temp") {
        if (value > 30) {
            basic.showIcon(IconNames.No)
            music.playTone(Note.C5, music.beat(BeatFraction.Quarter))
        } else {
            led.plotBarGraph(value, 40)
        }
    }
})
input.onButtonPressed(Button.A, function () {
    radio.sendString("FAN ON")
})`,
  lossA: `// SENDER: 100 numbered packets
radio.setGroup(7)
radio.setTransmitPower(0) // try 0, 3 and 7
input.onButtonPressed(Button.A, function () {
    for (let i = 1; i <= 100; i++) {
        radio.sendNumber(i)
        basic.pause(50)
    }
    basic.showIcon(IconNames.Yes)
})`,
  lossB: `// RECEIVER: count what arrives
let count = 0
radio.setGroup(7)
radio.onReceivedNumber(function (receivedNumber) {
    count += 1
})
input.onButtonPressed(Button.A, function () {
    basic.showNumber(count)
})
input.onButtonPressed(Button.B, function () {
    count = 0
    basic.showIcon(IconNames.Yes)
})`,
  sigA: `// BEACON
radio.setGroup(8)
radio.setTransmitPower(1)
basic.forever(function () {
    radio.sendNumber(1)
    basic.pause(200)
})`,
  sigB: `// SIGNAL METER: brighter bar = stronger signal
radio.setGroup(8)
radio.onReceivedNumber(function (receivedNumber) {
    let signal = radio.receivedPacket(RadioPacketProperty.SignalStrength)
    // signal is about -100 (weak) to -42 (strong)
    led.plotBarGraph(signal + 100, 58)
})`,
  relayA: `// SENDER (far end). Low power so it can't reach the receiver directly.
radio.setGroup(9)
radio.setTransmitPower(1)
let id = 0
input.onButtonPressed(Button.A, function () {
    id += 1
    radio.sendString("H0:" + id + ":HELLO")
})`,
  relayM: `// RELAY (in the middle): passes messages on, once each
radio.setGroup(9)
radio.setTransmitPower(1)
let seen: string[] = []
radio.onReceivedString(function (receivedString) {
    // "H1:7:HELLO" = hop count, message id, text
    let parts = receivedString.split(":")
    if (seen.indexOf(parts[1]) >= 0) {
        return // already passed this one on: stops loops
    }
    seen.push(parts[1])
    let hops = parseInt(parts[0].substr(1)) + 1
    basic.showNumber(hops)
    radio.sendString("H" + hops + ":" + parts[1] + ":" + parts[2])
})`,
  relayB: `// RECEIVER (far end)
radio.setGroup(9)
radio.setTransmitPower(1)
radio.onReceivedString(function (receivedString) {
    let parts = receivedString.split(":")
    basic.showString(parts[2] + " " + parts[0])
})`
};

/* 7.2 three-board simulator */
(function(){
  const ICON = {Happy:"0000001010000001000101110", Sad:"0000001010000000111010001", Yes:"0000000001000101010001000", No:"1000101010001000101010001", Heart:"0101011111111110111000100", Clear:"0".repeat(25)};
  const LV = [
    {k:"smile", t:"1 · Send a smile", brief:"Press <b>A</b> on any board to send a smile, <b>B</b> to send a frown. Every board on the same group gets it. Try putting Board C on a different group.", codeA:"smile", codeB:"smile"},
    {k:"num", t:"2 · Numbers", brief:"<b>A</b> adds 1 to that board's number. <b>B</b> sends the number. Messages can carry different <b>data types</b>: text, numbers, or name-and-value pairs.", codeA:"num", codeB:"num"},
    {k:"pkt", t:"3 · Packets", brief:"Board A's message is too long for one radio packet (19 characters max), so it is split into numbered packets. Press <b>A</b> on Board A to send. <b>B</b> on Board A sends with one packet lost. Then press <b>A</b> on Board B to check for gaps and ask for a resend.", codeA:"pktA", codeB:"pktB"},
    {k:"ack", t:"4 · Address + ACK", brief:"The micro:bit radio has no addresses, so we add our own: <span class=\"mono\">TO:FROM:DATA</span>. Board A: <b>A</b> sends to B, <b>B</b> sends to C. The right board replies with an <b>ACK</b> (acknowledgement). Watch what Board C can see, even for messages that aren't for it.", codeA:"ackA", codeB:"ackB"},
    {k:"iot", t:"5 · Greenhouse IoT", brief:"Board A is a greenhouse sensor: drag its temperature. It sends a reading every second. Board B is the base station: it shows a bar, and an alarm above 30 °C. Press <b>A</b> on Board B to send FAN ON back to the greenhouse.", codeA:"iotA", codeB:"iotB"}
  ];
  let lv = store.get("rLevel", 0), timer = null;
  const B = {A:{g:1, n:0}, B:{g:1, n:0}, C:{g:1, n:0}};
  const log = $("#rLog");
  function line(t, c){ const d = document.createElement("div"); if (c) d.className = c; d.innerHTML = t; log.appendChild(d); while (log.children.length > 60) log.firstChild.remove(); log.scrollTop = log.scrollHeight; }
  function board(id){ return $(`.mb[data-id="${id}"]`); }
  function icon(id, name){ const el = board(id); if (!el) return; $$(".led", el).forEach((l, i) => l.classList.toggle("on", ICON[name][i] === "1")); $(".scr-text", el).textContent = ""; }
  function bar(id, v, max){ const el = board(id), rows = Math.round(Math.max(0, Math.min(1, v / max)) * 5); $$(".led", el).forEach((l, i) => l.classList.toggle("on", Math.floor(i / 5) >= 5 - rows)); }
  function text(id, t){ const el = board(id); $$(".led", el).forEach(l => l.classList.remove("on")); $(".scr-text", el).textContent = t; }
  function send(from, msg, kind = "string"){
    line(`<span class="w">${from} → group ${B[from].g}:</span> ${esc(kind === "value" ? `${msg[0]} = ${msg[1]}` : msg)}`);
    ["A","B","C"].filter(x => x !== from && B[x].g === B[from].g && !(lv === 4 && x === "C")).forEach(to => setTimeout(() => recv(to, from, msg, kind), 180 + Math.random() * 120));
  }
  // packet state
  let parts = {B:[], C:[]}, total = 0;
  const MSG = "MEET AT THE BIKE SHED AT 3", SIZE = 12;
  const PK = []; for (let i = 0; i < Math.ceil(MSG.length / SIZE); i++) PK.push(`${i + 1}/${Math.ceil(MSG.length / SIZE)}:${MSG.substr(i * SIZE, SIZE)}`);
  function recv(to, from, msg, kind){
    const k = LV[lv].k;
    if (k === "smile"){ if (msg === "smile") icon(to, "Happy"); else if (msg === "frown") icon(to, "Sad"); }
    else if (k === "num"){ text(to, String(msg)); }
    else if (k === "pkt"){
      if (to === "A" && msg.startsWith("RESEND")){ const n = parseInt(msg.substr(7)); send("A", PK[n - 1]); return; }
      if (to === "A" || msg.startsWith("RESEND")) return;
      const sl = msg.indexOf("/"), co = msg.indexOf(":"), num = parseInt(msg.substr(0, sl)); total = parseInt(msg.substr(sl + 1, co - sl - 1));
      parts[to][num - 1] = msg.substr(co + 1); bar(to, parts[to].filter(Boolean).length, total);
      if (to === "C") line(`<span class="b">C overheard packet ${num}</span> (nobody can stop it listening)`);
    }
    else if (k === "ack"){
      const p = msg.split(":");
      if (p[0] !== to){ if (to === "C") line(`<span class="b">C heard "${esc(msg)}". It's addressed to ${p[0]}, so C ignores it… but it could have read it.</span>`); return; }
      if (p[2] === "ACK"){ icon(to, "Yes"); line(`<span class="g">${to} got an ACK from ${p[1]}: delivery confirmed.</span>`); if (to === "A") Pass.award("radio"); }
      else { text(to, p[2]); send(to, `${p[1]}:${to}:ACK`); }
    }
    else if (k === "iot"){
      if (kind === "value" && to === "B"){ const v = msg[1]; if (v > 30){ icon("B", "No"); text("B", ""); icon("B", "No"); line(`<span class="b">B: ALARM! ${v} °C is too hot. (beep)</span>`); Pass.award("iot"); } else bar("B", v, 40); }
      if (kind === "string" && to === "A" && msg === "FAN ON"){ icon("A", "Yes"); line(`<span class="g">A: fan switched on. Feedback loop complete.</span>`); }
    }
  }
  function press(id, btn){
    const k = LV[lv].k;
    if (k === "smile") send(id, btn === "A" ? "smile" : "frown");
    else if (k === "num"){ if (btn === "A"){ B[id].n++; text(id, String(B[id].n)); } else send(id, B[id].n, "number"); }
    else if (k === "pkt"){
      if (id === "A"){ const drop = btn === "B" ? Math.floor(Math.random() * PK.length) : -1;
        parts = {B:[], C:[]}; ["B","C"].forEach(x => text(x, ""));
        PK.forEach((p, i) => setTimeout(() => { if (i === drop){ line(`<span class="b">A → packet ${i + 1} was lost on the way!</span>`); return; } send("A", p); }, i * 300)); }
      else if (btn === "A"){
        const miss = []; for (let i = 0; i < total; i++) if (!parts[id][i]) miss.push(i + 1);
        if (!total) line(`${id}: nothing received yet.`);
        else if (miss.length) send(id, "RESEND " + miss[0]);
        else { text(id, parts[id].join("")); line(`<span class="g">${id} put the packets back together: "${esc(parts[id].join(""))}"</span>`); }
      }
    }
    else if (k === "ack"){
      if (id === "A") send("A", btn === "A" ? "B:A:HI" : "C:A:HI");
      else if (id === "B" && btn === "A") send("B", "A:B:YO");
      else if (id === "C" && btn === "A") send("C", "A:C:HEY");
    }
    else if (k === "iot"){ if (id === "B" && btn === "A") send("B", "FAN ON"); }
  }
  function build(){
    clearInterval(timer); timer = null;
    const k = LV[lv].k;
    $("#rLevels").innerHTML = LV.map((l, i) => `<button type="button" class="btn sm" aria-pressed="${i === lv}" data-i="${i}">${l.t}</button>`).join("");
    $("#rBrief").innerHTML = LV[lv].brief;
    if (k === "ack" || k === "iot"){ B.C.g = k === "iot" ? 2 : 1; } else B.C.g = 1;
    $("#rBoards").innerHTML = ["A","B","C"].map(id => {
      const off = k === "iot" && id === "C";
      const btns = k === "pkt" ? (id === "A" ? `<button type="button" data-b="A" aria-label="Board A button A: send">A</button><button type="button" data-b="B" aria-label="Board A button B: send and lose one">B</button>` : `<button type="button" data-b="A" aria-label="Board ${id} button A: check for gaps">A</button>`)
        : k === "iot" ? (id === "B" ? `<button type="button" data-b="A" aria-label="Board B button A: fan on">A</button>` : "")
        : k === "ack" && id !== "A" ? `<button type="button" data-b="A" aria-label="Board ${id} button A">A</button>`
        : `<button type="button" data-b="A" aria-label="Board ${id} button A">A</button><button type="button" data-b="B" aria-label="Board ${id} button B">B</button>`;
      return `<div class="mb ${off ? "off" : ""}" data-id="${id}"><span class="lbl">BOARD ${id}${id === "C" ? " (nosy neighbour)" : ""}${k === "iot" ? (id === "A" ? " · sensor" : id === "B" ? " · base" : " · not used") : ""}</span>
        <div class="leds">${"<span class=\"led\"></span>".repeat(25)}</div><div class="scr-text" aria-live="polite"></div>
        <div class="btns">${btns}</div>
        ${k === "iot" && id === "A" ? `<label class="small" style="color:#fff">Temperature <b id="rTempV">22</b> °C</label><input type="range" id="rTemp" min="0" max="40" value="22" aria-label="Greenhouse temperature">` : ""}
        <label class="small" style="color:#fff">Group <select data-g="${id}" ${k === "iot" ? "disabled" : ""}>${[1,2,3].map(g => `<option ${B[id].g === g ? "selected" : ""}>${g}</option>`).join("")}</select></label></div>`;
    }).join("");
    $("#rCodeA").innerHTML = hl(MB_CODE[LV[lv].codeA]); $("#rCodeB").innerHTML = hl(MB_CODE[LV[lv].codeB]);
    log.innerHTML = ""; line(`Level ${LV[lv].t}. Radio ready.`);
    parts = {B:[], C:[]}; total = 0;
    if (k === "iot"){ timer = setInterval(() => { const v = +$("#rTemp").value; send("A", ["temp", v], "value"); }, 1500);
      $("#rTemp").addEventListener("input", e => $("#rTempV").textContent = e.target.value); icon("A", "Heart"); }
  }
  $("#rLevels").onclick = e => { const b = e.target.closest("button"); if (!b) return; lv = +b.dataset.i; store.set("rLevel", lv); build(); };
  $("#rBoards").addEventListener("click", e => { const b = e.target.closest("button[data-b]"); if (!b) return; press(b.closest(".mb").dataset.id, b.dataset.b); });
  $("#rBoards").addEventListener("change", e => { const s = e.target.closest("select[data-g]"); if (!s) return; B[s.dataset.g].g = +s.value; line(`Board ${s.dataset.g} switched to group ${s.value}.`); });
  $("#rCopyA").onclick = e => copyText(MB_CODE[LV[lv].codeA], e.target);
  $("#rCopyB").onclick = e => copyText(MB_CODE[LV[lv].codeB], e.target);
  // stop the sensor timer when the mission isn't on screen
  window.addEventListener("hashchange", () => setTimeout(() => { if ($("#m7").closest(".view").hidden){ clearInterval(timer); timer = null; } else if (LV[lv].k === "iot" && !timer) build(); }, 0));
  build();
})();

/* 7.3 ladder */
(function(){
  const S = [
    ["Send a smile", true, "Two micro:bits talk. The group number is the rule they share.", [["Both boards", "smile"]], `Based on micro:bit's <a href="https://microbit.org/projects/make-it-code-it/teleporting-duck/" target="_blank" rel="noopener">Teleporting duck</a> and Send a smile projects.`],
    ["Number messenger", true, "Send numbers instead of text. Messages can carry different data types.", [["Both boards", "num"]], ""],
    ["Tell me a secret", true, "Use Send a smile again, but put a third board on the same group. Can it read your \"secret\"? Nothing on the micro:bit radio is encrypted.", [["Both boards", "smile"]], `See micro:bit's <a href="https://microbit.org/projects/make-it-code-it/tell-me-a-secret/" target="_blank" rel="noopener">Tell me a secret</a>.`],
    ["Packets", true, "Split a long message into numbered packets, put them back together, and ask for missing ones. Use the MakeCode multi-editor so each board gets different code.", [["Sender", "pktA"], ["Receiver", "pktB"]], ""],
    ["Address + ACK", true, "Add TO:FROM:DATA to every message. Ignore mail that isn't for you. Reply with ACK. Extension: if no ACK comes back within a second, send again.", [["Board A", "ackA"], ["Board B", "ackB"]], "Logic works in the simulator; timing is better on hardware."],
    ["Packet-loss experiment", false, "Send 100 numbered packets. Count how many arrive at 1 m, 5 m, 10 m and through a wall, at power 0, 3 and 7. Record results in 7.4.", [["Sender", "lossA"], ["Receiver", "lossB"]], "Transmit power only works on real micro:bits."],
    ["Signal meter", false, "Make a beacon and a meter. The bar grows as you get closer. This is feedback: sensed data changes what the system shows.", [["Beacon", "sigA"], ["Meter", "sigB"]], `Like micro:bit's <a href="https://microbit.org/projects/make-it-code-it/proximity-beacon/" target="_blank" rel="noopener">Proximity beacon</a>.`],
    ["Relay (repeater)", false, "Put three micro:bits in a line, too far apart for the ends to hear each other. The middle one passes messages on and adds 1 to the hop count. It remembers message IDs so it never passes the same one twice.", [["Sender", "relayA"], ["Relay", "relayM"], ["Receiver", "relayB"]], "Use low power (1) and spread out. Test it before you trust it."],
    ["Greenhouse IoT", true, "A sensor board sends temperature; a base station raises an alarm and can send a command back. In the simulator, drag the temperature slider.", [["Sensor", "iotA"], ["Base station", "iotB"]], "Add a servo or buzzer for a real prototype."],
    ["Whole-class network", false, "Put everyone on one group and try a big system: a voting machine, fireflies that flash in sync, or an infection game. What happens to the network when 30 boards talk at once?", [], `Ideas: <a href="https://makecode.microbit.org/projects/radio-games" target="_blank" rel="noopener">MakeCode Radio Games</a> and <a href="https://makecode.microbit.org/projects/fireflies" target="_blank" rel="noopener">Fireflies</a>.`]
  ];
  const done = store.get("ladderDone", []);
  $("#ladderSteps").innerHTML = S.map(([t, sim, d, codes, note], i) => `<details class="step"><summary><span class="mono">${String(i + 1).padStart(2, "0")}</span> ${esc(t)} <span class="hw ${sim ? "" : "real"}">${sim ? "Simulator OK" : "Real micro:bits"}</span>${done[i] ? ` <span class="tag ok">done</span>` : ""}</summary><div class="inner"><p>${d}</p>
    ${codes.map(([lab, k]) => `<div><div class="row" style="justify-content:space-between"><span class="small">${esc(lab)}</span><button type="button" class="btn sm" data-copy="${k}">Copy</button></div><pre class="code">${hl(MB_CODE[k])}</pre></div>`).join("")}
    ${note ? `<p class="small">${note}</p>` : ""}
    <label class="small"><input type="checkbox" data-done="${i}" ${done[i] ? "checked" : ""}> We got this working on our micro:bits</label>
    <label class="small" for="dbg${i}">Debug log: what went wrong, and how did you fix it?</label><textarea id="dbg${i}" data-save="dbg-${i}"></textarea></div></details>`).join("");
  $$("#ladderSteps [data-save]").forEach(bindSave);
  $("#ladderSteps").addEventListener("click", e => { const b = e.target.closest("[data-copy]"); if (b) copyText(MB_CODE[b.dataset.copy], b); });
  $("#ladderSteps").addEventListener("change", e => { const c = e.target.closest("[data-done]"); if (!c) return; done[+c.dataset.done] = c.checked; store.set("ladderDone", done); });
})();

/* 7.4 experiment */
(function(){
  const D = ["1 m","5 m","10 m","20 m","Behind a wall"], P = [0, 3, 7];
  const v = store.get("exp", {});
  $("#expTbl").innerHTML = `<thead><tr><th>Distance</th>${P.map(p => `<th>Power ${p}</th>`).join("")}</tr></thead><tbody>${D.map((d, i) => `<tr><td>${d}</td>${P.map(p => `<td><input type="number" min="0" max="100" style="width:80px" data-k="${i}-${p}" value="${v[i + "-" + p] ?? ""}" aria-label="Packets received at ${d}, power ${p}"></td>`).join("")}</tr>`).join("")}</tbody>`;
  const NS = "http://www.w3.org/2000/svg", svg = $("#expChart"), COL = ["var(--then)","var(--now)","var(--next)"];
  function draw(){
    let s = `<line class="ax" x1="40" y1="180" x2="590" y2="180"/>`;
    [0, 50, 100].forEach(t => { const y = 180 - t * 1.5; s += `<line class="grid" x1="40" y1="${y}" x2="590" y2="${y}"/><text x="34" y="${y + 4}" text-anchor="end">${t}</text>`; });
    D.forEach((d, i) => { const gx = 50 + i * 108; P.forEach((p, j) => { const val = Math.max(0, Math.min(100, +v[i + "-" + p] || 0)); s += `<rect x="${gx + j * 28}" y="${180 - val * 1.5}" width="24" height="${val * 1.5}" fill="${COL[j]}" rx="3"/>`; }); s += `<text x="${gx + 40}" y="198" text-anchor="middle">${d}</text>`; });
    P.forEach((p, j) => s += `<rect x="${420 + j * 58}" y="4" width="12" height="12" fill="${COL[j]}" rx="2"/><text x="${436 + j * 58}" y="14">P${p}</text>`);
    s += `<text x="40" y="214">Packets received out of 100</text>`;
    svg.innerHTML = s;
  }
  $("#expTbl").addEventListener("input", e => { const i = e.target.closest("input[data-k]"); if (!i) return; v[i.dataset.k] = i.value; store.set("exp", v); draw(); });
  draw();
})();

/* =========================================================
   MISSION 8
   ========================================================= */
(function(){
  const TR = [[1971,2300,"Intel 4004"],[1974,4500,"Intel 8080"],[1976,8500,"Z80 (ZX Spectrum)"],[1979,29000,"Intel 8088 (IBM PC)"],[1985,275000,"Intel 386"],[1993,3.1e6,"Pentium"],[2000,4.2e7,"Pentium 4"],[2006,2.91e8,"Core 2 Duo"],[2013,1e9,"Apple A7"],[2016,3.3e9,"Apple A10"],[2023,1.9e10,"Apple A17 Pro"]];
  const HID = [[2024,2.8e10,"Apple M4"],[2024,2.08e11,"Nvidia B200 (AI chip)"]];
  const CK = [[1969,2.048,"Apollo computer"],[1981,4.77,"IBM PC"],[1982,3.5,"ZX Spectrum"],[1994,33.87,"PlayStation"],[2000,294.9,"PlayStation 2"],[2007,412,"iPhone"],[2020,3500,"PlayStation 5"],[2023,3780,"Apple A17 Pro"],[2025,4610,"Apple M5"]];
  let scale = "lin", series = "tr", revealed = store.get("mRevealed", false);
  const svg = $("#mChart");
  function big(n){ if (n >= 1e12) return (n / 1e12).toFixed(n >= 1e13 ? 0 : 1) + " trillion"; if (n >= 1e9) return +(n / 1e9).toFixed(1) + " billion"; if (n >= 1e6) return +(n / 1e6).toFixed(1) + " million"; if (n >= 1e3) return fmt(Math.round(n)); return String(n); }
  function draw(){
    const W = 640, H = 320, L = 70, R = 20, T = 20, Bm = 40, x0 = 1965, x1 = 2030;
    const pts = series === "tr" ? TR.concat(revealed ? HID : []) : CK;
    const vmax = series === "tr" ? (revealed ? 2.08e11 : 1.9e10) : 5000, vmin = series === "tr" ? 1e3 : 1;
    const X = x => L + (x - x0) / (x1 - x0) * (W - L - R);
    const Y = v => scale === "log" ? H - Bm - (Math.log10(v) - Math.log10(vmin)) / (Math.log10(vmax * 3) - Math.log10(vmin)) * (H - T - Bm) : H - Bm - v / (vmax * 1.08) * (H - T - Bm);
    let s = "";
    const ticks = scale === "log" ? (() => { const a = []; for (let e = Math.log10(vmin); e <= Math.log10(vmax * 3); e++) a.push(10 ** e); return a; })() : [0, .25, .5, .75, 1].map(f => f * vmax);
    ticks.forEach(t => { const y = Y(Math.max(t, scale === "log" ? vmin : 0)); s += `<line class="grid" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/><text x="${L - 6}" y="${y + 4}" text-anchor="end">${series === "tr" ? big(t) : t >= 1000 ? (t / 1000) + " GHz" : t + " MHz"}</text>`; });
    for (let yr = 1970; yr <= 2030; yr += 10) s += `<text x="${X(yr)}" y="${H - Bm + 18}" text-anchor="middle">${yr}</text>`;
    s += `<line class="ax" x1="${L}" y1="${H - Bm}" x2="${W - R}" y2="${H - Bm}"/><line class="ax" x1="${L}" y1="${T}" x2="${L}" y2="${H - Bm}"/>`;
    const sorted = pts.slice().sort((a, b) => a[0] - b[0]);
    s += `<polyline class="${series === "tr" ? "ln" : "ln2"}" points="${sorted.map(p => `${X(p[0])},${Y(p[1])}`).join(" ")}"/>`;
    if (series === "clk") s += `<rect x="${X(2005)}" y="${Y(4000) - 8}" width="${X(2030) - X(2005)}" height="16" fill="var(--bad)" opacity=".15"/><text x="${X(2005) + 4}" y="${Y(4000) - 12}" style="fill:var(--bad)">the ~4 GHz wall</text>`;
    pts.forEach(p => s += `<circle class="${series === "tr" ? "pt" : "pt2"}" cx="${X(p[0])}" cy="${Y(p[1])}" r="5"><title>${p[2]} (${p[0]}): ${series === "tr" ? big(p[1]) + " transistors" : fmtMHz(p[1])}</title></circle>`);
    if (series === "tr" && !revealed) s += `<text x="${X(2024)}" y="${T + 14}" text-anchor="middle" style="fill:var(--next)">2024: ?</text>`;
    s += `<text x="${L}" y="${H - 6}">${series === "tr" ? "Transistors on one chip" : "Clock speed of machines in this unit"} · ${scale === "log" ? "log scale: each line is 10× the one below" : "normal scale"}</text>`;
    svg.innerHTML = s;
  }
  seg($("#mScale"), v => { scale = v; draw(); });
  seg($("#mSeries"), v => { series = v; draw(); });
  const g = $("#mGuess");
  const showG = () => $("#mGuessTxt").textContent = "about " + big(10 ** +g.value);
  g.addEventListener("input", showG); showG();
  function fbReveal(){
    const guess = 10 ** +g.value, ratio = Math.max(guess, 2.08e11) / Math.min(guess, 2.08e11);
    $("#mGuessFb").innerHTML = `<span class="fb ${ratio <= 10 ? "ok" : "mid"}">Nvidia's B200 AI chip (2024) has about <b>208 billion</b> transistors. Apple's M4 (2024) has 28 billion. Your guess was ${ratio <= 10 ? "within 10 times: great trend-reading!" : `about ${fmt(Math.round(ratio))} times out.`} One company even made a chip the size of a dinner plate with about <b>4 trillion</b>.</span>`;
  }
  $("#mReveal").onclick = () => { revealed = true; store.set("mRevealed", true); setSeg($("#mSeries"), "tr"); series = "tr"; draw(); fbReveal();
    const guess = 10 ** +g.value; if (Math.max(guess, 2.08e11) / Math.min(guess, 2.08e11) <= 10) Pass.award("trend"); };
  draw();
})();

/* 8.3 power league */
(function(){
  const D = [["Shrinking parts","Smaller transistors mean more power in a smaller, lighter device."],["Speed","Faster processors and graphics chips."],["Storage capacity","Room for thousands of photos, songs and apps."],["Connectivity","4G, 5G, Wi-Fi and the internet: always online."],["Falling cost","Cheaper parts, so millions of people can afford one."],["Energy and batteries","Chips that use less power, and better batteries, so it lasts all day."],["What people wanted","Demand: people wanted to message friends, take photos, play games."],["Chance and timing","Lucky breaks: the right idea arriving when the tech was finally ready."]];
  $("#drvList").innerHTML = D.map(([n, d]) => `<li><b>${n}:</b> ${d}</li>`).join("");
  let st = store.get("league", null);
  if (!st){ const pairs = []; for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) pairs.push([i, j]); st = {pairs: shuffle(pairs).slice(0, 14), i: 0, w: D.map(() => 0)}; }
  function draw(){
    const max = Math.max(1, ...st.w), order = D.map((d, i) => i).sort((a, b) => st.w[b] - st.w[a]);
    $("#duelRank").innerHTML = order.map((i, r) => `<div><span class="mono">${r + 1}</span><span>${D[i][0]}<div class="bar" style="width:${st.w[i] / max * 100}%"></div></span><span class="mono">${st.w[i]} win${st.w[i] === 1 ? "" : "s"}</span></div>`).join("");
    if (st.i >= st.pairs.length){ $("#duel").innerHTML = `<div class="panel" style="grid-column:1/-1"><b>League complete.</b> Your ranking is below. <button type="button" class="btn sm" id="duelAgain">Play again</button></div>`; $("#duelLeft").textContent = ""; Pass.award("league");
      $("#duelAgain").onclick = () => { store.set("league", null); st = null; const pairs = []; for (let i = 0; i < D.length; i++) for (let j = i + 1; j < D.length; j++) pairs.push([i, j]); st = {pairs: shuffle(pairs).slice(0, 14), i: 0, w: D.map(() => 0)}; draw(); }; return; }
    const [a, b] = st.pairs[st.i];
    $("#duel").innerHTML = `<button type="button" data-w="${a}">${D[a][0]}</button><span class="or">OR</span><button type="button" data-w="${b}">${D[b][0]}</button>`;
    $("#duelLeft").textContent = `Match ${st.i + 1} of ${st.pairs.length}: which mattered more for smartphones?`;
  }
  $("#duel").addEventListener("click", e => { const b = e.target.closest("button[data-w]"); if (!b) return; st.w[+b.dataset.w]++; st.i++; store.set("league", st); draw(); $("#duel button")?.focus(); });
  draw();
})();
