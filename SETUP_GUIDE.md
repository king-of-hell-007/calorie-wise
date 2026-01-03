# CalorieWise - Setup Guide After n8n Migration

## Quick Start

Your CalorieWise app has been successfully migrated from n8n to a self-sufficient architecture! Follow these steps to complete the setup.

## Step 1: Apply Database Migration

Run the database migration to update the RLS policies:

```bash
# If using Supabase CLI locally
supabase db push

# Or apply the migration manually in Supabase Dashboard
# Go to SQL Editor and run the contents of:
# supabase/migrations/20260101_update_api_keys_rls.sql
```

## Step 2: Add Gemini API Keys

### Option A: Using the Admin Panel (Recommended)

1. Navigate to `/admin` in your app
2. Click "Add New API Key"
3. Enter:
   - **Key Name**: A friendly name (e.g., "Primary Gemini Key")
   - **API Key Value**: Your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. Click "Add API Key"
5. Repeat to add 2-3 keys for redundancy

### Option B: Using SQL

```sql
INSERT INTO public.admin_api_keys (key_name, key_value, provider, is_active)
VALUES 
  ('Primary Gemini Key', 'YOUR_API_KEY_HERE', 'gemini', true),
  ('Backup Gemini Key', 'YOUR_BACKUP_KEY_HERE', 'gemini', true);
```

## Step 3: Get Gemini API Keys

If you don't have Gemini API keys yet:

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your CalorieWise admin panel
5. Recommended: Create 2-3 keys for automatic failover

## Step 4: Test the Integration

1. Navigate to the Analyze page (`/analyze`)
2. Upload a food image
3. Wait for the analysis (should take 2-5 seconds)
4. Verify the nutritional data is returned correctly
5. Check the browser console for logs showing which API key was used

## Step 5: Clean Up n8n (Optional)

Now that the app is self-sufficient, you can:

1. Stop the n8n workflow
2. Remove the webhook endpoint
3. Optionally delete the Supabase edge functions:
   - `supabase/functions/analyze-nutrition/`
   - Keep `analyze-nutrition-gemini` if you want a backup option

## Architecture Overview

### Before (with n8n)
```
User → Frontend → Edge Function → n8n Webhook → Gemini API → Response
```

### After (Self-Sufficient)
```
User → Frontend → Gemini Service → Gemini API → Response
```

## Key Features

✅ **Direct API Integration**: No external dependencies  
✅ **API Key Rotation**: Automatic failover between multiple keys  
✅ **Usage Tracking**: Monitor usage and error counts  
✅ **Mobile Optimized**: Works seamlessly on mobile devices  
✅ **Error Handling**: Comprehensive error handling with retries  
✅ **Self-Sufficient**: Everything runs within the app  

## Monitoring

### Check API Key Usage

Navigate to `/admin` to view:
- Usage count for each key
- Error count
- Last used timestamp
- Last error timestamp

### Troubleshooting

**Problem**: "No active Gemini API keys configured"
- **Solution**: Add at least one API key in the admin panel

**Problem**: "Failed to analyze nutrition with all available API keys"
- **Solution**: 
  - Verify your API keys are valid
  - Check quota limits in Google AI Studio
  - Ensure keys are marked as active in the admin panel

**Problem**: Analysis is slow
- **Solution**: 
  - Check network connection
  - Add more API keys for load distribution
  - Gemini API typically responds in 2-5 seconds

## Security Notes

- API keys are stored in the database (consider encryption for production)
- Only authenticated users can read active API keys
- Only admins can manage (add/edit/delete) API keys
- API key values are masked in the admin panel
- Usage and errors are tracked for monitoring

## Cost Optimization

Gemini API pricing (as of 2024):
- Free tier: 60 requests per minute
- Paid tier: Pay per 1M tokens

Tips to optimize costs:
1. Use multiple free-tier API keys with rotation
2. Monitor usage in the admin panel
3. Set up alerts for high error counts
4. Consider caching frequently analyzed foods (future enhancement)

## Next Steps

1. ✅ Apply database migration
2. ✅ Add Gemini API keys
3. ✅ Test image analysis
4. ✅ Verify meal logging works
5. ⬜ Stop n8n workflow
6. ⬜ Remove webhook URL from environment
7. ⬜ Deploy to production

## Support

For issues or questions:
1. Check the browser console for detailed error logs
2. Review the admin panel for API key status
3. Verify database migration was applied correctly
4. Ensure you have active Gemini API keys

## Files Modified

- ✅ `src/services/geminiService.ts` - New service for Gemini API integration
- ✅ `src/pages/Analyze.tsx` - Updated to use new service
- ✅ `supabase/migrations/20260101_update_api_keys_rls.sql` - Database migration
- ✅ `N8N_MIGRATION.md` - Detailed migration documentation
- ✅ `SETUP_GUIDE.md` - This file

## Congratulations! 🎉

Your CalorieWise app is now fully self-sufficient and no longer depends on n8n!
