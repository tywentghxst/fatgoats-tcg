import React from 'react';
import { 
  Layers, 
  Search, 
  PackageOpen, 
  CheckCircle2, 
  Heart,
  SlidersHorizontal
} from 'lucide-react';
import { CollectionStats } from '../types';
import { sound } from '../utils/audio';

interface MobileBottomNavProps {
  stats: CollectionStats;
  activeFilter: 'all' | 'owned' | 'unowned' | 'favorite';
  onFilterChange: (f: 'all' | 'owned' | 'unowned' | 'favorite') => void;
  onOpenBooster: () => void;
  onOpenMobileFilters: () => void;
  hasActiveFilters: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  stats,
  activeFilter,
  onFilterChange,
  onOpenBooster,
  onOpenMobileFilters,
  hasActiveFilters,
}) => {
  return (
    <nav className="md:hidden fixed bottom-2 inset-x-2.5 z-40">
      {/* Floating Glassmorphic Dock */}
      <div className="relative rounded-2xl bg-[#09101d]/90 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl shadow-black/80 px-2 py-2 flex items-center justify-around">
        
        {/* All Cards / Vault */}
        <button
          onClick={() => {
            sound.playCardHover();
            onFilterChange('all');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeFilter === 'all'
              ? 'text-cyan-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Vault</span>
        </button>

        {/* Owned / Binder */}
        <button
          onClick={() => {
            sound.playCardHover();
            onFilterChange('owned');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeFilter === 'owned'
              ? 'text-emerald-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <CheckCircle2 className="w-5 h-5 mb-0.5" />
            {stats.ownedCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-emerald-500 text-slate-950 font-mono text-[9px] font-black rounded-full min-w-4 text-center">
                {stats.ownedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Binder</span>
        </button>

        {/* Center Prominent: Open Booster Pack */}
        <button
          onClick={() => {
            sound.playPackOpen();
            onOpenBooster();
          }}
          className="relative -top-4 flex flex-col items-center justify-center group"
        >
          <div className="relative p-3.5 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 text-slate-950 shadow-lg shadow-amber-500/40 border-2 border-amber-200 group-active:scale-95 transition-transform">
            <PackageOpen className="w-6 h-6 stroke-[2.2]" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider mt-0.5">
            Pack
          </span>
        </button>

        {/* Favorites */}
        <button
          onClick={() => {
            sound.playSparkle();
            onFilterChange('favorite');
          }}
          className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeFilter === 'favorite'
              ? 'text-pink-400 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Heart className={`w-5 h-5 mb-0.5 ${activeFilter === 'favorite' ? 'fill-current' : ''}`} />
            {stats.favoriteCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-pink-500 text-white font-mono text-[9px] font-black rounded-full min-w-4 text-center">
                {stats.favoriteCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Saved</span>
        </button>

        {/* Filter & Search Drawer Trigger */}
        <button
          onClick={() => {
            sound.playCardHover();
            onOpenMobileFilters();
          }}
          className="relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 hover:text-cyan-400 transition-all"
        >
          <div className="relative">
            <SlidersHorizontal className="w-5 h-5 mb-0.5" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-900" />
            )}
          </div>
          <span className="text-[10px] tracking-tight">Filter</span>
        </button>

      </div>
    </nav>
  );
};
