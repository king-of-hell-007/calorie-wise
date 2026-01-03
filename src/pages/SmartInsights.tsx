import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Target, Sparkles } from 'lucide-react';
import { format, subDays } from 'date-fns';

interface Insight {
    type: 'success' | 'warning' | 'info' | 'tip';
    title: string;
    description: string;
    action?: string;
    icon: any;
}

interface NutritionStats {
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    daysLogged: number;
    totalMeals: number;
}

export default function SmartInsights() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [stats, setStats] = useState<NutritionStats | null>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }
        loadProfile(user.id);
        loadStats(user.id);
    };

    const loadProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const loadStats = async (userId: string) => {
        setLoading(true);
        try {
            const sevenDaysAgo = subDays(new Date(), 7);

            const { data: meals, error } = await supabase
                .from('meal_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', sevenDaysAgo.toISOString());

            if (error) throw error;

            if (!meals || meals.length === 0) {
                setInsights([{
                    type: 'info',
                    title: 'Start Logging Meals',
                    description: 'Log your meals for 7 days to receive personalized insights and recommendations.',
                    icon: Lightbulb
                }]);
                setLoading(false);
                return;
            }

            // Calculate stats
            const totalCalories = meals.reduce((sum, m) => sum + (m.total_calories || 0), 0);
            const totalProtein = meals.reduce((sum, m) => sum + (m.total_protein || 0), 0);
            const totalCarbs = meals.reduce((sum, m) => sum + (m.total_carbs || 0), 0);
            const totalFat = meals.reduce((sum, m) => sum + (m.total_fat || 0), 0);

            const daysWithMeals = new Set(
                meals.map(m => format(new Date(m.created_at), 'yyyy-MM-dd'))
            ).size;

            const nutritionStats: NutritionStats = {
                avgCalories: Math.round(totalCalories / daysWithMeals),
                avgProtein: Math.round(totalProtein / daysWithMeals),
                avgCarbs: Math.round(totalCarbs / daysWithMeals),
                avgFat: Math.round(totalFat / daysWithMeals),
                daysLogged: daysWithMeals,
                totalMeals: meals.length
            };

            setStats(nutritionStats);
            generateInsights(nutritionStats, meals);
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateInsights = (stats: NutritionStats, meals: any[]) => {
        const generatedInsights: Insight[] = [];

        // Calorie insights
        if (profile?.target_calories) {
            const caloriesDiff = stats.avgCalories - profile.target_calories;
            const percentDiff = Math.abs((caloriesDiff / profile.target_calories) * 100);

            if (Math.abs(caloriesDiff) < 100) {
                generatedInsights.push({
                    type: 'success',
                    title: 'Perfect Calorie Balance!',
                    description: `You're averaging ${stats.avgCalories} calories per day, right on target! Keep up the great work.`,
                    icon: CheckCircle
                });
            } else if (caloriesDiff > 0 && percentDiff > 10) {
                generatedInsights.push({
                    type: 'warning',
                    title: 'Calories Above Target',
                    description: `You're averaging ${Math.round(caloriesDiff)} calories over your daily goal. Consider smaller portions or lower-calorie alternatives.`,
                    action: 'View meal suggestions',
                    icon: AlertTriangle
                });
            } else if (caloriesDiff < 0 && percentDiff > 10) {
                generatedInsights.push({
                    type: 'warning',
                    title: 'Calories Below Target',
                    description: `You're averaging ${Math.round(Math.abs(caloriesDiff))} calories under your daily goal. Make sure you're eating enough to fuel your body.`,
                    icon: AlertTriangle
                });
            }
        }

        // Protein insights
        if (profile?.protein_g) {
            const proteinPercent = (stats.avgProtein / profile.protein_g) * 100;

            if (proteinPercent >= 90 && proteinPercent <= 110) {
                generatedInsights.push({
                    type: 'success',
                    title: 'Excellent Protein Intake',
                    description: `You're hitting your protein target of ${profile.protein_g}g consistently. This supports muscle maintenance and recovery.`,
                    icon: CheckCircle
                });
            } else if (proteinPercent < 80) {
                generatedInsights.push({
                    type: 'tip',
                    title: 'Boost Your Protein',
                    description: `You're averaging ${stats.avgProtein}g protein per day. Try adding lean meats, eggs, Greek yogurt, or protein shakes to reach your ${profile.protein_g}g goal.`,
                    action: 'High-protein meal ideas',
                    icon: Lightbulb
                });
            }
        }

        // Consistency insights
        if (stats.daysLogged >= 5) {
            generatedInsights.push({
                type: 'success',
                title: 'Great Consistency!',
                description: `You've logged meals on ${stats.daysLogged} out of the last 7 days. Consistency is key to reaching your goals!`,
                icon: TrendingUp
            });
        } else if (stats.daysLogged < 3) {
            generatedInsights.push({
                type: 'tip',
                title: 'Log More Consistently',
                description: `You've only logged ${stats.daysLogged} days this week. Try to log every day for better tracking and insights.`,
                action: 'Set reminders',
                icon: Target
            });
        }

        // Meal frequency insights
        const mealsPerDay = stats.totalMeals / stats.daysLogged;
        if (mealsPerDay < 2) {
            generatedInsights.push({
                type: 'tip',
                title: 'Consider More Frequent Meals',
                description: `You're averaging ${mealsPerDay.toFixed(1)} meals per day. Eating 3-4 smaller meals can help maintain energy levels and metabolism.`,
                icon: Lightbulb
            });
        }

        // Macro balance insights
        const totalMacros = stats.avgProtein + stats.avgCarbs + stats.avgFat;
        const proteinPercent = (stats.avgProtein * 4 / stats.avgCalories) * 100;
        const carbsPercent = (stats.avgCarbs * 4 / stats.avgCalories) * 100;
        const fatPercent = (stats.avgFat * 9 / stats.avgCalories) * 100;

        if (carbsPercent > 60) {
            generatedInsights.push({
                type: 'info',
                title: 'High Carb Intake',
                description: `Carbs make up ${Math.round(carbsPercent)}% of your calories. If you're trying to lose weight, consider balancing with more protein and healthy fats.`,
                icon: Lightbulb
            });
        }

        if (fatPercent < 20) {
            generatedInsights.push({
                type: 'tip',
                title: 'Consider More Healthy Fats',
                description: `Fats are only ${Math.round(fatPercent)}% of your diet. Healthy fats from nuts, avocados, and olive oil are essential for hormone production and nutrient absorption.`,
                icon: Lightbulb
            });
        }

        // Streak insights
        if (profile?.current_streak_days >= 7) {
            generatedInsights.push({
                type: 'success',
                title: `${profile.current_streak_days}-Day Streak! 🔥`,
                description: `Amazing! You've logged meals for ${profile.current_streak_days} consecutive days. You're building a powerful habit!`,
                icon: Sparkles
            });
        }

        setInsights(generatedInsights);
    };

    const getInsightColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'border-green-500 bg-green-50 dark:bg-green-950';
            case 'warning':
                return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
            case 'info':
                return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
            case 'tip':
                return 'border-purple-500 bg-purple-50 dark:bg-purple-950';
            default:
                return '';
        }
    };

    const getInsightBadgeColor = (type: string) => {
        switch (type) {
            case 'success':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'warning':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'info':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'tip':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            default:
                return '';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Analyzing your nutrition data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">💡 Smart Insights</h1>
                <p className="text-muted-foreground">Personalized recommendations based on your nutrition data</p>
            </div>

            {/* Stats Overview */}
            {stats && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Your 7-Day Summary</CardTitle>
                        <CardDescription>Average daily nutrition over the past week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <div className="text-2xl font-bold">{stats.avgCalories}</div>
                                <div className="text-xs text-muted-foreground">Avg Calories</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">{stats.avgProtein}g</div>
                                <div className="text-xs text-muted-foreground">Avg Protein</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-green-600">{stats.avgCarbs}g</div>
                                <div className="text-xs text-muted-foreground">Avg Carbs</div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                                <div className="text-2xl font-bold text-amber-600">{stats.avgFat}g</div>
                                <div className="text-xs text-muted-foreground">Avg Fat</div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center gap-6 text-sm text-muted-foreground">
                            <span>{stats.daysLogged} days logged</span>
                            <span>•</span>
                            <span>{stats.totalMeals} total meals</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Insights */}
            <div className="space-y-4">
                {insights.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Lightbulb className="w-16 h-16 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No insights yet</h3>
                            <p className="text-muted-foreground text-center">
                                Log meals for a few days to receive personalized insights
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    insights.map((insight, index) => {
                        const Icon = insight.icon;
                        return (
                            <Card key={index} className={`border-2 ${getInsightColor(insight.type)}`}>
                                <CardContent className="pt-6">
                                    <div className="flex gap-4">
                                        <div className="flex-shrink-0">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getInsightBadgeColor(insight.type)}`}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="font-bold text-lg">{insight.title}</h3>
                                                <Badge className={getInsightBadgeColor(insight.type)}>
                                                    {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground mb-3">{insight.description}</p>
                                            {insight.action && (
                                                <Button variant="outline" size="sm">
                                                    {insight.action}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Tips Card */}
            <Card className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Pro Tips
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        <li className="flex gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>Log meals consistently for more accurate insights</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>Aim for balanced macros: 30% protein, 40% carbs, 30% fats</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>Drink water throughout the day for better metabolism</span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                            <span>Check insights weekly to track your progress</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
