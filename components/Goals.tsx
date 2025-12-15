


import React, { useState, useEffect } from 'react';
import { Goal, AtomicHabitsSuggestions, GoalContract } from '../types';
import { GOAL_CHANGE_COST, getCategoryColor } from '../constants';
import { FlagIcon, PencilIcon, TrashIcon, XMarkIcon, FireIcon, BoltIcon, CheckCircleIcon, RepeatIcon } from './Icons';
import { generateGogginsGoalChangeVerdict, generatePreStateQuestions, generateGoalContract } from '../services/geminiService';
import { CollapsibleList } from './CollapsibleList';

interface GoalsProps {
    goals: Goal[];
    onAddGoal: (goal: Goal) => Promise<void>;
    onUpdateGoal: (goalId: string, updates: { description: string, targetDate: string }) => Promise<void>;
    onDeleteGoal: (goalId: string) => Promise<void>;
    onGoalChangeRequest: (justification: string, currentGoal: Goal) => Promise<{ approved: boolean, feedback: string }>;
    onCompleteGoal: (goalId: string, proof: string) => Promise<{ approved: boolean, feedback: string }>;
    onUpdateGoalContract: (goalId: string, contract: GoalContract) => Promise<void>;
    currentBalance: number;
    atomicHabitsSuggestions: AtomicHabitsSuggestions | null;
    onCloseSuggestions: () => void;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const HabitSection: React.FC<{ title: string; suggestions: string[] }> = ({ title, suggestions }) => {
    if (!suggestions || suggestions.length === 0) return null;

    return (
        <div className="bg-gray-800/60 p-4 rounded-lg">
            <h4 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
                <BoltIcon className="w-5 h-5" />
                {title}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-gray-200 pl-2">
                {suggestions.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
        </div>
    );
};

interface ObjectiveContractModalProps {
    onClose: () => void;
    onSave?: (goal: Goal) => Promise<void>;
    onUpdate?: (goalId: string, contract: GoalContract) => Promise<void>;
    existingGoal?: Goal;
}

const ObjectiveContractModal: React.FC<ObjectiveContractModalProps> = ({ onClose, onSave, onUpdate, existingGoal }) => {
    const isUpdateMode = !!existingGoal;
    
    const [step, setStep] = useState(isUpdateMode ? 2 : 1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [description, setDescription] = useState(existingGoal?.description || '');
    const [targetDate, setTargetDate] = useState(existingGoal?.targetDate || '');
    
    const [whyAnswers, setWhyAnswers] = useState<string[]>(new Array(5).fill(''));
    
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    
    const [contract, setContract] = useState<GoalContract | null>(null);

    const handleStep1Submit = async () => {
        if (!description.trim() || !targetDate) return;
        setStep(2);
    };

    const handleWhyAnswerChange = (index: number, value: string) => {
        const newAnswers = [...whyAnswers];
        newAnswers[index] = value;
        setWhyAnswers(newAnswers);
    };
    
    const getWhyQuestion = (index: number): string => {
        if (index === 0) {
            return `You want to "${description}". Why is that important to you?`;
        }
        const previousAnswer = whyAnswers[index - 1];
        if (!previousAnswer) return `Why is that important?`;
        return `And why is "${previousAnswer}" important to you?`;
    };

    const handleStep2Submit = async () => {
        setIsLoading(true);
        const { questions: generatedQuestions } = await generatePreStateQuestions(description, whyAnswers);
        setQuestions(generatedQuestions);
        setAnswers(new Array(generatedQuestions.length).fill(''));
        setIsLoading(false);
        setStep(3);
    };

    const handleAnswerChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleStep3Submit = async () => {
        const preStateAnswers = questions.map((q, i) => ({ question: q, answer: answers[i] || 'No answer' }));
        setIsLoading(true);
        const generatedContract = await generateGoalContract(description, targetDate, preStateAnswers, whyAnswers);
        setContract(generatedContract);
        setIsLoading(false);
        setStep(4);
    };
    
    const handleContractAccept = async () => {
        if (!contract) return;
        setIsLoading(true);
        if (isUpdateMode && onUpdate && existingGoal) {
            await onUpdate(existingGoal.id, contract);
        } else if (!isUpdateMode && onSave) {
            const newGoal: Goal = {
                id: `temp-${Date.now()}`,
                description,
                targetDate,
                contract
            };
            await onSave(newGoal);
        }
    };

    const renderStepContent = () => {
        if (isLoading) {
            return (
                <div className="text-center p-8 min-h-[400px] flex flex-col justify-center">
                    <p className="text-orange-400 animate-pulse-fast text-lg">Goggins is forging your path...</p>
                    <p className="text-gray-400">Stay ready.</p>
                </div>
            )
        }
        
        switch (step) {
            case 1:
                return (
                    <>
                        <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">Step 1: Define the War</h3>
                        <p className="text-gray-300 mb-4">What's the mountain you're trying to conquer? Be specific.</p>
                        <div className="space-y-4">
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Run a sub-25 minute 5k" className="w-full h-24 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleStep1Submit} disabled={!description.trim() || !targetDate} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed">Next</button>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">{isUpdateMode ? 'Re-Assess Your Why' : 'Step 2: The Five Whys'}</h3>
                        <p className="text-gray-300 mb-4">Don't lie to yourself. Dig deep to find the real reason. This is the foundation.</p>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                           {whyAnswers.map((answer, index) => (
                               <div key={index}>
                                   <label className="block text-sm font-medium text-gray-300 mb-1">{index + 1}. {getWhyQuestion(index)}</label>
                                   <input type="text" value={answer} onChange={(e) => handleWhyAnswerChange(index, e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                               </div>
                           ))}
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(isUpdateMode ? 1 : 1)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Back</button>
                            <button onClick={handleStep2Submit} disabled={whyAnswers.some(a => !a.trim())} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed">Next</button>
                        </div>
                    </>
                );
            case 3:
                return (
                     <>
                        <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">{isUpdateMode ? 'Re-Assess Your Baseline' : 'Step 3: Know Your Enemy'}</h3>
                        <p className="text-gray-300 mb-4">Your enemy is the part of you that's weak. Answer honestly. This is your baseline.</p>
                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                            {questions.map((q, i) => (
                                <div key={i}>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">{q}</label>
                                    <input type="text" value={answers[i]} onChange={(e) => handleAnswerChange(i, e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500" />
                                </div>
                            ))}
                        </div>
                         <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(2)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Back</button>
                            <button onClick={handleStep3Submit} disabled={answers.some(a => !a.trim())} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed">Forge Contract</button>
                        </div>
                    </>
                );
            case 4:
                if (!contract) return null;
                return (
                    <>
                        <h3 className="text-2xl font-black text-yellow-400 mb-2 uppercase">{isUpdateMode ? 'Sign The New Contract' : 'Step 4: Sign The Contract'}</h3>
                        <p className="text-gray-300 mb-4 italic">"{contract.contractStatement}"</p>
                        <div className="bg-gray-800/50 p-4 rounded-lg space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                            <div>
                                <p className="text-sm font-bold uppercase text-gray-400">Primary Objective</p>
                                <p className="text-lg text-white font-bold">{contract.primaryObjective}</p>
                            </div>
                             <div>
                                <p className="text-sm font-bold uppercase text-gray-400">Terms of Victory (KPIs)</p>
                                <ul className="list-disc list-inside pl-2 text-gray-200">
                                    {contract.kpis.map((kpi, i) => (
                                        <li key={i}>
                                            {kpi.description} <span className="text-xs text-cyan-400">({kpi.type})</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             <div>
                                <p className="text-sm font-bold uppercase text-gray-400">Payout</p>
                                <p className="text-lg text-green-400 font-bold">{formatCurrency(contract.rewardPayout)}</p>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(3)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Back</button>
                            <button onClick={handleContractAccept} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Accept & Stay Hard</button>
                        </div>
                    </>
                );
            default: return null;
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl max-w-2xl w-full p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors" aria-label="Close">
                    <XMarkIcon className="w-6 h-6" />
                </button>
                {renderStepContent()}
            </div>
        </div>
    );
};

export const Goals: React.FC<GoalsProps> = ({ goals, onAddGoal, onUpdateGoal, onDeleteGoal, onGoalChangeRequest, onCompleteGoal, onUpdateGoalContract, currentBalance, atomicHabitsSuggestions, onCloseSuggestions }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [editForm, setEditForm] = useState({ description: '', targetDate: '' });
    const [changeRequest, setChangeRequest] = useState<{ goal: Goal; justification: string; status: 'idle' | 'pending' | 'denied' | 'approved'; feedback: string } | null>(null);
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
    const [completingGoal, setCompletingGoal] = useState<{ goal: Goal; proof: string; status: 'idle' | 'pending' | 'denied'; feedback: string } | null>(null);
    const [restrategizingGoal, setRestrategizingGoal] = useState<Goal | null>(null);

    const activeGoals = goals.filter(g => !g.completed);
    const completedGoals = goals.filter(g => g.completed);

    const handleSaveNewGoal = async (goal: Goal) => {
        await onAddGoal(goal);
        setIsAdding(false);
    };
    
    const handleStartEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setEditForm({ description: goal.description, targetDate: goal.targetDate });
    };

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingGoal) {
            await onUpdateGoal(editingGoal.id, editForm);
            setEditingGoal(null);
        }
    };
    
    const handleInitiateChange = (goal: Goal) => {
        setChangeRequest({ goal, justification: '', status: 'idle', feedback: '' });
    };
    
    const submitChangeRequest = async () => {
        if (!changeRequest || !changeRequest.justification.trim()) return;
        setChangeRequest(prev => prev ? { ...prev, status: 'pending' } : null);

        const result = await onGoalChangeRequest(changeRequest.justification, changeRequest.goal);

        if (result.approved) {
            setChangeRequest(null);
            handleStartEdit(changeRequest.goal);
        } else {
            setChangeRequest(prev => prev ? { ...prev, status: 'denied', feedback: result.feedback } : null);
        }
    };

    const submitCompletion = async () => {
        if (!completingGoal || !completingGoal.proof.trim()) return;
        setCompletingGoal(prev => prev ? { ...prev, status: 'pending' } : null);
        
        const result = await onCompleteGoal(completingGoal.goal.id, completingGoal.proof);
        
        if (result.approved) {
            setCompletingGoal(null);
        } else {
            setCompletingGoal(prev => prev ? { ...prev, status: 'denied', feedback: result.feedback } : null);
        }
    };
    
    const handleUpdateContract = async (goalId: string, contract: GoalContract) => {
        await onUpdateGoalContract(goalId, contract);
        setRestrategizingGoal(null);
    };

    return (
        <div>
            <div className="space-y-4">
                 <CollapsibleList title="Active Objectives" storageKey="goggins-goals-active-open" defaultOpen={true}>
                    <div className="space-y-4">
                        {activeGoals.map(goal => (
                            editingGoal?.id === goal.id ? (
                                <form key={goal.id} onSubmit={handleSaveEdit} className="bg-gray-900/50 p-4 rounded-lg border border-orange-500 space-y-3">
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full h-20 bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                        required
                                    />
                                    <input
                                        type="date"
                                        value={editForm.targetDate}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, targetDate: e.target.value }))}
                                        className="w-full bg-gray-700 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setEditingGoal(null)} className="px-4 py-2 text-sm font-bold rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors">Cancel</button>
                                        <button type="submit" className="px-4 py-2 text-sm font-bold rounded bg-orange-600 hover:bg-orange-700 text-white transition-colors">Save Objective</button>
                                    </div>
                                </form>
                            ) : (
                            <div key={goal.id} className="bg-gray-700/50 p-4 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <p className="text-white font-bold">{goal.contract?.primaryObjective || goal.description}</p>
                                            {goal.label && (
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCategoryColor(goal.label).bg} ${getCategoryColor(goal.label).text}`}>
                                                    {goal.label}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400">Target: {new Date(goal.targetDate + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        {(goal.system || goal.contract) && (
                                            <button onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)} className={`p-2 rounded-full transition-colors ${expandedGoalId === goal.id ? 'bg-orange-500' : 'bg-blue-600/50 hover:bg-blue-500'} text-white`} aria-label="View system">
                                                <BoltIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                        <button onClick={() => setRestrategizingGoal(goal)} className="p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-500 text-white transition-colors" aria-label="Re-strategize objective">
                                            <RepeatIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleInitiateChange(goal)} className="p-2 rounded-full bg-yellow-600/50 hover:bg-yellow-500 text-white transition-colors" aria-label="Request change to objective">
                                            <PencilIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setCompletingGoal({ goal, proof: '', status: 'idle', feedback: '' })} className="p-2 rounded-full bg-green-600/50 hover:bg-green-500 text-white transition-colors" aria-label="Complete objective">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                                {expandedGoalId === goal.id && (goal.system || goal.contract) && (
                                    <div className="mt-4 pt-4 border-t border-gray-600 space-y-3">
                                        {goal.contract && (
                                            <div className="bg-gray-800/60 p-4 rounded-lg">
                                                 <h4 className="text-lg font-bold text-yellow-400 mb-2 flex items-center gap-2">
                                                    <BoltIcon className="w-5 h-5" />
                                                    Terms of Victory
                                                </h4>
                                                <ul className="list-disc list-inside space-y-1 text-gray-200 pl-2">
                                                    {goal.contract.kpis.map((kpi, i) => <li key={i}>{kpi.description} ({kpi.target}) <span className="text-xs text-cyan-400">[{kpi.type}]</span></li>)}
                                                </ul>
                                            </div>
                                        )}
                                        {goal.system && (
                                            <>
                                            <h3 className="text-lg font-bold text-orange-400 text-center uppercase tracking-wider mt-4">Tactical System</h3>
                                            <HabitSection title="Make it Obvious" suggestions={goal.system.obvious} />
                                            <HabitSection title="Make it Attractive" suggestions={goal.system.attractive} />
                                            <HabitSection title="Make it Easy" suggestions={goal.system.easy} />
                                            <HabitSection title="Make it Satisfying" suggestions={goal.system.satisfying} />
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            )
                        ))}
                    </div>
                </CollapsibleList>

                <button onClick={() => setIsAdding(true)} className="w-full bg-green-600/20 hover:bg-green-500/30 text-green-300 font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider border-2 border-dashed border-green-500/50">
                    Add New Objective
                </button>

                {completedGoals.length > 0 && (
                    <div className="pt-4 mt-4 border-t-2 border-gray-700">
                         <CollapsibleList title={<span className="text-green-400">Conquered Objectives</span>} storageKey="goggins-goals-completed-open">
                            <div className="space-y-4">
                                {completedGoals.map(goal => (
                                    <div key={goal.id} className="bg-gray-900/50 p-4 rounded-lg border-l-4 border-green-500 opacity-80">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="text-gray-300 font-bold line-through">{goal.contract?.primaryObjective || goal.description}</p>
                                                    {goal.label && (
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCategoryColor(goal.label).bg} ${getCategoryColor(goal.label).text} opacity-70`}>
                                                            {goal.label}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">Completed: {new Date(goal.completionDate! + 'T00:00:00').toLocaleDateString()}</p>
                                            </div>
                                            <button onClick={() => onDeleteGoal(goal.id)} className="p-1 rounded-full hover:bg-red-900/50 text-gray-500 hover:text-red-400 transition-colors" aria-label="Delete objective">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
                                            <p className="text-sm text-gray-400 font-bold">Your Debrief:</p>
                                            <p className="text-sm text-gray-300 whitespace-pre-wrap italic">"{goal.completionProof}"</p>
                                            <p className="text-sm text-orange-400 font-bold mt-2">Goggins' Verdict:</p>
                                            <p className="text-sm text-gray-200 whitespace-pre-wrap">{goal.completionFeedback}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CollapsibleList>
                    </div>
                )}
            </div>
            
            {isAdding && <ObjectiveContractModal onClose={() => setIsAdding(false)} onSave={handleSaveNewGoal} />}
            {restrategizingGoal && <ObjectiveContractModal onClose={() => setRestrategizingGoal(null)} existingGoal={restrategizingGoal} onUpdate={handleUpdateContract} />}

            {atomicHabitsSuggestions && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl max-w-2xl w-full p-6 relative">
                        <button onClick={onCloseSuggestions} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors" aria-label="Close suggestions">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <div className="text-center mb-4">
                            <h3 className="text-2xl font-black text-orange-500 flex items-center justify-center gap-2">
                                <FireIcon />
                                SYSTEM DEPLOYED
                            </h3>
                            <p className="text-gray-300">A goal without a system is a wish. Here is your operational plan.</p>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                            <HabitSection title="Make it Obvious" suggestions={atomicHabitsSuggestions.obvious} />
                            <HabitSection title="Make it Attractive" suggestions={atomicHabitsSuggestions.attractive} />
                            <HabitSection title="Make it Easy" suggestions={atomicHabitsSuggestions.easy} />
                            <HabitSection title="Make it Satisfying" suggestions={atomicHabitsSuggestions.satisfying} />
                        </div>
                    </div>
                </div>
            )}

            {changeRequest && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border-2 border-red-500 rounded-lg shadow-2xl max-w-lg w-full p-6 text-center">
                        <h3 className="text-xl font-black text-red-500 mb-2">REQUESTING A MISSION CHANGE?</h3>
                        <p className="text-gray-300 mb-4">Abandoning your post is a sign of weakness. Justify yourself.</p>
                        
                        {changeRequest.status === 'denied' ? (
                             <div className="bg-red-900/50 p-4 rounded-lg mb-4">
                                <h4 className="text-lg font-black uppercase text-red-400 mb-2 flex items-center justify-center gap-2"><FireIcon className="w-5 h-5"/> Goggins' Verdict: DENIED</h4>
                                <p className="text-white">{changeRequest.feedback}</p>
                            </div>
                        ) : (
                            <>
                            <p className="mb-1 font-bold text-lg">Current Objective: <span className="text-gray-300 font-normal">{changeRequest.goal.description}</span></p>
                            <p className="mb-4 font-bold text-lg">Cost To Change: <span className={`${currentBalance >= GOAL_CHANGE_COST ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(GOAL_CHANGE_COST)}</span> (Your Balance: {formatCurrency(currentBalance)})</p>
                            <textarea
                                value={changeRequest.justification}
                                onChange={(e) => setChangeRequest(prev => prev ? { ...prev, justification: e.target.value } : null)}
                                placeholder="Why are you abandoning your post? Don't be a coward."
                                className="w-full h-28 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                disabled={changeRequest.status === 'pending'}
                            />
                            </>
                        )}
                        
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => setChangeRequest(null)} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors uppercase">
                                {changeRequest.status === 'denied' ? 'Close' : 'Cancel'}
                            </button>
                           {changeRequest.status !== 'denied' && (
                                <button 
                                    onClick={submitChangeRequest} 
                                    disabled={changeRequest.status === 'pending' || currentBalance < GOAL_CHANGE_COST || !changeRequest.justification.trim()}
                                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed"
                                >
                                    {changeRequest.status === 'pending' ? 'Goggins is Judging...' : 'Submit to Goggins'}
                                </button>
                           )}
                        </div>
                        {currentBalance < GOAL_CHANGE_COST && <p className="text-red-500 text-sm mt-2">You can't afford to be weak. You don't have enough in your balance to request a change.</p>}
                    </div>
                </div>
            )}

            {completingGoal && (
                 <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-900 border-2 border-green-500 rounded-lg shadow-2xl max-w-lg w-full p-6 text-center">
                        <h3 className="text-xl font-black text-green-500 mb-2">OBJECTIVE COMPLETE?</h3>
                        <p className="text-gray-300 mb-4">Provide proof of your victory. Debrief the mission.</p>
                        
                        {completingGoal.status === 'denied' ? (
                             <div className="bg-red-900/50 p-4 rounded-lg mb-4">
                                <h4 className="text-lg font-black uppercase text-red-400 mb-2 flex items-center justify-center gap-2"><FireIcon className="w-5 h-5"/> Goggins' Verdict: DENIED</h4>
                                <p className="text-white">{completingGoal.feedback}</p>
                            </div>
                        ) : (
                            <>
                            <p className="mb-4 font-bold text-lg text-white break-words">{completingGoal.goal.contract?.primaryObjective || completingGoal.goal.description}</p>
                            <textarea
                                value={completingGoal.proof}
                                onChange={(e) => setCompletingGoal(prev => prev ? { ...prev, proof: e.target.value } : null)}
                                placeholder="How did you accomplish this? Detail the suffering. Prove you earned it."
                                className="w-full h-32 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                                disabled={completingGoal.status === 'pending'}
                            />
                            </>
                        )}
                        
                        <div className="flex gap-4 mt-4">
                            <button onClick={() => setCompletingGoal(null)} className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition-colors uppercase">
                                {completingGoal.status === 'denied' ? 'Roger That' : 'Cancel'}
                            </button>
                           {completingGoal.status !== 'denied' && (
                                <button 
                                    onClick={submitCompletion}
                                    disabled={completingGoal.status === 'pending' || !completingGoal.proof.trim()}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed"
                                >
                                    {completingGoal.status === 'pending' ? 'Awaiting Verdict...' : 'Submit For Judgement'}
                                </button>
                           )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};