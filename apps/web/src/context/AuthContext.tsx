import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client.js';

export interface UserProfile {
  id: string;
  displayName: string;
  locationText?: string | null;
  photoPath?: string | null;
  bio?: string | null;
  interests?: Array<{ categoryId: string; category: { id: string; name: string; slug: string } }>;
}

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  profile?: UserProfile | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogleCredential: (credential: string) => Promise<User>;
  getGoogleOAuthUrl: () => Promise<string | null>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      const res = await apiFetch<{ data: User }>('/auth/me');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiFetch<{ data: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(res.data);
    return res.data;
  };

  const loginWithGoogleCredential = async (credential: string): Promise<User> => {
    const res = await apiFetch<{ data: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
    setUser(res.data);
    return res.data;
  };

  const getGoogleOAuthUrl = async (): Promise<string | null> => {
    try {
      const res = await apiFetch<{ data: { url: string | null; isConfigured: boolean } }>('/auth/google/url');
      return res.data.url;
    } catch {
      return null;
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    const res = await apiFetch<{ data: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogleCredential,
        getGoogleOAuthUrl,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
