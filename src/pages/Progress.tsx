import { useEffect, useState } from 'react';
import { MobileNav } from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalorieProgressBar } from '@/components/CalorieProgressBar';
import { MacroProgressBar } from '@/components/MacroProgressBar';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { TrendingUp, Calendar } from 'lucide-react';

type DailyData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
};

type Profile = {
  target_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export default function Progress() {
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('target_calories, protein_g, carbs_g, fat_g')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      const startDate = subDays(new Date(), 6);
      const startDateStr = format(startDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('meal_entries')
        .select('created_at, total_calories, total_protein, total_carbs, total_fat')
        .eq('user_id', user.id)
        .gte('created_at', `${startDateStr}T00:00:00`);

      if (error) throw error;

      // Group by date
      const grouped: { [key: string]: DailyData } = {};

      for (let i = 0; i < 7; i++) {
        const date = format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        grouped[date] = {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0
        };
      }

      data?.forEach(entry => {
        const date = format(new Date(entry.created_at), 'yyyy-MM-dd');
        if (grouped[date]) {
          grouped[date].calories += entry.total_calories || 0;
          grouped[date].protein += entry.total_protein || 0;
          grouped[date].carbs += entry.total_carbs || 0;
          grouped[date].fat += entry.total_fat || 0;
          grouped[date].mealCount += 1;
        }
      });

      setWeeklyData(Object.values(grouped));
    } catch (error) {
      console.error('Error loading weekly data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalWeekCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0);
  const avgDailyCalories = Math.round(totalWeekCalories / 7);

  // Calculate weekly totals
  const totalProtein = weeklyData.reduce((sum, d) => sum + d.protein, 0);
  const totalCarbs = weeklyData.reduce((sum, d) => sum + d.carbs, 0);
  const totalFat = weeklyData.reduce((sum, d) => sum + d.fat, 0);

  // Calculate weekly targets (daily target × 7)
  const weeklyProteinTarget = (profile?.protein_g || 0) * 7;
  const weeklyCarbsTarget = (profile?.carbs_g || 0) * 7;
  const weeklyFatTarget = (profile?.fat_g || 0) * 7;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-medium">
          <CardContent className="pt-4 pb-3 text-center">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xs text-muted-foreground mb-1">Avg Daily</p>
            <p className="text-2xl font-bold text-primary">{avgDailyCalories}</p>
            <p className="text-xs text-muted-foreground">kcal</p>
          </CardContent>
        </Card>
        <Card className="shadow-medium">
          <CardContent className="pt-4 pb-3 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-accent" />
            <p className="text-xs text-muted-foreground mb-1">Total Meals</p>
            <p className="text-2xl font-bold text-accent">
              {weeklyData.reduce((sum, d) => sum + d.mealCount, 0)}
            </p>
            <p className="text-xs text-muted-foreground">this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Calorie Chart */}
      <Card className="shadow-strong">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Calories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {weeklyData.map((day) => {
              const isToday = format(new Date(), 'yyyy-MM-dd') === day.date;

              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className={`font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(new Date(day.date), 'EEE, MMM d')}
                      {isToday && ' (Today)'}
                    </span>
                  </div>
                  <CalorieProgressBar calories={day.calories} targetCalories={profile?.target_calories || 2000} />
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>P: {day.protein.toFixed(2)}g</span>
                    <span>C: {day.carbs.toFixed(2)}g</span>
                    <span>F: {day.fat.toFixed(2)}g</span>
                    <span>{day.mealCount} meals</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Weekly Macro Targets */}
      <Card className="shadow-strong">
        <CardHeader>
          <CardTitle className="text-lg">Weekly Macro Targets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <MacroProgressBar
              current={totalProtein}
              target={weeklyProteinTarget}
              label="Protein"
              color="primary"
            />
            <MacroProgressBar
              current={totalCarbs}
              target={weeklyCarbsTarget}
              label="Carbs"
              color="orange-600"
            />
            <MacroProgressBar
              current={totalFat}
              target={weeklyFatTarget}
              label="Fat"
              color="blue-600"
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
}
