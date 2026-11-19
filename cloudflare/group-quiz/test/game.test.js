import { env, SELF, runInDurableObject, runDurableObjectAlarm } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import { ADJECTIVES, ANIMALS, CODE_CHARS, LIMITS } from "../src/game.js";

const ORIGIN = "http://localhost:8765";
const BASE = "https://quiz.example";

const QUIZ = {
  title: "Test quiz",
  rounds: [
    { name: "Round one", questions: [
      { type: "identify", q: "Which line is input?", code: [{ code: "RECEIVE x FROM KEYBOARD", indent: 0 }], options: ["Line 1", "Line 2", "Line 3", "Line 4"], answer: 0, explain: "It receives." },
      { type: "truefalse", q: "Is 3 > 2?", options: ["TRUE", "FALSE"], answer: 0, explain: "3 is bigger." },
    ] },
    { name: "Round two", questions: [
      { type: "poll", q: "Which do you like?", options: ["A", "B", "C"], explain: "Talk about it." },
    ] },
  ],
};

async function createGame(settings = {}, quiz = QUIZ) {
  const res = await SELF.fetch(BASE + "/games", { method: "POST", headers: { Origin: ORIGIN, "Content-Type": "application/json" }, body: JSON.stringify({ quiz, settings }) });
  expect(res.status).toBe(201);
  return res.json();
}

// A WebSocket client that remembers every message and can wait for one that matches
async function connect(code, params) {
  const res = await SELF.fetch(`${BASE}/games/${code}/ws?${new URLSearchParams(params)}`, { headers: { Upgrade: "websocket", Origin: ORIGIN } });
  expect(res.status).toBe(101);
  const ws = res.webSocket;
  const c = { ws, msgs: [], closed: null, waiters: [] };
  ws.accept();
  ws.addEventListener("message", e => { const m = JSON.parse(e.data); c.msgs.push(m); c.waiters = c.waiters.filter(w => !w(m)); });
  ws.addEventListener("close", e => { c.closed = { code: e.code, reason: e.reason }; c.waiters = c.waiters.filter(w => !w(null)); });
  c.send = m => ws.send(typeof m === "string" ? m : JSON.stringify(m));
  c.last = () => [...c.msgs].reverse().find(m => m.t === "state");
  c.wait = (pred, ms = 2000) => {
    const hit = c.msgs.find(m => pred(m));
    if (hit) return Promise.resolve(hit);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error("timed out; last: " + JSON.stringify(c.msgs.at(-1)))), ms);
      c.waiters.push(m => { if (m === null) { if (c.closed) { clearTimeout(t); resolve(null); return true; } return false; } if (pred(m)) { clearTimeout(t); resolve(m); return true; } return false; });
    });
  };
  c.next = async pred => { const n = c.msgs.length; await c.waitFrom(n, pred); return c.msgs.at(-1); };
  c.waitFrom = (n, pred, ms = 2000) => new Promise((resolve, reject) => {
    const check = () => c.msgs.slice(n).find(pred);
    const hit = check(); if (hit) return resolve(hit);
    const t = setTimeout(() => reject(new Error("timed out; last: " + JSON.stringify(c.msgs.at(-1)))), ms);
    c.waiters.push(m => { if (m && pred(m)) { clearTimeout(t); resolve(m); return true; } return false; });
  });
  return c;
}
const settle = () => new Promise(r => setTimeout(r, 50));

async function setupGame(settings, pupils = 2) {
  const { code, key } = await createGame(settings);
  const teacher = await connect(code, { role: "teacher", key });
  await teacher.wait(m => m.t === "state" && m.phase === "lobby");
  const ps = [];
  for (let i = 0; i < pupils; i++) {
    const p = await connect(code, { role: "pupil" });
    const w = await p.wait(m => m.t === "welcome");
    p.token = w.token; p.name = w.name;
    ps.push(p);
  }
  await teacher.wait(m => m.t === "state" && m.list?.length === pupils);
  return { code, key, teacher, ps, stub: env.GAMES.get(env.GAMES.idFromName(code)) };
}

const phase = (c, ph, n) => c.wait(m => m.t === "state" && m.phase === ph && (n === undefined || m.index === n));

