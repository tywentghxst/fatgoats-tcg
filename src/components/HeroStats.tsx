import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  CheckCircle, 
  Shuffle, 
  Layers, 
  RotateCcw,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { CollectionStats } from '../types';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface HeroStatsProps {
  stats: CollectionStats;
  onRandomCard: () => void;
  onMarkAllOwned: () => void;
  onResetOwned: () => void;
}

export const HeroStats: React.FC<HeroStatsProps> = ({
  stats,
  onRandomCard,
  onMarkAllOwned,
  onResetOwned,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  const triggerCelebration = () => {
    sound.playSparkle();
    confetti({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#38bdf8', '#f59e0b', '#ec4899', '#10b981']
    });
  };

  return (
    <div className="relative overflow-hidden mb-6 sm:mb-10 pt-3 sm:pt-6 pb-2 sm:pb-8">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full sm:w-3/4 h-60 sm:h-80 bg-gradient-to-b from-cyan-600/15 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Banner Grid */}
        <div className="relative rounded-2xl sm:rounded-3xl p-4 sm:p-8 bg-gradient-to-r from-slate-900/90 via-[#0a1222]/85 to-slate-900/90 border border-cyan-500/20 backdrop-blur-xl shadow-2xl shadow-cyan-950/40">
          
          {/* Top Row on Mobile: Title + Completion Pill */}
          <div className="flex items-center justify-between gap-2 sm:hidden mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-lg text-white">
                Celestial Vault
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                {stats.ownedCount}/{stats.totalCards}
              </span>
            </div>
            
            <button
              onClick={() => setMobileExpanded(!mobileExpanded)}
              className="flex items-center gap-1 text-[11px] text-cyan-400 font-semibold px-2 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30"
            >
              <span>{mobileExpanded ? 'Hide' : 'Stats'}</span>
              {mobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Mobile Quick Progress Bar (Always Visible on Mobile) */}
          <div className="sm:hidden mb-3">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
            
            {/* Left Lore & Branding */}
            <div className={`lg:col-span-7 space-y-3 sm:space-y-4 ${mobileExpanded ? 'block' : 'hidden sm:block'}`}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                <span>Official TCG Archival Vault • Series 1</span>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                FatGoats <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Trading Card Game</span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-base leading-relaxed max-w-2xl">
                Enter the mythical sanctuary where sovereign champions, elemental bards, ninja toasters, and legendary goats clash. Inspect cards in full 3D, flip them to admire the <strong className="text-cyan-300 font-semibold">Celestial Goat Card Back</strong>, track your owned binder, and build your ultimate deck.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1 sm:pt-2">
                <button
                  onClick={() => {
                    sound.playCardFlip();
                    onRandomCard();
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                >
                  <Shuffle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  Inspect Random
                </button>

                <button
                  onClick={() => {
                    onMarkAllOwned();
                    triggerCelebration();
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 active:scale-95 transition-all"
                >
                  <CheckCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400" />
                  Mark All Owned
                </button>

                <button
                  onClick={onResetOwned}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
                  title="Reset owned cards to 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Binder</span>
                </button>
              </div>
            </div>

            {/* Right Quick Stats Tiles */}
            <div className={`lg:col-span-5 grid grid-cols-2 gap-2 sm:gap-3.5 ${mobileExpanded ? 'grid' : 'hidden sm:grid'}`}>
              
              {/* Card 1: Completion Rate */}
              <div 
                onClick={triggerCelebration}
                className="col-span-2 sm:col-span-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-900/80 border border-cyan-500/30 flex flex-col justify-between group hover:border-cyan-400 transition cursor-pointer"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Completion</span>
                  <Trophy className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-black text-cyan-300">
                    {stats.completionRate}%
                  </span>
                  <span className="text-[10px] sm:text-xs text-slate-400">
                    ({stats.ownedCount}/{stats.totalCards})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 sm:h-2 rounded-full overflow-hidden mt-2 sm:mt-3">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Unique Cards Owned */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-emerald-500/40 transition">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Owned</span>
                  <CheckCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {stats.ownedCount}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-emerald-400 font-medium truncate">
                    {stats.totalCards - stats.ownedCount} remaining
                  </div>
                </div>
              </div>

              {/* Card 3: Total Cards */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-amber-500/40 transition">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Total Set</span>
                  <Layers className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                    {stats.totalCards}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">
                    Vault Cards
                  </div>
                </div>
              </div>

              {/* Card 4: Favorites */}
              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between hover:border-pink-500/40 transition">
                <div className="flex items-center justify-between text-slate-400 mb-1.5">
                  <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Saved</span>
                  <Star className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-pink-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-pink-300 font-mono">
                    {stats.favoriteCount}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-slate-400">
                    Bookmarked
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
