# Quick Fix for "Error saving lead" Issue

## The Problem
When you try to save a lead, you see this error:
```
Error saving lead. Please try again.
```

## The Solution (5 Minutes)

### 1. Open Supabase Dashboard
Go to: https://supabase.com/dashboard

### 2. Run the Fix Script
1. Click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Copy and paste the entire contents of **`MIGRATION_FIX_V2.sql`** (NOT V1!)
4. Click **Run**

⚠️ **IMPORTANT:** Use `MIGRATION_FIX_V2.sql` - this version fixes any existing invalid data in your database before applying constraints.

### 3. Refresh Your App
1. Close all browser tabs
2. Clear browser cache or use Incognito mode
3. Reopen your application
4. Try saving a lead - it should work now!

## What This Fixes

- ✅ Creates the `user_roles` table with proper permissions
- ✅ Ensures the `leads` table has all required columns
- ✅ **Fixes any existing invalid status values in your leads**
- ✅ Sets up correct security policies (RLS)
- ✅ Auto-assigns roles to users
- ✅ Makes ilia@envaire.com and javier@envaire.com admins

## What Caused the Constraint Error

The error you saw:
```
ERROR: check constraint "leads_status_check" is violated by some row
```

This happened because some leads in your database have invalid status values (like old statuses or NULL values). The V2 migration fixes these invalid values BEFORE adding the constraint, so it won't fail.

## Verify It Worked

After running the script, check these:

```sql
-- Should show your user role
SELECT * FROM public.user_roles;

-- Should show all lead columns
SELECT column_name FROM information_schema.columns WHERE table_name = 'leads';
```

## Still Not Working?

1. Check browser console (F12 key) for error messages
2. Check Supabase logs in dashboard
3. Verify your `.env` file has correct database credentials
4. Make sure you're logged in with a valid account

---

**That's it!** Your CRM should now save leads without errors.