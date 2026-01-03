import { Home, Camera, TrendingUp, Award, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const MobileNav = () => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/analyze', icon: Camera, label: 'Analyze' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/badges', icon: Award, label: 'Badges' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-strong z-50">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          const linkState = path === '/analyze' ? { from: 'mobileNav' } : {};
          return (
            <Link
              key={path}
              to={path}
              state={linkState}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 active:scale-95 touch-manipulation",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 mb-1 transition-transform",
                isActive && "scale-110"
              )} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
