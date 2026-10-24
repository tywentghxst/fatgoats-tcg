import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Swords,
  Layers,
  Trophy,
  Users,
  ArrowRight,
  Shield,
  Zap,
  Volume2,
  VolumeX,
  BookOpen,
  Cloud,
  Home,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
const Collection = lazy(() => import("./CollectionApp"));
import { INITIAL_CARDS, CARD_BACK_THUMB } from "./data/cardsData";
import {
  act,
  advance,
  armor,
  botAction,
  catalog,
  cost,
  createGame,
  createTournament,
  power,
  skill,
  starter,
  validateDeck,
  vitality,
  type Action,
  type Game,
  type Tournament,
  type Unit,
} from "./game/engine";
import { read, write } from "./game/storage";
import { sound } from "./utils/audio";
import "./game/clash.css";
type Room = {
  code: string;
  token?: string;
  seat: number;
  mode: string;
  players: { name: string; bot: boolean }[];
  game: Game | null;
};
const validStoredDeck = () => {
  const d = read<unknown>("clash.deck", starter);
  return Array.isArray(d) &&
    d.length <= 16 &&
    new Set(d).size === d.length &&
    d.every((id) => typeof id === "string" && catalog[id])
    ? (d as string[])
    : starter;
};
async function api(
  url: string,
  method = "GET",
  data?: unknown,
  token?: string,
) {
  const res = await fetch("/api" + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "X-Room-Token": token } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  const value = await res.json();
  if (!res.ok) throw Error(value.error || "Server unavailable.");
  return value;
}
export function App() {
  const [tab, setTab] = useState("home"),
    [deck, setDeck] = useState<string[]>(validStoredDeck),
    [name, setName] = useState(read("clash.name", "Duelist"));
  const [game, setGame] = useState<Game | null>(null),
    [room, setRoom] = useState<Room | null>(() => read("clash.room", null)),
    [code, setCode] = useState("");
  const [mode, setMode] = useState("duel"),
    [error, setError] = useState(""),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<string | null>(null),
    [inspect, setInspect] = useState<string | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(() =>
      read("clash.tournament", null),
    ),
    [names, setNames] = useState("You\nToaster\nDonovan\nYungdueler");
  const [muted, setMuted] = useState(!sound.isEnabled()),
    [help, setHelp] = useState(false),
    [busy, setBusy] = useState(false),
    [cloudVersion, setCloudVersion] = useState(0),
    [signedIn, setSignedIn] = useState(false),
    [googleId, setGoogleId] = useState<string | null>(null);
  const [bracketMatch, setBracketMatch] = useState<{
    round: number;
    match: number;
    names: string[];
  } | null>(null);
  const googleButton = useRef<HTMLDivElement>(null);
  const current = room?.game || game,
    seat = room ? room.seat : 0;
  const myTeam = current?.seats[seat]?.team ?? 0,
    myTurn = current?.turn === seat && current?.winner === null;
  useEffect(() => {
    if (!write("clash.deck", deck))
      setError("Device storage is full; your deck could not be saved.");
  }, [deck]);
  useEffect(() => {
    write("clash.name", name);
  }, [name]);
  useEffect(() => {
    write("clash.tournament", tournament);
  }, [tournament]);
  useEffect(() => {
    write("clash.room", room);
  }, [room]);
  useEffect(() => {
    api("/config")
      .then((v) => setGoogleId(v.googleClientId))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (tab !== "online" || !googleId) return;
    let cancelled = false;
    const mount = () => {
      const google = (window as any).google;
      if (cancelled || !googleButton.current || !google) return;
      google.accounts.id.initialize({
        client_id: googleId,
        callback: async (response: any) => {
          try {
            await api("/auth/google", "POST", {
              credential: response.credential,
            });
            setSignedIn(true);
            setError(
              "Signed in. Load your cloud deck or save this device’s deck.",
            );
          } catch (e) {
            setError((e as Error).message);
          }
        },
      });
      google.accounts.id.renderButton(googleButton.current, {
        theme: "filled_black",
        size: "large",
      });
    };
    if ((window as any).google) mount();
    else {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.onload = mount;
      script.onerror = () => setError("Google sign-in could not load.");
      document.head.appendChild(script);
    }
    return () => {
      cancelled = true;
    };
  }, [googleId, tab]);
  useEffect(() => {
    if (!room?.code) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const next = await api(
          "/rooms/" + room.code,
          "GET",
          undefined,
          room.token,
        );
        if (!cancelled)
          setRoom(
            (r) =>
              r &&
              (r.game && next.game && r.game.revision > next.game.revision
                ? r
                : { ...next, token: r.token }),
          );
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [room?.code, room?.token]);
  useEffect(() => {
    if (room || !game || game.winner !== null || !game.seats[game.turn].bot)
      return;
    const timer = setTimeout(
      () => setGame((g) => g && act(g, g.turn, botAction(g))),
      750,
    );
    return () => clearTimeout(timer);
  }, [game, room]);
  useEffect(() => {
    setSelected(null);
  }, [current?.turn]);
  useEffect(() => {
    if (!room && game?.winner !== null && game && bracketMatch && tournament) {
      const winner = bracketMatch.names[game.winner!];
      try {
        setTournament(
          advance(tournament, bracketMatch.round, bracketMatch.match, winner),
        );
      } catch {}
      setBracketMatch(null);
    }
  }, [game?.winner]);
  useEffect(() => {
    if (!help && !inspect) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setHelp(false);
        setInspect(null);
      }
      if (e.key === "Tab") {
        const nodes = Array.from(
          document.querySelectorAll<HTMLElement>(
            ".clash-modal button, .clash-modal input",
          ),
        );
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          last?.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === last) {
          first?.focus();
          e.preventDefault();
        }
      }
    };
    document.addEventListener("keydown", close);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = old;
    };
  }, [help, inspect]);
  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const start = (tag = false, opponent = "Yungdueler", playerName = name) => {
    validateDeck(deck);
    setRoom(null);
    setSelected(null);
    setGame(
      createGame(
        Array.from({ length: tag ? 4 : 2 }, (_, i) => ({
          name:
            i === 0
              ? playerName
              : i === 1
                ? opponent
                : i === 2
                  ? "Donovan · Ally"
                  : "Toaster · Rival",
          bot: i !== 0,
          deck: i === 0 ? deck : starter,
        })),
      ),
    );
    setTab("duel");
  };
  const action = (a: Action) =>
    run(async () => {
      if (!current) return;
      if (room) {
        const next = await api(
          `/rooms/${room.code}/action`,
          "POST",
          { action: a, revision: current.revision },
          room.token,
        );
        setRoom({ ...next, token: room.token });
      } else setGame(act(current, seat, a));
      sound.playCardFlip();
      setSelected(null);
    });
  const join = (create: boolean) =>
    run(async () => {
      validateDeck(deck);
      const next = await api(
        create ? "/rooms" : `/rooms/${code.toUpperCase().trim()}/join`,
        "POST",
        { name, deck, mode },
      );
      setGame(null);
      setRoom(next);
    });
  const boardUnit = (u: Unit, enemy: boolean, ally = false) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 35, scale: 0.85 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      key={u.uid}
      className={`battle-card ${selected === u.uid ? "chosen" : ""} ${u.ready ? "ready" : ""}`}
    >
      <button
        className="card-hit"
        aria-label={
          enemy
            ? `Attack ${catalog[u.id].title}`
            : `Select ${catalog[u.id].title}`
        }
        onClick={() =>
          ally
            ? setInspect(u.id)
            : enemy
              ? selected &&
                action({ type: "attack", uid: selected, target: u.uid })
              : myTurn && setSelected(u.uid)
        }
      >
        <img src={catalog[u.id].thumbUrl} alt={catalog[u.id].title} />
        <span className="unit-hp">
          ♥ {u.hp}
          {u.shield > 0 && ` +${u.shield} ◇`}
        </span>
      </button>
      <div className="unit-footer">
        <span>⚔ {power(u.id)}</span>
        <button
          onClick={() => setInspect(u.id)}
          aria-label={`Inspect ${catalog[u.id].title}`}
        >
          ⓘ
        </button>
        <span>{u.ready ? "READY" : "REST"}</span>
      </div>
    </motion.div>
  );
  if (tab === "collection")
    return (
      <>
        <button className="collection-return" onClick={() => setTab("home")}>
          ← Return to FatGoats TCG
        </button>
        <Suspense fallback={<p>Opening the collection…</p>}>
          <Collection />
        </Suspense>
      </>
    );
  return (
    <div className="clash">
      <div className="ambient-orb" />
      <header className="clash-header">
        <button className="brand" onClick={() => setTab("home")}>
          <span className="brand-mark">♑</span>
          <span>
            FATGOATS<small>TCG</small>
          </span>
        </button>
        <nav>
          {[
            ["home", "Command", Home],
            ["deck", "Deck forge", Layers],
            ["online", "Friends", Users],
            ["tournament", "Tournaments", Trophy],
          ].map(([id, label, Icon]: any) => (
            <button
              key={id}
              className={tab === id ? "active" : ""}
              onClick={() => setTab(id)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="header-tools">
          <button aria-label="Game rules" onClick={() => setHelp(true)}>
            <BookOpen size={19} />
          </button>
          <button
            aria-label={muted ? "Enable sound" : "Mute sound"}
            onClick={() => {
              setMuted(!sound.toggle());
            }}
          >
            {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
          </button>
          <span className="avatar">{name.slice(0, 1)}</span>
        </div>
      </header>
      {error && (
        <div className="notice" role="status">
          {error}
          <button aria-label="Dismiss message" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <main className="clash-main">
        {tab === "home" && (
          <>
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span /> THE CELESTIAL ARENA · RULESET 01
                </div>
                <h1>
                  Legends aren't born.
                  <br />
                  <em>They're summoned.</em>
                </h1>
                <p>
                  Your herd. Your strategy. Command the FatGoats in an original
                  tactical card battler where elemental bonds turn the tide.
                </p>
                <div className="hero-actions">
                  {current && (
                    <button
                      className="secondary"
                      onClick={() => setTab("duel")}
                    >
                      Resume duel
                    </button>
                  )}
                  <button
                    className="primary"
                    onClick={() => {
                      setBracketMatch(null);
                      start();
                    }}
                  >
                    <Swords size={19} /> Enter the arena{" "}
                    <ArrowRight size={18} />
                  </button>
                  <button className="secondary" onClick={() => setHelp(true)}>
                    Learn to duel
                  </button>
                </div>
                <div className="hero-meta">
                  <span>
                    <i /> SOLO & TAG DUELS
                  </span>
                  <span>{INITIAL_CARDS.length} CELESTIAL CARDS</span>
                  <span>FREE DECK BUILDING</span>
                </div>
              </div>
              <div className="hero-art">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <img
                  className="hero-card rear"
                  src={INITIAL_CARDS[0].thumbUrl}
                  alt="Donovan the Frog King"
                />
                <img
                  className="hero-card front"
                  src={INITIAL_CARDS[3].imageUrl}
                  alt="Toaster the King of FatGoats"
                />
                <div className="hero-art-label">
                  <span>MYTHIC RARE</span>
                  <strong>Toaster</strong>
                  <small>The King of FatGoats</small>
                </div>
              </div>
            </section>
            <section className="mode-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">CHOOSE YOUR BATTLEGROUND</div>
                  <h2>A new rivalry awaits.</h2>
                </div>
                <span className="subtle">
                  One collection. Endless possibilities.
                </span>
              </div>
              <div className="mode-grid">
                {[
                  {
                    title: "Solo duel",
                    tag: "PLAYER VS BOT",
                    text: "Learn your deck. Challenge the celestial rivals.",
                    icon: Swords,
                    action: () => {
                      setBracketMatch(null);
                      start();
                    },
                    cls: "cyan",
                  },
                  {
                    title: "Tag team",
                    tag: "2 VS 2",
                    text: "Share a core. Build elemental bonds with your ally.",
                    icon: Shield,
                    action: () => {
                      setBracketMatch(null);
                      start(true);
                    },
                    cls: "violet",
                  },
                  {
                    title: "Private rooms",
                    tag: "PLAY WITH FRIENDS",
                    text: "Invite your rivals. Fill open seats with bots.",
                    icon: Users,
                    action: () => setTab("online"),
                    cls: "gold",
                  },
                ].map((m) => (
                  <button
                    key={m.title}
                    className={`mode-card ${m.cls}`}
                    onClick={m.action}
                  >
                    <m.icon size={28} />
                    <small>{m.tag}</small>
                    <h3>{m.title}</h3>
                    <p>{m.text}</p>
                    <ArrowRight className="mode-arrow" size={20} />
                  </button>
                ))}
              </div>
            </section>
            <section className="home-bottom">
              <div>
                <div className="eyebrow">THE HERD IS GROWING</div>
                <h2>Craft your celestial signature.</h2>
                <p>
                  Every card is available for duels. Forge a 16-card deck and
                  find your elemental synergy.
                </p>
                <button className="text-link" onClick={() => setTab("deck")}>
                  Open the deck forge <ArrowRight size={17} />
                </button>
              </div>
              <button
                className="collection-tile"
                onClick={() => setTab("collection")}
              >
                <Layers size={30} />
                <div>
                  <strong>Explore the collection</strong>
                  <span>Artwork, lore, boosters & your binder</span>
                </div>
                <ArrowRight size={20} />
              </button>
            </section>
          </>
        )}
        {tab === "deck" && (
          <>
            <div className="page-title">
              <div>
                <div className="eyebrow">BUILD YOUR LEGACY</div>
                <h1>Deck forge</h1>
                <p>
                  16 unique cards · three summon lanes · elemental resonance
                </p>
              </div>
              <div className="deck-counter">
                {deck.length}
                <span>/ 16</span>
              </div>
            </div>
            <div className="forge-tools">
              <input
                aria-label="Search cards"
                placeholder="Search name, element or ability…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="secondary" onClick={() => setDeck(starter)}>
                Starter deck
              </button>
              <button className="secondary" onClick={() => setDeck([])}>
                Clear deck
              </button>
              <button
                className="primary"
                disabled={deck.length !== 16}
                onClick={() => {
                  setBracketMatch(null);
                  start();
                }}
              >
                Test deck
              </button>
            </div>
            <p className="subtle">
              Click + to add, − to remove. Tap artwork to inspect the playable
              rules.
            </p>
            <div className="forge-grid">
              {INITIAL_CARDS.filter((c) =>
                `${c.title} ${c.subtitle} ${c.element} ${c.abilityName}`
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              ).map((c) => (
                <article
                  className={`forge-card ${deck.includes(c.id) ? "in-deck" : ""}`}
                  key={c.id}
                >
                  <button onClick={() => setInspect(c.id)}>
                    <img
                      loading="lazy"
                      src={c.thumbUrl}
                      alt={`${c.title}: ${c.subtitle}`}
                    />
                    <span className="energy-badge">{cost(c.id)}</span>
                  </button>
                  <div>
                    <strong>{c.title}</strong>
                    <small>
                      {c.element} · ⚔ {power(c.id)}
                    </small>
                    <button
                      aria-label={`${deck.includes(c.id) ? "Remove" : "Add"} ${c.title}`}
                      disabled={!deck.includes(c.id) && deck.length >= 16}
                      onClick={() =>
                        setDeck((d) =>
                          d.includes(c.id)
                            ? d.filter((id) => id !== c.id)
                            : [...d, c.id],
                        )
                      }
                    >
                      {deck.includes(c.id) ? "−" : "+"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
        {tab === "online" && (
          <>
            <div className="page-title">
              <div>
                <div className="eyebrow">BRING YOUR HERD</div>
                <h1>Friends & cross-save</h1>
                <p>
                  Private matches across desktop and mobile browsers on the same
                  game server.
                </p>
              </div>
            </div>
            <div className="online-grid">
              <section className="panel">
                <h2>Your duelist</h2>
                <label>
                  Display name
                  <input
                    maxLength={24}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </label>
                <label>
                  Room format
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="duel">1 vs 1</option>
                    <option value="tag">2 vs 2 tag team</option>
                  </select>
                </label>
                <button
                  className="primary"
                  disabled={busy || deck.length !== 16}
                  onClick={() => join(true)}
                >
                  Create private room
                </button>
                <div className="divider" />
                <label>
                  Invite code
                  <input
                    maxLength={8}
                    placeholder="8-character room code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </label>
                <button
                  className="secondary"
                  disabled={
                    busy || code.trim().length !== 8 || deck.length !== 16
                  }
                  onClick={() => join(false)}
                >
                  Join friend
                </button>
              </section>
              <section className="panel">
                <h2>{room ? "Your room" : "The squad assembles"}</h2>
                {room ? (
                  <>
                    <div className="room-code">{room.code}</div>
                    <p>
                      Share this code with friends. Teams alternate by seat: 1 +
                      3 versus 2 + 4.
                    </p>
                    {room.players.map((p, i) => (
                      <div className="player-row" key={i}>
                        <span className="avatar">{i + 1}</span>
                        <strong>{p.name}</strong>
                        <small>
                          TEAM {(i % 2) + 1}
                          {i === room.seat ? " · YOU" : ""}
                        </small>
                      </div>
                    ))}
                    {room.game ? (
                      <button
                        className="primary"
                        onClick={() => setTab("duel")}
                      >
                        Return to duel
                      </button>
                    ) : room.seat === 0 ? (
                      <button
                        className="primary"
                        disabled={busy}
                        onClick={() =>
                          run(async () => {
                            const r = await api(
                              `/rooms/${room.code}/start`,
                              "POST",
                              {},
                              room.token,
                            );
                            setRoom({ ...r, token: room.token });
                            setTab("duel");
                          })
                        }
                      >
                        Start · fill empty seats with bots
                      </button>
                    ) : (
                      <p>Waiting for the host to start…</p>
                    )}
                    <button
                      className="text-link"
                      onClick={() => {
                        setRoom(null);
                        setGame(null);
                      }}
                    >
                      Leave room on this device
                    </button>
                  </>
                ) : (
                  <div className="empty-state">
                    <Users size={50} />
                    <p>
                      Create a room or join with an invite code. The host starts
                      when everyone is ready.
                    </p>
                  </div>
                )}
              </section>
              <section className="panel">
                <Cloud size={28} />
                <h2>Take your deck anywhere.</h2>
                <p>
                  Google sign-in links your display name and deck to this
                  server. Load before switching devices; cloud saves detect
                  conflicts.
                </p>
                {googleId ? (
                  <div ref={googleButton} />
                ) : (
                  <p className="subtle">
                    Google sign-in is not configured on this server. Your deck
                    saves on this device.
                  </p>
                )}
                <div className="stack">
                  <button
                    className="secondary"
                    disabled={!googleId || busy}
                    onClick={() =>
                      run(async () => {
                        const r = await api("/save");
                        setCloudVersion(r.version);
                        setSignedIn(true);
                        if (r.save) {
                          setDeck(r.save.deck);
                          setName(r.save.name);
                        }
                        setError(
                          r.save
                            ? "Cloud deck loaded."
                            : "No cloud deck yet. You can save this deck now.",
                        );
                      })
                    }
                  >
                    Load cloud deck
                  </button>
                  <button
                    className="secondary"
                    disabled={!signedIn || deck.length !== 16 || busy}
                    onClick={() =>
                      run(async () => {
                        const r = await api("/save", "PUT", {
                          save: { deck, name },
                          version: cloudVersion,
                        });
                        setCloudVersion(r.version);
                        setError("Cloud deck saved.");
                      })
                    }
                  >
                    Save to cloud
                  </button>
                </div>
              </section>
            </div>
          </>
        )}
        {tab === "tournament" && (
          <>
            <div className="page-title">
              <div>
                <div className="eyebrow">THE CELESTIAL CUP</div>
                <h1>Tournament desk</h1>
                <p>
                  Create a 4, 8 or 16-player single-elimination bracket. Play
                  bot matches or record results from private rooms.
                </p>
              </div>
            </div>
            <section className="panel tournament-setup">
              <label>
                One unique player name per line
                <textarea
                  rows={4}
                  value={names}
                  onChange={(e) => setNames(e.target.value)}
                />
              </label>
              <button
                className="primary"
                onClick={() => {
                  try {
                    setTournament(
                      createTournament(
                        names
                          .split("\n")
                          .map((n) => n.trim())
                          .filter(Boolean),
                      ),
                    );
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }}
              >
                Create bracket
              </button>
            </section>
            {tournament && (
              <div className="bracket">
                {tournament.rounds.map((round, r) => (
                  <section key={r}>
                    <h3>
                      {r === tournament.rounds.length - 1
                        ? "Champion"
                        : `Round ${r + 1}`}
                    </h3>
                    {Array.from(
                      { length: Math.ceil(round.length / 2) },
                      (_, m) => (
                        <div className="bracket-match" key={m}>
                          {round.slice(m * 2, m * 2 + 2).map((n, i) => (
                            <div key={i}>
                              <span>{n || "Awaiting winner"}</span>
                              {n &&
                                tournament.rounds[r + 1] &&
                                !tournament.rounds[r + 1][m] &&
                                round[m * 2] &&
                                round[m * 2 + 1] && (
                                  <button
                                    aria-label={`Record ${n} as winner`}
                                    onClick={() =>
                                      setTournament(
                                        advance(tournament, r, m, n),
                                      )
                                    }
                                  >
                                    Win
                                  </button>
                                )}
                            </div>
                          ))}
                          {tournament.rounds[r + 1] &&
                            !tournament.rounds[r + 1][m] &&
                            round[m * 2] &&
                            round[m * 2 + 1] && (
                              <button
                                className="text-link"
                                disabled={deck.length !== 16}
                                onClick={() => {
                                  const ns = round.slice(
                                    m * 2,
                                    m * 2 + 2,
                                  ) as string[];
                                  setBracketMatch({
                                    round: r,
                                    match: m,
                                    names: ns,
                                  });
                                  start(false, ns[1], ns[0]);
                                }}
                              >
                                Play first seat vs bot →
                              </button>
                            )}
                        </div>
                      ),
                    )}
                  </section>
                ))}
              </div>
            )}
          </>
        )}
        {tab === "duel" && current && (
          <>
            <div className="duel-heading">
              <div>
                <div className="eyebrow">
                  {room
                    ? `PRIVATE ROOM ${room.code}`
                    : bracketMatch
                      ? "CELESTIAL CUP"
                      : "TRAINING GROUNDS"}{" "}
                  · {current.seats.length === 4 ? "TAG TEAM" : "SOLO DUEL"}
                </div>
                <h2>
                  {current.winner !== null
                    ? current.winner === myTeam
                      ? "Victory is yours."
                      : "A worthy battle."
                    : myTurn
                      ? "Your move, duelist."
                      : `${current.seats[current.turn].name}'s turn`}
                </h2>
              </div>
              <div className="turn-tools">
                <span>TURN {current.round}</span>
                <button
                  className="secondary"
                  disabled={!myTurn || busy}
                  onClick={() => action({ type: "end" })}
                >
                  End turn <ArrowRight size={16} />
                </button>
                <button
                  className="text-link"
                  disabled={!myTurn || busy}
                  onClick={() => action({ type: "concede" })}
                >
                  Concede
                </button>
              </div>
            </div>
            <div className="duel-layout">
              <section className="arena">
                <div className="core enemy-core">
                  <div>
                    <span>OPPOSING HERD</span>
                    <strong>
                      {current.seats
                        .filter((s) => s.team !== myTeam)
                        .map((s) => s.name)
                        .join(" + ")}
                    </strong>
                  </div>
                  <button
                    disabled={
                      !myTurn ||
                      !selected ||
                      busy ||
                      current.seats.some(
                        (s) => s.team !== myTeam && s.board.length,
                      )
                    }
                    onClick={() =>
                      selected && action({ type: "attack", uid: selected })
                    }
                  >
                    ♥ {current.cores[1 - myTeam]} <small>CORE</small>
                  </button>
                </div>
                <div className="battle-rows">
                  {current.seats
                    .filter((s) => s.team !== myTeam)
                    .map((s, i) => (
                      <div className="battle-row" key={i}>
                        <span className="lane-label">
                          {s.name} · {s.hand.length} in hand
                        </span>
                        <div className="lanes">
                          <AnimatePresence>
                            {s.board.map((u) => boardUnit(u, true))}
                          </AnimatePresence>
                          {Array.from(
                            { length: 3 - s.board.length },
                            (_, i) => (
                              <div className="empty-lane" key={"empty" + i}>
                                ◇
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="arena-divider">
                  <span>✦</span>
                  <p>
                    {selected
                      ? "Choose an enemy unit or exposed core"
                      : "FATGOATS TCG"}
                  </p>
                  <span>✦</span>
                </div>
                <div className="battle-rows">
                  {current.seats
                    .filter((s) => s.team === myTeam)
                    .map((s, i) => (
                      <div className="battle-row" key={i}>
                        <span className="lane-label">
                          {s.name}
                          {s === current.seats[seat] ? " · YOU" : " · ALLY"}
                        </span>
                        <div className="lanes">
                          <AnimatePresence>
                            {s.board.map((u) =>
                              boardUnit(u, false, s !== current.seats[seat]),
                            )}
                          </AnimatePresence>
                          {Array.from(
                            { length: 3 - s.board.length },
                            (_, i) => (
                              <div className="empty-lane" key={"empty" + i}>
                                ◇
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                <div className="core own-core">
                  <div>
                    <span>YOUR HERD</span>
                    <strong>
                      ♥ {current.cores[myTeam]} <small>/ 1000</small>
                    </strong>
                  </div>
                  <div className="energy">
                    <Zap size={18} />
                    {current.seats[seat].energy} /{" "}
                    {current.seats[seat].maxEnergy}
                    <small>ENERGY</small>
                  </div>
                </div>
              </section>
              <aside className="duel-sidebar">
                <section className="panel">
                  <div className="eyebrow">TACTICAL VIEW</div>
                  {selected ? (
                    <>
                      <h3>
                        {
                          catalog[
                            current.seats[seat].board.find(
                              (u) => u.uid === selected,
                            )!.id
                          ].title
                        }
                      </h3>
                      <p>
                        {skill(
                          current.seats[seat].board.find(
                            (u) => u.uid === selected,
                          )!.id,
                        )}
                      </p>
                      <button
                        className="primary"
                        disabled={
                          !myTurn ||
                          busy ||
                          current.seats[seat].energy < 2 ||
                          !current.seats[seat].board.find(
                            (u) => u.uid === selected,
                          )?.ready
                        }
                        onClick={() => action({ type: "skill", uid: selected })}
                      >
                        Signature · 2 energy
                      </button>
                    </>
                  ) : (
                    <>
                      <h3>Build your resonance.</h3>
                      <p>
                        Two allied units of the same element grant +15 attack.
                        Newly summoned units rest until their next turn.
                      </p>
                    </>
                  )}
                </section>
                <section className="panel battle-log">
                  <div className="eyebrow">BATTLE CHRONICLE</div>
                  <div aria-live="polite">
                    {current.log
                      .slice(-7)
                      .reverse()
                      .map((line, i) => (
                        <p key={`${current.revision}-${i}`}>{line}</p>
                      ))}
                  </div>
                </section>
              </aside>
            </div>
            <section className="hand-section">
              <div className="section-heading">
                <h3>
                  Your hand{" "}
                  <span className="subtle">
                    {current.seats[seat].hand.length} / 8
                  </span>
                </h3>
                <span className="subtle">
                  Deck: {current.seats[seat].deck.length} · Tap Summon to deploy
                </span>
              </div>
              <div className="hand">
                {current.seats[seat].hand.map((id, i) => (
                  <motion.div
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    key={`${id}-${i}`}
                    className="hand-card"
                  >
                    <button onClick={() => setInspect(id)}>
                      <img
                        src={catalog[id]?.thumbUrl || CARD_BACK_THUMB}
                        alt={catalog[id]?.title || "Card"}
                      />
                      <span className="energy-badge">{cost(id)}</span>
                    </button>
                    <button
                      disabled={
                        !myTurn ||
                        busy ||
                        cost(id) > current.seats[seat].energy ||
                        current.seats[seat].board.length >= 3
                      }
                      onClick={() => action({ type: "summon", index: i })}
                    >
                      Summon
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
            {current.winner !== null && (
              <div className="result-banner">
                <Trophy size={30} />
                <div>
                  <h2>
                    {current.winner === myTeam
                      ? "The stars remember your name."
                      : "Every defeat forges a stronger herd."}
                  </h2>
                  <p>
                    Team {current.winner + 1} wins. Your deck is ready for the
                    next challenge.
                  </p>
                </div>
                <button
                  className="primary"
                  onClick={() => {
                    setTab("home");
                    setGame(null);
                    setRoom(null);
                  }}
                >
                  Return to command
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="clash-footer">
        <span>
          FATGOATS STUDIO <b>✦</b> FATGOATS TCG
        </span>
        <span>Original ruleset · All duel cards unlocked</span>
      </footer>
      {(help || inspect) && (
        <div
          className="modal-shade"
          role="dialog"
          aria-modal="true"
          aria-label={help ? "How to duel" : "Card details"}
          onClick={() => {
            setHelp(false);
            setInspect(null);
          }}
        >
          <section className="clash-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              autoFocus
              aria-label="Close dialog"
              onClick={() => {
                setHelp(false);
                setInspect(null);
              }}
            >
              <X />
            </button>
            {inspect ? (
              <div className="inspect-layout">
                <img
                  src={catalog[inspect].imageUrl}
                  alt={catalog[inspect].title}
                />
                <div>
                  <div className="eyebrow">
                    {catalog[inspect].element} · {catalog[inspect].rarity}
                  </div>
                  <h2>{catalog[inspect].title}</h2>
                  <p>{catalog[inspect].subtitle}</p>
                  <div className="stat-line">
                    ⚡ {cost(inspect)} · ⚔ {power(inspect)} · ♥{" "}
                    {vitality(inspect)} · ◇ {armor(inspect)}
                  </div>
                  <h3>{catalog[inspect].abilityName}</h3>
                  <p>{skill(inspect)}</p>
                  <small>
                    Playable signature costs 2 energy and consumes the unit’s
                    attack. Original lore: {catalog[inspect].abilityDesc}
                  </small>
                </div>
              </div>
            ) : (
              <>
                <div className="eyebrow">RULESET 01</div>
                <h2>Welcome to FatGoats TCG.</h2>
                <ol>
                  <li>
                    Build a deck of 16 different cards. Each team starts with a
                    1,000-HP core.
                  </li>
                  <li>
                    Spend energy to summon up to three units per seat. Energy
                    grows to eight and refills each turn.
                  </li>
                  <li>
                    Units rest when summoned. On your next turn, select a unit
                    and attack an enemy, or use its 2-energy signature instead.
                  </li>
                  <li>
                    Defeat all opposing units before striking their core. Damage
                    is attack minus armor, at least 10. Shields absorb damage
                    first.
                  </li>
                  <li>
                    Two allied units sharing an element grant +15 attack. Tag
                    partners share their core, but keep their own hands, lanes
                    and energy.
                  </li>
                  <li>
                    Turn order alternates teams. Empty decks inflict increasing
                    fatigue damage when drawing. Reduce the enemy core to zero
                    to win.
                  </li>
                </ol>
                <p>
                  Signatures use the balanced elemental effects shown in card
                  details. Lore text is preserved separately.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
export default App;
