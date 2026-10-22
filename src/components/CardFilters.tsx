import React from 'react';
import { 
  ArrowUpDown, 
  LayoutGrid, 
  Grid3X3, 
  Sparkles, 
  X,
  SlidersHorizontal
} from 'lucide-react';
import { SortOption } from '../types';

interface CardFiltersProps {
  selectedRarity: string;
  onSelectRarity: (r: string) => void;
  selectedElement: string;
  onSelectElement: (e: string) => void;
  selectedCharacter: string;
  onSelectCharacter: (c: string) => void;
  sortOption: SortOption;
  onSelectSort: (s: SortOption) => void;
  viewMode: 'grid' | 'compact' | 'showcase';
  onSelectViewMode: (v: 'grid' | 'compact' | 'showcase') => void;
  characterList: string[];
  totalFilteredCount: number;
  totalCardsCount: number;
  onResetFilters: () => void;
  onOpenMobileFilters?: () => void;
}

const RARITIES = ['All', 'Mythic Rare', 'Secret Rare', 'Legendary', 'Ultra Rare', 'Rare', 'Common'];

const ELEMENTS = [
  'All', 
  'Celestial', 
  'Fire', 
  'Water', 
  'Earth', 
  'Wind', 
  'Lightning', 
  'Nature', 
  'Dark', 
  'Shadow', 
  'Arcane', 
  'Chaos', 
  'Divine', 
  'Steel'
];

export const CardFilters: React.FC<CardFiltersProps> = ({
  selectedRarity,
  onSelectRarity,
  selectedElement,
  onSelectElement,
  selectedCharacter,
  onSelectCharacter,
  sortOption,
  onSelectSort,
  viewMode,
  onSelectViewMode,
  characterList,
  totalFilteredCount,
  totalCardsCount,
  onResetFilters,
  onOpenMobileFilters,
}) => {
  const hasActiveFilters = 
    selectedRarity !== 'All' || 
    selectedElement !== 'All' || 
    selectedCharacter !== 'All';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-4 sm:mb-8 space-y-3">
      
      {/* Mobile-Only Quick Filter Bar */}
      <div className="md:hidden flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
        <button
          onClick={onOpenMobileFilters}
          className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-medium">Filter & Search</span>
          </div>
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          )}
        </button>

        {/* View Mode Toggle (Mobile) */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => onSelectViewMode('grid')}
            title="Grid View (2 Cols)"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'grid'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onSelectViewMode('compact')}
            title="Compact View (3 Cols)"
            className={`p-1.5 rounded-md transition-all ${
              viewMode === 'compact'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/30 text-rose-300"
            title="Reset Filters"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Desktop Controls Bar */}
      <div className="hidden md:flex p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md flex-wrap items-center justify-between gap-4">
        
        {/* Left Side: Filter Chips / Selectors */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 flex-1">
          
          {/* Rarity Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Rarity:</span>
            <select
              value={selectedRarity}
              onChange={(e) => onSelectRarity(e.target.value)}
              className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              {RARITIES.map((r) => (
                <option key={r} value={r} className="bg-slate-900 text-white">
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Element Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="text-cyan-400">⚡</span>
            <span className="text-slate-400">Element:</span>
            <select
              value={selectedElement}
              onChange={(e) => onSelectElement(e.target.value)}
              className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              {ELEMENTS.map((el) => (
                <option key={el} value={el} className="bg-slate-900 text-white">
                  {el}
                </option>
              ))}
            </select>
          </div>

          {/* Character / Archetype Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <span className="text-emerald-400">🐐</span>
            <span className="text-slate-400">Hero:</span>
            <select
              value={selectedCharacter}
              onChange={(e) => onSelectCharacter(e.target.value)}
              className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Heroes</option>
              {characterList.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs bg-rose-950/50 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 transition-all"
            >
              <X className="w-3 h-3" />
              Reset
            </button>
          )}

        </div>

        {/* Right Side: Sorting & View Mode */}
        <div className="flex items-center gap-3">
          
          {/* Sorting */}
          <div className="flex items-center gap-1.5 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
            <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Sort:</span>
            <select
              value={sortOption}
              onChange={(e) => onSelectSort(e.target.value as SortOption)}
              className="bg-transparent font-medium text-slate-100 focus:outline-none cursor-pointer"
            >
              <option value="number-asc" className="bg-slate-900 text-white">Card # (Low → High)</option>
              <option value="number-desc" className="bg-slate-900 text-white">Card # (High → Low)</option>
              <option value="name-asc" className="bg-slate-900 text-white">Name (A → Z)</option>
              <option value="name-desc" className="bg-slate-900 text-white">Name (Z → A)</option>
              <option value="rarity-desc" className="bg-slate-900 text-white">Highest Rarity</option>
              <option value="power-desc" className="bg-slate-900 text-white">Highest Attack</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectViewMode('grid')}
              title="Standard 3D Grid"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => onSelectViewMode('compact')}
              title="Compact Binder Sleeves"
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'compact'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Showing <span className="font-semibold text-cyan-300 font-mono">{totalFilteredCount}</span> of <span className="font-semibold text-slate-200 font-mono">{totalCardsCount}</span> cards
        </div>
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Hover to inspect 3D tilt & holographic sheen • Click card to flip and inspect full details
        </div>
      </div>
    </div>
  );
};
