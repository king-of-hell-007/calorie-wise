import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, TrendingUp, Target, Flame, Award, Calendar, BarChart3, BookOpen, ChefHat, Users, Trophy, Droplet, Scan, Lightbulb, Rss, CalendarDays, Bell, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalorieProgressBar } from '@/components/CalorieProgressBar';
import { StreakWidget } from '@/components/StreakWidget';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useStreakNotifications } from '@/hooks/useStreakNotifications';
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

  // Show notifications when features unlock
  useStreakNotifications(profile?.current_streak_days || 0);

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

      {/* Streak Widget */}
      <StreakWidget />

      {/* Daily Calories */}
      <Card className="shadow-strong border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Today's Calories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <CalorieProgressBar
            calories={dailyTotals.calories}
            targetCalories={profile.target_calories}
            showColorCoding={true}
          />
          <div className="grid grid-cols-3 gap-4 text-sm pt-2">
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Protein</p>
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-primary">{dailyTotals.protein.toFixed(2)}g</p>
                {dailyTotals.protein > profile.protein_g && (
                  <p className="text-xs text-destructive">
                    +{(dailyTotals.protein - profile.protein_g).toFixed(0)}g
                  </p>
                )}
              </div>
              <Progress value={Math.min(proteinProgress, 100)} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Carbs</p>
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-orange-600">{dailyTotals.carbs.toFixed(2)}g</p>
                {dailyTotals.carbs > profile.carbs_g && (
                  <p className="text-xs text-destructive">
                    +{(dailyTotals.carbs - profile.carbs_g).toFixed(0)}g
                  </p>
                )}
              </div>
              <Progress value={Math.min(carbsProgress, 100)} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground text-xs">Fat</p>
              <div className="flex justify-between items-baseline">
                <p className="font-bold text-blue-600">{dailyTotals.fat.toFixed(2)}g</p>
                {dailyTotals.fat > profile.fat_g && (
                  <p className="text-xs text-destructive">
                    +{(dailyTotals.fat - profile.fat_g).toFixed(0)}g
                  </p>
                )}
              </div>
              <Progress value={Math.min(fatProgress, 100)} className="h-1.5" />
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

      {/* Phase 3 Features Banner */}
      <Card className="shadow-strong bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 border-2 border-purple-400">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1"> Phase 3 is Live!</h3>
              <p className="text-sm text-muted-foreground">
                Fitbit, Notifications, Meal Planner, Activity Feed & More
              </p>
            </div>
            <Button 
              onClick={() => navigate('/phase3')}
              className="bg-gradient-to-r from-purple-600 to-blue-600"
            >
              Explore 
            </Button>
          </div>
        </CardContent>
      </Card>
      {/* Phase 2 Features */}
      <Card className="shadow-strong">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">✨ New Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Analytics & Management */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Analytics & Management</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/analytics')}
                className="h-20 flex flex-col gap-1"
              >
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span className="text-xs">Analytics</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/templates')}
                className="h-20 flex flex-col gap-1"
              >
                <BookOpen className="w-5 h-5 text-green-600" />
                <span className="text-xs">Templates</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/recipes')}
                className="h-20 flex flex-col gap-1"
              >
                <ChefHat className="w-5 h-5 text-orange-600" />
                <span className="text-xs">Recipes</span>
              </Button>
            </div>
          </div>

          {/* Social & Community */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Social & Community</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/friends')}
                className="h-20 flex flex-col gap-1"
              >
                <Users className="w-5 h-5 text-purple-600" />
                <span className="text-xs">Friends</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/leaderboard')}
                className="h-20 flex flex-col gap-1"
              >
                <Trophy className="w-5 h-5 text-amber-600" />
                <span className="text-xs">Leaderboard</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/challenges')}
                className="h-20 flex flex-col gap-1"
              >
                <Target className="w-5 h-5 text-red-600" />
                <span className="text-xs">Challenges</span>
              </Button>
            </div>
          </div>

          {/* Smart Tools */}
          <div>
            <p className="text-sm font-semibold text-muted-foreground mb-2">Smart Tools</p>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/water')}
                className="h-20 flex flex-col gap-1"
              >
                <Droplet className="w-5 h-5 text-cyan-600" />
                <span className="text-xs">Water</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/barcode')}
                className="h-20 flex flex-col gap-1"
              >
                <Scan className="w-5 h-5 text-indigo-600" />
                <span className="text-xs">Barcode</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/insights')}
                className="h-20 flex flex-col gap-1"
              >
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                <span className="text-xs">Insights</span>
              </Button>
            </div>
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