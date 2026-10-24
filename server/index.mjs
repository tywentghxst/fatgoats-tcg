import http from "node:http";
import { randomBytes, createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { OAuth2Client } from "google-auth-library";
import {
  createGame,
  act,
  botAction,
  publicView,
  starter,
  validateDeck,
} from "../build/game/engine.js";
const port = Number(process.env.PORT || 3000);
await mkdir(process.env.DATA_DIR || "./var", { recursive: true });
const db = new DatabaseSync(
  path.join(process.env.DATA_DIR || "./var", "clash.sqlite"),
);
db.exec(
  "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, data TEXT); CREATE TABLE IF NOT EXISTS saves (id TEXT PRIMARY KEY, data TEXT, version INTEGER); CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, user TEXT, expires INTEGER);",
);
const google = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const hash = (v) => createHash("sha256").update(v).digest("hex");
const token = () => randomBytes(32).toString("hex");
const load = (code) => {
  const row = db.prepare("SELECT data FROM rooms WHERE code=?").get(code);
  if (!row) throw Error("Room not found.");
  return JSON.parse(row.data);
};
const save = (room) =>
  db
    .prepare("INSERT OR REPLACE INTO rooms VALUES (?,?)")
    .run(room.code, JSON.stringify(room));
const view = (r, seat) => ({
  code: r.code,
  seat,
  mode: r.mode,
  players: r.players.map((p) => p && { name: p.name, bot: p.bot }),
  game: r.game && publicView(r.game, seat),
});
const rates = new Map();
function account(req) {
  const key = /(?:^|; )fg_session=([^;]+)/.exec(req.headers.cookie || "")?.[1];
  const row =
    key &&
    db
      .prepare("SELECT user FROM sessions WHERE token=? AND expires>?")
      .get(hash(key), Date.now());
  if (!row) throw Error("Sign in to use cloud saves.");
  return row.user;
}
async function body(req) {
  let text = "";
  for await (const chunk of req) {
    text += chunk;
    if (text.length > 20000) throw Error("Request too large.");
  }
  return text ? JSON.parse(text) : {};
}
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".png": "image/png",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
};
const server = http.createServer(async (req, res) => {
  const reply = (status, data) => {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, "http://localhost");
    if (!url.pathname.startsWith("/api/")) {
      let file = path.resolve(
        "dist",
        "." +
          decodeURIComponent(
            url.pathname === "/" ? "/index.html" : url.pathname,
          ),
      );
      if (!file.startsWith(path.resolve("dist") + path.sep))
        return reply(403, { error: "Forbidden" });
      try {
        const data = await readFile(file);
        res.writeHead(200, {
          "Content-Type":
            mime[path.extname(file)] || "application/octet-stream",
          "X-Content-Type-Options": "nosniff",
        });
        res.end(data);
      } catch {
        reply(404, { error: "Not found. Build the client first." });
      }
      return;
    }
    if (
      req.headers.origin &&
      new URL(req.headers.origin).host !== req.headers.host
    )
      return reply(403, { error: "Origin not allowed." });
    const ip = req.socket.remoteAddress;
    const rate = rates.get(ip) || { at: Date.now(), n: 0 };
    if (Date.now() - rate.at > 60000) {
      rate.at = Date.now();
      rate.n = 0;
    }
    rates.set(ip, rate);
    if (++rate.n > 360) return reply(429, { error: "Please slow down." });
    const data =
      req.method === "POST" || req.method === "PUT" ? await body(req) : {};
    if (url.pathname === "/api/config")
      return reply(200, {
        googleClientId: process.env.GOOGLE_CLIENT_ID || null,
      });
    if (url.pathname === "/api/auth/google" && req.method === "POST") {
      if (!process.env.GOOGLE_CLIENT_ID)
        throw Error("Google sign-in is not configured on this server.");
      const ticket = await google.verifyIdToken({
        idToken: data.credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload?.sub || !payload.email_verified)
        throw Error("Unverified Google account.");
      const key = token();
      db.prepare("INSERT INTO sessions VALUES (?,?,?)").run(
        hash(key),
        payload.sub,
        Date.now() + 7 * 86400000,
      );
      res.setHeader(
        "Set-Cookie",
        `fg_session=${key}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
      );
      return reply(200, { signedIn: true });
    }
    if (url.pathname === "/api/save") {
      const id = account(req);
      const row = db
        .prepare("SELECT data,version FROM saves WHERE id=?")
        .get(id);
      if (req.method === "GET")
        return reply(200, {
          save: row ? JSON.parse(row.data) : null,
          version: row?.version || 0,
        });
      if (req.method !== "PUT") throw Error("Method not allowed.");
      validateDeck(data.save?.deck);
      if (data.version !== (row?.version || 0))
        return reply(409, {
          error: "Cloud save changed. Load it before saving again.",
        });
      const value = {
        deck: data.save.deck,
        name: String(data.save.name || "Duelist").slice(0, 24),
      };
      db.prepare("INSERT OR REPLACE INTO saves VALUES (?,?,?)").run(
        id,
        JSON.stringify(value),
        (row?.version || 0) + 1,
      );
      return reply(200, { version: (row?.version || 0) + 1 });
    }
    if (url.pathname === "/api/rooms" && req.method === "POST") {
      validateDeck(data.deck);
      const code = randomBytes(4).toString("hex").toUpperCase(),
        key = token();
      const r = {
        code,
        mode: data.mode === "tag" ? "tag" : "duel",
        players: [
          {
            name: String(data.name || "Host").slice(0, 24),
            bot: false,
            deck: data.deck,
            key: hash(key),
          },
        ],
        game: null,
        updated: Date.now(),
      };
      save(r);
      return reply(200, { ...view(r, 0), token: key });
    }
    const match =
      /^\/api\/rooms\/([A-F0-9]{8})(?:\/(join|start|action))?$/.exec(
        url.pathname,
      );
    if (!match) return reply(404, { error: "Not found" });
    const r = load(match[1]),
      operation = match[2];
    if (operation === "join" && req.method === "POST") {
      if (r.game || r.players.length >= (r.mode === "tag" ? 4 : 2))
        throw Error("Room is full or has started.");
      validateDeck(data.deck);
      const key = token(),
        seat = r.players.length;
      r.players.push({
        name: String(data.name || "Duelist").slice(0, 24),
        bot: false,
        deck: data.deck,
        key: hash(key),
      });
      r.updated = Date.now();
      save(r);
      return reply(200, { ...view(r, seat), token: key });
    }
    const seat = r.players.findIndex(
      (p) => p.key && p.key === hash(String(req.headers["x-room-token"] || "")),
    );
    if (seat < 0) return reply(403, { error: "Room access denied." });
    if (operation === "start" && req.method === "POST") {
      if (seat !== 0 || r.game)
        throw Error("Only the host can start an unstarted room.");
      while (r.players.length < (r.mode === "tag" ? 4 : 2))
        r.players.push({
          name: `Celestial Bot ${r.players.length}`,
          bot: true,
          deck: starter,
        });
      r.game = createGame(r.players);
      r.updated = Date.now();
      save(r);
    } else if (operation === "action" && req.method === "POST") {
      if (!r.game || data.revision !== r.game.revision)
        return reply(409, { error: "Duel changed. Wait for the latest turn." });
      r.game = act(r.game, seat, data.action);
      r.updated = Date.now();
      save(r);
    } else if (operation || req.method !== "GET")
      throw Error("Method not allowed.");
    reply(200, view(r, seat));
  } catch (error) {
    reply(400, { error: error.message || "Request failed." });
  }
});
setInterval(() => {
  for (const row of db.prepare("SELECT data FROM rooms").all()) {
    const r = JSON.parse(row.data);
    if (Date.now() - r.updated > 86400000) {
      db.prepare("DELETE FROM rooms WHERE code=?").run(r.code);
      continue;
    }
    if (r.game && r.game.winner === null && r.game.seats[r.game.turn].bot) {
      r.game = act(r.game, r.game.turn, botAction(r.game));
      save(r);
    }
  }
  for (const [ip, rate] of rates)
    if (Date.now() - rate.at > 60000) rates.delete(ip);
  db.prepare("DELETE FROM sessions WHERE expires<?").run(Date.now());
}, 700).unref();
server.listen(port, "0.0.0.0", () =>
  console.log(`FatGoats TCG listening on ${port}`),
);
