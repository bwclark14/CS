
/* =========================================================
   MISSION 3
   ========================================================= */
function fmtKB(kb){
  if (kb >= 1048576) return (kb / 1048576).toLocaleString("en-GB", {maximumFractionDigits: 1}) + " GB";
  if (kb >= 1024) return (kb / 1024).toLocaleString("en-GB", {maximumFractionDigits: 1}) + " MB";
  return kb.toLocaleString("en-GB") + " KB";
}
function fmtMHz(m){ return m >= 1000 ? (m / 1000).toLocaleString("en-GB", {maximumFractionDigits: 2}) + " GHz" : m.toLocaleString("en-GB", {maximumFractionDigits: 2}) + " MHz"; }
function fmtDur(s){
  if (!isFinite(s)) return "—";
  if (s < 1) return (s * 1000).toFixed(0) + " ms";
  if (s < 90) return s.toFixed(s < 10 ? 1 : 0) + " s";
  if (s < 5400) return (s / 60).toFixed(0) + " min";
  if (s < 172800) return (s / 3600).toFixed(1) + " hours";
  return (s / 86400).toFixed(1) + " days";
}

/* 3.2 Top Trumps */
(function(){
  const CARDS = [
    {n:"Apollo Guidance Computer", y:1969, clk:2.048, ram:4, cores:1, f:"Flew to the Moon. Its program was woven by hand into core rope memory. Weighed 32 kg."},
    {n:"IBM PC", y:1981, clk:4.77, ram:16, cores:1, f:"Cost $1,565 in the USA. Its design became the standard for PCs."},
    {n:"BBC Micro Model B", y:1981, clk:2, ram:32, cores:1, f:"Over 1.5 million sold. By 1985 about 80% of UK schools had one."},
    {n:"ZX Spectrum 48K", y:1982, clk:3.5, ram:48, cores:1, f:"Made in Dundee. Games loaded from audio cassette tapes."},
    {n:"Nintendo Game Boy", y:1989, clk:4.19, ram:8, cores:1, f:"Screen: 160 × 144 pixels in four shades of green-grey."},
    {n:"Sony PlayStation", y:1994, clk:33.87, ram:2048, cores:1, f:"Games came on 620 MB CDs."},
    {n:"PlayStation 2", y:2000, clk:294.9, ram:32768, cores:1, f:"The best-selling console ever: about 160 million."},
    {n:"iPhone (first)", y:2007, clk:412, ram:131072, cores:1, f:"Apple never published these specs. People worked them out by taking it apart."},
    {n:"BBC micro:bit V2", y:2020, clk:64, ram:128, cores:1, f:"Has a radio, accelerometer, compass, microphone and speaker."},
    {n:"PlayStation 5", y:2020, clk:3500, ram:16777216, cores:8, f:"Its SSD reads 5.5 GB a second to cut loading times."},
    {n:"Apple M5 chip", y:2025, clk:4610, ram:12582912, cores:10, f:"4 fast cores plus 6 power-saving cores. RAM from 12 GB."},
    {n:"Nintendo Switch 2", y:2025, clk:1100, ram:12582912, cores:8, f:"Slows its processor when docked, and speeds up its graphics chip instead."}
  ];
  const STATS = [["clk","Clock speed",fmtMHz],["ram","Memory (RAM)",fmtKB],["cores","Processor cores",v => v],["y","Year (newer wins)",v => v]];
  let you, cpu, pot, round, waiting;
  const elY = $("#ttYou"), elC = $("#ttCpu");
  // res: undefined = your turn (buttons); otherwise {k, r} where r is 1 win, -1 lose, 0 draw for this card
  function face(c, el, res){
    el.classList.remove("back");
    el.innerHTML = `<div class="yr">${c.y}</div><h3>${esc(c.n)}</h3>${STATS.map(([k, l, f]) => {
      const cls = res && res.k === k ? (res.r > 0 ? " win" : res.r < 0 ? " lose" : "") : "";
      return !res ? `<button type="button" class="stat" data-k="${k}"><span>${l}</span><span>${f(c[k])}</span></button>` : `<div class="stat${cls}"><span>${l}</span><span>${f(c[k])}</span></div>`;
    }).join("")}<p class="fact">${esc(c.f)}</p>`;
  }
  function back(){ elC.className = "tcard cpu-card back"; elC.innerHTML = `<span class="score" style="color:var(--then)">?</span>`; }
  function score(){ $("#ttScore").textContent = `${you.length} – ${cpu.length}`; }
  function newGame(){
    const d = shuffle(CARDS); you = d.slice(0, 6); cpu = d.slice(6); pot = []; round = 1; waiting = false;
    face(you[0], elY); back(); score(); $("#ttSay").textContent = "Round 1. Pick a stat on your card."; $("#ttNext").disabled = true;
  }
  elY.addEventListener("click", e => {
    const b = e.target.closest("button.stat"); if (!b || waiting) return;
    const k = b.dataset.k, a = you.shift(), c = cpu.shift(), r = Math.sign(a[k] - c[k]);
    face(a, elY, {k, r}); face(c, elC, {k, r: -r});
    if (r > 0){ you.push(a, c, ...pot); pot = []; $("#ttSay").textContent = `You win! ${STATS.find(s => s[0] === k)[1]}: ${STATS.find(s => s[0] === k)[2](a[k])} beats ${STATS.find(s => s[0] === k)[2](c[k])}.`; }
    else if (r < 0){ cpu.push(c, a, ...pot); pot = []; $("#ttSay").textContent = `Computer wins this round. ${c.n} beats ${a.n}.`; }
    else { pot.push(a, c); $("#ttSay").textContent = "A draw! Both cards go in the middle for the next winner."; }
    score(); waiting = true;
    const over = !you.length || !cpu.length || round >= 10;
    if (over){
      const win = you.length > cpu.length;
      $("#ttSay").textContent += win ? " Game over: you are the Spec Champion!" : you.length === cpu.length ? " Game over: it's a draw." : " Game over: the computer wins. Try again?";
      if (win) Pass.award("tt"); $("#ttNext").disabled = true;
    } else $("#ttNext").disabled = false;
    say($("#ttSay").textContent);
  });
  $("#ttNext").onclick = () => { round++; waiting = false; face(you[0], elY); back(); $("#ttNext").disabled = true; $("#ttSay").textContent = `Round ${round}. Pick a stat.`; };
  $("#ttNew").onclick = newGame;
  newGame();
})();

