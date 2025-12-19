import { useState, useEffect } from 'react';
import { Task, RecurringTask, SideQuest, DiaryEntry, Goal, WeeklyGoal, Reward, PurchasedReward, Wish, CoreTask, Character, TaskDifficulty } from '../types';
import { api } from '../services/api';
import { getWeekKey, getLocalDateString } from '../utils/dateUtils';

const initialSideQuests: SideQuest[] = [
    { id: 'sq1', description: '10 Push-ups', difficulty: TaskDifficulty.EASY, dailyGoal: 1, completions: {} },
    { id: 'sq2', description: 'Cold Shower (30s)', difficulty: TaskDifficulty.MEDIUM, dailyGoal: 1, completions: {} },
    { id: 'sq3', description: 'Read 10 pages', difficulty: TaskDifficulty.EASY, dailyGoal: 1, completions: {} },
    { id: 'sq4', description: 'Meditate for 5 mins', difficulty: TaskDifficulty.MEDIUM, dailyGoal: 1, completions: {} },
    { id: 'sq5', description: 'Plan your next day', difficulty: TaskDifficulty.MEDIUM, dailyGoal: 1, completions: {} },
    { id: 'sq6', description: 'Stretch for 10 mins', difficulty: TaskDifficulty.EASY, dailyGoal: 1, completions: {} },
    { id: 'sq7', description: 'No phone for 1 hour', difficulty: TaskDifficulty.HARD, dailyGoal: 1, completions: {} },
];

export const useAppData = () => {
    const [tasks, setTasks] = useState<{ [key: string]: Task[] }>({});
    const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
    const [sideQuests, setSideQuests] = useState<SideQuest[]>(initialSideQuests);
    const [diaryEntries, setDiaryEntries] = useState<{ [key: string]: DiaryEntry }>({});
    const [goals, setGoals] = useState<Goal[]>([]);
    const [weeklyGoals, setWeeklyGoals] = useState<{ [key: string]: WeeklyGoal[] }>({});
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [purchasedRewards, setPurchasedRewards] = useState<PurchasedReward[]>([]);
    const [wishList, setWishList] = useState<Wish[]>([]);
    const [coreList, setCoreList] = useState<CoreTask[]>([]);
    const [character, setCharacter] = useState<Character>({ spent: 0, bonuses: 0 });
    const [userCategories, setUserCategories] = useState<string[]>(['Physical Training', 'Mental Fortitude', 'Discipline', 'Uncomfortable Zone', 'Side Quest']);
    const [dailyGoal, setDailyGoal] = useState<number>(1);
    const [awardedDailyGrindBonus, setAwardedDailyGrindBonus] = useState<{ [date: string]: boolean }>({});
    const [weeklyBriefings, setWeeklyBriefings] = useState<{ [key: string]: string }>({});
    const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; content: string }[]>([{ sender: 'ai', content: "This is the command center. Report in. What do you need? Don't waste my time." }]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [
                    fetchedTasks, fetchedRecurring, fetchedGoals,
                    fetchedSideQuests, fetchedRewards, fetchedPurchased,
                    fetchedWishes, fetchedCore, fetchedEntries, fetchedWeeklyGoals, fetchedCharacter
                ] = await Promise.all([
                    api.tasks.list(),
                    api.recurringTasks.list(),
                    api.goals.list(),
                    api.sideQuests.list(),
                    api.rewards.list(),
                    api.purchasedRewards.list(),
                    api.wishList.list(),
                    api.coreList.list(),
                    api.diaryEntries.list(),
                    api.weeklyGoals.list(),
                    api.character.get()
                ]);

                const taskMap: { [key: string]: Task[] } = {};
                fetchedTasks.forEach(t => {
                    if (!taskMap[t.date]) taskMap[t.date] = [];
                    taskMap[t.date].push(t);
                });
                setTasks(taskMap);
                setRecurringTasks(fetchedRecurring);
                setGoals(fetchedGoals);

                if (fetchedSideQuests.length > 0) {
                    setSideQuests(fetchedSideQuests);
                } else {
                    console.log("Seeding initial side quests...");
                    try {
                        const savedQuests = await Promise.all(initialSideQuests.map(q => api.sideQuests.create(q)));
                        setSideQuests(savedQuests);
                    } catch (e) {
                        console.error("Failed to seed side quests", e);
                        setSideQuests(initialSideQuests);
                    }
                }

                setRewards(fetchedRewards);
                setPurchasedRewards(fetchedPurchased);
                setWishList(fetchedWishes);
                setCoreList(fetchedCore);

                const diaryMap: { [key: string]: DiaryEntry } = {};
                fetchedEntries.forEach(e => diaryMap[e.date] = e);
                setDiaryEntries(diaryMap);

                const wgMap: { [key: string]: WeeklyGoal[] } = {};
                fetchedWeeklyGoals.forEach(g => {
                    const d = new Date(g.targetDate.replace(/-/g, '/'));
                    const key = getWeekKey(d);
                    if (!wgMap[key]) wgMap[key] = [];
                    wgMap[key].push(g);
                });
                setWeeklyGoals(wgMap);

                if (fetchedCharacter) setCharacter(fetchedCharacter);

            } catch (e) {
                console.error("Failed to load initial data", e);
            }
        };
        loadData();
    }, []);

    return {
        tasks, setTasks,
        recurringTasks, setRecurringTasks,
        sideQuests, setSideQuests,
        diaryEntries, setDiaryEntries,
        goals, setGoals,
        weeklyGoals, setWeeklyGoals,
        rewards, setRewards,
        purchasedRewards, setPurchasedRewards,
        wishList, setWishList,
        coreList, setCoreList,
        character, setCharacter,
        userCategories, setUserCategories,
        dailyGoal, setDailyGoal,
        awardedDailyGrindBonus, setAwardedDailyGrindBonus,
        weeklyBriefings, setWeeklyBriefings,
        chatMessages, setChatMessages
    };
};
