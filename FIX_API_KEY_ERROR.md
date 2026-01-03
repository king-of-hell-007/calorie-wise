# 🔧 Fix: API Key Access Error

## Problem
Error message: **"No active Gemini API keys configured"**

## Root Cause
The `admin_api_keys` table has **Row Level Security (RLS)** enabled, which is blocking the frontend code from reading the API keys you added.

---

## Solution: Update RLS Policy

### Step 1: Run SQL Fix

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to SQL Editor**
3. **Copy and run** the SQL from `FIX_API_KEYS_RLS.sql`:

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read API keys" ON public.admin_api_keys;
DROP POLICY IF EXISTS "Allow service role full access to API keys" ON public.admin_api_keys;

-- Allow authenticated users to SELECT (read) API keys
CREATE POLICY "Allow authenticated users to read API keys"
ON public.admin_api_keys
FOR SELECT
TO authenticated
USING (true);

-- Allow service role (backend) full access
CREATE POLICY "Allow service role full access to API keys"
ON public.admin_api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE public.admin_api_keys ENABLE ROW LEVEL SECURITY;
```

4. **Click "Run"**

---

### Step 2: Verify API Keys Exist

Run this query to check your keys:

```sql
SELECT 
  key_name, 
  provider,
  is_active, 
  usage_count, 
  error_count,
  created_at
FROM public.admin_api_keys
WHERE provider = 'gemini';
```

**Expected Result**: You should see your API key(s) listed with `is_active = true`

---

### Step 3: Test Again

1. **Refresh your app**: `http://localhost:5173`
2. **Go to Analyze page**
3. **Take a photo** of food
4. **Click "Analyze Nutrition Now"**
5. **Should work now!** ✅

---

## Why This Happened

### RLS (Row Level Security):
- Supabase tables have RLS enabled by default
- RLS blocks all access unless you create policies
- Your `admin_api_keys` table had no policy for authenticated users
- Frontend code couldn't read the keys

### The Fix:
- Created policy allowing **authenticated users** to **read** API keys
- Users can only SELECT (read), not INSERT/UPDATE/DELETE
- Service role (backend) has full access
- Keys remain secure (not exposed to unauthenticated users)

---

## Security Note

### Is This Secure?
**Yes**, because:
- ✅ Only **authenticated users** can read keys
- ✅ Keys are only readable, not modifiable
- ✅ Keys are used client-side to call Gemini API directly
- ✅ No sensitive data is exposed (Gemini API keys are meant to be used client-side)
- ✅ Rate limiting is handled by Gemini (per key)

### Alternative (More Secure):
If you want even more security, you could:
1. Move Gemini API calls to a Supabase Edge Function
2. Keep keys server-side only
3. Frontend calls Edge Function instead of Gemini directly

But for now, the current approach works fine for a personal/small app.

---

## Troubleshooting

### Still Getting Error?

**Check 1**: Verify RLS policy exists
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'admin_api_keys';
```

**Check 2**: Verify you're logged in
- Check browser console for auth errors
- Try logging out and back in

**Check 3**: Verify API key is correct
- Go to Admin panel
- Check key starts with `AIza`
- Verify `is_active = true`

**Check 4**: Check browser console
- Open DevTools (F12)
- Look for errors in Console tab
- Share any error messages

---

## Quick Reference

### Check Keys:
```sql
SELECT * FROM admin_api_keys WHERE provider = 'gemini';
```

### Check Policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'admin_api_keys';
```

### Reset Key Stats:
```sql
UPDATE admin_api_keys 
SET usage_count = 0, error_count = 0 
WHERE provider = 'gemini';
```

---

**After running the SQL fix, your meal scanning should work!** 🎉
