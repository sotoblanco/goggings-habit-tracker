import React, { useState } from 'react';
import { DiaryEntry } from '../types';
import { FireIcon } from './Icons';

interface DiaryProps {
    entry: DiaryEntry | undefined;
    date: string;
    onSaveReflection: (date: string, reflection: string) => void;
    onSaveDebrief: (date: string, debrief: string) => void;
    isLoading: boolean;
}

export const Diary: React.FC<DiaryProps> = ({ entry, date, onSaveReflection, onSaveDebrief, isLoading }) => {
    const [reflectionContent, setReflectionContent] = useState('');
    const [debriefContent, setDebriefContent] = useState('');

    const hasReflection = !!entry?.initialReflection;
    const hasDebrief = !!entry?.debrief;

    const handleSaveReflection = () => {
        if (reflectionContent.trim()) {
            onSaveReflection(date, reflectionContent);
        }
    };
    
    const handleSaveDebrief = () => {
        if (debriefContent.trim()) {
            onSaveDebrief(date, debriefContent);
        }
    };
    
    return (
        <div className="mt-6 pt-6 border-t border-gray-700 space-y-6">
            {/* --- MORNING BRIEFING --- */}
            <div>
                <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-center">Morning Briefing</h3>
                <div className="bg-gray-900/50 p-4 rounded-lg">
                    {!hasReflection ? (
                        <>
                            <textarea
                                value={reflectionContent}
                                onChange={(e) => setReflectionContent(e.target.value)}
                                placeholder="What is today's mission? What standard are you holding yourself to? Write your contract."
                                className="w-full h-24 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                aria-label="Initial reflection entry"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSaveReflection}
                                disabled={isLoading || !reflectionContent.trim()}
                                className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors uppercase tracking-wider disabled:bg-gray-600 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Loading...' : "Set the Standard"}
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-400 text-sm font-bold uppercase mb-2">Your Intention</p>
                            <p className="text-gray-200 whitespace-pre-wrap mb-4">{entry.initialReflection}</p>
                            <div className="border-t border-gray-700 pt-3">
                                <h4 className="text-md font-black uppercase text-orange-500 mb-2 flex items-center gap-2">
                                    <FireIcon className="w-4 h-4"/>
                                    Goggins' Orders
                                </h4>
                                <p className="text-md text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">{entry.initialFeedback}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* --- DAILY DEBRIEF (only if reflection exists) --- */}
            {hasReflection && (
                <div>
                    <h3 className="text-xl font-bold uppercase tracking-wider mb-4 text-center">Daily Debrief</h3>
                    <div className="bg-gray-900/50 p-4 rounded-lg">
                        {!hasDebrief ? (
                            <>
                                <textarea
                                    value={debriefContent}
                                    onChange={(e) => setDebriefContent(e.target.value)}
                                    placeholder="Log your thoughts. What did you conquer? Where were you weak? Don't lie to yourself."
                                    className="w-full h-32 bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    aria-label="Diary entry"
                                    disabled={isLoading}
                                />
                                <button
                                    onClick={handleSaveDebrief}
                                    disabled={isLoading || !debriefContent.trim()}
                                    className="mt-3 w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors uppercase tracking-wider disabled:bg-gray-600 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Goggins is Judging...' : "Get Goggins' Verdict"}
                                </button>
                            </>
                        ) : (
                             <>
                                <p className="text-gray-400 text-sm font-bold uppercase mb-2">Your Debrief</p>
                                <p className="text-gray-200 whitespace-pre-wrap mb-4">{entry.debrief}</p>
                                <div className="border-t border-gray-700 pt-3">
                                     <h4 className="text-lg font-black uppercase text-orange-500 mb-2 flex items-center gap-2">
                                        <FireIcon className="w-5 h-5"/>
                                        Goggins' Verdict
                                     </h4>
                                     <p className="text-md text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">{entry.finalFeedback}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};