/* 3.3 bottleneck race */
(function(){
  const L = [["Hard disk (HDD)",285],["SATA SSD",560],["NVMe SSD (Gen 4)",7450],["NVMe SSD (Gen 5)",14500]];
  const MB = 50000;
  $("#raceLanes").innerHTML = L.map(([n, s], i) => `<div class="lane"><span><b>${n}</b><br><span class="small">${fmt(s)} MB/s</span></span><div class="track"><i id="rl${i}"></i></div><span class="t" id="rt${i}">—</span></div>`).join("");
  $("#raceGo").onclick = () => {
    const max = MB / L[0][1], t0 = performance.now(), dur = matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 7000;
    L.forEach((_, i) => { $("#rl" + i).style.width = "0"; $("#rt" + i).textContent = "…"; });
    (function frame(now){
      const p = Math.min(1, (now - t0) / dur), simT = p * max;
      L.forEach(([, s], i) => { const t = MB / s, f = Math.min(1, simT / t); $("#rl" + i).style.width = (f * 100) + "%"; if (f >= 1) $("#rt" + i).textContent = fmtDur(t); });
      if (p < 1) requestAnimationFrame(frame);
    })(t0);
  };
})();
choiceCards($("#raceQs"), {key: "race", items: [
  {id:"pro", q:"The PS5 Pro got a much bigger graphics chip and faster memory, but the <b>same processor</b>. A game is slow because of heavy physics on the processor. Will the Pro fix it?", opts:["Yes, a lot","Probably not much","It will make it slower"], a:1, why:"The processor is the bottleneck. Upgrading other parts doesn't widen the narrowest point."},
  {id:"boot", q:"A laptop takes ages to start up and open files, but runs fine once things are loaded. Best upgrade?", opts:["More RAM","Swap the hard disk for an SSD","A brighter screen"], a:1, why:"Slow loading points to slow storage. An SSD finds data about 400 times faster than a hard disk."},
  {id:"tabs", q:"A computer slows right down when you have 30 tabs and a game open.", opts:["More RAM","A bigger screen","A faster keyboard"], a:0, why:"The desk is full, so it keeps swapping things out to storage. A bigger desk (more RAM) fixes it."}
]});

/* 3.4 size ladder */
(function(){
  const ITEMS = [["letter","The letter \"A\"",1,"1 byte"],["sms","A text message","140","up to 140 bytes"],["apollo","The whole Apollo moon-landing program",74000,"about 74 KB"],["floppy","A 1990s floppy disk",1.44e6,"1.44 MB"],["photo","A phone photo",3e6,"about 3 MB"],["song","A song (MP3)",5e6,"about 5 MB"],["sw2","Nintendo Switch 2 storage",256e9,"256 GB"],["iph","Biggest iPhone 18 Pro storage",2e12,"2 TB"]];
  let order = store.get("ladder", null);
  if (!order || order.length !== ITEMS.length){ do { order = shuffle(ITEMS.map(i => i[0])); } while (order.join() === ITEMS.map(i => i[0]).join()); }
  let checked = false;
  function draw(){
    $("#ladder").innerHTML = order.map((id, i) => { const it = ITEMS.find(x => x[0] === id);
      return `<div class="rung"><span class="pos">${i + 1}</span><span>${esc(it[1])}${checked ? ` <span class="small">· ${it[3]}</span>` : ""}</span><span class="ctl"><button type="button" data-up="${i}" aria-label="Move ${esc(it[1])} up" ${i === 0 ? "disabled" : ""}>▲</button><button type="button" data-dn="${i}" aria-label="Move ${esc(it[1])} down" ${i === order.length - 1 ? "disabled" : ""}>▼</button></span></div>`; }).join("");
  }
  $("#ladder").onclick = e => { const b = e.target.closest("button"); if (!b) return;
    const i = +(b.dataset.up ?? b.dataset.dn), j = b.dataset.up !== undefined ? i - 1 : i + 1;
    [order[i], order[j]] = [order[j], order[i]]; store.set("ladder", order); draw(); $(`[data-${b.dataset.up !== undefined ? "up" : "dn"}="${j}"]`, $("#ladder"))?.focus(); };
  $("#ladderCheck").onclick = () => {
    const right = order.filter((id, i) => id === ITEMS[i][0]).length; checked = true; draw();
    $("#ladderFb").innerHTML = right === ITEMS.length ? `<span class="fb ok">Perfect order! Each one is shown with its size.</span>` : `<span class="fb mid">${right} of ${ITEMS.length} in the right place. Sizes are now shown. Fix the rest.</span>`;
  };
  draw();
  const flop = () => { const gb = Math.max(0, +$("#flopGB").value || 0), mb = gb * 1000;
    $("#flopOut").innerHTML = `${fmt(gb)} GB would fill about <b>${fmt(Math.round(mb / 1.44))}</b> floppy disks, or about <b>${fmt(Math.round(mb / 3.75))}</b> of IBM's first hard disks (each weighing nearly a tonne).`; };
  $("#flopGB").addEventListener("input", flop); flop();
})();

