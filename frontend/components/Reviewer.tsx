
import React, { useState } from 'react';
import { ReviewResult } from '../types';
import { CheckCircleIcon, XCircleIcon, BoltIcon, ArrowUpIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon } from './Icons';
import useLocalStorage from '../hooks/useLocalStorage';

interface ReviewerProps {
    onGenerateReview: (days: number) => void;
    isGenerating: boolean;
    review: ReviewResult | null;
}

const ReviewSection: React.FC<{ title: string; items: string[] | undefined; icon: React.ReactNode; color: string }> = ({ title, items, icon, color }) => {
    const storageKey = `goggins-review-${title.toLowerCase().replace(/\s+/g, '-')}`;
    const [isOpen, setIsOpen] = useLocalStorage(storageKey, true);

    if (!items || items.length === 0) return null;
    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center gap-2 text-left p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 hover:bg-gray-700/50 transition-colors`}
                aria-expanded={isOpen}
            >
                {isOpen ? <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                <h4 className={`text-lg font-black uppercase text-${color}-400 flex items-center gap-2`}>
                    {icon}
                    {title}
                </h4>
            </button>

            <div
                className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
            >
                <div className="overflow-hidden pl-8">
                    <ul className="list-disc list-inside space-y-1 text-gray-300 pt-2">
                        {items.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export const Reviewer: React.FC<ReviewerProps> = ({ onGenerateReview, isGenerating, review }) => {
    const [days, setDays] = useState(7);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerateReview(days);
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-200 uppercase text-center mb-2">After-Action Review</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex items-center gap-4">
                    <label htmlFor="review-days" className="text-sm font-medium text-gray-300 flex-shrink-0">Review Last</label>
                    <input
                        id="review-days"
                        type="number"
                        value={days}
                        onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
                        min="1"
                        max="90"
                        className="w-24 text-center bg-gray-900/50 text-white font-bold border border-gray-600 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        aria-label="Number of days to review"
                    />
                    <span className="text-sm font-medium text-gray-300">Days</span>
                </div>
                <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded transition-colors uppercase tracking-wider disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isGenerating ? 'Analyzing Data...' : 'Get Goggins\' AAR'}
                </button>
            </form>

            {isGenerating && (
                 <div className="text-center py-4">
                    <p className="text-orange-400 animate-pulse-fast">Goggins is reviewing your log book...</p>
                 </div>
            )}

            {review && !isGenerating && (
                <div className="pt-4 border-t border-gray-700 space-y-4">
                    <ReviewSection
                        title="The Good"
                        items={review.good}
                        icon={<CheckCircleIcon className="w-5 h-5" />}
                        color="green"
                    />
                     <ReviewSection
                        title="The Bad"
                        items={review.bad}
                        icon={<XCircleIcon className="w-5 h-5" />}
                        color="red"
                    />
                    <div className="pt-2 border-t border-gray-700/50">
                        <h4 className="text-xl font-black uppercase text-yellow-400 my-2 flex items-center justify-center gap-2">
                            <BoltIcon className="w-5 h-5" />
                            Mission Plan
                        </h4>
                        <div className="space-y-4">
                             <ReviewSection
                                title="Keep Doing"
                                items={review.suggestions.keep}
                                icon={<ArrowUpIcon className="w-5 h-5" />}
                                color="cyan"
                            />
                             <ReviewSection
                                title="Add"
                                items={review.suggestions.add}
                                icon={<PlusIcon className="w-5 h-5" />}
                                color="green"
                            />
                            <ReviewSection
                                title="Remove"
                                items={review.suggestions.remove}
                                icon={<TrashIcon className="w-5 h-5" />}
                                color="red"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
