import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export const Layout = ({ children, title }: LayoutProps) => {
  const location = useLocation();
  let pageTitle = title;

  if (location.pathname === '/analyze') {
    if (location.state?.from === 'dashboard') {
      pageTitle = 'Log Meal';
    } else {
      pageTitle = 'Analyze Meal';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-hero pb-24 pt-20">
      <Header />
      <div className="p-4 space-y-4 max-w-screen-xl mx-auto">
        {pageTitle && <h1 className="text-2xl font-bold text-foreground mt-4 mb-2">{pageTitle}</h1>}
        {children}
      </div>
      <MobileNav />
    </div>
  );
};