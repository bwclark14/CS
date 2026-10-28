
/* =========================================================
   MISSION 9 · Frontier Files
   ========================================================= */
const FILES = [
  {k:"robots", t:"Robots", hook:"You can pre-order a humanoid robot for your home, but a stranger might be driving it through your living room.",
    real:["Boston Dynamics showed a production-ready Atlas humanoid in January 2026. Hyundai plans to use it in car factories from 2028 <span class=\"tag mid\">plan</span>.","The 1X NEO home robot costs $20,000. For harder chores, a remote human worker controls it and can see through its camera.","Over 10,000 patients in Scotland have had robot-assisted surgery since 2021."],
    hype:["Tesla's boss said about 10,000 Optimus robots would be built in 2025. In January 2026 he admitted none were doing useful work yet."],
    good:"Doing dangerous, dirty or repetitive jobs; precise surgery with quicker recovery.", risk:"Cameras in your home; jobs replaced; demos that secretly use human controllers.",
    env:"Batteries, metals and electricity to build and run them.", scot:"NHS Scotland has funded 12 extra surgical robots.", jobs:"Robotics engineer, surgical robot technician, AI safety tester."},
  {k:"quantum", t:"Quantum computers", hook:"A quantum chip did a calculation about 13,000 times faster than one of the world's fastest supercomputers.",
    real:["Google's Willow chip (105 qubits) published a \"verifiable quantum advantage\" result in the science journal Nature in October 2025.","Qubits can be 0 and 1 at the same time, which lets quantum computers try some problems in a completely different way."],
    hype:["Microsoft said in 2025 it had made the first \"topological qubits\". A physicist at the University of St Andrews called the evidence \"incredibly unconvincing\".","IBM aims for a large error-corrected quantum computer by 2029 <span class=\"tag mid\">plan</span>."],
    good:"Designing new medicines and materials; modelling molecules.", risk:"A big enough quantum computer could one day break today's encryption.",
    env:"Many types must be cooled to almost absolute zero.", scot:"Glasgow start-up Quantcore builds quantum processors; Glasgow, Strathclyde and Edinburgh share a quantum centre.", jobs:"Quantum hardware engineer, quantum software developer, physicist."},
  {k:"dna", t:"DNA data storage", hook:"In theory, every film ever made could fit in a teaspoon of DNA and last for centuries.",
    real:["In 2017, scientists stored data at a density of 215 petabytes per gram of DNA.","Microsoft and the University of Washington stored 200 MB in DNA in 2016."],
    hype:["Today's product: a DNA card holding about 1 kilobyte costs $1,000. Writing and reading DNA is still slow and expensive.","A French company plans the first data-centre DNA storage in late 2026 <span class=\"tag mid\">plan</span>."],
    good:"Archives that last hundreds of years without power.", risk:"Very slow to read; expensive; who controls the world's archive?",
    env:"No electricity needed once written, unlike hard drives that need power, cooling and replacing.", scot:"Scotland has strong biotech and data research at its universities.", jobs:"Bioinformatician, lab scientist, data archivist."},
  {k:"cyber", t:"Cyber security", hook:"Some of the UK's biggest cyber attacks in 2025 were allegedly carried out by teenagers.",
    real:["Cyber attacks hit M&S and the Co-op in spring 2025. M&S said it cost around £300 million. Police arrested four people aged 17 to 20.","The 2025 attack on Jaguar Land Rover stopped car production and is estimated to have cost the UK about £1.9 billion: the costliest cyber attack in UK history.","Scams offering \"free\" in-game currency are a common way to steal game accounts."],
    hype:["Many companies claim their systems are \"unhackable\". Nothing is."],
    good:"Cyber skills protect hospitals, shops and families.", risk:"The same skills can lead to a criminal record under the Computer Misuse Act.",
    env:"Attacks waste huge amounts of energy and equipment.", scot:"Girls in S2 can enter the national CyberFirst Girls Competition, which has a Scottish final.", jobs:"Ethical hacker, security analyst, digital forensics investigator."},
  {k:"ai", t:"AI and generative AI", hook:"You can make a realistic video of anyone from one sentence. So how do you know what's real?",
    real:["OpenAI's Sora 2 app (2025) makes realistic videos, including of real people. It caused rows over deepfakes of famous people.","64% of UK 9–17 year olds use AI chatbots, often for schoolwork (Internet Matters, 2025).","40% of UK 13–17 year olds would trust an AI-written news story as much as a human one (Ofcom)."],
    hype:["Many teens say they can spot AI images. In Ofcom's tests, about a quarter of those who were confident got it wrong."],
    good:"Help with learning, accessibility (describing images, captions), science.", risk:"Deepfakes, made-up facts, bias, copying artists' work without permission.",
    env:"Google says a typical text prompt to its Gemini AI uses about as much energy as running a microwave for 1 second, plus about 5 drops of water <span class=\"tag mid\">company figure</span>. Images and video use far more.", scot:"Scotland's first AI Growth Zone was announced in Lanarkshire in 2026.", jobs:"Machine learning engineer, AI ethicist, data scientist."},
  {k:"wear", t:"Wearables", hook:"Glasses with a hidden screen that you control by twitching your fingers.",
    real:["Meta's Ray-Ban Display glasses (2025) have a small screen in one lens and a wristband that reads muscle signals.","In 2025 the Apple Watch was cleared in the USA to warn about signs of high blood pressure, using machine learning trained on over 100,000 people."],
    hype:["Smart glasses have been \"the next big thing\" for over ten years."],
    good:"Health warnings, accessibility, hands-free help.", risk:"Recording people without them knowing; health data privacy; false alarms.",
    env:"Small batteries that are hard to recycle; short device lifespans.", scot:"Scottish universities research health sensors and digital health.", jobs:"Wearable designer, health data scientist, UX designer."},
  {k:"xr", t:"Immersive tech", hook:"The most expensive headset flopped. What do people actually want?",
    real:["Apple's $3,499 Vision Pro shipped only about 45,000 units in late 2025, and Apple cut production.","Roblox made face-based age checks compulsory for chat in January 2026. Daily users then fell from 144 million to 132 million."],
    hype:["\"Everyone will live in the metaverse\" was a popular prediction around 2021–22."],
    good:"Training surgeons and pilots safely; digital twins to test ideas before building.", risk:"Face scans for age checks; online safety; motion sickness.",
    env:"Digital twins can save energy by testing changes virtually first.", scot:"Glasgow built a digital twin of Pollok Country Park to test net-zero ideas.", jobs:"XR developer, 3D artist, digital twin engineer."},
  {k:"bci", t:"Brain–computer interfaces", hook:"A man who can't move his hands used his thoughts to control an iPad.",
    real:["In 2025, a person with ALS (a disease that stops muscles working) controlled an iPad by thought using Synchron's implant, placed through a blood vessel rather than open brain surgery."],
    hype:["Neuralink plans \"high-volume production\" of its brain chips in 2026 <span class=\"tag mid\">plan</span>."],
    good:"Giving movement and communication back to people with paralysis.", risk:"Surgery risks; who owns your brain data?; should healthy people get \"upgrades\"?",
    env:"Small, but medical devices need careful disposal.", scot:"Scottish universities research neurotechnology and rehabilitation.", jobs:"Neuroengineer, clinical scientist, medical device tester."},
  {k:"space", t:"Space and satellite internet", hook:"About two out of every three working satellites in orbit belong to one company.",
    real:["Starlink passed 11,000 satellites in August 2026.","Glasgow builds more small satellites than almost anywhere in Europe."],
    hype:["SaxaVord in Shetland hopes to be the first place in the UK to launch a rocket vertically into orbit. A launch planned for summer 2026 was paused, with no new date announced by late September."],
    good:"Internet for remote islands, ships and disaster zones.", risk:"Space junk; streaks ruining telescope images; one company controlling so much.",
    env:"Rocket launches and satellites burning up in the atmosphere.", scot:"SaxaVord (Shetland) and Glasgow's satellite makers.", jobs:"Satellite engineer, mission controller, space lawyer."},
  {k:"auto", t:"Self-driving vehicles", hook:"Robotaxis are on London's streets, but Scotland's driverless bus was scrapped.",
    real:["Waymo gives over 400,000 paid rides a week in US cities, and began testing in London in 2026 with safety drivers.","Uber and Wayve started London robotaxi rides in 2026, with a safety operator on board.","Scotland's CAVForth self-driving bus ran from Fife to Edinburgh from 2023 to 2025. The tech worked, but too few people used it."],
    hype:["Waymo says its cars have 90% fewer serious-injury crashes than human drivers <span class=\"tag mid\">company data</span>."],
    good:"Fewer crashes caused by tired or distracted drivers; transport for people who can't drive.", risk:"Who's to blame in a crash? Jobs for bus and taxi drivers.",
    env:"Mostly electric fleets; but more cars on the road?", scot:"CAVForth, the UK's first full-size self-driving bus service.", jobs:"Safety engineer, remote fleet operator, transport planner."},
  {k:"green", t:"Data centres and energy", hook:"One AI data centre can use as much electricity as a small city, and Scotland is planning lots of them.",
    real:["Data centres worldwide use about 485 TWh of electricity a year, forecast to almost double by 2030.","Scotland's first AI Growth Zone (Lanarkshire, 2026) plans a 100 MW data centre.","The UK has promised up to £750 million for its most powerful supercomputer, at the University of Edinburgh."],
    hype:["Developers say the Lanarkshire site will create over 3,000 jobs and run on renewables <span class=\"tag mid\">claim</span>. Journalists have questioned these figures."],
    good:"Jobs; spare heat could warm a hospital; Scotland has lots of wind power.", risk:"24 big data centres planned in Scotland could need more than 1.5 times the country's peak electricity.",
    env:"Electricity, water for cooling, and short-lived hardware.", scot:"Lanarkshire, Fife and Edinburgh.", jobs:"Data centre technician, renewable energy engineer, sustainability analyst."},
  {k:"drones", t:"Drones", hook:"Drones flying medical samples between Scottish hospitals.",
    real:["Project CAELUS, led from Scotland with NHS Scotland and the University of Strathclyde, tested drones carrying medicines and lab samples to rural areas in 2024.","It produced a plan for a national NHS drone network in 2025."],
    hype:["\"Pizza by drone everywhere\" has been promised for years."],
    good:"Faster deliveries to islands and rural areas; fewer van trips.", risk:"Noise, privacy, crowded airspace.",
    env:"Electric drones might replace some van journeys.", scot:"CAELUS: a Scottish-led medical drone project.", jobs:"Drone pilot, airspace manager, simulation engineer."}
];
(function(){
  let cur = store.get("ffCur", 0);
  function draw(){
    $("#ffTabs").innerHTML = FILES.map((f, i) => `<button type="button" role="tab" aria-selected="${i === cur}" data-i="${i}" id="fft${i}">${esc(f.t)}</button>`).join("");
    const f = FILES[cur];
    $("#ffFile").setAttribute("aria-labelledby", "fft" + cur);
    $("#ffFile").innerHTML = `<div class="file"><span class="eyebrow">FRONTIER FILE ${String(cur + 1).padStart(2, "0")} · ${esc(f.t.toUpperCase())}</span><div class="hook">${esc(f.hook)}</div>
      <div class="cols"><div class="box"><h4>What's real now</h4><ul>${f.real.map(x => `<li>${x}</li>`).join("")}</ul></div><div class="box hype"><h4>Hype check</h4><ul>${f.hype.map(x => `<li>${x}</li>`).join("")}</ul></div>
      <div class="box"><h4>Could help</h4><p>${esc(f.good)}</p><h4 class="mt">Could harm</h4><p>${esc(f.risk)}</p></div><div class="box should"><h4>Environment</h4><p>${f.env}</p><h4 class="mt">Jobs it might create</h4><p>${esc(f.jobs)}</p></div></div>
      <div class="box scot"><h4>Scotland link</h4><p>${esc(f.scot)}</p></div></div>`;
  }
  $("#ffTabs").onclick = e => { const b = e.target.closest("button"); if (!b) return; cur = +b.dataset.i; store.set("ffCur", cur); draw(); $("#fft" + cur).focus(); };
  $("#ffTabs").addEventListener("keydown", e => { if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return; cur = (cur + (e.key === "ArrowRight" ? 1 : FILES.length - 1)) % FILES.length; store.set("ffCur", cur); draw(); $("#fft" + cur).focus(); });
  draw();
  $("#rsTopic").innerHTML = `<option value="">Choose…</option>` + FILES.map(f => `<option>${esc(f.t)}</option>`).join("");
  const v = field("rs-topic"); if (v) $("#rsTopic").value = v;
  $("#rsDl").onclick = () => {
    const L = ["What is it","Real now","Hype or claim","Who benefits / loses out","Environment","Scotland or jobs","Sources","Still wondering"];
    download("frontier-research.txt", `Frontier research: ${$("#rsTopic").value}\nCodename: ${field("codename")}\n\n` + L.map((l, i) => `${l}\n${$("#rs" + (i + 1)).value}\n`).join("\n"));
  };
})();

