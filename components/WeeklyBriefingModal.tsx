import React from 'react';
import { FireIcon, XMarkIcon } from './Icons';

interface WeeklyBriefingModalProps {
  briefing: string;
  onClose: () => void;
}

export const WeeklyBriefingModal: React.FC<WeeklyBriefingModalProps> = ({ briefing, onClose }) => {
  if (!briefing) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gray-900 border-2 border-orange-500 rounded-lg shadow-2xl max-w-2xl w-full p-6 relative animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors" aria-label="Close briefing">
          <XMarkIcon className="w-6 h-6" />
        </button>
        <div className="text-center mb-4">
          <h2 className="text-2xl font-black uppercase text-orange-500 flex items-center justify-center gap-2">
            <FireIcon />
            WEEKLY BRIEFING
          </h2>
          <p className="text-gray-300">Your orders for the next seven days.</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto pr-2">
          <p className="text-md text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">{briefing}</p>
        </div>
        <div className="text-center mt-6">
          <button onClick={onClose} className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-6 rounded transition-colors uppercase">
            Roger That
          </button>
        </div>
      </div>
    </div>
  );
};
