
/* =========================================================
   PART 2.2  Prediction lab
   ========================================================= */
(function(){
  const P = [
    {y:"1974", who:"Arthur C. Clarke, ABC TV interview", p:"A child today will have a computer at home that gives them bank statements, theatre bookings and all the information they need, and people will be able to work from anywhere.", v:"hit", happened:"Online banking, booking and remote working are everyday life.", then:"Computers filled rooms and cost a fortune. No public network linked homes.", now:"Microprocessors, cheap memory, the internet and broadband."},
    {y:"1979", who:"Tomorrow’s World", p:"You will carry a telephone with you and make calls on the move.", v:"hit", happened:"Most UK secondary pupils own a smartphone.", then:"Heavy batteries, few masts, analogue radio, large chips.", now:"Cellular networks, lithium-ion batteries and tiny low-power chips."},
    {y:"1979", who:"BBC report on word processors", p:"Word processors will start a home working revolution: office work done from home.", v:"part", happened:"It came true, but about 40 years later: home working only became normal for millions during 2020.", then:"No fast home network to share documents. Offices expected people at desks.", now:"Broadband, cloud documents, video calls, and a pandemic that forced the change."},
    {y:"1984", who:"Gateshead teleshopping trial", p:"Older people will order their groceries from home using a TV and phone line. (72-year-old Jane Snowball did it in May 1984.)", v:"hit", happened:"Online grocery shopping is normal, but took about 20 years to become common.", then:"A specially modified TV, slow phone-line connections, very few users.", now:"Home broadband, smartphones, secure online payments and delivery networks."},
    {y:"1986", who:"Tomorrow’s World", p:"Email will let people send messages instantly to anyone with a computer.", v:"hit", happened:"Billions of emails are sent every day, and messaging apps went even further.", then:"Few people had a computer, modems were slow and networks didn’t link up.", now:"The internet joined the world’s networks together; everyone has a device."},
    {y:"1986", who:"Tomorrow’s World", p:"Cars will have screens showing a map and your position, guiding you to where you want to go.", v:"hit", happened:"Sat nav is built into phones and cars.", then:"The GPS satellite network wasn’t finished, and its accuracy for public use was deliberately limited.", now:"A full GPS constellation (plus others), colour screens, and live traffic over mobile data."},
    {y:"1981", who:"Tomorrow’s World, compact disc launch", p:"The compact disc is tough enough to survive rough treatment and will give perfect sound for ever.", v:"miss", happened:"CDs scratch and can fail. And for most people they were replaced by downloads, then streaming.", then:"CDs were brand new and only lab-tested.", now:"Fast networks made physical music media unnecessary for most listeners."},
    {y:"1989", who:"Tomorrow’s World, home of the future", p:"By 2020, music will play when you ask for it out loud.", v:"hit", happened:"Smart speakers and voice assistants do exactly this.", then:"Speech recognition needed far more processing power than a home could afford.", now:"Cloud data centres, machine learning trained on huge amounts of speech, and fast home Wi-Fi."},
    {y:"1989", who:"Tomorrow’s World, home of the future", p:"By 2020, heating will learn your routine and only heat rooms that are being used.", v:"hit", happened:"Smart thermostats and room-by-room smart valves exist, though not every home has them.", then:"No cheap sensors or home networks to connect them.", now:"Cheap temperature and motion sensors, Wi-Fi and phone apps."},
    {y:"1989", who:"Tomorrow’s World, home of the future", p:"By 2020, walls will switch from solid to see-through and show films.", v:"miss", happened:"Smart glass exists but is expensive and rare in homes. TVs got thin instead of walls getting smart.", then:"No large flat displays; no switchable glass at a sensible price.", now:"Still limited by cost and energy, not by computing."},
    {y:"1986", who:"BBC Domesday Project", p:"Recording Britain on digital laser discs will preserve it for future generations.", v:"miss", happened:"Within about fifteen years almost nothing could read the discs. Volunteers had to rescue the data.", then:"Special hardware that was soon obsolete.", now:"Open file formats and copying data to new storage regularly (digital preservation)."},
    {y:"1960s", who:"Popular magazines and films", p:"By the year 2000, families will travel by flying car.", v:"miss", happened:"Some prototypes and air-taxi trials exist, but no one commutes by flying car.", then:"Energy, noise, safety and air-traffic rules, not computing.", now:"Batteries and drones help, but safety, cost and regulation are still the bottleneck."},
    {y:"1964", who:"AT&T Picturephone at the New York World’s Fair", p:"People will make video calls from home, seeing each other as they talk.", v:"part", happened:"Picturephone flopped: it was too expensive. Video calling only took off around 2010, on phones and laptops.", then:"Video needs a lot of bandwidth, and few people had one to call.", now:"Video compression, broadband, front cameras on every phone."},
    {y:"1965", who:"Gordon Moore, chip engineer", p:"The number of components on a chip will keep doubling at a steady rate (later updated to every two years).", v:"hit", happened:"“Moore’s law” held for about fifty years, and it’s why your phone beats a 1990s supercomputer. It is now slowing down.", then:"A few dozen components per chip.", now:"Tens of billions of transistors on one chip."},
    {y:"1975", who:"Business magazine forecast", p:"Computers will create the “paperless office”.", v:"part", happened:"Offices actually used more paper for decades because printing got easy. Paper use is only now falling.", then:"Screens were poor and documents couldn’t be shared easily.", now:"Cloud documents, e-signatures and tablets, though many people still print."}
  ];
  const LABEL = {hit:"Hit", part:"Partly", miss:"Miss"};
  const votes = store.json("pl", {});
  const grid = $("#predGrid");
  function score(){ const k = Object.keys(votes); $("#plScore").textContent = `${k.filter(i => votes[i] === P[i].v).length} / ${k.length}`; }
  function card(i){
    const d = P[i], v = votes[i], el = document.createElement("article"); el.className = "pred";
    el.innerHTML = `<div class="ph"><span><span class="y">${d.y}</span> · <span class="c">PREDICTION</span></span><span>${esc(d.p)}</span></div>
      <div class="pb"><span class="src">${esc(d.who)}</span>
      <div class="vote" role="group" aria-label="Your verdict">${["hit","part","miss"].map(k => `<button type="button" data-k="${k}" class="${v === k ? "pick" : ""}">${LABEL[k]}</button>`).join("")}</div>
      ${v ? `<div class="verdict ${d.v}"><b>History says: ${LABEL[d.v]}${v === d.v ? " · you agreed" : ""}</b><span>${esc(d.happened)}</span><dl><dt>Then</dt><dd>${esc(d.then)}</dd><dt>Now</dt><dd>${esc(d.now)}</dd></dl></div>` : ""}</div>`;
    $$(".vote button", el).forEach(b => b.addEventListener("click", () => { votes[i] = b.dataset.k; store.set("pl", JSON.stringify(votes)); el.replaceWith(card(i)); score(); }));
    return el;
  }
  P.forEach((_, i) => grid.appendChild(card(i)));
  score();
  $("#plReset").addEventListener("click", () => { for (const k in votes) delete votes[k]; store.del("pl"); grid.innerHTML = ""; P.forEach((_, i) => grid.appendChild(card(i))); score(); });
})();

