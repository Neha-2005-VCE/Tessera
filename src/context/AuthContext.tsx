import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI, getAuthToken } from '../services/api.js';

interface User {
  id: string;
  name: string;
  type: 'student' | 'professional';
  email: string;
  institute?: string;
  graduationYear?: number;
  company?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth token on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = getAuthToken();
      
      if (token) {
        try {
          const response = await authAPI.getProfile();
          setUser(response.user);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          authAPI.logout(); // Clear invalid token
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const response = await authAPI.login(credentials);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await authAPI.register(userData);
      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const isAuthenticated = user !== null;

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isAuthenticated, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};