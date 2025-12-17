import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const userId = user.id
    console.log('Checking badges for user:', userId)

    // Get all badges
    const { data: badges, error: badgesError } = await supabase
      .from('badges')
      .select('*')
      
    if (badgesError) throw badgesError

    // Get user's already unlocked badges
    const { data: userBadges, error: userBadgesError } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      
    if (userBadgesError) throw userBadgesError

    const unlockedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || [])
    const newlyUnlocked: any[] = []

    // Check each badge
    for (const badge of badges || []) {
      if (unlockedBadgeIds.has(badge.id)) continue

      const rule = badge.rule_json
      let shouldUnlock = false

      try {
        if (rule.type === 'meal_count') {
          const { count } = await supabase
            .from('meal_entries')
            .select('id', { count: 'exact' })
            .eq('user_id', userId)
          
          shouldUnlock = (count || 0) >= rule.count
        }

        if (rule.type === 'streak') {
          const { data: profile } = await supabase
            .from('profiles')
            .select('current_streak_days')
            .eq('id', userId)
            .single()
          
          shouldUnlock = (profile?.current_streak_days || 0) >= rule.days
        }

        if (rule.type === 'daily_macro') {
          const today = new Date().toISOString().split('T')[0]
          
          const { data: meals } = await supabase
            .from('meal_entries')
            .select('total_protein, total_carbs, total_fat')
            .eq('user_id', userId)
            .gte('created_at', `${today}T00:00:00`)
            .lte('created_at', `${today}T23:59:59`)

          const { data: profile } = await supabase
            .from('profiles')
            .select('protein_g, carbs_g, fat_g')
            .eq('id', userId)
            .single()

          if (meals && profile) {
            const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein || 0), 0)
            const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs || 0), 0)
            const totalFat = meals.reduce((sum, m) => sum + (m.total_fat || 0), 0)

            if (rule.macro === 'protein') {
              shouldUnlock = totalProtein >= (profile.protein_g || 0)
            }
            if (rule.macro === 'carbs') {
              shouldUnlock = totalCarbs >= (profile.carbs_g || 0)
            }
            if (rule.macro === 'fat') {
              shouldUnlock = totalFat >= (profile.fat_g || 0)
            }
          }
        }

        if (shouldUnlock) {
          // Unlock the badge
          const { error: insertError } = await supabase
            .from('user_badges')
            .insert({
              user_id: userId,
              badge_id: badge.id
            })

          if (!insertError) {
            // Award points
            await supabase.from('points_history').insert({
              user_id: userId,
              points: badge.points,
              reason: `Unlocked badge: ${badge.name}`
            })

            // Update total points
            const { data: profile } = await supabase
              .from('profiles')
              .select('total_points')
              .eq('id', userId)
              .single()

            if (profile) {
              await supabase
                .from('profiles')
                .update({ total_points: (profile.total_points || 0) + badge.points })
                .eq('id', userId)
            }

            newlyUnlocked.push({
              id: badge.id,
              name: badge.name,
              points: badge.points,
              icon: badge.icon
            })
          }
        }
      } catch (error) {
        console.error('Error checking badge:', badge.name, error)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        newlyUnlocked,
        count: newlyUnlocked.length
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to check badges' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
