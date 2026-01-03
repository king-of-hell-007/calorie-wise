import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar as CalendarIcon, TrendingUp, Shield } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

export const StreakCalendar = () => {
    const [calendarData, setCalendarData] = useState<{ date: string; hasEntry: boolean }[]>([]);
    const [stats, setStats] = useState({
        currentStreak: 0,
        longestStreak: 0,
        totalDays: 0,
        shieldsUsed: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCalendarData();
    }, []);

    const loadCalendarData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch profile for streak stats
            const { data: profile } = await supabase
                .from('profiles')
                .select('current_streak_days, longest_streak_days, streak_shields')
                .eq('id', user.id)
                .single();

            // Fetch last 30 days of meal entries
            const thirtyDaysAgo = format(subDays(new Date(), 29), 'yyyy-MM-dd');
            const { data: meals } = await supabase
                .from('meal_entries')
                .select('created_at')
                .eq('user_id', user.id)
                .gte('created_at', `${thirtyDaysAgo}T00:00:00`);

            // Create calendar grid
            const calendar: { date: string; hasEntry: boolean }[] = [];
            const mealDates = new Set(
                meals?.map(m => format(startOfDay(new Date(m.created_at)), 'yyyy-MM-dd')) || []
            );

            for (let i = 29; i >= 0; i--) {
                const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
                calendar.push({
                    date,
                    hasEntry: mealDates.has(date),
                });
            }

            setCalendarData(calendar);
            setStats({
                currentStreak: profile?.current_streak_days || 0,
                longestStreak: profile?.longest_streak_days || 0,
                totalDays: calendar.filter(d => d.hasEntry).length,
                shieldsUsed: 3 - (profile?.streak_shields || 0),
            });
        } catch (error) {
            console.error('Error loading calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="shadow-strong animate-pulse">
                <CardContent className="p-4">
                    <div className="h-48 bg-muted rounded" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-strong">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    30-Day Streak Calendar
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={i} className="text-center text-xs font-medium text-muted-foreground p-1">
                            {day}
                        </div>
                    ))}
                    {calendarData.map((day, index) => {
                        const date = new Date(day.date);
                        const isToday = format(new Date(), 'yyyy-MM-dd') === day.date;

                        return (
                            <div
                                key={day.date}
                                className={`
                  aspect-square rounded-md flex items-center justify-center text-xs
                  ${day.hasEntry
                                        ? 'bg-green-500 text-white font-semibold'
                                        : 'bg-red-100 text-red-400'
                                    }
                  ${isToday ? 'ring-2 ring-primary ring-offset-1' : ''}
                `}
                                title={`${format(date, 'MMM d')} - ${day.hasEntry ? 'Logged' : 'Missed'}`}
                            >
                                {format(date, 'd')}
                            </div>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-muted-foreground">Logged</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-red-100" />
                        <span className="text-muted-foreground">Missed</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-orange-600" />
                            <p className="text-xs text-muted-foreground">Current</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-600">{stats.currentStreak}</p>
                        <p className="text-xs text-muted-foreground">days</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-blue-600" />
                            <p className="text-xs text-muted-foreground">Shields Used</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-600">{stats.shieldsUsed}</p>
                        <p className="text-xs text-muted-foreground">of 3</p>
                    </div>
                </div>

                <div className="text-center pt-2">
                    <p className="text-sm font-medium">
                        {stats.totalDays} days logged in last 30 days
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Best streak: {stats.longestStreak} days
                    </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    Unlocked at 30-day streak 👑
                </p>
            </CardContent>
        </Card>
    );
};
