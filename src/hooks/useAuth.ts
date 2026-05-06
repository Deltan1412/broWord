import { useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    // Subscribe FIRST so we never miss the SIGNED_IN event that
    // detectSessionInUrl/exchangeCodeForSession fires after Google OAuth.
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (import.meta.env.DEV) console.log('[auth] onAuthStateChange', event, newSession?.user?.email);
      if (!active) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    // Then prime the state with whatever session is already cached.
    supabase.auth.getSession().then(({ data, error }) => {
      if (error && import.meta.env.DEV) console.error('[auth] getSession error', error);
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // PKCE fallback: if Supabase didn't auto-exchange the ?code=... param
    // (can happen under React Strict Mode where the first effect's call
    // consumed the code before this run subscribed), do it explicitly.
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const error_description = params.get('error_description');

    if (error && import.meta.env.DEV) {
      console.error('[auth] URL error:', error, error_description);
    }

    if (code) {
      if (import.meta.env.DEV) console.log('[auth] Found code in URL, exchanging...');
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          if (import.meta.env.DEV) console.warn('[auth] exchange failed (might have been handled by detectSessionInUrl)', error);
        } else if (data.session) {
          if (import.meta.env.DEV) console.log('[auth] exchange successful');
          setSession(data.session);
          setUser(data.session.user);
        }
        // Always strip ?code= and ?error= from the URL so a refresh doesn't retry.
        const url = new URL(window.location.href);
        url.searchParams.delete('code');
        url.searchParams.delete('error');
        url.searchParams.delete('error_description');
        url.searchParams.delete('state');
        window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
      });
    }

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error && import.meta.env.DEV) console.error('[auth] signInWithOAuth error:', error);
    return { data, error };
  };

  const signInWithPassword = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error && import.meta.env.DEV) console.error('[auth] signInWithPassword error:', error);
    return { data, error };
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error && import.meta.env.DEV) console.error('[auth] signUp error:', error);
    return { data, error };
  };

  const signOut = async () => supabase.auth.signOut();

  return { session, user, loading, signInWithGoogle, signInWithPassword, signUp, signOut };
}
