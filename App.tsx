
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CalendarContainer, CalendarViewType } from './components/CalendarView';
import { TaskInput } from './components/TaskModal';
import { Leaderboard, CategoryLeaderboard, ObjectiveLeaderboard } from './components/Leaderboard';
import { MotivationModal } from './components/MotivationModal';
import { SideQuests } from './components/SideQuests';
import { Header } from './components/Header';
import { CharacterStatus } from './components/CharacterStatus';
import { Rewards } from './components/Rewards';
import { StatusBar } from './components/StatusBar';
import { Reviewer } from './components/Reviewer';
import { Goals } from './components/Goals';
import { ActualTimeModal } from './components/ActualTimeModal';
import { EditTaskModal } from './components/EditTaskModal';
import { WeeklyGoalComponent } from './components/WeeklyGoal';
import { DailyCompletionBar } from './components/DailyCompletionBar';
import { CompletionBonusModal } from './components/CompletionBonusModal';
import { WeeklyBriefingModal } from './components/WeeklyBriefingModal';
import { Chatbot } from './components/Chatbot';
import { WishList } from './components/WishList';
import { CoreList } from './components/CoreList';
import { CollapsibleSection } from './components/CollapsibleSection';
import { ChatBubbleLeftRightIcon, PlusIcon, BoltIcon, FlagIcon, ChartBarSquareIcon, ListBulletIcon, CalendarDaysIcon, TrophyIcon, SparklesIcon } from './components/Icons';
import { Task, TaskDifficulty, DailyScore, CategoryScore, SideQuest, RecurringTask, RecurrenceRule, Character, DiaryEntry, ReviewResult, Goal, AtomicHabitsSuggestions, WeeklyGoal, ObjectiveScore, Reward, PurchasedReward, Wish, CoreTask, GoalContract } from './types';
import { generateGogginsStory, generateGogginsDiaryFeedback, generateGogginsReflectionFeedback, generateGogginsReview, generateGogginsGoalChangeVerdict, generateAtomicHabitsSystem, generateGogginsGoalCompletionVerdict, generateLabel, analyzeTaskGoalSimilarity, generateWeeklyGoalEvaluation, generateGogginsWeeklyBriefing, generateChatResponse, AppContext, generateAIAssignedTask, generateTaskFromWishList, generateTaskFromCoreList, generateBettingOdds } from './services/geminiService';
import { DIFFICULTY_REWARDS, STREAK_MULTIPLIER_BASE, GOAL_CHANGE_COST, TIME_REWARD_PER_MINUTE, GOAL_COMPLETION_REWARD, DAILY_GRIND_COMPLETION_BONUS_EARNINGS } from './constants';
import { isRecurringOnDate, getWeekKey, getStartOfWeek, getEndOfWeek, getDatesInRange, getLocalDateString } from './utils/dateUtils';
import useLocalStorage from './hooks/useLocalStorage';
import { BetModal } from './components/BetModal';

const generateId = () => Math.random().toString(36).substring(2, 15);

// FIX: Add formatCurrency helper function to resolve reference error.
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const initialSideQuests: SideQuest[] = [
  { id: generateId(), description: '10 Push-ups', difficulty: TaskDifficulty.EASY, dailyGoal: 1, completions: {} },
  { id: generateId(), description: 'Cold Shower (30s)', difficulty: TaskDifficulty.MEDIUM, dailyGoal: 1, completions: {} },
  { id: generateId(), description: 'Read 10 pages', difficulty: TaskDifficulty.EASY, dailyGoal: 1, completions: {} },
  { id: generateId(), description: 'Meditate for 5 mins', difficulty: TaskDifficulty.MEDIUM, dailyGoal: 1, completions: {} },
  { id: generateId(), description: 'Plan your next day', difficulty: TaskDifficulty.MEDIUM, dailyGoal: 1, completions: {} },
  { id: generateId(), description: 'Stretch for 10 mins', difficulty: TaskDifficulty.EASY, dailyGoal: 1, completions: {} },
  { id: generateId(), description: 'No phone for 1 hour', difficulty: TaskDifficulty.HARD, dailyGoal: 1, completions: {} },
];

interface AppData {
    tasks: { [key: string]: Task[] };
    recurringTasks: RecurringTask[];
    sideQuests: SideQuest[];
    diaryEntries: { [key: string]: DiaryEntry };
    character: Character;
    userCategories: string[];
    dailyGoal: number;
    goals: Goal[];
    weeklyGoals: { [key: string]: WeeklyGoal[] };
    rewards: Reward[];
    purchasedRewards: PurchasedReward[];
    wishList: Wish[];
    coreList: CoreTask[];
    awardedDailyGrindBonus: { [date: string]: boolean };
    weeklyBriefings: { [key: string]: string };
    chatMessages: { sender: 'user' | 'ai'; content: string }[];
}

