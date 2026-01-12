
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Advanced system prompt for Gemini 2.5 Flash
const ANALYZER_SYSTEM_PROMPT = `You are an expert nutritionist and computer vision specialist with advanced training in food recognition, portion estimation, and nutritional analysis. Your task is to analyze food images with exceptional accuracy by considering:

1. VISUAL ANALYSIS:
   - Identify all food items with scientific precision
   - Estimate portion sizes by analyzing visual cues (plate size, utensil references, food dimensions)
   - Consider camera angle, distance, and perspective in your estimations
   - Recognize cooking methods (fried, grilled, baked, steamed, etc.) as they affect nutritional content
   - Identify visible ingredients and probable hidden ingredients

2. PORTION ESTIMATION METHODOLOGY:
   - Use standard reference objects (plates are typically 25-28cm diameter, spoons ~15ml, forks ~20cm)
   - Apply perspective correction for angled shots
   - Estimate volume using geometric approximation (cylinders for glasses, hemispheres for bowls, etc.)
   - Convert visual volume to weight using food-specific density values
   - Account for air gaps, bones, and inedible portions

3. NUTRITIONAL ACCURACY:
   - Use USDA FoodData Central and international food databases as reference
   - Account for cooking method effects (oil absorption in frying, moisture loss in grilling, etc.)
   - Include both macronutrients (protein, carbs, fats) and key micronutrients
   - Provide confidence scores based on visual clarity and food recognition certainty
   - Estimate measurement error percentage honestly

4. OUTPUT REQUIREMENTS:
   - Return ONLY valid JSON following the exact schema provided
   - Be specific with food names (e.g., "Grilled Chicken Breast" not just "Chicken")
   - Provide realistic portion weights in grams
   - Include confidence score (0-1) for each item
   - Add measurement_error_percent to indicate estimation uncertainty
   - Suggest healthier alternatives when applicable
   - Flag nutritional concerns (high sodium, high sugar, low protein, etc.)`;

const ANALYZER_USER_INSTRUCTIONS = `TASK: Analyze this food image with maximum accuracy and provide detailed nutritional breakdown.

STEP-BY-STEP ANALYSIS PROCESS:

1. FOOD IDENTIFICATION:
   - Identify each distinct food item visible in the image
   - Specify cooking method (e.g., "Fried Chicken Wings" not "Chicken")
   - Note any visible sauces, dressings, or toppings
   - Recognize garnishes and accompaniments

2. PORTION SIZE ESTIMATION:
   - Analyze the image perspective and camera angle
   - Use visible reference objects (plate, utensils, hands, table) for scale
   - Estimate dimensions (length × width × height) of each food item
   - Calculate volume and convert to weight using food density
   - For standard items (e.g., chicken breast), use typical serving sizes as baseline
   - Adjust for visual appearance (a thick piece vs thin piece)

3. WEIGHT CALCULATION GUIDELINES:
   - Plate diameter: typically 25-28cm (use as primary reference)
   - Standard chicken breast: 150-200g
   - Standard burger patty: 100-150g
   - Rice/grain serving: 150-200g cooked
   - Vegetable serving: 80-100g
   - Adjust these based on visual proportion in the image

4. NUTRITIONAL CALCULATION:
   - Calculate calories per 100g for the specific food and cooking method
   - Multiply by estimated weight to get total calories
   - Break down macronutrients:
     * Protein (g): Use food-specific protein content
     * Carbohydrates (g): Include fiber, sugars
     * Fats (g): Account for added oils/butter from cooking
   - Consider micronutrients: sodium, vitamins, minerals
   - Account for cooking method impact (fried foods +20-40% fat, grilled -10% moisture)

5. CONFIDENCE & ERROR ESTIMATION:
   - High confidence (0.85-1.0): Clear image, standard portions, recognizable foods
   - Medium confidence (0.65-0.84): Partially obscured, unusual portions, mixed dishes
   - Low confidence (0.4-0.64): Poor lighting, unclear foods, complex preparations
   - Measurement error: ±10% for clear images, ±20% for average, ±30% for unclear

6. JSON OUTPUT SCHEMA (STRICT):
{
  "status": "success",
  "food": [
    {
      "name": "Specific Food Name with Cooking Method",
      "quantity": "XXXg",
      "calories": INTEGER,
      "protein": INTEGER,
      "carbs": INTEGER,
      "fat": INTEGER,
      "confidence": FLOAT (0-1),
      "measurement_error_percent": INTEGER (10-30),
      "fiber": INTEGER (optional),
      "sodium_mg": INTEGER (optional),
      "sugar_g": INTEGER (optional)
    }
  ],
  "total": {
    "calories": INTEGER,
    "protein": INTEGER,
    "carbs": INTEGER,
    "fat": INTEGER
  },
  "suggestions": [
    {
      "reason": "Brief explanation",
      "replacement": "Healthier alternative with calorie difference"
    }
  ],
  "flags": ["high_sodium", "high_sugar", "high_fat", "low_protein", "processed_food", "deep_fried"] (if applicable)
}

CRITICAL RULES:
- Return ONLY the JSON object, no markdown formatting, no explanations
- Be as accurate as possible with portion weights - this is critical for user health
- If multiple items of same food, list separately with individual weights
- For mixed dishes (e.g., pasta with sauce), break down into components
- Always include confidence and measurement_error_percent
- Use realistic, achievable portion sizes
- Consider that mobile photos may be taken from various angles - adjust accordingly

EXAMPLES OF GOOD PORTION ESTIMATION:
- Small chicken breast (palm-sized): 120-150g
- Medium chicken breast (hand-sized): 180-220g
- Large chicken breast: 250-300g
- Single fried chicken wing: 40-50g
- Burger patty (quarter-pounder): 110-120g
- Cup of rice: 150-180g cooked
- Handful of fries: 80-100g

Remember: Users rely on this data for their health goals. Accuracy is paramount!`;

