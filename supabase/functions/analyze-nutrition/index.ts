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
    const { image, filename, contentType } = await req.json()

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Convert base64 to Blob
    const base64Data = image.split(',')[1]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: contentType || 'image/jpeg' })

    // Create a new FormData to send to the webhook
    const webhookFormData = new FormData()
    webhookFormData.append('image', blob, filename || 'image.jpg')

    // Send to the webhook
    //console.log('Calling webhook:', 'http://34.121.71.147:5678/webhook/Calorie-analysis')
    const response = await fetch(Deno.env.get('WEBHOOK_URL'), {
      method: 'POST',  
      body: webhookFormData,
    })

    console.log('Webhook response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Webhook error response:', errorText)
      throw new Error(`Webhook failed with status: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    // Extract the first element from the array response
    let responseData = Array.isArray(data) ? data[0] : data
    
    // Extract nested output property if it exists
    if (responseData?.output) {
      responseData = responseData.output
    }
    
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