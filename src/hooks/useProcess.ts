import { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { ProcessResponse } from '../types';

interface FunctionsErrorContext {
  json?: () => Promise<{ error?: string } | undefined>;
}

export function useProcess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const process = async (
    paragraph: string,
    words: string[]
  ): Promise<ProcessResponse | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke<ProcessResponse>(
        'process-paragraph',
        { body: { paragraph, words } }
      );

      if (fnError) {
        const ctx = (fnError as unknown as { context?: FunctionsErrorContext }).context;
        let detail: string | undefined;
        if (ctx && typeof ctx.json === 'function') {
          try {
            const body = await ctx.json();
            detail = body?.error;
          } catch {
            // body wasn't JSON; fall back to error message
          }
        }
        throw new Error(detail || fnError.message || 'Edge function failed');
      }
      if (!data) throw new Error('No response from processing function');
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { process, loading, error };
}
