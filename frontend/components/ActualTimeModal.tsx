import React, { useState, useEffect } from 'react';
import { Task } from '../types';

interface ActualTimeModalProps {
    task: Task;
    onConfirm: (actualTime: number) => void;
    onCancel: () => void;
}

export const ActualTimeModal: React.FC<ActualTimeModalProps> = ({ task, onConfirm, onCancel }) => {
    const [actualTime, setActualTime] = useState<string>(task.estimatedTime.toString());

    useEffect(() => {
        setActualTime(task.estimatedTime.toString());
    }, [task]);

    const handleConfirm = () => {
        const time = parseInt(actualTime, 10);
        if (!isNaN(time) && time > 0) {
            onConfirm(time);
        } else {
            // Maybe show an error, for now just force it to be at least 1
            onConfirm(1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border-2 border-orange-500 rounded-lg shadow-2xl max-w-md w-full p-6 text-center">
                <h2 className="text-xl font-black text-orange-500 mb-2">MISSION COMPLETE</h2>
                <p className="text-gray-300 mb-4">Log your time to collect your reward. How long did you suffer?</p>
                
                <p className="mb-4 font-bold text-lg text-white break-words">{task.description}</p>

                <div>
                    <label htmlFor="actual-time" className="block text-sm font-medium text-gray-400 mb-1">Actual Time Taken (minutes)</label>
                    <input
                        id="actual-time"
                        type="number"
                        value={actualTime}
                        onChange={(e) => setActualTime(e.target.value)}
                        min="1"
                        className="w-full text-center text-2xl font-bold bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoFocus
                    />
                     <p className="text-xs text-gray-500 mt-1">Estimated time was: {task.estimatedTime} minutes.</p>
                </div>
                
                <div className="flex gap-4 mt-6">
                    <button onClick={onCancel} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors uppercase">
                        Cancel
                    </button>
                    <button 
                        onClick={handleConfirm}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors uppercase"
                    >
                        Log Time
                    </button>
                </div>
            </div>
        </div>
    );
};