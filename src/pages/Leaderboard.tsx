import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Flame, TrendingUp, Crown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LeaderboardEntry {
    id: string;
    user_name: string | null;
    full_name: string | null;
    current_streak_days: number;
    total_points: number;
    avatar_url: string | null;
    rank?: number;
    is_current_user?: boolean;
}

export default function Leaderboard() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [weeklyLeaders, setWeeklyLeaders] = useState<LeaderboardEntry[]>([]);
    const [monthlyLeaders, setMonthlyLeaders] = useState<LeaderboardEntry[]>([]);
    const [allTimeLeaders, setAllTimeLeaders] = useState<LeaderboardEntry[]>([]);
    const [friendsLeaders, setFriendsLeaders] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }
        setCurrentUserId(user.id);
        loadLeaderboards(user.id);
    };

    const loadLeaderboards = async (userId: string) => {
        setLoading(true);
        try {
            await Promise.all([
                loadWeeklyLeaders(userId),
                loadMonthlyLeaders(userId),
                loadAllTimeLeaders(userId),
                loadFriendsLeaders(userId)
            ]);
        } catch (error) {
            console.error('Error loading leaderboards:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadWeeklyLeaders = async (userId: string) => {
        try {
            // Get points earned in the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data: pointsData, error } = await supabase
                .from('points_history')
                .select('user_id, points')
                .gte('created_at', sevenDaysAgo.toISOString());

            if (error) throw error;

            // Aggregate points by user
            const userPoints: { [key: string]: number } = {};
            pointsData?.forEach(entry => {
                userPoints[entry.user_id] = (userPoints[entry.user_id] || 0) + entry.points;
            });

            // Get user profiles
            const userIds = Object.keys(userPoints);
            if (userIds.length === 0) {
                setWeeklyLeaders([]);
                return;
            }

            const { data: profiles } = await (supabase as any)
                .from('profiles')
                .select('id, user_name, full_name, avatar_url, current_streak_days')
                .in('id', userIds);

            const leaders = profiles?.map(profile => ({
                ...profile,
                total_points: userPoints[profile.id] || 0,
                is_current_user: profile.id === userId
            }))
                .sort((a, b) => b.total_points - a.total_points)
                .slice(0, 50)
                .map((entry, index) => ({ ...entry, rank: index + 1 })) || [];

            setWeeklyLeaders(leaders);
        } catch (error) {
            console.error('Error loading weekly leaders:', error);
        }
    };

    const loadMonthlyLeaders = async (userId: string) => {
        try {
            // Get points earned in the last 30 days
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: pointsData, error } = await supabase
                .from('points_history')
                .select('user_id, points')
                .gte('created_at', thirtyDaysAgo.toISOString());

            if (error) throw error;

            // Aggregate points by user
            const userPoints: { [key: string]: number } = {};
            pointsData?.forEach(entry => {
                userPoints[entry.user_id] = (userPoints[entry.user_id] || 0) + entry.points;
            });

            // Get user profiles
            const userIds = Object.keys(userPoints);
            if (userIds.length === 0) {
                setMonthlyLeaders([]);
                return;
            }

            const { data: profiles } = await (supabase as any)
                .from('profiles')
                .select('id, user_name, full_name, avatar_url, current_streak_days')
                .in('id', userIds);

            const leaders = profiles?.map(profile => ({
                ...profile,
                total_points: userPoints[profile.id] || 0,
                is_current_user: profile.id === userId
            }))
                .sort((a, b) => b.total_points - a.total_points)
                .slice(0, 50)
                .map((entry, index) => ({ ...entry, rank: index + 1 })) || [];

            setMonthlyLeaders(leaders);
        } catch (error) {
            console.error('Error loading monthly leaders:', error);
        }
    };

    const loadAllTimeLeaders = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('id, user_name, full_name, avatar_url, current_streak_days, total_points')
                .order('total_points', { ascending: false })
                .limit(50);

            if (error) throw error;

            const leaders = data?.map((entry, index) => ({
                ...entry,
                rank: index + 1,
                is_current_user: entry.id === userId
            })) || [];

            setAllTimeLeaders(leaders);
        } catch (error) {
            console.error('Error loading all-time leaders:', error);
        }
    };

    const loadFriendsLeaders = async (userId: string) => {
        try {
            // Get friend IDs
            const { data: friendships } = await (supabase as any)
                .from('friendships')
                .select('friend_id')
                .eq('user_id', userId)
                .eq('status', 'accepted');

            const friendIds = friendships?.map(f => f.friend_id) || [];

            if (friendIds.length === 0) {
                // Include only current user
                const { data: currentUser } = await (supabase as any)
                    .from('profiles')
                    .select('id, user_name, full_name, avatar_url, current_streak_days, total_points')
                    .eq('id', userId)
                    .single();

                if (currentUser) {
                    setFriendsLeaders([{ ...currentUser, rank: 1, is_current_user: true }]);
                }
                return;
            }

            // Include current user in the list
            friendIds.push(userId);

            const { data, error } = await (supabase as any)
                .from('profiles')
                .select('id, user_name, full_name, avatar_url, current_streak_days, total_points')
                .in('id', friendIds)
                .order('total_points', { ascending: false });

            if (error) throw error;

            const leaders = data?.map((entry, index) => ({
                ...entry,
                rank: index + 1,
                is_current_user: entry.id === userId
            })) || [];

            setFriendsLeaders(leaders);
        } catch (error) {
            console.error('Error loading friends leaders:', error);
        }
    };

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="w-6 h-6 text-yellow-500" />;
            case 2:
                return <Medal className="w-6 h-6 text-gray-400" />;
            case 3:
                return <Award className="w-6 h-6 text-amber-700" />;
            default:
                return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const renderLeaderboardList = (leaders: LeaderboardEntry[], emptyMessage: string) => {
        if (leaders.length === 0) {
            return (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No data yet</h3>
                        <p className="text-muted-foreground text-center">{emptyMessage}</p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="space-y-2">
                {leaders.map((entry) => (
                    <Card
                        key={entry.id}
                        className={entry.is_current_user ? 'border-primary border-2' : ''}
                    >
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3 flex-1">
                                <div className="w-12 flex items-center justify-center">
                                    {getRankIcon(entry.rank || 0)}
                                </div>
                                <Avatar className="w-12 h-12">
                                    <AvatarFallback className={`font-semibold ${entry.is_current_user ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                        {getInitials(entry.full_name || entry.user_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <p className="font-semibold">
                                        {entry.full_name || entry.user_name || 'Unknown User'}
                                        {entry.is_current_user && (
                                            <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">You</span>
                                        )}
                                    </p>
                                    <div className="flex gap-3 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Flame className="w-4 h-4 text-orange-500" />
                                            {entry.current_streak_days} days
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-amber-600 font-bold">
                                        <Trophy className="w-5 h-5" />
                                        {entry.total_points}
                                    </div>
                                    <p className="text-xs text-muted-foreground">points</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading leaderboards...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🏆 Leaderboard</h1>
                <p className="text-muted-foreground">See how you rank against others</p>
            </div>

            <Tabs defaultValue="weekly" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="weekly">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Weekly
                    </TabsTrigger>
                    <TabsTrigger value="monthly">
                        <Trophy className="w-4 h-4 mr-1" />
                        Monthly
                    </TabsTrigger>
                    <TabsTrigger value="alltime">
                        <Crown className="w-4 h-4 mr-1" />
                        All-Time
                    </TabsTrigger>
                    <TabsTrigger value="friends">
                        <Flame className="w-4 h-4 mr-1" />
                        Friends
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="weekly">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Weekly Leaders</CardTitle>
                            <CardDescription>Top performers in the last 7 days</CardDescription>
                        </CardHeader>
                    </Card>
                    {renderLeaderboardList(weeklyLeaders, 'Start logging meals to appear on the weekly leaderboard')}
                </TabsContent>

                <TabsContent value="monthly">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Monthly Leaders</CardTitle>
                            <CardDescription>Top performers in the last 30 days</CardDescription>
                        </CardHeader>
                    </Card>
                    {renderLeaderboardList(monthlyLeaders, 'Start logging meals to appear on the monthly leaderboard')}
                </TabsContent>

                <TabsContent value="alltime">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>All-Time Leaders</CardTitle>
                            <CardDescription>Hall of fame - highest total points ever</CardDescription>
                        </CardHeader>
                    </Card>
                    {renderLeaderboardList(allTimeLeaders, 'Keep logging meals to climb the all-time leaderboard')}
                </TabsContent>

                <TabsContent value="friends">
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Friends Leaderboard</CardTitle>
                            <CardDescription>Compete with your friends</CardDescription>
                        </CardHeader>
                    </Card>
                    {renderLeaderboardList(friendsLeaders, 'Add friends to see how you compare')}
                </TabsContent>
            </Tabs>
        </div>
    );
}
