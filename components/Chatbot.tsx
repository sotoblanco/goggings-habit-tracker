import React, { useState, useEffect, useRef } from 'react';
import { XMarkIcon, FireIcon, SparklesIcon } from './Icons';

interface Message {
    sender: 'user' | 'ai';
    content: string;
}

interface ChatbotProps {
    isOpen: boolean;
    onClose: () => void;
    messages: Message[];
    onSendMessage: (message: string) => void;
    isLoading: boolean;
}

const AIMessage: React.FC<{ content: string }> = ({ content }) => (
    <div className="flex gap-3 my-4 text-gray-200 text-sm flex-1">
        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center flex-shrink-0">
            <FireIcon className="w-6 h-6 text-orange-400" />
        </div>
        <div className="leading-relaxed bg-gray-800 p-3 rounded-lg">
            <span className="block font-bold text-orange-400">Goggins AI</span>
            <p className="text-md whitespace-pre-wrap">{content}</p>
        </div>
    </div>
);

const UserMessage: React.FC<{ content: string }> = ({ content }) => (
    <div className="flex gap-3 my-4 text-gray-200 text-sm flex-1 justify-end">
        <div className="leading-relaxed text-right bg-blue-900/50 p-3 rounded-lg">
            <span className="block font-bold text-cyan-400">You</span>
            <p className="text-md whitespace-pre-wrap">{content}</p>
        </div>
         <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
            <span className="text-xl font-bold">💪</span>
        </div>
    </div>
);

export const Chatbot: React.FC<ChatbotProps> = ({ isOpen, onClose, messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSend = () => {
        if (input.trim()) {
            onSendMessage(input);
            setInput('');
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-0 right-0 mb-4 mr-4 w-[90vw] h-[70vh] max-w-md max-h-[600px] flex flex-col bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl z-50 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 rounded-t-lg flex-shrink-0">
                <div className="flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-xl font-black uppercase text-white">AI Tactical Advisor</h3>
                </div>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700 transition-colors">
                    <XMarkIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
                {messages.map((msg, index) => (
                    msg.sender === 'ai'
                        ? <AIMessage key={index} content={msg.content} />
                        : <UserMessage key={index} content={msg.content} />
                ))}
                {isLoading && (
                    <div className="flex gap-3 my-4 text-gray-200 text-sm flex-1">
                        <div className="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500 flex items-center justify-center flex-shrink-0">
                            <FireIcon className="w-6 h-6 text-orange-400 animate-pulse-fast" />
                        </div>
                        <div className="leading-relaxed bg-gray-800 p-3 rounded-lg">
                            <span className="block font-bold text-orange-400">Goggins AI</span>
                            <p className="text-md animate-pulse-fast">Thinking...</p>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800/50 rounded-b-lg flex-shrink-0">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask Goggins..."
                        className="w-full bg-gray-700 text-white placeholder-gray-400 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-5 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
};