choiceCards($("#hypeCards"), {key: "hype", opts: ["Confirmed","Claim or not yet"], scoreEl: "#hypeScore", countAll: true,
  onScore: (r, n, t) => { if (n === t && r >= 8) Pass.award("hype"); },
  items: [
    {id:"willow", q:"Google's Willow chip ran a calculation about 13,000 times faster than a top supercomputer, published in Nature in 2025.", a:0, why:"Published and peer-reviewed. Scientists still want other teams to repeat it."},
    {id:"opt", q:"Tesla's Optimus robots were doing useful work in its factories by early 2026.", a:1, why:"In January 2026 Tesla's boss admitted they weren't yet."},
    {id:"surg", q:"Over 10,000 patients in Scotland have had robot-assisted surgery since 2021.", a:0, why:"Reported by NHS Greater Glasgow and Clyde in 2025."},
    {id:"maj", q:"Microsoft has built the first working topological qubit.", a:1, why:"Microsoft claimed it, but other physicists said the evidence fell short."},
    {id:"dna", q:"Scientists have stored data in DNA at 215 petabytes per gram.", a:0, why:"A real lab result from 2017. But the product you can buy today holds about 1 KB for $1,000."},
    {id:"taxi", q:"Robotaxis in London in 2026 drive with nobody on board except passengers.", a:1, why:"Not yet: London's robotaxis still carried safety drivers or operators in 2026."},
    {id:"star", q:"Starlink has more than 11,000 satellites in orbit (August 2026).", a:0, why:"Confirmed by satellite trackers."},
    {id:"jobs", q:"The Lanarkshire AI Growth Zone will create more than 3,000 jobs.", a:1, why:"That's the developers' promise. It hasn't happened yet, and journalists have questioned it."},
    {id:"neura", q:"Neuralink will produce brain chips in high volume in 2026.", a:1, why:"A company plan, not something that has happened."},
    {id:"cav", q:"A self-driving bus carried passengers between Fife and Edinburgh from 2023 to 2025.", a:0, why:"CAVForth. It worked, but ended because too few people used it."}
  ]});

