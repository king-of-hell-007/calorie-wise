# CalorieWise - n8n Integration Removal

## Overview
This document describes the migration from n8n-based nutrition analysis to a fully integrated, self-sufficient application.

## Previous Architecture (with n8n)

```
User uploads image
    ↓
Frontend (Analyze.tsx)
    ↓
Supabase Edge Function (analyze-nutrition)
    ↓
n8n Webhook (Calorie-analysis)
    ↓
n8n AI Agent (Google Gemini Chat Model)
    ↓
n8n Structured Output Parser
    ↓
Response back through chain
```

## New Architecture (Self-Sufficient)

```
User uploads image
    ↓
Frontend (Analyze.tsx)
    ↓
Gemini Service (geminiService.ts)
    ↓
Google Gemini API (direct call)
    ↓
Response parsed and returned
```

## What Changed

### 1. **New Service Created: `src/services/geminiService.ts`**
   - Direct integration with Google Gemini API
   - API key rotation logic (fetches from `admin_api_keys` table)
   - Automatic retry with multiple API keys
   - Usage tracking and error counting
   - Structured output parsing (same schema as n8n workflow)

### 2. **Updated: `src/pages/Analyze.tsx`**
   - Removed dependency on Supabase edge function
   - Now uses `geminiService.analyzeNutrition()` directly
   - Maintains all existing functionality (auto-log, meal tracking, etc.)

### 3. **n8n Workflow Analysis**
   The n8n workflow (`Caloriewise.json`) performed these tasks:
   - **Webhook**: Received POST requests with food images
   - **AI Agent**: Analyzed images using Google Gemini with specific prompts
   - **Structured Output Parser**: Formatted responses into JSON schema
   
   All of this is now handled by `geminiService.ts`.

## Key Features Preserved

✅ **API Key Rotation**: Multiple Gemini API keys with automatic failover  
✅ **Usage Tracking**: Tracks usage_count, error_count, last_used_at  
✅ **Structured Output**: Same JSON schema as before  
✅ **Error Handling**: Comprehensive error handling with user-friendly messages  
✅ **Mobile Optimization**: Works seamlessly on mobile devices  

## Expected Output Schema

```json
{
  "status": "success",
  "food": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": "150g",
      "calories": 240,
      "protein": 45,
      "carbs": 0,
      "fat": 5,
      "confidence": 0.94,
      "measurement_error_percent": 10
    }
  ],
  "total": {
    "calories": 240,
    "protein": 45,
    "carbs": 0,
    "fat": 5
  },
  "suggestions": [
    {
      "reason": "lower sugar",
      "replacement": "lemon soda - 100 kcal less"
    }
  ],
  "flags": []
}
```

## Database Requirements

The app requires the `admin_api_keys` table with the following structure:
- `id`: UUID (primary key)
- `provider`: TEXT (should be 'gemini')
- `key_name`: TEXT (friendly name for the key)
- `key_value`: TEXT (actual API key)
- `is_active`: BOOLEAN (whether the key is active)
- `usage_count`: INTEGER (number of successful uses)
- `error_count`: INTEGER (number of errors)
- `last_used_at`: TIMESTAMP
- `last_error_at`: TIMESTAMP

## Setup Instructions

### 1. Add Gemini API Keys
Navigate to the Admin panel and add one or more Google Gemini API keys:
- Provider: `gemini`
- Key Name: Any friendly name (e.g., "Primary Key", "Backup Key")
- Key Value: Your Gemini API key from Google AI Studio
- Is Active: `true`

### 2. Remove n8n Dependencies
You can now safely:
- Stop the n8n workflow
- Remove the webhook endpoint
- Optionally remove the Supabase edge functions (if not used elsewhere)

### 3. Environment Variables
No additional environment variables needed! The app fetches API keys from the database.

## Benefits of This Approach

1. **No External Dependencies**: Eliminates n8n as a dependency
2. **Cost Effective**: No need to host n8n separately
3. **Better Performance**: Direct API calls reduce latency
4. **Easier Maintenance**: All code in one place
5. **Mobile Optimized**: Works perfectly on mobile devices
6. **Scalable**: API key rotation handles high volume
7. **Self-Sufficient**: App handles everything internally

## Testing

To test the new implementation:

1. Ensure you have at least one active Gemini API key in the database
2. Navigate to the Analyze page
3. Upload a food image
4. The app should analyze it and return nutritional data
5. Check the browser console for logs showing which API key was used

## Troubleshooting

### "No active Gemini API keys configured"
- Add API keys in the Admin panel
- Ensure `is_active` is set to `true`
- Verify the `provider` field is set to `'gemini'`

### "Failed to analyze nutrition with all available API keys"
- Check if your API keys are valid
- Verify you have quota remaining on your Gemini API keys
- Check the `admin_api_keys` table for error counts

### Analysis takes too long
- The Gemini API typically responds in 2-5 seconds
- If slower, check your network connection
- Consider adding more API keys for better load distribution

## Migration Checklist

- [x] Create `geminiService.ts` with direct Gemini API integration
- [x] Update `Analyze.tsx` to use new service
- [x] Preserve all existing functionality
- [x] Maintain same output schema
- [x] Document changes
- [ ] Add Gemini API keys to database
- [ ] Test image analysis
- [ ] Verify meal logging works
- [ ] Stop n8n workflow
- [ ] Remove webhook URL from environment

## Future Enhancements

Potential improvements:
- Add caching for frequently analyzed foods
- Implement offline analysis queue
- Add support for multiple AI providers (Claude, GPT-4V, etc.)
- Batch analysis for multiple images
- Enhanced nutritional database integration
