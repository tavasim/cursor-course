# Supabase Setup Guide

This guide will help you connect your API Keys CRUD application to Supabase.

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in your project details:
   - **Name**: Your project name
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose the closest region to your users
5. Click "Create new project" and wait for it to be set up (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. You'll find:
   - **Project URL**: Copy this value
   - **anon/public key**: Copy this value

## Step 3: Set Up Environment Variables

1. Create a `.env.local` file in the root of your project (if it doesn't exist)
2. Add the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

Replace `your_project_url_here` and `your_anon_key_here` with the values from Step 2.

**Important**: Never commit `.env.local` to version control. It's already in `.gitignore`.

## Step 4: Create the Database Table

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the contents of `supabase/schema.sql`
4. Click "Run" to execute the SQL
5. You should see a success message

The SQL script will:
- Create the `api_keys` table with all necessary columns
- Set up indexes for better performance
- Enable Row Level Security (RLS)
- Create a policy that allows all operations (you can customize this later)
- Set up automatic timestamp updates

## Step 5: Verify the Setup

1. Restart your Next.js development server:
   ```bash
   npm run dev
   ```

2. Navigate to your API Keys dashboard
3. Try creating a new API key
4. Check your Supabase dashboard → **Table Editor** → `api_keys` to see your data

## Database Schema

The `api_keys` table has the following structure:

- `id` (UUID): Primary key, auto-generated
- `name` (TEXT): Name of the API key
- `key` (TEXT): The actual API key value (unique)
- `description` (TEXT): Optional description
- `type` (TEXT): Either 'development' or 'production'
- `limit_monthly_usage` (BOOLEAN): Whether monthly usage is limited
- `monthly_usage_limit` (INTEGER): Monthly usage limit if enabled
- `usage_count` (INTEGER): Current usage count
- `last_used` (TIMESTAMP): Last time the key was used
- `created_at` (TIMESTAMP): When the key was created
- `updated_at` (TIMESTAMP): When the key was last updated (auto-updated)

## Security Notes

The current setup uses a policy that allows all operations. For production:

1. **Add Authentication**: Implement user authentication (Supabase Auth)
2. **Update RLS Policies**: Create policies that restrict access based on user ID
3. **Use Service Role Key**: For server-side operations, use the service role key (never expose this in client-side code)

Example RLS policy for authenticated users:
```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "Allow all operations for api_keys" ON api_keys;

-- Create user-specific policy
CREATE POLICY "Users can manage their own api_keys" ON api_keys
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Make sure `.env.local` exists and contains both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after adding environment variables

### Error: "relation 'api_keys' does not exist"
- Make sure you've run the SQL schema from `supabase/schema.sql` in the Supabase SQL Editor

### Error: "new row violates row-level security policy"
- Check your RLS policies in Supabase → Authentication → Policies
- Make sure the policy allows the operation you're trying to perform

### Data not appearing
- Check the browser console for errors
- Verify your Supabase credentials are correct
- Check the Supabase dashboard → Table Editor to see if data was inserted

## Next Steps

- Add user authentication
- Implement usage tracking
- Add API key validation
- Set up rate limiting based on key type
- Add analytics and reporting