(function(){
  const SW = [
    ["robot","A $20,000 home robot that a remote worker can drive and see through, to do chores you can't.", ["Could help older or disabled people live independently.","A stranger can see inside your home.","The company says it needs your data to make the robot better.","Remote workers might be paid very little."]],
    ["dc","Build lots of big AI data centres in Scotland.", ["Jobs and investment, and spare heat for hospitals.","Could need more electricity than Scotland uses at its peak.","Scotland has lots of wind power, but could it be used for other things?","Who decides, and who lives next to them?"]],
    ["glasses","Camera glasses that everyone wears all the time.", ["Could describe the world for people who are blind or partially sighted.","People could be filmed without knowing.","Who owns the recordings?"]],
    ["brain","Brain chips for healthy people who just want to be faster or smarter.", ["Amazing for people with paralysis. But for everyone?","Surgery always has risks.","Would only rich people get upgrades?","Who could read or sell your brain data?"]],
    ["taxi","Replace all taxis and buses with self-driving ones.", ["Could prevent crashes caused by tired or distracted drivers.","Thousands of driving jobs.","Who is responsible when it goes wrong?","Scotland's self-driving bus worked, but not enough people used it."]]
  ];
  const L = ["Definitely not","Probably not","Not sure","Probably yes","Definitely yes"];
  $("#swCards").innerHTML = SW.map(([k, q, w]) => `<div class="panel stack"><h3>${esc(q)}</h3><div class="row"><input type="range" min="0" max="4" value="2" data-save="sw-${k}" aria-label="Should we? ${esc(q)}" style="flex:1;min-width:200px"><b class="mono" data-out="${k}"></b></div>
    <textarea data-save="sw-${k}-why" aria-label="Your reason"></textarea><details class="step"><summary>Things to weigh up</summary><div class="inner"><ul class="stack">${w.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></details></div>`).join("");
  $$("#swCards [data-save]").forEach(bindSave);
  const out = () => $$("#swCards input[type=range]").forEach(r => { $(`[data-out="${r.dataset.save.slice(3)}"]`).textContent = L[+r.value]; });
  $("#swCards").addEventListener("input", out); out();
})();

