
import React, { useState } from 'react';
import { Task } from '../types';
import { FireIcon, BanknotesIcon } from './Icons';

interface BetModalProps {
    task: Task & { betMultiplier: number; betRationale: string; };
    currentBalance: number;
    onConfirmBet: (task: Task, betAmount: number) => void;
    onNoBet: (task: Task) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const BetModal: React.FC<BetModalProps> = ({ task, currentBalance, onConfirmBet, onNoBet }) => {
    const [betAmount, setBetAmount] = useState<string>('');
    const [error, setError] = useState<string>('');
    
    const potentialWinnings = (parseFloat(betAmount) || 0) * task.betMultiplier;

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const numericValue = parseFloat(value);

        if (value === '' || (!isNaN(numericValue) && numericValue >= 0)) {
            if (numericValue > currentBalance) {
                setError("You can't bet more than your current balance.");
            } else {
                setError('');
            }
            setBetAmount(value);
        }
    };

    const handleConfirm = () => {
        const finalBetAmount = parseFloat(betAmount) || 0;
        if (finalBetAmount > 0 && finalBetAmount <= currentBalance) {
            onConfirmBet(task, finalBetAmount);
        }
    };
    
    const handleNoBet = () => {
        onNoBet(task);
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl max-w-lg w-full p-6 text-center">
                <h2 className="text-2xl font-black text-orange-500 uppercase tracking-wider mb-2 flex items-center justify-center gap-2">
                    <BanknotesIcon className="w-8 h-8" />
                    Bet On Yourself
                </h2>
                <p className="text-gray-300 mb-4">Put some skin in the game. You fail, you lose your stake. You win, you get the reward. No excuses.</p>
                
                <div className="bg-gray-800/50 p-4 rounded-lg mb-4 text-left">
                    <p className="text-sm uppercase text-gray-400 font-bold">The Mission:</p>
                    <p className="text-lg font-bold text-white break-words">{task.description}</p>
                </div>

                <div className="bg-gray-800/50 p-4 rounded-lg mb-4 text-left">
                     <h3 className="text-sm uppercase text-gray-400 font-bold flex items-center gap-1 mb-2">
                        <FireIcon className="w-4 h-4 text-orange-400" />
                        Goggins' Odds
                     </h3>
                    <div className="flex items-center justify-between">
                         <p className="text-4xl font-black text-cyan-400">{task.betMultiplier.toFixed(2)}x</p>
                         <p className="text-sm text-gray-300 italic max-w-xs text-right">"{task.betRationale}"</p>
                    </div>
                </div>

                <div>
                    <label htmlFor="bet-amount" className="block text-sm font-medium text-gray-400 mb-1">Your Stake (Current Balance: {formatCurrency(currentBalance)})</label>
                    <input
                        id="bet-amount"
                        type="number"
                        value={betAmount}
                        onChange={handleAmountChange}
                        min="0"
                        step="0.01"
                        max={currentBalance}
                        placeholder="0.00"
                        className="w-full text-center text-3xl font-bold bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                     <p className="text-sm text-gray-400 mt-2">Potential Payout: <span className="font-bold text-green-400">{formatCurrency(potentialWinnings)}</span></p>
                </div>
                
                <div className="flex gap-4 mt-6">
                    <button onClick={handleNoBet} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors uppercase">
                        No Bet
                    </button>
                    <button 
                        onClick={handleConfirm}
                        disabled={!!error || !betAmount || parseFloat(betAmount) <= 0}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed"
                    >
                        Place Bet
                    </button>
                </div>
            </div>
        </div>
    );
};