/* 3.5 data cleaning */
(function(){
  const RAW = [
    {id:1, n:"ZX Spectrum 48K", y:"1982", clk:"3.5", ram:"48K", issue:{t:"Units", d:"RAM is written as \"48K\". Every other row uses KB as a number.", opts:["Change it to 48 (KB)","Change it to 48,000","Delete the row"], a:0, why:"In the 1980s \"K\" meant kilobytes. Writing it as the number 48 in the KB column means it can be sorted with the others."}, fix:{ram:48}},
    {id:2, n:"BBC Micro Model B", y:"1981", clk:"2", ram:"32", price:"£335 or £399?", issue:{t:"Sources disagree", d:"One source says £335, another says £399.", opts:["Keep both and add a note: the price went up soon after launch","Just pick the cheaper one","Delete the machine"], a:0, why:"Both are true: it launched at £335 and the price rose quickly to £399. When sources disagree, find out why and record it, don't just pick one."}, fix:{price:"£335 → £399"}},
    {id:3, n:"Nintendo Game Boy", y:"1989", clk:"4.19", ram:"8"},
    {id:4, n:"Sony PlayStation", y:"1994", clk:"33.87", ram:"2 MB", issue:{t:"Units", d:"RAM is in MB, but the column is in KB.", opts:["Change to 2,048 KB","Change to 2 KB","Leave it, it's fine"], a:0, why:"2 MB × 1,024 = 2,048 KB. Mixed units would make the PlayStation look smaller than a Game Boy when sorted."}, fix:{ram:2048}},
    {id:5, n:"PlayStation 2", y:"2000", clk:"294.9", ram:"32768"},
    {id:6, n:"PlayStation 2", y:"2000", clk:"294.9", ram:"32768", issue:{t:"Duplicate", d:"This row is an exact copy of the one above.", opts:["Delete this copy","Keep both","Change the year"], a:0, why:"Duplicates count the same thing twice, which would mess up totals and averages."}, fix:{del:true}},
    {id:7, n:"Apollo Guidance Computer", y:"1969", clk:"2.048 or 1.024?", ram:"4", issue:{t:"Sources disagree", d:"Some sources say 2.048 MHz, others say 1.024 MHz.", opts:["Use 2.048 MHz (the clock) and note that 1.024 MHz is a different timing inside it","Average them to 1.536","Delete the row"], a:0, why:"The crystal clock ran at 2.048 MHz. 1.024 MHz describes the instruction timing. Averaging would give a number that was never true."}, fix:{clk:2.048}},
    {id:8, n:"iPhone (first)", y:"2070", clk:"412", ram:"131072", issue:{t:"Typo", d:"The year says 2070.", opts:["Change it to 2007","Leave it","Change it to 1970"], a:0, why:"The first iPhone came out in 2007. A quick sense-check (\"is that even possible?\") catches typos."}, fix:{y:2007}},
    {id:9, n:"Nintendo Switch 2", y:"2025", clk:"1100", ram:"12 GB", issue:{t:"Units", d:"RAM is in GB, but the column is in KB.", opts:["Change to 12,582,912 KB","Change to 12 KB","Change to 12,000 KB"], a:0, why:"12 GB × 1,024 × 1,024 = 12,582,912 KB. Big numbers, same unit."}, fix:{ram:12582912}},
    {id:10, n:"BBC micro:bit V2", y:"2020", clk:"64", ram:"128"},
    {id:11, n:"PlayStation 5", y:"2020", clk:"3500", ram:"", issue:{t:"Missing value", d:"The RAM is blank.", opts:["Look it up: 16 GB = 16,777,216 KB","Put 0","Delete the row"], a:0, why:"A blank isn't zero. Find the real value from a reliable source. Putting 0 would make the PS5 look like it has no memory."}, fix:{ram:16777216}}
  ];
  const fixed = store.get("cleanFixed", {});
  let scanned = Object.keys(fixed).length > 0, sortK = "y", sortDir = 1, filt = "all";
  const issues = RAW.filter(r => r.issue);
  function cleaned(){ return RAW.filter(r => !(r.fix && r.fix.del && fixed[r.id])).map(r => {
    const o = {n:r.n, y:+r.y, clk:+r.clk, ram:+r.ram, id:r.id}; if (r.fix && fixed[r.id]) Object.assign(o, r.fix); if (r.fix && fixed[r.id] && r.fix.y) o.y = r.fix.y; return o; }); }
  function allFixed(){ return issues.every(r => fixed[r.id]); }
  function drawTable(){
    const t = $("#cleanTbl");
    if (allFixed()){
      let rows = cleaned(); if (filt === "pre2000") rows = rows.filter(r => r.y < 2000); if (filt === "post2000") rows = rows.filter(r => r.y >= 2000);
      rows.sort((a, b) => (a[sortK] > b[sortK] ? 1 : a[sortK] < b[sortK] ? -1 : 0) * sortDir);
      const H = [["n","Machine"],["y","Year"],["clk","Clock (MHz)"],["ram","RAM (KB)"]];
      t.innerHTML = `<thead><tr>${H.map(([k, l]) => `<th><button type="button" data-k="${k}">${l}${sortK === k ? (sortDir > 0 ? " ▲" : " ▼") : ""}</button></th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr><td>${esc(r.n)}</td><td class="num">${r.y}</td><td class="num">${fmt(r.clk)}</td><td class="num">${fmt(r.ram)}</td></tr>`).join("")}</tbody>`;
      return;
    }
    t.innerHTML = `<thead><tr><th>#</th><th>Machine</th><th>Year</th><th>Clock (MHz)</th><th>RAM (KB)</th></tr></thead><tbody>${RAW.map(r => {
      const f = fixed[r.id], cls = scanned && r.issue ? (f ? "fixed" : "flag") : "";
      if (f && r.fix.del) return `<tr class="fixed"><td>${r.id}</td><td colspan="4"><s>${esc(r.n)}</s> deleted (duplicate)</td></tr>`;
      const v = k => f && r.fix[k] !== undefined ? fmt(r.fix[k]) : esc(r[k] || "");
      return `<tr class="${cls}"><td>${r.id}</td><td>${esc(r.n)}${r.price ? ` <span class="small">(price ${f ? esc(r.fix.price) : esc(r.price)})</span>` : ""}</td><td class="num">${f && r.fix.y ? r.fix.y : esc(r.y)}</td><td class="num">${v("clk")}</td><td class="num">${v("ram") || "<i>blank</i>"}</td></tr>`; }).join("")}</tbody>`;
  }
  function drawFix(){
    const box = $("#cleanFix");
    if (!scanned){ box.innerHTML = ""; return; }
    box.innerHTML = `<div class="cards">${issues.map(r => { const f = fixed[r.id];
      return `<div class="scard ${f ? "right" : ""}" data-id="${r.id}"><div class="who">Row ${r.id} · ${esc(r.n)}</div><div class="q"><span class="tag mid">${r.issue.t}</span> ${esc(r.issue.d)}</div>
      ${f ? `<div class="fb ok"><b>Fixed.</b> ${esc(r.issue.why)}</div>` : `<div class="opts">${r.issue.opts.map((o, i) => `<button type="button" data-i="${i}">${esc(o)}</button>`).join("")}</div><div class="fbx"></div>`}</div>`; }).join("")}</div>`;
    $("#cleanStatus").textContent = `${issues.filter(r => fixed[r.id]).length} of ${issues.length} problems fixed`;
  }
  $("#cleanFix").addEventListener("click", e => {
    const b = e.target.closest("button[data-i]"); if (!b) return;
    const card = b.closest(".scard"), r = RAW.find(x => x.id === +card.dataset.id);
    if (+b.dataset.i === r.issue.a){ fixed[r.id] = true; store.set("cleanFixed", fixed); drawAll(); }
    else { $(".fbx", card).innerHTML = `<div class="fb no">That would cause a problem. Think: will the data still be true, and can it be sorted fairly?</div>`; }
  });
  $("#cleanTbl").addEventListener("click", e => { const b = e.target.closest("th button"); if (!b) return; if (sortK === b.dataset.k) sortDir *= -1; else { sortK = b.dataset.k; sortDir = 1; } drawTable(); });
  $("#cqFilter").onchange = e => { filt = e.target.value; drawTable(); };
  $("#cleanScan").onclick = () => { scanned = true; drawAll(); say(`${issues.length} problems found`); };
  let qDone = false;
  function drawAll(){
    drawTable(); drawFix();
    if (allFixed()){ Pass.award("clean"); $("#cleanQuery").hidden = false; $("#cleanStatus").textContent = "All problems fixed. The table now shows your clean data.";
      if (!qDone){ qDone = true; choiceCards($("#cleanQs"), {key: "cleanq", items: [
        {id:"a", q:"Filter to machines made before 2000 and sort by RAM. Which has the most?", opts:["Sony PlayStation","Nintendo Game Boy","ZX Spectrum 48K"], a:0, why:"2,048 KB: once its units were fixed, the PlayStation comes out on top."},
        {id:"b", q:"Sort by clock speed. Which is fastest?", opts:["PlayStation 5","Nintendo Switch 2","iPhone (first)"], a:0, why:"3,500 MHz. But remember Mission 3.2: clock speed isn't the whole story."},
        {id:"c", q:"Why did \"2 MB\" have to be fixed before sorting?", opts:["Sorting compares numbers, so every value must be in the same unit","MB is a bad unit","It didn't matter"], a:0, why:"Computers sort the numbers they're given. 2 looks smaller than 8, even though 2 MB is bigger than 8 KB."}
      ]}); } }
  }
  drawAll();
})();

