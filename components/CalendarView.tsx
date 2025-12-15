


import React, { useState } from 'react';
import { Task, TaskDifficulty, DailyScore, RecurringTask, RecurrenceRule, DiaryEntry, Goal } from '../types';
import { DIFFICULTY_REWARDS, getCategoryColor, TIME_REWARD_PER_MINUTE } from '../constants';
// FIX: Import `CheckCircleIcon` to fix an undefined component error.
import { TrashIcon, ChevronLeftIcon, ChevronRightIcon, RepeatIcon, PencilSquareIcon, FireIcon, StarIcon, ClockIcon, XMarkIcon, CheckCircleIcon, SparklesIcon, ChartBarSquareIcon, PencilIcon, LightBulbIcon, BanknotesIcon } from './Icons';
import { AllTasksView } from './AllTasksView';
import { Diary } from './Diary';
import { isRecurringOnDate, getLocalDateString } from '../utils/dateUtils';
import { ObjectiveHeatmapView } from './ObjectiveHeatmapView';

export type CalendarViewType = 'month' | 'week' | 'day' | 'all' | 'objective';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

// --- Date Helper Functions ---
const getDayWithSuffix = (day: number) => {
    if (day > 3 && day < 21) return `${day}th`;
    switch (day % 10) {
      case 1: return `${day}st`;
      case 2: return `${day}nd`;
      case 3: return `${day}rd`;
      default: return `${day}th`;
    }
};

const getScoreColor = (score: number) => {
    if (score === 0) return 'bg-gray-800 hover:bg-gray-700';
    if (score <= 0.10) return 'bg-red-900/60 hover:bg-red-800/80';
    if (score <= 0.25) return 'bg-yellow-800/70 hover:bg-yellow-700/90';
    if (score <= 0.50) return 'bg-green-800/70 hover:bg-green-700/90';
    return 'bg-green-600/80 hover:bg-green-500';
};

// --- GoalAlignmentStars Component ---
const GoalAlignmentStars: React.FC<{ score?: number }> = ({ score }) => {
    if (typeof score !== 'number') return null;
    return (
        <div className="flex items-center gap-0.5" title={`Goal Alignment: ${score}/5`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                    key={i}
                    className={`w-4 h-4 ${i < score ? 'text-yellow-400' : 'text-gray-600'}`}
                />
            ))}
        </div>
    );
};


