import React, { useState, useEffect, useMemo } from 'react';
import { INITIAL_CARDS, CARD_BACK_IMAGE } from './data/cardsData';
import { CardItem as CardItemType, CollectionStats, SortOption } from './types';
import { Navbar } from './components/Navbar';
import { HeroStats } from './components/HeroStats';
import { CardFilters } from './components/CardFilters';
import { CardItem } from './components/CardItem';
import { CardDetailModal } from './components/CardDetailModal';
import { BoosterPackModal } from './components/BoosterPackModal';
import { ZipUploaderModal } from './components/ZipUploaderModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { MobileFilterDrawer } from './components/MobileFilterDrawer';
import { QuestsModal } from './components/QuestsModal';
import { sound } from './utils/audio';
import { SearchX } from 'lucide-react';

const RARITY_TIERS: Record<string, number> = {
  'Secret Rare': 6,
  'Mythic Rare': 5,
  'Legendary': 4,
  'Ultra Rare': 3,
  'Rare': 2,
  'Common': 1,
};

export function App() {
  // Deck state
  const [cards, setCards] = useState<CardItemType[]>(INITIAL_CARDS);
  const [cardBackUrl, setCardBackUrl] = useState<string>(CARD_BACK_IMAGE);

  // Persistence: Owned & Favorite cards
  const [ownedCardIds, setOwnedCardIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('fatgoats_owned_ids');
      if (saved) return new Set(JSON.parse(saved));
      // By default, own the first 12 cards as a starter deck!
      return new Set(INITIAL_CARDS.slice(0, 12).map((c: CardItemType) => c.id));
    } catch {
      return new Set();
    }
  });

  const [favoriteCardIds, setFavoriteCardIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('fatgoats_fav_ids');
      if (saved) return new Set(JSON.parse(saved));
      return new Set([INITIAL_CARDS[3]?.id, INITIAL_CARDS[24]?.id].filter(Boolean));
    } catch {
      return new Set();
    }
  });

  // Sound settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => sound.isEnabled());

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('All');
  const [selectedElement, setSelectedElement] = useState('All');
  const [selectedCharacter, setSelectedCharacter] = useState('All');
  const [sortOption, setSortOption] = useState<SortOption>('number-asc');
  const [ownershipFilter, setOwnershipFilter] = useState<'all' | 'owned' | 'unowned' | 'favorite'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'showcase'>('grid');

  // Modals
  const [inspectedCard, setInspectedCard] = useState<CardItemType | null>(null);
  const [isBoosterOpen, setIsBoosterOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isQuestsOpen, setIsQuestsOpen] = useState(false);

  // Save to localStorage when owned or favorite sets change
  useEffect(() => {
    try {
      localStorage.setItem('fatgoats_owned_ids', JSON.stringify(Array.from(ownedCardIds)));
    } catch {
      // storage error
    }
  }, [ownedCardIds]);

  useEffect(() => {
    try {
      localStorage.setItem('fatgoats_fav_ids', JSON.stringify(Array.from(favoriteCardIds)));
    } catch {
      // storage error
    }
  }, [favoriteCardIds]);

  const handleToggleSound = () => {
    const newState = sound.toggle();
    setSoundEnabled(newState);
  };

  // Toggle Owned
  const handleToggleOwned = (id: string) => {
    setOwnedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
        sound.playSparkle();
      }
      return next;
    });
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    setFavoriteCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Mark all cards as owned
  const handleMarkAllOwned = () => {
    const allIds = new Set(cards.map((c) => c.id));
    setOwnedCardIds(allIds);
  };

  // Reset owned cards
  const handleResetOwned = () => {
    if (window.confirm('Reset your binder progress to 0 cards owned?')) {
      setOwnedCardIds(new Set());
    }
  };

  // Add multiple cards from booster pack
  const handleAddCardsToOwned = (ids: string[]) => {
    setOwnedCardIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  // Inspect random card
  const handleRandomCard = () => {
    const randomCard = cards[Math.floor(Math.random() * cards.length)];
    setInspectedCard(randomCard);
  };

  // Extract distinct characters for filter dropdown
  const characterList = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      if (c.character) set.add(c.character);
    });
    return Array.from(set).sort();
  }, [cards]);

  // Filtered and Sorted Cards
  const filteredCards = useMemo(() => {
    return cards
      .filter((card) => {
        // Ownership filter
        if (ownershipFilter === 'owned' && !ownedCardIds.has(card.id)) return false;
        if (ownershipFilter === 'unowned' && ownedCardIds.has(card.id)) return false;
        if (ownershipFilter === 'favorite' && !favoriteCardIds.has(card.id)) return false;

        // Rarity filter
        if (selectedRarity !== 'All' && card.rarity !== selectedRarity) return false;

        // Element filter
        if (selectedElement !== 'All' && card.element !== selectedElement) return false;

        // Character filter
        if (selectedCharacter !== 'All' && card.character !== selectedCharacter) return false;

        // Search Query
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase().trim();
          const target = `${card.cardNumber} ${card.title} ${card.subtitle} ${card.character} ${card.element} ${card.rarity} ${card.abilityName} ${card.flavorText}`.toLowerCase();
          if (!target.includes(q)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOption === 'number-asc') {
          return (parseInt(a.cardNumber, 10) || 0) - (parseInt(b.cardNumber, 10) || 0);
        }
        if (sortOption === 'number-desc') {
          return (parseInt(b.cardNumber, 10) || 0) - (parseInt(a.cardNumber, 10) || 0);
        }
        if (sortOption === 'name-asc') {
          return a.title.localeCompare(b.title);
        }
        if (sortOption === 'name-desc') {
          return b.title.localeCompare(a.title);
        }
        if (sortOption === 'rarity-desc') {
          return (RARITY_TIERS[b.rarity] || 0) - (RARITY_TIERS[a.rarity] || 0);
        }
        if (sortOption === 'power-desc') {
          return b.attack - a.attack;
        }
        return 0;
      });
  }, [
    cards,
    searchQuery,
    selectedRarity,
    selectedElement,
    selectedCharacter,
    sortOption,
    ownershipFilter,
    ownedCardIds,
    favoriteCardIds,
  ]);

  // Collection Stats computation
  const stats: CollectionStats = useMemo(() => {
    const total = cards.length;
    const owned = cards.filter((c) => ownedCardIds.has(c.id)).length;
    const favs = cards.filter((c) => favoriteCardIds.has(c.id)).length;
    const rate = total > 0 ? Math.round((owned / total) * 100) : 0;

    const breakdown: Record<string, { total: number; owned: number }> = {};
    cards.forEach((c) => {
      if (!breakdown[c.rarity]) {
        breakdown[c.rarity] = { total: 0, owned: 0 };
      }
      breakdown[c.rarity].total++;
      if (ownedCardIds.has(c.id)) {
        breakdown[c.rarity].owned++;
      }
    });

    return {
      totalCards: total,
      ownedCount: owned,
      favoriteCount: favs,
      completionRate: rate,
      rarityBreakdown: breakdown,
    };
  }, [cards, ownedCardIds, favoriteCardIds]);

  // Modal navigation (next / previous card)
  const currentCardIndex = useMemo(() => {
    if (!inspectedCard) return -1;
    return filteredCards.findIndex((c) => c.id === inspectedCard.id);
  }, [inspectedCard, filteredCards]);

  const handlePrevCard = () => {
    if (filteredCards.length === 0 || currentCardIndex === -1) return;
    sound.playCardFlip();
    const prevIdx = (currentCardIndex - 1 + filteredCards.length) % filteredCards.length;
    setInspectedCard(filteredCards[prevIdx]);
  };

  const handleNextCard = () => {
    if (filteredCards.length === 0 || currentCardIndex === -1) return;
    sound.playCardFlip();
    const nextIdx = (currentCardIndex + 1) % filteredCards.length;
    setInspectedCard(filteredCards[nextIdx]);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedRarity('All');
    setSelectedElement('All');
    setSelectedCharacter('All');
    setSearchQuery('');
    setOwnershipFilter('all');
  };

  // Custom ZIP replacement
  const handleApplyNewCards = (newCards: CardItemType[], newBackUrl: string) => {
    setCards(newCards);
    if (newBackUrl) {
      setCardBackUrl(newBackUrl);
    }
  };

  const hasActiveFilters = 
    selectedRarity !== 'All' || 
    selectedElement !== 'All' || 
    selectedCharacter !== 'All' || 
    searchQuery.trim() !== '';

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-100 flex flex-col bg-celestial-gradient">
      
      {/* Top Navigation */}
      <Navbar
        stats={stats}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenBooster={() => setIsBoosterOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        activeFilter={ownershipFilter}
        onFilterChange={setOwnershipFilter}
        onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
      />

      {/* Main Container with safe bottom padding for floating mobile dock */}
      <main className="flex-1 pb-28 sm:pb-20">
        
        {/* Hero & Archival Stats Header */}
        <HeroStats
          stats={stats}
          onRandomCard={handleRandomCard}
          onMarkAllOwned={handleMarkAllOwned}
          onResetOwned={handleResetOwned}
          onOpenQuests={() => setIsQuestsOpen(true)}
        />

        {/* Filter & Sorting Controls */}
        <CardFilters
          selectedRarity={selectedRarity}
          onSelectRarity={setSelectedRarity}
          selectedElement={selectedElement}
          onSelectElement={setSelectedElement}
          selectedCharacter={selectedCharacter}
          onSelectCharacter={setSelectedCharacter}
          sortOption={sortOption}
          onSelectSort={setSortOption}
          viewMode={viewMode}
          onSelectViewMode={setViewMode}
          characterList={characterList}
          totalFilteredCount={filteredCards.length}
          totalCardsCount={cards.length}
          onResetFilters={handleResetFilters}
          onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
        />

        {/* Card Gallery Grid (2 Columns on mobile, up to 4 on desktop) */}
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          {filteredCards.length > 0 ? (
            <div
              className={`grid ${
                viewMode === 'compact'
                  ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2 sm:gap-4'
                  : 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-2.5 sm:gap-6'
              }`}
            >
              {filteredCards.map((card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  cardBackUrl={cardBackUrl}
                  isOwned={ownedCardIds.has(card.id)}
                  isFavorite={favoriteCardIds.has(card.id)}
                  onToggleOwned={handleToggleOwned}
                  onToggleFavorite={handleToggleFavorite}
                  onInspect={(c) => setInspectedCard(c)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-16 px-4 rounded-2xl sm:rounded-3xl bg-slate-900/40 border border-slate-800/80 max-w-xl mx-auto my-8">
              <SearchX className="w-12 sm:w-16 h-12 sm:h-16 text-slate-500 mx-auto mb-3" />
              <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-2">
                No Celestial Cards Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mb-5">
                No cards match your current search or filter criteria.
              </p>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        stats={stats}
        activeFilter={ownershipFilter}
        onFilterChange={setOwnershipFilter}
        onOpenBooster={() => setIsBoosterOpen(true)}
        onOpenMobileFilters={() => setIsMobileFilterOpen(true)}
        onOpenQuests={() => setIsQuestsOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Slide-Up Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedRarity={selectedRarity}
        onSelectRarity={setSelectedRarity}
        selectedElement={selectedElement}
        onSelectElement={setSelectedElement}
        selectedCharacter={selectedCharacter}
        onSelectCharacter={setSelectedCharacter}
        sortOption={sortOption}
        onSelectSort={setSortOption}
        characterList={characterList}
        totalFilteredCount={filteredCards.length}
        onResetFilters={handleResetFilters}
      />

      {/* Footer (Desktop & Tablet) */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 py-6 sm:py-8 text-center text-xs text-slate-400 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-amber-400">FATGOATS TCG</span>
            <span>• The Celestial Goat Trading Card Game</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 text-[11px] sm:text-xs">
            <span>Universal Back: <code className="text-cyan-400">00 - Celestial Goat Card Back.png</code></span>
            <span>36 Playable Cards</span>
          </div>
        </div>
      </footer>

      {/* 3D Inspection Modal */}
      {inspectedCard && (
        <CardDetailModal
          card={inspectedCard}
          cardBackUrl={cardBackUrl}
          isOwned={ownedCardIds.has(inspectedCard.id)}
          isFavorite={favoriteCardIds.has(inspectedCard.id)}
          onToggleOwned={handleToggleOwned}
          onToggleFavorite={handleToggleFavorite}
          onClose={() => setInspectedCard(null)}
          onPrevCard={handlePrevCard}
          onNextCard={handleNextCard}
        />
      )}

      {/* Booster Pack Simulator Modal */}
      {isBoosterOpen && (
        <BoosterPackModal
          allCards={cards}
          cardBackUrl={cardBackUrl}
          onClose={() => setIsBoosterOpen(false)}
          onAddCardsToOwned={handleAddCardsToOwned}
          onInspectCard={(c) => {
            setIsBoosterOpen(false);
            setInspectedCard(c);
          }}
        />
      )}

      {/* ZIP Archive Loader Modal */}
      {isUploadOpen && (
        <ZipUploaderModal
          onClose={() => setIsUploadOpen(false)}
          onApplyNewCards={handleApplyNewCards}
        />
      )}

      {/* Goat Quests & IRL Challenges Hub */}
      {isQuestsOpen && (
        <QuestsModal
          allCards={cards}
          ownedCardIds={ownedCardIds}
          onClose={() => setIsQuestsOpen(false)}
          onClaimCard={(cardId) => {
            handleToggleOwned(cardId);
          }}
          onInspectCard={(c) => {
            setIsQuestsOpen(false);
            setInspectedCard(c);
          }}
        />
      )}

    </div>
  );
}

export default App;