/* =========================================================
   PART 2.3  Myths
   ========================================================= */
(function(){
  const M = [
    {q:"640K ought to be enough for anybody.", who:"Said to be Bill Gates, Microsoft, 1981", a:"none", ex:"Nobody has found a recording or article from the time. Gates has said he never said it. It seems to have appeared years later and spread because it sounds funny."},
    {q:"I think there is a world market for maybe five computers.", who:"Said to be Thomas Watson, IBM, 1943", a:"none", ex:"There’s no evidence from 1943. The quote first turns up decades later. Early computers were huge and rare, which is why people believed it."},
    {q:"There is no reason for any individual to have a computer in their home.", who:"Ken Olsen, Digital Equipment Corporation, 1977", a:"context", ex:"He did say something like this, but he later explained he meant a computer that controlled your whole house, not a personal computer. His company made personal computers."},
    {q:"…it will be as natural to him as we find the telephone.", who:"Arthur C. Clarke, ABC TV, 1974, describing a child’s future home computer", a:"real", ex:"It’s on film, with the date, the broadcaster and Clarke on camera. That’s what a strong primary source looks like."}
  ];
  const L = {real:"Real", context:"Real, but out of context", none:"No good evidence"};
  const box = $("#myths");
  M.forEach(m => {
    const el = document.createElement("div"); el.className = "myth";
    el.innerHTML = `<q>${esc(m.q)}</q><span class="who">${esc(m.who)}</span><div class="vote" style="grid-template-columns:1fr">${Object.keys(L).map(k => `<button type="button" data-k="${k}">${L[k]}</button>`).join("")}</div><div class="fb"></div>`;
    $$("button", el).forEach(b => b.addEventListener("click", () => {
      $$("button", el).forEach(x => x.classList.toggle("pick", x === b));
      const ok = b.dataset.k === m.a;
      el.querySelector(".fb").innerHTML = `<div class="verdict ${ok ? "hit" : "miss"}"><b>${ok ? "Yes" : "Not quite"}: ${L[m.a]}.</b><span>${esc(m.ex)}</span></div>`;
    }));
    box.appendChild(el);
  });
})();

/* =========================================================
   PART 2.4  Spec comparison + matrix
   ========================================================= */
