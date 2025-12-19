import React, { useState } from 'react';
import { FireIcon, CogIcon } from './Icons';
import { getRank } from '../constants';
import { useAuth } from '../context/AuthContext';
import { SettingsModal } from './SettingsModal';

interface HeaderProps {
  totalGP: number;
}

export const Header: React.FC<HeaderProps> = ({ totalGP }) => {
  const { current: currentRank, next: nextRank } = getRank(totalGP);
  const { user, logout } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
          <FireIcon className="w-8 h-8" />
          Goggins Grind
        </h1>
        <p className="text-gray-400 text-sm mt-1 hidden sm:block">Don't talk about it. Be about it. Stay hard.</p>
        {user && (
          <div className="flex items-center gap-2 mt-2 sm:hidden justify-center transition-all bg-gray-800/50 p-2 rounded-lg border border-gray-700/50">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-wider">Operator:</span>
            <span className="text-white font-mono font-bold text-sm tracking-tight">{user.username}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
        {user && (
          <div className="hidden sm:flex items-center gap-3 bg-gray-900 border border-gray-700 rounded-full px-4 py-1 mb-2 shadow-sm">
            <span className="text-gray-500 text-xs font-bold uppercase tracking-wider">Operator</span>
            <span className="text-orange-100 font-mono font-bold text-sm">{user.username}</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-gray-400 hover:text-white transition-colors ml-2"
              title="Settings"
            >
              <CogIcon className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="text-xs text-red-400 hover:text-red-300 uppercase font-bold tracking-wider ml-2 border-l border-gray-700 pl-3 transition-colors"
            >
              Logout
            </button>
          </div>
        )}

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

        {user && (
          <div className="flex gap-2 w-full sm:hidden mt-2">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="flex-1 text-xs text-gray-400 hover:text-white uppercase font-bold tracking-wider border border-gray-700 rounded py-2 bg-gray-800/50 hover:bg-gray-800 transition-all"
            >
              Settings
            </button>
            <button
              onClick={logout}
              className="flex-1 text-xs text-red-400 hover:text-red-300 uppercase font-bold tracking-wider border border-gray-700 rounded py-2 bg-gray-800/50 hover:bg-gray-800 transition-all"
            >
              Logout
            </button>
          </div>
        )}
      </div>
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
};