export type ThemeName = 'default' | 'ocean' | 'forest' | 'sunset';

export interface Theme {
    name: ThemeName;
    displayName: string;
    colors: {
        primary: string;
        primaryForeground: string;
        accent: string;
        accentForeground: string;
    };
}

export const themes: Record<ThemeName, Theme> = {
    default: {
        name: 'default',
        displayName: 'Default Purple',
        colors: {
            primary: '262.1 83.3% 57.8%',
            primaryForeground: '210 40% 98%',
            accent: '262.1 83.3% 57.8%',
            accentForeground: '210 40% 98%',
        },
    },
    ocean: {
        name: 'ocean',
        displayName: 'Ocean Blue',
        colors: {
            primary: '199 89% 48%',
            primaryForeground: '0 0% 100%',
            accent: '188 94% 42%',
            accentForeground: '0 0% 100%',
        },
    },
    forest: {
        name: 'forest',
        displayName: 'Forest Green',
        colors: {
            primary: '142 71% 45%',
            primaryForeground: '0 0% 100%',
            accent: '122 39% 49%',
            accentForeground: '0 0% 100%',
        },
    },
    sunset: {
        name: 'sunset',
        displayName: 'Sunset Orange',
        colors: {
            primary: '24 95% 53%',
            primaryForeground: '0 0% 100%',
            accent: '14 91% 54%',
            accentForeground: '0 0% 100%',
        },
    },
};

export const applyTheme = (themeName: ThemeName) => {
    const theme = themes[themeName];
    const root = document.documentElement;

    root.style.setProperty('--primary', theme.colors.primary);
    root.style.setProperty('--primary-foreground', theme.colors.primaryForeground);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-foreground', theme.colors.accentForeground);

    localStorage.setItem('app-theme', themeName);
};

export const getStoredTheme = (): ThemeName => {
    const stored = localStorage.getItem('app-theme');
    return (stored as ThemeName) || 'default';
};