// --- TaskItem Component ---
const TaskItem: React.FC<{
    task: Task;
    date: string;
    onToggleTask: (date: string, task: Task) => void;
    onDeleteTask: (date: string, task: Task) => void;
    onEditTask: (task: Task) => void;
    onSelectTask: (task: Task) => void;
    onUpdateTime: (date: string, task: Task, time: string | null) => void;
    onGenerateStory: (date: string, task: Task) => void;
    isSelected: boolean;
    goals: Goal[];
}> = ({ task, date, onToggleTask, onDeleteTask, onEditTask, onSelectTask, onUpdateTime, onGenerateStory, isSelected, goals }) => {
    const [isEditingTime, setIsEditingTime] = useState(false);
    const [timeValue, setTimeValue] = useState(task.time || '');
    const [isRationaleVisible, setIsRationaleVisible] = useState(false);

    const isCompleted = task.completed;
    const categoryColor = getCategoryColor(task.category);
    const alignedGoal = goals.find(g => g.id === task.alignedGoalId);
    
    const basePotentialReward = (DIFFICULTY_REWARDS[task.difficulty] + task.estimatedTime * TIME_REWARD_PER_MINUTE) * ((task.goalAlignment || 3) / 5);

    const getDifficultyClass = (difficulty: TaskDifficulty) => {
        switch (difficulty) {
            case TaskDifficulty.EASY: return 'bg-blue-500';
            case TaskDifficulty.MEDIUM: return 'bg-yellow-500';
            case TaskDifficulty.HARD: return 'bg-red-600';
            case TaskDifficulty.SAVAGE: return 'bg-purple-600';
            default: return 'bg-gray-500';
        }
    };

    const handleTimeSave = () => {
        onUpdateTime(date, task, timeValue || null);
        setIsEditingTime(false);
    };

    const BetIndicator = () => {
        if (!task.betPlaced) return null;
        
        let color = 'text-yellow-400'; // Pending
        let title = `Bet Placed: ${formatCurrency(task.betAmount || 0)} @ ${task.betMultiplier}x`;
        if (task.betWon === true) {
            color = 'text-green-400';
            const winnings = (task.betAmount || 0) * (task.betMultiplier || 1);
            title = `Bet Won! Payout: ${formatCurrency(winnings)}`;
        } else if (task.betWon === false) {
            color = 'text-red-500';
            title = `Bet Lost: ${formatCurrency(task.betAmount || 0)}`;
        }

        return (
            <div className={`flex items-center gap-1 ${color}`} title={title}>
                <BanknotesIcon className="w-4 h-4" />
                <span className="font-bold">{formatCurrency(task.betAmount || 0)}</span>
            </div>
        );
    }

    const RationaleDisplay: React.FC<{ justification: string }> = ({ justification }) => {
        const rationaleParts = justification.split('\n').map(line => line.trim()).filter(line => line.startsWith('-') || line.startsWith('*'));
        return (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-600 animate-fade-in">
                <h4 className="text-sm font-bold text-yellow-400 flex items-center gap-2 mb-2">
                    <LightBulbIcon className="w-4 h-4" />
                    Why It Was Chosen
                </h4>
                <ul className="list-disc list-inside pl-2 text-xs text-gray-300 space-y-1">
                    {rationaleParts.map((part, index) => (
                        <li key={index}>{part.substring(1).trim()}</li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className={`p-3 rounded-lg transition-all duration-300 ${isCompleted ? 'bg-gray-900/50 opacity-60' : 'bg-gray-700'} ${isSelected ? 'ring-2 ring-orange-500' : ''}`}>
            <div className="flex items-start gap-4">
                <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggleTask(date, task)}
                    className="w-6 h-6 mt-1 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-600 cursor-pointer flex-shrink-0"
                    aria-labelledby={`task-desc-${task.id}`}
                />
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div className="flex-grow cursor-pointer pr-2" onClick={() => onSelectTask(task)}>
                            <div className="flex items-center gap-2 mb-1">
                                {isEditingTime ? (
                                    <div className="flex items-center gap-2">
                                        <input type="time" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} onBlur={handleTimeSave} autoFocus className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"/>
                                        <button onClick={(e) => { e.stopPropagation(); handleTimeSave(); }} className="p-1 rounded-full bg-green-600/50 hover:bg-green-500"><CheckCircleIcon className="w-5 h-5"/></button>
                                        <button onClick={(e) => { e.stopPropagation(); setIsEditingTime(false); setTimeValue(task.time || ''); }} className="p-1 rounded-full bg-gray-600/50 hover:bg-gray-500"><XMarkIcon className="w-5 h-5"/></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-cyan-300 font-mono text-sm font-bold" onClick={(e) => {e.stopPropagation(); setIsEditingTime(true);}}>
                                        <ClockIcon className="w-4 h-4" />
                                        {task.time || "--:--"}
                                    </div>
                                )}
                                {task.recurringMasterId && <RepeatIcon className="w-4 h-4 text-gray-400 flex-shrink-0" title="Recurring Mission" />}
                                <p id={`task-desc-${task.id}`} className={`${isCompleted ? 'text-gray-400 line-through' : 'text-white'}`}>{task.description}</p>
                            </div>
                            <div className="flex items-center flex-wrap text-xs text-gray-400 gap-x-4 gap-y-1">
                                <BetIndicator />
                                <GoalAlignmentStars score={task.goalAlignment} />
                                <div className="flex items-center gap-2">
                                    <span className={`w-3 h-3 rounded-full ${getDifficultyClass(task.difficulty)}`}></span>
                                    <span>{task.difficulty} ({formatCurrency(basePotentialReward)})</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${categoryColor.bg} ${categoryColor.text}`}>
                                    {task.category}
                                </span>
                                {alignedGoal?.label && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getCategoryColor(alignedGoal.label).bg} ${getCategoryColor(alignedGoal.label).text}`}>
                                        {alignedGoal.label}
                                    </span>
                                )}
                                <span>
                                    {isCompleted && task.actualTime != null 
                                        ? `Est: ${task.estimatedTime}m / Actual: ${task.actualTime}m`
                                        : `Est: ${task.estimatedTime}m`
                                    }
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                             {task.justification && (
                                <button onClick={() => setIsRationaleVisible(!isRationaleVisible)} className={`p-1 rounded-full transition-colors ${isRationaleVisible ? 'bg-yellow-500/50 text-yellow-300' : 'text-gray-500 hover:text-yellow-400'}`} title="Show Rationale">
                                    <LightBulbIcon className="w-5 h-5" />
                                </button>
                            )}
                            {!task.story && (
                                <button onClick={() => onGenerateStory(date, task)} className="text-gray-500 hover:text-yellow-400 transition-colors" title={`Generate briefing for: ${task.description}`} aria-label={`Generate briefing for: ${task.description}`}>
                                    <SparklesIcon />
                                </button>
                            )}
                            <button onClick={() => onEditTask(task)} className="text-gray-500 hover:text-cyan-400 transition-colors" aria-label={`Edit task: ${task.description}`}>
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => onDeleteTask(date, task)} className="text-gray-500 hover:text-red-500 transition-colors" aria-label={`Delete task: ${task.description}`}>
                                <TrashIcon />
                            </button>
                        </div>
                    </div>
                     {isRationaleVisible && task.justification && <RationaleDisplay justification={task.justification} />}
                </div>
            </div>
        </div>
    );
}


