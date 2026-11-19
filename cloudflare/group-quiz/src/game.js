// The Daily Compute group quiz: the game itself (one Durable Object per game) and shared helpers.
// Everything about a game (questions, pupils' random names, scores, answers) lives in memory only
// and is dropped when the game ends. Nothing about pupils is written to storage or logged.
// The protocol is described in README.md.
import { DurableObject } from "cloudflare:workers";

export const LIMITS = {
  maxPupils: 60,
  maxMessageBytes: 2048,
  ratePerSecond: 5,          // messages each connection may send per second...
  rateBurst: 10,             // ...with a small burst allowance
  maxBodyBytes: 100_000,     // POST /games (the question set)
  gameLifetimeMs: 3 * 60 * 60 * 1000,
  teacherGraceMs: 10 * 60 * 1000,
  codeBonusSeconds: 10,
  timers: [10, 20, 30],
};

// Game codes: no vowels (so no accidental words) and no look-alikes (O/0, I/1/L, S/5, Z/2, B/8)
export const CODE_CHARS = "CDFGHJKMNPQRTVWXY34679";
export const CODE_RE = new RegExp(`^[${CODE_CHARS}]{6}$`);

// Random, kind names. Checked by hand: nothing about size, looks or intelligence that could be
// turned into teasing, and no animals that double as insults or rude slang.
export const ADJECTIVES = ["Swift", "Brave", "Bright", "Calm", "Cheerful", "Curious", "Gentle", "Happy", "Jolly", "Lively",
  "Lucky", "Mighty", "Nimble", "Plucky", "Sunny", "Bold", "Breezy", "Cosy", "Daring", "Eager", "Friendly", "Glowing",
  "Merry", "Proud", "Sparkly", "Speedy", "Steady", "Thoughtful", "Zippy", "Wise", "Helpful", "Hopeful", "Patient",
  "Cool", "Fearless", "Graceful", "Cosmic", "Golden", "Starry", "Kind"];
export const ANIMALS = ["Otter", "Panda", "Fox", "Owl", "Dolphin", "Penguin", "Koala", "Hare", "Puffin", "Seal", "Tiger",
  "Lion", "Falcon", "Eagle", "Robin", "Wren", "Hedgehog", "Squirrel", "Lynx", "Llama", "Zebra", "Gecko", "Turtle",
  "Lemur", "Meerkat", "Narwhal", "Octopus", "Orca", "Kiwi", "Heron", "Swan", "Starling", "Pony", "Kitten", "Moose",
  "Red Panda", "Kingfisher", "Osprey", "Wildcat", "Pine Marten"];

const TYPES = new Set(["identify", "count", "truefalse", "trace", "testdata", "ct", "poll"]);
export const CLOSE = { noGame: 4001, badKey: 4003, full: 4004, removed: 4005, ended: 4006, replaced: 4007, badRequest: 4008, finished: 4009 };
export const MESSAGES = {
  no_game: "No game with that code. Check the code on the board and try again.",
  bad_key: "This browser tab isn't the teacher of that game.",
  full: "This game is full (60 players). Tell your teacher.",
  removed: "Your teacher removed you from this game.",
  ended: "The game has ended. Thanks for playing!",
  finished: "This game has finished.",
  replaced: "This game was opened in another tab or window.",
  bad_request: "Something went wrong joining the game.",
};

export function isAllowedOrigin(origin) {
  return origin === "https://bwclark14.github.io" || /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/.test(origin || "");
}

export function corsHeaders(origin) {
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
}

export function json(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...(origin ? corsHeaders(origin) : {}) } });
}

function randomString(chars, n) {
  const out = [], max = 256 - (256 % chars.length), buf = new Uint8Array(1);
  while (out.length < n) { crypto.getRandomValues(buf); if (buf[0] < max) out.push(chars[buf[0] % chars.length]); }
  return out.join("");
}
export const newCode = () => randomString(CODE_CHARS, 6);

