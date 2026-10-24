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
  BookOpen,
  Award,
  Layers,
  Square
} from 'lucide-react';
import { CardItem as CardItemType } from '../types';
import { sound } from '../utils/audio';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

interface CardDetailModalProps {
  card: CardItemType | null;
  cardBackUrl: string;
  isOwned: boolean;
  isFavorite: boolean;
  totalCards?: number;
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
  totalCards,
  onToggleOwned,
  onToggleFavorite,
  onClose,
  onPrevCard,
  onNextCard,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mobileTab, setMobileTab] = useState<'card' | 'stats'>('card');
  const [casingMode, setCasingMode] = useState<'raw' | 'sleeve' | 'slab'>('slab');
  const cardViewerRef = useRef<HTMLDivElement>(null);

  // Touch tracking for swipe navigation
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Lock background body scroll
  useBodyScrollLock(true);

  // Reset flip status when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card?.id]);

  // Framer Motion 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Snappy spring config for cursor/gyro parallax tilt
  const springConfig = { damping: 20, stiffness: 240, mass: 0.1 };
  const tiltRotateX = useSpring(useTransform(y, [-0.5, 0.5], [16, -16]), springConfig);
  const tiltRotateY = useSpring(useTransform(x, [-0.5, 0.5], [-16, 16]), springConfig);
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

  // Touch handlers with swipe navigation support
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardViewerRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = cardViewerRef.current.getBoundingClientRect();
    const xPct = (touch.clientX - rect.left) / rect.width - 0.5;
    const yPct = (touch.clientY - rect.top) / rect.height - 0.5;
    x.set(Math.max(-0.6, Math.min(0.6, xPct)));
    y.set(Math.max(-0.6, Math.min(0.6, yPct)));
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    x.set(0);
    y.set(0);

    if (touchStartX.current !== null && e.changedTouches.length > 0) {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - (touchStartY.current || 0);

      // Horizontal swipe threshold: 50px, more horizontal than vertical
      if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        if (deltaX < 0) {
          onNextCard();
        } else {
          onPrevCard();
        }
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Mobile Device Gyroscope / Motion Tilt
  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null && event.beta !== null) {
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
      } else if (e.key.toLowerCase() === 's') {
        setCasingMode((prev) => (prev === 'slab' ? 'raw' : prev === 'raw' ? 'sleeve' : 'slab'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevCard, onNextCard, isFlipped]);

  const toggleFlip = () => {
    sound.playCardFlip();
    setIsFlipped((prev) => !prev);
  };

  if (!card) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 lg:p-8 overflow-y-auto overscroll-contain touch-none">
        
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/92 backdrop-blur-2xl touch-none"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-[#09101d] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/70 overflow-hidden z-10 my-auto flex flex-col max-h-[95dvh] overscroll-contain"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-slate-800 bg-slate-900/70 shrink-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs tracking-wider shrink-0">
                #{card.cardNumber}
              </span>
              <h2 className="font-display font-bold text-sm sm:text-lg text-white truncate">
                {card.title} <span className="text-slate-400 font-normal text-xs sm:text-sm hidden sm:inline">— {card.subtitle}</span>
              </h2>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Casing Mode Selector (Raw / Sleeve / Graded Slab) */}
              <div className="hidden sm:flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => {
                    sound.playCardSnap();
                    setCasingMode('raw');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                    casingMode === 'raw'
                      ? 'bg-slate-800 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Raw Unprotected Card"
                >
                  <Square className="w-3 h-3" />
                  <span>Raw</span>
                </button>
                <button
                  onClick={() => {
                    sound.playCardSnap();
                    setCasingMode('sleeve');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                    casingMode === 'sleeve'
                      ? 'bg-slate-800 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Protective Sleeve"
                >
                  <Layers className="w-3 h-3" />
                  <span>Sleeve</span>
                </button>
                <button
                  onClick={() => {
                    sound.playCardSnap();
                    setCasingMode('slab');
                  }}
                  className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                    casingMode === 'slab'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                      : 'text-amber-400 hover:text-amber-300'
                  }`}
                  title="Certified PSA 10 Gem Mint Slab"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>PSA 10 Slab</span>
                </button>
              </div>

              {/* Mobile View Toggle Pills (Card vs Stats) */}
              <div className="flex sm:hidden items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setMobileTab('card')}
                  className={`p-1.5 rounded-md text-xs transition-all ${
                    mobileTab === 'card'
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'text-slate-400'
                  }`}
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
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 p-3 sm:p-6 lg:p-8 items-center overflow-y-auto">
            
            {/* Left Column: 3D Interactive Card Viewer */}
            <div className={`lg:col-span-5 flex flex-col items-center justify-center ${mobileTab === 'stats' ? 'hidden sm:flex' : 'flex'}`}>
              
              {/* Prev / Next controls above */}
              <div className="w-full flex items-center justify-between mb-2 text-xs text-slate-300 px-1">
                <button
                  onClick={onPrevCard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-cyan-400 text-slate-200 hover:text-white active:scale-95 transition text-xs font-bold shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 text-cyan-400" />
                  <span>Prev</span>
                </button>
                <span className="text-[11px] font-mono text-cyan-400 font-bold bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  #{card.cardNumber}{totalCards ? ` of ${totalCards}` : ''}
                </span>
                <button
                  onClick={onNextCard}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 hover:bg-cyan-900 text-cyan-300 hover:text-white active:scale-95 transition text-xs font-bold shadow-sm"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </button>
              </div>

              {/* Card Container with Perspective */}
              <div
                ref={cardViewerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={toggleFlip}
                style={{ perspective: 1200 }}
                className={`w-full ${casingMode === 'slab' ? 'max-w-[270px] sm:max-w-[320px]' : 'max-w-[260px] sm:max-w-[310px]'} cursor-pointer group relative touch-none select-none`}
                title="Tap or click to flip • Swipe left/right for next/prev card"
              >
                {/* TIER 1: Tilt Container */}
                <motion.div
                  style={{
                    rotateX: tiltRotateX,
                    rotateY: tiltRotateY,
                    transformStyle: 'preserve-3d',
                  }}
                  className="w-full relative transform-style-3d shadow-2xl"
                >
                  {/* TIER 2: Flip Container */}
                  <motion.div
                    animate={{
                      rotateY: isFlipped ? 180 : 0,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 220,
                      damping: 22,
                    }}
                    style={{
                      transformStyle: 'preserve-3d',
                    }}
                    className={`w-full relative transform-style-3d ${
                      casingMode === 'slab'
                        ? 'psa-slab-casing rounded-3xl p-3 pb-4'
                        : casingMode === 'sleeve'
                        ? 'p-2 rounded-2xl bg-slate-950 border-2 border-slate-700/80 shadow-2xl'
                        : 'p-0'
                    }`}
                  >
                    {/* GRADED SLAB HEADER LABEL (PSA 10 GEM MINT STYLE) */}
                    {casingMode === 'slab' && (
                      <div className="mb-2.5 rounded-xl bg-[#f8fafc] border-2 border-red-600 overflow-hidden shadow-inner text-slate-900 select-none">
                        {/* Red Top Bar */}
                        <div className="bg-red-600 px-2 py-0.5 flex items-center justify-between text-[9px] font-mono font-black text-white tracking-wider">
                          <span>FATGOATS AUTHENTIC</span>
                          <span>GEM MT 10</span>
                        </div>
                        {/* Cert Details */}
                        <div className="p-1.5 flex items-center justify-between text-left">
                          <div>
                            <p className="font-display font-black text-[11px] text-slate-900 leading-tight truncate max-w-[170px]">
                              #{card.cardNumber} {card.title}
                            </p>
                            <p className="text-[9px] text-slate-600 font-semibold truncate max-w-[170px]">
                              {card.rarity} • {card.element}
                            </p>
                            <p className="text-[8px] font-mono text-slate-500 mt-0.5">
                              CERT: FG-{card.cardNumber}9941
                            </p>
                          </div>
                          {/* Gold Grade Seal */}
                          <div className="flex flex-col items-center justify-center bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 font-black rounded-lg px-2 py-1 shadow-sm shrink-0 border border-amber-300">
                            <span className="text-[8px] tracking-widest uppercase">GRADE</span>
                            <span className="text-sm font-mono leading-none">10</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* CARD ARTWORK WRAPPER */}
                    <div className="relative aspect-[731/1024] w-full rounded-xl overflow-hidden border border-cyan-500/40 bg-slate-950 shadow-lg">
                      
                      {/* FRONT SIDE */}
                      <div className="absolute inset-0 backface-hidden">
                        <img
                          src={card.imageUrl}
                          alt={card.title}
                          className="w-full h-full object-cover select-none pointer-events-none"
                        />

                        {/* Holofoil Glare Overlay */}
                        {(card.rarity === 'Legendary' || card.rarity === 'Secret Rare' || card.rarity === 'Mythic Rare') && (
                          <div className="absolute inset-0 tcg-holo-rainbow pointer-events-none opacity-40" />
                        )}

                        {/* Clean Specular Glare */}
                        <motion.div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.12) 48%, rgba(255, 255, 255, 0.22) 50%, transparent 54%)',
                            opacity: glareOpacity,
                          }}
                        />
                      </div>

                      {/* BACK SIDE (Celestial Goat Card Back) */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180 border-2 border-amber-500/50 bg-[#09101d]">
                        <img
                          src={cardBackUrl || '/cards/00 - Celestial Goat Card Back.png'}
                          alt="00 - Celestial Goat Card Back"
                          className="w-full h-full object-cover select-none pointer-events-none"
                        />

                        <motion.div
                          className="absolute inset-0 pointer-events-none opacity-40"
                          style={{
                            background: 'linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.1) 48%, rgba(255, 255, 255, 0.2) 50%, transparent 54%)',
                          }}
                        />

                        <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                          <span className="px-2.5 py-0.5 rounded-full bg-black/85 backdrop-blur-md border border-amber-400/40 text-amber-300 font-mono text-[9px] uppercase tracking-widest shadow-lg">
                            Official Celestial Back
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* Acrylic Slab Bottom Rivets */}
                    {casingMode === 'slab' && (
                      <div className="mt-2 flex items-center justify-between px-2 text-[8px] font-mono text-slate-400">
                        <span>SECURITY SEALED</span>
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        </div>
                      </div>
                    )}

                  </motion.div>
                </motion.div>
              </div>

              {/* Interaction Hint */}
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>Click to flip • Swipe left/right • Tilt cursor/phone in 3D</span>
              </div>

              {/* Mobile Quick Action Buttons right below card */}
              <div className="flex sm:hidden items-center justify-between gap-1.5 mt-3 w-full">
                <button
                  onClick={onPrevCard}
                  className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white active:scale-95 transition"
                  title="Previous Card"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onToggleOwned(card.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold ${
                    isOwned
                      ? 'bg-emerald-500 text-slate-950 font-bold'
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
                  className="px-2.5 py-2 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-medium flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Stats</span>
                </button>

                <button
                  onClick={onNextCard}
                  className="p-2.5 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 hover:text-white active:scale-95 transition"
                  title="Next Card"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* Right Column: Card Lore & Combat Stats */}
            <div className={`lg:col-span-7 space-y-3 sm:space-y-4 ${mobileTab === 'card' ? 'hidden sm:block' : 'block'}`}>
              
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 shadow-sm">
                  {card.rarity}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5 shadow-sm">
                  <Compass className="w-3.5 h-3.5" />
                  {card.element}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                  {card.character}
                </span>

                {card.isNew && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 shadow-md">
                    ★ NEW DROP
                  </span>
                )}
              </div>

              {/* Title & Lore quote */}
              <div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight">
                  {card.title} <span className="bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text text-transparent">{card.subtitle}</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Card File: <strong className="text-slate-300 font-mono">{card.fileName}</strong>
                </p>
              </div>

              {/* Flavor Text Callout Box */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-900/95 to-[#0c1626]/95 border border-cyan-500/20 italic text-slate-300 text-xs sm:text-sm leading-relaxed shadow-lg">
                <p>{card.flavorText}</p>
              </div>

              {/* Signature Ability Box */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-lg">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs sm:text-sm mb-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Signature Move: {card.abilityName}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {card.abilityDesc}
                </p>
              </div>

              {/* Combat Stats Grid with Progress Visuals */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {/* HP */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    <span>HP</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">
                    {card.hp}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.hp / 2500) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Attack */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attack</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-amber-300">
                    {card.attack}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.attack / 2200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Defense */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Defense</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-cyan-300">
                    {card.defense}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.defense / 2200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Speed */}
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
                  <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-0.5">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Speed</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-300">
                    {card.speed}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.speed / 2000) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Management Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-t border-slate-800">
                
                {/* Owned Toggle */}
                <button
                  onClick={() => onToggleOwned(card.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                    isOwned
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25'
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all active:scale-95 ${
                    isFavorite
                      ? 'bg-pink-950/80 border-pink-500 text-pink-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-400 text-pink-400' : ''}`} />
                  <span>{isFavorite ? 'Saved' : 'Favorite'}</span>
                </button>

                {/* Download Art */}
                <a
                  href={card.imageUrl}
                  download={card.fileName}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800/60 border border-slate-700 transition"
                >
                  <Download className="w-4 h-4" />
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
