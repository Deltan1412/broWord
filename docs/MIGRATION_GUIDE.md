# Migration to New Supabase Project

To move broWord to a new Supabase project, follow these steps in order:

## 1. Update Frontend Credentials
Update your `.env` file with the **Project URL** and **Anon Key** from your new Supabase project dashboard (Settings > API).

```env
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

## 2. Link the CLI
Open your terminal in the project root and link to the new project:
```bash
npx supabase link --project-ref your-new-project-id
```

## 3. Migrate Database Schema
You need to create the tables, RLS policies, and the user-profile trigger in the new project.
1. Go to the **SQL Editor** in your new Supabase dashboard.
2. Copy the contents of `supabase/migrations/001_initial_schema.sql` from this project.
3. Paste it into a new query and click **Run**.

## 4. Redeploy Edge Functions
Redeploy the text-processing function to the new project:
1. Set the Gemini API key in the new project:
   ```bash
   npx supabase secrets set GEMINI_API_KEY=your-api-key
   ```
2. Deploy the function:
   ```bash
   npx supabase functions deploy process-paragraph
   ```

## 5. Update Google OAuth
This is the most important step for your login issue:
1. Go to **Authentication > Providers > Google** in the new Supabase dashboard.
2. Enter your Google Client ID and Secret.
3. **CRITICAL:** Copy the **new Callback URL** from Supabase (it will be `https://your-new-project.supabase.co/auth/v1/callback`).
4. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and replace the old redirect URI with this new one.

## 6. Verification
- Restart your local dev server (`npm run dev`).
- Attempt to sign up or log in.
- Verify that a new record appears in the **Authentication > Users** table of your NEW project.
