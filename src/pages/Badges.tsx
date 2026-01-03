import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileNav } from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSelector } from '@/components/ThemeSelector';
import { StreakCalendar } from '@/components/StreakCalendar';
import { DataExport } from '@/components/DataExport';
import { NutritionInsights } from '@/components/NutritionInsights';
import { supabase } from '@/integrations/supabase/client';
import { Award, Lock, Trophy, Star, Zap, Flame, Target, TrendingUp, Gift } from 'lucide-react';

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string | null;
  points: number;
};

type UserBadge = {
  badge_id: string;
  unlocked_at: string;
};

export default function Badges() {
  const navigate = useNavigate();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [streakDays, setStreakDays] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
    loadStreakData();
  }, []);

  const loadBadges = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Load all available badges
      const { data: badges, error: badgesError } = await supabase
        .from('badges')
        .select('*')
        .order('points', { ascending: true });

      if (badgesError) throw badgesError;
      setAllBadges(badges || []);

      // Load user's unlocked badges
      const { data: userBadgesData, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id, unlocked_at')
        .eq('user_id', user.id);

      if (userBadgesError) throw userBadgesError;
      setUserBadges(userBadgesData || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStreakData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('profiles')
        .select('current_streak_days')
        .eq('id', user.id)
        .single();

      if (data) {
        setStreakDays(data.current_streak_days || 0);
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const isUnlocked = (badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

  const getBadgeGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-orange-500 to-red-500',
      'from-green-500 to-emerald-500',
      'from-yellow-500 to-orange-500',
      'from-indigo-500 to-purple-500',
      'from-pink-500 to-rose-500',
      'from-teal-500 to-cyan-500',
    ];
    return gradients[index % gradients.length];
  };

  const getBadgeIcon = (index: number) => {
    const icons = [Award, Trophy, Star, Zap, Flame, Target, TrendingUp];
    return icons[index % icons.length];
  };

  const FeatureCard = ({
    children,
    requiredDays,
    unlocked
  }: {
    children: React.ReactNode;
    requiredDays: number;
    unlocked: boolean;
  }) => {
    if (!unlocked) {
      return (
        <div className="relative">
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
            <div className="text-center p-4">
              <Lock className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Unlocks at {requiredDays}-day streak</p>
              <p className="text-xs text-muted-foreground mt-1">
                {requiredDays - streakDays} days to go
              </p>
            </div>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
        <MobileNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-24">
      <div className="container max-w-2xl mx-auto p-4 space-y-6">
        {/* Header */}
        <Card className="shadow-strong border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Trophy className="w-6 h-6 text-primary" />
              Badges & Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Earn badges by completing challenges and unlock rewards by maintaining your streak! Current streak: <span className="font-bold text-primary">{streakDays} days</span>
            </p>
          </CardContent>
        </Card>

        {/* Tabs for Achievements vs Rewards */}
        <Tabs defaultValue="rewards" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rewards" className="flex items-center gap-2">
              <Gift className="w-4 h-4" />
              Streak Rewards
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              Achievements
            </TabsTrigger>
          </TabsList>

          {/* Streak Rewards Tab */}
          <TabsContent value="rewards" className="space-y-4 mt-6">
            {/* Theme Selector - Unlocks at 7 days */}
            <FeatureCard requiredDays={7} unlocked={streakDays >= 7}>
              <ThemeSelector />
            </FeatureCard>

            {/* Streak Calendar - Unlocks at 30 days */}
            <FeatureCard requiredDays={30} unlocked={streakDays >= 30}>
              <StreakCalendar />
            </FeatureCard>

            {/* Nutrition Insights - Unlocks at 60 days */}
            <FeatureCard requiredDays={60} unlocked={streakDays >= 60}>
              <NutritionInsights />
            </FeatureCard>

            {/* Data Export - Unlocks at 60 days */}
            <FeatureCard requiredDays={60} unlocked={streakDays >= 60}>
              <DataExport />
            </FeatureCard>

            {/* Pro Access Info - Unlocks at 100 days */}
            <FeatureCard requiredDays={100} unlocked={streakDays >= 100}>
              <Card className="shadow-strong border-yellow-500/50 bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    Century Club Member
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium mb-2">
                    Congratulations on reaching 100 days!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You've earned <span className="font-bold text-primary">1 month of free Pro access</span>.
                    All premium features are now unlocked for you!
                  </p>
                </CardContent>
              </Card>
            </FeatureCard>

            {/* Milestone Progress */}
            <Card className="shadow-strong">
              <CardHeader>
                <CardTitle className="text-lg">Milestone Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { days: 7, name: 'Week Warrior', reward: 'Custom Themes', points: 50, unlocked: streakDays >= 7 },
                  { days: 30, name: 'Month Master', reward: 'Streak Calendar', points: 200, unlocked: streakDays >= 30 },
                  { days: 60, name: 'Two Month Titan', reward: 'Insights & Export', points: 500, unlocked: streakDays >= 60 },
                  { days: 100, name: 'Century Club', reward: '1 Month Free Pro', points: 1000, unlocked: streakDays >= 100 },
                  { days: 180, name: 'Half Year Hero', reward: '2 Months Free Pro', points: 2000, unlocked: streakDays >= 180 },
                  { days: 365, name: 'Year Warrior', reward: '6 Months Free Pro', points: 5000, unlocked: streakDays >= 365 },
                ].map((milestone) => (
                  <div key={milestone.days} className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${milestone.unlocked ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                      }`}>
                      {milestone.unlocked ? '✓' : milestone.days}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{milestone.name}</p>
                      <p className="text-xs text-muted-foreground">{milestone.reward}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {milestone.unlocked ? (
                        <span className="text-xs font-bold text-green-600">
                          +{milestone.points} pts
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {milestone.days - streakDays} days
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4 mt-6">
            {/* Unlocked Badges */}
            {userBadges.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-foreground px-1">Unlocked</h3>
                <div className="grid gap-3">
                  {allBadges
                    .filter(badge => isUnlocked(badge.id))
                    .map((badge, index) => {
                      const Icon = getBadgeIcon(index);
                      const gradient = getBadgeGradient(index);
                      return (
                        <Card key={badge.id} className="shadow-strong border-2 border-primary/30 bg-gradient-card overflow-hidden relative">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full -mr-16 -mt-16" />
                          <CardContent className="p-4 relative">
                            <div className="flex items-start gap-4">
                              <div className="flex-shrink-0">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-strong animate-scale-in`}>
                                  <Icon className="w-8 h-8 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-bold text-lg">{badge.icon} {badge.name}</h3>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {badge.description}
                                </p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-xs font-bold bg-gradient-to-r ${gradient} text-white px-3 py-1.5 rounded-full shadow-medium`}>
                                    +{badge.points} points
                                  </span>
                                  <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                                    🎉 {new Date(userBadges.find(ub => ub.badge_id === badge.id)?.unlocked_at || '').toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Locked Badges */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground px-1">
                {userBadges.length > 0 ? 'Locked' : 'Available Badges'}
              </h3>
              <div className="grid gap-3">
                {allBadges
                  .filter(badge => !isUnlocked(badge.id))
                  .map((badge, index) => {
                    const Icon = getBadgeIcon(index);
                    const gradient = getBadgeGradient(index);
                    return (
                      <Card key={badge.id} className="shadow-medium border border-dashed border-muted-foreground/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-transparent" />
                        <CardContent className="p-4 relative">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 relative">
                                <Lock className="w-6 h-6 text-muted-foreground absolute" />
                                <Icon className="w-7 h-7 text-muted-foreground/30 blur-[1px]" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-bold text-lg text-muted-foreground">
                                  {badge.icon} {badge.name}
                                </h3>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {badge.description}
                              </p>
                              <span className={`inline-block text-xs font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent px-0 py-1`}>
                                🔒 Unlock to earn +{badge.points} points
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>

            {allBadges.length === 0 && (
              <Card className="shadow-medium">
                <CardContent className="p-6 text-center">
                  <Award className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No badges available yet. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <MobileNav />
    </div>
  );
}
