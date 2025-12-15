
import React, { useState } from 'react';
import { Reward, PurchasedReward } from '../types';
import { TrophyIcon, BanknotesIcon, PlusIcon, TrashIcon } from './Icons';
import { CollapsibleList } from './CollapsibleList';

interface RewardsProps {
  rewards: Reward[];
  purchasedRewards: PurchasedReward[];
  currentBalance: number;
  onAddReward: (rewardData: { name: string; cost: number }) => void;
  onDeleteReward: (rewardId: string) => void;
  onPurchaseReward: (reward: Reward) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};

export const Rewards: React.FC<RewardsProps> = ({ rewards, purchasedRewards, currentBalance, onAddReward, onDeleteReward, onPurchaseReward }) => {
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [newRewardName, setNewRewardName] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('');

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    const cost = parseFloat(newRewardCost);
    if (newRewardName.trim() && !isNaN(cost) && cost >= 0) {
      onAddReward({ name: newRewardName, cost });
      setNewRewardName('');
      setNewRewardCost('');
    }
  };

  const TabButton: React.FC<{ tabName: 'available' | 'history'; children: React.ReactNode }> = ({ tabName, children }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`w-full py-2 text-sm font-bold uppercase tracking-wider rounded-t-lg transition-colors ${
        activeTab === tabName ? 'bg-gray-700/80 text-white' : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
      }`}
    >
      {children}
    </button>
  );

  return (
    <>
      <div className="grid grid-cols-2 border-b-2 border-gray-700">
        <TabButton tabName="available">Available</TabButton>
        <TabButton tabName="history">History</TabButton>
      </div>

      <div className="pt-4">
        {activeTab === 'available' && (
          <div className="space-y-4">
             <CollapsibleList title="Available Rewards" storageKey="goggins-rewards-available-open" defaultOpen={true}>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {rewards.length > 0 ? (
                  rewards
                      .sort((a,b) => a.cost - b.cost)
                      .map(reward => {
                          const canAfford = currentBalance >= reward.cost;
                          return (
                          <div key={reward.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center">
                              <div>
                              <p className="text-white font-medium">{reward.name}</p>
                              <p className="text-sm text-yellow-400 font-bold flex items-center gap-1">
                                  <BanknotesIcon className="w-4 h-4" />
                                  {formatCurrency(reward.cost)}
                              </p>
                              </div>
                              <div className="flex items-center gap-1">
                                  <button
                                      onClick={() => onPurchaseReward(reward)}
                                      disabled={!canAfford}
                                      className={`px-3 py-1 text-xs font-bold rounded transition-colors ${
                                      canAfford
                                          ? 'bg-green-600 hover:bg-green-700 text-white'
                                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                      }`}
                                  >
                                      Claim
                                  </button>
                                  <button
                                      onClick={() => onDeleteReward(reward.id)}
                                      className="p-2 rounded-full hover:bg-red-900/50 text-gray-400 hover:text-red-400 transition-colors"
                                  >
                                      <TrashIcon className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                          );
                  })
                ) : (
                  <p className="text-center text-gray-500 py-4">No rewards defined. Add a reward to motivate your grind.</p>
                )}
              </div>
            </CollapsibleList>
            
            <div className="pt-4 border-t border-gray-700">
                <h4 className="text-md font-bold text-center text-gray-300 mb-3 uppercase">Create New Reward</h4>
                <form onSubmit={handleAddReward} className="space-y-3">
                    <input
                        type="text"
                        value={newRewardName}
                        onChange={(e) => setNewRewardName(e.target.value)}
                        placeholder="Reward name (e.g., Cheat Meal)"
                        className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        required
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            type="number"
                            value={newRewardCost}
                            onChange={(e) => setNewRewardCost(e.target.value)}
                            placeholder="Cost"
                            min="0"
                            step="0.01"
                            className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 col-span-2"
                            required
                        />
                         <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center justify-center gap-1">
                             <PlusIcon className="w-5 h-5"/> Add
                         </button>
                    </div>
                </form>
            </div>

          </div>
        )}

        {activeTab === 'history' && (
           <CollapsibleList title="Purchase History" storageKey="goggins-rewards-history-open" defaultOpen={true}>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {purchasedRewards.length > 0 ? (
                  purchasedRewards
                  .sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                  .map(purchase => (
                      <div key={purchase.id} className="bg-gray-700/50 p-3 rounded-lg flex justify-between items-center opacity-80">
                          <div>
                              <p className="text-white font-medium">{purchase.name}</p>
                              <p className="text-xs text-gray-400">
                                  {new Date(purchase.purchaseDate + 'T00:00:00').toLocaleDateString()}
                              </p>
                          </div>
                          <p className="text-sm text-yellow-400 font-bold">{formatCurrency(purchase.cost)}</p>
                      </div>
                  ))
              ) : (
                <p className="text-center text-gray-500 py-8">You haven't claimed any rewards yet. Go earn them.</p>
              )}
            </div>
          </CollapsibleList>
        )}
      </div>
    </>
  );
};
