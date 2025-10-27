import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface CalorieProgressBarProps {
  calories: number;
  targetCalories: number;
}

export const CalorieProgressBar = ({ calories, targetCalories }: CalorieProgressBarProps) => {
  const percentage = (calories / targetCalories) * 100;
  const overLimit = calories > targetCalories;
  const overLimitBy = calories - targetCalories;

  const getBarColor = () => {
    if (calories > targetCalories + 1000) return "bg-red-500";
    if (calories > targetCalories + 200) return "bg-orange-500";
    return "bg-gradient-primary";
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="font-bold">{calories} kcal</span>
        {overLimit && (
          <div className="flex items-center gap-1 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">Over limit by +{overLimitBy.toFixed(0)} kcal</span>
          </div>
        )}
      </div>
      <div className="h-8 bg-secondary rounded-lg overflow-hidden relative">
        <div
          className={cn("h-full transition-all duration-300", getBarColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {overLimit && (
          <div
            className="absolute top-0 h-full border-l-2 border-destructive"
            style={{ left: `${(targetCalories / calories) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
};