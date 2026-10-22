import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Sparkles, Compass, User, ArrowUpDown, RotateCcw, Check } from 'lucide-react';
import { SortOption } from '../types';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRarity: string;
  onSelectRarity: (r: string) => void;
  selectedElement: string;
  onSelectElement: (e: string) => void;
  selectedCharacter: string;
  onSelectCharacter: (c: string) => void;
  sortOption: SortOption;
  onSelectSort: (s: SortOption) => void;
  characterList: string[];
  totalFilteredCount: number;
  onResetFilters: () => void;
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

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  selectedRarity,
  onSelectRarity,
  selectedElement,
  onSelectElement,
  selectedCharacter,
  onSelectCharacter,
  sortOption,
  onSelectSort,
  characterList,
  totalFilteredCount,
  onResetFilters,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Drawer Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="relative w-full max-h-[85vh] bg-[#09101d] border-t border-cyan-500/40 rounded-t-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Drawer Handle */}
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-2 shrink-0" />

          {/* Header */}
          <div className="px-5 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
            <div>
              <h3 className="font-display font-bold text-base text-white">
                Filter & Search
              </h3>
              <p className="text-[11px] text-cyan-300 font-mono">
                {totalFilteredCount} cards matching
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="px-5 py-4 space-y-5 overflow-y-auto flex-1 overscroll-contain">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="Search card name, number (#04), archetype..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Rarity Horizontal Chips */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Rarity Tier</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {RARITIES.map((r) => {
                  const isSelected = selectedRarity === r;
                  return (
                    <button
                      key={r}
                      onClick={() => onSelectRarity(r)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Element Horizontal Chips */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Element</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {ELEMENTS.map((el) => {
                  const isSelected = selectedElement === el;
                  return (
                    <button
                      key={el}
                      onClick={() => onSelectElement(el)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {el}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero / Character Filter */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Hero Archetype</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  onClick={() => onSelectCharacter('All')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                    selectedCharacter === 'All'
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-900 border border-slate-800 text-slate-300'
                  }`}
                >
                  All Heroes
                </button>
                {characterList.map((c) => {
                  const isSelected = selectedCharacter === c;
                  return (
                    <button
                      key={c}
                      onClick={() => onSelectCharacter(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                        isSelected
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-900 border border-slate-800 text-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Direction */}
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sort Order</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Card # (Low → High)', value: 'number-asc' as SortOption },
                  { label: 'Card # (High → Low)', value: 'number-desc' as SortOption },
                  { label: 'Highest Rarity', value: 'rarity-desc' as SortOption },
                  { label: 'Highest Attack', value: 'power-desc' as SortOption },
                  { label: 'Name (A → Z)', value: 'name-asc' as SortOption },
                  { label: 'Name (Z → A)', value: 'name-desc' as SortOption },
                ].map((s) => (
                  <button
                    key={s.value}
                    onClick={() => onSelectSort(s.value)}
                    className={`p-2 rounded-xl text-left truncate transition-all ${
                      sortOption === s.value
                        ? 'bg-indigo-600/90 text-white font-bold border border-indigo-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-300'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Action Footer */}
          <div className="px-5 py-3 border-t border-slate-800 bg-[#060a12] flex items-center justify-between gap-3 shrink-0">
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20"
            >
              <Check className="w-4 h-4" />
              View {totalFilteredCount} Cards
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
