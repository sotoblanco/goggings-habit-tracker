import React, { useState, Dispatch, SetStateAction } from 'react';
import { DiaryEntry, Goal, Task, DailyScore } from '../types';
import { api } from '../services/api';
import { generateGogginsReflectionFeedback, generateGogginsDiaryFeedback } from '../services/geminiService';

export const useDiaryActions = (
    diaryEntries: { [key: string]: DiaryEntry },
    setDiaryEntries: Dispatch<SetStateAction<{ [key: string]: DiaryEntry }>>,
    goals: Goal[],
    getTasksForDate: (date: string) => Task[],
    dailyScores: DailyScore[]
) => {
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

    const saveInitialReflection = async (date: string, reflection: string) => {
        setIsGeneratingFeedback(true);
        try {
            const feedback = await generateGogginsReflectionFeedback(reflection, goals.filter(g => !g.completed));
            const existing = diaryEntries[date] || { date };
            const updatedEntry = { ...existing, initialReflection: reflection, initialFeedback: feedback };
            await api.diaryEntries.update(date, updatedEntry);
            setDiaryEntries(prev => ({ ...prev, [date]: updatedEntry }));
        } catch (e) {
            console.error("Failed to save diary entry", e);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    const saveDebrief = async (date: string, debrief: string) => {
        setIsGeneratingFeedback(true);
        try {
            const tasksForDay = getTasksForDate(date).filter(t => t.completed);
            const scoreForDay = dailyScores.find(s => s.date === date)?.earnings || 0;
            const debriefData = { debriefEntry: debrief, initialReflection: diaryEntries[date]?.initialReflection, tasks: tasksForDay, earnings: scoreForDay };

            const { feedback, grade } = await generateGogginsDiaryFeedback(debriefData, goals.filter(g => !g.completed));

            const existing = diaryEntries[date] || { date };
            const updatedEntry = { ...existing, debrief, finalFeedback: feedback, grade };
            await api.diaryEntries.update(date, updatedEntry);
            setDiaryEntries(prev => ({ ...prev, [date]: updatedEntry }));
        } catch (e) {
            console.error("Failed to save debrief", e);
        } finally {
            setIsGeneratingFeedback(false);
        }
    };

    return {
        isGeneratingFeedback,
        saveInitialReflection,
        saveDebrief
    };
};
