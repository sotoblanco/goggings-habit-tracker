
import React, { useState, useEffect } from 'react';
import { Task, RecurringTask, TaskDifficulty, RecurrenceRule } from '../types';

interface EditTaskModalProps {
    item: Task | RecurringTask;
    onUpdate: (updatedItem: Task | RecurringTask, originalItem: Task | RecurringTask) => void;
    onCancel: () => void;
    userCategories: string[];
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ item, onUpdate, onCancel, userCategories }) => {
    const [formData, setFormData] = useState<Partial<Task & RecurringTask>>({});

    useEffect(() => {
        setFormData({ ...item });
    }, [item]);
    
    const isRecurring = 'recurrenceRule' in item;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNumericChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: Number(value) >= 1 ? Number(value) : 1 }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(formData as Task | RecurringTask, item);
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 border-2 border-orange-500 rounded-lg shadow-2xl max-w-lg w-full p-6">
                <h2 className="text-xl font-black text-orange-500 mb-4 uppercase tracking-wider">Edit Mission</h2>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description || ''}
                            onChange={handleChange}
                            className="w-full h-24 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isRecurring ? (
                            <>
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                                    <input type="date" id="startDate" name="startDate" value={formData.startDate || ''} onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                                </div>
                                <div>
                                    <label htmlFor="recurrenceRule" className="block text-sm font-medium text-gray-400 mb-1">Recurrence</label>
                                    <select id="recurrenceRule" name="recurrenceRule" value={formData.recurrenceRule || 'Daily'} onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                        <option value="Daily">Daily</option>
                                        <option value="Weekly">Weekly</option>
                                        <option value="Weekdays">Weekdays</option>
                                        <option value="Weekends">Weekends</option>
                                    </select>
                                </div>
                            </>
                        ) : (
                            <div>
                                <label htmlFor="date" className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                                <input type="date" id="date" name="date" value={formData.date || ''} onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                            </div>
                        )}
                        <div>
                            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-400 mb-1">Difficulty</label>
                            <select id="difficulty" name="difficulty" value={formData.difficulty || ''} onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500">
                                {Object.values(TaskDifficulty).map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                            <input id="category" name="category" type="text" list="category-list" value={formData.category || ''} onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                            <datalist id="category-list">
                                {userCategories.map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div>
                            <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-400 mb-1">Est. Time (mins)</label>
                            <input id="estimatedTime" name="estimatedTime" type="number" value={formData.estimatedTime || ''} onChange={handleNumericChange} min="1" className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-400 mb-1">Time (Optional)</label>
                            <input id="time" name="time" type="time" value={formData.time || ''} onChange={handleChange} className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                        <button type="button" onClick={onCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors uppercase">Cancel</button>
                        <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors uppercase">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
