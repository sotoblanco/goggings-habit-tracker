import { useState } from 'react';
import { ReviewResult, Goal, SideQuest, DailyScore, CategoryScore, Task } from '../types';
import { generateGogginsReview } from '../services/geminiService';
import { getDatesInRange, getLocalDateString } from '../utils/dateUtils';

export const useReviewActions = (
    goals: Goal[],
    sideQuests: SideQuest[],
    dailyScores: DailyScore[],
    categoryScores: CategoryScore[],
    diaryEntries: { [key: string]: any },
    getTasksForDate: (date: string) => Task[]
) => {
    const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);

    const handleGenerateReview = async (days: number) => {
        setIsGeneratingReview(true);
        setReviewResult(null);

        try {
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - days);

            const dateRange = getDatesInRange(startDate, endDate).map(getLocalDateString);

            const dailyBreakdown = dateRange.map(date => {
                const tasksForDate = getTasksForDate(date);
                const score = dailyScores.find(s => s.date === date);
                return {
                    date,
                    completed: tasksForDate.filter(t => t.completed).length,
                    total: tasksForDate.length,
                    earnings: score?.earnings || 0
                };
            });

            const categoryBreakdown = categoryScores.map(cs => ({
                category: cs.category,
                completed: cs.tasksCompleted,
                earnings: cs.earnings
            }));

            const diaryEntriesForRange = dateRange
                .map(date => diaryEntries[date]?.debrief)
                .filter((entry): entry is string => !!entry);

            const completedTasksList = dateRange.flatMap(date =>
                getTasksForDate(date)
                    .filter(t => t.completed)
                    .map(t => ({ description: t.description, category: t.category, difficulty: t.difficulty }))
            );

            const reviewData = {
                days,
                totalTasks: dailyBreakdown.reduce((sum, d) => sum + d.total, 0),
                completedTasks: dailyBreakdown.reduce((sum, d) => sum + d.completed, 0),
                totalEarnings: dailyBreakdown.reduce((sum, d) => sum + d.earnings, 0),
                dailyBreakdown,
                categoryBreakdown,
                diaryEntries: diaryEntriesForRange,
                completedTasksList,
            };

            const result = await generateGogginsReview(reviewData, goals.filter(g => !g.completed), sideQuests);
            setReviewResult(result);
        } catch (e) {
            console.error("Failed to generate review", e);
        } finally {
            setIsGeneratingReview(false);
        }
    };

    return {
        reviewResult,
        setReviewResult,
        isGeneratingReview,
        handleGenerateReview
    };
};
