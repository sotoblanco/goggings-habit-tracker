
import React from 'react';
import { DailyScore, CategoryScore, ObjectiveScore } from '../types';
import { getCategoryColor } from '../constants';
import { TrophyIcon, Bars3Icon, TagIcon, FireIcon, RibbonIcon } from './Icons';
import { CollapsibleList } from './CollapsibleList';

interface LeaderboardProps {
  scores: DailyScore[];
  streak: number;
  dailyGoal: number;
  setDailyGoal: (goal: number) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

const getGradeColor = (grade?: string): string => {
    if (!grade) return 'bg-gray-700 text-gray-300';
    const upperGrade = grade.toUpperCase();
    if (upperGrade.includes('A+')) return 'bg-yellow-500/50 text-yellow-300 border border-yellow-400 animate-pulse-fast';
    if (upperGrade.startsWith('A')) return 'bg-green-500/30 text-green-300 border border-green-400';
    if (upperGrade.startsWith('B')) return 'bg-blue-500/30 text-blue-300 border border-blue-400';
    if (upperGrade.startsWith('C')) return 'bg-yellow-600/40 text-yellow-400 border border-yellow-500';
    if (upperGrade.startsWith('D')) return 'bg-orange-600/40 text-orange-400 border border-orange-500';
    if (upperGrade.startsWith('F')) return 'bg-red-600/40 text-red-400 border border-red-500';
    return 'bg-gray-700 text-gray-300';
};

export const Leaderboard: React.FC<LeaderboardProps> = ({ scores, streak, dailyGoal, setDailyGoal }) => {
  const bestDay = scores.reduce((best, current) => {
    return current.earnings > best.earnings ? current : best;
  }, { date: '', earnings: 0, tasksCompleted: 0 });

  const rankedScores = [...scores]
    .filter(s => s.earnings > 0)
    .sort((a, b) => b.earnings - a.earnings || b.tasksCompleted - a.tasksCompleted);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-extrabold uppercase text-center text-white">Leaderboard</h2>
      
      <div className={`p-4 rounded-lg text-center transition-all ${streak > 0 ? 'bg-orange-500/10 border-2 border-orange-500' : 'bg-gray-700/50 border border-gray-600'}`}>
        <div className="flex items-center justify-center gap-3">
            <FireIcon className={`w-8 h-8 ${streak > 0 ? 'text-orange-400 animate-pulse-fast' : 'text-gray-500'}`} />
            <div>
                <p className="text-4xl font-black text-white">{streak}</p>
                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Day Streak</p>
            </div>
        </div>
        {streak === 0 && (
            <p className="text-sm text-gray-400 mt-2">Complete your daily goal to start a streak!</p>
        )}
        <div className="mt-4 flex items-center justify-center gap-2">
            <label htmlFor="daily-goal" className="text-sm font-medium text-gray-300">Daily Goal ($):</label>
            <input
                id="daily-goal"
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Number(e.target.value) >= 0 ? Number(e.target.value) : 0)}
                className="w-24 text-center bg-gray-900/50 text-white font-bold border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Set daily earnings goal"
                min="0"
                step="0.01"
            />
        </div>
      </div>
      
      {bestDay.earnings > 0 && (
        <div className="bg-yellow-500/10 border-2 border-yellow-500 p-4 rounded-lg text-center">
            <h3 className="text-lg font-bold text-yellow-400 uppercase flex items-center justify-center gap-2">
                <TrophyIcon className="w-6 h-6" />
                Best Day Ever
            </h3>
            <p className="text-sm text-gray-400">{new Date(bestDay.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <div className="flex justify-center gap-6 mt-2">
                <div>
                    <p className="text-3xl font-black text-white">{formatCurrency(bestDay.earnings)}</p>
                    <p className="text-xs text-gray-400 uppercase">Earnings</p>
                </div>
                <div>
                    <p className="text-3xl font-black text-white">{bestDay.tasksCompleted}</p>
                    <p className="text-xs text-gray-400 uppercase">Missions</p>
                </div>
            </div>
        </div>
      )}

      {rankedScores.length > 0 && (
        <div className="pt-4">
            <CollapsibleList 
                title={<div className="flex items-center gap-2"><Bars3Icon className="w-5 h-5" /><span>Daily Rankings</span></div>} 
                storageKey="goggins-leaderboard-daily-open"
                defaultOpen={true}
            >
                <div className="max-h-96 overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700">
                    <table className="w-full text-sm">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0 backdrop-blur-sm z-10">
                        <tr>
                        <th scope="col" className="px-2 sm:px-4 py-3 text-center">#</th>
                        <th scope="col" className="px-2 sm:px-4 py-3">Date</th>
                        <th scope="col" className="px-2 sm:px-4 py-3 text-center">Grade</th>
                        <th scope="col" className="px-2 sm:px-4 py-3 text-right">Earnings</th>
                        <th scope="col" className="px-2 sm:px-4 py-3 text-right">Missions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankedScores.map((score, index) => {
                                const rank = index + 1;
                                let medalIcon = null;
                                if (rank === 1) {
                                    medalIcon = <TrophyIcon className="w-5 h-5 text-yellow-400" />;
                                } else if (rank === 2) {
                                    medalIcon = <TrophyIcon className="w-5 h-5 text-gray-400" />;
                                } else if (rank === 3) {
                                    medalIcon = <TrophyIcon className="w-5 h-5 text-orange-500" />;
                                }

                                return (
                                    <tr key={score.date} className="border-b border-gray-700 last:border-b-0 hover:bg-gray-800/50">
                                        <td className="px-2 sm:px-4 py-2 font-bold text-center text-white">
                                        <div className="flex items-center justify-center gap-1">
                                            {medalIcon}
                                            <span>{rank}</span>
                                        </div>
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-gray-300 whitespace-nowrap">
                                        {new Date(score.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' })}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-center">
                                        {score.grade ? (
                                        <span className={`px-2 py-1 rounded-md text-sm font-black ${getGradeColor(score.grade)}`}>
                                            {score.grade}
                                        </span>
                                        ) : (
                                        <span className="text-gray-500">-</span>
                                        )}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 font-bold text-orange-400 text-right whitespace-nowrap">
                                        {formatCurrency(score.earnings)}
                                        </td>
                                        <td className="px-2 sm:px-4 py-2 text-blue-400 text-right">
                                        {score.tasksCompleted}
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                    </table>
                </div>
            </CollapsibleList>
        </div>
      )}
    </div>
  );
};

interface CategoryLeaderboardProps {
    scores: CategoryScore[];
}

export const CategoryLeaderboard: React.FC<CategoryLeaderboardProps> = ({ scores }) => {
    const rankedScores = [...scores].sort((a, b) => b.earnings - a.earnings || b.tasksCompleted - a.tasksCompleted);

    if (rankedScores.length === 0) {
        return null;
    }

    return (
        <>
             <CollapsibleList 
                title={<div className="flex items-center gap-2"><TagIcon className="w-5 h-5" /><span>Category Rankings</span></div>} 
                storageKey="goggins-leaderboard-category-open"
                defaultOpen={true}
            >
                <div className="max-h-80 overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-center">#</th>
                                <th scope="col" className="px-4 py-3">Category</th>
                                <th scope="col" className="px-4 py-3 text-right">Earnings</th>
                                <th scope="col" className="px-4 py-3 text-right">Missions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankedScores.map((score, index) => {
                                const categoryColor = getCategoryColor(score.category);
                                return (
                                    <tr key={score.category} className="border-b border-gray-700 hover:bg-gray-800/50">
                                        <td className="px-4 py-2 font-bold text-center text-white">{index + 1}</td>
                                        <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${categoryColor.bg} ${categoryColor.text}`}>
                                            {score.category}
                                        </span>
                                        </td>
                                        <td className="px-4 py-2 font-bold text-orange-400 text-right">{formatCurrency(score.earnings)}</td>
                                        <td className="px-4 py-2 text-blue-400 text-right">{score.tasksCompleted}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CollapsibleList>
        </>
    );
};

export const ObjectiveLeaderboard: React.FC<{ scores: ObjectiveScore[] }> = ({ scores }) => {
    const rankedScores = [...scores].sort((a, b) => b.earnings - a.earnings || b.tasksCompleted - a.tasksCompleted);

    if (rankedScores.length === 0) {
        return null;
    }

    return (
        <>
            <CollapsibleList 
                title={<div className="flex items-center gap-2"><RibbonIcon className="w-5 h-5" /><span>Objective Rankings</span></div>} 
                storageKey="goggins-leaderboard-objective-open"
                defaultOpen={true}
            >
                <div className="max-h-80 overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-700">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700/50 sticky top-0 backdrop-blur-sm">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-center">#</th>
                                <th scope="col" className="px-4 py-3">Objective</th>
                                <th scope="col" className="px-4 py-3 text-right">Earnings</th>
                                <th scope="col" className="px-4 py-3 text-right">Missions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankedScores.map((score, index) => {
                                const displayName = score.goalLabel || score.goalDescription;
                                const categoryColor = getCategoryColor(displayName);
                                return (
                                    <tr key={score.goalId} className="border-b border-gray-700 hover:bg-gray-800/50">
                                        <td className="px-4 py-2 font-bold text-center text-white">{index + 1}</td>
                                        <td className="px-4 py-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${categoryColor.bg} ${categoryColor.text} whitespace-nowrap`}>
                                            {displayName}
                                        </span>
                                        </td>
                                        <td className="px-4 py-2 font-bold text-orange-400 text-right">{formatCurrency(score.earnings)}</td>
                                        <td className="px-4 py-2 text-blue-400 text-right">{score.tasksCompleted}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </CollapsibleList>
        </>
    );
};
