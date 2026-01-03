# CalorieWise Architecture Comparison

## Previous Architecture (with n8n)

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Device                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                  CalorieWise App                        │     │
│  │                   (Frontend)                            │     │
│  └──────────────────────┬─────────────────────────────────┘     │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ 1. Upload Image
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Platform                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │         Edge Function: analyze-nutrition               │     │
│  │         (Converts image to FormData)                   │     │
│  └──────────────────────┬─────────────────────────────────┘     │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ 2. Forward to Webhook
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      n8n Workflow                                │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  1. Webhook Node                                       │     │
│  │     - Receives POST request                            │     │
│  │     - Extracts image                                   │     │
│  └──────────────────────┬─────────────────────────────────┘     │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────┐     │
│  │  2. AI Agent Node                                      │     │
│  │     - Analyzes image with prompt                       │     │
│  │     - Uses Google Gemini Chat Model                    │     │
│  └──────────────────────┬─────────────────────────────────┘     │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────┐     │
│  │  3. Structured Output Parser                           │     │
│  │     - Formats response to JSON schema                  │     │
│  │     - Returns nutritional data                         │     │
│  └──────────────────────┬─────────────────────────────────┘     │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ 3. Return Response
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google Gemini API                             │
│  - Processes image with vision model                            │
│  - Returns nutritional analysis                                 │
└─────────────────────────────────────────────────────────────────┘

Issues with this approach:
❌ External dependency on n8n
❌ Additional hosting costs for n8n
❌ More points of failure
❌ Increased latency (multiple hops)
❌ Complex deployment and maintenance
```

## New Architecture (Self-Sufficient)

```
┌─────────────────────────────────────────────────────────────────┐
│                         User's Device                            │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                  CalorieWise App                        │     │
│  │                   (Frontend)                            │     │
│  │                                                         │     │
│  │  ┌──────────────────────────────────────────────┐      │     │
│  │  │      Analyze.tsx Component                   │      │     │
│  │  │      - Handles image upload                  │      │     │
│  │  │      - Calls geminiService                   │      │     │
│  │  └──────────────────┬───────────────────────────┘      │     │
│  │                     │                                   │     │
│  │  ┌──────────────────▼───────────────────────────┐      │     │
│  │  │      geminiService.ts                        │      │     │
│  │  │      1. Fetch active API keys from DB        │      │     │
│  │  │      2. Convert image to base64              │      │     │
│  │  │      3. Call Gemini API directly             │      │     │
│  │  │      4. Parse and validate response          │      │     │
│  │  │      5. Update usage statistics              │      │     │
│  │  │      6. Auto-retry with backup keys          │      │     │
│  │  └──────────────────┬───────────────────────────┘      │     │
│  └────────────────────┼─────────────────────────────────┘      │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          │ 1. Direct API Call
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google Gemini API                             │
│  - gemini-2.0-flash-exp model                                   │
│  - Vision + Text analysis                                       │
│  - Returns structured JSON                                      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          │ 2. Response
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │      admin_api_keys Table                              │     │
│  │      - Stores multiple API keys                        │     │
│  │      - Tracks usage_count, error_count                 │     │
│  │      - Enables automatic rotation                      │     │
│  │      - Provides failover capability                    │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘

Benefits of this approach:
✅ No external dependencies (n8n removed)
✅ Lower hosting costs
✅ Fewer points of failure
✅ Reduced latency (direct API call)
✅ Simpler deployment and maintenance
✅ Built-in API key rotation
✅ Automatic failover
✅ Usage tracking and monitoring
```

## API Key Rotation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   geminiService.analyzeNutrition()               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Fetch Active API Keys                                  │
│  - Query: SELECT * FROM admin_api_keys                          │
│           WHERE provider='gemini' AND is_active=true            │
│           ORDER BY error_count ASC, usage_count ASC             │
│           LIMIT 3                                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Try Each Key in Order                                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Try Key 1 (lowest error_count)                        │    │
│  │  ├─ Success? → Update usage_count, return result       │    │
│  │  └─ Failure? → Update error_count, try next key        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Try Key 2 (next lowest error_count)                   │    │
│  │  ├─ Success? → Update usage_count, return result       │    │
│  │  └─ Failure? → Update error_count, try next key        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Try Key 3 (backup key)                                │    │
│  │  ├─ Success? → Update usage_count, return result       │    │
│  │  └─ Failure? → Update error_count, throw error         │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Return Result or Error                                 │
│  - Success: Return parsed nutritional data                      │
│  - Failure: Throw error with details                            │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Comparison

### n8n Workflow (Before)
```
Image Upload → Edge Function → n8n Webhook → AI Agent → 
Gemini API → Structured Parser → Response → Edge Function → 
Frontend

Total Hops: 7
Average Latency: 3-8 seconds
External Dependencies: n8n, Supabase Edge Functions
```

### Direct Integration (After)
```
Image Upload → geminiService → Gemini API → Response → Frontend

Total Hops: 3
Average Latency: 2-5 seconds
External Dependencies: None (self-sufficient)
```

## Cost Comparison

### Before (with n8n)
- n8n hosting: $10-50/month
- Supabase Edge Functions: $0-25/month
- Gemini API: Free tier or pay-per-use
- **Total: $10-75/month**

### After (Self-Sufficient)
- Gemini API: Free tier or pay-per-use
- **Total: $0-25/month**

**Savings: $10-50/month** 💰
