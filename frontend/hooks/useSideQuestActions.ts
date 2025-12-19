import React, { Dispatch, SetStateAction } from 'react';
import { SideQuest, Character, TaskDifficulty } from '../types';
import { api } from '../services/api';
import { generateId } from '../utils/commonUtils';
import { getLocalDateString } from '../utils/dateUtils';
import { DIFFICULTY_REWARDS } from '../constants';

export const useSideQuestActions = (
    sideQuests: SideQuest[],
    setSideQuests: Dispatch<SetStateAction<SideQuest[]>>,
    character: Character,
    setCharacter: Dispatch<SetStateAction<Character>>
) => {
    const completeSideQuest = async (questId: string) => {
        const today = getLocalDateString();
        const sideQuestToUpdate = sideQuests.find(q => q.id === questId);
        if (!sideQuestToUpdate) return;

        const reward = DIFFICULTY_REWARDS[sideQuestToUpdate.difficulty];
        const newBonuses = (character.bonuses || 0) + reward;

        const newCompletions = { ...sideQuestToUpdate.completions };
        newCompletions[today] = (newCompletions[today] || 0) + 1;
        const updatedQuest = { ...sideQuestToUpdate, completions: newCompletions };

        // Optimistic Updates
        setSideQuests(prev => prev.map(q => q.id === questId ? updatedQuest : q));
        setCharacter(prev => ({ ...prev, bonuses: newBonuses }));

        try {
            await api.sideQuests.update(updatedQuest);
            await api.character.update({ ...character, bonuses: newBonuses });
        } catch (e) {
            console.error("Failed to complete side quest, rolling back...", e);
            setSideQuests(prev => prev.map(q => q.id === questId ? sideQuestToUpdate : q));
            setCharacter(prev => ({ ...prev, bonuses: (character.bonuses || 0) }));
        }
    };

    const addSideQuest = async (questData: { description: string, difficulty: TaskDifficulty, dailyGoal: number }) => {
        const newQuest: SideQuest = { ...questData, id: generateId(), completions: {} };
        try {
            const saved = await api.sideQuests.create(newQuest);
            setSideQuests(prev => [...prev, saved]);
        } catch (e) { console.error("Failed to add side quest", e); }
    };

    const deleteSideQuest = async (questId: string) => {
        try {
            await api.sideQuests.delete(questId);
            setSideQuests(prev => prev.filter(q => q.id !== questId));
        } catch (e) { console.error("Failed to delete side quest", e); }
    };

    const updateSideQuest = async (questId: string, updates: { description: string, difficulty: TaskDifficulty, dailyGoal: number }) => {
        const existing = sideQuests.find(q => q.id === questId);
        if (!existing) return;
        const updated = { ...existing, ...updates };
        try {
            await api.sideQuests.update(updated);
            setSideQuests(prev => prev.map(q => q.id === questId ? updated : q));
        } catch (e) { console.error("Failed to update side quest", e); }
    };

    return {
        completeSideQuest,
        addSideQuest,
        deleteSideQuest,
        updateSideQuest
    };
};
