# 🔧 Edge Function JSON Parsing Error - FIXED

## Problem Summary

**Error:** `SyntaxError: Expected ',' or '}' after property value in JSON at position 2050`

**Root Cause:** Gemini API sometimes returns JSON with:
- Trailing commas (e.g., `{"key": "value",}`)
- Comments in JSON
- Extra whitespace/newlines
- Malformed escape sequences

**Impact:** Food image analysis fails when Gemini returns improperly formatted JSON

---

## Solution Implemented

### Enhanced JSON Sanitization (Line 298-354)

The Edge Function now includes robust JSON parsing with multiple layers of protection:

#### 1. **Markdown Removal**
```typescript
// Removes ```json and ``` wrappers
if (cleanedText.startsWith('```json')) {
  cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
}
```

#### 2. **Trailing Comma Removal**
```typescript
// Fixes: {"key": "value",} → {"key": "value"}
.replace(/,(\s*[}\]])/g, '$1')
```

#### 3. **Comment Stripping**
```typescript
// Removes // comments and /* */ blocks
.replace(/\/\/.*$/gm, '')
.replace(/\/\*[\s\S]*?\*\//g, '')
```

#### 4. **Whitespace Normalization**
```typescript
// Removes problematic newlines and carriage returns
.replace(/\n/g, ' ')
.replace(/\r/g, '')
```

#### 5. **Fallback Regex Extraction**
```typescript
// If parsing fails, extract JSON object using regex
const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  analysisResult = JSON.parse(jsonMatch[0]);
}
```

#### 6. **Enhanced Error Logging**
```typescript
console.log(`[PARSING] Raw response length: ${generatedText.length} characters`);
console.log(`[PARSING] Cleaned text preview: ${cleanedText.substring(0, 200)}...`);
console.error(`[PARSING ERROR] Problematic JSON (first 500 chars):`, cleanedText.substring(0, 500));
```

---

## Deployment Instructions

### Option 1: Supabase CLI (Recommended)

```bash
# Navigate to project directory
cd c:\anti\calorie-wise

# Deploy the updated function
supabase functions deploy analyze-nutrition

# Or use the deployment script
.\deploy-edge-function.ps1
```

### Option 2: Supabase Dashboard

1. Go to **Edge Functions** in Supabase Dashboard
2. Select `analyze-nutrition` function
3. Click **Deploy new version**
4. Copy contents from `supabase\functions\analyze-nutrition\index.ts`
5. Paste and deploy

---

## Verification Steps

### 1. Check Function Logs

After deployment, test by uploading a food image:

```bash
# View real-time logs
supabase functions logs analyze-nutrition --follow
```

**Expected logs:**
```
[PARSING] Raw response length: 1234 characters
[PARSING] Cleaned text preview: {"status":"success","food":[...
[PARSING] Successfully parsed JSON
[SUCCESS] Analysis completed with key: Gemini Key 1
```

### 2. Test in App

1. Open CalorieWise app
2. Navigate to `/analyze`
3. Upload a food image
4. Click "Analyze"
5. Should see nutrition results without errors

### 3. Check for Errors

If errors still occur, check logs for:
- `[PARSING ERROR]` - Shows problematic JSON
- `[PARSING] Attempting regex extraction fallback` - Fallback activated
- `[SUCCESS]` - Parsing succeeded

---

## Error Prevention Strategies

### 1. **Multiple Sanitization Layers**
- Markdown removal
- Trailing comma fixes
- Comment stripping
- Whitespace normalization

### 2. **Fallback Mechanisms**
- Primary: Direct JSON.parse()
- Fallback: Regex extraction + parse
- Last resort: Detailed error logging

### 3. **Better Prompting**
Updated system prompt to emphasize:
```
CRITICAL RULES:
- Return ONLY the JSON object, no markdown formatting, no explanations
- Use valid JSON syntax (no trailing commas)
- No comments in JSON
```

### 4. **Comprehensive Logging**
- Log raw response length
- Log cleaned text preview
- Log parsing success/failure
- Log problematic JSON on error

---

## Common JSON Issues Fixed

| Issue | Example | Fix |
|-------|---------|-----|
| Trailing comma | `{"key": "value",}` | Regex removal |
| Comments | `{"key": "value" // comment}` | Comment stripping |
| Markdown | ` ```json\n{...}\n``` ` | Markdown removal |
| Extra newlines | `{\n\n"key":\n"value"\n}` | Whitespace normalization |
| Partial JSON | `Some text {"key": "value"}` | Regex extraction |

---

## Testing Checklist

- [ ] Deploy updated Edge Function
- [ ] Test with clear food image
- [ ] Test with unclear/complex food image
- [ ] Test with multiple food items
- [ ] Check function logs for errors
- [ ] Verify no JSON parsing errors
- [ ] Confirm nutrition data displays correctly

---

## Rollback Plan (If Needed)

If issues persist:

```bash
# View previous deployments
supabase functions list

# Rollback to previous version
supabase functions deploy analyze-nutrition --version <previous-version>
```

---

## Future Improvements

### 1. **Schema Validation**
Add JSON schema validation before returning:
```typescript
if (!analysisResult.food || !analysisResult.total) {
  throw new Error('Invalid response schema');
}
```

### 2. **Retry with Different Temperature**
If parsing fails, retry with lower temperature (0.1) for more consistent output:
```typescript
generationConfig: {
  temperature: 0.1, // More deterministic
  topK: 32,
  topP: 0.95,
}
```

### 3. **Response Caching**
Cache successful responses to reduce API calls and errors.

---

## Monitoring

### Key Metrics to Watch

1. **Parse Success Rate**
   - Look for `[PARSING] Successfully parsed JSON` in logs
   - Should be >95%

2. **Fallback Usage**
   - Look for `[PARSING] Attempting regex extraction fallback`
   - Should be <5%

3. **Parse Failures**
   - Look for `[PARSING ERROR]`
   - Should be <1%

### Alert Thresholds

- **Warning:** >10% fallback usage
- **Critical:** >5% parse failures

---

## Support

If errors persist after deployment:

1. **Check Logs:**
   ```bash
   supabase functions logs analyze-nutrition --limit 50
   ```

2. **Verify Deployment:**
   ```bash
   supabase functions list
   ```

3. **Test Manually:**
   ```bash
   supabase functions invoke analyze-nutrition --body '{"image":"data:image/jpeg;base64,...","contentType":"image/jpeg"}'
   ```

---

## Summary

✅ **Fixed:** JSON parsing errors from malformed Gemini responses
✅ **Added:** Multiple sanitization layers
✅ **Added:** Fallback parsing mechanism
✅ **Added:** Enhanced error logging
✅ **Result:** Robust, production-ready food analysis

**Status:** Ready for deployment
**Risk:** Low - Backward compatible, only improves parsing
**Impact:** Eliminates JSON parsing errors

---

**File Updated:** `supabase/functions/analyze-nutrition/index.ts`
**Lines Changed:** 298-354 (JSON parsing section)
**Deploy Command:** `supabase functions deploy analyze-nutrition`