// --- Day View ---
interface DayViewProps {
  tasksForDay: Task[];
  date: string;
  onToggleTask: (date: string, task: Task) => void;
  onDeleteTask: (date: string, task: Task) => void;
  onEditTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onUpdateTime: (date: string, task: Task, time: string | null) => void;
  onGenerateStory: (date: string, task: Task) => void;
  selectedTaskId: string | null;
  diaryEntry: DiaryEntry | undefined;
  onSaveInitialReflection: (date: string, reflection: string) => void;
  onSaveDebrief: (date: string, debrief: string) => void;
  isGeneratingFeedback: boolean;
  goals: Goal[];
}
const DayView: React.FC<DayViewProps> = ({ tasksForDay, date, onToggleTask, onDeleteTask, onEditTask, onSelectTask, onUpdateTime, onGenerateStory, selectedTaskId, diaryEntry, onSaveInitialReflection, onSaveDebrief, isGeneratingFeedback, goals }) => {
  const sortedTasks = [...tasksForDay].sort((a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1; // tasks with time come first
    if (b.time) return 1;
    return 0; // retain original order for tasks without time
  });
  
  const hasTasks = sortedTasks.length > 0;
  const incompleteTasks = hasTasks ? sortedTasks.filter(t => !t.completed) : [];
  const completedTasks = hasTasks ? sortedTasks.filter(t => t.completed) : [];

  return (
    <div className="pt-4">
        {hasTasks ? (
             <div className="space-y-3">
                {incompleteTasks.map(task => <TaskItem key={task.id} task={task} date={date} onToggleTask={onToggleTask} onDeleteTask={onDeleteTask} onEditTask={onEditTask} onSelectTask={onSelectTask} onUpdateTime={onUpdateTime} onGenerateStory={onGenerateStory} isSelected={task.id === selectedTaskId} goals={goals} />)}
                {completedTasks.map(task => <TaskItem key={task.id} task={task} date={date} onToggleTask={onToggleTask} onDeleteTask={onDeleteTask} onEditTask={onEditTask} onSelectTask={onSelectTask} onUpdateTime={onUpdateTime} onGenerateStory={onGenerateStory} isSelected={task.id === selectedTaskId} goals={goals} />)}
             </div>
        ) : (
             <div className="text-center py-10">
                <p className="text-gray-400">No missions scheduled for this day.</p>
                <p className="text-gray-500 italic">Is it a rest day, or are you getting soft?</p>
            </div>
        )}
       
        <Diary
            entry={diaryEntry}
            date={date}
            onSaveReflection={onSaveInitialReflection}
            onSaveDebrief={onSaveDebrief}
            isLoading={isGeneratingFeedback}
        />
    </div>
  );
};


