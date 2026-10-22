import JSZip from 'jszip';
import { CardItem, CardRarity, CardElement } from '../types';

interface ParseZipResult {
  cards: CardItem[];
  cardBackUrl: string;
  totalParsed: number;
}

// Helper to deduce rarity from title or number
function inferRarity(title: string, num: number): CardRarity {
  const lower = title.toLowerCase();
  if (lower.includes('six paths') || lower.includes('beast') || lower.includes('bedroom vigilante') || lower.includes('king of fatgoats') || lower.includes('ultimate giver')) {
    return 'Mythic Rare';
  }
  if (lower.includes('secret') || lower.includes('dickhead') || lower.includes('b.d.l.a.p.') || lower.includes("don't want you to die")) {
    return 'Secret Rare';
  }
  if (lower.includes('master') || lower.includes('frog king') || lower.includes('dark magician') || lower.includes('sonic') || lower.includes('kame') || lower.includes('sage') || lower.includes('richest rapper')) {
    return 'Legendary';
  }
  if (lower.includes('superbutterfly') || lower.includes('rubber pirate') || lower.includes('camo') || lower.includes('ark survivor')) {
    return 'Ultra Rare';
  }
  if (num % 5 === 0) return 'Ultra Rare';
  if (num === 9) return 'Common';
  return 'Rare';
}

// Helper to deduce element from title
function inferElement(title: string): CardElement {
  const lower = title.toLowerCase();
  if (lower.includes('six paths') || lower.includes('celestial') || lower.includes('divine')) return 'Celestial';
  if (lower.includes('fire') || lower.includes('toast') || lower.includes('flame') || lower.includes('tailed beast')) return 'Fire';
  if (lower.includes('tidal') || lower.includes('ocean') || lower.includes('pirate') || lower.includes('water')) return 'Water';
  if (lower.includes('oak') || lower.includes('block') || lower.includes('camo') || lower.includes('earth')) return 'Earth';
  if (lower.includes('sonic') || lower.includes('kame') || lower.includes('lightning') || lower.includes('thunder') || lower.includes('show host')) return 'Lightning';
  if (lower.includes('butterfly') || lower.includes('ninja') || lower.includes('wind')) return 'Wind';
  if (lower.includes('frog') || lower.includes('bear') || lower.includes('nature') || lower.includes('ark')) return 'Nature';
  if (lower.includes('dark') || lower.includes('abyss') || lower.includes('rapper')) return 'Dark';
  if (lower.includes('shadow') || lower.includes('trenchcoat') || lower.includes('bedroom')) return 'Shadow';
  if (lower.includes('wizard') || lower.includes('cards') || lower.includes('arcane') || lower.includes('spell')) return 'Arcane';
  if (lower.includes('knight') || lower.includes('b.d.l.a.p') || lower.includes('steel') || lower.includes('armor')) return 'Steel';
  if (lower.includes('celebrant') || lower.includes('mr. beast') || lower.includes('devin') || lower.includes('giver')) return 'Divine';
  return 'Chaos';
}

// Helper to parse filename "04 - Toaster The King of FatGoats.png"
export function parseCardFilename(fileName: string): {
  cardNumber: string;
  title: string;
  subtitle: string;
  character: string;
} {
  const clean = fileName.replace(/\.[^/.]+$/, '').trim();
  const match = clean.match(/^(\d+)\s*[-_]\s*(.+)$/);

  if (match) {
    const cardNumber = match[1].padStart(2, '0');
    const fullTitle = match[2].trim();

    // Split character and subtitle if has "The" or parenthesis
    let character = fullTitle;
    let subtitle = '';

    const theMatch = fullTitle.match(/^([A-Za-z0-9\s.']+?)\s+(The\s+.+|And\s+.+|We\s+.+)$/i);
    if (theMatch) {
      character = theMatch[1].trim();
      subtitle = theMatch[2].trim();
    } else {
      const parts = fullTitle.split(' ');
      character = parts[0];
      subtitle = parts.slice(1).join(' ') || 'The FatGoat';
    }

    return { cardNumber, title: character, subtitle, character };
  }

  return {
    cardNumber: '??',
    title: clean,
    subtitle: 'Mystic Goat',
    character: clean.split(' ')[0] || 'Unknown',
  };
}

export async function parseZipArchive(
  file: File | Blob,
  onProgress?: (percent: number, currentFile: string) => void
): Promise<ParseZipResult> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);

  const imageEntries: { name: string; entry: JSZip.JSZipObject }[] = [];
  loadedZip.forEach((relativePath, entry) => {
    if (!entry.dir && /\.(png|jpe?g|webp)$/i.test(relativePath)) {
      // Exclude Mac OS __MACOSX resource forks
      if (!relativePath.includes('__MACOSX') && !relativePath.startsWith('.')) {
        imageEntries.push({ name: relativePath, entry });
      }
    }
  });

  if (imageEntries.length === 0) {
    throw new Error('No supported card images (.png, .jpg, .webp) found in the ZIP archive.');
  }

  let cardBackUrl = '';
  const parsedCards: CardItem[] = [];

  const total = imageEntries.length;
  let processed = 0;

  for (const item of imageEntries) {
    const fileName = item.name.split('/').pop() || item.name;
    const blob = await item.entry.async('blob');
    const blobUrl = URL.createObjectURL(blob);

    // Check if this is the designated card back
    if (
      fileName.toLowerCase().includes('celestial goat card back') ||
      fileName.toLowerCase().includes('card back') ||
      fileName.startsWith('00')
    ) {
      cardBackUrl = blobUrl;
    } else {
      const { cardNumber, title, subtitle, character } = parseCardFilename(fileName);
      const num = parseInt(cardNumber, 10) || processed + 1;
      const rarity = inferRarity(`${title} ${subtitle}`, num);
      const element = inferElement(`${title} ${subtitle}`);

      // Generative stats
      const baseStat = 650 + (num * 17) % 400;
      const hp = 700 + (num * 23) % 550;
      const attack = baseStat + (num * 11) % 250;
      const defense = baseStat + (num * 19) % 250;
      const speed = 600 + (num * 29) % 450;

      parsedCards.push({
        id: `zip-${cardNumber}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        cardNumber,
        fileName,
        title,
        subtitle,
        character,
        rarity,
        element,
        hp,
        attack,
        defense,
        speed,
        abilityName: `${character}'s Celestial Surge`,
        abilityDesc: `Channels the primal power of ${element} to dominate opposing cards with dynamic battle effects.`,
        flavorText: `"${title} ${subtitle} — awakened from the archives of the Celestial Goat realm."`,
        artistCredit: 'FatGoats Studio',
        imageUrl: blobUrl,
        thumbUrl: blobUrl,
      });
    }

    processed++;
    if (onProgress) {
      onProgress(Math.round((processed / total) * 100), fileName);
    }
  }

  // Sort cards by card number
  parsedCards.sort((a, b) => {
    const na = parseInt(a.cardNumber, 10) || 0;
    const nb = parseInt(b.cardNumber, 10) || 0;
    return na - nb;
  });

  return {
    cards: parsedCards,
    cardBackUrl,
    totalParsed: parsedCards.length,
  };
}