/* =========================================================
   MISSION 4
   ========================================================= */
choiceCards($("#twCards"), {key: "tw", opts: ["Came true","Flopped","Right idea, wrong time"],
  onScore: (r, n, t) => { if (n === t) Pass.award("tw"); },
  items: [
    {id:"home", who:"Tomorrow's World, 1967", q:"A man in London has a typewriter-like terminal at home, linked to a faraway computer. His four-year-old son uses it. The presenter says one day we might all have one.", a:0, why:"Most homes now have several computers connected to the internet."},
    {id:"pin", who:"Tomorrow's World, 1969", q:"Pay without cash using a plastic card and a secret number.", a:0, why:"An early version of today's chip-and-PIN cards."},
    {id:"mob", who:"Tomorrow's World, 1979", q:"A British prototype mobile phone. Calls are cut off after three minutes, and the presenter dials a wrong number live on air.", a:0, why:"The first UK mobile call was in 1985. Today almost everyone carries one."},
    {id:"prestel", who:"Tomorrow's World, 1979", q:"Prestel: shop, book and bank from home using your TV and phone line.", a:2, why:"BT hoped for 50,000 users by 1982 but got about 18,000. It closed in 1994. Online shopping only took off with the web, 20 years later."},
    {id:"cd", who:"Tomorrow's World, 1981", q:"The compact disc. The presenter scratches one to show how tough it is.", a:0, why:"CDs sold in their billions. (They have mostly been replaced by streaming now, which nobody on the show predicted.)"},
    {id:"garden", who:"Tomorrow's World, 1968", q:"A garden made of plastic, so you never need to look after it.", a:1, why:"It never caught on."},
    {id:"sid", who:"Tomorrow's World, 1981", q:"\"Sid\", a robot that plays snooker, said to be accurate to 1 mm.", a:1, why:"On air, it missed an easy shot."},
    {id:"vac", who:"Tomorrow's World, 1996", q:"A robot vacuum cleaner that finds its own way around the room.", a:0, why:"Robot vacuums are now common in homes."}
  ]});

