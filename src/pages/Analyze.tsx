import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { NutritionResults } from '@/components/NutritionResults';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLocation, useNavigate } from 'react-router-dom';
import { getMealSlot, POINTS } from '@/lib/constants';

type NutritionData = {
  status: string;
  food: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence?: number;
    measurement_error_percent?: number;
  }>;
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
};

export default function Analyze() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [autoLog, setAutoLog] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
      }
    };
    checkUser();

    if (location.state?.autoLog) {
      setAutoLog(true);
    }
  }, [location.state, navigate]);

  const logMeal = async (data: NutritionData, image: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const hour = new Date().getHours();
      const mealSlot = getMealSlot(hour);

      // Insert meal entry
      const { error: mealError } = await supabase.from('meal_entries').insert([{
        user_id: user.id,
        meal_slot: mealSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        image_url: image,
        analyzer_json: data,
        total_calories: data.total?.calories || 0,
        total_protein: data.total?.protein || 0,
        total_carbs: data.total?.carbs || 0,
        total_fat: data.total?.fat || 0,
        confidence: data.food?.[0]?.confidence || null
      }]);

      if (mealError) {
        console.error('Error saving meal entry:', mealError);
        throw new Error(`Failed to save meal: ${mealError.message}`);
      }

      // Award points
      const { error: pointsError } = await supabase.from('points_history').insert({
        user_id: user.id,
        points: POINTS.MEAL_LOGGED,
        reason: 'Logged a meal'
      });

      if (pointsError) {
        // Error logging points - non-critical
      }

      // Update total points and streak
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_points, current_streak_days, longest_streak_days, last_log_date')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // Error fetching profile - non-critical
      } else if (profile) {
        // Calculate streak
        const today = new Date().toISOString().split('T')[0];
        const lastLogDate = profile.last_log_date;
        let newStreak = profile.current_streak_days;

        if (!lastLogDate) {
          // First meal ever
          newStreak = 1;
        } else {
          const lastLog = new Date(lastLogDate);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          if (lastLog.toDateString() === yesterday.toDateString()) {
            // Logged yesterday, continue streak
            newStreak = profile.current_streak_days + 1;
          } else if (lastLog.toDateString() !== today) {
            // Gap in logging, reset streak
            newStreak = 1;
          }
          // If logged today, keep current streak
        }

        const newLongestStreak = Math.max(profile.longest_streak_days, newStreak);

        // Update profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            total_points: (profile.total_points || 0) + POINTS.MEAL_LOGGED,
            current_streak_days: newStreak,
            longest_streak_days: newLongestStreak,
            last_log_date: today
          })
          .eq('id', user.id);

        if (updateError) {
          // Error updating profile - non-critical
        }
      }

      // Check for badge unlocks
      const { data: badgeData } = await supabase.functions.invoke('check-badges', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (badgeData?.newlyUnlocked?.length > 0) {
        const badge = badgeData.newlyUnlocked[0];
        toast({
          title: `🎉 Badge Unlocked: ${badge.name}!`, description: `+${badge.points} points earned`,
        });
      } else {
        toast({
          title: 'Meal logged!',
          description: '+10 points earned',
        });
      }
    } catch (error: unknown) {
      console.error('Logging error:', error);
      toast({
        title: 'Logging failed',
        description: error instanceof Error ? error.message : 'Unable to log the meal. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAnalyze = async (imageFile: File) => {
    setIsAnalyzing(true);
    setNutritionData(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to analyze meals',
          variant: 'destructive',
        });
        setIsAnalyzing(false);
        return;
      }

      // Compress image before sending
      const compressImage = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          const reader = new FileReader();

          reader.onload = (e) => {
            img.src = e.target?.result as string;
          };

          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Max dimension 1024px
            const MAX_WIDTH = 1024;
            const MAX_HEIGHT = 1024;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
              if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            // Compress to JPEG 0.7
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          };

          img.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      console.log('Compressing image...');
      const base64Image = await compressImage(imageFile);
      console.log(`Compressed size: ~${Math.round(base64Image.length / 1024)}KB`);

      setImageUrl(base64Image);

      // Call Supabase Edge Function (server-side Gemini API)
      const { data: analysisData, error: functionError } = await supabase.functions.invoke('analyze-nutrition', {
        body: {
          image: base64Image,
          filename: imageFile.name,
          contentType: 'image/jpeg'
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to analyze nutrition');
      }

      if (!analysisData) {
        throw new Error('No data returned from analysis');
      }

      console.log('Analysis response:', analysisData);
      setNutritionData(analysisData);

      if (autoLog && analysisData?.status === 'success') {
        await logMeal(analysisData, base64Image);
      }

    } catch (error: unknown) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Unable to analyze the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogMeal = async () => {
    if (nutritionData) {
      await logMeal(nutritionData, imageUrl);
      handleReset();
    }
  };

  const handleDontLogMeal = () => {
    handleReset();
  };

  const handleReset = () => {
    setNutritionData(null);
    setImageUrl('');
  };

  return (
    <>
      {!nutritionData ? (
        <ImageUpload onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      ) : (
        <NutritionResults
          data={nutritionData}
          onReset={handleReset}
          imageUrl={imageUrl}
          onLogMeal={handleLogMeal}
          onDontLogMeal={handleDontLogMeal}
          autoLog={autoLog}
        />
      )}
    </>
  );
}