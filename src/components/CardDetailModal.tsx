import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { 
  X, 
  RotateCw, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  CheckCircle2, 
  Circle, 
  Download, 
  Sparkles, 
  Shield, 
  Swords, 
  HeartPulse, 
  Gauge, 
  Compass,
  Smartphone,
  BookOpen
} from 'lucide-react';
import { CardItem as CardItemType } from '../types';
import { sound } from '../utils/audio';

interface CardDetailModalProps {
  card: CardItemType | null;
  cardBackUrl: string;
  isOwned: boolean;
  isFavorite: boolean;
  onToggleOwned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onClose: () => void;
  onPrevCard: () => void;
  onNextCard: () => void;
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  cardBackUrl,
  isOwned,
  isFavorite,
  onToggleOwned,
  onToggleFavorite,
  onClose,
  onPrevCard,
  onNextCard,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mobileTab, setMobileTab] = useState<'card' | 'stats'>('card');
  const cardViewerRef = useRef<HTMLDivElement>(null);

  // Reset flip status & tab when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card?.id]);

  // Framer Motion 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 24, stiffness: 280, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [20, -20]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-20, 20]), springConfig);
  const glareOpacity = useSpring(useTransform(y, [-0.5, 0.5], [0.15, 0.65]), springConfig);

  // Mouse Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardViewerRef.current) return;
    const rect = cardViewerRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Touch Tilt for Mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardViewerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = cardViewerRef.current.getBoundingClientRect();
    const xPct = (touch.clientX - rect.left) / rect.width - 0.5;
    const yPct = (touch.clientY - rect.top) / rect.height - 0.5;
    x.set(Math.max(-0.6, Math.min(0.6, xPct)));
    y.set(Math.max(-0.6, Math.min(0.6, yPct)));
  };

  const handleTouchEnd = () => {
    x.set(0);
    y.set(0);
  };

  // Mobile Device Gyroscope / Motion Tilt
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
        // gamma is left-to-right tilt in degrees [-90, 90]
        // beta is front-to-back tilt in degrees [-180, 180]
        const gammaClamped = Math.max(-30, Math.min(30, event.gamma)) / 30;
        const betaClamped = Math.max(-30, Math.min(30, event.beta - 45)) / 30;
        x.set(gammaClamped * 0.5);
        y.set(betaClamped * 0.5);
      }
    };

    if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      if (typeof window !== 'undefined' && window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [x, y]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        onPrevCard();
      } else if (e.key === 'ArrowRight') {
        onNextCard();
      } else if (e.key === ' ' || e.key.toLowerCase() === 'f') {
        e.preventDefault();
        toggleFlip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevCard, onNextCard, isFlipped]);

  const toggleFlip = () => {
    sound.playCardFlip();
    setIsFlipped(!isFlipped);
  };

  if (!card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 lg:p-10 overflow-y-auto">
        
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-2xl"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-[#09101d] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden z-10 my-auto flex flex-col max-h-[96vh] sm:max-h-none"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-800 bg-slate-900/60 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs tracking-wider shrink-0">
                #{card.cardNumber}
              </span>
              <h2 className="font-display font-bold text-sm sm:text-lg text-white truncate">
                {card.title} <span className="text-slate-400 font-normal text-xs sm:text-sm hidden sm:inline">— {card.subtitle}</span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Mobile View Toggle Pills (3D Card vs Stats) */}
              <div className="flex sm:hidden items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 mr-1">
                <button
                  onClick={() => setMobileTab('card')}
                  className={`p-1.5 rounded-md text-xs transition-all ${
                    mobileTab === 'card'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400'
                  }`}
                  title="3D Card Viewer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setMobileTab('stats')}
                  className={`p-1.5 rounded-md text-xs transition-all ${
                    mobileTab === 'stats'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400'
                  }`}
                  title="Card Stats & Lore"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Flip Button */}
              <button
                onClick={toggleFlip}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-xs font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 active:scale-95 transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isFlipped ? "View Front" : "Flip to Back"}</span>
                <span className="sm:hidden">{isFlipped ? "Front" : "Flip"}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all active:scale-90"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 p-3 sm:p-8 items-center overflow-y-auto">
            
            {/* Left Column: 3D Interactive Card Viewer */}
            <div className={`lg:col-span-5 flex flex-col items-center justify-center ${mobileTab === 'stats' ? 'hidden sm:flex' : 'flex'}`}>
              
              {/* Prev / Next controls above */}
              <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-400 px-2">
                <button
                  onClick={onPrevCard}
                  className="flex items-center gap-1 hover:text-cyan-300 active:scale-95 transition py-1"
                >
                  <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Previous</span>
                </button>
                <span className="text-[11px] font-mono text-cyan-400">
                  {card.cardNumber} of 36
                </span>
                <button
                  onClick={onNextCard}
                  className="flex items-center gap-1 hover:text-cyan-300 active:scale-95 transition py-1"
                >
                  <span className="hidden sm:inline">Next</span> <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card Container with Perspective */}
              <div
                ref={cardViewerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={toggleFlip}
                className="perspective-1500 w-full max-w-[280px] sm:max-w-[340px] aspect-[731/1024] cursor-pointer group relative touch-none"
                title="Tap or click to flip card"
              >
                <motion.div
                  style={{
                    rotateX,
                    rotateY,
                    transformStyle: 'preserve-3d',
                  }}
                  animate={{
                    rotateY: isFlipped ? 180 : 0,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 24,
                  }}
                  className="w-full h-full relative transform-style-3d shadow-2xl rounded-2xl"
                >
                  {/* FRONT SIDE */}
                  <div 
                    className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-[#09101d] shadow-2xl shadow-cyan-950/60"
                  >
                    <img
                      src={card.imageUrl}
                      alt={card.title}
                      className="w-full h-full object-cover select-none"
                    />

                    {/* Front Specular / Foil Glare */}
                    <motion.div
                      className="absolute inset-0 holo-foil pointer-events-none"
                      style={{ opacity: glareOpacity }}
                    />
                  </div>

                  {/* BACK SIDE (Celestial Goat Card Back) */}
                  <div
                    className="absolute inset-0 backface-hidden rotate-y-180 rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-[#09101d] shadow-2xl shadow-amber-950/60"
                  >
                    <img
                      src={cardBackUrl || '/cards/00 - Celestial Goat Card Back.png'}
                      alt="00 - Celestial Goat Card Back"
                      className="w-full h-full object-cover select-none"
                    />

                    {/* Back Specular Glare */}
                    <motion.div
                      className="absolute inset-0 holo-foil pointer-events-none opacity-40"
                    />

                    {/* Back watermark pill */}
                    <div className="absolute bottom-3 sm:bottom-4 inset-x-3 sm:inset-x-4 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-amber-400/30 text-amber-300 font-mono text-[9px] sm:text-[10px] uppercase tracking-widest">
                        Official Celestial Back
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Interaction Hint Pill */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] sm:text-xs text-slate-400 text-center">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>Tap card to flip • Tilt phone to reflect holo foil</span>
              </div>

              {/* Mobile Quick Action Buttons right below card */}
              <div className="flex sm:hidden items-center justify-center gap-2 mt-3 w-full">
                <button
                  onClick={() => onToggleOwned(card.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold ${
                    isOwned
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  {isOwned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                  <span>{isOwned ? 'In Binder' : 'Add to Binder'}</span>
                </button>

                <button
                  onClick={() => {
                    sound.playSparkle();
                    onToggleFavorite(card.id);
                  }}
                  className={`p-2 rounded-xl border ${
                    isFavorite
                      ? 'bg-pink-950/90 border-pink-500 text-pink-300'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-400 text-pink-400' : ''}`} />
                </button>

                <button
                  onClick={() => setMobileTab('stats')}
                  className="px-3 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Lore</span>
                </button>
              </div>

            </div>

            {/* Right Column: Card Lore & Combat Stats */}
            <div className={`lg:col-span-7 space-y-3 sm:space-y-5 ${mobileTab === 'card' ? 'hidden sm:block' : 'block'}`}>
              
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300">
                  {card.rarity}
                </span>

                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  {card.element}
                </span>

                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                  {card.character}
                </span>
              </div>

              {/* Title & Lore quote */}
              <div>
                <h1 className="font-display text-xl sm:text-3xl font-black text-white leading-tight">
                  {card.title} <span className="text-cyan-400">{card.subtitle}</span>
                </h1>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
                  Art: <strong className="text-slate-300">{card.fileName}</strong>
                </p>
              </div>

              {/* Flavor Text Callout Box */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0c1626]/90 border border-cyan-500/20 italic text-slate-300 text-xs sm:text-sm leading-relaxed">
                <p>{card.flavorText}</p>
              </div>

              {/* Special Ability Box */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs sm:text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Signature Move: {card.abilityName}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {card.abilityDesc}
                </p>
              </div>

              {/* Combat Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {/* HP */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <HeartPulse className="w-3 h-3 text-rose-400" />
                    <span>HP</span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-white">
                    {card.hp}
                  </div>
                  <div className="w-full bg-slate-800 h-1 sm:h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.hp / 1300) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Attack */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <Swords className="w-3 h-3 text-amber-400" />
                    <span>Attack</span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-amber-300">
                    {card.attack}
                  </div>
                  <div className="w-full bg-slate-800 h-1 sm:h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.attack / 1200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Defense */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>Defense</span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-cyan-300">
                    {card.defense}
                  </div>
                  <div className="w-full bg-slate-800 h-1 sm:h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.defense / 1200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Speed */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <Gauge className="w-3 h-3 text-emerald-400" />
                    <span>Speed</span>
                  </div>
                  <div className="text-base sm:text-lg font-mono font-bold text-emerald-300">
                    {card.speed}
                  </div>
                  <div className="w-full bg-slate-800 h-1 sm:h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.speed / 1200) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Management Controls (Desktop & Mobile) */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-t border-slate-800">
                
                {/* Owned Toggle */}
                <button
                  onClick={() => onToggleOwned(card.id)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                    isOwned
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      In Your Binder
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-slate-400" />
                      Add to Binder
                    </>
                  )}
                </button>

                {/* Favorite Toggle */}
                <button
                  onClick={() => {
                    sound.playSparkle();
                    onToggleFavorite(card.id);
                  }}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all active:scale-95 ${
                    isFavorite
                      ? 'bg-pink-950/80 border-pink-500 text-pink-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${isFavorite ? 'fill-pink-400 text-pink-400' : ''}`} />
                  <span>{isFavorite ? 'Saved' : 'Favorite'}</span>
                </button>

                {/* Download Art */}
                <a
                  href={card.imageUrl}
                  download={card.fileName}
                  className="flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save Artwork</span>
                  <span className="sm:hidden">Save</span>
                </a>

                {/* Return to Card Viewer on Mobile */}
                <button
                  onClick={() => setMobileTab('card')}
                  className="sm:hidden w-full mt-2 py-2 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Back to 3D Card Viewer</span>
                </button>

              </div>

            </div>

          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
};
