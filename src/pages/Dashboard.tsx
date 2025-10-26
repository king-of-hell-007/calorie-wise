import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, TrendingUp, Target, Flame, Award, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MobileNav } from '@/components/MobileNav';
import logo from '@/assets/caloriewise-logo.png';

type Profile = {
  target_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  current_streak_days: number;
  total_points: number;
  goal: string;
};

type DailyTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mealCount: number;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dailyTotals, setDailyTotals] = useState<DailyTotals>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    mealCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboarding();
    loadProfile();
    loadTodaysMeals();
    checkBadges();
  }, []);

  // Refresh data when component becomes visible (e.g., returning from analyze page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadProfile();
        loadTodaysMeals();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const checkBadges = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('check-badges', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  const checkOnboarding = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/onboarding');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single();

    if (!profile?.onboarding_completed) {
      navigate('/onboarding');
    }
  };

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('target_calories, protein_g, carbs_g, fat_g, current_streak_days, total_points, goal, onboarding_completed')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Profile loading error:', error);
        throw error;
      }
      
      console.log('Loaded profile:', data);
      setProfile(data);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: 'Error loading profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTodaysMeals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('meal_entries')
        .select('total_calories, total_protein, total_carbs, total_fat')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      if (error) {
        console.error('Meals loading error:', error);
        throw error;
      }

      console.log('Loaded today\'s meals:', data);

      if (data) {
        const totals = data.reduce((acc, meal) => ({
          calories: acc.calories + (meal.total_calories || 0),
          protein: acc.protein + (meal.total_protein || 0),
          carbs: acc.carbs + (meal.total_carbs || 0),
          fat: acc.fat + (meal.total_fat || 0),
          mealCount: acc.mealCount + 1
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 });

        console.log('Calculated totals:', totals);
        setDailyTotals(totals);
      }
    } catch (error: any) {
      console.error('Error loading meals:', error);
      toast({
        title: 'Error loading meals',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Unable to load your profile. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const calorieProgress = (dailyTotals.calories / profile.target_calories) * 100;
  const proteinProgress = (dailyTotals.protein / profile.protein_g) * 100;
  const carbsProgress = (dailyTotals.carbs / profile.carbs_g) * 100;
  const fatProgress = (dailyTotals.fat / profile.fat_g) * 100;

  return (
    <>
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="shadow-medium">
          <CardContent className="pt-4 pb-3 text-center">
            <Flame className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-xs text-muted-foreground mb-1">Streak</p>
            <p className="text-xl font-bold text-primary">{profile.current_streak_days}</p>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
        <Card className="shadow-medium">
          <CardContent className="pt-4 pb-3 text-center">
            <Award className="w-6 h-6 mx-auto mb-2 text-accent" />
            <p className="text-xs text-muted-foreground mb-1">Points</p>
            <p className="text-xl font-bold text-accent">{profile.total_points}</p>
            <p className="text-xs text-muted-foreground">total</p>
          </CardContent>
        </Card>
        <Card className="shadow-medium">
          <CardContent className="pt-4 pb-3 text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-600" />
            <p className="text-xs text-muted-foreground mb-1">Logged</p>
            <p className="text-xl font-bold text-blue-600">{dailyTotals.mealCount}</p>
            <p className="text-xs text-muted-foreground">today</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Calories */}
      <Card className="shadow-strong border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Today's Calories</span>
            <span className="text-sm font-normal text-muted-foreground">
              {dailyTotals.calories} / {profile.target_calories} kcal
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress value={Math.min(calorieProgress, 100)} className="h-3" />
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Protein</p>
              <p className="font-bold text-primary">{dailyTotals.protein.toFixed(2)}g</p>
              <Progress value={Math.min(proteinProgress, 100)} className="h-1.5 mt-1" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Carbs</p>
              <p className="font-bold text-orange-600">{dailyTotals.carbs.toFixed(2)}g</p>
              <Progress value={Math.min(carbsProgress, 100)} className="h-1.5 mt-1" />
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Fat</p>
              <p className="font-bold text-blue-600">{dailyTotals.fat.toFixed(2)}g</p>
              <Progress value={Math.min(fatProgress, 100)} className="h-1.5 mt-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="shadow-strong">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => navigate('/analyze', { state: { autoLog: true, from: 'dashboard' } })}
            className="w-full bg-gradient-cta text-white h-14 text-lg shadow-medium hover:shadow-strong"
          >
            <Camera className="w-5 h-5 mr-2" />
            Log a Meal
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate('/progress')}
              className="h-12"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Progress
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/badges')}
              className="h-12"
            >
              <Award className="w-4 h-4 mr-2" />
              Badges
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Goal Reminder */}
      <Card className="shadow-medium bg-gradient-card">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-3">
            <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Your Goal</p>
              <p className="text-sm text-muted-foreground">
                {profile.goal === 'lose_weight' && 'Losing weight steadily'}
                {profile.goal === 'gain_weight' && 'Gaining weight / bulking'}
                {profile.goal === 'maintain' && 'Maintaining current weight'}
                {profile.goal === 'recomposition' && 'Body recomposition'}
                {profile.goal === 'custom' && 'Custom goal'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}