const plCC = choiceCards($("#plCards"), {key: "pl", opts: ["Hit","Partly","Miss"], scoreEl: "#plScore", softWrong: true,
  items: [
    {id:"w1", f:"pre1970", who:"John Elfreth Watkins Jr., magazine article, 1900", q:"Wireless telephone circuits will span the world.", a:0, why:"Mobile phones and the internet did exactly that."},
    {id:"w2", f:"pre1970", who:"Same article, 1900", q:"The letters C, X and Q will be dropped from the alphabet.", a:2, why:"We still use all 26 letters."},
    {id:"c64", f:"pre1970", who:"Arthur C. Clarke, BBC TV, 1964", q:"People will be able to work and talk to each other from anywhere, so they won't need to live in cities.", a:[0,1], why:"Remote working and video calls are normal. But most people still live in cities, so you could call this partly right."},
    {id:"c74", f:"post1970", who:"Arthur C. Clarke, Australian TV, 1974", q:"In 2001, a child will have a computer at home linked to other computers, giving them all the information they need.", a:0, why:"Home internet arrived right on time."},
    {id:"as1", f:"pre1970", who:"Isaac Asimov, newspaper article, 1964", q:"By 2014, robots will exist but will be neither common nor very good.", a:[0,1], why:"Fair for 2014: robot vacuums existed but home robots were limited."},
    {id:"as2", f:"pre1970", who:"Isaac Asimov, 1964", q:"By 2014, flying cars will be common and many people will live underground.", a:2, why:"Neither happened."},
    {id:"moore", f:"pre1970", who:"Gordon Moore, 1965 (updated 1975)", q:"The number of components on a chip will keep doubling regularly.", a:0, why:"It held for about 50 years. He based it on a real, measured trend."},
    {id:"jet", f:"pre1970", who:"The Jetsons, TV cartoon, 1962", q:"Families will have jetpacks, flying cars and a robot maid.", a:2, why:"Still waiting. People still ask \"Where's my jetpack?\""},
    {id:"bt1", f:"post1970", who:"Back to the Future Part II, film, 1989 (set in 2015)", q:"Video calls, flat-screen TVs on the wall, and wearable tech.", a:0, why:"All real by 2015."},
    {id:"bt2", f:"post1970", who:"Back to the Future Part II, 1989", q:"Hoverboards, self-lacing shoes and flying cars in 2015.", a:2, why:"Prototypes, maybe. Normal life, no."},
    {id:"c5", f:"post1970", who:"Sir Clive Sinclair, 1985", q:"The Sinclair C5: a small electric vehicle for everyday travel.", a:1, why:"It flopped in 1985 (about 14,000 made). But electric scooters and bikes are everywhere now. Right idea, wrong time."},
    {id:"met", f:"post1970", who:"Robert Metcalfe, co-inventor of Ethernet, 1995", q:"The internet will catastrophically collapse in 1996.", a:2, why:"It didn't. In 1997 he blended his article with water and ate it."},
    {id:"stoll", f:"post1970", who:"Clifford Stoll, Newsweek, 1995", q:"Online shopping and online newspapers are just hype and won't catch on.", a:2, why:"In 2010 he admitted it was a howler."},
    {id:"ball", f:"post1970", who:"Steve Ballmer, boss of Microsoft, 2007", q:"There's no chance the iPhone will get a significant share of the market.", a:2, why:"Smartphones like it took over the world."}
  ]});
seg($("#plFilter"), f => { plCC.filter = f === "all" ? null : (it => it.f === f); });

choiceCards($("#qCards"), {key: "quote", opts: ["Real","Real, but out of context","Fake, or no evidence"],
  onScore: (r, n, t) => { if (n === t) Pass.award("quote"); },
  items: [
    {id:"watson", who:"Said to be Thomas Watson, boss of IBM, 1943", q:"\"There is a world market for maybe five computers.\"", a:2, why:"No evidence he ever said it. It first appears in a book in 1981. It may be a mix-up of a 1950s remark: IBM expected orders for five of one machine, and got 18."},
    {id:"gates", who:"Said to be Bill Gates, 1981", q:"\"640K ought to be enough for anybody.\"", a:2, why:"Gates said in 1996 that he never said it. Nobody has found where it came from."},
    {id:"trek", who:"A popular story", q:"The first mobile phone was inspired by the communicator in <i>Star Trek</i>.", a:2, why:"A myth. The inventor, Martin Cooper, later admitted he let the rumour spread. He pointed to a comic-strip detective's wrist radio instead."},
    {id:"olsen", who:"Ken Olsen, computer company boss, 1977", q:"\"There is no reason for any individual to have a computer in his home.\"", a:1, why:"He did say it, but he meant one big computer controlling everything in your house (lights, food, heating). He had computers at home himself."},
    {id:"ballmer", who:"Steve Ballmer, boss of Microsoft, 2007", q:"No chance the iPhone gets any significant market share.", a:0, why:"Real, from a newspaper interview. And very wrong."},
    {id:"met", who:"Robert Metcalfe, 1995", q:"The internet will catastrophically collapse in 1996.", a:0, why:"Real. He wrote it in a magazine column, then ate his words in 1997, literally."},
    {id:"stoll", who:"Clifford Stoll, Newsweek, 1995", q:"Online shopping and online newspapers won't catch on.", a:0, why:"Real. Fifteen years later he wrote \"Wrong? Yep.\""}
  ]});

