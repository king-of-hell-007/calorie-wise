import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// System prompt for Gemini image analysis
const ANALYZER_SYSTEM_PROMPT = `You are a precise nutrition analysis assistant. You will receive an image of a plate/food and must identify all individual items with best-estimate portion sizes (in grams) and compute calories, protein (g), carbs (g), fat (g) per item and totals. Return ONLY the JSON object that follows the exact schema described below. Always include a 'confidence' score (0–1) and 'measurement_error_percent' estimate for each item.`

const ANALYZER_USER_INSTRUCTIONS = `Task:
1) Identify items on plate.
2) For each item return:
   - name (string)
   - quantity (grams as integer followed by 'g')
   - calories (integer)
   - protein (g integer)
   - carbs (g integer)
   - fat (g integer)
   - confidence (float 0-1)
   - measurement_error_percent (integer, e.g., 10)
3) Return totals: total calories, total protein, total carbs, total fat.
4) Add optional fields:
   - suggestions: short list of 1–3 healthier alternatives (if any)
   - flags: ["high_sodium","high_sugar","low_protein"] (optional)
5) Output EXACT JSON schema:

{
 "status":"success",
 "food":[
   {"name":"Grilled Chicken Breast","quantity":"150g","calories":240,"protein":45,"carbs":0,"fat":5,"confidence":0.94,"measurement_error_percent":10}
 ],
 "total":{"calories":240,"protein":45,"carbs":0,"fat":5},
 "suggestions":[{"reason":"lower sugar","replacement":"lemon soda - 100 kcal less"}],
 "flags":[]
}

IMPORTANT: Return ONLY valid JSON. The top-level food and total keys must remain exactly as shown.`

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const image = formData.get('image') as File

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch active API keys with rotation logic
    const { data: apiKeys, error: keysError } = await supabase
      .from('admin_api_keys')
      .select('*')
      .eq('provider', 'gemini')
      .eq('is_active', true)
      .order('error_count', { ascending: true })
      .order('usage_count', { ascending: true })
      .limit(3)

    if (keysError || !apiKeys || apiKeys.length === 0) {
      console.error('No active API keys found:', keysError)
      return new Response(
        JSON.stringify({ error: 'No active API keys configured. Please add Gemini API keys in the admin panel.' }), 
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert image to base64
    const imageBuffer = await image.arrayBuffer()
    const base64Image = btoa(
      new Uint8Array(imageBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )

    let lastError = null
    let response = null

    // Try each API key in order until one succeeds
    for (const apiKey of apiKeys) {
      try {
        console.log(`Attempting with key: ${apiKey.key_name}`)

        // Call Gemini API with vision
        const geminiResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey.key_value}`,
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
                        mime_type: image.type,
                        data: base64Image
                      }
                    }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.4,
                topK: 32,
                topP: 1,
                maxOutputTokens: 2048,
              }
            })
          }
        )

        if (!geminiResponse.ok) {
          const errorText = await geminiResponse.text()
          console.error(`Gemini API error with key ${apiKey.key_name}:`, geminiResponse.status, errorText)
          
          // Update error count
          await supabase
            .from('admin_api_keys')
            .update({ 
              error_count: apiKey.error_count + 1,
              last_error_at: new Date().toISOString()
            })
            .eq('id', apiKey.id)

          lastError = `API key ${apiKey.key_name} failed: ${geminiResponse.status}`
          continue
        }

        const geminiData = await geminiResponse.json()
        
        // Extract text from Gemini response
        const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
        if (!generatedText) {
          throw new Error('No text content in Gemini response')
        }

        // Parse JSON from the response (remove markdown code blocks if present)
        let cleanedText = generatedText.trim()
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/```\n?/g, '')
        }

        const analysisResult = JSON.parse(cleanedText)

        // Update successful usage stats
        await supabase
          .from('admin_api_keys')
          .update({ 
            usage_count: apiKey.usage_count + 1,
            last_used_at: new Date().toISOString()
          })
          .eq('id', apiKey.id)

        console.log('Analysis successful with key:', apiKey.key_name)
        
        return new Response(
          JSON.stringify(analysisResult), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error(`Error with key ${apiKey.key_name}:`, error)
        
        // Update error count
        await supabase
          .from('admin_api_keys')
          .update({ 
            error_count: apiKey.error_count + 1,
            last_error_at: new Date().toISOString()
          })
          .eq('id', apiKey.id)

        lastError = error instanceof Error ? error.message : String(error)
        continue
      }
    }

    // All keys failed
    console.error('All API keys failed. Last error:', lastError)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze nutrition with all available API keys',
        details: lastError 
      }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in analyze-nutrition-gemini:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to analyze nutrition', details: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