describe("creating games", () => {
  it("returns a 6-character code without look-alikes and a long teacher key", async () => {
    const { code, key } = await createGame();
    expect(code).toMatch(new RegExp(`^[${CODE_CHARS}]{6}$`));
    expect(code).not.toMatch(/[O0I1LS5Z2B8AEU]/);
    expect(key.length).toBeGreaterThanOrEqual(22);   // 128+ bits in base64url
  });

  it("only accepts the quiz page's origins, with CORS for those alone", async () => {
    const bad = await SELF.fetch(BASE + "/games", { method: "POST", headers: { Origin: "https://evil.example" }, body: JSON.stringify({ quiz: QUIZ }) });
    expect(bad.status).toBe(403);
    expect(bad.headers.get("Access-Control-Allow-Origin")).toBeNull();
    const none = await SELF.fetch(BASE + "/games", { method: "POST", body: JSON.stringify({ quiz: QUIZ }) });
    expect(none.status).toBe(403);
    const pre = await SELF.fetch(BASE + "/games", { method: "OPTIONS", headers: { Origin: "https://bwclark14.github.io" } });
    expect(pre.status).toBe(204);
    expect(pre.headers.get("Access-Control-Allow-Origin")).toBe("https://bwclark14.github.io");
    const sneaky = await SELF.fetch(BASE + "/games", { method: "OPTIONS", headers: { Origin: "https://bwclark14.github.io.evil.example" } });
    expect(sneaky.status).toBe(403);
  });

  it("rejects a broken question set", async () => {
    const res = await SELF.fetch(BASE + "/games", { method: "POST", headers: { Origin: ORIGIN }, body: JSON.stringify({ quiz: { title: "x", rounds: [{ name: "r", questions: [{ type: "ct", q: "?", options: ["a"], answer: 3 }] }] } }) });
    expect(res.status).toBe(400);
  });

  it("refuses a code that is already in use", async () => {
    const { code } = await createGame();
    const stub = env.GAMES.get(env.GAMES.idFromName(code));
    expect((await stub.create({ quiz: QUIZ, settings: {}, key: "x" })).ok).toBe(false);
  });
});

describe("joining", () => {
  it("says 'No game with that code' for unknown codes", async () => {
    const p = await connect("CDFGHJ", { role: "pupil" });
    const m = await p.wait(m => m.t === "error");
    expect(m.code).toBe("no_game");
    expect(m.msg).toMatch(/No game with that code/);
    const q = await connect("NOT-A-CODE", { role: "pupil" });
    expect((await q.wait(m => m.t === "error")).code).toBe("no_game");
  });

  it("refuses a wrong teacher key", async () => {
    const { code } = await createGame();
    const t = await connect(code, { role: "teacher", key: "wrong" });
    expect((await t.wait(m => m.t === "error")).code).toBe("bad_key");
  });

  it("gives each pupil a unique, kind random name and lets them reroll in the lobby only", async () => {
    const { teacher, ps } = await setupGame({}, 3);
    const names = ps.map(p => p.name);
    expect(new Set(names).size).toBe(3);
    for (const n of names) {
      const a = ADJECTIVES.find(x => n.startsWith(x + " "));
      expect(a).toBeTruthy();
      expect(ANIMALS).toContain(n.slice(a.length + 1));
    }
    ps[0].send({ t: "reroll" });
    const w = await ps[0].next(m => m.t === "welcome");
    expect(w.name).not.toBe(ps[0].name);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    const before = ps[0].msgs.filter(m => m.t === "welcome").length;
    ps[0].send({ t: "reroll" });
    await settle();
    expect(ps[0].msgs.filter(m => m.t === "welcome").length).toBe(before);
  });

  it("rejoins with the same name and score using the token", async () => {
    const { code, teacher, ps } = await setupGame({}, 1);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    ps[0].send({ t: "answer", q: 0, a: 0 });
    await ps[0].wait(m => m.t === "state" && m.answered);
    teacher.send({ t: "reveal" });
    const r = await phase(ps[0], "reveal", 0);
    ps[0].ws.close();
    const again = await connect(code, { role: "pupil", token: ps[0].token });
    const w = await again.wait(m => m.t === "welcome");
    expect(w.name).toBe(ps[0].name);
    const s = await again.wait(m => m.t === "state");
    expect(s.score).toBe(r.score);
    expect(s.score).toBeGreaterThan(500);
  });

  it("lets the teacher refresh and stay in control", async () => {
    const { code, key, teacher, ps } = await setupGame({}, 1);
    teacher.ws.close();
    await settle();
    const t2 = await connect(code, { role: "teacher", key });
    await phase(t2, "lobby");
    t2.send({ t: "start" });
    await phase(ps[0], "question", 0);
  });

  it("puts late joiners in at the next question", async () => {
    const { code, teacher, ps } = await setupGame({}, 1);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    const late = await connect(code, { role: "pupil" });
    const s = await late.wait(m => m.t === "state" && m.phase === "question");
    expect(s.late).toBe(true);
    late.send({ t: "answer", q: 0, a: 0 });
    await settle();
    expect(teacher.last().answered).toBe(0);
    expect(teacher.last().expected).toBe(1);
    ps[0].send({ t: "answer", q: 0, a: 0 });         // the only eligible pupil answers: auto reveal
    await phase(teacher, "reveal", 0);
    teacher.send({ t: "next" });                     // leaderboard
    await phase(teacher, "board");
    teacher.send({ t: "next" });
    const q2 = await phase(late, "question", 1);
    expect(q2.late).toBe(false);
  });

  it("allows at most 60 pupils", async () => {
    const { code, key } = await createGame();
    const teacher = await connect(code, { role: "teacher", key });
    await teacher.wait(m => m.t === "state");
    const all = [];
    for (let i = 0; i < LIMITS.maxPupils; i++) all.push(connect(code, { role: "pupil" }));
    const cs = await Promise.all(all);
    await Promise.all(cs.map(c => c.wait(m => m.t === "welcome")));
    const extra = await connect(code, { role: "pupil" });
    expect((await extra.wait(m => m.t === "error")).code).toBe("full");
    const names = new Set(cs.map(c => c.msgs.find(m => m.t === "welcome").name));
    expect(names.size).toBe(LIMITS.maxPupils);
  });
});

