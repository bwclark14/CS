
/* =========================================================
   PART 4.1  Frontier pillars
   ========================================================= */
(function(){
  const P = [
    {k:"ai", t:"AI and robotics", what:"Neural networks are programs that learn patterns from huge numbers of examples instead of following rules a person wrote. Robots and self-driving vehicles use them to make sense of cameras and sensors.",
      problem:"Tasks too messy for written rules: spotting disease in a scan, translating speech, recognising a cyclist in the rain, sorting recycling.",
      needs:"Data centres full of specialised chips to train models; huge amounts of data; and small, efficient “edge AI” chips so phones, cars and robots can run models without waiting for the cloud (remember the memory hierarchy).",
      concerns:"Bias in training data, deepfakes and misinformation, jobs changing, who is responsible when an autonomous system gets it wrong, and the energy and water used by data centres.",
      now:"Already everywhere for some jobs (translation, recommendations, chatbots). Driverless taxis carry passengers in some cities. General-purpose household robots are still at the research and early-trial stage."},
    {k:"quantum", t:"Quantum computing", what:"Computers that use qubits, which can be in a superposition of 0 and 1, to tackle certain problems in a completely different way from ordinary computers.",
      problem:"Problems where the possibilities explode: simulating molecules to design medicines, batteries and fertilisers, and some hard optimisation problems.",
      needs:"Qubits that stay stable for long enough, usually cooled close to absolute zero; error correction, which may need hundreds or thousands of physical qubits to make one reliable “logical” qubit; and new algorithms.",
      concerns:"A large enough quantum computer could break some of the encryption that protects the internet today, so “post-quantum” encryption is already being rolled out. Also cost, who gets access, and a lot of hype.",
      now:"In research labs and cloud test services. Error correction is improving, but machines aren’t yet reliable enough for most useful tasks. Quantum won’t replace your laptop."},
    {k:"bci", t:"Brain–computer interfaces and health tech", what:"Devices that read signals from the brain or body and turn them into commands or health data. Some are implanted by surgery; others are worn, like headsets and smartwatches.",
      problem:"Helping people with paralysis communicate or control a computer by thought; spotting health problems early, like an irregular heartbeat.",
      needs:"Tiny low-power chips, wireless links that work through the body, batteries that last, AI to decode noisy signals, and years of safety testing.",
      concerns:"Brain data could be the most private data there is. Who owns it? Could an implant be hacked? Surgery has risks. Will only rich people get the benefits?",
      now:"Implants are in small clinical trials with a few dozen people worldwide, with some striking results. Some smartwatches can already warn about an irregular heart rhythm."},
    {k:"green", t:"Green computing and energy", what:"Making computing use less energy, and using computing to run cleaner energy systems: smart grids, micro-grids and better batteries.",
      problem:"Data centres used about 1.5% of the world’s electricity in 2024 (about 415 TWh), and the International Energy Agency expects that to more than double by 2030, mostly because of AI. Renewable energy also needs smart control because the wind and sun vary.",
      needs:"More efficient chips, liquid cooling, data centres powered by renewables, reusing waste heat, better batteries, and sensors and networks to balance supply and demand.",
      concerns:"E-waste, mining for battery metals, water used for cooling, and where new data centres are built. Smart meters also collect data about when you’re home.",
      now:"Growing fast. Some data centres already pass their waste heat to homes or swimming pools; smart meters are common in UK homes."}
  ];
  const H = ["All hype","Mostly hype","Half and half","Mostly real","Already real"];
  const rate = store.json("hype", {});
  const tabs = $("#pTabs"), body = $("#pBody");
  function show(i){
    const d = P[i];
    $$("button", tabs).forEach((b, j) => b.setAttribute("aria-selected", i === j));
    body.innerHTML = `<div class="facts">
      <div class="fact"><div class="fl">What it is</div>${esc(d.what)}</div>
      <div class="fact"><div class="fl">1 · What problem does it solve?</div>${esc(d.problem)}</div>
      <div class="fact"><div class="fl">2 · What hardware or network advances does it need?</div>${esc(d.needs)}</div>
      <div class="fact"><div class="fl">3 · What are the concerns?</div>${esc(d.concerns)}</div></div>
      <div class="stack"><div class="panel"><h3>Where is it now? (2026)</h3><p>${esc(d.now)}</p></div>
      <div class="panel hype"><h3>Your hype rating</h3><div class="hype-scale" role="group" aria-label="Hype rating">${H.map((h, j) => `<button type="button" data-j="${j}" class="${rate[d.k] === j ? "pick" : ""}">${h}</button>`).join("")}</div><p class="small">There’s no right answer. Compare ratings with your class and give a reason.</p></div></div>`;
    $$(".hype-scale button", body).forEach(b => b.addEventListener("click", () => { rate[d.k] = +b.dataset.j; store.set("hype", JSON.stringify(rate)); $$(".hype-scale button", body).forEach(x => x.classList.toggle("pick", x === b)); }));
  }
  P.forEach((d, i) => { const b = document.createElement("button"); b.type = "button"; b.role = "tab"; b.textContent = d.t; b.addEventListener("click", () => show(i)); tabs.appendChild(b); });
  show(0);
})();

