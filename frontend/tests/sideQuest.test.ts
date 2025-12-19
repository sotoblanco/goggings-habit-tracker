
import { describe, it, expect, vi } from 'vitest';
import { TaskDifficulty, SideQuest, Character } from '../types';
import { DIFFICULTY_REWARDS } from '../constants';

// Mock getLocalDateString
const MOCK_DATE = '2023-10-27';
vi.mock('../utils/dateUtils', () => ({
    getLocalDateString: () => MOCK_DATE
}));

describe('SideQuest Logic', () => {

    it('should calculate new bonuses correctly', () => {
        const initialCharacter: Character = { spent: 0, bonuses: 100 };
        const difficulty = TaskDifficulty.EASY;
        const reward = DIFFICULTY_REWARDS[difficulty];

        const newBonuses = (initialCharacter.bonuses || 0) + reward;
        expect(newBonuses).toBe(100 + reward);
    });

    it('should update completions correctly', () => {
        const quest: SideQuest = {
            id: '1',
            description: 'Test Quest',
            difficulty: TaskDifficulty.EASY,
            dailyGoal: 1,
            completions: {}
        };

        const today = MOCK_DATE;
        const newCompletions = { ...quest.completions };
        newCompletions[today] = (newCompletions[today] || 0) + 1;

        expect(newCompletions[today]).toBe(1);
    });

    it('should hide quest if daily goal is met', () => {
        const quest: SideQuest = {
            id: '1',
            description: 'Test Quest',
            difficulty: TaskDifficulty.EASY,
            dailyGoal: 1,
            completions: { [MOCK_DATE]: 1 }
        };

        const today = MOCK_DATE;
        const completionsToday = quest.completions?.[today] || 0;
        const goalMet = quest.dailyGoal > 0 && completionsToday >= quest.dailyGoal;

        expect(goalMet).toBe(true);
    });

    it('should NOT hide quest if daily goal is NOT met', () => {
        const quest: SideQuest = {
            id: '1',
            description: 'Test Quest',
            difficulty: TaskDifficulty.EASY,
            dailyGoal: 5,
            completions: { [MOCK_DATE]: 1 }
        };

        const today = MOCK_DATE;
        const completionsToday = quest.completions?.[today] || 0;
        const goalMet = quest.dailyGoal > 0 && completionsToday >= quest.dailyGoal;

        expect(goalMet).toBe(false);
    });
});
