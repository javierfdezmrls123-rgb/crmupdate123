# Database Fix Instructions

## Problem Description

You're experiencing an error when trying to save leads in the CRM: **"Error saving lead. Please try again."**

This error occurs because the database structure is incomplete or the RLS (Row Level Security) policies are not properly configured.

## Root Causes

1. **Missing `user_roles` table**: The application expects a `user_roles` table to manage user permissions, but it might not exist in your Supabase database.

2. **RLS Policy Issues**: Even if the tables exist, the RLS policies might not allow users to insert their own roles or leads.

3. **Schema Cache Issue**: Supabase's schema cache might be outdated, causing "table not found" errors.

## Solution

### Step 1: Apply the Database Migration

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Open the file `MIGRATION_FIX.sql` in this project directory
6. Copy the entire contents of that file
7. Paste it into the SQL Editor
8. Click **"Run"** to execute the migration

### Step 2: Verify the Migration

After running the migration, verify it worked by running these queries in the SQL Editor:

```sql
-- Check if user_roles table exists
SELECT * FROM public.user_roles;

-- Check if leads table has all columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('user_roles', 'leads');
```

### Step 3: Refresh Your Application

1. Close all browser tabs with your application
2. Clear your browser cache (or open in Incognito/Private mode)
3. Reopen your application
4. Try to save a lead again

## What the Migration Does

### Part 1: User Roles Table
- Creates the `user_roles` table if it doesn't exist
- Sets up proper RLS policies allowing users to:
  - Read their own role
  - Insert their own role (critical for first login)
- Allows admins to manage all roles
- Creates a trigger to automatically assign roles to new users
- Makes `ilia@envaire.com` and `javier@envaire.com` admins by default

### Part 2: Leads Table
- Ensures all required columns exist:
  - `scheduled_call` (timestamp)
  - `call_status` (text)
  - `industry` (text)
  - `website` (text)
  - `revenue` (text)
  - `ceo` (text)
  - `whose_phone` (text)
  - `go_skip` (text)
- Adds proper constraints for status fields
- Creates indexes for better performance

### Part 3: RLS Policies
- Sets up proper Row Level Security policies
- Ensures users can only access their own leads
- Allows proper INSERT, UPDATE, and DELETE operations

## Code Changes Made

I've also improved the error handling in the application:

1. **Updated `useUserRole` hook**: Added better handling for the case where the `user_roles` table doesn't exist, falling back to a default role based on email address.

2. **Build verification**: Confirmed the application builds successfully with no errors.

## If Problems Persist

If you still see errors after applying the migration:

1. **Check Browser Console**: Open Developer Tools (F12) and look for specific error messages
2. **Check Supabase Logs**: In your Supabase Dashboard, go to "Logs" to see database errors
3. **Verify Environment Variables**: Ensure your `.env` file has the correct Supabase URL and keys
4. **Test Database Connection**: Try to manually insert a lead through the Supabase Dashboard to confirm permissions work

## Testing the Fix

After applying the migration, test these scenarios:

1. ✅ Create a new lead
2. ✅ Edit an existing lead
3. ✅ Delete a lead
4. ✅ Import leads from CSV
5. ✅ Schedule a call for a lead
6. ✅ Update lead status

All these operations should now work without errors.

## Need Help?

If you continue to experience issues:
1. Check the browser console for specific error messages
2. Check the Supabase Dashboard logs
3. Verify your user has been assigned a role in the `user_roles` table
4. Ensure RLS is enabled on both tables

## Summary

The main issue was that the database structure wasn't fully initialized, particularly the `user_roles` table and its RLS policies. The migration script fixes all structural issues and ensures proper security policies are in place.

After applying the migration, your CRM should be able to save leads without any errors.