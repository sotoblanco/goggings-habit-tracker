import React, { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { WeeklyGoal, Goal } from '../types';
import { generateGogginsWeeklyBriefing } from '../services/geminiService';
import { getWeekKey } from '../utils/dateUtils';

export const useBriefing = (
    weeklyGoals: { [key: string]: WeeklyGoal[] },
    goals: Goal[],
    weeklyBriefings: { [key: string]: string },
    setWeeklyBriefings: Dispatch<SetStateAction<{ [key: string]: string }>>
) => {
    const [briefingToShow, setBriefingToShow] = useState<string | null>(null);
    const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

    useEffect(() => {
        const today = new Date();
        if (today.getDay() === 0) { // Sunday
            const weekKey = getWeekKey(today);
            if (!weeklyBriefings[weekKey] && !isGeneratingBriefing) {
                const generateBriefing = async () => {
                    setIsGeneratingBriefing(true);
                    try {
                        const lastWeekDate = new Date();
                        lastWeekDate.setDate(today.getDate() - 7);
                        const lastWeekKey = getWeekKey(lastWeekDate);

                        const previousWeekEvaluations = (weeklyGoals[lastWeekKey] || [])
                            .map(g => g.evaluation)
                            .filter(e => e !== undefined);

                        const nextWeekGoals = weeklyGoals[weekKey] || [];
                        const briefing = await generateGogginsWeeklyBriefing(previousWeekEvaluations as any, nextWeekGoals, goals.filter(g => !g.completed));

                        setWeeklyBriefings(prev => ({ ...prev, [weekKey]: briefing }));
                        setBriefingToShow(briefing);
                    } catch (e) { console.error(e); }
                    setIsGeneratingBriefing(false);
                };
                generateBriefing();
            }
        }
    }, [weeklyGoals, goals, weeklyBriefings, isGeneratingBriefing, setWeeklyBriefings]);

    return {
        briefingToShow,
        setBriefingToShow,
        isGeneratingBriefing
    };
};
