import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, ChefHat, Clock, Users } from 'lucide-react';

interface Recipe {
    id: string;
    name: string;
    description: string | null;
    servings: number;
    prep_time_minutes: number | null;
    cook_time_minutes: number | null;
    instructions: string | null;
    tags: string[] | null;
    created_at: string;
    ingredients?: RecipeIngredient[];
}

interface RecipeIngredient {
    id: string;
    ingredient_name: string;
    quantity: number;
    unit: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    display_order: number;
}

interface NewIngredient {
    ingredient_name: string;
    quantity: string;
    unit: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
}

export default function Recipes() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

    // Form state
    const [recipeName, setRecipeName] = useState('');
    const [description, setDescription] = useState('');
    const [servings, setServings] = useState('1');
    const [prepTime, setPrepTime] = useState('');
    const [cookTime, setCookTime] = useState('');
    const [instructions, setInstructions] = useState('');
    const [ingredients, setIngredients] = useState<NewIngredient[]>([
        { ingredient_name: '', quantity: '', unit: '', calories: '', protein: '', carbs: '', fat: '' }
    ]);

    useEffect(() => {
        checkAuth();
        loadRecipes();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        }
    };

    const loadRecipes = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: recipesData, error } = await supabase
                .from('recipes')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Load ingredients for each recipe
            const recipesWithIngredients = await Promise.all(
                (recipesData || []).map(async (recipe) => {
                    const { data: ingredientsData } = await supabase
                        .from('recipe_ingredients')
                        .select('*')
                        .eq('recipe_id', recipe.id)
                        .order('display_order', { ascending: true });

                    return {
                        ...recipe,
                        ingredients: ingredientsData || []
                    };
                })
            );

            setRecipes(recipesWithIngredients);
        } catch (error) {
            console.error('Error loading recipes:', error);
            toast({
                title: 'Error',
                description: 'Failed to load recipes',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const addIngredient = () => {
        setIngredients([
            ...ingredients,
            { ingredient_name: '', quantity: '', unit: '', calories: '', protein: '', carbs: '', fat: '' }
        ]);
    };

    const removeIngredient = (index: number) => {
        setIngredients(ingredients.filter((_, i) => i !== index));
    };

    const updateIngredient = (index: number, field: keyof NewIngredient, value: string) => {
        const updated = [...ingredients];
        updated[index][field] = value;
        setIngredients(updated);
    };

    const resetForm = () => {
        setRecipeName('');
        setDescription('');
        setServings('1');
        setPrepTime('');
        setCookTime('');
        setInstructions('');
        setIngredients([
            { ingredient_name: '', quantity: '', unit: '', calories: '', protein: '', carbs: '', fat: '' }
        ]);
    };

    const createRecipe = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            if (!recipeName.trim()) {
                toast({
                    title: 'Error',
                    description: 'Please enter a recipe name',
                    variant: 'destructive'
                });
                return;
            }

            // Create recipe
            const { data: recipeData, error: recipeError } = await supabase
                .from('recipes')
                .insert({
                    user_id: user.id,
                    name: recipeName,
                    description: description || null,
                    servings: parseInt(servings) || 1,
                    prep_time_minutes: prepTime ? parseInt(prepTime) : null,
                    cook_time_minutes: cookTime ? parseInt(cookTime) : null,
                    instructions: instructions || null
                })
                .select()
                .single();

            if (recipeError) throw recipeError;

            // Add ingredients
            const validIngredients = ingredients.filter(ing => ing.ingredient_name.trim());
            if (validIngredients.length > 0) {
                const ingredientsToInsert = validIngredients.map((ing, index) => ({
                    recipe_id: recipeData.id,
                    ingredient_name: ing.ingredient_name,
                    quantity: parseFloat(ing.quantity) || 0,
                    unit: ing.unit || '',
                    calories: parseInt(ing.calories) || 0,
                    protein: parseFloat(ing.protein) || 0,
                    carbs: parseFloat(ing.carbs) || 0,
                    fat: parseFloat(ing.fat) || 0,
                    display_order: index
                }));

                const { error: ingredientsError } = await supabase
                    .from('recipe_ingredients')
                    .insert(ingredientsToInsert);

                if (ingredientsError) throw ingredientsError;
            }

            toast({
                title: 'Recipe created!',
                description: 'Your recipe has been saved successfully'
            });

            resetForm();
            setCreateDialogOpen(false);
            loadRecipes();
        } catch (error) {
            console.error('Error creating recipe:', error);
            toast({
                title: 'Error',
                description: 'Failed to create recipe',
                variant: 'destructive'
            });
        }
    };

    const deleteRecipe = async (id: string) => {
        try {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Recipe deleted',
                description: 'Recipe has been removed'
            });

            loadRecipes();
        } catch (error) {
            console.error('Error deleting recipe:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete recipe',
                variant: 'destructive'
            });
        }
    };

    const calculateNutrition = (recipe: Recipe) => {
        if (!recipe.ingredients || recipe.ingredients.length === 0) {
            return { calories: 0, protein: 0, carbs: 0, fat: 0 };
        }

        const total = recipe.ingredients.reduce(
            (acc, ing) => ({
                calories: acc.calories + (ing.calories || 0),
                protein: acc.protein + (ing.protein || 0),
                carbs: acc.carbs + (ing.carbs || 0),
                fat: acc.fat + (ing.fat || 0)
            }),
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
        );

        // Per serving
        const servings = recipe.servings || 1;
        return {
            calories: Math.round(total.calories / servings),
            protein: Math.round(total.protein / servings),
            carbs: Math.round(total.carbs / servings),
            fat: Math.round(total.fat / servings)
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading recipes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">👨‍🍳 My Recipes</h1>
                <p className="text-muted-foreground">Create and manage your custom recipes</p>
            </div>

            {/* Create Button */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                    <Button className="w-full mb-6">
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Recipe
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Recipe</DialogTitle>
                        <DialogDescription>
                            Add your custom recipe with ingredients and instructions
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* Basic Info */}
                        <div>
                            <Label htmlFor="name">Recipe Name *</Label>
                            <Input
                                id="name"
                                value={recipeName}
                                onChange={(e) => setRecipeName(e.target.value)}
                                placeholder="e.g., Protein Pancakes"
                            />
                        </div>

                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of your recipe"
                                rows={2}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="servings">Servings</Label>
                                <Input
                                    id="servings"
                                    type="number"
                                    value={servings}
                                    onChange={(e) => setServings(e.target.value)}
                                    min="1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="prepTime">Prep (min)</Label>
                                <Input
                                    id="prepTime"
                                    type="number"
                                    value={prepTime}
                                    onChange={(e) => setPrepTime(e.target.value)}
                                    placeholder="15"
                                />
                            </div>
                            <div>
                                <Label htmlFor="cookTime">Cook (min)</Label>
                                <Input
                                    id="cookTime"
                                    type="number"
                                    value={cookTime}
                                    onChange={(e) => setCookTime(e.target.value)}
                                    placeholder="20"
                                />
                            </div>
                        </div>

                        {/* Ingredients */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <Label>Ingredients</Label>
                                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                                    <Plus className="w-3 h-3 mr-1" />
                                    Add
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {ingredients.map((ing, index) => (
                                    <div key={index} className="grid grid-cols-8 gap-2 items-end">
                                        <Input
                                            placeholder="Name"
                                            value={ing.ingredient_name}
                                            onChange={(e) => updateIngredient(index, 'ingredient_name', e.target.value)}
                                            className="col-span-2"
                                        />
                                        <Input
                                            placeholder="Qty"
                                            type="number"
                                            value={ing.quantity}
                                            onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Unit"
                                            value={ing.unit}
                                            onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                                        />
                                        <Input
                                            placeholder="Cal"
                                            type="number"
                                            value={ing.calories}
                                            onChange={(e) => updateIngredient(index, 'calories', e.target.value)}
                                        />
                                        <Input
                                            placeholder="P"
                                            type="number"
                                            value={ing.protein}
                                            onChange={(e) => updateIngredient(index, 'protein', e.target.value)}
                                        />
                                        <Input
                                            placeholder="C"
                                            type="number"
                                            value={ing.carbs}
                                            onChange={(e) => updateIngredient(index, 'carbs', e.target.value)}
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeIngredient(index)}
                                            disabled={ingredients.length === 1}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Instructions */}
                        <div>
                            <Label htmlFor="instructions">Instructions</Label>
                            <Textarea
                                id="instructions"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="Step-by-step cooking instructions"
                                rows={4}
                            />
                        </div>

                        <Button onClick={createRecipe} className="w-full">
                            Create Recipe
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Recipes List */}
            {recipes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ChefHat className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No recipes yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first recipe to track custom meals
                        </p>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Recipe
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {recipes.map((recipe) => {
                        const nutrition = calculateNutrition(recipe);
                        const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

                        return (
                            <Card key={recipe.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <CardTitle className="text-lg">{recipe.name}</CardTitle>
                                            <CardDescription>
                                                {recipe.description}
                                            </CardDescription>
                                            <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                                                {recipe.servings && (
                                                    <div className="flex items-center gap-1">
                                                        <Users className="w-4 h-4" />
                                                        {recipe.servings} servings
                                                    </div>
                                                )}
                                                {totalTime > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {totalTime} min
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => deleteRecipe(recipe.id)}
                                        >
                                            <Trash2 className="w-4 h-4 text-destructive" />
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Nutrition per serving */}
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="text-xl font-bold">{nutrition.calories}</div>
                                            <div className="text-xs text-muted-foreground">Cal/serving</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-blue-600">{nutrition.protein}g</div>
                                            <div className="text-xs text-muted-foreground">Protein</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-green-600">{nutrition.carbs}g</div>
                                            <div className="text-xs text-muted-foreground">Carbs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-amber-600">{nutrition.fat}g</div>
                                            <div className="text-xs text-muted-foreground">Fat</div>
                                        </div>
                                    </div>

                                    {/* Ingredients */}
                                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">Ingredients:</p>
                                            <div className="space-y-1">
                                                {recipe.ingredients.map((ing, idx) => (
                                                    <p key={idx} className="text-sm text-muted-foreground">
                                                        • {ing.quantity} {ing.unit} {ing.ingredient_name}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
