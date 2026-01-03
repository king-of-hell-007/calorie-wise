import { format } from 'date-fns';

interface MealEntry {
    created_at: string;
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
    food_items: any[];
}

export const exportToCSV = (meals: MealEntry[], filename: string = 'caloriewise-data.csv') => {
    // CSV headers
    const headers = [
        'Date',
        'Time',
        'Total Calories',
        'Protein (g)',
        'Carbs (g)',
        'Fat (g)',
        'Food Items'
    ];

    // Convert meals to CSV rows
    const rows = meals.map(meal => {
        const date = new Date(meal.created_at);
        const foodItems = Array.isArray(meal.food_items)
            ? meal.food_items.map(item => item.name).join('; ')
            : '';

        return [
            format(date, 'yyyy-MM-dd'),
            format(date, 'HH:mm:ss'),
            meal.total_calories || 0,
            meal.total_protein || 0,
            meal.total_carbs || 0,
            meal.total_fat || 0,
            foodItems
        ];
    });

    // Combine headers and rows
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
