import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MobileNav } from '@/components/MobileNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, User, Target, Activity, Dumbbell, Save, Loader2 } from 'lucide-react';

type Profile = {
    weight_kg: number;
    height_cm: number;
    age: number;
    sex: string;
    goal: string;
    baseline_activity: string;
    exercise_frequency: string;
    target_calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    bmi: number;
    bmr: number;
    tdee: number;
    is_admin?: boolean;
};

export default function Settings() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        weight_kg: 0,
        height_cm: 0,
        age: 0,
        sex: '',
        goal: '',
        baseline_activity: '',
        exercise_frequency: '',
    });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/auth');
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            // Check if user is admin
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .eq('role', 'admin')
                .maybeSingle();

            setIsAdmin(!!roleData);

            if (data) {
                setProfile(data);
                setFormData({
                    weight_kg: data.weight_kg,
                    height_cm: data.height_cm,
                    age: data.age,
                    sex: data.sex,
                    goal: data.goal,
                    baseline_activity: data.baseline_activity,
                    exercise_frequency: data.exercise_frequency,
                });
            }
        } catch (error: any) {
            console.error('Error loading profile:', error);
            toast({
                title: 'Error loading profile',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const calculateMetrics = (weight: number, height: number, age: number, sex: string, activity: string, goal: string) => {
        // BMI
        const heightM = height / 100;
        const bmi = weight / (heightM * heightM);

        // BMR (Mifflin-St Jeor)
        let bmr;
        if (sex === 'male') {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        } else {
            bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        }

        // TDEE
        const activityMultipliers: { [key: string]: number } = {
            sedentary: 1.2,
            mild: 1.375,
            moderate: 1.55,
            heavy: 1.725,
            very_heavy: 1.9
        };
        const tdee = Math.round(bmr * (activityMultipliers[activity] || 1.2));

        // Target calories based on goal
        let targetCalories = tdee;
        if (goal === 'lose_weight') targetCalories = tdee - 500;
        else if (goal === 'gain_weight') targetCalories = tdee + 500;

        // Macros
        const proteinG = Math.round(weight * 2.2);
        const fatG = Math.round((targetCalories * 0.25) / 9);
        const carbsG = Math.round((targetCalories - (proteinG * 4) - (fatG * 9)) / 4);

        return {
            bmi: Number(bmi.toFixed(2)),
            bmr: Math.round(bmr),
            tdee,
            target_calories: targetCalories,
            protein_g: proteinG,
            carbs_g: carbsG,
            fat_g: fatG
        };
    };

    const handleSave = async () => {
        if (!profile) return;

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const metrics = calculateMetrics(
                formData.weight_kg,
                formData.height_cm,
                formData.age,
                formData.sex,
                formData.baseline_activity,
                formData.goal
            );

            const { error } = await supabase
                .from('profiles')
                .update({
                    ...formData,
                    ...metrics
                })
                .eq('id', user.id);

            if (error) throw error;

            toast({
                title: 'Settings saved!',
                description: 'Your profile has been updated and targets recalculated.',
            });

            // Reload profile to show updated values
            loadProfile();
        } catch (error: any) {
            toast({
                title: 'Error saving settings',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const getBMICategory = (bmi: number) => {
        if (bmi < 18.5) return { text: 'Underweight', color: 'text-blue-600' };
        if (bmi < 25) return { text: 'Normal', color: 'text-green-600' };
        if (bmi < 30) return { text: 'Overweight', color: 'text-orange-600' };
        return { text: 'Obese', color: 'text-red-600' };
    };

    const getGoalText = (goal: string) => {
        const goals: { [key: string]: string } = {
            lose_weight: 'Lose Weight',
            gain_weight: 'Gain Weight',
            maintain: 'Maintain Weight',
            recomposition: 'Body Recomposition'
        };
        return goals[goal] || goal;
    };

    const getActivityText = (activity: string) => {
        const activities: { [key: string]: string } = {
            sedentary: 'Sedentary (Little to no exercise)',
            mild: 'Mild (Exercise 1-2 days/week)',
            moderate: 'Moderate (Exercise 3-5 days/week)',
            heavy: 'Heavy (Exercise 6-7 days/week)',
            very_heavy: 'Very Heavy (Athlete/Physical job)'
        };
        return activities[activity] || activity;
    };

    const getExerciseText = (frequency: string) => {
        const frequencies: { [key: string]: string } = {
            never: 'Never',
            rarely: 'Rarely (1-2 times/month)',
            regularly: 'Regularly (1-2 times/week)',
            daily: 'Daily'
        };
        return frequencies[frequency] || frequency;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24">
                <div className="animate-pulse text-primary text-xl">Loading...</div>
                <MobileNav />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gradient-hero flex items-center justify-center pb-24">
                <div className="text-center">
                    <p className="text-muted-foreground">Profile not found</p>
                    <Button onClick={() => navigate('/onboarding')} className="mt-4">
                        Complete Onboarding
                    </Button>
                </div>
                <MobileNav />
            </div>
        );
    }

    const bmiCategory = getBMICategory(profile.bmi);

    return (
        <div className="min-h-screen bg-gradient-hero pb-24">
            <div className="container max-w-2xl mx-auto p-4 space-y-6">
                {/* Header */}
                <Card className="shadow-strong border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <SettingsIcon className="w-6 h-6 text-primary" />
                            Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Update your profile information to recalculate your nutrition targets.
                        </p>
                    </CardContent>
                </Card>

                {/* Current Metrics */}
                <Card className="shadow-strong">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Current Targets
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">Daily Calories</p>
                                <p className="text-2xl font-bold text-primary">{profile.target_calories}</p>
                                <p className="text-xs text-muted-foreground">kcal</p>
                            </div>
                            <div className="p-3 bg-muted/50 rounded-lg">
                                <p className="text-xs text-muted-foreground mb-1">BMI</p>
                                <p className={`text-2xl font-bold ${bmiCategory.color}`}>{profile.bmi}</p>
                                <p className={`text-xs ${bmiCategory.color}`}>{bmiCategory.text}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground">Protein</p>
                                <p className="text-lg font-bold text-blue-600">{profile.protein_g}g</p>
                            </div>
                            <div className="p-2 bg-orange-50 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground">Carbs</p>
                                <p className="text-lg font-bold text-orange-600">{profile.carbs_g}g</p>
                            </div>
                            <div className="p-2 bg-purple-50 rounded-lg text-center">
                                <p className="text-xs text-muted-foreground">Fat</p>
                                <p className="text-lg font-bold text-purple-600">{profile.fat_g}g</p>
                            </div>
                        </div>

                        <div className="pt-2 border-t space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">BMR (Base Metabolic Rate):</span>
                                <span className="font-medium">{profile.bmr} kcal</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">TDEE (Total Daily Energy):</span>
                                <span className="font-medium">{profile.tdee} kcal</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="shadow-strong">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5 text-primary" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    value={formData.weight_kg}
                                    onChange={(e) => setFormData({ ...formData, weight_kg: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    value={formData.height_cm}
                                    onChange={(e) => setFormData({ ...formData, height_cm: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="age">Age</Label>
                                <Input
                                    id="age"
                                    type="number"
                                    value={formData.age}
                                    onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sex">Sex</Label>
                                <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
                                    <SelectTrigger id="sex">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Goals & Activity */}
                <Card className="shadow-strong">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary" />
                            Goals & Lifestyle
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="goal">Fitness Goal</Label>
                            <Select value={formData.goal} onValueChange={(value) => setFormData({ ...formData, goal: value })}>
                                <SelectTrigger id="goal">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="lose_weight">Lose Weight</SelectItem>
                                    <SelectItem value="gain_weight">Gain Weight</SelectItem>
                                    <SelectItem value="maintain">Maintain Weight</SelectItem>
                                    <SelectItem value="recomposition">Body Recomposition</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Current: {getGoalText(profile.goal)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="activity">Activity Level</Label>
                            <Select value={formData.baseline_activity} onValueChange={(value) => setFormData({ ...formData, baseline_activity: value })}>
                                <SelectTrigger id="activity">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="sedentary">Sedentary (Little to no exercise)</SelectItem>
                                    <SelectItem value="mild">Mild (Exercise 1-2 days/week)</SelectItem>
                                    <SelectItem value="moderate">Moderate (Exercise 3-5 days/week)</SelectItem>
                                    <SelectItem value="heavy">Heavy (Exercise 6-7 days/week)</SelectItem>
                                    <SelectItem value="very_heavy">Very Heavy (Athlete/Physical job)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Current: {getActivityText(profile.baseline_activity)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="exercise">Exercise Frequency</Label>
                            <Select value={formData.exercise_frequency} onValueChange={(value) => setFormData({ ...formData, exercise_frequency: value })}>
                                <SelectTrigger id="exercise">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="never">Never</SelectItem>
                                    <SelectItem value="rarely">Rarely (1-2 times/month)</SelectItem>
                                    <SelectItem value="regularly">Regularly (1-2 times/week)</SelectItem>
                                    <SelectItem value="daily">Daily</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Current: {getExerciseText(profile.exercise_frequency)}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Card className="shadow-strong border-primary/20">
                    <CardContent className="p-4">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full"
                            size="lg"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-5 h-5 mr-2" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-3">
                            Your nutrition targets will be automatically recalculated based on your updated information.
                        </p>
                    </CardContent>
                </Card>

                {/* Admin Settings Button */}
                {isAdmin && (
                    <Card className="shadow-strong border-primary/20">
                        <CardContent className="p-4">
                            <Button
                                variant="outline"
                                className="w-full"
                                size="lg"
                                onClick={() => navigate('/admin')}
                            >
                                <SettingsIcon className="w-5 h-5 mr-2" />
                                Admin Settings (API Keys)
                            </Button>
                            <p className="text-xs text-muted-foreground text-center mt-3">
                                Manage Gemini API keys for meal scanning functionality.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Info Card */}
                <Card className="shadow-medium bg-blue-50/50 border-blue-200">
                    <CardContent className="p-4">
                        <p className="text-sm text-blue-900">
                            <strong>💡 Tip:</strong> Update your weight regularly to keep your targets accurate. Changes in your goal or activity level will immediately adjust your daily calorie and macro targets.
                        </p>
                    </CardContent>
                </Card>
            </div>

            <MobileNav />
        </div>
    );
}
