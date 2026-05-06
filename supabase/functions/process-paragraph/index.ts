// Supabase Edge Function: process-paragraph
//
// Validates input, enforces per-user daily token budget, calls Gemini Flash,
// persists the session, and returns the structured result.
//
// Required secrets (set via `supabase secrets set ...`):
//   GEMINI_API_KEY       — https://aistudio.google.com/apikey
//   SUPABASE_URL         — auto-set by Supabase
//   SUPABASE_ANON_KEY    — auto-set by Supabase
//   SUPABASE_SERVICE_ROLE_KEY — auto-set by Supabase

import { createClient } from '@supabase/supabase-js';

interface RequestBody {
  paragraph: string;
  words: string[];
}

interface WordEntry {
  word: string;
  simplified: string;
  definition: string;
}

interface ParsedResult {
  words: WordEntry[];
  simplified_paragraph: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

const MAX_WORDS = 250;
const MAX_SELECTED = 30;
const MIN_WORDS = 5;
const MODEL = 'gemini-3-flash-preview';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function buildPrompt(paragraph: string, words: string[]): string {
  return `You are an English teacher creating learning material for an A1-B2 ESL student.

Given the paragraph and the list of difficult words below, do three things:

1. For each difficult word, give a simpler synonym that fits the meaning in this paragraph.
2. For each difficult word, write a definition of approximately 30 words in A1-B2 English explaining its meaning IN THE CONTEXT of this paragraph. Aim exactly for 30 words.
3. Rewrite the paragraph replacing ONLY the difficult words with their simpler synonyms. Keep meaning, tone, length, and punctuation. Do not paraphrase other words.

Output ONLY a valid JSON object with this exact shape — no markdown, no commentary, no code fences:

{
  "words": [
    { "word": "<original>", "simplified": "<simpler word>", "definition": "<~30 words A1-B2 English>" }
  ],
  "simplified_paragraph": "<rewritten paragraph>"
}

PARAGRAPH:
"""
${paragraph}
"""

DIFFICULT WORDS:
${words.map((w, i) => `${i + 1}. ${w}`).join('\n')}`;
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  return JSON.parse(fenced ? fenced[1] : trimmed);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function isParsedResult(x: unknown): x is ParsedResult {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (typeof o.simplified_paragraph !== 'string') return false;
  if (!Array.isArray(o.words)) return false;
  return o.words.every((w) => {
    if (!w || typeof w !== 'object') return false;
    const e = w as Record<string, unknown>;
    return (
      typeof e.word === 'string' &&
      typeof e.simplified === 'string' &&
      typeof e.definition === 'string'
    );
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return jsonResponse({ error: 'Missing authorization header' }, 401);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse({ error: 'Supabase environment not configured' }, 500);
    }
    if (!geminiApiKey) {
      return jsonResponse({ error: 'GEMINI_API_KEY is not set' }, 500);
    }

    // Validate user via the JWT they sent.
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUser.auth.getUser();
    if (userError || !user) return jsonResponse({ error: 'Unauthorized' }, 401);

    // Service-role client bypasses RLS for the privileged budget bookkeeping.
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    if (!body.paragraph || typeof body.paragraph !== 'string') {
      return jsonResponse({ error: 'Missing paragraph' }, 400);
    }
    if (!Array.isArray(body.words) || body.words.length === 0) {
      return jsonResponse({ error: 'Select at least one word' }, 400);
    }
    const wc = wordCount(body.paragraph);
    if (wc > MAX_WORDS) {
      return jsonResponse({ error: `Paragraph exceeds ${MAX_WORDS} words` }, 400);
    }
    if (wc < MIN_WORDS) {
      return jsonResponse({ error: `Paragraph is too short` }, 400);
    }
    if (body.words.length > MAX_SELECTED) {
      return jsonResponse({ error: `Too many selected words (max ${MAX_SELECTED})` }, 400);
    }

    // Reset the daily counter if a day has elapsed.
    await supabase.rpc('reset_daily_tokens_if_needed', { p_user_id: user.id });

    // Make sure a profile exists (defensive — trigger should have created it).
    let { data: profile } = await supabase
      .from('profiles')
      .select('tokens_used, daily_token_limit')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email })
        .select('tokens_used, daily_token_limit')
        .single();
      if (insertErr || !inserted) {
        return jsonResponse({ error: 'Could not create profile' }, 500);
      }
      profile = inserted;
    }

    if (profile.tokens_used >= profile.daily_token_limit) {
      return jsonResponse(
        {
          error: 'Daily token limit reached. Try again tomorrow.',
          tokens_used: profile.tokens_used,
          daily_token_limit: profile.daily_token_limit,
        },
        429
      );
    }

    // Call Gemini.
    const prompt = buildPrompt(body.paragraph, body.words);
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiApiKey}`;
    const geminiResp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              words: {
                type: 'ARRAY',
                items: {
                  type: 'OBJECT',
                  properties: {
                    word: { type: 'STRING' },
                    simplified: { type: 'STRING' },
                    definition: { type: 'STRING' },
                  },
                  required: ['word', 'simplified', 'definition'],
                },
              },
              simplified_paragraph: { type: 'STRING' },
            },
            required: ['words', 'simplified_paragraph'],
          },
        },
      }),
    });

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error('Gemini error:', geminiResp.status, errText);
      return jsonResponse({ error: 'Gemini API error', detail: errText.slice(0, 500) }, 502);
    }

    const geminiJson = (await geminiResp.json()) as GeminiResponse;
    const text = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    let parsed: unknown;
    try {
      parsed = extractJson(text);
    } catch (err) {
      console.error('Failed to parse Gemini JSON:', text, err);
      return jsonResponse({ error: 'Bad model response (not JSON)' }, 502);
    }
    if (!isParsedResult(parsed)) {
      console.error('Bad shape:', parsed);
      return jsonResponse({ error: 'Bad model response (wrong shape)' }, 502);
    }

    const promptTokens = geminiJson.usageMetadata?.promptTokenCount ?? 0;
    const completionTokens = geminiJson.usageMetadata?.candidatesTokenCount ?? 0;
    const totalTokens =
      geminiJson.usageMetadata?.totalTokenCount ?? promptTokens + completionTokens;

    // Persist the session for history / debugging.
    await supabase.from('paragraph_sessions').insert({
      user_id: user.id,
      paragraph: body.paragraph,
      selected_words: body.words,
      result: parsed,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_tokens: totalTokens,
    });

    // Add to the daily counter.
    const { data: newTotal } = await supabase.rpc('increment_tokens', {
      p_user_id: user.id,
      p_tokens: totalTokens,
    });
    const tokensRemaining = Math.max(
      0,
      profile.daily_token_limit - (typeof newTotal === 'number' ? newTotal : profile.tokens_used + totalTokens)
    );

    return jsonResponse({
      result: parsed,
      tokens_used: totalTokens,
      tokens_remaining: tokensRemaining,
    });
  } catch (err) {
    console.error('Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return jsonResponse({ error: message }, 500);
  }
});
