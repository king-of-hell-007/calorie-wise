import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Palette, Check } from 'lucide-react';
import { themes, applyTheme, getStoredTheme, type ThemeName } from '@/lib/themes';

export const ThemeSelector = () => {
    const [selectedTheme, setSelectedTheme] = useState<ThemeName>(getStoredTheme());

    useEffect(() => {
        applyTheme(selectedTheme);
    }, []);

    const handleThemeChange = (themeName: ThemeName) => {
        setSelectedTheme(themeName);
        applyTheme(themeName);
    };

    return (
        <Card className="shadow-strong">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5 text-primary" />
                    App Theme
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-3">
                    {Object.values(themes).map((theme) => (
                        <button
                            key={theme.name}
                            onClick={() => handleThemeChange(theme.name)}
                            className={`
                relative p-4 rounded-lg border-2 transition-all
                ${selectedTheme === theme.name
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                }
              `}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm">{theme.displayName}</span>
                                {selectedTheme === theme.name && (
                                    <Check className="w-4 h-4 text-primary" />
                                )}
                            </div>
                            <div className="flex gap-2">
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                                />
                                <div
                                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                                    style={{ backgroundColor: `hsl(${theme.colors.accent})` }}
                                />
                            </div>
                        </button>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    Unlocked at 7-day streak 🔥
                </p>
            </CardContent>
        </Card>
    );
};
