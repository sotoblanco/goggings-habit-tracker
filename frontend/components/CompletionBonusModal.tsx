
import React from 'react';
import { FireIcon } from './Icons';

interface CompletionBonusModalProps {
  bonus: {
    title: string;
    xp: number;
    earnings: number;
  };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const CompletionBonusModal: React.FC<CompletionBonusModalProps> = ({ bonus }) => {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gray-900 border-4 border-yellow-400 rounded-lg shadow-2xl max-w-md w-full p-8 text-center relative animate-scale-up">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-900 p-3 rounded-full border-4 border-yellow-400">
          <FireIcon className="w-16 h-16 text-orange-500 animate-pulse-fast" />
        </div>
        <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-wider mt-8 mb-4">{bonus.title}</h2>
        <p className="text-gray-300 mb-6">You've taken their souls. Here's your reward for dominating the day.</p>
        <div className="bg-gray-800/50 p-4 rounded-lg grid grid-cols-2 gap-4">
          <div>
            <p className="text-4xl font-black text-blue-400">+{bonus.xp}</p>
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">XP Bonus</p>
          </div>
          <div>
            <p className="text-4xl font-black text-green-400">+{formatCurrency(bonus.earnings)}</p>
            <p className="text-sm text-gray-400 uppercase font-bold tracking-wider">Earnings Bonus</p>
          </div>
        </div>
      </div>
    </div>
  );
};
