import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BoltIcon, KeyIcon } from './Icons';

const LoginScreen: React.FC = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState(''); // Just for visual, we don't check it
    const [isSignup, setIsSignup] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username) {
            setError("You need a name, soldier.");
            return;
        }

        // In our mock, signup and login are essentially the same action store-wise
        await login(username);
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                <div className="flex justify-center mb-6">
                    <BoltIcon className="w-16 h-16 text-orange-500 animate-pulse" />
                </div>
                <h2 className="text-3xl font-black text-white text-center mb-2 uppercase tracking-tighter">
                    {isSignup ? "Enlist Now" : "Goggins Grind"}
                </h2>
                <p className="text-gray-400 text-center mb-8 text-sm">
                    {isSignup ? "Join the few. The proud. The hard." : "Report for duty."}
                </p>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm font-bold text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                            placeholder="CALLSIGN"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-500 text-xs font-bold mb-1 uppercase tracking-wider">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900 text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-orange-500 transition-colors font-mono"
                            placeholder="••••••••"
                        />
                    </div>

                    {isSignup ? (
                        <div className="pt-2 pb-2 mt-2">
                            <p className="text-xs text-gray-500 mt-1">
                                Join the ranks. No retreat.
                            </p>
                        </div>
                    ) : null}

                    <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded uppercase tracking-widest text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg mt-6"
                    >
                        {isSignup ? "Join the Grind" : "Login"}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-gray-500 hover:text-white text-sm transition-colors"
                    >
                        {isSignup ? "Already drafted? Login." : "New recruit? Enlist here."}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
