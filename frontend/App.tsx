
import React, { useState, useMemo, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';

// Components
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { DailyCompletionBar } from './components/DailyCompletionBar';
import { MotivationModal } from './components/MotivationModal';
import { CalendarContainer, CalendarViewType } from './components/CalendarView';
import { Leaderboard, CategoryLeaderboard, ObjectiveLeaderboard } from './components/Leaderboard';
import { Reviewer } from './components/Reviewer';
import { TaskInput } from './components/TaskModal';
import { Goals } from './components/Goals';
import { WeeklyGoalComponent } from './components/WeeklyGoal';
import { WishList } from './components/WishList';
import { CoreList } from './components/CoreList';
import { SideQuests } from './components/SideQuests';
import { Rewards } from './components/Rewards';
import { Chatbot } from './components/Chatbot';
import { ActualTimeModal } from './components/ActualTimeModal';
import { EditTaskModal } from './components/EditTaskModal';
import { BetModal } from './components/BetModal';
import { CompletionBonusModal } from './components/CompletionBonusModal';
import { WeeklyBriefingModal } from './components/WeeklyBriefingModal';
import { CollapsibleSection } from './components/CollapsibleSection';
import { DashboardLayout } from './components/DashboardLayout';
import { ChartBarSquareIcon, ListBulletIcon, PlusIcon, FlagIcon, CalendarDaysIcon, BoltIcon, SparklesIcon, TrophyIcon, ChatBubbleLeftRightIcon } from './components/Icons';

// Hooks
import { useAppData } from './hooks/useAppData';
import { useStats } from './hooks/useStats';
import { useTaskActions } from './hooks/useTaskActions';
import { useGoalActions } from './hooks/useGoalActions';
import { useAIHandlers } from './hooks/useAIHandlers';
import { useSideQuestActions } from './hooks/useSideQuestActions';
import { useRewardActions } from './hooks/useRewardActions';
import { useDiaryActions } from './hooks/useDiaryActions';
import { useReviewActions } from './hooks/useReviewActions';
import { useBriefing } from './hooks/useBriefing';
import { useListActions } from './hooks/useListActions';

// Types & Utils
import { Task, RecurringTask, TaskDifficulty, AtomicHabitsSuggestions, AppContext } from './types';
import { getLocalDateString } from './utils/dateUtils';
import { DAILY_GRIND_COMPLETION_BONUS_EARNINGS } from './constants';
import { api } from './services/api';

const MainApp: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading...</div>;
    if (!isAuthenticated) return <LoginScreen />;
    return <AppContent />;
};

