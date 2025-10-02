import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type OnboardingData = {
  age: number;
  sex: 'male' | 'female' | 'prefer_not_to_say';
  height_cm: number;
  weight_kg: number;
  baseline_activity: 'sedentary' | 'mild' | 'moderate' | 'heavy' | 'very_heavy';
  exercise_frequency: 'never' | 'rarely' | 'regularly' | 'daily';
  exercise_duration: 'short' | 'medium' | 'long' | 'very_long';
  goal: 'lose_weight' | 'gain_weight' | 'maintain' | 'recomposition' | 'custom';
  goal_custom_text?: string;
  dietary_preferences?: string;
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const [bmi, setBmi] = useState<number | null>(null);
  const [suggestedGoal, setSuggestedGoal] = useState<string>('');

  const totalSteps = 7;

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  const calculateBMI = (weight: number, height: number) => {
    const heightM = height / 100;
    return weight / (heightM * heightM);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', suggestion: 'gain_weight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', suggestion: 'maintain', color: 'text-primary' };
    if (bmi < 30) return { category: 'Overweight', suggestion: 'lose_weight', color: 'text-orange-600' };
    return { category: 'Obese', suggestion: 'lose_weight', color: 'text-destructive' };
  };

  const handleNext = () => {
    if (step === 4 && data.weight_kg && data.height_cm) {
      const calculatedBMI = calculateBMI(data.weight_kg, data.height_cm);
      setBmi(calculatedBMI);
      const { suggestion } = getBMICategory(calculatedBMI);
      setSuggestedGoal(suggestion);
      setData(prev => ({ ...prev, goal: suggestion as any }));
    }
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Calculate BMR, TDEE, and macros
      const heightM = data.height_cm! / 100;
      const calculatedBMI = calculateBMI(data.weight_kg!, data.height_cm!);
      
      let bmr = 0;
      if (data.sex === 'male') {
        bmr = 10 * data.weight_kg! + 6.25 * data.height_cm! - 5 * data.age! + 5;
      } else if (data.sex === 'female') {
        bmr = 10 * data.weight_kg! + 6.25 * data.height_cm! - 5 * data.age! - 161;
      } else {
        bmr = 10 * data.weight_kg! + 6.25 * data.height_cm! - 5 * data.age! - 78;
      }

      const activityFactors = {
        sedentary: 1.2,
        mild: 1.375,
        moderate: 1.55,
        heavy: 1.725,
        very_heavy: 1.9
      };
      
      const tdee = Math.round(bmr * activityFactors[data.baseline_activity!]);
      
      let targetCalories = tdee;
      if (data.goal === 'lose_weight') targetCalories = tdee - 300;
      if (data.goal === 'gain_weight') targetCalories = tdee + 300;
      
      // Ensure minimum safe calories
      const minCalories = data.sex === 'male' ? 1500 : 1200;
      targetCalories = Math.max(targetCalories, minCalories);

      // Calculate macros
      const proteinPerKg = data.goal === 'lose_weight' || data.goal === 'recomposition' ? 2.0 : 1.8;
      const proteinG = Math.round(proteinPerKg * data.weight_kg!);
      const fatCalories = targetCalories * 0.25;
      const fatG = Math.round(fatCalories / 9);
      const carbCalories = targetCalories - (proteinG * 4 + fatG * 9);
      const carbG = Math.round(carbCalories / 4);

      const profileData = {
        id: user.id,
        email: user.email,
        age: data.age,
        sex: data.sex,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        bmi: calculatedBMI,
        bmr: Math.round(bmr),
        tdee,
        target_calories: targetCalories,
        protein_g: proteinG,
        carbs_g: carbG,
        fat_g: fatG,
        baseline_activity: data.baseline_activity,
        exercise_frequency: data.exercise_frequency,
        exercise_duration: data.exercise_duration,
        goal: data.goal,
        goal_custom_text: data.goal_custom_text,
        dietary_preferences: data.dietary_preferences,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData as any, { onConflict: 'id' });

      if (error) throw error;

      toast({
        title: 'Profile Created!',
        description: 'Your personalized nutrition plan is ready.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero pb-20 px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Step {step} of {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round((step / totalSteps) * 100)}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-primary transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle className="text-2xl">
              {step === 1 && 'Welcome to CalorieWise!'}
              {step === 2 && 'Tell us about yourself'}
              {step === 3 && 'Your measurements'}
              {step === 4 && 'More measurements'}
              {step === 5 && 'Your goal'}
              {step === 6 && 'Activity level'}
              {step === 7 && 'Dietary preferences'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Let's set up your personalized nutrition plan. This will take about 2 minutes.
                </p>
                <p className="text-sm text-muted-foreground">
                  We'll calculate your BMI, BMR, and daily calorie targets based on proven formulas.
                </p>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={data.age || ''}
                    onChange={(e) => setData({ ...data, age: parseInt(e.target.value) })}
                    placeholder="Enter your age"
                  />
                </div>
                <div>
                  <Label>Sex assigned at birth</Label>
                  <RadioGroup value={data.sex} onValueChange={(v) => setData({ ...data, sex: v as any })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="cursor-pointer">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="cursor-pointer">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="prefer_not_to_say" id="prefer_not_to_say" />
                      <Label htmlFor="prefer_not_to_say" className="cursor-pointer">Prefer not to say</Label>
                    </div>
                  </RadioGroup>
                  {data.sex === 'prefer_not_to_say' && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Results may be slightly less accurate with this option.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    value={data.height_cm || ''}
                    onChange={(e) => setData({ ...data, height_cm: parseInt(e.target.value) })}
                    placeholder="Enter your height in cm"
                  />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="weight">Current Weight (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={data.weight_kg || ''}
                    onChange={(e) => setData({ ...data, weight_kg: parseFloat(e.target.value) })}
                    placeholder="Enter your weight in kg"
                  />
                </div>
              </div>
            )}

            {step === 5 && bmi && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-card rounded-lg border-2 border-primary/20">
                  <p className="text-sm text-muted-foreground mb-2">Your BMI</p>
                  <p className={`text-3xl font-bold ${getBMICategory(bmi).color}`}>
                    {bmi.toFixed(1)}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getBMICategory(bmi).category}
                  </p>
                </div>
                <div>
                  <Label>What would you like to do?</Label>
                  <RadioGroup value={data.goal} onValueChange={(v) => setData({ ...data, goal: v as any })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lose_weight" id="lose_weight" />
                      <Label htmlFor="lose_weight" className="cursor-pointer">
                        Lose weight (steady) {suggestedGoal === 'lose_weight' && '⭐ Recommended'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="gain_weight" id="gain_weight" />
                      <Label htmlFor="gain_weight" className="cursor-pointer">
                        Gain weight / bulk {suggestedGoal === 'gain_weight' && '⭐ Recommended'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="maintain" id="maintain" />
                      <Label htmlFor="maintain" className="cursor-pointer">
                        Maintain weight {suggestedGoal === 'maintain' && '⭐ Recommended'}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recomposition" id="recomposition" />
                      <Label htmlFor="recomposition" className="cursor-pointer">Recomposition (lose fat, gain muscle)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="cursor-pointer">Custom</Label>
                    </div>
                  </RadioGroup>
                  {data.goal === 'custom' && (
                    <Textarea
                      value={data.goal_custom_text || ''}
                      onChange={(e) => setData({ ...data, goal_custom_text: e.target.value })}
                      placeholder="Describe your custom goal..."
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <Label>Baseline lifestyle</Label>
                  <RadioGroup value={data.baseline_activity} onValueChange={(v) => setData({ ...data, baseline_activity: v as any })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sedentary" id="sedentary" />
                      <Label htmlFor="sedentary" className="cursor-pointer">Sedentary (no regular exercise)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mild" id="mild" />
                      <Label htmlFor="mild" className="cursor-pointer">Mild exercise (light walking, occasional workouts)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="moderate" id="moderate" />
                      <Label htmlFor="moderate" className="cursor-pointer">Moderate exercise (regular workouts)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="heavy" id="heavy" />
                      <Label htmlFor="heavy" className="cursor-pointer">Heavy exercise (intense workouts)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Exercise frequency</Label>
                  <RadioGroup value={data.exercise_frequency} onValueChange={(v) => setData({ ...data, exercise_frequency: v as any })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="never" />
                      <Label htmlFor="never" className="cursor-pointer">Never</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rarely" id="rarely" />
                      <Label htmlFor="rarely" className="cursor-pointer">Rarely (1-2× / week)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="regularly" id="regularly" />
                      <Label htmlFor="regularly" className="cursor-pointer">Regularly (3-4× / week)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="daily" id="daily" />
                      <Label htmlFor="daily" className="cursor-pointer">Daily (5-7× / week)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label>Typical session duration</Label>
                  <RadioGroup value={data.exercise_duration} onValueChange={(v) => setData({ ...data, exercise_duration: v as any })}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="short" id="short" />
                      <Label htmlFor="short" className="cursor-pointer">15-30 min</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="cursor-pointer">30-60 min</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="long" id="long" />
                      <Label htmlFor="long" className="cursor-pointer">60-120 min</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="very_long" id="very_long" />
                      <Label htmlFor="very_long" className="cursor-pointer">2+ hours</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dietary_preferences">Dietary preferences / restrictions (optional)</Label>
                  <Textarea
                    id="dietary_preferences"
                    value={data.dietary_preferences || ''}
                    onChange={(e) => setData({ ...data, dietary_preferences: e.target.value })}
                    placeholder="e.g., Vegetarian, vegan, pescatarian, halal, allergies, dislikes..."
                    rows={4}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  This information helps us provide better meal suggestions tailored to your needs.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              )}
              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-cta"
                  disabled={
                    (step === 2 && (!data.age || !data.sex)) ||
                    (step === 3 && !data.height_cm) ||
                    (step === 4 && !data.weight_kg) ||
                    (step === 5 && !data.goal) ||
                    (step === 6 && (!data.baseline_activity || !data.exercise_frequency || !data.exercise_duration))
                  }
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-gradient-cta"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating Profile...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
