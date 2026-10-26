"use strict";
/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const store = {
  get(k){ try { return localStorage.getItem("fp." + k); } catch(e){ return null; } },
  set(k,v){ try { localStorage.setItem("fp." + k, v); } catch(e){} },
  del(k){ try { localStorage.removeItem("fp." + k); } catch(e){} },
  json(k, d){ try { const v = this.get(k); return v ? JSON.parse(v) : d; } catch(e){ return d; } }
};
const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
function download(name, text, mime = "text/plain"){
  const blob = new Blob([text], {type: mime + ";charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}
function fmtDur(s){
  if (s < 1) return (s < 0.01 ? s.toPrecision(2) : s.toFixed(2)) + " s";
  if (s < 60) return (s < 10 ? s.toFixed(1) : Math.round(s)) + " s";
  if (s < 3600) return Math.round(s / 60) + " min";
  if (s < 86400) { const h = s / 3600; return (h < 10 ? h.toFixed(1) : Math.round(h)) + " hours"; }
  if (s < 86400 * 365) { const d = s / 86400; return (d < 10 ? d.toFixed(1) : Math.round(d)) + " days"; }
  const y = s / (86400 * 365); return (y < 10 ? y.toFixed(1) : Math.round(y).toLocaleString("en-GB")) + " years";
}
function flash(el){ if (!el) return; el.textContent = "Saved"; clearTimeout(el._t); el._t = setTimeout(() => el.textContent = "", 1400); }

/* ---------- theme ---------- */
(function(){
  const root = document.documentElement, btn = $("#themeBtn");
  const saved = store.get("theme");
  if (saved) root.setAttribute("data-theme", saved);
  const isDark = () => root.getAttribute("data-theme") ? root.getAttribute("data-theme") === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const label = () => btn.textContent = isDark() ? "Light" : "Dark";
  label();
  btn.addEventListener("click", () => { const t = isDark() ? "light" : "dark"; root.setAttribute("data-theme", t); store.set("theme", t); label(); });
})();

/* ---------- autosave for [data-save] ---------- */
const savedFor = {"r.": "#rSaved", "p.": "#ptSaved", "pl.": "#plSaved"};
function bindSave(el){
  const k = el.dataset.save, v = store.get("s." + k);
  if (v !== null){ if (el.type === "checkbox") el.checked = v === "1"; else el.value = v; }
  const ev = (el.type === "checkbox" || el.tagName === "SELECT") ? "change" : "input";
  el.addEventListener(ev, () => {
    store.set("s." + k, el.type === "checkbox" ? (el.checked ? "1" : "0") : el.value);
    const pre = Object.keys(savedFor).find(p => k.startsWith(p));
    if (pre) flash($(savedFor[pre]));
  });
}
$$("[data-save]").forEach(bindSave);

/* =========================================================
   PART 1.1  Fetch–decode–execute
   ========================================================= */
(function(){
  const OPS = {ADD:100, SUB:200, STA:300, LDA:500, BRA:600, BRZ:700, BRP:800};
  const NAMES = {1:"ADD",2:"SUB",3:"STA",5:"LDA",6:"BRA",7:"BRZ",8:"BRP"};
  const PRESETS = {
    add: "LDA 6\nADD 7\nSTA 8\nOUT\nHLT\n\nDAT 21\nDAT 19\nDAT 0",
    count: "LDA 7\nOUT\nSUB 8\nBRZ 5\nBRA 1\nOUT\nHLT\nDAT 3\nDAT 1",
    thermo: "INP\nSUB 9\nBRP 6\nLDA 11\nOUT\nHLT\nLDA 10\nOUT\nHLT\nDAT 20\nDAT 1\nDAT 0"
  };
  const INTRO = {
    add: "Adds two readings stored at addresses 6 and 7, stores the answer at 8 and outputs it.",
    count: "Outputs 3, 2, 1, 0 using a loop. Watch BRA and BRZ change the program counter.",
    thermo: "Reads the temperature sensor. Outputs 1 if it is 20°C or more (heating off), or 0 if it is colder (heating on)."
  };
  const S = {mem: Array(16).fill(0), isData: Array(16).fill(false), pc:0, mar:0, mdr:0, cir:null, acc:0, phase:0, halted:false, out:[], cycles:0, timer:null};
  const ram = $("#ram"), narr = $("#cpuNarr");
  for (let i = 0; i < 16; i++){ const c = document.createElement("div"); c.className = "cell"; c.innerHTML = `<i>${i}</i><span></span>`; ram.appendChild(c); }
  const clamp = v => Math.max(-999, Math.min(999, v));
  function decodeText(v, data){
    if (data) return "DAT " + v;
    if (v === 901) return "INP"; if (v === 902) return "OUT";
    const op = Math.floor(v / 100), a = v % 100;
    if (v === 0) return "HLT";
    if (NAMES[op]) return NAMES[op] + " " + a;
    return String(v);
  }
  function assemble(src){
    const lines = src.split("\n").map(l => l.replace(/(;|\/\/).*$/, "").trim());
    const mem = Array(16).fill(0), isData = Array(16).fill(false);
    let addr = 0;
    for (let i = 0; i < lines.length; i++){
      const l = lines[i];
      if (!l) { if (addr < 16 && i < lines.length - 1 && lines.slice(i+1).some(x => x)) { addr++; } continue; }
      if (addr > 15) return {err: "Too many lines: this computer only has 16 memory locations (0–15)."};
      const [m, n] = l.toUpperCase().split(/\s+/);
      const num = n === undefined ? null : Number(n);
      if (m === "INP") mem[addr] = 901;
      else if (m === "OUT") mem[addr] = 902;
      else if (m === "HLT") mem[addr] = 0;
      else if (m === "DAT"){ if (num === null || isNaN(num) || Math.abs(num) > 999) return {err: `Line ${i+1}: DAT needs a number from −999 to 999.`}; mem[addr] = Math.round(num); isData[addr] = true; }
      else if (OPS[m] !== undefined){ if (num === null || isNaN(num) || num < 0 || num > 15) return {err: `Line ${i+1}: ${m} needs an address from 0 to 15.`}; mem[addr] = OPS[m] + num; }
      else return {err: `Line ${i+1}: I don’t know “${esc(m)}”.`};
      addr++;
    }
    return {mem, isData};
  }
  function load(src){
    const r = assemble(src);
    if (r.err){ $("#cpuAsmMsg").innerHTML = r.err; return false; }
    S.mem = r.mem; S.isData = r.isData; $("#cpuAsmMsg").textContent = "Loaded."; reset(); return true;
  }
  function reset(keepMsg){
    stop(); S.pc = 0; S.mar = 0; S.mdr = 0; S.cir = null; S.acc = 0; S.phase = 0; S.halted = false; S.out = []; S.cycles = 0;
    render({});
    if (!keepMsg) narr.innerHTML = `<b>Ready.</b> ${INTRO[$("#cpuPreset").value] || "Your program is loaded."} Press <b>Step</b>.`;
  }
  function render(h){
    $("#rPC span").textContent = S.pc; $("#rMAR span").textContent = S.mar; $("#rMDR span").textContent = S.mdr;
    $("#rCIR span").textContent = S.cir === null ? "–" : S.cir; $("#rACC span").textContent = S.acc;
    ["PC","MAR","MDR","CIR","ACC"].forEach(r => $("#r" + r).classList.toggle("flash", !!(h.regs && h.regs.includes(r))));
    $("#uCU").classList.toggle("on", !!h.cu); $("#uALU").classList.toggle("on", !!h.alu);
    $("#bA").classList.toggle("on", !!h.a); $("#bD").classList.toggle("on", !!h.d); $("#bC").classList.toggle("on", !!h.c);
    ["F","D","E"].forEach((p, i) => $("#ph" + p).classList.toggle("on", h.phase === i));
    $$(".cell", ram).forEach((c, i) => {
      c.querySelector("span").textContent = (S.isData[i] ? "" : S.mem[i] + " ") + decodeText(S.mem[i], S.isData[i]);
      c.classList.toggle("pc", i === S.pc && !S.halted);
      c.classList.toggle("touch", h.cell === i);
      c.title = `Address ${i}: ${S.mem[i]}`;
    });
    $("#cpuOut").textContent = S.out.join("  ");
    $("#cpuBox").classList.toggle("active", h.phase !== undefined);
  }
  function step(){
    if (S.halted){ narr.innerHTML = "<b>Halted.</b> Press Reset to run it again."; stop(); return; }
    if (S.phase === 0){ // FETCH
      if (S.pc > 15){ S.halted = true; narr.innerHTML = "<b>Stopped.</b> The program counter ran past address 15 without reaching HLT."; render({}); stop(); return; }
      S.mar = S.pc; S.mdr = S.mem[S.mar]; S.cir = S.mdr; const was = S.pc; S.pc++;
      narr.innerHTML = `<b>Fetch.</b> The PC holds <b>${was}</b>, so that address is copied to the MAR and sent along the <b>address bus</b>. Memory sends back <b>${S.mdr}</b> along the <b>data bus</b> into the MDR, and it is copied to the CIR. The PC goes up to <b>${S.pc}</b>, ready for next time.`;
      render({phase:0, regs:["PC","MAR","MDR","CIR"], a:1, d:1, c:1, cell:S.mar}); S.phase = 1; return;
    }
    const v = S.cir, op = Math.floor(v / 100), a = v % 100;
    const name = v === 901 ? "INP" : v === 902 ? "OUT" : v === 0 ? "HLT" : (NAMES[op] || "?");
    if (S.phase === 1){ // DECODE
      const what = {INP:"read the sensor",OUT:"output the accumulator",HLT:"stop",LDA:`load from address ${a}`,STA:`store to address ${a}`,ADD:`add the value at address ${a}`,SUB:`subtract the value at address ${a}`,BRA:`jump to address ${a}`,BRZ:`jump to ${a} if the accumulator is zero`,BRP:`jump to ${a} if the accumulator is zero or more`,"?":"(not a valid instruction)"}[name];
      narr.innerHTML = `<b>Decode.</b> The control unit splits <b>${v}</b> into an opcode and an operand: <b>${name}</b>${["INP","OUT","HLT"].includes(name) ? "" : " " + a}, meaning “${what}”.`;
      render({phase:1, regs:["CIR"], cu:1, c:1}); S.phase = 2; return;
    }
    // EXECUTE
    let h = {phase:2, cu:1, c:1}, msg = "";
    S.cycles++;
    switch (name){
      case "LDA": S.mar = a; S.mdr = S.mem[a]; S.acc = S.mdr; h = {...h, regs:["MAR","MDR","ACC"], a:1, d:1, cell:a}; msg = `Address ${a} goes to the MAR. The value <b>${S.mdr}</b> comes back into the MDR and is copied to the accumulator.`; break;
      case "STA": S.mar = a; S.mdr = S.acc; S.mem[a] = S.acc; S.isData[a] = true; h = {...h, regs:["MAR","MDR"], a:1, d:1, cell:a}; msg = `The accumulator’s value <b>${S.acc}</b> goes into the MDR and is written to address ${a}.`; break;
      case "ADD": case "SUB": { S.mar = a; S.mdr = S.mem[a]; const before = S.acc; S.acc = clamp(name === "ADD" ? S.acc + S.mdr : S.acc - S.mdr); h = {...h, regs:["MAR","MDR","ACC"], a:1, d:1, alu:1, cell:a}; msg = `The value <b>${S.mdr}</b> is fetched from address ${a}. The <b>ALU</b> works out ${before} ${name === "ADD" ? "+" : "−"} ${S.mdr} = <b>${S.acc}</b>.`; break; }
      case "INP": S.acc = Number($("#cpuSensor").value); h = {...h, regs:["ACC"]}; msg = `The temperature sensor reads <b>${S.acc}°C</b> and the value goes into the accumulator.`; break;
      case "OUT": S.out.push(S.acc); h = {...h, regs:["ACC"]}; msg = `The accumulator’s value <b>${S.acc}</b> is sent to the output.`; break;
      case "BRA": S.pc = a; h = {...h, regs:["PC"]}; msg = `The PC is set to <b>${a}</b>, so the next fetch comes from there. This is how loops work.`; break;
      case "BRZ": if (S.acc === 0){ S.pc = a; h.regs = ["PC"]; msg = `The accumulator is 0, so the PC jumps to <b>${a}</b>.`; } else msg = `The accumulator is ${S.acc}, not 0, so nothing changes. The PC stays at ${S.pc}.`; break;
      case "BRP": if (S.acc >= 0){ S.pc = a; h.regs = ["PC"]; msg = `The accumulator (${S.acc}) is zero or more, so the PC jumps to <b>${a}</b>.`; } else msg = `The accumulator is ${S.acc}, which is negative, so the PC stays at ${S.pc}.`; break;
      case "HLT": S.halted = true; msg = `The program stops after <b>${S.cycles}</b> cycles.`; break;
      default: S.halted = true; msg = `<b>${v}</b> isn’t a valid instruction. Did the program run into its data? The computer stops.`;
    }
    narr.innerHTML = `<b>Execute.</b> ${msg}`;
    render(h); S.phase = 0;
    if (S.halted) stop();
  }
  function stop(){ clearInterval(S.timer); S.timer = null; $("#cpuRun").textContent = "Run"; }
  $("#cpuStep").addEventListener("click", () => { stop(); step(); });
  $("#cpuRun").addEventListener("click", () => {
    if (S.timer){ stop(); return; }
    if (S.halted) reset(true);
    const ms = [1600, 1100, 700, 380, 160][Number($("#cpuSpeed").value) - 1];
    $("#cpuRun").textContent = "Pause"; step();
    S.timer = setInterval(() => { step(); if (S.halted) stop(); }, ms);
  });
  $("#cpuReset").addEventListener("click", () => reset());
  $("#cpuPreset").addEventListener("change", e => { $("#cpuAsm").value = PRESETS[e.target.value]; load(PRESETS[e.target.value]); $("#cpuAsmMsg").textContent = ""; });
  $("#cpuLoad").addEventListener("click", () => { if (load($("#cpuAsm").value)) narr.innerHTML = "<b>Loaded.</b> Your program is in memory. Press <b>Step</b> or <b>Run</b>."; });
  $("#cpuSensor").addEventListener("input", e => $("#cpuSensorOut").textContent = e.target.value + "°C");
  $("#cpuAsm").value = PRESETS.add; load(PRESETS.add); $("#cpuAsmMsg").textContent = "";
})();

/* =========================================================
   PART 1.2  Memory hierarchy
   ========================================================= */
(function(){
  const TICK = 0.3e-9;
  const M = [
    {n:"Registers", d:"Inside the CPU", t:0.3e-9},
    {n:"Cache", d:"On the CPU chip", t:1e-9},
    {n:"RAM", d:"Main memory, volatile", t:100e-9},
    {n:"SSD", d:"Secondary storage", t:100e-6},
    {n:"Hard disk", d:"Spinning secondary storage", t:10e-3},
    {n:"Cloud server", d:"Across the internet", t:60e-3}
  ];
  const real = t => t < 1e-6 ? Math.round(t * 1e9 * 10) / 10 + " ns" : t < 1e-3 ? Math.round(t * 1e6) + " µs" : Math.round(t * 1e3) + " ms";
  const box = $("#memList");
  M.forEach(m => {
    const b = document.createElement("button"); b.type = "button"; b.className = "mem";
    b.innerHTML = `<span><b>${m.n}</b><small>${m.d} · real: ${real(m.t)}</small></span><span class="track"><span class="fill"></span></span><span class="t">tap</span>`;
    b.setAttribute("aria-label", `${m.n}: tap to see the scaled waiting time`);
    b.addEventListener("click", () => {
      const scaled = m.t / TICK, fill = b.querySelector(".fill"), out = b.querySelector(".t");
      const dur = reduced() ? 0 : 250 + 380 * Math.log10(scaled + 1);
      fill.style.transition = "none"; fill.style.width = "0";
      out.textContent = "waiting…";
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.transition = `width ${dur}ms linear`; fill.style.width = "100%"; }));
      setTimeout(() => out.textContent = "≈ " + fmtDur(scaled), dur);
    });
    box.appendChild(b);
  });
})();

