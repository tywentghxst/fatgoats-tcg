# FatGoats TCG

A playable original card battler built on the FatGoats collection. Solo bots, tag-team duels, private online rooms, deck building, and local tournament brackets.

**Start here:** [setup, rules, supported features and remaining release work](docs/FATGOATS_TCG.md).

```sh
npm ci
npm run build:all
npm start
```

Requires Node 24. Open http://localhost:3000. Google cross-save requires server configuration; native app-store and Steam releases are not included.

---

## Original collection documentation

# 🐐 FatGoats TCG — Celestial Goat Card Collection Web Application

An ultra-modern, high-performance, and visually stunning Trading Card Game web application built with **React**, **TypeScript**, **Tailwind CSS**, and **Framer Motion**.

---

## 🌟 Key Features

### 1. 3D Card Hover & Tilt Effects
- **Physics-Based Parallax**: Real-time cursor tracking using Framer Motion springs (`damping: 20`, `stiffness: 300`).
- **Dynamic Holographic Sheen**: Iridescent foil reflection layer that shifts colors, angle, and specular brightness as you tilt each card.
- **Rarity Auras**: Distinct neon glows and borders tailored to each rarity tier (Mythic Rare, Secret Rare, Legendary, Ultra Rare, Rare, Common).

### 2. Interactive 3D Card Inspection Modal & Flip Mechanic
- **Dual-Sided 3D Inspection**: Fullscreen inspection viewer with 3D cursor tracking.
- **Universal Card Back**: Smooth 180° Y-axis rotation revealing `00 - Celestial Goat Card Back.png`.
- **Keyboard Shortcuts**:
  - `Space` or `F`: Flip card between front and back
  - `←` (Left Arrow): Previous card
  - `→` (Right Arrow): Next card
  - `Escape`: Close viewer
- **Combat Stats & Lore**: HP, Attack, Defense, Speed, Signature Abilities, and lore flavor text for all 36 cards.

### 3. Collection Management & Deck Tracking
- **Owned Binder Tracking**: Mark cards as owned/unowned with real-time completion percentage.
- **Favorites & Bookmarks**: Star your favorite cards.
- **Persistent Storage**: Saved in `localStorage`.
- **Celebration Confetti**: Triggers celebratory confetti upon completing sets or pulling ultra-rare cards.

### 4. Celestial Summoning Shrine (New Card Reveal Portal)
- **Cinematic Card Reveal Ritual**: Experience newly dropped cards materializing through a celestial portal with starry ambient vortex, energy charging sound effects, and explosive cosmic confetti bursts.
- **Interactive 3D Unveiling**: Tap or click each mystery card to flip and discover its attributes, artwork, stats, and lore.
- **Showcase & Filter**: Inspect all new arrivals together or filter the gallery to view only the latest drop.

### 5. Automated Card Ingestion (`NEW CARDS/` Engine)
- **Instant Drag-and-Drop Porting**: Whenever new card artwork is created, simply drop images into the `NEW CARDS/` folder.
- **One-Click Execution**:
  - Run `npm.cmd run ingest` OR double-click `ingest_new_cards.bat` in Windows.
  - Automatically converts full-res cards to `public/cards/`.
  - Automatically generates optimized WebP thumbnails in `public/cards_thumb/`.
  - Automatically registers new cards and custom IRL quests in `cardsData.ts` and `questsData.ts`.
  - Safely archives processed images to `NEW CARDS/_archived/` so the folder stays clean for your next drop!

### 6. Booster Pack Opening Simulator
- **Interactive Booster Packs**: Tear open virtual 5-card booster packs with randomized rarity pulls, sequence reveal animations, and sound effects.

### 7. IRL Quests & Proof Verification
- Real-world fitness, comedic, snack, and mastery quests tied to every card with photo proof verification and interactive timers.

### 8. Dynamic ZIP Ingestion (Zero File-Size Limits)
- Built-in **JSZip** in-memory client-side decompression for loading cards directly in the browser.

### 9. Web Audio API Sound System
- Procedurally synthesized sound effects:
  - Card flip whoosh & snap
  - Cosmic energy charging & reveal blast
  - Victory fanfare & chimes
  - Foil shimmer chimes
  - Pack tear fanfare
  - Mute/Unmute audio controls

---

## 🚀 Running the Project

The development server is already running at:
```
http://localhost:3000/
```

To build for production:
```bash
npm.cmd run build
```

To preview the production build:
```bash
npm.cmd run preview
```
