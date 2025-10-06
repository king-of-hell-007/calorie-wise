import { useEffect, useState } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function AdminRoute() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('/login'); // Redirect unauthenticated users
          return;
        }

        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (roleError || !roleData) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to view this page.',
            variant: 'destructive',
          });
          navigate('/dashboard'); // Redirect non-admins
        } else {
          setIsAdmin(true);
        }
      } catch (error: any) {
        toast({
          title: 'Authentication Error',
          description: 'Could not verify your permissions. Please try again.',
          variant: 'destructive',
        });
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate, toast]);

  if (loading) {
    return <div className="min-h-screen bg-gradient-hero flex items-center justify-center text-primary text-xl">Verifying permissions...</div>;
  }

  return isAdmin ? <Outlet /> : null;
}