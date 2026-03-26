# Supabase Setup Guide

This guide will help you connect your app to Supabase.

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill project details and create

## Step 2: Get Supabase Credentials

In **Settings ? API** copy:

- Project URL
- anon/public key
- service_role key (server-only; never expose in browser)

## Step 3: Set Up Environment Variables

Create `.env.local` and set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

If you use Google SSO with NextAuth also set:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://127.0.0.1:8080
```

## Step 4: Create Database Tables

1. Open **SQL Editor**
2. Run `supabase/schema.sql`

This creates:

- `api_keys` table
- `users` table (for first-login provisioning)

## Step 5: First-login User Provisioning

On successful Google sign-in, the app runs a server-side provision step:

- If user email does not exist in `users`, insert a new row with profile fields.
- If exists, update `last_login_at` and profile fields.

Fields used in `users`:

- `email` (unique)
- `full_name`
- `avatar_url`
- `auth_provider`
- `auth_provider_user_id`
- `first_login_at`
- `last_login_at`

## Security Notes

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Do not expose service role in client code.
- `.env.local` should stay ignored in git.

## Troubleshooting

### `NextAuth user provisioning failed`

- Check `SUPABASE_SERVICE_ROLE_KEY` is set and valid.
- Check `users` table exists.
- Check SQL policies and RLS configuration.

### `relation "users" does not exist`

- Run `supabase/schema.sql` again.