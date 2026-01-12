import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Activity, Heart, Moon, TrendingUp, Zap, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface FitbitConnection {
    is_active: boolean;
    last_synced_at: string | null;
    fitbit_user_id: string;
}

interface FitbitData {
    date: string;
    calories_burned: number;
    steps: number;
    distance_km: number;
    active_minutes: number;
    resting_heart_rate: number;
    sleep_minutes: number;
}

export default function FitbitConnect() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [connection, setConnection] = useState<FitbitConnection | null>(null);
    const [todayData, setTodayData] = useState<FitbitData | null>(null);
    const [syncing, setSyncing] = useState(false);

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
        loadConnection(user.id);
        loadTodayData(user.id);
    };

    const loadConnection = async (userId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('fitbit_connections')
                .select('is_active, last_synced_at, fitbit_user_id')
                .eq('user_id', userId)
                .eq('is_active', true)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setConnection(data);
        } catch (error) {
            console.error('Error loading connection:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTodayData = async (userId: string) => {
        try {
            const today = format(new Date(), 'yyyy-MM-dd');
            const { data, error } = await supabase
                .from('fitbit_daily_data')
                .select('*')
                .eq('user_id', userId)
                .eq('date', today)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setTodayData(data);
        } catch (error) {
            console.error('Error loading today data:', error);
        }
    };

    const connectFitbit = () => {
        // OAuth flow - This will be handled by Edge Function
        const clientId = import.meta.env.VITE_FITBIT_CLIENT_ID;
        const redirectUri = `${window.location.origin}/fitbit/callback`;
        const scope = 'activity heartrate sleep weight profile';

        const authUrl = `https://www.fitbit.com/oauth2/authorize?` +
            `response_type=code&` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent(scope)}&` +
            `expires_in=31536000`; // 1 year

        window.location.href = authUrl;
    };

    const disconnectFitbit = async () => {
        try {
            const { error } = await supabase
                .from('fitbit_connections')
                .update({ is_active: false })
                .eq('user_id', currentUserId);

            if (error) throw error;

            // Update profile
            await supabase
                .from('profiles')
                .update({
                    fitbit_connected: false,
                    use_dynamic_calories: false
                })
                .eq('id', currentUserId);

            toast({
                title: 'Fitbit disconnected',
                description: 'Your Fitbit has been disconnected'
            });

            setConnection(null);
            setTodayData(null);
        } catch (error) {
            console.error('Error disconnecting:', error);
            toast({
                title: 'Error',
                description: 'Failed to disconnect Fitbit',
                variant: 'destructive'
            });
        }
    };

    const syncNow = async () => {
        setSyncing(true);
        try {
            // Call Edge Function to sync data
            const { data, error } = await supabase.functions.invoke('fitbit-sync', {
                body: { user_id: currentUserId }
            });

            if (error) throw error;

            toast({
                title: 'Synced successfully',
                description: 'Your Fitbit data has been updated'
            });

            loadTodayData(currentUserId);
            loadConnection(currentUserId);
        } catch (error) {
            console.error('Error syncing:', error);
            toast({
                title: 'Sync failed',
                description: 'Could not sync Fitbit data',
                variant: 'destructive'
            });
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🏃 Fitbit Integration</h1>
                <p className="text-muted-foreground">
                    Connect your Fitbit for dynamic calorie tracking based on real activity
                </p>
            </div>

            {/* Connection Status */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Connection Status</span>
                        {connection ? (
                            <Badge variant="default" className="bg-green-600">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Connected
                            </Badge>
                        ) : (
                            <Badge variant="secondary">
                                <XCircle className="w-4 h-4 mr-1" />
                                Not Connected
                            </Badge>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {connection
                            ? `Last synced: ${connection.last_synced_at ? format(new Date(connection.last_synced_at), 'MMM d, yyyy h:mm a') : 'Never'}`
                            : 'Connect your Fitbit to enable dynamic calorie tracking'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {connection ? (
                        <div className="space-y-4">
                            <div className="flex gap-2">
                                <Button onClick={syncNow} disabled={syncing}>
                                    <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </Button>
                                <Button onClick={disconnectFitbit} variant="destructive">
                                    Disconnect Fitbit
                                </Button>
                            </div>

                            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm text-blue-600 dark:text-blue-400">
                                    ✨ <strong>Dynamic Calories Enabled!</strong> Your daily calorie target will automatically adjust based on your Fitbit activity data.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Button onClick={connectFitbit} size="lg" className="w-full">
                                Connect Fitbit Account
                            </Button>

                            <div className="p-4 bg-muted rounded-lg">
                                <p className="text-sm text-muted-foreground">
                                    <strong>What you'll get:</strong>
                                    <br />
                                    • Real-time calorie burn tracking
                                    <br />
                                    • Dynamic daily calorie targets
                                    <br />
                                    • Activity and sleep insights
                                    <br />
                                    • Heart rate monitoring
                                    <br />
                                    • Automatic data sync every 15 minutes
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Today's Data */}
            {connection && todayData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Calories Burned */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-500" />
                                Calories Burned
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{todayData.calories_burned?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total energy expenditure today</p>
                        </CardContent>
                    </Card>

                    {/* Steps */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Activity className="w-4 h-4 text-blue-500" />
                                Steps
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{todayData.steps?.toLocaleString() || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                {todayData.distance_km ? `${todayData.distance_km.toFixed(2)} km` : '0 km'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Minutes */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-500" />
                                Active Minutes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{todayData.active_minutes || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Minutes of activity</p>
                        </CardContent>
                    </Card>

                    {/* Heart Rate */}
                    {todayData.resting_heart_rate && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-red-500" />
                                    Resting Heart Rate
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">{todayData.resting_heart_rate}</div>
                                <p className="text-xs text-muted-foreground mt-1">bpm</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sleep */}
                    {todayData.sleep_minutes && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Moon className="w-4 h-4 text-purple-500" />
                                    Sleep
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {Math.floor(todayData.sleep_minutes / 60)}h {todayData.sleep_minutes % 60}m
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Last night</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* How It Works */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>How Dynamic Calories Work</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex gap-3">
                        <div className="text-2xl">📊</div>
                        <div>
                            <strong>Real-Time Tracking:</strong> Your Fitbit tracks actual calories burned throughout the day based on your activity level, heart rate, and movement.
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="text-2xl">🎯</div>
                        <div>
                            <strong>Dynamic Targets:</strong> Your daily calorie target automatically adjusts based on how active you are. More activity = higher target, less activity = lower target.
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="text-2xl">⚖️</div>
                        <div>
                            <strong>Goal-Based Adjustment:</strong> The system factors in your goal (lose/maintain/gain weight) and adjusts your intake accordingly based on actual expenditure.
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="text-2xl">🔄</div>
                        <div>
                            <strong>Auto-Sync:</strong> Data syncs automatically every 15 minutes, keeping your targets up-to-date throughout the day.
                        </div>
                    </div>

                    <div className="p-3 bg-muted rounded-lg mt-4">
                        <p className="text-xs">
                            <strong>Example:</strong> If you walk 15,000 steps and burn 2,800 calories, your target might be 2,300 calories (500 deficit for weight loss). On a rest day with only 5,000 steps and 2,200 calories burned, your target would be 1,700 calories.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