describe("permissions", () => {
  it("ignores teacher-only actions from pupils", async () => {
    const { teacher, ps } = await setupGame({}, 2);
    const victim = teacher.last().list[1].id;
    for (const t of ["start", "reveal", "next", "end"]) ps[0].send({ t });
    ps[0].send({ t: "kick", id: victim });
    ps[0].send({ t: "settings", timer: 10, leaderboard: false });
    await settle(); await new Promise(r => setTimeout(r, 1100));   // let the rate limit refill
    const s = teacher.last();
    expect(s.phase).toBe("lobby");
    expect(s.list.length).toBe(2);
    expect(s.settings.timer).toBe(20);
    expect(s.settings.leaderboard).toBe(true);
    expect(ps[1].closed).toBeNull();
  });

  it("lets the teacher change settings in the lobby only", async () => {
    const { teacher } = await setupGame({}, 1);
    teacher.send({ t: "settings", timer: 30, rounds: [1], leaderboard: false });
    const s = await teacher.wait(m => m.t === "state" && m.settings.timer === 30);
    expect(s.settings.rounds).toEqual([1]);
    expect(s.questionCount).toBe(1);
    teacher.send({ t: "settings", timer: 7 });       // not an allowed timer
    await settle();
    expect(teacher.last().settings.timer).toBe(30);
    teacher.send({ t: "start" });
    await phase(teacher, "question", 0);
    teacher.send({ t: "settings", timer: 10 });
    await settle();
    expect(teacher.last().settings.timer).toBe(30);
  });

  it("lets the teacher remove a pupil, who can't come back with the same token", async () => {
    const { code, teacher, ps } = await setupGame({}, 2);
    const id = teacher.last().list.find(p => p.name === ps[0].name).id;
    teacher.send({ t: "kick", id });
    const e = await ps[0].wait(m => m.t === "error");
    expect(e.code).toBe("removed");
    await teacher.wait(m => m.t === "state" && m.list.length === 1);
    const back = await connect(code, { role: "pupil", token: ps[0].token });
    expect((await back.wait(m => m.t === "error")).code).toBe("removed");
  });
});

