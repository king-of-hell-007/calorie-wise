import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

interface DateRange {
    start: Date;
    end: Date;
}

interface DateRangePickerProps {
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
}

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);

    const presets = [
        {
            label: 'Last 7 Days',
            getValue: () => ({
                start: subDays(new Date(), 7),
                end: new Date()
            })
        },
        {
            label: 'Last 30 Days',
            getValue: () => ({
                start: subDays(new Date(), 30),
                end: new Date()
            })
        },
        {
            label: 'This Week',
            getValue: () => ({
                start: startOfWeek(new Date()),
                end: endOfWeek(new Date())
            })
        },
        {
            label: 'This Month',
            getValue: () => ({
                start: startOfMonth(new Date()),
                end: endOfMonth(new Date())
            })
        },
        {
            label: 'Last Month',
            getValue: () => {
                const lastMonth = subDays(startOfMonth(new Date()), 1);
                return {
                    start: startOfMonth(lastMonth),
                    end: endOfMonth(lastMonth)
                };
            }
        }
    ];

    const handlePresetClick = (preset: typeof presets[0]) => {
        const range = preset.getValue();
        onDateRangeChange(range);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-full md:w-auto">
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {format(dateRange.start, 'MMM d, yyyy')} - {format(dateRange.end, 'MMM d, yyyy')}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                    {/* Presets */}
                    <div className="border-r p-3 space-y-1">
                        <div className="text-sm font-semibold mb-2">Quick Select</div>
                        {presets.map((preset) => (
                            <Button
                                key={preset.label}
                                variant="ghost"
                                className="w-full justify-start text-sm"
                                onClick={() => handlePresetClick(preset)}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>

                    {/* Calendar */}
                    <div className="p-3">
                        <div className="text-sm font-semibold mb-2">Custom Range</div>
                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">Start Date</div>
                                <Calendar
                                    mode="single"
                                    selected={dateRange.start}
                                    onSelect={(date) => date && onDateRangeChange({ ...dateRange, start: date })}
                                    disabled={(date) => date > new Date() || date > dateRange.end}
                                />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground mb-1">End Date</div>
                                <Calendar
                                    mode="single"
                                    selected={dateRange.end}
                                    onSelect={(date) => date && onDateRangeChange({ ...dateRange, end: date })}
                                    disabled={(date) => date > new Date() || date < dateRange.start}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