/* =========================================================
   MISSION 10 · Crystal Ball
   ========================================================= */
(function(){
  const DECK = {
    Year:["2029","2031","2036","2046"],
    Place:["your school","a Shetland island","a hospital","a football stadium","a farm in the Borders","your bedroom","Glasgow city centre","a supermarket","a forest","a space station"],
    Thing:["a robot","a wearable","an AI tutor","a game","a vehicle","a network of sensors","a pair of glasses","a drone","whatever replaces the phone","a quantum computer","a data centre"],
    Mood:["exciting","worrying","funny","calm","unfair","hopeful"]
  };
  let hand = store.get("hand", null);
  const pick = k => DECK[k][Math.floor(Math.random() * DECK[k].length)];
  function deal(k){ hand = hand || {}; if (k) hand[k] = pick(k); else Object.keys(DECK).forEach(x => hand[x] = pick(x)); store.set("hand", hand); draw(); }
  function draw(){
    $("#drawCards").innerHTML = Object.keys(DECK).map(k => `<button type="button" class="dcard" data-k="${k}" aria-label="${k}: ${hand ? esc(hand[k]) : "not dealt"}. Tap to re-deal."><span>${k}</span><b>${hand ? esc(hand[k]) : "?"}</b></button>`).join("");
    if (hand) $("#predText").placeholder = `By ${hand.Year}, in ${hand.Place}, ${hand.Thing} will…`;
  }
  $("#drawCards").onclick = e => { const b = e.target.closest(".dcard"); if (b) deal(b.dataset.k); };
  $("#drawAll").onclick = () => deal();
  draw();

  // futures cone
  const BANDS = [
    ["possible","Possible","M30,150 L500,15 L500,285 Z","Might happen, but would need knowledge or tech we don't have yet.","var(--next-soft)"],
    ["plausible","Plausible","M30,150 L500,55 L500,245 Z","Could happen given what we know now about science and people.","color-mix(in srgb,var(--next) 35%,var(--paper))"],
    ["probable","Probable","M30,150 L500,100 L500,200 Z","Likely to happen if current trends carry on. Usually backed by data.","color-mix(in srgb,var(--next) 65%,var(--paper))"]
  ];
  const PREF = ["preferable","Preferable","Not about likelihood: it's what <b>should</b> happen. It can overlap any of the others. Is your prediction also the future you want?"];
  let cone = store.get("cone", "");
  const svg = $("#coneSvg");
  function drawCone(){
    svg.innerHTML = BANDS.map(([k, l, d, , fill]) => `<path class="band" tabindex="0" role="button" aria-label="${l}" aria-pressed="${cone === k}" data-k="${k}" d="${d}" style="fill:${fill};${cone === k ? "stroke:var(--now);stroke-width:4" : ""}"/>`).join("")
      + `<ellipse class="band" tabindex="0" role="button" aria-label="Preferable" aria-pressed="${cone === "preferable"}" data-k="preferable" cx="400" cy="92" rx="80" ry="32" style="fill:var(--then-soft);stroke-dasharray:6 4;${cone === "preferable" ? "stroke:var(--now);stroke-width:4" : ""}"/>`
      + `<text x="250" y="96">Possible</text><text x="380" y="156">Probable</text><text x="300" y="198">Plausible</text><text x="352" y="97">Preferable</text><circle cx="30" cy="150" r="7" style="fill:var(--ink)"/><text x="18" y="178">Now</text><text x="470" y="298" style="font-size:12px">${hand ? hand.Year : "future"}</text>`;
    const b = BANDS.find(x => x[0] === cone);
    $("#coneInfo").innerHTML = cone ? `<span class="eyebrow">You chose</span><h3 class="mt">${b ? b[1] : PREF[1]}</h3><p class="mt">${b ? b[3] : PREF[2]}</p>` : `<p class="small">Tap a band on the cone. The dashed bubble is <b>Preferable</b>: the future people want.</p>`;
  }
  function choose(k){ cone = k; store.set("cone", k); drawCone(); if ((field("pred-text") || "").trim().length > 10) Pass.award("cone"); }
  svg.addEventListener("click", e => { const p = e.target.closest("[data-k]"); if (p) choose(p.dataset.k); });
  svg.addEventListener("keydown", e => { const p = e.target.closest("[data-k]"); if (p && (e.key === "Enter" || e.key === " ")){ e.preventDefault(); choose(p.dataset.k); $(`[data-k="${p.dataset.k}"]`, svg).focus(); } });
  $("#predText").addEventListener("input", () => { if (cone && $("#predText").value.trim().length > 10) Pass.award("cone"); wheelCentre(); });
  drawCone();

  // futures wheel
  const W = [["People","Who benefits? Who might lose out or be left behind?"],["How we live","How would learning, friendships, travel or home life change?"],["Environment","Energy, materials, waste, nature."],["Jobs and money in Scotland","Which jobs appear or disappear? Who pays?"]];
  $("#wheelBox").innerHTML = `<div class="centre" id="wheelC"></div>` + W.map(([t, h], i) => `<div class="panel stack"><h3>${t}</h3><p class="small">${h}</p><label for="wh${i}a" class="small">First this happens…</label><textarea id="wh${i}a" data-save="wh-${i}a"></textarea><label for="wh${i}b" class="small">…which leads to…</label><textarea id="wh${i}b" data-save="wh-${i}b"></textarea></div>`).join("");
  $$("#wheelBox [data-save]").forEach(bindSave);
  function wheelCentre(){ $("#wheelC").textContent = $("#predText").value.trim() || "Your prediction goes here (write it in 10.1)"; }
  wheelCentre();

  // confidence
  const c = $("#confSl"), co = () => $("#confOut").textContent = c.value + "%";
  c.addEventListener("input", co); co();
  const rule = field("m4-rule"); $("#ruleEcho").innerHTML = rule ? `<b>Your rule from Mission 4:</b> ${esc(rule)}<br>Does your prediction follow it?` : "In Mission 4 you can write your own rule for good predictions. Remember Amara's Law: we overestimate the short term and underestimate the long term.";
})();

