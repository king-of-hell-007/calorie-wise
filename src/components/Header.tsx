import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import logo from '@/assets/caloriewise-logo.png';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { User, LogOut } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('user_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          setUserName(profile.user_name);
        }
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error signing out',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-primary text-white p-4 shadow-strong flex items-center justify-between">
      <div className="flex items-center gap-3">
        <img src={logo} alt="CalorieWise Logo" className="h-10 w-auto" />
        <h1 className="text-2xl font-bold">CalorieWise</h1>
      </div>
      {userName && (
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 cursor-pointer">
            <User className="h-6 w-6" />
            <span className="font-semibold">{userName}</span>        
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};