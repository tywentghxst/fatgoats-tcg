# FatGoats TCG — playable foundation

This branch adds an original FatGoats card game to the existing collection app. It is a playable foundation, not a completed Master Duel-scale release. Existing card art, names, lore and collection features remain available.

## Run

Requires Node 24 (uses built-in SQLite).

```sh
npm ci
npm run build:all
npm start
```

Open `http://localhost:3000`. The same server serves the client and authoritative multiplayer API. Friends must reach the same server URL; deploy behind HTTPS to play over the Internet. For development, `npm run dev` serves the client only. Use the production server for online modes.

```sh
npm test
npx playwright install --with-deps chromium
npm run test:ui
```

`PORT` defaults to 3000. `DATA_DIR` defaults to `./var`; mount persistent storage there. SQLite holds rooms, Google sessions and saved decks. One server process owns the database and room simulation. Do not run multiple replicas against this implementation. Back up the database before upgrades. Rooms expire after 24 hours of player inactivity. Room credentials are stored on the joining device; retain that browser storage to reconnect. Leaving on-device forgets that seat's credential; it does not free the seat. There is no host migration, seat replacement or disconnect timer yet.

## What works

- Responsive command screen, animated summons, card inspection, sound toggle and reduced-motion CSS.
- 47 original card entries, a 16-unique-card deck builder, local deck persistence, original binder/booster UI.
- Solo duels against a legal-move bot; 2v2 tag training with three bots.
- Shared rules engine with summons, attacks, armor, shields, energy, signatures, resonance, hand limits, fatigue, concede and victory.
- Private online 1v1 and 2v2 rooms, invite codes, host-controlled start and automatic bot filling. Mixed human/bot teams supported. The server owns state, checks turn ownership and revision numbers, and hides all other hands and all deck order.
- Local 4/8/16-player tournament brackets. Play a bracket match as its first entrant against a bot, or record the outcome of a separately played private-room match. Bracket results persist locally. This is an organizer desk, **not** a server-hosted tournament service.
- Optional Google Identity Services authentication, server-verified ID tokens, HttpOnly sessions, persistent Google-linked deck/name saves, version conflicts preventing silent overwrite. Cloud save/load is manual, not automatic. Collection ownership, tournaments and unfinished solo games are not cloud synced.
- Web app manifest and generated service worker. After a successful cache install, core client/thumbnail assets support offline solo play. Original full-resolution inspection images are not precached. HTTPS is required outside localhost for service workers.

## Ruleset 01

Each team starts with 1,000 core HP. Seats alternate teams: A1, B1, A2, B2. Each player has their own 16-card deck, four-card initial hand, three unit lanes, and energy pool. Maximum hand size is eight. Drawing into a full hand discards the card. Empty-deck draws deal 40, then 80, then 120… damage to the team's core.

Energy starts at 3, gains one maximum per personal turn, caps at eight, and refills on that turn. A summon costs `clamp(round((ATK + HP + DEF) / 600) - 1, 1, 5)`. Unit HP is original HP / 5 rounded, attack is original ATK / 10 rounded, and armor is original DEF / 40 rounded. Units rest on summon. Each ready unit can attack or use a signature once; it refreshes on its owner's next turn. Attack damage is at least 10 after armor. Shields absorb damage first. Every enemy unit must be defeated before the core can be attacked. Two allied units of the same element grant +15 attack to that element's units, including across tag partners.

Signatures cost 2 energy and consume readiness:

| Elements | Playable signature |
| --- | --- |
| Nature / Water / Divine | Heal all allied units by 50 (up to max), core by 80 (up to 1,000) |
| Earth / Steel | Add 60 shield to every allied unit, up to 120 |
| Arcane / Celestial | Draw one card and recover one energy |
| Fire / Dark / Shadow / Chaos / Lightning / Wind | Deal 40 shield-absorbable damage to each enemy unit and 40 to the enemy core |

These are deliberately explicit initial game rules. The original ability descriptions are preserved as lore, **not implemented literally**. Speed is displayed in the legacy collection but is not used by this ruleset. Adding artwork alone does not add a bespoke scripted ability. Balance and individually authored card effects remain substantial future work.

## Configure Google cross-save

Create a Google OAuth web client, authorize your exact HTTPS game origin (localhost for development), and set `GOOGLE_CLIENT_ID` on the server. Restart it. The Friends screen displays Google's sign-in button only when configured. Set `NODE_ENV=production` behind HTTPS so session cookies are Secure. The client and API must share an origin. No Google client secret is needed for the ID-token flow.

Verification uses `google-auth-library.verifyIdToken` with the configured audience; account keys use Google's `sub`, not email. Session tokens are hashed in SQLite and expire after seven days. Sign in, load the existing cloud deck, edit, then save. Conflicts require reloading before another save.

Official setup reference: https://developers.google.com/identity/gsi/web/guides/verify-google-id-token

## Platform/release boundaries

This branch targets the browser on PC, Android and iOS, with one shared protocol for cross-platform rooms. Chromium desktop and emulated phone checks are included. Real iPhone/Safari, Android hardware and network-condition testing are still required. It does not produce signed Android APK/AAB, iOS IPA, or Steam builds. Store-ready native shells need packaging, signing identities, platform review, safe-area/device testing and account-linking UX. Steam matchmaking is not used; shared HTTPS rooms avoid making mobile players depend on Steam accounts.

Before public launch: add per-account quotas, operational monitoring/backups, disconnect/turn timers, player moderation, full accessibility review, load tests, hosted tournament orchestration, spectator-safe protocols, richer account recovery/logout UI, audit logging and game balance tests. Production Google authentication was not exercised without a client ID. No production server has been deployed by this branch.

## Expansion ideas (not implemented)

1. **Relics** — equip a unit with a visible modifier, trading summon tempo for a specialized build.
2. **Domains** — one shared arena card with a three-round duration; changes elemental resonance rules for both teams.
3. **Reactions** — limited, clearly timed interrupts with server-side priority windows; start with shields or redirects.
4. **Herd bonds** — pair-specific tag actions consuming resources from both players, with explicit teammate consent.
5. **Ascensions** — evolve a named unit by meeting an in-match objective, keeping the collection accessible rather than gating power behind packs.

Recommended next milestone: replace elemental placeholder signatures with reviewed card-by-card effect definitions, then automate tournaments around verified server match results. That creates the strongest foundation for richer animation, campaigns, ranked queues and native releases.
