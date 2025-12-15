import React from 'react';

interface DailyCompletionBarProps {
  completed: number;
  total: number;
}

const getGogginsQuote = (percentage: number, totalTasks: number): string => {
  if (totalTasks === 0) {
    return "No missions on the board. Are you resting or are you hiding? Don't get soft.";
  }
  if (percentage === 0) {
    return "The day just started. Don't you dare waste it. Get after it!";
  }
  if (percentage <= 25) {
    return "A good start, but you're just warming up. The real work is still ahead.";
  }
  if (percentage <= 50) {
    return "You're in the fight now. Don't let up, keep taking souls.";
  }
  if (percentage <= 75) {
    return "You're pushing past the halfway mark. This is where most people quit. You're not most people.";
  }
  if (percentage < 100) {
    return "Almost there. Finish the fight. Empty the tank!";
  }
  return "Mission accomplished. What's next? Don't get complacent. Stay hard!";
};


export const DailyCompletionBar: React.FC<DailyCompletionBarProps> = ({ completed, total }) => {
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const quote = getGogginsQuote(percentage, total);

  return (
    <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300">Daily Mission Progress</h3>
        <span className="text-lg font-black text-white">{completed} / {total}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-4 border border-gray-600 overflow-hidden relative">
        <div
          className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-xs font-black text-white mix-blend-difference px-2">
                {total > 0 ? `${percentage.toFixed(0)}% Complete` : 'No Missions Today'}
            </span>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 italic mt-2">{quote}</p>
    </div>
  );
};
