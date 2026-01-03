import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface StreakMilestone {
    days: number;
    feature: string;
    icon: string;
    description: string;
}

const MILESTONES: StreakMilestone[] = [
    {
        days: 7,
        feature: 'Custom Themes',
        icon: '🎨',
        description: 'You can now customize your app theme!',
    },
    {
        days: 30,
        feature: 'Streak Calendar',
        icon: '📅',
        description: 'View your 30-day streak history!',
    },
    {
        days: 60,
        feature: 'Nutrition Insights & CSV Export',
        icon: '📊',
        description: 'Unlock weekly insights and data export!',
    },
    {
        days: 100,
        feature: '1 Month Free Pro Access',
        icon: '🏆',
        description: 'Welcome to the Century Club! Enjoy 1 month of Pro features!',
    },
    {
        days: 180,
        feature: '2 Months Free Pro Access',
        icon: '⭐',
        description: 'Half-year hero! Enjoy 2 months of Pro features!',
    },
    {
        days: 365,
        feature: '6 Months Free Pro Access',
        icon: '👑',
        description: 'Year Warrior! Enjoy 6 months of Pro features!',
    },
];

export const useStreakNotifications = (currentStreak: number) => {
    const { toast } = useToast();
    const previousStreak = useRef(currentStreak);

    useEffect(() => {
        // Only show notification if streak increased
        if (currentStreak > previousStreak.current) {
            // Check if we just hit a milestone
            const milestone = MILESTONES.find(m => m.days === currentStreak);

            if (milestone) {
                toast({
                    title: `${milestone.icon} Feature Unlocked!`,
                    description: milestone.description,
                    duration: 6000,
                });
            }
        }

        // Update previous streak
        previousStreak.current = currentStreak;
    }, [currentStreak, toast]);
};
