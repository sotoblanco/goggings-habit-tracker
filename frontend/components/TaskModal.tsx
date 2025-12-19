

import React, { useState } from 'react';
import { TaskDifficulty, RecurrenceRule } from '../types';
import { enhanceText } from '../services/geminiService';
import { SparklesIcon, RepeatIcon, CheckCircleIcon, XMarkIcon, BoltIcon } from './Icons';

type RecurrenceOption = 'None' | RecurrenceRule;

interface TaskInputProps {
  onAddTask: (task: { description: string, difficulty: TaskDifficulty, date: string, category: string, recurrenceRule: RecurrenceOption, estimatedTime: number, time?: string }) => void;
  userCategories: string[];
  onAIAssignedTask: () => void;
  isAssigningTask: boolean;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask, userCategories, onAIAssignedTask, isAssigningTask }) => {
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<TaskDifficulty>(TaskDifficulty.MEDIUM);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<string>('');
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceOption>('None');
  const [estimatedTime, setEstimatedTime] = useState<number>(30);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [time, setTime] = useState('');

  // State for AI enhancement
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhance = async () => {
    if (!description.trim()) return;
    setIsEnhancing(true);
    setAiSuggestion(null);
    const suggestion = await enhanceText(description, 'mission');
    setAiSuggestion(suggestion);
    setIsEnhancing(false);
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      setDescription(aiSuggestion);
    }
    setAiSuggestion(null);
  };

  const handleRejectSuggestion = () => {
    setAiSuggestion(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim() && date && category.trim() && estimatedTime > 0) {
      onAddTask({ description, difficulty, date, category: category.trim(), recurrenceRule, estimatedTime, time: showTimeInput ? time : undefined });
      setDescription('');
      setDifficulty(TaskDifficulty.MEDIUM);
      setCategory('');
      setRecurrenceRule('None');
      setEstimatedTime(30);
      setShowTimeInput(false);
      setTime('');
      setAiSuggestion(null);
    }
  };
  
  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the mission? Get specific."
            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 pr-10"
            aria-label="New task description"
            required
          />
          <button
            type="button"
            onClick={handleEnhance}
            disabled={isEnhancing || !description.trim()}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Enhance with AI"
          >
            <SparklesIcon className="w-5 h-5" />
          </button>
        </div>

        {isEnhancing && <p className="text-sm text-yellow-400 animate-pulse-fast">Goggins is hardening your mission...</p>}
        
        {aiSuggestion && !isEnhancing && (
            <div className="p-3 bg-gray-900/50 border border-orange-500 rounded-lg space-y-2 animate-fade-in">
                <p className="text-sm text-orange-400 font-bold">AI Suggestion:</p>
                <p className="text-white">{aiSuggestion}</p>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={handleRejectSuggestion} className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded bg-red-800 hover:bg-red-700 text-white transition-colors"><XMarkIcon className="w-4 h-4" /> Reject</button>
                    <button type="button" onClick={handleEnhance} className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded bg-blue-800 hover:bg-blue-700 text-white transition-colors"><RepeatIcon className="w-4 h-4" /> Regenerate</button>
                    <button type="button" onClick={handleAcceptSuggestion} className="flex items-center gap-1 px-3 py-1 text-xs font-bold rounded bg-green-800 hover:bg-green-700 text-white transition-colors"><CheckCircleIcon className="w-4 h-4" /> Accept</button>
                </div>
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="task-date" className="block text-sm font-medium text-gray-400 mb-1">
              {recurrenceRule === 'None' ? 'Date' : 'Start Date'}
            </label>
            <input
              type="date"
              id="task-date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Task date"
              required
            />
          </div>
          <div>
            <label htmlFor="task-difficulty" className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
            <select
              id="task-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as TaskDifficulty)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Task difficulty"
            >
              {Object.values(TaskDifficulty).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
           <div>
            <label htmlFor="task-recurrence" className="block text-sm font-medium text-gray-400 mb-1">Recurrence</label>
            <select
              id="task-recurrence"
              value={recurrenceRule}
              onChange={(e) => setRecurrenceRule(e.target.value as RecurrenceOption)}
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Task recurrence"
            >
              <option value="None">None</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Weekdays">Weekdays</option>
              <option value="Weekends">Weekends</option>
            </select>
          </div>
          <div>
            <label htmlFor="task-category" className="block text-sm font-medium text-gray-400 mb-1">Category</label>
            <input
              id="task-category"
              type="text"
              list="category-list"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Physical Training"
              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              aria-label="Task category"
              required
            />
            <datalist id="category-list">
              {userCategories.map(c => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div>
                <label htmlFor="task-estimated-time" className="block text-sm font-medium text-gray-400 mb-1">Estimated Time (minutes)</label>
                <input
                id="task-estimated-time"
                type="number"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(Number(e.target.value) > 0 ? Number(e.target.value) : 1)}
                min="1"
                className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Estimated time in minutes"
                required
                />
            </div>
            {showTimeInput ? (
                 <div>
                    <label htmlFor="task-time" className="block text-sm font-medium text-gray-400 mb-1">Time (Optional)</label>
                    <input
                        id="task-time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        aria-label="Task time"
                    />
                </div>
            ) : <div/>}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
             <input
                type="checkbox"
                id="show-time-checkbox"
                checked={showTimeInput}
                onChange={(e) => setShowTimeInput(e.target.checked)}
                className="w-4 h-4 bg-gray-600 border-gray-500 rounded text-orange-500 focus:ring-orange-600 cursor-pointer"
            />
            <label htmlFor="show-time-checkbox" className="cursor-pointer">Set Time</label>
        </div>
         <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider">Add Mission</button>
      </form>
       <div className="relative py-2 mt-4">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center">
            <span className="bg-gray-800 px-2 text-sm font-semibold text-gray-400 uppercase">Or</span>
        </div>
    </div>
     <button 
        type="button"
        onClick={onAIAssignedTask}
        disabled={isAssigningTask}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider disabled:bg-indigo-800 disabled:cursor-wait"
    >
        {isAssigningTask ? (
            <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Goggins is Choosing...</span>
            </>
        ) : (
            <>
                <BoltIcon className="w-5 h-5" />
                GET GOGGINS' CHOICE
            </>
        )}
    </button>
    </div>
  );
};
