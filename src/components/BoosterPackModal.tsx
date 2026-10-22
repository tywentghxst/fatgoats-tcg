import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, PackageOpen, CheckCircle, RotateCcw } from 'lucide-react';
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
  const [packOpened, setPackOpened] = useState(false);
  const [pulledCards, setPulledCards] = useState<CardItemType[]>([]);
  const [revealedIndices, setRevealedIndices] = useState<number[]>([]);

  // Lock background body scroll
  useBodyScrollLock(true);

  // Function to pull 5 random cards
  const openPack = () => {
    sound.playPackOpen();
    setPackOpened(true);

    const shuffled = [...allCards].sort(() => 0.5 - Math.random());
    const pack = shuffled.slice(0, 5);
    setPulledCards(pack);
    setRevealedIndices([]);

    // Auto-reveal cards sequentially
    pack.forEach((c, idx) => {
      setTimeout(() => {
        sound.playCardFlip();
        setRevealedIndices((prev) => [...prev, idx]);

        // Check if rare
        if (c.rarity === 'Mythic Rare' || c.rarity === 'Secret Rare') {
          sound.playSparkle();
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.5 },
            colors: ['#ec4899', '#f59e0b', '#38bdf8'],
          });
        }
      }, 450 + idx * 380);
    });
  };

  const resetPack = () => {
    setPackOpened(false);
    setPulledCards([]);
    setRevealedIndices([]);
  };

  const handleClaimAll = () => {
    sound.playSparkle();
    const ids = pulledCards.map((c) => c.id);
    onAddCardsToOwned(ids);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain touch-none">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl touch-none"
      />

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative w-full max-w-4xl bg-slate-900/95 border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 z-10 my-auto text-center overflow-hidden shadow-2xl shadow-amber-950/60 max-h-[95vh] overflow-y-auto overscroll-contain"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 p-1.5 sm:p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Title */}
        <div className="mb-4 sm:mb-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] sm:text-xs font-bold tracking-wider uppercase mb-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Booster Pack Opening</span>
          </div>
          <h2 className="font-display text-xl sm:text-3xl font-black text-white">
            FatGoats <span className="text-amber-400">Card Pack</span>
          </h2>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            5 authentic FatGoats cards with guaranteed rare foils!
          </p>
        </div>

        {/* Unopened Pack State */}
        {!packOpened ? (
          <div className="py-4 sm:py-8 flex flex-col items-center justify-center">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openPack}
              className="relative w-44 sm:w-64 aspect-[731/1024] cursor-pointer rounded-xl sm:rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-2xl shadow-amber-500/30 group"
            >
              <img
                src={cardBackUrl || '/cards/00 - Celestial Goat Card Back.png'}
                alt="Booster Pack"
                className="w-full h-full object-cover group-hover:brightness-110 transition"
              />
              <div className="absolute inset-0 holo-foil pointer-events-none opacity-60" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg animate-pulse">
                  Tear Open!
                </span>
              </div>
            </motion.div>

            <button
              onClick={openPack}
              className="mt-4 sm:mt-6 flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition-all"
            >
              <PackageOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              Tear Open (5 Cards)
            </button>
          </div>
        ) : (
          /* Opened Pack: 5 Cards Grid */
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3.5 my-4 sm:my-6">
              {pulledCards.map((c, idx) => {
                const isRevealed = revealedIndices.includes(idx);
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.08 }}
                    onClick={() => onInspectCard(c)}
                    className="relative aspect-[731/1024] rounded-xl overflow-hidden border border-slate-700 hover:border-cyan-400 cursor-pointer group shadow-lg"
                  >
                    {isRevealed ? (
                      <>
                        <img
                          src={c.thumbUrl || c.imageUrl}
                          alt={c.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 holo-foil pointer-events-none opacity-50" />
                        <div className="absolute bottom-0 inset-x-0 p-1.5 sm:p-2 bg-black/85 text-left">
                          <p className="text-[9px] sm:text-[10px] text-amber-300 font-bold uppercase truncate">
                            {c.rarity}
                          </p>
                          <p className="text-[11px] sm:text-xs text-white font-bold truncate">
                            {c.title}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center border-2 border-dashed border-amber-500/40 animate-pulse p-2">
                        <Sparkles className="w-5 h-5 text-amber-400 animate-spin" />
                        <span className="text-[9px] text-amber-300 font-mono mt-1 text-center">
                          Unsealing...
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Post-pull action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-slate-800">
              <button
                onClick={handleClaimAll}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                <CheckCircle className="w-4 h-4" />
                Add All 5 to Binder
              </button>

              <button
                onClick={resetPack}
                className="flex items-center gap-1 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm active:scale-95 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Open Another
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
