# broWord — Execution Plan

## 1. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite | Spec requirement (React + TS). Vite is the fastest dev loop. |
| Styling | Plain CSS with custom properties | Spec requirement ("Ordinary CSS"). Custom props give us a small design system without a dep. |
| Auth + DB | Supabase (Google OAuth) | Spec requirement. OAuth 2.0 via Supabase's built-in Google provider. |
| LLM | Gemini 2.0 Flash (free tier) | Spec requirement. Free tier is enough for a learning app. |
| LLM proxy | Supabase Edge Function (Deno) | Keeps the Gemini key off the client and lets us enforce token limits server-side. |

## 2. Data model

```
profiles
  id uuid pk -> auth.users.id
  email text
  tokens_used int          -- resets every 24h
  daily_token_limit int    -- per-user budget
  last_reset timestamptz
  created_at timestamptz

paragraph_sessions
  id uuid pk
  user_id uuid -> auth.users.id
  paragraph text
  selected_words text[]
  result jsonb              -- { words: [...], simplified_paragraph: "..." }
  prompt_tokens int
  completion_tokens int
  total_tokens int
  created_at timestamptz
```

RLS: every row is scoped by `auth.uid()`. A trigger creates a `profiles` row on first sign-in. Two SQL helpers — `reset_daily_tokens_if_needed` and `increment_tokens` — run with `security definer` so the edge function can call them.

## 3. Token control

1. On every call, the edge function calls `reset_daily_tokens_if_needed` (resets the counter if `last_reset > 24h ago`).
2. It then reads `tokens_used` and `daily_token_limit`. If the user is over budget → 429 with a friendly message.
3. After Gemini responds, `increment_tokens` is called with the `usageMetadata.totalTokenCount` Gemini reports.
4. The UI shows a token badge with the remaining budget.

Default budget is 50 000 tokens / day — generous for a study session, low enough to stop runaway loops.

## 4. Request flow

```
User → React → Supabase auth (JWT in header)
                      ↓
              Edge function `process-paragraph`
                      ↓
        validate paragraph (≤250 words), words (1..30)
                      ↓
        reset / check token budget
                      ↓
        call Gemini (responseMimeType=application/json,
                     responseSchema enforced)
                      ↓
        persist session + increment tokens
                      ↓
        { result, tokens_used, tokens_remaining }
```

## 5. Prompt

The edge function injects the paragraph + selected words into a single prompt that asks Gemini for a JSON object with two top-level keys: `words[]` (each item has `word`, `simplified`, `definition`) and `simplified_paragraph`. Definition target is 30 words at A1-B2 level. Gemini is forced into JSON via `responseMimeType` + `responseSchema`.

## 6. UI states

```
unauthed → Welcome screen with one Google sign-in button
authed   → 3 stages
           ├ input    : paste paragraph (live word counter)
           ├ select   : tokenized paragraph; click to toggle words
           └ result   : definition cards + simplified paragraph + original
```

Hovering a definition card highlights the corresponding simplified word in the rewritten paragraph.

## 7. Style direction

- White background, near-black text (#111), thin weights (200–300).
- Single accent for selection: inverted block (black bg, white fg).
- Slow ease-out transitions (≈400–600ms) on every interactive element.
- One subtle highlight color (`#fff7c2`) for the active-word reveal.
- No gradients. No saturated UI colors.

## 8. Build sequence

1. Database (`supabase/migrations/001_initial_schema.sql` → SQL Editor).
2. Edge function (`supabase functions deploy process-paragraph` + `supabase secrets set GEMINI_API_KEY=…`).
3. Auth provider (Google OAuth in Supabase dashboard).
4. Frontend env (`.env` from `.env.example`).
5. `npm install && npm run dev`.

Detailed steps live in `README.md`.