/* =========================================================
   PART 1.3  Route builder + packets
   ========================================================= */
(function(){
  const HOPS = [
    {id:"bell", ic:"🔔", n:"Doorbell camera", s:"Sensor and camera"},
    {id:"wifi", ic:"📶", n:"Home router", s:"Wi-Fi, on the LAN"},
    {id:"isp", ic:"🏢", n:"Internet service provider", s:"Your broadband company"},
    {id:"net", ic:"🌐", n:"Internet routers", s:"Across the WAN"},
    {id:"dc", ic:"🗄️", n:"Cloud data centre", s:"Doorbell company’s servers"},
    {id:"mast", ic:"📡", n:"Mobile phone mast", s:"4G or 5G network"},
    {id:"phone", ic:"📱", n:"Your phone", s:"The app shows the alert"}
  ];
  const order = HOPS.map(h => h.id);
  const shuffled = HOPS.slice().sort(() => Math.random() - .5);
  let built = [];
  const hopsEl = $("#hops"), rb = $("#routeBuilt"), fb = $("#routeFb");
  shuffled.forEach(h => {
    const b = document.createElement("button"); b.type = "button"; b.className = "hop"; b.dataset.id = h.id;
    b.innerHTML = `<span class="ic" aria-hidden="true">${h.ic}</span><b>${h.n}</b><span>${h.s}</span>`;
    b.addEventListener("click", () => { if (built.includes(h.id)) return; built.push(h.id); draw(); });
    hopsEl.appendChild(b);
  });
  function draw(){
    $$(".hop", hopsEl).forEach(b => { const u = built.includes(b.dataset.id); b.classList.toggle("used", u); b.disabled = u; });
    if (!built.length){ rb.innerHTML = '<span class="small">Your route will appear here.</span>'; fb.hidden = true; return; }
    const done = built.length === order.length;
    rb.innerHTML = built.map((id, i) => { const h = HOPS.find(x => x.id === id); const bad = done && id !== order[i]; return `<span class="rb${bad ? " bad" : ""}">${i + 1}. ${h.n}</span>`; }).join('<span class="arr" aria-hidden="true">→</span>');
    if (done){
      fb.hidden = false;
      const right = built.every((id, i) => id === order[i]);
      fb.className = "fbbox " + (right ? "good" : "bad");
      fb.innerHTML = right
        ? "<b>Correct.</b> The doorbell sends packets over your home <b>LAN</b> (Wi-Fi) to the router, which forwards them to your provider and across the internet <b>WAN</b> to the data centre. The company’s servers store the video and send a notification out through the mobile network to your phone. The whole trip takes about a second."
        : "<b>Not quite.</b> The red stops are in the wrong place. Hint: the data has to reach the company’s servers before your phone can be told about it. Press Clear and try again.";
    }
  }
  $("#routeUndo").addEventListener("click", () => { built.pop(); draw(); });
  $("#routeClear").addEventListener("click", () => { built = []; draw(); });

  // network
  const svg = $("#netSvg"), NS = "http://www.w3.org/2000/svg";
  const N = {home:[40,150,"Home router","LAN → WAN"], isp:[135,150,"ISP","exchange"], r1:[245,62,"Router A",""], r2:[245,238,"Router B",""], r3:[365,62,"Router C",""], r4:[365,238,"Router D",""], dc:[475,150,"Data centre","cloud"]};
  const L = [["home","isp"],["isp","r1"],["isp","r2"],["r1","r3"],["r2","r4"],["r1","r4"],["r2","r3"],["r3","dc"],["r4","dc"]];
  const down = new Set();
  const PATHS = [["home","isp","r1","r3","dc"],["home","isp","r1","r4","dc"],["home","isp","r2","r4","dc"],["home","isp","r2","r3","dc"]];
  const colors = ["#F2A93B","#2EC4B6","#8B7BFF","#E85D75","#4FA3F7","#7BC950"];
  function mk(tag, a){ const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function drawNet(){
    svg.innerHTML = "";
    L.forEach(([a, b]) => { const dn = down.has(a) || down.has(b); svg.appendChild(mk("line", {x1:N[a][0], y1:N[a][1], x2:N[b][0], y2:N[b][1], class:"link" + (dn ? " down" : "")})); });
    for (const k in N){
      const [x, y, t, s] = N[k], dn = down.has(k);
      svg.appendChild(mk("circle", {cx:x, cy:y, r:k === "home" || k === "dc" ? 24 : 18, class:"node" + (dn ? " down" : "")}));
      const tx = mk("text", {x, y:y + (y > 200 ? 40 : y < 100 ? -28 : 40), "text-anchor":"middle"}); tx.textContent = dn ? t + " ✕" : t; svg.appendChild(tx);
      if (s){ const st = mk("text", {x, y:y + (y > 200 ? 53 : y < 100 ? -15 : 53), "text-anchor":"middle", class:"sub"}); st.textContent = s; svg.appendChild(st); }
    }
  }
  drawNet();
  let sending = false;
  function livePaths(){ return PATHS.filter(p => !p.some(n => down.has(n))); }
  $("#netBreak").addEventListener("click", () => {
    if (sending) return;
    const cand = ["r1","r2","r3","r4"].filter(r => !down.has(r)).sort(() => Math.random() - .5);
    for (const r of cand){ down.add(r); if (livePaths().length) { drawNet(); $("#netMsg").innerHTML = `<b>${N[r][2]} has failed.</b> Send again: packets will be routed around it.`; return; } down.delete(r); }
    $("#netMsg").innerHTML = "Breaking another router would cut the data centre off completely, so the simulator won’t let you. Real networks have many extra routes for this reason.";
  });
  $("#netFix").addEventListener("click", () => { if (sending) return; down.clear(); drawNet(); $("#netMsg").textContent = "All routers working."; });
  $("#netSend").addEventListener("click", () => {
    if (sending) return;
    const paths = livePaths(); if (!paths.length) return;
    sending = true; drawNet();
    const re = $("#reasm"); re.innerHTML = ""; const arrived = [];
    $("#netMsg").textContent = "Packets are on their way. Each router picks a working route…";
    const total = 6; let done = 0;
    for (let i = 0; i < total; i++){
      const p = paths[Math.floor(Math.random() * paths.length)];
      const pts = p.map(n => [N[n][0], N[n][1]]);
      const segs = []; let len = 0;
      for (let j = 0; j < pts.length - 1; j++){ const d = Math.hypot(pts[j+1][0] - pts[j][0], pts[j+1][1] - pts[j][1]); segs.push(d); len += d; }
      const g = mk("g", {}); const c = mk("circle", {r:9, class:"pkt", fill:colors[i], cx:pts[0][0], cy:pts[0][1]});
      const t = mk("text", {"text-anchor":"middle", "font-size":"10", "font-weight":"700", fill:"#141B33", x:pts[0][0], y:pts[0][1] + 3.5}); t.textContent = i + 1;
      g.appendChild(c); g.appendChild(t); svg.appendChild(g);
      const delay = reduced() ? i * 60 : i * 260, dur = reduced() ? 200 : 1400 + Math.random() * 1400 + (len - 450) * 3;
      const start = performance.now() + delay;
      const tick = now => {
        const k = Math.min(1, Math.max(0, (now - start) / dur));
        let dist = k * len, j = 0; while (j < segs.length - 1 && dist > segs[j]){ dist -= segs[j]; j++; }
        const f = segs[j] ? dist / segs[j] : 1;
        const x = pts[j][0] + (pts[j+1][0] - pts[j][0]) * f, y = pts[j][1] + (pts[j+1][1] - pts[j][1]) * f;
        c.setAttribute("cx", x); c.setAttribute("cy", y); t.setAttribute("x", x); t.setAttribute("y", y + 3.5);
        if (k < 1) requestAnimationFrame(tick);
        else {
          g.remove(); arrived.push(i + 1); done++;
          re.innerHTML = arrived.map(n => `<span class="in" style="border-left:4px solid ${colors[n-1]}">${n}</span>`).join("");
          if (done === total){
            const inOrder = arrived.every((n, x) => n === x + 1);
            re.innerHTML += `<span style="border:0;background:none">→ reassembled: ${[1,2,3,4,5,6].join(" ")} ✓</span>`;
            $("#netMsg").innerHTML = inOrder ? "This time they happened to arrive in order. Send again and watch for overtaking." : "<b>They arrived out of order</b> because they took different routes. The data centre uses the sequence numbers to put the photo back together. If one never arrived, it would ask for it to be sent again.";
            sending = false;
          }
        }
      };
      requestAnimationFrame(tick);
    }
  });
})();

/* =========================================================
   PART 1.4  Bandwidth
   ========================================================= */
(function(){
  const FILES = [
    {n:"Email", b:5e3, note:"A short text email, about 5 KB."},
    {n:"Photo", b:4e6, note:"A phone photo, about 4 MB."},
    {n:"Song", b:5e6, note:"A three-minute song, about 5 MB."},
    {n:"HD film", b:4e9, note:"A two-hour film in HD, about 4 GB."},
    {n:"Game update", b:50e9, note:"A big console game download, about 50 GB."}
  ];
  const NETS = [
    {n:"1983 Prestel modem", s:"1,200 bit/s", bps:1200, c:"var(--past)"},
    {n:"1996 dial-up", s:"28.8 kbit/s", bps:28800, c:"var(--past)"},
    {n:"2008 broadband", s:"8 Mbit/s", bps:8e6, c:"var(--now)"},
    {n:"2026 4G phone", s:"~40 Mbit/s", bps:40e6, c:"var(--now)"},
    {n:"2026 full fibre", s:"900 Mbit/s", bps:900e6, c:"var(--fut)"}
  ];
  let cur = 1;
  const fEl = $("#bwFiles"), rows = $("#bwRows");
  FILES.forEach((f, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "opt"; b.textContent = f.n; b.addEventListener("click", () => { cur = i; draw(); }); fEl.appendChild(b); });
  NETS.forEach(n => { const r = document.createElement("div"); r.className = "bwr"; r.innerHTML = `<span><b>${n.n}</b><small>${n.s}</small></span><span class="track"><span class="fill" style="background:${n.c};opacity:.35"></span><span class="val"></span></span>`; rows.appendChild(r); });
  function draw(){
    $$(".opt", fEl).forEach((b, i) => b.setAttribute("aria-pressed", i === cur));
    const f = FILES[cur]; $("#bwNote").textContent = f.note;
    const ts = NETS.map(n => f.b * 8 / n.bps);
    const lo = Math.log10(0.001), hi = Math.log10(Math.max(...ts) * 1.2);
    $$(".bwr", rows).forEach((r, i) => {
      const w = Math.max(3, (Math.log10(Math.max(ts[i], 0.001)) - lo) / (hi - lo) * 100);
      r.querySelector(".fill").style.width = w + "%"; r.querySelector(".val").textContent = fmtDur(ts[i]);
    });
  }
  draw();
})();
