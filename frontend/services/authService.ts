import { api } from './api';
import { User } from '../types';

export interface AuthState {
    user: User | null;
    apiKey: string | null;
    isAuthenticated: boolean;
}

const STORAGE_KEY_TOKEN = 'goggins_auth_token';

export const authService = {
    login: async (username: string): Promise<User> => {
        const response = await api.auth.login(username); // Remove API Key
        localStorage.setItem(STORAGE_KEY_TOKEN, response.token);
        return response.user;
    },

    signup: async (username: string): Promise<User> => {
        const response = await api.auth.register(username); // Remove API Key
        localStorage.setItem(STORAGE_KEY_TOKEN, response.token);
        return response.user;
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEY_TOKEN);
    },

    getCurrentUser: async (): Promise<User | null> => {
        const token = localStorage.getItem(STORAGE_KEY_TOKEN);
        if (!token) return null;
        try {
            return await api.auth.me();
        } catch (e) {
            console.error("Failed to fetch user:", e);
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            return null;
        }
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem(STORAGE_KEY_TOKEN);
    }
};