const AppContent: React.FC = () => {
    // 1. Data Layer
    const {
        tasks, setTasks, recurringTasks, setRecurringTasks, sideQuests, setSideQuests,
        diaryEntries, setDiaryEntries, goals, setGoals, weeklyGoals, setWeeklyGoals,
        rewards, setRewards, purchasedRewards, setPurchasedRewards, wishList, setWishList,
        coreList, setCoreList, character, setCharacter, userCategories, setUserCategories,
        dailyGoal, setDailyGoal, awardedDailyGrindBonus, setAwardedDailyGrindBonus,
        weeklyBriefings, setWeeklyBriefings, chatMessages, setChatMessages
    } = useAppData();

    // 2. View State
    const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
    const [calendarView, setCalendarView] = useState<CalendarViewType>('month');
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [motivationalStory, setMotivationalStory] = useState('');
    const [isLoadingStory, setIsLoadingStory] = useState(false);
    const [taskToComplete, setTaskToComplete] = useState<{ task: Task, date: string } | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Task | RecurringTask | null>(null);
    const [lastUpdatedDate, setLastUpdatedDate] = useState<string | null>(null);
    const [showCompletionBonus, setShowCompletionBonus] = useState<{ title: string; xp: number; earnings: number } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [taskToBetOn, setTaskToBetOn] = useState<any>(null);
    const [atomicHabitsSuggestions, setAtomicHabitsSuggestions] = useState<AtomicHabitsSuggestions | null>(null);

    // 3. Stats Layer
    const { streak, dailyScores, totalEarnings, currentBalance, totalGP, categoryScores, objectiveScores } = useStats(
        tasks, recurringTasks, diaryEntries, dailyGoal, character.bonuses || 0, character.spent || 0, goals
    );

    // 4. Action Handlers
    const taskActions = useTaskActions(
        tasks, setTasks, recurringTasks, setRecurringTasks, goals, userCategories, setUserCategories,
        character, setCharacter, setSelectedDate, setCalendarView, setSelectedTaskId, setMotivationalStory,
        setIsLoadingStory, setTaskToBetOn, setShowCompletionBonus, setLastUpdatedDate
    );

    const goalActions = useGoalActions(
        goals, setGoals, weeklyGoals, setWeeklyGoals, character, setCharacter,
        Object.entries(tasks).flatMap(([date, dayTasks]) => (dayTasks as Task[]).map(t => ({ ...t, date }))),
        categoryScores, purchasedRewards, taskActions.getTasksForDate, setShowCompletionBonus, setAtomicHabitsSuggestions
    );

    const sideQuestActions = useSideQuestActions(sideQuests, setSideQuests, character, setCharacter);
    const rewardActions = useRewardActions(rewards, setRewards, purchasedRewards, setPurchasedRewards, currentBalance, character, setCharacter);
    const diaryActions = useDiaryActions(diaryEntries, setDiaryEntries, goals, taskActions.getTasksForDate, dailyScores);
    const reviewActions = useReviewActions(goals, sideQuests, dailyScores, categoryScores, diaryEntries, taskActions.getTasksForDate);
    const briefingActions = useBriefing(weeklyGoals, goals, weeklyBriefings, setWeeklyBriefings);
    const listActions = useListActions(wishList, setWishList, coreList, setCoreList);

    const getAppContext = (): AppContext => ({
        currentDate: selectedDate, tasks, recurringTasks, sideQuests, diaryEntries, goals, weeklyGoals,
        rewards, purchasedRewards, character, dailyScores, categoryScores, objectiveScores,
        streak, dailyGoal, userCategories, wishList, coreList
    });

    const aiHandlers = useAIHandlers(
        chatMessages, setChatMessages, wishList, setWishList, setCoreList, selectedDate,
        taskActions.addTask, listActions.deleteWish, getAppContext
    );

    // 5. Effects
    useEffect(() => {
        const todayStr = getLocalDateString();
        const lastCheck = localStorage.getItem('gogginsLastBetCheck');
        if (lastCheck !== todayStr) {
            taskActions.processEndOfDayBets(todayStr);
            localStorage.setItem('gogginsLastBetCheck', todayStr);
        }
    }, [taskActions]);

    useEffect(() => {
        if (!lastUpdatedDate || awardedDailyGrindBonus[lastUpdatedDate]) return;
        const checkCompletion = async () => {
            const missionsForDate = taskActions.getTasksForDate(lastUpdatedDate).filter(t => t.category !== 'Side Quest');
            const allMissionsComplete = missionsForDate.length > 0 && missionsForDate.every(t => t.completed);
            const allSideQuestsComplete = sideQuests.length > 0 && sideQuests.every(q => (q.completions[lastUpdatedDate] || 0) > 0);

            if (allMissionsComplete && allSideQuestsComplete) {
                const earningsBonus = DAILY_GRIND_COMPLETION_BONUS_EARNINGS;
                const newBonuses = (character.bonuses || 0) + earningsBonus;
                setCharacter({ ...character, bonuses: newBonuses });
                setAwardedDailyGrindBonus(prev => ({ ...prev, [lastUpdatedDate]: true }));
                setShowCompletionBonus({ title: "Daily Grind Conquered!", xp: 0, earnings: earningsBonus });
                setTimeout(() => setShowCompletionBonus(null), 5000);
            }
        };
        checkCompletion();
    }, [lastUpdatedDate, awardedDailyGrindBonus, sideQuests, taskActions, character, setCharacter, setAwardedDailyGrindBonus]);

    const effectiveUserCategories = useMemo(() => {
        const goalLabels = goals.filter(g => !g.completed && g.label).map(g => g.label!);
        return [...new Set([...userCategories, ...goalLabels])];
    }, [userCategories, goals]);

    // 6. UI Composition
    return (
        <DashboardLayout
            header={<Header totalGP={totalGP} />}
            statusBar={<StatusBar character={character} dailyScores={dailyScores} totalEarnings={totalEarnings} totalGP={totalGP} />}
            leftColumn={
                <>
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
                        <Reviewer onGenerateReview={reviewActions.handleGenerateReview} isGenerating={reviewActions.isGeneratingReview} review={reviewActions.reviewResult} />
                    </CollapsibleSection>
                </>
            }
            centerColumn={
                <>
                    <DailyCompletionBar completed={taskActions.getTasksForDate(selectedDate).filter(t => t.completed).length} total={taskActions.getTasksForDate(selectedDate).length} />
                    <MotivationModal story={motivationalStory} isLoading={isLoadingStory} />
                    <CalendarContainer
                        view={calendarView} onViewChange={setCalendarView} selectedDate={selectedDate} onDateSelect={(d) => { setSelectedDate(d); setCalendarView('day'); }}
                        scores={dailyScores} tasks={tasks} recurringTasks={recurringTasks} userCategories={effectiveUserCategories}
                        onAddTask={taskActions.addTask} onToggleTask={(d, t) => t.completed ? taskActions.handleConfirmCompletion(d, { ...t, completed: false }, 0) : setTaskToComplete({ task: t, date: d })}
                        onDeleteTask={taskActions.deleteTask} onEditTask={setItemToEdit} onSelectTask={taskActions.generateStoryForTask}
                        onUpdateTime={taskActions.updateTaskTime} onGenerateStory={taskActions.generateStoryForTask}
                        selectedTaskId={selectedTaskId} getTasksForDate={taskActions.getTasksForDate} diaryEntries={diaryEntries} goals={goals}
                        onSaveInitialReflection={diaryActions.saveInitialReflection} onSaveDebrief={diaryActions.saveDebrief} isGeneratingFeedback={diaryActions.isGeneratingFeedback}
                    />
                </>
            }
            rightColumn={
                <>
                    <CollapsibleSection title="Add Mission" icon={<PlusIcon />} storageKey="goggins-add-mission">
                        <TaskInput onAddTask={taskActions.addTask} userCategories={effectiveUserCategories} onAIAssignedTask={aiHandlers.handleAIAssignedTask} isAssigningTask={aiHandlers.isAssigningTask} />
                    </CollapsibleSection>
                    <CollapsibleSection title="Objectives" icon={<FlagIcon />} storageKey="goggins-objectives">
                        <Goals
                            goals={goals} onAddGoal={goalActions.addGoal} onUpdateGoal={goalActions.updateGoal} onDeleteGoal={goalActions.deleteGoal}
                            onGoalChangeRequest={goalActions.handleGoalChangeRequest} onCompleteGoal={goalActions.completeGoal}
                            onUpdateGoalContract={goalActions.updateGoalContract} currentBalance={currentBalance}
                            atomicHabitsSuggestions={atomicHabitsSuggestions} onCloseSuggestions={() => setAtomicHabitsSuggestions(null)}
                        />
                    </CollapsibleSection>
                    <CollapsibleSection title="Weekly Objectives" icon={<CalendarDaysIcon />} storageKey="goggins-weekly-objectives-section">
                        <WeeklyGoalComponent
                            weeklyGoals={weeklyGoals} goals={goals} onAddGoal={goalActions.addWeeklyGoal} onUpdateGoal={goalActions.updateWeeklyGoal}
                            onDeleteGoal={goalActions.deleteWeeklyGoal} onEvaluateGoal={goalActions.evaluateWeeklyGoal}
                            onUpdateWeeklyGoalContract={goalActions.updateWeeklyGoalContract} isBriefingLoading={briefingActions.isGeneratingBriefing}
                        />
                    </CollapsibleSection>
                    <CollapsibleSection title="Forge Missions" icon={<BoltIcon />} storageKey="goggins-forge-missions">
                        <WishList
                            wishList={wishList} onAddWish={listActions.addWish} onUpdateWish={listActions.updateWish} onDeleteWish={listActions.deleteWish}
                            onGogginsWishSelection={aiHandlers.handleGogginsWishSelection} isSelectingWish={aiHandlers.isSelectingWish} onUpdateWishContract={listActions.updateWishContract}
                        />
                        <div className="pt-6 mt-6 border-t border-gray-700">
                            <CoreList
                                coreList={coreList} onAdd={listActions.addCoreTask} onUpdate={listActions.updateCoreTask} onDelete={listActions.deleteCoreTask}
                                onForge={aiHandlers.handleGogginsCoreSelection} isForging={aiHandlers.isForgingCoreMission} onUpdateCoreTaskContract={listActions.updateCoreTaskContract}
                            />
                        </div>
                    </CollapsibleSection>
                    <CollapsibleSection title="Side Quests" icon={<SparklesIcon />} storageKey="goggins-side-quests-section">
                        <SideQuests sideQuests={sideQuests} onCompleteSideQuest={sideQuestActions.completeSideQuest} onAddSideQuest={sideQuestActions.addSideQuest} onDeleteSideQuest={sideQuestActions.deleteSideQuest} onUpdateSideQuest={sideQuestActions.updateSideQuest} />
                    </CollapsibleSection>
                    <CollapsibleSection title="Rewards Locker" icon={<TrophyIcon />} storageKey="goggins-rewards-section">
                        <Rewards rewards={rewards} purchasedRewards={purchasedRewards} currentBalance={currentBalance} onAddReward={rewardActions.addReward} onDeleteReward={rewardActions.deleteReward} onPurchaseReward={rewardActions.purchaseReward} />
                    </CollapsibleSection>
                </>
            }
            modals={
                <>
                    {taskToComplete && <ActualTimeModal task={taskToComplete.task} onConfirm={(time) => taskActions.handleConfirmCompletion(taskToComplete.date, taskToComplete.task, time)} onCancel={() => setTaskToComplete(null)} />}
                    {itemToEdit && <EditTaskModal item={itemToEdit} onUpdate={taskActions.updateTask} onCancel={() => setItemToEdit(null)} userCategories={effectiveUserCategories} />}
                    {showCompletionBonus && <CompletionBonusModal bonus={showCompletionBonus} />}
                    {briefingActions.briefingToShow && <WeeklyBriefingModal briefing={briefingActions.briefingToShow} onClose={() => briefingActions.setBriefingToShow(null)} />}
                    {taskToBetOn && <BetModal task={taskToBetOn} currentBalance={currentBalance} onConfirmBet={taskActions.handleConfirmBet} onNoBet={() => taskActions.handleNoBet(taskToBetOn)} />}
                </>
            }
            chatbot={
                <>
                    <button onClick={() => setIsChatOpen(true)} className="fixed bottom-4 left-4 bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg z-40" aria-label="Open AI Tactical Advisor Chat">
                        <ChatBubbleLeftRightIcon className="w-8 h-8" />
                    </button>
                    <Chatbot isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} messages={chatMessages} onSendMessage={aiHandlers.handleSendMessage} isLoading={aiHandlers.isChatLoading} />
                </>
            }
        />
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <MainApp />
        </AuthProvider>
    );
};

export default App;