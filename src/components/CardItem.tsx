import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Heart, CheckCircle2, Circle, Sparkles, Eye, Shield, Zap } from 'lucide-react';
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
  cardBackUrl,
  isOwned,
  isFavorite,
  onToggleOwned,
  onToggleFavorite,
  onInspect,
  viewMode,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Framer Motion 3D Tilt Values
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [16, -16]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-16, 16]), springConfig);
  const glareOpacity = useSpring(useTransform(y, [-0.5, 0.5], [0.1, 0.45]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

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

  // Color mappings for rarities
  const rarityColors: Record<string, { border: string; glow: string; text: string; bg: string }> = {
    'Mythic Rare': {
      border: 'border-pink-500/80',
      glow: 'shadow-[0_0_25px_rgba(236,72,153,0.35)]',
      text: 'text-pink-300',
      bg: 'bg-pink-950/70',
    },
    'Secret Rare': {
      border: 'border-purple-400/90',
      glow: 'shadow-[0_0_30px_rgba(168,85,247,0.45)]',
      text: 'text-purple-200',
      bg: 'bg-purple-950/70',
    },
    'Legendary': {
      border: 'border-amber-400/80',
      glow: 'shadow-[0_0_25px_rgba(245,158,11,0.35)]',
      text: 'text-amber-300',
      bg: 'bg-amber-950/70',
    },
    'Ultra Rare': {
      border: 'border-violet-500/70',
      glow: 'shadow-[0_0_20px_rgba(139,92,246,0.3)]',
      text: 'text-violet-300',
      bg: 'bg-violet-950/70',
    },
    'Rare': {
      border: 'border-cyan-500/60',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
      text: 'text-cyan-300',
      bg: 'bg-cyan-950/70',
    },
    'Common': {
      border: 'border-slate-600/50',
      glow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
      text: 'text-slate-300',
      bg: 'bg-slate-900/70',
    },
  };

  const currentRarity = rarityColors[card.rarity] || rarityColors['Rare'];

  return (
    <div className="relative group perspective-1000">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={() => {
          sound.playCardFlip();
          onInspect(card);
        }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={{ scale: 1.035, zIndex: 20 }}
        whileTap={{ scale: 0.98 }}
        className={`relative cursor-pointer rounded-2xl overflow-hidden transition-shadow duration-300 ${
          isOwned ? '' : 'opacity-85 grayscale-[25%]'
        } ${isHovered ? currentRarity.glow : 'shadow-xl shadow-black/60'} ${
          currentRarity.border
        } border bg-[#09101d]`}
      >
        {/* Card Artwork Image Container */}
        <div className="relative aspect-[731/1024] w-full overflow-hidden bg-slate-950 flex items-center justify-center">
          
          {/* Skeleton placeholder while loading */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-slate-900 animate-pulse flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-cyan-500/30 animate-spin" />
            </div>
          )}

          <img
            src={card.thumbUrl || card.imageUrl}
            alt={card.title}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={(e) => {
              // Fallback to full imageUrl if thumb fails
              (e.target as HTMLImageElement).src = card.imageUrl;
            }}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Holographic Iridescent Foil Overlay */}
          <motion.div
            className="absolute inset-0 holo-foil pointer-events-none transition-opacity duration-300"
            style={{
              opacity: isHovered ? glareOpacity : 0,
            }}
          />

          {/* Secret/Mythic special specular shimmer */}
          {(card.rarity === 'Mythic Rare' || card.rarity === 'Secret Rare') && (
            <div 
              className={`absolute inset-0 holo-secret pointer-events-none transition-opacity duration-300 ${
                isHovered ? 'opacity-80' : 'opacity-20'
              }`}
            />
          )}

          {/* Top Floating Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none z-10">
            {/* Card Number Badge */}
            <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-white font-mono text-[11px] font-bold tracking-wider shadow-md">
              #{card.cardNumber}
            </span>

            {/* Quick Action Buttons (Favorite + Owned) */}
            <div className="flex items-center gap-1.5 pointer-events-auto">
              {/* Owned status button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOwned(card.id);
                }}
                title={isOwned ? "Mark as Not Owned" : "Mark as Owned"}
                className={`p-1.5 rounded-lg backdrop-blur-md transition-all active:scale-90 ${
                  isOwned
                    ? 'bg-emerald-500/90 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                    : 'bg-black/60 text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                {isOwned ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
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
                className={`p-1.5 rounded-lg backdrop-blur-md transition-all active:scale-90 ${
                  isFavorite
                    ? 'bg-pink-500/90 text-white shadow-md shadow-pink-500/30'
                    : 'bg-black/60 text-slate-400 hover:text-pink-300 border border-white/10'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>

          {/* Bottom Card Title Banner on Hover */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent pointer-events-none z-10 transform translate-y-1 group-hover:translate-y-0 transition-transform">
            <div className="flex items-center justify-between gap-1 mb-1">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${currentRarity.bg} ${currentRarity.text} border border-white/10`}>
                {card.rarity}
              </span>
              <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                {card.element}
              </span>
            </div>
            <h3 className="font-display font-bold text-sm text-white truncate drop-shadow">
              {card.title}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {card.subtitle}
            </p>
          </div>

          {/* Centered Inspect 3D prompt on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
            <span className="px-3.5 py-1.5 rounded-xl bg-cyan-950/90 border border-cyan-400 text-cyan-200 text-xs font-semibold backdrop-blur-md shadow-xl flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              Inspect 3D Card
            </span>
          </div>

        </div>

      </motion.div>
    </div>
  );
};
