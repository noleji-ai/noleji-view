import { useState, useEffect, useCallback } from 'react';
import type { AuthState, DocwiseUser, SupportedAuthProvider } from '../types/auth';
import { createSessionUser, hydrateSupabaseUser, persistUser, readStoredUser } from '../services/accountStore';
import { getSupabaseAuthRedirectUrl } from '../config/env';
import { getSupabaseBrowserClient } from '../lib/supabase';

/**
 * Auth hook with progressive enhancement:
 * - uses Supabase Auth when env vars are configured
 * - falls back to local session mocks in offline/dev mode
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      const user = readStoredUser();
      if (user) {
        setAuthState({ status: 'authenticated', user });
      } else {
        setAuthState({ status: 'unauthenticated' });
      }
      return;
    }

    let isMounted = true;

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted) return;

      if (error || !data.session?.user) {
        persistUser(null);
        setAuthState({ status: 'unauthenticated' });
        return;
      }

      try {
        const mappedUser = await hydrateSupabaseUser(supabase, data.session.user);
        persistUser(mappedUser);
        setAuthState({ status: 'authenticated', user: mappedUser });
      } catch {
        persistUser(null);
        setAuthState({ status: 'unauthenticated' });
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;

      if (!session?.user) {
        persistUser(null);
        setAuthState({ status: 'unauthenticated' });
        return;
      }

      void hydrateSupabaseUser(supabase, session.user)
        .then((mappedUser) => {
          if (!isMounted) return;
          persistUser(mappedUser);
          setAuthState({ status: 'authenticated', user: mappedUser });
        })
        .catch(() => {
          if (!isMounted) return;
          persistUser(null);
          setAuthState({ status: 'unauthenticated' });
        });
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (provider: SupportedAuthProvider) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      const user = createSessionUser(provider);
      persistUser(user);
      setAuthState({ status: 'authenticated', user });
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getSupabaseAuthRedirectUrl(),
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signInWithEmail = useCallback(async (
    email: string,
    password: string,
    mode: 'signin' | 'signup' = 'signin',
  ) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      throw new Error('Supabase 인증 환경변수가 설정되지 않아 이메일 로그인을 사용할 수 없습니다.');
    }

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getSupabaseAuthRedirectUrl(),
        },
      });

      if (error) {
        throw error;
      }

      return {
        requiresConfirmation: !data.session,
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return {
      requiresConfirmation: false,
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    persistUser(null);
    setAuthState({ status: 'unauthenticated' });
  }, []);

  const getCurrentUser = useCallback((): DocwiseUser | null => {
    if (authState.status === 'authenticated') {
      return authState.user;
    }
    return null;
  }, [authState]);

  return { authState, signIn, signInWithEmail, signOut, getCurrentUser };
}
