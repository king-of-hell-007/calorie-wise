import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Plus, Trash2, ShoppingCart, ChefHat, BookOpen } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

interface MealPlanItem {
    id: string;
    day_of_week: number;
    meal_slot: string;
    recipe_id?: string;
    template_id?: string;
    custom_meal?: any;
    notes?: string;
    recipe?: {
        name: string;
        servings: number;
    };
    template?: {
        name: string;
    };
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
    const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
    const [mealPlanItems, setMealPlanItems] = useState<MealPlanItem[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [recipes, setRecipes] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<{ day: number; slot: string } | null>(null);

    useEffect(() => {
        checkAuth();
    }, []);

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
            // Get or create current week's meal plan
            const weekStart = startOfWeek(new Date());

            let { data: plan, error: planError } = await supabase
                .from('meal_plans')
                .select('*')
                .eq('user_id', userId)
                .eq('week_start_date', format(weekStart, 'yyyy-MM-dd'))
                .single();

            if (planError && planError.code !== 'PGRST116') throw planError;

            if (!plan) {
                // Create new plan for this week
                const { data: newPlan, error: createError } = await supabase
                    .from('meal_plans')
                    .insert({
                        user_id: userId,
                        week_start_date: format(weekStart, 'yyyy-MM-dd'),
                        name: `Week of ${format(weekStart, 'MMM d, yyyy')}`
                    })
                    .select()
                    .single();

                if (createError) throw createError;
                plan = newPlan;
            }

            setCurrentPlanId(plan.id);

            // Load meal plan items
            const { data: items, error: itemsError } = await supabase
                .from('meal_plan_items')
                .select(`
          *,
          recipe:recipes(name, servings),
          template:meal_templates(name)
        `)
                .eq('meal_plan_id', plan.id);

            if (itemsError) throw itemsError;

            setMealPlanItems(items || []);
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
            const { data, error } = await supabase
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
            const { data, error } = await supabase
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
        if (!selectedSlot || !currentPlanId) return;

        try {
            const { error } = await supabase
                .from('meal_plan_items')
                .insert({
                    meal_plan_id: currentPlanId,
                    day_of_week: selectedSlot.day,
                    meal_slot: selectedSlot.slot,
                    recipe_id: recipeId
                });

            if (error) throw error;

            toast({
                title: 'Recipe added',
                description: 'Recipe added to meal plan'
            });

            setSelectedSlot(null);
            loadMealPlan(currentUserId);
        } catch (error) {
            console.error('Error adding recipe:', error);
            toast({
                title: 'Error',
                description: 'Failed to add recipe',
                variant: 'destructive'
            });
        }
    };

    const addTemplateToSlot = async (templateId: string) => {
        if (!selectedSlot || !currentPlanId) return;

        try {
            const { error } = await supabase
                .from('meal_plan_items')
                .insert({
                    meal_plan_id: currentPlanId,
                    day_of_week: selectedSlot.day,
                    meal_slot: selectedSlot.slot,
                    template_id: templateId
                });

            if (error) throw error;

            toast({
                title: 'Template added',
                description: 'Meal template added to plan'
            });

            setSelectedSlot(null);
            loadMealPlan(currentUserId);
        } catch (error) {
            console.error('Error adding template:', error);
            toast({
                title: 'Error',
                description: 'Failed to add template',
                variant: 'destructive'
            });
        }
    };

    const removeMealItem = async (itemId: string) => {
        try {
            const { error } = await supabase
                .from('meal_plan_items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;

            toast({
                title: 'Removed',
                description: 'Meal removed from plan'
            });

            loadMealPlan(currentUserId);
        } catch (error) {
            console.error('Error removing item:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove meal',
                variant: 'destructive'
            });
        }
    };

    const generateShoppingList = () => {
        // Simple shopping list generation from recipes
        const items: ShoppingListItem[] = [];

        mealPlanItems.forEach(item => {
            if (item.recipe) {
                items.push({
                    ingredient: `Ingredients for ${item.recipe.name}`,
                    quantity: `${item.recipe.servings} servings`,
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

    const getMealForSlot = (day: number, slot: string) => {
        return mealPlanItems.find(
            item => item.day_of_week === day && item.meal_slot === slot
        );
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
                <Button onClick={generateShoppingList} variant="outline">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Generate Shopping List
                </Button>
            </div>

            {/* Weekly Calendar */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-6">
                {DAYS.map((day, dayIndex) => {
                    const date = addDays(startOfWeek(new Date()), dayIndex);
                    return (
                        <Card key={day} className="overflow-hidden">
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
                                                        onClick={() => removeMealItem(meal.id)}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            {meal ? (
                                                <div className="text-xs">
                                                    {meal.recipe?.name || meal.template?.name || 'Custom meal'}
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

            {/* Add Meal Dialog */}
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
