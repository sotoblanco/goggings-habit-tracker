import React, { useState, useCallback, Dispatch, SetStateAction } from 'react';
import { Task, RecurringTask, Goal, TaskDifficulty, RecurrenceRule, Character } from '../types';
import { api } from '../services/api';
import { generateGogginsStory, generateBettingOdds } from '../services/geminiService';
import { generateId } from '../utils/commonUtils';
import { isRecurringOnDate } from '../utils/dateUtils';
import { DIFFICULTY_REWARDS, TIME_REWARD_PER_MINUTE } from '../constants';

export const useTaskActions = (
    tasks: { [key: string]: Task[] },
    setTasks: Dispatch<SetStateAction<{ [key: string]: Task[] }>>,
    recurringTasks: RecurringTask[],
    setRecurringTasks: Dispatch<SetStateAction<RecurringTask[]>>,
    goals: Goal[],
    userCategories: string[],
    setUserCategories: Dispatch<SetStateAction<string[]>>,
    character: Character,
    setCharacter: Dispatch<SetStateAction<Character>>,
    setSelectedDate: (date: string) => void,
    setCalendarView: (view: any) => void,
    setSelectedTaskId: (id: string | null) => void,
    setMotivationalStory: (story: string) => void,
    setIsLoadingStory: (loading: boolean) => void,
    setTaskToBetOn: (task: any) => void,
    setShowCompletionBonus: (bonus: any) => void,
    setLastUpdatedDate: (date: string) => void
) => {

    const getTasksForDate = useCallback((dateStr: string): Task[] => {
        const dayTasks = tasks[dateStr] || [];

        const recurringInstances: Task[] = recurringTasks
            .filter(rt => isRecurringOnDate(rt, dateStr))
            .map(rt => ({
                ...rt,
                id: `${rt.id}_${dateStr}`,
                date: dateStr,
                recurringMasterId: rt.id,
                completed: rt.completions[dateStr]?.completed || false,
                actualTime: rt.completions[dateStr]?.actualTime || null,
                time: rt.completions[dateStr]?.time ?? rt.time,
                betPlaced: rt.completions[dateStr]?.betPlaced,
                betAmount: rt.completions[dateStr]?.betAmount,
                betMultiplier: rt.completions[dateStr]?.betMultiplier,
                betWon: rt.completions[dateStr]?.betWon,
            } as any));

        return [...dayTasks, ...recurringInstances];
    }, [tasks, recurringTasks]);

    const _commitTask = async (taskToCommit: Task & { recurrenceRule: 'None' | RecurrenceRule }) => {
        setSelectedDate(taskToCommit.date);
        setCalendarView('day');

        const activeGoals = goals.filter(g => !g.completed);
        const matchingGoal = activeGoals.find(g => g.label?.toLowerCase() === taskToCommit.category.toLowerCase());

        let goalAlignment: number | undefined = 3;
        let alignedGoalId: string | undefined = undefined;
        let justification = taskToCommit.justification;

        if (matchingGoal) {
            alignedGoalId = matchingGoal.id;
            goalAlignment = 5;
            if (!justification) {
                justification = `Directly assigned to objective: ${matchingGoal.label}.`;
            }
        } else if (!justification) {
            justification = "Manually categorized.";
        }

        let createdTask: Task | RecurringTask;

        if (taskToCommit.recurrenceRule === 'None') {
            const { recurrenceRule, ...rest } = taskToCommit;
            const newTask: Task = { ...rest, completed: false, actualTime: null, goalAlignment, alignedGoalId, justification };

            try {
                const savedTask = await api.tasks.create(newTask);
                createdTask = savedTask;

                setTasks(prevTasks => ({
                    ...prevTasks,
                    [savedTask.date]: [...(prevTasks[savedTask.date] || []), savedTask]
                }));
            } catch (error) {
                console.error("Failed to create task", error);
                return;
            }

        } else {
            const { date, recurrenceRule, ...rest } = taskToCommit;
            const newRecurringTask: RecurringTask = { ...rest, id: generateId(), recurrenceRule, startDate: date, completions: {}, goalAlignment, alignedGoalId, justification };
            if (taskToCommit.betPlaced) {
                newRecurringTask.completions[date] = {
                    completed: false,
                    actualTime: null,
                    betPlaced: true,
                    betAmount: taskToCommit.betAmount,
                    betMultiplier: taskToCommit.betMultiplier,
                };
            }

            try {
                const savedRecurring = await api.recurringTasks.create(newRecurringTask);
                createdTask = savedRecurring;
                setRecurringTasks(prev => [...prev, savedRecurring]);
            } catch (error) {
                console.error("Failed to create recurring task", error);
                return;
            }
        }

        if (!userCategories.find(c => c.toLowerCase() === taskToCommit.category.toLowerCase())) {
            setUserCategories(prev => [...prev, taskToCommit.category]);
        }

        const newTaskId = createdTask.id;
        setSelectedTaskId(newTaskId);
        setIsLoadingStory(true);
        setMotivationalStory('');

        try {
            const story = await generateGogginsStory({
                description: createdTask.description,
                difficulty: createdTask.difficulty as TaskDifficulty,
                category: createdTask.category,
                estimatedTime: createdTask.estimatedTime
            }, goals, taskToCommit.justification);

            if ('recurrenceRule' in createdTask) {
                const updated = { ...createdTask, story };
                await api.recurringTasks.update(updated as RecurringTask);
                setRecurringTasks(prev => prev.map(rt => rt.id === updated.id ? updated : rt));
            } else {
                const updated = { ...createdTask, story };
                await api.tasks.update(updated as Task);
                setTasks(prev => {
                    const newTasks = { ...prev };
                    const taskDate = (updated as Task).date;
                    if (newTasks[taskDate]) {
                        newTasks[taskDate] = newTasks[taskDate].map(t => t.id === updated.id ? updated : t);
                    }
                    return newTasks;
                });
            }

            setMotivationalStory(story);
        } catch (e) {
            console.error("Failed to generate story or update task", e);
            setMotivationalStory("Stay hard. (System Error)");
        } finally {
            setIsLoadingStory(false);
        }
    };

    const addTask = async (taskData: { description: string, difficulty: TaskDifficulty, date: string, category: string, recurrenceRule: 'None' | RecurrenceRule, estimatedTime: number, time?: string, justification?: string }) => {
        const bettingContext = {
            goals: goals.filter(g => !g.completed),
            tasks,
            recurringTasks
        } as any;

        const { multiplier, rationale } = await generateBettingOdds({
            description: taskData.description,
            difficulty: taskData.difficulty,
            category: taskData.category,
            estimatedTime: taskData.estimatedTime,
        }, bettingContext);

        const tempTask = {
            id: `temp_${generateId()}`,
            ...taskData,
            completed: false,
            actualTime: null,
            betMultiplier: multiplier,
            betRationale: rationale,
        };

        setTaskToBetOn(tempTask);
    };

    const handleConfirmBet = (task: Task, betAmount: number) => {
        const finalTask = {
            ...task,
            betPlaced: true,
            betAmount,
            betMultiplier: (task as any).betMultiplier,
            recurrenceRule: (task as any).recurrenceRule || 'None'
        };
        _commitTask(finalTask as any);
        setTaskToBetOn(null);
    };

    const handleNoBet = (taskToBetOn: any) => {
        if (taskToBetOn) {
            const finalTask = {
                ...taskToBetOn,
                betPlaced: false,
                recurrenceRule: taskToBetOn.recurrenceRule || 'None'
            };
            _commitTask(finalTask as any);
        }
        setTaskToBetOn(null);
    };

    const deleteTask = async (date: string, taskToDelete: Task) => {
        if (taskToDelete.recurringMasterId) {
            if (window.confirm("This is a recurring mission. Deleting it will remove all future occurrences. Are you sure?")) {
                try {
                    await api.recurringTasks.delete(taskToDelete.recurringMasterId);
                    setRecurringTasks(recurringTasks.filter(rt => rt.id !== taskToDelete.recurringMasterId));
                } catch (e) { console.error(e); }
            }
        } else {
            try {
                await api.tasks.delete(taskToDelete.id);
                setTasks(prevTasks => {
                    const newTasks = { ...prevTasks };
                    if (newTasks[date]) {
                        newTasks[date] = newTasks[date].filter(t => t.id !== taskToDelete.id);
                        if (newTasks[date].length === 0) delete newTasks[date];
                    }
                    return newTasks;
                });
            } catch (e) { console.error(e); }
        }
    };

    const updateTask = async (updatedItem: Task | RecurringTask, originalItem: Task | RecurringTask) => {
        if ('recurrenceRule' in updatedItem && 'recurrenceRule' in originalItem) {
            try {
                const updated = await api.recurringTasks.update(updatedItem as RecurringTask);
                setRecurringTasks(prev => prev.map(rt => rt.id === originalItem.id ? updated : rt));
            } catch (e) { console.error(e); }
        } else if (!('recurrenceRule' in updatedItem) && !('recurrenceRule' in originalItem)) {
            const updatedTask = updatedItem as Task;
            const originalTask = originalItem as Task;
            try {
                const saved = await api.tasks.update(updatedTask);
                setTasks(prev => {
                    const newTasks = { ...prev };
                    if (newTasks[originalTask.date]) {
                        if (originalTask.date !== saved.date) {
                            newTasks[originalTask.date] = newTasks[originalTask.date].filter(t => t.id !== originalTask.id);
                            if (newTasks[originalTask.date].length === 0) delete newTasks[originalTask.date];
                        }
                    }
                    if (!newTasks[saved.date]) newTasks[saved.date] = [];
                    if (originalTask.date === saved.date) {
                        newTasks[saved.date] = newTasks[saved.date].map(t => t.id === saved.id ? saved : t);
                    } else {
                        newTasks[saved.date].push(saved);
                    }
                    return newTasks;
                });
            } catch (e) { console.error(e); }
        }
    };

    const updateTaskTime = async (date: string, taskToUpdate: Task, time: string | null) => {
        try {
            if (taskToUpdate.recurringMasterId) {
                const masterTask = recurringTasks.find(rt => rt.id === taskToUpdate.recurringMasterId);
                if (masterTask) {
                    const newCompletions = { ...masterTask.completions };
                    const completionData = newCompletions[date] || { completed: false, actualTime: null };
                    newCompletions[date] = { ...completionData, time: time ?? undefined };
                    const updated = { ...masterTask, completions: newCompletions };
                    await api.recurringTasks.update(updated);
                    setRecurringTasks(prev => prev.map(rt => rt.id === updated.id ? updated : rt));
                }
            } else {
                const updatedTask = { ...taskToUpdate, time: time ?? undefined };
                await api.tasks.update(updatedTask as Task);
                setTasks(prev => {
                    const newTasks = { ...prev };
                    if (newTasks[date]) {
                        newTasks[date] = newTasks[date].map(t => t.id === taskToUpdate.id ? updatedTask as Task : t);
                    }
                    return newTasks;
                });
            }
        } catch (e) { console.error(e); }
    };

    const handleConfirmCompletion = async (date: string, task: Task, actualTime: number) => {
        let betWinnings = 0;
        let charUpdates = { ...character };

        if (task.betPlaced && !task.completed) {
            const winnings = (task.betAmount || 0) * (task.betMultiplier || 1);
            betWinnings = (task.betAmount || 0) + winnings;
            charUpdates = { ...charUpdates, bonuses: (charUpdates.bonuses || 0) + betWinnings };
            if (betWinnings > 0) {
                setShowCompletionBonus({ title: "Bet Won!", earnings: winnings, xp: 0 });
                setTimeout(() => setShowCompletionBonus(null), 5000);
            }
        }

        if (betWinnings > 0) {
            try {
                await api.character.update(charUpdates);
                setCharacter(charUpdates);
            } catch (e) { console.error(e); }
        }

        try {
            if (task.recurringMasterId) {
                const rtIndex = recurringTasks.findIndex(rt => rt.id === task.recurringMasterId);
                if (rtIndex >= 0) {
                    const rt = recurringTasks[rtIndex];
                    const completionData: any = { completed: true, actualTime, time: task.time };
                    if (task.betPlaced) {
                        Object.assign(completionData, { betPlaced: true, betWon: true, betAmount: task.betAmount, betMultiplier: task.betMultiplier });
                    }
                    const newCompletions = { ...rt.completions, [date]: completionData };
                    const updatedRT = { ...rt, completions: newCompletions };
                    await api.recurringTasks.update(updatedRT);
                    setRecurringTasks(prev => {
                        const copy = [...prev];
                        copy[rtIndex] = updatedRT;
                        return copy;
                    });
                }
            } else {
                const updatedTask = { ...task, completed: true, actualTime };
                if (task.betPlaced) (updatedTask as any).betWon = true;
                await api.tasks.update(updatedTask as Task);
                setTasks(prevTasks => {
                    const newTasks = { ...prevTasks };
                    newTasks[date] = newTasks[date].map(t => t.id === task.id ? updatedTask as Task : t);
                    return newTasks;
                });
            }
        } catch (e) { console.error(e); }

        setLastUpdatedDate(date);
    };

    const generateStoryForTask = async (date: string, task: Task) => {
        setSelectedTaskId(task.id);
        setIsLoadingStory(true);
        setMotivationalStory('');
        try {
            const story = await generateGogginsStory(task, goals.filter(g => !g.completed), task.justification);
            if (task.recurringMasterId) {
                const masterTask = recurringTasks.find(rt => rt.id === task.recurringMasterId);
                if (masterTask) {
                    const updated = { ...masterTask, story };
                    await api.recurringTasks.update(updated);
                    setRecurringTasks(prev => prev.map(rt => rt.id === updated.id ? updated : rt));
                }
            } else {
                const updated = { ...task, story };
                await api.tasks.update(updated as Task);
                setTasks(prev => {
                    const newTasks = { ...prev };
                    if (newTasks[date]) {
                        newTasks[date] = newTasks[date].map(t => t.id === task.id ? updated as Task : t);
                    }
                    return newTasks;
                });
            }
            setMotivationalStory(story);
        } catch (e) { console.error(e); }
        setIsLoadingStory(false);
    };

    const processEndOfDayBets = async (today: string) => {
        let lostAmount = 0;
        const updatedTasks = { ...tasks };
        const updatedRecurringTasks = [...recurringTasks];
        let tasksChanged = false;
        let recurringChanged = false;

        for (const date of Object.keys(updatedTasks)) {
            if (date < today) {
                for (let i = 0; i < updatedTasks[date].length; i++) {
                    const task = updatedTasks[date][i];
                    if (task.betPlaced && !task.completed && typeof task.betWon === 'undefined') {
                        lostAmount += task.betAmount || 0;
                        tasksChanged = true;
                        updatedTasks[date][i] = { ...task, betWon: false };
                        await api.tasks.update(updatedTasks[date][i]);
                    }
                }
            }
        }

        for (let i = 0; i < updatedRecurringTasks.length; i++) {
            const rt = updatedRecurringTasks[i];
            const updatedCompletions = { ...rt.completions };
            let completionsChanged = false;
            for (const date of Object.keys(updatedCompletions)) {
                if (date < today) {
                    const completion = updatedCompletions[date];
                    if (completion.betPlaced && !completion.completed && typeof completion.betWon === 'undefined') {
                        lostAmount += completion.betAmount || 0;
                        updatedCompletions[date] = { ...completion, betWon: false };
                        completionsChanged = true;
                    }
                }
            }
            if (completionsChanged) {
                recurringChanged = true;
                updatedRecurringTasks[i] = { ...rt, completions: updatedCompletions };
                await api.recurringTasks.update(updatedRecurringTasks[i]);
            }
        }

        if (lostAmount > 0) {
            if (tasksChanged) setTasks(updatedTasks);
            if (recurringChanged) setRecurringTasks(updatedRecurringTasks);
            const newSpent = (character.spent || 0) + lostAmount;
            await api.character.update({ ...character, spent: newSpent });
            setCharacter(c => ({ ...c, spent: newSpent }));
        }
    };

    return {
        getTasksForDate,
        addTask,
        deleteTask,
        updateTask,
        updateTaskTime,
        handleConfirmBet,
        handleNoBet,
        handleConfirmCompletion,
        generateStoryForTask,
        processEndOfDayBets
    };
};
