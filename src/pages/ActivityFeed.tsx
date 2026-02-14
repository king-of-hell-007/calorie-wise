import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Heart, MessageCircle, Flame, Trophy, ChefHat, Award, Camera, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ActivityItem {
    id: string;
    user_id: string;
    activity_type: string;
    content: any;
    image_url: string | null;
    created_at: string;
    user_profile?: {
        user_name: string | null;
        full_name: string | null;
        avatar_url: string | null;
    };
    reaction_count?: number;
    comment_count?: number;
    user_reacted?: boolean;
}

interface Comment {
    id: string;
    user_id: string;
    comment_text: string;
    created_at: string;
    user_profile?: {
        user_name: string | null;
        full_name: string | null;
    };
}

export default function ActivityFeed() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activities, setActivities] = useState<ActivityItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
    const [comments, setComments] = useState<Record<string, Comment[]>>({});
    const [newComment, setNewComment] = useState('');

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
        loadActivityFeed(user.id);
    };

    const loadActivityFeed = async (userId: string) => {
        setLoading(true);
        try {
            // Get activity feed items (own + friends' public activities)
            const { data: feedData, error: feedError } = await (supabase as any)
                .from('activity_feed')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (feedError) throw feedError;

            if (!feedData || feedData.length === 0) {
                setActivities([]);
                setLoading(false);
                return;
            }

            // Get unique user IDs from feed
            const userIds = [...new Set(feedData.map((item: any) => item.user_id))] as string[];

            // Batch fetch profiles
            const { data: profiles } = await (supabase as any)
                .from('profiles')
                .select('id, user_name, full_name, avatar_url')
                .in('id', userIds);

            const profileMap: Record<string, any> = {};
            profiles?.forEach((p: any) => {
                profileMap[p.id] = p;
            });

            // Get reaction counts for all feed items
            const feedIds = feedData.map((item: any) => item.id);
            const { data: reactions } = await (supabase as any)
                .from('feed_reactions')
                .select('feed_id, user_id')
                .in('feed_id', feedIds);

            const reactionCounts: Record<string, number> = {};
            const userReactions: Record<string, boolean> = {};
            reactions?.forEach((r: any) => {
                reactionCounts[r.feed_id] = (reactionCounts[r.feed_id] || 0) + 1;
                if (r.user_id === userId) {
                    userReactions[r.feed_id] = true;
                }
            });

            // Get comment counts
            const { data: commentData } = await (supabase as any)
                .from('feed_comments')
                .select('feed_id')
                .in('feed_id', feedIds);

            const commentCounts: Record<string, number> = {};
            commentData?.forEach((c: any) => {
                commentCounts[c.feed_id] = (commentCounts[c.feed_id] || 0) + 1;
            });

            // Merge everything
            const enrichedActivities: ActivityItem[] = feedData.map((item: any) => ({
                ...item,
                user_profile: profileMap[item.user_id] || null,
                reaction_count: reactionCounts[item.id] || 0,
                comment_count: commentCounts[item.id] || 0,
                user_reacted: userReactions[item.id] || false
            }));

            setActivities(enrichedActivities);
        } catch (error) {
            console.error('Error loading activity feed:', error);
            toast({
                title: 'Error',
                description: 'Failed to load activity feed',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadComments = async (activityId: string) => {
        try {
            const { data: commentData, error } = await (supabase as any)
                .from('feed_comments')
                .select('*')
                .eq('feed_id', activityId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Fetch profiles for commenters
            const userIds = [...new Set((commentData || []).map((c: any) => c.user_id))] as string[];
            const { data: profiles } = await (supabase as any)
                .from('profiles')
                .select('id, user_name, full_name')
                .in('id', userIds);

            const profileMap: Record<string, any> = {};
            profiles?.forEach((p: any) => {
                profileMap[p.id] = p;
            });

            const enrichedComments = (commentData || []).map((c: any) => ({
                ...c,
                user_profile: profileMap[c.user_id] || null
            }));

            setComments(prev => ({
                ...prev,
                [activityId]: enrichedComments
            }));
        } catch (error) {
            console.error('Error loading comments:', error);
        }
    };

    const toggleReaction = async (activityId: string, currentlyReacted: boolean) => {
        try {
            if (currentlyReacted) {
                const { error } = await (supabase as any)
                    .from('feed_reactions')
                    .delete()
                    .eq('feed_id', activityId)
                    .eq('user_id', currentUserId);

                if (error) throw error;
            } else {
                const { error } = await (supabase as any)
                    .from('feed_reactions')
                    .insert({
                        feed_id: activityId,
                        user_id: currentUserId,
                        reaction_type: 'like'
                    });

                if (error) throw error;
            }

            loadActivityFeed(currentUserId);
        } catch (error) {
            console.error('Error toggling reaction:', error);
            toast({
                title: 'Error',
                description: 'Failed to update reaction',
                variant: 'destructive'
            });
        }
    };

    const addComment = async (activityId: string) => {
        if (!newComment.trim()) return;

        try {
            const { error } = await (supabase as any)
                .from('feed_comments')
                .insert({
                    feed_id: activityId,
                    user_id: currentUserId,
                    comment_text: newComment.trim()
                });

            if (error) throw error;

            setNewComment('');
            loadComments(activityId);
            loadActivityFeed(currentUserId);

            toast({
                title: 'Comment added',
                description: 'Your comment has been posted'
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            toast({
                title: 'Error',
                description: 'Failed to add comment',
                variant: 'destructive'
            });
        }
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'meal_logged':
                return <Camera className="w-5 h-5" />;
            case 'badge_earned':
                return <Award className="w-5 h-5" />;
            case 'challenge_completed':
                return <Trophy className="w-5 h-5" />;
            case 'streak_achieved':
                return <Flame className="w-5 h-5" />;
            case 'recipe_shared':
                return <ChefHat className="w-5 h-5" />;
            default:
                return <Trophy className="w-5 h-5" />;
        }
    };

    const getActivityTitle = (activity: ActivityItem) => {
        const displayName = activity.user_profile?.user_name || activity.user_profile?.full_name || 'Someone';

        switch (activity.activity_type) {
            case 'meal_logged':
                return `${displayName} logged a meal`;
            case 'badge_earned':
                return `${displayName} earned a badge`;
            case 'challenge_completed':
                return `${displayName} completed a challenge`;
            case 'challenge_joined':
                return `${displayName} joined a challenge`;
            case 'streak_achieved':
                return `${displayName} reached a streak milestone`;
            case 'recipe_shared':
                return `${displayName} shared a recipe`;
            case 'water_goal_met':
                return `${displayName} met their water goal`;
            case 'milestone':
                return `${displayName} achieved a milestone`;
            default:
                return `${displayName} posted an update`;
        }
    };

    const toggleComments = (activityId: string) => {
        if (selectedActivity === activityId) {
            setSelectedActivity(null);
        } else {
            setSelectedActivity(activityId);
            if (!comments[activityId]) {
                loadComments(activityId);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading activity feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-2xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">📰 Activity Feed</h1>
                <p className="text-muted-foreground">See what your friends are up to</p>
            </div>

            {activities.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Trophy className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold mb-2">No activity yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Add friends to see their activity or start logging meals!
                        </p>
                        <div className="flex gap-2">
                            <Button onClick={() => navigate('/friends')} variant="outline">
                                Find Friends
                            </Button>
                            <Button onClick={() => navigate('/analyze')}>
                                Log a Meal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {activities.map((activity) => (
                        <Card key={activity.id} className="overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <Avatar className="w-10 h-10">
                                        <AvatarFallback>
                                            {(activity.user_profile?.user_name || activity.user_profile?.full_name || 'U')[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {getActivityTitle(activity)}
                                            {activity.user_id === currentUserId && (
                                                <Badge variant="secondary" className="text-xs">You</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                                        </CardDescription>
                                    </div>
                                    <div className="text-primary">
                                        {getActivityIcon(activity.activity_type)}
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                {/* Activity Content */}
                                {activity.content?.description && (
                                    <p className="text-sm">{activity.content.description}</p>
                                )}

                                {activity.content?.details && (
                                    <div className="text-sm text-muted-foreground">
                                        {typeof activity.content.details === 'string'
                                            ? activity.content.details
                                            : JSON.stringify(activity.content.details)}
                                    </div>
                                )}

                                {/* Activity Image */}
                                {activity.image_url && (
                                    <img
                                        src={activity.image_url}
                                        alt="Activity"
                                        className="w-full rounded-lg max-h-96 object-cover"
                                    />
                                )}

                                {/* Reactions and Comments Bar */}
                                <div className="flex items-center gap-4 pt-2 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleReaction(activity.id, activity.user_reacted || false)}
                                        className={activity.user_reacted ? 'text-red-600' : ''}
                                    >
                                        <Heart className={`w-4 h-4 mr-1 ${activity.user_reacted ? 'fill-current' : ''}`} />
                                        {activity.reaction_count || 0}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleComments(activity.id)}
                                    >
                                        <MessageCircle className="w-4 h-4 mr-1" />
                                        {activity.comment_count || 0}
                                    </Button>
                                </div>

                                {/* Comments Section */}
                                {selectedActivity === activity.id && (
                                    <div className="space-y-3 pt-3 border-t">
                                        {/* Existing Comments */}
                                        {comments[activity.id]?.map((comment) => (
                                            <div key={comment.id} className="flex gap-2">
                                                <Avatar className="w-8 h-8">
                                                    <AvatarFallback className="text-xs">
                                                        {(comment.user_profile?.user_name || 'U')[0].toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 bg-muted rounded-lg p-2">
                                                    <p className="text-xs font-semibold">
                                                        {comment.user_profile?.user_name || comment.user_profile?.full_name || 'User'}
                                                    </p>
                                                    <p className="text-sm">{comment.comment_text}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Add Comment */}
                                        <div className="flex gap-2">
                                            <Textarea
                                                placeholder="Write a comment..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="min-h-[60px]"
                                            />
                                            <Button
                                                onClick={() => addComment(activity.id)}
                                                disabled={!newComment.trim()}
                                                size="icon"
                                            >
                                                <Send className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