/* =========================================================
   PART 4.2  Qubit
   ========================================================= */
(function(){
  let c0 = 0, c1 = 0, busy = false;
  const coin = $("#coin"), p = $("#qP");
  const setP = () => { $("#qPOut").textContent = p.value + "%"; coin.style.setProperty("--p", (100 - p.value) + "%"); };
  p.addEventListener("input", setP); setP();
  const measure = () => Math.random() * 100 < +p.value ? 1 : 0;
  const upd = () => { $("#q0").textContent = c0; $("#q1").textContent = c1; };
  $("#qOne").addEventListener("click", () => {
    if (busy) return; busy = true; coin.textContent = ""; coin.classList.add("spin");
    setTimeout(() => { const r = measure(); coin.classList.remove("spin"); coin.textContent = r; r ? c1++ : c0++; upd(); busy = false; }, reduced() ? 50 : 650);
  });
  $("#qMany").addEventListener("click", () => { for (let i = 0; i < 100; i++) measure() ? c1++ : c0++; upd(); coin.textContent = "×100"; });
  $("#qClear").addEventListener("click", () => { c0 = c1 = 0; upd(); coin.textContent = "?"; });
  const t = $("#qTable");
  [[1,"2"],[2,"4"],[3,"8"],[10,"1,024"],[20,"1,048,576"],[50,"about 1 quadrillion"],[300,"more than the number of atoms in the observable universe"]].forEach(([n, v]) => t.insertAdjacentHTML("beforeend", `<tr><td>${n}</td><td>${v}</td></tr>`));
})();

/* =========================================================
   PART 4.3  Hype or hope
   ========================================================= */
