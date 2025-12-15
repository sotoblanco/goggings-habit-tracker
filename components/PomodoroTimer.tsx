import React, { useState, useEffect, useRef } from 'react';
import { Goal, TaskDifficulty } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { getLocalDateString } from '../utils/dateUtils';
import { PlusIcon, CheckCircleIcon, TrashIcon } from './Icons';

const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const generateId = () => Math.random().toString(36).substring(2, 15);

interface PomodoroTask {
    id: string;
    taskName: string;
    description: string;
    category: string;
    difficulty: TaskDifficulty;
    alignedGoalId: string;
    pomodoroCount: number;
}


interface PomodoroTimerProps {
    goals: Goal[];
    userCategories: string[];
    onSessionComplete: (sessionData: {
        description: string;
        category: string;
        difficulty: TaskDifficulty;
        actualTime: number;
        alignedGoalId?: string;
    }) => void;
}


export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ goals, userCategories, onSessionComplete }) => {
    const [settings, setSettings] = useLocalStorage('goggins-pomodoro-settings', {
        work: 25,
        shortBreak: 5,
    });
    const [pomodoroLog, setPomodoroLog] = useLocalStorage<{ [date: string]: number }>(`goggins-pomodoro-log`, {});
    const [pomodoroTasks, setPomodoroTasks] = useLocalStorage<PomodoroTask[]>(`goggins-pomodoro-tasks-${getLocalDateString()}`, []);

    const [stage, setStage] = useState<'idle' | 'running' | 'paused'>('idle');
    const [timeLeft, setTimeLeft] = useState(settings.work * 60);
    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

    const [newTask, setNewTask] = useState({
        taskName: '',
        description: '',
        category: userCategories[0] || 'Deep Work',
        difficulty: TaskDifficulty.MEDIUM,
        alignedGoalId: 'none',
    });

    const intervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    
    useEffect(() => {
        audioRef.current = document.getElementById('pomodoro-alert') as HTMLAudioElement;
    }, []);
    
    const stopTimer = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    };
    
    useEffect(() => {
        if (stage === 'running') {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else {
            stopTimer();
        }
        return stopTimer;
    }, [stage]);

    useEffect(() => {
        if (timeLeft <= 0) {
            stopTimer();
            audioRef.current?.play();

            if (stage === 'running' && currentTaskId) {
                // Increment pomodoro count for the task
                setPomodoroTasks(prevTasks =>
                    prevTasks.map(t =>
                        t.id === currentTaskId
                            ? { ...t, pomodoroCount: t.pomodoroCount + 1 }
                            : t
                    )
                );

                // Update daily total log
                const today = getLocalDateString();
                setPomodoroLog(prev => ({
                    ...prev,
                    [today]: (prev[today] || 0) + 1,
                }));

                // Reset timer for the next session and keep it running
                setTimeLeft(settings.work * 60);
                 intervalRef.current = window.setInterval(() => {
                    setTimeLeft(prev => prev - 1);
                }, 1000);
            }
        }
    }, [timeLeft, stage, currentTaskId, settings.work, setPomodoroTasks, setPomodoroLog]);
    
    const handleAddTask = () => {
        if (!newTask.taskName.trim()) return;
        const task: PomodoroTask = {
            id: generateId(),
            ...newTask,
            pomodoroCount: 0,
        };
        setPomodoroTasks(prev => [...prev, task]);
        // Reset form
        setNewTask({
            taskName: '',
            description: '',
            category: userCategories[0] || 'Deep Work',
            difficulty: TaskDifficulty.MEDIUM,
            alignedGoalId: 'none',
        });
    };
    
    const handleStart = (taskId: string) => {
        setCurrentTaskId(taskId);
        setStage('running');
        setTimeLeft(settings.work * 60);
    };

    const handlePauseResume = () => {
        setStage(prev => (prev === 'running' ? 'paused' : 'running'));
    };

    const handleStop = () => {
        if (window.confirm("Are you sure you want to stop this focus session? Your progress on the current pomodoro will be lost.")) {
            stopTimer();
            setStage('idle');
            setCurrentTaskId(null);
            setTimeLeft(settings.work * 60);
        }
    };

    const handleLogAndFinish = (taskId: string) => {
        const task = pomodoroTasks.find(t => t.id === taskId);
        if (!task) return;
        
        if (task.pomodoroCount > 0) {
            const fullDescription = task.description
                ? `${task.taskName}: ${task.description} (${task.pomodoroCount} Pomodoros)`
                : `${task.taskName} (${task.pomodoroCount} Pomodoros)`;
                
            onSessionComplete({
                description: fullDescription,
                category: task.category,
                difficulty: task.difficulty,
                actualTime: task.pomodoroCount * settings.work,
                alignedGoalId: task.alignedGoalId !== 'none' ? task.alignedGoalId : undefined,
            });
        }
        // Remove task from list
        setPomodoroTasks(prev => prev.filter(t => t.id !== taskId));
    };

    const handleDelete = (taskId: string) => {
        if(window.confirm("Are you sure you want to delete this pomodoro mission?")) {
            setPomodoroTasks(prev => prev.filter(t => t.id !== taskId));
        }
    };


    const renderContent = () => {
        if (stage === 'running' || stage === 'paused') {
            const currentTask = pomodoroTasks.find(t => t.id === currentTaskId);
            if (!currentTask) {
                // Failsafe in case task is deleted while running
                handleStop();
                return null;
            }
            
            const totalDuration = settings.work * 60;
            const progress = (totalDuration - timeLeft) / totalDuration;

            return (
                <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in">
                    <div className="text-center">
                        <p className="font-bold text-gray-300 break-all">{currentTask.taskName}</p>
                        <p className="text-4xl font-black text-white h-10 flex items-center justify-center">
                            {Array.from({ length: currentTask.pomodoroCount }).map((_, i) => <span key={i} role="img" aria-label="pomodoro" className="mx-1">🍅</span>)}
                        </p>
                    </div>
                    <div className="relative w-48 h-48 flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                            <circle className="text-gray-700" strokeWidth="7" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                            <circle
                                className="text-orange-500"
                                strokeWidth="7"
                                strokeDasharray={2 * Math.PI * 45}
                                strokeDashoffset={(2 * Math.PI * 45) * (1 - progress)}
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="transparent"
                                r="45"
                                cx="50"
                                cy="50"
                                transform="rotate(-90 50 50)"
                                style={{ transition: 'stroke-dashoffset 0.5s linear' }}
                            />
                        </svg>
                        <div className="absolute text-center">
                            <p className="text-4xl font-black font-mono text-white">{formatTime(timeLeft)}</p>
                            <p className="text-sm uppercase font-bold tracking-wider text-gray-400">Focus</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleStop} className="bg-red-800/80 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Stop</button>
                        <button onClick={handlePauseResume} className="bg-blue-800/80 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase">
                            {stage === 'paused' ? 'Resume' : 'Pause'}
                        </button>
                    </div>
                </div>
            );
        }

        // Idle stage
        return (
            <div className="space-y-4">
                <div>
                    <h4 className="text-md font-bold text-center text-gray-300 uppercase tracking-wider mb-2">Today's Pomodoro Missions</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                        {pomodoroTasks.length > 0 ? pomodoroTasks.map(task => (
                             <div key={task.id} className="bg-gray-700/50 p-3 rounded-lg flex items-center justify-between gap-2">
                                <div className="flex-grow">
                                    <p className="font-bold text-white">{task.taskName}</p>
                                    <p className="text-sm text-gray-400">🍅 x {task.pomodoroCount}</p>
                                </div>
                                <div className="flex-shrink-0 flex items-center gap-1">
                                    <button onClick={() => handleLogAndFinish(task.id)} title="Log & Finish" className="p-2 text-green-400 hover:text-white hover:bg-green-600/50 rounded-full"><CheckCircleIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleDelete(task.id)} title="Delete" className="p-2 text-red-400 hover:text-white hover:bg-red-600/50 rounded-full"><TrashIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleStart(task.id)} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded uppercase text-sm">Start</button>
                                </div>
                             </div>
                        )) : <p className="text-center text-gray-500 py-4">No missions on the board. Add one to get started.</p>}
                    </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-700">
                    <h4 className="text-md font-bold text-center text-gray-300 uppercase tracking-wider">Add a New Mission</h4>
                    <input type="text" value={newTask.taskName} onChange={(e) => setNewTask(p => ({...p, taskName: e.target.value}))} placeholder="Mission Name" className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                    <textarea value={newTask.description} onChange={(e) => setNewTask(p => ({...p, description: e.target.value}))} placeholder="Description (Optional)" rows={2} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 resize-none"/>
                    <div className="grid grid-cols-2 gap-4">
                        <input type="text" list="category-list" value={newTask.category} onChange={(e) => setNewTask(p => ({...p, category: e.target.value}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2" />
                        <datalist id="category-list">{userCategories.map(c => <option key={c} value={c} />)}</datalist>
                        <select value={newTask.difficulty} onChange={(e) => setNewTask(p => ({...p, difficulty: e.target.value as TaskDifficulty}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2">
                            {Object.values(TaskDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <select value={newTask.alignedGoalId} onChange={(e) => setNewTask(p => ({...p, alignedGoalId: e.target.value}))} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2">
                        <option value="none">Align with Objective (Optional)</option>
                        {goals.map(g => <option key={g.id} value={g.id}>{g.label || g.description}</option>)}
                    </select>
                    <button onClick={handleAddTask} disabled={!newTask.taskName.trim()} className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-500/30 text-green-300 font-bold py-2 px-4 rounded transition-colors border-2 border-dashed border-green-500/50 disabled:opacity-50">
                        <PlusIcon className="w-5 h-5"/> Add to List
                    </button>
                </div>
            </div>
        );
    };

    const today = getLocalDateString();
    const pomodorosToday = pomodoroLog[today] || 0;

    return (
        <div>
            <div className="text-center mb-4">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Total Pomodoros Today</p>
                <p className="text-4xl font-black text-white">{pomodorosToday}</p>
            </div>
            {renderContent()}
             <div className="pt-4 mt-4 border-t border-gray-700 text-xs text-gray-400 flex justify-center gap-4">
                <label>Work: <input type="number" value={settings.work} onChange={e => setSettings(s => ({...s, work: Math.max(1, Number(e.target.value))}))} className="w-12 bg-gray-700 text-center rounded" />m</label>
            </div>
        </div>
    );
};