import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileNav } from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, LogOut, Target, Activity, TrendingUp, Settings } from 'lucide-react';

type Profile = {
  email: string;
  age: number;
  sex: string;
  height_cm: number;
  weight_kg: number;
  bmi: number;
  bmr: number;
  tdee: number;
  target_calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  goal: string;
  baseline_activity: string;
  exercise_frequency: string;
  current_streak_days: number;
  longest_streak_days: number;
  total_points: number;
};

export default function Profile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/auth');
        return;
      }
      const res = await fetch('src/api/profiles.php?action=me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load profile');
      setProfile(data.profile);
    } catch (error: any) {
      toast({
        title: 'Error loading profile',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth_token');
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24 p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground mb-4">
              Unable to load your profile.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getGoalText = (goal: string) => {
    const goals: { [key: string]: string } = {
      lose_weight: 'Lose Weight',
      gain_weight: 'Gain Weight',
      maintain: 'Maintain Weight',
      recomposition: 'Body Recomposition',
      custom: 'Custom Goal'
    };
    return goals[goal] || goal;
  };

  const getActivityText = (activity: string) => {
    const activities: { [key: string]: string } = {
      sedentary: 'Sedentary',
      mild: 'Mild Exercise',
      moderate: 'Moderate Exercise',
      heavy: 'Heavy Exercise',
      very_heavy: 'Very Heavy Exercise'
    };
    return activities[activity] || activity;
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <div className="bg-gradient-primary text-white p-6 shadow-strong">
        <h1 className="text-2xl font-bold mb-1">Profile</h1>
        <p className="text-white/90 text-sm">{profile.email}</p>
      </div>

      <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
        {/* Personal Info */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-semibold">{profile.age} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sex</p>
                <p className="font-semibold capitalize">{profile.sex.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Height</p>
                <p className="font-semibold">{profile.height_cm} cm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="font-semibold">{profile.weight_kg} kg</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Your Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">BMI</p>
                <p className="font-semibold text-primary">{profile.bmi.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BMR</p>
                <p className="font-semibold">{profile.bmr} kcal</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">TDEE</p>
                <p className="font-semibold">{profile.tdee} kcal</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target</p>
                <p className="font-semibold text-accent">{profile.target_calories} kcal</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Daily Macros</p>
              <div className="flex justify-between text-sm">
                <span>Protein: <strong className="text-primary">{profile.protein_g}g</strong></span>
                <span>Carbs: <strong className="text-orange-600">{profile.carbs_g}g</strong></span>
                <span>Fat: <strong className="text-blue-600">{profile.fat_g}g</strong></span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal & Activity */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Goal & Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Current Goal</p>
              <p className="font-semibold">{getGoalText(profile.goal)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Activity Level</p>
              <p className="font-semibold">{getActivityText(profile.baseline_activity)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Exercise Frequency</p>
              <p className="font-semibold capitalize">{profile.exercise_frequency}</p>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Stats & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{profile.current_streak_days}</p>
                <p className="text-xs text-muted-foreground">Current Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-accent">{profile.longest_streak_days}</p>
                <p className="text-xs text-muted-foreground">Best Streak</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{profile.total_points}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full h-12"
            onClick={() => navigate('/admin')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin Settings
          </Button>
          <Button
            variant="destructive"
            className="w-full h-12"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <MobileNav />
    </div>
  );
}