/* =========================================================
   MISSION 5 · advert studio
   ========================================================= */
(function(){
  const GB = 1048576; // KB in a GB
  const P = {
    sw2:{n:"Nintendo Switch 2 (2025)", name:"SUPER SWITCH 2", specs:[["mem",12*GB],["sto",256*GB],["txt","8 processor cores"],["txt","Screen and joysticks in one"]], price:"419.99"},
    iph:{n:"iPhone 18 Pro (2026)", name:"POCKET MICRO PRO", specs:[["mem",12*GB],["sto",2048*GB],["txt","Built-in camera: no film needed"],["txt","Telephone you can carry anywhere"]], price:"1,199"},
    mb:{n:"BBC micro:bit V2", name:"MICRO:BIT", specs:[["mem",128],["sto",512],["txt","64 MHz processor"],["txt","25 red lights, 2 buttons, compass, radio"]], price:"15"},
    spk:{n:"Smart speaker", name:"TALKING HOME COMPUTER", specs:[["txt","Answers your questions out loud"],["txt","Plays any record you ask for"],["txt","Switches on your lights"]], price:"50"},
    watch:{n:"Smartwatch", name:"WRIST COMPUTER", specs:[["txt","Counts every step"],["txt","Measures your heartbeat"],["txt","Telephone messages on your wrist"]], price:"300"},
    own:{n:"My own choice", name:"", specs:[], price:""}
  };
  const BANNED = ["app","apps","wi-fi","wifi","internet","online","cloud","stream","streaming","download","downloads","bluetooth","smartphone","selfie","emoji","gb","tb","gigabyte","gigabytes","terabyte","terabytes","website","web","5g","4g","usb","hd","4k"];
  const sel = $("#adProd");
  sel.innerHTML = Object.entries(P).map(([k, p]) => `<option value="${k}">${esc(p.n)}</option>`).join("");
  sel.value = store.get("adProd", "sw2");
  let style = store.get("adStyle", "black"); setSeg($("#adStyle"), style);
  function line(s){
    if (s[0] === "mem") return `${fmt(s[1])}K of memory! (That's ${fmt(Math.round(s[1] / 48))} ZX Spectrums!)`;
    if (s[0] === "sto") return `${fmt(s[1])}K of storage: no more cassettes!`;
    return s[1];
  }
  function fill(){
    const p = P[sel.value];
    if (p.name && !$("#adName").value){ $("#adName").value = p.name; $("#adName").dispatchEvent(new Event("input")); }
    $("#adSpecs").value = p.specs.map(line).join("\n"); $("#adSpecs").dispatchEvent(new Event("input"));
    if (p.price){ $("#adPrice").value = p.price; $("#adPrice").dispatchEvent(new Event("input")); }
  }
  $("#adConvert").onclick = fill;
  sel.onchange = () => { store.set("adProd", sel.value); $("#adName").value = ""; fill(); };
  seg($("#adStyle"), v => { style = v; store.set("adStyle", v); draw(); });
  function words(t){ return (t.toLowerCase().match(/[a-z0-9\-]+/g) || []); }
  function draw(){
    const name = $("#adName").value.trim(), head = $("#adHead").value.trim(), specs = $("#adSpecs").value.split("\n").map(s => s.trim()).filter(Boolean),
      price = $("#adPrice").value.trim(), slogan = $("#adSlogan").value.trim(), post = $("#adPost").checked, deliv = $("#adDeliv").checked;
    const p = $("#poster"); p.className = "poster st-" + style;
    p.innerHTML = `<div class="stripe" aria-hidden="true"></div>
      <div class="p-head">${esc(head || "Your headline here")}</div>
      <div class="p-name">${esc(name || "PRODUCT NAME")}</div>
      <ul class="p-specs">${(specs.length ? specs : ["Your spec boasts go here"]).map(s => `<li>${esc(s)}</li>`).join("")}</ul>
      ${price ? `<div class="p-burst">ONLY<br>£${esc(price.replace(/^£/, ""))}</div>` : ""}
      ${slogan ? `<div class="p-slogan">"${esc(slogan)}"</div>` : ""}
      ${post ? `<div class="p-coupon"><b>ORDER BY POST</b><span>Please send me ___ ${esc(name || "units")} at £${esc((price || "___").replace(/^£/, ""))} each.</span><span>Name</span><div class="ln"></div><span>Address</span><div class="ln"></div><span>I enclose a cheque / postal order.</span></div>` : ""}
      ${deliv ? `<div class="p-small">Allow 28 days for delivery. Offer subject to availability.</div>` : ""}`;
    const all = [head, name, specs.join(" "), slogan].join(" "), bad = [...new Set(words(all).filter(w => BANNED.includes(w)))];
    const checks = [
      [!!head, "A big headline"],
      [!!price, "A price in pounds"],
      [/\d[\d,]*\s?k\b/i.test(specs.join(" ")), "Specs bragged about in K"],
      [/(world|best|most|only|fastest|first|never|ever)/i.test(head + " " + slogan), "A huge claim (world's best, fastest, first…)"],
      [post || deliv, "Mail order or delivery promise"],
      [!!slogan, "A slogan or jingle line"],
      [!bad.length && !!(head + specs.join("")).trim(), bad.length ? `Only 1985 words: remove "${bad.join('", "')}"` : "Only words people knew in 1985"]
    ];
    $("#adChecks").innerHTML = checks.map(([ok, t]) => `<li class="${ok ? "ok" : (t.startsWith("Only 1985 words:") ? "no" : "")}">${esc(t)}</li>`).join("");
    if (checks.filter(c => c[0]).length >= 6 && name) Pass.award("ad");
  }
  ["#adName","#adHead","#adSpecs","#adPrice","#adSlogan","#adPost","#adDeliv"].forEach(s => { $(s).addEventListener("input", draw); $(s).addEventListener("change", draw); });
  if (!$("#adSpecs").value) fill();
  draw();
  $("#adPrint").onclick = () => { document.body.classList.add("print-poster"); window.print(); };
  window.addEventListener("afterprint", () => document.body.classList.remove("print-poster", "print-capsule"));
})();

