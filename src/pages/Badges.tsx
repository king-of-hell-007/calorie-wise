import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileNav } from '@/components/MobileNav';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Award, Lock, Trophy, Star, Zap, Flame, Target, TrendingUp } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Unlocked Badges */}
      {userBadges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground px-1">Unlocked</h2>
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
        <h2 className="text-lg font-semibold text-foreground px-1">
          {userBadges.length > 0 ? 'Locked' : 'Available Badges'}
        </h2>
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
    </>
  );
}
