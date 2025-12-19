import React, { useState, Dispatch, SetStateAction } from 'react';
import { AppContext, Wish, CoreTask, GoalContract } from '../types';
import { generateAIAssignedTask, generateTaskFromWishList, generateTaskFromCoreList, generateChatResponse, generateLabel } from '../services/geminiService';
import { api } from '../services/api';

export const useAIHandlers = (
    chatMessages: any[],
    setChatMessages: Dispatch<SetStateAction<any[]>>,
    wishList: Wish[],
    setWishList: Dispatch<SetStateAction<Wish[]>>,
    setCoreList: Dispatch<SetStateAction<CoreTask[]>>,
    selectedDate: string,
    addTask: (taskData: any) => Promise<void>,
    deleteWish: (id: string) => Promise<void>,
    getAppContext: () => AppContext
) => {
    const [isAssigningTask, setIsAssigningTask] = useState(false);
    const [isSelectingWish, setIsSelectingWish] = useState(false);
    const [isForgingCoreMission, setIsForgingCoreMission] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);

    const handleAIAssignedTask = async () => {
        setIsAssigningTask(true);
        const appContext = getAppContext();
        try {
            const taskData = await generateAIAssignedTask(appContext);
            await addTask({ ...taskData, date: selectedDate, recurrenceRule: 'None', time: undefined });
        } catch (e) { console.error(e); }
        setIsAssigningTask(false);
    };

    const handleGogginsWishSelection = async () => {
        setIsSelectingWish(true);
        const appContext = getAppContext();
        try {
            const taskData = await generateTaskFromWishList(appContext);
            await addTask({
                ...taskData,
                description: taskData.description,
                date: selectedDate,
                recurrenceRule: 'None',
                time: undefined,
            });
            const wishToRemove = wishList.find(w => w.description === taskData.originalWishDescription);
            if (wishToRemove) {
                await deleteWish(wishToRemove.id);
            }
        } catch (e) { console.error(e); }
        setIsSelectingWish(false);
    };

    const handleGogginsCoreSelection = async () => {
        setIsForgingCoreMission(true);
        const appContext = getAppContext();
        try {
            const taskData = await generateTaskFromCoreList(appContext);
            await addTask({
                ...taskData,
                description: taskData.description,
                date: selectedDate,
                recurrenceRule: 'None',
                time: undefined,
            });
        } catch (e) { console.error(e); }
        setIsForgingCoreMission(false);
    };

    const handleSendMessage = async (message: string) => {
        const newMessages = [...chatMessages, { sender: 'user', content: message }];
        setChatMessages(newMessages);
        setIsChatLoading(true);
        try {
            const appContext = getAppContext();
            const response = await generateChatResponse(newMessages, appContext);
            setChatMessages([...newMessages, { sender: 'ai', content: response }]);
        } catch (e) { console.error(e); }
        setIsChatLoading(false);
    };

    return {
        isAssigningTask,
        isSelectingWish,
        isForgingCoreMission,
        isChatLoading,
        handleAIAssignedTask,
        handleGogginsWishSelection,
        handleGogginsCoreSelection,
        handleSendMessage
    };
};
