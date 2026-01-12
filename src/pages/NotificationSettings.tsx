import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellOff, Check, X } from 'lucide-react';

interface NotificationPreferences {
    meal_reminders: boolean;
    streak_reminders: boolean;
    challenge_updates: boolean;
    friend_activity: boolean;
    water_reminders: boolean;
}

export default function NotificationSettings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const [preferences, setPreferences] = useState<NotificationPreferences>({
        meal_reminders: true,
        streak_reminders: true,
        challenge_updates: true,
        friend_activity: true,
        water_reminders: true
    });

    useEffect(() => {
        checkAuth();
        checkNotificationPermission();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }
        setCurrentUserId(user.id);
        loadPreferences(user.id);
    };

    const checkNotificationPermission = () => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    };

    const loadPreferences = async (userId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                setPreferences({
                    meal_reminders: data.meal_reminders,
                    streak_reminders: data.streak_reminders,
                    challenge_updates: data.challenge_updates,
                    friend_activity: data.friend_activity,
                    water_reminders: data.water_reminders
                });
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            toast({
                title: 'Error',
                description: 'Failed to load notification preferences',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            toast({
                title: 'Not Supported',
                description: 'Notifications are not supported in this browser',
                variant: 'destructive'
            });
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission === 'granted') {
                toast({
                    title: 'Notifications Enabled',
                    description: 'You will now receive notifications'
                });

                // Send test notification
                new Notification('CalorieWise Notifications Enabled', {
                    body: 'You will now receive meal reminders and updates!',
                    icon: '/favicon.png'
                });
            } else {
                toast({
                    title: 'Permission Denied',
                    description: 'You can enable notifications in your browser settings',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Error requesting permission:', error);
            toast({
                title: 'Error',
                description: 'Failed to request notification permission',
                variant: 'destructive'
            });
        }
    };

    const updatePreference = async (key: keyof NotificationPreferences, value: boolean) => {
        setPreferences(prev => ({ ...prev, [key]: value }));

        try {
            const { error } = await supabase
                .from('notification_preferences')
                .upsert({
                    user_id: currentUserId,
                    [key]: value
                });

            if (error) throw error;

            toast({
                title: 'Saved',
                description: 'Notification preference updated'
            });
        } catch (error) {
            console.error('Error updating preference:', error);
            toast({
                title: 'Error',
                description: 'Failed to update preference',
                variant: 'destructive'
            });
            // Revert on error
            setPreferences(prev => ({ ...prev, [key]: !value }));
        }
    };

    const sendTestNotification = () => {
        if (notificationPermission !== 'granted') {
            toast({
                title: 'Permission Required',
                description: 'Please enable notifications first',
                variant: 'destructive'
            });
            return;
        }

        new Notification('CalorieWise Test Notification', {
            body: 'This is a test notification. You\'re all set!',
            icon: '/favicon.png',
            badge: '/favicon.png'
        });

        toast({
            title: 'Test Sent',
            description: 'Check your notifications!'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🔔 Notification Settings</h1>
                <p className="text-muted-foreground">Manage your notification preferences</p>
            </div>

            {/* Permission Status */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {notificationPermission === 'granted' ? (
                            <Bell className="w-5 h-5 text-green-600" />
                        ) : (
                            <BellOff className="w-5 h-5 text-muted-foreground" />
                        )}
                        Browser Notifications
                    </CardTitle>
                    <CardDescription>
                        {notificationPermission === 'granted' && 'Notifications are enabled'}
                        {notificationPermission === 'denied' && 'Notifications are blocked'}
                        {notificationPermission === 'default' && 'Notifications not enabled yet'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {notificationPermission === 'granted' ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                            <Check className="w-5 h-5 text-green-600" />
                            <span className="text-sm text-green-600 dark:text-green-400">
                                Notifications are enabled for CalorieWise
                            </span>
                        </div>
                    ) : notificationPermission === 'denied' ? (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                            <X className="w-5 h-5 text-red-600" />
                            <span className="text-sm text-red-600 dark:text-red-400">
                                Notifications are blocked. Please enable them in your browser settings.
                            </span>
                        </div>
                    ) : (
                        <Button onClick={requestNotificationPermission} className="w-full">
                            <Bell className="w-4 h-4 mr-2" />
                            Enable Notifications
                        </Button>
                    )}

                    {notificationPermission === 'granted' && (
                        <Button onClick={sendTestNotification} variant="outline" className="w-full">
                            Send Test Notification
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Types</CardTitle>
                    <CardDescription>Choose which notifications you want to receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Meal Reminders */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="meal-reminders" className="text-base">
                                Meal Reminders
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Get reminded to log your meals
                            </p>
                        </div>
                        <Switch
                            id="meal-reminders"
                            checked={preferences.meal_reminders}
                            onCheckedChange={(checked) => updatePreference('meal_reminders', checked)}
                            disabled={notificationPermission !== 'granted'}
                        />
                    </div>

                    {/* Streak Reminders */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="streak-reminders" className="text-base">
                                Streak Reminders
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Don't break your streak! Get daily reminders
                            </p>
                        </div>
                        <Switch
                            id="streak-reminders"
                            checked={preferences.streak_reminders}
                            onCheckedChange={(checked) => updatePreference('streak_reminders', checked)}
                            disabled={notificationPermission !== 'granted'}
                        />
                    </div>

                    {/* Challenge Updates */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="challenge-updates" className="text-base">
                                Challenge Updates
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Get notified about challenge progress and completions
                            </p>
                        </div>
                        <Switch
                            id="challenge-updates"
                            checked={preferences.challenge_updates}
                            onCheckedChange={(checked) => updatePreference('challenge_updates', checked)}
                            disabled={notificationPermission !== 'granted'}
                        />
                    </div>

                    {/* Friend Activity */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="friend-activity" className="text-base">
                                Friend Activity
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                See when friends achieve milestones
                            </p>
                        </div>
                        <Switch
                            id="friend-activity"
                            checked={preferences.friend_activity}
                            onCheckedChange={(checked) => updatePreference('friend_activity', checked)}
                            disabled={notificationPermission !== 'granted'}
                        />
                    </div>

                    {/* Water Reminders */}
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label htmlFor="water-reminders" className="text-base">
                                Water Reminders
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Stay hydrated with regular reminders
                            </p>
                        </div>
                        <Switch
                            id="water-reminders"
                            checked={preferences.water_reminders}
                            onCheckedChange={(checked) => updatePreference('water_reminders', checked)}
                            disabled={notificationPermission !== 'granted'}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="mt-6 bg-muted/50">
                <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                        💡 <strong>Tip:</strong> Notifications help you stay on track with your health goals.
                        You can customize which notifications you receive at any time.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
