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
  ChevronUp,
  PackageOpen,
  Award,
  Crown
} from 'lucide-react';
import { CollectionStats } from '../types';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface HeroStatsProps {
  stats: CollectionStats;
  onRandomCard: () => void;
  onMarkAllOwned: () => void;
  onResetOwned: () => void;
  onOpenNewReveal?: () => void;
  onOpenBooster?: () => void;
  newCardsCount?: number;
}

export const HeroStats: React.FC<HeroStatsProps> = ({
  stats,
  onRandomCard,
  onMarkAllOwned,
  onResetOwned,
  onOpenNewReveal,
  onOpenBooster,
  newCardsCount = 0,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);

  // Compute Collector Mastery Rank based on completion rate
  const getMasteryRank = (rate: number) => {
    if (rate >= 100) return { title: 'Celestial Sovereign', tier: 'GOD TIER', color: 'from-amber-400 via-rose-400 to-purple-400', border: 'border-amber-400/80', icon: Crown };
    if (rate >= 75) return { title: 'Diamond Grandmaster', tier: 'Tier IV', color: 'from-cyan-400 to-blue-500', border: 'border-cyan-400/70', icon: Award };
    if (rate >= 50) return { title: 'Gold Vanguard', tier: 'Tier III', color: 'from-amber-400 to-orange-500', border: 'border-amber-400/60', icon: Trophy };
    if (rate >= 25) return { title: 'Silver Duelist', tier: 'Tier II', color: 'from-slate-300 to-slate-400', border: 'border-slate-400/60', icon: Award };
    return { title: 'Bronze Collector', tier: 'Tier I', color: 'from-amber-600 to-amber-700', border: 'border-amber-600/50', icon: Award };
  };

  const mastery = getMasteryRank(stats.completionRate);
  const MasteryIcon = mastery.icon;

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
    <div className="relative overflow-hidden mb-4 sm:mb-8 pt-2 sm:pt-6 pb-2">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full sm:w-3/4 h-60 sm:h-80 bg-gradient-to-b from-cyan-600/15 via-blue-600/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Banner Grid */}
        <div className="relative rounded-3xl p-4 sm:p-7 bg-gradient-to-r from-slate-900/95 via-[#0a1222]/90 to-slate-900/95 border border-cyan-500/25 backdrop-blur-2xl shadow-2xl shadow-cyan-950/40">
          
          {/* Top Row on Mobile: Title + Completion Pill */}
          <div className="flex items-center justify-between gap-2 sm:hidden mb-2.5">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-base text-white">
                Celestial Vault
              </span>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold">
                {stats.ownedCount}/{stats.totalCards} ({stats.completionRate}%)
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

          {/* Mobile Quick Progress Bar */}
          <div className="sm:hidden mb-3">
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          {/* Mobile Action Buttons (Booster Pack & New Drops) */}
          <div className="sm:hidden space-y-2 mb-3">
            {onOpenBooster && (
              <button
                onClick={onOpenBooster}
                className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 font-display font-black text-xs flex items-center justify-between shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <PackageOpen className="w-4 h-4 fill-slate-950" />
                  <span>Open Booster Pack (5 Cards)</span>
                </div>
                <span className="bg-black/20 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase">
                  Rip Pack →
                </span>
              </button>
            )}

            {onOpenNewReveal && newCardsCount > 0 && (
              <button
                onClick={onOpenNewReveal}
                className="w-full py-2 px-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-rose-500 to-amber-400 text-white font-display font-bold text-xs flex items-center justify-between shadow-md active:scale-95 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 fill-current text-amber-200" />
                  <span>{newCardsCount} New Cards Just Dropped!</span>
                </div>
                <span className="bg-black/30 px-2 py-0.5 rounded-md text-[10px] font-mono uppercase">
                  Summon →
                </span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-center">
            
            {/* Left Lore & Branding */}
            <div className={`lg:col-span-7 space-y-3 sm:space-y-4 ${mobileExpanded ? 'block' : 'hidden sm:block'}`}>
              
              {/* Badges Bar: Archival Vault & Mastery Rank */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Official TCG Archival Vault • Series 1</span>
                </div>

                {/* Mastery Level Badge */}
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border ${mastery.border} text-xs font-bold shadow-sm`}>
                  <MasteryIcon className="w-3.5 h-3.5 text-amber-400" />
                  <span className={`bg-gradient-to-r ${mastery.color} bg-clip-text text-transparent`}>
                    {mastery.title} ({mastery.tier})
                  </span>
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                FatGoats <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Trading Card Game</span>
              </h1>

              <p className="text-slate-300 text-xs sm:text-sm lg:text-base leading-relaxed max-w-2xl">
                Experience the authentic TCG thrill: open metallic foil booster packs, flip through your <strong className="text-cyan-300">9-Pocket Collector Binder</strong>, inspect cards in <strong className="text-amber-300">PSA 10 Gem Mint</strong> slabs, and complete your legendary herd.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                {onOpenBooster && (
                  <button
                    onClick={onOpenBooster}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/25 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <PackageOpen className="w-4 h-4 stroke-[2.2]" />
                    <span>Open Booster Pack</span>
                  </button>
                )}

                {onOpenNewReveal && newCardsCount > 0 && (
                  <button
                    onClick={onOpenNewReveal}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-purple-600 via-rose-500 to-amber-500 text-white shadow-lg shadow-purple-500/20 hover:brightness-110 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-4 h-4 fill-current text-amber-200" />
                    <span>Summon ({newCardsCount} New!)</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playCardFlip();
                    onRandomCard();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Random Card</span>
                </button>

                <button
                  onClick={() => {
                    onMarkAllOwned();
                    triggerCelebration();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 active:scale-95 transition-all"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Mark All</span>
                </button>

                <button
                  onClick={onResetOwned}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-all"
                  title="Reset owned cards to 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
            </div>

            {/* Right Quick Stats Tiles */}
            <div className={`lg:col-span-5 grid grid-cols-2 gap-2.5 sm:gap-3.5 ${mobileExpanded ? 'grid' : 'hidden sm:grid'}`}>
              
              {/* Card 1: Completion Rate */}
              <div 
                onClick={triggerCelebration}
                className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-cyan-950/70 to-slate-900/90 border border-cyan-500/30 flex flex-col justify-between group hover:border-cyan-400 transition cursor-pointer shadow-lg"
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Completion</span>
                  <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-display font-black text-cyan-300">
                    {stats.completionRate}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ({stats.ownedCount}/{stats.totalCards})
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mt-2.5">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-amber-400 h-full rounded-full transition-all duration-700"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Card 2: Unique Cards Owned */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-emerald-500/40 transition shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">In Binder</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white font-mono">
                    {stats.ownedCount}
                  </div>
                  <div className="text-xs text-emerald-400 font-medium truncate mt-0.5">
                    {stats.totalCards - stats.ownedCount} to collect
                  </div>
                </div>
              </div>

              {/* Card 3: Total Cards */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-amber-500/40 transition shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Master Set</span>
                  <Layers className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
                    {stats.totalCards}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Series 1 Cards
                  </div>
                </div>
              </div>

              {/* Card 4: Favorites */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between hover:border-pink-500/40 transition shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Saved</span>
                  <Star className="w-4 h-4 text-pink-400" />
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-pink-300 font-mono">
                    {stats.favoriteCount}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Deck Highlights
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