/* =========================================================
   MISSION 11 · Pitch to the Future
   ========================================================= */
(function(){
  const R = [["mb","micro:bit prototype","Sensors, radio, lights and sound. In the simulator or on real micro:bits. Reuse code from Mission 7."],["ai","Trained AI model","Train a gesture or sound model in micro:bit CreateAI (no login). Test it on different people."],["paper","Paper or cardboard model","Fast and cheap. Shows size, shape and how people would use it."],["web","Web page mock-up","Make a simple page in HTML and CSS showing the screens of your product."]];
  let r = field("proto-route");
  function draw(){ $("#protoRoutes").innerHTML = R.map(([k, t, d]) => `<div class="scard ${r === k ? "right" : ""}"><div class="q">${t}</div><p class="small" style="color:var(--ink)">${d}</p><div class="opts"><button type="button" data-k="${k}" aria-pressed="${r === k}">${r === k ? "Chosen" : "Choose this"}</button></div></div>`).join(""); }
  $("#protoRoutes").onclick = e => { const b = e.target.closest("button[data-k]"); if (!b) return; r = b.dataset.k; store.set("f:proto-route", r); draw(); };
  draw();

  // decision matrix
  const CR = ["Solves the problem well","Fair for different people","Kind to the environment","Affordable","Safe and private"];
  const dm = store.get("dm", {names:["Idea 1","Idea 2","Idea 3"], w:CR.map(() => 2), s:CR.map(() => [3,3,3])});
  function drawDM(){
    const sel = (v, max, attr) => `<select ${attr}>${Array.from({length: max}, (_, i) => `<option ${v === i + 1 ? "selected" : ""}>${i + 1}</option>`).join("")}</select>`;
    $("#dmTbl").innerHTML = `<thead><tr><th>Criterion</th><th>How much it matters (1–3)</th>${dm.names.map((n, j) => `<th><input value="${esc(n)}" data-n="${j}" aria-label="Name of option ${j + 1}" style="width:120px"></th>`).join("")}</tr></thead>
      <tbody>${CR.map((c, i) => `<tr><td>${c}</td><td>${sel(dm.w[i], 3, `data-w="${i}" aria-label="Weight for ${c}"`)}</td>${dm.names.map((n, j) => `<td>${sel(dm.s[i][j], 5, `data-s="${i}-${j}" aria-label="Score for ${esc(n)}: ${c}"`)}</td>`).join("")}</tr>`).join("")}
      <tr><td><b>Total (score × weight)</b></td><td></td>${dm.names.map((n, j) => `<td class="num"><b id="dmT${j}"></b></td>`).join("")}</tr></tbody>`;
    totals();
  }
  function totals(){
    const t = dm.names.map((n, j) => CR.reduce((s, c, i) => s + dm.w[i] * dm.s[i][j], 0));
    t.forEach((v, j) => $("#dmT" + j).textContent = v);
    const best = t.indexOf(Math.max(...t));
    $("#dmOut").innerHTML = `<b>${esc(dm.names[best])}</b> scores highest (${t[best]}). Do you agree? If you pick a different one, write why in your pitch.`;
  }
  $("#dmTbl").addEventListener("input", e => {
    const x = e.target; if (x.dataset.n !== undefined){ dm.names[+x.dataset.n] = x.value; store.set("dm", dm); totals(); return; }
    if (x.dataset.w !== undefined) dm.w[+x.dataset.w] = +x.value;
    if (x.dataset.s !== undefined){ const [i, j] = x.dataset.s.split("-").map(Number); dm.s[i][j] = +x.value; }
    store.set("dm", dm); totals();
  });
  drawDM();

  // pitch beats
  const BEATS = [["The problem","Who has this problem, and why does it matter?","I can explain the problem"],["Our product","Its name, and what it does. Show your prototype.","I can show my prototype"],["Why it's possible by then","Which trends or drivers from Mission 8 make it possible?","I can link it to real trends"],["Tested and improved","What changed from version 1 to version 2, and why?","I can show an improvement I made after testing"],["Who wins, who loses","Who benefits? Who might lose out? What does it cost the environment?","I can name a benefit and a risk for different people"],["Why ours","Why is this better than another option? Use your criteria.","I can justify my choice using criteria"]];
  $("#pitchBeats").innerHTML = BEATS.map(([t, h], i) => `<div class="panel stack"><label for="pb${i}">${i + 1}. ${t}</label><span class="small">${h}</span><textarea id="pb${i}" data-save="pb-${i}"></textarea></div>`).join("");
  $$("#pitchBeats [data-save]").forEach(bindSave);
  function checks(){
    const ok = BEATS.map((b, i) => ($("#pb" + i).value || "").trim().length >= 15);
    $("#pitchChecks").innerHTML = BEATS.map((b, i) => `<li class="${ok[i] ? "ok" : ""}">${b[2]}</li>`).join("");
    if (ok.every(Boolean)) Pass.award("pitch");
  }
  $("#pitchBeats").addEventListener("input", checks); checks();

  // timer
  let left = 90, tm = null;
  const show = () => { $("#ptTime").textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`; $("#ptTime").style.color = left <= 10 ? "var(--bad)" : ""; };
  $("#ptGo").onclick = () => { if (tm){ clearInterval(tm); tm = null; $("#ptGo").textContent = "Start"; return; }
    $("#ptGo").textContent = "Pause"; tm = setInterval(() => { left--; show(); if (left <= 0){ clearInterval(tm); tm = null; $("#ptGo").textContent = "Start"; say("Time's up"); left = 0; } }, 1000); };
  $("#ptReset").onclick = () => { clearInterval(tm); tm = null; left = 90; $("#ptGo").textContent = "Start"; show(); };
  show();

  // rubric
  const RU = [["Identify: the problem",["Problem is unclear","Problem is clear","Problem is clear and backed by research"]],["Design: the plan",["Went with the first idea","Compared some options","Compared options using criteria"]],["Create: the prototype",["Hard to see the idea","Shows the main idea","Clearly shows how it would work"]],["Iterate: testing",["Not tested","Tested once","Tested and improved, with evidence"]],["Communicate: the pitch",["Hard to follow","Clear","Clear, engaging, and explains the impact"]]];
  const ru = store.get("rubric", {});
  function drawRu(){ $("#rubric").innerHTML = RU.map(([t, lv], i) => `<div class="r"><div>${t}</div>${lv.map((l, j) => `<button type="button" data-r="${i}" data-l="${j}" aria-pressed="${ru[i] === j}"><span class="small" style="display:block;color:inherit">${["Beginning","Developing","Accomplished"][j]}</span>${esc(l)}</button>`).join("")}</div>`).join(""); }
  $("#rubric").onclick = e => { const b = e.target.closest("button[data-r]"); if (!b) return; ru[b.dataset.r] = +b.dataset.l; store.set("rubric", ru); drawRu(); $(`[data-r="${b.dataset.r}"][data-l="${b.dataset.l}"]`).focus(); };
  drawRu();
})();

/* =========================================================
   MISSION 12 · Time capsule
   ========================================================= */
const Capsule = (function(){
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf))), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  async function keyFrom(pass, salt){
    const base = await crypto.subtle.importKey("raw", enc.encode(pass), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({name: "PBKDF2", salt, iterations: 150000, hash: "SHA-256"}, base, {name: "AES-GCM", length: 256}, false, ["encrypt", "decrypt"]);
  }
  async function lock(obj, pass){
    const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({name: "AES-GCM", iv}, await keyFrom(pass, salt), enc.encode(JSON.stringify(obj)));
    return {format: obj.format, version: obj.version, codename: obj.codename, sealed: obj.sealed, opens: obj.opens, encrypted: true, salt: b64(salt), iv: b64(iv), data: b64(ct)};
  }
  async function unlock(file, pass){
    if (!file.encrypted) return file;
    const pt = await crypto.subtle.decrypt({name: "AES-GCM", iv: unb64(file.iv)}, await keyFrom(pass, unb64(file.salt)), unb64(file.data));
    return JSON.parse(dec.decode(pt));
  }
  return {lock, unlock};
})();
(function(){
  const F = {cCode:"codename", cPred:"pred-text", cWhy:"conf-why", cSig:"conf-sig"};
  function prefill(){
    Object.entries(F).forEach(([id, k]) => { if (!$("#" + id).value) $("#" + id).value = field(k); });
    if (!$("#cCone").value){ const c = store.get("cone", ""); if (c) $("#cCone").value = c[0].toUpperCase() + c.slice(1); }
    const conf = field("conf"); if (conf !== "" && !$("#cConf")._t){ $("#cConf").value = conf; }
    if (!$("#cPitch").value){ const p = [0, 1, 4].map(i => field("pb-" + i)).filter(Boolean).join(" · "); $("#cPitch").value = p; }
    $("#cConfOut").textContent = $("#cConf").value + "%";
  }
  $("#cConf").addEventListener("input", e => { e.target._t = 1; $("#cConfOut").textContent = e.target.value + "%"; });
  window.addEventListener("hashchange", () => setTimeout(() => { if (!$("#m12").closest(".view").hidden) prefill(); }, 0));
  prefill();
  function payload(){
    const yrs = +$("#cOpen").value, now = new Date(), opens = new Date(now); opens.setFullYear(now.getFullYear() + yrs);
    return {format: "future-proof-capsule", version: 2, codename: $("#cCode").value.trim() || "Unnamed agent", sealed: now.toISOString().slice(0, 10), opens: opens.toISOString().slice(0, 10),
      prediction: $("#cPred").value.trim(), cone: $("#cCone").value, confidence: +$("#cConf").value, reasoning: $("#cWhy").value.trim(), signals: $("#cSig").value.trim(), pitch: $("#cPitch").value.trim(), question: $("#cQ").value.trim()};
  }
  function check(p){
    const all = [p.codename, p.prediction, p.reasoning, p.signals, p.pitch, p.question].join(" "), warn = [];
    if (/\S+@\S+\.\S+/.test(all)) warn.push("an email address");
    if (/(?:\+44\s?|\b0)\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/.test(all)) warn.push("what looks like a phone number");
    if (/\b(primary|high school|academy)\b/i.test(all)) warn.push("what might be a school name");
    if (!p.prediction) warn.push("NO_PRED");
    return warn;
  }
  $("#cSeal").onclick = async () => {
    const p = payload(), w = check(p);
    if (w.includes("NO_PRED")){ $("#cWarn").innerHTML = `<div class="fb no">Write your prediction first.</div>`; return; }
    if (w.length){ $("#cWarn").innerHTML = `<div class="fb no">Please remove ${w.join(" and ")} before sealing. Capsules must not hold personal details.</div>`; return; }
    $("#cWarn").innerHTML = "";
    let out = p; const pass = $("#cPass").value;
    if (pass){ try{ out = await Capsule.lock(p, pass); }catch(e){ $("#cWarn").innerHTML = `<div class="fb no">This browser couldn't encrypt the file. Leave the passphrase blank or try another browser.</div>`; return; } }
    download(`capsule-${p.codename.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-opens-${p.opens}.json`, JSON.stringify(out, null, 2), "application/json");
    $("#cSealed").textContent = `SEALED · OPENS ${p.opens}`; Pass.award("capsule"); say("Capsule sealed and downloaded");
  };
  $("#cPrint").onclick = () => {
    const p = payload();
    $("#capPrint").innerHTML = `<div style="font-family:system-ui;padding:20px;color:#000;background:#fff"><h1>Future Proof time capsule</h1><p><b>Codename:</b> ${esc(p.codename)} · <b>Sealed:</b> ${p.sealed} · <b>Opens:</b> ${p.opens}</p>
      ${[["My prediction", p.prediction],["Futures cone", p.cone],["Confidence", p.confidence + "%"],["Why I think so", p.reasoning],["Signals I'd need to see", p.signals],["My pitch", p.pitch],["A question for future me", p.question]].map(([l, v]) => `<h3>${l}</h3><p>${esc(v || "—")}</p>`).join("")}</div>`;
    document.body.classList.add("print-capsule"); window.print();
  };

  // reopen
  function renderOpen(c){
    $("#roOut").innerHTML = `<div class="capsule mt"><span class="sealed">OPENED · ${esc(c.codename)}</span><p class="small">Sealed ${esc(c.sealed)} · due to open ${esc(c.opens)}</p>
      ${[["Your prediction", c.prediction],["Futures cone", c.cone],["Your confidence", c.confidence + "%"],["Why you thought so", c.reasoning],["Signals you said you'd need", c.signals],["Your pitch", c.pitch],["Your question for future you", c.question]].map(([l, v]) => `<div><b>${l}</b><p>${esc(v || "—")}</p></div>`).join("")}
      <div class="stack"><b>So… did it happen?</b><div class="seg" id="roVerdict" style="border-color:var(--on-inv)"><button type="button" data-v="yes">Yes</button><button type="button" data-v="partly">Partly</button><button type="button" data-v="no">No</button><button type="button" data-v="early">Too early to tell</button></div><div id="roCal"></div></div></div>`;
    seg($("#roVerdict"), v => {
      const cf = +c.confidence, hit = v === "yes" ? 1 : v === "partly" ? 0.5 : v === "no" ? 0 : null;
      let m;
      if (hit === null) m = "Look at the signals you listed. Which ones have started to appear?";
      else { const gap = Math.abs(hit * 100 - cf);
        m = gap <= 25 ? `Well calibrated: you said ${cf}%, and that matched what happened.` : hit * 100 > cf ? `Under-confident: it happened more than your ${cf}% suggested. What did you underestimate?` : `Over-confident: you said ${cf}%, but it didn't fully happen. What got in the way? Remember Amara's Law.`; }
      $("#roCal").innerHTML = `<div class="fb mid" style="color:var(--ink)">${m}</div>`;
    });
  }
  $("#roOpen").onclick = async () => {
    const f = $("#roFile").files[0]; if (!f){ $("#roOut").innerHTML = `<div class="fb no">Choose a capsule file first.</div>`; return; }
    let file; try{ file = JSON.parse(await f.text()); }catch(e){ $("#roOut").innerHTML = `<div class="fb no">That isn't a capsule file.</div>`; return; }
    if (file.format !== "future-proof-capsule"){ $("#roOut").innerHTML = `<div class="fb no">That file isn't a Future Proof capsule.</div>`; return; }
    let c; try{ c = await Capsule.unlock(file, $("#roPass").value); }catch(e){ $("#roOut").innerHTML = `<div class="fb no">Wrong passphrase, or the file has been changed.</div>`; return; }
    const today = new Date().toISOString().slice(0, 10);
    if (today < c.opens){
      $("#roOut").innerHTML = `<div class="fb mid">This capsule (${esc(c.codename)}) is sealed until <b>${esc(c.opens)}</b>. Come back then!</div><button type="button" class="btn sm mt" id="roEarly">Open early (teacher)</button>`;
      $("#roEarly").onclick = () => renderOpen(c);
    } else renderOpen(c);
  };
})();

