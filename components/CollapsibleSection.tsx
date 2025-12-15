
import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ChevronDownIcon, ChevronRightIcon } from './Icons';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, icon, storageKey, defaultOpen = true, children }) => {
  const [isOpen, setIsOpen] = useLocalStorage(storageKey, defaultOpen);

  return (
    <div className="bg-gray-800/50 rounded-lg border border-gray-700 shadow-lg">
      <h2 className="sr-only">{title}</h2>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-500 transition-all duration-200 ${isOpen ? 'rounded-t-lg bg-gray-700/50' : 'rounded-lg hover:bg-gray-700/30'}`}
        aria-expanded={isOpen}
        aria-controls={`${storageKey}-content`}
      >
        {isOpen ? <ChevronDownIcon className="w-5 h-5 text-gray-400 flex-shrink-0" /> : <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />}
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xl font-extrabold uppercase text-white tracking-wider">{title}</span>
        </div>
      </button>
      <div
        id={`${storageKey}-content`}
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
            <div className="p-6 border-t border-gray-700">
                {children}
            </div>
        </div>
      </div>
    </div>
  );
};
