import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2, ShoppingCart, ChefHat, BookOpen } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

interface MealPlanEntry {
    id: string;
    plan_date: string;
    meal_slot: string;
    recipe_id?: string;
    meal_template_id?: string;
    notes?: string;
    recipe_name?: string;
    recipe_servings?: number;
    template_name?: string;
}

interface ShoppingListItem {
    ingredient: string;
    quantity: string;
    checked: boolean;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

export default function MealPlanner() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [mealPlanEntries, setMealPlanEntries] = useState<MealPlanEntry[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<{ day: number; slot: string } | null>(null);
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date()));
    const [addingMeal, setAddingMeal] = useState(false);

    useEffect(() => {
        checkAuth();
    }, []);

    useEffect(() => {
        if (currentUserId) {
            loadMealPlan(currentUserId);
        }
    }, [weekStart]);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
            return;
        }
        setCurrentUserId(user.id);
        loadMealPlan(user.id);
        loadRecipes(user.id);
        loadTemplates(user.id);
    };

    const loadMealPlan = async (userId: string) => {
        setLoading(true);
        try {
            const weekEnd = addDays(weekStart, 6);
            const startStr = format(weekStart, 'yyyy-MM-dd');
            const endStr = format(weekEnd, 'yyyy-MM-dd');

            // Query meal_plan_entries (the scheduling table, NOT meal_plans which is nutrition targets)
            const { data, error } = await (supabase as any)
                .from('meal_plan_entries')
                .select('*')
                .eq('user_id', userId)
                .gte('plan_date', startStr)
                .lte('plan_date', endStr);

            if (error) throw error;

            if (!data || data.length === 0) {
                setMealPlanEntries([]);
                setLoading(false);
                return;
            }

            // Collect unique recipe and template IDs for batch fetching
            const recipeIds = data.filter((r: any) => r.recipe_id).map((r: any) => r.recipe_id);
            const templateIds = data.filter((r: any) => r.meal_template_id).map((r: any) => r.meal_template_id);

            // Batch fetch recipe names
            let recipeMap: Record<string, any> = {};
            if (recipeIds.length > 0) {
                const { data: recipesData } = await (supabase as any)
                    .from('recipes')
                    .select('id, name, servings')
                    .in('id', recipeIds);
                recipesData?.forEach((r: any) => {
                    recipeMap[r.id] = r;
                });
            }

            // Batch fetch template names
            let templateMap: Record<string, any> = {};
            if (templateIds.length > 0) {
                const { data: templatesData } = await (supabase as any)
                    .from('meal_templates')
                    .select('id, name')
                    .in('id', templateIds);
                templatesData?.forEach((t: any) => {
                    templateMap[t.id] = t;
                });
            }

            // Enrich entries
            const entries: MealPlanEntry[] = data.map((row: any) => ({
                id: row.id,
                plan_date: row.plan_date,
                meal_slot: row.meal_slot,
                recipe_id: row.recipe_id,
                meal_template_id: row.meal_template_id,
                notes: row.notes,
                recipe_name: row.recipe_id ? recipeMap[row.recipe_id]?.name : undefined,
                recipe_servings: row.recipe_id ? recipeMap[row.recipe_id]?.servings : undefined,
                template_name: row.meal_template_id ? templateMap[row.meal_template_id]?.name : undefined,
            }));

            setMealPlanEntries(entries);
        } catch (error) {
            console.error('Error loading meal plan:', error);
            toast({
                title: 'Error',
                description: 'Failed to load meal plan',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadRecipes = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('recipes')
                .select('id, name, servings')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setRecipes(data || []);
        } catch (error) {
            console.error('Error loading recipes:', error);
        }
    };

    const loadTemplates = async (userId: string) => {
        try {
            const { data, error } = await (supabase as any)
                .from('meal_templates')
                .select('id, name, meal_slot')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const addRecipeToSlot = async (recipeId: string) => {
        if (!selectedSlot || addingMeal) return;
        setAddingMeal(true);

        try {
            const planDate = format(addDays(weekStart, selectedSlot.day), 'yyyy-MM-dd');

            // Check if an entry already exists for this slot
            const { data: existing } = await (supabase as any)
                .from('meal_plan_entries')
                .select('id')
                .eq('user_id', currentUserId)
                .eq('plan_date', planDate)
                .eq('meal_slot', selectedSlot.slot)
                .maybeSingle();

            if (existing) {
                // Update existing entry
                const { error } = await (supabase as any)
                    .from('meal_plan_entries')
                    .update({
                        recipe_id: recipeId,
                        meal_template_id: null
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Insert new entry
                const { error } = await (supabase as any)
                    .from('meal_plan_entries')
                    .insert({
                        user_id: currentUserId,
                        plan_date: planDate,
                        meal_slot: selectedSlot.slot,
                        recipe_id: recipeId,
                        meal_template_id: null
                    });

                if (error) throw error;
            }

            toast({
                title: 'Recipe added',
                description: 'Recipe added to meal plan'
            });

            setSelectedSlot(null);
            await loadMealPlan(currentUserId);
        } catch (error) {
            console.error('Error adding recipe:', error);
            toast({
                title: 'Error',
                description: 'Failed to add recipe to meal plan',
                variant: 'destructive'
            });
        } finally {
            setAddingMeal(false);
        }
    };

    const addTemplateToSlot = async (templateId: string) => {
        if (!selectedSlot || addingMeal) return;
        setAddingMeal(true);

        try {
            const planDate = format(addDays(weekStart, selectedSlot.day), 'yyyy-MM-dd');

            // Check if an entry already exists for this slot
            const { data: existing } = await (supabase as any)
                .from('meal_plan_entries')
                .select('id')
                .eq('user_id', currentUserId)
                .eq('plan_date', planDate)
                .eq('meal_slot', selectedSlot.slot)
                .maybeSingle();

            if (existing) {
                // Update existing entry
                const { error } = await (supabase as any)
                    .from('meal_plan_entries')
                    .update({
                        recipe_id: null,
                        meal_template_id: templateId
                    })
                    .eq('id', existing.id);

                if (error) throw error;
            } else {
                // Insert new entry
                const { error } = await (supabase as any)
                    .from('meal_plan_entries')
                    .insert({
                        user_id: currentUserId,
                        plan_date: planDate,
                        meal_slot: selectedSlot.slot,
                        recipe_id: null,
                        meal_template_id: templateId
                    });

                if (error) throw error;
            }

            toast({
                title: 'Template added',
                description: 'Meal template added to plan'
            });

            setSelectedSlot(null);
            await loadMealPlan(currentUserId);
        } catch (error) {
            console.error('Error adding template:', error);
            toast({
                title: 'Error',
                description: 'Failed to add template to meal plan',
                variant: 'destructive'
            });
        } finally {
            setAddingMeal(false);
        }
    };

    const removeMealEntry = async (entryId: string) => {
        try {
            const { error } = await (supabase as any)
                .from('meal_plan_entries')
                .delete()
                .eq('id', entryId);

            if (error) throw error;

            toast({
                title: 'Removed',
                description: 'Meal removed from plan'
            });

            await loadMealPlan(currentUserId);
        } catch (error) {
            console.error('Error removing meal:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove meal',
                variant: 'destructive'
            });
        }
    };

    const generateShoppingList = () => {
        const items: ShoppingListItem[] = [];

        mealPlanEntries.forEach(entry => {
            if (entry.recipe_name) {
                items.push({
                    ingredient: `Ingredients for ${entry.recipe_name}`,
                    quantity: `${entry.recipe_servings || 1} servings`,
                    checked: false
                });
            } else if (entry.template_name) {
                items.push({
                    ingredient: `Ingredients for ${entry.template_name}`,
                    quantity: '1 serving',
                    checked: false
                });
            }
        });

        setShoppingList(items);

        toast({
            title: 'Shopping list generated',
            description: `${items.length} items added to shopping list`
        });
    };

    const getMealForSlot = (dayIndex: number, slot: string): MealPlanEntry | undefined => {
        const targetDate = format(addDays(weekStart, dayIndex), 'yyyy-MM-dd');
        return mealPlanEntries.find(
            entry => entry.plan_date === targetDate && entry.meal_slot === slot
        );
    };

    const navigateWeek = (direction: number) => {
        setWeekStart(prev => addDays(prev, direction * 7));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading meal planner...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-6xl">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">📅 Meal Planner</h1>
                    <p className="text-muted-foreground">Plan your weekly meals</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => navigateWeek(-1)} variant="outline" size="sm">
                        ← Prev Week
                    </Button>
                    <Button onClick={() => setWeekStart(startOfWeek(new Date()))} variant="outline" size="sm">
                        Today
                    </Button>
                    <Button onClick={() => navigateWeek(1)} variant="outline" size="sm">
                        Next Week →
                    </Button>
                    <Button onClick={generateShoppingList} variant="outline" size="sm">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Shopping List
                    </Button>
                </div>
            </div>

            {/* Weekly Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
                {DAYS.map((day, dayIndex) => {
                    const date = addDays(weekStart, dayIndex);
                    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    return (
                        <Card key={day} className={`overflow-hidden ${isToday ? 'border-primary border-2' : ''}`}>
                            <CardHeader className="pb-3 bg-muted/50">
                                <CardTitle className="text-sm">{day}</CardTitle>
                                <CardDescription className="text-xs">
                                    {format(date, 'MMM d')}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-2 space-y-2">
                                {MEAL_SLOTS.map(slot => {
                                    const meal = getMealForSlot(dayIndex, slot);
                                    return (
                                        <div key={slot} className="min-h-[60px] border rounded-lg p-2">
                                            <div className="flex items-center justify-between mb-1">
                                                <Badge variant="outline" className="text-xs capitalize">
                                                    {slot}
                                                </Badge>
                                                {meal && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => removeMealEntry(meal.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            {meal ? (
                                                <div className="text-xs font-medium">
                                                    {meal.recipe_name || meal.template_name || 'Custom meal'}
                                                </div>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full h-8 text-xs"
                                                    onClick={() => setSelectedSlot({ day: dayIndex, slot })}
                                                >
                                                    <Plus className="w-3 h-3 mr-1" />
                                                    Add
                                                </Button>
                                            )}
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Add Meal Panel */}
            {selectedSlot && (
                <Card className="mb-6 border-primary">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span>Add to {DAYS[selectedSlot.day]} - {selectedSlot.slot}</span>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedSlot(null)}>
                                Cancel
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Recipes */}
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <ChefHat className="w-4 h-4" />
                                Your Recipes
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {recipes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground col-span-full">
                                        No recipes yet. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/recipes')}>Create one</Button>
                                    </p>
                                ) : (
                                    recipes.map(recipe => (
                                        <Button
                                            key={recipe.id}
                                            variant="outline"
                                            className="h-auto py-2 text-left justify-start"
                                            onClick={() => addRecipeToSlot(recipe.id)}
                                            disabled={addingMeal}
                                        >
                                            <div className="truncate text-xs">{recipe.name}</div>
                                        </Button>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Templates */}
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" />
                                Meal Templates
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {templates.length === 0 ? (
                                    <p className="text-sm text-muted-foreground col-span-full">
                                        No templates yet. <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/templates')}>Create one</Button>
                                    </p>
                                ) : (
                                    templates.map(template => (
                                        <Button
                                            key={template.id}
                                            variant="outline"
                                            className="h-auto py-2 text-left justify-start"
                                            onClick={() => addTemplateToSlot(template.id)}
                                            disabled={addingMeal}
                                        >
                                            <div className="truncate text-xs">{template.name}</div>
                                        </Button>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Shopping List */}
            {shoppingList.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5" />
                            Shopping List
                        </CardTitle>
                        <CardDescription>Items needed for this week</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {shoppingList.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                    <input
                                        type="checkbox"
                                        checked={item.checked}
                                        onChange={() => {
                                            const newList = [...shoppingList];
                                            newList[index].checked = !newList[index].checked;
                                            setShoppingList(newList);
                                        }}
                                        className="w-4 h-4"
                                    />
                                    <div className={`flex-1 ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                                        <div className="font-medium text-sm">{item.ingredient}</div>
                                        <div className="text-xs text-muted-foreground">{item.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
