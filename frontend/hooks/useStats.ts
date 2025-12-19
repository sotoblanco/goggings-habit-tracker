import { useMemo } from 'react';
import { Task, RecurringTask, DiaryEntry, DailyScore, CategoryScore, ObjectiveScore, Goal } from '../types';
import { DIFFICULTY_REWARDS, STREAK_MULTIPLIER_BASE, TIME_REWARD_PER_MINUTE } from '../constants';
import { getLocalDateString } from '../utils/dateUtils';

export const useStats = (
    tasks: { [key: string]: Task[] },
    recurringTasks: RecurringTask[],
    diaryEntries: { [key: string]: DiaryEntry },
    dailyGoal: number,
    bonuses: number,
    spent: number,
    goals: Goal[]
) => {
    const streak = useMemo(() => {
        const scoresMap = new Map<string, number>();
        const allCompletedTasks: (Task & { date: string })[] = [];
        Object.entries(tasks).forEach(([date, dayTasks]) => {
            allCompletedTasks.push(...dayTasks.filter(t => t.completed).map(t => ({ ...t, date })));
        });
        recurringTasks.forEach(rt => {
            Object.entries(rt.completions).forEach(([date, completion]) => {
                if (completion.completed) {
                    allCompletedTasks.push({ ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime } as any);
                }
            });
        });
        allCompletedTasks.forEach(task => {
            const baseReward = DIFFICULTY_REWARDS[task.difficulty] || 0;
            const timeReward = (task.actualTime || 0) * TIME_REWARD_PER_MINUTE;
            const goalAlignmentMultiplier = (task.goalAlignment || 3) / 5;
            const finalReward = (baseReward + timeReward) * goalAlignmentMultiplier;
            scoresMap.set(task.date, (scoresMap.get(task.date) || 0) + finalReward);
        });
        const scoresMeetingGoal = new Set<string>();
        for (const [date, earnings] of scoresMap.entries()) {
            if (earnings >= dailyGoal) scoresMeetingGoal.add(date);
        }
        if (scoresMeetingGoal.size === 0 || dailyGoal <= 0) return 0;
        let currentStreak = 0;
        const dateIterator = new Date();
        if (!scoresMeetingGoal.has(getLocalDateString(dateIterator))) {
            dateIterator.setDate(dateIterator.getDate() - 1);
        }
        for (let i = 0; i < 3650; i++) {
            const dateStr = getLocalDateString(dateIterator);
            if (scoresMeetingGoal.has(dateStr)) {
                currentStreak++;
                dateIterator.setDate(dateIterator.getDate() - 1);
            } else {
                break;
            }
        }
        return currentStreak;
    }, [tasks, recurringTasks, dailyGoal]);

    const streakMultiplier = useMemo(() => 1 + streak * STREAK_MULTIPLIER_BASE, [streak]);

    const dailyScores = useMemo<DailyScore[]>(() => {
        const earningsByDate: { [date: string]: { earnings: number, tasksCompleted: number } } = {};
        const applyReward = (task: Task, date: string) => {
            const baseReward = DIFFICULTY_REWARDS[task.difficulty] || 0;
            const timeReward = (task.actualTime || 0) * TIME_REWARD_PER_MINUTE;
            const goalAlignmentMultiplier = (task.goalAlignment || 3) / 5;
            const finalReward = (baseReward + timeReward) * streakMultiplier * goalAlignmentMultiplier;
            if (!earningsByDate[date]) {
                earningsByDate[date] = { earnings: 0, tasksCompleted: 0 };
            }
            earningsByDate[date].earnings += finalReward;
            earningsByDate[date].tasksCompleted += 1;
        };
        Object.entries(tasks).forEach(([date, dayTasks]) => {
            dayTasks.filter(t => t.completed).forEach(t => applyReward(t, date));
        });
        recurringTasks.forEach(rt => {
            Object.entries(rt.completions).forEach(([date, completion]) => {
                if (completion.completed) {
                    const taskInstance: Task = { ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime } as any;
                    applyReward(taskInstance, date);
                }
            });
        });
        return Object.entries(earningsByDate).map(([date, data]) => ({ date, ...data, grade: diaryEntries[date]?.grade }));
    }, [tasks, recurringTasks, streakMultiplier, diaryEntries]);

    const totalTaskEarnings = useMemo(() => dailyScores.reduce((sum, score) => sum + score.earnings, 0), [dailyScores]);
    const totalEarnings = useMemo(() => totalTaskEarnings + (bonuses || 0), [totalTaskEarnings, bonuses]);
    const currentBalance = useMemo(() => totalEarnings - (spent || 0), [totalEarnings, spent]);
    const totalGP = useMemo(() => totalEarnings * 100, [totalEarnings]);

    const categoryScores = useMemo<CategoryScore[]>(() => {
        const stats: { [key: string]: { earnings: number; tasksCompleted: number } } = {};
        const processTask = (task: Task & { date: string }) => {
            if (!task.completed) return;
            const baseReward = DIFFICULTY_REWARDS[task.difficulty] || 0;
            const timeReward = (task.actualTime || 0) * TIME_REWARD_PER_MINUTE;
            const goalAlignmentMultiplier = (task.goalAlignment || 3) / 5;
            const finalReward = (baseReward + timeReward) * streakMultiplier * goalAlignmentMultiplier;
            if (!stats[task.category]) stats[task.category] = { earnings: 0, tasksCompleted: 0 };
            stats[task.category].earnings += finalReward;
            stats[task.category].tasksCompleted += 1;
        };
        Object.values(tasks).flat().forEach(t => {
            const date = Object.keys(tasks).find(d => tasks[d].some(item => item.id === t.id));
            if (date) processTask({ ...t, date });
        });
        recurringTasks.forEach(rt => {
            Object.entries(rt.completions).forEach(([date, completion]) => {
                if (completion.completed) processTask({ ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime } as any);
            });
        });
        return Object.entries(stats).map(([category, data]) => ({ category, ...data }));
    }, [tasks, recurringTasks, streakMultiplier]);

    const objectiveScores = useMemo<ObjectiveScore[]>(() => {
        const stats: { [goalId: string]: { earnings: number; tasksCompleted: number } } = {};
        const activeGoalIds = new Set(goals.filter(g => !g.completed).map(g => g.id));
        const processTask = (task: Task & { date: string }) => {
            if (!task.completed || !task.alignedGoalId || !activeGoalIds.has(task.alignedGoalId)) return;
            const baseReward = DIFFICULTY_REWARDS[task.difficulty] || 0;
            const timeReward = (task.actualTime || 0) * TIME_REWARD_PER_MINUTE;
            const goalAlignmentMultiplier = (task.goalAlignment || 3) / 5;
            const finalReward = (baseReward + timeReward) * streakMultiplier * goalAlignmentMultiplier;
            if (!stats[task.alignedGoalId]) stats[task.alignedGoalId] = { earnings: 0, tasksCompleted: 0 };
            stats[task.alignedGoalId].earnings += finalReward;
            stats[task.alignedGoalId].tasksCompleted += 1;
        };
        Object.values(tasks).flat().forEach(t => {
            const date = Object.keys(tasks).find(d => tasks[d].some(item => item.id === t.id));
            if (date) processTask({ ...t, date });
        });
        recurringTasks.forEach(rt => {
            Object.entries(rt.completions).forEach(([date, completion]) => {
                if (completion.completed) processTask({ ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime, alignedGoalId: rt.alignedGoalId } as any);
            });
        });
        return Object.entries(stats).map(([goalId, data]) => {
            const goal = goals.find(g => g.id === goalId);
            return { goalId, goalDescription: goal?.description || 'Unknown Goal', goalLabel: goal?.label, ...data };
        });
    }, [tasks, recurringTasks, goals, streakMultiplier]);

    return {
        streak,
        streakMultiplier,
        dailyScores,
        totalEarnings,
        currentBalance,
        totalGP,
        categoryScores,
        objectiveScores
    };
};