/* =========================================================
   MISSION 6
   ========================================================= */
(function(){
  const T = [
    ["1964","The idea","Paul Baran and Sharla Boehm suggest chopping messages into small pieces that travel by different routes. If one link breaks, the pieces go another way. They called it \"hot potato\" routing."],
    ["1969","\"LO\"","29 October: the first message on ARPANET, from a university in Los Angeles to one 500 km away. It was meant to say \"LOGIN\". Only \"LO\" arrived before the receiving computer crashed. It expected 10 characters a second, and got 5,000. Agreed rules (protocols) matter!"],
    ["1983","TCP/IP","1 January: every computer on ARPANET switches to the TCP/IP protocols on the same day. Many people call this the birth of the modern internet."],
    ["1989","The web","Tim Berners-Lee, working at CERN, proposes the World Wide Web. The first web server and browser run in 1990. In 1993 CERN gives the web away free for everyone to use."],
    ["1998","Dial-up","56k modems squeal down the phone line. Real speeds are about 53 kilobits a second, and nobody can phone your house while you're online."],
    ["2010","2 billion","About 2 billion people are online, mostly on computers. Smartphones are starting to change that."],
    ["2025","6 billion","About 6 billion people (75% of the world) are online, but 2.2 billion still aren't. There are about 21 billion connected devices. In Scotland, 71% of homes can get full-fibre broadband."]
  ];
  let cur = store.get("tl", 1);
  function draw(){
    $("#tlBtns").innerHTML = T.map((t, i) => `<button type="button" aria-pressed="${i === cur}" data-i="${i}">${t[0]}</button>`).join("");
    const t = T[cur]; $("#tlCard").innerHTML = `<span class="eyebrow">${t[0]}</span><h3 class="mt" style="font-size:1.4rem">${esc(t[1])}</h3><p class="mt">${esc(t[2])}</p>`;
  }
  $("#tlBtns").onclick = e => { const b = e.target.closest("button"); if (!b) return; cur = +b.dataset.i; store.set("tl", cur); draw(); $(`#tlBtns [data-i="${cur}"]`).focus(); };
  draw();
})();

