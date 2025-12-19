
import React, { useState, useMemo } from 'react';
import { WeeklyGoal, Goal, GoalContract } from '../types';
import { getWeekKey } from '../utils/dateUtils';
import { CalendarDaysIcon, FireIcon, StarIcon, PencilIcon, TrashIcon, PlusCircleIcon, XMarkIcon, SparklesIcon, RepeatIcon, CheckCircleIcon, BoltIcon } from './Icons';
import { enhanceText, generatePreStateQuestions, generateWeeklyObjectiveContract } from '../services/geminiService';
import { getCategoryColor } from '../constants';
import { CollapsibleList } from './CollapsibleList';

interface WeeklyGoalProps {
    weeklyGoals: { [key: string]: WeeklyGoal[] };
    goals: Goal[];
    onAddGoal: (weekKey: string, goal: WeeklyGoal) => Promise<void>;
    onUpdateGoal: (weekKey: string, goalId: string, description: string) => Promise<void>;
    onDeleteGoal: (weekKey: string, goalId: string) => void;
    onEvaluateGoal: (weekKey: string, goalId: string) => Promise<void>;
    onUpdateWeeklyGoalContract: (weekKey: string, goalId: string, contract: GoalContract) => Promise<void>;
    isBriefingLoading?: boolean;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);


