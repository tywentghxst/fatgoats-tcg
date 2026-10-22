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
  Layers,
  MessageSquareQuote,
  FastForward,
  BookOpen,
  ScrollText
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
  const [showFlash, setShowFlash] = useState(false);
  const [isFlippedManual, setIsFlippedManual] = useState(false);
  const [showMobileLore, setShowMobileLore] = useState(false);
  const [showLoreDetails, setShowLoreDetails] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Animated stat counters
  const [displayHp, setDisplayHp] = useState(0);
  const [displayAtk, setDisplayAtk] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);

  // 3D Parallax & Tilt Physics
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springConfig = { damping: 18, stiffness: 220, mass: 0.1 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [18, -18]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-18, 18]), springConfig);
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const currentCard = newCards[currentIndex];
  const isCurrentRevealed = revealedIndices.has(currentIndex);

  // Reset states when current card index changes
  useEffect(() => {
    x.set(0);
    y.set(0);
    setIsFlippedManual(false);
    setIsCharging(false);
    setShowFlash(false);
    setShowMobileLore(false);
    setShowLoreDetails(false);

    if (currentCard && revealedIndices.has(currentIndex)) {
      setDisplayHp(currentCard.hp);
      setDisplayAtk(currentCard.attack);
    } else {
      setDisplayHp(0);
      setDisplayAtk(0);
    }
  }, [currentIndex, currentCard, revealedIndices, x, y]);

  // Touch & Pointer 3D tilt handlers
  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (clientX - rect.left) / rect.width - 0.5;
    const yPct = (clientY - rect.top) / rect.height - 0.5;
    x.set(Math.max(-0.6, Math.min(0.6, xPct)));
    y.set(Math.max(-0.6, Math.min(0.6, yPct)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Spectacular multi-directional confetti blast
  const triggerEpicConfetti = () => {
    try {
      // Left burst
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 75,
        origin: { x: 0.15, y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#ec4899', '#a855f7', '#10b981'],
      });
      // Right burst
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 75,
        origin: { x: 0.85, y: 0.6 },
        colors: ['#f59e0b', '#38bdf8', '#ec4899', '#a855f7', '#10b981'],
      });
    } catch {
      // fallback
    }
  };

  // Stat count up animation
  const animateStats = (targetHp: number, targetAtk: number) => {
    const duration = 900;
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setDisplayHp(Math.round(targetHp * ease));
      setDisplayAtk(Math.round(targetAtk * ease));

      if (currentStep >= steps) {
        clearInterval(timer);
        setDisplayHp(targetHp);
        setDisplayAtk(targetAtk);
      }
    }, stepTime);
  };

  // Perform full fluid reveal
  const handleUnveilCurrent = () => {
    if (isCharging || isCurrentRevealed || !currentCard) return;

    setIsCharging(true);
    sound.playCelestialCharge();

    // After charging build-up, trigger the explosion & flip!
    setTimeout(() => {
      setIsCharging(false);
      setShowFlash(true);
      sound.playCardRevealBlast();
      triggerEpicConfetti();

      setRevealedIndices((prev) => {
        const next = new Set(prev);
        next.add(currentIndex);
        if (next.size === newCards.length) {
          setTimeout(() => {
            sound.playVictoryFanfare();
            setIsComplete(true);
          }, 1800);
        }
        return next;
      });

      // Animate stat counters
      animateStats(currentCard.hp, currentCard.attack);

      // Automatically add to collection
      onAddCardsToOwned([currentCard.id]);

      // Turn off flash after 250ms
      setTimeout(() => setShowFlash(false), 250);
    }, 700);
  };

  // Fast reveal all
  const handleRevealAll = () => {
    const allIndices = new Set(newCards.map((_, i) => i));
    setRevealedIndices(allIndices);
    sound.playCardRevealBlast();
    triggerEpicConfetti();
    onAddCardsToOwned(newCards.map((c) => c.id));
    setTimeout(() => {
      sound.playVictoryFanfare();
      setIsComplete(true);
    }, 800);
  };

  const handleNext = () => {
    if (currentIndex < newCards.length - 1) {
      sound.playCardFlip();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      sound.playCardFlip();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 overflow-hidden">
      {/* Deep cosmic backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#03060f]/95 backdrop-blur-2xl"
      />

      {/* Radiant Screen Flash on Reveal */}
      <AnimatePresence>
        {showFlash && (
          <motion.div
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-white pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Floating Animated Cosmic Nebulae & Starlight Sparks */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/3 w-[550px] h-[550px] bg-cyan-500/15 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute -bottom-32 right-1/4 w-[550px] h-[550px] bg-amber-500/15 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '1.2s' }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#03060f_90%)]" />
      </div>

      {/* Modal Dialog Card Container - Uses maximum vertical height on mobile so the card is huge! */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 280 }}
        className="relative z-10 w-full max-w-[96vw] sm:max-w-xl md:max-w-4xl bg-slate-900/95 border border-amber-500/35 rounded-2xl sm:rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.25)] p-2.5 sm:p-6 flex flex-col justify-between my-auto h-[93vh] sm:h-auto max-h-[96vh] overflow-hidden"
      >
        {/* Streamlined Top Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1.5 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-gradient-to-br from-amber-500/25 to-cyan-500/25 border border-amber-400/40 text-amber-300">
              <Sparkles className="w-3.5 h-3.5 fill-current animate-spin" style={{ animationDuration: '8s' }} />
            </span>
            <div className="flex items-center gap-1.5">
              <h2 className="font-display font-black text-xs sm:text-base text-white tracking-wide">
                CELESTIAL SUMMONING
              </h2>
              <span className="bg-amber-400/20 border border-amber-400/50 text-amber-300 text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase">
                New Drops
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {!isComplete && (
              <button
                onClick={handleRevealAll}
                title="Instantly reveal all remaining cards"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] sm:text-xs font-semibold hover:bg-cyan-900 transition active:scale-95"
              >
                <FastForward className="w-3 h-3" />
                <span>Fast Reveal</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition active:scale-90"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* ACTIVE STAGE: Unveil Ritual */}
        {!isComplete ? (
          <div className="flex flex-col flex-1 justify-between min-h-0 overflow-hidden">
            {/* Compact Step Beacon Dots */}
            <div className="flex items-center justify-between mb-1 sm:mb-2 px-1 shrink-0">
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-0.5 max-w-[70%]">
                {newCards.map((c, i) => {
                  const isRev = revealedIndices.has(i);
                  const isCurrent = i === currentIndex;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        sound.playCardFlip();
                        setCurrentIndex(i);
                      }}
                      className={`relative flex items-center justify-center rounded-full transition-all duration-300 ${
                        isCurrent
                          ? 'w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 font-black text-[10px] shadow-md shadow-amber-400/50 scale-105'
                          : isRev
                          ? 'w-5 h-5 sm:w-6 sm:h-6 bg-emerald-500/30 border border-emerald-400/60 text-emerald-300 font-bold text-[9px]'
                          : 'w-5 h-5 sm:w-6 sm:h-6 bg-slate-800/80 border border-slate-700 text-slate-400 text-[9px]'
                      }`}
                    >
                      {isRev ? (
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="text-[10px] sm:text-xs font-mono text-slate-400">
                Card <strong className="text-amber-300 font-bold">#{currentCard.cardNumber}</strong> ({currentIndex + 1}/{newCards.length})
              </div>
            </div>

            {/* Central Unveil Arena - Maximizes vertical space for big card display */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-6 items-center flex-1 min-h-0">
              
              {/* Left/Center: The Floating 3D Card Artifact (Scaled MUCH Larger!) */}
              <div className="md:col-span-6 flex flex-col items-center justify-center flex-1 min-h-0 py-0.5">
                <div
                  ref={cardRef}
                  onMouseMove={handleMouseMove}
                  onTouchMove={handleTouchMove}
                  onMouseLeave={handlePointerLeave}
                  onTouchEnd={handlePointerLeave}
                  onClick={() => {
                    if (!isCurrentRevealed) {
                      handleUnveilCurrent();
                    } else {
                      sound.playCardFlip();
                      setIsFlippedManual(!isFlippedManual);
                    }
                  }}
                  className="relative cursor-pointer select-none group flex items-center justify-center"
                  style={{ perspective: 1200 }}
                >
                  {/* Arcane Summoning Ring (Rotating SVG Behind Card) */}
                  <div className="absolute -inset-10 sm:-inset-16 flex items-center justify-center pointer-events-none">
                    <div 
                      className={`w-full h-full rounded-full border border-dashed transition-all duration-700 ${
                        isCharging
                          ? 'border-amber-400 opacity-90 animate-spin scale-110'
                          : isCurrentRevealed
                          ? 'border-cyan-500/30 opacity-40'
                          : 'border-purple-500/25 opacity-30'
                      }`}
                      style={{ animationDuration: isCharging ? '3s' : '18s' }}
                    />
                  </div>

                  {/* Concentric Shockwave Aura Ring when Charging */}
                  {isCharging && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 1 }}
                      animate={{ scale: 1.45, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 0.65, ease: 'easeOut' }}
                      className="absolute -inset-6 rounded-3xl border-2 border-amber-400 bg-amber-400/20 pointer-events-none"
                    />
                  )}

                  {/* 3D Motion Card Container - Significantly Enlarged! */}
                  <motion.div
                    style={{
                      rotateX,
                      rotateY,
                      transformStyle: 'preserve-3d',
                    }}
                    animate={
                      isCharging
                        ? {
                            x: [0, -3, 3, -3, 3, 0],
                            y: [0, 2, -2, 2, -2, 0],
                            scale: [1, 1.04, 0.98, 1.06],
                          }
                        : isCurrentRevealed
                        ? {
                            y: [0, -4, 0],
                            scale: 1,
                          }
                        : {
                            y: [0, -5, 0],
                            scale: 1,
                          }
                    }
                    transition={{
                      repeat: isCharging ? Infinity : Infinity,
                      repeatType: 'reverse',
                      duration: isCharging ? 0.2 : 3.2,
                      ease: 'easeInOut',
                    }}
                    className="w-[240px] xs:w-[275px] sm:w-[310px] md:w-[330px] max-h-[54vh] sm:max-h-[62vh] aspect-[1/1.4] rounded-2xl relative shadow-2xl"
                  >
                    {/* Flipping 3D Inner Wrapper */}
                    <motion.div
                      animate={{
                        rotateY: !isCurrentRevealed || isFlippedManual ? 180 : 0,
                      }}
                      transition={{ duration: 0.7, ease: [0.2, 0.9, 0.3, 1] }}
                      className="w-full h-full relative"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* FRONT FACE (Revealed High-Res Artwork) */}
                      <div
                        className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-950 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.35)]"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <img
                          src={currentCard.imageUrl}
                          alt={currentCard.title}
                          className="w-full h-full object-cover select-none"
                        />

                        {/* Interactive Prismatic Holographic Sheen */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.4) 0%, rgba(255,215,0,0.2) 30%, rgba(56,189,248,0.25) 55%, transparent 75%)`,
                            mixBlendMode: 'color-dodge',
                          }}
                        />

                        {/* Top Banner Tag */}
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 fill-current" />
                          NEW DROP
                        </div>
                      </div>

                      {/* BACK FACE (Universal Celestial Card Back) */}
                      <div
                        className="absolute inset-0 rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/80 shadow-[0_0_30px_rgba(0,0,0,0.85)]"
                        style={{
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                        }}
                      >
                        <img
                          src={cardBackUrl}
                          alt="Card Back"
                          className="w-full h-full object-cover select-none"
                        />

                        {/* Mystery Pulse Prompt Overlay when Unrevealed */}
                        {!isCurrentRevealed && (
                          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] flex flex-col items-center justify-center p-3 text-center">
                            <motion.div
                              animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-amber-400 to-amber-300 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-400/50 mb-2"
                            >
                              <Sparkles className="w-6 h-6 sm:w-8 h-8 fill-current" />
                            </motion.div>
                            <span className="font-display font-black text-xs sm:text-sm text-white tracking-widest uppercase drop-shadow">
                              Tap to Summon
                            </span>
                            <span className="text-[10px] sm:text-[11px] text-amber-300 font-mono mt-0.5">
                              Card #{currentCard.cardNumber}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* MOBILE ONLY: Quick Action Row Directly Under Big Card */}
                {isCurrentRevealed && (
                  <div className="md:hidden flex items-center justify-center gap-2 mt-2 shrink-0">
                    <button
                      onClick={() => {
                        sound.playCardFlip();
                        setIsFlippedManual(!isFlippedManual);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-[11px] font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Flip ({isFlippedManual ? 'Front' : 'Back'})</span>
                    </button>

                    <button
                      onClick={() => {
                        sound.playSparkle();
                        setShowMobileLore(true);
                      }}
                      className="px-3.5 py-1 rounded-xl bg-gradient-to-r from-amber-500/25 to-purple-500/25 border border-amber-400/60 text-[11px] font-bold text-amber-300 flex items-center gap-1.5 shadow-md active:scale-95"
                    >
                      <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                      <span>View Lore & Stats</span>
                    </button>
                  </div>
                )}
              </div>

              {/* DESKTOP ONLY: Side-by-side Walkout Attributes & Lore */}
              <div className="hidden md:flex md:col-span-6 flex-col justify-between h-full space-y-3">
                <AnimatePresence mode="wait">
                  {isCurrentRevealed ? (
                    <motion.div
                      key={`revealed-desktop-${currentCard.id}`}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-3"
                    >
                      {/* Rarity Stomp Badge */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <motion.span
                          initial={{ scale: 2, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', damping: 14, stiffness: 300 }}
                          className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 shadow-md shadow-amber-500/25"
                        >
                          ★ {currentCard.rarity}
                        </motion.span>
                        <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                          {currentCard.element}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          #{currentCard.cardNumber}
                        </span>
                      </div>

                      {/* Title & Subtitle */}
                      <div>
                        <h3 className="font-display font-black text-2xl lg:text-3xl text-white tracking-tight">
                          {currentCard.title}
                        </h3>
                        <p className="text-sm font-semibold text-amber-300">
                          {currentCard.subtitle}
                        </p>
                      </div>

                      {/* Character Quote Bubble */}
                      {currentCard.flavorText && (
                        <div className="flex items-start gap-2 bg-gradient-to-r from-amber-500/10 to-transparent p-2 rounded-xl border-l-2 border-amber-400 text-xs italic text-slate-200">
                          <MessageSquareQuote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <span>{currentCard.flavorText}</span>
                        </div>
                      )}

                      {/* Live Animated Stat Tiles */}
                      <div className="grid grid-cols-4 gap-2 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-emerald-400 font-bold mb-0.5">
                            <Flame className="w-3 h-3" /> HP
                          </div>
                          <span className="font-mono font-black text-sm text-white">
                            {displayHp}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-rose-400 font-bold mb-0.5">
                            <Swords className="w-3 h-3" /> ATK
                          </div>
                          <span className="font-mono font-black text-sm text-white">
                            {displayAtk}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-blue-400 font-bold mb-0.5">
                            <Shield className="w-3 h-3" /> DEF
                          </div>
                          <span className="font-mono font-black text-xs sm:text-sm text-white">
                            {currentCard.defense}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px] text-amber-400 font-bold mb-0.5">
                            <Zap className="w-3 h-3" /> SPD
                          </div>
                          <span className="font-mono font-black text-xs sm:text-sm text-white">
                            {currentCard.speed}
                          </span>
                        </div>
                      </div>

                      {/* Ability Box */}
                      <div className="bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-cyan-300 flex items-center gap-1">
                            <Award className="w-3.5 h-3.5" />
                            {currentCard.abilityName}
                          </span>
                          <button
                            onClick={() => setShowLoreDetails(!showLoreDetails)}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                          >
                            <BookOpen className="w-3 h-3" />
                            {showLoreDetails ? 'Hide' : 'Details'}
                          </button>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed mt-1">
                          {currentCard.abilityDesc}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Registered to your personal binder!</span>
                      </div>
                    </motion.div>
                  ) : (
                    /* UNREVEALED MYSTERY STATE */
                    <div className="py-6 space-y-3">
                      <div className="inline-block p-2.5 rounded-2xl bg-amber-400/10 border border-amber-400/25 text-amber-300">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <h3 className="font-display font-black text-xl text-white">
                        Cosmic Relic #{currentCard.cardNumber}
                      </h3>
                      <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                        A newly imported celestial card is pulsing with raw energy from the cosmos.
                        Break the astral seal to trigger the walkout reveal and claim it!
                      </p>

                      <button
                        onClick={handleUnveilCurrent}
                        disabled={isCharging}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-slate-950 font-display font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4 fill-current" />
                        {isCharging ? 'Unleashing Power...' : 'Unveil Card Now'}
                      </button>
                    </div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Bottom Primary Controls (Pinned to Bottom, Highly Accessible!) */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-1.5 shrink-0">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950/80 text-slate-300 hover:text-white disabled:opacity-20 text-xs font-bold transition flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              {/* Center / Action Button */}
              {isCurrentRevealed ? (
                currentIndex < newCards.length - 1 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 ml-2.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-500 hover:brightness-110 text-slate-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-cyan-500/25 active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <span>NEXT CARD ({currentIndex + 2}/{newCards.length})</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsComplete(true)}
                    className="flex-1 ml-2.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 hover:brightness-110 text-slate-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/25 active:scale-95 transition flex items-center justify-center gap-1.5"
                  >
                    <span>Finish & View All</span>
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                )
              ) : (
                <button
                  onClick={handleUnveilCurrent}
                  disabled={isCharging}
                  className="flex-1 ml-2.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 hover:brightness-110 text-slate-950 font-display font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 fill-current" />
                  <span>{isCharging ? 'Summoning...' : 'Unveil Card Now'}</span>
                </button>
              )}
            </div>

          </div>
        ) : (
          /* FINALE SCREEN: All Cards Summoned Showcase */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3 sm:py-6 space-y-3 sm:space-y-6 flex-1 overflow-y-auto"
          >
            <div className="inline-flex p-2.5 sm:p-3 rounded-full bg-gradient-to-tr from-amber-400 to-rose-500 text-slate-950 shadow-lg shadow-amber-500/30">
              <Sparkles className="w-6 sm:w-7 h-6 sm:h-7 fill-current" />
            </div>

            <div>
              <h3 className="font-display font-black text-lg sm:text-3xl text-white">
                ALL {newCards.length} NEW CARDS SUMMONED!
              </h3>
              <p className="text-[11px] sm:text-sm text-slate-400 max-w-md mx-auto mt-0.5">
                Your binder has been enriched with the latest celestial arrivals.
              </p>
            </div>

            {/* Fanned / Showcase Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 max-h-[44vh] overflow-y-auto p-1">
              {newCards.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl overflow-hidden border border-amber-400/50 bg-slate-950 shadow-lg group hover:border-amber-400 transition"
                >
                  <div className="aspect-[1/1.4] overflow-hidden">
                    <img
                      src={c.thumbUrl || c.imageUrl}
                      alt={c.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="p-1.5 text-left bg-slate-950/95 border-t border-slate-800">
                    <span className="text-[9px] font-mono text-amber-300 font-bold">#{c.cardNumber}</span>
                    <h4 className="font-display font-bold text-[11px] text-white truncate">
                      {c.title}
                    </h4>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Action Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  onFilterNewInGallery();
                  onClose();
                }}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Compass className="w-4 h-4" />
                Filter Gallery to New Drops
              </button>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs active:scale-95 transition flex items-center justify-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                Return to Vault
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* MOBILE-ONLY SLIDE-UP LORE & STATS DRAWER (Clean, dedicated sheet) */}
      <AnimatePresence>
        {showMobileLore && currentCard && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileLore(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              className="relative w-full max-h-[82vh] bg-[#09101d] border-t border-amber-400/50 rounded-t-3xl shadow-2xl p-4 flex flex-col overflow-y-auto z-10 space-y-3"
            >
              {/* Drawer Handle */}
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto shrink-0 mb-1" />

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs text-amber-300 font-bold">#{currentCard.cardNumber}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-400/20 text-amber-300 border border-amber-400/40">
                      {currentCard.rarity}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-mono">
                      {currentCard.element}
                    </span>
                  </div>
                  <h3 className="font-display font-black text-lg text-white">
                    {currentCard.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentCard.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => setShowMobileLore(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quote Bubble */}
              {currentCard.flavorText && (
                <div className="flex items-start gap-2 bg-gradient-to-r from-amber-500/15 to-transparent p-2.5 rounded-xl border-l-2 border-amber-400 text-xs italic text-slate-200">
                  <MessageSquareQuote className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{currentCard.flavorText}</span>
                </div>
              )}

              {/* 4 Stat Boxes */}
              <div className="grid grid-cols-4 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-400 font-bold mb-0.5">
                    <Flame className="w-3 h-3" /> HP
                  </div>
                  <span className="font-mono font-black text-sm text-white">
                    {currentCard.hp}
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-rose-400 font-bold mb-0.5">
                    <Swords className="w-3 h-3" /> ATK
                  </div>
                  <span className="font-mono font-black text-sm text-white">
                    {currentCard.attack}
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-blue-400 font-bold mb-0.5">
                    <Shield className="w-3 h-3" /> DEF
                  </div>
                  <span className="font-mono font-black text-sm text-white">
                    {currentCard.defense}
                  </span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-amber-400 font-bold mb-0.5">
                    <Zap className="w-3 h-3" /> SPD
                  </div>
                  <span className="font-mono font-black text-sm text-white">
                    {currentCard.speed}
                  </span>
                </div>
              </div>

              {/* Special Ability Box */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div className="text-xs font-bold text-cyan-300 flex items-center gap-1.5 mb-1">
                  <Award className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Ability: {currentCard.abilityName}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentCard.abilityDesc}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => setShowMobileLore(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs active:scale-95 transition"
              >
                Close Lore & Return to Card
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