// --- Week View ---
interface WeekViewProps {
    displayDate: Date;
    scores: DailyScore[];
    selectedDate: string;
    onDateSelect: (date: string) => void;
    getTasksForDate: (date: string) => Task[];
    diaryEntries: { [key: string]: DiaryEntry };
}
const WeekView: React.FC<WeekViewProps> = ({ displayDate, scores, selectedDate, onDateSelect, getTasksForDate, diaryEntries }) => {
    const scoresMap = new Map<string, number>(scores.map(s => [s.date, s.earnings]));

    const startOfWeek = new Date(displayDate);
    startOfWeek.setDate(displayDate.getDate() - displayDate.getDay()); // Start on Sunday

    const weekDays = Array.from({ length: 7 }).map((_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return date;
    });

    return (
        <div className="grid grid-cols-7 border-t border-l border-gray-700">
            {weekDays.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const score = scoresMap.get(dateStr) || 0;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === getLocalDateString();
                const tasks = getTasksForDate(dateStr).sort((a, b) => {
                    if (a.time && b.time) return a.time.localeCompare(b.time);
                    if (a.time) return -1;
                    if (b.time) return 1;
                    return 0;
                });
                const tasksToShow = tasks.slice(0, 3);
                const hasDiaryEntry = !!diaryEntries[dateStr];

                return (
                    <div 
                        key={dateStr}
                        onClick={() => onDateSelect(dateStr)}
                        className={`p-2 h-40 flex flex-col cursor-pointer transition-all duration-200 border-r border-b border-gray-700 ${getScoreColor(score)}
                          ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''}
                          ${isToday && !isSelected ? 'border-2 border-orange-500' : ''}`}
                    >
                        <div className="flex-grow overflow-hidden">
                            <div className="flex justify-between items-center">
                                <span className={`text-sm font-bold ${isToday ? 'text-orange-400' : 'text-gray-300'}`}>
                                    {date.toLocaleDateString('default', { weekday: 'short' })} {date.getDate()}
                                </span>
                                {hasDiaryEntry && <PencilSquareIcon className="w-4 h-4 text-cyan-300" title="Debrief Logged" />}
                            </div>
                             <ul className="text-xs mt-2 space-y-1 pr-1">
                                {tasksToShow.map(task => (
                                    <li key={task.id} className={`flex items-start gap-2 ${task.completed ? 'text-gray-500 line-through opacity-70' : 'text-gray-200'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${getCategoryColor(task.category).dot}`}></div>
                                        <span className="truncate">{task.time ? <span className="font-mono text-cyan-400">{task.time}</span> : ''} {task.description}</span>
                                    </li>
                                ))}
                                {tasks.length > 3 && (
                                    <li className="text-gray-400 text-xs mt-1 italic">
                                        + {tasks.length - 3} more
                                    </li>
                                )}
                            </ul>
                        </div>
                        {score > 0 && <span className="text-lg font-black text-white self-end mt-1">{formatCurrency(score)}</span>}
                    </div>
                );
            })}
        </div>
    );
};


