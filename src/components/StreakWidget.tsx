import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Flame, Shield, Trophy, TrendingUp } from 'lucide-react';

export const StreakWidget = () => {
    const [streakData, setStreakData] = useState({
        current: 0,
        longest: 0,
        shields: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStreakData();
    }, []);

    const loadStreakData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('profiles')
                .select('current_streak_days, longest_streak_days, streak_shields')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data) {
                setStreakData({
                    current: data.current_streak_days || 0,
                    longest: data.longest_streak_days || 0,
                    shields: data.streak_shields || 0,
                });
            }
        } catch (error) {
            console.error('Error loading streak data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStreakTier = (days: number) => {
        if (days >= 365) return { name: 'Legendary', color: 'text-purple-600', bgColor: 'bg-purple-100' };
        if (days >= 180) return { name: 'Elite', color: 'text-blue-600', bgColor: 'bg-blue-100' };
        if (days >= 100) return { name: 'Master', color: 'text-green-600', bgColor: 'bg-green-100' };
        if (days >= 60) return { name: 'Advanced', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
        if (days >= 30) return { name: 'Intermediate', color: 'text-orange-600', bgColor: 'bg-orange-100' };
        if (days >= 7) return { name: 'Beginner', color: 'text-gray-600', bgColor: 'bg-gray-100' };
        return { name: 'Newbie', color: 'text-gray-400', bgColor: 'bg-gray-50' };
    };

    const tier = getStreakTier(streakData.current);

    if (loading) {
        return (
            <Card className="shadow-strong animate-pulse">
                <CardContent className="p-4">
                    <div className="h-24 bg-muted rounded" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-strong">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    Your Streak
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Current Streak */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <div>
                        <p className="text-sm text-muted-foreground">Current Streak</p>
                        <p className="text-3xl font-bold text-orange-600">{streakData.current}</p>
                        <p className="text-xs text-muted-foreground">days</p>
                    </div>
                    <Flame className="w-12 h-12 text-orange-500" />
                </div>

                {/* Tier Badge */}
                <div className={`p-2 rounded-lg ${tier.bgColor} text-center`}>
                    <p className="text-xs text-muted-foreground">Tier</p>
                    <p className={`text-lg font-bold ${tier.color}`}>{tier.name}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Trophy className="w-4 h-4 text-yellow-600" />
                            <p className="text-xs text-muted-foreground">Best</p>
                        </div>
                        <p className="text-xl font-bold text-yellow-600">{streakData.longest}</p>
                    </div>
                    <div className="p-2 bg-muted/50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-muted-foreground">Shields</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600">{streakData.shields}/3</p>
                    </div>
                </div>

                {/* Next Milestone */}
                {streakData.current < 365 && (
                    <div className="p-2 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-primary" />
                            <p className="text-xs font-medium">Next Milestone</p>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {streakData.current < 7 && `${7 - streakData.current} days to Week Warrior`}
                            {streakData.current >= 7 && streakData.current < 30 && `${30 - streakData.current} days to Month Master`}
                            {streakData.current >= 30 && streakData.current < 60 && `${60 - streakData.current} days to Two Month Titan`}
                            {streakData.current >= 60 && streakData.current < 100 && `${100 - streakData.current} days to Century Club`}
                            {streakData.current >= 100 && streakData.current < 180 && `${180 - streakData.current} days to Half Year Hero`}
                            {streakData.current >= 180 && streakData.current < 365 && `${365 - streakData.current} days to Year Warrior`}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
