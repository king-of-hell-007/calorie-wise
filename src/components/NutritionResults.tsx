import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Zap, Beef, Wheat } from 'lucide-react';

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
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      icon: Beef,
    },
    {
      name: 'Carbs',
      value: data.carbs,
      unit: 'g',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      icon: Wheat,
    },
    {
      name: 'Fat',
      value: data.fat,
      unit: 'g',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      icon: Zap,
    },
  ];

  return (
    <div className="w-full max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>New Analysis</span>
        </Button>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Confidence</div>
          <div className="font-semibold text-primary">
            {Math.round(data.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Calories Card */}
      <Card className="p-6 text-center bg-gradient-primary text-white shadow-medium">
        <div className="space-y-2">
          <div className="text-sm font-medium opacity-90">Total Calories</div>
          <div className="text-4xl font-bold">{data.calories}</div>
          <div className="text-sm opacity-90">kcal</div>
        </div>
      </Card>

      {/* Macronutrients */}
      <div className="grid grid-cols-3 gap-4">
        {macros.map((macro) => {
          const Icon = macro.icon;
          return (
            <Card key={macro.name} className={`p-4 text-center ${macro.bgColor} border-0`}>
              <div className="space-y-3">
                <Icon className={`w-6 h-6 mx-auto ${macro.color}`} />
                <div>
                  <div className="text-2xl font-bold text-foreground">
                    {macro.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
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
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold text-foreground">Detected Foods</h3>
          <div className="flex flex-wrap gap-2">
            {data.foods.map((food, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
              >
                {food}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground text-center leading-relaxed">
        Nutritional values are estimates based on visual analysis. 
        For precise dietary planning, consult a nutritionist.
      </p>
    </div>
  );
};