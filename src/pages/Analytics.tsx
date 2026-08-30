import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Target, Calendar, Award, Flame, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { exportAnalyticsToPDF } from '@/lib/exportPDF';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
    weeklyTrend: any[];
    monthlyTrend: any[];
    macroDistribution: any[];
    mealDistribution: any[];
    streakHistory: any[];
    topFoods: any[];
    goalProgress: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
}

export default function Analytics() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (profile) {
            loadAnalytics();
        }
    }, [timeRange, profile]);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }

        // Load profile
        const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        setProfile(profileData);
    };

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const endDate = new Date();
            const startDate = timeRange === 'week'
                ? subDays(endDate, 7)
                : subDays(endDate, 30);

            // Fetch meal entries for the period
            const { data: meals } = await supabase
                .from('meal_entries')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: true });

            if (!meals) {
                setLoading(false);
                return;
            }

            // Process data for charts
            const processedData = processAnalyticsData(meals, startDate, endDate);
            setAnalyticsData(processedData);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const processAnalyticsData = (meals: any[], startDate: Date, endDate: Date): AnalyticsData => {
        // Weekly/Monthly Trend
        const trendData = [];
        const dayCount = timeRange === 'week' ? 7 : 30;

        for (let i = 0; i < dayCount; i++) {
            const date = subDays(endDate, dayCount - 1 - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const dayMeals = meals.filter(m =>
                format(new Date(m.created_at), 'yyyy-MM-dd') === dateStr
            );

            trendData.push({
                date: format(date, 'MMM dd'),
                calories: dayMeals.reduce((sum, m) => sum + (m.total_calories || 0), 0),
                protein: dayMeals.reduce((sum, m) => sum + (m.total_protein || 0), 0),
                carbs: dayMeals.reduce((sum, m) => sum + (m.total_carbs || 0), 0),
                fat: dayMeals.reduce((sum, m) => sum + (m.total_fat || 0), 0),
                meals: dayMeals.length
            });
        }

        // Macro Distribution (average)
        const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
        const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein || 0), 0);
        const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs || 0), 0);
        const totalFat = meals.reduce((sum, m) => sum + (m.total_fat || 0), 0);

        const macroDistribution = [
            { name: 'Protein', value: Math.round((totalProtein * 4 / totalCalories) * 100) || 0, color: '#3b82f6' },
            { name: 'Carbs', value: Math.round((totalCarbs * 4 / totalCalories) * 100) || 0, color: '#10b981' },
            { name: 'Fat', value: Math.round((totalFat * 9 / totalCalories) * 100) || 0, color: '#f59e0b' }
        ];

        // Meal Distribution by slot
        const mealSlots = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 };
        meals.forEach(m => {
            if (m.meal_slot && mealSlots.hasOwnProperty(m.meal_slot)) {
                mealSlots[m.meal_slot] += m.total_calories || 0;
            }
        });

        const mealDistribution = Object.entries(mealSlots).map(([name, value]) => ({
            name: name.charAt(0).toUpperCase() + name.slice(1),
            calories: value
        }));

        // Top Foods (from analyzer_json)
        const foodCounts: { [key: string]: { count: number; calories: number } } = {};
        meals.forEach(m => {
            if (m.analyzer_json?.food) {
                m.analyzer_json.food.forEach((food: any) => {
                    const name = food.name || 'Unknown';
                    if (!foodCounts[name]) {
                        foodCounts[name] = { count: 0, calories: 0 };
                    }
                    foodCounts[name].count++;
                    foodCounts[name].calories += food.calories || 0;
                });
            }
        });

        const topFoods = Object.entries(foodCounts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Goal Progress (average daily vs target)
        const avgDailyCalories = totalCalories / dayCount;
        const avgDailyProtein = totalProtein / dayCount;
        const avgDailyCarbs = totalCarbs / dayCount;
        const avgDailyFat = totalFat / dayCount;

        const goalProgress = {
            calories: profile?.target_calories ? Math.round((avgDailyCalories / profile.target_calories) * 100) : 0,
            protein: profile?.protein_g ? Math.round((avgDailyProtein / profile.protein_g) * 100) : 0,
            carbs: profile?.carbs_g ? Math.round((avgDailyCarbs / profile.carbs_g) * 100) : 0,
            fat: profile?.fat_g ? Math.round((avgDailyFat / profile.fat_g) * 100) : 0
        };

        // Compute streak history (mock visualization based on trendData)
        let currentStreak = 0;
        const streakHistory = trendData.map(day => {
            if (day.meals > 0) {
                currentStreak++;
            } else {
                currentStreak = 0;
            }
            return {
                date: day.date,
                streak: currentStreak
            };
        });

        return {
            weeklyTrend: timeRange === 'week' ? trendData : [],
            monthlyTrend: timeRange === 'month' ? trendData : [],
            macroDistribution,
            mealDistribution,
            streakHistory,
            topFoods,
            goalProgress
        };
    };

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const handleExportPDF = async () => {
        if (!analyticsData || !profile) {
            toast({ title: 'Error', description: 'No data to export', variant: 'destructive' });
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const endDate = new Date();
            const startDate = timeRange === 'week' ? subDays(endDate, 7) : subDays(endDate, 30);

            const { data: meals } = await supabase
                .from('meal_entries')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString());

            const filename = await exportAnalyticsToPDF({
                meals: meals || [],
                profile,
                dateRange: { start: startDate, end: endDate }
            });

            toast({ title: 'Success', description: `Exported to ${filename}` });
        } catch (error) {
            console.error('Export error:', error);
            toast({ title: 'Error', description: 'Failed to export PDF', variant: 'destructive' });
        }
    };

    return (
        <div className="container mx-auto p-4 pb-20 max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">📊 Analytics Dashboard</h1>
                    <p className="text-muted-foreground">Track your nutrition trends and progress</p>
                </div>
                <Button onClick={handleExportPDF} variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export PDF
                </Button>
            </div>

            {/* Time Range Selector */}
            <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as 'week' | 'month')} className="mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="week">Last 7 Days</TabsTrigger>
                    <TabsTrigger value="month">Last 30 Days</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Goal Progress Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Calories</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analyticsData?.goalProgress.calories || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">of daily goal</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Protein</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{analyticsData?.goalProgress.protein || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">of daily goal</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Carbs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{analyticsData?.goalProgress.carbs || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">of daily goal</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Fat</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">{analyticsData?.goalProgress.fat || 0}%</div>
                        <p className="text-xs text-muted-foreground mt-1">of daily goal</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* Calorie Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle>Calorie Trend</CardTitle>
                        <CardDescription>Daily calorie intake over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={timeRange === 'week' ? analyticsData?.weeklyTrend : analyticsData?.monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="calories" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Macro Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Macro Distribution</CardTitle>
                        <CardDescription>Average macronutrient breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={analyticsData?.macroDistribution}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(entry) => `${entry.name}: ${entry.value}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {analyticsData?.macroDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Meal Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Calories by Meal</CardTitle>
                        <CardDescription>Distribution across meal times</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={analyticsData?.mealDistribution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="calories" fill="#10b981" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Foods */}
                <Card>
                    <CardHeader>
                        <CardTitle>Most Logged Foods</CardTitle>
                        <CardDescription>Your favorite meals</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analyticsData?.topFoods.slice(0, 5).map((food, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{food.name}</p>
                                            <p className="text-xs text-muted-foreground">{food.count} times</p>
                                        </div>
                                    </div>
                                    <div className="text-sm font-medium">{food.calories} cal</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
