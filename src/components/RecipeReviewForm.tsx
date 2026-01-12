import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RecipeReviewFormProps {
    recipeId: string;
    userId: string;
    existingReview?: {
        rating: number;
        review_text: string;
    };
    onReviewSubmitted: () => void;
}

export function RecipeReviewForm({ recipeId, userId, existingReview, onReviewSubmitted }: RecipeReviewFormProps) {
    const { toast } = useToast();
    const [rating, setRating] = useState(existingReview?.rating || 0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewText, setReviewText] = useState(existingReview?.review_text || '');
    const [submitting, setSubmitting] = useState(false);

    const submitReview = async () => {
        if (rating === 0) {
            toast({
                title: 'Rating required',
                description: 'Please select a star rating',
                variant: 'destructive'
            });
            return;
        }

        setSubmitting(true);
        try {
            const { error } = await supabase
                .from('recipe_reviews')
                .upsert({
                    recipe_id: recipeId,
                    user_id: userId,
                    rating,
                    review_text: reviewText || null
                });

            if (error) throw error;

            toast({
                title: 'Review submitted',
                description: 'Thank you for your feedback!'
            });

            onReviewSubmitted();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast({
                title: 'Error',
                description: 'Failed to submit review',
                variant: 'destructive'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 p-4 border rounded-lg">
            <div>
                <Label>Your Rating</Label>
                <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="focus:outline-none"
                        >
                            <Star
                                className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                            />
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <Label htmlFor="review-text">Your Review (Optional)</Label>
                <Textarea
                    id="review-text"
                    placeholder="Share your thoughts about this recipe..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    className="mt-2"
                />
            </div>

            <Button onClick={submitReview} disabled={submitting} className="w-full">
                {submitting ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
            </Button>
        </div>
    );
}
