import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import heroImage from '@/assets/hero-nutrition.jpg';
import logo from '@/assets/caloriewise-logo.png';
import { ArrowRight, Sparkles, TrendingUp, Award } from 'lucide-react';
export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profile?.onboarding_completed) {
        navigate('/dashboard');
      } else {
        navigate('/onboarding');
      }
    } else {
      // Not authenticated, stay on landing page
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-12 sm:py-20">
          <div className="text-center max-w-3xl mx-auto">
            <img 
              src={logo} 
              alt="CalorieWise" 
              className="w-28 sm:w-36 h-auto mx-auto mb-6 drop-shadow-xl"
            />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 sm:mb-6 bg-clip-text text-transparent bg-gradient-primary">
              Your AI Nutrition Companion
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed px-4">
              Snap, analyze, and track your meals with AI-powered precision. 
              Achieve your health goals with personalized nutrition insights.
            </p>
            <Button
              onClick={() => navigate('/auth')}
              size="lg"
              className="bg-gradient-cta text-white text-lg px-8 py-6 h-auto rounded-xl shadow-strong hover:shadow-glow transition-all duration-300"
            >
              Get Started
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-12 sm:py-16">
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="shadow-strong border-primary/20">
            <CardContent className="pt-6 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-bold mb-2">AI Analysis</h3>
              <p className="text-muted-foreground">
                Instant nutrition breakdown with Gemini AI technology
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-strong border-accent/20">
            <CardContent className="pt-6 text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="text-xl font-bold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your nutrition journey with detailed charts and insights
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-strong border-orange-600/20">
            <CardContent className="pt-6 text-center">
              <Award className="w-12 h-12 mx-auto mb-4 text-orange-600" />
              <h3 className="text-xl font-bold mb-2">Earn Rewards</h3>
              <p className="text-muted-foreground">
                Build streaks, unlock badges, and stay motivated
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card/50 backdrop-blur-sm mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 CalorieWise. Powered by AI nutrition analysis.
          </p>
        </div>
      </footer>
    </div>
  );
}