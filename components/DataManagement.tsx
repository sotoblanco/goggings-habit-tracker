import React, { useRef } from 'react';
import { Task, RecurringTask, SideQuest, DiaryEntry, Character, Goal, WeeklyGoal, Reward, PurchasedReward, Wish } from '../types';
import { ArrowDownTrayIcon, ArrowUpTrayIcon } from './Icons';

interface AppData {
    tasks: { [key: string]: Task[] };
    recurringTasks: RecurringTask[];
    sideQuests: SideQuest[];
    diaryEntries: { [key: string]: DiaryEntry };
    character: Character;
    userCategories: string[];
    dailyGoal: number;
    goals: Goal[];
    weeklyGoals: { [key: string]: WeeklyGoal[] };
    rewards: Reward[];
    purchasedRewards: PurchasedReward[];
    wishList: Wish[];
    awardedDailyGrindBonus: { [date: string]: boolean };
    weeklyBriefings: { [key: string]: string };
    chatMessages: { sender: 'user' | 'ai'; content: string }[];
}

interface DataManagementProps {
    data: AppData;
    setData: (data: AppData) => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({ data, setData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = () => {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `goggins-grind-backup-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Failed to export data:", error);
            alert("An error occurred while exporting your data.");
        }
    };

    const handleLoadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error("Failed to read file content.");
                }
                const importedData = JSON.parse(text);

                const requiredKeys: (keyof AppData)[] = ['tasks', 'recurringTasks', 'sideQuests', 'diaryEntries', 'character', 'userCategories', 'dailyGoal', 'goals'];
                const hasAllKeys = requiredKeys.every(key => key in importedData);
                
                if (!hasAllKeys) {
                    alert('Error: Invalid backup file. The file is missing required data. Some older backup files may not be compatible.');
                    return;
                }
                
                if (window.confirm("Are you sure you want to import this data? This will overwrite all your current progress.")) {
                    setData(importedData);
                    alert("Data imported successfully! The application will now reload.");
                    window.location.reload();
                }

            } catch (error) {
                console.error("Failed to import data:", error);
                alert("An error occurred while importing the data. Please ensure it is a valid JSON backup file.");
            } finally {
                if(fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700 space-y-4">
            <h3 className="text-lg font-bold text-gray-200 uppercase text-center mb-2">Data Management</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    onClick={handleExport}
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    Download Backup
                </button>
                <button
                    onClick={handleLoadClick}
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                    <ArrowUpTrayIcon className="w-5 h-5" />
                    Load from Backup
                </button>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
            />
            <p className="text-xs text-center text-gray-500 pt-2">
                Save or restore your progress. Loading a backup will overwrite current data.
            </p>
        </div>
    );
};