export function secret(bytes = 32) {      // 256-bit random, base64url
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sameSecret(a, b) {        // compare without leaking how much matched
  if (typeof a !== "string" || typeof b !== "string") return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

const str = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;

// Check a question set sent by the teacher page and keep only the fields the game uses
export function cleanQuiz(raw) {
  if (!raw || typeof raw !== "object") throw new Error("missing question set");
  if (!str(raw.title, 200)) throw new Error("missing title");
  if (!Array.isArray(raw.rounds) || raw.rounds.length < 1 || raw.rounds.length > 10) throw new Error("needs 1-10 rounds");
  let total = 0;
  const rounds = raw.rounds.map((r, ri) => {
    if (!str(r?.name, 80)) throw new Error(`round ${ri + 1}: missing name`);
    if (!Array.isArray(r.questions) || r.questions.length < 1 || r.questions.length > 30) throw new Error(`round ${ri + 1}: needs 1-30 questions`);
    total += r.questions.length;
    return { name: r.name, questions: r.questions.map((q, qi) => {
      const w = `round ${ri + 1} question ${qi + 1}`;
      if (!TYPES.has(q?.type)) throw new Error(`${w}: unknown type`);
      if (!str(q.q, 400)) throw new Error(`${w}: missing question`);
      if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4 || !q.options.every(o => str(o, 120))) throw new Error(`${w}: needs 2-4 options`);
      const poll = q.type === "poll";
      if (!poll && !(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)) throw new Error(`${w}: bad answer`);
      if (q.explain !== undefined && !(typeof q.explain === "string" && q.explain.length <= 400)) throw new Error(`${w}: explain too long`);
      let code = null;
      if (q.code !== undefined) {
        if (!Array.isArray(q.code) || q.code.length < 1 || q.code.length > 20 ||
            !q.code.every(l => typeof l?.code === "string" && l.code.length <= 120 && Number.isInteger(l.indent) && l.indent >= 0 && l.indent <= 6))
          throw new Error(`${w}: bad code`);
        code = q.code.map(l => ({ code: l.code, indent: l.indent }));
      }
      return { type: q.type, q: q.q, code, options: q.options.slice(), answer: poll ? null : q.answer, explain: q.explain || "" };
    }) };
  });
  if (total > 60) throw new Error("at most 60 questions");
  return { title: raw.title, rounds };
}

export function cleanSettings(raw, quiz, old) {
  const s = { timer: 20, rounds: quiz.rounds.map((_, i) => i), leaderboard: true, ...(old || {}) };
  if (!raw || typeof raw !== "object") return s;
  if (LIMITS.timers.includes(raw.timer)) s.timer = raw.timer;
  if (Array.isArray(raw.rounds)) {
    const r = [...new Set(raw.rounds)].filter(i => Number.isInteger(i) && i >= 0 && i < quiz.rounds.length).sort((a, b) => a - b);
    if (r.length) s.rounds = r;
  }
  if (typeof raw.leaderboard === "boolean") s.leaderboard = raw.leaderboard;
  return s;
}

// One game. Uses ordinary (non-hibernating) WebSockets on purpose: hibernation would wipe the
// in-memory game while the class is still playing, and nothing about pupils may go to storage.
export class Game extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.game = null;
  }

  // ---------- creation and ending ----------
  async create({ quiz, settings, key }) {
    if (this.game) return { ok: false };   // code already in use: the Worker picks another
    const now = Date.now();
    this.game = {
      key, quiz, settings, createdAt: now, teacherGoneAt: null,
      phase: "lobby", order: [], index: -1, openedAt: 0, endsAt: 0, durationMs: 0,
      answers: new Map(),       // player id -> { a, at, points } for the open question
      players: new Map(),       // token -> player
      kicked: new Set(),        // tokens the teacher removed
      teacher: null, conns: new Set(), timer: null,
    };
    await this.scheduleAlarm();
    return { ok: true };
  }

  async scheduleAlarm() {
    const g = this.game; if (!g) return;
    let at = g.createdAt + LIMITS.gameLifetimeMs;
    if (g.teacherGoneAt) at = Math.min(at, g.teacherGoneAt + LIMITS.teacherGraceMs);
    await this.ctx.storage.setAlarm(at);
  }

  async alarm() {
    const g = this.game;
    if (!g) { await this.ctx.storage.deleteAll(); return; }
    const now = Date.now();
    if (now >= g.createdAt + LIMITS.gameLifetimeMs || (g.teacherGoneAt && now >= g.teacherGoneAt + LIMITS.teacherGraceMs)) await this.endGame();
    else await this.scheduleAlarm();
  }

  async endGame() {
    const g = this.game; if (!g) return;
    this.game = null;           // drop everything: questions, names, tokens, scores, answers
    clearTimeout(g.timer);
    for (const c of g.conns) { try { c.ws.send(JSON.stringify({ t: "ended", msg: MESSAGES.ended })); c.ws.close(CLOSE.ended, "Game ended"); } catch {} }
    g.conns.clear(); g.players.clear(); g.answers.clear(); g.kicked.clear();
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  // ---------- connections ----------
  async fetch(request) {
    const url = new URL(request.url);
    const [client, ws] = Object.values(new WebSocketPair());
    ws.accept();
    const refuse = (code, closeCode) => {
      ws.send(JSON.stringify({ t: "error", code, msg: MESSAGES[code] }));
      ws.close(closeCode, MESSAGES[code].slice(0, 100));
      return new Response(null, { status: 101, webSocket: client });
    };
    const g = this.game;
    if (!g) return refuse("no_game", CLOSE.noGame);
    const role = url.searchParams.get("role");
    const conn = { ws, role, player: null, tokens: LIMITS.rateBurst, last: Date.now(), dropped: 0 };

    if (role === "teacher") {
      if (!sameSecret(url.searchParams.get("key"), g.key)) return refuse("bad_key", CLOSE.badKey);
      if (g.teacher) this.drop(g.teacher, "replaced", CLOSE.replaced);
      g.teacher = conn; g.teacherGoneAt = null;
      await this.scheduleAlarm();
    } else if (role === "pupil") {
      const token = url.searchParams.get("token") || "";
      if (token && g.kicked.has(token)) return refuse("removed", CLOSE.removed);
      let p = token ? g.players.get(token) : null;
      if (p) {
        if (p.conn) this.drop(p.conn, "replaced", CLOSE.replaced);
      } else {
        if (g.phase === "final") return refuse("finished", CLOSE.finished);
        if (g.players.size >= LIMITS.maxPupils) return refuse("full", CLOSE.full);
        p = { id: secret(9), token: secret(16), name: this.freshName(), score: 0, from: g.phase === "lobby" ? 0 : g.index + 1, joined: Date.now(), conn: null, last: null };
        g.players.set(p.token, p);
      }
      p.conn = conn; conn.player = p;
      ws.send(JSON.stringify({ t: "welcome", role: "pupil", token: p.token, name: p.name }));
    } else return refuse("bad_request", CLOSE.badRequest);

    g.conns.add(conn);
    ws.addEventListener("message", ev => { this.onMessage(conn, ev.data); });
    ws.addEventListener("close", () => { this.onClose(conn); });
    ws.addEventListener("error", () => { this.onClose(conn); });
    if (role === "teacher") ws.send(JSON.stringify({ t: "welcome", role: "teacher" }));
    this.broadcast();
    return new Response(null, { status: 101, webSocket: client });
  }

  drop(conn, code, closeCode) {
    const g = this.game;
    if (g) g.conns.delete(conn);
    conn.gone = true;
    try { conn.ws.send(JSON.stringify({ t: "error", code, msg: MESSAGES[code] })); conn.ws.close(closeCode, MESSAGES[code].slice(0, 100)); } catch {}
  }

  async onClose(conn) {
    const g = this.game;
    if (!g || conn.closed) return;
    conn.closed = true;
    g.conns.delete(conn);
    if (conn.player && conn.player.conn === conn) conn.player.conn = null;
    if (g.teacher === conn) { g.teacher = null; g.teacherGoneAt = Date.now(); await this.scheduleAlarm(); }
    this.broadcast();
  }

  allow(conn, data) {
    if (typeof data !== "string" || data.length > LIMITS.maxMessageBytes) return false;
    if (data.length * 3 > LIMITS.maxMessageBytes && new TextEncoder().encode(data).length > LIMITS.maxMessageBytes) return false;
    const now = Date.now();
    conn.tokens = Math.min(LIMITS.rateBurst, conn.tokens + (now - conn.last) / 1000 * LIMITS.ratePerSecond);
    conn.last = now;
    if (conn.tokens < 1) { if (++conn.dropped > 200) conn.ws.close(1008, "Too many messages"); return false; }
    conn.tokens -= 1;
    return true;
  }

  async onMessage(conn, data) {
    const g = this.game;
    if (!g || conn.gone || !this.allow(conn, data)) return;
    let m; try { m = JSON.parse(data); } catch { return; }
    if (!m || typeof m.t !== "string") return;
    if (m.t === "ping") { conn.ws.send('{"t":"pong"}'); return; }
    if (conn === g.teacher) return this.teacherMessage(m);
    if (conn.player && conn.player.conn === conn) return this.pupilMessage(conn.player, m);
  }

  // ---------- teacher controls ----------
  async teacherMessage(m) {
    const g = this.game;
    switch (m.t) {
      case "settings":
        if (g.phase !== "lobby") return;
        g.settings = cleanSettings(m, g.quiz, g.settings);
        return this.broadcast();
      case "start":
        if (g.phase !== "lobby") return;
        g.order = [];
        g.settings.rounds.forEach(r => g.quiz.rounds[r].questions.forEach((q, i) => g.order.push({ r, i })));
        return this.openNext();
      case "reveal":
        return this.closeQuestion();
      case "next":
        if (g.phase === "reveal") {
          const last = g.index >= g.order.length - 1;
          if (!last && g.settings.leaderboard) { g.phase = "board"; return this.broadcast(); }
          return this.openNext();
        }
        if (g.phase === "board") return this.openNext();
        return;
      case "kick": {
        const p = [...g.players.values()].find(x => x.id === m.id);
        if (!p) return;
        g.kicked.add(p.token); g.players.delete(p.token); g.answers.delete(p.id);
        if (p.conn) this.drop(p.conn, "removed", CLOSE.removed);
        this.broadcast();
        return this.checkAllAnswered();
      }
      case "end":
        return this.endGame();
    }
  }

  // ---------- pupil actions ----------
  pupilMessage(p, m) {
    const g = this.game;
    if (m.t === "reroll") {
      if (g.phase !== "lobby") return;
      p.name = this.freshName(p.name);
      p.conn.ws.send(JSON.stringify({ t: "welcome", role: "pupil", token: p.token, name: p.name }));
      return this.broadcast();
    }
    if (m.t === "answer") {
      const now = Date.now();
      if (g.phase !== "question" || m.q !== g.index || now > g.endsAt) return this.sendTo(p);   // closed or stale: nothing accepted
      if (g.index < p.from || g.answers.has(p.id)) return this.sendTo(p);                     // late joiner, or already answered
      const q = this.current();
      if (!(Number.isInteger(m.a) && m.a >= 0 && m.a < q.options.length)) return;
      const speed = Math.max(0, Math.min(1, (g.endsAt - now) / g.durationMs));
      const points = q.type !== "poll" && m.a === q.answer ? 500 + Math.round(500 * speed) : 0;
      g.answers.set(p.id, { a: m.a, at: now, points });
      this.sendTo(p); this.sendTeacher();
      return this.checkAllAnswered();
    }
  }

  freshName(old) {
    const used = new Set([...this.game.players.values()].map(p => p.name));
    const pick = a => a[Math.floor(Math.random() * a.length)];
    for (let i = 0; i < 200; i++) { const n = pick(ADJECTIVES) + " " + pick(ANIMALS); if (!used.has(n) && n !== old) return n; }
    for (const a of ADJECTIVES) for (const b of ANIMALS) { const n = a + " " + b; if (!used.has(n) && n !== old) return n; }
    return old;
  }

  // ---------- questions ----------
  current() { const g = this.game, o = g.order[g.index]; return o ? g.quiz.rounds[o.r].questions[o.i] : null; }

  openNext() {
    const g = this.game;
    clearTimeout(g.timer);
    if (g.index + 1 >= g.order.length) { g.phase = "final"; return this.broadcast(); }
    g.index++;
    const q = this.current();
    g.durationMs = (g.settings.timer + (q.code ? LIMITS.codeBonusSeconds : 0)) * 1000;
    g.openedAt = Date.now(); g.endsAt = g.openedAt + g.durationMs;
    g.answers = new Map();
    g.phase = "question";
    g.timer = setTimeout(() => this.closeQuestion(), g.durationMs);
    this.broadcast();
  }

  // Ends the question (time up, all answered, or the teacher pressed Show answer) and adds up the points
  closeQuestion() {
    const g = this.game;
    if (!g || g.phase !== "question") return;
    clearTimeout(g.timer);
    g.phase = "reveal";
    g.endsAt = Math.min(g.endsAt, Date.now());
    for (const p of g.players.values()) {
      if (g.index < p.from) { p.last = null; continue; }
      const ans = g.answers.get(p.id);
      p.score += ans ? ans.points : 0;
      p.last = { answered: !!ans, choice: ans ? ans.a : null, points: ans ? ans.points : 0 };
    }
    this.broadcast();
  }

  checkAllAnswered() {
    const g = this.game;
    if (!g || g.phase !== "question") return;
    const waiting = [...g.players.values()].filter(p => p.conn && g.index >= p.from && !g.answers.has(p.id));
    const eligible = [...g.players.values()].filter(p => g.index >= p.from);
    if (eligible.length && !waiting.length) this.closeQuestion();
  }

  // ---------- what each device is sent ----------
  // Never includes the correct answer or explanation until the reveal.
  publicQuestion() {
    const g = this.game, q = this.current(), o = g.order[g.index];
    return { n: g.index + 1, total: g.order.length, round: g.quiz.rounds[o.r].name, type: q.type, poll: q.type === "poll",
      q: q.q, code: q.code, options: q.options };
  }

  reveal() {
    const g = this.game, q = this.current();
    const counts = q.options.map(() => 0);
    for (const [id, a] of g.answers) if ([...g.players.values()].some(p => p.id === id)) counts[a.a]++;
    return { answer: q.type === "poll" ? null : q.answer, explain: q.explain, counts };
  }

  ranked() { return [...this.game.players.values()].sort((a, b) => b.score - a.score || a.joined - b.joined); }
  place(p) { let n = 1; for (const x of this.game.players.values()) if (x.score > p.score) n++; return n; }

  common() {
    const g = this.game;
    const s = { t: "state", phase: g.phase, total: g.order.length, index: g.index, players: g.players.size };
    if (g.phase === "question" || g.phase === "reveal") {
      s.question = this.publicQuestion();
      s.durationMs = g.durationMs;
      s.endsInMs = g.phase === "question" ? Math.max(0, g.endsAt - Date.now()) : 0;
    }
    return s;
  }

  teacherState() {
    const g = this.game, s = this.common();
    s.role = "teacher"; s.title = g.quiz.title; s.settings = g.settings;
    s.rounds = g.quiz.rounds.map(r => ({ name: r.name, count: r.questions.length }));
    s.questionCount = g.settings.rounds.reduce((n, r) => n + g.quiz.rounds[r].questions.length, 0);
    s.list = [...g.players.values()].sort((a, b) => a.joined - b.joined).map(p => ({ id: p.id, name: p.name, score: p.score, connected: !!p.conn }));
    if (g.phase === "question" || g.phase === "reveal") {
      const eligible = [...g.players.values()].filter(p => g.index >= p.from);
      s.answered = eligible.filter(p => g.answers.has(p.id)).length;
      s.expected = eligible.length;
    }
    if (g.phase === "reveal") s.reveal = this.reveal();
    if (g.phase === "board") s.leaderboard = this.ranked().slice(0, 5).map(p => ({ name: p.name, score: p.score, place: this.place(p) }));
    if (g.phase === "final") s.podium = this.ranked().slice(0, 3).map(p => ({ name: p.name, score: p.score, place: this.place(p) }));
    return s;
  }

  pupilState(p) {
    const g = this.game, s = this.common();
    s.role = "pupil"; s.name = p.name; s.score = p.score;
    if (g.phase === "question" || g.phase === "reveal") {
      s.late = g.index < p.from;
      const mine = g.answers.get(p.id);
      s.answered = !!mine; s.choice = mine ? mine.a : null;   // their own choice only, never whether it is right
    }
    if (g.phase === "reveal" && !s.late) {
      const r = this.reveal(), q = this.current();
      s.result = { answer: r.answer, explain: r.explain, poll: q.type === "poll", answered: !!p.last?.answered, choice: p.last?.choice ?? null,
        correct: q.type !== "poll" && !!p.last?.answered && p.last.choice === q.answer, points: p.last?.points || 0 };
    }
    if (g.phase === "reveal" || g.phase === "board" || g.phase === "final") { s.place = this.place(p); s.of = g.players.size; }
    return s;
  }

  sendTo(p) { if (p.conn) try { p.conn.ws.send(JSON.stringify(this.pupilState(p))); } catch {} }
  sendTeacher() { const g = this.game; if (g?.teacher) try { g.teacher.ws.send(JSON.stringify(this.teacherState())); } catch {} }
  broadcast() {
    const g = this.game; if (!g) return;
    this.sendTeacher();
    for (const p of g.players.values()) this.sendTo(p);
  }
}