(function(){
  const D = [
    {m:"Clock speed", u:"MHz", rows:[["BBC Micro (1981)",2,"2 MHz"],["micro:bit V2 (2020)",64,"64 MHz"],["Phone (2026)",3200,"~3.2 GHz"]]},
    {m:"RAM", u:"KB", rows:[["BBC Micro (1981)",32,"32 KB"],["micro:bit V2 (2020)",128,"128 KB"],["Phone (2026)",8e6,"~8 GB"]]},
    {m:"Storage", u:"KB", rows:[["BBC Micro (1981)",100,"100 KB disk"],["micro:bit V2 (2020)",512,"512 KB"],["Phone (2026)",256e6,"~256 GB"]]}
  ];
  const col = ["var(--past)","var(--now)","var(--fut)"];
  const box = $("#specBars");
  D.forEach(d => {
    const max = Math.log10(Math.max(...d.rows.map(r => r[1]))) + .3;
    const r = document.createElement("div"); r.className = "spec-row";
    r.innerHTML = `<b>${d.m}</b><div class="spec-bars">${d.rows.map((x, i) => `<div class="sb"><span>${x[0]}</span><span class="track"><span class="fill" data-w="${Math.max(3, Math.log10(x[1]) / max * 100)}" style="background:${col[i]};width:0"></span></span><span class="v">${x[2]}</span></div>`).join("")}</div>`;
    box.appendChild(r);
  });
  box.insertAdjacentHTML("beforeend", `<p class="small">The micro:bit you’ll program in Part 3 is <b>32 times faster</b> than the BBC Micro and has <b>4 times the memory</b>. A 2026 phone has about <b>250,000 times</b> the BBC Micro’s RAM.</p>`);
  const grow = () => $$(".fill[data-w]", box).forEach(f => f.style.width = f.dataset.w + "%");
  if ("IntersectionObserver" in window){ const io = new IntersectionObserver(e => { if (e.some(x => x.isIntersecting)){ grow(); io.disconnect(); } }, {threshold:.3}); io.observe(box); } else grow();

  // matrix
  const DEF = [
    {pred:"Home automation consoles (1980s)", modern:"Voice assistants such as Alexa and Siri", then:"Dial-up internet, very little RAM", now:"Fast Wi-Fi, cloud AI", v:"Hit"},
    {pred:"In-car map systems (1986)", modern:"Live GPS and traffic apps", then:"GPS network not finished, no colour flat screens", now:"GPS satellites, 4G and 5G, smartphones", v:"Hit"}
  ];
  let rows = store.json("mx", null) || JSON.parse(JSON.stringify(DEF));
  const tb = $("#matrix tbody");
  const save = () => { store.set("mx", JSON.stringify(rows)); flash($("#mxSaved")); };
  function draw(){
    tb.innerHTML = "";
    rows.forEach((r, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = ["pred","modern","then","now"].map(k => `<td><textarea data-k="${k}" aria-label="${k}">${esc(r[k])}</textarea></td>`).join("") +
        `<td><select data-k="v" aria-label="Verdict">${["","Hit","Partly","Miss","Not yet"].map(o => `<option${o === r.v ? " selected" : ""}>${o}</option>`).join("")}</select></td><td><button class="btn sm" type="button" aria-label="Delete row">✕</button></td>`;
      $$("[data-k]", tr).forEach(el => el.addEventListener(el.tagName === "SELECT" ? "change" : "input", () => { rows[i][el.dataset.k] = el.value; save(); }));
      tr.querySelector("button").addEventListener("click", () => { rows.splice(i, 1); save(); draw(); });
      tb.appendChild(tr);
    });
  }
  draw();
  $("#mxAdd").addEventListener("click", () => { rows.push({pred:"", modern:"", then:"", now:"", v:""}); save(); draw(); $$("textarea", tb).slice(-4)[0].focus(); });
  $("#mxReset").addEventListener("click", () => { if (!confirm("Clear your matrix and start again?")) return; rows = JSON.parse(JSON.stringify(DEF)); save(); draw(); });
  $("#mxCsv").addEventListener("click", () => {
    const q = s => `"${String(s ?? "").replace(/"/g, '""')}"`;
    const csv = [["Prediction (year)","Modern equivalent","Hardware bottleneck then","Enabling tech today","Verdict"].map(q).join(","), ...rows.map(r => [r.pred, r.modern, r.then, r.now, r.v].map(q).join(","))].join("\r\n");
    download("evaluation-matrix.csv", "﻿" + csv, "text/csv");
  });
})();

/* =========================================================
   PART 3  micro:bit simulator + code
   ========================================================= */
