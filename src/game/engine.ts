import { INITIAL_CARDS } from "../data/cardsData.js";
export const catalog = Object.fromEntries(INITIAL_CARDS.map((c) => [c.id, c]));
export const starter = INITIAL_CARDS.slice(0, 16).map((c) => c.id);
export const cost = (id: string) =>
  Math.max(
    1,
    Math.min(
      5,
      Math.round(
        (catalog[id].attack + catalog[id].hp + catalog[id].defense) / 600,
      ) - 1,
    ),
  );
export const power = (id: string) => Math.round(catalog[id].attack / 10);
export const vitality = (id: string) => Math.round(catalog[id].hp / 5);
export const armor = (id: string) => Math.round(catalog[id].defense / 40);
export function skill(id: string) {
  const e = catalog[id].element;
  if (["Nature", "Water", "Divine"].includes(e))
    return "Restore 50 HP to every allied unit and 80 to your team core.";
  if (["Earth", "Steel"].includes(e))
    return "Give every allied unit 60 shield (maximum 120).";
  if (["Arcane", "Celestial"].includes(e))
    return "Draw a card and restore 1 energy.";
  return "Deal 40 damage to every enemy unit and 40 to their core.";
}
export type Unit = {
  uid: string;
  id: string;
  hp: number;
  shield: number;
  ready: boolean;
  used: boolean;
};
export type Seat = {
  name: string;
  bot: boolean;
  team: number;
  deck: string[];
  hand: string[];
  board: Unit[];
  energy: number;
  maxEnergy: number;
  fatigue: number;
};
export type Game = {
  seats: Seat[];
  cores: number[];
  turn: number;
  round: number;
  winner: number | null;
  serial: number;
  log: string[];
  revision: number;
};
export type Action =
  | { type: "summon"; index: number }
  | { type: "attack"; uid: string; target?: string }
  | { type: "skill"; uid: string }
  | { type: "end" }
  | { type: "concede" };
