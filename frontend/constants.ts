
import { TaskDifficulty } from './types';

export const DIFFICULTY_REWARDS: Record<TaskDifficulty, number> = {
  [TaskDifficulty.EASY]: 0.05,
  [TaskDifficulty.MEDIUM]: 0.15,
  [TaskDifficulty.HARD]: 0.25,
  [TaskDifficulty.SAVAGE]: 0.50,
};

export const TIME_REWARD_PER_MINUTE = 0.002; // $0.002 per minute

export const STREAK_MULTIPLIER_BASE = 0.005; // 0.5% bonus per streak day

export const GOAL_CHANGE_COST = 10.00;

export const GOAL_COMPLETION_REWARD = 25.00;
export const WEEKLY_OBJECTIVE_COMPLETION_REWARD = 5.00;
export const WISH_COMPLETION_REWARD = 10.00;
export const CORE_TASK_CONTRACT_REWARD = 2.00;

export const DAILY_GRIND_COMPLETION_BONUS_EARNINGS = 1.00;


export const CATEGORY_COLOR_PALETTE: { bg: string; text: string; dot: string }[] = [
  { bg: 'bg-red-900/50', text: 'text-red-400', dot: 'bg-red-500' },
  { bg: 'bg-blue-900/50', text: 'text-blue-400', dot: 'bg-blue-500' },
  { bg: 'bg-yellow-900/50', text: 'text-yellow-400', dot: 'bg-yellow-500' },
  { bg: 'bg-green-900/50', text: 'text-green-400', dot: 'bg-green-500' },
  { bg: 'bg-purple-900/50', text: 'text-purple-400', dot: 'bg-purple-500' },
  { bg: 'bg-indigo-900/50', text: 'text-indigo-400', dot: 'bg-indigo-500' },
  { bg: 'bg-pink-900/50', text: 'text-pink-400', dot: 'bg-pink-500' },
  { bg: 'bg-teal-900/50', text: 'text-teal-400', dot: 'bg-teal-500' },
];

const stringToHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

export const getCategoryColor = (category: string): { bg: string; text: string; dot: string } => {
  if (!category) {
    return { bg: 'bg-gray-700', text: 'text-gray-300', dot: 'bg-gray-400' };
  }
  const hash = stringToHash(category);
  return CATEGORY_COLOR_PALETTE[hash % CATEGORY_COLOR_PALETTE.length];
};

// --- RANKING SYSTEM ---

export interface Rank {
  name: string;
  gpThreshold: number;
  imageUrl: string;
}

// Ordered from lowest to highest
export const RANKS_ASC: Rank[] = [
    { name: 'CHICK', gpThreshold: 0, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/chick.gif' },
    { name: 'WOOD HAMMER', gpThreshold: 1100, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/wood-hammer.gif' },
    { name: 'DOUBLE WOOD HAMMER', gpThreshold: 1200, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/double-wood-hammer.gif' },
    { name: 'STONE AXE', gpThreshold: 1500, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/stone-axe.gif' },
    { name: 'DOUBLE STONE AXE', gpThreshold: 1800, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/double-stone-axe.gif' },
    { name: 'METAL AXE', gpThreshold: 2300, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/metal-axe.gif' },
    { name: 'DOUBLE METAL AXE', gpThreshold: 2800, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/double-metal-axe.gif' },
    { name: 'SILVER AXE', gpThreshold: 3500, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/silver-axe.gif' },
    { name: 'DOUBLE SILVER AXE', gpThreshold: 4200, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/double-silver-axe.gif' },
    { name: 'GOLD AXE', gpThreshold: 5100, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/gold-axe.gif' },
    { name: 'DOUBLE GOLD AXE', gpThreshold: 6000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/double-gold-axe.gif' },
    { name: 'METAL DOUBLE SIDED AXE', gpThreshold: 7000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/metal-double-sided-axe.gif' },
    { name: 'METAL DOUBLE SIDED AXE+', gpThreshold: 8500, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/metal-double-sided-axe-.gif' },
    { name: 'SILVER DOUBLE SIDED AXE', gpThreshold: 10000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/silver-double-sided-axe.gif' },
    { name: 'SILVER DOUBLE SIDED AXE+', gpThreshold: 12000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/silver-double-sided-axe-.gif' },
    { name: 'GOLD DOUBLE SIDED AXE', gpThreshold: 15000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/gold-double-sided-axe.gif' },
    { name: 'GOLD DOUBLE SIDED AXE+', gpThreshold: 20000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/gold-double-sided-axe-.gif' },
    { name: 'VIOLET SCEPTER', gpThreshold: 25000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/violet-scepter.gif' },
    { name: 'SAPPHIRE SCEPTER', gpThreshold: 30000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/sapphire-scepter.gif' },
    { name: 'RED RUBY SCEPTER', gpThreshold: 40000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/red-ruby-scepter.gif' },
    { name: 'DIAMOND SCEPTER', gpThreshold: 50000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/diamond-scepter.gif' },
    { name: 'BLUE DRAGON', gpThreshold: 75000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/blue-dragon.gif' },
    { name: 'RED DRAGON', gpThreshold: 100000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/red-dragon.gif' },
    { name: 'SILVER DRAGON', gpThreshold: 150000, imageUrl: 'https://gunboundggh.com/assets/images/preregis/Global/Web/Guides/Ranks/silver-dragon.gif' },
];

export const getRank = (gp: number): { current: Rank, next: Rank | null } => {
    let currentRank = RANKS_ASC[0];
    let nextRank: Rank | null = RANKS_ASC[1];

    for (let i = 0; i < RANKS_ASC.length; i++) {
        if (gp >= RANKS_ASC[i].gpThreshold) {
            currentRank = RANKS_ASC[i];
            nextRank = i + 1 < RANKS_ASC.length ? RANKS_ASC[i + 1] : null;
        } else {
            // Since the array is sorted, we can break once we find a rank the user doesn't qualify for.
            break;
        }
    }
    
    return {
        current: currentRank,
        next: nextRank,
    };
};
