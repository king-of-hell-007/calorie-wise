import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { subDays, format } from 'date-fns';

interface WeeklyStats {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    totalMeals: number;
    trend: 'up' | 'down' | 'stable';
}

export const NutritionInsights = () => {
    const [insights, setInsights] = useState<WeeklyStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInsights();
    }, []);

    const loadInsights = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch last 7 days
            const sevenDaysAgo = format(subDays(new Date(), 6), 'yyyy-MM-dd');
            const { data: meals } = await supabase
                .from('meal_entries')
                .select('total_calories, total_protein, total_carbs, total_fat, created_at')
                .eq('user_id', user.id)
                .gte('created_at', `${sevenDaysAgo}T00:00:00`);

            if (!meals || meals.length === 0) {
                setInsights(null);
                return;
            }

            // Calculate averages
            const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
            const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein || 0), 0);
            const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs || 0), 0);
            const totalFat = meals.reduce((sum, m) => sum + (m.total_fat || 0), 0);

            const avgCalories = Math.round(totalCalories / 7);
            const avgProtein = Math.round(totalProtein / 7);
            const avgCarbs = Math.round(totalCarbs / 7);
            const avgFat = Math.round(totalFat / 7);

            // Calculate trend (compare first half vs second half of week)
            const midPoint = Math.floor(meals.length / 2);
            const firstHalfAvg = meals.slice(0, midPoint).reduce((sum, m) => sum + (m.total_calories || 0), 0) / midPoint;
            const secondHalfAvg = meals.slice(midPoint).reduce((sum, m) => sum + (m.total_calories || 0), 0) / (meals.length - midPoint);

            let trend: 'up' | 'down' | 'stable' = 'stable';
            const difference = secondHalfAvg - firstHalfAvg;
            if (Math.abs(difference) > 100) {
                trend = difference > 0 ? 'up' : 'down';
            }

            setInsights({
                avgCalories,
                avgProtein,
                avgCarbs,
                avgFat,
                totalMeals: meals.length,
                trend,
            });
        } catch (error) {
            console.error('Error loading insights:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card className="shadow-strong animate-pulse">
                <CardContent className="p-4">
                    <div className="h-40 bg-muted rounded" />
                </CardContent>
            </Card>
        );
    }

    if (!insights) {
        return (
            <Card className="shadow-strong">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Weekly Insights
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-8">
                        Log meals for 7 days to see your nutrition insights
                    </p>
                </CardContent>
            </Card>
        );
    }

    const getTrendIcon = () => {
        if (insights.trend === 'up') return <TrendingUp className="w-4 h-4 text-green-600" />;
        if (insights.trend === 'down') return <TrendingDown className="w-4 h-4 text-red-600" />;
        return <Minus className="w-4 h-4 text-gray-600" />;
    };

    const getTrendText = () => {
        if (insights.trend === 'up') return 'Increasing';
        if (insights.trend === 'down') return 'Decreasing';
        return 'Stable';
    };

    const getTrendColor = () => {
        if (insights.trend === 'up') return 'text-green-600';
        if (insights.trend === 'down') return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <Card className="shadow-strong">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary" />
                    Weekly Insights
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Trend Indicator */}
                <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Calorie Trend</p>
                            <p className={`text-lg font-bold ${getTrendColor()}`}>
                                {getTrendText()}
                            </p>
                        </div>
                        {getTrendIcon()}
                    </div>
                </div>

                {/* Average Stats */}
                <div className="space-y-3">
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Daily Average</span>
                            <span className="text-sm font-bold text-primary">{insights.avgCalories} kcal</span>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary"
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Protein</p>
                            <p className="text-lg font-bold text-blue-600">{insights.avgProtein}g</p>
                        </div>
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Carbs</p>
                            <p className="text-lg font-bold text-orange-600">{insights.avgCarbs}g</p>
                        </div>
                        <div className="p-2 bg-purple-50 rounded-lg">
                            <p className="text-xs text-muted-foreground">Fat</p>
                            <p className="text-lg font-bold text-purple-600">{insights.avgFat}g</p>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="text-center pt-2 border-t">
                    <p className="text-sm font-medium">
                        {insights.totalMeals} meals logged this week
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Keep up the great work! 🎯
                    </p>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                    Unlocked at 60-day streak ⚡
                </p>
            </CardContent>
        </Card>
    );
};
