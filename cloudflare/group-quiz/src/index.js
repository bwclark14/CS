// The Daily Compute group quiz: game server.
// A Worker that creates games, and one Durable Object per game that runs it (src/game.js).
// Everything about a game (questions, pupils' random names, scores, answers) lives in memory only
// and is dropped when the game ends. Nothing about pupils is written to storage or logged.
// The protocol is described in README.md.
import { LIMITS, CODE_RE, CLOSE, MESSAGES, isAllowedOrigin, corsHeaders, json, secret, newCode, cleanQuiz, cleanSettings } from "./game.js";
export { Game } from "./game.js";

const gameStub = (env, code) => env.GAMES.get(env.GAMES.idFromName(code), { locationHint: "weur" });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/" && request.method === "GET")
      return new Response("The Daily Compute group quiz server is running.\n", { headers: { "Content-Type": "text/plain" } });
    const origin = request.headers.get("Origin");
    if (!isAllowedOrigin(origin)) return json({ error: "This server only works with The Daily Compute quiz page." }, 403);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });

    if (url.pathname === "/games" && request.method === "POST") {
      const len = +(request.headers.get("Content-Length") || 0);
      if (len > LIMITS.maxBodyBytes) return json({ error: "Question set is too big." }, 413, origin);
      const text = await request.text();
      if (text.length > LIMITS.maxBodyBytes) return json({ error: "Question set is too big." }, 413, origin);
      let quiz, settings;
      try {
        const body = JSON.parse(text);
        quiz = cleanQuiz(body.quiz);
        settings = cleanSettings(body.settings, quiz);
      } catch (e) { return json({ error: "That question set can't be used: " + e.message }, 400, origin); }
      const key = secret();
      for (let tries = 0; tries < 8; tries++) {
        const code = newCode();
        if ((await gameStub(env, code).create({ quiz, settings, key })).ok) return json({ code, key }, 201, origin);
      }
      return json({ error: "Couldn't find a free game code. Try again." }, 503, origin);
    }

    const m = url.pathname.match(/^\/games\/([^/]+)\/ws$/);
    if (m && request.method === "GET") {
      if (request.headers.get("Upgrade") !== "websocket") return json({ error: "Expected a WebSocket" }, 426, origin);
      const code = m[1].toUpperCase();
      if (!CODE_RE.test(code)) {   // can't be a real game: answer without waking a Durable Object
        const [client, server] = Object.values(new WebSocketPair());
        server.accept();
        server.send(JSON.stringify({ t: "error", code: "no_game", msg: MESSAGES.no_game }));
        server.close(CLOSE.noGame, "No game with that code");
        return new Response(null, { status: 101, webSocket: client });
      }
      return gameStub(env, code).fetch(request);
    }
    return json({ error: "Not found" }, 404, origin);
  },
};

