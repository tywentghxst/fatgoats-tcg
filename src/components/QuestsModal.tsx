import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  Dices, 
  Flame, 
  Target, 
  Camera,
  Timer,
  Mic,
  FileText
} from 'lucide-react';
import { FAT_GOATS_QUESTS, QuestItem, ProofType } from '../data/questsData';
import { CardItem } from '../types';
import { sound } from '../utils/audio';
import { ProofModal } from './ProofModal';

interface QuestsModalProps {
  allCards: CardItem[];
  ownedCardIds: Set<string>;
  onClose: () => void;
  onClaimCard: (cardId: string) => void;
  onInspectCard: (card: CardItem) => void;
}

export const QuestsModal: React.FC<QuestsModalProps> = ({
  allCards,
  ownedCardIds,
  onClose,
  onClaimCard,
  onInspectCard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [filterMode, setFilterMode] = useState<'all' | 'available' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [randomQuest, setRandomQuest] = useState<QuestItem | null>(null);
  const [activeProofQuest, setActiveProofQuest] = useState<QuestItem | null>(null);

  // Map cards by id for fast lookups
  const cardMap = useMemo(() => {
    const map = new Map<string, CardItem>();
    allCards.forEach((c) => map.set(c.id, c));
    return map;
  }, [allCards]);

  const categories = ['All', 'Fitness & Action', 'Social & Comedy', 'Food & Feast', 'Creativity & Vibe', 'Mastery'];

  const filteredQuests = useMemo(() => {
    return FAT_GOATS_QUESTS.filter((q) => {
      const isOwned = ownedCardIds.has(q.cardId);
      if (filterMode === 'available' && isOwned) return false;
      if (filterMode === 'completed' && !isOwned) return false;

      if (selectedCategory !== 'All' && q.category !== selectedCategory) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const target = `${q.title} ${q.cardTitle} ${q.instruction} ${q.category}`.toLowerCase();
        if (!target.includes(query)) return false;
      }
      return true;
    });
  }, [ownedCardIds, filterMode, selectedCategory, searchQuery]);

  const completedCount = useMemo(() => {
    return FAT_GOATS_QUESTS.filter((q) => ownedCardIds.has(q.cardId)).length;
  }, [ownedCardIds]);

  const totalXP = useMemo(() => {
    return FAT_GOATS_QUESTS.filter((q) => ownedCardIds.has(q.cardId)).reduce((sum, q) => sum + q.xpReward, 0);
  }, [ownedCardIds]);

  const rollRandomChallenge = () => {
    sound.playCardFlip();
    const available = FAT_GOATS_QUESTS.filter((q) => !ownedCardIds.has(q.cardId));
    const pool = available.length > 0 ? available : FAT_GOATS_QUESTS;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    setRandomQuest(picked);
  };

  const difficultyColors = {
    'Easy': 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
    'Medium': 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
    'Legendary': 'bg-amber-950/70 border-amber-500/40 text-amber-300',
    'Goat-Tier': 'bg-pink-950/70 border-pink-500/40 text-pink-300',
  };

  const proofIcons: Record<ProofType, { icon: React.ReactNode; label: string }> = {
    'photo': { icon: <Camera className="w-3 h-3 text-cyan-400" />, label: 'Photo Proof' },
    'timer': { icon: <Timer className="w-3 h-3 text-amber-400" />, label: 'Hold Timer' },
    'audio': { icon: <Mic className="w-3 h-3 text-rose-400" />, label: 'Voice Shout' },
    'text': { icon: <FileText className="w-3 h-3 text-emerald-400" />, label: 'Field Report' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl"
      />

      {/* Main Window */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="relative w-full max-w-4xl bg-[#09101d] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl shadow-cyan-950/60 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>IRL Challenges with Proof Verification</span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-2xl text-white">
              Goat Quests: <span className="text-amber-400">Prove & Unlock Cards</span>
            </h2>
            <p className="text-xs text-slate-400 hidden sm:block mt-0.5">
              Submit photo proof, voice shouts, or run the stopwatch to prove your feat and unlock cards!
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={rollRandomChallenge}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition"
            >
              <Dices className="w-4 h-4" />
              <span className="hidden sm:inline">Spin Random Quest</span>
              <span className="sm:hidden">Spin</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Highlighted Random Quest Banner (if spun) */}
        {randomQuest && (
          <div className="p-4 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border-b border-amber-500/40 flex items-center justify-between gap-3 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-amber-300 font-bold uppercase tracking-wider mb-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Selected Quest: #{randomQuest.cardNumber} {randomQuest.cardTitle}</span>
              </div>
              <p className="text-xs sm:text-sm text-white font-medium">
                "{randomQuest.instruction}"
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveProofQuest(randomQuest)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-bold text-xs active:scale-95 transition shadow-lg shadow-emerald-500/20"
              >
                Prove & Claim Card
              </button>
              <button
                onClick={() => setRandomQuest(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-slate-400">Verified:</span>{' '}
              <strong className="text-emerald-400 font-mono text-sm">{completedCount}</strong>/36
            </div>
            <div>
              <span className="text-slate-400">Total Goat XP:</span>{' '}
              <strong className="text-amber-300 font-mono text-sm">{totalXP} XP</strong>
            </div>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                filterMode === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              All ({FAT_GOATS_QUESTS.length})
            </button>
            <button
              onClick={() => setFilterMode('available')}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                filterMode === 'available' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Available ({36 - completedCount})
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                filterMode === 'completed' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              Verified ({completedCount})
            </button>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Quests List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 flex-1 overscroll-contain">
          {filteredQuests.map((quest) => {
            const isOwned = ownedCardIds.has(quest.cardId);
            const card = cardMap.get(quest.cardId);
            const proofInfo = proofIcons[quest.proofType];

            return (
              <div
                key={quest.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  isOwned
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 shadow-md'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Card Thumbnail */}
                  {card && (
                    <div
                      onClick={() => onInspectCard(card)}
                      className="w-12 sm:w-16 aspect-[731/1024] rounded-lg overflow-hidden border border-slate-700 shrink-0 cursor-pointer hover:scale-105 transition-transform"
                      title="Inspect Card"
                    >
                      <img
                        src={card.thumbUrl || card.imageUrl}
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Quest Details */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-amber-300">
                        #{quest.cardNumber}
                      </span>
                      <h4 className="font-display font-bold text-sm sm:text-base text-white truncate">
                        {quest.cardTitle}
                      </h4>
                      <span className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase border ${difficultyColors[quest.difficulty]}`}>
                        {quest.difficulty}
                      </span>

                      {/* Required Proof Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-[10px] text-slate-300 font-medium">
                        {proofInfo.icon}
                        <span>{proofInfo.label}</span>
                      </span>

                      <span className="text-[10px] text-cyan-400 font-mono ml-auto">
                        +{quest.xpReward} XP
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-200 font-medium mb-1 leading-relaxed">
                      "{quest.instruction}"
                    </p>

                    <p className="text-[11px] text-slate-400 italic">
                      Why: {quest.loreReason}
                    </p>
                  </div>

                  {/* Prove Button / Verified Status */}
                  <div className="shrink-0 self-center">
                    {isOwned ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Verified</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveProofQuest(quest)}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition flex items-center gap-1"
                      >
                        {proofInfo.icon}
                        <span>Prove & Claim</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </motion.div>

      {/* ACTIVE PROOF VERIFICATION MODAL */}
      {activeProofQuest && (
        <ProofModal
          quest={activeProofQuest}
          card={cardMap.get(activeProofQuest.cardId)}
          onClose={() => setActiveProofQuest(null)}
          onVerified={(cardId) => {
            onClaimCard(cardId);
            setActiveProofQuest(null);
          }}
        />
      )}
    </div>
  );
};
