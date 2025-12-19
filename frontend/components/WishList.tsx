
import React, { useState } from 'react';
import { Wish, GoalContract } from '../types';
import { LightBulbIcon, PlusIcon, TrashIcon, BoltIcon, PencilIcon, CheckCircleIcon, XMarkIcon, LinkIcon, RepeatIcon } from './Icons';
import { CollapsibleList } from './CollapsibleList';
import { generatePreStateQuestions, generateWishContract } from '../services/geminiService';

interface WishListProps {
  wishList: Wish[];
  onAddWish: (wishData: Wish) => void;
  onUpdateWish: (wishId: string, updates: { description: string; link?: string; explanation: string }) => void;
  onDeleteWish: (wishId: string) => void;
  onGogginsWishSelection: () => void;
  isSelectingWish: boolean;
  onUpdateWishContract: (wishId: string, contract: GoalContract) => Promise<void>;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const ContractCreationModal: React.FC<{
    onClose: () => void;
    onSave?: (wish: Omit<Wish, 'id' | 'label'>) => Promise<void>;
    onUpdate?: (wishId: string, contract: GoalContract) => Promise<void>;
    existingWish?: Wish;
}> = ({ onClose, onSave, onUpdate, existingWish }) => {
    const isUpdateMode = !!existingWish;
    
    const [step, setStep] = useState(isUpdateMode ? 2 : 1);
    const [isLoading, setIsLoading] = useState(false);
    
    const [description, setDescription] = useState(existingWish?.description || '');
    const [explanation, setExplanation] = useState(existingWish?.explanation || '');
    const [link, setLink] = useState(existingWish?.link || '');
    
    const [whyAnswers, setWhyAnswers] = useState<string[]>(new Array(5).fill(''));
    const [questions, setQuestions] = useState<string[]>([]);
    const [answers, setAnswers] = useState<string[]>([]);
    const [contract, setContract] = useState<GoalContract | null>(null);

    const handleStep1Submit = () => {
        if (description.trim() && explanation.trim()) setStep(2);
    };

    const handleWhyAnswerChange = (index: number, value: string) => {
        setWhyAnswers(prev => prev.map((a, i) => i === index ? value : a));
    };

    const getWhyQuestion = (index: number): string => {
        if (index === 0) return `You want to conquer "${description}". Why is that important?`;
        const prev = whyAnswers[index - 1];
        return `And why is "${prev}" important?`;
    };

    const handleStep2Submit = async () => {
        setIsLoading(true);
        const { questions: genQuestions } = await generatePreStateQuestions(description, whyAnswers);
        setQuestions(genQuestions);
        setAnswers(new Array(genQuestions.length).fill(''));
        setIsLoading(false);
        setStep(3);
    };

    const handleAnswerChange = (index: number, value: string) => {
        setAnswers(prev => prev.map((a, i) => i === index ? value : a));
    };

    const handleStep3Submit = async () => {
        const preState = questions.map((q, i) => ({ question: q, answer: answers[i] || 'N/A' }));
        setIsLoading(true);
        const genContract = await generateWishContract(description, preState, whyAnswers);
        setContract(genContract);
        setIsLoading(false);
        setStep(4);
    };

    const handleContractAccept = async () => {
        if (!contract) return;
        setIsLoading(true);
        if (isUpdateMode && onUpdate && existingWish) {
            await onUpdate(existingWish.id, contract);
        } else if (!isUpdateMode && onSave) {
            const newWish: Omit<Wish, 'id' | 'label'> = { description, explanation, link, contract };
            await onSave(newWish);
        }
    };
    
    const renderStepContent = () => {
        if (isLoading) return <div className="text-center p-8"><p className="text-orange-400 animate-pulse-fast">Forging contract...</p></div>;
        switch(step) {
            case 1: return <>
                <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">Step 1: Define The Challenge</h3>
                <div className="space-y-4">
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Challenge (e.g., Run a 5k without stopping)" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"/>
                    <textarea value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="Why is this challenge important to you?" className="w-full h-24 bg-gray-800 text-white border border-gray-600 rounded px-3 py-2 resize-none"/>
                    <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="Link (Optional)" className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"/>
                </div>
                <div className="mt-6 flex justify-end"><button onClick={handleStep1Submit} disabled={!description.trim() || !explanation.trim()} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded uppercase disabled:bg-gray-700">Next</button></div>
            </>;
            case 2: return <>
                <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">Step 2: The Five Whys</h3>
                <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                    {whyAnswers.map((a, i) => <div key={i}><label className="block text-sm text-gray-300 mb-1">{i+1}. {getWhyQuestion(i)}</label><input type="text" value={a} onChange={e => handleWhyAnswerChange(i, e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"/></div>)}
                </div>
                <div className="mt-6 flex justify-between"><button onClick={() => setStep(1)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded uppercase">Back</button><button onClick={handleStep2Submit} disabled={whyAnswers.some(a=>!a.trim())} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded uppercase disabled:bg-gray-700">Next</button></div>
            </>;
            case 3: return <>
                <h3 className="text-2xl font-black text-orange-500 mb-2 uppercase">Step 3: Baseline</h3>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                    {questions.map((q, i) => <div key={i}><label className="block text-sm text-gray-300 mb-1">{q}</label><input type="text" value={answers[i]} onChange={e => handleAnswerChange(i, e.target.value)} className="w-full bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"/></div>)}
                </div>
                <div className="mt-6 flex justify-between"><button onClick={() => setStep(2)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded uppercase">Back</button><button onClick={handleStep3Submit} disabled={answers.some(a=>!a.trim())} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded uppercase disabled:bg-gray-700">Forge Contract</button></div>
            </>;
            case 4: return contract && <>
                <h3 className="text-2xl font-black text-yellow-400 mb-2 uppercase">Step 4: Sign Contract</h3>
                <p className="text-gray-300 mb-4 italic">"{contract.contractStatement}"</p>
                <div className="bg-gray-800/50 p-4 rounded-lg space-y-3">
                    <p className="text-lg text-white font-bold">{contract.primaryObjective}</p>
                    <ul className="list-disc list-inside pl-2 text-gray-200">{contract.kpis.map((kpi, i) => <li key={i}>{kpi.description} ({kpi.target}) <span className="text-xs text-cyan-400">[{kpi.type}]</span></li>)}</ul>
                    <p className="text-lg text-green-400 font-bold">Payout: {formatCurrency(contract.rewardPayout)}</p>
                </div>
                <div className="mt-6 flex justify-between"><button onClick={() => setStep(3)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded uppercase">Back</button><button onClick={handleContractAccept} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded uppercase">Accept</button></div>
            </>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl max-w-2xl w-full p-6 relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><XMarkIcon /></button>
                {renderStepContent()}
            </div>
        </div>
    );
}

export const WishList: React.FC<WishListProps> = ({ wishList, onAddWish, onUpdateWish, onDeleteWish, onGogginsWishSelection, isSelectingWish, onUpdateWishContract }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingWish, setEditingWish] = useState<Wish | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleSaveNew = async (wish: Omit<Wish, 'id' | 'label'>) => {
    onAddWish(wish as Wish);
    setIsAdding(false);
  };

  const handleUpdateContract = async (wishId: string, contract: GoalContract) => {
      await onUpdateWishContract(wishId, contract);
      setEditingWish(null);
  };

  return (
    <>
      <h3 className="text-lg font-bold text-gray-200 uppercase flex items-center justify-center gap-2 mb-4">
        <LightBulbIcon className="w-6 h-6 text-yellow-400" />
        Wish List
      </h3>
      <p className="text-sm text-center text-gray-400 mb-4">Your backlog of challenges. Good wishes are specific, actionable, and push you out of your comfort zone (e.g., 'Run a 5k without stopping' instead of 'Get better at running').</p>

      <button
        type="button"
        onClick={onGogginsWishSelection}
        disabled={isSelectingWish || wishList.length === 0}
        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded transition-colors uppercase tracking-wider disabled:bg-indigo-800 disabled:cursor-not-allowed"
      >
        {isSelectingWish ? (
            <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Goggins is Choosing...</span>
            </>
        ) : (
            <>
                <BoltIcon className="w-5 h-5" />
                Turn Wish Into Mission
            </>
        )}
      </button>

      <CollapsibleList title="Challenges Backlog" storageKey="goggins-wishlist-open" defaultOpen={true}>
        <div className="space-y-2 my-2 max-h-64 overflow-y-auto pr-2">
          {wishList.length > 0 ? (
            wishList.map(wish => (
              <div key={wish.id} className="bg-gray-700/50 p-3 rounded-lg group">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                        <p className="text-white font-bold flex items-center gap-2">
                            {wish.contract?.primaryObjective || wish.description}
                            {wish.link && <a href={wish.link} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300" title={wish.link}><LinkIcon className="w-4 h-4" /></a>}
                        </p>
                        <p className="text-sm text-gray-400 break-words mt-1">{wish.explanation}</p>
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-2">
                        {wish.contract && <button onClick={() => setExpandedId(expandedId === wish.id ? null : wish.id)} className="p-1 rounded-full text-gray-400 hover:text-yellow-400"><BoltIcon className="w-4 h-4" /></button>}
                        <button onClick={() => setEditingWish(wish)} className="p-1 rounded-full text-gray-400 hover:text-cyan-400"><RepeatIcon className="w-4 h-4" /></button>
                        <button onClick={() => onDeleteWish(wish.id)} className="p-1 rounded-full text-gray-500 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                    </div>
                  </div>
                  {expandedId === wish.id && wish.contract && (
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <h4 className="text-md font-bold uppercase text-yellow-400 mb-2">Terms of Conquest</h4>
                        <ul className="list-disc list-inside space-y-1 text-gray-200 pl-2">
                            {wish.contract.kpis.map((kpi, i) => <li key={i}>{kpi.description} ({kpi.target}) <span className="text-xs text-cyan-400">[{kpi.type}]</span></li>)}
                        </ul>
                    </div>
                  )}
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">Your wish list is empty. Add something you're afraid to do.</p>
          )}
        </div>
      </CollapsibleList>

      <div className="pt-4 border-t border-gray-700 mt-4">
          <button onClick={() => setIsAdding(true)} className="w-full bg-orange-600/20 hover:bg-orange-500/30 border-2 border-dashed border-orange-500/50 text-orange-300 font-bold p-3 rounded-lg transition-colors flex items-center justify-center gap-1">
                <PlusIcon className="w-5 h-5" /> Add Challenge
            </button>
      </div>

      {(isAdding || editingWish) && (
          <ContractCreationModal 
            onClose={() => {setIsAdding(false); setEditingWish(null)}}
            onSave={handleSaveNew}
            onUpdate={handleUpdateContract}
            existingWish={editingWish || undefined}
          />
      )}
    </>
  );
};