const ContractCreationModal: React.FC<{
    onClose: () => void;
    onSave?: (goal: Omit<WeeklyGoal, 'id' | 'label'>) => Promise<void>;
    onUpdate?: (goalId: string, contract: GoalContract) => Promise<void>;
    existingGoal?: WeeklyGoal;
    weekKey: string;
}> = ({ onClose, onSave, onUpdate, existingGoal, weekKey }) => {
    const isUpdateMode = !!existingGoal;
    
    const [step, setStep] = useState(isUpdateMode ? 2 : 1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [description, setDescription] = useState(existingGoal?.description || '');
    
    const [whyAnswers, setWhyAnswers] = useState<string[]>(new Array(5).fill(''));
    
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    
    const [contract, setContract] = useState<GoalContract | null>(null);

    const handleStep1Submit = async () => {
        if (!description.trim()) return;
        setStep(2);
    };

    const handleWhyAnswerChange = (index: number, value: string) => {
        const newAnswers = [...whyAnswers];
        newAnswers[index] = value;
        setWhyAnswers(newAnswers);
    };
    
    const getWhyQuestion = (index: number): string => {
        if (index === 0) return `You want to "${description}". Why is that important for this week?`;
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
        const generatedContract = await generateWeeklyObjectiveContract(description, existingGoal?.targetDate || new Date().toISOString(), preStateAnswers, whyAnswers);
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
            const newGoal: Omit<WeeklyGoal, 'id' | 'label'> = {
                description,
                targetDate: new Date().toISOString().split('T')[0],
                contract
            };
            await onSave(newGoal);
        }
    };
    
    const renderStepContent = () => {
        // ... (render logic for steps 1-4, identical to Goal's modal but for weekly goals)
         if (isLoading) {
            return (
                <div className="text-center p-8 min-h-[400px] flex flex-col justify-center">
                    <p className="text-orange-400 animate-pulse-fast text-lg">Goggins is forging your weekly objective...</p>
                    <p className="text-gray-400">Stay ready.</p>
                </div>
            )
        }
        
        switch (step) {
            case 1:
                return (
                    <>
                        <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">Step 1: Define The Weekly Mission</h3>
                        <p className="text-gray-300 mb-4">What's the primary target for the next 7 days? Be specific.</p>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Run 15 miles total" className="w-full h-24 bg-gray-800 text-white placeholder-gray-400 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
                        <div className="mt-6 flex justify-end">
                            <button onClick={handleStep1Submit} disabled={!description.trim()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed">Next</button>
                        </div>
                    </>
                );
            case 2:
                return (
                    <>
                        <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">{isUpdateMode ? 'Re-Assess Your Why' : 'Step 2: The Five Whys'}</h3>
                        <p className="text-gray-300 mb-4">Dig deep. Why this mission, this week?</p>
                        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                           {whyAnswers.map((answer, index) => (
                               <div key={index}>
                                   <label className="block text-sm font-medium text-gray-300 mb-1">{index + 1}. {getWhyQuestion(index)}</label>
                                   <input type="text" value={answer} onChange={(e) => handleWhyAnswerChange(index, e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                               </div>
                           ))}
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(1)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Back</button>
                            <button onClick={handleStep2Submit} disabled={whyAnswers.some(a => !a.trim())} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase disabled:bg-gray-700 disabled:cursor-not-allowed">Next</button>
                        </div>
                    </>
                );
            case 3:
                return (
                     <>
                        <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">{isUpdateMode ? 'Re-Assess Baseline' : 'Step 3: Baseline'}</h3>
                        <p className="text-gray-300 mb-4">Where are you right now? Answer honestly.</p>
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
                            <p className="text-sm font-bold uppercase text-gray-400">Primary Objective</p>
                            <p className="text-lg text-white font-bold">{contract.primaryObjective}</p>
                            <p className="text-sm font-bold uppercase text-gray-400">Terms of Victory (KPIs)</p>
                            <ul className="list-disc list-inside pl-2 text-gray-200">
                                {contract.kpis.map((kpi, i) => <li key={i}>{kpi.description} <span className="text-xs text-cyan-400">({kpi.type})</span></li>)}
                            </ul>
                            <p className="text-sm font-bold uppercase text-gray-400">Payout</p>
                            <p className="text-lg text-green-400 font-bold">{formatCurrency(contract.rewardPayout)}</p>
                        </div>
                        <div className="mt-6 flex justify-between items-center">
                            <button onClick={() => setStep(3)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Back</button>
                            <button onClick={handleContractAccept} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase">Accept & Stay Hard</button>
                        </div>
                    </>
                );
        }
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl max-w-2xl w-full p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors" aria-label="Close"><XMarkIcon className="w-6 h-6" /></button>
                {renderStepContent()}
            </div>
        </div>
    );
};

const GoalAlignmentStars: React.FC<{ score?: number }> = ({ score }) => {
    if (typeof score !== 'number') return null;
    return (
        <div className="flex items-center gap-0.5" title={`Strategic Alignment: ${score}/5`}>
            {Array.from({ length: 5 }).map((_, i) => (
                <StarIcon
                    key={i}
                    className={`w-4 h-4 ${i < score ? 'text-yellow-400' : 'text-gray-600'}`}
                />
            ))}
        </div>
    );
};


export const WeeklyGoalComponent: React.FC<WeeklyGoalProps> = ({ weeklyGoals, goals, onAddGoal, onUpdateGoal, onDeleteGoal, onEvaluateGoal, onUpdateWeeklyGoalContract, isBriefingLoading }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingGoal, setEditingGoal] = useState<WeeklyGoal | null>(null);
    const [loadingGoalId, setLoadingGoalId] = useState<string | null>(null);
    const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

    const today = useMemo(() => new Date(), []);
    const currentWeekKey = useMemo(() => getWeekKey(today), [today]);
    const goalsForWeek = weeklyGoals[currentWeekKey] || [];

    const canEvaluate = useMemo(() => {
        const dayOfWeek = today.getDay(); // Sunday is 0, Saturday is 6
        return dayOfWeek === 6 || dayOfWeek === 0;
    }, [today]);

    const handleSaveNewGoal = async (goal: Omit<WeeklyGoal, 'id' | 'label'>) => {
        await onAddGoal(currentWeekKey, goal as WeeklyGoal);
        setIsAdding(false);
    };

    const handleUpdateContract = async (goalId: string, contract: GoalContract) => {
        await onUpdateWeeklyGoalContract(currentWeekKey, goalId, contract);
        setEditingGoal(null);
    };
    
    const handleEvaluate = async (goalId: string) => {
        setLoadingGoalId(goalId);
        await onEvaluateGoal(currentWeekKey, goalId);
        setLoadingGoalId(null);
    };

    return (
        <>
            <CollapsibleList title="This Week's Objectives" storageKey="goggins-weekly-goals-list-open" defaultOpen={true}>
              <div className="space-y-3">
                  {goalsForWeek.map(goal => {
                      const isCurrentGoalLoading = loadingGoalId === goal.id;
                      const alignedGoal = goal.alignedGoalId ? goals.find(g => g.id === goal.alignedGoalId) : null;

                      if (isCurrentGoalLoading) {
                          return (
                              <div key={goal.id} className="text-center py-4 bg-gray-700/50 rounded-lg">
                                  <p className="text-orange-400 animate-pulse-fast">Goggins is reviewing...</p>
                              </div>
                          );
                      }

                      return (
                          <div key={goal.id} className="bg-gray-700/50 p-4 rounded-lg">
                              <div className="flex justify-between items-start gap-2">
                                  <div className="flex-grow">
                                     <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <p className="text-gray-100 font-bold text-lg break-words">{goal.contract?.primaryObjective || goal.description}</p>
                                        {goal.label && <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCategoryColor(goal.label).bg} ${getCategoryColor(goal.label).text}`}>{goal.label}</span>}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                      {goal.contract && <button onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)} className={`p-2 rounded-full transition-colors ${expandedGoalId === goal.id ? 'bg-orange-500' : 'bg-blue-600/50 hover:bg-blue-500'} text-white`}><BoltIcon className="w-5 h-5" /></button>}
                                      <button onClick={() => setEditingGoal(goal)} className="p-2 rounded-full hover:bg-cyan-500/50 text-gray-300 hover:text-white transition-colors" aria-label="Re-do weekly objective"><RepeatIcon className="w-5 h-5" /></button>
                                      <button onClick={() => onDeleteGoal(currentWeekKey, goal.id)} className="p-2 rounded-full hover:bg-red-500/50 text-gray-300 hover:text-white transition-colors" aria-label="Delete weekly objective" disabled={isBriefingLoading}><TrashIcon className="w-5 h-5" /></button>
                                  </div>
                              </div>

                              {(goal.goalAlignment || alignedGoal) && (
                                  <div className="mt-3 pt-3 border-t border-gray-600 flex items-center justify-between gap-2 flex-wrap">
                                      <GoalAlignmentStars score={goal.goalAlignment} />
                                      {alignedGoal && alignedGoal.label && (
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getCategoryColor(alignedGoal.label).bg} ${getCategoryColor(alignedGoal.label).text}`}>
                                              {alignedGoal.label}
                                          </span>
                                      )}
                                  </div>
                              )}
                              
                               {expandedGoalId === goal.id && goal.contract && (
                                    <div className="mt-3 pt-3 border-t border-gray-600">
                                        <h4 className="text-md font-bold uppercase text-yellow-400 mb-2">Terms of Victory</h4>
                                        <ul className="list-disc list-inside space-y-1 text-gray-200 pl-2">
                                            {goal.contract.kpis.map((kpi, i) => <li key={i}>{kpi.description} ({kpi.target}) <span className="text-xs text-cyan-400">[{kpi.type}]</span></li>)}
                                        </ul>
                                    </div>
                                )}
                              
                              {goal.evaluation ? (
                                  <div className="mt-3 pt-3 border-t border-gray-600">
                                      <h4 className="text-md font-black uppercase text-orange-500 mb-2 flex items-center gap-2">
                                          <FireIcon className="w-4 h-4" />
                                          Goggins' Verdict
                                      </h4>
                                      <div className="flex items-center gap-1 mb-2" title={`Alignment Score: ${goal.evaluation.alignmentScore}/5`}>
                                          {Array.from({ length: 5 }).map((_, i) => (
                                              <StarIcon key={i} className={`w-5 h-5 ${i < goal.evaluation.alignmentScore ? 'text-yellow-400' : 'text-gray-600'}`} />
                                          ))}
                                      </div>
                                      <p className="text-sm text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">{goal.evaluation.feedback}</p>
                                  </div>
                              ) : (
                                  <div className="mt-3 pt-3 border-t border-gray-600">
                                      <button
                                          onClick={() => handleEvaluate(goal.id)}
                                          disabled={!canEvaluate || isBriefingLoading}
                                          className="w-full text-sm bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded transition-colors uppercase tracking-wider disabled:bg-gray-600 disabled:cursor-not-allowed disabled:text-gray-400"
                                      >
                                          {isBriefingLoading ? 'Finalizing Briefing...' : 'Evaluate Performance'}
                                      </button>
                                      {!canEvaluate && <p className="text-xs text-gray-500 text-center mt-1">Evaluation available on Saturday & Sunday.</p>}
                                  </div>
                              )}
                          </div>
                      );
                  })}
              </div>
            </CollapsibleList>

            <div className="mt-4">
              {!isAdding && (
                    <button onClick={() => setIsAdding(true)} disabled={isBriefingLoading} className="w-full flex items-center justify-center gap-2 bg-green-600/20 hover:bg-green-500/30 text-green-300 font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider border-2 border-dashed border-green-500/50 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-600">
                      <PlusCircleIcon className="w-6 h-6"/>
                      Add New Objective
                  </button>
              )}
              {goalsForWeek.length === 0 && !isAdding && (
                  <p className="text-center text-gray-500 py-4">No objectives set for this week. Get your mind right and set a target!</p>
              )}
            </div>
            
            {(isAdding || editingGoal) && (
                <ContractCreationModal
                    onClose={() => { setIsAdding(false); setEditingGoal(null); }}
                    onSave={handleSaveNewGoal}
                    onUpdate={handleUpdateContract}
                    existingGoal={editingGoal || undefined}
                    weekKey={currentWeekKey}
                />
            )}
        </>
    );
};
