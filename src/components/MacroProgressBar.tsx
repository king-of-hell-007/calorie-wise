import { cn } from "@/lib/utils";

interface MacroProgressBarProps {
    current: number;
    target: number;
    label: string;
    color: string; // e.g., "primary", "orange-600", "blue-600"
    unit?: string;
}

export const MacroProgressBar = ({
    current,
    target,
    label,
    color,
    unit = "g"
}: MacroProgressBarProps) => {
    const percentage = (current / target) * 100;
    const overLimit = current > target;
    const overLimitBy = current - target;

    // Calculate the position of the vertical line when over limit
    const limitLinePosition = overLimit ? (target / current) * 100 : 100;

    const getColorClass = (type: 'bg' | 'text') => {
        const prefix = type === 'bg' ? 'bg-' : 'text-';
        return `${prefix}${color}`;
    };

    return (
        <div>
            <div className="flex justify-between text-sm mb-2">
                <span className={cn("font-medium", getColorClass('text'))}>{label}</span>
                <span className="font-bold">
                    {overLimit ? (
                        <span>
                            {target.toFixed(0)}/{current.toFixed(0)}{unit}
                        </span>
                    ) : (
                        <span>
                            {current.toFixed(0)}/{target.toFixed(0)}{unit}
                        </span>
                    )}
                </span>
            </div>
            <div className="h-3 bg-secondary rounded-full overflow-hidden relative">
                {/* Main progress bar - capped at 100% */}
                <div
                    className={cn("h-full transition-all duration-300", getColorClass('bg'))}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />

                {/* Vertical line at limit when exceeded */}
                {overLimit && (
                    <>
                        <div
                            className="absolute top-0 h-full w-0.5 bg-white shadow-md z-10"
                            style={{ left: `${limitLinePosition}%` }}
                        />
                        {/* Excess amount indicator - positioned to the right of the line */}
                        <div
                            className="absolute top-0 h-full flex items-center justify-end pr-1.5"
                            style={{
                                left: `${limitLinePosition}%`,
                                width: `${100 - limitLinePosition}%`
                            }}
                        >
                            <span className="text-[10px] font-bold text-white drop-shadow-md">
                                +{overLimitBy.toFixed(0)}
                            </span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
