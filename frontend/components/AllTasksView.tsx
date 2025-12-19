
import React, { useState, useMemo } from 'react';
import { Task, RecurringTask, TaskInstance, TaskDifficulty, Goal } from '../types';
import { DIFFICULTY_REWARDS, getCategoryColor, TIME_REWARD_PER_MINUTE } from '../constants';
import { RepeatIcon, ChevronUpIcon, ChevronDownIcon, StarIcon, PencilIcon } from './Icons';
import { isRecurringOnDate, getDatesInRange, getLocalDateString } from '../utils/dateUtils';

interface AllTasksViewProps {
    tasks: { [key: string]: Task[] };
    recurringTasks: RecurringTask[];
    userCategories: string[];
    onToggleTask: (date: string, task: Task) => void;
    onEditTask: (task: TaskInstance) => void;
    onAddTask: (taskData: { description: string, difficulty: TaskDifficulty, date: string, category: string, recurrenceRule: 'None', estimatedTime: number }) => void;
    goals: Goal[];
}


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

type SortableKeys = 'date' | 'time' | 'category' | 'difficulty' | 'earnings' | 'completed' | 'estimatedTime' | 'actualTime' | 'goalAlignment';
type SortDirection = 'asc' | 'desc';

const SortableHeader: React.FC<{
    title: string;
    sortKey: SortableKeys;
    sortConfig: { key: SortableKeys; direction: SortDirection } | null;
    requestSort: (key: SortableKeys) => void;
    className?: string;
}> = ({ title, sortKey, sortConfig, requestSort, className }) => {
    const isSorted = sortConfig?.key === sortKey;
    const direction = isSorted ? sortConfig.direction : null;
    return (
        <th scope="col" className={`px-4 py-3 cursor-pointer ${className}`} onClick={() => requestSort(sortKey)}>
            <div className="flex items-center gap-1">
                {title}
                {isSorted ? (direction === 'asc' ? <ChevronUpIcon /> : <ChevronDownIcon />) : <span className="w-4 h-4"></span>}
            </div>
        </th>
    );
};

