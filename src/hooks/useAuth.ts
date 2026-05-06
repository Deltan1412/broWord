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
      if (!active) return;
      if (import.meta.env.DEV) console.log('[auth]', event, !!newSession);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);
    });

    // Then prime the state with whatever session is already cached.
    supabase.auth.getSession().then(({ data }) => {
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
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error && import.meta.env.DEV) console.warn('[auth] exchange failed', error);
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
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const signOut = async () => supabase.auth.signOut();

  return { session, user, loading, signInWithGoogle, signOut };
}
