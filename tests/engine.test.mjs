import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  act,
  botAction,
  publicView,
  starter,
  validateDeck,
  createTournament,
  advance,
} from "../build/game/engine.js";
const players = (n) =>
  Array.from({ length: n }, (_, i) => ({
    name: `Seat ${i}`,
    bot: true,
    deck: starter,
  }));
test("deck validation rejects duplicates, unknown cards and wrong size", () => {
  for (const d of [
    [],
    Array(16).fill(starter[0]),
    [...starter.slice(1), "bad"],
    null,
  ])
    assert.throws(() => validateDeck(d));
  validateDeck(starter);
});
test("engine rejects out of turn, unavailable summons and invalid actions without mutation", () => {
  const g = createGame(players(2));
  const original = JSON.stringify(g);
  assert.throws(() => act(g, 1, { type: "end" }));
  assert.throws(() => act(g, 0, { type: "summon", index: -1 }));
  assert.throws(() => act(g, 0, { type: "cheat" }));
  assert.equal(JSON.stringify(g), original);
});
test("summons rest and ready only on own turn; attacks cannot repeat", () => {
  let g = createGame(players(2));
  g.seats[0].energy = 8;
  g = act(g, 0, { type: "summon", index: 0 });
  const uid = g.seats[0].board[0].uid;
  assert.throws(() => act(g, 0, { type: "attack", uid }));
  g = act(g, 0, { type: "end" });
  g = act(g, 1, { type: "end" });
  g = act(g, 0, { type: "attack", uid });
  assert.ok(g.cores[1] < 1000);
  assert.throws(() => act(g, 0, { type: "attack", uid }));
});
test("tag partners alternate and share core; enemy boards protect core", () => {
  let g = createGame(players(4));
  assert.deepEqual(
    g.seats.map((s) => s.team),
    [0, 1, 0, 1],
  );
  g.seats[0].energy = 8;
  g = act(g, 0, { type: "summon", index: 0 });
  g = act(g, 0, { type: "end" });
  g.seats[1].energy = 8;
  g = act(g, 1, { type: "summon", index: 0 });
  for (const seat of [1, 2, 3]) g = act(g, seat, { type: "end" });
  const u = g.seats[0].board[0];
  assert.throws(() => act(g, 0, { type: "attack", uid: u.uid }));
  assert.throws(() => act(g, 0, { type: "attack", uid: u.uid, target: u.uid }));
  g = act(g, 0, {
    type: "attack",
    uid: u.uid,
    target: g.seats[1].board[0].uid,
  });
  assert.equal(g.cores[1], 1000);
});
test("private view hides all deck order and other hands including teammate", () => {
  const g = createGame(players(4));
  const v = publicView(g, 0);
  assert.ok(v.seats[0].hand.every((id) => id !== "?"));
  assert.ok(v.seats.slice(1).every((s) => s.hand.every((id) => id === "?")));
  assert.ok(v.seats.every((s) => s.deck.every((id) => id === "?")));
  assert.notEqual(g.seats[1].hand[0], "?");
});
test("bot duels and tag duels terminate across multiple shuffled games", () => {
  for (const n of [2, 4])
    for (let i = 0; i < 20; i++) {
      let g = createGame(players(n));
      let moves = 0;
      while (g.winner === null && moves++ < 3000)
        g = act(g, g.turn, botAction(g));
      assert.notEqual(g.winner, null);
      assert.ok(g.cores.every((h) => h >= 0));
    }
});
test("signatures consume readiness and cannot be spammed", () => {
  let g = createGame(players(2));
  g.seats[0].energy = 8;
  g = act(g, 0, { type: "summon", index: 0 });
  g = act(g, 0, { type: "end" });
  g = act(g, 1, { type: "end" });
  const uid = g.seats[0].board[0].uid;
  g = act(g, 0, { type: "skill", uid });
  assert.throws(() => act(g, 0, { type: "skill", uid }));
  assert.throws(() => act(g, 0, { type: "attack", uid }));
});
test("bracket cannot overwrite results or advance unplayed matches", () => {
  let t = createTournament(["A", "B", "C", "D"]);
  assert.throws(() => advance(t, 1, 0, "A"));
  t = advance(t, 0, 0, "A");
  assert.throws(() => advance(t, 0, 0, "B"));
  t = advance(t, 0, 1, "C");
  t = advance(t, 1, 0, "A");
  assert.equal(t.rounds[2][0], "A");
});
