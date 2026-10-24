import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Heart, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { CardItem as CardItemType } from '../types';
import { sound } from '../utils/audio';

interface CardItemProps {
  card: CardItemType;
  cardBackUrl: string;
  isOwned: boolean;
  isFavorite: boolean;
  onToggleOwned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onInspect: (card: CardItemType) => void;
  viewMode: 'grid' | 'compact' | 'showcase';
}

export const CardItem: React.FC<CardItemProps> = ({
  card,
  isOwned,
  isFavorite,
  onToggleOwned,
  onToggleFavorite,
  onInspect,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Mouse / Touch offset coordinates: -0.5 to 0.5
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Snappy, realistic spring physics for 3D tilt
  const springConfig = { damping: 16, stiffness: 220, mass: 0.1 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [18, -18]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-18, 18]), springConfig);
  const glareOpacity = useSpring(useTransform(y, [-0.5, 0.5], [0.15, 0.55]), springConfig);

  // Glare position following cursor
  const glareX = useTransform(x, [-0.5, 0.5], ['10%', '90%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['10%', '90%']);

  // Mouse tilt handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    sound.playCardHover();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  // Touch tilt handlers for mobile
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!cardRef.current || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (touch.clientX - rect.left) / rect.width - 0.5;
    const yPct = (touch.clientY - rect.top) / rect.height - 0.5;
    x.set(Math.max(-0.6, Math.min(0.6, xPct)));
    y.set(Math.max(-0.6, Math.min(0.6, yPct)));
    setIsHovered(true);
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  // Color mappings for rarities
  const rarityColors: Record<string, { border: string; glow: string; text: string; bg: string }> = {
    'Mythic Rare': {
      border: 'border-pink-500/80',
      glow: 'shadow-[0_0_24px_rgba(236,72,153,0.4)]',
      text: 'text-pink-300',
      bg: 'bg-pink-950/80',
    },
    'Secret Rare': {
      border: 'border-purple-400/90',
      glow: 'shadow-[0_0_28px_rgba(168,85,247,0.45)]',
      text: 'text-purple-200',
      bg: 'bg-purple-950/80',
    },
    'Legendary': {
      border: 'border-amber-400/80',
      glow: 'shadow-[0_0_24px_rgba(245,158,11,0.4)]',
      text: 'text-amber-300',
      bg: 'bg-amber-950/80',
    },
    'Ultra Rare': {
      border: 'border-violet-500/70',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.35)]',
      text: 'text-violet-300',
      bg: 'bg-violet-950/80',
    },
    'Rare': {
      border: 'border-cyan-500/60',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.35)]',
      text: 'text-cyan-300',
      bg: 'bg-cyan-950/80',
    },
    'Common': {
      border: 'border-slate-600/50',
      glow: 'shadow-[0_0_12px_rgba(148,163,184,0.2)]',
      text: 'text-slate-300',
      bg: 'bg-slate-900/80',
    },
  };

  const currentRarity = rarityColors[card.rarity] || rarityColors['Rare'];

  return (
    <div 
      className="relative group select-none"
      style={{ perspective: 1000 }}
    >
      {/* 3D Tilting Card Element - NO overflow-hidden here so 3D isn't flattened! */}
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          sound.playCardFlip();
          onInspect(card);
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.04, zIndex: 30 }}
        whileTap={{ scale: 0.98 }}
        className={`relative cursor-pointer rounded-xl sm:rounded-2xl ${
          currentRarity.border
        } border bg-[#09101d] ${isHovered ? currentRarity.glow : 'shadow-lg sm:shadow-xl shadow-black/70'}`}
      >
        {/* Inner Card Container with overflow-hidden for rounded artwork */}
        <div 
          className="relative aspect-[731/1024] w-full overflow-hidden rounded-[10px] sm:rounded-[14px] bg-slate-950 flex items-center justify-center"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Skeleton placeholder while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
              <Sparkles className="w-6 sm:w-8 h-6 sm:h-8 text-cyan-500/30 animate-spin" />
            </div>
          )}

          {/* Card Artwork - 100% Clean, Crisp & Natural */}
          <img
            src={card.thumbUrl || card.imageUrl}
            alt={card.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              (e.target as HTMLImageElement).src = card.imageUrl;
            }}
            className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Holofoil Refraction Glare on Rare Cards */}
          {(card.rarity === 'Legendary' || card.rarity === 'Secret Rare' || card.rarity === 'Mythic Rare') && isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none tcg-holo-rainbow"
              style={{
                opacity: glareOpacity,
              }}
            />
          )}

          {/* Clean White Specular Glare */}
          {isHovered && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(115deg, transparent 38%, rgba(255, 255, 255, 0.12) 47%, rgba(255, 255, 255, 0.25) 50%, transparent 54%)',
                opacity: glareOpacity,
              }}
            />
          )}

          {/* Top Floating Badges */}
          <div 
            className="absolute top-1.5 sm:top-2.5 left-1.5 sm:left-2.5 right-1.5 sm:right-2.5 flex items-center justify-between pointer-events-none z-10 gap-1"
            style={{ transform: 'translateZ(15px)' }}
          >
            {/* Card Number Badge & New Drop Badge */}
            <div className="flex items-center gap-1 shrink-0">
              <span className="px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg bg-black/85 backdrop-blur-md border border-white/10 text-white font-mono text-[9px] sm:text-[11px] font-bold tracking-wider shadow-md">
                #{card.cardNumber}
              </span>
              {card.isNew && (
                <span className="flex items-center gap-0.5 sm:gap-1 bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black text-[8px] sm:text-[10px] px-1 sm:px-2 py-0.5 rounded-md sm:rounded-lg shadow-lg shadow-amber-500/30">
                  <Sparkles className="w-2 sm:w-2.5 h-2 sm:h-2.5 fill-current" />
                  NEW
                </span>
              )}
            </div>

            {/* Quick Action Buttons (Favorite + Owned) */}
            <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto shrink-0">
              {/* Owned status button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOwned(card.id);
                }}
                title={isOwned ? "Mark as Not Owned" : "Mark as Owned"}
                className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg backdrop-blur-md transition-all active:scale-90 ${
                  isOwned
                    ? 'bg-emerald-500/90 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'bg-black/60 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {isOwned ? (
                  <CheckCircle2 className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                ) : (
                  <Circle className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                )}
              </button>

              {/* Favorite button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playSparkle();
                  onToggleFavorite(card.id);
                }}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                className={`p-1 sm:p-1.5 rounded-md sm:rounded-lg backdrop-blur-md transition-all active:scale-90 ${
                  isFavorite
                    ? 'bg-pink-500/90 text-white shadow-md shadow-pink-500/30'
                    : 'bg-black/60 text-slate-400 hover:text-pink-300 border border-white/10'
                }`}
              >
                <Heart className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bottom Card Title Banner */}
          <div 
            className="absolute bottom-0 inset-x-0 p-2 sm:p-3 bg-gradient-to-t from-slate-950 via-slate-950/85 to-transparent pointer-events-none z-10"
            style={{ transform: 'translateZ(12px)' }}
          >
            <div className="flex items-center justify-between gap-1 mb-0.5 sm:mb-1">
              <span className={`text-[9px] sm:text-[10px] uppercase font-bold tracking-wider px-1.5 sm:px-2 py-0.2 sm:py-0.5 rounded ${currentRarity.bg} ${currentRarity.text} border border-white/10 truncate`}>
                {card.rarity}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-[9px] sm:text-[10px] font-mono text-cyan-300 bg-cyan-950/70 px-1.5 py-0.2 rounded border border-cyan-800/40">
                  {card.element}
                </span>
                <span className="text-[9px] sm:text-[10px] font-mono font-bold text-amber-300 bg-amber-950/70 px-1 py-0.2 rounded border border-amber-800/40">
                  ⚔{card.attack}
                </span>
              </div>
            </div>
            <h3 className="font-display font-bold text-xs sm:text-sm text-white truncate drop-shadow">
              {card.title}
            </h3>
            <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
              {card.subtitle}
            </p>
          </div>
        </div>

      </motion.div>
    </div>
  );
};
