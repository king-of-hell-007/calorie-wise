# 🔧 EDGE FUNCTION ERROR - ROOT CAUSE & FIX

## 🚨 PROBLEM IDENTIFIED

**Error**: "Edge Function returned a non-2xx status code"

**Root Cause**: One of these issues:

1. ❌ **No API keys in database**
2. ❌ **Environment variables not set** (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
3. ❌ **API keys exist but are invalid**
4. ❌ **RLS policies blocking access**

---

## 🔍 DIAGNOSTIC STEPS

### Step 1: Check if API Keys Exist

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `rsjdfnracserzrxrlyzw`
3. **Go to SQL Editor**
4. **Run this query**:

```sql
SELECT 
  key_name,
  provider,
  is_active,
  LEFT(key_value, 10) || '...' as key_preview
FROM admin_api_keys
WHERE provider = 'gemini';
```

**Expected Result**: You should see at least 1 row with `is_active = true`

**If NO rows**: You need to add API keys! (see below)

---

### Step 2: Check Environment Variables

The Edge Function needs these environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**These should be automatically available**, but let's verify:

1. **Go to Supabase Dashboard** → Project Settings → API
2. **Copy**:
   - Project URL (e.g., `https://rsjdfnracserzrxrlyzw.supabase.co`)
   - Service Role Key (starts with `eyJ...`)

**Note**: These are automatically injected into Edge Functions, so you shouldn't need to set them manually.

---

### Step 3: Check Function Deployment

1. **Go to Supabase Dashboard** → Edge Functions
2. **Verify** `analyze-nutrition` is listed
3. **Check** deployment status (should be "Active")

---

## ✅ SOLUTION 1: Add API Keys (Most Likely Issue)

If you haven't added API keys yet:

### Get Gemini API Keys:
1. Go to: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)
4. Repeat 2-3 times for redundancy

### Add to Database:

**Option A: Via Admin Panel** (Easiest)
1. Go to your app: `http://localhost:5173/admin`
2. Enter:
   - Key Name: `Gemini Key 1`
   - Key Value: `AIza...` (paste your key)
3. Click "Add API Key"
4. Repeat for keys 2 and 3

**Option B: Via SQL** (If admin panel doesn't work)
```sql
INSERT INTO admin_api_keys (provider, key_name, key_value, is_active)
VALUES ('gemini', 'Gemini Key 1', 'AIza...YOUR_KEY_HERE...', true);

INSERT INTO admin_api_keys (provider, key_name, key_value, is_active)
VALUES ('gemini', 'Gemini Key 2', 'AIza...YOUR_KEY_HERE...', true);

INSERT INTO admin_api_keys (provider, key_name, key_value, is_active)
VALUES ('gemini', 'Gemini Key 3', 'AIza...YOUR_KEY_HERE...', true);
```

---

## ✅ SOLUTION 2: Fix Environment Variables

If API keys exist but function still fails, the environment variables might be missing.

### Check Current Environment:

Create a test function to check:

1. **Go to Supabase Dashboard** → Edge Functions
2. **Create new function** called `test-env`
3. **Paste this code**:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  return new Response(JSON.stringify({
    hasUrl: !!url,
    hasKey: !!key,
    urlPreview: url ? url.substring(0, 30) + '...' : 'MISSING',
    keyPreview: key ? key.substring(0, 10) + '...' : 'MISSING'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

4. **Deploy** and **invoke** the function
5. **Check response** - both should be `true`

---

## ✅ SOLUTION 3: Redeploy with Explicit Environment

If environment variables are missing, redeploy with explicit values:

```powershell
# Set environment variables for the function
supabase secrets set SUPABASE_URL=https://rsjdfnracserzrxrlyzw.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Redeploy
supabase functions deploy analyze-nutrition
```

---

## ✅ SOLUTION 4: Check Function Logs

To see the actual error:

### Via Supabase Dashboard:
1. Go to **Edge Functions** → `analyze-nutrition`
2. Click **"Logs"** tab
3. Look for error messages

### What to look for:
- `No active Gemini API keys configured` → Add API keys
- `Cannot read property of undefined` → Environment variable issue
- `401 Unauthorized` → Invalid API key
- `429 Rate Limit` → API key quota exceeded

---

## 🔧 QUICK FIX SCRIPT

Save this as `fix-edge-function.sql` and run in Supabase SQL Editor:

```sql
-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_name = 'admin_api_keys'
) as table_exists;

-- 2. If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS admin_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  key_name TEXT NOT NULL,
  key_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  last_error_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE admin_api_keys ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for service role (Edge Functions)
DROP POLICY IF EXISTS "Service role full access" ON admin_api_keys;
CREATE POLICY "Service role full access"
ON admin_api_keys
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5. Check if any keys exist
SELECT COUNT(*) as total_keys FROM admin_api_keys WHERE provider = 'gemini';

-- If count is 0, you need to add keys!
```

---

## 📋 COMPLETE TROUBLESHOOTING CHECKLIST

Run through these in order:

- [ ] **Step 1**: Check if `admin_api_keys` table exists
- [ ] **Step 2**: Check if any Gemini API keys exist in database
- [ ] **Step 3**: Verify at least one key has `is_active = true`
- [ ] **Step 4**: Test if API key is valid (try it at https://aistudio.google.com)
- [ ] **Step 5**: Check Edge Function is deployed
- [ ] **Step 6**: Check Edge Function logs for errors
- [ ] **Step 7**: Verify environment variables are set
- [ ] **Step 8**: Test with a simple photo

---

## 🎯 MOST LIKELY ISSUE

**99% chance**: You haven't added API keys to the database yet!

### Quick Test:
```sql
SELECT COUNT(*) FROM admin_api_keys WHERE provider = 'gemini' AND is_active = true;
```

**If result is 0**: Add API keys using the steps above!

---

## 📞 NEXT STEPS

1. **Run diagnostic query** (DIAGNOSTIC_CHECK.sql)
2. **Check result** - do you have API keys?
3. **If NO keys**: Add them via Admin panel or SQL
4. **If keys exist**: Check function logs for actual error
5. **Test again** in your app

---

## ✅ SUCCESS CRITERIA

After fixing, you should see:
- ✅ No error in console
- ✅ Analysis completes successfully
- ✅ Nutrition data displays
- ✅ API key `usage_count` increases

---

**Most likely you just need to add API keys to the database!**

Run the diagnostic query first to confirm.
