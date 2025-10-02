import { useState } from 'react';
import { ImageUpload } from '@/components/ImageUpload';
import { NutritionResults } from '@/components/NutritionResults';
import { MobileNav } from '@/components/MobileNav';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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
  const { toast } = useToast();
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');

  const handleAnalyze = async (imageFile: File) => {
    setIsAnalyzing(true);
    setNutritionData(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        toast({
          title: 'Authentication required',
          description: 'Please sign in to analyze meals',
          variant: 'destructive',
        });
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(imageFile);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setImageUrl(base64Image);

        const res = await fetch('src/api/analyze.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ image: base64Image })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Analyze failed');

        setNutritionData(data);

        // Auto-save meal entry
        if (data?.status === 'success') {
          const hour = new Date().getHours();
          let mealSlot = 'snack';
          if (hour >= 6 && hour < 11) mealSlot = 'breakfast';
          else if (hour >= 11 && hour < 15) mealSlot = 'lunch';
          else if (hour >= 15 && hour < 21) mealSlot = 'dinner';

          await fetch('src/api/meals.php?action=create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              meal_slot: mealSlot as 'breakfast' | 'lunch' | 'dinner' | 'snack',
              image_url: base64Image,
              analyzer_json: data,
              total_calories: data.total.calories,
              total_protein: data.total.protein,
              total_carbs: data.total.carbs,
              total_fat: data.total.fat,
              confidence: data.food[0]?.confidence || null
            })
          });

          // Award points
          await fetch('src/api/points.php?action=add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ points: 10, reason: 'Logged a meal' })
          });

          // Update total points
          // points.php already increments profile points

          toast({
            title: 'Meal logged!',
            description: '+10 points earned',
          });
        }
      };
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis failed',
        description: error.message || 'Unable to analyze the image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAnalyzing(false);
    }
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
          <NutritionResults data={nutritionData} onReset={handleReset} imageUrl={imageUrl} />
        )}
      </div>

      <MobileNav />
    </div>
  );
}