(function(){
  const D = [
    {h:"Peer-reviewed study: quantum computer simulates a small molecule more accurately than classical methods", o:"Science news site", a:"ev", ex:"A specific, measured result, checked by other scientists (peer review). Notice it says “small molecule”, not “cures disease”."},
    {h:"This brain chip will let you download a new language by 2028, says founder", o:"Interview with a company boss", a:"hype", ex:"A huge promise, a short deadline, and the only source is the person selling it. Nothing has been measured."},
    {h:"Hospital trial of 80,000 scans: AI plus doctors found more early cancers than doctors alone", o:"Health news", a:"ev", ex:"A large trial with a measured comparison. Next questions: who ran it, and has it been repeated?"},
    {h:"Quantum laptops will be in every home within three years", o:"Tech blog", a:"hype", ex:"No evidence, and it ignores the bottleneck: qubits need extreme cooling and error correction."},
    {h:"Self-driving lorries will replace ALL drivers next year", o:"Social media post", a:"hype", ex:"“ALL” and “next year” are warning signs. No source, no data."},
    {h:"Researchers measure 500 data centres and find cooling uses about a third of their energy", o:"University report", a:"ev", ex:"Lots of measurements, a named source type, and a specific finding you could check."},
    {h:"Startup’s battery ‘charges in ten seconds and lasts for ever’, now seeking investors", o:"Press release", a:"hype", ex:"“For ever” breaks the laws of physics, and a press release asking for money is not independent."},
    {h:"Smart meter trial: homes with energy displays cut use by 3% on average", o:"Government report", a:"ev", ex:"A small, specific, measured change. Real evidence often sounds less exciting than hype."}
  ];
  const box = $("#heads");
  D.forEach(d => {
    const el = document.createElement("div"); el.className = "headline";
    el.innerHTML = `<span class="outlet">${esc(d.o)}</span><span class="hl">${esc(d.h)}</span><div class="ans"><button type="button" data-k="ev">Evidence</button><button type="button" data-k="hype">Hype</button></div><span class="fb small"></span>`;
    $$("button", el).forEach(b => b.addEventListener("click", () => {
      const ok = b.dataset.k === d.a; el.classList.toggle("right", ok); el.classList.toggle("wrong", !ok);
      const f = el.querySelector(".fb"); f.style.color = "var(--ink)"; f.innerHTML = `<b>${d.a === "ev" ? "Evidence" : "Hype"}.</b> ${esc(d.ex)}`;
    }));
    box.appendChild(el);
  });
})();

/* ---------- research download ---------- */
$("#rDownload").addEventListener("click", () => {
  const v = id => $("#" + id).value.trim();
  const checks = $$("#research .reliab input").map(c => (c.checked ? "[x] " : "[ ] ") + c.parentElement.textContent.trim());
  const txt = `FUTURE PROOF: RESEARCH ORGANISER\n\nTechnology: ${v("rTech")}\nWhere is it now: ${v("rStage")}\n\n1. What problem does it solve?\n${v("rQ1")}\n\n2. What hardware or network advances does it need?\n${v("rQ2")}\n\n3. Ethical, privacy or environmental concerns\n${v("rQ3")}\n\nSources\n${v("rSrc")}\n\nReliability check\n${checks.join("\n")}\n`;
  download("research-" + (v("rTech") || "notes").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".txt", txt);
});

/* =========================================================
   PART 5.1  Pitch card
   ========================================================= */
const OPEN_YEAR = new Date().getFullYear() + 5;
$("#pcYear").textContent = OPEN_YEAR;
$$(".cYear").forEach(e => e.textContent = OPEN_YEAR);
(function(){
  const g = id => $("#" + id).value.trim();
  function upd(){
    $("#pcTitle").textContent = g("ptTitle") || "Your idea";
    $("#pcProblem").textContent = g("ptProblem") || "…";
    $("#pcVision").textContent = g("ptVision") || "…";
    const links = $$("#ptLinks input:checked").map(i => i.value);
    $("#pcLinks").textContent = (links.length ? links.join(" · ") : "Tick what it relies on") + (g("ptHow") ? ". " + g("ptHow") : "");
    $("#pcEthics").textContent = g("ptEthics") || "…";
    $("#pcConf").style.width = $("#ptConf").value + "%"; $("#ptConfOut").textContent = $("#ptConf").value + "%";
  }
  $$("#pitch input, #pitch textarea").forEach(el => el.addEventListener("input", upd)); $$("#ptLinks input").forEach(el => el.addEventListener("change", upd));
  upd();
  $("#ptDownload").addEventListener("click", () => {
    const links = $$("#ptLinks input:checked").map(i => i.value).join(", ");
    const txt = `FUTURE PROOF: PITCH NOTES (forecast for ${OPEN_YEAR})\n\n${g("ptTitle")}\n\nTHE PROBLEM\n${g("ptProblem")}\n\nTHE VISION\n${g("ptVision")}\n\nUNDER THE HOOD\nRelies on: ${links}\n${g("ptHow")}\n\nLESSON FROM THE PAST\n${g("ptPast")}\n\nETHICS\n${g("ptEthics")}\n\nWHAT WOULD PROVE US WRONG\n${g("ptWrong")}\n\nConfidence: ${$("#ptConf").value}%\n`;
    download("pitch-" + (g("ptTitle") || "notes").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".txt", txt);
  });
})();