describe("questions and scoring", () => {
  it("never sends the answer or explanation before the reveal", async () => {
    const { teacher, ps } = await setupGame({}, 2);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    ps[0].send({ t: "answer", q: 0, a: 1 });
    await ps[0].wait(m => m.t === "state" && m.answered);
    await settle();
    const before = [...ps[0].msgs, ...ps[1].msgs, ...teacher.msgs];
    for (const m of before) {
      const s = JSON.stringify(m);
      expect(s).not.toContain("explain");
      expect(s).not.toContain("It receives.");
      expect(m.question?.answer).toBeUndefined();
      expect(m.result).toBeUndefined();
      expect(m.reveal).toBeUndefined();
    }
    teacher.send({ t: "reveal" });
    const r = await phase(ps[0], "reveal", 0);
    expect(r.result.answer).toBe(0);
    expect(r.result.explain).toBe("It receives.");
    expect(r.result.correct).toBe(false);
  });

  it("accepts one answer per pupil per question", async () => {
    const { teacher, ps, stub } = await setupGame({}, 2);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    ps[0].send({ t: "answer", q: 0, a: 1 });
    await ps[0].wait(m => m.t === "state" && m.answered);
    ps[0].send({ t: "answer", q: 0, a: 0 });         // tries to change to the right answer
    await settle();
    await runInDurableObject(stub, inst => { expect(inst.game.answers.size).toBe(1); expect([...inst.game.answers.values()][0].a).toBe(1); });
    teacher.send({ t: "reveal" });
    const r = await phase(ps[0], "reveal", 0);
    expect(r.result.points).toBe(0);
    expect(r.score).toBe(0);
  });

  it("rejects answers after time is up, after the reveal, and for the wrong question", async () => {
    const { teacher, ps, stub } = await setupGame({}, 2);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    ps[0].send({ t: "answer", q: 1, a: 0 });         // stale question number
    await settle();
    await runInDurableObject(stub, inst => { inst.game.endsAt = Date.now() - 1; });   // the timer has run out
    ps[0].send({ t: "answer", q: 0, a: 0 });
    await settle();
    await runInDurableObject(stub, inst => { expect(inst.game.answers.size).toBe(0); });
    teacher.send({ t: "reveal" });
    await phase(ps[1], "reveal", 0);
    ps[1].send({ t: "answer", q: 0, a: 0 });
    await settle();
    await runInDurableObject(stub, inst => { expect(inst.game.answers.size).toBe(0); for (const p of inst.game.players.values()) expect(p.score).toBe(0); });
  });

  it("scores 500 + up to 500 for speed, 0 for wrong, and nothing for polls", async () => {
    const { teacher, ps, stub } = await setupGame({ timer: 20 }, 2);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    await runInDurableObject(stub, inst => {   // pretend half the time has gone
      expect(inst.game.durationMs).toBe(30000);      // 20 s + 10 s for a code question
      inst.game.endsAt = Date.now() + inst.game.durationMs / 2;
    });
    ps[0].send({ t: "answer", q: 0, a: 0 });
    ps[1].send({ t: "answer", q: 0, a: 2 });
    const r0 = await phase(ps[0], "reveal", 0);    // everyone answered: reveals by itself
    const r1 = await phase(ps[1], "reveal", 0);
    expect(r0.result.correct).toBe(true);
    expect(r0.result.points).toBeGreaterThanOrEqual(745);
    expect(r0.result.points).toBeLessThanOrEqual(755);
    expect(r1.result.points).toBe(0);
    expect(r0.place).toBe(1); expect(r1.place).toBe(2); expect(r0.of).toBe(2);

    teacher.send({ t: "next" });
    await phase(teacher, "board");
    expect(teacher.last().leaderboard[0].name).toBe(ps[0].name);
    teacher.send({ t: "next" });
    await phase(ps[0], "question", 1);
    await runInDurableObject(stub, inst => expect(inst.game.durationMs).toBe(20000));   // no code: no bonus
    ps[0].send({ t: "answer", q: 1, a: 0 });         // answered straight away
    teacher.send({ t: "reveal" });
    const q2 = await phase(ps[0], "reveal", 1);
    expect(q2.result.points).toBeGreaterThan(990);

    teacher.send({ t: "next" }); await phase(teacher, "board");
    teacher.send({ t: "next" });
    await phase(ps[0], "question", 2);
    ps[0].send({ t: "answer", q: 2, a: 1 });
    ps[1].send({ t: "answer", q: 2, a: 1 });
    const poll = await phase(ps[0], "reveal", 2);
    expect(poll.result.poll).toBe(true);
    expect(poll.result.points).toBe(0);
    expect(poll.result.answer).toBeNull();
    expect((await phase(teacher, "reveal", 2)).reveal.counts).toEqual([0, 2, 0]);
    teacher.send({ t: "next" });
    const fin = await phase(teacher, "final");
    expect(fin.podium.map(p => p.name)).toEqual([ps[0].name, ps[1].name]);
  });

  it("closes the question by itself when the timer runs out", async () => {
    const { teacher, ps, stub } = await setupGame({}, 1);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    await runInDurableObject(stub, inst => { clearTimeout(inst.game.timer); inst.game.timer = setTimeout(() => inst.closeQuestion(), 10); });
    const r = await phase(ps[0], "reveal", 0);
    expect(r.result.answered).toBe(false);
    expect(r.result.points).toBe(0);
  });
});