interface GeminiAPIKey {
  id: string;
  key_name: string;
  key_value: string;
  usage_count: number;
  error_count: number;
}

// Helper function to categorize errors
function categorizeError(statusCode: number, errorMessage: string): {
  isRateLimit: boolean;
  isInvalidKey: boolean;
  shouldRetry: boolean;
  shouldDeactivate: boolean;
} {
  // Rate limit errors
  if (statusCode === 429 || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
    return { isRateLimit: true, isInvalidKey: false, shouldRetry: true, shouldDeactivate: false };
  }

  // Invalid key errors
  if (statusCode === 400 || statusCode === 401 || statusCode === 403 || errorMessage.includes('API key')) {
    return { isRateLimit: false, isInvalidKey: true, shouldRetry: false, shouldDeactivate: true };
  }

  // Server errors (retry with next key)
  if (statusCode >= 500) {
    return { isRateLimit: false, isInvalidKey: false, shouldRetry: true, shouldDeactivate: false };
  }

  // Other errors (retry)
  return { isRateLimit: false, isInvalidKey: false, shouldRetry: true, shouldDeactivate: false };
}

// Use native Deno.serve instead of importing from std
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get Supabase client with service role key (server-side only)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { image, filename, contentType } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch active Gemini API keys from database
    // Order by: lowest error_count first, then lowest usage_count
    // This ensures we use the healthiest keys first
    const { data: apiKeys, error: keysError } = await supabaseAdmin
      .from('admin_api_keys')
      .select('*')
      .eq('provider', 'gemini')
      .eq('is_active', true)
      .order('error_count', { ascending: true })
      .order('usage_count', { ascending: true })
      .limit(5); // Get up to 5 keys for maximum reliability

    if (keysError || !apiKeys || apiKeys.length === 0) {
      console.error('No API keys found:', keysError);
      return new Response(
        JSON.stringify({
          error: 'No active Gemini API keys configured. Please add API keys in the admin panel.',
          details: 'Contact administrator to add Gemini API keys for meal scanning.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[KEY ROTATION] Found ${apiKeys.length} active API keys`);
    console.log(`[KEY ROTATION] Key order: ${apiKeys.map((k: GeminiAPIKey) => `${k.key_name} (errors: ${k.error_count}, usage: ${k.usage_count})`).join(', ')}`);

    // Extract base64 image data
    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    let lastError: Error | null = null;
    let lastErrorCategory = null;
    let analysisResult = null;
    let successfulKeyName = '';

    // Try each API key until one succeeds
    for (let i = 0; i < apiKeys.length; i++) {
      const apiKey = apiKeys[i];

      try {
        console.log(`[KEY ${i + 1}/${apiKeys.length}] Attempting analysis with key: ${apiKey.key_name}`);

        // Call Gemini API with 2.5 Flash model
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey.key_value}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `${ANALYZER_SYSTEM_PROMPT}\n\n${ANALYZER_USER_INSTRUCTIONS}`
                    },
                    {
                      inline_data: {
                        mime_type: contentType || 'image/jpeg',
                        data: base64Data
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.3,
                topK: 32,
                topP: 0.95,
                maxOutputTokens: 4096,
              }
            })
          }
        );

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text();
          const errorCategory = categorizeError(geminiResponse.status, errorText);

          console.error(`[KEY ${i + 1}/${apiKeys.length}] Gemini API error (${geminiResponse.status}):`, errorText);
          console.error(`[KEY ${i + 1}/${apiKeys.length}] Error category:`, errorCategory);

          // Update error count
          await supabaseAdmin
            .from('admin_api_keys')
            .update({
              error_count: apiKey.error_count + 1,
              last_error_at: new Date().toISOString()
            })
            .eq('id', apiKey.id);

          // Auto-deactivate key if it's invalid
          if (errorCategory.shouldDeactivate) {
            console.warn(`[KEY ${i + 1}/${apiKeys.length}] Auto-deactivating invalid key: ${apiKey.key_name}`);
            await supabaseAdmin
              .from('admin_api_keys')
              .update({ is_active: false })
              .eq('id', apiKey.id);
          }

          lastErrorCategory = errorCategory;
          throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
        }

        const geminiData = await geminiResponse.json();

        // Extract text from Gemini response
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!generatedText) {
          throw new Error('No text content in Gemini response');
        }

        // Parse JSON from the response (remove markdown code blocks if present)
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '');
        }

        analysisResult = JSON.parse(cleanedText);

        // Update successful usage stats
        await supabaseAdmin
          .from('admin_api_keys')
          .update({
            usage_count: apiKey.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', apiKey.id);

        successfulKeyName = apiKey.key_name;
        console.log(`[SUCCESS] Analysis completed with key: ${apiKey.key_name}`);
        console.log(`[SUCCESS] Key stats - Usage: ${apiKey.usage_count + 1}, Errors: ${apiKey.error_count}`);
        break; // Success! Exit the loop

      } catch (error) {
        console.error(`[KEY ${i + 1}/${apiKeys.length}] Error with key ${apiKey.key_name}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this is the last key, we'll throw the error
        if (i === apiKeys.length - 1) {
          console.error(`[FAILURE] All ${apiKeys.length} API keys failed`);
        } else {
          console.log(`[RETRY] Trying next key (${i + 2}/${apiKeys.length})...`);
        }

        continue; // Try next key
      }
    }

    // If all keys failed
    if (!analysisResult) {
      let errorMessage = 'Failed to analyze nutrition with all available API keys.';

      if (lastErrorCategory?.isRateLimit) {
        errorMessage = 'All API keys have reached their rate limit. Please try again in a few minutes or add more API keys.';
      } else if (lastErrorCategory?.isInvalidKey) {
        errorMessage = 'All API keys are invalid or expired. Please check your API keys in the admin panel.';
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          details: lastError?.message,
          keysAttempted: apiKeys.length
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add metadata about which key was used
    const responseWithMetadata = {
      ...analysisResult,
      _metadata: {
        keyUsed: successfulKeyName,
        keysAttempted: apiKeys.findIndex((k: GeminiAPIKey) => k.key_name === successfulKeyName) + 1,
        totalKeysAvailable: apiKeys.length
      }
    };

    return new Response(
      JSON.stringify(responseWithMetadata),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[FATAL ERROR]:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to analyze nutrition',
        type: 'server_error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