/* =========================================================
   PART 5.2  Time capsule
   ========================================================= */
const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function keyFrom(pass, salt){
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pass), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({name:"PBKDF2", salt, iterations:200000, hash:"SHA-256"}, base, {name:"AES-GCM", length:256}, false, ["encrypt","decrypt"]);
}
(function(){
  const g = id => $("#" + id).value.trim();
  const out = $("#cMsgOut"), vault = $("#vault");
  const openDate = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 5); return d; };
  $("#vWhen").textContent = OPEN_YEAR;
  function payload(){ return {name:g("cName"), class:g("cClass"), prediction:g("cPred"), evidence:g("cEvid"), message:g("cMsg"), confidence:Number($("#ptConf").value)}; }
  $("#cSeal").addEventListener("click", async () => {
    const p = payload();
    if (!p.name || !p.prediction){ out.textContent = "Add your name and your prediction first."; return; }
    if (p.prediction.length < 20){ out.textContent = "Your prediction is very short. Make it specific enough to check in five years."; return; }
    const sealed = new Date(), opens = openDate();
    const cap = {format:"future-proof-capsule", version:1, label:`${p.name}${p.class ? " · " + p.class : ""}`, sealedOn:sealed.toISOString().slice(0,10), openAfter:opens.toISOString().slice(0,10), encrypted:false};
    const pass = $("#cPass").value;
    try {
      if (pass){
        if (!window.crypto || !crypto.subtle) throw new Error("no-crypto");
        const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
        const key = await keyFrom(pass, salt);
        const ct = await crypto.subtle.encrypt({name:"AES-GCM", iv}, key, new TextEncoder().encode(JSON.stringify(p)));
        Object.assign(cap, {encrypted:true, cipher:"AES-GCM-256, PBKDF2-SHA256 200000", salt:b64(salt), iv:b64(iv), data:b64(ct)});
      } else cap.contents = p;
    } catch(e){ out.textContent = "This browser couldn’t encrypt the file. Try without a passphrase, or use a different browser."; return; }
    const fname = `capsule-${(p.class ? p.class + "-" : "") + p.name}-open-${cap.openAfter}`.replace(/[^a-z0-9-]+/gi, "-").replace(/-+/g, "-").toLowerCase() + ".json";
    download(fname, JSON.stringify(cap, null, 2), "application/json");
    vault.classList.add("sealed"); $("#vDial").textContent = "SEALED";
    $("#vText").innerHTML = `Sealed on ${sealed.toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"})}. Do not open until <b>${opens.toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"})}</b>.`;
    out.innerHTML = `Downloaded <b>${esc(fname)}</b>. ${pass ? "It’s locked with the class passphrase." : "It isn’t locked, so anyone with the file can read it."} Hand it to your teacher.`;
  });
  $("#cPrint").addEventListener("click", () => {
    const p = payload(), opens = openDate().toLocaleDateString("en-GB", {day:"numeric", month:"long", year:"numeric"});
    const w = window.open("", "_blank");
    if (!w){ out.textContent = "Your browser blocked the print window. Allow pop-ups for this page and try again."; return; }
    w.document.write(`<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Time capsule</title><style>body{font:16px/1.5 Georgia,serif;max-width:640px;margin:40px auto;padding:0 20px;color:#111}h1{font:800 28px system-ui,sans-serif;margin:0 0 4px}.k{font:12px monospace;letter-spacing:.1em;text-transform:uppercase;color:#555;margin-top:18px}.box{border:2px solid #111;padding:16px;margin-top:20px}</style></head><body><h1>Future Proof time capsule</h1><div>${esc(p.name)}${p.class ? " · " + esc(p.class) : ""} · sealed ${new Date().toLocaleDateString("en-GB")}</div><div class="box"><b>DO NOT OPEN UNTIL ${esc(opens.toUpperCase())}</b></div><div class="k">My prediction</div><p>${esc(p.prediction)}</p><div class="k">Evidence</div><p>${esc(p.evidence)}</p><div class="k">Confidence</div><p>${p.confidence}%</p><div class="k">Message to whoever opens this</div><p>${esc(p.message)}</p><div class="k">When opened: hit, partly or miss?</div><p>☐ Hit &nbsp; ☐ Partly &nbsp; ☐ Miss &nbsp; Why: ______________________________</p></body></html>`);
    w.document.close(); w.focus(); setTimeout(() => w.print(), 300);
  });

  // teacher opener
  $("#tOpen").addEventListener("click", async () => {
    const files = Array.from($("#tFiles").files || []), pass = $("#tPass").value, early = $("#tEarly").checked, o = $("#tOut");
    o.innerHTML = "";
    if (!files.length){ o.innerHTML = '<p class="small">Choose one or more capsule files.</p>'; return; }
    const today = new Date().toISOString().slice(0,10);
    for (const f of files){
      let html;
      try {
        const cap = JSON.parse(await f.text());
        if (cap.format !== "future-proof-capsule") throw new Error("not a capsule");
        if (cap.openAfter > today && !early){ html = `<b>${esc(cap.label)}</b><br><span class="small">Still sealed until ${esc(cap.openAfter)}.</span>`; }
        else {
          let c = cap.contents;
          if (cap.encrypted){
            if (!pass) throw new Error("This capsule needs the passphrase.");
            try { const key = await keyFrom(pass, unb64(cap.salt)); const pt = await crypto.subtle.decrypt({name:"AES-GCM", iv:unb64(cap.iv)}, key, unb64(cap.data)); c = JSON.parse(new TextDecoder().decode(pt)); }
            catch(e){ throw new Error("Wrong passphrase, or the file has been changed."); }
          }
          html = `<b>${esc(cap.label)}</b> <span class="small">sealed ${esc(cap.sealedOn)} · open after ${esc(cap.openAfter)}${cap.openAfter > today ? " (opened early)" : ""}</span><p style="margin-top:6px">${esc(c.prediction)}</p>${c.evidence ? `<p class="small"><b>Evidence:</b> ${esc(c.evidence)}</p>` : ""}<p class="small"><b>Confidence:</b> ${esc(c.confidence)}%${c.message ? ` · <b>Message:</b> ${esc(c.message)}` : ""}</p>`;
        }
      } catch(e){ html = `<b>${esc(f.name)}</b><br><span class="small">${esc(e.message === "not a capsule" ? "This isn’t a Future Proof capsule file." : e.message)}</span>`; }
      o.insertAdjacentHTML("beforeend", `<div class="fact">${html}</div>`);
    }
  });
})();

