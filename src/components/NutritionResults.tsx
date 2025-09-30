import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Zap, Beef, Wheat, Sparkles, Apple, Scale } from 'lucide-react';

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface NutritionData {
  status: string;
  food: FoodItem[];
  total: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  suggestions?: Array<{ reason: string; replacement: string }>;
  flags?: string[];
}

interface NutritionResultsProps {
  data: NutritionData;
  onReset: () => void;
}

export const NutritionResults = ({ data, onReset }: NutritionResultsProps) => {
  const { food, total, status } = data;
  const { protein, carbs, fat, calories } = total;

  const macros = [
    {
      name: 'Protein',
      value: protein,
      unit: 'g',
      gradient: 'from-blue-500 to-cyan-500',
      icon: Beef,
    },
    {
      name: 'Carbs',
      value: carbs,
      unit: 'g',
      gradient: 'from-orange-500 to-red-500',
      icon: Wheat,
    },
    {
      name: 'Fat',
      value: fat,
      unit: 'g',
      gradient: 'from-purple-500 to-pink-500',
      icon: Zap,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="flex items-center space-x-3 font-semibold px-6 py-3 hover:bg-primary hover:text-primary-foreground transition-smooth"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>New Analysis</span>
        </Button>
        <div className="text-right">
          <div className="text-sm font-medium text-muted-foreground">Status</div>
          <div className="text-lg font-bold text-primary capitalize">
            {status}
          </div>
        </div>
      </div>

      {/* Success Banner */}
      <Card className="p-6 text-center bg-gradient-cta text-white shadow-strong border-0">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <h2 className="text-2xl font-bold">Analysis Complete!</h2>
        </div>
        <p className="text-white/90 text-lg">Here's your detailed nutrition breakdown</p>
      </Card>

      {/* Calories Card */}
      <Card className="p-8 text-center bg-gradient-primary text-white shadow-strong border-0">
        <div className="space-y-3">
          <div className="text-lg font-semibold opacity-90">Total Calories</div>
          <div className="text-6xl font-black">{calories}</div>
          <div className="text-lg opacity-90 font-medium">kcal</div>
        </div>
      </Card>

      {/* Macronutrients */}
      <div className="grid grid-cols-3 gap-6">
        {macros.map((macro) => {
          const Icon = macro.icon;
          return (
            <Card key={macro.name} className="group p-6 text-center border-2 border-transparent hover:border-primary/20 transition-all duration-300 hover:shadow-medium hover:-translate-y-1">
              <div className="space-y-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${macro.gradient} rounded-2xl flex items-center justify-center mx-auto shadow-medium group-hover:shadow-strong transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">
                    {macro.value}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {macro.unit} {macro.name}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Individual Food Items */}
      <Card className="bg-gradient-card border-primary/20 border-2">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Apple className="w-6 h-6 text-primary" />
            Food Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {food.map((item, index) => (
              <div key={index} className="p-4 bg-white/50 rounded-xl border border-primary/10 hover:shadow-medium transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-foreground text-lg">{item.name}</h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Scale className="w-3 h-3" />
                    <span>{item.quantity}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-lg text-primary">{item.calories}</div>
                    <div className="text-muted-foreground">cal</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-blue-600">{item.protein}g</div>
                    <div className="text-muted-foreground">protein</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-orange-600">{item.carbs}g</div>
                    <div className="text-muted-foreground">carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-lg text-yellow-600">{item.fat}g</div>
                    <div className="text-muted-foreground">fat</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* CTA to try again */}
      <div className="text-center pt-4">
        <Button
          onClick={onReset}
          variant="outline"
          size="lg"
          className="font-semibold text-lg px-8 py-4 h-auto rounded-xl border-2 hover:bg-primary hover:text-primary-foreground transition-smooth"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Analyze Another Meal
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-sm text-muted-foreground text-center leading-relaxed bg-muted/50 rounded-xl p-4">
        💡 <strong>Note:</strong> Nutritional values are AI-powered estimates based on visual analysis. 
        For precise dietary planning, please consult a qualified nutritionist.
      </p>
    </div>
  );
};