import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Search, Star, Heart, ChefHat, Clock, Users, Bookmark, BookmarkCheck } from 'lucide-react';

interface Recipe {
    id: string;
    user_id: string;
    name: string;
    description: string;
    ingredients: any[];
    instructions: string;
    servings: number;
    prep_time_minutes: number;
    cook_time_minutes: number;
    nutrition_per_serving: any;
    is_public: boolean;
    created_at: string;
    user_profile?: {
        username: string | null;
        full_name: string | null;
    };
    avg_rating?: number;
    review_count?: number;
    is_favorited?: boolean;
}

export default function RecipeGallery() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRating, setFilterRating] = useState<number | null>(null);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());

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
        loadRecipes(user.id);
        loadFavorites(user.id);
    };

    const loadRecipes = async (userId: string) => {
        setLoading(true);
        try {
            // Get the user's own recipes AND public recipes from others
            const { data, error } = await (supabase as any)
                .from('recipes')
                .select('*')
                .or(`user_id.eq.${userId},is_public.eq.true`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;

            // Get user profiles and ratings for each recipe
            const recipesWithDetails = await Promise.all(
                (data || []).map(async (recipe) => {
                    // Get profile info
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('user_name, full_name')
                        .eq('id', recipe.user_id)
                        .single();

                    // Get ratings
                    let avgRating = 0;
                    let reviewCount = 0;
                    try {
                        const { data: reviews } = await supabase
                            .from('recipe_reviews')
                            .select('rating')
                            .eq('recipe_id', recipe.id);

                        if (reviews && reviews.length > 0) {
                            avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                            reviewCount = reviews.length;
                        }
                    } catch {
                        // recipe_reviews table may not exist yet, continue gracefully
                    }

                    // Calculate nutrition from ingredients if not stored
                    let nutritionPerServing = recipe.nutrition_per_serving;
                    if (!nutritionPerServing) {
                        try {
                            const { data: ingredients } = await supabase
                                .from('recipe_ingredients')
                                .select('calories, protein, carbs, fat')
                                .eq('recipe_id', recipe.id);

                            if (ingredients && ingredients.length > 0) {
                                const totals = ingredients.reduce((acc, ing) => ({
                                    calories: acc.calories + (ing.calories || 0),
                                    protein: acc.protein + (Number(ing.protein) || 0),
                                    carbs: acc.carbs + (Number(ing.carbs) || 0),
                                    fat: acc.fat + (Number(ing.fat) || 0),
                                }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                                const servings = recipe.servings || 1;
                                nutritionPerServing = {
                                    calories: totals.calories / servings,
                                    protein: totals.protein / servings,
                                    carbs: totals.carbs / servings,
                                    fat: totals.fat / servings,
                                };
                            }
                        } catch {
                            // Continue without nutrition data
                        }
                    }

                    return {
                        ...recipe,
                        nutrition_per_serving: nutritionPerServing,
                        user_profile: {
                            username: profileData?.user_name || null,
                            full_name: profileData?.full_name || null,
                        },
                        avg_rating: avgRating,
                        review_count: reviewCount,
                        is_own: recipe.user_id === userId,
                    };
                })
            );

            setRecipes(recipesWithDetails);
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

    const loadFavorites = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('recipe_favorites')
                .select('recipe_id')
                .eq('user_id', userId);

            if (error) throw error;

            setFavorites(new Set(data?.map(f => f.recipe_id) || []));
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    };

    const toggleFavorite = async (recipeId: string) => {
        const isFavorited = favorites.has(recipeId);

        try {
            if (isFavorited) {
                // Remove favorite
                const { error } = await supabase
                    .from('recipe_favorites')
                    .delete()
                    .eq('recipe_id', recipeId)
                    .eq('user_id', currentUserId);

                if (error) throw error;

                setFavorites(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(recipeId);
                    return newSet;
                });

                toast({
                    title: 'Removed from favorites',
                    description: 'Recipe removed from your favorites'
                });
            } else {
                // Add favorite
                const { error } = await supabase
                    .from('recipe_favorites')
                    .insert({
                        recipe_id: recipeId,
                        user_id: currentUserId
                    });

                if (error) throw error;

                setFavorites(prev => new Set([...prev, recipeId]));

                toast({
                    title: 'Added to favorites',
                    description: 'Recipe saved to your favorites'
                });
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            toast({
                title: 'Error',
                description: 'Failed to update favorite',
                variant: 'destructive'
            });
        }
    };

    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRating = filterRating === null || (recipe.avg_rating || 0) >= filterRating;
        return matchesSearch && matchesRating;
    });

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
        <div className="container mx-auto p-4 pb-20 max-w-7xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🍳 Recipe Gallery</h1>
                <p className="text-muted-foreground">Discover and save delicious healthy recipes</p>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search recipes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={() => navigate('/recipes')} variant="outline">
                        <ChefHat className="w-4 h-4 mr-2" />
                        My Recipes
                    </Button>
                </div>

                {/* Rating Filter */}
                <div className="flex gap-2">
                    <Button
                        variant={filterRating === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilterRating(null)}
                    >
                        All
                    </Button>
                    {[4, 3, 2].map(rating => (
                        <Button
                            key={rating}
                            variant={filterRating === rating ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterRating(rating)}
                        >
                            {rating}+ <Star className="w-3 h-3 ml-1 fill-current" />
                        </Button>
                    ))}
                </div>
            </div>

            {/* Recipe Grid */}
            {filteredRecipes.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <ChefHat className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No recipes found</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            {searchQuery ? 'Try a different search term' : 'Be the first to share a recipe!'}
                        </p>
                        <Button onClick={() => navigate('/recipes')}>
                            Create a Recipe
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredRecipes.map((recipe) => (
                        <Card key={recipe.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg line-clamp-1">{recipe.name}</CardTitle>
                                        <CardDescription className="flex items-center gap-2 mt-1">
                                            <Avatar className="w-5 h-5">
                                                <AvatarFallback className="text-xs">
                                                    {(recipe.user_profile?.username || 'U')[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs">
                                                {recipe.user_profile?.username || recipe.user_profile?.full_name || 'Anonymous'}
                                            </span>
                                        </CardDescription>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => toggleFavorite(recipe.id)}
                                    >
                                        {favorites.has(recipe.id) ? (
                                            <BookmarkCheck className="w-5 h-5 text-primary fill-current" />
                                        ) : (
                                            <Bookmark className="w-5 h-5" />
                                        )}
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {recipe.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {recipe.description}
                                    </p>
                                )}

                                {/* Recipe Stats */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)}m</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="w-4 h-4" />
                                        <span>{recipe.servings} servings</span>
                                    </div>
                                    {recipe.avg_rating && recipe.avg_rating > 0 && (
                                        <div className="flex items-center gap-1">
                                            <Star className="w-4 h-4 fill-current text-yellow-500" />
                                            <span>{recipe.avg_rating.toFixed(1)}</span>
                                            <span className="text-xs">({recipe.review_count})</span>
                                        </div>
                                    )}
                                </div>

                                {/* Nutrition Info */}
                                {recipe.nutrition_per_serving && (
                                    <div className="flex gap-2 flex-wrap">
                                        <Badge variant="secondary" className="text-xs">
                                            {Math.round(recipe.nutrition_per_serving.calories || 0)} cal
                                        </Badge>
                                        <Badge variant="outline" className="text-xs">
                                            {Math.round(recipe.nutrition_per_serving.protein || 0)}g protein
                                        </Badge>
                                    </div>
                                )}

                                <Button
                                    onClick={() => navigate(`/recipes/${recipe.id}`)}
                                    className="w-full"
                                    variant="outline"
                                >
                                    View Recipe
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
