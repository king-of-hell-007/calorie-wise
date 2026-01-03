import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Target, Users, Calendar, CheckCircle2, Clock, Flame } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Challenge {
    id: string;
    name: string;
    description: string | null;
    challenge_type: 'streak' | 'calories' | 'protein' | 'steps' | 'water' | 'custom';
    target_value: number | null;
    start_date: string;
    end_date: string;
    created_by: string | null;
    is_public: boolean;
    badge_icon: string | null;
    points_reward: number;
    created_at: string;
    participation?: {
        id: string;
        current_progress: number;
        completed: boolean;
        completed_at: string | null;
    };
    participant_count?: number;
}

const challengeTypeIcons = {
    streak: Flame,
    calories: Target,
    protein: Trophy,
    steps: Target,
    water: Target,
    custom: Trophy
};

const challengeTypeLabels = {
    streak: 'Streak',
    calories: 'Calories',
    protein: 'Protein',
    steps: 'Steps',
    water: 'Water',
    custom: 'Custom'
};

export default function Challenges() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string>('');
    const [availableChallenges, setAvailableChallenges] = useState<Challenge[]>([]);
    const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
    const [completedChallenges, setCompletedChallenges] = useState<Challenge[]>([]);

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
        loadChallenges(user.id);
    };

    const loadChallenges = async (userId: string) => {
        setLoading(true);
        try {
            const today = new Date().toISOString().split('T')[0];

            // Get all public challenges
            const { data: allChallenges, error: challengesError } = await supabase
                .from('challenges')
                .select('*')
                .eq('is_public', true)
                .gte('end_date', today)
                .order('created_at', { ascending: false });

            if (challengesError) throw challengesError;

            // Get user's participations
            const { data: participations, error: participationsError } = await supabase
                .from('challenge_participants')
                .select('*')
                .eq('user_id', userId);

            if (participationsError) throw participationsError;

            // Get participant counts for each challenge
            const { data: participantCounts } = await supabase
                .from('challenge_participants')
                .select('challenge_id');

            const counts: { [key: string]: number } = {};
            participantCounts?.forEach(p => {
                counts[p.challenge_id] = (counts[p.challenge_id] || 0) + 1;
            });

            // Merge data
            const challengesWithParticipation = allChallenges?.map(challenge => {
                const participation = participations?.find(p => p.challenge_id === challenge.id);
                return {
                    ...challenge,
                    participation,
                    participant_count: counts[challenge.id] || 0
                };
            }) || [];

            // Separate into categories
            const available = challengesWithParticipation.filter(c => !c.participation);
            const active = challengesWithParticipation.filter(c => c.participation && !c.participation.completed);
            const completed = challengesWithParticipation.filter(c => c.participation?.completed);

            setAvailableChallenges(available);
            setActiveChallenges(active);
            setCompletedChallenges(completed);
        } catch (error) {
            console.error('Error loading challenges:', error);
            toast({
                title: 'Error',
                description: 'Failed to load challenges',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const joinChallenge = async (challengeId: string) => {
        try {
            const { error } = await supabase
                .from('challenge_participants')
                .insert({
                    challenge_id: challengeId,
                    user_id: currentUserId,
                    current_progress: 0,
                    completed: false
                });

            if (error) throw error;

            toast({
                title: 'Challenge joined!',
                description: 'Good luck! Track your progress in the Active tab'
            });

            loadChallenges(currentUserId);
        } catch (error) {
            console.error('Error joining challenge:', error);
            toast({
                title: 'Error',
                description: 'Failed to join challenge',
                variant: 'destructive'
            });
        }
    };

    const leaveChallenge = async (participationId: string) => {
        try {
            const { error } = await supabase
                .from('challenge_participants')
                .delete()
                .eq('id', participationId);

            if (error) throw error;

            toast({
                title: 'Left challenge',
                description: 'You have left the challenge'
            });

            loadChallenges(currentUserId);
        } catch (error) {
            console.error('Error leaving challenge:', error);
            toast({
                title: 'Error',
                description: 'Failed to leave challenge',
                variant: 'destructive'
            });
        }
    };

    const getDaysRemaining = (endDate: string) => {
        const end = new Date(endDate);
        const today = new Date();
        return differenceInDays(end, today);
    };

    const getProgressPercentage = (current: number, target: number) => {
        return Math.min(Math.round((current / target) * 100), 100);
    };

    const renderChallengeCard = (challenge: Challenge, showActions: boolean = true) => {
        const Icon = challengeTypeIcons[challenge.challenge_type];
        const daysRemaining = getDaysRemaining(challenge.end_date);
        const progress = challenge.participation
            ? getProgressPercentage(challenge.participation.current_progress, challenge.target_value || 100)
            : 0;

        return (
            <Card key={challenge.id} className={challenge.participation?.completed ? 'border-green-500' : ''}>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <Icon className="w-6 h-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <CardTitle className="text-lg">{challenge.name}</CardTitle>
                                <CardDescription>{challenge.description}</CardDescription>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <Badge variant="outline">
                                        {challengeTypeLabels[challenge.challenge_type]}
                                    </Badge>
                                    <Badge variant="outline">
                                        <Trophy className="w-3 h-3 mr-1" />
                                        {challenge.points_reward} points
                                    </Badge>
                                    <Badge variant="outline">
                                        <Users className="w-3 h-3 mr-1" />
                                        {challenge.participant_count} participants
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Progress for active challenges */}
                    {challenge.participation && !challenge.participation.completed && (
                        <div className="mb-4">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-semibold">
                                    {challenge.participation.current_progress} / {challenge.target_value}
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                        </div>
                    )}

                    {/* Completion badge */}
                    {challenge.participation?.completed && (
                        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <div>
                                <p className="font-semibold text-green-700 dark:text-green-400">Challenge Completed!</p>
                                <p className="text-xs text-green-600 dark:text-green-500">
                                    Completed on {format(new Date(challenge.participation.completed_at!), 'MMM dd, yyyy')}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Challenge details */}
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4 text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(challenge.start_date), 'MMM dd')} - {format(new Date(challenge.end_date), 'MMM dd')}
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {daysRemaining} days left
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                        <div className="mt-4">
                            {!challenge.participation ? (
                                <Button onClick={() => joinChallenge(challenge.id)} className="w-full">
                                    Join Challenge
                                </Button>
                            ) : !challenge.participation.completed ? (
                                <Button
                                    variant="outline"
                                    onClick={() => leaveChallenge(challenge.participation!.id)}
                                    className="w-full"
                                >
                                    Leave Challenge
                                </Button>
                            ) : null}
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading challenges...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 pb-20 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">🎯 Challenges</h1>
                <p className="text-muted-foreground">Join challenges and earn rewards</p>
            </div>

            <Tabs defaultValue="available" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="available">
                        Available ({availableChallenges.length})
                    </TabsTrigger>
                    <TabsTrigger value="active">
                        Active ({activeChallenges.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Completed ({completedChallenges.length})
                    </TabsTrigger>
                </TabsList>

                {/* Available Challenges */}
                <TabsContent value="available" className="space-y-4">
                    {availableChallenges.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Target className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No available challenges</h3>
                                <p className="text-muted-foreground text-center">
                                    Check back later for new challenges
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        availableChallenges.map(challenge => renderChallengeCard(challenge))
                    )}
                </TabsContent>

                {/* Active Challenges */}
                <TabsContent value="active" className="space-y-4">
                    {activeChallenges.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Trophy className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No active challenges</h3>
                                <p className="text-muted-foreground text-center mb-4">
                                    Join a challenge to get started
                                </p>
                                <Button onClick={() => document.querySelector('[value="available"]')?.dispatchEvent(new Event('click'))}>
                                    Browse Challenges
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        activeChallenges.map(challenge => renderChallengeCard(challenge))
                    )}
                </TabsContent>

                {/* Completed Challenges */}
                <TabsContent value="completed" className="space-y-4">
                    {completedChallenges.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <CheckCircle2 className="w-16 h-16 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No completed challenges</h3>
                                <p className="text-muted-foreground text-center">
                                    Complete challenges to earn rewards
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        completedChallenges.map(challenge => renderChallengeCard(challenge, false))
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
