export type CardRarity = 'Common' | 'Rare' | 'Ultra Rare' | 'Legendary' | 'Mythic Rare' | 'Secret Rare';

export type CardElement = 
  | 'Celestial' 
  | 'Fire' 
  | 'Water' 
  | 'Earth' 
  | 'Wind' 
  | 'Lightning' 
  | 'Nature' 
  | 'Dark' 
  | 'Shadow' 
  | 'Arcane' 
  | 'Chaos' 
  | 'Divine' 
  | 'Steel';

export interface CardItem {
  id: string;
  cardNumber: string; // e.g., "01"
  fileName: string;
  title: string;
  subtitle: string;
  character: string;
  rarity: CardRarity;
  element: CardElement;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  abilityName: string;
  abilityDesc: string;
  flavorText: string;
  artistCredit?: string;
  imageUrl: string;
  thumbUrl: string;
  isCardBack?: boolean;
  isNew?: boolean;
}

export type SortOption = 'number-asc' | 'number-desc' | 'name-asc' | 'name-desc' | 'rarity-desc' | 'power-desc';

export type ViewMode = 'grid' | 'binder' | 'compact';

export interface FilterState {
  search: string;
  rarity: string;
  element: string;
  character: string;
  ownership: 'all' | 'owned' | 'unowned' | 'favorite' | 'new';
}

export interface CollectionStats {
  totalCards: number;
  ownedCount: number;
  favoriteCount: number;
  completionRate: number;
  rarityBreakdown: Record<string, { total: number; owned: number }>;
}
