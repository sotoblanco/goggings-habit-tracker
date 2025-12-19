import React, { Dispatch, SetStateAction } from 'react';
import { Reward, PurchasedReward, Character } from '../types';
import { api } from '../services/api';
import { generateId } from '../utils/commonUtils';
import { getLocalDateString } from '../utils/dateUtils';

export const useRewardActions = (
    rewards: Reward[],
    setRewards: Dispatch<SetStateAction<Reward[]>>,
    purchasedRewards: PurchasedReward[],
    setPurchasedRewards: Dispatch<SetStateAction<PurchasedReward[]>>,
    currentBalance: number,
    character: Character,
    setCharacter: Dispatch<SetStateAction<Character>>
) => {
    const addReward = async (rewardData: { name: string; cost: number }) => {
        const newReward: Reward = { ...rewardData, id: generateId() };
        try {
            const saved = await api.rewards.create(newReward);
            setRewards([...rewards, saved]);
        } catch (e) { console.error(e); }
    };

    const deleteReward = async (rewardId: string) => {
        try {
            await api.rewards.delete(rewardId);
            setRewards(rewards.filter(r => r.id !== rewardId));
        } catch (e) { console.error(e); }
    };

    const purchaseReward = async (reward: Reward) => {
        if (currentBalance >= reward.cost) {
            const newPurchase: PurchasedReward = {
                id: generateId(),
                rewardId: reward.id,
                name: reward.name,
                cost: reward.cost,
                purchaseDate: getLocalDateString()
            };

            try {
                const saved = await api.purchasedRewards.create(newPurchase);
                setPurchasedRewards([...purchasedRewards, saved]);

                const newSpent = (character.spent || 0) + reward.cost;
                await api.character.update({ ...character, spent: newSpent });
                setCharacter(prev => ({ ...prev, spent: newSpent }));
            } catch (e) { console.error(e); }
        }
    };

    return {
        addReward,
        deleteReward,
        purchaseReward
    };
};
