import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Beef, Wheat, Sparkles } from 'lucide-react';

interface NutritionData {
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  confidence: number;
  foods: string[];
}

interface NutritionResultsProps {
  data: NutritionData;
  onReset: () => void;
}

export const NutritionResults = ({ data, onReset }: NutritionResultsProps) => {
  const macros = [
    {
      name: 'Protein',
      value: data.protein,
      unit: 'g',
      gradient: 'from-blue-500 to-cyan-500',
      icon: Beef,
    },
    {
      name: 'Carbs',
      value: data.carbs,
      unit: 'g',
      gradient: 'from-orange-500 to-red-500',
      icon: Wheat,
    },
    {
      name: 'Fat',
      value: data.fat,
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
          <div className="text-sm font-medium text-muted-foreground">Analysis Confidence</div>
          <div className="text-2xl font-bold text-primary">
            {Math.round(data.confidence * 100)}%
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
          <div className="text-6xl font-black">{data.calories}</div>
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

      {/* Detected Foods */}
      {data.foods.length > 0 && (
        <Card className="p-6 space-y-4 border-primary/10 bg-gradient-card">
          <h3 className="text-xl font-bold text-foreground flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span>Detected Foods</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {data.foods.map((food, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-base font-medium hover:bg-primary/20 transition-colors"
              >
                {food}
              </span>
            ))}
          </div>
        </Card>
      )}

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