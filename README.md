# broWord

A minimal English-learning reader. Paste a paragraph, click the words you don't know, and read it back simpler — with synonyms, A1-B2 definitions, and a rewritten version.

```
paste → select → simplify
```

## Stack

- React 18 + TypeScript + Vite + plain CSS
- Supabase (Google OAuth, Postgres, Edge Functions)
- Gemini 2.0 Flash (free tier)
- Per-user daily token budget enforced server-side

## Layout

```
.
├── docs/
│   ├── broWord_task.md        — original spec
│   └── EXECUTION_PLAN.md      — design rationale
├── src/                       — React app
├── supabase/
│   ├── migrations/001_initial_schema.sql
│   └── functions/process-paragraph/index.ts
├── package.json
└── README.md
```

## Setup

### 1. Install JS deps

```bash
npm install
```

### 2. Create a Supabase project

Go to [supabase.com](https://supabase.com) and start a new project. From **Project Settings → API**, copy:

| Field | Goes to |
| --- | --- |
| Project URL | `VITE_SUPABASE_URL` (frontend) |
| `anon` public key | `VITE_SUPABASE_ANON_KEY` (frontend) |
| `service_role` secret | `SUPABASE_SERVICE_ROLE_KEY` (edge function — auto-injected, no manual setup) |

### 3. Apply the schema

Open the **SQL Editor** in the Supabase dashboard and run the contents of `supabase/migrations/001_initial_schema.sql`. It creates:

- `profiles` table (with `tokens_used`, `daily_token_limit`, `last_reset`)
- `paragraph_sessions` table (history)
- Row-level security policies
- Trigger `on_auth_user_created` that auto-creates a profile on first sign-in
- Helpers `reset_daily_tokens_if_needed()` and `increment_tokens()`

### 4. Enable Google OAuth

**Authentication → Providers → Google**: enable, paste in your Google OAuth client ID/secret. Add `http://localhost:5173` (and your prod URL) to the redirect allowlist in **Authentication → URL Configuration**.

[Google OAuth client setup guide →](https://supabase.com/docs/guides/auth/social-login/auth-google)

### 5. Get a Gemini API key

Free tier: <https://aistudio.google.com/apikey>. Save it for the next step.

### 6. Deploy the edge function

```bash
npm install -g supabase     # or: brew install supabase/tap/supabase
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
supabase secrets set GEMINI_API_KEY=<YOUR_GEMINI_KEY>
supabase functions deploy process-paragraph
```

### 7. Local env

```bash
cp .env.example .env
# then edit .env and fill in:
#   VITE_SUPABASE_URL=https://<ref>.supabase.co
#   VITE_SUPABASE_ANON_KEY=...
```

### 8. Run

```bash
npm run dev
```

Open <http://localhost:5173>, sign in with Google, and paste a paragraph.

## How token control works

Each user has `daily_token_limit` (default 50 000 tokens) tracked in `profiles.tokens_used`. The edge function:

1. Calls `reset_daily_tokens_if_needed()` — zeroes the counter if 24h have elapsed since `last_reset`.
2. Reads `tokens_used` and refuses with HTTP 429 if the user is over budget.
3. After Gemini responds, calls `increment_tokens()` with `usageMetadata.totalTokenCount`.

The badge in the header shows the user how much budget they have left, and the bar animates as it fills.

To raise a user's budget, update `profiles.daily_token_limit` in SQL.

## Constraints enforced

| Rule | Where |
| --- | --- |
| Paragraph ≤ 250 words | UI counter + edge function validator |
| Paragraph ≥ 5 words | UI button disabled + edge function validator |
| ≤ 30 selected words per call | UI block + edge function validator |
| Auth required | Edge function rejects unauthenticated calls |
| Per-row data isolation | Postgres RLS policies |
| Gemini key never on the client | Stored as Supabase secret; only the edge function reads it |

## Scripts

```bash
npm run dev         # Vite dev server
npm run build       # Type-check + production build
npm run preview     # Serve the production build
npm run typecheck   # Type-check only
```

## Customizing

- **Daily token budget** — change the default in `supabase/migrations/001_initial_schema.sql` (column `daily_token_limit`) or update existing rows directly.
- **Model** — set `MODEL` in `supabase/functions/process-paragraph/index.ts`.
- **Max paragraph length** — `MAX_WORDS` in both the UI (`ParagraphInput.tsx`) and the edge function.
- **Theme** — CSS custom properties in `src/styles/globals.css` (`--color-fg`, `--color-line`, `--color-highlight`, …).
