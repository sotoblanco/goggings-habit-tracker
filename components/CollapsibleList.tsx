import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ChevronDownIcon, ChevronRightIcon } from './Icons';

interface CollapsibleListProps {
  title: string | React.ReactNode;
  storageKey: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export const CollapsibleList: React.FC<CollapsibleListProps> = ({ title, storageKey, defaultOpen = true, children, className = '', headerClassName = '', contentClassName = '' }) => {
  const [isOpen, setIsOpen] = useLocalStorage(storageKey, defaultOpen);

  return (
    <div className={className}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-2 text-left p-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 hover:bg-gray-700/50 transition-colors ${headerClassName}`}
        aria-expanded={isOpen}
        aria-controls={`${storageKey}-content`}
      >
        {isOpen ? <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRightIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <div className="text-md font-bold text-gray-300 uppercase tracking-wider">
          {title}
        </div>
      </button>
      <div
        id={`${storageKey}-content`}
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className={`overflow-hidden pl-4 ${contentClassName}`}>
          <div className="pt-2">
             {children}
          </div>
        </div>
      </div>
    </div>
  );
};
