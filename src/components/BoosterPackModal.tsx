import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  PackageOpen, 
  CheckCircle, 
  RotateCcw, 
  ChevronRight, 
  Eye, 
  Flame, 
  Layers
} from 'lucide-react';
import { CardItem as CardItemType } from '../types';
import { sound } from '../utils/audio';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import confetti from 'canvas-confetti';

interface BoosterPackModalProps {
  allCards: CardItemType[];
  cardBackUrl: string;
  onClose: () => void;
  onAddCardsToOwned: (cardIds: string[]) => void;
  onInspectCard: (card: CardItemType) => void;
}

export const BoosterPackModal: React.FC<BoosterPackModalProps> = ({
  allCards,
  cardBackUrl,
  onClose,
  onAddCardsToOwned,
  onInspectCard,
}) => {
  // Opening flow states: 'sealed' | 'tearing' | 'stack' | 'summary'
  const [stage, setStage] = useState<'sealed' | 'tearing' | 'stack' | 'summary'>('sealed');
  const [pulledCards, setPulledCards] = useState<CardItemType[]>([]);
  const [currentStackIndex, setCurrentStackIndex] = useState(0);

  // Lock background body scroll
  useBodyScrollLock(true);

  // Pick 5 cards with weighted rarity distribution for authentic pack odds!
  const generatePack = (): CardItemType[] => {
    // Separate by rarity
    const secrets = allCards.filter(c => c.rarity === 'Secret Rare' || c.rarity === 'Mythic Rare');
    const legendaries = allCards.filter(c => c.rarity === 'Legendary');
    const ultraRares = allCards.filter(c => c.rarity === 'Ultra Rare');
    const rares = allCards.filter(c => c.rarity === 'Rare' || c.rarity === 'Common');

    const pack: CardItemType[] = [];
    const usedIds = new Set<string>();

    const pickRandom = (pool: CardItemType[]): CardItemType => {
      const available = pool.filter(c => !usedIds.has(c.id));
      const source = available.length > 0 ? available : allCards;
      const card = source[Math.floor(Math.random() * source.length)];
      usedIds.add(card.id);
      return card;
    };

    // Slot 1: Rare
    pack.push(pickRandom(rares.length ? rares : allCards));
    // Slot 2: Rare
    pack.push(pickRandom(rares.length ? rares : allCards));
    // Slot 3: Ultra Rare or Rare
    pack.push(pickRandom(ultraRares.length && Math.random() > 0.4 ? ultraRares : rares));
    // Slot 4: Legendary or Ultra
    pack.push(pickRandom(legendaries.length && Math.random() > 0.35 ? legendaries : ultraRares));
    // Slot 5 (THE HIT / FOIL SLOT): High chance of Legendary, Mythic, or Secret Rare!
    const hitRoll = Math.random();
    if (hitRoll < 0.25 && secrets.length) {
      pack.push(pickRandom(secrets));
    } else if (legendaries.length) {
      pack.push(pickRandom(legendaries));
    } else {
      pack.push(pickRandom(allCards));
    }

    return pack;
  };

  const handleStartTear = () => {
    sound.playFoilRip();
    setStage('tearing');

    const pack = generatePack();
    setPulledCards(pack);
    setCurrentStackIndex(0);

    setTimeout(() => {
      sound.playCelestialCharge();
    }, 250);

    setTimeout(() => {
      sound.playCardRevealBlast();
      setStage('stack');
    }, 750);
  };

  // Slide top card away to reveal next
  const handleNextCardInStack = () => {
    sound.playCardSlide();

    const nextIndex = currentStackIndex + 1;
    if (nextIndex < pulledCards.length) {
      setCurrentStackIndex(nextIndex);
      const nextCard = pulledCards[nextIndex];

      // Check if the revealed card is an epic hit
      if (nextCard.rarity === 'Secret Rare' || nextCard.rarity === 'Mythic Rare') {
        sound.playRareGlow();
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#ec4899', '#f59e0b', '#38bdf8', '#8b5cf6'],
        });
      } else if (nextCard.rarity === 'Legendary') {
        sound.playSparkle();
      }
    } else {
      // Finished all 5 cards! Show summary
      sound.playVictoryFanfare();
      setStage('summary');
    }
  };

  const handleClaimAll = () => {
    sound.playSparkle();
    const ids = pulledCards.map((c) => c.id);
    onAddCardsToOwned(ids);
    onClose();
  };

  const handleOpenAnother = () => {
    setStage('sealed');
    setPulledCards([]);
    setCurrentStackIndex(0);
  };

  const currentCard = pulledCards[currentStackIndex];
  const isLastCard = currentStackIndex === pulledCards.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto overscroll-contain touch-none select-none">
      {/* Dark Ambient Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/92 backdrop-blur-2xl touch-none"
      />

      {/* Main Booster Modal Box */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-3xl bg-[#091120] border border-amber-500/40 rounded-3xl p-4 sm:p-8 z-10 my-auto text-center overflow-hidden shadow-2xl shadow-amber-950/70 max-h-[95dvh] overflow-y-auto overscroll-contain"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:bg-slate-800 text-slate-300 hover:text-white transition z-20 active:scale-90"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header Ribbon */}
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold tracking-wider uppercase mb-1 shadow-lg shadow-amber-500/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
            <span>Official TCG Booster Pack</span>
          </div>
          <h2 className="font-display text-xl sm:text-3xl font-black text-white">
            Celestial <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200 bg-clip-text text-transparent">Genesis Pack</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            5 Authentic cards with guaranteed rare foils • Foil Slot in the back!
          </p>
        </div>

        {/* STAGE 1: SEALED 3D FOIL PACK */}
        {stage === 'sealed' && (
          <div className="py-4 sm:py-8 flex flex-col items-center justify-center">
            
            {/* 3D Floating Foil Pack */}
            <motion.div
              whileHover={{ scale: 1.05, rotateZ: 1 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleStartTear}
              className="relative w-52 sm:w-64 aspect-[700/1060] cursor-pointer rounded-2xl shadow-[0_20px_60px_-15px_rgba(245,158,11,0.4)] group overflow-hidden border-2 border-amber-400/80 transition-all"
            >
              {/* Top Foil Crimp with Zigzag */}
              <div className="absolute top-0 inset-x-0 h-6 booster-crimp-gold z-20 border-b border-amber-900/50 flex items-center justify-center">
                <span className="text-[9px] font-mono font-black text-amber-950 uppercase tracking-widest opacity-80">
                  FATGOATS TCG
                </span>
              </div>

              {/* Pack Foil Artwork */}
              <img
                src={cardBackUrl || '/cards/00 - Celestial Goat Card Back.png'}
                alt="Booster Pack"
                className="w-full h-full object-cover group-hover:brightness-110 transition duration-300"
              />

              {/* Metallic Foil Shimmer Overlay */}
              <div className="absolute inset-0 tcg-holo-rainbow pointer-events-none opacity-45 group-hover:opacity-75 transition-opacity" />

              {/* Perforated Tear Line */}
              <div className="absolute top-14 inset-x-0 border-b-2 border-dashed border-amber-300/80 z-20 flex items-center justify-between px-3">
                <span className="text-[9px] font-bold font-mono text-amber-200 bg-black/70 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  ✂ Tear Here
                </span>
                <Flame className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>

              {/* Bottom Foil Crimp */}
              <div className="absolute bottom-0 inset-x-0 h-6 booster-crimp-gold z-20 border-t border-amber-900/50 flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-amber-950 tracking-wider">
                  ★ 5 CARDS ★
                </span>
              </div>

              {/* Glowing Center Badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px] group-hover:bg-black/10 transition">
                <motion.div
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8 }}
                  className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/50 flex items-center gap-1.5 border border-amber-200"
                >
                  <PackageOpen className="w-4 h-4" />
                  <span>Rip Pack</span>
                </motion.div>
              </div>
            </motion.div>

            {/* Tap to open button */}
            <button
              onClick={handleStartTear}
              className="mt-6 flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <PackageOpen className="w-5 h-5 stroke-[2.5]" />
              <span>Rip Open Booster Pack</span>
            </button>
          </div>
        )}

        {/* STAGE 2: TEARING ANIMATION */}
        {stage === 'tearing' && (
          <div className="py-12 sm:py-16 flex flex-col items-center justify-center">
            <motion.div
              animate={{ rotateZ: [-3, 3, -3], scale: [1, 1.08, 1.15] }}
              transition={{ duration: 0.7 }}
              className="relative w-48 sm:w-56 aspect-[700/1060] rounded-2xl overflow-hidden border-2 border-amber-400 shadow-[0_0_80px_rgba(245,158,11,0.6)]"
            >
              <img
                src={cardBackUrl}
                alt="Tearing Pack"
                className="w-full h-full object-cover filter brightness-125"
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 0.6 }}
                className="absolute top-12 left-0 h-1 bg-gradient-to-r from-amber-200 via-white to-amber-200 shadow-[0_0_20px_#fff]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-amber-400/40 to-white/70 animate-pulse" />
            </motion.div>
            <p className="mt-4 font-display font-black text-amber-300 text-base animate-pulse">
              UNSEALING CELESTIAL POWER...
            </p>
          </div>
        )}

        {/* STAGE 3: CARD-BY-CARD HAND STACK REVEAL */}
        {stage === 'stack' && currentCard && (
          <div className="py-2 sm:py-4 flex flex-col items-center justify-center">
            
            {/* Progress indicator */}
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/40">
                Card {currentStackIndex + 1} of {pulledCards.length}
              </span>
              {currentStackIndex === pulledCards.length - 1 && (
                <span className="flex items-center gap-1 font-bold text-xs text-rose-300 bg-rose-950/80 px-2.5 py-1 rounded-full border border-rose-500/40 animate-pulse">
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  FOIL HIT SLOT!
                </span>
              )}
            </div>

            {/* Hand-Held Card Stack with 3D Offset Layers */}
            <div 
              onClick={handleNextCardInStack}
              className="relative w-64 sm:w-72 aspect-[731/1024] cursor-pointer group select-none my-2"
              title="Click or tap to slide to next card"
            >
              {/* Ghost Stack Cards Behind to show physical depth */}
              {pulledCards.slice(currentStackIndex + 1).map((_, i) => (
                <div
                  key={i}
                  style={{
                    transform: `translateY(${(i + 1) * -5}px) scale(${1 - (i + 1) * 0.03})`,
                    zIndex: 5 - i,
                  }}
                  className="absolute inset-0 rounded-2xl bg-slate-900 border border-slate-700/60 shadow-xl transition-all"
                >
                  <img
                    src={cardBackUrl}
                    alt="Card back"
                    className="w-full h-full object-cover rounded-2xl opacity-40"
                  />
                </div>
              ))}

              {/* ACTIVE TOP CARD */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentCard.id}
                  initial={{ x: 60, opacity: 0, rotateZ: 6 }}
                  animate={{ x: 0, opacity: 1, rotateZ: 0 }}
                  exit={{ x: -140, opacity: 0, rotateZ: -14 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                  className="relative w-full h-full rounded-2xl overflow-hidden border-2 border-amber-400/90 shadow-2xl shadow-black z-20 bg-slate-950"
                >
                  <img
                    src={currentCard.imageUrl}
                    alt={currentCard.title}
                    className="w-full h-full object-cover"
                  />

                  {/* Foil Hologram Effect on Rares */}
                  {(currentCard.rarity === 'Legendary' || currentCard.rarity === 'Secret Rare' || currentCard.rarity === 'Mythic Rare') && (
                    <div className="absolute inset-0 tcg-holo-rainbow pointer-events-none opacity-50" />
                  )}

                  {/* Card Rarity Badge on reveal */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                    <span className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-amber-300 font-mono text-[10px] font-bold border border-amber-500/30">
                      #{currentCard.cardNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-black/85 backdrop-blur-md text-white font-bold text-[10px] uppercase border border-white/20">
                      {currentCard.rarity}
                    </span>
                  </div>

                  {/* Bottom title banner */}
                  <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent text-left pointer-events-none">
                    <h3 className="font-display font-bold text-sm text-white truncate">
                      {currentCard.title}
                    </h3>
                    <p className="text-xs text-slate-300 truncate">
                      {currentCard.subtitle}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Slide Action Button */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleNextCardInStack}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <span>{isLastCard ? 'Finish Pack & View All' : 'Slide to Next Card'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Tap the card or button above to deal next
            </p>
          </div>
        )}

        {/* STAGE 4: PACK SUMMARY GRID */}
        {stage === 'summary' && (
          <div className="py-2 sm:py-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <h3 className="font-display font-black text-lg text-white">
                Pack Opened Successfully!
              </h3>
            </div>

            {/* 5 Cards Row */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5 my-3 sm:my-5">
              {pulledCards.map((c, idx) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => onInspectCard(c)}
                  className="relative aspect-[731/1024] rounded-xl overflow-hidden border border-slate-700 hover:border-amber-400 cursor-pointer group shadow-lg transition-all hover:scale-105"
                  title="Click to inspect in 3D"
                >
                  <img
                    src={c.thumbUrl || c.imageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover"
                  />
                  {(c.rarity === 'Legendary' || c.rarity === 'Secret Rare' || c.rarity === 'Mythic Rare') && (
                    <div className="absolute inset-0 tcg-holo-rainbow pointer-events-none opacity-40" />
                  )}
                  <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/80 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="w-3 h-3" />
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-1.5 bg-black/90 text-left">
                    <p className="text-[9px] text-amber-300 font-bold uppercase truncate">
                      {c.rarity}
                    </p>
                    <p className="text-[11px] text-white font-bold truncate">
                      {c.title}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleClaimAll}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 active:scale-95 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Add All 5 to Your Binder</span>
              </button>

              <button
                onClick={handleOpenAnother}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Open Another Pack</span>
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};
