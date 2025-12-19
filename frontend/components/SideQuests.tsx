
import React, { useState } from 'react';
import { SideQuest, TaskDifficulty } from '../types';
import { DIFFICULTY_REWARDS } from '../constants';
import { PlusIcon, BoltIcon, TrashIcon, PencilIcon, XMarkIcon } from './Icons';
import { getLocalDateString } from '../utils/dateUtils';
import { CollapsibleList } from './CollapsibleList';

interface SideQuestsProps {
  sideQuests: SideQuest[];
  onCompleteSideQuest: (questId: string) => void;
  onAddSideQuest: (quest: { description: string, difficulty: TaskDifficulty, dailyGoal: number }) => void;
  onDeleteSideQuest: (questId: string) => void;
  onUpdateSideQuest: (questId: string, updates: { description: string, difficulty: TaskDifficulty, dailyGoal: number }) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const getDifficultyClass = (difficulty: TaskDifficulty) => {
    switch (difficulty) {
        case TaskDifficulty.EASY: return 'border-blue-500';
        case TaskDifficulty.MEDIUM: return 'border-yellow-500';
        case TaskDifficulty.HARD: return 'border-red-600';
        case TaskDifficulty.SAVAGE: return 'border-purple-600';
        default: return 'border-gray-500';
    }
};

export const SideQuests: React.FC<SideQuestsProps> = ({ sideQuests, onCompleteSideQuest, onAddSideQuest, onDeleteSideQuest, onUpdateSideQuest }) => {
  const [newQuestDescription, setNewQuestDescription] = useState('');
  const [newQuestDifficulty, setNewQuestDifficulty] = useState<TaskDifficulty>(TaskDifficulty.EASY);
  const [newQuestDailyGoal, setNewQuestDailyGoal] = useState(1);

  const [editingQuestId, setEditingQuestId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ description: '', difficulty: TaskDifficulty.EASY, dailyGoal: 1 });
  
  const today = getLocalDateString();

