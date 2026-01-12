import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { WifiOff, Wifi } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineIndicator() {
    const { isOnline, wasOffline } = useOnlineStatus();
    const [showReconnected, setShowReconnected] = useState(false);

    useEffect(() => {
        if (isOnline && wasOffline) {
            setShowReconnected(true);
            const timer = setTimeout(() => setShowReconnected(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [isOnline, wasOffline]);

    if (isOnline && !showReconnected) return null;

    return (
        <div
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isOnline
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-600 text-white'
                }`}
        >
            <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2 text-sm font-medium">
                {isOnline ? (
                    <>
                        <Wifi className="w-4 h-4" />
                        <span>Back online! Your data has been synced.</span>
                    </>
                ) : (
                    <>
                        <WifiOff className="w-4 h-4" />
                        <span>You're offline. Some features may be limited.</span>
                    </>
                )}
            </div>
        </div>
    );
}