/* final quiz */
choiceCards($("#quizF"), {key: "qf", items: [
  {id:"1", who:"Mission 1", q:"Which part is like the desk in an office?", opts:["Storage","RAM","The processor"], a:1, why:"RAM is the fast working space, cleared when the power goes off."},
  {id:"2", who:"Mission 2", q:"A computer built into a washing machine to do one job is called…", opts:["a supercomputer","an embedded system","a server"], a:1, why:"Embedded systems are hidden inside other products."},
  {id:"3", who:"Mission 3", q:"Why did clock speeds stop rising around 2005?", opts:["Chips got too hot","Nobody wanted faster computers","It was made illegal"], a:0, why:"So engineers added more cores instead."},
  {id:"4", who:"Mission 4", q:"\"There is a world market for maybe five computers\" is…", opts:["a real quote from 1943","a quote with no evidence anyone said it","from a 2007 interview"], a:1, why:"It first appears in a book in 1981. Always check the source."},
  {id:"5", who:"Mission 5", q:"A phone with 12 GB of memory has about how many K?", opts:["12K","12,000K","12 million K"], a:2, why:"12 GB is about 12 million KB (12,582,912 if you count in 1,024s)."},
  {id:"6", who:"Mission 6", q:"If one packet goes missing, TCP…", opts:["gives up","asks for it to be sent again","sends the whole internet again"], a:1, why:"The receiver spots the gap from the packet numbers and asks for a resend."},
  {id:"7", who:"Mission 7", q:"Why did we add TO and FROM to micro:bit messages?", opts:["The radio has no addresses built in","It makes them faster","The micro:bit needs it to switch on"], a:0, why:"Every message goes to everyone on the group, so we invented our own addressing."},
  {id:"8", who:"Mission 8", q:"On a log scale chart, a straight rising line means…", opts:["it stopped growing","steady doubling (exponential growth)","a mistake in the data"], a:1, why:"Each grid line is 10× the last, so steady multiplying looks like a straight line."},
  {id:"9", who:"Mission 9", q:"\"The Lanarkshire site will create 3,000 jobs\" is…", opts:["a confirmed fact","a claim or promise"], a:1, why:"It hasn't happened yet. Promises need checking later."},
  {id:"10", who:"Mission 10", q:"On the futures cone, \"probable\" means…", opts:["what we want to happen","likely if current trends carry on","impossible"], a:1, why:"Preferable is what we want; probable is what trends suggest."},
  {id:"11", who:"Mission 11", q:"A good designer treats AI output as…", opts:["always right","a first draft to check and improve","cheating"], a:1, why:"Check it, fix what's wrong, and say where AI helped."},
  {id:"12", who:"Mission 12", q:"Why does the capsule have no real names in it?", opts:["To protect your privacy: collect only what's needed","Names don't fit in JSON","It's quicker"], a:0, why:"Collect only the data you need. A codename is enough to match it up."}
]});

