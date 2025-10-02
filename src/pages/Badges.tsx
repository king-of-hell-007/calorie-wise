import { useEffect, useState } from 'react';
import { MobileNav } from '@/components/MobileNav';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Lock } from 'lucide-react';

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
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      // Load all available badges
      const resAll = await fetch('src/api/badges.php?action=all');
      const jsonAll = await resAll.json();
      if (!resAll.ok) throw new Error(jsonAll.error || 'Failed to load badges');
      setAllBadges(jsonAll.badges || []);

      // Load user's unlocked badges
      const resMine = await fetch('src/api/badges.php?action=mine', { headers: { Authorization: `Bearer ${token}` } });
      const jsonMine = await resMine.json();
      if (!resMine.ok) throw new Error(jsonMine.error || 'Failed to load user badges');
      setUserBadges(jsonMine.user_badges || []);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const isUnlocked = (badgeId: string) => {
    return userBadges.some(ub => ub.badge_id === badgeId);
  };

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
        <h1 className="text-2xl font-bold mb-1">Badges & Rewards</h1>
        <p className="text-white/90 text-sm">
          {userBadges.length} of {allBadges.length} badges unlocked
        </p>
      </div>

      <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
        {/* Unlocked Badges */}
        {userBadges.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground px-1">Unlocked</h2>
            <div className="grid gap-3">
              {allBadges
                .filter(badge => isUnlocked(badge.id))
                .map(badge => (
                  <Card key={badge.id} className="shadow-medium border-primary/20">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft">
                            <Award className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg mb-1">{badge.name}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                              +{badge.points} points
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Unlocked {new Date(userBadges.find(ub => ub.badge_id === badge.id)?.unlocked_at || '').toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
              .map(badge => (
                <Card key={badge.id} className="shadow-medium opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                          <Lock className="w-8 h-8 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1 text-muted-foreground">
                          {badge.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {badge.description}
                        </p>
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
                          +{badge.points} points
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
      </div>

      <MobileNav />
    </div>
  );
}
