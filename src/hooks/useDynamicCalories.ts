import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface DynamicCalorieData {
    targetCalories: number;
    caloriesBurned: number;
    isDynamic: boolean;
    lastUpdated: Date | null;
    proteinG: number;
    carbsG: number;
    fatG: number;
}

/**
 * Hook to calculate dynamic calorie targets based on Fitbit data
 * Falls back to static calculation if Fitbit not connected
 */
export function useDynamicCalories(userId: string) {
    const [data, setData] = useState<DynamicCalorieData>({
        targetCalories: 2000,
        caloriesBurned: 2000,
        isDynamic: false,
        lastUpdated: null,
        proteinG: 150,
        carbsG: 200,
        fatG: 65
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            calculateCalories(userId);

            // Refresh every 15 minutes
            const interval = setInterval(() => {
                calculateCalories(userId);
            }, 15 * 60 * 1000);

            return () => clearInterval(interval);
        }
    }, [userId]);

    const calculateCalories = async (userId: string) => {
        try {
            // Get user profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError) throw profileError;

            // Check if Fitbit is connected and dynamic calories enabled
            if (profile.fitbit_connected && profile.use_dynamic_calories) {
                await calculateDynamicCalories(userId, profile);
            } else {
                await calculateStaticCalories(profile);
            }
        } catch (error) {
            console.error('Error calculating calories:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDynamicCalories = async (userId: string, profile: any) => {
        try {
            // Get today's Fitbit data
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data: fitbitData, error } = await supabase
                .from('fitbit_daily_data')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (fitbitData && fitbitData.calories_burned) {
                // Use actual calories burned from Fitbit
                const caloriesBurned = fitbitData.calories_burned;

                // Adjust based on goal
                let targetCalories = caloriesBurned;

                switch (profile.goal) {
                    case 'lose':
                        targetCalories = caloriesBurned - 500; // 500 cal deficit
                        break;
                    case 'gain':
                        targetCalories = caloriesBurned + 500; // 500 cal surplus
                        break;
                    case 'maintain':
                        targetCalories = caloriesBurned; // Maintain
                        break;
                }

                // Ensure minimum calories (1200 for women, 1500 for men)
                const minCalories = profile.sex === 'female' ? 1200 : 1500;
                targetCalories = Math.max(targetCalories, minCalories);

                // Calculate macros based on target
                const proteinG = Math.round((targetCalories * 0.30) / 4); // 30% protein
                const fatG = Math.round((targetCalories * 0.25) / 9); // 25% fat
                const carbsG = Math.round((targetCalories * 0.45) / 4); // 45% carbs

                setData({
                    targetCalories: Math.round(targetCalories),
                    caloriesBurned,
                    isDynamic: true,
                    lastUpdated: new Date(),
                    proteinG,
                    carbsG,
                    fatG
                });
            } else {
                // No Fitbit data yet today, fall back to static
                await calculateStaticCalories(profile);
            }
        } catch (error) {
            console.error('Error calculating dynamic calories:', error);
            // Fall back to static on error
            await calculateStaticCalories(profile);
        }
    };

    const calculateStaticCalories = async (profile: any) => {
        // Use stored static values from profile
        const targetCalories = profile.target_calories || 2000;
        const proteinG = profile.protein_g || 150;
        const carbsG = profile.carbs_g || 200;
        const fatG = profile.fat_g || 65;
        const tdee = profile.tdee || 2000;

        setData({
            targetCalories,
            caloriesBurned: tdee,
            isDynamic: false,
            lastUpdated: null,
            proteinG,
            carbsG,
            fatG
        });
    };

    return { ...data, loading, refresh: () => calculateCalories(userId) };
}
