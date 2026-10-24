import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Sparkles, 
  BookOpen, 
  CheckCircle2, 
  Circle
} from 'lucide-react';
import { CardItem as CardItemType } from '../types';
import { sound } from '../utils/audio';

interface BinderViewProps {
  cards: CardItemType[];
  ownedCardIds: Set<string>;
  favoriteCardIds: Set<string>;
  onInspectCard: (card: CardItemType) => void;
  onToggleOwned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const BinderView: React.FC<BinderViewProps> = ({
  cards,
  ownedCardIds,
  favoriteCardIds,
  onInspectCard,
  onToggleOwned,
  onToggleFavorite,
}) => {
  // Page state: 9 cards per page on desktop, 4 on small mobile screens
  // We can use 9 as standard page capacity
  const CARDS_PER_PAGE = 9;
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(cards.length / CARDS_PER_PAGE));
  const pageCards = cards.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      sound.playCardSlide();
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      sound.playCardSlide();
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4 my-2 select-none">
      
      {/* Binder Book Header Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2 sm:px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-400" />
          <h3 className="font-display font-black text-sm sm:text-base text-white">
            Ultra-Pro <span className="text-amber-400">9-Pocket Collector Binder</span>
          </h3>
          <span className="text-xs text-slate-400 hidden sm:inline">
            • {cards.length} Total Slots
          </span>
        </div>

        {/* Page Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 disabled:opacity-40 disabled:pointer-events-none hover:border-cyan-400 transition"
          >
            <ChevronLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Prev Page</span>
          </button>

          <span className="font-mono text-xs font-bold text-amber-300 bg-black/60 px-3 py-1 rounded-lg border border-amber-500/30">
            Page {currentPage + 1} of {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 disabled:opacity-40 disabled:pointer-events-none hover:border-cyan-400 transition"
          >
            <span className="hidden sm:inline">Next Page</span>
            <ChevronRight className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* The 9-Pocket Physical Binder Sleeve Mat */}
      <div className="relative rounded-3xl p-3 sm:p-6 lg:p-8 binder-page-mat border-2 border-slate-700/80 shadow-2xl overflow-hidden">
        
        {/* Left Spine Binder Steel Rings (Desktop) */}
        <div className="absolute left-2 top-0 bottom-0 w-4 hidden lg:flex flex-col justify-around py-12 pointer-events-none z-20">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i} 
              className="w-8 h-12 -ml-4 rounded-full binder-ring border-2 border-slate-900 shadow-xl"
            />
          ))}
        </div>

        {/* 3x3 Pocket Grid (2x2 on small mobile, 3x3 on tablet & desktop) */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, scale: 0.98, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.98, x: -20 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 lg:gap-6 pl-0 lg:pl-6"
          >
            {pageCards.map((card) => {
              const isOwned = ownedCardIds.has(card.id);
              const isFavorite = favoriteCardIds.has(card.id);

              return (
                <div
                  key={card.id}
                  className="relative group aspect-[731/1024] rounded-2xl binder-pocket p-1.5 sm:p-2 border border-slate-700/60 transition-all hover:border-cyan-500/60"
                >
                  {/* Plastic Pocket Weld Lines & Glare */}
                  <div className="absolute inset-0 rounded-2xl pointer-events-none border border-white/5 shadow-inner" />
                  
                  {isOwned ? (
                    /* OWNED CARD: Full Artwork with 3D Pop on hover */
                    <motion.div
                      whileHover={{ scale: 1.04, zIndex: 10 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onInspectCard(card)}
                      className="relative w-full h-full rounded-xl overflow-hidden cursor-pointer shadow-lg bg-slate-950"
                    >
                      <img
                        src={card.thumbUrl || card.imageUrl}
                        alt={card.title}
                        loading="lazy"
                        className="w-full h-full object-cover select-none"
                      />

                      {/* Holo foil sheen */}
                      {(card.rarity === 'Legendary' || card.rarity === 'Secret Rare' || card.rarity === 'Mythic Rare') && (
                        <div className="absolute inset-0 tcg-holo-rainbow pointer-events-none opacity-35" />
                      )}

                      {/* Plastic Pocket Corner Highlight */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />

                      {/* Top Badges */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-center justify-between pointer-events-none">
                        <span className="px-1.5 py-0.5 rounded bg-black/85 text-white font-mono text-[9px] font-bold border border-white/10">
                          #{card.cardNumber}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/90 text-slate-950 font-bold text-[8px] uppercase">
                          OWNED
                        </span>
                      </div>

                      {/* Bottom Banner */}
                      <div className="absolute bottom-0 inset-x-0 p-1.5 sm:p-2 bg-gradient-to-t from-black via-black/85 to-transparent text-left pointer-events-none">
                        <p className="text-[9px] text-amber-300 font-bold uppercase truncate">
                          {card.rarity}
                        </p>
                        <p className="text-[10px] sm:text-xs text-white font-bold truncate">
                          {card.title}
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    /* UNOWNED EMPTY POCKET: Card Silhouette with Slot Number */
                    <div 
                      onClick={() => onInspectCard(card)}
                      className="relative w-full h-full rounded-xl overflow-hidden flex flex-col items-center justify-center border-2 border-dashed border-slate-700/50 bg-slate-950/60 p-3 cursor-pointer group hover:border-cyan-500/40 transition"
                      title="Uncollected Card - Click to preview"
                    >
                      <Lock className="w-6 h-6 text-slate-600 mb-1 group-hover:text-cyan-400 transition" />
                      <span className="font-mono text-sm font-bold text-slate-400 group-hover:text-cyan-300 transition">
                        #{card.cardNumber}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 text-center truncate max-w-full px-1">
                        {card.title}
                      </span>
                      <span className="text-[8px] font-bold text-slate-600 uppercase mt-1">
                        {card.rarity}
                      </span>

                      {/* Quick Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleOwned(card.id);
                        }}
                        className="mt-2 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 hover:border-emerald-400 text-[9px] text-slate-300 font-medium hover:text-emerald-300 active:scale-95 transition"
                      >
                        + Add to Binder
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Binder Page Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 px-2">
          <span>Official Series 1 • FatGoats Archival Binder</span>
          <div className="flex items-center gap-3">
            <span>Flip pages with Prev / Next buttons</span>
          </div>
        </div>

      </div>

    </div>
  );
};
