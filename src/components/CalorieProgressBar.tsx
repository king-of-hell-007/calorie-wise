import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

interface CalorieProgressBarProps {
  calories: number;
  targetCalories: number;
  showColorCoding?: boolean; // For dashboard only
}

export const CalorieProgressBar = ({
  calories,
  targetCalories,
  showColorCoding = false
}: CalorieProgressBarProps) => {
  const percentage = (calories / targetCalories) * 100;
  const overLimit = calories > targetCalories;
  const overLimitBy = calories - targetCalories;

  const getBarColor = () => {
    if (!showColorCoding) {
      // Default behavior for Progress page
      if (calories > targetCalories + 1000) return "bg-red-500";
      if (calories > targetCalories + 200) return "bg-orange-500";
      return "bg-gradient-primary";
    }

    // Enhanced color coding for Dashboard (Today's Calories)
    if (overLimitBy > 1000) return "bg-red-500"; // Harmful range
    if (overLimitBy > 500) return "bg-orange-500"; // Warning range
    if (overLimitBy > 100) return "bg-green-500"; // Still safe
    return "bg-green-500"; // Normal/safe
  };

  // Calculate the position of the vertical line when over limit
  const limitLinePosition = overLimit ? (targetCalories / calories) * 100 : 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm items-center">
        <span className="font-bold">{calories} kcal</span>
        <span className="text-xs text-muted-foreground font-medium">
          {overLimit ? (
            <span className={cn(
              "font-bold",
              showColorCoding && overLimitBy > 1000 ? "text-red-600" :
                showColorCoding && overLimitBy > 500 ? "text-orange-600" :
                  "text-muted-foreground"
            )}>
              {targetCalories}/{calories}
            </span>
          ) : (
            `${calories}/${targetCalories}`
          )}
        </span>
      </div>
      <div className="h-8 bg-secondary rounded-lg overflow-hidden relative">
        {/* Main progress bar */}
        <div
          className={cn("h-full transition-all duration-300", getBarColor())}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />

        {/* Vertical line at limit when exceeded */}
        {overLimit && (
          <>
            <div
              className="absolute top-0 h-full w-0.5 bg-white/80 shadow-md z-10"
              style={{ left: `${limitLinePosition}%` }}
            />
            {/* Excess amount indicator */}
            <div
              className="absolute top-0 h-full flex items-center justify-end pr-2"
              style={{
                left: `${limitLinePosition}%`,
                width: `${100 - limitLinePosition}%`
              }}
            >
              <span className="text-xs font-bold text-white drop-shadow-md">
                +{overLimitBy.toFixed(0)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Warning message for dashboard when harmful */}
      {showColorCoding && overLimitBy > 1000 && (
        <div className="flex items-center gap-1 text-red-600 text-xs mt-1">
          <AlertTriangle className="h-3 w-3" />
          <span>Exceeding daily limit significantly may be harmful</span>
        </div>
      )}
    </div>
  );
};