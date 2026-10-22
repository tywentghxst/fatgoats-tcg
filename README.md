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

### 4. Booster Pack Opening Simulator
- **Interactive Booster Packs**: Tear open virtual 5-card booster packs with randomized rarity pulls, sequence reveal animations, and sound effects.

### 5. Dynamic ZIP Ingestion (Zero File-Size Limits)
- Built-in **JSZip** in-memory client-side decompression.
- Can ingest any `.zip` archive (57MB, 100MB+) directly in the browser with no chat upload restrictions.

### 6. Web Audio API Sound System
- Procedurally synthesized sound effects:
  - Card flip whoosh & snap
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