export const AllTasksView: React.FC<AllTasksViewProps> = ({ tasks, recurringTasks, userCategories, onToggleTask, onEditTask, onAddTask, goals }) => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(getLocalDateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(getLocalDateString(today));
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: SortDirection } | null>({ key: 'date', direction: 'desc' });

    // State for the add task form
    const [newDescription, setNewDescription] = useState('');
    const [newDate, setNewDate] = useState(getLocalDateString());
    const [newCategory, setNewCategory] = useState(userCategories[0] || '');
    const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>(TaskDifficulty.MEDIUM);
    const [newEstimatedTime, setNewEstimatedTime] = useState(30);
    
    const handleAddTask = () => {
        if (newDescription.trim() && newDate && newCategory.trim() && newEstimatedTime > 0) {
            onAddTask({
                description: newDescription,
                difficulty: newDifficulty,
                date: newDate,
                category: newCategory,
                recurrenceRule: 'None',
                estimatedTime: newEstimatedTime,
            });
            // Reset form
            setNewDescription('');
            setNewEstimatedTime(30);
        }
    };


    const allTaskInstances = useMemo<TaskInstance[]>(() => {
        let instances: TaskInstance[] = [];

        // Add single tasks
        // FIX: Replaced `Object.entries` with `Object.keys` to resolve a type inference issue where
        // the value was being inferred as 'unknown', causing an error on the call to `.map`.
        for (const date of Object.keys(tasks)) {
            const dateTasks = tasks[date];
            instances.push(...dateTasks.map(t => ({ ...t, date })));
        }

        // Generate recurring task instances for a wide range to ensure they're available for filtering
        const rangeStart = new Date();
        rangeStart.setFullYear(rangeStart.getFullYear() - 1);
        const rangeEnd = new Date();
        rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);
        
        const dateRange = getDatesInRange(rangeStart, rangeEnd);
        
        for (const rt of recurringTasks) {
            for (const date of dateRange) {
                const dateStr = date.toISOString().split('T')[0];
                if (isRecurringOnDate(rt, dateStr)) {
                    instances.push({
                        id: `${rt.id}_${dateStr}`,
                        recurringMasterId: rt.id,
                        description: rt.description,
                        difficulty: rt.difficulty,
                        category: rt.category,
                        story: rt.story,
                        completed: rt.completions[dateStr]?.completed || false,
                        estimatedTime: rt.estimatedTime,
                        actualTime: rt.completions[dateStr]?.actualTime || null,
                        date: dateStr,
                        goalAlignment: rt.goalAlignment,
                        alignedGoalId: rt.alignedGoalId,
                        time: rt.completions[dateStr]?.time || rt.time,
                    });
                }
            }
        }
        
        return instances;
    }, [tasks, recurringTasks]);
    
    const filteredAndSortedTasks = useMemo(() => {
        let filtered = allTaskInstances.filter(task => {
            const taskDate = task.date;
            const categoryMatch = selectedCategory === 'All' || task.category === selectedCategory;
            return taskDate >= startDate && taskDate <= endDate && categoryMatch;
        });

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                let aValue: any;
                let bValue: any;

                if (sortConfig.key === 'earnings') {
                    const calcEarnings = (task: TaskInstance) => {
                        const baseReward = DIFFICULTY_REWARDS[task.difficulty] || 0;
                        const timeReward = (task.actualTime ?? task.estimatedTime) * TIME_REWARD_PER_MINUTE;
                        const goalAlignmentMultiplier = (task.goalAlignment || 3) / 5;
                        return (baseReward + timeReward) * goalAlignmentMultiplier;
                    }
                    aValue = calcEarnings(a);
                    bValue = calcEarnings(b);
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }
                
                if (aValue === undefined || aValue === null) aValue = sortConfig.direction === 'asc' ? 'zzz' : '';
                if (bValue === undefined || bValue === null) bValue = sortConfig.direction === 'asc' ? 'zzz' : '';

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return filtered;
    }, [allTaskInstances, startDate, endDate, selectedCategory, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: SortDirection = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    return (
        <div className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <div>
                    <label htmlFor="start-date" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                    <input
                        type="date"
                        id="start-date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div>
                    <label htmlFor="end-date" className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                    <input
                        type="date"
                        id="end-date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                </div>
                <div>
                    <label htmlFor="category-filter" className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                    <select
                        id="category-filter"
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        <option value="All">All Categories</option>
                        {userCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            <div className="max-h-[600px] overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                            <SortableHeader title="Date" sortKey="date" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader title="Time" sortKey="time" sortConfig={sortConfig} requestSort={requestSort} />
                            <SortableHeader title="Align" sortKey="goalAlignment" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                            <th scope="col" className="px-4 py-3">Description</th>
                            <SortableHeader title="Category" sortKey="category" sortConfig={sortConfig} requestSort={requestSort} />
                            <th scope="col" className="px-4 py-3">Aligned Goal</th>
                            <SortableHeader title="Difficulty" sortKey="difficulty" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                            <SortableHeader title="Est. Time" sortKey="estimatedTime" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                            <SortableHeader title="Actual Time" sortKey="actualTime" sortConfig={sortConfig} requestSort={requestSort} className="text-right" />
                            <SortableHeader title="Status" sortKey="completed" sortConfig={sortConfig} requestSort={requestSort} className="text-center" />
                            <th scope="col" className="px-4 py-3 text-center">Edit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedTasks.map((task) => {
                            const categoryColor = getCategoryColor(task.category);
                            const alignedGoal = goals.find(g => g.id === task.alignedGoalId);
                            return (
                                <tr key={task.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                                    <td className="px-4 py-2 text-gray-300 whitespace-nowrap">
                                        {new Date(task.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-2 text-cyan-300 font-mono whitespace-nowrap">{task.time || '-'}</td>
                                    <td className="px-4 py-2 text-center">
                                        {typeof task.goalAlignment === 'number' && (
                                            <div className="flex items-center justify-center gap-0.5" title={`Goal Alignment: ${task.goalAlignment}/5`}>
                                                {Array.from({ length: 5 }).map((_, i) => (
                                                    <StarIcon key={i} className={`w-4 h-4 ${i < (task.goalAlignment || 0) ? 'text-yellow-400' : 'text-gray-600'}`} />
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-white flex items-center gap-2">
                                        {task.recurringMasterId && <RepeatIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                                        {task.description}
                                    </td>
                                    <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${categoryColor.bg} ${categoryColor.text}`}>
                                            {task.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-2">
                                        {alignedGoal && alignedGoal.label && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getCategoryColor(alignedGoal.label).bg} ${getCategoryColor(alignedGoal.label).text}`}>
                                                {alignedGoal.label}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-gray-300 text-right">{task.difficulty}</td>
                                    <td className="px-4 py-2 text-gray-300 text-right">{task.estimatedTime}m</td>
                                    <td className="px-4 py-2 text-white font-bold text-right">{task.actualTime != null ? `${task.actualTime}m` : '-'}</td>
                                    <td className="px-4 py-2 text-center">
                                       <button
                                            onClick={() => onToggleTask(task.date, task)}
                                            className={`px-2 py-1 rounded-full text-xs font-bold w-20 transition-colors ${
                                                task.completed
                                                    ? 'bg-green-900/70 text-green-400 hover:bg-green-800'
                                                    : 'bg-red-900/70 text-red-400 hover:bg-red-800'
                                            }`}
                                            aria-label={`Mark task as ${task.completed ? 'incomplete' : 'complete'}`}
                                        >
                                            {task.completed ? 'Done' : 'Pending'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                        <button
                                            onClick={() => onEditTask(task)}
                                            className="p-1 text-gray-400 hover:text-cyan-400"
                                            aria-label={`Edit task: ${task.description}`}
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                     <tfoot className="bg-gray-800/60 sticky bottom-0">
                        <tr>
                            <td className="p-2" colSpan={3}>
                                <input
                                    type="date"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    aria-label="New mission date"
                                />
                            </td>
                            <td className="p-2">
                                <input
                                    type="text"
                                    value={newDescription}
                                    onChange={(e) => setNewDescription(e.target.value)}
                                    placeholder="New mission description..."
                                    className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    aria-label="New mission description"
                                />
                            </td>
                            <td className="p-2">
                                <input
                                    type="text"
                                    list="all-tasks-category-list"
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    aria-label="New mission category"
                                />
                                <datalist id="all-tasks-category-list">
                                    {userCategories.map(c => <option key={c} value={c} />)}
                                </datalist>
                            </td>
                            <td className="p-2"></td>
                             <td className="p-2">
                                <select
                                    value={newDifficulty}
                                    onChange={(e) => setNewDifficulty(e.target.value as TaskDifficulty)}
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    aria-label="New mission difficulty"
                                >
                                    {Object.values(TaskDifficulty).map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </td>
                             <td className="p-2" colSpan={2}>
                               <input
                                    type="number"
                                    value={newEstimatedTime}
                                    onChange={(e) => setNewEstimatedTime(Number(e.target.value) > 0 ? Number(e.target.value) : 1)}
                                    min="1"
                                    placeholder="Est. Mins"
                                    className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                                    aria-label="New mission estimated time"
                                />
                            </td>
                            <td className="p-2 text-center">
                                <button 
                                    onClick={handleAddTask}
                                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-1 px-2 rounded transition-colors text-xs uppercase"
                                    disabled={!newDescription.trim() || !newDate || !newCategory.trim()}
                                >
                                    Add
                                </button>
                            </td>
                            <td className="p-2"></td>
                        </tr>
                    </tfoot>
                </table>
                 {filteredAndSortedTasks.length === 0 && (
                    <div className="text-center py-10 text-gray-400">
                        No missions found for the selected criteria.
                    </div>
                )}
            </div>
        </div>
    );
};
