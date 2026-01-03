import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { UserPlus, Users, Check, X, Flame, Trophy, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
    friend_profile?: {
        id: string;
        username: string | null;
        full_name: string | null;
        current_streak_days: number;
        total_points: number;
        avatar_url: string | null;
    };
}

interface FriendRequest {
    id: string;
    user_id: string;
    friend_id: string;
    status: string;
    created_at: string;
    requester_profile?: {
        id: string;
        username: string | null;
        full_name: string | null;
        current_streak_days: number;
        total_points: number;
    };
}

export default function Friends() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<Friend[]>([]);
    const [searchEmail, setSearchEmail] = useState('');
    const [searching, setSearching] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string>('');

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
        loadFriends(user.id);
        loadPendingRequests(user.id);
        loadSentRequests(user.id);
    };

    const loadFriends = async (userId: string) => {
        setLoading(true);
        try {
            // Get accepted friendships
            const { data, error } = await supabase
                .from('friendships')
                .select(`
          *,
          friend_profile:profiles!friendships_friend_id_fkey(
            id,
            username,
            full_name,
            current_streak_days,
            total_points,
            avatar_url
          )
        `)
                .eq('user_id', userId)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setFriends(data || []);
        } catch (error) {
            console.error('Error loading friends:', error);
            toast({
                title: 'Error',
                description: 'Failed to load friends',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadPendingRequests = async (userId: string) => {
        try {
            // Get friend requests sent TO me
            const { data, error } = await supabase
                .from('friendships')
                .select(`
          *,
          requester_profile:profiles!friendships_user_id_fkey(
            id,
            username,
            full_name,
            current_streak_days,
            total_points
          )
        `)
                .eq('friend_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPendingRequests(data || []);
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    };

    const loadSentRequests = async (userId: string) => {
        try {
            // Get friend requests I sent
            const { data, error } = await supabase
                .from('friendships')
                .select(`
          *,
          friend_profile:profiles!friendships_friend_id_fkey(
            id,
            username,
            full_name,
            current_streak_days,
            total_points
          )
        `)
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSentRequests(data || []);
        } catch (error) {
            console.error('Error loading sent requests:', error);
        }
    };

    const sendFriendRequest = async () => {
        if (!searchEmail.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter an email address',
                variant: 'destructive'
            });
            return;
        }

        setSearching(true);
        try {
            // Find user by email
            const { data: userData, error: userError } = await supabase
                .from('profiles')
                .select('id, username, full_name')
                .eq('id', searchEmail) // Assuming email is used as ID or we need to add email field
                .single();

            if (userError || !userData) {
                toast({
                    title: 'User not found',
                    description: 'No user found with that email',
                    variant: 'destructive'
                });
                return;
            }

            if (userData.id === currentUserId) {
                toast({
                    title: 'Error',
                    description: 'You cannot add yourself as a friend',
                    variant: 'destructive'
                });
                return;
            }

            // Check if friendship already exists
            const { data: existingFriendship } = await supabase
                .from('friendships')
                .select('*')
                .or(`and(user_id.eq.${currentUserId},friend_id.eq.${userData.id}),and(user_id.eq.${userData.id},friend_id.eq.${currentUserId})`)
                .single();

            if (existingFriendship) {
                toast({
                    title: 'Already connected',
                    description: 'You are already friends or have a pending request',
                    variant: 'destructive'
                });
                return;
            }

            // Create friend request
            const { error: insertError } = await supabase
                .from('friendships')
                .insert({
                    user_id: currentUserId,
                    friend_id: userData.id,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            toast({
                title: 'Friend request sent!',
                description: `Request sent to ${userData.username || userData.full_name || 'user'}`
            });

            setSearchEmail('');
            loadSentRequests(currentUserId);
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast({
                title: 'Error',
                description: 'Failed to send friend request',
                variant: 'destructive'
            });
        } finally {
            setSearching(false);
        }
    };

    const acceptFriendRequest = async (requestId: string, friendId: string) => {
        try {
            // Update the request to accepted
            const { error: updateError } = await supabase
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            if (updateError) throw updateError;

            // Create reciprocal friendship
            const { error: insertError } = await supabase
                .from('friendships')
                .insert({
                    user_id: currentUserId,
                    friend_id: friendId,
                    status: 'accepted'
                });

            if (insertError) throw insertError;

            toast({
                title: 'Friend request accepted!',
                description: 'You are now friends'
            });

            loadFriends(currentUserId);
            loadPendingRequests(currentUserId);
        } catch (error) {
            console.error('Error accepting friend request:', error);
            toast({
                title: 'Error',
                description: 'Failed to accept friend request',
                variant: 'destructive'
            });
        }
    };

    const rejectFriendRequest = async (requestId: string) => {
        try {
            const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('id', requestId);

            if (error) throw error;

            toast({
                title: 'Request rejected',
                description: 'Friend request has been declined'
            });

            loadPendingRequests(currentUserId);
        } catch (error) {
            console.error('Error rejecting friend request:', error);
            toast({
                title: 'Error',
                description: 'Failed to reject friend request',
                variant: 'destructive'
            });
        }
    };

    const removeFriend = async (friendshipId: string, friendId: string) => {
        try {
            // Delete both friendships
            const { error: error1 } = await supabase
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

            const { error: error2 } = await supabase
                .from('friendships')
                .delete()
                .eq('user_id', friendId)
                .eq('friend_id', currentUserId);

            if (error1 || error2) throw error1 || error2;

            toast({
                title: 'Friend removed',
                description: 'You are no longer friends'
            });

            loadFriends(currentUserId);
        } catch (error) {
            console.error('Error removing friend:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove friend',
                variant: 'destructive'
            });
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading friends...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">👥 Friends</h1>
                <p className="text-muted-foreground">Connect with friends and track progress together</p>
            </div>

            {/* Add Friend */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Add Friend
                    </CardTitle>
                    <CardDescription>Send a friend request by user ID</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter user ID or email"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendFriendRequest()}
                        />
                        <Button onClick={sendFriendRequest} disabled={searching}>
                            {searching ? 'Searching...' : 'Send Request'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="friends" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="friends">
                        Friends ({friends.length})
                    </TabsTrigger>
                    <TabsTrigger value="requests">
                        Requests ({pendingRequests.length})
                    </TabsTrigger>
                    <TabsTrigger value="sent">
                        Sent ({sentRequests.length})
                    </TabsTrigger>
                </TabsList>

                {/* Friends List */}
                <TabsContent value="friends" className="space-y-4">
                    {friends.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Add friends to compare progress and stay motivated
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        friends.map((friendship) => (
                            <Card key={friendship.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-12 h-12">
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                {getInitials(friendship.friend_profile?.full_name || friendship.friend_profile?.username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {friendship.friend_profile?.full_name || friendship.friend_profile?.username || 'Unknown User'}
                                            </p>
                                            <div className="flex gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Flame className="w-4 h-4 text-orange-500" />
                                                    {friendship.friend_profile?.current_streak_days || 0} day streak
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Trophy className="w-4 h-4 text-amber-500" />
                                                    {friendship.friend_profile?.total_points || 0} points
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFriend(friendship.id, friendship.friend_id)}
                                    >
                                        Remove
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Pending Requests */}
                <TabsContent value="requests" className="space-y-4">
                    {pendingRequests.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <UserPlus className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
                                <p className="text-muted-foreground text-center">
                                    Friend requests will appear here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        pendingRequests.map((request) => (
                            <Card key={request.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-12 h-12">
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                {getInitials(request.requester_profile?.full_name || request.requester_profile?.username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {request.requester_profile?.full_name || request.requester_profile?.username || 'Unknown User'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Wants to be your friend
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => acceptFriendRequest(request.id, request.user_id)}
                                        >
                                            <Check className="w-4 h-4 mr-1" />
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => rejectFriendRequest(request.id)}
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Decline
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>

                {/* Sent Requests */}
                <TabsContent value="sent" className="space-y-4">
                    {sentRequests.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No sent requests</h3>
                                <p className="text-muted-foreground text-center">
                                    Requests you send will appear here
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        sentRequests.map((request) => (
                            <Card key={request.id}>
                                <CardContent className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="w-12 h-12">
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                {getInitials(request.friend_profile?.full_name || request.friend_profile?.username)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {request.friend_profile?.full_name || request.friend_profile?.username || 'Unknown User'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Request pending
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => rejectFriendRequest(request.id)}
                                    >
                                        Cancel
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
