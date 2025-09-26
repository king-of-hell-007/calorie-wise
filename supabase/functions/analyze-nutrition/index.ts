import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

    // Create a new FormData to send to the webhook
    const webhookFormData = new FormData()
    webhookFormData.append('image', image)

    // Send to the webhook
    const response = await fetch('http://34.121.71.147:5678/webhook-test/Calorie-analysis', {
      method: 'POST',
      body: webhookFormData,
    })

    if (!response.ok) {
      throw new Error(`Webhook failed with status: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract the first element from the array response
    const responseData = Array.isArray(data) ? data[0] : data
    
    return new Response(
      JSON.stringify(responseData), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to analyze nutrition' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})