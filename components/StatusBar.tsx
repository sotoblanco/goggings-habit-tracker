import React, { useState, useEffect } from 'react';
import { Character, DailyScore } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

interface StatusBarProps {
    character: Character;
    dailyScores: DailyScore[];
    totalEarnings: number;
    totalGP: number;
}

export const StatusBar: React.FC<StatusBarProps> = ({ character, dailyScores, totalEarnings, totalGP }) => {
    const [timeRemaining, setTimeRemaining] = useState('00:00:00');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);
            
            const diff = tomorrow.getTime() - now.getTime();
            
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeRemaining(
                `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
            );
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const todayStr = getLocalDateString(today);
    const yesterdayStr = getLocalDateString(yesterday);

    const defaultScore = { earnings: 0, tasksCompleted: 0 };
    const todayScore = dailyScores.find(s => s.date === todayStr) ?? defaultScore;
    const yesterdayScore = dailyScores.find(s => s.date === yesterdayStr) ?? defaultScore;

    const currentBalance = totalEarnings - (character.spent || 0);

    return (
        <div className="bg-gray-800/50 p-4 rounded-lg shadow-lg border border-gray-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 text-center gap-4">
            {/* Daily Reset Timer */}
            <div className="md:border-r border-gray-700 md:pr-4">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Daily Reset</p>
                <p className="text-3xl font-black text-cyan-400 font-mono">{timeRemaining}</p>
            </div>
            {/* Total GP */}
            <div className="md:border-r border-gray-700 md:pr-4">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Total GP</p>
                <p className="text-3xl font-black text-blue-400">{Math.floor(totalGP).toLocaleString()}</p>
            </div>
            
            {/* Balance */}
            <div className="md:border-r border-gray-700 md:pr-4">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Balance</p>
                <p className="text-3xl font-black text-yellow-400">{formatCurrency(currentBalance)}</p>
            </div>

            {/* Total Earnings */}
            <div className="md:border-r border-gray-700 md:pr-4">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Total Earned</p>
                <p className="text-3xl font-black text-green-400">{formatCurrency(totalEarnings)}</p>
            </div>

            {/* Yesterday's Score */}
            <div className="md:border-r border-gray-700 md:pr-4">
                <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Yesterday</p>
                <p className="text-3xl font-black text-white">{formatCurrency(yesterdayScore.earnings)}</p>
            </div>

            {/* Today's Score */}
            <div>
                <p className="text-sm uppercase font-bold text-orange-400">Today</p>
                <p className={`text-3xl font-black transition-colors ${todayScore.earnings > yesterdayScore.earnings && todayScore.earnings > 0 ? 'text-green-400' : 'text-white'}`}>
                    {formatCurrency(todayScore.earnings)}
                </p>
            </div>
        </div>
    );
};