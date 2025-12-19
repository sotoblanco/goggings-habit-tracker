import React, { Dispatch, SetStateAction } from 'react';
import { Task, Goal, WeeklyGoal, GoalContract, Character, DailyScore, CategoryScore, ObjectiveScore, Wish, CoreTask } from '../types';
import { api } from '../services/api';
import { generateLabel, analyzeTaskGoalSimilarity, generateGogginsGoalChangeVerdict, generateGogginsGoalCompletionVerdict, generateAtomicHabitsSystem, generateWeeklyGoalEvaluation } from '../services/geminiService';
import { generateId } from '../utils/commonUtils';
import { getLocalDateString, getStartOfWeek, getEndOfWeek, getDatesInRange } from '../utils/dateUtils';
import { GOAL_CHANGE_COST, GOAL_COMPLETION_REWARD } from '../constants';

export const useGoalActions = (
    goals: Goal[],
    setGoals: Dispatch<SetStateAction<Goal[]>>,
    weeklyGoals: { [key: string]: WeeklyGoal[] },
    setWeeklyGoals: Dispatch<SetStateAction<{ [key: string]: WeeklyGoal[] }>>,
    character: Character,
    setCharacter: Dispatch<SetStateAction<Character>>,
    allTasks: (Task & { date: string })[],
    categoryScores: CategoryScore[],
    purchasedRewards: any[],
    getTasksForDate: (date: string) => Task[],
    setShowCompletionBonus: (bonus: any) => void,
    setAtomicHabitsSuggestions: (suggestions: any) => void
) => {

    const addGoal = async (goalData: { description: string; targetDate: string }) => {
        const label = await generateLabel(goalData.description);
        const newGoal: Goal = { ...goalData, id: generateId(), label, completed: false };
        try {
            const saved = await api.goals.create(newGoal);
            setGoals(prev => [...prev, saved]);
        } catch (e) { console.error(e); }
    };

    const updateGoal = async (goalId: string, updates: Partial<Goal>) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return;
        const updated = { ...goal, ...updates };
        try {
            await api.goals.update(updated);
            setGoals(goals.map(g => g.id === goalId ? updated : g));
        } catch (e) { console.error(e); }
    };

    const deleteGoal = async (goalId: string) => {
        try {
            await api.goals.delete(goalId);
            setGoals(goals.filter(g => g.id !== goalId));
        } catch (e) { console.error(e); }
    };

    const handleGoalChangeRequest = async (justification: string, currentGoal: Goal) => {
        const result = await generateGogginsGoalChangeVerdict(justification, currentGoal.description);
        if (result.approved) {
            const newSpent = (character.spent || 0) + GOAL_CHANGE_COST;
            try {
                await api.character.update({ ...character, spent: newSpent });
                setCharacter(prev => ({ ...prev, spent: newSpent }));
            } catch (e) { console.error(e); }
        }
        return result;
    };

    const completeGoal = async (goalId: string, proof: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return { approved: false, feedback: "Goal not found." };

        const result = await generateGogginsGoalCompletionVerdict(goal.description, proof);

        if (result.approved) {
            const completionDate = getLocalDateString();
            const updated = { ...goal, completed: true, completionDate, completionProof: proof, completionFeedback: result.feedback };

            try {
                await api.goals.update(updated);
                setGoals(goals.map(g => g.id === goalId ? updated : g));

                const newBonuses = (character.bonuses || 0) + GOAL_COMPLETION_REWARD;
                await api.character.update({ ...character, bonuses: newBonuses });
                setCharacter(prev => ({ ...prev, bonuses: newBonuses }));

                setShowCompletionBonus({ title: "Objective Conquered!", xp: 0, earnings: GOAL_COMPLETION_REWARD });
                setTimeout(() => setShowCompletionBonus(null), 5000);
            } catch (e) { console.error(e); }
        }
        return result;
    };

    const updateGoalContract = async (goalId: string, newContract: GoalContract) => {
        const goalToUpdate = goals.find(g => g.id === goalId);
        if (!goalToUpdate) return;

        const accomplishmentsSummary = {
            totalTasks: allTasks.filter(t => t.completed).length,
            topCategories: categoryScores.sort((a, b) => b.tasksCompleted - a.tasksCompleted).slice(0, 3).map(c => c.category)
        };

        const goalWithNewContract = { ...goalToUpdate, contract: newContract };
        const newSystem = await generateAtomicHabitsSystem(goalWithNewContract, goals, accomplishmentsSummary);
        const newLabel = await generateLabel(newContract.primaryObjective);
        const updated = { ...goalToUpdate, contract: newContract, system: newSystem, label: newLabel };

        try {
            await api.goals.update(updated);
            setGoals(prev => prev.map(g => g.id === goalId ? updated : g));
            setAtomicHabitsSuggestions(newSystem);
        } catch (e) { console.error(e); }
    };

    // Weekly Goal Handlers
    const addWeeklyGoal = async (weekKey: string, goalData: WeeklyGoal) => {
        const label = await generateLabel(goalData.contract?.primaryObjective || goalData.description);
        const newGoal: WeeklyGoal = { ...goalData, id: generateId(), label };

        const activeGoals = goals.filter(g => !g.completed);
        if (activeGoals.length > 0) {
            const { alignmentScore, alignedGoalId } = await analyzeTaskGoalSimilarity(newGoal.description, activeGoals);
            newGoal.goalAlignment = alignmentScore;
            newGoal.alignedGoalId = alignedGoalId;
        }

        try {
            const saved = await api.weeklyGoals.create(newGoal);
            setWeeklyGoals(prev => ({
                ...prev,
                [weekKey]: [...(prev[weekKey] || []), saved]
            }));
        } catch (e) { console.error(e); }
    };

    const updateWeeklyGoal = async (weekKey: string, goalId: string, description: string) => {
        const weekGoals = weeklyGoals[weekKey] || [];
        const existing = weekGoals.find(g => g.id === goalId);
        if (!existing) return;

        let updatedGoal = { ...existing, description };
        const activeGoals = goals.filter(g => !g.completed);
        if (activeGoals.length > 0) {
            const { alignmentScore, alignedGoalId } = await analyzeTaskGoalSimilarity(description, activeGoals);
            updatedGoal.goalAlignment = alignmentScore;
            updatedGoal.alignedGoalId = alignedGoalId;
        }

        try {
            await api.weeklyGoals.update(updatedGoal);
            setWeeklyGoals(prev => ({
                ...prev,
                [weekKey]: (prev[weekKey] || []).map(g => g.id === goalId ? updatedGoal : g)
            }));
        } catch (e) { console.error(e); }
    };

    const updateWeeklyGoalContract = async (weekKey: string, goalId: string, newContract: GoalContract) => {
        const newLabel = await generateLabel(newContract.primaryObjective);
        const weekGoals = weeklyGoals[weekKey] || [];
        const existing = weekGoals.find(g => g.id === goalId);
        if (!existing) return;

        const updated = { ...existing, contract: newContract, label: newLabel, description: newContract.primaryObjective };
        try {
            await api.weeklyGoals.update(updated);
            setWeeklyGoals(prev => ({
                ...prev,
                [weekKey]: (prev[weekKey] || []).map(g => g.id === goalId ? updated : g)
            }));
        } catch (e) { console.error(e); }
    };

    const deleteWeeklyGoal = async (weekKey: string, goalId: string) => {
        try {
            await api.weeklyGoals.delete(goalId);
            setWeeklyGoals(prev => ({
                ...prev,
                [weekKey]: (prev[weekKey] || []).filter(g => g.id !== goalId)
            }));
        } catch (e) { console.error(e); }
    };

    const evaluateWeeklyGoal = async (weekKey: string, goalId: string) => {
        const goal = weeklyGoals[weekKey]?.find(g => g.id === goalId);
        if (!goal) return;

        const start = getStartOfWeek(new Date(goal.targetDate.replace(/-/g, '/')));
        const end = getEndOfWeek(new Date(goal.targetDate.replace(/-/g, '/')));
        const weekDates = getDatesInRange(start, end).map(d => getLocalDateString(d));

        const completedTasks = weekDates.flatMap(date =>
            getTasksForDate(date)
                .filter(t => t.completed)
                .map(t => ({ description: t.description, category: t.category }))
        );

        const rewardsPurchasedThisWeek = purchasedRewards.filter(r => weekDates.includes(r.purchaseDate));
        const evaluation = await generateWeeklyGoalEvaluation(goal.description, completedTasks, rewardsPurchasedThisWeek);
        const updated = { ...goal, evaluation };

        try {
            await api.weeklyGoals.update(updated);
            setWeeklyGoals(prev => ({
                ...prev,
                [weekKey]: (prev[weekKey] || []).map(g => g.id === goalId ? updated : g)
            }));
        } catch (e) { console.error(e); }
    };

    return {
        addGoal,
        updateGoal,
        deleteGoal,
        handleGoalChangeRequest,
        completeGoal,
        updateGoalContract,
        addWeeklyGoal,
        updateWeeklyGoal,
        updateWeeklyGoalContract,
        deleteWeeklyGoal,
        evaluateWeeklyGoal
    };
};
