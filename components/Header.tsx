import React from 'react';
import { FireIcon } from './Icons';
import { getRank } from '../constants';

interface HeaderProps {
  totalGP: number;
}

export const Header: React.FC<HeaderProps> = ({ totalGP }) => {
  const { current: currentRank, next: nextRank } = getRank(totalGP);

  let progressPercentage = 100;
  if (nextRank) {
    const gpNeeded = nextRank.gpThreshold - currentRank.gpThreshold;
    const gpProgress = totalGP - currentRank.gpThreshold;
    progressPercentage = gpNeeded > 0 ? (gpProgress / gpNeeded) * 100 : 100;
  }

  return (
    <header className="py-4 px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between border-b border-gray-700 gap-4">
      <div>
        <h1 className="text-3xl font-black uppercase tracking-widest text-orange-500 flex items-center justify-center sm:justify-start gap-2">
          <FireIcon className="w-8 h-8"/>
          Goggins Grind
        </h1>
        <p className="text-gray-400 text-sm mt-1 hidden sm:block">Don't talk about it. Be about it. Stay hard.</p>
      </div>
      
      {currentRank && (
        <div className="w-full sm:w-auto flex items-center gap-4 sm:justify-end sm:ml-4 min-w-0">
          <img 
            src={currentRank.imageUrl} 
            alt={`Rank: ${currentRank.name}`}
            className="h-12 w-12 sm:h-16 sm:w-16 object-contain flex-shrink-0"
          />
          <div className="flex-grow sm:max-w-xs min-w-0">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Current Rank</p>
            <p className="text-xl sm:text-2xl font-black text-cyan-400 uppercase tracking-wider truncate" title={currentRank.name}>{currentRank.name}</p>
            
            {nextRank ? (
              <div className="mt-1">
                <div className="flex justify-between items-center text-xs text-gray-400 mb-0.5">
                  <span className="font-bold">{Math.floor(totalGP).toLocaleString()} GP</span>
                  <span className="font-semibold">{nextRank.gpThreshold.toLocaleString()} GP</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-full bg-gray-700 rounded-full h-2.5 flex-grow">
                    <div
                      className="bg-cyan-400 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  <img src={nextRank.imageUrl} alt={nextRank.name} title={`Next Rank: ${nextRank.name}`} className="h-6 w-6 object-contain flex-shrink-0" />
                </div>
              </div>
            ) : (
                <div className="mt-1">
                    <p className="text-xs text-green-400 font-bold uppercase">Max Rank Achieved!</p>
                    <div className="w-full bg-cyan-400 rounded-full h-2.5 mt-1"></div>
                </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};