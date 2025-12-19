import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (username: string, password?: string) => Promise<void>;
    signup: (username: string, password?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            const currentUser = await authService.getCurrentUser();

            if (currentUser) {
                setUser(currentUser);
                setIsAuthenticated(true);
            }

            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (username: string, password?: string) => {
        setIsLoading(true);
        try {
            const loggedInUser = await authService.login(username, password);
            setUser(loggedInUser);
            setIsAuthenticated(true);
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (username: string, password?: string) => {
        setIsLoading(true);
        try {
            const newUser = await authService.signup(username, password);
            setUser(newUser);
            setIsAuthenticated(true);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setUser(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, signup, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
