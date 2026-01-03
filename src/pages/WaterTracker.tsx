import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Droplet, Plus, Minus, TrendingUp, Calendar, Award } from 'lucide-react';
import { format, startOfDay, endOfDay } from 'date-fns';

interface WaterLog {
    id: string;
    amount_ml: number;
    logged_at: string;
}

const QUICK_AMOUNTS = [250, 500, 750, 1000]; // ml

export default function WaterTracker() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [todayTotal, setTodayTotal] = useState(0);
    const [dailyGoal, setDailyGoal] = useState(2000); // Default 2L
    const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
    const [weeklyAverage, setWeeklyAverage] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string>('');

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
        loadProfile(user.id);
        loadTodayWater(user.id);
        loadWeeklyAverage(user.id);
    };

    const loadProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('daily_water_goal_ml')
                .eq('id', userId)
                .single();

            if (error) throw error;
            if (data?.daily_water_goal_ml) {
                setDailyGoal(data.daily_water_goal_ml);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const loadTodayWater = async (userId: string) => {
        setLoading(true);
        try {
            const today = new Date();
            const startOfToday = startOfDay(today).toISOString();
            const endOfToday = endOfDay(today).toISOString();

            const { data, error } = await supabase
                .from('water_log')
                .select('*')
                .eq('user_id', userId)
                .gte('logged_at', startOfToday)
                .lte('logged_at', endOfToday)
                .order('logged_at', { ascending: false });

            if (error) throw error;

            setTodayLogs(data || []);
            const total = data?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
            setTodayTotal(total);
        } catch (error) {
            console.error('Error loading water logs:', error);
            toast({
                title: 'Error',
                description: 'Failed to load water logs',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadWeeklyAverage = async (userId: string) => {
        try {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            const { data, error } = await supabase
                .from('water_log')
                .select('amount_ml')
                .eq('user_id', userId)
                .gte('logged_at', sevenDaysAgo.toISOString());

            if (error) throw error;

            const total = data?.reduce((sum, log) => sum + log.amount_ml, 0) || 0;
            const average = Math.round(total / 7);
            setWeeklyAverage(average);
        } catch (error) {
            console.error('Error loading weekly average:', error);
        }
    };

    const logWater = async (amount: number) => {
        try {
            const { error } = await supabase
                .from('water_log')
                .insert({
                    user_id: currentUserId,
                    amount_ml: amount,
                    logged_at: new Date().toISOString()
                });

            if (error) throw error;

            // Award points for logging water
            await supabase.from('points_history').insert({
                user_id: currentUserId,
                points: 5,
                reason: 'Logged water intake'
            });

            toast({
                title: 'Water logged!',
                description: `+${amount}ml added. Keep hydrated! (+5 points)`
            });

            loadTodayWater(currentUserId);
            loadWeeklyAverage(currentUserId);
        } catch (error) {
            console.error('Error logging water:', error);
            toast({
                title: 'Error',
                description: 'Failed to log water',
                variant: 'destructive'
            });
        }
    };

    const deleteLog = async (logId: string) => {
        try {
            const { error } = await supabase
                .from('water_log')
                .delete()
                .eq('id', logId);

            if (error) throw error;

            toast({
                title: 'Log deleted',
                description: 'Water log has been removed'
            });

            loadTodayWater(currentUserId);
            loadWeeklyAverage(currentUserId);
        } catch (error) {
            console.error('Error deleting log:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete log',
                variant: 'destructive'
            });
        }
    };

    const updateGoal = async (newGoal: number) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ daily_water_goal_ml: newGoal })
                .eq('id', currentUserId);

            if (error) throw error;

            setDailyGoal(newGoal);
            toast({
                title: 'Goal updated!',
                description: `Daily water goal set to ${newGoal}ml`
            });
        } catch (error) {
            console.error('Error updating goal:', error);
            toast({
                title: 'Error',
                description: 'Failed to update goal',
                variant: 'destructive'
            });
        }
    };

    const getProgressPercentage = () => {
        return Math.min(Math.round((todayTotal / dailyGoal) * 100), 100);
    };

    const getProgressColor = () => {
        const percentage = getProgressPercentage();
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-gray-400';
    };

    const getCupsRemaining = () => {
        const remaining = Math.max(dailyGoal - todayTotal, 0);
        return Math.ceil(remaining / 250); // 250ml per cup
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading water tracker...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">💧 Water Tracker</h1>
                <p className="text-muted-foreground">Stay hydrated and track your daily water intake</p>
            </div>

            {/* Progress Card */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Today's Progress</span>
                        <span className="text-2xl font-bold text-blue-600">
                            {todayTotal}ml / {dailyGoal}ml
                        </span>
                    </CardTitle>
                    <CardDescription>
                        {getProgressPercentage()}% of your daily goal
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={getProgressPercentage()} className={`h-4 ${getProgressColor()}`} />

                    {getProgressPercentage() >= 100 ? (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg flex items-center gap-2">
                            <Award className="w-6 h-6 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-700 dark:text-green-400">Goal Achieved! 🎉</p>
                                <p className="text-sm text-green-600 dark:text-green-500">
                                    You've reached your daily water goal. Great job!
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-muted-foreground">
                            {getCupsRemaining()} more cup{getCupsRemaining() !== 1 ? 's' : ''} (~250ml each) to reach your goal
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Quick Log Buttons */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Quick Log</CardTitle>
                    <CardDescription>Tap to log common water amounts</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {QUICK_AMOUNTS.map((amount) => (
                            <Button
                                key={amount}
                                onClick={() => logWater(amount)}
                                variant="outline"
                                className="h-20 flex flex-col gap-2"
                            >
                                <Droplet className="w-6 h-6 text-blue-500" />
                                <span className="font-semibold">{amount}ml</span>
                                <span className="text-xs text-muted-foreground">
                                    {amount === 250 ? '1 cup' : amount === 500 ? '2 cups' : amount === 750 ? '3 cups' : '4 cups'}
                                </span>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <TrendingUp className="w-5 h-5" />
                            Weekly Average
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">{weeklyAverage}ml</div>
                        <p className="text-sm text-muted-foreground mt-1">per day over last 7 days</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="w-5 h-5" />
                            Today's Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{todayLogs.length}</div>
                        <p className="text-sm text-muted-foreground mt-1">water entries logged today</p>
                    </CardContent>
                </Card>
            </div>

            {/* Goal Settings */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Daily Goal</CardTitle>
                    <CardDescription>Adjust your daily water intake goal</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateGoal(Math.max(dailyGoal - 250, 500))}
                        >
                            <Minus className="w-4 h-4" />
                        </Button>
                        <div className="flex-1 text-center">
                            <div className="text-2xl font-bold">{dailyGoal}ml</div>
                            <p className="text-sm text-muted-foreground">
                                {(dailyGoal / 1000).toFixed(1)}L per day
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateGoal(Math.min(dailyGoal + 250, 5000))}
                        >
                            <Plus className="w-4 h-4" />
                        </Button>
                    </div>
                    <div className="mt-4 flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateGoal(2000)}
                            className="flex-1"
                        >
                            2L (Standard)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateGoal(2500)}
                            className="flex-1"
                        >
                            2.5L (Active)
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateGoal(3000)}
                            className="flex-1"
                        >
                            3L (Athlete)
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Today's Log History */}
            <Card>
                <CardHeader>
                    <CardTitle>Today's Log History</CardTitle>
                    <CardDescription>All water entries for today</CardDescription>
                </CardHeader>
                <CardContent>
                    {todayLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Droplet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No water logged today</p>
                            <p className="text-sm">Use quick log buttons above to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {todayLogs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <Droplet className="w-5 h-5 text-blue-500" />
                                        <div>
                                            <p className="font-semibold">{log.amount_ml}ml</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(log.logged_at), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteLog(log.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
