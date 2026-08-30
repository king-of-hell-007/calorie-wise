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
import { logger } from '@/lib/logger';
import { RateLimiter } from '@/lib/validation';

interface Friend {
    id: string;
    user_id: string;
    friend_id: string;
    status: 'pending' | 'accepted' | 'blocked';
    created_at: string;
    friend_profile?: {
        id: string;
        user_name: string | null;
        email: string | null;
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
        user_name: string | null;
        email: string | null;
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
            // Get accepted friendships - fetch friendship data first
            // Using 'as any' because friendships table exists but TypeScript types are stale
            const { data: friendshipData, error: friendshipError } = await (supabase as any)
                .from('friendships')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'accepted')
                .order('created_at', { ascending: false });

            if (friendshipError) throw friendshipError;

            // Now fetch friend profiles separately
            if (friendshipData && friendshipData.length > 0) {
                const friendIds = friendshipData.map((f: any) => f.friend_id);
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, user_name, email, current_streak_days, total_points, avatar_url')
                    .in('id', friendIds);

                if (profilesError) throw profilesError;

                // Combine the data
                const combinedData = friendshipData.map((friendship: any) => ({
                    ...friendship,
                    friend_profile: (profilesData as any)?.find((p: any) => p.id === friendship.friend_id) || null
                }));

                setFriends(combinedData);
            } else {
                setFriends([]);
            }
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
            // Using 'as any' because friendships table exists but TypeScript types are stale
            const { data: requestsData, error: requestsError } = await (supabase as any)
                .from('friendships')
                .select('*')
                .eq('friend_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (requestsError) throw requestsError;

            // Fetch requester profiles
            if (requestsData && requestsData.length > 0) {
                const requesterIds = requestsData.map((r: any) => r.user_id);
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, user_name, email, current_streak_days, total_points')
                    .in('id', requesterIds);

                if (profilesError) throw profilesError;

                const combinedData = requestsData.map((request: any) => ({
                    ...request,
                    requester_profile: (profilesData as any)?.find((p: any) => p.id === request.user_id) || null
                }));

                setPendingRequests(combinedData);
            } else {
                setPendingRequests([]);
            }
        } catch (error) {
            console.error('Error loading pending requests:', error);
        }
    };

    const loadSentRequests = async (userId: string) => {
        try {
            // Get friend requests I sent
            // Using 'as any' because friendships table exists but TypeScript types are stale
            const { data: sentData, error: sentError } = await (supabase as any)
                .from('friendships')
                .select('*')
                .eq('user_id', userId)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (sentError) throw sentError;

            // Fetch friend profiles
            if (sentData && sentData.length > 0) {
                const friendIds = sentData.map((s: any) => s.friend_id);
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, user_name, email, current_streak_days, total_points')
                    .in('id', friendIds);

                if (profilesError) throw profilesError;

                const combinedData = sentData.map((sent: any) => ({
                    ...sent,
                    friend_profile: (profilesData as any)?.find((p: any) => p.id === sent.friend_id) || null
                }));

                setSentRequests(combinedData);
            } else {
                setSentRequests([]);
            }
        } catch (error) {
            console.error('Error loading sent requests:', error);
        }
    };

    const sendFriendRequest = async () => {
        if (!searchEmail.trim()) {
            toast({
                title: 'Error',
                description: 'Please enter an email address or username',
                variant: 'destructive'
            });
            return;
        }

        setSearching(true);
        try {
            const searchTerm = searchEmail.trim().toLowerCase();
            let foundUserId: string | null = null;
            let foundUserName: string | null = null;

            // First, try to find by exact email match in profiles
            if (searchTerm.includes('@')) {
                console.log('[Friend Search] Searching by email:', searchTerm);

                const { data: profileByEmail, error: emailError } = await (supabase as any)
                    .from('profiles')
                    .select('id, user_name, email')
                    .ilike('email', searchTerm)
                    .maybeSingle();

                console.log('[Friend Search] Email search result:', profileByEmail, 'Error:', emailError);

                if (profileByEmail) {
                    foundUserId = profileByEmail.id;
                    foundUserName = profileByEmail.user_name || 'User';
                }
            }

            // If not found by email, try user_name
            if (!foundUserId) {
                console.log('[Friend Search] Searching by user_name:', searchTerm);

                const { data: profileByUsername, error: usernameError } = await (supabase as any)
                    .from('profiles')
                    .select('id, user_name, email')
                    .ilike('user_name', searchTerm)
                    .maybeSingle();

                console.log('[Friend Search] Username search result:', profileByUsername, 'Error:', usernameError);

                if (profileByUsername) {
                    foundUserId = profileByUsername.id;
                    foundUserName = profileByUsername.user_name || 'User';
                }
            }

            // If still not found and it's an email, check if any profile has this email
            if (!foundUserId && searchTerm.includes('@')) {
                console.log('[Friend Search] Email not found directly, trying broader search...');

                // Get all profiles and log them to see what's available
                const { data: allProfiles, error: allError } = await (supabase as any)
                    .from('profiles')
                    .select('id, user_name, email')
                    .limit(50);

                console.log('[Friend Search] All profiles:', allProfiles?.length, 'Error:', allError);
                if (allProfiles) {
                    console.log('[Friend Search] Profiles:', allProfiles.map((p: any) => ({ id: p.id.substring(0, 8), email: p.email, name: p.user_name })));

                    // Check if any profile has this email
                    const matchingProfile = allProfiles.find((p: any) =>
                        p.email?.toLowerCase() === searchTerm.toLowerCase()
                    );

                    if (matchingProfile) {
                        foundUserId = matchingProfile.id;
                        foundUserName = matchingProfile.user_name || 'User';
                        console.log('[Friend Search] Found matching profile:', foundUserId);
                    }
                }
            }

            // If still not found, try partial match on user_name
            if (!foundUserId) {
                console.log('[Friend Search] Trying user_name partial search:', searchTerm);

                const { data: profileByName, error: nameError } = await (supabase as any)
                    .from('profiles')
                    .select('id, user_name, email')
                    .ilike('user_name', `%${searchTerm}%`)
                    .limit(1)
                    .maybeSingle();

                console.log('[Friend Search] Name search result:', profileByName, 'Error:', nameError);

                if (profileByName) {
                    foundUserId = profileByName.id;
                    foundUserName = profileByName.user_name || 'User';
                }
            }

            console.log('[Friend Search] Final result - foundUserId:', foundUserId, 'foundUserName:', foundUserName);

            // If no user found, this could be an invite to a non-registered user
            if (!foundUserId) {
                // Check if it looks like an email (contains @)
                if (searchTerm.includes('@')) {
                    // This is an email invite for someone not on the platform yet
                    console.log('[Friend Search] User not found, sending invite...');
                    try {
                        const { error } = await supabase.functions.invoke('send-invite-email', {
                            body: { email: searchEmail }
                        });
                        if (error) throw error;

                        toast({
                            title: 'Invite sent!',
                            description: `An invitation has been sent to ${searchEmail}. You'll get 50 bonus points when they join!`
                        });
                    } catch (e) {
                        console.error('Failed to send email:', e);
                        toast({
                            title: 'Error',
                            description: 'Failed to send invite email.',
                            variant: 'destructive'
                        });
                    }

                    setSearchEmail('');
                    return;
                } else {
                    toast({
                        title: 'User not found',
                        description: 'No user found with that username. Try their exact username or email address.',
                        variant: 'destructive'
                    });
                    return;
                }
            }

            // Check if trying to add self
            if (foundUserId === currentUserId) {
                toast({
                    title: 'Error',
                    description: 'You cannot add yourself as a friend',
                    variant: 'destructive'
                });
                return;
            }

            // Check if friendship already exists (using safe parameterized queries)
            const { data: existingFriendships } = await (supabase as any)
                .from('friendships')
                .select('*')
                .in('user_id', [currentUserId, foundUserId])
                .in('friend_id', [currentUserId, foundUserId]);

            // Check if any friendship exists between these users
            const existingFriendship = existingFriendships?.find((f: any) =>
                (f.user_id === currentUserId && f.friend_id === foundUserId) ||
                (f.user_id === foundUserId && f.friend_id === currentUserId)
            );

            if (existingFriendship) {
                toast({
                    title: 'Already connected',
                    description: 'You are already friends or have a pending request',
                    variant: 'destructive'
                });
                return;
            }

            // Create friend request
            const { error: insertError } = await (supabase as any)
                .from('friendships')
                .insert({
                    user_id: currentUserId,
                    friend_id: foundUserId,
                    status: 'pending'
                });

            if (insertError) throw insertError;

            toast({
                title: 'Friend request sent!',
                description: `Request sent to ${foundUserName || 'user'}`
            });

            setSearchEmail('');
            loadSentRequests(currentUserId);
        } catch (error) {
            console.error('Error sending friend request:', error);
            toast({
                title: 'Error',
                description: 'Failed to send friend request. Please try again.',
                variant: 'destructive'
            });
        } finally {
            setSearching(false);
        }
    };

    const acceptFriendRequest = async (requestId: string, friendId: string) => {
        try {
            // Update the request to accepted
            const { error: updateError } = await (supabase as any)
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('id', requestId);

            if (updateError) throw updateError;

            // Create reciprocal friendship
            const { error: insertError } = await (supabase as any)
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
            const { error } = await (supabase as any)
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
            const { error: error1 } = await (supabase as any)
                .from('friendships')
                .delete()
                .eq('id', friendshipId);

            const { error: error2 } = await (supabase as any)
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

            {/* Add Friend / Invite */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Add Friend or Invite
                    </CardTitle>
                    <CardDescription>Send friend request or invite someone to join CalorieWise</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter email address"
                            value={searchEmail}
                            onChange={(e) => setSearchEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendFriendRequest()}
                        />
                        <Button onClick={sendFriendRequest} disabled={searching}>
                            {searching ? 'Searching...' : 'Add/Invite'}
                        </Button>
                    </div>

                    <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                        <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">How it works:</p>
                        <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">
                            <li>• If email is registered → Sends friend request</li>
                            <li>• If email not registered → Sends invite link</li>
                            <li>• Get 50 bonus points for each friend who joins!</li>
                        </ul>
                    </div>

                    {/* Referral Stats */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-2xl font-bold text-primary">0</p>
                            <p className="text-xs text-muted-foreground">Friends Invited</p>
                        </div>
                        <div className="p-3 bg-muted rounded-lg text-center">
                            <p className="text-2xl font-bold text-accent">0</p>
                            <p className="text-xs text-muted-foreground">Bonus Points Earned</p>
                        </div>
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
                                                {getInitials(friendship.friend_profile?.user_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {friendship.friend_profile?.user_name || friendship.friend_profile?.email || 'Unknown User'}
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
                                                {getInitials(request.requester_profile?.user_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {request.requester_profile?.user_name || request.requester_profile?.email || 'Unknown User'}
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
                                                {getInitials(request.friend_profile?.user_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">
                                                {request.friend_profile?.user_name || request.friend_profile?.email || 'Unknown User'}
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
