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
  Info
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
  const cardViewerRef = useRef<HTMLDivElement>(null);

  // Reset flip status when card changes
  useEffect(() => {
    setIsFlipped(false);
  }, [card?.id]);

  // Framer Motion 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 260, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [20, -20]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-20, 20]), springConfig);
  const glareOpacity = useSpring(useTransform(y, [-0.5, 0.5], [0.15, 0.6]), springConfig);

  // Mouse Tilt Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardViewerRef.current) return;
    const rect = cardViewerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-10 overflow-y-auto">
        
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-2xl"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-5xl bg-[#0a101d]/95 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden z-10 my-auto flex flex-col"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs tracking-wider">
                #{card.cardNumber}
              </span>
              <h2 className="font-display font-bold text-lg text-white truncate">
                {card.title} <span className="text-slate-400 font-normal text-sm">— {card.subtitle}</span>
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {/* Flip Button */}
              <button
                onClick={toggleFlip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 active:scale-95 transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>{isFlipped ? "View Front" : "Flip to Back"}</span>
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white transition-all active:scale-90"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Content: Left 3D Card, Right Metadata */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 items-center">
            
            {/* Left Column: 3D Interactive Card Viewer */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center">
              
              {/* Prev / Next controls above on mobile */}
              <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400">
                <button
                  onClick={onPrevCard}
                  className="flex items-center gap-1 hover:text-cyan-300 transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous Card
                </button>
                <span className="text-[11px] font-mono text-cyan-400">
                  {card.cardNumber} / 36
                </span>
                <button
                  onClick={onNextCard}
                  className="flex items-center gap-1 hover:text-cyan-300 transition"
                >
                  Next Card <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Card Container with Perspective */}
              <div
                ref={cardViewerRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={toggleFlip}
                className="perspective-1500 w-full max-w-[340px] aspect-[731/1024] cursor-pointer group relative"
                title="Click or tap to flip card"
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
                    <div className="absolute bottom-4 inset-x-4 text-center">
                      <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-400/30 text-amber-300 font-mono text-[10px] uppercase tracking-widest">
                        Official Card Back • Celestial Series
                      </span>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Interaction Hint Pill */}
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400 text-center">
                <RotateCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
                <span>Move mouse to tilt in 3D • Tap card or press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono text-[10px]">Space</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-white font-mono text-[10px]">F</kbd> to flip</span>
              </div>

            </div>

            {/* Right Column: Rich Card Lore, Combat Stats & Deck State */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Badges Bar */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300">
                  {card.rarity}
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  {card.element} Element
                </span>

                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800/80 border border-slate-700 text-slate-300">
                  Archetype: {card.character}
                </span>
              </div>

              {/* Title & Lore quote */}
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-black text-white leading-tight">
                  {card.title} <span className="text-cyan-400">{card.subtitle}</span>
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Card Art: <strong className="text-slate-300">{card.fileName}</strong> • Vault ID: <code className="text-cyan-300">{card.id}</code>
                </p>
              </div>

              {/* Flavor Text Callout Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-[#0c1626]/90 border border-cyan-500/20 italic text-slate-300 text-sm leading-relaxed relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
                <p>{card.flavorText}</p>
              </div>

              {/* Special Ability Box */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Signature Ability: {card.abilityName}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {card.abilityDesc}
                </p>
              </div>

              {/* Combat Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* HP */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                    <span>HP</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-white">
                    {card.hp}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.hp / 1300) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Attack */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Swords className="w-3.5 h-3.5 text-amber-400" />
                    <span>Attack</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-amber-300">
                    {card.attack}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.attack / 1200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Defense */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Shield className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Defense</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-cyan-300">
                    {card.defense}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.defense / 1200) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Speed */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Speed</span>
                  </div>
                  <div className="text-lg font-mono font-bold text-emerald-300">
                    {card.speed}
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, (card.speed / 1200) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Management Controls */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                
                {/* Owned Toggle */}
                <button
                  onClick={() => onToggleOwned(card.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95 ${
                    isOwned
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isOwned ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      In Your Binder (Owned)
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-slate-400" />
                      Add to Collection
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
                      ? 'bg-pink-950/80 border-pink-500 text-pink-300 shadow-md shadow-pink-500/20'
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-pink-400 text-pink-400' : ''}`} />
                  <span>{isFavorite ? 'Bookmarked' : 'Favorite'}</span>
                </button>

                {/* Download Art */}
                <a
                  href={card.imageUrl}
                  download={card.fileName}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Save Artwork</span>
                </a>

              </div>

            </div>

          </div>

        </motion.div>

      </div>
    </AnimatePresence>
  );
};
