import { useState, useEffect, useCallback } from 'react';
import type { AuthState, DocwiseUser } from '../types/auth';

const STORAGE_KEY = 'docwise-user';

/**
 * Read the stored user from localStorage.
 */
function getStoredUser(): DocwiseUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DocwiseUser;
  } catch {
    return null;
  }
}

/**
 * Save or remove the user in localStorage.
 */
function setStoredUser(user: DocwiseUser | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // localStorage not available
  }
}

/**
 * Generate a random uid.
 */
function generateUid(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Mock auth hook (localStorage-based).
 * Will be replaced with Firebase Auth later.
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  // Initialize from localStorage
  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setAuthState({ status: 'authenticated', user });
    } else {
      setAuthState({ status: 'unauthenticated' });
    }
  }, []);

  const signIn = useCallback((provider: 'google' | 'github' | 'email' | 'anonymous') => {
    const providerNames: Record<string, string> = {
      google: 'Google User',
      github: 'GitHub User',
      email: 'Email User',
      anonymous: 'Anonymous',
    };

    const providerEmails: Record<string, string> = {
      google: 'user@gmail.com',
      github: 'user@github.com',
      email: 'user@docwise.app',
      anonymous: '',
    };

    const user: DocwiseUser = {
      uid: generateUid(),
      email: providerEmails[provider] || null,
      displayName: providerNames[provider] || 'User',
      photoURL: null,
      provider,
      plan: 'free',
      createdAt: new Date().toISOString(),
    };

    setStoredUser(user);
    // Also set the plan key for featureGate
    try {
      localStorage.setItem('docwise-user-plan', user.plan);
    } catch {
      // ignore
    }
    setAuthState({ status: 'authenticated', user });
  }, []);

  const signOut = useCallback(() => {
    setStoredUser(null);
    try {
      localStorage.removeItem('docwise-user-plan');
    } catch {
      // ignore
    }
    setAuthState({ status: 'unauthenticated' });
  }, []);

  const getCurrentUser = useCallback((): DocwiseUser | null => {
    if (authState.status === 'authenticated') {
      return authState.user;
    }
    return null;
  }, [authState]);

  return { authState, signIn, signOut, getCurrentUser };
}