export function validateDeck(deck: unknown): asserts deck is string[] {
  if (
    !Array.isArray(deck) ||
    deck.length !== 16 ||
    deck.some((id) => typeof id !== "string" || !catalog[id]) ||
    new Set(deck).size !== 16
  )
    throw Error("Choose exactly 16 different cards.");
}
function shuffle(deck: string[], random: () => number) {
  const a = [...deck];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function log(g: Game, line: string) {
  g.log = [...g.log.slice(-29), line];
}
function draw(g: Game, s: Seat) {
  const id = s.deck.pop();
  if (id) {
    if (s.hand.length < 8) s.hand.push(id);
    else log(g, `${s.name}'s full hand discards ${catalog[id].title}.`);
  } else {
    s.fatigue += 40;
    g.cores[s.team] -= s.fatigue;
    log(g, `${s.name} takes ${s.fatigue} fatigue damage.`);
  }
}
function check(g: Game) {
  g.cores = g.cores.map((h) => Math.max(0, h));
  if (g.cores.some((h) => h === 0)) g.winner = g.cores[0] === 0 ? 1 : 0;
}
export function createGame(
  players: { name: string; bot: boolean; deck: string[] }[],
  random = Math.random,
): Game {
  if (![2, 4].includes(players.length))
    throw Error("Duels require 2 or 4 seats.");
  players.forEach((p) => validateDeck(p.deck));
  const g: Game = {
    seats: players.map((p, i) => ({
      name: p.name.slice(0, 24),
      bot: p.bot,
      team: i % 2,
      deck: shuffle(p.deck, random),
      hand: [],
      board: [],
      energy: 3,
      maxEnergy: 3,
      fatigue: 0,
    })),
    cores: [1000, 1000],
    turn: 0,
    round: 1,
    winner: null,
    serial: 0,
    log: ["The celestial gate opens."],
    revision: 0,
  };
  g.seats.forEach((s) => {
    for (let i = 0; i < 4; i++) draw(g, s);
  });
  return g;
}
export function act(state: Game, actor: number, action: Action): Game {
  if (state.winner !== null) throw Error("This duel has ended.");
  if (actor !== state.turn) throw Error("Wait for your turn.");
  const g = structuredClone(state),
    s = g.seats[actor],
    enemies = g.seats.filter((p) => p.team !== s.team),
    allies = g.seats.filter((p) => p.team === s.team);
  const unit =
    "uid" in action ? s.board.find((u) => u.uid === action.uid) : undefined;
  switch (action.type) {
    case "summon": {
      if (
        !Number.isInteger(action.index) ||
        action.index < 0 ||
        action.index >= s.hand.length
      )
        throw Error("Invalid card.");
      const id = s.hand[action.index];
      if (s.board.length >= 3) throw Error("Your three summon lanes are full.");
      if (s.energy < cost(id)) throw Error("Not enough energy.");
      s.energy -= cost(id);
      s.hand.splice(action.index, 1);
      s.board.push({
        uid: `u${++g.serial}`,
        id,
        hp: vitality(id),
        shield: 0,
        ready: false,
        used: false,
      });
      log(g, `${s.name} summons ${catalog[id].title}.`);
      break;
    }
    case "attack": {
      if (!unit?.ready) throw Error("This unit cannot attack yet.");
      const targets = enemies.flatMap((p) => p.board),
        target = targets.find((u) => u.uid === action.target);
      if (targets.length && !target)
        throw Error("Defeat the opposing units before attacking their core.");
      if (action.target && !target) throw Error("Invalid target.");
      const resonance =
        allies
          .flatMap((p) => p.board)
          .filter((u) => catalog[u.id].element === catalog[unit.id].element)
          .length >= 2
          ? 15
          : 0;
      let damage = power(unit.id) + resonance;
      if (target) {
        damage = Math.max(10, damage - armor(target.id));
        const absorbed = Math.min(target.shield, damage);
        target.shield -= absorbed;
        target.hp -= damage - absorbed;
      } else g.cores[1 - s.team] -= damage;
      unit.ready = false;
      log(
        g,
        `${catalog[unit.id].title} strikes ${target ? catalog[target.id].title : "the enemy core"} for ${damage}.`,
      );
      break;
    }
    case "skill": {
      if (!unit || unit.used) throw Error("Signature already used this turn.");
      if (!unit.ready)
        throw Error("Signature requires a ready unit and consumes its attack.");
      if (s.energy < 2) throw Error("Signatures cost 2 energy.");
      s.energy -= 2;
      unit.used = true;
      unit.ready = false;
      const e = catalog[unit.id].element;
      if (["Nature", "Water", "Divine"].includes(e)) {
        allies.forEach((p) =>
          p.board.forEach((u) => (u.hp = Math.min(vitality(u.id), u.hp + 50))),
        );
        g.cores[s.team] = Math.min(1000, g.cores[s.team] + 80);
      } else if (["Earth", "Steel"].includes(e))
        allies.forEach((p) =>
          p.board.forEach((u) => (u.shield = Math.min(120, u.shield + 60))),
        );
      else if (["Arcane", "Celestial"].includes(e)) {
        draw(g, s);
        s.energy++;
      } else {
        enemies.forEach((p) =>
          p.board.forEach((u) => {
            const absorbed = Math.min(u.shield, 40);
            u.shield -= absorbed;
            u.hp -= 40 - absorbed;
          }),
        );
        g.cores[1 - s.team] -= 40;
      }
      log(
        g,
        `${catalog[unit.id].title} activates ${catalog[unit.id].abilityName}.`,
      );
      break;
    }
    case "concede":
      g.cores[s.team] = 0;
      log(g, `${s.name} concedes.`);
      break;
    case "end": {
      g.turn = (g.turn + 1) % g.seats.length;
      g.round++;
      const next = g.seats[g.turn];
      next.maxEnergy = Math.min(8, next.maxEnergy + 1);
      next.energy = next.maxEnergy;
      next.board.forEach((u) => {
        u.ready = true;
        u.used = false;
      });
      draw(g, next);
      log(g, `${next.name}'s turn.`);
      break;
    }
    default:
      throw Error("Unknown action.");
  }
  g.seats.forEach((p) => (p.board = p.board.filter((u) => u.hp > 0)));
  check(g);
  g.revision++;
  return g;
}
export function botAction(g: Game): Action {
  const s = g.seats[g.turn];
  const index = s.hand.findIndex((id) => cost(id) <= s.energy);
  if (index >= 0 && s.board.length < 3) return { type: "summon", index };
  const unit = s.board.find((u) => u.ready);
  if (unit) {
    const e = catalog[unit.id].element;
    if (
      s.energy >= 2 &&
      !unit.used &&
      (["Fire", "Dark", "Shadow", "Chaos", "Lightning", "Wind"].includes(e) ||
        (["Nature", "Water", "Divine"].includes(e) && g.cores[s.team] < 800))
    )
      return { type: "skill", uid: unit.uid };
    const target = g.seats
      .filter((p) => p.team !== s.team)
      .flatMap((p) => p.board)
      .sort((a, b) => a.hp - b.hp)[0];
    return { type: "attack", uid: unit.uid, target: target?.uid };
  }
  return { type: "end" };
}
export function publicView(g: Game, seat: number): Game {
  const view = structuredClone(g);
  view.seats.forEach((s, i) => {
    s.deck = s.deck.map(() => "?");
    if (i !== seat) s.hand = s.hand.map(() => "?");
  });
  return view;
}
export type Tournament = {
  names: string[];
  rounds: (string | null)[][];
  current: number;
};
export function createTournament(names: string[]): Tournament {
  if (
    ![4, 8, 16].includes(names.length) ||
    names.some((n) => !n.trim()) ||
    new Set(names).size !== names.length
  )
    throw Error("Enter 4, 8, or 16 unique names.");
  return {
    names,
    rounds: [
      names,
      ...Array.from({ length: Math.log2(names.length) }, (_, i) =>
        Array<string | null>(names.length / 2 ** (i + 1)).fill(null),
      ),
    ],
    current: 0,
  };
}
export function advance(
  t: Tournament,
  round: number,
  match: number,
  name: string,
): Tournament {
  if (
    !t.rounds[round + 1] ||
    t.rounds[round + 1][match] ||
    !t.rounds[round][match * 2] ||
    !t.rounds[round][match * 2 + 1] ||
    !t.rounds[round].slice(match * 2, match * 2 + 2).includes(name)
  )
    throw Error("Invalid bracket result.");
  const next = structuredClone(t);
  next.rounds[round + 1][match] = name;
  return next;
}
