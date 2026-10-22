import React from 'react';
import { 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Upload, 
  PackageOpen, 
  Heart, 
  CheckCircle2, 
  Search,
  Layers
} from 'lucide-react';
import { CollectionStats } from '../types';
import { sound } from '../utils/audio';

interface NavbarProps {
  stats: CollectionStats;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenUpload: () => void;
  onOpenBooster: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: 'all' | 'owned' | 'unowned' | 'favorite';
  onFilterChange: (f: 'all' | 'owned' | 'unowned' | 'favorite') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  stats,
  soundEnabled,
  onToggleSound,
  onOpenUpload,
  onOpenBooster,
  searchQuery,
  onSearchChange,
  activeFilter,
  onFilterChange,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#060a12]/80 border-b border-cyan-900/30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-amber-400 to-fuchsia-500 opacity-60 blur group-hover:opacity-100 transition duration-300 animate-pulse-slow"></div>
            <div className="relative w-12 h-12 rounded-xl bg-slate-900 border border-cyan-500/40 overflow-hidden flex items-center justify-center shadow-lg">
              <img 
                src="/cards_thumb/00%20-%20Celestial%20Goat%20Card%20Back.webp" 
                alt="Celestial Goat Logo" 
                className="w-full h-full object-cover scale-125 hover:scale-135 transition-transform"
                onError={(e) => {
                  // Fallback if thumb not yet loaded
                  (e.target as HTMLImageElement).src = '/cards/00 - Celestial Goat Card Back.png';
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-xl tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 bg-clip-text text-transparent uppercase drop-shadow-[0_2px_8px_rgba(245,158,11,0.3)]">
                FatGoats
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono font-bold tracking-widest uppercase">
                TCG
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium tracking-wide hidden sm:block">
              Celestial Goat Master Collection
            </p>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400/70" />
            <input
              type="text"
              placeholder="Search cards by name, number (#01), character, element..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/70 border border-slate-700/60 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Quick Stats */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Quick Filters */}
          <div className="hidden lg:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onFilterChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeFilter === 'all'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({stats.totalCards})
            </button>
            <button
              onClick={() => onFilterChange('owned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeFilter === 'owned'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Owned ({stats.ownedCount})
            </button>
            <button
              onClick={() => onFilterChange('favorite')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                activeFilter === 'favorite'
                  ? 'bg-pink-500 text-white font-bold shadow-md shadow-pink-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
              ({stats.favoriteCount})
            </button>
          </div>

          {/* Booster Pack Simulator Button */}
          <button
            onClick={() => {
              sound.playPackOpen();
              onOpenBooster();
            }}
            title="Open Booster Pack"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 shadow-lg shadow-amber-500/20 transition-all"
          >
            <PackageOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Open Pack</span>
          </button>

          {/* ZIP Archive Upload / Load Button */}
          <button
            onClick={onOpenUpload}
            title="Import or replace cards from custom ZIP archive"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition-all active:scale-95"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Load ZIP</span>
          </button>

          {/* Sound FX Toggle */}
          <button
            onClick={onToggleSound}
            title={soundEnabled ? "Mute Game Audio" : "Unmute Game Audio"}
            className={`p-2.5 rounded-xl border transition-all active:scale-90 ${
              soundEnabled
                ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

        </div>
      </div>
    </header>
  );
};
