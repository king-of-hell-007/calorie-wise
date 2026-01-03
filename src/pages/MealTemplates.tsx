import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit, Coffee, Utensils, Moon, Cookie, Check } from 'lucide-react';

interface MealTemplate {
    id: string;
    name: string;
    description: string | null;
    meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    nutrition_data: {
        total: {
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        };
        food: Array<{
            name: string;
            quantity: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
        }>;
    };
    image_url: string | null;
    use_count: number;
    created_at: string;
}

const mealSlotIcons = {
    breakfast: Coffee,
    lunch: Utensils,
    dinner: Moon,
    snack: Cookie
};

export default function MealTemplates() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [templates, setTemplates] = useState<MealTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSlot, setSelectedSlot] = useState<string>('all');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<MealTemplate | null>(null);

    useEffect(() => {
        checkAuth();
        loadTemplates();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            navigate('/auth');
        }
    };

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('meal_templates')
                .select('*')
                .eq('user_id', user.id)
                .order('use_count', { ascending: false });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error loading templates:', error);
            toast({
                title: 'Error',
                description: 'Failed to load meal templates',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const createFromRecentMeal = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get most recent meal
            const { data: recentMeal } = await supabase
                .from('meal_entries')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            if (!recentMeal) {
                toast({
                    title: 'No recent meals',
                    description: 'Log a meal first to create a template',
                    variant: 'destructive'
                });
                return;
            }

            // Create template from recent meal
            const { error } = await supabase
                .from('meal_templates')
                .insert({
                    user_id: user.id,
                    name: `Template from ${new Date(recentMeal.created_at).toLocaleDateString()}`,
                    meal_slot: recentMeal.meal_slot,
                    nutrition_data: {
                        total: {
                            calories: recentMeal.total_calories,
                            protein: recentMeal.total_protein,
                            carbs: recentMeal.total_carbs,
                            fat: recentMeal.total_fat
                        },
                        food: recentMeal.analyzer_json?.food || []
                    },
                    image_url: recentMeal.image_url
                });

            if (error) throw error;

            toast({
                title: 'Template created!',
                description: 'Your recent meal has been saved as a template'
            });

            loadTemplates();
            setCreateDialogOpen(false);
        } catch (error) {
            console.error('Error creating template:', error);
            toast({
                title: 'Error',
                description: 'Failed to create template',
                variant: 'destructive'
            });
        }
    };

    const quickLogTemplate = async (template: MealTemplate) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Insert meal entry
            const { error: mealError } = await supabase
                .from('meal_entries')
                .insert({
                    user_id: user.id,
                    meal_slot: template.meal_slot,
                    image_url: template.image_url,
                    analyzer_json: template.nutrition_data,
                    total_calories: template.nutrition_data.total.calories,
                    total_protein: template.nutrition_data.total.protein,
                    total_carbs: template.nutrition_data.total.carbs,
                    total_fat: template.nutrition_data.total.fat
                });

            if (mealError) throw mealError;

            // Award points
            await supabase.from('points_history').insert({
                user_id: user.id,
                points: 10,
                reason: 'Logged a meal from template'
            });

            // Update template use count
            await supabase
                .from('meal_templates')
                .update({ use_count: template.use_count + 1 })
                .eq('id', template.id);

            toast({
                title: 'Meal logged!',
                description: '+10 points earned'
            });

            loadTemplates();
        } catch (error) {
            console.error('Error logging meal:', error);
            toast({
                title: 'Error',
                description: 'Failed to log meal',
                variant: 'destructive'
            });
        }
    };

    const deleteTemplate = async (id: string) => {
        try {
            const { error } = await supabase
                .from('meal_templates')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast({
                title: 'Template deleted',
                description: 'Meal template has been removed'
            });

            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete template',
                variant: 'destructive'
            });
        }
    };

    const filteredTemplates = selectedSlot === 'all'
        ? templates
        : templates.filter(t => t.meal_slot === selectedSlot);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🍽️ Meal Templates</h1>
                <p className="text-muted-foreground">Save your favorite meals for quick logging</p>
            </div>

            {/* Filter and Create */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Select value={selectedSlot} onValueChange={setSelectedSlot}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filter by meal" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Meals</SelectItem>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snacks</SelectItem>
                    </SelectContent>
                </Select>

                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="w-full sm:w-auto">
                            <Plus className="w-4 h-4 mr-2" />
                            Create Template
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Meal Template</DialogTitle>
                            <DialogDescription>
                                Save your most recent meal as a template for quick logging
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                This will create a template from your most recently logged meal.
                            </p>
                            <Button onClick={createFromRecentMeal} className="w-full">
                                Create from Recent Meal
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Templates Grid */}
            {filteredTemplates.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Cookie className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first meal template to save time logging meals
                        </p>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Template
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredTemplates.map((template) => {
                        const Icon = mealSlotIcons[template.meal_slot];
                        return (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{template.name}</CardTitle>
                                                <CardDescription>
                                                    {template.meal_slot.charAt(0).toUpperCase() + template.meal_slot.slice(1)}
                                                    {template.use_count > 0 && ` • Used ${template.use_count} times`}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => deleteTemplate(template.id)}
                                            >
                                                <Trash2 className="w-4 h-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {/* Nutrition Summary */}
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold">{template.nutrition_data.total.calories}</div>
                                            <div className="text-xs text-muted-foreground">Calories</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">{template.nutrition_data.total.protein}g</div>
                                            <div className="text-xs text-muted-foreground">Protein</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">{template.nutrition_data.total.carbs}g</div>
                                            <div className="text-xs text-muted-foreground">Carbs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-amber-600">{template.nutrition_data.total.fat}g</div>
                                            <div className="text-xs text-muted-foreground">Fat</div>
                                        </div>
                                    </div>

                                    {/* Food Items */}
                                    {template.nutrition_data.food && template.nutrition_data.food.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-medium mb-2">Items:</p>
                                            <div className="space-y-1">
                                                {template.nutrition_data.food.slice(0, 3).map((food, idx) => (
                                                    <p key={idx} className="text-sm text-muted-foreground">
                                                        • {food.name} ({food.quantity})
                                                    </p>
                                                ))}
                                                {template.nutrition_data.food.length > 3 && (
                                                    <p className="text-sm text-muted-foreground">
                                                        + {template.nutrition_data.food.length - 3} more items
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Log Button */}
                                    <Button
                                        onClick={() => quickLogTemplate(template)}
                                        className="w-full"
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Quick Log This Meal
                                    </Button>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