  const totalQuests = sideQuests.length;
  const completedQuestsToday = sideQuests.filter(quest => (quest.completions?.[today] || 0) > 0).length;
  const progressPercentage = totalQuests > 0 ? (completedQuestsToday / totalQuests) * 100 : 0;

  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newQuestDescription.trim()) {
      onAddSideQuest({ 
        description: newQuestDescription, 
        difficulty: newQuestDifficulty,
        dailyGoal: newQuestDailyGoal,
      });
      setNewQuestDescription('');
      setNewQuestDifficulty(TaskDifficulty.EASY);
      setNewQuestDailyGoal(1);
    }
  };

  const handleStartEdit = (quest: SideQuest) => {
    setEditingQuestId(quest.id);
    setEditForm({ description: quest.description, difficulty: quest.difficulty, dailyGoal: quest.dailyGoal });
  };

  const handleCancelEdit = () => {
    setEditingQuestId(null);
  };

  const handleSaveEdit = () => {
    if (!editingQuestId) return;
    onUpdateSideQuest(editingQuestId, editForm);
    setEditingQuestId(null);
  };
  
  const visibleQuests = sideQuests.filter(quest => {
    const completionsToday = quest.completions?.[today] || 0;
    const goalMet = quest.dailyGoal > 0 && completionsToday >= quest.dailyGoal;
    return !goalMet;
  });

  return (
    <div>
       <p className="text-sm text-center text-gray-400 mb-4">Quick hits. No excuses. Earn your keep.</p>
      
      {totalQuests > 0 && (
        <div className="mb-4">
          <div className="flex justify-between items-center text-xs mb-1">
              <span className="font-bold text-gray-300 uppercase tracking-wider">Daily Progress</span>
              <span className="font-semibold text-white">{completedQuestsToday} / {totalQuests}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2.5 border border-gray-600">
              <div
                  className="bg-yellow-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
              ></div>
          </div>
        </div>
      )}

        <div className="flex flex-col min-h-0">
          <CollapsibleList title="Daily Side Quests" storageKey="goggins-sidequests-list-open" defaultOpen={true}>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
              {visibleQuests.map((quest) => {
                const completionsToday = quest.completions?.[today] || 0;
                const goalMet = quest.dailyGoal > 0 && completionsToday >= quest.dailyGoal;
                const isEditing = editingQuestId === quest.id;
                
                return isEditing ? (
                  <div key={quest.id} className="p-3 rounded-md bg-gray-900/50 border-l-4 border-orange-500 space-y-2">
                      <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                      <div className="grid grid-cols-3 gap-2">
                          <select
                              value={editForm.difficulty}
                              onChange={(e) => setEditForm(prev => ({ ...prev, difficulty: e.target.value as TaskDifficulty }))}
                              className="w-full bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500 col-span-2"
                          >
                              {Object.values(TaskDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <input
                              type="number"
                              min="0"
                              value={editForm.dailyGoal}
                              onChange={(e) => setEditForm(prev => ({ ...prev, dailyGoal: Number(e.target.value) >= 0 ? Number(e.target.value) : 0 }))}
                              className="w-full text-center bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500"
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                          <button onClick={handleCancelEdit} className="px-3 py-1 text-xs font-bold rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors">Cancel</button>
                          <button onClick={handleSaveEdit} className="px-3 py-1 text-xs font-bold rounded bg-orange-600 hover:bg-orange-700 text-white transition-colors">Save</button>
                      </div>
                  </div>
                ) : (
                  <div key={quest.id} className={`flex items-center justify-between p-3 rounded-md bg-gray-900/50 border-l-4 ${getDifficultyClass(quest.difficulty)}`}>
                    <div className="flex-grow">
                      <p className="text-white font-medium">{quest.description}</p>
                      <div className="flex items-center gap-4 mt-1">
                          <p className="text-xs text-orange-400 font-bold">{formatCurrency(DIFFICULTY_REWARDS[quest.difficulty])}</p>
                          <p className="text-xs text-gray-400 font-semibold">
                              Today: {completionsToday} / {quest.dailyGoal > 0 ? quest.dailyGoal : '∞'}
                          </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <button
                        onClick={() => onCompleteSideQuest(quest.id)}
                        disabled={goalMet}
                        className={`p-2 rounded-full bg-green-600/50 text-white transition-colors ${goalMet ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500'}`}
                        aria-label={`Complete side quest: ${quest.description}`}
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(quest)}
                        className="p-2 rounded-full bg-blue-600/50 hover:bg-blue-500 text-white transition-colors"
                        aria-label={`Edit side quest: ${quest.description}`}
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onDeleteSideQuest(quest.id)}
                        className="p-2 rounded-full bg-red-600/50 hover:bg-red-500 text-white transition-colors"
                        aria-label={`Delete side quest: ${quest.description}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CollapsibleList>
          <div className="pt-4 border-t border-gray-700 mt-4">
            <h4 className="text-md font-bold text-center text-gray-300 mb-3 uppercase">Create Custom Quest</h4>
            <form onSubmit={handleAddQuest} className="space-y-3">
              <input
                type="text"
                value={newQuestDescription}
                onChange={(e) => setNewQuestDescription(e.target.value)}
                placeholder="What's the next challenge?"
                className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <div className="grid grid-cols-3 gap-3">
                <select
                  value={newQuestDifficulty}
                  onChange={(e) => setNewQuestDifficulty(e.target.value as TaskDifficulty)}
                  className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 col-span-2"
                  aria-label="Quest difficulty"
                >
                  {Object.values(TaskDifficulty).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                 <div>
                    <label htmlFor="daily-goal-input" className="sr-only">Daily Goal</label>
                    <input
                        id="daily-goal-input"
                        type="number"
                        value={newQuestDailyGoal}
                        onChange={(e) => setNewQuestDailyGoal(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
                        min="0"
                        className="w-full text-center bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        aria-label="Daily goal for the quest"
                    />
                </div>
              </div>
               <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors">Add Quest</button>
            </form>
          </div>
        </div>
    </div>
  );
};