/* =========================================================
   QUIZ
   ========================================================= */
(function(){
  const Q = [
    {q:"Which register holds the address of the next instruction to be fetched?", o:["Accumulator","Program counter","Memory data register","Current instruction register"], a:1, e:"The program counter (PC) holds the next address, and goes up by one during each fetch."},
    {q:"In the von Neumann design, where are program instructions stored?", o:["In the ALU","In the same memory as the data","On a separate chip from all data","In the control bus"], a:1, e:"Instructions and data share the same memory. That’s why a program can accidentally run into its data."},
    {q:"Which part of the processor does the calculation in ADD and SUB?", o:["Control unit","Arithmetic logic unit (ALU)","Address bus","MAR"], a:1, e:"The ALU does arithmetic and logic. The control unit decodes instructions and coordinates everything."},
    {q:"Why does a computer have cache as well as RAM?", o:["Cache stores files when the power is off","Cache is faster and closer to the CPU, so frequently used data is quicker to reach","Cache is cheaper per gigabyte","RAM can only hold instructions"], a:1, e:"Cache is small and fast; RAM is bigger but slower. Secondary storage is bigger and slower still."},
    {q:"What happens if packets from the same photo take different routes?", o:["The photo is lost","They may arrive out of order and are put back together using sequence numbers","The router merges them into one packet","They all have to restart"], a:1, e:"Packet switching lets packets take different routes. Sequence numbers let the receiver reassemble them."},
    {q:"A 4 MB photo is 32,000,000 bits. Roughly how long does it take at 8 Mbit/s?", o:["0.5 seconds","4 seconds","32 seconds","8 minutes"], a:1, e:"32,000,000 ÷ 8,000,000 = 4 seconds."},
    {q:"Why did many 1980s predictions take 20–30 years to come true?", o:["People didn’t want the technology","Processing power, memory, batteries and networks weren’t good or cheap enough yet","They were banned","TV presenters made them up"], a:1, e:"The idea was often right; the hardware bottleneck decided the timing."},
    {q:"What is digital obsolescence?", o:["A computer virus","When data still exists but the hardware or software to read it doesn’t","Deleting old files","When a phone battery stops working"], a:1, e:"The 1986 Domesday Project became unreadable within about fifteen years for this reason."},
    {q:"Two micro:bits are on radio groups 1 and 4. What happens when one sends a message?", o:["The other receives it anyway","The other doesn’t receive it","It is sent to every group","The micro:bit crashes"], a:1, e:"Both must use the same radio group: an agreed rule, or protocol."},
    {q:"Since April 2024, what can’t smart devices sold in the UK come with?", o:["Wi-Fi","An easy default password like “admin”","Software updates","A battery"], a:1, e:"The PSTI Act bans default passwords and requires a way to report security problems and a stated update period."},
    {q:"Which is the best evidence that a frontier technology works?", o:["The company’s boss says it will","A post with lots of likes","A measured, independent study","A very confident headline"], a:2, e:"Look for measured results, independent sources and peer review, not promises."},
    {q:"Why is a passphrase-locked time capsule a risk as well as a protection?", o:["Encryption makes files bigger","If the passphrase is lost, nobody can ever open it","Anyone can read encrypted files","Passphrases expire after five years"], a:1, e:"Strong encryption can’t be undone without the key. Keeping data readable means keeping the key safe too."}
  ];
  const box = $("#quizBox"); const ans = {};
  function score(){ $("#qScore").textContent = `${Object.values(ans).filter(Boolean).length} / ${Q.length}`; }
  function draw(){
    box.innerHTML = "";
    Q.forEach((d, i) => {
      const el = document.createElement("div"); el.className = "qz";
      el.innerHTML = `<div class="qq">${i + 1}. ${esc(d.q)}</div><div class="qo">${d.o.map((o, j) => `<button type="button" data-j="${j}">${esc(o)}</button>`).join("")}</div><div class="qe" aria-live="polite"></div>`;
      $$("button", el).forEach(b => b.addEventListener("click", () => {
        if (i in ans) return;
        const j = +b.dataset.j, ok = j === d.a; ans[i] = ok;
        b.classList.add(ok ? "right" : "wrong"); if (!ok) $$("button", el)[d.a].classList.add("right");
        el.querySelector(".qe").textContent = (ok ? "Correct. " : "Not quite. ") + d.e; score();
      }));
      box.appendChild(el);
    });
    score();
  }
  draw();
  $("#qReset").addEventListener("click", () => { for (const k in ans) delete ans[k]; draw(); });
})();

/* ---------- planner download ---------- */
$("#plDownload").addEventListener("click", () => {
  const v = k => (store.get("s." + k) || "").trim();
  const items = $$("#planner .plan-check label").map(l => (l.querySelector("input").checked ? "[x] " : "[ ] ") + l.textContent.trim());
  const txt = `THE ${OPEN_YEAR} BROADCAST: TEAM PLANNER\n\nTeam: ${v("pl.team")}\nPath: ${v("pl.path")}\n\nRoles\n${v("pl.roles")}\n\nOur prediction\n${v("pl.pred")}\n\nChecklist\n${items.join("\n")}\n\nNext steps\n${v("pl.next")}\n`;
  download("team-planner.txt", txt);
});
