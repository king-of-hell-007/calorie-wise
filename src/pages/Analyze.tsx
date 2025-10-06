import { useState, useEffect } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { NutritionResults } from '@/components/NutritionResults';
import { MobileNav } from '@/components/MobileNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';

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
    if (location.state?.autoLog) {
      setAutoLog(true);
    }
  }, [location.state]);

  const logMeal = async (data: NutritionData, image: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      console.log('Saving meal entry:', data);
      
      const hour = new Date().getHours();
      let mealSlot = 'snack';
      if (hour >= 6 && hour < 11) mealSlot = 'breakfast';
      else if (hour >= 11 && hour < 15) mealSlot = 'lunch';
      else if (hour >= 15 && hour < 21) mealSlot = 'dinner';

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
        points: 10,
        reason: 'Logged a meal'
      });

      if (pointsError) {
        console.error('Error saving points:', pointsError);
      }

      // Update total points and streak
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('total_points, current_streak_days, longest_streak_days, last_log_date')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
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
            total_points: (profile.total_points || 0) + 10,
            current_streak_days: newStreak,
            longest_streak_days: newLongestStreak,
            last_log_date: today
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
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
          title: `🎉 Badge Unlocked: ${badge.name}!`,          description: `+${badge.points} points earned`,
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

      // Convert image to base64 for sending to edge function
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      setImageUrl(base64Image);

      // Send base64 image to edge function
      const { data, error } = await supabase.functions.invoke('analyze-nutrition', {
        body: { 
          image: base64Image,
          filename: imageFile.name,
          contentType: imageFile.type
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Analysis response:', data);
      setNutritionData(data);

      if (autoLog && data?.status === 'success') {
        await logMeal(data, base64Image);
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
    <div className="min-h-screen bg-gradient-hero pb-24">
      <div className="bg-gradient-primary text-white p-6 shadow-strong flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="text-white hover:bg-white/20 p-2 h-auto"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Analyze Meal</h1>
          <p className="text-white/90 text-sm">Snap or upload to get instant nutrition info</p>
        </div>
      </div>

      <div className="p-4 max-w-screen-xl mx-auto">
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
      </div>

      <MobileNav />
    </div>
  );
}