/* 6.2 packet simulator */
(function(){
  const N = {Y:[40,150,"You","end"], R1:[150,65,"R1","router"], R2:[150,235,"R2","router"], R3:[265,150,"R3","router"], R4:[385,65,"R4","router"], R5:[385,235,"R5","router"], F:[480,150,"Friend","end"]};
  const E = [["Y","R1"],["Y","R2"],["R1","R3"],["R2","R3"],["R1","R4"],["R2","R5"],["R3","R4"],["R3","R5"],["R4","F"],["R5","F"],["R4","R5"]];
  const down = new Set(); let cuts = 0, busy = false;
  const svg = $("#netSvg"), NS = "http://www.w3.org/2000/svg", log = $("#pkLog");
  const ek = (a, b) => [a, b].sort().join("-");
  function mk(t, a){ const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; }
  function line(t, c){ const d = document.createElement("div"); if (c) d.className = c; d.textContent = t; log.appendChild(d); log.scrollTop = log.scrollHeight; }
  function drawNet(){
    svg.innerHTML = "";
    E.forEach(([a, b]) => svg.appendChild(mk("line", {x1:N[a][0], y1:N[a][1], x2:N[b][0], y2:N[b][1], class:"link" + (down.has(ek(a, b)) ? " down" : "")})));
    Object.entries(N).forEach(([k, [x, y, l, t]]) => { const g = mk("g", {class:"node " + t}); g.appendChild(mk("circle", {cx:x, cy:y, r:t === "end" ? 26 : 20})); const tx = mk("text", {x, y:y + 4}); tx.textContent = l; g.appendChild(tx); svg.appendChild(g); });
  }
  function paths(){
    const out = [];
    (function dfs(n, p){ if (n === "F"){ out.push(p.slice()); return; }
      E.forEach(([a, b]) => { const m = a === n ? b : b === n ? a : null; if (m && !p.includes(m) && !down.has(ek(n, m))){ p.push(m); dfs(m, p); p.pop(); } }); })("Y", ["Y"]);
    return out;
  }
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function fly(pk, path, dropAt){
    return new Promise(res => {
      const g = mk("g", {class:"pkt"}); g.appendChild(mk("rect", {x:-14, y:-9, width:28, height:18, rx:4})); const t = mk("text", {y:4}); t.textContent = pk.n; g.appendChild(t); svg.appendChild(g);
      const hops = dropAt != null ? path.slice(0, dropAt + 1) : path, segMs = reduced() ? 60 : 420 + Math.random() * 380;
      let i = 0, t0 = null;
      function frame(now){
        if (t0 === null) t0 = now;
        const p = Math.min(1, (now - t0) / segMs), a = N[hops[i]], b = N[hops[i + 1]];
        g.setAttribute("transform", `translate(${a[0] + (b[0] - a[0]) * p},${a[1] + (b[1] - a[1]) * p})`);
        if (p >= 1){ i++; t0 = now; if (i >= hops.length - 1){ g.remove(); res(dropAt == null); return; } }
        requestAnimationFrame(frame);
      }
      setTimeout(() => requestAnimationFrame(frame), reduced() ? 0 : Math.random() * 500);
    });
  }
  async function send(){
    if (busy) return;
    const msg = $("#pkMsg").value.toUpperCase().trim() || "HELLO", size = +$("#pkSize").value;
    const pks = []; for (let i = 0; i < msg.length; i += size) pks.push({n: pks.length + 1, d: msg.slice(i, i + size)});
    const ps = paths(); log.innerHTML = ""; $("#pkArr").innerHTML = ""; $("#pkOut").textContent = "…";
    if (!ps.length){ line("No route to your friend! Every path has a cut cable. The message can't get through.", "b"); say("No route"); return; }
    busy = true; $("#pkSend").disabled = true;
    line(`Split into ${pks.length} packets: ${pks.map(p => `#${p.n} "${p.d}"`).join(", ")}`, "w");
    const lose = $("#pkLoss").checked && pks.length > 1 ? Math.floor(Math.random() * pks.length) : -1;
    const got = {}, arr = $("#pkArr");
    await Promise.all(pks.map(async (pk, i) => {
      const path = ps[Math.floor(Math.random() * ps.length)];
      const ok = await fly(pk, path, i === lose ? 1 + Math.floor(Math.random() * (path.length - 2)) : null);
      if (ok){ got[pk.n] = pk.d; arr.insertAdjacentHTML("beforeend", `<span class="pk got"><b>#${pk.n}</b> ${esc(pk.d)}</span>`); line(`#${pk.n} arrived via ${path.slice(1, -1).join(" → ")}`, "g"); }
      else { arr.insertAdjacentHTML("beforeend", `<span class="pk lost"><b>#${pk.n}</b> lost</span>`); line(`#${pk.n} was dropped by a busy router.`, "b"); }
    }));
    const missing = pks.filter(p => !(p.n in got));
    for (const pk of missing){
      line(`Friend: "Packet #${pk.n} is missing. Please send it again." (TCP)`, "c");
      const ps2 = paths(); const path = ps2[Math.floor(Math.random() * ps2.length)];
      await fly(pk, path, null); got[pk.n] = pk.d; arr.insertAdjacentHTML("beforeend", `<span class="pk got"><b>#${pk.n}</b> ${esc(pk.d)} (resent)</span>`); line(`#${pk.n} arrived on the second try.`, "g");
    }
    $("#pkOut").textContent = pks.map(p => got[p.n]).join("");
    line("All packets in. Put back in number order. Message complete!", "g"); say("Message delivered");
    if (cuts > 0) Pass.award("pkt");
    busy = false; $("#pkSend").disabled = false;
  }
  $("#pkSend").onclick = send;
  $("#pkCut").onclick = () => {
    const live = E.filter(([a, b]) => !down.has(ek(a, b))); if (!live.length) return;
    const [a, b] = live[Math.floor(Math.random() * live.length)]; down.add(ek(a, b)); cuts++; drawNet();
    line(`Cable between ${N[a][2]} and ${N[b][2]} cut!${paths().length ? ` ${paths().length} route(s) still open.` : " No routes left!"}`, "b");
  };
  $("#pkFix").onclick = () => { down.clear(); drawNet(); line("All cables repaired.", "g"); };
  drawNet();
})();

choiceCards($("#hwCards"), {key: "hw", opts: ["Router","Switch","Wireless access point","Repeater","Fibre-optic cable","Server"], items: [
  {id:"r", q:"Decides which way to send each packet next, between different networks. Your home has one.", a:0, why:"Routers are the sorting offices of the internet."},
  {id:"s", q:"Inside one building, passes data only to the device it's meant for.", a:1, why:"A switch connects devices on the same local network, like a school office handing post to the right classroom."},
  {id:"w", q:"Lets phones and laptops join the network by radio.", a:2, why:"A wireless access point is a radio doorway into a wired network."},
  {id:"p", q:"Picks up a weakening signal and sends it on again, stronger.", a:3, why:"Like someone halfway down a long corridor repeating your shout."},
  {id:"f", q:"Carries data as flashes of light, very fast, over long distances, even under the sea.", a:4, why:"Fibre-optic cables carry most of the world's internet traffic, including to Scotland's islands."},
  {id:"v", q:"A computer that stores websites or videos and sends them out when asked.", a:5, why:"Servers live in data centres, often thousands in one building."}
]});

/* 6.4 speed */
(function(){
  const C = [["Dial-up modem (1998)",0.053],["UK average top speed available (2025)",285],["Full fibre, gigabit (1 Gbps)",1000]];
  function upd(){
    const v = $("#spFile").value, cust = v === "custom"; $("#spCustom").hidden = !cust; $("#spUnit").hidden = !cust;
    const mb = cust ? Math.max(0, +$("#spCustom").value || 0) : +v, mine = Math.max(0.001, +$("#spMine").value || 0);
    $("#spRows").innerHTML = C.concat([["Your speed", mine]]).map(([n, s]) => `<tr><td>${esc(n)}</td><td class="num">${s < 1 ? (s * 1000).toFixed(0) + " kbps" : fmt(s) + " Mbps"}</td><td class="num"><b>${fmtDur(mb * 8 / s)}</b></td></tr>`).join("");
  }
  ["#spFile","#spCustom","#spMine"].forEach(s => $(s).addEventListener("input", upd)); upd();
})();
