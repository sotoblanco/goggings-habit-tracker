import React, { Dispatch, SetStateAction } from 'react';
import { Wish, CoreTask, GoalContract } from '../types';
import { api } from '../services/api';
import { generateId } from '../utils/commonUtils';
import { generateLabel } from '../services/geminiService';

export const useListActions = (
    wishList: Wish[],
    setWishList: Dispatch<SetStateAction<Wish[]>>,
    coreList: CoreTask[],
    setCoreList: Dispatch<SetStateAction<CoreTask[]>>
) => {
    const addWish = async (wishData: Wish) => {
        try {
            const label = await generateLabel(wishData.contract?.primaryObjective || wishData.description);
            const newWish = { ...wishData, id: generateId(), label };
            const saved = await api.wishList.create(newWish);
            setWishList(prev => [...prev, saved]);
        } catch (e) { console.error(e); }
    };

    const deleteWish = async (wishId: string) => {
        try {
            await api.wishList.delete(wishId);
            setWishList(prev => prev.filter(w => w.id !== wishId));
        } catch (e) { console.error(e); }
    };

    const updateWish = (wishId: string, updates: Partial<Wish>) => {
        setWishList(prev => prev.map(w => w.id === wishId ? { ...w, ...updates } : w));
    };

    const updateWishContract = async (wishId: string, newContract: GoalContract) => {
        try {
            const newLabel = await generateLabel(newContract.primaryObjective);
            setWishList(prev => prev.map(w => w.id === wishId ? { ...w, contract: newContract, label: newLabel, description: newContract.primaryObjective } : w));
        } catch (e) { console.error(e); }
    };

    const addCoreTask = async (coreData: CoreTask) => {
        try {
            const label = await generateLabel(coreData.contract?.primaryObjective || coreData.description);
            const newTask = { ...coreData, id: generateId(), label };
            const saved = await api.coreList.create(newTask);
            setCoreList(prev => [...prev, saved]);
        } catch (e) { console.error(e); }
    };

    const deleteCoreTask = async (id: string) => {
        try {
            await api.coreList.delete(id);
            setCoreList(prev => prev.filter(c => c.id !== id));
        } catch (e) { console.error(e); }
    };

    const updateCoreTask = (id: string, updates: Partial<CoreTask>) => {
        setCoreList(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const updateCoreTaskContract = async (id: string, newContract: GoalContract) => {
        try {
            const newLabel = await generateLabel(newContract.primaryObjective);
            setCoreList(prev => prev.map(c => c.id === id ? { ...c, contract: newContract, label: newLabel, description: newContract.primaryObjective } : c));
        } catch (e) { console.error(e); }
    };

    return {
        addWish,
        deleteWish,
        updateWish,
        updateWishContract,
        addCoreTask,
        deleteCoreTask,
        updateCoreTask,
        updateCoreTaskContract
    };
};