(function(){
  const IC = {
    Yes:"00000 00001 00010 10100 01000", No:"10001 01010 00100 01010 10001", Happy:"00000 01010 00000 10001 01110",
    Sad:"00000 01010 00000 01110 10001", Heart:"01010 11111 11111 01110 00100", SmallDiamond:"00000 00100 01010 00100 00000",
    Asleep:"00000 11011 00000 01110 00000", Blank:"00000 00000 00000 00000 00000"
  };
  function mkLeds(el){ el.innerHTML = ""; for (let i = 0; i < 25; i++){ const d = document.createElement("span"); d.className = "led"; el.appendChild(d); } }
  const LA = $("#ledsA"), LB = $("#ledsB"); mkLeds(LA); mkLeds(LB);
  function show(el, pat){ const bits = pat.replace(/ /g, ""); $$(".led", el).forEach((l, i) => l.classList.toggle("on", bits[i] === "1")); }
  function bars(el, v, max){ // like led.plotBarGraph: fills from bottom
    const n = Math.round(Math.max(0, Math.min(1, v / max)) * 25); let s = "";
    for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++){ const idx = (4 - r) * 5 + c; s += idx < n ? "1" : "0"; }
    show(el, s);
  }
  const SC = {
    greenhouse: {tab:"Smart greenhouse", desc:"A sensor in the greenhouse warns the gardener’s receiver when plants get too cold (or too dark). It only sends a message when things <b>change</b>, so it doesn’t flood the network."},
    security: {tab:"Silent alarm", desc:"The sensor micro:bit sits on something valuable. If it’s moved, it silently sends an alert to the monitoring station. Button A on the sensor arms and disarms it. Button A on the receiver clears the alert."},
    health: {tab:"Step tracker", desc:"The sensor is worn like a fitness tracker. Each shake counts as a step. When you hit your goal it tells a friend’s micro:bit. Button B on the sensor resets the count."}
  };
  const S = {sc:"greenhouse", gMeasure:"temp", temp:18, light:120, strength:1024, armed:true, steps:0, sent:false, cold:false, lastAlert:0, th:{temp:10, light:50, security:1500, health:20}, gA:1, gB:1, lang:"js"};
  const log = $("#mbLog"), tip = $("#mbTip");
  function addLog(html, cls){ const d = document.createElement("div"); if (cls) d.className = cls; d.innerHTML = html; log.appendChild(d); while (log.children.length > 60) log.firstChild.remove(); log.scrollTop = log.scrollHeight; }
  const shift = (s, k) => s.replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k + 26) % 26 + 65));
  function send(msg){
    const scr = $("#scramble").checked, wire = scr ? shift(msg, 3) : msg;
    const air = $("#airMsg"); air.textContent = wire; air.classList.remove("go","lost"); void air.offsetWidth;
    const ok = S.gA === S.gB; air.classList.add("go"); if (!ok) air.classList.add("lost");
    addLog(`<span class="s">sensor → group ${S.gA}:</span> "${esc(wire)}"`);
    if ($("#spy").checked && S.gA === 1) addLog(`neighbour on group 1 heard: "${esc(wire)}"${scr ? " (looks like nonsense)" : ""}`, "e");
    setTimeout(() => {
      if (!ok){ addLog(`receiver on group ${S.gB} heard nothing`, "w"); tip.innerHTML = `<b>Nothing arrived.</b> The sensor is on group ${S.gA} but the receiver is listening on group ${S.gB}. A radio group is part of the <b>protocol</b>: both sides must agree.`; return; }
      const got = scr ? shift(wire, -3) : wire;
      receive(got, scr);
    }, reduced() ? 50 : 650);
  }
  function receive(m, scr){
    addLog(`receiver got: "${esc(m)}"${scr ? " (unscrambled with the shared secret)" : ""}`);
    if (m === "COLD" || m === "DARK"){ show(LB, IC.Sad); tip.innerHTML = `<b>Alert received.</b> The receiver shows a sad face${m === "COLD" ? " and would beep" : ""}. In a real greenhouse this could switch on a heater or text the gardener.`; }
    else if (m === "OK"){ show(LB, IC.Happy); tip.innerHTML = "<b>Back to normal.</b> The sensor only sent this because the reading crossed back over the threshold."; }
    else if (m === "ALERT"){ show(LB, IC.No); tip.innerHTML = "<b>Alarm!</b> The monitoring station shows a cross and sounds a tone. The sensor stayed silent, so a thief wouldn’t know. Press A on the receiver to clear it."; }
    else if (m === "GOAL"){ show(LB, IC.Heart); tip.innerHTML = "<b>Goal reached.</b> Your friend’s micro:bit shows a heart. Notice the tracker only sent <i>one</i> message, not every single step."; }
  }
  function ctrls(){
    const c = $("#scCtrls"), th = $("#thIn");
    if (S.sc === "greenhouse"){
      c.innerHTML = `<div class="ctl short"><span class="small">Measure</span><select id="gm"><option value="temp">Temperature</option><option value="light">Light level</option></select></div>
        <div class="ctl"><span class="small">Temperature</span><input type="range" id="sTemp" min="-5" max="35" value="${S.temp}" aria-label="Temperature"><output id="oTemp">${S.temp}°C</output></div>
        <div class="ctl"><span class="small">Light level</span><input type="range" id="sLight" min="0" max="255" value="${S.light}" aria-label="Light level"><output id="oLight">${S.light}</output></div>`;
      $("#gm").value = S.gMeasure;
      $("#gm").addEventListener("change", e => { S.gMeasure = e.target.value; S.cold = false; show(LA, IC.Happy); show(LB, IC.Yes); thSetup(); code(); });
      $("#sTemp").addEventListener("input", e => { S.temp = +e.target.value; $("#oTemp").textContent = S.temp + "°C"; });
      $("#sLight").addEventListener("input", e => { S.light = +e.target.value; $("#oLight").textContent = S.light; });
    } else if (S.sc === "security"){
      c.innerHTML = `<div class="row-btns"><button class="btn sm" type="button" data-f="1300">Nudge it</button><button class="btn sm" type="button" data-f="2100">Pick it up</button><button class="btn sm" type="button" data-f="3000">Grab and run</button></div>
        <p class="small">At rest the accelerometer reads about <b>1024</b> (gravity). Movement adds to it. Now: <b id="oStr">1024</b></p>`;
      $$("[data-f]", c).forEach(b => b.addEventListener("click", () => { S.strength = +b.dataset.f; $("#oStr").textContent = S.strength; $("#mbA").classList.remove("shake"); void $("#mbA").offsetWidth; $("#mbA").classList.add("shake"); clearTimeout(S._st); S._st = setTimeout(() => { S.strength = 1024; $("#oStr").textContent = 1024; }, 900); }));
    } else {
      c.innerHTML = `<div class="row-btns"><button class="btn sm" type="button" id="step1">Take a step (shake)</button><button class="btn sm" type="button" id="step10">Walk 10 steps</button></div><p class="small">Steps counted: <b id="oSteps">${S.steps}</b></p>`;
      $("#step1").addEventListener("click", () => stepOnce());
      $("#step10").addEventListener("click", () => { let n = 0; const t = setInterval(() => { stepOnce(); if (++n >= 10) clearInterval(t); }, reduced() ? 20 : 180); });
    }
  }
  function thSetup(){
    const th = $("#thIn");
    const cfg = S.sc === "greenhouse" ? (S.gMeasure === "temp" ? {min:-5, max:35, k:"temp", l:"Cold below", u:"°C"} : {min:0, max:255, k:"light", l:"Dark below", u:""})
      : S.sc === "security" ? {min:1100, max:3000, k:"security", l:"Alarm above", u:""} : {min:5, max:50, k:"health", l:"Step goal", u:""};
    th.min = cfg.min; th.max = cfg.max; th.value = S.th[cfg.k]; th.dataset.k = cfg.k; th.dataset.u = cfg.u;
    $("#thLabel").textContent = cfg.l; $("#thOut").textContent = S.th[cfg.k] + cfg.u;
  }
  $("#thIn").addEventListener("input", e => { const k = e.target.dataset.k; S.th[k] = +e.target.value; $("#thOut").textContent = e.target.value + (e.target.dataset.u || ""); code(); });
  function stepOnce(){
    if (S.sc !== "health") return;
    S.steps++; const o = $("#oSteps"); if (o) o.textContent = S.steps;
    $("#mbA").classList.remove("shake"); void $("#mbA").offsetWidth; $("#mbA").classList.add("shake");
    const goal = S.th.health;
    if (S.steps >= goal && !S.sent){ S.sent = true; show(LA, IC.Heart); send("GOAL"); }
    else if (!S.sent) bars(LA, S.steps, goal);
  }
  function loop(){
    if (S.sc === "greenhouse"){
      const isT = S.gMeasure === "temp", r = isT ? S.temp : S.light, th = isT ? S.th.temp : S.th.light;
      if (r < th && !S.cold){ S.cold = true; show(LA, IC.Sad); send(isT ? "COLD" : "DARK"); }
      else if (r >= th && S.cold){ S.cold = false; show(LA, IC.Happy); send("OK"); }
    } else if (S.sc === "security"){
      if (S.armed && S.strength > S.th.security && Date.now() - S.lastAlert > 2000){ S.lastAlert = Date.now(); send("ALERT"); }
    }
  }
  setInterval(loop, 500);
  // buttons on the boards
  $("#mbA_a").addEventListener("click", () => {
    if (S.sc === "security"){ S.armed = !S.armed; show(LA, S.armed ? IC.SmallDiamond : IC.Asleep); addLog(`sensor ${S.armed ? "armed" : "disarmed"} (button A)`, "w"); }
    else if (S.sc === "greenhouse"){ addLog(`sensor shows reading: ${S.gMeasure === "temp" ? S.temp + "°C" : S.light} (button A)`, "w"); }
    else addLog(`sensor shows step count: ${S.steps} (button A)`, "w");
  });
  $("#mbA_b").addEventListener("click", () => { if (S.sc === "health"){ S.steps = 0; S.sent = false; show(LA, IC.Blank); const o = $("#oSteps"); if (o) o.textContent = 0; addLog("steps reset (button B)", "w"); } });
  $("#mbB_a").addEventListener("click", () => { if (S.sc === "security"){ show(LB, IC.Blank); addLog("receiver: alert cleared (button A)", "w"); } });
  $("#mbB_b").addEventListener("click", () => {});
  function setScenario(k){
    S.sc = k; S.cold = false; S.steps = 0; S.sent = false; S.armed = true; S.strength = 1024;
    $$("#scTabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.k === k));
    $("#scDesc").innerHTML = SC[k].desc;
    show(LA, k === "security" ? IC.SmallDiamond : k === "greenhouse" ? IC.Happy : IC.Blank); show(LB, IC.Yes);
    log.innerHTML = ""; addLog(`scenario: ${SC[k].tab}`, "w");
    tip.innerHTML = {greenhouse:"Drag the temperature below the threshold and watch the radio log.", security:"Try “Nudge it”. Does it set off the alarm? Then try picking it up.", health:"Walk until you hit the goal. How many messages were sent?"}[k];
    ctrls(); thSetup(); code();
  }
  const tabs = $("#scTabs");
  Object.keys(SC).forEach(k => { const b = document.createElement("button"); b.type = "button"; b.role = "tab"; b.dataset.k = k; b.textContent = SC[k].tab; b.addEventListener("click", () => setScenario(k)); tabs.appendChild(b); });
  // groups
  ["gA","gB"].forEach(id => { const s = $("#" + id); for (let g = 0; g <= 9; g++){ const o = document.createElement("option"); o.value = g; o.textContent = "Group " + g; s.appendChild(o); } s.value = 1;
    s.addEventListener("change", () => { S[id] = +s.value; $(id === "gA" ? "#grpA" : "#grpB").textContent = "G" + s.value; if (id === "gA") code(); addLog(`${id === "gA" ? "sensor" : "receiver"} now on group ${s.value}`, "w"); }); });
  $("#spy").addEventListener("change", e => { addLog(e.target.checked ? "a neighbour’s micro:bit is listening on group 1" : "neighbour gone", "e"); });
  $("#scramble").addEventListener("change", e => { addLog(e.target.checked ? "scrambling on: letters shift 3 places (shared secret: 3)" : "scrambling off", "w"); code(); });

  /* ---- code generation ---- */
  function codeFor(){
    const g = S.gA, scr = $("#scramble").checked;
    if (S.sc === "greenhouse"){
      const t = S.gMeasure === "temp", th = t ? S.th.temp : S.th.light, rd = t ? "input.temperature()" : "input.lightLevel()", pyrd = t ? "temperature()" : "display.read_light_level()", w = t ? "COLD" : "DARK";
      return {
        jsA: `// Smart greenhouse: SENSOR micro:bit\nradio.setGroup(${g})\nlet alert = false\nbasic.showIcon(IconNames.Happy)\n\nbasic.forever(function () {\n    let reading = ${rd}\n    if (reading < ${th} && !alert) {\n        alert = true\n        radio.sendString(${scr ? `scramble("${w}")` : `"${w}"`})\n        basic.showIcon(IconNames.Sad)\n    } else if (reading >= ${th} && alert) {\n        alert = false\n        radio.sendString(${scr ? `scramble("OK")` : `"OK"`})\n        basic.showIcon(IconNames.Happy)\n    }\n    basic.pause(500)\n})\n\n// Button A shows the current reading\ninput.onButtonPressed(Button.A, function () {\n    basic.showNumber(${rd})\n})`,
        jsB: `// Smart greenhouse: RECEIVER micro:bit\nradio.setGroup(${g})\nbasic.showIcon(IconNames.Yes)\n\nradio.onReceivedString(function (receivedString) {\n    let message = ${scr ? "unscramble(receivedString)" : "receivedString"}\n    if (message == "${w}") {\n        basic.showIcon(IconNames.Sad)\n        music.playTone(262, music.beat(BeatFraction.Half))\n    } else if (message == "OK") {\n        basic.showIcon(IconNames.Happy)\n    }\n})`,
        pyA: `# Smart greenhouse: SENSOR micro:bit\nfrom microbit import *\nimport radio\n\nradio.on()\nradio.config(group=${g})\nalert = False\ndisplay.show(Image.HAPPY)\n\nwhile True:\n    reading = ${pyrd}\n    if reading < ${th} and not alert:\n        alert = True\n        radio.send(${scr ? `scramble("${w}")` : `"${w}"`})\n        display.show(Image.SAD)\n    elif reading >= ${th} and alert:\n        alert = False\n        radio.send(${scr ? `scramble("OK")` : `"OK"`})\n        display.show(Image.HAPPY)\n    if button_a.was_pressed():\n        display.scroll(str(${pyrd}))\n    sleep(500)`,
        pyB: `# Smart greenhouse: RECEIVER micro:bit\nfrom microbit import *\nimport radio\nimport music\n\nradio.on()\nradio.config(group=${g})\ndisplay.show(Image.YES)\n\nwhile True:\n    message = radio.receive()\n    if message:\n        message = ${scr ? "unscramble(message)" : "message"}\n        if message == "${w}":\n            display.show(Image.SAD)\n            music.play(music.BA_DING)\n        elif message == "OK":\n            display.show(Image.HAPPY)\n    sleep(50)`
      };
    }
    if (S.sc === "security"){
      const th = S.th.security;
      return {
        jsA: `// Silent alarm: SENSOR micro:bit\nradio.setGroup(${g})\nlet armed = true\nbasic.showIcon(IconNames.SmallDiamond)\n\n// Button A arms and disarms\ninput.onButtonPressed(Button.A, function () {\n    armed = !armed\n    if (armed) {\n        basic.showIcon(IconNames.SmallDiamond)\n    } else {\n        basic.showIcon(IconNames.Asleep)\n    }\n})\n\nbasic.forever(function () {\n    if (armed && input.acceleration(Dimension.Strength) > ${th}) {\n        radio.sendString(${scr ? `scramble("ALERT")` : `"ALERT"`})\n        basic.pause(2000) // don't flood the network\n    }\n    basic.pause(100)\n})`,
        jsB: `// Silent alarm: RECEIVER (monitoring station)\nradio.setGroup(${g})\n\nradio.onReceivedString(function (receivedString) {\n    if (${scr ? "unscramble(receivedString)" : "receivedString"} == "ALERT") {\n        basic.showIcon(IconNames.No)\n        music.playTone(880, music.beat(BeatFraction.Whole))\n    }\n})\n\n// Button A clears the alert\ninput.onButtonPressed(Button.A, function () {\n    basic.clearScreen()\n})`,
        pyA: `# Silent alarm: SENSOR micro:bit\nfrom microbit import *\nimport radio\n\nradio.on()\nradio.config(group=${g})\narmed = True\ndisplay.show(Image.DIAMOND_SMALL)\n\nwhile True:\n    if button_a.was_pressed():\n        armed = not armed\n        display.show(Image.DIAMOND_SMALL if armed else Image.ASLEEP)\n    x, y, z = accelerometer.get_values()\n    strength = (x * x + y * y + z * z) ** 0.5\n    if armed and strength > ${th}:\n        radio.send(${scr ? `scramble("ALERT")` : `"ALERT"`})\n        sleep(2000)  # don't flood the network\n    sleep(100)`,
        pyB: `# Silent alarm: RECEIVER (monitoring station)\nfrom microbit import *\nimport radio\nimport music\n\nradio.on()\nradio.config(group=${g})\n\nwhile True:\n    message = radio.receive()\n    if message and ${scr ? "unscramble(message)" : "message"} == "ALERT":\n        display.show(Image.NO)\n        music.play(music.JUMP_UP)\n    if button_a.was_pressed():\n        display.clear()\n    sleep(50)`
      };
    }
    const goal = S.th.health;
    return {
      jsA: `// Step tracker: SENSOR micro:bit (worn)\nradio.setGroup(${g})\nlet steps = 0\nlet sent = false\n\ninput.onGesture(Gesture.Shake, function () {\n    steps += 1\n    led.plotBarGraph(steps, ${goal})\n    if (steps >= ${goal} && !sent) {\n        sent = true\n        radio.sendString(${scr ? `scramble("GOAL")` : `"GOAL"`})\n        basic.showIcon(IconNames.Heart)\n    }\n})\n\n// Button A shows the count, button B resets\ninput.onButtonPressed(Button.A, function () {\n    basic.showNumber(steps)\n})\ninput.onButtonPressed(Button.B, function () {\n    steps = 0\n    sent = false\n    basic.clearScreen()\n})`,
      jsB: `// Step tracker: RECEIVER (a friend's micro:bit)\nradio.setGroup(${g})\nbasic.showIcon(IconNames.Yes)\n\nradio.onReceivedString(function (receivedString) {\n    if (${scr ? "unscramble(receivedString)" : "receivedString"} == "GOAL") {\n        basic.showIcon(IconNames.Heart)\n        music.playTone(523, music.beat(BeatFraction.Half))\n    }\n})`,
      pyA: `# Step tracker: SENSOR micro:bit (worn)\nfrom microbit import *\nimport radio\n\nradio.on()\nradio.config(group=${g})\nsteps = 0\nsent = False\n\nwhile True:\n    if accelerometer.was_gesture("shake"):\n        steps += 1\n        if steps >= ${goal} and not sent:\n            sent = True\n            radio.send(${scr ? `scramble("GOAL")` : `"GOAL"`})\n            display.show(Image.HEART)\n    if button_a.was_pressed():\n        display.scroll(str(steps))\n    if button_b.was_pressed():\n        steps = 0\n        sent = False\n        display.clear()\n    sleep(50)`,
      pyB: `# Step tracker: RECEIVER (a friend's micro:bit)\nfrom microbit import *\nimport radio\nimport music\n\nradio.on()\nradio.config(group=${g})\ndisplay.show(Image.YES)\n\nwhile True:\n    message = radio.receive()\n    if message and ${scr ? "unscramble(message)" : "message"} == "GOAL":\n        display.show(Image.HEART)\n        music.play(music.POWER_UP)\n    sleep(50)`
    };
  }
  const SCR_JS = `\n\n// Extension: scramble with a shared secret (shift letters by 3)\nfunction shiftText(text: string, key: number): string {\n    let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"\n    let out = ""\n    for (let i = 0; i < text.length; i++) {\n        let p = alphabet.indexOf(text.charAt(i))\n        if (p < 0) {\n            out = out + text.charAt(i)\n        } else {\n            out = out + alphabet.charAt((p + key + 26) % 26)\n        }\n    }\n    return out\n}\nfunction scramble(text: string): string {\n    return shiftText(text, 3)\n}\nfunction unscramble(text: string): string {\n    return shiftText(text, -3)\n}`;
  const SCR_PY = `\n\n# Extension: scramble with a shared secret (shift letters by 3)\nALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"\n\ndef shift_text(text, key):\n    out = ""\n    for ch in text:\n        p = ALPHABET.find(ch)\n        out += ch if p < 0 else ALPHABET[(p + key) % 26]\n    return out\n\ndef scramble(text):\n    return shift_text(text, 3)\n\ndef unscramble(text):\n    return shift_text(text, -3)`;
  const KW = new Set("let const function if else return while for in import from as def elif and or not True False true false None".split(" "));
  function hl(src){
    let out = "", i = 0;
    while (i < src.length){
      const ch = src[i], rest = src.slice(i);
      let m;
      if ((m = rest.match(/^(\/\/[^\n]*|#[^\n]*)/))) { out += `<span class="c">${esc(m[0])}</span>`; i += m[0].length; continue; }
      if ((m = rest.match(/^("[^"\n]*"|'[^'\n]*')/))) { out += `<span class="s">${esc(m[0])}</span>`; i += m[0].length; continue; }
      if ((m = rest.match(/^\d+(\.\d+)?/)) && !/[A-Za-z_]/.test(src[i-1] || "")) { out += `<span class="n">${m[0]}</span>`; i += m[0].length; continue; }
      if ((m = rest.match(/^[A-Za-z_][A-Za-z0-9_]*/))) {
        const w = m[0], next = src[i + w.length];
        out += KW.has(w) ? `<span class="k">${w}</span>` : next === "(" ? `<span class="f">${w}</span>` : w;
        i += w.length; continue;
      }
      out += esc(ch); i++;
    }
    return out;
  }
  let last = {};
  function code(){
    const c = codeFor(), scr = $("#scramble").checked, js = S.lang === "js";
    let a = js ? c.jsA : c.pyA, b = js ? c.jsB : c.pyB;
    if (scr){ if (js){ a += SCR_JS; b += SCR_JS; } else { a = a.replace("\n\nradio.on()", SCR_PY + "\n\nradio.on()"); b = b.replace("\n\nradio.on()", SCR_PY + "\n\nradio.on()"); } }
    last = {codeA:a, codeB:b};
    $("#codeA").innerHTML = hl(a); $("#codeB").innerHTML = hl(b);
  }
  $$("#langTabs button").forEach(b => b.addEventListener("click", () => { S.lang = b.dataset.lang; $$("#langTabs button").forEach(x => x.setAttribute("aria-selected", x === b)); code(); }));
  $$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
    const t = last[b.dataset.copy] || "";
    try { await navigator.clipboard.writeText(t); b.textContent = "Copied"; } catch(e){ const r = document.createRange(); r.selectNodeContents($("#" + b.dataset.copy)); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Selected: press Ctrl+C"; }
    setTimeout(() => b.textContent = "Copy", 1600);
  }));
  setScenario("greenhouse");
})();

/* =========================================================
   PART 3.4  Security check
   ========================================================= */
(function(){
  const Q = [
    {q:"A smart camera that comes with the password “admin”.", a:"risky", ex:"Default passwords are published online, so anyone can log in. Since April 2024 it’s illegal to sell devices like this in the UK."},
    {q:"A smart plug that installs security updates automatically for at least five years.", a:"safe", ex:"Updates fix security holes after they’re discovered. The law now says makers must tell you how long updates last."},
    {q:"Your micro:bit alarm uses radio group 1, the same as everyone else’s first try.", a:"risky", ex:"Anyone on the same group hears every message, and could send fake ones. Choose an unusual group, and add scrambling."},
    {q:"A baby monitor that streams video over the internet without encryption.", a:"risky", ex:"Unencrypted video can be intercepted. Always look for encrypted (scrambled) connections."},
    {q:"A thermostat that keeps working with its own controls if the internet goes down.", a:"safe", ex:"Local control means you aren’t stuck if the company’s servers or your broadband fail."},
    {q:"A cheap doorbell from a brand with no way to report a security problem.", a:"risky", ex:"If someone finds a flaw, there’s nobody to tell, so it may never be fixed. UK law now requires a contact point."}
  ];
  const box = $("#secCheck");
  Q.forEach(d => {
    const el = document.createElement("div"); el.className = "chk";
    el.innerHTML = `<span class="q">${esc(d.q)}</span><div class="ans"><button type="button" data-k="safe">Safer</button><button type="button" data-k="risky">Risky</button></div><span class="fb small"></span>`;
    $$("button", el).forEach(b => b.addEventListener("click", () => {
      const ok = b.dataset.k === d.a; el.classList.toggle("right", ok); el.classList.toggle("wrong", !ok);
      el.querySelector(".fb").innerHTML = `<b>${ok ? "Yes" : "Think again"}.</b> ${esc(d.ex)}`;
      el.querySelector(".fb").style.color = "var(--ink)";
    }));
    box.appendChild(el);
  });
})();
