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
    supabase.auth.getSession().then(
      ({ data, error }) => {
      if (error && import.meta.env.DEV) console.error('[auth] getSession error', error);
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // The state will be updated by the onAuthStateChange listener above
    // when detectSessionInUrl completes the exchange.
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    const error_description = params.get('error_description');

    if (error && import.meta.env.DEV) {
      console.error('[auth] URL error:', error, error_description);
    }

    if (code && import.meta.env.DEV) {
      console.log('[auth] Code detected in URL, waiting for Supabase auto-exchange...');
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