describe("limits", () => {
  it("ignores messages over 2 KB", async () => {
    const { teacher, ps, stub } = await setupGame({}, 1);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    ps[0].send(JSON.stringify({ t: "answer", q: 0, a: 0, pad: "x".repeat(2100) }));
    await settle();
    await runInDurableObject(stub, inst => expect(inst.game.answers.size).toBe(0));
  });

  it("rate-limits each connection", async () => {
    const { ps, teacher } = await setupGame({}, 1);
    const before = ps[0].msgs.filter(m => m.t === "welcome").length;
    for (let i = 0; i < 40; i++) ps[0].send({ t: "reroll" });
    await new Promise(r => setTimeout(r, 300));
    const rerolls = ps[0].msgs.filter(m => m.t === "welcome").length - before;
    expect(rerolls).toBeGreaterThan(0);
    expect(rerolls).toBeLessThanOrEqual(LIMITS.rateBurst + 2);
    expect(teacher.closed).toBeNull();
  });
});

describe("ending and dropping state", () => {
  it("drops everything when the teacher presses End game", async () => {
    const { code, teacher, ps, stub } = await setupGame({}, 2);
    teacher.send({ t: "start" });
    await phase(ps[0], "question", 0);
    teacher.send({ t: "end" });
    expect((await ps[0].wait(m => m.t === "ended")).msg).toMatch(/ended/);
    await ps[1].wait(m => m.t === "ended");
    await runInDurableObject(stub, async inst => {
      expect(inst.game).toBeNull();
      expect(await inst.ctx.storage.getAlarm()).toBeNull();
      expect((await inst.ctx.storage.list()).size).toBe(0);
    });
    const again = await connect(code, { role: "pupil", token: ps[0].token });
    expect((await again.wait(m => m.t === "error")).code).toBe("no_game");
  });

  it("drops the game 10 minutes after the teacher leaves without coming back", async () => {
    const { teacher, ps, stub } = await setupGame({}, 1);
    teacher.ws.close();
    await settle();
    await runInDurableObject(stub, async inst => {
      const alarm = await inst.ctx.storage.getAlarm();
      expect(alarm - inst.game.teacherGoneAt).toBe(LIMITS.teacherGraceMs);
      inst.game.teacherGoneAt -= LIMITS.teacherGraceMs + 1000;
    });
    expect(await runDurableObjectAlarm(stub)).toBe(true);
    await ps[0].wait(m => m.t === "ended");
    await runInDurableObject(stub, inst => expect(inst.game).toBeNull());
  });

  it("keeps the game if the teacher comes back in time", async () => {
    const { code, key, teacher, stub } = await setupGame({}, 1);
    teacher.ws.close();
    await settle();
    const t2 = await connect(code, { role: "teacher", key });
    await phase(t2, "lobby");
    await runInDurableObject(stub, async inst => {
      expect(inst.game.teacherGoneAt).toBeNull();
      expect(await inst.ctx.storage.getAlarm()).toBe(inst.game.createdAt + LIMITS.gameLifetimeMs);
    });
  });

  it("drops the game 3 hours after it was created", async () => {
    const { teacher, stub } = await setupGame({}, 1);
    await runInDurableObject(stub, inst => { inst.game.createdAt -= LIMITS.gameLifetimeMs + 1000; });
    await runDurableObjectAlarm(stub);
    await teacher.wait(m => m.t === "ended");
    await runInDurableObject(stub, inst => expect(inst.game).toBeNull());
  });
});

describe("random names", () => {
  it("has enough kind words and none that could be used to tease", () => {
    expect(ADJECTIVES.length * ANIMALS.length).toBeGreaterThan(LIMITS.maxPupils * 20);
    expect(new Set(ADJECTIVES).size).toBe(ADJECTIVES.length);
    expect(new Set(ANIMALS).size).toBe(ANIMALS.length);
    const unkind = /^(big|fat|tiny|small|chubby|slow|silly|crazy|mad|wild|weird|dumb|odd|lazy|grumpy|smelly|ugly|stinky|sleepy|clumsy|cheeky|naughty|bad|loud|hairy|fluffy|dizzy|pig|cow|donkey|ass|rat|weasel|snake|slug|sloth|hippo|whale|cock|booby|tit|shrew|skunk|worm|toad|vulture|hyena|beaver|badger|goat|chicken|turkey|mole|baboon|dog|bitch|pussy)$/i;
    for (const w of [...ADJECTIVES, ...ANIMALS]) for (const part of w.split(" ")) expect(part).not.toMatch(unkind);
  });
});
