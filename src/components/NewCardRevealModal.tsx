import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  RotateCw, 
  Check, 
  Flame, 
  Shield, 
  Zap, 
  Swords, 
  Award, 
  Compass, 
  Layers 
} from 'lucide-react';
import { CardItem as CardItemType } from '../types';
import { sound } from '../utils/audio';

interface NewCardRevealModalProps {
  newCards: CardItemType[];
  cardBackUrl: string;
  onClose: () => void;
  onAddCardsToOwned: (cardIds: string[]) => void;
  onFilterNewInGallery: () => void;
}

export const NewCardRevealModal: React.FC<NewCardRevealModalProps> = ({
  newCards,
  cardBackUrl,
  onClose,
  onAddCardsToOwned,
  onFilterNewInGallery,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealedIndices, setRevealedIndices] = useState<Set<number>>(new Set());
  const [isCharging, setIsCharging] = useState(false);
  const [isFlippedManual, setIsFlippedManual] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Spring Physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 240, mass: 0.1 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [20, -20]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-20, 20]), springConfig);

  const currentCard = newCards[currentIndex];
  const isCurrentRevealed = revealedIndices.has(currentIndex);

  // Reset 3D tilt and manual flip when changing cards
  useEffect(() => {
    x.set(0);
    y.set(0);
    setIsFlippedManual(false);
    setIsCharging(false);
  }, [currentIndex, x, y]);

  // Handle cursor tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || !isCurrentRevealed) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Trigger cosmic confetti
  const fireCosmicConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#38bdf8', '#f59e0b', '#ec4899', '#a855f7', '#10b981'],
        shapes: ['circle', 'square'],
      });
    } catch {
      // fallback
    }
  };

  // Perform reveal animation
  const handleUnveilCurrent = () => {
    if (isCharging || isCurrentRevealed) return;

    setIsCharging(true);
    sound.playCelestialCharge();

    setTimeout(() => {
      setIsCharging(false);
      setRevealedIndices((prev) => {
        const next = new Set(prev);
        next.add(currentIndex);
        if (next.size === newCards.length) {
          setTimeout(() => {
            sound.playVictoryFanfare();
            setIsComplete(true);
          }, 1400);
        }
        return next;
      });

      sound.playCardRevealBlast();
      fireCosmicConfetti();

      // Automatically claim this card
      if (currentCard) {
        onAddCardsToOwned([currentCard.id]);
      }
    }, 750);
  };

  // Fast reveal all
  const handleRevealAll = () => {
    const allIndices = new Set(newCards.map((_, i) => i));
    setRevealedIndices(allIndices);
    sound.playCardRevealBlast();
    fireCosmicConfetti();
    onAddCardsToOwned(newCards.map((c) => c.id));
    setTimeout(() => {
      sound.playVictoryFanfare();
      setIsComplete(true);
    }, 800);
  };

  const handleNext = () => {
    if (currentIndex < newCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Immersive backdrop with cosmic ambient blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#040711]/90 backdrop-blur-2xl"
      />

      {/* Floating Animated Nebular Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[130px] animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#040711_85%)]" />
      </div>

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="relative z-10 w-full max-w-4xl bg-slate-900/95 border border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.2)] p-4 sm:p-8 flex flex-col my-auto max-h-[95vh] overflow-y-auto"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 sm:pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-cyan-500/20 border border-amber-400/30 text-amber-300">
              <Sparkles className="w-5 h-5 fill-current animate-spin-slow" />
            </span>
            <div>
              <h2 className="font-display font-black text-base sm:text-xl text-white tracking-wide flex items-center gap-2">
                CELESTIAL SUMMONING SHRINE
                <span className="bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded-full uppercase">
                  New Drop
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Witness newly materialized cards entering the FatGoats TCG universe.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Not Complete: Unveil Chamber */}
        {!isComplete ? (
          <div>
            {/* Step Progress Pills */}
            <div className="flex items-center justify-between mb-5 px-1">
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-[70%]">
                {newCards.map((c, i) => {
                  const isRev = revealedIndices.has(i);
                  const isCurrent = i === currentIndex;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCurrentIndex(i)}
                      className={`h-2.5 rounded-full transition-all duration-300 ${
                        isCurrent
                          ? 'w-8 bg-amber-400 shadow-md shadow-amber-400/50'
                          : isRev
                          ? 'w-4 bg-emerald-400/70'
                          : 'w-2.5 bg-slate-700 hover:bg-slate-600'
                      }`}
                      title={`${c.cardNumber} - ${c.title}`}
                    />
                  );
                })}
              </div>

              <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                <span>
                  Card <strong className="text-amber-300">{currentIndex + 1}</strong> of{' '}
                  {newCards.length}
                </span>
                <button
                  onClick={handleRevealAll}
                  className="hidden sm:inline-flex text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  Reveal All
                </button>
              </div>
            </div>

            {/* Central Stage */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left / Center: Interactive 3D Card Display */}
              <div className="md:col-span-6 flex flex-col items-center justify-center">
                <div
                  ref={cardRef}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    if (!isCurrentRevealed) {
                      handleUnveilCurrent();
                    } else {
                      sound.playCardFlip();
                      setIsFlippedManual(!isFlippedManual);
                    }
                  }}
                  className="relative cursor-pointer select-none group"
                  style={{ perspective: 1200 }}
                >
                  {/* Energy Aura Rays when Charging or Revealed */}
                  <div
                    className={`absolute -inset-6 rounded-3xl transition-opacity duration-700 pointer-events-none ${
                      isCharging
                        ? 'opacity-100 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.5)_0%,transparent_70%)] animate-pulse'
                        : isCurrentRevealed
                        ? 'opacity-60 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.3)_0%,transparent_70%)]'
                        : 'opacity-20 group-hover:opacity-40 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.3)_0%,transparent_70%)]'
                    }`}
                  />

                  {/* 3D Motion Container */}
                  <motion.div
                    style={{
                      rotateX: isCurrentRevealed ? rotateX : 0,
                      rotateY: isCurrentRevealed ? rotateY : 0,
                      transformStyle: 'preserve-3d',
                    }}
                    animate={{
                      scale: isCharging ? [1, 1.05, 0.98, 1.06] : 1,
                      rotate: isCharging ? [0, -1, 1, -2, 2, 0] : 0,
                    }}
                    transition={{ duration: 0.6 }}
                    className="w-[240px] sm:w-[280px] md:w-[310px] aspect-[1/1.4] rounded-2xl relative shadow-2xl transition-shadow"
                  >
                    {/* Flipping 3D Inner Wrapper */}
                    <motion.div
                      animate={{
                        rotateY: !isCurrentRevealed || isFlippedManual ? 180 : 0,
                      }}
                      transition={{ duration: 0.65, ease: [0.23, 1, 0.32, 1] }}
                      className="w-full h-full relative"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* FRONT FACE (Revealed Art) */}
                      <div
                        className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <img
                          src={currentCard.imageUrl}
                          alt={currentCard.title}
                          className="w-full h-full object-cover"
                        />
                        {/* Shimmering Foil Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/15 via-transparent to-pink-500/15 pointer-events-none" />
                        <div className="absolute top-2.5 left-2.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          NEW
                        </div>
                      </div>

                      {/* BACK FACE (Universal Card Back) */}
                      <div
                        className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-700/80 shadow-[0_0_25px_rgba(0,0,0,0.8)]"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <img
                          src={cardBackUrl}
                          alt="Card Back"
                          className="w-full h-full object-cover"
                        />
                        {/* Unrevealed Floating Prompt Overlay */}
                        {!isCurrentRevealed && (
                          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                            <motion.div
                              animate={{ scale: [1, 1.12, 1] }}
                              transition={{ repeat: Infinity, duration: 1.8 }}
                              className="w-14 h-14 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/40 mb-3"
                            >
                              <Sparkles className="w-7 h-7 fill-current" />
                            </motion.div>
                            <span className="font-display font-black text-sm text-white tracking-wider uppercase drop-shadow">
                              Tap to Unveil
                            </span>
                            <span className="text-[11px] text-amber-300 font-mono mt-1">
                              Card #{currentCard.cardNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Flip control hint when card is revealed */}
                {isCurrentRevealed && (
                  <button
                    onClick={() => {
                      sound.playCardFlip();
                      setIsFlippedManual(!isFlippedManual);
                    }}
                    className="mt-3 text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Flip to inspect {isFlippedManual ? 'Front' : 'Back'}
                  </button>
                )}
              </div>

              {/* Right: Card Details & Reveal Button */}
              <div className="md:col-span-6 flex flex-col justify-between h-full space-y-4">
                <AnimatePresence mode="wait">
                  {isCurrentRevealed ? (
                    <motion.div
                      key={`revealed-${currentCard.id}`}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      {/* Badge / Rarity */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/40">
                          {currentCard.rarity}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                          {currentCard.element}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          #{currentCard.cardNumber}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
                          {currentCard.title}
                        </h3>
                        <p className="text-sm font-medium text-amber-300">
                          {currentCard.subtitle}
                        </p>
                      </div>

                      {/* Stat Grid */}
                      <div className="grid grid-cols-4 gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 mb-0.5">
                            <Flame className="w-3 h-3" /> HP
                          </div>
                          <span className="font-mono font-bold text-sm text-white">
                            {currentCard.hp}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-rose-400 mb-0.5">
                            <Swords className="w-3 h-3" /> ATK
                          </div>
                          <span className="font-mono font-bold text-sm text-white">
                            {currentCard.attack}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-blue-400 mb-0.5">
                            <Shield className="w-3 h-3" /> DEF
                          </div>
                          <span className="font-mono font-bold text-sm text-white">
                            {currentCard.defense}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 mb-0.5">
                            <Zap className="w-3 h-3" /> SPD
                          </div>
                          <span className="font-mono font-bold text-sm text-white">
                            {currentCard.speed}
                          </span>
                        </div>
                      </div>

                      {/* Special Ability */}
                      <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80">
                        <div className="text-xs font-bold text-cyan-300 mb-1 flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          Ability: {currentCard.abilityName}
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {currentCard.abilityDesc}
                        </p>
                      </div>

                      {/* Flavor text */}
                      <blockquote className="border-l-2 border-amber-400/40 pl-3 py-1 text-xs italic text-slate-400">
                        {currentCard.flavorText}
                      </blockquote>

                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                        <Check className="w-4 h-4" /> Added to your card collection!
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unrevealed-info"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 py-8 text-center md:text-left"
                    >
                      <div className="inline-block p-3 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-300 mb-2">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="font-display font-bold text-xl text-white">
                        Mystery Card #{currentCard.cardNumber}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                        A newly imported celestial card is pulsing with raw energy from the cosmos.
                        Break the summoning seal to unveil its identity, attributes, and secret lore!
                      </p>

                      <button
                        onClick={handleUnveilCurrent}
                        disabled={isCharging}
                        className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        {isCharging ? 'Summoning...' : 'Unveil Card Now'}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom Navigation between Cards */}
                <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-auto">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>

                  {isCurrentRevealed ? (
                    currentIndex < newCards.length - 1 ? (
                      <button
                        onClick={handleNext}
                        className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-1.5"
                      >
                        Next Card <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsComplete(true)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-1.5"
                      >
                        Finish & View Showcase <Check className="w-4 h-4" />
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Grand Finale Showcase View */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-6"
          >
            <div className="inline-flex p-3 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-8 h-8 fill-current" />
            </div>

            <div>
              <h3 className="font-display font-black text-2xl sm:text-3xl text-white">
                ALL {newCards.length} NEW CARDS SUMMONED!
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-1">
                Every card from the latest drop is now unlocked, registered in your archive, and ready for IRL Quests.
              </p>
            </div>

            {/* Showcase Grid of All New Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 max-h-[45vh] overflow-y-auto p-2">
              {newCards.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl overflow-hidden border border-amber-400/40 bg-slate-950 shadow-md group hover:border-amber-400 transition"
                >
                  <div className="aspect-[1/1.4] overflow-hidden">
                    <img
                      src={c.thumbUrl || c.imageUrl}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-2 text-left bg-slate-950/90 border-t border-slate-800">
                    <span className="text-[9px] font-mono text-amber-300">#{c.cardNumber}</span>
                    <h4 className="font-display font-bold text-xs text-white truncate">
                      {c.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  onFilterNewInGallery();
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                View In Gallery
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm active:scale-95 transition flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                Return to Collection
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
