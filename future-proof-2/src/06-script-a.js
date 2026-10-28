"use strict";
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k, d = null){ try{ const v = localStorage.getItem("fp2:" + k); return v === null ? d : JSON.parse(v); }catch(e){ return d; } },
  set(k, v){ try{ localStorage.setItem("fp2:" + k, JSON.stringify(v)); }catch(e){} },
  clearAll(){ try{ Object.keys(localStorage).filter(k => k.startsWith("fp2:")).forEach(k => localStorage.removeItem(k)); }catch(e){} }
};
function say(t){ const l = $("#srLive"); if (l){ l.textContent = ""; setTimeout(() => l.textContent = t, 30); } }
function download(name, text, mime = "text/plain"){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], {type: mime}));
  a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function fmt(n){ return Number(n).toLocaleString("en-GB"); }
function shuffle(a){ a = a.slice(); for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function seg(el, cb){ // segmented control: buttons with data-v
  if (!el) return;
  el.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return;
    $$("button", el).forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")); cb(b.dataset.v || b.dataset.f, b); });
}
function segVal(el){ const b = $('button[aria-pressed="true"]', el); return b ? (b.dataset.v || b.dataset.f) : null; }
function setSeg(el, v){ $$("button", el).forEach(x => x.setAttribute("aria-pressed", (x.dataset.v || x.dataset.f) === v ? "true" : "false")); }

/* ---------- larger text ---------- */
(function(){
  const bt = $("#bigToggle");
  const set = on => { document.documentElement.classList.toggle("big", on); bt.setAttribute("aria-pressed", on ? "true" : "false"); };
  set(store.get("big") === true);
  bt.onclick = () => { const on = !document.documentElement.classList.contains("big"); set(on); store.set("big", on); window.dispatchEvent(new Event("resize")); };
})();

/* ---------- autosave: any [data-save] field ---------- */
function bindSave(el){
  const k = "f:" + el.dataset.save, v = store.get(k);
  if (el.type === "checkbox"){ if (v !== null) el.checked = v; el.addEventListener("change", () => store.set(k, el.checked)); }
  else { if (v !== null) el.value = v; el.addEventListener("input", () => { store.set(k, el.value); el.dispatchEvent(new CustomEvent("saved")); }); }
}
$$("[data-save]").forEach(bindSave);
const field = k => store.get("f:" + k, "");

/* ---------- Chrono Pass stamps ---------- */
const STAMPS = [
  ["ipo","Parts Sorter","Sorted every part","⚙"],["desk","Desk Manager","Tried two desk set-ups","▤"],["cpu","Clock Watcher","Ran a program to HALT","⏱"],["bin","Bit Flipper","Beat all binary challenges","01"],
  ["spot","Computer Spotter","10+ in Spot the computer","◎"],["tt","Spec Champion","Won Spec Top Trumps","♛"],["clean","Data Detective","Cleaned the database","⌕"],
  ["tw","Archive Judge","Judged every TV invention","▣"],["quote","Quote Detective","Fact-checked every quote","❝"],["ad","Ad Maker","Made a convincing 1985 advert","★"],
  ["pkt","Packet Pilot","Delivered after a cable cut","✉"],["radio","Protocol Builder","Got an ACK on level 4","⇄"],["iot","IoT Builder","Set off the greenhouse alarm","☀"],
  ["trend","Trend Spotter","Guessed 2024 within 10×","↗"],["league","Power Ranker","Ranked all eight drivers","⚖"],["hype","Hype Detector","8+ in the hype detector","!?"],
  ["cone","Futurist","Placed a prediction on the cone","◭"],["pitch","Dragon Ready","Built every beat of a pitch","♞"],["capsule","Capsule Sealed","Sealed a time capsule","⌛"]
];
const Pass = (function(){
  const got = new Set(store.get("stamps", []));
  const dlg = $("#passDlg"), grid = $("#stampGrid");
  function render(){
    $("#passCount").textContent = got.size;
    grid.innerHTML = STAMPS.map(([id, n, d, ic]) => `<div class="stamp ${got.has(id) ? "got" : ""}"><span class="ic" aria-hidden="true">${ic}</span><b>${esc(n)}</b><span>${got.has(id) ? "Earned" : esc(d)}</span></div>`).join("");
    const e = $("#endStamps"); if (e) e.textContent = `You have earned ${got.size} of ${STAMPS.length} stamps.`;
  }
  let tt;
  function award(id){
    if (got.has(id)) return; got.add(id); store.set("stamps", [...got]); render();
    const s = STAMPS.find(x => x[0] === id); if (!s) return;
    const t = $("#toast"); $("#toastText").textContent = `Stamp earned: ${s[1]}`; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2600);
  }
  $("#passBtn").onclick = () => { render(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", ""); };
  $("#passClose").onclick = () => dlg.close ? dlg.close() : dlg.removeAttribute("open");
  $("#passReset").onclick = e => { const b = e.currentTarget;
    if (b.dataset.armed){ store.clearAll(); location.reload(); return; }
    b.dataset.armed = "1"; b.textContent = "Tap again to delete all your stamps and answers"; setTimeout(() => { delete b.dataset.armed; b.textContent = "Start again on this device"; }, 4000); };
  render();
  return {award, has: id => got.has(id)};
})();

/* ---------- "I can" checks at the end of each mission ---------- */
$$(".pe-check").forEach(box => {
  const m = box.dataset.m, boxes = $$("input", box), saved = store.get("ican:" + m, []);
  boxes.forEach((c, i) => { c.checked = !!saved[i]; c.addEventListener("change", () => { store.set("ican:" + m, boxes.map(x => x.checked)); routeTicks(); }); });
});
function routeTicks(){
  $$("#route a").forEach(a => {
    const s = store.get("ican:" + a.dataset.m, []), done = s.length && s.every(Boolean);
    let t = $(".done", a); if (done && !t){ t = document.createElement("span"); t.className = "done"; t.textContent = "✓ DONE"; a.appendChild(t); } else if (!done && t) t.remove();
  });
}
routeTicks();

/* ---------- codename ---------- */
(function(){
  const A = ["Byte","Pixel","Quantum","Neon","Echo","Circuit","Vector","Comet","Flux","Orbit","Cipher","Nova"], B = ["Fox","Otter","Falcon","Hare","Puffin","Stag","Wren","Seal","Lynx","Kestrel"];
  $("#codeGen").onclick = () => { const c = `${A[Math.floor(Math.random()*A.length)]} ${B[Math.floor(Math.random()*B.length)]}-${Math.floor(Math.random()*90+10)}`; const i = $("#codename"); i.value = c; i.dispatchEvent(new Event("input")); };
  $("#codename").addEventListener("saved", () => { const s = $("#codenameSaved"); s.textContent = "Saved"; clearTimeout(s._t); s._t = setTimeout(() => s.textContent = "", 1200); });
})();

/* ---------- generic: choice cards (sort, quiz, verdicts) ----------
   items: {id, who?, q, opts? (per item), a: index or [indexes], why, verdict?}
   Answers lock once chosen; a Reset button clears the set. */
function choiceCards(el, cfg){
  const key = "cc:" + cfg.key, state = store.get(key, {});
  function score(){
    const ans = Object.keys(state).filter(id => cfg.items.some(i => i.id === id));
    const right = ans.filter(id => { const it = cfg.items.find(i => i.id === id); return ok(it, state[id]); }).length;
    if (cfg.scoreEl) $(cfg.scoreEl).textContent = `${right} / ${cfg.countAll ? cfg.items.length : ans.length}`;
    if (cfg.onScore) cfg.onScore(right, ans.length, cfg.items.length);
  }
  const ok = (it, v) => Array.isArray(it.a) ? it.a.includes(v) : it.a === v;
  function card(it){
    const opts = it.opts || cfg.opts, v = state[it.id], answered = v !== undefined;
    const d = document.createElement("div");
    d.className = "scard" + (answered ? (ok(it, v) || cfg.noRight ? " right" : " wrong") : "");
    d.dataset.f = it.f || "";
    d.innerHTML = `${it.who ? `<div class="who">${esc(it.who)}</div>` : ""}<div class="q">${it.q}</div>
      <div class="opts" role="group" aria-label="Your answer">${opts.map((o, i) => `<button type="button" data-i="${i}" aria-pressed="${v === i}" ${answered ? "disabled" : ""}>${esc(o)}</button>`).join("")}</div>
      ${answered ? `<div class="fb ${ok(it, v) ? "ok" : cfg.softWrong ? "mid" : "no"}">${ok(it, v) ? "<b>Yes.</b> " : "<b>Not quite.</b> "}${it.verdict ? `<span class="tag ${it.vcls || "now"}">${esc(it.verdict)}</span> ` : ""}${it.why}</div>` : ""}`;
    d.addEventListener("click", e => { const b = e.target.closest("button[data-i]"); if (!b || answered) return;
      state[it.id] = +b.dataset.i; store.set(key, state); const n = card(it); d.replaceWith(n); $("button[data-i]", n)?.closest(".scard").querySelector(".fb")?.setAttribute("tabindex", "-1"); score(); say(ok(it, +b.dataset.i) ? "Correct" : "Not quite"); });
    return d;
  }
  function render(){
    el.innerHTML = "";
    const items = cfg.filter ? cfg.items.filter(cfg.filter) : cfg.items;
    items.forEach(it => el.appendChild(card(it)));
    const r = document.createElement("div"); r.className = "row"; r.style.gridColumn = "1/-1";
    r.innerHTML = `<button type="button" class="btn sm">Reset these answers</button>`;
    r.firstChild.onclick = () => { for (const k in state) delete state[k]; store.set(key, state); render(); score(); };
    el.appendChild(r); score();
  }
  render();
  return {render, set filter(f){ cfg.filter = f; render(); }};
}

/* =========================================================
   MISSION 1
   ========================================================= */
/* 1.1 sort the parts */
(function(){
  const BINS = [["in","Input","Brings data in"],["proc","Process","Follows instructions"],["store","Memory and storage","Keeps data"],["out","Output","Gives results back"]];
  const ITEMS = [["Keyboard","in"],["Microphone","in"],["Camera","in"],["Tilt sensor (accelerometer)","in"],["Touchscreen",["in","out"]],["Processor (CPU)","proc"],["Graphics chip (GPU)","proc"],["RAM","store"],["SSD","store"],["SD card","store"],["Speaker","out"],["Printer","out"],["micro:bit LEDs","out"],["Vibration motor","out"]];
  const root = $("#ipoGame"), placed = store.get("ipo", {});
  let sel = null;
  root.innerHTML = `<div class="pool" id="ipoPool" aria-label="Parts to sort"></div><div class="bins">${BINS.map(([k, n, d]) => `<button type="button" class="bin" data-b="${k}"><b>${n}</b><span>${d}</span><div class="in"></div></button>`).join("")}</div><div id="ipoFb" class="mt" aria-live="polite"></div>`;
  const pool = $("#ipoPool"), fb = $("#ipoFb");
  function draw(){
    pool.innerHTML = ""; $$(".bin .in", root).forEach(x => x.innerHTML = "");
    ITEMS.forEach(([n]) => {
      const b = document.createElement("span"); b.className = "item"; b.textContent = n;
      if (placed[n]){ b.classList.add("ok"); $(`.bin[data-b="${placed[n]}"] .in`, root).appendChild(b); }
      else { const btn = document.createElement("button"); btn.type = "button"; btn.className = "item"; btn.textContent = n; btn.setAttribute("aria-pressed", sel === n ? "true" : "false");
        btn.onclick = () => { sel = sel === n ? null : n; draw(); say(sel ? `${n} selected. Now choose a job.` : "Deselected"); }; pool.appendChild(btn); }
    });
    $$(".bin", root).forEach(b => b.classList.toggle("target", !!sel));
    if (!pool.children.length){ pool.innerHTML = `<span class="small">All sorted.</span>`; Pass.award("ipo"); }
  }
  $$(".bin", root).forEach(bin => bin.onclick = () => {
    if (!sel) { fb.innerHTML = `<div class="fb mid">Tap a part first, then tap its job.</div>`; return; }
    const it = ITEMS.find(x => x[0] === sel), ans = [].concat(it[1]), k = bin.dataset.b;
    if (ans.includes(k)){ placed[sel] = k; store.set("ipo", placed);
      fb.innerHTML = `<div class="fb ok"><b>${esc(sel)}</b> is ${BINS.find(b => b[0] === k)[1].toLowerCase()}.${sel === "Touchscreen" ? " A touchscreen is actually both: it senses your finger (input) and shows pictures (output)." : ""}</div>`; sel = null; }
    else { fb.innerHTML = `<div class="fb no">Not quite. Does <b>${esc(sel)}</b> bring data in, work on it, keep it, or give it back to you?</div>`; }
    draw();
  });
  draw();
})();

/* 1.2 desk and filing cabinet */
(function(){
  const APPS = [["Browser",2],["Game",3],["Music",1],["Photos",2],["Chat",1],["Video editor",4]];
  const LOAD = {hdd: 2.0, ssd: 0.2}; // made-up seconds per slot
  let ram = 4, sto = "hdd", desk = [], wait = 0, swaps = 0, opened = new Set();
  const tried = new Set(store.get("deskTried", []));
  const grid = $("#deskGrid"), log = $("#deskLog");
  function line(t, c){ const d = document.createElement("div"); if (c) d.className = c; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; }
  function used(){ return desk.reduce((s, a) => s + a[1], 0); }
  function draw(){
    grid.style.setProperty("--slots", Math.min(ram, 6)); grid.innerHTML = "";
    let cells = [];
    desk.forEach((a, i) => { for (let k = 0; k < a[1]; k++) cells.push(`<div class="slot full ${i === desk.length - 1 ? "hot" : ""}">${k === 0 ? esc(a[0]) : "…"}</div>`); });
    while (cells.length < ram) cells.push(`<div class="slot">empty</div>`);
    grid.innerHTML = cells.join("");
    $("#deskWait").textContent = wait.toFixed(1) + " s"; $("#deskSwap").textContent = swaps;
    $$("#deskApps button").forEach(b => b.setAttribute("aria-pressed", desk.some(a => a[0] === b.dataset.app) ? "true" : "false"));
  }
  function open(name){
    const app = APPS.find(a => a[0] === name), idx = desk.findIndex(a => a[0] === name);
    if (idx >= 0){ desk.push(desk.splice(idx, 1)[0]); wait += 0.05; line(`${name} is already on the desk: instant (0.05 s).`, "g"); }
    else {
      let t = 0;
      while (used() + app[1] > ram && desk.length){ const out = desk.shift(); swaps++; const st = out[1] * LOAD[sto] * 0.5; t += st; line(`Desk full! ${out[0]} sent back to the cabinet (+${st.toFixed(1)} s).`, "b"); }
      const lt = app[1] * LOAD[sto]; t += lt; desk.push(app); wait += t;
      line(`Fetched ${name} from the ${sto === "hdd" ? "hard disk" : "SSD"} (+${lt.toFixed(1)} s).`, "w");
    }
    opened.add(name);
    if (opened.size === APPS.length){ tried.add(ram + sto); store.set("deskTried", [...tried]); if (tried.size >= 2) Pass.award("desk"); }
    draw();
  }
  function reset(msg){ desk = []; wait = 0; swaps = 0; opened = new Set(); log.innerHTML = ""; line(msg || "Desk cleared."); draw(); }
  $("#deskApps").innerHTML = APPS.map(([n, s]) => `<button type="button" class="btn sm" data-app="${n}" aria-pressed="false">${n} <span class="small">(${s} GB)</span></button>`).join("");
  $("#deskApps").onclick = e => { const b = e.target.closest("button"); if (b) open(b.dataset.app); };
  seg($("#deskRam"), v => { ram = +v; reset(`New desk: ${ram} GB of RAM.`); });
  seg($("#deskSto"), v => { sto = v; reset(`New cabinet: ${v === "hdd" ? "hard disk (slow to find things)" : "SSD (much faster)"}.`); });
  $("#deskReset").onclick = () => reset();
  draw();
})();

/* 1.3 fetch-decode-execute */
(function(){
  const PROG = ["LOAD 8","ADD 9","STORE 10","OUT 10","HALT"];
  const MEAN = {LOAD:"Copy the number at that address into the accumulator.", ADD:"Add the number at that address to the accumulator.", STORE:"Copy the accumulator into that address.", OUT:"Show the number at that address.", HALT:"Stop."};
  let mem, pc, cir, acc, out, stage, halted;
  function reset(){
    mem = PROG.concat(["—","—","—", +$("#cpuA").value || 0, +$("#cpuB").value || 0, 0]); pc = 0; cir = "—"; acc = 0; out = "—"; stage = 0; halted = false;
    $("#cpuSay").textContent = "Press Step to fetch the first instruction."; draw();
  }
  function draw(){
    $("#cpuMem").innerHTML = mem.map((v, i) => `<div class="addr ${i === pc && !halted ? "pc" : ""}">${i}</div><div class="${i === pc && !halted ? "pc" : ""}">${esc(v)}${i === 8 ? " ← Score A" : i === 9 ? " ← Score B" : i === 10 ? " ← answer" : ""}</div>`).join("");
    $("#rPC").textContent = pc; $("#rCIR").textContent = cir; $("#rACC").textContent = acc; $("#rOUT").textContent = out;
    $$("#cpuStage span").forEach((s, i) => s.classList.toggle("on", i === stage && !halted));
  }
  function step(){
    if (halted){ $("#cpuSay").textContent = "The program has stopped. Press Reset to run it again."; return; }
    const [op, a] = String(cir).split(" ");
    if (stage === 0){ cir = mem[pc]; $("#cpuSay").textContent = `FETCH: copy the instruction at address ${pc} ("${cir}") into the processor, and add 1 to the program counter.`; pc++; stage = 1; }
    else if (stage === 1){ $("#cpuSay").textContent = `DECODE: "${cir}" means: ${MEAN[op]}`; stage = 2; }
    else {
      const n = +a;
      if (op === "LOAD") acc = +mem[n]; else if (op === "ADD") acc += +mem[n]; else if (op === "STORE") mem[n] = acc; else if (op === "OUT") out = mem[n];
      if (op === "HALT"){ halted = true; $("#cpuSay").textContent = `EXECUTE: HALT. Done in 5 instructions = 15 steps. A 4 GHz processor could run this program over 250 million times a second.`; Pass.award("cpu"); }
      else $("#cpuSay").textContent = `EXECUTE: ${op === "OUT" ? `output ${out}` : op === "STORE" ? `store ${acc} at address ${n}` : `accumulator is now ${acc}`}.`;
      stage = 0;
    }
    draw();
  }
  $("#cpuStep").onclick = step; $("#cpuReset").onclick = reset;
  ["#cpuA","#cpuB"].forEach(s => $(s).addEventListener("change", reset));
  reset();
})();

/* 1.4 binary */
(function(){
  const root = $("#bits"), vals = [128,64,32,16,8,4,2,1];
  const done = new Set(store.get("binGoals", []));
  root.innerHTML = vals.map(v => `<button type="button" class="bit" aria-pressed="false" aria-label="Bit worth ${v}"><span class="v">${v}</span><span class="d">0</span></button>`).join("");
  function upd(){
    const bs = $$(".bit", root), on = bs.map(b => b.getAttribute("aria-pressed") === "true");
    const n = on.reduce((s, x, i) => s + (x ? vals[i] : 0), 0), ones = on.filter(Boolean).length;
    bs.forEach((b, i) => $(".d", b).textContent = on[i] ? "1" : "0");
    $("#binNum").textContent = n; $("#binChr").textContent = n >= 33 && n <= 126 ? String.fromCharCode(n) : n === 32 ? "space" : "—";
    $("#binSw").style.background = `rgb(${n},${n},${n})`;
    if (n === 13) done.add("13"); if (n === 65) done.add("65"); if (n === 255) done.add("255"); if (n === 42 && ones === 3) done.add("42");
    store.set("binGoals", [...done]);
    $$("#binGoals li").forEach(li => li.classList.toggle("ok", done.has(li.dataset.g)));
    if (done.size === 4) Pass.award("bin");
  }
  root.onclick = e => { const b = e.target.closest(".bit"); if (!b) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); upd(); };
  upd();
})();

/* 1.5 quiz */
choiceCards($("#quiz1"), {key: "q1", items: [
  {id:"a", q:"Does the processor keep your saved files?", opts:["Yes, it stores them","No, storage keeps them","Only the graphics chip does"], a:1, why:"The processor works on data but doesn't keep it. Saved files live in storage (SSD, hard disk, SD card)."},
  {id:"b", q:"Which one is wiped when the power goes off?", opts:["RAM","SSD","SD card"], a:0, why:"RAM is volatile: like a desk cleared every night. Storage keeps data without power."},
  {id:"c", q:"Why can a computer slow down with lots of apps open?", opts:["RAM fills up, so things get swapped out to slower storage","The screen gets tired","The keyboard gets overloaded"], a:0, why:"When the desk is full, the computer keeps putting things back in the filing cabinet and fetching them again."},
  {id:"d", q:"How many bits are in a byte?", opts:["4","8","16"], a:1, why:"8 bits = 1 byte. One byte can store a number from 0 to 255."},
  {id:"e", q:"A microphone is…", opts:["an input","an output","storage"], a:0, why:"It brings sound into the computer as data."},
  {id:"f", q:"What does the cache do?", opts:["Keeps a little data the processor will need next, very close and very fast","Stores all your photos","Connects to the internet"], a:0, why:"Cache is tiny but right next to the processor, so it saves trips to the slower RAM."}
]});

/* =========================================================
   MISSION 2
   ========================================================= */
(function(){
  const F = [
    ["Supercomputer","Weather and climate forecasts, science","The world's fastest since June 2026, China's LineShine, does over 2 quintillion calculations a second and uses about 42 megawatts. Edinburgh is getting the UK's most powerful one."],
    ["Servers and data centres","Websites, streaming, games, AI","Warehouses full of computers that store data and send it to you over the internet."],
    ["Desktop","Gaming, design, video editing","Lots of power, big screens, easy to upgrade. Not portable."],
    ["Laptop","Schoolwork, coding, video calls","A portable all-rounder with a battery and keyboard built in."],
    ["Games console","Games and streaming","Built for graphics. The Nintendo Switch 2 (2025) has 8 cores, 12 GB of RAM and 256 GB of storage."],
    ["Tablet and smartphone","Messages, photos, maps, payments","A computer, camera, map and wallet in your pocket, controlled by touch."],
    ["Wearable","Fitness and health","Smartwatches use sensors and machine learning. Since 2025 one can warn about signs of high blood pressure."],
    ["Robot","Surgery, factories, cleaning","A computer plus sensors and motors. Over 10,000 patients in Scotland have had robot-assisted surgery since 2021."],
    ["Embedded system","Cars, washing machines, traffic lights","A computer hidden inside another product, doing one job. A car can have up to about 150 of them."],
    ["micro:bit","Learning, prototyping, sensing","64 MHz and 128 KB of RAM: roughly 30 times the speed and memory of the Apollo moon computer."]
  ];
  $("#familyCards").innerHTML = F.map(([n, u, f]) => `<div class="panel stack"><h3>${n}</h3><span class="tag now" style="justify-self:start">${u}</span><p style="font-size:.94rem">${f}</p></div>`).join("");
})();
choiceCards($("#spotCards"), {key: "spot", opts: ["Computer inside","No computer"], scoreEl: "#spotScore", countAll: true,
  onScore: (r, n, t) => { if (n === t && r >= 10) Pass.award("spot"); },
  items: [
    {id:"spk", q:"Smart speaker", a:0, why:"It listens (input), processes your voice, and speaks (output). It also sends data to servers."},
    {id:"spoon", q:"Wooden spoon", a:1, why:"No input, no instructions, no output. Just a spoon."},
    {id:"tl", q:"Traffic lights", a:0, why:"A controller runs the light sequence and many read sensors in the road."},
    {id:"car", q:"A modern car", a:0, why:"Dozens of computers, sometimes up to about 150, control brakes, airbags, engine and windows."},
    {id:"bike", q:"An ordinary bicycle", a:1, why:"Gears and brakes are mechanical. No stored instructions."},
    {id:"ebike", q:"An electric bike", a:0, why:"A controller reads how hard you pedal and decides how much motor power to add."},
    {id:"wash", q:"Washing machine with programmes", a:0, why:"An embedded computer runs each wash programme step by step."},
    {id:"book", q:"A paper book", a:1, why:"It stores words, but it can't process anything."},
    {id:"card", q:"Contactless bank card", a:0, why:"A tiny chip runs a program to prove the card is real. It is powered by the card reader's radio signal."},
    {id:"clock", q:"Wind-up clock", a:1, why:"It's all springs and gears. No input data, no program."},
    {id:"hear", q:"Digital hearing aid", a:0, why:"It turns sound into data, processes it to make speech clearer, and plays it back."},
    {id:"micro", q:"Microwave with a digital timer", a:0, why:"It reads the buttons, counts down and controls the heater."}
  ]});
choiceCards($("#jobCards"), {key: "job", opts: ["Supercomputer","Data centre servers","Laptop","Smartphone","Wearable","Embedded system"],
  items: [
    {id:"wx", q:"Forecast next week's weather for the whole UK", a:0, why:"Billions of calculations on huge amounts of data need a supercomputer."},
    {id:"spin", q:"Run the spin cycle on a washing machine", a:5, why:"One simple job, built into the machine, cheap and low power: an embedded system."},
    {id:"film", q:"Stream a new film to millions of people at once", a:1, why:"Data centres store the film and send it to millions of devices at the same time."},
    {id:"steps", q:"Count your steps and heartbeat all day", a:4, why:"It has to be worn, so it must be tiny with a battery that lasts."},
    {id:"edit", q:"Edit a video for a school project on the bus", a:[2,3], why:"A laptop has more power and a bigger screen. A phone is more portable. Both can work: justify your choice."},
    {id:"pay", q:"Pay for lunch and check the bus times", a:3, why:"Always with you, connected, and has a payment chip and a screen."}
  ]});
