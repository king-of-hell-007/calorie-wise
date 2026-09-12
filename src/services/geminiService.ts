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

/**
 * Calls the Supabase Edge Function to analyze a food image
 */
export async function analyzeNutrition(imageFile: File): Promise<NutritionAnalysisResult> {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const { data, error } = await supabase.functions.invoke('analyze-nutrition-gemini', {
            body: formData,
        });

        if (error) {
            console.error('Edge function error:', error);
            throw new Error(error.message || 'Failed to analyze nutrition via edge function');
        }

        // Handle case where edge function returns error inside data payload
        if (data && data.error) {
            throw new Error(data.error);
        }

        return data as NutritionAnalysisResult;
    } catch (error) {
        console.error('Error in analyzeNutrition:', error);
        throw error instanceof Error ? error : new Error('Failed to analyze nutrition');
    }
}
