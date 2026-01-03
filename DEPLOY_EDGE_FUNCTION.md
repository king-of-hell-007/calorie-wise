# 🚀 Deploy Edge Function - Complete Guide

## What We Changed

✅ **Moved Gemini API logic to server-side** (Supabase Edge Function)  
✅ **Replaced n8n webhook** with direct Gemini API calls  
✅ **API keys stay server-side** (more secure)  
✅ **Automatic key rotation** with error tracking  

---

## Step-by-Step Deployment

### Step 1: Install Supabase CLI (if not installed)

```bash
# Windows (PowerShell)
scoop install supabase

# Or using npm
npm install -g supabase
```

---

### Step 2: Login to Supabase

```bash
supabase login
```

This will open a browser window to authenticate.

---

### Step 3: Link Your Project

```bash
cd c:\anti\calorie-wise
supabase link --project-ref rsjdfnracserzrxrlyzw
```

When prompted, enter your database password.

---

### Step 4: Deploy the Edge Function

```bash
supabase functions deploy analyze-nutrition
```

**Expected output**:
```
Deploying function analyze-nutrition...
Function analyze-nutrition deployed successfully!
URL: https://rsjdfnracserzrxrlyzw.supabase.co/functions/v1/analyze-nutrition
```

---

### Step 5: Set Environment Variables (if needed)

The function uses these environment variables (automatically available):
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (has full access)

These are automatically set by Supabase, so you don't need to do anything!

---

### Step 6: Test the Function

1. **Open your app**: `http://localhost:5173`
2. **Go to Analyze page**
3. **Take a photo** of food
4. **Click "Analyze Nutrition Now"**
5. **Should work!** ✅

---

## How It Works Now

### Before (Client-Side):
```
Browser → geminiService.ts → Gemini API
         ↓
    Reads API keys from database (RLS issue!)
```

### After (Server-Side):
```
Browser → Supabase Edge Function → Gemini API
                    ↓
         Reads API keys securely (service role)
```

---

## Benefits

### ✅ Security:
- API keys never exposed to browser
- Service role has full database access
- No RLS policy issues

### ✅ Reliability:
- Automatic key rotation
- Error tracking per key
- Fallback to next key on failure

### ✅ Performance:
- Server-side processing
- No CORS issues
- Better error handling

---

## Troubleshooting

### Error: "supabase: command not found"

**Fix**: Install Supabase CLI
```bash
npm install -g supabase
```

---

### Error: "Project not linked"

**Fix**: Link your project
```bash
supabase link --project-ref rsjdfnracserzrxrlyzw
```

---

### Error: "Function deployment failed"

**Check**:
1. Are you in the correct directory? (`c:\anti\calorie-wise`)
2. Is the function file present? (`supabase/functions/analyze-nutrition/index.ts`)
3. Check Supabase dashboard for deployment logs

---

### Error: "No active Gemini API keys"

**Fix**: Add API keys via Admin panel
1. Go to `/admin`
2. Add Gemini API key
3. Ensure `is_active = true`

---

### Function works but analysis fails

**Check**:
1. **API key is valid**: Test it at https://aistudio.google.com/apikey
2. **Key has quota**: Check usage in Google AI Studio
3. **Check function logs**:
   ```bash
   supabase functions logs analyze-nutrition
   ```

---

## Verify Deployment

### Check Function is Deployed:

```bash
supabase functions list
```

**Expected output**:
```
analyze-nutrition
check-badges
```

---

### Check Function Logs:

```bash
supabase functions logs analyze-nutrition --tail
```

Then test the function and watch logs in real-time.

---

## Alternative: Manual Deployment via Dashboard

If CLI doesn't work, you can deploy via Supabase Dashboard:

1. **Go to**: https://supabase.com/dashboard/project/rsjdfnracserzrxrlyzw/functions
2. **Click**: "Create a new function"
3. **Name**: `analyze-nutrition`
4. **Copy-paste** the code from `supabase/functions/analyze-nutrition/index.ts`
5. **Click**: "Deploy"

---

## Testing Checklist

After deployment:

- [ ] Function appears in Supabase Dashboard
- [ ] Function URL is accessible
- [ ] App can call the function
- [ ] Photo analysis works
- [ ] Nutrition data displays correctly
- [ ] Meal logging works
- [ ] API key usage count increases

---

## Cleanup (Optional)

You can now **delete** or **ignore** these files (no longer needed):
- `src/services/geminiService.ts` (replaced by Edge Function)
- `FIX_API_KEYS_RLS.sql` (not needed with server-side approach)

But keep them for reference if you want!

---

## Summary

### What to Run:
```bash
# 1. Navigate to project
cd c:\anti\calorie-wise

# 2. Login to Supabase
supabase login

# 3. Link project
supabase link --project-ref rsjdfnracserzrxrlyzw

# 4. Deploy function
supabase functions deploy analyze-nutrition

# 5. Test in app
# Open http://localhost:5173/analyze and scan food
```

---

**After deployment, your meal scanning will work with secure server-side API key management!** 🎉
