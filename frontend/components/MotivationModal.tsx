import React from 'react';
import { FireIcon } from './Icons';

interface MotivationModalProps {
  story: string;
  isLoading: boolean;
}

export const MotivationModal: React.FC<MotivationModalProps> = ({ story, isLoading }) => {
  if (!isLoading && !story) {
    return null; // Don't render if there's nothing to show
  }

  return (
    <div className="bg-gray-900/80 border-2 border-orange-500 rounded-lg shadow-2xl p-6 mb-8 relative text-center">
      {isLoading ? (
        <div>
          <h2 className="text-xl font-black text-orange-500 mb-2 animate-pulse-fast flex items-center justify-center gap-2">
            <FireIcon className="w-5 h-5"/>
            FORGING MENTAL CALLUSES...
          </h2>
          <p className="text-gray-300">Get ready for the briefing.</p>
        </div>
      ) : (
        <div>
          <h2 className="text-xl font-black uppercase text-orange-500 mb-4 flex items-center justify-center gap-2">
            <FireIcon className="w-5 h-5"/>
            GOGGINS BRIEFING
          </h2>
          <p className="text-md text-gray-200 whitespace-pre-wrap font-medium leading-relaxed">{story}</p>
        </div>
      )}
    </div>
  );
};
