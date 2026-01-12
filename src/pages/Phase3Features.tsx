import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Bell,
    Activity,
    Calendar,
    ChefHat,
    TrendingUp,
    Download,
    Rss,
    CalendarDays,
    Star
} from 'lucide-react';

export default function Phase3Features() {
    const navigate = useNavigate();

    const features = [
        {
            icon: <Activity className="w-8 h-8 text-blue-500" />,
            title: 'Fitbit Integration',
            description: 'Connect your Fitbit for dynamic calorie tracking based on real activity',
            badge: 'Game Changer',
            badgeColor: 'bg-purple-600',
            path: '/fitbit',
            highlight: true
        },
        {
            icon: <Bell className="w-8 h-8 text-orange-500" />,
            title: 'Notification Settings',
            description: 'Customize meal reminders, streak alerts, and activity notifications',
            badge: 'New',
            badgeColor: 'bg-green-600',
            path: '/notifications'
        },
        {
            icon: <Rss className="w-8 h-8 text-indigo-500" />,
            title: 'Activity Feed',
            description: 'See what your friends are eating, share achievements, and stay motivated',
            badge: 'Social',
            badgeColor: 'bg-pink-600',
            path: '/feed'
        },
        {
            icon: <CalendarDays className="w-8 h-8 text-green-500" />,
            title: 'Meal Planner',
            description: 'Plan your weekly meals, save templates, and generate shopping lists',
            badge: 'Popular',
            badgeColor: 'bg-blue-600',
            path: '/planner'
        },
        {
            icon: <ChefHat className="w-8 h-8 text-red-500" />,
            title: 'Recipe Gallery',
            description: 'Discover community recipes, rate and review, save your favorites',
            badge: 'Community',
            badgeColor: 'bg-yellow-600',
            path: '/recipe-gallery'
        },
        {
            icon: <Download className="w-8 h-8 text-purple-500" />,
            title: 'PDF Export',
            description: 'Export your analytics and meal logs to professional PDF reports',
            badge: 'Pro',
            badgeColor: 'bg-gray-600',
            path: '/analytics'
        }
    ];

    return (
        <div className="container mx-auto p-4 pb-20 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🚀 Phase 3 Features</h1>
                <p className="text-muted-foreground">
                    Explore the latest features to supercharge your nutrition tracking
                </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                    <Card
                        key={index}
                        className={`overflow-hidden hover:shadow-lg transition-all cursor-pointer ${feature.highlight ? 'border-2 border-purple-500 shadow-purple-100' : ''
                            }`}
                        onClick={() => navigate(feature.path)}
                    >
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div className="p-3 bg-muted rounded-lg">
                                    {feature.icon}
                                </div>
                                <Badge className={`${feature.badgeColor} text-white`}>
                                    {feature.badge}
                                </Badge>
                            </div>
                            <CardTitle className="mt-4">{feature.title}</CardTitle>
                            <CardDescription>{feature.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" variant={feature.highlight ? 'default' : 'outline'}>
                                Explore →
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* PWA Features */}
            <Card className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                        Progressive Web App (PWA)
                    </CardTitle>
                    <CardDescription>CalorieWise works offline and can be installed on your device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">📱</div>
                        <div>
                            <strong>Install as App:</strong> Add CalorieWise to your home screen for a native app experience
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">🔄</div>
                        <div>
                            <strong>Offline Mode:</strong> Log meals and track nutrition even without internet connection
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="text-2xl">⚡</div>
                        <div>
                            <strong>Fast & Reliable:</strong> Cached data loads instantly for better performance
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Analytics Enhancements */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="w-6 h-6 text-yellow-600" />
                        Enhanced Analytics
                    </CardTitle>
                    <CardDescription>New analytics features to track your progress better</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">📅 Custom Date Ranges</h3>
                        <p className="text-sm text-muted-foreground">
                            View analytics for any time period - last week, this month, or custom dates
                        </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">📊 Comparison Views</h3>
                        <p className="text-sm text-muted-foreground">
                            Compare this week vs last week to see your progress and improvements
                        </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">📄 PDF Reports</h3>
                        <p className="text-sm text-muted-foreground">
                            Export professional PDF reports of your analytics and meal logs
                        </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                        <h3 className="font-semibold mb-2">✍️ Recipe Reviews</h3>
                        <p className="text-sm text-muted-foreground">
                            Rate and review recipes to help the community find the best meals
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Coming Soon */}
            <Card className="mt-6 border-dashed">
                <CardHeader>
                    <CardTitle>🔮 Coming Soon</CardTitle>
                    <CardDescription>Features we're working on for future releases</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                        <div>• Group Challenges</div>
                        <div>• AI Meal Recommendations</div>
                        <div>• Advanced Meal Timing Analysis</div>
                        <div>• Recipe Collections</div>
                        <div>• Macro Optimization Tips</div>
                        <div>• Goal Forecasting</div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
