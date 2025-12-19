import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { KeyIcon, XMarkIcon } from './Icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const { user, login } = useAuth(); // We might need to refresh user context?
    const [apiKey, setApiKey] = useState(user?.api_key || '');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsLoading(true);
        setMessage('');
        try {
            const updatedUser = await api.auth.updateProfile({ api_key: apiKey });
            setMessage('Settings updated successfully.');
            // Ideally update context, but a page refresh or next check will catch it.
            // Or we could expose a setUser in context.
            // For now, let's just confirm.
        } catch (e) {
            console.error(e);
            setMessage('Failed to update settings.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-md w-full p-6 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <h2 className="text-2xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                    Settings
                </h2>

                <div className="space-y-6">
                    <div>
                        <p className="text-sm text-gray-400">
                            Settings are centrally managed.
                        </p>
                    </div>

                    {message && (
                        <div className={`text-center text-sm font-bold p-2 rounded ${message.includes('Failed') ? 'bg-red-900/50 text-red-200' : 'bg-green-900/50 text-green-200'}`}>
                            {message}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className={`bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded uppercase tracking-wider transition-all ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isLoading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