// --- Month View ---
interface MonthViewProps {
  displayDate: Date;
  scores: DailyScore[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  getTasksForDate: (date: string) => Task[];
  diaryEntries: { [key: string]: DiaryEntry };
}
const MonthView: React.FC<MonthViewProps> = ({ displayDate, scores, selectedDate, onDateSelect, getTasksForDate, diaryEntries }) => {
    const scoresMap = new Map<string, number>(scores.map(s => [s.date, s.earnings]));

    const startOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1);
    const endOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0);
    const startDayOfWeek = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
        days.push(<div key={`empty-start-${i}`} className="border-r border-b border-gray-700"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(displayDate.getFullYear(), displayDate.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        const score = scoresMap.get(dateStr) || 0;
        const isSelected = dateStr === selectedDate;
        const isToday = dateStr === getLocalDateString();
        const tasks = getTasksForDate(dateStr);
        const incompleteTaskCount = tasks.filter(t => !t.completed).length;
        const hasDiaryEntry = !!diaryEntries[dateStr];

        days.push(
            <div key={day} onClick={() => onDateSelect(dateStr)}
                className={`p-2 h-24 flex flex-col cursor-pointer transition-all duration-200 border-r border-b border-gray-700 ${getScoreColor(score)}
                  ${isSelected ? 'ring-2 ring-offset-2 ring-offset-gray-900 ring-white' : ''}
                  ${isToday && !isSelected ? 'border-2 border-orange-500' : ''}`}
                role="button" aria-pressed={isSelected} aria-label={`Date ${date.toLocaleDateString()}, Earnings: ${formatCurrency(score)}`}
            >
                <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold self-start ${isToday ? 'text-orange-400' : 'text-gray-300'}`}>{day}</span>
                     <div className="flex items-center gap-1">
                        {hasDiaryEntry && <PencilSquareIcon className="w-4 h-4 text-cyan-300" title="Debrief Logged" />}
                        {incompleteTaskCount > 0 && (
                            <span className="text-xs font-bold text-yellow-300 bg-yellow-900/60 px-1.5 py-0.5 rounded-full">
                                {incompleteTaskCount}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex-grow"></div>
                {score > 0 && <span className="text-lg font-black text-white self-end">{formatCurrency(score)}</span>}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-7 text-sm border-t border-l border-gray-700">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-bold uppercase text-gray-400 p-2 border-r border-b border-gray-700">{day}</div>
            ))}
            {days}
        </div>
    );
};


// --- Calendar Container ---
interface CalendarContainerProps {
    view: CalendarViewType;
    onViewChange: (view: CalendarViewType) => void;
    selectedDate: string;
    onDateSelect: (date: string) => void;
    scores: DailyScore[];
    tasks: { [key: string]: Task[] };
    recurringTasks: RecurringTask[];
    userCategories: string[];
    onAddTask: (taskData: { description: string, difficulty: TaskDifficulty, date: string, category: string, recurrenceRule: 'None' | RecurrenceRule, estimatedTime: number, time?: string }) => void;
    onToggleTask: (date: string, task: Task) => void;
    onDeleteTask: (date: string, task: Task) => void;
    onEditTask: (task: Task) => void;
    onSelectTask: (task: Task) => void;
    onUpdateTime: (date: string, task: Task, time: string | null) => void;
    onGenerateStory: (date: string, task: Task) => void;
    selectedTaskId: string | null;
    getTasksForDate: (date: string) => Task[];
    diaryEntries: { [key: string]: DiaryEntry };
    goals: Goal[];
    onSaveInitialReflection: (date: string, reflection: string) => void;
    onSaveDebrief: (date: string, debrief: string) => void;
    isGeneratingFeedback: boolean;
}
export const CalendarContainer: React.FC<CalendarContainerProps> = ({ 
    view, onViewChange, selectedDate, onDateSelect, scores, recurringTasks, userCategories, tasks,
    onAddTask, onToggleTask, onDeleteTask, onEditTask, onSelectTask, onUpdateTime, onGenerateStory, selectedTaskId, getTasksForDate,
    diaryEntries, goals, onSaveInitialReflection, onSaveDebrief, isGeneratingFeedback
}) => {
    const [displayDate, setDisplayDate] = useState(new Date(selectedDate.replace(/-/g, '/')));

    const tasksForSelectedDay = getTasksForDate(selectedDate);

    const handleNav = (offset: number) => {
        setDisplayDate(prev => {
            const newDate = new Date(prev);
            if (view === 'month') newDate.setMonth(prev.getMonth() + offset);
            else if (view === 'week') newDate.setDate(prev.getDate() + offset * 7);
            else if (view === 'day') {
                const dayDate = new Date(selectedDate.replace(/-/g, '/'));
                dayDate.setDate(dayDate.getDate() + offset);
                onDateSelect(dayDate.toISOString().split('T')[0]);
                return dayDate;
            }
            return newDate;
        });
    };
    
    const renderHeaderTitle = (): React.ReactNode => {
        if (view === 'objective') return 'Objective Heatmap';
        if (view === 'all') return 'All Missions';
        const date = view === 'day' ? new Date(selectedDate.replace(/-/g, '/')) : displayDate;
        if (view === 'month') return date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (view === 'week') {
            const start = new Date(date);
            start.setDate(date.getDate() - date.getDay());
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.toLocaleString('default', { month: 'short' })} ${getDayWithSuffix(start.getDate())} - ${end.toLocaleString('default', { month: 'short' })} ${getDayWithSuffix(end.getDate())}, ${end.getFullYear()}`;
        }
        if (view === 'day') {
            const hasDiary = !!diaryEntries[selectedDate];
            return (
                <div className="flex items-center justify-center gap-2">
                    {date.toLocaleString('default', { weekday: 'long', month: 'long', day: 'numeric' })}
                    {hasDiary && <PencilSquareIcon className="w-5 h-5 text-cyan-300" title="Debrief Logged" />}
                </div>
            )
        }
        return '';
    };

    const ViewButton: React.FC<{targetView: CalendarViewType, children: React.ReactNode}> = ({ targetView, children }) => (
        <button
            onClick={() => onViewChange(targetView)}
            className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${view === targetView ? 'bg-orange-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
        >{children}</button>
    );

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg border border-gray-700">
            <div className="mb-4">
                <div className="flex flex-wrap items-center justify-center gap-2 mb-4 border-b border-gray-700 pb-4">
                    <ViewButton targetView="month">Month</ViewButton>
                    <ViewButton targetView="week">Week</ViewButton>
                    <ViewButton targetView="day">Day</ViewButton>
                    <ViewButton targetView="all">All</ViewButton>
                    <ViewButton targetView="objective">
                        <span className="flex items-center gap-1"><ChartBarSquareIcon className="w-4 h-4" /> Objective</span>
                    </ViewButton>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex-1 flex justify-start">
                        {view !== 'all' && view !== 'objective' && <button onClick={() => handleNav(-1)} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Previous period"> <ChevronLeftIcon /> </button>}
                    </div>
                    <h2 className="text-xl font-bold uppercase tracking-wider text-center flex-shrink-0 px-2 sm:px-4"> {renderHeaderTitle()} </h2>
                    <div className="flex-1 flex justify-end">
                        {view !== 'all' && view !== 'objective' && <button onClick={() => handleNav(1)} className="p-1 rounded-full hover:bg-gray-700 transition-colors" aria-label="Next period"> <ChevronRightIcon /> </button>}
                    </div>
                </div>
            </div>
            {view === 'month' && <MonthView displayDate={displayDate} scores={scores} selectedDate={selectedDate} onDateSelect={onDateSelect} getTasksForDate={getTasksForDate} diaryEntries={diaryEntries} />}
            {view === 'week' && <WeekView displayDate={displayDate} scores={scores} selectedDate={selectedDate} onDateSelect={onDateSelect} getTasksForDate={getTasksForDate} diaryEntries={diaryEntries} />}
            {view === 'day' && <DayView 
                tasksForDay={tasksForSelectedDay} 
                date={selectedDate} 
                onToggleTask={onToggleTask} 
                onDeleteTask={onDeleteTask} 
                onEditTask={onEditTask}
                onSelectTask={onSelectTask} 
                onUpdateTime={onUpdateTime}
                onGenerateStory={onGenerateStory}
                selectedTaskId={selectedTaskId} 
                diaryEntry={diaryEntries[selectedDate]}
                onSaveInitialReflection={onSaveInitialReflection}
                onSaveDebrief={onSaveDebrief}
                isGeneratingFeedback={isGeneratingFeedback}
                goals={goals}
                />}
            {view === 'all' && <AllTasksView tasks={tasks} recurringTasks={recurringTasks} userCategories={userCategories} onAddTask={(data) => onAddTask({...data, recurrenceRule: 'None'})} onToggleTask={onToggleTask} onEditTask={onEditTask} goals={goals} />}
            {view === 'objective' && <ObjectiveHeatmapView goals={goals} getTasksForDate={getTasksForDate} />}
        </div>
    );
};
