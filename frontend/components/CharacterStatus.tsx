import React from 'react';
import { ArrowUpIcon } from './Icons';
import { getRank } from '../constants';

interface CharacterStatusProps {
    totalGP: number;
    streakMultiplier: number;
}

export const CharacterStatus: React.FC<CharacterStatusProps> = ({ totalGP, streakMultiplier }) => {
    const { current: currentRank, next: nextRank } = getRank(totalGP);

    let progressPercentage = 100;
    if (nextRank) {
        const gpNeeded = nextRank.gpThreshold - currentRank.gpThreshold;
        const gpProgress = totalGP - currentRank.gpThreshold;
        progressPercentage = gpNeeded > 0 ? (gpProgress / gpNeeded) * 100 : 100;
    }

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700 space-y-4">
            <div>
                <div className="flex justify-between items-center text-sm mb-1">
                    <span className="font-bold text-gray-300">GP for {nextRank ? nextRank.name : 'Max Rank'}</span>
                    <span className="text-gray-400">{Math.floor(totalGP).toLocaleString()} / {nextRank ? nextRank.gpThreshold.toLocaleString() : '---'}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4 border border-gray-600">
                    <div
                        className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                        role="progressbar"
                        aria-valuenow={progressPercentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    ></div>
                </div>
            </div>
            
            <div className="pt-4 border-t border-gray-700 text-center">
                 <h3 className="text-lg font-bold text-gray-200 uppercase flex items-center justify-center gap-2 mb-2">
                    <ArrowUpIcon className="w-5 h-5 text-green-400" />
                    Earning Multipliers
                </h3>
                <div className="grid grid-cols-1 gap-4 text-center">
                     <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-black text-green-400">{(streakMultiplier * 100).toFixed(1)}%</p>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Streak Bonus</p>
                    </div>
                </div>
            </div>
        </div>
    );
};