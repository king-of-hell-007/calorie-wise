import { supabase } from '@/integrations/supabase/client';

export interface FoodItem {
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence?: number;
    measurement_error_percent?: number;
    fiber?: number;
    sodium_mg?: number;
    sugar_g?: number;
}

export interface NutritionAnalysisResult {
    status: string;
    food: FoodItem[];
    total: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    suggestions?: Array<{
        reason: string;
        replacement: string;
    }>;
    flags?: string[];
}

interface GeminiAPIKey {
    id: string;
    key_name: string;
    key_value: string;
    usage_count: number;
    error_count: number;
}

// Advanced system prompt for Gemini 2.5 Flash - Highly accurate nutrition analysis
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

/**
 * Fetches active Gemini API keys from the database with rotation logic
 */
async function getActiveAPIKeys(): Promise<GeminiAPIKey[]> {
    const { data: apiKeys, error } = await supabase
        .from('admin_api_keys')
        .select('*')
        .eq('provider', 'gemini')
        .eq('is_active', true)
        .order('error_count', { ascending: true })
        .order('usage_count', { ascending: true })
        .limit(3);

    if (error || !apiKeys || apiKeys.length === 0) {
        throw new Error('No active Gemini API keys configured. Please add API keys in the admin panel.');
    }

    return apiKeys;
}

/**
 * Updates API key usage statistics
 */
async function updateAPIKeyStats(keyId: string, success: boolean): Promise<void> {
    const updateData: any = {
        last_used_at: new Date().toISOString(),
    };

    if (success) {
        const { data: currentKey } = await supabase
            .from('admin_api_keys')
            .select('usage_count')
            .eq('id', keyId)
            .single();

        if (currentKey) {
            updateData.usage_count = currentKey.usage_count + 1;
        }
    } else {
        const { data: currentKey } = await supabase
            .from('admin_api_keys')
            .select('error_count')
            .eq('id', keyId)
            .single();

        if (currentKey) {
            updateData.error_count = currentKey.error_count + 1;
            updateData.last_error_at = new Date().toISOString();
        }
    }

    await supabase
        .from('admin_api_keys')
        .update(updateData)
        .eq('id', keyId);
}

/**
 * Converts a File to base64 string
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result as string;
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64Data = base64String.split(',')[1];
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Calls the Gemini API to analyze a food image
 * Using Gemini 2.5 Flash for best accuracy
 */
async function callGeminiAPI(
    apiKey: string,
    base64Image: string,
    mimeType: string
): Promise<NutritionAnalysisResult> {
    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
                                    mime_type: mimeType,
                                    data: base64Image
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.3,  // Lower temperature for more consistent, accurate results
                    topK: 32,
                    topP: 0.95,
                    maxOutputTokens: 4096,  // Increased for detailed analysis
                }
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const geminiData = await response.json();

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

    const analysisResult: NutritionAnalysisResult = JSON.parse(cleanedText);
    return analysisResult;
}

/**
 * Main function to analyze nutrition from a food image
 * This replaces the n8n workflow functionality
 */
export async function analyzeNutrition(imageFile: File): Promise<NutritionAnalysisResult> {
    try {
        // Get active API keys
        const apiKeys = await getActiveAPIKeys();

        // Convert image to base64
        const base64Image = await fileToBase64(imageFile);

        let lastError: Error | null = null;

        // Try each API key in order until one succeeds
        for (const apiKey of apiKeys) {
            try {
                console.log(`Attempting analysis with key: ${apiKey.key_name}`);

                const result = await callGeminiAPI(
                    apiKey.key_value,
                    base64Image,
                    imageFile.type
                );

                // Update successful usage stats
                await updateAPIKeyStats(apiKey.id, true);

                console.log('Analysis successful with key:', apiKey.key_name);
                return result;

            } catch (error) {
                console.error(`Error with key ${apiKey.key_name}:`, error);

                // Update error count
                await updateAPIKeyStats(apiKey.id, false);

                lastError = error instanceof Error ? error : new Error(String(error));
                continue;
            }
        }

        // All keys failed
        throw new Error(
            `Failed to analyze nutrition with all available API keys. Last error: ${lastError?.message}`
        );

    } catch (error) {
        console.error('Error in analyzeNutrition:', error);
        throw error instanceof Error ? error : new Error('Failed to analyze nutrition');
    }
}
