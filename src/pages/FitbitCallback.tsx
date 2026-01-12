import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function FitbitCallback() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { toast } = useToast();
    const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
    const [message, setMessage] = useState('Connecting to Fitbit...');

    useEffect(() => {
        handleCallback();
    }, []);

    const handleCallback = async () => {
        try {
            const code = searchParams.get('code');
            const error = searchParams.get('error');

            if (error) {
                throw new Error(`Fitbit authorization failed: ${error}`);
            }

            if (!code) {
                throw new Error('No authorization code received');
            }

            setMessage('Exchanging authorization code...');

            // Call Edge Function to exchange code for tokens
            const { data, error: exchangeError } = await supabase.functions.invoke('fitbit-oauth', {
                body: { code, redirect_uri: `${window.location.origin}/fitbit/callback` }
            });

            if (exchangeError) throw exchangeError;

            if (!data || !data.success) {
                throw new Error(data?.error || 'Failed to connect Fitbit');
            }

            setMessage('Fetching your Fitbit data...');

            // Update profile to mark Fitbit as connected
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase
                    .from('profiles')
                    .update({
                        fitbit_connected: true,
                        use_dynamic_calories: true
                    })
                    .eq('id', user.id);
            }

            setMessage('Syncing initial data...');

            // Trigger initial sync
            await supabase.functions.invoke('fitbit-sync', {
                body: { user_id: user?.id }
            });

            setStatus('success');
            setMessage('Fitbit connected successfully!');

            toast({
                title: 'Fitbit Connected!',
                description: 'Your Fitbit data is now syncing. Dynamic calorie tracking is enabled.'
            });

            // Redirect to Fitbit page after 2 seconds
            setTimeout(() => {
                navigate('/fitbit');
            }, 2000);

        } catch (error: any) {
            console.error('Fitbit callback error:', error);
            setStatus('error');
            setMessage(error.message || 'Failed to connect Fitbit');

            toast({
                title: 'Connection Failed',
                description: error.message || 'Could not connect to Fitbit',
                variant: 'destructive'
            });

            // Redirect back to Fitbit page after 3 seconds
            setTimeout(() => {
                navigate('/fitbit');
            }, 3000);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-md w-full mx-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 text-center">
                    {status === 'processing' && (
                        <>
                            <Loader2 className="w-16 h-16 mx-auto mb-4 text-primary animate-spin" />
                            <h2 className="text-2xl font-bold mb-2">Connecting Fitbit</h2>
                            <p className="text-muted-foreground">{message}</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                            <h2 className="text-2xl font-bold mb-2 text-green-600">Success!</h2>
                            <p className="text-muted-foreground">{message}</p>
                            <p className="text-sm text-muted-foreground mt-2">Redirecting...</p>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                            <h2 className="text-2xl font-bold mb-2 text-red-600">Connection Failed</h2>
                            <p className="text-muted-foreground">{message}</p>
                            <p className="text-sm text-muted-foreground mt-2">Redirecting...</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