/* ---------- MISSIONS: one page per mission (from The Data Trail v3) ----------
   Each .view is a page. The address (#m3, #toptrumps, …) picks the page that holds that id. Without JavaScript every view shows. */
(function(){
  const views = $$(".view"); if (!views.length) return;
  const links = $$("nav.top .links a"), strip = $("nav.top .links"), base = document.title;
  const viewFor = id => { const el = id && document.getElementById(id); return el ? el.closest(".view") : null; };
  let current = null;
  function fade(){ strip.classList.toggle("more", strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 4); }
  function show(first){
    let id = ""; try{ id = decodeURIComponent(location.hash.slice(1)); }catch(e){}
    const el = id && document.getElementById(id);
    if (el && !el.closest(".view") && current) return;
    const v = viewFor(id) || views[0], changed = v !== current;
    views.forEach(x => { x.hidden = x !== v; }); current = v;
    links.forEach(a => { if (viewFor(a.getAttribute("href").slice(1)) === v){ a.setAttribute("aria-current", "page"); strip.scrollLeft = a.offsetLeft - strip.offsetLeft - strip.clientWidth / 2 + a.offsetWidth / 2; } else a.removeAttribute("aria-current"); });
    document.title = v.dataset.title ? v.dataset.title + " · " + base : base;
    const target = id && document.getElementById(id), top = !target || target === v || target === v.firstElementChild || target === v.querySelector(".part");
    if (top){ if (changed || !first) window.scrollTo(0, 0); } else target.scrollIntoView();
    if (changed && !first){ const h = top ? v.querySelector("h1") : (target.querySelector("h2,h3") || target); if (h){ h.tabIndex = -1; h.focus({preventScroll: true}); } }
    fade();
  }
  window.addEventListener("hashchange", () => show(false));
  strip.addEventListener("scroll", fade, {passive: true}); window.addEventListener("resize", fade);
  show(true);
})();
