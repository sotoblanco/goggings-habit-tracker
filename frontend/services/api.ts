import {
    Task, RecurringTask, Goal, WeeklyGoal,
    SideQuest, Reward, PurchasedReward,
    DiaryEntry, Wish, CoreTask, Character,
    User
} from '../types';

const BASE_URL = 'http://localhost:8000';

const getToken = () => localStorage.getItem('goggins_auth_token');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers as any, // Cast to avoid TS strictness issues with HeadersInit
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    if (!response.ok) {
        if (response.status === 204) {
            return {} as T;
        }
        const text = await response.text();
        throw new Error(`API Error ${response.status}: ${text}`);
    }

    if (response.status === 204) return {} as T;

    try {
        return await response.json();
    } catch (e) {
        return {} as T;
    }
}

export const api = {
    // Auth
    auth: {
        login: (username: string, apiKey?: string) => request<{ token: string, user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, api_key: apiKey }) }),
        register: (username: string, apiKey?: string) => request<{ token: string, user: User }>('/auth/register', { method: 'POST', body: JSON.stringify({ username, api_key: apiKey }) }),
        me: () => request<User>('/auth/me'),
        updateProfile: (data: { api_key?: string }) => request<User>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
    },

    // Tasks & Core Data
    tasks: {
        list: (startDate?: string, endDate?: string) => request<Task[]>(`/tasks?start_date=${startDate || ''}&end_date=${endDate || ''}`),
        create: (task: Task) => request<Task>('/tasks', { method: 'POST', body: JSON.stringify(task) }),
        update: (task: Task) => request<Task>(`/tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) }),
        delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
    },
    recurringTasks: {
        list: () => request<RecurringTask[]>('/recurring-tasks'),
        create: (task: RecurringTask) => request<RecurringTask>('/recurring-tasks', { method: 'POST', body: JSON.stringify(task) }),
        update: (task: RecurringTask) => request<RecurringTask>(`/recurring-tasks/${task.id}`, { method: 'PUT', body: JSON.stringify(task) }),
        delete: (id: string) => request<void>(`/recurring-tasks/${id}`, { method: 'DELETE' }),
    },
    sideQuests: {
        list: () => request<SideQuest[]>('/side-quests'),
        create: (quest: SideQuest) => request<SideQuest>('/side-quests', { method: 'POST', body: JSON.stringify(quest) }),
        update: (quest: SideQuest) => request<SideQuest>(`/side-quests/${quest.id}`, { method: 'PUT', body: JSON.stringify(quest) }),
        delete: (id: string) => request<void>(`/side-quests/${id}`, { method: 'DELETE' }),
    },
    wishList: {
        list: () => request<Wish[]>('/wish-list'),
        create: (wish: Wish) => request<Wish>('/wish-list', { method: 'POST', body: JSON.stringify(wish) }),
        delete: (id: string) => request<void>(`/wish-list/${id}`, { method: 'DELETE' }),
    },
    coreList: {
        list: () => request<CoreTask[]>('/core-list'),
        create: (task: CoreTask) => request<CoreTask>('/core-list', { method: 'POST', body: JSON.stringify(task) }),
        delete: (id: string) => request<void>(`/core-list/${id}`, { method: 'DELETE' }),
    },

    // Goals
    goals: {
        list: () => request<Goal[]>('/goals'),
        create: (goal: Goal) => request<Goal>('/goals', { method: 'POST', body: JSON.stringify(goal) }),
        update: (goal: Goal) => request<Goal>(`/goals/${goal.id}`, { method: 'PUT', body: JSON.stringify(goal) }),
        delete: (id: string) => request<void>(`/goals/${id}`, { method: 'DELETE' }),
    },
    weeklyGoals: {
        list: () => request<WeeklyGoal[]>('/weekly-goals'),
        create: (goal: WeeklyGoal) => request<WeeklyGoal>('/weekly-goals', { method: 'POST', body: JSON.stringify(goal) }),
        update: (goal: WeeklyGoal) => request<WeeklyGoal>(`/weekly-goals/${goal.id}`, { method: 'PUT', body: JSON.stringify(goal) }),
        delete: (id: string) => request<void>(`/weekly-goals/${id}`, { method: 'DELETE' }),
    },

    // Singletons / Other Collections
    rewards: {
        list: () => request<Reward[]>('/rewards'),
        create: (reward: Reward) => request<Reward>('/rewards', { method: 'POST', body: JSON.stringify(reward) }),
        delete: (id: string) => request<void>(`/rewards/${id}`, { method: 'DELETE' }),
    },
    purchasedRewards: {
        list: () => request<PurchasedReward[]>('/purchased-rewards'),
        create: (reward: PurchasedReward) => request<PurchasedReward>('/purchased-rewards', { method: 'POST', body: JSON.stringify(reward) }),
    },
    diaryEntries: {
        list: () => request<DiaryEntry[]>('/diary-entries'),
        create: (entry: DiaryEntry) => request<DiaryEntry>('/diary-entries', { method: 'POST', body: JSON.stringify(entry) }),
        update: (date: string, entry: DiaryEntry) => request<DiaryEntry>(`/diary-entries/${date}`, { method: 'PUT', body: JSON.stringify(entry) }),
    },
    character: {
        get: () => request<Character>('/character'),
        update: (char: Character) => request<Character>('/character', { method: 'PUT', body: JSON.stringify(char) }),
    },

    // AI
    ai: {
        story: (data: any) => request<{ story: string }>('/ai/story', { method: 'POST', body: JSON.stringify(data) }),
        label: (data: any) => request<{ label: string }>('/ai/label', { method: 'POST', body: JSON.stringify(data) }),
        analyzeGoalAlignment: (data: any) => request<any>('/ai/analyze-goal-alignment', { method: 'POST', body: JSON.stringify(data) }),
        reflectionFeedback: (data: any) => request<{ feedback: string }>('/ai/reflection-feedback', { method: 'POST', body: JSON.stringify(data) }),
        diaryFeedback: (data: any) => request<{ feedback: string, grade: string }>('/ai/diary-feedback', { method: 'POST', body: JSON.stringify(data) }),
        review: (data: any) => request<any>('/ai/review', { method: 'POST', body: JSON.stringify(data) }),
        goalChangeVerdict: (data: any) => request<any>('/ai/goal-change-verdict', { method: 'POST', body: JSON.stringify(data) }),
        goalCompletionVerdict: (data: any) => request<any>('/ai/goal-completion-verdict', { method: 'POST', body: JSON.stringify(data) }),
        atomicSystem: (data: any) => request<any>('/ai/atomic-system', { method: 'POST', body: JSON.stringify(data) }),
        weeklyBriefing: (data: any) => request<{ briefing: string }>('/ai/weekly-briefing', { method: 'POST', body: JSON.stringify(data) }),
        enhanceText: (data: any) => request<{ enhanced_text: string }>('/ai/enhance-text', { method: 'POST', body: JSON.stringify(data) }),
        chat: (data: any) => request<{ response: string }>('/ai/chat', { method: 'POST', body: JSON.stringify(data) }),
        evaluateWeekly: (data: any) => request<any>('/ai/evaluate-weekly', { method: 'POST', body: JSON.stringify(data) }),
        bettingOdds: (data: any) => request<any>('/ai/betting-odds', { method: 'POST', body: JSON.stringify(data) }),
        contract: (data: any) => request<any>('/ai/contract', { method: 'POST', body: JSON.stringify(data) }),
    }
};
