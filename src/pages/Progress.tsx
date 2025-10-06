import { useEffect, useState } from 'react';
import { MobileNav } from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function Progress() {
  const [weeklyData, setWeeklyData] = useState<DailyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklyData();
  }, []);

  const loadWeeklyData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

  const maxCalories = Math.max(...weeklyData.map(d => d.calories), 1);
  const totalWeekCalories = weeklyData.reduce((sum, d) => sum + d.calories, 0);
  const avgDailyCalories = Math.round(totalWeekCalories / 7);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <div className="bg-gradient-primary text-white p-6 shadow-strong">
        <h1 className="text-2xl font-bold mb-1">Progress</h1>
        <p className="text-white/90 text-sm">Your 7-day nutrition overview</p>
      </div>

      <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
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
            <div className="space-y-3">
              {weeklyData.map((day) => {
                const percentage = (day.calories / maxCalories) * 100;
                const isToday = format(new Date(), 'yyyy-MM-dd') === day.date;
                
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                        {format(new Date(day.date), 'EEE, MMM d')}
                        {isToday && ' (Today)'}
                      </span>
                      <span className="font-bold">{day.calories} kcal</span>
                    </div>
                    <div className="h-8 bg-secondary rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
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

        {/* Macro Distribution */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Macro Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(() => {
                const totalProtein = weeklyData.reduce((sum, d) => sum + d.protein, 0);
                const totalCarbs = weeklyData.reduce((sum, d) => sum + d.carbs, 0);
                const totalFat = weeklyData.reduce((sum, d) => sum + d.fat, 0);
                const totalGrams = totalProtein + totalCarbs + totalFat;

                const proteinPercent = (totalProtein / totalGrams) * 100;
                const carbsPercent = (totalCarbs / totalGrams) * 100;
                const fatPercent = (totalFat / totalGrams) * 100;

                return (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-primary">Protein</span>
                        <span className="font-bold">{totalProtein.toFixed(2)}g ({proteinPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${proteinPercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-orange-600">Carbs</span>
                        <span className="font-bold">{totalCarbs.toFixed(2)}g ({carbsPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-600"
                          style={{ width: `${carbsPercent}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-medium text-blue-600">Fat</span>
                        <span className="font-bold">{totalFat.toFixed(2)}g ({fatPercent.toFixed(0)}%)</span>
                      </div>
                      <div className="h-3 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${fatPercent}%` }}
                        />
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileNav />
    </div>
  );
}