const App: React.FC = () => {
    const [data, setData] = useLocalStorage<AppData>('goggins-grind-data', {
        tasks: {},
        recurringTasks: [],
        sideQuests: initialSideQuests,
        diaryEntries: {},
        goals: [],
        weeklyGoals: {},
        rewards: [],
        purchasedRewards: [],
        wishList: [],
        coreList: [],
        character: { spent: 0, bonuses: 0 },
        userCategories: ['Physical Training', 'Mental Fortitude', 'Discipline', 'Uncomfortable Zone', 'Side Quest'],
        dailyGoal: 1,
        awardedDailyGrindBonus: {},
        weeklyBriefings: {},
        chatMessages: [{ sender: 'ai', content: "This is the command center. Report in. What do you need? Don't waste my time." }],
    });

    const {
        tasks, recurringTasks, sideQuests, diaryEntries, goals, weeklyGoals,
        rewards, purchasedRewards, wishList, coreList, character, userCategories, dailyGoal,
        awardedDailyGrindBonus, weeklyBriefings, chatMessages
    } = data;

    // FIX: The setter functions for slices of state were defined to only accept a value, but were being called with a function.
    // They are updated to pass a function to the main `setData` setter, which now supports functional updates.
    const setTasks = (newTasks: React.SetStateAction<{ [key: string]: Task[] }>) => setData(prev => ({ ...prev, tasks: newTasks instanceof Function ? newTasks(prev.tasks) : newTasks }));
    const setRecurringTasks = (newRecurringTasks: React.SetStateAction<RecurringTask[]>) => setData(prev => ({ ...prev, recurringTasks: newRecurringTasks instanceof Function ? newRecurringTasks(prev.recurringTasks) : newRecurringTasks }));
    const setSideQuests = (newSideQuests: React.SetStateAction<SideQuest[]>) => setData(prev => ({ ...prev, sideQuests: newSideQuests instanceof Function ? newSideQuests(prev.sideQuests) : newSideQuests }));
    const setDiaryEntries = (newDiaryEntries: React.SetStateAction<{ [key: string]: DiaryEntry }>) => setData(prev => ({ ...prev, diaryEntries: newDiaryEntries instanceof Function ? newDiaryEntries(prev.diaryEntries) : newDiaryEntries }));
    const setGoals = (newGoals: React.SetStateAction<Goal[]>) => setData(prev => ({ ...prev, goals: newGoals instanceof Function ? newGoals(prev.goals) : newGoals }));
    const setWeeklyGoals = (newWeeklyGoals: React.SetStateAction<{ [key: string]: WeeklyGoal[] }>) => setData(prev => ({ ...prev, weeklyGoals: newWeeklyGoals instanceof Function ? newWeeklyGoals(prev.weeklyGoals) : newWeeklyGoals }));
    const setRewards = (newRewards: React.SetStateAction<Reward[]>) => setData(prev => ({ ...prev, rewards: newRewards instanceof Function ? newRewards(prev.rewards) : newRewards }));
    const setPurchasedRewards = (newPurchasedRewards: React.SetStateAction<PurchasedReward[]>) => setData(prev => ({ ...prev, purchasedRewards: newPurchasedRewards instanceof Function ? newPurchasedRewards(prev.purchasedRewards) : newPurchasedRewards }));
    const setWishList = (newWishList: React.SetStateAction<Wish[]>) => setData(prev => ({ ...prev, wishList: newWishList instanceof Function ? newWishList(prev.wishList) : newWishList }));
    const setCoreList = (newCoreList: React.SetStateAction<CoreTask[]>) => setData(prev => ({ ...prev, coreList: newCoreList instanceof Function ? newCoreList(prev.coreList) : newCoreList }));
    const setCharacter = (newCharacter: React.SetStateAction<Character>) => setData(prev => ({ ...prev, character: newCharacter instanceof Function ? newCharacter(prev.character) : newCharacter }));
    const setUserCategories = (newUserCategories: React.SetStateAction<string[]>) => setData(prev => ({ ...prev, userCategories: newUserCategories instanceof Function ? newUserCategories(prev.userCategories) : newUserCategories }));
    const setDailyGoal = (newDailyGoal: React.SetStateAction<number>) => setData(prev => ({ ...prev, dailyGoal: newDailyGoal instanceof Function ? newDailyGoal(prev.dailyGoal) : newDailyGoal }));
    const setAwardedDailyGrindBonus = (newAwarded: React.SetStateAction<{ [date: string]: boolean }>) => setData(prev => ({ ...prev, awardedDailyGrindBonus: newAwarded instanceof Function ? newAwarded(prev.awardedDailyGrindBonus) : newAwarded }));
    const setWeeklyBriefings = (newBriefings: React.SetStateAction<{ [key: string]: string }>) => setData(prev => ({ ...prev, weeklyBriefings: newBriefings instanceof Function ? newBriefings(prev.weeklyBriefings) : newBriefings }));
    const setChatMessages = (newMessages: React.SetStateAction<{ sender: 'user' | 'ai'; content: string }[]>) => setData(prev => ({ ...prev, chatMessages: newMessages instanceof Function ? newMessages(prev.chatMessages) : newMessages }));

    // Local UI state
    const [motivationalStory, setMotivationalStory] = useState('');
    const [isLoadingStory, setIsLoadingStory] = useState(false);
    const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
    const [calendarView, setCalendarView] = useState<CalendarViewType>('month');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
    const [isGeneratingReview, setIsGeneratingReview] = useState(false);
    const [atomicHabitsSuggestions, setAtomicHabitsSuggestions] = useState<AtomicHabitsSuggestions | null>(null);
    const [taskToComplete, setTaskToComplete] = useState<{ task: Task, date: string } | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Task | RecurringTask | null>(null);
    const [lastUpdatedDate, setLastUpdatedDate] = useState<string | null>(null);
    const [showCompletionBonus, setShowCompletionBonus] = useState<{ title: string; xp: number; earnings: number } | null>(null);
    const [briefingToShow, setBriefingToShow] = useState<string | null>(null);
    const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isAssigningTask, setIsAssigningTask] = useState(false);
    const [isSelectingWish, setIsSelectingWish] = useState(false);
    const [isForgingCoreMission, setIsForgingCoreMission] = useState(false);
    const [taskToBetOn, setTaskToBetOn] = useState<(Task & { betMultiplier: number; betRationale: string; recurrenceRule: 'None' | RecurrenceRule; }) | null>(null);

    const effectiveUserCategories = useMemo(() => {
        const goalLabels = goals
            .filter(g => !g.completed && g.label)
            .map(g => g.label!);
        // FIX: The `combined` variable was not defined. It should be a combination of userCategories and goalLabels.
        const combined = [...userCategories, ...goalLabels];
        return [...new Set(combined)];
    }, [userCategories, goals]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setCalendarView('day');
  };

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
      }));

      return [...dayTasks, ...recurringInstances];
  }, [tasks, recurringTasks]);

  // Daily Grind Bonus Check
  useEffect(() => {
    if (!lastUpdatedDate || awardedDailyGrindBonus[lastUpdatedDate]) {
      return;
    }

    const checkCompletion = async () => {
      const missionsForDate = getTasksForDate(lastUpdatedDate).filter(t => t.category !== 'Side Quest');
      const allMissionsComplete = missionsForDate.length > 0 && missionsForDate.every(t => t.completed);
      const allSideQuestsComplete = sideQuests.length > 0 && sideQuests.every(q => (q.completions[lastUpdatedDate] || 0) > 0);
      
      if (allMissionsComplete && allSideQuestsComplete) {
        const earningsBonus = DAILY_GRIND_COMPLETION_BONUS_EARNINGS;
        const newBonuses = (character.bonuses || 0) + earningsBonus;
        const newAwarded = { ...awardedDailyGrindBonus, [lastUpdatedDate]: true };

        setCharacter({ ...character, bonuses: newBonuses });
        setAwardedDailyGrindBonus(newAwarded);

        setShowCompletionBonus({ title: "Daily Grind Conquered!", xp: 0, earnings: earningsBonus });
        setTimeout(() => setShowCompletionBonus(null), 5000);
      }
    };
    checkCompletion();
    
  }, [lastUpdatedDate, awardedDailyGrindBonus, character, getTasksForDate, setAwardedDailyGrindBonus, setCharacter, sideQuests]);
  
  const allTasks = useMemo(() => Object.values(tasks).flat(), [tasks]);
  
  const streak = useMemo(() => {
    const scoresMap = new Map<string, number>();
    const allCompletedTasks: (Task & { date: string })[] = [];
    Object.entries(tasks).forEach(([date, dayTasks]) => {
        allCompletedTasks.push(...dayTasks.filter(t => t.completed).map(t => ({ ...t, date })));
    });
    recurringTasks.forEach(rt => {
        Object.entries(rt.completions).forEach(([date, completion]) => {
            if (completion.completed) {
                allCompletedTasks.push({ ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime });
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
                const taskInstance: Task = { ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime };
                applyReward(taskInstance, date);
            }
        });
    });
    return Object.entries(earningsByDate).map(([date, data]) => ({ date, ...data, grade: diaryEntries[date]?.grade }));
  }, [tasks, recurringTasks, streakMultiplier, diaryEntries]);

  const totalTaskEarnings = useMemo(() => dailyScores.reduce((sum, score) => sum + score.earnings, 0), [dailyScores]);
  const totalEarnings = useMemo(() => totalTaskEarnings + (character.bonuses || 0), [totalTaskEarnings, character.bonuses]);
  const currentBalance = useMemo(() => totalEarnings - (character.spent || 0), [totalEarnings, character.spent]);
  const totalGP = useMemo(() => totalEarnings * 100, [totalEarnings]);

    // Effect for initial balance and daily bet processing
    useEffect(() => {
        const todayStr = getLocalDateString();
        const lastCheck = localStorage.getItem('gogginsLastBetCheck');

        if (lastCheck !== todayStr) {
            console.log('Running end-of-day bet processing...');
            processEndOfDayBets(todayStr);
            localStorage.setItem('gogginsLastBetCheck', todayStr);
        }
    }, []); // Run once on app load

    useEffect(() => {
        const isNewUser = Object.keys(tasks).length === 0 && recurringTasks.length === 0 && (character.spent || 0) === 0 && (character.bonuses || 0) === 0;
        if (isNewUser) {
            setCharacter(c => ({ ...c, bonuses: 5 }));
            setShowCompletionBonus({ title: "Account Funded", earnings: 5, xp: 0 });
            setTimeout(() => setShowCompletionBonus(null), 5000);
        }
    }, []); // Runs only once on initial mount

    const processEndOfDayBets = (today: string) => {
        let lostAmount = 0;
        const updatedTasks = { ...tasks };
        const updatedRecurringTasks = [...recurringTasks];
        let tasksChanged = false;
        let recurringChanged = false;

        Object.keys(updatedTasks).forEach(date => {
            if (date < today) {
                updatedTasks[date] = updatedTasks[date].map(task => {
                    if (task.betPlaced && !task.completed && typeof task.betWon === 'undefined') {
                        lostAmount += task.betAmount || 0;
                        tasksChanged = true;
                        return { ...task, betWon: false };
                    }
                    return task;
                });
            }
        });

        updatedRecurringTasks.forEach((rt, index) => {
            const updatedCompletions = { ...rt.completions };
            let completionsChanged = false;
            Object.keys(updatedCompletions).forEach(date => {
                if (date < today) {
                    const completion = updatedCompletions[date];
                    if (completion.betPlaced && !completion.completed && typeof completion.betWon === 'undefined') {
                        lostAmount += completion.betAmount || 0;
                        updatedCompletions[date] = { ...completion, betWon: false };
                        completionsChanged = true;
                    }
                }
            });
            if (completionsChanged) {
                recurringChanged = true;
                updatedRecurringTasks[index] = { ...rt, completions: updatedCompletions };
            }
        });

        if (lostAmount > 0) {
            if (tasksChanged) setTasks(updatedTasks);
            if (recurringChanged) setRecurringTasks(updatedRecurringTasks);
            setCharacter(c => ({ ...c, spent: (c.spent || 0) + lostAmount }));
            console.log(`Processed bet losses. Total lost: ${lostAmount}`);
        }
    };

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
    Object.values(tasks).flat().forEach(t => processTask({ ...t, date: Object.keys(tasks).find(d => tasks[d].includes(t))! }));
    recurringTasks.forEach(rt => {
        Object.entries(rt.completions).forEach(([date, completion]) => {
            if (completion.completed) processTask({ ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime });
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
    Object.values(tasks).flat().forEach(t => processTask({ ...t, date: Object.keys(tasks).find(d => tasks[d].includes(t))! }));
    recurringTasks.forEach(rt => {
        Object.entries(rt.completions).forEach(([date, completion]) => {
            if (completion.completed) processTask({ ...rt, id: `${rt.id}_${date}`, date, completed: true, actualTime: completion.actualTime, alignedGoalId: rt.alignedGoalId });
        });
    });
    return Object.entries(stats).map(([goalId, data]) => {
        const goal = goals.find(g => g.id === goalId);
        return { goalId, goalDescription: goal?.description || 'Unknown Goal', goalLabel: goal?.label, ...data };
    });
  }, [tasks, recurringTasks, goals, streakMultiplier]);

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
        
        let newTaskId: string;
        let createdTask: Task | RecurringTask;

        if (taskToCommit.recurrenceRule === 'None') {
            const { recurrenceRule, ...rest } = taskToCommit;
            const newTask: Task = { ...rest, id: generateId(), completed: false, actualTime: null, goalAlignment, alignedGoalId, justification };
            setTasks(prevTasks => ({
                ...prevTasks,
                [taskToCommit.date]: [...(prevTasks[taskToCommit.date] || []), newTask]
            }));
            newTaskId = newTask.id;
            createdTask = newTask;
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
            setRecurringTasks(prev => [...prev, newRecurringTask]);
            newTaskId = `${newRecurringTask.id}_${taskToCommit.date}`;
            createdTask = newRecurringTask;
        }

        if (!userCategories.find(c => c.toLowerCase() === taskToCommit.category.toLowerCase())) {
            setUserCategories(prev => [...prev, taskToCommit.category]);
        }

        setSelectedTaskId(newTaskId);
        setIsLoadingStory(true);
        setMotivationalStory('');

        const story = await generateGogginsStory({
            description: createdTask.description,
            difficulty: createdTask.difficulty,
            category: createdTask.category,
            estimatedTime: createdTask.estimatedTime
        }, goals, taskToCommit.justification);
        
        if ('recurrenceRule' in createdTask) {
            setRecurringTasks(prev => prev.map(rt => rt.id === (createdTask as RecurringTask).id ? { ...rt, story } : rt));
        } else {
            setTasks(prev => {
                const newTasks = { ...prev };
                const taskDate = (createdTask as Task).date;
                if (newTasks[taskDate]) {
                    newTasks[taskDate] = newTasks[taskDate].map(t => t.id === (createdTask as Task).id ? { ...t, story } : t);
                }
                return newTasks;
            });
        }

        setMotivationalStory(story);
        setIsLoadingStory(false);
    };

    const addTask = async (taskData: { description: string, difficulty: TaskDifficulty, date: string, category: string, recurrenceRule: 'None' | RecurrenceRule, estimatedTime: number, time?: string, justification?: string }) => {
        const bettingContext = {
            goals: goals.filter(g => !g.completed),
            tasks,
            recurringTasks
        };
        
        const { multiplier, rationale } = await generateBettingOdds({
            description: taskData.description,
            difficulty: taskData.difficulty,
            category: taskData.category,
            estimatedTime: taskData.estimatedTime,
        }, bettingContext);

        const tempTask: Task & { betMultiplier: number; betRationale: string; recurrenceRule: 'None' | RecurrenceRule; } = {
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
            recurrenceRule: recurringTasks.find(rt => rt.id === task.recurringMasterId)?.recurrenceRule || (task as any).recurrenceRule || 'None'
        };
        _commitTask(finalTask);
        setTaskToBetOn(null);
    };

    const handleNoBet = (task: Task) => {
        const finalTask = {
            ...task,
            betPlaced: false,
            betAmount: undefined,
            betMultiplier: undefined,
            recurrenceRule: recurringTasks.find(rt => rt.id === task.recurringMasterId)?.recurrenceRule || (task as any).recurrenceRule || 'None'
        };
        _commitTask(finalTask);
        setTaskToBetOn(null);
    };

  const toggleTask = (date: string, taskToToggle: Task) => {
    if (taskToToggle.completed) {
      if (taskToToggle.recurringMasterId) {
        setRecurringTasks(recurringTasks.map(rt => rt.id === taskToToggle.recurringMasterId ? { ...rt, completions: { ...rt.completions, [date]: { ...rt.completions[date], completed: false, actualTime: null } } } : rt));
      } else {
        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };
            newTasks[date] = newTasks[date].map(t => t.id === taskToToggle.id ? { ...t, completed: false, actualTime: null } : t);
            return newTasks;
        });
      }
    } else {
      setTaskToComplete({ task: taskToToggle, date });
    }
  };

  const handleConfirmCompletion = (date: string, task: Task, actualTime: number) => {
    let betWinnings = 0;
    
    if (task.betPlaced && !task.completed) {
        const winnings = (task.betAmount || 0) * (task.betMultiplier || 1);
        betWinnings = (task.betAmount || 0) + winnings; // Return stake + winnings
        setCharacter(c => ({ ...c, bonuses: (c.bonuses || 0) + betWinnings }));
        if (betWinnings > 0) {
            setShowCompletionBonus({ title: "Bet Won!", earnings: winnings, xp: 0 });
            setTimeout(() => setShowCompletionBonus(null), 5000);
        }
    }
    
    if (task.recurringMasterId) {
        setRecurringTasks(recurringTasks.map(rt => {
            if (rt.id === task.recurringMasterId) {
                const completionData = { completed: true, actualTime, time: task.time };
                if (task.betPlaced) {
                    Object.assign(completionData, {
                        betPlaced: true,
                        betWon: true,
                        betAmount: task.betAmount,
                        betMultiplier: task.betMultiplier
                    });
                }
                const newCompletions = { ...rt.completions, [date]: completionData };
                return { ...rt, completions: newCompletions };
            }
            return rt;
        }));
    } else {
        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };
            newTasks[date] = newTasks[date].map(t => {
                if (t.id === task.id) {
                    const updatedTask = { ...t, completed: true, actualTime };
                    if (task.betPlaced) {
                        updatedTask.betWon = true;
                    }
                    return updatedTask;
                }
                return t;
            });
            return newTasks;
        });
    }
    setTaskToComplete(null);
    setLastUpdatedDate(date);
  };

  const deleteTask = (date: string, taskToDelete: Task) => {
    if (taskToDelete.recurringMasterId) {
        if(window.confirm("This is a recurring mission. Deleting it will remove all future occurrences. Are you sure?")) {
            setRecurringTasks(recurringTasks.filter(rt => rt.id !== taskToDelete.recurringMasterId));
        }
    } else {
        setTasks(prevTasks => {
            const newTasks = { ...prevTasks };
            if (newTasks[date]) {
                newTasks[date] = newTasks[date].filter(t => t.id !== taskToDelete.id);
                if (newTasks[date].length === 0) {
                    delete newTasks[date];
                }
            }
            return newTasks;
        });
    }
  };
  
    const updateTask = (updatedItem: Task | RecurringTask, originalItem: Task | RecurringTask) => {
        if ('recurrenceRule' in updatedItem && 'recurrenceRule' in originalItem) { // It's a RecurringTask
            setRecurringTasks(prev => prev.map(rt => rt.id === originalItem.id ? updatedItem : rt));
        } else if (!('recurrenceRule' in updatedItem) && !('recurrenceRule' in originalItem)) { // It's a Task
            const updatedTask = updatedItem as Task;
            const originalTask = originalItem as Task;
            setTasks(prev => {
                const newTasks = { ...prev };
                if (newTasks[originalTask.date]) {
                    newTasks[originalTask.date] = newTasks[originalTask.date].filter(t => t.id !== originalTask.id);
                    if (newTasks[originalTask.date].length === 0) {
                        delete newTasks[originalTask.date];
                    }
                }
                if (!newTasks[updatedTask.date]) {
                    newTasks[updatedTask.date] = [];
                }
                newTasks[updatedTask.date].push(updatedTask);
                return newTasks;
            });
        }
        setItemToEdit(null);
    };

  const selectTask = (task: Task) => {
    if (selectedTaskId === task.id) {
        setSelectedTaskId(null);
        setMotivationalStory('');
    } else {
        setSelectedTaskId(task.id);
        const masterTask = task.recurringMasterId ? recurringTasks.find(rt => rt.id === task.recurringMasterId) : task;
        setMotivationalStory(masterTask?.story || '');
    }
  };

    const updateTaskTime = (date: string, taskToUpdate: Task, time: string | null) => {
        if (taskToUpdate.recurringMasterId) {
            setRecurringTasks(prev => prev.map(rt => {
                if (rt.id === taskToUpdate.recurringMasterId) {
                    const newCompletions = { ...rt.completions };
                    const completionData = newCompletions[date] || { completed: false, actualTime: null };
                    newCompletions[date] = { ...completionData, time: time ?? undefined };
                    return { ...rt, completions: newCompletions };
                }
                return rt;
            }));
        } else {
            setTasks(prev => {
                const newTasks = { ...prev };
                if (newTasks[date]) {
                    newTasks[date] = newTasks[date].map(t => t.id === taskToUpdate.id ? { ...t, time: time ?? undefined } : t);
                }
                return newTasks;
            });
        }
    };
    
    const generateStoryForTask = async (date: string, task: Task) => {
        setSelectedTaskId(task.id);
        setIsLoadingStory(true);
        setMotivationalStory('');
        const story = await generateGogginsStory(task, goals.filter(g => !g.completed), task.justification);
        
        if (task.recurringMasterId) {
            setRecurringTasks(prev => prev.map(rt => rt.id === task.recurringMasterId ? { ...rt, story } : rt));
        } else {
            setTasks(prev => {
                const newTasks = { ...prev };
                if (newTasks[date]) {
                    newTasks[date] = newTasks[date].map(t => t.id === task.id ? { ...t, story } : t);
                }
                return newTasks;
            });
        }
        setMotivationalStory(story);
        setIsLoadingStory(false);
    };
    
    // Side Quest Handlers
    const completeSideQuest = (questId: string) => {
        const today = getLocalDateString();
        setSideQuests(sideQuests.map(q => {
            if (q.id === questId) {
                const newCompletions = { ...q.completions };
                newCompletions[today] = (newCompletions[today] || 0) + 1;
                return { ...q, completions: newCompletions };
            }
            return q;
        }));
        
        const quest = sideQuests.find(q => q.id === questId);
        if (quest) {
            const reward = DIFFICULTY_REWARDS[quest.difficulty];
            const newBonuses = (character.bonuses || 0) + reward;
            setCharacter({ ...character, bonuses: newBonuses });
        }
    };
    
    const addSideQuest = (questData: { description: string, difficulty: TaskDifficulty, dailyGoal: number }) => {
        const newQuest: SideQuest = { ...questData, id: generateId(), completions: {} };
        setSideQuests([...sideQuests, newQuest]);
    };
    
    const deleteSideQuest = (questId: string) => {
        setSideQuests(sideQuests.filter(q => q.id !== questId));
    };

    const updateSideQuest = (questId: string, updates: { description: string, difficulty: TaskDifficulty, dailyGoal: number }) => {
        setSideQuests(sideQuests.map(q => q.id === questId ? { ...q, ...updates } : q));
    };

    // Diary Handlers
    const saveInitialReflection = async (date: string, reflection: string) => {
        setIsGeneratingFeedback(true);
        const feedback = await generateGogginsReflectionFeedback(reflection, goals.filter(g => !g.completed));
        setDiaryEntries(prev => ({
            ...prev,
            [date]: { ...prev[date], date, initialReflection: reflection, initialFeedback: feedback }
        }));
        setIsGeneratingFeedback(false);
    };

    const saveDebrief = async (date: string, debrief: string) => {
        setIsGeneratingFeedback(true);
        const tasksForDay = getTasksForDate(date).filter(t => t.completed);
        const scoreForDay = dailyScores.find(s => s.date === date)?.earnings || 0;
        const debriefData = { debriefEntry: debrief, initialReflection: diaryEntries[date]?.initialReflection, tasks: tasksForDay, earnings: scoreForDay };
        
        const { feedback, grade } = await generateGogginsDiaryFeedback(debriefData, goals.filter(g => !g.completed));
        
        setDiaryEntries(prev => ({
            ...prev,
            [date]: { ...prev[date], date, debrief, finalFeedback: feedback, grade }
        }));
        setIsGeneratingFeedback(false);
    };
    
    // Review Handler
    const handleGenerateReview = async (days: number) => {
        setIsGeneratingReview(true);
        setReviewResult(null);
        
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

        const categoryBreakdown: { category: string; completed: number; earnings: number }[] = [];
        categoryScores.forEach(cs => {
             categoryBreakdown.push({ category: cs.category, completed: cs.tasksCompleted, earnings: cs.earnings });
        });
        
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
        setIsGeneratingReview(false);
    };

    // Goal Handlers
    const addGoal = async (goalData: Goal) => {
        const newGoal: Goal = { ...goalData, id: generateId() };
        
        const accomplishmentsSummary = {
            totalTasks: allTasks.filter(t => t.completed).length,
            topCategories: categoryScores.sort((a,b) => b.tasksCompleted - a.tasksCompleted).slice(0,3).map(c => c.category)
        };
        const suggestions = await generateAtomicHabitsSystem(newGoal, goals, accomplishmentsSummary);
        const label = await generateLabel(newGoal.contract?.primaryObjective || newGoal.description);
        
        newGoal.system = suggestions;
        newGoal.label = label;
        
        setGoals(prev => [...prev, newGoal]);
        setAtomicHabitsSuggestions(suggestions);
    };

    const updateGoal = async (goalId: string, updates: { description: string; targetDate: string }) => {
        const label = await generateLabel(updates.description);
        setGoals(goals.map(g => g.id === goalId ? { ...g, ...updates, label } : g));
    };

    const deleteGoal = async (goalId: string) => {
        setGoals(goals.filter(g => g.id !== goalId));
    };

    const handleGoalChangeRequest = async (justification: string, currentGoal: Goal) => {
        const result = await generateGogginsGoalChangeVerdict(justification, currentGoal.description);
        if (result.approved) {
            const newBalance = currentBalance - GOAL_CHANGE_COST;
            const newSpent = (character.spent || 0) + GOAL_CHANGE_COST;
            setCharacter({ ...character, spent: newSpent });
        }
        return result;
    };
    
    const completeGoal = async (goalId: string, proof: string) => {
        const goal = goals.find(g => g.id === goalId);
        if (!goal) return { approved: false, feedback: "Goal not found." };
        
        const result = await generateGogginsGoalCompletionVerdict(goal.description, proof);
        
        if (result.approved) {
            const completionDate = getLocalDateString();
            setGoals(goals.map(g => 
                g.id === goalId 
                    ? { ...g, completed: true, completionDate, completionProof: proof, completionFeedback: result.feedback } 
                    : g
            ));
            
            const newBonuses = (character.bonuses || 0) + GOAL_COMPLETION_REWARD;
            setCharacter({ ...character, bonuses: newBonuses });
            
            setShowCompletionBonus({ title: "Objective Conquered!", xp: 0, earnings: GOAL_COMPLETION_REWARD });
            setTimeout(() => setShowCompletionBonus(null), 5000);
        }
        
        return result;
    };
    
    const updateGoalContract = async (goalId: string, newContract: GoalContract) => {
        const goalToUpdate = goals.find(g => g.id === goalId);
        if (!goalToUpdate) return;

        const accomplishmentsSummary = {
            totalTasks: allTasks.filter(t => t.completed).length,
            topCategories: categoryScores.sort((a,b) => b.tasksCompleted - a.tasksCompleted).slice(0,3).map(c => c.category)
        };

        const goalWithNewContract = { ...goalToUpdate, contract: newContract };
        
        const newSystem = await generateAtomicHabitsSystem(goalWithNewContract, goals, accomplishmentsSummary);
        const newLabel = await generateLabel(newContract.primaryObjective);

        setGoals(prev => prev.map(g =>
            g.id === goalId
                ? { ...g, contract: newContract, system: newSystem, label: newLabel }
                : g
        ));
        
        setAtomicHabitsSuggestions(newSystem);
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

        setWeeklyGoals(prev => ({
            ...prev,
            [weekKey]: [...(prev[weekKey] || []), newGoal]
        }));
    };
    
    const updateWeeklyGoal = async (weekKey: string, goalId: string, description: string) => {
        let updatedGoal: WeeklyGoal | undefined;
         setWeeklyGoals(prev => {
            const weekGoals = prev[weekKey] || [];
            const newWeekGoals = weekGoals.map(g => {
                if (g.id === goalId) {
                    updatedGoal = { ...g, description };
                    return updatedGoal;
                }
                return g;
            });
            return { ...prev, [weekKey]: newWeekGoals };
        });

        if (updatedGoal) {
            const activeGoals = goals.filter(g => !g.completed);
            if (activeGoals.length > 0) {
                const { alignmentScore, alignedGoalId } = await analyzeTaskGoalSimilarity(description, activeGoals);
                setWeeklyGoals(prev => {
                    const weekGoals = prev[weekKey] || [];
                    const newWeekGoals = weekGoals.map(g => {
                        if (g.id === goalId) {
                            return { ...g, goalAlignment: alignmentScore, alignedGoalId };
                        }
                        return g;
                    });
                    return { ...prev, [weekKey]: newWeekGoals };
                });
            }
        }
    };

    const updateWeeklyGoalContract = async (weekKey: string, goalId: string, newContract: GoalContract) => {
        const newLabel = await generateLabel(newContract.primaryObjective);
        setWeeklyGoals(prev => {
            const weekGoals = prev[weekKey] || [];
            const newWeekGoals = weekGoals.map(g => g.id === goalId ? {...g, contract: newContract, label: newLabel, description: newContract.primaryObjective } : g);
            return {...prev, [weekKey]: newWeekGoals };
        });
    };
    
    const deleteWeeklyGoal = (weekKey: string, goalId: string) => {
        setWeeklyGoals(prev => ({
            ...prev,
            [weekKey]: (prev[weekKey] || []).filter(g => g.id !== goalId)
        }));
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
        
        setWeeklyGoals(prev => ({
            ...prev,
            [weekKey]: (prev[weekKey] || []).map(g => g.id === goalId ? { ...g, evaluation } : g)
        }));
    };

    // Check for weekly briefing on Sunday
    useEffect(() => {
        const today = new Date();
        if (today.getDay() === 0) { // Sunday
            const weekKey = getWeekKey(today);
            if (!weeklyBriefings[weekKey] && !isGeneratingBriefing) {
                const generateBriefing = async () => {
                    setIsGeneratingBriefing(true);
                    
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
                    setIsGeneratingBriefing(false);
                };
                generateBriefing();
            }
        }
    }, [weeklyGoals, goals, weeklyBriefings, isGeneratingBriefing]);
    
    // Reward Handlers
    const addReward = (rewardData: { name: string; cost: number }) => {
        const newReward: Reward = { ...rewardData, id: generateId() };
        setRewards([...rewards, newReward]);
    };

    const deleteReward = (rewardId: string) => {
        setRewards(rewards.filter(r => r.id !== rewardId));
    };

    const purchaseReward = (reward: Reward) => {
        if (currentBalance >= reward.cost) {
            const newPurchase: PurchasedReward = {
                id: generateId(),
                rewardId: reward.id,
                name: reward.name,
                cost: reward.cost,
                purchaseDate: getLocalDateString()
            };
            setPurchasedRewards([...purchasedRewards, newPurchase]);
            setCharacter(prev => ({ ...prev, spent: (prev.spent || 0) + reward.cost }));
        }
    };
    
    // Wish List and Core List Handlers
    const addWish = async (wishData: Wish) => {
        const label = await generateLabel(wishData.contract?.primaryObjective || wishData.description);
        setWishList(prev => [...prev, { ...wishData, id: generateId(), label }]);
    };
    const updateWish = (wishId: string, updates: { description: string; link?: string; explanation: string }) => {
        setWishList(prev => prev.map(w => w.id === wishId ? { ...w, ...updates } : w));
    };
    const updateWishContract = async (wishId: string, newContract: GoalContract) => {
        const newLabel = await generateLabel(newContract.primaryObjective);
        setWishList(prev => prev.map(w => w.id === wishId ? { ...w, contract: newContract, label: newLabel, description: newContract.primaryObjective } : w));
    };
    const deleteWish = (wishId: string) => {
        setWishList(prev => prev.filter(w => w.id !== wishId));
    };
    
    const addCoreTask = async (coreData: CoreTask) => {
        const label = await generateLabel(coreData.contract?.primaryObjective || coreData.description);
        setCoreList(prev => [...prev, { ...coreData, id: generateId(), label }]);
    };
    const updateCoreTask = (id: string, updates: { description: string; link?: string; explanation: string }) => {
        setCoreList(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };
    const updateCoreTaskContract = async (id: string, newContract: GoalContract) => {
        const newLabel = await generateLabel(newContract.primaryObjective);
        setCoreList(prev => prev.map(c => c.id === id ? { ...c, contract: newContract, label: newLabel, description: newContract.primaryObjective } : c));
    };
    const deleteCoreTask = (id: string) => {
        setCoreList(prev => prev.filter(c => c.id !== id));
    };
    
    // AI Task Assignment Handlers
    const getAppContext = (): AppContext => ({
        currentDate: selectedDate,
        tasks, recurringTasks, sideQuests, diaryEntries, goals, weeklyGoals,
        rewards, purchasedRewards, character, dailyScores, categoryScores,
        objectiveScores, streak, dailyGoal, userCategories, wishList, coreList
    });
    
    const handleAIAssignedTask = async () => {
        setIsAssigningTask(true);
        const appContext = getAppContext();
        const taskData = await generateAIAssignedTask(appContext);
        await addTask({ ...taskData, date: selectedDate, recurrenceRule: 'None', time: undefined });
        setIsAssigningTask(false);
    };

    const handleGogginsWishSelection = async () => {
        setIsSelectingWish(true);
        const appContext = getAppContext();
        const taskData = await generateTaskFromWishList(appContext);

        await addTask({
            ...taskData,
            description: taskData.description,
            date: selectedDate,
            recurrenceRule: 'None',
            time: undefined,
        });
        
        // Remove the original wish from the list
        const wishToRemove = wishList.find(w => w.description === taskData.originalWishDescription);
        if (wishToRemove) {
            deleteWish(wishToRemove.id);
        }

        setIsSelectingWish(false);
    };

    const handleGogginsCoreSelection = async () => {
        setIsForgingCoreMission(true);
        const appContext = getAppContext();
        const taskData = await generateTaskFromCoreList(appContext);
        
        await addTask({
            ...taskData,
            description: taskData.description,
            date: selectedDate,
            recurrenceRule: 'None',
            time: undefined,
        });
        
        setIsForgingCoreMission(false);
    };

    // Chatbot Handler
    const handleSendMessage = async (message: string) => {
        const newMessages: { sender: 'user' | 'ai'; content: string }[] = [...chatMessages, { sender: 'user', content: message }];
        setChatMessages(newMessages);
        setIsChatLoading(true);
        
        const appContext = getAppContext();
        const response = await generateChatResponse(newMessages, appContext);
        
        setChatMessages([...newMessages, { sender: 'ai', content: response }]);
        setIsChatLoading(false);
    };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <Header totalGP={totalGP} />
      <main className="p-4 sm:p-8 space-y-6">
        <StatusBar character={character} dailyScores={dailyScores} totalEarnings={totalEarnings} totalGP={totalGP} />
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
                <CollapsibleSection title="Leaderboards" icon={<ChartBarSquareIcon />} storageKey="goggins-leaderboards-section">
                    <Leaderboard scores={dailyScores} streak={streak} dailyGoal={dailyGoal} setDailyGoal={setDailyGoal} />
                    <div className="pt-6 mt-6 border-t border-gray-700">
                      <CategoryLeaderboard scores={categoryScores} />
                    </div>
                    <div className="pt-6 mt-6 border-t border-gray-700">
                      <ObjectiveLeaderboard scores={objectiveScores} />
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="After-Action Review" icon={<ListBulletIcon />} storageKey="goggins-review-section">
                    <Reviewer onGenerateReview={handleGenerateReview} isGenerating={isGeneratingReview} review={reviewResult} />
                </CollapsibleSection>
            </div>

            {/* CENTER COLUMN */}
            <div className="xl:col-span-2 space-y-6">
                <DailyCompletionBar completed={getTasksForDate(selectedDate).filter(t => t.completed).length} total={getTasksForDate(selectedDate).length} />
                <MotivationModal story={motivationalStory} isLoading={isLoadingStory} />
                <CalendarContainer
                    view={calendarView}
                    onViewChange={setCalendarView}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    scores={dailyScores}
                    tasks={tasks}
                    recurringTasks={recurringTasks}
                    userCategories={effectiveUserCategories}
                    onAddTask={addTask}
                    onToggleTask={toggleTask}
                    onDeleteTask={deleteTask}
                    onEditTask={(item) => setItemToEdit(item)}
                    onSelectTask={selectTask}
                    onUpdateTime={updateTaskTime}
                    onGenerateStory={generateStoryForTask}
                    selectedTaskId={selectedTaskId}
                    getTasksForDate={getTasksForDate}
                    diaryEntries={diaryEntries}
                    goals={goals}
                    onSaveInitialReflection={saveInitialReflection}
                    onSaveDebrief={saveDebrief}
                    isGeneratingFeedback={isGeneratingFeedback}
                />
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-6">
                <CollapsibleSection title="Add Mission" icon={<PlusIcon />} storageKey="goggins-add-mission">
                    <TaskInput onAddTask={addTask} userCategories={effectiveUserCategories} onAIAssignedTask={handleAIAssignedTask} isAssigningTask={isAssigningTask}/>
                </CollapsibleSection>
                <CollapsibleSection title="Objectives" icon={<FlagIcon />} storageKey="goggins-objectives">
                    <Goals 
                        goals={goals} 
                        onAddGoal={addGoal}
                        onUpdateGoal={updateGoal}
                        onDeleteGoal={deleteGoal}
                        onGoalChangeRequest={handleGoalChangeRequest}
                        onCompleteGoal={completeGoal}
                        onUpdateGoalContract={updateGoalContract}
                        currentBalance={currentBalance}
                        atomicHabitsSuggestions={atomicHabitsSuggestions}
                        onCloseSuggestions={() => setAtomicHabitsSuggestions(null)}
                    />
                </CollapsibleSection>
                <CollapsibleSection title="Weekly Objectives" icon={<CalendarDaysIcon />} storageKey="goggins-weekly-objectives-section">
                    <WeeklyGoalComponent 
                        weeklyGoals={weeklyGoals}
                        goals={goals}
                        onAddGoal={addWeeklyGoal}
                        onUpdateGoal={updateWeeklyGoal}
                        onDeleteGoal={deleteWeeklyGoal}
                        onEvaluateGoal={evaluateWeeklyGoal}
                        onUpdateWeeklyGoalContract={updateWeeklyGoalContract}
                        isBriefingLoading={isGeneratingBriefing}
                    />
                </CollapsibleSection>
                <CollapsibleSection title="Forge Missions" icon={<BoltIcon />} storageKey="goggins-forge-missions">
                   <WishList 
                        wishList={wishList}
                        onAddWish={addWish}
                        onUpdateWish={updateWish}
                        onDeleteWish={deleteWish}
                        onGogginsWishSelection={handleGogginsWishSelection}
                        isSelectingWish={isSelectingWish}
                        onUpdateWishContract={updateWishContract}
                    />
                    <div className="pt-6 mt-6 border-t border-gray-700">
                      <CoreList
                          coreList={coreList}
                          onAdd={addCoreTask}
                          onUpdate={updateCoreTask}
                          onDelete={deleteCoreTask}
                          onForge={handleGogginsCoreSelection}
                          isForging={isForgingCoreMission}
                          onUpdateCoreTaskContract={updateCoreTaskContract}
                      />
                    </div>
                </CollapsibleSection>
                <CollapsibleSection title="Side Quests" icon={<SparklesIcon />} storageKey="goggins-side-quests-section">
                    <SideQuests
                        sideQuests={sideQuests}
                        onCompleteSideQuest={completeSideQuest}
                        onAddSideQuest={addSideQuest}
                        onDeleteSideQuest={deleteSideQuest}
                        onUpdateSideQuest={updateSideQuest}
                    />
                </CollapsibleSection>
                <CollapsibleSection title="Rewards Locker" icon={<TrophyIcon />} storageKey="goggins-rewards-section">
                    <Rewards
                        rewards={rewards}
                        purchasedRewards={purchasedRewards}
                        currentBalance={currentBalance}
                        onAddReward={addReward}
                        onDeleteReward={deleteReward}
                        onPurchaseReward={purchaseReward}
                    />
                </CollapsibleSection>
            </div>
        </div>
      </main>
      
      {taskToComplete && (
        <ActualTimeModal
            task={taskToComplete.task}
            onConfirm={(time) => handleConfirmCompletion(taskToComplete.date, taskToComplete.task, time)}
            onCancel={() => setTaskToComplete(null)}
        />
      )}
      
      {itemToEdit && (
        <EditTaskModal
            item={itemToEdit}
            onUpdate={updateTask}
            onCancel={() => setItemToEdit(null)}
            userCategories={effectiveUserCategories}
        />
      )}
      
      {showCompletionBonus && <CompletionBonusModal bonus={showCompletionBonus} />}
      {briefingToShow && <WeeklyBriefingModal briefing={briefingToShow} onClose={() => setBriefingToShow(null)} />}
      
      <button 
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-4 left-4 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg z-40"
        aria-label="Open AI Tactical Advisor Chat"
      >
        <ChatBubbleLeftRightIcon className="w-8 h-8"/>
      </button>

      <Chatbot 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
      />

      {taskToBetOn && (
        <BetModal
            task={taskToBetOn}
            currentBalance={currentBalance}
            onConfirmBet={handleConfirmBet}
            onNoBet={handleNoBet}
        />
      )}
    </div>
  );
};

export default App;